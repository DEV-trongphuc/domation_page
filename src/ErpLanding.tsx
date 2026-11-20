import React, { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowRight,
  BellRing,
  Bot,
  Building2,
  Camera,
  CheckCircle2,
  Clock,
  CreditCard,
  Database,
  ExternalLink,
  FileSpreadsheet,
  Globe,
  Layers,
  Maximize2,
  MapPin,
  MessageSquare,
  PhoneCall,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Users,
  X,
  Zap,
} from 'lucide-react';
import { Navbar } from './Navbar';
import { ContactModal } from './ContactModal';
import { LuxuryGoldBackdrop } from './LuxuryGoldBackdrop';
import { PartnersTrustSection } from './components/PartnersTrustSection';
import { DomationFooter } from './components/DomationFooter';
import { DECOR_PNGS } from './data/enterpriseData';
import { getErpSeoConfig } from './data/coreRouteSeo';
import { usePageSeo } from './utils/seo';
import { DomResponsiveSubtabs } from './components/dom-meta/DomMetaSelect';

/* ───────────────────────────── Data ───────────────────────────── */

/** Anything the lightbox can display (live screens + legacy product photos). */
interface LightboxItem {
  src: string;
  title: string;
  tag: string;
  description: string;
}

type CatKey = 'ops' | 'crm' | 'hr' | 'finance' | 'system';

interface ShotItem extends LightboxItem {
  id: string;
  route: string;
  category: CatKey;
  highlight: string;
}

const SHOT_CATS: { id: CatKey | 'all'; label: string; icon: React.ElementType }[] = [
  { id: 'all', label: 'Tất cả', icon: Layers },
  { id: 'ops', label: 'Vận hành & Data', icon: Database },
  { id: 'crm', label: 'CRM & Khách hàng', icon: Users },
  { id: 'hr', label: 'Nhân sự', icon: Clock },
  { id: 'finance', label: 'Tài chính & Quy trình', icon: CreditCard },
  { id: 'system', label: 'Cộng đồng & Hệ thống', icon: Globe },
];

/** Live captures of DOM ERP (sidebar collapsed, demo tenant EcoLife) — see DOMATION_ERP_FULL/scripts/capture-erp-screens.cjs */
const ERP_SHOTS: ShotItem[] = [
  {
    id: 'dashboard-lead',
    src: '/imgs/erp-screens/dashboard-lead.webp',
    route: '/',
    category: 'ops',
    tag: 'Executive Dashboard',
    title: 'Tổng quan Phân bổ Data',
    highlight: 'Số liệu thời gian thực',
    description:
      'Tổng data tiếp nhận, tỷ lệ chia thành công, tỷ lệ xử lý đúng SLA cùng biểu đồ hiệu suất theo ngày và lịch sử giao data gần đây.',
  },
  {
    id: 'data-log',
    src: '/imgs/erp-screens/data-log.webp',
    route: '/data',
    category: 'ops',
    tag: 'Data Log',
    title: 'Nhật ký & Quản lý Data',
    highlight: 'Che SĐT • Biết data về đâu',
    description:
      'Mỗi lead được ghi nhận kèm trạng thái chia, sale phụ trách, vòng chia và thời điểm nhận; số điện thoại được che một phần.',
  },
  {
    id: 'fair-share',
    src: '/imgs/erp-screens/fair-share.webp',
    route: '/fair-share',
    category: 'ops',
    tag: 'Fairness Audit',
    title: 'Đối soát Công bằng Phân phối',
    highlight: 'Chỉ số công bằng • Độ lệch chuẩn',
    description:
      'Chỉ số công bằng, độ lệch chuẩn và số lead trung bình trên mỗi sale; biểu đồ cân bằng phân bổ theo nguồn và chất lượng lead.',
  },
  {
    id: 'rounds',
    src: '/imgs/erp-screens/rounds.webp',
    route: '/rounds',
    category: 'ops',
    tag: 'Round-Robin',
    title: 'Vòng Phân Bổ theo Dự án',
    highlight: 'Nhiều vòng chia độc lập',
    description:
      'Cấu hình nhiều vòng chia độc lập theo dự án: thành viên tham gia, tổng data đã chia và sale đang tới lượt.',
  },
  {
    id: 'deals',
    src: '/imgs/erp-screens/deals.webp',
    route: '/deals',
    category: 'crm',
    tag: 'Pipeline',
    title: 'Pipeline Khách hàng dạng Kanban',
    highlight: 'Kéo thả theo giai đoạn',
    description:
      'Khách hàng nằm trên bảng Kanban theo từng giai đoạn bán hàng do doanh nghiệp tự định nghĩa, kèm sản phẩm quan tâm và sale phụ trách.',
  },
  {
    id: 'contacts',
    src: '/imgs/erp-screens/contacts.webp',
    route: '/contacts',
    category: 'crm',
    tag: 'Contact 360',
    title: 'Danh sách Tiềm năng',
    highlight: 'Lọc theo trạng thái & nhật ký',
    description:
      'Toàn bộ liên hệ trên một bảng: lọc theo giai đoạn, xem nhật ký tương tác gần nhất và sale đang chăm sóc.',
  },
  {
    id: 'students',
    src: '/imgs/erp-screens/students.webp',
    route: '/students',
    category: 'crm',
    tag: 'Won Customers',
    title: 'Khách hàng đã chốt',
    highlight: 'Từ lead đến hợp đồng',
    description:
      'Khách hàng đã chốt với mã khách hàng, sản phẩm/dịch vụ, trạng thái sử dụng và sale phụ trách.',
  },
  {
    id: 'companies',
    src: '/imgs/erp-screens/companies.webp',
    route: '/companies',
    category: 'crm',
    tag: 'B2B Partners',
    title: 'Đối tác & Khách hàng doanh nghiệp',
    highlight: 'Phân hạng đối tác',
    description:
      'Hồ sơ đối tác B2B với phân hạng (standard, silver, gold, enterprise), thông tin liên hệ và lọc theo nhóm đối tác.',
  },
  {
    id: 'attendance',
    src: '/imgs/erp-screens/attendance.webp',
    route: '/attendance',
    category: 'hr',
    tag: 'Attendance',
    title: 'Quản lý Chấm công theo Tháng',
    highlight: 'Lịch công toàn đội',
    description:
      'Lịch chấm công tổng hợp theo tháng: ai có mặt từng ngày, đi muộn, đơn xin phép, kèm đối soát và xuất bảng công.',
  },
  {
    id: 'attendance-detail',
    src: '/imgs/erp-screens/attendance-detail.webp',
    route: '/attendance',
    category: 'hr',
    tag: 'Attendance Log',
    title: 'Chi tiết Chấm công theo Ngày',
    highlight: 'Giờ vào/ra • Vị trí check-in',
    description:
      'Nhật ký chấm công từng ngày: giờ vào/ra ca của mỗi nhân sự kèm liên kết xem vị trí check-in; có thêm tab bảng công, đơn & biến động và trực đêm.',
  },
  {
    id: 'consultants',
    src: '/imgs/erp-screens/consultants.webp',
    route: '/consultants',
    category: 'hr',
    tag: 'Company Staff',
    title: 'Nhân sự Công ty',
    highlight: 'Zalo Bot • Telegram Bot',
    description:
      'Danh sách nhân sự kèm kênh nhận thông báo Zalo Bot, Telegram Bot và lần truy cập gần nhất của từng người.',
  },
  {
    id: 'approvals',
    src: '/imgs/erp-screens/approvals.webp',
    route: '/approvals',
    category: 'finance',
    tag: 'Approval Flow',
    title: 'Quy trình & Phê duyệt đa cấp',
    highlight: 'Duyệt / Từ chối tại chỗ',
    description:
      'Mọi đề xuất (nghỉ phép, chi phí, đề xuất vận hành) đi qua các bước duyệt rõ ràng, thấy ngay người tạo, người duyệt và thời gian.',
  },
  {
    id: 'expenses',
    src: '/imgs/erp-screens/expenses.webp',
    route: '/expenses',
    category: 'finance',
    tag: 'Purchase Order',
    title: 'Chi phí Vận hành (PO)',
    highlight: 'Minh bạch từng khoản chi',
    description:
      'Đề xuất chi và hóa đơn với số tiền, phân loại, trạng thái thanh toán và chuỗi người duyệt liên quan.',
  },
  {
    id: 'feed',
    src: '/imgs/erp-screens/feed.webp',
    route: '/feed',
    category: 'system',
    tag: 'Company Feed',
    title: 'Bảng tin Doanh nghiệp',
    highlight: 'Vinh danh & gắn kết',
    description:
      'Mạng xã hội nội bộ: đăng bài, bình luận và vinh danh nhân sự xuất sắc ngay trong hệ thống vận hành.',
  },
  {
    id: 'marketing',
    src: '/imgs/erp-screens/marketing.webp',
    route: '/marketing',
    category: 'system',
    tag: 'Marketing Hub',
    title: 'Marketing & Đa kênh',
    highlight: 'Automation • Zalo • Meta',
    description:
      'Trung tâm marketing: chiến dịch, automation, mẫu email, AI, voucher, khảo sát, Zalo OA, Meta Messenger, web tracking và Meta CAPI.',
  },
  {
    id: 'settings',
    src: '/imgs/erp-screens/settings.webp',
    route: '/settings',
    category: 'system',
    tag: 'System Rules',
    title: 'Cài đặt Nghiệp vụ & Hạn mức',
    highlight: 'Không hardcode',
    description:
      'Tùy biến mốc thời gian, hạn mức nhận lead, quy tắc cọc và phân quyền ngay trên giao diện — không cần sửa code.',
  },
];

const getShot = (id: string): ShotItem => ERP_SHOTS.find((s) => s.id === id) as ShotItem;

/** Illustrative multi-channel notification flow (NOT a screenshot — labelled "Minh họa"). */
const NOTIFY_SAMPLES = [
  { ch: 'Zalo Bot', dot: 'bg-[#0068FF]', time: 'Vừa xong', title: 'Lead mới vừa được chia cho bạn', body: 'Phản hồi trong SLA 2 phút để giữ lead còn nóng.' },
  { ch: 'Telegram Bot', dot: 'bg-sky-500', time: 'Đếm ngược', title: 'Cảnh báo hạn bảo mật Databank', body: 'Data sắp được thu hồi về kho chung nếu chưa tương tác đúng hạn.' },
  { ch: 'Email SMTP', dot: 'bg-slate-700', time: 'Hôm nay', title: 'Lời mời hợp tác Co-care', body: 'Phiếu chia hoa hồng đang chờ bạn xác nhận.' },
  { ch: 'Zalo Bot', dot: 'bg-[#0068FF]', time: 'Hôm nay', title: 'Bạn được đồng nghiệp @mention', body: 'Mở hệ thống để xem và phản hồi ngay.' },
];

const ENTERPRISE_MODULES = [
  {
    num: '01',
    title: 'Tiếp Nhận Lead Một Cửa & Chống Trùng',
    desc: 'Mọi nguồn (Meta, Google, Hotline, Giới thiệu) đổ về 1 điểm. Tách biệt Lead và Person để nhận diện trùng lặp 180 ngày qua SĐT. Dữ liệu lead nguồn bất biến.',
    icon: Layers,
    color: 'from-[#1E40FF] to-[#3B82F6]',
    badgeCls: 'text-[#1E40FF]/35 group-hover:text-[#1E40FF]',
    hoverBg: 'hover:bg-blue-50/55',
  },
  {
    num: '02',
    title: 'Thuật Toán Chia Lead 5 Cổng & Van Chống Ôm',
    desc: 'Phân phối lead tới cá nhân Sales qua 5 rào chắn: Roster dự án, Check-in selfie, Vacation Mode, Van chống ôm (Backpressure) và Hạn mức giờ/ngày/tháng.',
    icon: Zap,
    color: 'from-cyan-500 to-sky-600',
    badgeCls: 'text-cyan-600/35 group-hover:text-cyan-600',
    hoverBg: 'hover:bg-cyan-50/55',
  },
  {
    num: '03',
    title: 'Chăm Sóc, Ma Trận Nhiệt Độ & Form Rào Cản TTL1',
    desc: 'Phân loại nhiệt độ (Nóng, Ấm, Lạnh). Tự động hạ nhiệt (Decay) sau 5 ngày không tương tác. Bắt buộc hoàn thiện form TTL1 trước khi lên lịch gặp khách.',
    icon: TrendingUp,
    color: 'from-amber-500 to-orange-500',
    badgeCls: 'text-amber-500/35 group-hover:text-amber-600',
    hoverBg: 'hover:bg-amber-50/50',
  },
  {
    num: '04',
    title: 'Hợp Tác Số & Phân Chia Hoa Hồng 100%',
    desc: 'Tự động sinh Phiếu Hợp Tác khi phát sinh cọc. Ghi nhận toàn bộ thành viên hỗ trợ, kiểm tra tổng hoa hồng 100%, ký số xác nhận và Ban Giám Đốc phê duyệt.',
    icon: Users,
    color: 'from-violet-500 to-purple-600',
    badgeCls: 'text-violet-500/35 group-hover:text-violet-600',
    hoverBg: 'hover:bg-violet-50/50',
  },
  {
    num: '05',
    title: 'Kho Databank & Đồng Hồ Bảo Mật Lead',
    desc: 'Đồng hồ bảo mật tái khai thác: Lead chưa tương tác tự động trả về kho chung (3h - 1 ngày - 4 ngày). Hỗ trợ chia song song 2 Sales để giải cứu khách.',
    icon: Clock,
    color: 'from-indigo-500 to-blue-600',
    badgeCls: 'text-indigo-500/35 group-hover:text-indigo-600',
    hoverBg: 'hover:bg-indigo-50/50',
  },
  {
    num: '06',
    title: 'Quản Lý Dự Án & Giỏ Hàng Thời Gian Thực',
    desc: 'Dự án là thực thể rễ gắn kết tài liệu dự án, bảng giá, chính sách bán hàng, chiến dịch Ads UTM và Roster nhân sự. Kiểm soát phân quyền mở tài liệu.',
    icon: Building2,
    color: 'from-emerald-500 to-teal-600',
    badgeCls: 'text-emerald-500/35 group-hover:text-emerald-600',
    hoverBg: 'hover:bg-emerald-50/50',
  },
  {
    num: '07',
    title: 'Quản Trị Nhân Sự HRM & Chấm Công GPS AI',
    desc: 'Chấm công định vị tọa độ vệ tinh GPS văn phòng, chụp ảnh Selfie AI nhận diện vào ca. Quản lý ngày công, đi muộn, tăng ca OT và duyệt đơn phép đa cấp.',
    icon: MapPin,
    color: 'from-sky-500 to-indigo-600',
    badgeCls: 'text-sky-500/35 group-hover:text-sky-600',
    hoverBg: 'hover:bg-sky-50/50',
  },
  {
    num: '08',
    title: 'Bảng Tính Lương Tự Động & Xuất Phiếu PDF',
    desc: 'Thuật toán tính lương phức hợp: Lương ngày công, phụ cấp, thưởng chuyên cần, KPI, khấu trừ BHXH, thuế TNCN lũy tiến và xuất phiếu lương PDF điện tử.',
    icon: FileSpreadsheet,
    color: 'from-teal-500 to-cyan-600',
    badgeCls: 'text-teal-500/35 group-hover:text-teal-600',
    hoverBg: 'hover:bg-teal-50/50',
  },
  {
    num: '09',
    title: 'Dòng Tiền, Cọc & Phí Môi Giới',
    desc: 'Theo dõi phiếu cọc, tiến độ thanh toán từng đợt (UNC kế toán duyệt). Quản lý Purchase Order, chi phí vận hành doanh nghiệp và dự báo dòng tiền.',
    icon: CreditCard,
    color: 'from-green-500 to-emerald-600',
    badgeCls: 'text-green-500/35 group-hover:text-green-600',
    hoverBg: 'hover:bg-emerald-50/50',
  },
  {
    num: '10',
    title: 'Dữ Liệu Ngược Meta CAPI (Forward-Only)',
    desc: 'Bắn tín hiệu chuyển đổi CAPI trực tiếp về Meta Pixel (Lead -> Schedule -> Purchase). Forward-only không bắn lùi sự kiện, tự động join chi phí Ads tính ROAS.',
    icon: Bot,
    color: 'from-fuchsia-500 to-violet-600',
    badgeCls: 'text-fuchsia-500/35 group-hover:text-fuchsia-600',
    hoverBg: 'hover:bg-fuchsia-50/45',
  },
  {
    num: '11',
    title: 'Bảo Mật Row-Level Security (RLS) & Audit Log',
    desc: 'Phân quyền sâu đến từng dòng dữ liệu: Sales chỉ thấy khách của mình, Quản lý xem toàn team, Ban Giám Đốc giám sát toàn diện. Audit log bất biến.',
    icon: ShieldCheck,
    color: 'from-slate-700 to-[#1E40FF]',
    badgeCls: 'text-slate-400/50 group-hover:text-[#1E40FF]',
    hoverBg: 'hover:bg-slate-50/90',
  },
  {
    num: '12',
    title: 'Hệ Thống Thông Báo Đa Kênh Chuyên Sâu',
    desc: 'Ma trận thông báo thời gian thực: Kết nối Zalo Bot, Telegram Bot, Email SMTP. Tự động thông báo khi chia Lead, đếm ngược hạn bảo mật Databank, Co-care hoa hồng và @mention.',
    icon: BellRing,
    color: 'from-orange-500 to-amber-500',
    badgeCls: 'text-orange-500/35 group-hover:text-orange-600',
    hoverBg: 'hover:bg-orange-50/50',
  },
];

const KPIS = [
  {
    val: '12+',
    title: 'Phân Hệ Cốt Lõi',
    sub: 'Chuẩn hóa quy trình Enterprise',
    icon: Layers,
    iconBg: 'from-[#1E40FF] to-[#3B82F6]',
    valColor: 'text-[#1E40FF]',
  },
  {
    val: '5 Cổng',
    title: 'Auto-Routing Lead',
    sub: 'Chia công bằng, loại bỏ cảm tính',
    icon: Zap,
    iconBg: 'from-cyan-500 to-[#0284C7]',
    valColor: 'text-[#0284C7]',
  },
  {
    val: 'GPS & AI',
    title: 'Selfie Chấm Công',
    sub: 'Định vị thực, chống gian lận ca',
    icon: MapPin,
    iconBg: 'from-emerald-500 to-teal-600',
    valColor: 'text-emerald-600',
  },
  {
    val: '100% RLS',
    title: 'Bảo Mật Dữ Liệu',
    sub: 'Phân quyền đa tầng cấp Database',
    icon: ShieldCheck,
    iconBg: 'from-indigo-500 to-[#1E40FF]',
    valColor: 'text-indigo-600',
  },
];

const COMPARISON_ROWS: [string, string, string][] = [
  ['Phân phối Lead', 'Chia thủ công bằng tay, dễ thiên vị, ôm số, chậm trễ', 'Tự động 100% qua 5 cổng kiểm duyệt, SLA 2 phút'],
  ['Chấm công nhân sự', 'Vân tay tại văn phòng, dễ quên quẹt hoặc can thiệp file', 'GPS vệ tinh + Selfie AI xác thực theo thời gian thực'],
  ['Tính lương & hoa hồng', 'Mất hàng tuần nhập liệu Excel, dễ nhầm công thức thuế', 'Tính tự động theo ngày công & UNC cọc, xuất PDF 1 chạm'],
  ['Thông báo vận hành', 'Tra cứu thủ công, trễ nải thông tin, dễ bỏ sót khách nóng', 'Zalo Bot, Telegram Bot & Email SMTP thông báo tức thì theo SLA'],
  ['Kho dữ liệu lead', 'Lead cũ bị bỏ quên, thất thoát tài nguyên quảng cáo', 'Kho Databank đồng hồ bảo mật, tái khai thác song song'],
  ['Bảo mật dữ liệu', 'Dễ lộ số điện thoại, nhân viên nghỉ việc mang theo data', 'Row-Level Security (RLS), ẩn số điện thoại, Audit Log'],
  ['Tối ưu Marketing', 'Không đo được lead nào ra deal, lãng phí ngân sách Ads', 'Bắn Meta CAPI forward-only, tính chính xác CAC/ROAS'],
];

/* ─────────────────────────── Small parts ─────────────────────────── */

/** Browser-style frame used for every product screenshot (same glass language as /data). */
const BrowserFrame: React.FC<{
  src: string;
  alt: string;
  route?: string;
  eager?: boolean;
  onZoom?: () => void;
}> = ({ src, alt, route = '/', eager = false, onZoom }) => (
  <div className="rounded-2xl sm:rounded-[24px] bg-white/90 border border-slate-200/80 shadow-[0_24px_64px_-24px_rgba(15,23,42,0.2)] overflow-hidden">
    <div className="flex items-center gap-3 px-4 py-2.5 border-b border-slate-200/80 bg-slate-50/90">
      <div className="flex gap-1.5 shrink-0" aria-hidden="true">
        <span className="w-2.5 h-2.5 rounded-full bg-rose-400" />
        <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
        <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
      </div>
      <div className="flex-1 min-w-0 max-w-sm mx-auto text-[11px] font-medium text-slate-500 bg-white border border-slate-200/80 rounded-full px-3 py-1 truncate text-center">
        erp.domation.net{route === '/' ? '' : route}
      </div>
      <span className="w-10 shrink-0 hidden sm:block" />
    </div>
    <button
      type="button"
      onClick={onZoom}
      aria-label={`Phóng to: ${alt}`}
      className="group relative block w-full cursor-zoom-in bg-slate-100"
    >
      <img
        src={src}
        alt={alt}
        width={2880}
        height={1800}
        loading={eager ? 'eager' : 'lazy'}
        decoding="async"
        className="w-full h-auto aspect-[8/5] object-cover object-top"
      />
      <span className="absolute right-3 bottom-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/95 border border-slate-200 text-[11px] font-bold text-slate-800 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity">
        <Maximize2 className="w-3.5 h-3.5 text-[#1E40FF]" /> Bấm để phóng to
      </span>
    </button>
  </div>
);

const SectionHead: React.FC<{
  eyebrow: string;
  icon?: React.ElementType;
  children: React.ReactNode;
  aside?: string;
}> = ({ eyebrow, icon: Icon = Sparkles, children, aside }) => (
  <div className="flex flex-col md:flex-row md:items-end justify-between gap-3 sm:gap-4 mb-6 sm:mb-12 text-center md:text-left">
    <div className="max-w-2xl mx-auto md:mx-0">
      <div className="ql-eyebrow mb-2.5 sm:mb-3 mx-auto md:mx-0">
        <Icon className="w-3.5 h-3.5 text-[#1E40FF] shrink-0" />
        <span>{eyebrow}</span>
      </div>
      <h2 className="text-xl sm:text-3xl font-bold text-slate-900 leading-[1.25] tracking-tight">{children}</h2>
    </div>
    {aside && (
      <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto md:mx-0 leading-relaxed">{aside}</p>
    )}
  </div>
);

const CheckList: React.FC<{ items: { title: string; desc: string }[]; iconClass: string }> = ({ items, iconClass }) => (
  <div className="space-y-3">
    {items.map((item) => (
      <div
        key={item.title}
        className="p-3.5 rounded-xl bg-white/90 border border-slate-200/85 shadow-sm flex items-start gap-3"
      >
        <CheckCircle2 className={`w-4 h-4 shrink-0 mt-0.5 ${iconClass}`} />
        <div className="text-xs text-slate-700 leading-relaxed">
          <strong className="text-slate-900">{item.title}</strong> {item.desc}
        </div>
      </div>
    ))}
  </div>
);

/** Product screenshot + caption row (browser frame, zoomable). */
const ShotFigure: React.FC<{ shot: ShotItem; caption: string; onZoom: () => void }> = ({ shot, caption, onZoom }) => (
  <div>
    <BrowserFrame src={shot.src} alt={`DOM ERP — ${shot.title}`} route={shot.route} onZoom={onZoom} />
    <p className="mt-3 px-1 text-xs font-semibold text-slate-600 flex items-center gap-2">
      <Maximize2 className="w-3.5 h-3.5 text-[#1E40FF] shrink-0" /> {caption}
    </p>
  </div>
);

const NotifyIllustration: React.FC = () => (
  <div className="relative rounded-[28px] bg-white/80 backdrop-blur-xl border border-slate-200/80 shadow-[0_24px_64px_-24px_rgba(6,182,212,0.28)] p-4 sm:p-6">
    <div className="flex items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-200/70">
      <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-800">
        <BellRing className="w-4 h-4 text-[#0284C7]" /> Luồng thông báo đa kênh
      </div>
      <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
        Minh họa
      </span>
    </div>
    <div className="space-y-3">
      {NOTIFY_SAMPLES.map((n, i) => (
        <motion.div
          key={n.title}
          initial={{ opacity: 0, x: 24 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ delay: i * 0.1, duration: 0.45 }}
          className="flex items-start gap-3 p-3.5 rounded-2xl bg-white border border-slate-200/85 shadow-sm"
        >
          <span className={`mt-0.5 w-9 h-9 rounded-xl ${n.dot} text-white text-[11px] font-black flex items-center justify-center shrink-0`}>
            {n.ch.charAt(0)}
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">{n.ch}</span>
              <span className="text-[10px] font-semibold text-slate-400 whitespace-nowrap">{n.time}</span>
            </div>
            <div className="text-sm font-bold text-slate-900 leading-snug mt-0.5">{n.title}</div>
            <div className="text-xs text-slate-600 leading-relaxed mt-0.5">{n.body}</div>
          </div>
        </motion.div>
      ))}
    </div>
    <p className="mt-4 text-[11px] text-slate-500 leading-relaxed">
      Minh họa các tình huống thông báo mà hệ thống có thể gửi; nội dung thực tế tùy cấu hình của từng doanh nghiệp.
    </p>
  </div>
);

/* ───────────────────────────── Page ───────────────────────────── */

export const ErpLanding: React.FC = () => {
  usePageSeo(getErpSeoConfig());
  const [activeCat, setActiveCat] = useState<CatKey | 'all'>('all');
  const [activeId, setActiveId] = useState<string>(ERP_SHOTS[0].id);
  const [lightbox, setLightbox] = useState<LightboxItem | null>(null);
  const [showContactModal, setShowContactModal] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Warm the cache for every screen once the browser is idle so tab switches feel instant.
  useEffect(() => {
    const warm = () => ERP_SHOTS.forEach((s) => { const i = new Image(); i.src = s.src; });
    const w = window as Window & { requestIdleCallback?: (cb: () => void) => number };
    if (typeof w.requestIdleCallback === 'function') w.requestIdleCallback(warm);
    else window.setTimeout(warm, 1800);
  }, []);

  const visibleShots = useMemo(
    () => (activeCat === 'all' ? ERP_SHOTS : ERP_SHOTS.filter((s) => s.category === activeCat)),
    [activeCat]
  );
  const activeShot = visibleShots.find((s) => s.id === activeId) ?? visibleShots[0];

  const pickCat = (cat: CatKey | 'all') => {
    setActiveCat(cat);
    const first = cat === 'all' ? ERP_SHOTS[0] : ERP_SHOTS.find((s) => s.category === cat);
    if (first) setActiveId(first.id);
  };

  const hero = ERP_SHOTS[0];

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-slate-900 font-sans relative overflow-x-clip selection:bg-[#1E40FF] selection:text-white">
      <LuxuryGoldBackdrop />
      <Navbar activePage="erp" onOpenContact={() => setShowContactModal(true)} />

      <main className="relative z-10 pt-28 sm:pt-32 md:pt-36">
        {/* ═══════════════ HERO ═══════════════ */}
        <section className="pb-10 sm:pb-20 px-4 sm:px-6 lg:px-8 relative">
          <motion.img
            src={DECOR_PNGS.prism}
            alt=""
            aria-hidden="true"
            animate={{ y: [0, -14, 0], rotate: [-4, 4, -4] }}
            transition={{ duration: 7.5, repeat: Infinity, ease: 'easeInOut' }}
            className="hidden xl:block pointer-events-none select-none absolute top-2 left-[3%] w-28 h-28 object-contain opacity-70 drop-shadow-[0_18px_28px_rgba(30,64,255,0.16)]"
          />
          <motion.img
            src={DECOR_PNGS.torus}
            alt=""
            aria-hidden="true"
            animate={{ y: [0, 14, 0], rotate: [5, -5, 5] }}
            transition={{ duration: 8.5, repeat: Infinity, ease: 'easeInOut' }}
            className="hidden xl:block pointer-events-none select-none absolute top-16 right-[3%] w-28 h-28 object-contain opacity-70 drop-shadow-[0_18px_28px_rgba(6,182,212,0.18)]"
          />

          <div className="max-w-4xl mx-auto text-center space-y-4 sm:space-y-6">
            <div className="ql-eyebrow mx-auto">
              <Sparkles className="w-3.5 h-3.5 text-[#1E40FF] shrink-0" />
              <span>HỆ THỐNG QUẢN TRỊ DOANH NGHIỆP 5.0 • AI AUTOMATION</span>
            </div>

            <h1 className="text-[1.75rem] sm:text-5xl xl:text-[52px] font-black text-slate-900 leading-[1.22] tracking-[-0.02em]">
              Hệ Thống Quản Trị Doanh Nghiệp
              <span className="block text-gradient-inkica mt-1">Toàn Diện &amp; Tự Động Hóa</span>
            </h1>

            <p className="max-w-2xl mx-auto text-sm sm:text-lg text-slate-600 leading-relaxed">
              ERP DOMATION là{' '}
              <strong className="text-slate-900">
                hệ thống vận hành custom may đo, thiết kế flow riêng cho doanh nghiệp thời đại mới
              </strong>
              : tích hợp sâu AI Workflow 5.0 từ tiếp nhận Lead đa kênh, phân bổ 5 cổng, chấm công GPS AI, bảng lương tự
              động đến dữ liệu ngược Meta CAPI.
            </p>

            <div className="pt-1 sm:pt-2 grid grid-cols-2 sm:flex sm:flex-row items-center justify-center gap-2 sm:gap-3.5 max-w-md sm:max-w-none mx-auto">
              <button
                type="button"
                onClick={() => setShowContactModal(true)}
                className="btn-inkica-primary w-full sm:w-auto rounded-full px-3 sm:px-7 py-3 sm:py-3.5 text-xs sm:text-sm cursor-pointer whitespace-nowrap"
              >
                <span className="sm:hidden">Tư vấn triển khai</span>
                <span className="hidden sm:inline">Đăng Ký Tư Vấn Triển Khai</span>
                <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
              </button>
              <a
                href="#giao-dien-thuc-te"
                className="ql-btn-outline w-full sm:w-auto rounded-full px-3 sm:px-6 py-3 sm:py-3.5 text-xs sm:text-sm whitespace-nowrap flex items-center justify-center gap-2"
              >
                <Maximize2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#1E40FF] shrink-0" />
                <span>Xem Giao Diện Thực Tế</span>
              </a>
            </div>
          </div>

          {/* Hero product frame */}
          <div className="max-w-6xl mx-auto mt-10 sm:mt-14">
            <motion.div
              initial={{ opacity: 0, y: 28 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.15 }}
            >
              <BrowserFrame
                src={hero.src}
                alt="DOM ERP — Tổng quan Phân bổ Data"
                route={hero.route}
                eager
                onZoom={() => setLightbox(hero)}
              />
            </motion.div>
          </div>

          {/* KPI strip */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4 max-w-6xl mx-auto mt-8 sm:mt-10 text-left">
            {KPIS.map((kpi, idx) => {
              const Icon = kpi.icon;
              return (
                <motion.div
                  key={kpi.title}
                  initial={{ opacity: 0, y: 14 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.06 }}
                  className="group rounded-2xl bg-white/95 backdrop-blur-xl border border-slate-200/85 shadow-[0_14px_34px_-16px_rgba(30,64,255,0.14)] px-4 py-4 sm:px-5 sm:py-4.5 flex items-center gap-3.5 hover:-translate-y-0.5 hover:border-blue-300/80 transition-all"
                >
                  <div
                    className={`w-11 h-11 rounded-2xl bg-gradient-to-br ${kpi.iconBg} text-white flex items-center justify-center shadow-sm shrink-0`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <div className={`text-lg sm:text-xl font-black tracking-tight ${kpi.valColor} leading-tight`}>
                      {kpi.val}
                    </div>
                    <div className="text-xs font-bold text-slate-900 mt-0.5 truncate">
                      {kpi.title}
                    </div>
                    <div className="text-[11px] font-medium text-slate-500 truncate">
                      {kpi.sub}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </section>

        {/* ═══════════════ PARTNER LOGOS (shared with home) ═══════════════ */}
        <PartnersTrustSection showEcosystemBrands={false} excludeFlagshipIds={['ecolife-signature']} />

        {/* ═══════════════ LIVE PRODUCT SHOWCASE ═══════════════ */}
        <section id="giao-dien-thuc-te" className="scroll-mt-24 py-12 sm:py-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <SectionHead
              eyebrow="GIAO DIỆN THỰC TẾ"
              icon={Maximize2}
              aside="Ảnh chụp trực tiếp từ DOM ERP đang chạy với dữ liệu demo (tenant EcoLife Signature). Tên khách hàng, số điện thoại và số liệu chỉ mang tính minh họa."
            >
              Mọi Phân Hệ Hội Tụ{' '}
              <span className="text-gradient-inkica">Trên Một Màn Hình</span>
            </SectionHead>

            {/* Category pills */}
            <div className="mb-6">
              <DomResponsiveSubtabs
                tabs={SHOT_CATS.map((cat) => {
                  const Icon = cat.icon;
                  return {
                    id: cat.id,
                    label: cat.label,
                    icon: <Icon className="w-3.5 h-3.5" />,
                  };
                })}
                value={activeCat}
                onChange={(id) => pickCat(id as CatKey | 'all')}
                maxMobile={2}
              />
            </div>

            {activeShot && (
              <div className="grid lg:grid-cols-[minmax(0,1fr)_340px] gap-5 items-start">
                {/* Stage */}
                <div className="min-w-0">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={activeShot.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      transition={{ duration: 0.25 }}
                    >
                      <BrowserFrame
                        src={activeShot.src}
                        alt={`DOM ERP — ${activeShot.title}`}
                        route={activeShot.route}
                        onZoom={() => setLightbox(activeShot)}
                      />
                      <div className="mt-4 flex flex-col sm:flex-row sm:items-start justify-between gap-3 px-1">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2 mb-1.5">
                            <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-blue-50 text-[#1E40FF] border border-blue-200">
                              {activeShot.tag}
                            </span>
                            <span className="text-[11px] font-semibold text-emerald-700">
                              {activeShot.highlight}
                            </span>
                          </div>
                          <h3 className="text-base sm:text-lg font-bold text-slate-900">{activeShot.title}</h3>
                          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mt-1 max-w-2xl">
                            {activeShot.description}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  </AnimatePresence>
                </div>

                {/* Screen picker */}
                <div className="rounded-[28px] bg-white/80 backdrop-blur-xl border border-slate-200/80 shadow-xs p-2 max-h-[420px] lg:max-h-[640px] overflow-y-auto">
                  {visibleShots.map((s) => {
                    const on = s.id === activeShot.id;
                    return (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => setActiveId(s.id)}
                        className={`w-full flex items-center gap-3 p-2 rounded-2xl text-left transition-colors cursor-pointer ${
                          on ? 'bg-blue-50/90 ring-1 ring-blue-200' : 'hover:bg-slate-50'
                        }`}
                      >
                        <img
                          src={s.src}
                          alt=""
                          aria-hidden="true"
                          loading="lazy"
                          decoding="async"
                          className="w-24 shrink-0 aspect-[8/5] object-cover object-top rounded-lg border border-slate-200/80 bg-slate-100"
                        />
                        <div className="min-w-0">
                          <div className={`text-xs font-bold leading-snug ${on ? 'text-[#1E40FF]' : 'text-slate-900'}`}>
                            {s.title}
                          </div>
                          <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mt-0.5 truncate">
                            {s.tag}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </section>

        {/* ═══════════════ 12 MODULES (hairline grid) ═══════════════ */}
        <section
          id="phan-he"
          className="scroll-mt-24 py-12 sm:py-20 px-4 sm:px-6 lg:px-8 border-y border-slate-200/70 bg-white/55 sm:backdrop-blur-md"
        >
          <div className="max-w-7xl mx-auto">
            <SectionHead
              eyebrow="KIẾN TRÚC HỆ THỐNG"
              icon={Layers}
              aside="Toàn bộ chu trình vận hành từ khi khách hàng xuất hiện trên Ads đến chấm công, chia hoa hồng, tính lương và báo cáo tài chính đều được số hóa chặt chẽ."
            >
              12 Phân Hệ Doanh Nghiệp <span className="text-gradient-inkica">Chuẩn Hóa</span>
            </SectionHead>

            <div className="rounded-[28px] overflow-hidden border border-slate-200/80 bg-slate-200/70 shadow-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px">
                {ENTERPRISE_MODULES.map((mod) => {
                  const Icon = mod.icon;
                  return (
                    <div
                      key={mod.num}
                      className={`group bg-white/95 backdrop-blur-xl p-6 sm:p-8 flex flex-col gap-4 ${mod.hoverBg} transition-colors`}
                    >
                      <div className="flex items-center justify-between">
                        <div
                          className={`w-11 h-11 rounded-xl flex items-center justify-center bg-gradient-to-br ${mod.color} text-white shadow-[0_8px_20px_-4px_rgba(30,64,255,0.22)] group-hover:scale-105 transition-transform`}
                        >
                          <Icon className="w-5 h-5" />
                        </div>
                        <span className={`text-2xl font-black transition-colors tabular-nums ${mod.badgeCls}`}>
                          {mod.num}
                        </span>
                      </div>
                      <h3 className="text-base font-bold text-slate-900 group-hover:text-[#1E40FF] transition-colors leading-snug">
                        {mod.title}
                      </h3>
                      <p className="text-xs sm:text-[13px] text-slate-600 leading-relaxed">{mod.desc}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        {/* ═══════════════ DEEP DIVES (CONCISE HIGHLIGHTS) ═══════════════ */}
        <section className="py-12 sm:py-16 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto space-y-12 sm:space-y-16">
            {/* 1 — five gates */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center relative">
              <div>
                <div className="ql-eyebrow mb-3">
                  <Zap className="w-3.5 h-3.5 text-[#1E40FF] shrink-0" />
                  <span>ĐỘT PHÁ VẬN HÀNH LEAD</span>
                </div>
                <h3 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mb-3">
                  Thuật Toán Chia Lead 5 Cổng &amp; Van Chống Ôm
                </h3>
                <p className="text-slate-600 text-sm leading-relaxed mb-5">
                  Chấm dứt tình trạng Sales “ôm số” không gọi bằng 5 rào chắn kiểm duyệt tự động:
                </p>
                <CheckList
                  iconClass="text-[#1E40FF]"
                  items={[
                    { title: 'Cổng 1–3 (Roster, Selfie & Vacation):', desc: 'Chỉ Sales thuộc dự án, đã điểm danh ca và không nghỉ phép mới nhận số.' },
                    { title: 'Cổng 4 - Van Chống Ôm (Backpressure):', desc: 'Vượt ngưỡng 5 lead chưa tương tác tự khóa nhận số mới để bảo vệ SLA 2 phút.' },
                    { title: 'Cổng 5 - Hạn mức Quota:', desc: 'Giới hạn nhận số theo giờ (3 số), theo ngày (15 số) và theo tháng (300 số).' },
                  ]}
                />
              </div>
              <div className="relative">
                <img
                  src={DECOR_PNGS.funnel}
                  alt=""
                  aria-hidden="true"
                  className="hidden sm:block pointer-events-none select-none absolute -top-10 -right-6 w-24 h-24 object-contain opacity-90 animate-float-decor z-20"
                />
                <ShotFigure
                  shot={getShot('settings')}
                  caption="Cài đặt Nghiệp vụ & Hạn mức ngay trên giao diện — không hardcode"
                  onZoom={() => setLightbox(getShot('settings'))}
                />
              </div>
            </div>

            {/* 2 — GPS & payroll */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
              <div className="order-2 lg:order-1 relative">
                <img
                  src={DECOR_PNGS.shield}
                  alt=""
                  aria-hidden="true"
                  className="hidden sm:block pointer-events-none select-none absolute -top-8 -left-6 w-24 h-24 object-contain opacity-90 animate-float-gentle z-20"
                />
                <ShotFigure
                  shot={getShot('attendance-detail')}
                  caption="Nhật ký chấm công theo ngày: giờ vào/ra ca và vị trí check-in từng nhân sự"
                  onZoom={() => setLightbox(getShot('attendance-detail'))}
                />
              </div>
              <div className="order-1 lg:order-2">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[11px] font-bold uppercase tracking-wider mb-3">
                  <Camera className="w-3.5 h-3.5" /> Minh Bạch Chấm Công &amp; Tính Lương
                </div>
                <h3 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mb-3">
                  Chấm Công GPS Vệ Tinh, AI Selfie &amp; Bảng Lương Tự Động
                </h3>
                <p className="text-slate-600 text-sm leading-relaxed mb-5">
                  Chống chấm công hộ, tính công chuẩn xác và xuất phiếu lương PDF ký số cho từng nhân sự:
                </p>
                <CheckList
                  iconClass="text-emerald-600"
                  items={[
                    { title: 'Định Vị GPS + Wi-Fi BSSID & Selfie AI:', desc: 'Xác thực đúng bán kính văn phòng và khuôn mặt trực tiếp qua camera.' },
                    { title: 'Bảng Lương Động & Thuế TNCN:', desc: 'Tự động tính công, OT, KPI, hoa hồng Co-care, BHXH và thuế lũy tiến.' },
                    { title: 'Phiếu Lương PDF & Ký Số:', desc: 'Nhân sự xem và xác nhận bảng lương điện tử trực tiếp trên điện thoại.' },
                  ]}
                />
              </div>
            </div>

            {/* 3 — notifications */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-cyan-50 border border-cyan-200 text-[#0369A1] text-[11px] font-bold uppercase tracking-wider mb-3">
                  <BellRing className="w-3.5 h-3.5" /> Thông Báo Thời Gian Thực
                </div>
                <h3 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mb-3">
                  Cấu Hình Thông Báo Đa Kênh Theo SLA
                </h3>
                <p className="text-slate-600 text-sm leading-relaxed mb-5">
                  Kết nối Zalo Bot, Telegram Bot và Email SMTP — phân luồng riêng cho Sales, Quản lý &amp; Ban Giám Đốc:
                </p>
                <CheckList
                  iconClass="text-[#0284C7]"
                  items={[
                    { title: 'Bắn Lead Mới Trong SLA 2 Phút:', desc: 'Gửi ngay tóm tắt nhu cầu qua Zalo/Telegram khi chia số thành công.' },
                    { title: 'Cảnh Báo Databank & Co-Care:', desc: 'Đếm ngược hạn thu hồi data, thông báo phiếu chia hoa hồng & @mention.' },
                    { title: 'Báo Cáo Hàng Ngày Bot & Email:', desc: 'Tổng hợp KPI Lead, tỷ lệ xử lý và tùy chọn gộp chỉ số Meta Ads.' },
                  ]}
                />
              </div>
              <NotifyIllustration />
            </div>
          </div>
        </section>

        {/* ═══════════════ COMPARISON ═══════════════ */}
        <section className="py-12 sm:py-20 px-4 sm:px-6 lg:px-8 border-t border-slate-200/70 bg-white/55 sm:backdrop-blur-md">
          <div className="max-w-5xl mx-auto">
            <SectionHead
              eyebrow="VÌ SAO KHÁC BIỆT"
              icon={TrendingUp}
              aside="Sự khác biệt giữa phần mềm đóng gói cứng nhắc và hệ thống vận hành custom may đo, thiết kế flow riêng cho doanh nghiệp thời đại mới."
            >
              So Sánh ERP Truyền Thống vs{' '}
              <span className="text-gradient-inkica">ERP DOMATION May Đo</span>
            </SectionHead>

            <div className="overflow-x-auto rounded-[28px] bg-white/85 backdrop-blur-xl border border-slate-200/80 shadow-xs">
              <table className="w-full text-left text-xs sm:text-sm min-w-[640px]">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/90">
                    <th className="p-4 sm:p-5 font-bold uppercase tracking-wider text-slate-900">Nghiệp Vụ</th>
                    <th className="p-4 sm:p-5 font-bold uppercase tracking-wider text-slate-500">ERP &amp; Excel Truyền Thống</th>
                    <th className="p-4 sm:p-5 font-bold uppercase tracking-wider text-[#1E40FF]">DOMATION ERP 5.0</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200/75 text-slate-600">
                  {COMPARISON_ROWS.map(([op, trad, erp]) => (
                    <tr key={op} className="hover:bg-blue-50/40 transition-colors">
                      <td className="p-4 sm:p-5 font-bold text-slate-900">{op}</td>
                      <td className="p-4 sm:p-5 text-slate-500">{trad}</td>
                      <td className="p-4 sm:p-5 text-emerald-700 font-semibold">{erp}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* ═══════════════ CTA ═══════════════ */}
        <section id="tu-van" className="scroll-mt-24 py-12 sm:py-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="relative overflow-hidden rounded-[28px] sm:rounded-[36px] text-white bg-gradient-to-br from-[#060D2B] via-[#0D1F66] to-[#1535C9] shadow-[0_32px_80px_-24px_rgba(30,64,255,0.55)] ring-1 ring-white/10">
              {/* ambient glows + faint grid (decorative, kept behind content) */}
              <div className="pointer-events-none absolute -top-28 -left-20 w-96 h-96 rounded-full bg-cyan-400/20 blur-3xl" />
              <div className="pointer-events-none absolute -bottom-36 -right-10 w-[30rem] h-[30rem] rounded-full bg-blue-500/30 blur-3xl" />
              <div
                className="pointer-events-none absolute inset-0 opacity-[0.06]"
                style={{
                  backgroundImage:
                    'linear-gradient(rgba(255,255,255,.9) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.9) 1px, transparent 1px)',
                  backgroundSize: '44px 44px',
                }}
              />

              <div className="relative z-10 grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] gap-10 lg:gap-14 items-center p-6 sm:p-10 lg:p-14">
                {/* copy */}
                <div className="text-center lg:text-left">
                  <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 border border-white/25 text-cyan-100 text-[11px] font-bold uppercase tracking-widest mb-5">
                    <Sparkles className="w-3.5 h-3.5 text-cyan-300" /> Sẵn sàng triển khai
                  </div>
                  <h2 className="text-[1.75rem] sm:text-4xl lg:text-[42px] font-black leading-[1.18] tracking-tight mb-4 text-white">
                    Sẵn Sàng Chuyển Đổi Số
                    <span className="block pb-1 bg-gradient-to-r from-cyan-300 via-sky-200 to-white bg-clip-text text-transparent">
                      Doanh Nghiệp Của Bạn?
                    </span>
                  </h2>
                  <p className="text-white/85 text-sm sm:text-base leading-relaxed max-w-xl mx-auto lg:mx-0 mb-7">
                    Liên hệ ngay với đội ngũ kỹ sư của <strong className="text-white">DOMATION</strong> để nhận tư vấn
                    kiến trúc ERP, bản dùng thử hệ thống và lộ trình triển khai chi tiết cho doanh nghiệp của bạn.
                  </p>

                  <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center justify-center lg:justify-start gap-3 mb-7">
                    <button
                      type="button"
                      onClick={() => setShowContactModal(true)}
                      className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-full bg-white text-[#1535C9] font-black text-sm shadow-[0_12px_32px_rgba(255,255,255,0.22)] hover:-translate-y-0.5 transition-all cursor-pointer"
                    >
                      <MessageSquare className="w-4 h-4" />
                      <span>Liên Hệ Tư Vấn Trực Tiếp</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                    <a
                      href="https://zalo.me/0378859736"
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-full bg-[#0068FF] hover:bg-[#1A7AFF] border border-white/30 text-white font-bold text-sm shadow-[0_10px_28px_rgba(0,104,255,0.5)] hover:-translate-y-0.5 transition-all"
                    >
                      <PhoneCall className="w-4 h-4" />
                      <span>Chat Zalo: 0378 859 736</span>
                    </a>
                  </div>

                  <ul className="flex flex-wrap items-center justify-center lg:justify-start gap-x-5 gap-y-2 text-xs font-semibold text-white/90">
                    {['12 phân hệ may đo', 'SLA chia lead 2 phút', 'Bảo mật RLS & Audit Log'].map((t) => (
                      <li key={t} className="inline-flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-cyan-300 shrink-0" /> {t}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* product: quick-navigation menu (two views, fully visible, no cropping) */}
                <div className="relative mx-auto w-full max-w-[640px]">
                  <button
                    type="button"
                    aria-label="Phóng to: Menu điều hướng nhanh (marketing, chương trình, nhân sự)"
                    onClick={() =>
                      setLightbox({
                        src: '/imgs/erp-screens/quick-menu-2.jpg',
                        tag: 'Quick Navigation',
                        title: 'Menu điều hướng nhanh — Marketing, Chương trình, Nhân sự',
                        description: 'Mọi phân hệ chỉ cách một lần bấm; ghim yêu thích để mở nhanh các màn hay dùng.',
                      })
                    }
                    className="hidden sm:block absolute right-0 top-0 w-[88%] cursor-zoom-in rounded-2xl overflow-hidden ring-1 ring-white/25 shadow-[0_24px_60px_-18px_rgba(2,6,23,0.7)] rotate-[2.5deg] opacity-90 hover:opacity-100 hover:rotate-[1.5deg] transition-all"
                  >
                    <img
                      src="/imgs/erp-screens/quick-menu-2.jpg"
                      alt="DOM ERP — Menu điều hướng nhanh: Marketing, Chương trình, Nhân sự"
                      width={1024}
                      height={699}
                      loading="lazy"
                      decoding="async"
                      className="w-full h-auto block bg-white"
                    />
                  </button>
                  <button
                    type="button"
                    aria-label="Phóng to: Menu điều hướng nhanh (tổng quan, tài chính, khách hàng)"
                    onClick={() =>
                      setLightbox({
                        src: '/imgs/erp-screens/quick-menu-1.jpg',
                        tag: 'Quick Navigation',
                        title: 'Menu điều hướng nhanh — Tổng quan, Tài chính, Khách hàng',
                        description: 'Mọi phân hệ chỉ cách một lần bấm; ghim yêu thích để mở nhanh các màn hay dùng.',
                      })
                    }
                    className="relative block w-full sm:w-[88%] sm:mt-14 cursor-zoom-in rounded-2xl overflow-hidden ring-1 ring-white/30 shadow-[0_30px_70px_-18px_rgba(2,6,23,0.75)] hover:-translate-y-1 transition-transform"
                  >
                    <img
                      src="/imgs/erp-screens/quick-menu-1.jpg"
                      alt="DOM ERP — Menu điều hướng nhanh: Tổng quan, Tài chính, Khách hàng"
                      width={1024}
                      height={695}
                      loading="lazy"
                      decoding="async"
                      className="w-full h-auto block bg-white"
                    />
                  </button>
                  <p className="mt-4 text-center text-[11px] font-semibold uppercase tracking-widest text-cyan-100/90">
                    Menu điều hướng nhanh • Mọi phân hệ trong một chạm
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <DomationFooter onOpenContact={() => setShowContactModal(true)} />

      {/* Back to top */}
      <button
        type="button"
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        aria-label="Lên đầu trang"
        className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-full bg-white/95 backdrop-blur-md border border-slate-200/90 shadow-[0_8px_24px_rgba(15,23,42,0.1)] text-xs font-bold text-slate-700 hover:text-[#1E40FF] transition-all cursor-pointer"
      >
        ↑ Đầu trang
      </button>

      {/* Lightbox */}
      <AnimatePresence>
        {lightbox && (
          <div className="fixed inset-0 z-[150] flex items-end sm:items-center justify-center p-0 sm:p-4 md:p-8">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
              onClick={() => setLightbox(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-6xl max-h-[92dvh] bg-white rounded-t-[26px] sm:rounded-2xl border border-slate-200 overflow-hidden shadow-2xl z-10 flex flex-col"
            >
              <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/90">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-blue-50 text-[#1E40FF] border border-blue-200 shrink-0">
                    {lightbox.tag}
                  </span>
                  <h3 className="text-sm sm:text-base font-bold text-slate-900 truncate max-w-md sm:max-w-xl">
                    {lightbox.title}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setLightbox(null)}
                  aria-label="Đóng"
                  className="w-11 h-11 sm:w-9 sm:h-9 flex items-center justify-center rounded-lg bg-slate-200/70 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer shrink-0"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="flex-1 overflow-auto bg-slate-100 p-2 sm:p-4 flex items-center justify-center">
                <img
                  src={lightbox.src}
                  alt={lightbox.title}
                  className="max-w-full max-h-[72vh] object-contain rounded-lg shadow-lg"
                />
              </div>
              <div className="p-4 border-t border-slate-200 bg-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs text-slate-600">
                <p className="flex-1 leading-relaxed">{lightbox.description}</p>
                <a
                  href={lightbox.src}
                  target="_blank"
                  rel="noreferrer"
                  className="shrink-0 inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-[#1E40FF] font-semibold transition-colors"
                >
                  <span>Mở ảnh gốc HD</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <ContactModal isOpen={showContactModal} onClose={() => setShowContactModal(false)} />
    </div>
  );
};
