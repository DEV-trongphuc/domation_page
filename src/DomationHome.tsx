import React, { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

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
        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full bg-orange-500/[0.12] blur-[130px]" style={{animation:'bg1 20s ease-in-out infinite'}} />
        <div className="absolute bottom-[10%] right-[-15%] w-[55%] h-[55%] rounded-full bg-amber-500/[0.08] blur-[130px]" style={{animation:'bg2 25s ease-in-out infinite'}} />
        <div className="hidden md:block absolute inset-0 opacity-[0.025]" style={{backgroundImage:'linear-gradient(rgba(255,255,255,1) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,1) 1px,transparent 1px)',backgroundSize:'60px 60px'}} />
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
            <a href="/automation" className="hidden md:flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-amber-400 border border-amber-500/25 rounded-full hover:bg-amber-500/10 hover:-translate-y-0.5 transition-all">⚡ Automation</a>
            <a href="/meta-report" className="hidden md:flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-orange-400 border border-orange-500/25 rounded-full hover:bg-orange-500/10 hover:-translate-y-0.5 transition-all">📊 Meta Report</a>
            <a href="/crm" className="hidden md:flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-purple-400 border border-purple-500/25 rounded-full hover:bg-purple-500/10 hover:-translate-y-0.5 transition-all">👥 CRM</a>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative z-10 pt-40 pb-12 px-6 text-center">
        <motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} transition={{duration:.6}}
          className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-orange-500/10 border border-orange-500/20 text-xs font-bold text-orange-400 uppercase tracking-widest mb-8">
          <span className="pulse-dot w-1.5 h-1.5 rounded-full bg-emerald-400" />
          Nền Tảng Số Hóa Doanh Nghiệp Toàn Diện
        </motion.div>
        <motion.h1 initial={{opacity:0,y:30}} animate={{opacity:1,y:0}} transition={{duration:.9,delay:.1}}
          className="text-5xl md:text-7xl font-black tracking-tight leading-[1.1] mb-5">
          <span className="text-white">One Platform.</span><br />
          <span className="shimmer-orange">Three Superpowers.</span>
        </motion.h1>
        <motion.p initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} transition={{duration:.8,delay:.25}}
          className="text-slate-400 text-base md:text-lg max-w-2xl mx-auto leading-relaxed mb-8">
          Marketing Automation, Meta Ad Report và CRM Doanh Nghiệp — ba ứng dụng kết hợp thành hệ sinh thái tăng trưởng toàn diện.
        </motion.p>
        <motion.div initial={{opacity:0}} animate={{opacity:1}} transition={{delay:.4}} className="flex items-center justify-center gap-3 flex-wrap">
          <a href="/automation" className="px-7 py-3.5 rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 text-slate-900 font-black text-sm hover:-translate-y-0.5 transition-transform shadow-[0_0_24px_rgba(249,115,22,.35)]">Khám phá ngay →</a>
          <a href="#section-crm" className="px-7 py-3.5 rounded-xl border border-white/10 text-slate-300 font-bold text-sm hover:bg-white/5 hover:-translate-y-0.5 transition-all">Xem tất cả sản phẩm ↓</a>
        </motion.div>
      </section>

      {/* ── SECTION 1: AUTOMATION ── */}
      <section id="section-automation" className="relative z-10 py-24 px-6">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-14 items-start">
          <motion.div initial={{opacity:0,x:-40}} whileInView={{opacity:1,x:0}} viewport={{once:true}} transition={{duration:.7,ease:[.22,1,.36,1]}}>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[11px] font-bold uppercase tracking-widest mb-6">
              <span className="pulse-dot w-1.5 h-1.5 rounded-full bg-amber-400" /> Sản phẩm 01
            </div>
            <h2 className="text-4xl md:text-5xl font-black text-white mb-5 leading-tight">Marketing<br /><span className="shimmer-orange">Automation</span></h2>
            <p className="text-slate-400 text-base leading-relaxed mb-6">
              Tự động hóa toàn bộ hành trình khách hàng đa kênh. Flow Builder kéo thả trực quan, Lead Score thông minh, Web Tracking chuyên sâu — Email, Zalo ZNS, Meta Messenger và AI Chatbot.
            </p>
            <div className="flex flex-wrap gap-2 mb-8">
              {['Email Scale','Zalo ZNS','AI Chatbot','Flow Builder','Web Tracking','Lead Score'].map(t=>(
                <span key={t} className="px-3 py-1 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold">{t}</span>
              ))}
            </div>
            <a href="/automation" className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 text-slate-900 font-black text-sm hover:-translate-y-0.5 transition-transform shadow-[0_0_24px_rgba(245,158,11,.3)]">
              Khám phá Automation →
            </a>
          </motion.div>
          <motion.div initial={{opacity:0,x:40}} whileInView={{opacity:1,x:0}} viewport={{once:true}} transition={{duration:.7,delay:.1,ease:[.22,1,.36,1]}}>
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
          <motion.div initial={{opacity:0,x:-40}} whileInView={{opacity:1,x:0}} viewport={{once:true}} transition={{duration:.7,ease:[.22,1,.36,1]}} className="order-2 lg:order-1">
            <GalleryBlock
              main="https://portfo-turnio.vercel.app/assets/dom_rp%20(1)-z9-_yBNr.jpg"
              thumbs={['https://portfo-turnio.vercel.app/assets/dom_rp%20(3)-QpcZBQYW.jpg', 'https://portfo-turnio.vercel.app/assets/dom_rp%20(6)-CDWL6ejy.jpg']}
              accentGlow="rgba(249,115,22,0.12)"
              onOpen={openLightbox}
            />
          </motion.div>
          <motion.div initial={{opacity:0,x:40}} whileInView={{opacity:1,x:0}} viewport={{once:true}} transition={{duration:.7,delay:.1,ease:[.22,1,.36,1]}} className="order-1 lg:order-2">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-400 text-[11px] font-bold uppercase tracking-widest mb-6">
              <span className="pulse-dot w-1.5 h-1.5 rounded-full bg-orange-400" /> Sản phẩm 02
            </div>
            <h2 className="text-4xl md:text-5xl font-black text-white mb-5 leading-tight">Meta Ad<br /><span className="shimmer-meta">Realtime Report</span></h2>
            <p className="text-slate-400 text-base leading-relaxed mb-6">
              Hệ thống báo cáo Meta Ads thời gian thực, độc lập với Business Manager. AI phân tích Khung Giờ Vàng chốt sale, Admin Log chi tiết, tối ưu và Scale ngân sách thông minh.
            </p>
            <div className="flex flex-wrap gap-2 mb-8">
              {['Real-time Data','AI Insights','Khung Giờ Vàng','Scale Budget','Admin Log','Cost Analysis'].map(t=>(
                <span key={t} className="px-3 py-1 rounded-lg bg-orange-500/10 border border-orange-500/20 text-orange-400 text-xs font-semibold">{t}</span>
              ))}
            </div>
            <a href="/meta-report" className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl text-white font-black text-sm hover:-translate-y-0.5 transition-transform shadow-[0_0_24px_rgba(249,115,22,.3)]"
              style={{background:'linear-gradient(135deg,#f97316,#ef4444)'}}>
              Xem Meta Report →
            </a>
          </motion.div>
        </div>
      </section>

      {/* ── SECTION 3: CRM ── */}
      <section id="section-crm" className="relative z-10 py-24 px-6 border-t border-white/5">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/8 to-transparent pointer-events-none" />
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-14 items-start">
          <motion.div initial={{opacity:0,x:-40}} whileInView={{opacity:1,x:0}} viewport={{once:true}} transition={{duration:.7,ease:[.22,1,.36,1]}}>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-[11px] font-bold uppercase tracking-widest mb-6">
              <span className="pulse-dot w-1.5 h-1.5 rounded-full bg-purple-400" /> Sản phẩm 03
            </div>
            <h2 className="text-4xl md:text-5xl font-black text-white mb-5 leading-tight">CRM<br /><span className="shimmer-crm">Doanh Nghiệp</span></h2>
            <p className="text-slate-400 text-base leading-relaxed mb-6">
              Số hóa toàn diện quy trình kinh doanh: Sales Pipeline Kanban, Khách hàng 360°, Tồn kho, Báo giá & Hóa đơn, Ticket hỗ trợ — tất cả trên một nền tảng duy nhất.
            </p>
            <div className="flex flex-wrap gap-2 mb-8">
              {['Kanban Pipeline','Contacts 360°','Inventory','Quotes & Invoices','Tickets','Analytics'].map(t=>(
                <span key={t} className="px-3 py-1 rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-400 text-xs font-semibold">{t}</span>
              ))}
            </div>
            <div className="flex flex-wrap gap-3">
              <a href="/crm" className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl text-white font-black text-sm hover:-translate-y-0.5 transition-transform shadow-[0_0_24px_rgba(168,85,247,.3)]"
                style={{background:'linear-gradient(135deg,#a855f7,#ec4899)'}}>
                Khám phá CRM →
              </a>
              <a href="https://crm-domation.vercel.app/" target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl border border-purple-500/30 text-purple-300 font-bold text-sm hover:bg-purple-500/10 hover:-translate-y-0.5 transition-all">
                Xem Demo Live
              </a>
            </div>
          </motion.div>
          <motion.div initial={{opacity:0,x:40}} whileInView={{opacity:1,x:0}} viewport={{once:true}} transition={{duration:.7,delay:.1,ease:[.22,1,.36,1]}}>
            <GalleryBlock
              main="/crm_imgs/CRMS (1).jpg"
              thumbs={['/crm_imgs/CRMS (2).jpg', '/crm_imgs/CRMS (3).jpg', '/crm_imgs/CRMS (4).jpg']}
              accentGlow="rgba(168,85,247,0.12)"
              onOpen={openLightbox}
            />
          </motion.div>
        </div>
      </section>

      {/* Mini Services */}
      <section className="relative z-10 py-20 px-6 border-t border-white/5 bg-[#050810]">
        <div className="max-w-6xl mx-auto">
          <motion.div initial={{opacity:0,y:20}} whileInView={{opacity:1,y:0}} viewport={{once:true}} className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-slate-400 text-[11px] font-bold uppercase tracking-widest mb-4">Dịch Vụ Mở Rộng</div>
            <h2 className="text-3xl md:text-4xl font-black text-white mb-3">Giải Pháp Bổ Sung</h2>
            <p className="text-slate-500 max-w-lg mx-auto text-sm">Các dịch vụ chuyên biệt giúp doanh nghiệp tăng trưởng nhanh hơn.</p>
          </motion.div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { emoji:'🖥️', title:'Thiết Kế Landing Page', desc:'Landing page chuẩn SEO, tối ưu chuyển đổi, tích hợp tracking & form thu lead.', color:'text-fuchsia-400', border:'border-fuchsia-500/20 hover:border-fuchsia-500/40', href:'/automation?page=web-design' },
              { emoji:'📣', title:'Chạy Quảng Cáo Meta', desc:'Dịch vụ chạy ads Facebook & Instagram hiệu quả, tối ưu chi phí, tăng ROI.', color:'text-blue-400', border:'border-blue-500/20 hover:border-blue-500/40', href:'/meta-report' },
              { emoji:'💬', title:'Zalo ZNS Marketing', desc:'Gửi Zalo ZNS hàng loạt tỷ lệ đọc ~100%. Chăm sóc tự động qua Zalo OA.', color:'text-cyan-400', border:'border-cyan-500/20 hover:border-cyan-500/40', href:'/automation' },
              { emoji:'🤖', title:'AI Chatbot 24/7', desc:'Trợ lý AI tự động phản hồi đa kênh theo dữ liệu riêng của doanh nghiệp.', color:'text-emerald-400', border:'border-emerald-500/20 hover:border-emerald-500/40', href:'/automation' },
            ].map((s,i)=>(
              <motion.a key={s.title} href={s.href} initial={{opacity:0,y:24}} whileInView={{opacity:1,y:0}} viewport={{once:true}} transition={{duration:.5,delay:i*.08}}
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
      <footer className="border-t border-white/5 py-10 px-6 bg-[#04060e] z-10 relative text-center">
        <div className="flex items-center justify-center gap-2 mb-3">
          <img src="/imgs/ICON.png" alt="DOMATION" className="w-6 h-6 rounded-lg object-contain opacity-40 grayscale" />
          <span className="text-sm font-black tracking-widest text-white/20 uppercase">DOMATION</span>
        </div>
        <p className="text-slate-700 text-xs">© {new Date().getFullYear()} Nền tảng số hóa doanh nghiệp toàn diện.</p>
      </footer>

      {/* Lightbox */}
      {lightboxSrc && <Lightbox src={lightboxSrc} onClose={closeLightbox} />}
    </div>
  );
};
