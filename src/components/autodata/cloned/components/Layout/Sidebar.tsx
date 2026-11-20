import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Users, GitBranch, Settings, ChevronLeft, Webhook, Link2, Database,
  ShieldCheck, Ticket, Plus, Scale, Filter, BarChart3, List, Images, CreditCard, TrendingUp
} from 'lucide-react';
import {
  DOM_META_SELECT_VIEW_EVENT,
  DOM_META_SIDEBAR_STATE_EVENT,
  getDomMetaSidebarSubItems,
  type DomMetaNavView,
  type DomMetaSidebarStateDetail,
} from '../../../../dom-meta/domMetaTypes';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useEffect, useState, useRef, Fragment } from 'react';
import { fetchAPI } from '../../utils/api';
import { DomationLogoMark } from '../../../../DomationLogoMark';

const ALL_NAV_ITEMS = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard, end: true },
  { name: 'Quản lý Data', href: '/data', icon: Database },
  { name: 'Báo cáo Quảng cáo', href: '/meta-report', icon: BarChart3 },
  { name: 'Ticket Lỗi Data', href: '/tickets', icon: Ticket, adminOnly: true, badgeKey: 'tickets' },
  { name: 'AI Pre-screener', href: '/gatekeeper', icon: Filter, adminOnly: true, badgeKey: 'gatekeeper' },
  { name: 'Vòng phân bổ', href: '/rounds', icon: GitBranch, adminOnly: true },
  { name: 'Đối soát công bằng', href: '/fair-share', icon: Scale, adminOnly: true },
  { name: 'Logic xử lý', href: '/rules', icon: Webhook, adminOnly: true },
  { name: 'Tích hợp', href: '/integrations', icon: Link2, adminOnly: true },
  { name: 'Sale & Đại lý', href: '/consultants', icon: Users, adminOnly: true },
  { name: 'Quản lý Tài khoản', href: '/accounts', icon: ShieldCheck, superAdminOnly: true },
  { name: 'Cài đặt hệ thống', href: '/settings', icon: Settings, adminOnly: true },
];

export const Sidebar = ({ isCollapsed, onToggleCollapse, isMobileOpen, onMobileClose }: { isCollapsed: boolean; onToggleCollapse: () => void; isMobileOpen?: boolean; onMobileClose?: () => void }) => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const location = useLocation();
  const [pendingTickets, setPendingTickets] = useState(0);
  const [heldLeadsCount, setHeldLeadsCount] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  const [sliderStyle, setSliderStyle] = useState({ top: 0, height: 0 });
  const navContainerRef = useRef<HTMLDivElement>(null);
  const [metaSidebarState, setMetaSidebarState] = useState<DomMetaSidebarStateDetail>({
    activeView: 'dashboard',
    googleAdsEnabled: false,
    isCrmEnabled: true,
    hasCapi: false,
    hasAiKey: false,
  });

  useEffect(() => {
    const onMetaState = (event: Event) => {
      const detail = (event as CustomEvent<DomMetaSidebarStateDetail>).detail;
      if (detail) setMetaSidebarState(detail);
    };
    window.addEventListener(DOM_META_SIDEBAR_STATE_EVENT, onMetaState as EventListener);
    return () => window.removeEventListener(DOM_META_SIDEBAR_STATE_EVENT, onMetaState as EventListener);
  }, []);

  const metaSubViewIcons: Record<DomMetaNavView, typeof LayoutDashboard> = {
    dashboard: LayoutDashboard,
    ad_detail: List,
    lead_attribution: Link2,
    ad_library: Images,
    account: CreditCard,
    google_ads: TrendingUp,
    meta_capi: Webhook,
    settings: Settings,
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      if (navContainerRef.current) {
        const activeElement = navContainerRef.current.querySelector('.active') as HTMLElement;
        if (activeElement) {
          setSliderStyle({
            top: activeElement.offsetTop,
            height: activeElement.offsetHeight
          });
        } else {
          setSliderStyle({ top: 0, height: 0 });
        }
      }
    }, 60);
    return () => clearTimeout(timer);
  }, [location.pathname, isCollapsed]);

  // Poll pending ticket count every 60s
  useEffect(() => {
    if (user?.role !== 'admin' && user?.role !== 'superadmin') return;
    const fetchPending = async () => {
      try {
        const [resReports, resHeld] = await Promise.all([
          fetchAPI('get_reports&status=pending&date=all&pageSize=1'),
          fetchAPI('get_held_leads&pageSize=1&date=all')
        ]);

        let countReports = 0;
        let countHeld = 0;

        if (resReports && resReports.success) {
          countReports = resReports.stats?.pending ?? (Array.isArray(resReports?.data) ? resReports.data.filter((r: { status?: string }) => r?.status === 'pending').length : 0);
        }

        if (resHeld.success) {
          countHeld = resHeld.total_count ?? 0;
        }

        setPendingTickets(countReports);
        setHeldLeadsCount(countHeld);
      } catch { /* silent */ }
    };
    fetchPending();
    const interval = setInterval(fetchPending, 60000);
    window.addEventListener('ticket-resolved', fetchPending);
    return () => {
      clearInterval(interval);
      window.removeEventListener('ticket-resolved', fetchPending);
    };
  }, [user]);

  const NAV_ITEMS = ALL_NAV_ITEMS.filter(item => {
    if (item.superAdminOnly && user?.role !== 'superadmin') return false;
    if (item.adminOnly && user?.role !== 'admin' && user?.role !== 'superadmin') return false;
    return true;
  });

  return (
    <>
      {isMobileOpen && (
        <div
          className="responsive-sidebar-overlay"
          onClick={onMobileClose}
        />
      )}
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
          boxShadow: '4px 0 20px rgba(30, 64, 255, 0.04)'
        }}
      >
        {/* Logo Area - Centered DOMATION & Workspace Branding */}
        <div style={{
          height: 86,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: isCollapsed ? '16px 0' : '14px 1.25rem',
          borderBottom: '1px solid var(--color-border-light)',
          flexShrink: 0,
          overflow: 'hidden',
          background: 'var(--sidebar-bg)'
        }}>
          {isCollapsed ? (
            <div style={{
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
              padding: '4px'
            }}>
              <DomationLogoMark size={30} />
            </div>
          ) : (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              width: '100%',
              minWidth: 0
            }}>
              <div style={{
                width: 42,
                height: 42,
                borderRadius: '12px',
                background: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                boxShadow: '0 4px 12px rgba(30, 64, 255, 0.14)'
              }}>
                <DomationLogoMark size={30} />
              </div>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{
                  fontSize: '1.02rem',
                  fontWeight: 900,
                  color: 'var(--color-text)',
                  lineHeight: 1.15,
                  letterSpacing: '-0.02em',
                  whiteSpace: 'nowrap'
                }}>
                  DOMATION
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 3 }}>
                  <span style={{
                    fontSize: '0.625rem',
                    fontWeight: 800,
                    letterSpacing: '0.12em',
                    color: 'var(--color-primary)',
                    textTransform: 'uppercase'
                  }}>AUTO DATA CRM</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Quick Action Button */}
        <div style={{ padding: isCollapsed ? '0.75rem 0.5rem' : '1.25rem 1rem', display: 'flex', justifyContent: 'center', borderBottom: '1px solid var(--color-border-light)' }}>
          {user?.role === 'sale' ? null : (
            isCollapsed ? (
              <button
                onClick={() => {
                  window.dispatchEvent(new CustomEvent('open-quick-add-lead'));
                  if (onMobileClose) onMobileClose();
                }}
                style={{
                  width: 44, height: 44, borderRadius: '50%',
                  background: 'linear-gradient(135deg, #60A5FA 0%, #1E40FF 55%, #1D4ED8 100%)',
                  color: 'white', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', boxShadow: '0 4px 14px rgba(37, 99, 235, 0.28)', transition: 'all 0.2s'
                }}
                onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'}
                onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                title={t("Thêm Data Nhanh")}
              >
                <Plus size={20} />
              </button>
            ) : (
              <button
                onClick={() => {
                  window.dispatchEvent(new CustomEvent('open-quick-add-lead'));
                  if (onMobileClose) onMobileClose();
                }}
                style={{
                  width: '100%', height: 44, borderRadius: '12px',
                  background: 'linear-gradient(135deg, #60A5FA 0%, #1E40FF 55%, #1D4ED8 100%)',
                  color: 'white', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  gap: 8, fontSize: '0.9375rem', fontWeight: 700, cursor: 'pointer',
                  boxShadow: '0 4px 14px rgba(37, 99, 235, 0.28)', transition: 'all 0.2s'
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 8px 20px rgba(30, 64, 255, 0.42)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 6px 16px rgba(30, 64, 255, 0.30)';
                }}
              >
                <Plus size={18} /> {t("Thêm Data Nhanh")}
              </button>
            )
          )}
        </div>

        {/* Collapse Button */}
        <button
          onClick={onToggleCollapse}
          className="responsive-hide-mobile"
          style={{
            position: 'absolute', right: -12, top: 36, transform: 'translateY(-50%)',
            width: 24, height: 24, borderRadius: '50%', background: '#FFFFFF', color: '#1E3A8A',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', zIndex: 200, border: '1px solid #CBD5E1', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', transition: 'all 0.2s',
            opacity: isHovered || isCollapsed ? 1 : 0,
            visibility: isHovered || isCollapsed ? 'visible' : 'hidden',
            pointerEvents: isHovered || isCollapsed ? 'auto' : 'none'
          }}
        >
          <ChevronLeft size={14} style={{ transform: isCollapsed ? 'rotate(180deg)' : 'none', transition: 'transform 0.3s' }} />
        </button>

        {/* Nav */}
        <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', scrollbarWidth: 'none' }}>
          <div ref={navContainerRef} style={{ position: 'relative', padding: '1rem 0', display: 'flex', flexDirection: 'column' }}>

            {/* Sliding Active Indicator */}
            {sliderStyle.height > 0 && (
              <div style={{
                position: 'absolute',
                left: 0,
                top: 0,
                width: 4,
                height: sliderStyle.height,
                background: 'linear-gradient(180deg, #3B82F6 0%, #0284C7 100%)',
                boxShadow: '2px 0 6px rgba(2, 132, 199, 0.28)',
                transition: 'transform 0.25s cubic-bezier(0.4, 0, 0.2, 1), height 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                transform: `translateY(${sliderStyle.top}px)`,
                borderRadius: '0 2px 2px 0',
                pointerEvents: 'none',
                zIndex: 10
              }} />
            )}

            {!isCollapsed && (
              <span style={{
                fontSize: '0.65rem', fontWeight: 800, letterSpacing: '0.1em',
                textTransform: 'uppercase', color: '#64748B',
                padding: '0.5rem 1.5rem', whiteSpace: 'nowrap'
              }}>{t("Chức năng chính")}</span>
            )}

            {NAV_ITEMS.map(({ name, href, icon: Icon, end, badgeKey }) => {
              const badgeCount = badgeKey === 'tickets' ? pendingTickets : badgeKey === 'gatekeeper' ? heldLeadsCount : 0;
              const isSettingsGroupStart = href === '/rules';
              return (
                <Fragment key={href}>
                  {isSettingsGroupStart && !isCollapsed && (
                    <span style={{
                      fontSize: '0.65rem', fontWeight: 800, letterSpacing: '0.1em',
                      textTransform: 'uppercase', color: '#64748B',
                      padding: '1.25rem 1.5rem 0.5rem 1.5rem', whiteSpace: 'nowrap',
                      display: 'block'
                    }}>{t("Cài đặt hệ thống")}</span>
                  )}
                  <NavLink
                    to={href}
                    end={end}
                    className={({ isActive }) => `sidebar-nav-item ${isActive ? 'active' : ''}`}
                    title={isCollapsed ? t(name) : undefined}
                    onClick={(e) => {
                      if (location.pathname === href) {
                        e.preventDefault();
                        return;
                      }
                      if (onMobileClose) onMobileClose();
                    }}
                    style={({ isActive }) => ({
                      display: 'flex', alignItems: 'center', gap: '0.875rem',
                      padding: isCollapsed ? '0.75rem 0' : '0.75rem 1.5rem',
                      justifyContent: isCollapsed ? 'center' : 'flex-start',
                      color: isActive ? 'var(--color-primary)' : 'var(--color-text-light)',
                      textDecoration: 'none', fontSize: '0.9375rem',
                      fontWeight: isActive ? 700 : 600, transition: 'all 0.2s ease',
                      position: 'relative',
                      background: isActive ? 'linear-gradient(90deg, rgba(30, 64, 255, 0.14) 0%, rgba(30, 64, 255, 0.02) 100%)' : 'transparent',
                      whiteSpace: 'nowrap', overflow: 'hidden',
                    })}
                  >
                    {({ isActive }) => (
                      <>
                        {/* Icon Box — with badge dot when collapsed */}
                        <div style={{
                          width: 36, height: 36, borderRadius: 10,
                          background: isActive ? 'linear-gradient(135deg, #3B82F6 0%, #0284C7 100%)' : 'var(--color-surface)',
                          border: isActive ? 'none' : '1px solid var(--color-border)',
                          boxShadow: isActive ? '0 3px 8px rgba(2, 132, 199, 0.25)' : '0 1px 2px rgba(0, 0, 0, 0.03)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          flexShrink: 0, transition: 'all 0.2s', position: 'relative'
                        }}>
                          <Icon size={18} color={isActive ? '#FFFFFF' : 'var(--color-text-muted)'} />
                          {isCollapsed && badgeCount > 0 && (
                            <div style={{
                              position: 'absolute', top: 4, right: 4, width: 8, height: 8,
                              borderRadius: '50%', background: badgeKey === 'gatekeeper' ? '#f59e0b' : '#ef4444'
                            }} />
                          )}
                        </div>

                        {!isCollapsed && (
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flex: 1 }}>
                            <span>{t(name)}</span>
                            {badgeCount > 0 && (
                              <span style={{
                                fontSize: '0.7rem',
                                minWidth: '18px',
                                height: '18px',
                                borderRadius: '9px',
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                padding: badgeCount > 9 ? '0 5px' : '0',
                                background: badgeKey === 'gatekeeper' ? '#f59e0b' : '#ef4444',
                                color: 'white',
                                fontWeight: 700,
                                lineHeight: 1
                              }}>
                                {badgeCount}
                              </span>
                            )}
                          </div>
                        )}
                      </>
                    )}
                  </NavLink>
                  {href === '/meta-report' && location.pathname === '/meta-report' && !isCollapsed && (
                    <div
                      data-testid="crm-meta-sidebar-subtabs"
                      style={{
                        marginLeft: '1.5rem',
                        marginRight: '0.875rem',
                        marginTop: '0.25rem',
                        marginBottom: '0.375rem',
                        paddingLeft: '0.625rem',
                        borderLeft: '2px solid rgba(30, 64, 255, 0.22)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '2px',
                      }}
                    >
                      {getDomMetaSidebarSubItems(metaSidebarState).map((sub) => {
                        const SubIcon = metaSubViewIcons[sub.id] || LayoutDashboard;
                        const isSubActive = metaSidebarState.activeView === sub.id;
                        return (
                          <button
                            key={sub.id}
                            type="button"
                            data-testid={`sidebar-meta-sub-${sub.id}`}
                            onClick={() => {
                              setMetaSidebarState((prev) => ({ ...prev, activeView: sub.id }));
                              window.dispatchEvent(new CustomEvent(DOM_META_SELECT_VIEW_EVENT, { detail: { view: sub.id } }));
                              if (onMobileClose) onMobileClose();
                            }}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.5rem',
                              width: '100%',
                              textAlign: 'left',
                              padding: '0.45rem 0.65rem',
                              borderRadius: '8px',
                              border: 'none',
                              cursor: 'pointer',
                              fontSize: '0.8125rem',
                              fontWeight: isSubActive ? 700 : 500,
                              color: isSubActive ? '#1E40FF' : '#475569',
                              background: isSubActive ? 'rgba(30, 64, 255, 0.1)' : 'transparent',
                              transition: 'all 0.15s ease',
                            }}
                          >
                            <SubIcon size={14} color={isSubActive ? '#1E40FF' : '#64748B'} />
                            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{sub.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </Fragment>
              );
            })}
          </div>
        </div>



        {/* Pulse animation */}
        <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.7} }`}</style>
      </aside>
    </>
  );
};
