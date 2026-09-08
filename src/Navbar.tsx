import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Layers,
  ChevronDown,
  Building2,
  Users,
  Zap,
  Bot,
  BarChart3,
  Globe,
  MessageSquare,
  Menu,
  X,
  Sparkles,
  ArrowRight,
  PhoneCall
} from 'lucide-react';
import { ContactModal } from './ContactModal';

export interface NavbarProps {
  activePage?: 'home' | 'erp' | 'crm' | 'data' | 'automation' | 'meta-report' | 'web-design' | 'ideas';
  onOpenContact?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ activePage = 'home', onOpenContact }) => {
  const [scrolled, setScrolled] = useState(false);
  const [servicesOpen, setServicesOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [internalContactOpen, setInternalContactOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setServicesOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleContactClick = () => {
    if (onOpenContact) {
      onOpenContact();
    } else {
      setInternalContactOpen(true);
    }
  };

  const services = [
    {
      title: 'Hệ Thống ERP',
      badge: 'Mới • Chuyên sâu',
      badgeColor: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
      description: 'Quản trị doanh nghiệp, HRM, chấm công GPS & tính lương tự động',
      icon: Building2,
      href: '/erp',
      id: 'erp',
      color: 'from-rose-500 to-red-600',
      textColor: 'text-rose-400'
    },
    {
      title: 'Hệ Thống CRM',
      badge: 'Bất Động Sản',
      badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
      description: 'Quản lý Lead, giỏ hàng trực tiếp, chăm sóc khách hàng đa kênh',
      icon: Users,
      href: '/crm',
      id: 'crm',
      color: 'from-purple-500 to-fuchsia-600',
      textColor: 'text-purple-400'
    },
    {
      title: 'Auto Data Lead',
      badge: 'Tự Động Hóa',
      badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
      description: 'Phân bổ lead thông minh qua 5 cổng, van chống ôm, chống trùng SĐT',
      icon: Zap,
      href: '/data',
      id: 'data',
      color: 'from-amber-500 to-orange-500',
      textColor: 'text-amber-400'
    },
    {
      title: 'Marketing Automation',
      badge: 'AI Marketing',
      badgeColor: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
      description: 'Quy trình tiếp thị tự động hóa, nuôi dưỡng và chuyển đổi khách hàng',
      icon: Bot,
      href: '/automation',
      id: 'automation',
      color: 'from-blue-500 to-cyan-500',
      textColor: 'text-blue-400'
    },
    {
      title: 'Meta-Report & CAPI',
      badge: 'Báo Cáo Ads',
      badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
      description: 'Đối soát chi phí Ads, đo lường CAC/ROAS và kết nối CAPI khép kín',
      icon: BarChart3,
      href: '/meta-report',
      id: 'meta-report',
      color: 'from-emerald-500 to-teal-500',
      textColor: 'text-emerald-400'
    },
    {
      title: 'Web & Landing Page',
      badge: 'Design High-CR',
      badgeColor: 'bg-sky-500/20 text-sky-300 border-sky-500/30',
      description: 'Thiết kế website doanh nghiệp & landing page chuẩn nhận diện thương hiệu',
      icon: Globe,
      href: '/web-design',
      id: 'web-design',
      color: 'from-sky-500 to-indigo-500',
      textColor: 'text-sky-400'
    }
  ];

  return (
    <>
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled
            ? 'bg-[#080c14]/92 backdrop-blur-xl border-b border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.6)]'
            : 'bg-[#080c14]/60 backdrop-blur-md border-b border-white/5'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-20 flex items-center justify-between">
          {/* Logo & Brand */}
          <a href="/" className="flex items-center gap-3 group">
            <div className="relative">
              <img
                src="/imgs/ICON.png"
                alt="DOMATION Logo"
                className="w-10 h-10 rounded-[14px] object-contain shadow-lg shadow-orange-500/20 group-hover:scale-105 transition-transform"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
              <div className="absolute -inset-1 rounded-[18px] bg-gradient-to-r from-orange-500/30 to-rose-500/30 blur-md -z-10" />
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-black tracking-tight text-white group-hover:text-orange-400 transition-colors">
                DOMATION
              </span>
              <span className="text-[9px] uppercase font-bold tracking-widest text-slate-400 -mt-1">
                Enterprise & Tech
              </span>
            </div>
          </a>

          {/* Desktop Clean Menu */}
          <div className="hidden lg:flex items-center gap-2">
            {/* Direct Link: Hệ thống ERP (Mới & Nổi bật) */}
            <a
              href="/erp"
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-bold transition-all duration-200 ${
                activePage === 'erp'
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 shadow-[0_0_15px_rgba(244,63,94,0.3)]'
                  : 'text-slate-300 hover:text-rose-300 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20'
              }`}
            >
              <Building2 className="w-3.5 h-3.5 text-rose-400" />
              <span>Hệ Thống ERP</span>
              <span className="ml-1 px-1.5 py-0.5 rounded-full text-[9px] font-extrabold bg-rose-500 text-white uppercase tracking-wider">
                MỚI
              </span>
            </a>

            {/* Direct Link: CRM */}
            <a
              href="/crm"
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-bold transition-all duration-200 ${
                activePage === 'crm'
                  ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40 shadow-[0_0_15px_rgba(168,85,247,0.3)]'
                  : 'text-slate-300 hover:text-purple-300 hover:bg-purple-500/10 border border-transparent hover:border-purple-500/20'
              }`}
            >
              <Users className="w-3.5 h-3.5 text-purple-400" />
              <span>Hệ Thống CRM</span>
            </a>

            {/* Direct Link: Auto Data */}
            <a
              href="/data"
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-bold transition-all duration-200 ${
                activePage === 'data'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-[0_0_15px_rgba(245,158,11,0.3)]'
                  : 'text-slate-300 hover:text-amber-300 hover:bg-amber-500/10 border border-transparent hover:border-amber-500/20'
              }`}
            >
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span>Auto Data Lead</span>
            </a>

            {/* Dropdown: Tất cả dịch vụ & Giải pháp */}
            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setServicesOpen(!servicesOpen)}
                onMouseEnter={() => setServicesOpen(true)}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-bold border transition-all duration-200 ${
                  servicesOpen || ['automation', 'meta-report', 'web-design'].includes(activePage)
                    ? 'border-orange-500/40 bg-orange-500/10 text-orange-300'
                    : 'border-white/10 text-slate-300 hover:border-white/20 hover:text-white'
                }`}
              >
                <Layers className="w-3.5 h-3.5 text-orange-400" />
                <span>Giải Pháp Khác</span>
                <ChevronDown
                  className={`w-3.5 h-3.5 transition-transform duration-200 ${
                    servicesOpen ? 'rotate-180 text-orange-400' : 'text-slate-400'
                  }`}
                />
              </button>

              <AnimatePresence>
                {servicesOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.96 }}
                    transition={{ duration: 0.18 }}
                    onMouseLeave={() => setServicesOpen(false)}
                    className="absolute top-full right-0 mt-3 w-[560px] p-3 rounded-2xl bg-[#0d121f] border border-white/10 shadow-[0_20px_60px_rgba(0,0,0,0.8)] backdrop-blur-2xl z-50 grid grid-cols-2 gap-2"
                  >
                    <div className="col-span-2 px-3 py-2 border-b border-white/5 flex items-center justify-between text-[11px] text-slate-400">
                      <span className="font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-orange-400" /> Hệ Sinh Thái DOMATION
                      </span>
                      <a href="/" className="text-orange-400 hover:underline flex items-center gap-1">
                        Trang chủ <ArrowRight className="w-3 h-3" />
                      </a>
                    </div>

                    {services.map((item) => {
                      const Icon = item.icon;
                      const isActive = activePage === item.id;
                      return (
                        <a
                          key={item.id}
                          href={item.href}
                          className={`flex items-start gap-3 p-3 rounded-xl transition-all duration-200 group ${
                            isActive
                              ? 'bg-white/10 border border-white/15'
                              : 'hover:bg-white/5 border border-transparent hover:border-white/5'
                          }`}
                        >
                          <div
                            className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 bg-gradient-to-br ${item.color} text-white shadow-md`}
                          >
                            <Icon className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 mb-0.5">
                              <span className="text-xs font-bold text-white group-hover:text-orange-300 transition-colors truncate">
                                {item.title}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                              {item.description}
                            </p>
                          </div>
                        </a>
                      );
                    })}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Action CTAs */}
          <div className="hidden sm:flex items-center gap-2.5">
            <button
              type="button"
              onClick={handleContactClick}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-bold text-slate-300 border border-white/10 hover:border-orange-500/40 hover:bg-orange-500/10 hover:text-orange-300 transition-all duration-200 cursor-pointer"
            >
              <MessageSquare className="w-3.5 h-3.5 text-orange-400" />
              <span>Liên Hệ Hỗ Trợ</span>
            </button>

            {activePage === 'erp' ? (
              <button
                type="button"
                onClick={handleContactClick}
                className="flex items-center gap-1.5 bg-gradient-to-r from-rose-500 to-red-600 text-white px-4 py-2 rounded-full text-xs font-bold shadow-[0_0_20px_rgba(244,63,94,0.4)] hover:shadow-[0_0_25px_rgba(244,63,94,0.6)] hover:-translate-y-0.5 transition-all duration-200 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Tư Vấn ERP</span>
              </button>
            ) : activePage === 'crm' ? (
              <a
                href="https://crm-domation.vercel.app/"
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 bg-gradient-to-r from-purple-500 to-fuchsia-600 text-white px-4 py-2 rounded-full text-xs font-bold shadow-[0_0_20px_rgba(168,85,247,0.4)] hover:shadow-[0_0_25px_rgba(168,85,247,0.6)] hover:-translate-y-0.5 transition-all duration-200"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Demo CRM</span>
              </a>
            ) : (
              <a
                href="/erp"
                className="flex items-center gap-1.5 bg-gradient-to-r from-orange-500 to-amber-500 text-slate-950 px-4 py-2 rounded-full text-xs font-black shadow-[0_0_20px_rgba(249,115,22,0.4)] hover:shadow-[0_0_25px_rgba(249,115,22,0.6)] hover:-translate-y-0.5 transition-all duration-200"
              >
                <Building2 className="w-3.5 h-3.5" />
                <span>Khám Phá ERP</span>
              </a>
            )}
          </div>

          {/* Mobile Hamburger Button */}
          <div className="flex lg:hidden items-center gap-2">
            <button
              type="button"
              onClick={handleContactClick}
              className="p-2 rounded-full bg-white/5 border border-white/10 text-orange-400"
              aria-label="Liên hệ"
            >
              <PhoneCall className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl bg-white/5 border border-white/10 text-white hover:bg-white/10"
              aria-label="Mở menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5 text-orange-400" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-40 lg:hidden">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
              onClick={() => setMobileMenuOpen(false)}
            />

            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="absolute top-0 right-0 bottom-0 w-[85%] max-w-sm bg-[#0a0e1a] border-l border-white/10 p-6 pt-24 overflow-y-auto flex flex-col justify-between"
            >
              <div>
                <div className="text-[11px] font-bold uppercase tracking-widest text-orange-400 mb-4 flex items-center gap-2">
                  <Sparkles className="w-3.5 h-3.5" /> Toàn Bộ Giải Pháp & Dịch Vụ
                </div>

                <div className="flex flex-col gap-2">
                  {services.map((item) => {
                    const Icon = item.icon;
                    const isActive = activePage === item.id;
                    return (
                      <a
                        key={item.id}
                        href={item.href}
                        onClick={() => setMobileMenuOpen(false)}
                        className={`flex items-center justify-between p-3 rounded-xl border transition-colors ${
                          isActive
                            ? 'bg-white/10 border-orange-500/40 text-white'
                            : 'bg-white/[0.02] border-white/5 text-slate-300 hover:bg-white/5'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-8 h-8 rounded-lg flex items-center justify-center bg-gradient-to-br ${item.color} text-white`}
                          >
                            <Icon className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="text-xs font-bold text-white">{item.title}</div>
                            <div className="text-[10px] text-slate-400 line-clamp-1">{item.description}</div>
                          </div>
                        </div>
                        <ArrowRight className="w-4 h-4 text-slate-500" />
                      </a>
                    );
                  })}
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-white/10 flex flex-col gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    handleContactClick();
                  }}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 text-slate-950 font-black text-xs shadow-lg shadow-orange-500/20 cursor-pointer"
                >
                  <MessageSquare className="w-4 h-4" />
                  Liên Hệ Tư Vấn Nhanh
                </button>
                <div className="text-center text-[11px] text-slate-500">
                  DOMATION Tech Ecosystem • 2026
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Internal Contact Modal if no callback passed */}
      {!onOpenContact && (
        <ContactModal
          isOpen={internalContactOpen}
          onClose={() => setInternalContactOpen(false)}
          themeColor="orange-500"
        />
      )}
    </>
  );
};
