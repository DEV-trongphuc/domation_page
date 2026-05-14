import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

export const DomationHome: React.FC = () => {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div className="min-h-screen bg-[#080c14] text-white overflow-x-hidden" style={{ fontFamily: "'Inter', sans-serif", scrollbarWidth: 'thin', scrollbarColor: '#f97316 transparent' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800;900&display=swap');
        @keyframes shimmer { 0%{background-position:-200% center} 100%{background-position:200% center} }
        .shimmer-orange {
          background: linear-gradient(90deg,#fbbf24 0%,#f97316 30%,#fb923c 60%,#fbbf24 100%);
          background-size:200% auto; -webkit-background-clip:text; background-clip:text;
          -webkit-text-fill-color:transparent; animation:shimmer 4s linear infinite;
        }
        @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-6px)} }
        .float { animation: float 4s ease-in-out infinite; }
        @keyframes pulse-dot { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.4;transform:scale(.7)} }
        .pulse-dot { animation: pulse-dot 1.4s ease-in-out infinite; }
        @keyframes bg1 { 0%,100%{transform:translate(0,0) scale(1);opacity:.12} 50%{transform:translate(4%,-6%) scale(1.08);opacity:.18} }
        @keyframes bg2 { 0%,100%{transform:translate(0,0) scale(1);opacity:.08} 50%{transform:translate(-5%,5%) scale(1.06);opacity:.13} }
        .section-img { transition: transform .6s cubic-bezier(.22,1,.36,1); }
        .section-img:hover { transform: scale(1.02) translateY(-4px); }
      `}</style>

      {/* Aurora BG */}
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

      {/* ── HERO ── */}
      <section className="relative z-10 pt-40 pb-16 px-6 text-center">
        <motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} transition={{duration:.6}}
          className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-orange-500/10 border border-orange-500/20 text-xs font-bold text-orange-400 uppercase tracking-widest mb-8">
          <span className="pulse-dot w-1.5 h-1.5 rounded-full bg-emerald-400" />
          Nền tảng số hóa doanh nghiệp toàn diện
        </motion.div>
        <motion.h1 initial={{opacity:0,y:30}} animate={{opacity:1,y:0}} transition={{duration:.9,delay:.1}}
          className="text-5xl md:text-7xl font-black tracking-tight leading-[1.1] mb-6">
          <span className="text-white">One Platform.</span><br />
          <span className="shimmer-orange">Three Superpowers.</span>
        </motion.h1>
        <motion.p initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} transition={{duration:.8,delay:.25}}
          className="text-slate-400 text-base md:text-lg max-w-2xl mx-auto leading-relaxed">
          Marketing Automation, Meta Ad Report và CRM Doanh Nghiệp — ba ứng dụng độc lập, kết hợp thành hệ sinh thái tăng trưởng toàn diện.
        </motion.p>
        <motion.div initial={{opacity:0}} animate={{opacity:1}} transition={{delay:.5}} className="mt-10 flex items-center justify-center gap-3 flex-wrap">
          <a href="/automation" className="px-7 py-3.5 rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 text-slate-900 font-black text-sm hover:-translate-y-0.5 transition-transform shadow-[0_0_24px_rgba(249,115,22,.35)]">Khám phá ngay →</a>
          <a href="#section-crm" className="px-7 py-3.5 rounded-xl border border-white/10 text-slate-300 font-bold text-sm hover:bg-white/5 hover:-translate-y-0.5 transition-all">Xem tất cả sản phẩm</a>
        </motion.div>
      </section>

      {/* ── SECTION 1: AUTOMATION ── */}
      <section id="section-automation" className="relative z-10 py-24 px-6">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* Text */}
          <motion.div initial={{opacity:0,x:-40}} whileInView={{opacity:1,x:0}} viewport={{once:true}} transition={{duration:.7,ease:[.22,1,.36,1]}}>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[11px] font-bold uppercase tracking-widest mb-6">
              <span className="pulse-dot w-1.5 h-1.5 rounded-full bg-amber-400" /> Sản phẩm 01
            </div>
            <h2 className="text-4xl md:text-5xl font-black text-white mb-6 leading-tight">
              Marketing<br /><span className="shimmer-orange">Automation</span>
            </h2>
            <p className="text-slate-400 text-base md:text-lg leading-relaxed mb-8">
              Tự động hóa toàn bộ hành trình khách hàng đa kênh — Email, Zalo ZNS, Meta Messenger, AI Chatbot. Flow Builder kéo thả trực quan, Lead Score thông minh, Web Tracking chuyên sâu.
            </p>
            <div className="flex flex-wrap gap-2 mb-8">
              {['Email Marketing','Zalo ZNS','AI Chatbot','Flow Builder','Web Tracking','Lead Score'].map(t=>(
                <span key={t} className="px-3 py-1 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold">{t}</span>
              ))}
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <a href="/automation" className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 text-slate-900 font-black text-sm hover:-translate-y-0.5 transition-transform shadow-[0_0_24px_rgba(245,158,11,.3)]">
                Khám phá Automation →
              </a>
            </div>
          </motion.div>
          {/* Visual */}
          <motion.div initial={{opacity:0,x:40}} whileInView={{opacity:1,x:0}} viewport={{once:true}} transition={{duration:.7,delay:.1,ease:[.22,1,.36,1]}}>
            <div className="relative">
              <div className="absolute -inset-4 bg-gradient-to-br from-amber-500/20 to-orange-500/10 rounded-[36px] blur-2xl" />
              <div className="relative rounded-[28px] overflow-hidden border border-amber-500/20 shadow-[0_0_60px_rgba(245,158,11,.12)] section-img bg-[#0f1420]">
                <img src="/imgs/home.jpg" alt="Marketing Automation Dashboard" className="w-full h-auto object-cover" loading="lazy" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#080c14]/60 to-transparent pointer-events-none" />
              </div>
              {/* Badge */}
              <div className="absolute -bottom-4 -right-4 flex items-center gap-2 bg-[#0f1420]/95 border border-amber-500/30 rounded-2xl px-4 py-2.5 shadow-[0_0_20px_rgba(245,158,11,.2)] backdrop-blur-sm">
                <span className="pulse-dot w-2 h-2 rounded-full bg-emerald-400" />
                <span className="text-xs font-bold text-white">98% Inbox Rate</span>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── SECTION 2: META REPORT ── */}
      <section id="section-meta" className="relative z-10 py-24 px-6 border-t border-white/5 bg-[#050810]">
        <div className="absolute inset-0 bg-gradient-to-br from-orange-900/8 to-transparent pointer-events-none" />
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* Visual — left */}
          <motion.div initial={{opacity:0,x:-40}} whileInView={{opacity:1,x:0}} viewport={{once:true}} transition={{duration:.7,ease:[.22,1,.36,1]}} className="order-2 lg:order-1">
            <div className="relative">
              <div className="absolute -inset-4 bg-gradient-to-br from-orange-500/20 to-rose-500/10 rounded-[36px] blur-2xl" />
              <div className="relative rounded-[28px] overflow-hidden border border-orange-500/20 shadow-[0_0_60px_rgba(249,115,22,.12)] section-img bg-[#0f1420]">
                {/* Placeholder visual nếu chưa có ảnh */}
                <img src="https://portfo-turnio.vercel.app/assets/dom_rp%20(1)-z9-_yBNr.jpg" alt="Meta Ad Report Dashboard" className="w-full h-auto object-cover" loading="lazy" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#080c14]/60 to-transparent pointer-events-none" />
              </div>
              <div className="absolute -bottom-4 -left-4 flex items-center gap-2 bg-[#0f1420]/95 border border-orange-500/30 rounded-2xl px-4 py-2.5 shadow-[0_0_20px_rgba(249,115,22,.2)] backdrop-blur-sm">
                <span className="text-xs font-bold text-orange-400">⏱ Real-time Data</span>
              </div>
            </div>
          </motion.div>
          {/* Text — right */}
          <motion.div initial={{opacity:0,x:40}} whileInView={{opacity:1,x:0}} viewport={{once:true}} transition={{duration:.7,delay:.1,ease:[.22,1,.36,1]}} className="order-1 lg:order-2">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-400 text-[11px] font-bold uppercase tracking-widest mb-6">
              <span className="pulse-dot w-1.5 h-1.5 rounded-full bg-orange-400" /> Sản phẩm 02
            </div>
            <h2 className="text-4xl md:text-5xl font-black text-white mb-6 leading-tight">
              Meta Ad<br /><span style={{background:'linear-gradient(90deg,#f97316,#ef4444)',WebkitBackgroundClip:'text',backgroundClip:'text',WebkitTextFillColor:'transparent'}}>Report</span>
            </h2>
            <p className="text-slate-400 text-base md:text-lg leading-relaxed mb-8">
              Hệ thống báo cáo hiệu suất Meta Ads thời gian thực, độc lập với Business Manager. AI phân tích Khung Giờ Vàng chốt sale, Admin Log chi tiết và hỗ trợ ra quyết định Scale ngân sách.
            </p>
            <div className="flex flex-wrap gap-2 mb-8">
              {['Real-time Data','AI Insights','Khung Giờ Vàng','Scale Budget','Admin Log','Cost Analysis'].map(t=>(
                <span key={t} className="px-3 py-1 rounded-lg bg-orange-500/10 border border-orange-500/20 text-orange-400 text-xs font-semibold">{t}</span>
              ))}
            </div>
            <a href="/meta-report" className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl font-black text-sm text-white hover:-translate-y-0.5 transition-transform shadow-[0_0_24px_rgba(249,115,22,.3)]"
              style={{background:'linear-gradient(135deg,#f97316,#ef4444)'}}>
              Xem Meta Report →
            </a>
          </motion.div>
        </div>
      </section>

      {/* ── SECTION 3: CRM ── */}
      <section id="section-crm" className="relative z-10 py-24 px-6 border-t border-white/5">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/8 to-transparent pointer-events-none" />
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* Text */}
          <motion.div initial={{opacity:0,x:-40}} whileInView={{opacity:1,x:0}} viewport={{once:true}} transition={{duration:.7,ease:[.22,1,.36,1]}}>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-[11px] font-bold uppercase tracking-widest mb-6">
              <span className="pulse-dot w-1.5 h-1.5 rounded-full bg-purple-400" /> Sản phẩm 03
            </div>
            <h2 className="text-4xl md:text-5xl font-black text-white mb-6 leading-tight">
              CRM<br /><span style={{background:'linear-gradient(90deg,#a855f7,#ec4899)',WebkitBackgroundClip:'text',backgroundClip:'text',WebkitTextFillColor:'transparent'}}>Doanh Nghiệp</span>
            </h2>
            <p className="text-slate-400 text-base md:text-lg leading-relaxed mb-8">
              Số hóa toàn diện quy trình kinh doanh: Sales Pipeline Kanban, Khách hàng 360°, Quản lý tồn kho, Báo giá & Hóa đơn, Ticket hỗ trợ — tất cả trên một nền tảng duy nhất.
            </p>
            <div className="flex flex-wrap gap-2 mb-8">
              {['Kanban Pipeline','Contacts 360°','Inventory','Quotes & Invoices','Tickets','Analytics'].map(t=>(
                <span key={t} className="px-3 py-1 rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-400 text-xs font-semibold">{t}</span>
              ))}
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <a href="/crm" className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl text-white font-black text-sm hover:-translate-y-0.5 transition-transform shadow-[0_0_24px_rgba(168,85,247,.3)]"
                style={{background:'linear-gradient(135deg,#a855f7,#ec4899)'}}>
                Khám phá CRM →
              </a>
              <a href="https://crm-domation.vercel.app/" target="_blank" rel="noreferrer" className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl border border-purple-500/30 text-purple-300 font-bold text-sm hover:bg-purple-500/10 hover:-translate-y-0.5 transition-all">
                Xem Demo Live
              </a>
            </div>
          </motion.div>
          {/* Visual */}
          <motion.div initial={{opacity:0,x:40}} whileInView={{opacity:1,x:0}} viewport={{once:true}} transition={{duration:.7,delay:.1,ease:[.22,1,.36,1]}}>
            <div className="relative">
              <div className="absolute -inset-4 bg-gradient-to-br from-purple-500/20 to-fuchsia-500/10 rounded-[36px] blur-2xl" />
              <div className="relative rounded-[28px] overflow-hidden border border-purple-500/20 shadow-[0_0_60px_rgba(168,85,247,.12)] section-img bg-[#0a0810]">
                <img src="/crm_imgs/CRMS (1).jpg" alt="CRM Dashboard" className="w-full h-auto object-cover" loading="lazy" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#080811]/60 to-transparent pointer-events-none" />
              </div>
              <div className="absolute -bottom-4 -right-4 flex items-center gap-2 bg-[#0a0810]/95 border border-purple-500/30 rounded-2xl px-4 py-2.5 shadow-[0_0_20px_rgba(168,85,247,.2)] backdrop-blur-sm">
                <span className="text-xs font-bold text-purple-400">🏢 Enterprise Ready</span>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── MINI SERVICES ── */}
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
                <h3 className={`font-bold text-sm text-white mb-2 group-hover:${s.color} transition-colors`}>{s.title}</h3>
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
    </div>
  );
};
