import React, { useEffect, useRef, useState } from 'react';
import {
  BookOpen,
  Bot,
  Briefcase,
  ChevronDown,
  Cpu,
  Database,
  ExternalLink,
  Home,
  Layers,
  LayoutGrid,
  Menu,
  Sparkles,
  TrendingUp,
  Workflow,
  X,
} from 'lucide-react';
import { ContactModal } from './ContactModal';
import { DomationLogoMark } from './components/DomationLogoMark';
import { handleSpaLinkClick } from './utils/navigation';

export interface NavbarProps {
  activePage?:
    | 'home'
    | 'erp'
    | 'crm'
    | 'data'
    | 'automation'
    | 'meta-report'
    | 'dom-ai'
    | 'web-design'
    | 'ideas'
    | 'boost'
    | 'portfolio'
    | 'not-found';
  onOpenContact?: () => void;
  onOpenShowcase?: () => void;
  contactLabel?: string;
  mobileContactLabel?: string;
}

const PRIMARY_APP_ROUTES = [
  {
    id: 'home' as const,
    href: '/',
    label: 'Trang chủ',
    icon: Home,
  },
  {
    id: 'meta-report' as const,
    href: '/meta-report',
    label: 'Realtime Report',
    icon: TrendingUp,
  },
  {
    id: 'data' as const,
    href: '/data',
    label: 'Chia data',
    icon: Database,
  },
  {
    id: 'automation' as const,
    href: '/automation',
    label: 'Marketing Automation',
    icon: Workflow,
  },
  {
    id: 'erp' as const,
    href: '/erp',
    label: 'Full ERP',
    icon: Cpu,
  },
  {
    id: 'dom-ai' as const,
    href: '/dom-ai',
    label: 'AI Agent',
    icon: Bot,
    isFree: true,
  },
  {
    id: 'boost' as const,
    href: '/boost',
    label: 'Blog',
    icon: BookOpen,
  },
];

const OTHER_ROUTES = [
  {
    id: 'crm' as const,
    href: '/crm',
    label: 'DOMATION CRM 360°',
    desc: 'Quản lý khách hàng tập trung & quy trình chốt đơn',
    icon: Layers,
  },
  {
    id: 'web-design' as const,
    href: '/web-design',
    label: 'Thiết Kế Web & 3D',
    desc: 'Website chuẩn chuyển đổi, sa bàn 3D & báo giá trực quan',
    icon: LayoutGrid,
  },
  {
    id: 'portfolio' as const,
    href: '/portfolio',
    label: 'Portfolio & Case Study Đa Ngành',
    desc: 'Capital House, EcoLife, RichLand, Viện IDEAS, Flora',
    icon: Briefcase,
  },
];

export const Navbar: React.FC<NavbarProps> = ({
  activePage = 'home',
  onOpenContact,
  contactLabel = 'Tư Vấn Ngay',
  mobileContactLabel,
}) => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [otherDropdownOpen, setOtherDropdownOpen] = useState(false);
  const [internalContactOpen, setInternalContactOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 18);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOtherDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  const triggerContact = () => {
    setMobileOpen(false);
    if (onOpenContact) {
      onOpenContact();
    } else {
      setInternalContactOpen(true);
    }
  };

  const isOtherSubpage =
    OTHER_ROUTES.some((r) => r.id === activePage) || activePage === 'ideas';

  return (
    <>
      <header
        className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
          scrolled
            ? 'py-2.5 bg-white/95 sm:bg-white/90 sm:backdrop-blur-2xl border-b border-slate-200/80 shadow-[0_8px_32px_-12px_rgba(30,64,255,0.1)]'
            : 'py-3 bg-white/90 sm:bg-white/75 sm:backdrop-blur-xl border-b border-white/60'
        }`}
      >
        <div className="max-w-7xl mx-auto px-3 sm:px-6 flex items-center justify-between gap-2">
          {/* Left: Brand Logo (Links to Home /) */}
          <a
            href="/"
            onClick={(e) => handleSpaLinkClick(e, '/')}
            className="flex items-center gap-2 sm:gap-2.5 shrink-0 group min-w-0"
          >
            <DomationLogoMark className="w-8 h-8 sm:w-9 sm:h-9 shadow-sm rounded-xl group-hover:scale-105 transition-transform shrink-0" />
            <div className="flex flex-col leading-none min-w-0">
              <span className="text-[15px] sm:text-lg font-bold tracking-tight text-slate-900 truncate">
                DOMATION<span className="text-[#1E40FF]">.NET</span>
              </span>
              <span className="text-[7.5px] sm:text-[9px] font-semibold tracking-[0.11em] sm:tracking-[0.16em] uppercase text-slate-500 mt-0.5 truncate">
                Enterprise Technology
              </span>
            </div>
          </a>

          {/* Center: Synchronized Primary Routes + Khác Dropdown Across ALL Pages */}
          <nav
            aria-label="Điều hướng chính"
            className="hidden lg:flex items-center gap-0.5 p-1 rounded-full bg-white/90 backdrop-blur-xl border border-slate-200/85 shadow-sm"
          >
            {PRIMARY_APP_ROUTES.map((route) => {
              const isActive = activePage === route.id;
              return (
                <a
                  key={route.id}
                  href={route.href}
                  onClick={(e) => handleSpaLinkClick(e, route.href)}
                  className={`px-2.5 xl:px-3 py-1.5 rounded-full text-[11px] xl:text-xs font-bold transition-colors whitespace-nowrap inline-flex items-center gap-1.5 ${
                    isActive
                      ? 'bg-blue-50 text-[#1E40FF]'
                      : 'text-slate-700 hover:text-[#1E40FF] hover:bg-blue-50/70'
                  }`}
                >
                  <span>{route.label}</span>
                  {route.isFree && (
                    <span className="px-1.5 py-0.5 rounded-full bg-emerald-500 text-white text-[9px] font-extrabold leading-none tracking-wide">
                      FREE
                    </span>
                  )}
                </a>
              );
            })}

            {/* Unified Khác Dropdown: CRM + Web 3D + Portfolio */}
            <div ref={dropdownRef} className="relative">
              <button
                type="button"
                onClick={() => setOtherDropdownOpen((v) => !v)}
                className={`px-2.5 xl:px-3 py-1.5 rounded-full text-[11px] xl:text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer whitespace-nowrap ${
                  isOtherSubpage || otherDropdownOpen
                    ? 'bg-blue-50 text-[#1E40FF]'
                    : 'text-slate-700 hover:text-[#1E40FF] hover:bg-blue-50/70'
                }`}
              >
                <span>Khác</span>
                <ChevronDown
                  className={`w-3.5 h-3.5 transition-transform ${
                    otherDropdownOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {otherDropdownOpen && (
                <div className="absolute right-0 mt-2.5 w-[356px] rounded-2xl bg-white border border-slate-200 shadow-[0_24px_54px_-12px_rgba(15,23,42,0.28)] p-2 z-50">
                  <div className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-widest text-slate-400">
                    Giải Pháp Bổ Trợ
                  </div>
                  <div className="space-y-1">
                    {OTHER_ROUTES.map((route) => {
                      const Icon = route.icon;
                      const isActive = activePage === route.id;
                      return (
                        <a
                          key={route.id}
                          href={route.href}
                          onClick={(e) => {
                            setOtherDropdownOpen(false);
                            handleSpaLinkClick(e, route.href);
                          }}
                          className={`flex items-start gap-3 p-2.5 rounded-xl transition-colors ${
                            isActive
                              ? 'bg-blue-50/90 text-[#1E40FF]'
                              : 'hover:bg-slate-50 text-slate-800'
                          }`}
                        >
                          <div
                            className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                              isActive
                                ? 'bg-[#1E40FF] text-white'
                                : 'bg-blue-50 text-[#1E40FF]'
                            }`}
                          >
                            <Icon className="w-4 h-4" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="text-xs font-semibold flex items-center justify-between">
                              <span>{route.label}</span>
                              <ExternalLink className="w-3 h-3 opacity-45" />
                            </div>
                            <div className="text-[11px] text-slate-500 mt-0.5 truncate">
                              {route.desc}
                            </div>
                          </div>
                        </a>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </nav>

          {/* Right: Contact CTA + Mobile Toggle */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <button
              type="button"
              onClick={triggerContact}
              className="btn-inkica-primary min-h-[44px] sm:min-h-[40px] px-2.5 sm:px-4 py-1.5 sm:py-2 text-[11px] sm:text-xs cursor-pointer whitespace-nowrap rounded-xl"
            >
              <Sparkles className="hidden sm:inline w-3.5 h-3.5 text-cyan-200 shrink-0" />
              <span className="sm:hidden">{mobileContactLabel || contactLabel}</span>
              <span className="hidden sm:inline">{contactLabel}</span>
            </button>

            <button
              type="button"
              onClick={() => setMobileOpen((v) => !v)}
              aria-label="Menu di động"
              className="lg:hidden w-11 h-11 rounded-xl bg-white/95 border border-slate-200 text-slate-700 flex items-center justify-center cursor-pointer shrink-0"
            >
              {mobileOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Synchronized Mobile Drawer */}
        {mobileOpen && (
          <div className="lg:hidden mt-2 mx-4 rounded-2xl bg-white border border-slate-200 shadow-2xl p-4 space-y-4">
            <div>
              <div className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 mb-2">
                Điều Hướng Chính
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                {PRIMARY_APP_ROUTES.map((route) => {
                  const Icon = route.icon;
                  const isActive = activePage === route.id;
                  return (
                    <a
                      key={route.id}
                      href={route.href}
                      onClick={(e) => {
                        setMobileOpen(false);
                        handleSpaLinkClick(e, route.href);
                      }}
                      className={`flex items-center justify-between gap-2.5 p-2.5 rounded-xl transition-colors ${
                        isActive
                          ? 'bg-blue-50 text-[#1E40FF]'
                          : 'hover:bg-slate-50 text-slate-800'
                      }`}
                    >
                      <span className="flex items-center gap-2.5">
                        <Icon className="w-4 h-4 text-[#1E40FF] shrink-0" />
                        <span className="text-xs font-bold">{route.label}</span>
                      </span>
                      {route.isFree && (
                        <span className="px-1.5 py-0.5 rounded-full bg-emerald-500 text-white text-[9px] font-extrabold">
                          FREE
                        </span>
                      )}
                    </a>
                  );
                })}
              </div>
            </div>

            <div className="border-t border-slate-100 pt-3">
              <div className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 mb-2">
                Giải Pháp Bổ Trợ
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                {OTHER_ROUTES.map((route) => {
                  const Icon = route.icon;
                  const isActive = activePage === route.id;
                  return (
                    <a
                      key={route.id}
                      href={route.href}
                      onClick={(e) => {
                        setMobileOpen(false);
                        handleSpaLinkClick(e, route.href);
                      }}
                      className={`flex items-center gap-2.5 p-2 rounded-xl transition-colors ${
                        isActive
                          ? 'bg-blue-50 text-[#1E40FF]'
                          : 'hover:bg-slate-50 text-slate-800'
                      }`}
                    >
                      <Icon className="w-4 h-4 text-[#1E40FF] shrink-0" />
                      <span className="text-xs font-bold">{route.label}</span>
                    </a>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </header>

      {!onOpenContact && (
        <ContactModal
          isOpen={internalContactOpen}
          onClose={() => setInternalContactOpen(false)}
        />
      )}
    </>
  );
};
