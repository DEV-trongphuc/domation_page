import React, { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare } from 'lucide-react';
import { ContactModal } from './ContactModal';

// ── Lightbox ────────────────────────────────────────────────────
const Lightbox = ({ src, onClose }: { src: string; onClose: () => void }) => {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-[200] flex items-center justify-center p-4 md:p-8 bg-black/85 backdrop-blur-md"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.88, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 10 }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          className="relative max-w-5xl w-full max-h-[90vh]"
          onClick={e => e.stopPropagation()}
        >
          <img src={src} alt="Preview" className="w-full h-full object-contain rounded-2xl shadow-2xl" style={{ maxHeight: '85vh' }} />
          <button
            onClick={onClose}
            className="absolute -top-3 -right-3 w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/20 flex items-center justify-center text-white text-lg transition-colors"
          >✕</button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

// ── Image Gallery Block ─────────────────────────────────────────
const GalleryBlock = ({
  main, thumbs, accentGlow, onOpen,
}: {
  main: string; thumbs: string[]; accentGlow: string; onOpen: (src: string) => void;
}) => (
  <div className="flex flex-col gap-3">
    {/* Main image */}
    <div
      className="relative rounded-[22px] overflow-hidden border border-white/10 cursor-zoom-in group"
      style={{ boxShadow: `0 0 60px ${accentGlow}` }}
      onClick={() => onOpen(main)}
    >
      <img src={main} alt="Main" className="w-full h-auto object-cover group-hover:scale-[1.03] transition-transform duration-700" loading="lazy" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-center pb-4">
        <span className="px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-xs font-bold text-white">🔍 Phóng to</span>
      </div>
    </div>
    {/* Thumbnails */}
    <div className={`grid gap-3 ${thumbs.length === 2 ? 'grid-cols-2' : 'grid-cols-3'}`}>
      {thumbs.map((src, i) => (
        <div
          key={i}
          className="relative rounded-[14px] overflow-hidden border border-white/10 cursor-zoom-in group aspect-video"
          onClick={() => onOpen(src)}
        >
          <img src={src} alt={`thumb-${i}`} className="w-full h-full object-cover group-hover:scale-[1.06] transition-transform duration-500" loading="lazy" />
          <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
            <span className="text-white text-lg">🔍</span>
          </div>
        </div>
      ))}
    </div>
  </div>
);

// ── Main ────────────────────────────────────────────────────────
export const DomationHome: React.FC = () => {
  const [scrolled, setScrolled] = useState(false);
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);
  const [showContactModal, setShowContactModal] = useState(false);
  const openLightbox = useCallback((src: string) => setLightboxSrc(src), []);
  const closeLightbox = useCallback(() => setLightboxSrc(null), []);

  useEffect(() => {
    window.scrollTo(0, 0);
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div className="min-h-screen bg-[#080c14] text-white overflow-x-hidden" style={{ fontFamily: "'Inter',sans-serif", scrollbarWidth: 'thin', scrollbarColor: '#f97316 transparent' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800;900&display=swap');
        @keyframes shimmer { 0%{background-position:-200% center} 100%{background-position:200% center} }
        .shimmer-orange { background:linear-gradient(90deg,#fbbf24 0%,#f97316 35%,#fb923c 65%,#fbbf24 100%); background-size:200% auto; -webkit-background-clip:text; background-clip:text; -webkit-text-fill-color:transparent; animation:shimmer 4s linear infinite; }
        .shimmer-meta { background:linear-gradient(90deg,#f97316 0%,#ef4444 50%,#f97316 100%); background-size:200% auto; -webkit-background-clip:text; background-clip:text; -webkit-text-fill-color:transparent; animation:shimmer 4s linear infinite; }
        .shimmer-crm { background:linear-gradient(90deg,#a855f7 0%,#ec4899 50%,#a855f7 100%); background-size:200% auto; -webkit-background-clip:text; background-clip:text; -webkit-text-fill-color:transparent; animation:shimmer 4s linear infinite; }
        @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-6px)} }
        .float { animation: float 4s ease-in-out infinite; }
        @keyframes pulse-dot { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.4;transform:scale(.7)} }
        .pulse-dot { animation: pulse-dot 1.4s ease-in-out infinite; }
        @keyframes bg1 { 0%,100%{opacity:.1} 50%{opacity:.17} }
        @keyframes bg2 { 0%,100%{opacity:.07} 50%{opacity:.13} }
      `}</style>

      {/* BG */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full bg-orange-500/[0.12] blur-[130px]" style={{ animation: 'bg1 20s ease-in-out infinite' }} />
        <div className="absolute bottom-[10%] right-[-15%] w-[55%] h-[55%] rounded-full bg-amber-500/[0.08] blur-[130px]" style={{ animation: 'bg2 25s ease-in-out infinite' }} />
        <div className="hidden md:block absolute inset-0 opacity-[0.025]" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,1) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,1) 1px,transparent 1px)', backgroundSize: '60px 60px' }} />
      </div>

      {/* Nav */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-[#080c14]/92 backdrop-blur-xl border-b border-white/5 shadow-[0_8px_32px_rgba(0,0,0,0.5)]' : 'bg-transparent'}`}>
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="float relative">
              <img src="/imgs/ICON.png" alt="DOMATION" className="w-10 h-10 rounded-[14px] object-contain shadow-lg shadow-orange-500/25" />
              <div className="absolute -inset-1 rounded-[18px] bg-orange-500/20 blur-md -z-10" />
            </div>
            <span className="text-xl font-black tracking-tight shimmer-orange">DOMATION</span>
          </div>
          <div className="flex items-center gap-2">
            <a href="/automation" className="hidden md:flex items-center gap-1.5 px-4 py-2 text-[11px] font-bold text-slate-300 border border-white/10 rounded-full hover:border-orange-500/40 hover:bg-orange-500/10 hover:text-orange-400 transition-all">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-orange-400">
                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
              </svg>
              Automation
            </a>
            <a href="/meta-report" className="hidden md:flex items-center gap-1.5 px-4 py-2 text-[11px] font-bold text-slate-300 border border-white/10 rounded-full hover:border-orange-500/40 hover:bg-orange-500/10 hover:text-orange-400 transition-all">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-orange-400">
                <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>
              </svg>
              Meta Report
            </a>
            <a href="/crm" className="hidden md:flex items-center gap-1.5 px-4 py-2 text-[11px] font-bold text-slate-300 border border-white/10 rounded-full hover:border-orange-500/40 hover:bg-orange-500/10 hover:text-orange-400 transition-all">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-orange-400">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
              </svg>
              CRM
            </a>
            <a href="/data" className="hidden lg:flex items-center gap-1.5 px-4 py-2 text-[11px] font-bold text-slate-300 border border-white/10 rounded-full hover:border-orange-500/40 hover:bg-orange-500/10 hover:text-orange-400 transition-all">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-orange-400">
                <ellipse cx="12" cy="5" rx="9" ry="3"></ellipse><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"></path><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"></path>
              </svg>
              Auto Data
            </a>
            <a href="/web-design" className="hidden lg:flex items-center gap-1.5 px-4 py-2 text-[11px] font-bold text-slate-300 border border-white/10 rounded-full hover:border-orange-500/40 hover:bg-orange-500/10 hover:text-orange-400 transition-all">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-orange-400">
                <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/>
              </svg>
              Web & Landing Page
            </a>
            <button onClick={() => setShowContactModal(true)} className="hidden sm:flex items-center gap-1.5 px-4 py-2 text-[11px] font-bold text-slate-300 border border-white/10 rounded-full hover:border-orange-500/40 hover:bg-orange-500/10 hover:text-orange-400 transition-all">
              <MessageSquare className="w-3.5 h-3.5 text-orange-400" />
              Liên hệ hỗ trợ
            </button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative z-10 pt-40 pb-20 px-6 text-center">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
          className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-orange-500/5 border border-orange-500/20 text-[10px] font-bold text-orange-400 uppercase tracking-[0.2em] mb-10 backdrop-blur-sm">
          <span className="pulse-dot w-1.5 h-1.5 rounded-full bg-orange-400" />
          READY TO SCALE 🚀
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, delay: 0.1 }}
          className="flex flex-col items-center mb-8">
          <span className="text-white text-lg md:text-xl font-black tracking-[0.4em] uppercase mb-4 opacity-95" style={{ textShadow: '0 0 30px rgba(255,255,255,0.3)' }}>
            BUILT TO SCALE
          </span>
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tighter leading-[0.85] uppercase shimmer-orange drop-shadow-[0_0_50px_rgba(249,115,22,0.6)]">
            DOMATION
          </h1>
        </motion.div>

        <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.25 }}
          className="text-slate-400 text-sm md:text-lg max-w-3xl mx-auto leading-relaxed mb-10">
          Tích hợp AI phân tích dữ liệu chuyên sâu, hỗ trợ theo dõi ra quyết định trên thời gian thực.<br />
          <strong className="text-slate-200">Tối ưu hóa quy trình báo cáo</strong> tiết kiệm nguồn lực và thời gian.
        </motion.p>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }} className="grid grid-cols-2 gap-3 max-w-sm mx-auto px-4 md:px-0 md:max-w-none md:flex md:flex-wrap md:justify-center md:gap-5">
          <a href="/automation" className="group flex flex-col md:flex-row items-center justify-center gap-2 md:gap-3 px-3 py-4 md:px-7 md:py-4 rounded-xl md:rounded-2xl border border-white/10 bg-white/5 text-slate-300 font-bold text-[11px] md:text-sm hover:border-orange-500/40 hover:bg-orange-500/10 hover:-translate-y-1 transition-all duration-300 backdrop-blur-md text-center">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 md:w-5 md:h-5 text-orange-400 group-hover:scale-110 transition-transform shrink-0">
              <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
            </svg>
            <span className="leading-tight">Marketing Automation</span>
          </a>
          <a href="/meta-report" className="group flex flex-col md:flex-row items-center justify-center gap-2 md:gap-3 px-3 py-4 md:px-7 md:py-4 rounded-xl md:rounded-2xl border border-white/10 bg-white/5 text-slate-300 font-bold text-[11px] md:text-sm hover:border-orange-500/40 hover:bg-orange-500/10 hover:-translate-y-1 transition-all duration-300 backdrop-blur-md text-center">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 md:w-5 md:h-5 text-orange-400 group-hover:scale-110 transition-transform shrink-0">
              <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>
            </svg>
            <span className="leading-tight">Meta Realtime Report</span>
          </a>
          <a href="/crm" className="group flex flex-col md:flex-row items-center justify-center gap-2 md:gap-3 px-3 py-4 md:px-7 md:py-4 rounded-xl md:rounded-2xl border border-white/10 bg-white/5 text-slate-300 font-bold text-[11px] md:text-sm hover:border-orange-500/40 hover:bg-orange-500/10 hover:-translate-y-1 transition-all duration-300 backdrop-blur-md text-center">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 md:w-5 md:h-5 text-orange-400 group-hover:scale-110 transition-transform shrink-0">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
            <span className="leading-tight">CRM Quản trị doanh nghiệp</span>
          </a>
          <a href="/data" className="group flex flex-col md:flex-row items-center justify-center gap-2 md:gap-3 px-3 py-4 md:px-7 md:py-4 rounded-xl md:rounded-2xl border border-white/10 bg-white/5 text-slate-300 font-bold text-[11px] md:text-sm hover:border-orange-500/40 hover:bg-orange-500/10 hover:-translate-y-1 transition-all duration-300 backdrop-blur-md text-center">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 md:w-5 md:h-5 text-orange-400 group-hover:scale-110 transition-transform shrink-0">
              <ellipse cx="12" cy="5" rx="9" ry="3"></ellipse><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"></path><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"></path>
            </svg>
            <span className="leading-tight">Auto Chia Data</span>
          </a>
        </motion.div>
      </section>

      {/* ── SECTION 1: AUTOMATION ── */}
      <section id="section-automation" className="relative z-10 py-24 px-6">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-14 items-start">
          <motion.div initial={{ opacity: 0, x: -40 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: .7, ease: [.22, 1, .36, 1] }}>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[11px] font-bold uppercase tracking-widest mb-6">
              <span className="pulse-dot w-1.5 h-1.5 rounded-full bg-amber-400" /> Sản phẩm 01
            </div>
            <h2 className="text-4xl md:text-5xl font-black text-white mb-5 leading-tight">Marketing<br /><span className="shimmer-orange">Automation</span></h2>
            <p className="text-slate-400 text-base leading-relaxed mb-6">
              Tự động hóa toàn bộ hành trình khách hàng đa kênh. Flow Builder kéo thả trực quan, Lead Score thông minh, Web Tracking chuyên sâu — Email, Zalo ZNS, Meta Messenger và AI Chatbot.
            </p>
            <div className="flex flex-wrap gap-2 mb-8">
              {['Email Scale', 'Zalo ZNS', 'AI Chatbot', 'Flow Builder', 'Web Tracking', 'Lead Score'].map(t => (
                <span key={t} className="px-3 py-1 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold">{t}</span>
              ))}
            </div>
            <div className="flex flex-wrap gap-3">
              <a href="/automation" className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 text-slate-900 font-black text-sm hover:-translate-y-0.5 transition-transform shadow-[0_0_24px_rgba(245,158,11,.3)]">
                Khám phá Automation →
              </a>
              <a href="/automation" className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl border border-amber-500/30 text-amber-300 font-bold text-sm hover:bg-amber-500/10 hover:-translate-y-0.5 transition-all">
                View Guess Demo
              </a>
            </div>
          </motion.div>
          <motion.div initial={{ opacity: 0, x: 40 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: .7, delay: .1, ease: [.22, 1, .36, 1] }}>
            <GalleryBlock
              main="/imgs/home.jpg"
              thumbs={['/imgs/flow.jpg', '/imgs/email build.jpg', '/imgs/website tracking.jpg']}
              accentGlow="rgba(245,158,11,0.12)"
              onOpen={openLightbox}
            />
          </motion.div>
        </div>
      </section>

      {/* ── SECTION 2: META REPORT ── */}
      <section id="section-meta" className="relative z-10 py-24 px-6 border-t border-white/5 bg-[#050810]">
        <div className="absolute inset-0 bg-gradient-to-br from-orange-900/8 to-transparent pointer-events-none" />
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-14 items-start">
          <motion.div initial={{ opacity: 0, x: -40 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: .7, ease: [.22, 1, .36, 1] }} className="order-2 lg:order-1">
            <GalleryBlock
              main="/imgs/dom_rp (1).webp"
              thumbs={['/imgs/dom_rp (6).webp', '/imgs/dom_rp (5).webp']}
              accentGlow="rgba(249,115,22,0.12)"
              onOpen={openLightbox}
            />
          </motion.div>
          <motion.div initial={{ opacity: 0, x: 40 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: .7, delay: .1, ease: [.22, 1, .36, 1] }} className="order-1 lg:order-2">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-400 text-[11px] font-bold uppercase tracking-widest mb-6">
              <span className="pulse-dot w-1.5 h-1.5 rounded-full bg-orange-400" /> Sản phẩm 02
            </div>
            <h2 className="text-4xl md:text-5xl font-black text-white mb-5 leading-tight">Meta Ad<br /><span className="shimmer-meta">Realtime Report</span></h2>
            <p className="text-slate-400 text-base leading-relaxed mb-6">
              Hệ thống báo cáo Meta Ads thời gian thực, độc lập với Business Manager. AI phân tích Khung Giờ Vàng chốt sale, Admin Log chi tiết, tối ưu và Scale ngân sách thông minh.
            </p>
            <div className="flex flex-wrap gap-2 mb-8">
              {['Real-time Data', 'AI Insights', 'Khung Giờ Vàng', 'Scale Budget', 'Admin Log', 'Cost Analysis'].map(t => (
                <span key={t} className="px-3 py-1 rounded-lg bg-orange-500/10 border border-orange-500/20 text-orange-400 text-xs font-semibold">{t}</span>
              ))}
            </div>
            <div className="flex flex-wrap gap-4">
              <a href="/meta-report" className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl font-black text-sm text-white hover:-translate-y-0.5 transition-transform shadow-[0_0_24px_rgba(249,115,22,.3)]"
                style={{ background: 'linear-gradient(135deg,#f97316,#ef4444)' }}>
                Xem Meta Report →
              </a>
              <button className="flex items-center gap-2 px-7 py-3.5 rounded-xl border border-white/10 bg-white/5 text-slate-300 font-bold text-sm hover:bg-white/10 hover:-translate-y-0.5 transition-all backdrop-blur-md">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className="text-orange-400">
                  <path d="M8 5v14l11-7z" />
                </svg>
                Video hướng dẫn
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── SECTION 3: CRM ── */}
      <section id="section-crm" className="relative z-10 py-24 px-6 border-t border-white/5">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/8 to-transparent pointer-events-none" />
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-14 items-start">
          <motion.div initial={{ opacity: 0, x: -40 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: .7, ease: [.22, 1, .36, 1] }}>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-[11px] font-bold uppercase tracking-widest mb-6">
              <span className="pulse-dot w-1.5 h-1.5 rounded-full bg-purple-400" /> Sản phẩm 03
            </div>
            <h2 className="text-4xl md:text-5xl font-black text-white mb-6 leading-tight">
              CRM Quản trị<br /><span style={{ background: 'linear-gradient(90deg,#a855f7,#ec4899)', WebkitBackgroundClip: 'text', backgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Doanh nghiệp</span>
            </h2>
            <p className="text-slate-400 text-base leading-relaxed mb-6">
              Số hóa toàn diện quy trình kinh doanh: Sales Pipeline Kanban, Khách hàng 360°, Tồn kho, Báo giá & Hóa đơn, Ticket hỗ trợ — tất cả trên một nền tảng duy nhất.
            </p>
            <div className="flex flex-wrap gap-2 mb-8">
              {['Kanban Pipeline', 'Contacts 360°', 'Inventory', 'Quotes & Invoices', 'Tickets', 'Analytics'].map(t => (
                <span key={t} className="px-3 py-1 rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-400 text-xs font-semibold">{t}</span>
              ))}
            </div>
            <div className="flex flex-wrap gap-3">
              <a href="/crm" className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl text-white font-black text-sm hover:-translate-y-0.5 transition-transform shadow-[0_0_24px_rgba(168,85,247,.3)]"
                style={{ background: 'linear-gradient(135deg,#a855f7,#ec4899)' }}>
                Khám phá CRM →
              </a>
              <a href="https://crm-domation.vercel.app/" target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl border border-purple-500/30 text-purple-300 font-bold text-sm hover:bg-purple-500/10 hover:-translate-y-0.5 transition-all">
                Xem Demo Live
              </a>
            </div>
          </motion.div>
          <motion.div initial={{ opacity: 0, x: 40 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: .7, delay: .1, ease: [.22, 1, .36, 1] }}>
            <GalleryBlock
              main="/crm_imgs/CRMS (1).jpg"
              thumbs={['/crm_imgs/CRMS (2).jpg', '/crm_imgs/CRMS (3).jpg', '/crm_imgs/CRMS (4).jpg']}
              accentGlow="rgba(168,85,247,0.12)"
              onOpen={openLightbox}
            />
          </motion.div>
        </div>
      </section>

      {/* ── SECTION 4: DATA SYSTEM ── */}
      <section id="section-data" className="relative z-10 py-24 px-6 border-t border-white/5 bg-[#050810]">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/8 to-transparent pointer-events-none" />
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-14 items-start">
          <motion.div initial={{ opacity: 0, x: -40 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: .7, ease: [.22, 1, .36, 1] }} className="order-2 lg:order-1">
            <GalleryBlock
              main="/CHIA DATA/chia_data (8).png"
              thumbs={['/CHIA DATA/chia_data (9).png', '/CHIA DATA/chia_data (18).png']}
              accentGlow="rgba(168,85,247,0.12)"
              onOpen={openLightbox}
            />
          </motion.div>
          <motion.div initial={{ opacity: 0, x: 40 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: .7, delay: .1, ease: [.22, 1, .36, 1] }} className="order-1 lg:order-2">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-[11px] font-bold uppercase tracking-widest mb-6">
              <span className="pulse-dot w-1.5 h-1.5 rounded-full bg-purple-400" /> Sản phẩm 04
            </div>
            <h2 className="text-4xl md:text-5xl font-black text-white mb-5 leading-tight">DOMATION<br /><span style={{ background: 'linear-gradient(90deg,#a855f7,#ec4899)', WebkitBackgroundClip: 'text', backgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>DATA</span></h2>
            <p className="text-slate-400 text-base leading-relaxed mb-6">
              Hệ thống logic chia vòng DATA tự động. Định tuyến luồng thông minh, thông báo Zalo Bot/Email Real-time cho từng tư vấn viên. Đảm bảo luồng khách hàng được xử lý ngay trong "thời điểm vàng".
            </p>
            <div className="flex flex-wrap gap-2 mb-8">
              {['Auto Routing', 'Zalo Bot', 'Real-time', 'Bù Data Lỗi', 'Round-Robin', 'Báo Cáo Tự Động'].map(t => (
                <span key={t} className="px-3 py-1 rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-400 text-xs font-semibold">{t}</span>
              ))}
            </div>
            <div className="flex flex-wrap gap-4">
              <a href="/data" className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl font-black text-sm text-white hover:-translate-y-0.5 transition-transform shadow-[0_0_24px_rgba(168,85,247,.3)]"
                style={{ background: 'linear-gradient(135deg,#a855f7,#ec4899)' }}>
                Xem DOMATION DATA →
              </a>
              <a href="https://ideas-data.vercel.app/demo" target="_blank" rel="noreferrer" className="flex items-center gap-2 px-7 py-3.5 rounded-xl border border-white/10 bg-white/5 text-slate-300 font-bold text-sm hover:bg-white/10 hover:-translate-y-0.5 transition-all backdrop-blur-md">
                Xem Demo Live
              </a>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── SECTION 5: WEBSITE & LANDING PAGE ── */}
      <section id="section-web-design" className="relative z-10 py-24 px-6 border-t border-white/5 bg-[#080c14]">
        <div className="absolute inset-0 bg-gradient-to-br from-orange-950/5 to-transparent pointer-events-none" />
        <div className="max-w-6xl mx-auto">
          {/* Header of Section 5 */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start mb-16">
            <div className="lg:col-span-8">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-400 text-[11px] font-bold uppercase tracking-widest mb-6">
                <span className="pulse-dot w-1.5 h-1.5 rounded-full bg-orange-400" /> Sản phẩm 05
              </div>
              <h2 className="text-4xl md:text-5xl font-black text-white mb-5 leading-tight">
                Thiết Kế <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-500 shimmer-orange">Website & Landing Page</span>
              </h2>
              <p className="text-slate-400 text-base leading-relaxed max-w-2xl">
                Dịch vụ thiết kế và phát triển Website & Landing Page chuyên nghiệp, chuẩn SEO On-page, tối ưu tỷ lệ chuyển đổi và tốc độ tải trang dưới 3 giây. Mã nguồn độc quyền, bàn giao vĩnh viễn cho doanh nghiệp.
              </p>
            </div>
            <div className="lg:col-span-4 lg:text-right lg:mt-16">
              <a href="/web-design" className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 text-slate-900 font-black text-sm hover:-translate-y-0.5 transition-transform shadow-[0_0_24px_rgba(245,158,11,.3)]">
                Xem Báo Giá & Dự Toán →
              </a>
            </div>
          </div>

          {/* Grid of 6 Landing Pages */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                name: 'Nava Store',
                desc: 'Website thương mại điện tử (E-commerce) chuyên nghiệp, tối ưu hóa trải nghiệm mua sắm và quy trình thanh toán.',
                link: 'https://navastore.vn/',
                badges: ['E-commerce', 'React/Vite', 'Modern UI'],
                color: 'from-blue-500/20 to-cyan-500/5',
                borderColor: 'group-hover:border-blue-500/50',
                glowColor: 'rgba(59,130,246,0.15)',
                img: '/landingpage_avatar/nava.webp',
                icon: (
                  <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                  </svg>
                )
              },
              {
                name: 'Viện IDEAS MBA',
                desc: 'Landing Page tuyển sinh chương trình Thạc sĩ Quản trị Kinh doanh (MBA), tập trung tối đa tỷ lệ chuyển đổi điền form.',
                link: 'https://ideas.edu.vn/mba',
                badges: ['Education', 'Conversion UI', 'Lead Form'],
                color: 'from-fuchsia-500/20 to-pink-500/5',
                borderColor: 'group-hover:border-fuchsia-500/50',
                glowColor: 'rgba(236,72,153,0.15)',
                img: '/landingpage_avatar/ideasmba.webp',
                icon: (
                  <svg className="w-5 h-5 text-fuchsia-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 14l9-5-9-5-9 5 9 5z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
                  </svg>
                )
              },
              {
                name: 'Turnio Portfolio',
                desc: 'Trang thông tin năng lực (Portfolio) cao cấp của Creative Agency, hiển thị dự án với hiệu ứng tương tác 3D mượt mà.',
                link: 'https://portfo-turnio.vercel.app/',
                badges: ['Creative', 'Next.js', 'Framer Motion'],
                color: 'from-emerald-500/20 to-teal-500/5',
                borderColor: 'group-hover:border-emerald-500/50',
                glowColor: 'rgba(16,185,129,0.15)',
                img: '/landingpage_avatar/portfolio.webp',
                icon: (
                  <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                )
              },
              {
                name: 'Cấy Ghép Nha Khoa Cơ Bản',
                desc: 'Landing Page giới thiệu và tuyển sinh khóa đào tạo Cấy ghép Nha khoa Cơ bản của Brandson Academy cấp chứng chỉ CME.',
                link: 'https://brandson.vn/cay-ghep-nha-khoa-co-ban',
                badges: ['CME Course', 'Medical Landing', 'SEO Standard'],
                color: 'from-amber-500/20 to-orange-500/5',
                borderColor: 'group-hover:border-amber-500/50',
                glowColor: 'rgba(245,158,11,0.15)',
                img: '/landingpage_avatar/brandson.webp',
                icon: (
                  <svg className="w-5 h-5 text-amber-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                )
              },
              {
                name: 'Ngày Hội Implant Flora',
                desc: 'Landing Page sự kiện thường niên "Ngày Hội Implant" của Nha khoa Flora, thiết kế nhằm thúc đẩy đặt hẹn khám trực tiếp.',
                link: 'https://nhakhoaflora.com/ngay-hoi-implant/',
                badges: ['Dental Clinic', 'Event Campaign', 'Conversion Rate'],
                color: 'from-rose-500/20 to-red-500/5',
                borderColor: 'group-hover:border-rose-500/50',
                glowColor: 'rgba(244,63,94,0.15)',
                img: '/landingpage_avatar/flora.webp',
                icon: (
                  <svg className="w-5 h-5 text-rose-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                )
              },
              {
                name: 'Viện Đào Tạo IDEAS',
                desc: 'Trang thông tin điện tử tích hợp của Viện Đào Tạo & Nghiên Cứu Quản Trị IDEAS, giới thiệu hoạt động và cổng thông tin sinh viên.',
                link: 'https://ideas.edu.vn/',
                badges: ['Institutional', 'Multipage Portal', 'WordPress Engine'],
                color: 'from-indigo-500/20 to-violet-500/5',
                borderColor: 'group-hover:border-indigo-500/50',
                glowColor: 'rgba(99,102,241,0.15)',
                img: '/landingpage_avatar/ideasedu.webp',
                icon: (
                  <svg className="w-5 h-5 text-indigo-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                  </svg>
                )
              }
            ].map((p, i) => (
              <motion.a
                key={p.name}
                href={p.link}
                target="_blank"
                rel="noreferrer"
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.08 }}
                className="group relative block rounded-2xl bg-[#161b22]/40 border border-white/5 transition-all duration-500 hover:-translate-y-1 hover:bg-[#161b22]/70 overflow-hidden"
              >
                {/* Background Glow on Hover */}
                <div
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl pointer-events-none"
                  style={{
                    background: `radial-gradient(300px circle at top left, ${p.glowColor}, transparent 70%)`
                  }}
                />

                {/* Mockup Preview Image */}
                <div className="relative overflow-hidden aspect-video bg-black/40 border-b border-white/5">
                  <img
                    src={p.img}
                    alt={p.name}
                    className="w-full h-full object-cover object-top group-hover:scale-[1.04] transition-transform duration-700"
                    loading="lazy"
                  />
                  {/* Overlays */}
                  <div className="absolute top-3 left-3 p-2 bg-black/60 backdrop-blur-md border border-white/10 rounded-xl">
                    {p.icon}
                  </div>
                  <div className="absolute top-3 right-3 text-slate-400 group-hover:text-white p-1.5 bg-black/60 backdrop-blur-md border border-white/10 rounded-full transition-all">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </div>
                </div>
                
                {/* Info */}
                <div className="p-6 relative z-10">
                  <h3 className="text-lg font-bold text-white mb-2 group-hover:text-amber-400 transition-colors">
                    {p.name}
                  </h3>
                  <p className="text-slate-400 text-xs leading-relaxed min-h-[50px] mb-6">
                    {p.desc}
                  </p>
                  
                  {/* Badges */}
                  <div className="flex flex-wrap gap-2">
                    {p.badges.map(b => (
                      <span key={b} className="px-2.5 py-1 text-[10px] font-bold text-slate-300 bg-white/5 border border-white/10 rounded-md">
                        {b}
                      </span>
                    ))}
                  </div>
                </div>
              </motion.a>
            ))}
          </div>
        </div>
      </section>

      {/* Mini Services */}
      <section className="relative z-10 py-20 px-6 border-t border-white/5 bg-[#050810]">
        <div className="max-w-6xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-slate-400 text-[11px] font-bold uppercase tracking-widest mb-4">Dịch Vụ Mở Rộng</div>
            <h2 className="text-3xl md:text-4xl font-black text-white mb-3">Giải Pháp Bổ Sung</h2>
            <p className="text-slate-500 max-w-lg mx-auto text-sm">Các dịch vụ chuyên biệt giúp doanh nghiệp tăng trưởng nhanh hơn.</p>
          </motion.div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { emoji: '📣', title: 'Chạy Quảng Cáo Meta', desc: 'Dịch vụ chạy ads Facebook & Instagram hiệu quả, tối ưu chi phí, tăng ROI.', color: 'text-blue-400', border: 'border-blue-500/20 hover:border-blue-500/40', href: '/meta-report' },
              { emoji: '💬', title: 'Zalo ZNS Marketing', desc: 'Gửi Zalo ZNS hàng loạt tỷ lệ đọc ~100%. Chăm sóc tự động qua Zalo OA.', color: 'text-cyan-400', border: 'border-cyan-500/20 hover:border-cyan-500/40', href: '/automation' },
              { emoji: '🤖', title: 'AI Chatbot 24/7', desc: 'Trợ lý AI tự động phản hồi đa kênh theo dữ liệu riêng của doanh nghiệp.', color: 'text-emerald-400', border: 'border-emerald-500/20 hover:border-emerald-500/40', href: '/automation' },
            ].map((s, i) => (
              <motion.a key={s.title} href={s.href} initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: .5, delay: i * .08 }}
                className={`group block rounded-2xl p-6 bg-white/[0.03] border ${s.border} transition-all duration-300 hover:-translate-y-1 hover:bg-white/[0.05]`}>
                <div className="text-3xl mb-4">{s.emoji}</div>
                <h3 className="font-bold text-sm text-white mb-2">{s.title}</h3>
                <p className="text-slate-500 text-xs leading-relaxed">{s.desc}</p>
                <div className={`flex items-center gap-1 mt-4 text-xs font-bold ${s.color} opacity-0 group-hover:opacity-100 transition-opacity`}>Tìm hiểu →</div>
              </motion.a>
            ))}
          </div>
        </div>
      </section>



      {/* Footer */}
      <footer className="border-t border-white/5 py-12 px-6 bg-[#04060e] z-10 relative text-center">
        <div className="flex items-center justify-center gap-2 mb-4">
          <img src="/imgs/ICON.png" alt="DOMATION" className="w-6 h-6 rounded-lg object-contain opacity-40 grayscale" />
          <span className="text-sm font-black tracking-widest text-white/20 uppercase">DOMATION</span>
        </div>
        <p className="text-slate-700 text-xs mb-2">© {new Date().getFullYear()} Nền tảng số hóa doanh nghiệp toàn diện.</p>
        <p className="text-slate-600 text-[10px] uppercase tracking-[0.2em]">
          Powered by <a href="https://fb.com/turni0" target="_blank" rel="noreferrer" className="text-orange-500/60 hover:text-orange-500 transition-colors font-bold">TurnioDEV</a>
        </p>
      </footer>

      {/* Lightbox */}
      {lightboxSrc && <Lightbox src={lightboxSrc} onClose={closeLightbox} />}

      <ContactModal isOpen={showContactModal} onClose={() => setShowContactModal(false)} themeColor="orange-500" />
    </div>
  );
};
