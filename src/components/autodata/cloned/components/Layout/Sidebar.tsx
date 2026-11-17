import React, { Fragment, useEffect, useMemo, useRef, useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  Bot,
  Briefcase,
  CheckSquare,
  ChevronLeft,
  ClipboardCheck,
  Database,
  DollarSign,
  FileCheck2,
  FileText,
  Filter,
  FolderKanban,
  GitBranch,
  Globe,
  GraduationCap,
  Layers,
  LayoutDashboard,
  Link2,
  Mail,
  MapPin,
  Megaphone,
  MessageCircle,
  MessageSquare,
  Plus,
  QrCode,
  Scale,
  Send,
  Settings,
  ShieldCheck,
  Ticket,
  TrendingUp,
  Users,
  Wallet,
  Webhook,
  Workflow,
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
  end?: boolean;
  adminOnly?: boolean;
  superAdminOnly?: boolean;
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
  const { user, companyName, tenantSlug, tenantSettings } = useAuth();
  const { packageCode, packageMeta, hasModule, educationAddon, terminology, can } = useEntitlement();
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

  // Poll pending ticket count every 60s ONLY when AutoData CRM Tickets module is unlocked
  useEffect(() => {
    if (!hasSaleTickets) return;
    if (user?.role !== 'admin' && user?.role !== 'superadmin') return;
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
  }, [user, hasSaleTickets]);

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
          end: true,
        },
        {
          name: `${terminology.customerLabel} & Tệp Data/Logic`,
          href: '/audiences',
          icon: Layers,
          section: 'Marketing Automation',
          moduleKey: 'audiences',
        },
        {
          name: 'Email Templates',
          href: '/marketing/templates',
          icon: Mail,
          section: 'Marketing Automation',
          moduleKey: 'email_templates',
        },
        {
          name: 'Form Builder & Form Cards',
          href: '/marketing/forms',
          icon: FileText,
          section: 'Marketing Automation',
          moduleKey: 'forms_triggers',
        },
        {
          name: 'Surveys & Quiz',
          href: '/marketing/surveys',
          icon: ClipboardCheck,
          section: 'Marketing Automation',
          moduleKey: 'surveys_quiz',
        },
        {
          name: 'Chiến dịch Email / ZNS',
          href: '/marketing/campaigns',
          icon: Send,
          section: 'Marketing Automation',
          moduleKey: 'campaigns',
        },
        {
          name: 'Automation Flows',
          href: '/marketing/flows',
          icon: Workflow,
          section: 'Marketing Automation',
          moduleKey: 'automation_flows',
        },
        {
          name: 'Voucher & QR',
          href: '/marketing/vouchers',
          icon: QrCode,
          section: 'Marketing Automation',
          moduleKey: 'vouchers_qr',
        },
        {
          name: 'Web Tracking',
          href: '/marketing/web-tracking',
          icon: Globe,
          section: 'Marketing Automation',
          moduleKey: 'web_tracking',
        },
        {
          name: 'Social Bot',
          href: '/marketing/social-bot',
          icon: MessageCircle,
          section: 'Marketing Automation',
          moduleKey: 'social_bot',
        },
        {
          name: 'Kết nối SES / ZNS / SDK',
          href: '/marketing-connect',
          icon: ShieldCheck,
          section: 'Kết nối & Hệ thống',
          moduleKey: 'integrations_marketing',
          adminOnly: true,
        },
        {
          name: 'Quản lý Tài khoản',
          href: '/accounts',
          icon: Users,
          section: 'Kết nối & Hệ thống',
          moduleKey: 'org_rbac',
          superAdminOnly: true,
        },
        {
          name: 'Cài đặt hệ thống',
          href: '/settings',
          icon: Settings,
          section: 'Kết nối & Hệ thống',
          moduleKey: 'settings',
          adminOnly: true,
        }
      );
    } else {
      // Gói 1 (autodata_crm), Gói 3 (growth_combo), Gói 4 (domation_promax)
      items.push(
        {
          name: 'Dashboard',
          href: '/',
          icon: LayoutDashboard,
          section: 'Auto Data & CRM',
          moduleKey: 'crm_dashboard',
          end: true,
        }
      );

      if (hasModule('growth_attribution')) {
        items.push({
          name: 'Doanh thu & ROAS Xuyên Phễu',
          href: '/growth-attribution',
          icon: TrendingUp,
          section: 'Auto Data & CRM',
          moduleKey: 'growth_attribution',
        });
      }

      items.push(
        {
          name: 'Quản lý Data',
          href: '/data',
          icon: Database,
          section: 'Auto Data & CRM',
          moduleKey: 'leads',
        },
        {
          name: 'Hiệu suất Quảng cáo',
          href: '/ads-performance',
          icon: Megaphone,
          section: 'Auto Data & CRM',
          moduleKey: 'ads_capi',
        },
        {
          name: 'Ticket Lỗi Data',
          href: '/tickets',
          icon: Ticket,
          section: 'Auto Data & CRM',
          moduleKey: 'tickets_data',
          adminOnly: true,
          badgeKey: 'tickets',
        },
        {
          name: 'AI Pre-screener',
          href: '/gatekeeper',
          icon: Filter,
          section: 'Auto Data & CRM',
          moduleKey: 'gatekeeper',
          adminOnly: true,
          badgeKey: 'gatekeeper',
        },
        {
          name: 'Vòng phân bổ',
          href: '/rounds',
          icon: GitBranch,
          section: 'Auto Data & CRM',
          moduleKey: 'rounds',
          adminOnly: true,
        },
        {
          name: 'Đối soát công bằng',
          href: '/fair-share',
          icon: Scale,
          section: 'Auto Data & CRM',
          moduleKey: 'fair_share',
          adminOnly: true,
        },
        {
          name: 'Logic xử lý',
          href: '/rules',
          icon: Webhook,
          section: 'Auto Data & CRM',
          moduleKey: 'routing_rules',
          adminOnly: true,
        },
        {
          name: terminology.consultantLabel || 'Sale & Đại lý',
          href: '/consultants',
          icon: Users,
          section: 'Auto Data & CRM',
          moduleKey: 'consultants',
          adminOnly: true,
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
          },
          {
            name: `${terminology.customerLabel} & Tệp Data/Logic`,
            href: '/audiences',
            icon: Layers,
            section: 'Marketing Automation',
            moduleKey: 'audiences',
          },
          {
            name: 'Email Templates',
            href: '/marketing/templates',
            icon: Mail,
            section: 'Marketing Automation',
            moduleKey: 'email_templates',
          },
          {
            name: 'Form Builder & Form Cards',
            href: '/marketing/forms',
            icon: FileText,
            section: 'Marketing Automation',
            moduleKey: 'forms_triggers',
          },
          {
            name: 'Surveys & Quiz',
            href: '/marketing/surveys',
            icon: ClipboardCheck,
            section: 'Marketing Automation',
            moduleKey: 'surveys_quiz',
          },
          {
            name: 'Chiến dịch Email / ZNS',
            href: '/marketing/campaigns',
            icon: Send,
            section: 'Marketing Automation',
            moduleKey: 'campaigns',
          },
          {
            name: 'Automation Flows',
            href: '/marketing/flows',
            icon: Workflow,
            section: 'Marketing Automation',
            moduleKey: 'automation_flows',
          },
          {
            name: 'Voucher & QR',
            href: '/marketing/vouchers',
            icon: QrCode,
            section: 'Marketing Automation',
            moduleKey: 'vouchers_qr',
          },
          {
            name: 'Web Tracking',
            href: '/marketing/web-tracking',
            icon: Globe,
            section: 'Marketing Automation',
            moduleKey: 'web_tracking',
          },
          {
            name: 'Social Bot',
            href: '/marketing/social-bot',
            icon: MessageCircle,
            section: 'Marketing Automation',
            moduleKey: 'social_bot',
          }
        );
      }

      // ERP PROMAX 9 Core Groups + Education Add-on
      if (packageCode === 'domation_promax') {
        items.push(
          {
            name: 'DOM Agent (AI Điều hành)',
            href: '/dom-agent',
            icon: Bot,
            section: 'Quản trị ERP PROMAX',
            moduleKey: 'dom_agent',
          },
          {
            name: 'Nhân sự & Sơ đồ tổ chức',
            href: '/erp/hrm',
            icon: Briefcase,
            section: 'Quản trị ERP PROMAX',
            moduleKey: 'erp_hrm_org',
          },
          {
            name: 'Chấm công GPS / Selfie',
            href: '/erp/attendance',
            icon: MapPin,
            section: 'Quản trị ERP PROMAX',
            moduleKey: 'erp_attendance',
          },
          {
            name: 'Bảng lương & Thuế',
            href: '/erp/payroll',
            icon: Wallet,
            section: 'Quản trị ERP PROMAX',
            moduleKey: 'erp_payroll',
          },
          {
            name: 'Phê duyệt đa cấp',
            href: '/erp/approvals',
            icon: CheckSquare,
            section: 'Quản trị ERP PROMAX',
            moduleKey: 'erp_approvals',
          },
          {
            name: `${terminology.projectLabel} Kanban / Gantt`,
            href: '/erp/projects',
            icon: FolderKanban,
            section: 'Quản trị ERP PROMAX',
            moduleKey: 'erp_projects_tasks',
          },
          {
            name: 'WorkChat & Bảng tin',
            href: '/erp/workchat',
            icon: MessageSquare,
            section: 'Quản trị ERP PROMAX',
            moduleKey: 'erp_workchat',
          },
          {
            name: 'Tài chính, SO/PO & Kho',
            href: '/erp/finance',
            icon: DollarSign,
            section: 'Quản trị ERP PROMAX',
            moduleKey: 'erp_finance_inventory',
          },
          {
            name: 'Tài liệu Cloud OCR',
            href: '/erp/cloud-files',
            icon: FileCheck2,
            section: 'Quản trị ERP PROMAX',
            moduleKey: 'erp_cloud_ocr',
          }
        );

        if (educationAddon) {
          items.push({
            name: 'Đào tạo & Học vụ',
            href: '/erp/education',
            icon: GraduationCap,
            section: 'Quản trị ERP PROMAX',
            moduleKey: 'education_addon',
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
        adminOnly: true,
      });

      if (hasModule('integrations_marketing')) {
        items.push({
          name: 'Kênh gửi SES / ZNS / SDK',
          href: '/marketing-connect',
          icon: ShieldCheck,
          section: 'Cài đặt hệ thống',
          moduleKey: 'integrations_marketing',
          adminOnly: true,
        });
      }

      items.push(
        {
          name: 'Quản lý Tài khoản',
          href: '/accounts',
          icon: ShieldCheck,
          section: 'Cài đặt hệ thống',
          moduleKey: 'org_rbac',
          superAdminOnly: true,
        },
        {
          name: 'Cài đặt hệ thống',
          href: '/settings',
          icon: Settings,
          section: 'Cài đặt hệ thống',
          moduleKey: 'settings',
          adminOnly: true,
        }
      );
    }

    return items.filter((item) => {
      if (!hasModule(item.moduleKey)) return false;
      if (!can(item.moduleKey, 'view')) return false;
      if (item.superAdminOnly && user?.role !== 'superadmin') return false;
      if (item.adminOnly && user?.role !== 'admin' && user?.role !== 'superadmin') return false;
      return true;
    });
  }, [packageCode, terminology.customerLabel, terminology.consultantLabel, terminology.projectLabel, educationAddon, hasModule, can, user?.role]);

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
          {user?.role === 'sale' ? null : isCollapsed ? (
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
