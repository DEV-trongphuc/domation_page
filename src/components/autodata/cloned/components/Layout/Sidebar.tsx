import React, { Fragment, useEffect, useMemo, useRef, useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  Bot,
  Briefcase,
  Building2,
  Calculator,
  Calendar,
  CheckSquare,
  ChevronLeft,
  ClipboardCheck,
  Compass,
  Contact,
  Database,
  DollarSign,
  FileCheck2,
  FileSpreadsheet,
  FileText,
  Filter,
  FolderKanban,
  GitBranch,
  Globe,
  GraduationCap,
  Handshake,
  Layers,
  LayoutDashboard,
  LifeBuoy,
  Link2,
  Mail,
  MapPin,
  Megaphone,
  MessageCircle,
  MessageSquare,
  Newspaper,
  Package,
  Plus,
  QrCode,
  Receipt,
  Scale,
  Send,
  Settings,
  ShieldCheck,
  Ticket,
  TrendingUp,
  Truck,
  UserCog,
  Users,
  Wallet,
  Webhook,
  Workflow,
  Boxes,
  type LucideIcon,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useEntitlement } from '../../contexts/EntitlementContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { fetchAPI } from '../../utils/api';
import { DomationLogoMark } from '../../../../DomationLogoMark';

interface SidebarNavItem {
  name: string;
  href: string;
  icon: LucideIcon;
  section: string;
  moduleKey: string;
  screenKey: string;
  end?: boolean;
  ownerRecovery?: boolean;
  badgeKey?: 'tickets' | 'gatekeeper';
}

export const Sidebar = ({
  isCollapsed,
  onToggleCollapse,
  isMobileOpen,
  onMobileClose,
}: {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  isMobileOpen?: boolean;
  onMobileClose?: () => void;
}) => {
  const { companyName, tenantSlug, tenantSettings } = useAuth();
  const {
    packageCode,
    packageMeta,
    hasModule,
    educationAddon,
    terminology,
    can,
    canScreen,
    canQuickAction,
    isTenantOwner,
  } = useEntitlement();
  const { t } = useLanguage();
  const location = useLocation();
  const navigate = useNavigate();

  const [pendingTickets, setPendingTickets] = useState(0);
  const [heldLeadsCount, setHeldLeadsCount] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [logoErrorUrl, setLogoErrorUrl] = useState<string | null>(null);

  const [sliderStyle, setSliderStyle] = useState({ top: 0, height: 0 });
  const navContainerRef = useRef<HTMLDivElement>(null);

  const hasSaleTickets = hasModule('tickets_data');
  const canPollModerationCounters =
    isTenantOwner || can('tickets_data', 'approve') || canScreen('tickets') || canScreen('gatekeeper');

  useEffect(() => {
    const timer = setTimeout(() => {
      if (navContainerRef.current) {
        const activeElement = navContainerRef.current.querySelector('.active') as HTMLElement | null;
        if (activeElement) {
          setSliderStyle({
            top: activeElement.offsetTop,
            height: activeElement.offsetHeight,
          });
        } else {
          setSliderStyle({ top: 0, height: 0 });
        }
      }
    }, 60);
    return () => clearTimeout(timer);
  }, [location.pathname, isCollapsed, packageCode]);

  // Poll pending ticket count every 60s when moderation screens are permitted
  useEffect(() => {
    if (!hasSaleTickets || !canPollModerationCounters) return;
    const fetchPending = async () => {
      try {
        const [resReports, resHeld] = await Promise.all([
          fetchAPI('get_reports&status=pending&date=all&pageSize=1'),
          fetchAPI('get_held_leads&pageSize=1&date=all'),
        ]);

        let countReports = 0;
        let countHeld = 0;

        if (resReports && resReports.success) {
          countReports =
            resReports.stats?.pending ??
            (Array.isArray(resReports?.data)
              ? resReports.data.filter((r: { status?: string }) => r?.status === 'pending').length
              : 0);
        }

        if (resHeld && resHeld.success) {
          countHeld = resHeld.total_count ?? 0;
        }

        setPendingTickets(countReports);
        setHeldLeadsCount(countHeld);
      } catch {
        // silent
      }
    };
    void fetchPending();
    const interval = setInterval(() => void fetchPending(), 60000);
    const onResolved = () => void fetchPending();
    window.addEventListener('ticket-resolved', onResolved);
    return () => {
      clearInterval(interval);
      window.removeEventListener('ticket-resolved', onResolved);
    };
  }, [hasSaleTickets, canPollModerationCounters]);

  const navItems = useMemo<SidebarNavItem[]>(() => {
    const isMktOnly = packageCode === 'marketing_standalone';
    const items: SidebarNavItem[] = [];

    if (isMktOnly) {
      items.push(
        {
          name: 'Dashboard Marketing',
          href: '/',
          icon: LayoutDashboard,
          section: 'Marketing Automation',
          moduleKey: 'mkt_dashboard',
          screenKey: 'mkt_dashboard',
          end: true,
        },
        {
          name: `${terminology.customerLabel} & Tệp Data/Logic`,
          href: '/audiences',
          icon: Layers,
          section: 'Marketing Automation',
          moduleKey: 'audiences',
          screenKey: 'audiences',
        },
        {
          name: 'Email Templates',
          href: '/marketing/templates',
          icon: Mail,
          section: 'Marketing Automation',
          moduleKey: 'email_templates',
          screenKey: 'mkt_templates',
        },
        {
          name: 'Form Builder & Form Cards',
          href: '/marketing/forms',
          icon: FileText,
          section: 'Marketing Automation',
          moduleKey: 'forms_triggers',
          screenKey: 'mkt_forms',
        },
        {
          name: 'Surveys & Quiz',
          href: '/marketing/surveys',
          icon: ClipboardCheck,
          section: 'Marketing Automation',
          moduleKey: 'surveys_quiz',
          screenKey: 'mkt_surveys',
        },
        {
          name: 'Chiến dịch Email / ZNS',
          href: '/marketing/campaigns',
          icon: Send,
          section: 'Marketing Automation',
          moduleKey: 'campaigns',
          screenKey: 'mkt_campaigns',
        },
        {
          name: 'Automation Flows',
          href: '/marketing/flows',
          icon: Workflow,
          section: 'Marketing Automation',
          moduleKey: 'automation_flows',
          screenKey: 'mkt_flows',
        },
        {
          name: 'Voucher & QR',
          href: '/marketing/vouchers',
          icon: QrCode,
          section: 'Marketing Automation',
          moduleKey: 'vouchers_qr',
          screenKey: 'mkt_vouchers',
        },
        {
          name: 'Web Tracking',
          href: '/marketing/web-tracking',
          icon: Globe,
          section: 'Marketing Automation',
          moduleKey: 'web_tracking',
          screenKey: 'mkt_web_tracking',
        },
        {
          name: 'Social Bot',
          href: '/marketing/social-bot',
          icon: MessageCircle,
          section: 'Marketing Automation',
          moduleKey: 'social_bot',
          screenKey: 'mkt_social_bot',
        },
        {
          name: 'Kết nối SES / ZNS / SDK',
          href: '/marketing-connect',
          icon: ShieldCheck,
          section: 'Kết nối & Hệ thống',
          moduleKey: 'integrations_marketing',
          screenKey: 'marketing_connect',
        },
        {
          name: 'Tài khoản Cá nhân',
          href: '/account',
          icon: UserCog,
          section: 'Kết nối & Hệ thống',
          moduleKey: 'settings',
          screenKey: 'account',
        },
        {
          name: 'Quản lý Tài khoản',
          href: '/accounts',
          icon: Users,
          section: 'Kết nối & Hệ thống',
          moduleKey: 'users',
          screenKey: 'accounts',
          ownerRecovery: true,
        },
        {
          name: 'Cài đặt hệ thống',
          href: '/settings',
          icon: Settings,
          section: 'Kết nối & Hệ thống',
          moduleKey: 'settings',
          screenKey: 'settings',
          ownerRecovery: true,
        }
      );
    } else {
      // Gói 1 (autodata_crm), Gói 3 (growth_combo), Gói 4 (domation_promax)
      items.push({
        name: 'Dashboard',
        href: '/',
        icon: LayoutDashboard,
        section: 'Auto Data & CRM',
        moduleKey: 'crm_dashboard',
        screenKey: 'dashboard',
        end: true,
      });

      if (hasModule('erp_projects_tasks')) {
        items.push({
          name: 'Bàn làm việc Cá nhân',
          href: '/workspace',
          icon: Compass,
          section: 'Auto Data & CRM',
          moduleKey: 'erp_projects_tasks',
          screenKey: 'workspace',
        });
      }

      if (hasModule('growth_attribution')) {
        items.push({
          name: 'Doanh thu & ROAS Xuyên Phễu',
          href: '/growth-attribution',
          icon: TrendingUp,
          section: 'Auto Data & CRM',
          moduleKey: 'growth_attribution',
          screenKey: 'growth_attribution',
        });
      }

      items.push(
        {
          name: 'Quản lý Data',
          href: '/data',
          icon: Database,
          section: 'Auto Data & CRM',
          moduleKey: 'leads',
          screenKey: 'data_list',
        },
        {
          name: 'Lịch hẹn & Hôm nay',
          href: '/calendar',
          icon: Calendar,
          section: 'Auto Data & CRM',
          moduleKey: 'leads',
          screenKey: 'calendar',
        },
        {
          name: 'Khách hàng 360°',
          href: '/contacts',
          icon: Contact,
          section: 'Auto Data & CRM',
          moduleKey: 'leads',
          screenKey: 'contacts',
        },
        {
          name: 'Pipeline Deals Kanban',
          href: '/deals',
          icon: Briefcase,
          section: 'Auto Data & CRM',
          moduleKey: 'deals',
          screenKey: 'deals',
        },
        {
          name: 'Doanh nghiệp B2B',
          href: '/companies',
          icon: Building2,
          section: 'Auto Data & CRM',
          moduleKey: 'companies',
          screenKey: 'companies',
        },
        {
          name: 'Hoạt động & Nhắc việc',
          href: '/activities',
          icon: CheckSquare,
          section: 'Auto Data & CRM',
          moduleKey: 'leads',
          screenKey: 'activities',
        },
        {
          name: 'Hiệu suất Quảng cáo',
          href: '/ads-performance',
          icon: Megaphone,
          section: 'Auto Data & CRM',
          moduleKey: 'ads_capi',
          screenKey: 'ads_performance',
        },
        {
          name: 'Ticket Lỗi Data',
          href: '/tickets',
          icon: Ticket,
          section: 'Auto Data & CRM',
          moduleKey: 'tickets_data',
          screenKey: 'tickets',
          badgeKey: 'tickets',
        },
        {
          name: 'AI Pre-screener',
          href: '/gatekeeper',
          icon: Filter,
          section: 'Auto Data & CRM',
          moduleKey: 'gatekeeper',
          screenKey: 'gatekeeper',
          badgeKey: 'gatekeeper',
        },
        {
          name: 'Vòng phân bổ',
          href: '/rounds',
          icon: GitBranch,
          section: 'Auto Data & CRM',
          moduleKey: 'rounds',
          screenKey: 'rounds',
        },
        {
          name: 'Đối soát công bằng',
          href: '/fair-share',
          icon: Scale,
          section: 'Auto Data & CRM',
          moduleKey: 'fair_share',
          screenKey: 'fair_share',
        },
        {
          name: 'Logic xử lý',
          href: '/rules',
          icon: Webhook,
          section: 'Auto Data & CRM',
          moduleKey: 'routing_rules',
          screenKey: 'routing_rules',
        },
        {
          name: terminology.consultantLabel || 'Sale & Đại lý',
          href: '/consultants',
          icon: Users,
          section: 'Auto Data & CRM',
          moduleKey: 'consultants',
          screenKey: 'consultants',
        }
      );

      // Marketing Suite section unlocked on Gói 3 & Gói 4
      if (hasModule('audiences')) {
        items.push(
          {
            name: 'Dashboard Marketing',
            href: '/marketing-dashboard',
            icon: LayoutDashboard,
            section: 'Marketing Automation',
            moduleKey: 'mkt_dashboard',
            screenKey: 'mkt_dashboard',
          },
          {
            name: `${terminology.customerLabel} & Tệp Data/Logic`,
            href: '/audiences',
            icon: Layers,
            section: 'Marketing Automation',
            moduleKey: 'audiences',
            screenKey: 'audiences',
          },
          {
            name: 'Email Templates',
            href: '/marketing/templates',
            icon: Mail,
            section: 'Marketing Automation',
            moduleKey: 'email_templates',
            screenKey: 'mkt_templates',
          },
          {
            name: 'Form Builder & Form Cards',
            href: '/marketing/forms',
            icon: FileText,
            section: 'Marketing Automation',
            moduleKey: 'forms_triggers',
            screenKey: 'mkt_forms',
          },
          {
            name: 'Surveys & Quiz',
            href: '/marketing/surveys',
            icon: ClipboardCheck,
            section: 'Marketing Automation',
            moduleKey: 'surveys_quiz',
            screenKey: 'mkt_surveys',
          },
          {
            name: 'Chiến dịch Email / ZNS',
            href: '/marketing/campaigns',
            icon: Send,
            section: 'Marketing Automation',
            moduleKey: 'campaigns',
            screenKey: 'mkt_campaigns',
          },
          {
            name: 'Automation Flows',
            href: '/marketing/flows',
            icon: Workflow,
            section: 'Marketing Automation',
            moduleKey: 'automation_flows',
            screenKey: 'mkt_flows',
          },
          {
            name: 'Voucher & QR',
            href: '/marketing/vouchers',
            icon: QrCode,
            section: 'Marketing Automation',
            moduleKey: 'vouchers_qr',
            screenKey: 'mkt_vouchers',
          },
          {
            name: 'Web Tracking',
            href: '/marketing/web-tracking',
            icon: Globe,
            section: 'Marketing Automation',
            moduleKey: 'web_tracking',
            screenKey: 'mkt_web_tracking',
          },
          {
            name: 'Social Bot',
            href: '/marketing/social-bot',
            icon: MessageCircle,
            section: 'Marketing Automation',
            moduleKey: 'social_bot',
            screenKey: 'mkt_social_bot',
          }
        );
      }

      // ERP PROMAX Full Suite + Finance/HRM/WorkChat/Education
      if (
        packageCode === 'domation_promax' ||
        hasModule('erp_hrm_org') ||
        hasModule('erp_projects_tasks') ||
        hasModule('erp_finance_inventory')
      ) {
        items.push(
          {
            name: 'DOM Agent (AI Điều hành)',
            href: '/dom-agent',
            icon: Bot,
            section: 'Quản trị ERP PROMAX',
            moduleKey: 'dom_agent',
            screenKey: 'dom_agent',
          },
          {
            name: 'Bảng tin Nội bộ (Feed)',
            href: '/feed',
            icon: Newspaper,
            section: 'Quản trị ERP PROMAX',
            moduleKey: 'erp_workchat',
            screenKey: 'feed',
          },
          {
            name: 'WorkChat & Kênh nhóm',
            href: '/erp/workchat',
            icon: MessageSquare,
            section: 'Quản trị ERP PROMAX',
            moduleKey: 'erp_workchat',
            screenKey: 'erp_workchat',
          },
          {
            name: `${terminology.projectLabel} Kanban / Gantt`,
            href: '/erp/projects',
            icon: FolderKanban,
            section: 'Quản trị ERP PROMAX',
            moduleKey: 'erp_projects_tasks',
            screenKey: 'erp_projects',
          },
          {
            name: 'Helpdesk CSKH (SLA)',
            href: '/support-tickets',
            icon: LifeBuoy,
            section: 'Quản trị ERP PROMAX',
            moduleKey: 'erp_projects_tasks',
            screenKey: 'support_tickets',
          },
          {
            name: 'Phê duyệt đa cấp',
            href: '/erp/approvals',
            icon: CheckSquare,
            section: 'Quản trị ERP PROMAX',
            moduleKey: 'erp_approvals',
            screenKey: 'erp_approvals',
          },
          {
            name: 'Nhân sự & Sơ đồ tổ chức',
            href: '/erp/hrm',
            icon: Users,
            section: 'Quản trị ERP PROMAX',
            moduleKey: 'erp_hrm_org',
            screenKey: 'erp_hrm',
          },
          {
            name: 'Chấm công GPS / Selfie',
            href: '/erp/attendance',
            icon: MapPin,
            section: 'Quản trị ERP PROMAX',
            moduleKey: 'erp_attendance',
            screenKey: 'erp_attendance',
          },
          {
            name: 'Bảng lương & Thuế',
            href: '/erp/payroll',
            icon: Wallet,
            section: 'Quản trị ERP PROMAX',
            moduleKey: 'erp_payroll',
            screenKey: 'erp_payroll',
          },
          {
            name: 'Phiếu lương Cá nhân',
            href: '/my-payslips',
            icon: FileSpreadsheet,
            section: 'Quản trị ERP PROMAX',
            moduleKey: 'erp_payroll',
            screenKey: 'my_payslips',
          },
          {
            name: 'Phiếu Hợp tác Hoa hồng',
            href: '/cooperation-slips',
            icon: Handshake,
            section: 'Quản trị ERP PROMAX',
            moduleKey: 'erp_payroll',
            screenKey: 'cooperation_slips',
          },
          {
            name: 'Tài chính Tổng hợp',
            href: '/erp/finance',
            icon: DollarSign,
            section: 'Tài chính & Kho vận',
            moduleKey: 'erp_finance_inventory',
            screenKey: 'erp_finance',
          },
          {
            name: 'Báo giá (Quotes)',
            href: '/quotes',
            icon: FileText,
            section: 'Tài chính & Kho vận',
            moduleKey: 'erp_finance_inventory',
            screenKey: 'quotes',
          },
          {
            name: 'Đơn bán hàng (SO)',
            href: '/sales-orders',
            icon: FileSpreadsheet,
            section: 'Tài chính & Kho vận',
            moduleKey: 'erp_finance_inventory',
            screenKey: 'sales_orders',
          },
          {
            name: 'Đặt cọc & Thu tiền',
            href: '/deposits',
            icon: Wallet,
            section: 'Tài chính & Kho vận',
            moduleKey: 'erp_finance_inventory',
            screenKey: 'deposits',
          },
          {
            name: 'Chi phí & Tạm ứng',
            href: '/expenses',
            icon: Receipt,
            section: 'Tài chính & Kho vận',
            moduleKey: 'erp_finance_inventory',
            screenKey: 'expenses',
          },
          {
            name: 'Dòng tiền (Cash Flow)',
            href: '/cash-flow',
            icon: TrendingUp,
            section: 'Tài chính & Kho vận',
            moduleKey: 'erp_finance_inventory',
            screenKey: 'cash_flow',
          },
          {
            name: 'Kế toán A-Z',
            href: '/accounting-az',
            icon: Calculator,
            section: 'Tài chính & Kho vận',
            moduleKey: 'erp_finance_inventory',
            screenKey: 'accounting_az',
          },
          {
            name: 'Hóa đơn & Công nợ',
            href: '/invoices',
            icon: FileCheck2,
            section: 'Tài chính & Kho vận',
            moduleKey: 'erp_finance_inventory',
            screenKey: 'invoices',
          },
          {
            name: 'Sản phẩm / Dịch vụ (SKU)',
            href: '/products',
            icon: Package,
            section: 'Tài chính & Kho vận',
            moduleKey: 'erp_finance_inventory',
            screenKey: 'products',
          },
          {
            name: 'Nhà cung cấp',
            href: '/suppliers',
            icon: Truck,
            section: 'Tài chính & Kho vận',
            moduleKey: 'erp_finance_inventory',
            screenKey: 'suppliers',
          },
          {
            name: 'Kho vận FIFO',
            href: '/inventory',
            icon: Boxes,
            section: 'Tài chính & Kho vận',
            moduleKey: 'erp_finance_inventory',
            screenKey: 'inventory',
          },
          {
            name: 'Đơn mua hàng (PO)',
            href: '/purchase-orders',
            icon: ClipboardCheck,
            section: 'Tài chính & Kho vận',
            moduleKey: 'erp_finance_inventory',
            screenKey: 'purchase_orders',
          },
          {
            name: 'Tài liệu Cloud OCR',
            href: '/erp/cloud-files',
            icon: FileCheck2,
            section: 'Quản trị ERP PROMAX',
            moduleKey: 'erp_cloud_ocr',
            screenKey: 'erp_cloud_files',
          }
        );

        if (educationAddon) {
          items.push({
            name: 'Đào tạo & Học vụ',
            href: '/erp/education',
            icon: GraduationCap,
            section: 'Quản trị ERP PROMAX',
            moduleKey: 'education_addon',
            screenKey: 'erp_education',
          });
        }
      }

      // System & Connect section
      items.push({
        name: 'Tích hợp Webhook & Bot',
        href: '/integrations',
        icon: Link2,
        section: 'Cài đặt hệ thống',
        moduleKey: 'integrations_autodata',
        screenKey: 'integrations',
      });

      if (hasModule('integrations_marketing')) {
        items.push({
          name: 'Kênh gửi SES / ZNS / SDK',
          href: '/marketing-connect',
          icon: ShieldCheck,
          section: 'Cài đặt hệ thống',
          moduleKey: 'integrations_marketing',
          screenKey: 'marketing_connect',
        });
      }

      items.push(
        {
          name: 'Tài khoản Cá nhân',
          href: '/account',
          icon: UserCog,
          section: 'Cài đặt hệ thống',
          moduleKey: 'settings',
          screenKey: 'account',
        },
        {
          name: 'Quản lý Tài khoản',
          href: '/accounts',
          icon: ShieldCheck,
          section: 'Cài đặt hệ thống',
          moduleKey: 'users',
          screenKey: 'accounts',
          ownerRecovery: true,
        },
        {
          name: 'Cài đặt hệ thống',
          href: '/settings',
          icon: Settings,
          section: 'Cài đặt hệ thống',
          moduleKey: 'settings',
          screenKey: 'settings',
          ownerRecovery: true,
        }
      );
    }

    return items.filter((item) => {
      if (item.ownerRecovery && isTenantOwner) return true;
      if (item.screenKey === 'account') return canScreen('account');
      if (!hasModule(item.moduleKey)) return false;
      if (!can(item.moduleKey, 'view')) return false;
      if (!canScreen(item.screenKey)) return false;
      return true;
    });
  }, [
    packageCode,
    terminology.customerLabel,
    terminology.consultantLabel,
    terminology.projectLabel,
    educationAddon,
    hasModule,
    can,
    canScreen,
    isTenantOwner,
  ]);

  const rawBrandLogo =
    typeof tenantSettings?.brand_logo_url === 'string' && tenantSettings.brand_logo_url.trim()
      ? tenantSettings.brand_logo_url.trim()
      : '';
  const showCustomLogo = Boolean(rawBrandLogo && rawBrandLogo !== logoErrorUrl);

  const handlePrimaryQuickAction = () => {
    if (packageCode === 'marketing_standalone') {
      navigate('/audiences');
    } else {
      window.dispatchEvent(new CustomEvent('open-quick-add-lead'));
    }
    if (onMobileClose) onMobileClose();
  };

  const quickButtonLabel =
    packageCode === 'marketing_standalone'
      ? `Tạo Tệp / ${terminology.customerLabel}`
      : t('Thêm Data Nhanh');

  return (
    <>
      {isMobileOpen && <div className="responsive-sidebar-overlay" onClick={onMobileClose} />}
      <aside
        className={`responsive-sidebar ${isMobileOpen ? 'responsive-sidebar-open' : ''}`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        style={{
          width: isCollapsed ? 72 : 260,
          background: 'var(--sidebar-bg, linear-gradient(180deg, #FFFFFF 0%, #F8FAFF 50%, #F1F5F9 100%))',
          color: 'var(--color-text)',
          display: 'flex',
          flexDirection: 'column',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          flexShrink: 0,
          position: 'relative',
          zIndex: 50,
          borderRight: '1px solid var(--color-border)',
          boxShadow: '4px 0 20px rgba(30, 64, 255, 0.04)',
        }}
      >
        {/* Logo Area */}
        <div
          style={{
            height: 86,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: isCollapsed ? '16px 0' : '14px 1.25rem',
            borderBottom: '1px solid var(--color-border-light)',
            flexShrink: 0,
            overflow: 'hidden',
            background: 'var(--sidebar-bg)',
          }}
        >
          {isCollapsed ? (
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: '14px',
                background: 'var(--color-surface)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                boxShadow: '0 2px 8px rgba(30, 64, 255, 0.14)',
                overflow: 'hidden',
                border: '1.5px solid var(--color-border)',
                padding: '4px',
              }}
            >
              {showCustomLogo ? (
                <img
                  src={rawBrandLogo}
                  alt={companyName}
                  onError={() => setLogoErrorUrl(rawBrandLogo)}
                  style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                />
              ) : (
                <DomationLogoMark size={30} />
              )}
            </div>
          ) : (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                width: '100%',
                minWidth: 0,
              }}
            >
              <div
                style={{
                  width: 42,
                  height: 42,
                  borderRadius: '12px',
                  background: 'var(--color-surface)',
                  border: '1px solid var(--color-border)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  boxShadow: '0 4px 12px rgba(30, 64, 255, 0.14)',
                  overflow: 'hidden',
                  padding: 4,
                }}
              >
                {showCustomLogo ? (
                  <img
                    src={rawBrandLogo}
                    alt={companyName}
                    onError={() => setLogoErrorUrl(rawBrandLogo)}
                    style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                  />
                ) : (
                  <DomationLogoMark size={30} />
                )}
              </div>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div
                  style={{
                    fontSize: '0.92rem',
                    fontWeight: 800,
                    color: 'var(--color-text)',
                    lineHeight: 1.2,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {companyName || 'DOMATION Workspace'}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 3 }}>
                  <span
                    style={{
                      fontSize: '0.61rem',
                      fontWeight: 800,
                      letterSpacing: '0.04em',
                      color: '#1E40FF',
                      background: 'rgba(30, 64, 255, 0.10)',
                      padding: '1px 7px',
                      borderRadius: 9999,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                    title={packageMeta.name}
                  >
                    {packageMeta.shortName}
                  </span>
                  {tenantSlug && (
                    <span
                      style={{
                        fontSize: '0.6rem',
                        fontWeight: 700,
                        color: 'var(--color-text-muted)',
                      }}
                    >
                      /{tenantSlug}
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Quick Action Button */}
        <div
          style={{
            padding: isCollapsed ? '0.75rem 0.5rem' : '1.05rem 1rem',
            display: 'flex',
            justifyContent: 'center',
            borderBottom: '1px solid var(--color-border-light)',
          }}
        >
          {!canQuickAction(packageCode === 'marketing_standalone' ? 'create_audience' : 'quick_add_lead') ? null : isCollapsed ? (
            <button
              type="button"
              onClick={handlePrimaryQuickAction}
              style={{
                width: 44,
                height: 44,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #60A5FA 0%, #1E40FF 55%, #1D4ED8 100%)',
                color: 'white',
                border: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                boxShadow: '0 4px 14px rgba(37, 99, 235, 0.28)',
                transition: 'all 0.2s',
              }}
              title={quickButtonLabel}
            >
              <Plus size={20} />
            </button>
          ) : (
            <button
              type="button"
              onClick={handlePrimaryQuickAction}
              style={{
                width: '100%',
                height: 42,
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #60A5FA 0%, #1E40FF 55%, #1D4ED8 100%)',
                color: 'white',
                border: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                fontSize: '0.88rem',
                fontWeight: 700,
                cursor: 'pointer',
                boxShadow: '0 4px 14px rgba(37, 99, 235, 0.28)',
                transition: 'all 0.2s',
              }}
            >
              <Plus size={17} /> {quickButtonLabel}
            </button>
          )}
        </div>

        {/* Collapse Button */}
        <button
          type="button"
          onClick={onToggleCollapse}
          className="responsive-hide-mobile"
          style={{
            position: 'absolute',
            right: -12,
            top: 36,
            transform: 'translateY(-50%)',
            width: 24,
            height: 24,
            borderRadius: '50%',
            background: '#FFFFFF',
            color: '#1E3A8A',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            zIndex: 200,
            border: '1px solid #CBD5E1',
            boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
            transition: 'all 0.2s',
            opacity: isHovered || isCollapsed ? 1 : 0,
            visibility: isHovered || isCollapsed ? 'visible' : 'hidden',
            pointerEvents: isHovered || isCollapsed ? 'auto' : 'none',
          }}
        >
          <ChevronLeft
            size={14}
            style={{
              transform: isCollapsed ? 'rotate(180deg)' : 'none',
              transition: 'transform 0.3s',
            }}
          />
        </button>

        {/* Navigation List */}
        <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', scrollbarWidth: 'none' }}>
          <div
            ref={navContainerRef}
            style={{ position: 'relative', padding: '0.75rem 0 1.25rem 0', display: 'flex', flexDirection: 'column' }}
          >
            {sliderStyle.height > 0 && (
              <div
                style={{
                  position: 'absolute',
                  left: 0,
                  top: 0,
                  width: 4,
                  height: sliderStyle.height,
                  background: 'linear-gradient(180deg, #3B82F6 0%, #0284C7 100%)',
                  boxShadow: '2px 0 6px rgba(2, 132, 199, 0.28)',
                  transition:
                    'transform 0.25s cubic-bezier(0.4, 0, 0.2, 1), height 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                  transform: `translateY(${sliderStyle.top}px)`,
                  borderRadius: '0 2px 2px 0',
                  pointerEvents: 'none',
                  zIndex: 10,
                }}
              />
            )}

            {navItems.map((item, idx) => {
              const Icon = item.icon;
              const prevSection = idx > 0 ? navItems[idx - 1]?.section : '';
              const showSectionHeader = !isCollapsed && item.section !== prevSection;
              const badgeCount =
                item.badgeKey === 'tickets'
                  ? pendingTickets
                  : item.badgeKey === 'gatekeeper'
                  ? heldLeadsCount
                  : 0;

              return (
                <Fragment key={item.href}>
                  {showSectionHeader && (
                    <span
                      style={{
                        fontSize: '0.64rem',
                        fontWeight: 800,
                        letterSpacing: '0.09em',
                        textTransform: 'uppercase',
                        color: '#64748B',
                        padding: idx === 0 ? '0.35rem 1.35rem' : '1.05rem 1.35rem 0.35rem 1.35rem',
                        whiteSpace: 'nowrap',
                        display: 'block',
                      }}
                    >
                      {t(item.section)}
                    </span>
                  )}

                  <NavLink
                    to={item.href}
                    end={item.end}
                    className={({ isActive }) => `sidebar-nav-item ${isActive ? 'active' : ''}`}
                    title={isCollapsed ? t(item.name) : undefined}
                    onClick={(e) => {
                      if (location.pathname === item.href) {
                        e.preventDefault();
                        return;
                      }
                      if (onMobileClose) onMobileClose();
                    }}
                    style={({ isActive }) => ({
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      padding: isCollapsed ? '0.65rem 0' : '0.62rem 1.25rem',
                      justifyContent: isCollapsed ? 'center' : 'flex-start',
                      color: isActive ? 'var(--color-primary)' : 'var(--color-text-light)',
                      textDecoration: 'none',
                      fontSize: '0.88rem',
                      fontWeight: isActive ? 700 : 600,
                      transition: 'all 0.2s ease',
                      position: 'relative',
                      background: isActive
                        ? 'linear-gradient(90deg, rgba(30, 64, 255, 0.14) 0%, rgba(30, 64, 255, 0.02) 100%)'
                        : 'transparent',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                    })}
                  >
                    {({ isActive }) => (
                      <>
                        <div
                          style={{
                            width: 34,
                            height: 34,
                            borderRadius: 10,
                            background: isActive
                              ? 'linear-gradient(135deg, #3B82F6 0%, #0284C7 100%)'
                              : 'var(--color-surface)',
                            border: isActive ? 'none' : '1px solid var(--color-border)',
                            boxShadow: isActive
                              ? '0 3px 8px rgba(2, 132, 199, 0.25)'
                              : '0 1px 2px rgba(0, 0, 0, 0.03)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                            transition: 'all 0.2s',
                            position: 'relative',
                          }}
                        >
                          <Icon size={17} color={isActive ? '#FFFFFF' : 'var(--color-text-muted)'} />
                          {isCollapsed && badgeCount > 0 && (
                            <div
                              style={{
                                position: 'absolute',
                                top: 3,
                                right: 3,
                                width: 8,
                                height: 8,
                                borderRadius: '50%',
                                background: item.badgeKey === 'gatekeeper' ? '#f59e0b' : '#ef4444',
                              }}
                            />
                          )}
                        </div>

                        {!isCollapsed && (
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              flex: 1,
                              minWidth: 0,
                            }}
                          >
                            <span
                              style={{
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                              }}
                            >
                              {t(item.name)}
                            </span>
                            {badgeCount > 0 && (
                              <span
                                style={{
                                  fontSize: '0.68rem',
                                  minWidth: '18px',
                                  height: '18px',
                                  borderRadius: '9px',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  padding: badgeCount > 9 ? '0 5px' : '0',
                                  background: item.badgeKey === 'gatekeeper' ? '#f59e0b' : '#ef4444',
                                  color: 'white',
                                  fontWeight: 700,
                                  lineHeight: 1,
                                }}
                              >
                                {badgeCount}
                              </span>
                            )}
                          </div>
                        )}
                      </>
                    )}
                  </NavLink>
                </Fragment>
              );
            })}
          </div>
        </div>
      </aside>
    </>
  );
};
