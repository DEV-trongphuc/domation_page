import React, { useEffect, useRef, useState } from 'react';
import {
  BookOpen,
  Briefcase,
  ChevronDown,
  Cpu,
  Database,
  ExternalLink,
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
    | 'web-design'
    | 'ideas'
    | 'boost'
    | 'portfolio';
  onOpenContact?: () => void;
  onOpenShowcase?: () => void;
  contactLabel?: string;
  mobileContactLabel?: string;
}

const HOME_ANCHORS = [
  { href: '#story', label: 'Câu Chuyện' },
  { href: '#multi-agent', label: 'AI Agent' },
  { href: '#solutions', label: 'Vận Hành' },
  { href: '#cases', label: 'Dự Án' },
  { href: '#pricing', label: 'Đầu Tư' },
];

const ECOSYSTEM_ROUTES = [
  {
    id: 'data',
    href: '/data',
    label: 'Auto Data & Meta CAPI',
    desc: 'Chia Lead ZaloBot < 5s & HTTP 200',
    icon: Database,
  },
  {
    id: 'erp',
    href: '/erp',
    label: 'Enterprise ERP 5.0',
    desc: '12 phân hệ • GPS AI & Payroll PDF',
    icon: Cpu,
  },
  {
    id: 'crm',
    href: '/crm',
    label: 'CRM 360°',
    desc: 'Kanban 8 nấc & hóa đơn điện tử',
    icon: Layers,
  },
  {
    id: 'automation',
    href: '/automation',
    label: 'Automation & AI RAG',
    desc: 'Visual Flow & AI Phòng Ban 24/7',
    icon: Workflow,
  },
  {
    id: 'meta-report',
    href: '/meta-report',
    label: 'Meta Ad Report',
    desc: 'Đo lường ROAS & Video Hook Rate',
    icon: TrendingUp,
  },
  {
    id: 'web-design',
    href: '/web-design',
    label: 'Thiết Kế Web & 3D',
    desc: 'WebGL bóc mái & Dự toán từ 12.0M₫',
    icon: LayoutGrid,
  },
];

const GROWTH_ROUTES = [
  {
    id: 'boost',
    href: '/boost',
    label: 'Tin Tức & Kinh Nghiệm Triển Khai',
    desc: 'Bài viết chuyên đề, vận hành & công nghệ đa ngành',
    icon: BookOpen,
  },
  {
    id: 'portfolio',
    href: '/portfolio',
    label: 'Portfolio & Case Study Đa Ngành',
    desc: 'Capital House, INKICA, IDEAS, Phúc Lộc Thọ',
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
  const [ecoDropdownOpen, setEcoDropdownOpen] = useState(false);
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
        setEcoDropdownOpen(false);
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

  const isEcosystemSubpage = ECOSYSTEM_ROUTES.some((r) => r.id === activePage) || activePage === 'ideas';

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
          {/* Left: Brand SVG Monogram D Logo */}
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

          {/* Center: Frosted Pill Menu (Desktop) */}
          <nav
            aria-label="Điều hướng chính"
            className="hidden lg:flex items-center gap-0.5 xl:gap-1 p-1 rounded-full bg-white/85 backdrop-blur-xl border border-slate-200/80 shadow-sm"
          >
            {activePage === 'home' ? (
              HOME_ANCHORS.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className="px-2.5 xl:px-3 py-1.5 rounded-full text-xs font-bold text-slate-600 hover:text-[#1E40FF] hover:bg-blue-50/70 transition-colors whitespace-nowrap"
                >
                  {link.label}
                </a>
              ))
            ) : (
              <a
                href="/"
                onClick={(e) => handleSpaLinkClick(e, '/')}
                className="px-3 py-1.5 rounded-full text-xs font-bold text-slate-600 hover:text-[#1E40FF] hover:bg-blue-50/70 transition-colors whitespace-nowrap"
              >
                Trang Chủ
              </a>
            )}

            <a
              href="/boost"
              onClick={(e) => handleSpaLinkClick(e, '/boost')}
              className={`px-2.5 xl:px-3 py-1.5 rounded-full text-xs font-bold transition-colors whitespace-nowrap ${
                activePage === 'boost'
                  ? 'bg-blue-50 text-[#1E40FF]'
                  : 'text-slate-700 hover:text-[#1E40FF] hover:bg-blue-50/70'
              }`}
            >
              Tin Tức
            </a>

            {/* Ecosystem Apps Dropdown */}
            <div ref={dropdownRef} className="relative">
              <button
                type="button"
                onClick={() => setEcoDropdownOpen((v) => !v)}
                className={`px-2.5 xl:px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer whitespace-nowrap ${
                  isEcosystemSubpage || ecoDropdownOpen
                    ? 'bg-blue-50 text-[#1E40FF]'
                    : 'text-slate-700 hover:text-[#1E40FF] hover:bg-blue-50/70'
                }`}
              >
                <span>Hệ Sinh Thái App</span>
                <ChevronDown
                  className={`w-3.5 h-3.5 transition-transform ${
                    ecoDropdownOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {ecoDropdownOpen && (
                <div className="absolute right-0 mt-2.5 w-[356px] rounded-2xl bg-white border border-slate-200 shadow-[0_24px_54px_-12px_rgba(15,23,42,0.28)] p-2 z-50">
                  <div className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-widest text-slate-400">
                    Chuyên Trang Sản Phẩm Độc Lập
                  </div>
                  <div className="space-y-1">
                    {ECOSYSTEM_ROUTES.map((route) => {
                      const Icon = route.icon;
                      const isActive = activePage === route.id;
                      return (
                        <a
                          key={route.id}
                          href={route.href}
                          onClick={(e) => {
                            setEcoDropdownOpen(false);
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

                  <div className="mt-2 pt-2 border-t border-slate-100">
                    <div className="px-3 py-1 text-[10px] font-semibold uppercase tracking-widest text-slate-400">
                      Tin Tức &amp; Portfolio
                    </div>
                    <div className="space-y-1">
                      {GROWTH_ROUTES.map((route) => {
                        const Icon = route.icon;
                        const isActive = activePage === route.id;
                        return (
                          <a
                            key={route.id}
                            href={route.href}
                            onClick={(e) => {
                              setEcoDropdownOpen(false);
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
                                  : 'bg-emerald-50 text-emerald-700'
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
                </div>
              )}
            </div>
          </nav>

          {/* Right: Contact CTA + Mobile Toggle */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <button
              type="button"
              onClick={triggerContact}
              className="btn-inkica-primary px-2.5 sm:px-4 py-1.5 sm:py-2 text-[11px] sm:text-xs cursor-pointer whitespace-nowrap rounded-xl"
            >
              <Sparkles className="hidden sm:inline w-3.5 h-3.5 text-cyan-200 shrink-0" />
              <span className="sm:hidden">{mobileContactLabel || contactLabel}</span>
              <span className="hidden sm:inline">{contactLabel}</span>
            </button>

            <button
              type="button"
              onClick={() => setMobileOpen((v) => !v)}
              aria-label="Menu di động"
              className="lg:hidden w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-white/95 border border-slate-200 text-slate-700 flex items-center justify-center cursor-pointer shrink-0"
            >
              {mobileOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Mobile Drawer */}
        {mobileOpen && (
          <div className="lg:hidden mt-2 mx-4 rounded-2xl bg-white border border-slate-200 shadow-2xl p-4 space-y-4">
            {activePage === 'home' && (
              <div className="grid grid-cols-2 gap-2">
                {HOME_ANCHORS.map((link) => (
                  <a
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileOpen(false)}
                    className="px-3 py-2 rounded-xl bg-slate-50 text-xs font-bold text-slate-700 hover:bg-blue-50 hover:text-[#1E40FF]"
                  >
                    {link.label}
                  </a>
                ))}
              </div>
            )}

            <a
              href="/boost"
              onClick={(e) => {
                setMobileOpen(false);
                handleSpaLinkClick(e, '/boost');
              }}
              className="w-full px-3.5 py-2.5 rounded-xl bg-blue-50 border border-blue-200 text-xs font-bold text-[#1E40FF] flex items-center gap-2"
            >
              <BookOpen className="w-4 h-4 shrink-0" />
              <span>Tin Tức &amp; Kinh Nghiệm Triển Khai</span>
            </a>

            <div className="border-t border-slate-100 pt-3">
              <div className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 mb-2">
                Chuyên Trang Sản Phẩm
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                {ECOSYSTEM_ROUTES.map((route) => {
                  const Icon = route.icon;
                  return (
                    <a
                      key={route.id}
                      href={route.href}
                      onClick={(e) => {
                        setMobileOpen(false);
                        handleSpaLinkClick(e, route.href);
                      }}
                      className="flex items-center gap-2.5 p-2 rounded-xl hover:bg-slate-50 text-slate-800"
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
