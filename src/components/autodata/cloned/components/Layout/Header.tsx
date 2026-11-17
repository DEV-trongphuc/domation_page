import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Command, Activity, Sun, Moon, Keyboard, ChevronDown, User, CreditCard, Compass, Building2, Plus, LogOut, Menu, Sparkles, Check, Bell, Shield } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useEntitlement } from '../../contexts/EntitlementContext';
import { SAAS_PACKAGES_CATALOG } from '../../contexts/entitlementConstants';
import type { SaasPackageCode } from '../../../autodataTypes';
import { useLanguage } from '../../contexts/LanguageContext';
import { Avatar } from '../ui/Avatar';
import { useNavigate } from 'react-router-dom';
import vnFlag from '../../assets/vn.svg';
import usFlag from '../../assets/us.svg';
import jpFlag from '../../assets/jp.svg';
import cnFlag from '../../assets/cn.svg';

const languagesList = [
  { code: 'vi', name: 'Tiếng Việt', flag: vnFlag },
  { code: 'en', name: 'English', flag: usFlag },
  { code: 'ja', name: '日本語', flag: jpFlag },
  { code: 'zh', name: '简体中文', flag: cnFlag }
] as const;

export const Header = ({ onActivityFeedClick, onMenuClick }: { onActivityFeedClick: () => void; onMenuClick?: () => void }) => {
  const { user, logout, companyName, tenantSlug, workspaces, switchWorkspace, openBilling, openTour, openSwitchWorkspaceModal } = useAuth();
  const { packageCode, packageMeta, switchPackage, switchingPackage, can, canScreen, isTenantOwner } = useEntitlement();
  const [isWsOpen, setIsWsOpen] = useState(false);
  const [isPkgOpen, setIsPkgOpen] = useState(false);
  const { language, setLanguage, t } = useLanguage();
  const [isLangOpen, setIsLangOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
  };

  useEffect(() => {
    if (!isLangOpen) return;
    const handleClose = () => setIsLangOpen(false);
    document.addEventListener('click', handleClose);
    return () => document.removeEventListener('click', handleClose);
  }, [isLangOpen]);

  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const localTheme = typeof window !== 'undefined' ? (localStorage.getItem('domation_theme') as 'light' | 'dark' | null) : null;
    if (localTheme) return localTheme;
    return (typeof document !== 'undefined' && (document.documentElement.getAttribute('data-theme') as 'light' | 'dark')) || 'light';
  });

  // Sync DOM attribute and listen to external theme changes
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);

    const handleThemeChange = () => {
      const nextTheme = (document.documentElement.getAttribute('data-theme') as 'light' | 'dark') || 'light';
      setTheme(nextTheme);
    };

    window.addEventListener('theme-change', handleThemeChange);
    return () => {
      window.removeEventListener('theme-change', handleThemeChange);
    };
  }, [theme]);

  const toggleTheme = (event?: React.MouseEvent) => {
    const nextTheme = theme === 'light' ? 'dark' : 'light';
    const docWithTransition = document as Document & {
      startViewTransition?: (cb: () => void) => { ready: Promise<void> };
    };

    // Check if View Transition is supported and user does not prefer reduced motion
    if (!docWithTransition.startViewTransition || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setTheme(nextTheme);
      document.documentElement.setAttribute('data-theme', nextTheme);
      localStorage.setItem('domation_theme', nextTheme);
      window.dispatchEvent(new Event('theme-change'));
      return;
    }

    // Get click position or fallback to center of the viewport
    const x = event ? event.clientX : window.innerWidth / 2;
    const y = event ? event.clientY : window.innerHeight / 2;

    const endRadius = Math.hypot(
      Math.max(x, window.innerWidth - x),
      Math.max(y, window.innerHeight - y)
    );

    const transition = docWithTransition.startViewTransition(() => {
      setTheme(nextTheme);
      document.documentElement.setAttribute('data-theme', nextTheme);
      localStorage.setItem('domation_theme', nextTheme);
      window.dispatchEvent(new Event('theme-change'));
    });

    transition.ready.then(() => {
      const clipPath = [
        `circle(0px at ${x}px ${y}px)`,
        `circle(${endRadius}px at ${x}px ${y}px)`
      ];
      document.documentElement.animate(
        {
          clipPath: clipPath,
        },
        {
          duration: 600,
          easing: 'ease-in-out',
          pseudoElement: '::view-transition-new(root)',
        }
      );
    });
  };

  const getRoleLabel = (role?: string) => {
    switch (role) {
      case 'superadmin': return t('Super Admin');
      case 'admin': return t('Quản trị viên');
      case 'assistant': return t('Trợ lý');
      case 'viewer': return t('Người xem');
      case 'sale': return t('Đại lý');
      default: return t('Người dùng');
    }
  };

  const canViewSystemActivity =
    isTenantOwner || can('org_rbac', 'view') || canScreen('settings') || canScreen('tickets');

  const handleProfileClick = () => {
    window.dispatchEvent(new CustomEvent('open-profile-modal'));
  };

  const handleActivityClick = () => {
    if (canViewSystemActivity) {
      window.dispatchEvent(new CustomEvent('open-profile-modal', { detail: { tab: 'activity' } }));
    }
  };

  const handleOpenSearch = () => {
    window.dispatchEvent(new CustomEvent('open-command-palette'));
  };

  return (
    <header style={{
      height: 66,
      background: 'var(--color-surface)',
      borderBottom: '1px solid var(--color-border)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 1.25rem',
      flexShrink: 0,
      zIndex: 40
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
        {/* Mobile menu trigger */}
        <button 
          onClick={onMenuClick}
          style={{
            width: 36,
            height: 36,
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--color-text-light)',
            borderRadius: 8,
            border: 'none',
            background: 'none',
            cursor: 'pointer',
            transition: 'color 0.2s',
            outline: 'none',
            display: 'none'
          }}
          className="mobile-menu-btn"
          title={t("Menu")}
        >
          <Menu size={24} />
        </button>

        {/* Keyboard Shortcuts Trigger Button */}
        <button 
          onClick={() => window.dispatchEvent(new CustomEvent('open-keyboard-shortcuts'))}
          style={{
            width: 36,
            height: 36,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--color-text-muted)',
            borderRadius: 8,
            border: 'none',
            background: 'none',
            cursor: 'pointer',
            transition: 'color 0.2s',
            outline: 'none'
          }}
          className="responsive-hide-mobile"
          title={t("Bảng phím tắt điều hướng nhanh (?)")}
          onMouseEnter={e => {
            e.currentTarget.style.color = 'var(--color-primary)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.color = 'var(--color-text-muted)';
          }}
         >
          <Keyboard size={20} />
        </button>

        {/* Search trigger */}
        <button 
          onClick={handleOpenSearch}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            background: 'var(--color-bg)',
            border: '1px solid var(--color-border)',
            borderRadius: 9999,
            padding: '0.4rem 0.875rem',
            color: 'var(--color-text-light)',
            fontSize: '0.875rem',
            cursor: 'pointer',
            transition: 'border-color 0.2s',
            width: 320,
            maxWidth: '100%'
          }} 
          className="responsive-search-box responsive-hide-mobile"
        >
          <Search size={16} />
          <span className="responsive-hide-mobile">{t("Tìm kiếm toàn hệ thống...")}</span>
          <span className="responsive-hide-mobile" style={{
            marginLeft: 'auto',
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            background: 'var(--color-border)',
            color: 'var(--color-text-muted)',
            padding: '1px 6px',
            borderRadius: 4,
            fontSize: '0.7rem'
          }}>
            <Command size={12} />K
          </span>
        </button>

        {/* Subtle Multi-Tenant Workspace Switcher */}
        <div style={{ position: 'relative' }} className="responsive-hide-mobile">
          <button
            onClick={() => setIsWsOpen(v => !v)}
            style={{
              display: 'flex', alignItems: 'center', gap: 6, height: 34, padding: '0 10px',
              borderRadius: 9999, background: 'var(--color-bg)', border: '1px solid var(--color-border)',
              color: 'var(--color-text)', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer'
            }}
            title={t('Chuyển đổi Workspace / Tạo tổ chức mới')}
          >
            <Building2 size={14} style={{ color: 'var(--color-primary)' }} />
            <span style={{ maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{companyName || tenantSlug}</span>
            <ChevronDown size={12} style={{ color: 'var(--color-text-muted)' }} />
          </button>
          {isWsOpen && (
            <div style={{
              position: 'absolute', top: 'calc(100% + 6px)', left: 0, minWidth: 230, zIndex: 80,
              background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 10,
              padding: 6, boxShadow: '0 10px 28px rgba(15, 23, 42, 0.14)'
            }}>
              {workspaces.map((ws) => (
                <button
                  key={ws.slug}
                  onClick={() => { setIsWsOpen(false); void switchWorkspace(ws.slug); }}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '7px 10px', borderRadius: 7, border: 'none', cursor: 'pointer',
                    background: ws.slug === tenantSlug ? 'var(--color-primary-light)' : 'transparent',
                    color: ws.slug === tenantSlug ? 'var(--color-primary)' : 'var(--color-text)',
                    fontSize: '0.8rem', fontWeight: ws.slug === tenantSlug ? 700 : 500, textAlign: 'left'
                  }}
                >
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ws.company_name || ws.slug}</span>
                  <span style={{ fontSize: '0.68rem', color: 'var(--color-text-muted)' }}>/{ws.slug}</span>
                </button>
              ))}
              <div style={{ borderTop: '1px solid var(--color-border)', margin: '4px 0' }} />
              <button
                onClick={() => { setIsWsOpen(false); openSwitchWorkspaceModal(); }}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', gap: 6, padding: '7px 10px',
                  borderRadius: 7, border: 'none', cursor: 'pointer', background: 'transparent',
                  color: 'var(--color-primary)', fontSize: '0.8rem', fontWeight: 700, textAlign: 'left'
                }}
              >
                <Plus size={14} /> {t('Thêm / Chuyển Workspace')}
              </button>
            </div>
          )}
        </div>

        {/* 4-Package Ecosystem Quick Switcher Badge */}
        <div style={{ position: 'relative' }} className="responsive-hide-mobile">
          <button
            type="button"
            onClick={() => setIsPkgOpen((v) => !v)}
            disabled={switchingPackage}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              height: 34,
              padding: '0 12px',
              borderRadius: 9999,
              background: 'rgba(30, 64, 255, 0.08)',
              border: '1px solid rgba(30, 64, 255, 0.22)',
              color: '#1E40FF',
              fontSize: '0.74rem',
              fontWeight: 800,
              cursor: 'pointer',
            }}
            title="Chuyển đổi / Nâng cấp Gói SaaS tức thì (0s Migrate)"
          >
            <Sparkles size={13} />
            <span>{packageMeta.shortName}</span>
            <ChevronDown size={12} />
          </button>

          {isPkgOpen && (
            <div
              style={{
                position: 'absolute',
                top: 'calc(100% + 6px)',
                left: 0,
                width: 310,
                zIndex: 85,
                background: '#FFFFFF',
                border: '1px solid #E2E8F0',
                borderRadius: 14,
                padding: 8,
                boxShadow: '0 14px 36px rgba(15, 23, 42, 0.16)',
              }}
            >
              <div style={{ padding: '4px 8px 6px 8px', fontSize: '0.68rem', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Hệ sinh thái 4 Gói SaaS (1-Click Unlock)
              </div>
              {(Object.keys(SAAS_PACKAGES_CATALOG) as SaasPackageCode[]).map((code) => {
                const pkg = SAAS_PACKAGES_CATALOG[code];
                const isActivePkg = packageCode === code;
                return (
                  <button
                    key={code}
                    type="button"
                    onClick={() => {
                      setIsPkgOpen(false);
                      if (!isActivePkg) {
                        void switchPackage(code);
                        navigate('/');
                      }
                    }}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'flex-start',
                      justifyContent: 'space-between',
                      gap: 8,
                      padding: '8px 10px',
                      borderRadius: 10,
                      border: 'none',
                      cursor: 'pointer',
                      background: isActivePkg ? 'rgba(30, 64, 255, 0.08)' : 'transparent',
                      textAlign: 'left',
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '0.78rem', fontWeight: 700, color: isActivePkg ? '#1E40FF' : '#0F172A' }}>
                        {pkg.shortName}
                      </div>
                      <div style={{ fontSize: '0.68rem', color: '#64748B', marginTop: 1 }}>
                        {pkg.badge}
                      </div>
                    </div>
                    {isActivePkg && <Check size={14} color="#1E40FF" style={{ flexShrink: 0, marginTop: 2 }} />}
                  </button>
                );
              })}
              <div style={{ borderTop: '1px solid #F1F5F9', margin: '6px 0' }} />
              <button
                type="button"
                onClick={() => {
                  setIsPkgOpen(false);
                  openBilling();
                }}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '7px 10px',
                  borderRadius: 8,
                  border: 'none',
                  cursor: 'pointer',
                  background: 'transparent',
                  color: '#1E40FF',
                  fontSize: '0.76rem',
                  fontWeight: 700,
                }}
              >
                <CreditCard size={13} /> Mở bảng Gói cước & Ví chi tiết
              </button>
            </div>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
        {/* Tour màn hình này */}
        <button
          onClick={() => openTour()}
          style={{
            width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'var(--color-text-light)', borderRadius: 8, border: 'none', background: 'none', cursor: 'pointer'
          }}
          title={t('Tour hướng dẫn màn hình hiện tại')}
        >
          <Compass size={19} />
        </button>
        
        {/* Live Activity Feed Button */}
        <button 
          onClick={onActivityFeedClick}
          style={{
            width: 36,
            height: 36,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--color-text-light)',
            borderRadius: 8,
            border: 'none',
            background: 'none',
            cursor: 'pointer',
            transition: 'all 0.2s',
            position: 'relative',
            outline: 'none'
          }}
          title={t("Bản tin hoạt động hệ thống")}
          onMouseEnter={e => {
            e.currentTarget.style.background = 'var(--color-bg)';
            e.currentTarget.style.color = 'var(--color-primary)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = 'none';
            e.currentTarget.style.color = 'var(--color-text-light)';
          }}
        >
          <Activity size={20} />
          <span style={{
            position: 'absolute',
            top: 6,
            right: 6,
            width: 8,
            height: 8,
            borderRadius: '50%',
            background: '#10b981',
            boxShadow: '0 0 0 2px var(--color-surface)',
            animation: 'pulse 2s infinite'
          }} />
        </button>

        {/* Theme Toggle Button */}
        <button
          onClick={toggleTheme}
          style={{
            width: 36,
            height: 36,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--color-text-light)',
            borderRadius: 8,
            border: 'none',
            background: 'none',
            cursor: 'pointer',
            transition: 'all 0.2s',
            outline: 'none'
          }}
          title={theme === 'light' ? t("Chuyển sang giao diện tối") : t("Chuyển sang giao diện sáng")}
          onMouseEnter={e => {
            e.currentTarget.style.background = 'var(--color-bg)';
            e.currentTarget.style.color = 'var(--color-primary)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = 'none';
            e.currentTarget.style.color = 'var(--color-text-light)';
          }}
        >
          {theme === 'light' ? <Moon size={20} /> : <Sun size={20} style={{ color: '#fbbf24' }} />}
        </button>

        {/* Language Selector Dropdown */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsLangOpen(!isLangOpen);
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              background: 'var(--color-bg)',
              border: `1px solid ${isLangOpen ? 'var(--color-primary)' : 'var(--color-border)'}`,
              borderRadius: '6px',
              padding: '3px 6px',
              cursor: 'pointer',
              color: 'var(--color-text)',
              fontSize: '0.75rem',
              fontWeight: 500,
              transition: 'all 0.2s',
              height: 30,
              outline: 'none',
              boxShadow: 'none',
            }}
            title={t('Chọn ngôn ngữ')}
            onMouseEnter={e => {
              e.currentTarget.style.borderColor = 'var(--color-primary)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = isLangOpen ? 'var(--color-primary)' : 'var(--color-border)';
            }}
          >
            <img 
              src={languagesList.find(l => l.code === language)?.flag || vnFlag} 
              style={{ 
                width: 24, 
                height: 16, 
                borderRadius: '1.5px', 
                objectFit: 'cover',
                border: '1px solid rgba(0, 0, 0, 0.08)',
                display: 'block' 
              }} 
              alt={t(languagesList.find(l => l.code === language)?.name || 'Tiếng Việt')} 
            />
            <ChevronDown 
              size={12} 
              style={{ 
                color: 'var(--color-text-muted)',
                transform: isLangOpen ? 'rotate(180deg)' : 'none',
                transition: 'transform 0.2s'
              }} 
            />
          </button>

          <AnimatePresence>
            {isLangOpen && (
              <motion.div
                initial={{ opacity: 0, y: -15, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -15, scale: 0.95 }}
                transition={{ type: "spring", duration: 0.3, bounce: 0.05 }}
                style={{
                  position: 'absolute',
                  top: 'calc(100% + 6px)',
                  right: 0,
                  background: 'var(--color-surface)',
                  border: '1px solid var(--color-border)',
                  borderRadius: '8px',
                  padding: '4px',
                  boxShadow: '0 4px 16px rgba(0, 0, 0, 0.12)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '2px',
                  minWidth: '135px',
                  zIndex: 50,
                  transformOrigin: 'top right'
                }}
              >
                {languagesList.map(lang => (
                  <button
                    key={lang.code}
                    onClick={() => {
                      setLanguage(lang.code);
                      setIsLangOpen(false);
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      width: '100%',
                      padding: '8px 10px',
                      border: 'none',
                      background: language === lang.code ? 'var(--color-bg)' : 'transparent',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      color: 'var(--color-text)',
                      fontSize: '0.8125rem',
                      fontWeight: language === lang.code ? 600 : 400,
                      textAlign: 'left',
                      transition: 'background 0.2s'
                    }}
                    onMouseEnter={e => {
                      if (language !== lang.code) e.currentTarget.style.background = 'var(--color-bg)';
                    }}
                    onMouseLeave={e => {
                      if (language !== lang.code) e.currentTarget.style.background = 'transparent';
                    }}
                  >
                    <img 
                      src={lang.flag} 
                      style={{ width: 20, height: 14, borderRadius: '1.5px', objectFit: 'cover', border: '1px solid rgba(0, 0, 0, 0.08)' }} 
                      alt={lang.name} 
                    />
                    {lang.name}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div
          onMouseEnter={() => setIsProfileMenuOpen(true)}
          onMouseLeave={() => setIsProfileMenuOpen(false)}
          style={{ position: 'relative' }}
        >
          <div 
            onClick={handleProfileClick}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.625rem',
              paddingLeft: '0.875rem',
              borderLeft: '1px solid var(--color-border)',
              cursor: 'pointer',
              padding: '4px 8px',
              borderRadius: '6px',
              transition: 'background 0.2s',
              background: isProfileMenuOpen ? 'var(--color-bg)' : 'transparent'
            }}
          >
            <Avatar src={user?.avatar} name={user?.name} size={32} />
            <div className="responsive-hide-mobile" style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-text)' }}>{user?.name || 'User'}</span>
              <span style={{ fontSize: '0.7rem', color: 'var(--color-text-light)' }}>{user?.role_name || getRoleLabel(user?.role)}</span>
            </div>
          </div>

          <AnimatePresence>
            {isProfileMenuOpen && (
              <motion.div
                initial={{ opacity: 0, y: -15, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -15, scale: 0.95 }}
                transition={{ type: "spring", duration: 0.3, bounce: 0.05 }}
                style={{
                  position: 'absolute',
                  top: '100%',
                  right: 0,
                  background: 'var(--color-surface)',
                  border: '1px solid var(--color-border)',
                  borderRadius: '8px',
                  padding: '4px',
                  boxShadow: '0 4px 16px rgba(0, 0, 0, 0.12)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '2px',
                  minWidth: '185px',
                  zIndex: 50,
                  transformOrigin: 'top right'
                }}
              >
                <button
                  onClick={() => { setIsProfileMenuOpen(false); handleProfileClick(); }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    width: '100%',
                    padding: '8px 10px',
                    border: 'none',
                    background: 'transparent',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    color: 'var(--color-text)',
                    fontSize: '0.8125rem',
                    textAlign: 'left',
                    transition: 'background 0.2s'
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--color-bg)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <User size={14} />
                  {t('Thông tin')}
                </button>
                {canViewSystemActivity && (
                  <button
                    onClick={() => { setIsProfileMenuOpen(false); handleActivityClick(); }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      width: '100%',
                      padding: '8px 10px',
                      border: 'none',
                      background: 'transparent',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      color: 'var(--color-text)',
                      fontSize: '0.8125rem',
                      textAlign: 'left',
                      transition: 'background 0.2s'
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--color-bg)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <Activity size={14} />
                    {t('Hoạt động (Nhật ký)')}
                  </button>
                )}
                {canScreen('account') && (
                  <button
                    onClick={() => { setIsProfileMenuOpen(false); navigate('/account'); }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      width: '100%',
                      padding: '8px 10px',
                      border: 'none',
                      background: 'transparent',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      color: 'var(--color-text)',
                      fontSize: '0.8125rem',
                      textAlign: 'left',
                      transition: 'background 0.2s'
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--color-bg)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <Shield size={14} style={{ color: '#1E40FF' }} />
                    {t('Tài khoản & Bảo mật')}
                  </button>
                )}
                <button
                  onClick={() => {
                    setIsProfileMenuOpen(false);
                    window.dispatchEvent(new CustomEvent('open-notification-settings'));
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    width: '100%',
                    padding: '8px 10px',
                    border: 'none',
                    background: 'transparent',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    color: 'var(--color-text)',
                    fontSize: '0.8125rem',
                    textAlign: 'left',
                    transition: 'background 0.2s'
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--color-bg)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <Bell size={14} style={{ color: '#1E40FF' }} />
                  {t('Cấu hình Thông báo')}
                </button>

                <button
                  onClick={() => { setIsProfileMenuOpen(false); openBilling(); }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '8px', width: '100%',
                    padding: '8px 10px', border: 'none', background: 'transparent', borderRadius: '6px',
                    cursor: 'pointer', color: 'var(--color-text)', fontSize: '0.8125rem', textAlign: 'left'
                  }}
                >
                  <CreditCard size={14} style={{ color: 'var(--color-primary)' }} />
                  {t('Gói cước & Ví')}
                </button>

                <div style={{ borderBottom: '1px solid var(--color-border)', margin: '4px 0' }} />

                <button
                  onClick={handleLogout}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    width: '100%',
                    padding: '8px 10px',
                    border: 'none',
                    background: 'transparent',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    color: 'var(--color-danger)',
                    fontSize: '0.8125rem',
                    textAlign: 'left',
                    transition: 'background 0.2s'
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--color-bg)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <LogOut size={14} />
                  {t('Đăng xuất')}
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
};

