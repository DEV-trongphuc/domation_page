import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Activity,
  Bell,
  Bot,
  Briefcase,
  Building2,
  Calendar,
  CheckSquare,
  ChevronRight,
  ClipboardCheck,
  Command,
  CreditCard,
  Database,
  DollarSign,
  FileCheck2,
  FileText,
  Filter,
  FolderKanban,
  GitBranch,
  Globe,
  GraduationCap,
  Keyboard,
  Layers,
  LayoutDashboard,
  Link2,
  Loader2,
  Mail,
  MapPin,
  Megaphone,
  MessageCircle,
  MessageSquare,
  Plus,
  QrCode,
  Receipt,
  Scale,
  Search,
  Send,
  Settings,
  ShieldCheck,
  Sparkles,
  SunMoon,
  Ticket,
  TrendingUp,
  UserCheck,
  Users,
  Wallet,
  Webhook,
  Workflow,
  X,
  Zap,
  type LucideIcon,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';
import { useEntitlement } from '../../contexts/EntitlementContext';
import { maskPiiPhone } from '../../contexts/entitlementConstants';
import { apiRequest } from '../../../autodataApi';
import { fetchAPI } from '../../utils/api';

interface PaletteItem {
  id: string;
  group: 'actions' | 'contacts' | 'tasks' | 'approvals' | 'companies' | 'navigation';
  groupTitle?: string;
  title: string;
  subtitle?: string;
  badge?: string;
  badgeColor?: string;
  badgeBg?: string;
  icon: LucideIcon;
  action: () => void;
}

interface NavSearchDef {
  screenKey: string;
  moduleKey: string;
  name: string;
  title: string;
  subtitle: string;
  route: string;
  icon: LucideIcon;
  shortcut?: string;
  groupTitle: string;
}

interface GlobalSearchApiResponse {
  grouped?: {
    contacts?: Array<Record<string, unknown>>;
    tasks?: Array<Record<string, unknown>>;
    approvals?: Array<Record<string, unknown>>;
    companies?: Array<Record<string, unknown>>;
  };
}

export const CommandPalette: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [backendResults, setBackendResults] = useState<{
    contacts: Array<Record<string, unknown>>;
    tasks: Array<Record<string, unknown>>;
    approvals: Array<Record<string, unknown>>;
    companies: Array<Record<string, unknown>>;
  }>({
    contacts: [],
    tasks: [],
    approvals: [],
    companies: [],
  });

  const navigate = useNavigate();
  const { token, tenantSlug } = useAuth();
  const {
    packageCode,
    hasModule,
    can,
    canScreen,
    canQuickAction,
    terminology,
    openBilling,
  } = useEntitlement() as ReturnType<typeof useEntitlement> & { openBilling?: () => void };
  const auth = useAuth();
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const openAndResetPalette = useCallback(() => {
    setSearch('');
    setSelectedIndex(0);
    setBackendResults({ contacts: [], tasks: [], approvals: [], companies: [] });
    setOpen(true);
    setTimeout(() => inputRef.current?.focus(), 40);
  }, []);

  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      const isK = e.key === 'k' || e.key === 'K' || e.code === 'KeyK';
      if ((e.metaKey || e.ctrlKey) && isK) {
        e.preventDefault();
        e.stopPropagation();
        if (open) {
          setOpen(false);
        } else {
          openAndResetPalette();
        }
        return;
      }
      if (e.key === 'Escape' && open) {
        e.preventDefault();
        setOpen(false);
      }
    };

    const handleCustomOpen = () => openAndResetPalette();

    window.addEventListener('keydown', handleGlobalKeyDown, true);
    window.addEventListener('open-command-palette', handleCustomOpen);
    return () => {
      window.removeEventListener('keydown', handleGlobalKeyDown, true);
      window.removeEventListener('open-command-palette', handleCustomOpen);
    };
  }, [open, openAndResetPalette]);

  const allNavItems = useMemo<NavSearchDef[]>(() => {
    const isMktOnly = packageCode === 'marketing_standalone';
    const customerLabel = terminology.customerLabel || 'Khách hàng';
    const dealLabel = terminology.dealLabel || 'Giao dịch';
    const projectLabel = terminology.projectLabel || 'Dự án';
    const consultantLabel = terminology.consultantLabel || 'Sale & Đại lý';

    const items: NavSearchDef[] = [
      {
        screenKey: isMktOnly ? 'mkt_dashboard' : 'dashboard',
        moduleKey: isMktOnly ? 'mkt_dashboard' : 'crm_dashboard',
        name: isMktOnly ? 'Dashboard Marketing' : 'Dashboard',
        title: isMktOnly ? 'Tổng quan Marketing Automation' : 'Tổng quan CRM & Chia số (Dashboard)',
        subtitle: 'Chỉ số tăng trưởng, hiệu suất phễu & SLA thời gian thực',
        route: '/',
        icon: LayoutDashboard,
        shortcut: 'Alt + D',
        groupTitle: 'TỔNG QUAN & CỘNG TÁC',
      },
      {
        screenKey: 'workspace',
        moduleKey: 'erp_projects_tasks',
        name: 'Bàn làm việc',
        title: 'Bàn làm việc Cá nhân (Workspace)',
        subtitle: 'Nhiệm vụ ưu tiên, Pomodoro Focus & ghi chú nhanh',
        route: '/workspace',
        icon: CheckSquare,
        groupTitle: 'TỔNG QUAN & CỘNG TÁC',
      },
      {
        screenKey: 'feed',
        moduleKey: 'erp_workchat',
        name: 'Bảng tin',
        title: 'Bảng tin Doanh nghiệp (Feed)',
        subtitle: 'Thông báo nội bộ, vinh danh & tương tác phòng ban',
        route: '/feed',
        icon: Sparkles,
        groupTitle: 'TỔNG QUAN & CỘNG TÁC',
      },
      {
        screenKey: 'erp_workchat',
        moduleKey: 'erp_workchat',
        name: 'WorkChat',
        title: 'WorkChat - Tin nhắn Nội bộ',
        subtitle: 'Trò chuyện phòng ban, gửi chứng từ ERP & nhãn dán',
        route: '/erp/workchat',
        icon: MessageSquare,
        groupTitle: 'TỔNG QUAN & CỘNG TÁC',
      },
      {
        screenKey: 'data_list',
        moduleKey: 'leads',
        name: 'Nhật ký Data',
        title: 'Quản lý Data & Lịch hẹn',
        subtitle: 'Danh sách Lead, Kho dữ liệu chung & kiểm tra trùng SĐT',
        route: '/data',
        icon: Database,
        shortcut: 'Alt + L',
        groupTitle: 'AUTO DATA & CRM 360°',
      },
      {
        screenKey: 'contacts',
        moduleKey: 'leads',
        name: customerLabel,
        title: `Hồ sơ ${customerLabel} 360° (Contacts)`,
        subtitle: 'Hành trình đa kênh, Ghi chú, Tài liệu & Lịch sử giao dịch',
        route: '/contacts',
        icon: UserCheck,
        groupTitle: 'AUTO DATA & CRM 360°',
      },
      {
        screenKey: 'deals',
        moduleKey: 'deals',
        name: dealLabel,
        title: `Pipeline ${dealLabel} (Kanban)`,
        subtitle: 'Kéo thả giai đoạn cơ hội bán hàng & dự báo doanh thu',
        route: '/deals',
        icon: TrendingUp,
        groupTitle: 'AUTO DATA & CRM 360°',
      },
      {
        screenKey: 'companies',
        moduleKey: 'companies',
        name: 'Đối tác B2B',
        title: 'Doanh nghiệp & Đối tác B2B (Companies)',
        subtitle: 'Phân cấp công ty mẹ/con, MST & doanh số cộng dồn',
        route: '/companies',
        icon: Building2,
        groupTitle: 'AUTO DATA & CRM 360°',
      },
      {
        screenKey: 'activities',
        moduleKey: 'leads',
        name: 'Hoạt động',
        title: 'Hoạt động & Nhắc việc CRM',
        subtitle: 'Cuộc gọi, lịch hẹn, email & công việc theo sát khách hàng',
        route: '/activities',
        icon: Calendar,
        groupTitle: 'AUTO DATA & CRM 360°',
      },
      {
        screenKey: 'ads_performance',
        moduleKey: 'ads_capi',
        name: 'Hiệu suất Ads',
        title: 'Hiệu suất Quảng cáo & Meta CAPI',
        subtitle: 'CPL/CPQL thực chiến, Backfill & đồng bộ đối tượng CAPI',
        route: '/ads-performance',
        icon: Megaphone,
        groupTitle: 'AUTO DATA & CRM 360°',
      },
      {
        screenKey: 'tickets',
        moduleKey: 'tickets_data',
        name: 'Ticket Lỗi',
        title: 'Ticket Báo lỗi Data & Bù số',
        subtitle: 'Xử lý khiếu nại lead lỗi & đền bù lượt chia cho Sale',
        route: '/tickets',
        icon: Ticket,
        shortcut: 'Alt + T',
        groupTitle: 'AUTO DATA & CRM 360°',
      },
      {
        screenKey: 'gatekeeper',
        moduleKey: 'gatekeeper',
        name: 'AI Gatekeeper',
        title: 'AI Pre-screener Gatekeeper',
        subtitle: 'Hàng đợi dữ liệu tạm giữ & duyệt trước khi chia vòng',
        route: '/gatekeeper',
        icon: Filter,
        shortcut: 'Alt + G',
        groupTitle: 'AUTO DATA & CRM 360°',
      },
      {
        screenKey: 'rounds',
        moduleKey: 'rounds',
        name: 'Vòng phân bổ',
        title: 'Vòng xoay chia số (Rounds)',
        subtitle: 'Cấu hình trọng số Fair-Share & ca trực nhận số',
        route: '/rounds',
        icon: GitBranch,
        shortcut: 'Alt + R',
        groupTitle: 'AUTO DATA & CRM 360°',
      },
      {
        screenKey: 'fair_share',
        moduleKey: 'fair_share',
        name: 'Fair-Share',
        title: 'Đối soát Công bằng (Fair-Share Audit)',
        subtitle: 'Kiểm tra độ lệch phân phối giữa các tư vấn viên',
        route: '/fair-share',
        icon: Scale,
        shortcut: 'Alt + S',
        groupTitle: 'AUTO DATA & CRM 360°',
      },
      {
        screenKey: 'routing_rules',
        moduleKey: 'routing_rules',
        name: 'Logic xử lý',
        title: 'Quy tắc định tuyến tự động (Rules)',
        subtitle: 'Điều kiện nguồn, sản phẩm & ưu tiên vòng phân bổ',
        route: '/rules',
        icon: Webhook,
        shortcut: 'Alt + W',
        groupTitle: 'AUTO DATA & CRM 360°',
      },
      {
        screenKey: 'consultants',
        moduleKey: 'consultants',
        name: consultantLabel,
        title: `Nhân sự ${consultantLabel}`,
        subtitle: 'Trạng thái trực ca, đăng ký nghỉ phép & chỉ số tiếp nhận',
        route: '/consultants',
        icon: Users,
        shortcut: 'Alt + C',
        groupTitle: 'AUTO DATA & CRM 360°',
      },
      {
        screenKey: 'sale_portal',
        moduleKey: 'sale_portal',
        name: 'Sale Portal',
        title: 'Cổng Trực Nhận Số Sale Portal',
        subtitle: 'Giao diện nhận Lead tức thì, lịch hẹn & báo lỗi của Sale',
        route: '/sale-portal',
        icon: Zap,
        groupTitle: 'AUTO DATA & CRM 360°',
      },
      {
        screenKey: 'audiences',
        moduleKey: 'audiences',
        name: 'Tệp Data / Logic',
        title: `${customerLabel} & Tệp Data / Tệp Logic`,
        subtitle: 'Phân khúc động AND/OR real-time, A/B split & đẩy chia Sale',
        route: '/audiences',
        icon: Layers,
        shortcut: 'Alt + M',
        groupTitle: 'MARKETING AUTOMATION',
      },
      {
        screenKey: 'growth_attribution',
        moduleKey: 'growth_attribution',
        name: 'Growth ROAS',
        title: 'Doanh thu & ROAS Xuyên phễu',
        subtitle: 'Đo lường chuyển đổi từ Quảng cáo / Email đến Doanh thu thực',
        route: '/growth-attribution',
        icon: TrendingUp,
        groupTitle: 'MARKETING AUTOMATION',
      },
      {
        screenKey: 'mkt_templates',
        moduleKey: 'email_templates',
        name: 'Email Editor',
        title: 'Email Templates & Trình Kéo-Thả',
        subtitle: 'Thiết kế email responsive 15 khối & DOM Agent Studio',
        route: '/marketing/templates',
        icon: Mail,
        groupTitle: 'MARKETING AUTOMATION',
      },
      {
        screenKey: 'mkt_forms',
        moduleKey: 'forms_triggers',
        name: 'Form Builder',
        title: 'Form Builder, Form Cards & Cổng OTP',
        subtitle: 'Thu thập lead đa kênh, tùy chọn nuôi dưỡng hoặc chia Sale ngay',
        route: '/marketing/forms',
        icon: FileText,
        groupTitle: 'MARKETING AUTOMATION',
      },
      {
        screenKey: 'mkt_surveys',
        moduleKey: 'surveys_quiz',
        name: 'Surveys & Quiz',
        title: 'Khảo sát & Trắc nghiệm 25 Khối',
        subtitle: 'Rẽ nhánh câu hỏi & cộng điểm Lead Score tự động',
        route: '/marketing/surveys',
        icon: CheckSquare,
        groupTitle: 'MARKETING AUTOMATION',
      },
      {
        screenKey: 'mkt_campaigns',
        moduleKey: 'campaigns',
        name: 'Chiến dịch',
        title: 'Chiến dịch Đa kênh (Email & Zalo ZNS)',
        subtitle: 'Gửi hàng loạt A/B Subject, gửi nhắc & đo doanh thu',
        route: '/marketing/campaigns',
        icon: Send,
        groupTitle: 'MARKETING AUTOMATION',
      },
      {
        screenKey: 'mkt_flows',
        moduleKey: 'automation_flows',
        name: 'Automation Flows',
        title: 'Visual Automation Flow Studio',
        subtitle: 'Kịch bản nuôi dưỡng tự động & node đẩy vòng chia Sale',
        route: '/marketing/flows',
        icon: Workflow,
        groupTitle: 'MARKETING AUTOMATION',
      },
      {
        screenKey: 'mkt_vouchers',
        moduleKey: 'vouchers_qr',
        name: 'Voucher & QR',
        title: 'Voucher, Shortlink & QR Designer',
        subtitle: 'Phát hành ưu đãi, gạch mã tại quầy & thiết kế mã QR thương hiệu',
        route: '/marketing/vouchers',
        icon: QrCode,
        groupTitle: 'MARKETING AUTOMATION',
      },
      {
        screenKey: 'mkt_web_tracking',
        moduleKey: 'web_tracking',
        name: 'Web Tracking',
        title: 'Web Tracking SDK & Heatmap',
        subtitle: 'Định danh khách truy cập & bản đồ nhiệt hành vi',
        route: '/marketing/web-tracking',
        icon: Globe,
        groupTitle: 'MARKETING AUTOMATION',
      },
      {
        screenKey: 'mkt_social_bot',
        moduleKey: 'social_bot',
        name: 'Social Bot',
        title: 'Social Bot (Messenger / Zalo OA) & Inbox',
        subtitle: 'Hộp thư đa kênh hợp nhất & AI thu thập SĐT tự động',
        route: '/marketing/social-bot',
        icon: MessageCircle,
        groupTitle: 'MARKETING AUTOMATION',
      },
      {
        screenKey: 'erp_approvals',
        moduleKey: 'erp_approvals',
        name: 'Phê duyệt',
        title: 'Trung tâm Phê duyệt Đa cấp (Approvals)',
        subtitle: 'Duyệt Nghỉ phép, Tạm ứng, Chi phí, PO & Đơn bán theo ngưỡng',
        route: '/erp/approvals',
        icon: CheckSquare,
        groupTitle: 'NHÂN SỰ, DỰ ÁN & ERP',
      },
      {
        screenKey: 'erp_hrm',
        moduleKey: 'erp_hrm_org',
        name: 'Nhân sự HRM',
        title: 'Nhân sự (HRM), Hồ sơ & Hợp đồng',
        subtitle: 'Sơ đồ tổ chức, hồ sơ 360°, hợp đồng & lịch hẹn 1-1',
        route: '/erp/hrm',
        icon: Briefcase,
        groupTitle: 'NHÂN SỰ, DỰ ÁN & ERP',
      },
      {
        screenKey: 'erp_attendance',
        moduleKey: 'erp_attendance',
        name: 'Chấm công',
        title: 'Chấm công GPS Đa tầng & Selfie',
        subtitle: 'Check-in/out theo chế độ Thoải mái hoặc Tuân thủ bán kính',
        route: '/erp/attendance',
        icon: MapPin,
        groupTitle: 'NHÂN SỰ, DỰ ÁN & ERP',
      },
      {
        screenKey: 'erp_payroll',
        moduleKey: 'erp_payroll',
        name: 'Bảng lương',
        title: 'Bảng lương, Hoa hồng, Thuế TNCN & HTKK',
        subtitle: 'Tính công, BHXH, thuế lũy tiến & kết xuất XML HTKK',
        route: '/erp/payroll',
        icon: Wallet,
        groupTitle: 'NHÂN SỰ, DỰ ÁN & ERP',
      },
      {
        screenKey: 'my_payslips',
        moduleKey: 'erp_payroll',
        name: 'Phiếu lương',
        title: 'Phiếu lương của tôi (My Payslips)',
        subtitle: 'Chi tiết thu nhập, hoa hồng & khấu trừ từng kỳ lương',
        route: '/my-payslips',
        icon: Receipt,
        groupTitle: 'NHÂN SỰ, DỰ ÁN & ERP',
      },
      {
        screenKey: 'erp_projects',
        moduleKey: 'erp_projects_tasks',
        name: projectLabel,
        title: `${projectLabel} Kanban, Gantt & Whiteboard`,
        subtitle: 'Quản lý tiến độ dự án, phụ thuộc công việc & bảng vẽ',
        route: '/erp/projects',
        icon: FolderKanban,
        groupTitle: 'NHÂN SỰ, DỰ ÁN & ERP',
      },
      {
        screenKey: 'support_tickets',
        moduleKey: 'erp_projects_tasks',
        name: 'Helpdesk',
        title: 'Trung tâm Hỗ trợ Khách hàng (Helpdesk)',
        subtitle: 'Quản lý ticket hỗ trợ & cam kết SLA',
        route: '/support-tickets',
        icon: Ticket,
        groupTitle: 'NHÂN SỰ, DỰ ÁN & ERP',
      },
      {
        screenKey: 'erp_finance',
        moduleKey: 'erp_finance_inventory',
        name: 'Tài chính ERP',
        title: 'Tài chính, SO/PO, Kho FIFO & POS',
        subtitle: 'Điều hành dòng tiền, đơn hàng, tồn kho & thu chi',
        route: '/erp/finance',
        icon: DollarSign,
        groupTitle: 'TÀI CHÍNH & CHUỖI CUNG ỨNG',
      },
      {
        screenKey: 'quotes',
        moduleKey: 'erp_finance_inventory',
        name: 'Báo giá',
        title: 'Quản lý Báo giá (Quotes)',
        subtitle: 'Tạo báo giá theo SKU, chiết khấu, VAT & chuyển đơn hàng',
        route: '/quotes',
        icon: FileText,
        groupTitle: 'TÀI CHÍNH & CHUỖI CUNG ỨNG',
      },
      {
        screenKey: 'deposits',
        moduleKey: 'erp_finance_inventory',
        name: 'Đặt cọc',
        title: 'Quản lý Đặt cọc & Tiến độ thu (Deposits)',
        subtitle: 'Theo dõi đợt thanh toán, chứng từ UNC & VietQR động',
        route: '/deposits',
        icon: CreditCard,
        groupTitle: 'TÀI CHÍNH & CHUỖI CUNG ỨNG',
      },
      {
        screenKey: 'expenses',
        moduleKey: 'erp_finance_inventory',
        name: 'Chi phí',
        title: 'Quản lý Chi phí & Tạm ứng (Expenses)',
        subtitle: 'Phiếu chi nội bộ, hóa đơn VAT & luồng duyệt đa cấp',
        route: '/expenses',
        icon: Wallet,
        groupTitle: 'TÀI CHÍNH & CHUỖI CUNG ỨNG',
      },
      {
        screenKey: 'cash_flow',
        moduleKey: 'erp_finance_inventory',
        name: 'Dòng tiền',
        title: 'Báo cáo Dòng tiền & P&L (Cash Flow)',
        subtitle: 'Dự báo thu chi & lãi lỗ theo thời gian thực',
        route: '/cash-flow',
        icon: TrendingUp,
        groupTitle: 'TÀI CHÍNH & CHUỖI CUNG ỨNG',
      },
      {
        screenKey: 'invoices',
        moduleKey: 'erp_finance_inventory',
        name: 'Hóa đơn',
        title: 'Hóa đơn & Công nợ (Invoices)',
        subtitle: 'Phát hành hóa đơn điện tử & đối soát công nợ',
        route: '/invoices',
        icon: Receipt,
        groupTitle: 'TÀI CHÍNH & CHUỖI CUNG ỨNG',
      },
      {
        screenKey: 'sales_orders',
        moduleKey: 'erp_finance_inventory',
        name: 'Đơn bán hàng',
        title: 'Đơn bán hàng (Sales Orders)',
        subtitle: 'Theo dõi đơn đặt hàng, tiến độ giao hàng và xuất hóa đơn',
        route: '/sales-orders',
        icon: FileText,
        groupTitle: 'TÀI CHÍNH & CHUỖI CUNG ỨNG',
      },
      {
        screenKey: 'inventory',
        moduleKey: 'erp_finance_inventory',
        name: 'Kho hàng',
        title: 'Kho hàng FIFO, Nhà cung cấp & Sản phẩm',
        subtitle: 'Nhập xuất kho, kiểm kê lô hạn & định mức tồn',
        route: '/inventory',
        icon: Layers,
        groupTitle: 'TÀI CHÍNH & CHUỖI CUNG ỨNG',
      },
      {
        screenKey: 'purchase_orders',
        moduleKey: 'erp_finance_inventory',
        name: 'Đơn mua hàng',
        title: 'Đơn mua hàng (Purchase Orders)',
        subtitle: 'Đề nghị nhập hàng từ nhà cung cấp và nhập kho FIFO',
        route: '/purchase-orders',
        icon: ClipboardCheck,
        groupTitle: 'TÀI CHÍNH & CHUỖI CUNG ỨNG',
      },
      {
        screenKey: 'erp_cloud_files',
        moduleKey: 'erp_cloud_ocr',
        name: 'Cloud & OCR',
        title: 'Tài liệu Cloud & AI OCR CCCD / Hợp đồng',
        subtitle: 'Lưu trữ cô lập theo phòng ban & bóc tách văn bản tự động',
        route: '/erp/cloud-files',
        icon: FileCheck2,
        groupTitle: 'NHÂN SỰ, DỰ ÁN & ERP',
      },
      {
        screenKey: 'dom_agent',
        moduleKey: 'dom_agent',
        name: 'DOM Agent',
        title: 'DOM Agent — Hội đồng Trợ lý AI Điều hành',
        subtitle: '80 công cụ phân tích & đề xuất thao tác chuẩn RBAC',
        route: '/dom-agent',
        icon: Bot,
        groupTitle: 'NHÂN SỰ, DỰ ÁN & ERP',
      },
      {
        screenKey: 'erp_education',
        moduleKey: 'education_addon',
        name: 'Học vụ',
        title: 'Đào tạo & Quản lý Học vụ (Add-on)',
        subtitle: 'Lớp học, lịch giảng viên & bảng điểm chuyên biệt',
        route: '/erp/education',
        icon: GraduationCap,
        groupTitle: 'NHÂN SỰ, DỰ ÁN & ERP',
      },
      {
        screenKey: 'integrations',
        moduleKey: 'integrations_autodata',
        name: 'Tích hợp Bot',
        title: 'Tích hợp Webhook, Sheets & ZaloBot',
        subtitle: 'Cấu hình đồng bộ 2 chiều & cảnh báo Telegram',
        route: '/integrations',
        icon: Link2,
        shortcut: 'Alt + I',
        groupTitle: 'CÀI ĐẶT & HỆ THỐNG',
      },
      {
        screenKey: 'marketing_connect',
        moduleKey: 'integrations_marketing',
        name: 'Kết nối SES/ZNS',
        title: 'Kênh gửi AWS SES, DKIM/SPF & Zalo ZNS',
        subtitle: 'Kho khóa mã hóa riêng theo từng doanh nghiệp',
        route: '/marketing-connect',
        icon: ShieldCheck,
        shortcut: 'Alt + K',
        groupTitle: 'CÀI ĐẶT & HỆ THỐNG',
      },
      {
        screenKey: 'accounts',
        moduleKey: 'users',
        name: 'Tài khoản RBAC',
        title: 'Quản lý Tài khoản & Vai trò',
        subtitle: 'Cấp tài khoản, vai trò động & cấu hình 2FA',
        route: '/accounts',
        icon: Users,
        shortcut: 'Alt + A',
        groupTitle: 'CÀI ĐẶT & HỆ THỐNG',
      },
      {
        screenKey: 'settings',
        moduleKey: 'settings',
        name: 'Cài đặt',
        title: 'Cài đặt Hệ thống (10 Nhóm Zero-Hardcode)',
        subtitle: 'Tổ chức, Phân quyền RBAC, Từ điển, Chấm công GPS & Gói cước',
        route: '/settings',
        icon: Settings,
        shortcut: 'Alt + O',
        groupTitle: 'CÀI ĐẶT & HỆ THỐNG',
      },
    ];

    return items.filter(
      (item) =>
        hasModule(item.moduleKey) &&
        can(item.moduleKey, 'view') &&
        canScreen(item.screenKey)
    );
  }, [
    packageCode,
    terminology.customerLabel,
    terminology.dealLabel,
    terminology.projectLabel,
    terminology.consultantLabel,
    hasModule,
    can,
    canScreen,
  ]);

  const recentQuickLaunch = useMemo(() => {
    const candidates: Array<{
      screenKey: string;
      moduleKey: string;
      label: string;
      route: string;
      icon: LucideIcon;
    }> = [
      { screenKey: 'dashboard', moduleKey: 'crm_dashboard', label: 'Dashboard', route: '/', icon: LayoutDashboard },
      { screenKey: 'data_list', moduleKey: 'leads', label: 'Data CRM', route: '/data', icon: Database },
      { screenKey: 'contacts', moduleKey: 'leads', label: terminology.customerLabel || 'Khách hàng', route: '/contacts', icon: UserCheck },
      { screenKey: 'deals', moduleKey: 'deals', label: 'Pipeline', route: '/deals', icon: TrendingUp },
      { screenKey: 'audiences', moduleKey: 'audiences', label: 'Tệp Logic', route: '/audiences', icon: Layers },
      { screenKey: 'workspace', moduleKey: 'erp_projects_tasks', label: 'Bàn làm việc', route: '/workspace', icon: CheckSquare },
      { screenKey: 'erp_approvals', moduleKey: 'erp_approvals', label: 'Phê duyệt', route: '/erp/approvals', icon: CheckSquare },
      { screenKey: 'erp_attendance', moduleKey: 'erp_attendance', label: 'Chấm công', route: '/erp/attendance', icon: MapPin },
      { screenKey: 'erp_workchat', moduleKey: 'erp_workchat', label: 'WorkChat', route: '/erp/workchat', icon: MessageSquare },
      { screenKey: 'dom_agent', moduleKey: 'dom_agent', label: 'DOM Agent', route: '/dom-agent', icon: Bot },
    ];
    return candidates
      .filter((c) => hasModule(c.moduleKey) && can(c.moduleKey, 'view') && canScreen(c.screenKey))
      .slice(0, 8);
  }, [hasModule, can, canScreen, terminology.customerLabel]);

  const quickActionsList = useMemo<PaletteItem[]>(() => {
    const list: PaletteItem[] = [];
    if (canQuickAction('quick_add_lead')) {
      list.push({
        id: 'action_create_lead',
        group: 'actions',
        title: `Thêm ${terminology.customerLabel || 'Khách hàng'} / Lead mới`,
        subtitle: 'Nhập thông tin liên hệ mới vào hệ thống CRM & chia vòng',
        badge: 'Tác vụ',
        badgeColor: '#1E40FF',
        badgeBg: 'rgba(30, 64, 255, 0.10)',
        icon: Plus,
        action: () => {
          setOpen(false);
          window.dispatchEvent(new CustomEvent('open-quick-add-lead'));
        },
      });
    }
    if (canQuickAction('create_audience')) {
      list.push({
        id: 'action_create_audience',
        group: 'actions',
        title: 'Mở Tệp Data & Tạo Tệp Logic',
        subtitle: 'Phân khúc khách hàng tự động theo quy tắc AND/OR',
        badge: 'Marketing',
        badgeColor: '#0284C7',
        badgeBg: 'rgba(2, 132, 199, 0.10)',
        icon: Layers,
        action: () => {
          setOpen(false);
          navigate('/audiences');
        },
      });
    }
    if (canQuickAction('create_expense')) {
      list.push({
        id: 'action_create_expense',
        group: 'actions',
        title: 'Tạo phiếu chi phí / tạm ứng mới',
        subtitle: 'Mở phân hệ Chi phí để lập đề xuất thanh toán',
        badge: 'Tài chính',
        badgeColor: '#D97706',
        badgeBg: 'rgba(217, 119, 6, 0.12)',
        icon: Wallet,
        action: () => {
          setOpen(false);
          window.dispatchEvent(new CustomEvent('open-expense-create-drawer', { detail: {} }));
          navigate('/expenses');
        },
      });
    }
    if (canQuickAction('create_deposit')) {
      list.push({
        id: 'action_create_deposit',
        group: 'actions',
        title: 'Tạo phiếu đặt cọc / Thu tiền mới',
        subtitle: 'Lập phiếu thu tiền đặt cọc giữ chỗ & hợp đồng',
        badge: 'Tài chính',
        badgeColor: '#059669',
        badgeBg: 'rgba(16, 185, 129, 0.12)',
        icon: CreditCard,
        action: () => {
          setOpen(false);
          window.dispatchEvent(new CustomEvent('open-deposit-create-drawer', { detail: {} }));
          navigate('/deposits');
        },
      });
    }
    if (canQuickAction('create_approval')) {
      list.push({
        id: 'action_create_approval',
        group: 'actions',
        title: 'Nộp đơn đề xuất / Xin phê duyệt',
        subtitle: 'Tạo đơn nghỉ phép, OT, tạm ứng hoặc duyệt chi N cấp',
        badge: 'Phê duyệt',
        badgeColor: '#1E40FF',
        badgeBg: 'rgba(30, 64, 255, 0.10)',
        icon: CheckSquare,
        action: () => {
          setOpen(false);
          navigate('/erp/approvals');
        },
      });
    }
    list.push(
      {
        id: 'action_activity_feed',
        group: 'actions',
        title: 'Mở Bản tin Hoạt động & Nhật ký Gửi Tin',
        subtitle: 'Theo dõi phân bổ Lead & log gửi Zalo/Email theo thời gian thực',
        badge: 'Hệ thống',
        badgeColor: '#0284C7',
        badgeBg: 'rgba(2, 132, 199, 0.10)',
        icon: Activity,
        action: () => {
          setOpen(false);
          window.dispatchEvent(new CustomEvent('open-activity-feed'));
        },
      },
      {
        id: 'action_notification_settings',
        group: 'actions',
        title: 'Cấu hình Thông báo Cá nhân (Zalo / Telegram / Email)',
        subtitle: 'Bật tắt ma trận sự kiện nhận tin theo từng kênh',
        badge: 'Cài đặt',
        badgeColor: '#1E40FF',
        badgeBg: 'rgba(30, 64, 255, 0.10)',
        icon: Bell,
        action: () => {
          setOpen(false);
          window.dispatchEvent(new CustomEvent('open-notification-settings'));
        },
      },
      {
        id: 'action_toggle_theme',
        group: 'actions',
        title: 'Chuyển đổi Giao diện Sáng / Tối (Toggle Theme)',
        subtitle: 'Chuyển nhanh giữa Bright Royal Sapphire và Dark Mode',
        badge: 'Giao diện',
        badgeColor: '#4F46E5',
        badgeBg: 'rgba(79, 70, 229, 0.12)',
        icon: SunMoon,
        action: () => {
          setOpen(false);
          const cur = document.documentElement.getAttribute('data-theme') || 'light';
          const next = cur === 'dark' ? 'light' : 'dark';
          document.documentElement.setAttribute('data-theme', next);
          localStorage.setItem('domation_theme', next);
          window.dispatchEvent(new Event('theme-change'));
          toast.success(next === 'dark' ? 'Đã bật chế độ Tối' : 'Đã bật chế độ Sáng Royal Sapphire');
        },
      },
      {
        id: 'action_keyboard_shortcuts',
        group: 'actions',
        title: 'Bảng tra cứu phím tắt điều hướng nhanh',
        subtitle: 'Xem toàn bộ phím tắt tăng tốc (Ctrl+K, Alt+D/L/M/O...)',
        badge: 'Trợ giúp',
        badgeColor: '#475569',
        badgeBg: '#F1F5F9',
        icon: Keyboard,
        action: () => {
          setOpen(false);
          window.dispatchEvent(new CustomEvent('open-keyboard-shortcuts'));
        },
      },
      {
        id: 'action_open_billing',
        group: 'actions',
        title: 'Quản lý Gói cước 4 Gói SaaS & Ví thanh toán',
        subtitle: 'Chuyển đổi gói tức thì không mất dữ liệu (0s Migrate)',
        badge: 'Billing',
        badgeColor: '#1E40FF',
        badgeBg: 'rgba(30, 64, 255, 0.10)',
        icon: Sparkles,
        action: () => {
          setOpen(false);
          if (openBilling) openBilling();
          else auth.openBilling();
        },
      }
    );
    return list;
  }, [canQuickAction, terminology.customerLabel, navigate, openBilling, auth]);

  // Debounced search across /search/global or legacy lead logs
  useEffect(() => {
    const trimmed = search.trim();
    if (!open || !trimmed || trimmed.startsWith('>')) {
      return undefined;
    }

    let cancelled = false;
    queueMicrotask(() => {
      if (!cancelled) {
        setLoading(true);
      }
    });
    const timer = setTimeout(async () => {
      try {
        let grouped: GlobalSearchApiResponse['grouped'] | undefined;
        try {
          const globalRes = await apiRequest<GlobalSearchApiResponse>(
            `/search/global?q=${encodeURIComponent(trimmed)}`,
            { token, tenantSlug }
          );
          grouped = globalRes?.grouped;
        } catch {
          // Fallback to legacy lead search
        }

        if (!grouped) {
          const legacyRes = await fetchAPI(
            `get_logs&search=${encodeURIComponent(trimmed)}&page=1&pageSize=6`
          ).catch(() => null);
          const rows = Array.isArray(legacyRes?.data) ? legacyRes.data : [];
          grouped = {
            contacts: rows.slice(0, 6),
            tasks: [],
            approvals: [],
            companies: [],
          };
        }

        if (!cancelled) {
          setBackendResults({
            contacts: Array.isArray(grouped.contacts) ? grouped.contacts : [],
            tasks: Array.isArray(grouped.tasks) ? grouped.tasks : [],
            approvals: Array.isArray(grouped.approvals) ? grouped.approvals : [],
            companies: Array.isArray(grouped.companies) ? grouped.companies : [],
          });
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }, 160);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [search, open, token, tenantSlug]);

  const canUnmask = can('leads', 'unmask_phone');

  const combinedItems = useMemo<PaletteItem[]>(() => {
    const items: PaletteItem[] = [];
    const isActionPrompt = search.startsWith('>');
    const actionQuery = isActionPrompt ? search.slice(1).trim().toLowerCase() : '';
    const lowerQuery = search.trim().toLowerCase();

    const matchedActions = quickActionsList.filter((act) => {
      const targetQ = isActionPrompt ? actionQuery : lowerQuery;
      if (!targetQ) return true;
      return (
        act.title.toLowerCase().includes(targetQ) ||
        (act.subtitle || '').toLowerCase().includes(targetQ)
      );
    });
    items.push(...matchedActions);

    if (isActionPrompt) return items;

    backendResults.contacts.forEach((c, idx) => {
      const id = String(c.id || idx);
      const name = String(c.label || c.full_name || c.lead_name || c.name || `Khách hàng #${id}`);
      const phone = c.phone ? maskPiiPhone(String(c.phone), canUnmask) : '';
      const sub = String(
        c.sublabel ||
          [phone, c.stage_name || c.status || c.source].filter(Boolean).join(' • ') ||
          'Hồ sơ Khách hàng'
      );
      items.push({
        id: `contact_${id}`,
        group: 'contacts',
        title: name,
        subtitle: sub,
        badge: terminology.customerLabel || 'Khách hàng',
        badgeColor: '#059669',
        badgeBg: 'rgba(16, 185, 129, 0.12)',
        icon: UserCheck,
        action: () => {
          setOpen(false);
          window.dispatchEvent(
            new CustomEvent('open-customer-drawer', { detail: { id, raw: c.raw || c, tab: 'info' } })
          );
          navigate(
            canScreen('contacts')
              ? `/contacts?search=${encodeURIComponent(String(c.phone || name))}`
              : `/data?search=${encodeURIComponent(String(c.phone || name))}`
          );
        },
      });
    });

    backendResults.tasks.forEach((tItem, idx) => {
      const id = String(tItem.id || idx);
      items.push({
        id: `task_${id}`,
        group: 'tasks',
        title: String(tItem.label || tItem.subject || `Công việc #${id}`),
        subtitle: String(tItem.sublabel || `#${id} • ${tItem.status || 'todo'}`),
        badge: 'Công việc',
        badgeColor: '#4F46E5',
        badgeBg: 'rgba(79, 70, 229, 0.12)',
        icon: FolderKanban,
        action: () => {
          setOpen(false);
          window.dispatchEvent(new CustomEvent('open-task-drawer', { detail: tItem.raw || tItem }));
          navigate(canScreen('workspace') ? '/workspace' : '/erp/projects');
        },
      });
    });

    backendResults.approvals.forEach((a, idx) => {
      const id = String(a.id || idx);
      items.push({
        id: `approval_${id}`,
        group: 'approvals',
        title: String(a.label || a.title || `Đề xuất #${id}`),
        subtitle: String(a.sublabel || `Đơn #${id} • ${a.status || 'pending'}`),
        badge: 'Phê duyệt',
        badgeColor: '#DC2626',
        badgeBg: 'rgba(220, 38, 38, 0.10)',
        icon: CheckSquare,
        action: () => {
          setOpen(false);
          navigate(`/erp/approvals?open_id=${encodeURIComponent(id)}`);
        },
      });
    });

    backendResults.companies.forEach((co, idx) => {
      const id = String(co.id || idx);
      items.push({
        id: `company_${id}`,
        group: 'companies',
        title: String(co.label || co.name || `Đối tác #${id}`),
        subtitle: String(co.sublabel || 'Doanh nghiệp & Đối tác B2B'),
        badge: 'Đối tác',
        badgeColor: '#0284C7',
        badgeBg: 'rgba(2, 132, 199, 0.12)',
        icon: Building2,
        action: () => {
          setOpen(false);
          navigate('/companies');
        },
      });
    });

    allNavItems.forEach((nav) => {
      if (
        !lowerQuery ||
        nav.title.toLowerCase().includes(lowerQuery) ||
        nav.subtitle.toLowerCase().includes(lowerQuery) ||
        nav.name.toLowerCase().includes(lowerQuery)
      ) {
        items.push({
          id: `nav_${nav.route}_${nav.screenKey}`,
          group: 'navigation',
          groupTitle: nav.groupTitle,
          title: nav.title,
          subtitle: nav.subtitle,
          badge: nav.shortcut || 'Trang',
          badgeColor: '#475569',
          badgeBg: '#F1F5F9',
          icon: nav.icon,
          action: () => {
            setOpen(false);
            navigate(nav.route);
          },
        });
      }
    });

    return items;
  }, [
    search,
    quickActionsList,
    backendResults,
    allNavItems,
    canUnmask,
    terminology.customerLabel,
    canScreen,
    navigate,
  ]);

  const effectiveSelectedIndex =
    combinedItems.length > 0 ? Math.min(selectedIndex, combinedItems.length - 1) : 0;

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev < combinedItems.length - 1 ? prev + 1 : 0));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : Math.max(0, combinedItems.length - 1)));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (combinedItems[effectiveSelectedIndex]) {
          combinedItems[effectiveSelectedIndex].action();
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        setOpen(false);
      }
    },
    [combinedItems, effectiveSelectedIndex]
  );

  useEffect(() => {
    if (listRef.current) {
      const activeEl = listRef.current.querySelector('.spotlight-item-active') as HTMLElement | null;
      if (activeEl) {
        activeEl.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    }
  }, [effectiveSelectedIndex]);

  const groupedSections = useMemo(() => {
    const groups: Record<string, { label: string; items: Array<{ item: PaletteItem; index: number }> }> = {};
    combinedItems.forEach((item, index) => {
      let gKey: string = item.group;
      let gLabel = 'Kết quả';
      if (item.group === 'actions') {
        gKey = 'actions';
        gLabel = 'Hành động nhanh (Quick Actions)';
      } else if (item.group === 'contacts') {
        gKey = 'contacts';
        gLabel = `${terminology.customerLabel || 'Khách hàng'} & Lead`;
      } else if (item.group === 'tasks') {
        gKey = 'tasks';
        gLabel = 'Công việc & Nhiệm vụ';
      } else if (item.group === 'approvals') {
        gKey = 'approvals';
        gLabel = 'Đơn Phê duyệt';
      } else if (item.group === 'companies') {
        gKey = 'companies';
        gLabel = 'Doanh nghiệp & Đối tác';
      } else if (item.group === 'navigation') {
        gKey = item.groupTitle || 'ĐIỀU HƯỚNG HỆ THỐNG';
        gLabel = item.groupTitle || 'ĐIỀU HƯỚNG HỆ THỐNG';
      }
      if (!groups[gKey]) {
        groups[gKey] = { label: gLabel, items: [] };
      }
      groups[gKey].items.push({ item, index });
    });

    return Object.entries(groups)
      .filter(([, g]) => g.items.length > 0)
      .sort(([a], [b]) => {
        if (a === 'actions') return -1;
        if (b === 'actions') return 1;
        return 0;
      });
  }, [combinedItems, terminology.customerLabel]);

  if (typeof document === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Tìm kiếm toàn hệ thống DOMATION"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 2147483645,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1.25rem',
          }}
        >
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            style={{
              position: 'absolute',
              inset: 0,
              background: 'rgba(15, 23, 42, 0.45)',
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)',
            }}
            onClick={() => setOpen(false)}
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 6 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 6 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            style={{
              position: 'relative',
              width: '100%',
              maxWidth: 780,
              background: '#FFFFFF',
              borderRadius: 22,
              boxShadow: '0 28px 72px -12px rgba(30, 64, 255, 0.24), 0 12px 28px -8px rgba(15, 23, 42, 0.16)',
              overflow: 'hidden',
              border: '1px solid #E2E8F0',
              display: 'flex',
              flexDirection: 'column',
              maxHeight: 'min(86vh, 660px)',
            }}
            onKeyDown={handleKeyDown}
          >
            {/* Search Input Bar */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: '1rem 1.25rem',
                borderBottom: '1px solid #E2E8F0',
                background: '#FFFFFF',
                gap: 12,
              }}
            >
              {loading ? (
                <Loader2 size={21} className="spin" style={{ color: '#1E40FF', flexShrink: 0 }} />
              ) : search.startsWith('>') ? (
                <Zap size={21} style={{ color: '#D97706', flexShrink: 0 }} />
              ) : (
                <Search size={21} style={{ color: '#1E40FF', flexShrink: 0 }} />
              )}

              <input
                ref={inputRef}
                value={search}
                onChange={(e) => {
                  const next = e.target.value;
                  setSearch(next);
                  setSelectedIndex(0);
                  if (!next.trim() || next.trim().startsWith('>')) {
                    setLoading(false);
                    setBackendResults({ contacts: [], tasks: [], approvals: [], companies: [] });
                  }
                }}
                placeholder={
                  search.startsWith('>')
                    ? 'Nhập tên tác vụ nhanh (Thêm Lead, Tạo Tệp, Đổi giao diện...)'
                    : 'Tìm SĐT, Khách hàng, phân hệ hoặc gõ > để mở Tác vụ nhanh...'
                }
                style={{
                  flex: 1,
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  fontSize: '1rem',
                  fontWeight: 500,
                  color: '#0F172A',
                  minHeight: 40,
                }}
              />

              {search.startsWith('>') && (
                <span
                  style={{
                    fontSize: '0.6875rem',
                    fontWeight: 700,
                    color: '#D97706',
                    background: 'rgba(217, 119, 6, 0.12)',
                    padding: '4px 9px',
                    borderRadius: 8,
                    whiteSpace: 'nowrap',
                  }}
                >
                  Chế độ Tác vụ
                </span>
              )}

              {search && (
                <button
                  type="button"
                  onClick={() => {
                    setSearch('');
                    setSelectedIndex(0);
                    setLoading(false);
                    setBackendResults({ contacts: [], tasks: [], approvals: [], companies: [] });
                  }}
                  style={{
                    background: '#F1F5F9',
                    border: 'none',
                    borderRadius: '50%',
                    width: 26,
                    height: 26,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    color: '#64748B',
                  }}
                  title="Xóa từ khóa"
                >
                  <X size={14} />
                </button>
              )}

              <kbd className="spotlight-badge-kbd">ESC</kbd>
            </div>

            {/* Results Area */}
            <div
              ref={listRef}
              className="custom-scrollbar"
              style={{
                padding: '0.85rem 1.1rem',
                overflowY: 'auto',
                flex: 1,
                maxHeight: 520,
              }}
            >
              {!search.trim() && recentQuickLaunch.length > 0 && (
                <div
                  style={{
                    marginBottom: '1.15rem',
                    paddingBottom: '1rem',
                    borderBottom: '1px solid #F1F5F9',
                  }}
                >
                  <div
                    style={{
                      fontSize: '0.7rem',
                      fontWeight: 800,
                      color: '#64748B',
                      textTransform: 'uppercase',
                      letterSpacing: '0.07em',
                      marginBottom: 10,
                      paddingLeft: 4,
                    }}
                  >
                    Truy cập nhanh theo quyền hạn
                  </div>
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(84px, 1fr))',
                      gap: 10,
                    }}
                  >
                    {recentQuickLaunch.map((item) => {
                      const QuickIcon = item.icon;
                      return (
                        <button
                          key={item.route}
                          type="button"
                          onClick={() => {
                            setOpen(false);
                            navigate(item.route);
                          }}
                          style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            padding: '12px 8px',
                            background: '#F8FAFF',
                            border: '1px solid #E2E8F0',
                            borderRadius: 14,
                            cursor: 'pointer',
                            textAlign: 'center',
                            gap: 8,
                            transition: 'all 0.16s ease',
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.borderColor = '#1E40FF';
                            e.currentTarget.style.background = '#EFF6FF';
                            e.currentTarget.style.transform = 'translateY(-2px)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.borderColor = '#E2E8F0';
                            e.currentTarget.style.background = '#F8FAFF';
                            e.currentTarget.style.transform = 'translateY(0)';
                          }}
                        >
                          <div
                            style={{
                              width: 36,
                              height: 36,
                              borderRadius: 10,
                              background: '#FFFFFF',
                              border: '1px solid #DBEAFE',
                              color: '#1E40FF',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            <QuickIcon size={18} />
                          </div>
                          <span
                            style={{
                              fontSize: '0.74rem',
                              fontWeight: 700,
                              color: '#0F172A',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              width: '100%',
                            }}
                          >
                            {item.label}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {combinedItems.length > 0 ? (
                groupedSections.map(([groupKey, group]) => (
                  <div key={groupKey} style={{ marginBottom: '0.95rem' }}>
                    <div
                      style={{
                        fontSize: '0.7rem',
                        fontWeight: 800,
                        color: '#64748B',
                        padding: '0.35rem 0.6rem',
                        textTransform: 'uppercase',
                        letterSpacing: '0.07em',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}
                    >
                      <span>{group.label}</span>
                      <span style={{ fontSize: '0.66rem', color: '#94A3B8' }}>{group.items.length}</span>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      {group.items.map(({ item, index }) => {
                        const isSelected = index === effectiveSelectedIndex;
                        const ItemIcon = item.icon;
                        return (
                          <div
                            key={item.id}
                            className={`spotlight-item ${isSelected ? 'spotlight-item-active' : ''}`}
                            onClick={item.action}
                            onMouseEnter={() => setSelectedIndex(index)}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 12,
                              padding: '0.65rem 0.9rem',
                              borderRadius: 12,
                              cursor: 'pointer',
                              transition: 'all 0.12s ease-in-out',
                              background: isSelected ? 'rgba(30, 64, 255, 0.08)' : 'transparent',
                              color: isSelected ? '#1E40FF' : '#0F172A',
                              border: isSelected ? '1px solid rgba(30, 64, 255, 0.35)' : '1px solid transparent',
                            }}
                          >
                            <div
                              style={{
                                width: 34,
                                height: 34,
                                borderRadius: 10,
                                background: isSelected ? '#1E40FF' : '#F8FAFF',
                                color: isSelected ? '#FFFFFF' : '#1E40FF',
                                border: isSelected ? 'none' : '1px solid #E2E8F0',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexShrink: 0,
                              }}
                            >
                              <ItemIcon size={17} />
                            </div>

                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div
                                style={{
                                  fontWeight: 700,
                                  fontSize: '0.86rem',
                                  whiteSpace: 'nowrap',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  color: isSelected ? '#1E40FF' : '#0F172A',
                                }}
                              >
                                {item.title}
                              </div>
                              {item.subtitle && (
                                <div
                                  style={{
                                    fontSize: '0.75rem',
                                    color: '#64748B',
                                    whiteSpace: 'nowrap',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    marginTop: 2,
                                  }}
                                >
                                  {item.subtitle}
                                </div>
                              )}
                            </div>

                            {item.badge && (
                              <span
                                style={{
                                  fontSize: '0.68rem',
                                  padding: '3px 8px',
                                  borderRadius: 6,
                                  background: item.badgeBg || '#F1F5F9',
                                  color: item.badgeColor || '#475569',
                                  fontWeight: 700,
                                  flexShrink: 0,
                                }}
                              >
                                {item.badge}
                              </span>
                            )}

                            <ChevronRight
                              size={15}
                              style={{
                                opacity: isSelected ? 0.95 : 0.3,
                                flexShrink: 0,
                                color: isSelected ? '#1E40FF' : '#64748B',
                              }}
                            />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))
              ) : (
                <div style={{ padding: '3rem 1rem', textAlign: 'center', color: '#64748B' }}>
                  <div
                    style={{
                      display: 'inline-flex',
                      padding: 14,
                      borderRadius: '50%',
                      background: '#F1F5F9',
                      marginBottom: 12,
                      color: '#1E40FF',
                    }}
                  >
                    <Search size={26} />
                  </div>
                  <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#0F172A' }}>
                    Không tìm thấy kết quả phù hợp cho &quot;{search}&quot;
                  </div>
                  <div style={{ fontSize: '0.8rem', marginTop: 6 }}>
                    Mẹo: Nhập SĐT khách hàng, tên phân hệ, hoặc gõ &gt; để mở Tác vụ nhanh
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.7rem 1.25rem',
                background: '#F8FAFF',
                borderTop: '1px solid #E2E8F0',
                fontSize: '0.74rem',
                color: '#64748B',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                  <kbd className="spotlight-badge-kbd">&gt;</kbd>
                  <span style={{ color: '#D97706', fontWeight: 700 }}>tác vụ nhanh</span>
                </span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                  <kbd className="spotlight-badge-kbd">↑</kbd>
                  <kbd className="spotlight-badge-kbd">↓</kbd>
                  <span>chọn</span>
                </span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                  <kbd className="spotlight-badge-kbd">Enter</kbd>
                  <span>mở ngay</span>
                </span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                  <kbd className="spotlight-badge-kbd">ESC</kbd>
                  <span>đóng</span>
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700, color: '#1E40FF' }}>
                <Command size={13} />
                <span>DOMATION Spotlight</span>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
};
