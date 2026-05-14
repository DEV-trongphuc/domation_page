import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

const APPS = [
  {
    id: 'automation',
    href: '/automation',
    badge: 'Marketing Automation',
    title: 'Marketing\nAutomation',
    desc: 'Tự động hóa toàn bộ quy trình tiếp thị đa kênh. Email, Zalo ZNS, Meta Messenger, AI Chatbot — tất cả trong một nền tảng duy nhất.',
    cta: 'Khám phá Automation',
    gradient: 'from-amber-400 to-orange-500',
    glow: 'rgba(245,158,11,0.35)',
    border: 'border-amber-500/30',
    badgeColor: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
    icon: (
      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
      </svg>
    ),
    tags: ['Email Marketing', 'Zalo ZNS', 'AI Chatbot', 'Flow Builder', 'Web Tracking'],
    accentText: 'text-amber-400',
    bg: 'bg-gradient-to-br from-amber-900/20 to-[#080c14]',
  },
  {
    id: 'meta-report',
    href: '/meta-report',
    badge: 'Meta Ads Analytics',
    title: 'Meta\nReport',
    desc: 'Hệ thống báo cáo hiệu suất Meta Ads thời gian thực. AI phân tích Khung Giờ Vàng, Admin Log và tối ưu ngân sách tự động.',
    cta: 'Xem Meta Report',
    gradient: 'from-orange-400 to-rose-500',
    glow: 'rgba(249,115,22,0.35)',
    border: 'border-orange-500/30',
    badgeColor: 'text-orange-400 bg-orange-500/10 border-orange-500/20',
    icon: (
      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>
        <path d="M2 20h20"/>
      </svg>
    ),
    tags: ['Real-time Data', 'AI Insights', 'Khung Giờ Vàng', 'Scale Budget', 'Admin Log'],
    accentText: 'text-orange-400',
    bg: 'bg-gradient-to-br from-orange-900/20 to-[#080c14]',
  },
  {
    id: 'crm',
    href: '/crm',
    badge: 'Enterprise CRM',
    title: 'CRM\nDoanh Nghiệp',
    desc: 'Số hóa toàn diện: Sales Pipeline, Quản lý Khách hàng 360°, Tồn kho, Báo giá, Hóa đơn và Ticket Support.',
    cta: 'Khám phá CRM',
    gradient: 'from-purple-500 to-fuchsia-600',
    glow: 'rgba(168,85,247,0.35)',
    border: 'border-purple-500/30',
    badgeColor: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
    icon: (
      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
        <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
      </svg>
    ),
    tags: ['Kanban Pipeline', 'Contacts 360°', 'Inventory', 'Quotes & Invoices', 'Tickets'],
    accentText: 'text-purple-400',
    bg: 'bg-gradient-to-br from-purple-900/20 to-[#080c14]',
  },
];

const SERVICES = [
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/>
      </svg>
    ),
    title: 'Thiết Kế Landing Page',
    desc: 'Landing page chuyên nghiệp, chuẩn SEO, tối ưu tỷ lệ chuyển đổi. Tích hợp tracking & form thu lead.',
    href: '/automation?page=web-design',
    color: 'text-fuchsia-400',
    border: 'border-fuchsia-500/20 hover:border-fuchsia-500/40',
    bg: 'hover:bg-fuchsia-500/5',
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
      </svg>
    ),
    title: 'Chạy Quảng Cáo Meta',
    desc: 'Dịch vụ chạy quảng cáo Facebook & Instagram hiệu quả, tối ưu chi phí và tăng ROI cho chiến dịch.',
    href: '/meta-report',
    color: 'text-blue-400',
    border: 'border-blue-500/20 hover:border-blue-500/40',
    bg: 'hover:bg-blue-500/5',
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
      </svg>
    ),
    title: 'Zalo ZNS Marketing',
    desc: 'Gửi tin nhắn Zalo ZNS hàng loạt với tỷ lệ đọc gần 100%. Chăm sóc khách hàng tự động qua Zalo OA.',
    href: '/automation',
    color: 'text-cyan-400',
    border: 'border-cyan-500/20 hover:border-cyan-500/40',
    bg: 'hover:bg-cyan-500/5',
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3"/><path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83"/>
      </svg>
    ),
    title: 'AI Chatbot 24/7',
    desc: 'Triển khai trợ lý AI thông minh tự động phản hồi khách hàng đa kênh theo dữ liệu riêng của doanh nghiệp.',
    href: '/automation',
    color: 'text-emerald-400',
    border: 'border-emerald-500/20 hover:border-emerald-500/40',
    bg: 'hover:bg-emerald-500/5',
  },
];

export const DomationHome: React.FC = () => {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div className="min-h-screen bg-[#080c14] text-white overflow-x-hidden font-sans" style={{ scrollbarWidth: 'thin', scrollbarColor: '#a855f7 transparent' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800;900&display=swap');
        * { font-family: 'Inter', sans-serif; }
        @keyframes aurora-1 { 0%,100%{transform:translate3d(0,0,0) scale(1);opacity:.1} 50%{transform:translate3d(5%,-8%,0) scale(1.08);opacity:.16} }
        @keyframes aurora-2 { 0%,100%{transform:translate3d(0,0,0) scale(1);opacity:.08} 50%{transform:translate3d(-6%,6%,0) scale(1.1);opacity:.13} }
        @keyframes shimmer-home {
          0%{background-position:-200% center}
          100%{background-position:200% center}
        }
        .shimmer-multi {
          background: linear-gradient(90deg,#fbbf24 0%,#a855f7 25%,#f97316 50%,#a855f7 75%,#fbbf24 100%);
          background-size: 200% auto;
          -webkit-background-clip: text; background-clip: text;
          -webkit-text-fill-color: transparent;
          animation: shimmer-home 5s linear infinite;
        }
        @keyframes float-logo { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-6px)} }
        .float-logo { animation: float-logo 4s ease-in-out infinite; }
        @keyframes live-dot { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.4;transform:scale(.7)} }
        .live-dot { animation: live-dot 1.4s ease-in-out infinite; }
        .app-card:hover .card-glow { opacity: 1; }
        .app-card { transition: transform .4s cubic-bezier(.22,1,.36,1), box-shadow .4s; }
        .app-card:hover { transform: translateY(-8px); }
      `}</style>

      {/* Aurora BG */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-20%] left-[-10%] w-[65%] h-[65%] rounded-full bg-amber-500/[0.1] blur-[140px]" style={{ animation: 'aurora-1 20s ease-in-out infinite' }} />
        <div className="absolute top-[10%] right-[-15%] w-[55%] h-[55%] rounded-full bg-purple-600/[0.1] blur-[140px]" style={{ animation: 'aurora-2 25s ease-in-out infinite' }} />
        <div className="absolute bottom-0 left-[20%] w-[45%] h-[45%] rounded-full bg-fuchsia-600/[0.07] blur-[120px]" />
        <div className="hidden md:block absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,1) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,1) 1px,transparent 1px)', backgroundSize: '60px 60px' }} />
      </div>

      {/* Nav */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-[#080c14]/90 backdrop-blur-xl border-b border-white/5 shadow-[0_8px_32px_rgba(0,0,0,0.5)]' : 'bg-transparent'}`}>
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="float-logo relative">
              <img src="/imgs/ICON.png" alt="DOMATION" className="w-10 h-10 rounded-[14px] object-contain shadow-lg shadow-amber-500/20" />
              <div className="absolute -inset-1 rounded-[18px] bg-gradient-to-br from-amber-500/20 to-purple-500/20 blur-md -z-10" />
            </div>
            <span className="text-xl font-black tracking-tight shimmer-multi">DOMATION</span>
          </div>
          <div className="flex items-center gap-2">
            <a href="/automation" className="hidden md:flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-amber-400 border border-amber-500/25 rounded-full hover:bg-amber-500/10 hover:-translate-y-0.5 transition-all">
              ⚡ Automation
            </a>
            <a href="/meta-report" className="hidden md:flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-orange-400 border border-orange-500/25 rounded-full hover:bg-orange-500/10 hover:-translate-y-0.5 transition-all">
              📊 Meta Report
            </a>
            <a href="/crm" className="hidden md:flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-purple-400 border border-purple-500/25 rounded-full hover:bg-purple-500/10 hover:-translate-y-0.5 transition-all">
              👥 CRM
            </a>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative z-10 pt-36 pb-20 px-6 text-center">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
          className="inline-flex items-center gap-2.5 px-5 py-2 rounded-full bg-white/5 border border-white/10 text-sm font-bold mb-8 backdrop-blur-sm">
          <span className="live-dot w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
          <span className="text-slate-300 tracking-wide">Nền Tảng Số Hóa Doanh Nghiệp Toàn Diện</span>
        </motion.div>
        <motion.h1 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, delay: 0.1 }}
          className="text-5xl md:text-7xl font-black tracking-tight leading-[1.1] mb-6">
          <span className="text-white">One Platform,</span><br />
          <span className="shimmer-multi">Infinite Growth</span>
        </motion.h1>
        <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.25 }}
          className="text-slate-400 text-base md:text-xl max-w-2xl mx-auto leading-relaxed mb-4">
          Ba ứng dụng mạnh mẽ — <strong className="text-slate-200">Marketing Automation, Meta Report</strong> và <strong className="text-slate-200">CRM Doanh Nghiệp</strong> — kết hợp thành hệ sinh thái tăng trưởng toàn diện.
        </motion.p>
      </section>

      {/* 3 App Cards */}
      <section className="relative z-10 px-4 md:px-6 pb-24 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
          {APPS.map((app, i) => (
            <motion.a
              key={app.id}
              href={app.href}
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.1 + i * 0.12, ease: [0.22, 1, 0.36, 1] }}
              className={`app-card group relative rounded-[28px] p-px overflow-hidden block ${app.border} border bg-white/[0.04]`}
              style={{ boxShadow: `0 0 0 1px ${app.glow.replace('0.35', '0.15')}` }}
            >
              {/* Glow bg */}
              <div className="card-glow absolute inset-0 opacity-0 transition-opacity duration-500 rounded-[28px]"
                style={{ background: `radial-gradient(500px circle at 50% 0%, ${app.glow.replace('0.35', '0.12')}, transparent 70%)` }} />

              <div className={`relative rounded-[27px] p-7 md:p-8 h-full flex flex-col ${app.bg} border border-white/5`}>
                {/* Top badge */}
                <div className={`inline-flex items-center gap-1.5 self-start px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border mb-6 ${app.badgeColor}`}>
                  <span className="live-dot w-1.5 h-1.5 rounded-full bg-current" />
                  {app.badge}
                </div>

                {/* Icon */}
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-6 ${app.accentText}`}
                  style={{ background: `${app.glow.replace('0.35', '0.12')}`, border: `1px solid ${app.glow.replace('0.35', '0.3')}` }}>
                  {app.icon}
                </div>

                {/* Title */}
                <h2 className="text-3xl md:text-4xl font-black text-white mb-4 leading-tight whitespace-pre-line">
                  {app.title}
                </h2>

                {/* Desc */}
                <p className="text-slate-400 text-sm md:text-base leading-relaxed mb-6 flex-1">{app.desc}</p>

                {/* Tags */}
                <div className="flex flex-wrap gap-2 mb-7">
                  {app.tags.map(tag => (
                    <span key={tag} className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-white/5 border border-white/10 ${app.accentText}`}>
                      {tag}
                    </span>
                  ))}
                </div>

                {/* CTA */}
                <div className={`flex items-center gap-2 font-black text-sm ${app.accentText} group-hover:gap-3 transition-all duration-300`}>
                  <span className={`px-5 py-3 rounded-xl bg-gradient-to-r ${app.gradient} text-slate-900 font-black text-sm hover:opacity-90 transition-opacity`}>
                    {app.cta}
                  </span>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="group-hover:translate-x-1 transition-transform duration-300">
                    <path d="M5 12h14M12 5l7 7-7 7"/>
                  </svg>
                </div>
              </div>
            </motion.a>
          ))}
        </div>
      </section>

      {/* Divider */}
      <div className="max-w-7xl mx-auto px-6">
        <div className="border-t border-white/5" />
      </div>

      {/* Mini Services */}
      <section className="relative z-10 px-4 md:px-6 py-20 max-w-7xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}
          className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-slate-400 text-xs font-bold uppercase tracking-widest mb-4">
            Dịch Vụ Mở Rộng
          </div>
          <h2 className="text-3xl md:text-4xl font-black text-white mb-3">Giải Pháp Bổ Sung</h2>
          <p className="text-slate-400 max-w-xl mx-auto">Các dịch vụ chuyên biệt giúp doanh nghiệp bạn tăng trưởng nhanh hơn.</p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {SERVICES.map((svc, i) => (
            <motion.a
              key={svc.title}
              href={svc.href}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.55, delay: i * 0.09 }}
              className={`group block rounded-2xl p-6 bg-white/[0.03] border ${svc.border} ${svc.bg} transition-all duration-300 hover:-translate-y-1`}
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 ${svc.color} bg-white/5 border border-white/10`}>
                {svc.icon}
              </div>
              <h3 className={`font-bold text-base text-white mb-2 group-hover:${svc.color} transition-colors`}>{svc.title}</h3>
              <p className="text-slate-500 text-sm leading-relaxed">{svc.desc}</p>
              <div className={`flex items-center gap-1 mt-4 text-xs font-bold ${svc.color} opacity-0 group-hover:opacity-100 transition-opacity`}>
                Tìm hiểu thêm
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14M12 5l7 7-7 7"/>
                </svg>
              </div>
            </motion.a>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 py-10 px-6 bg-[#04060e] z-10 relative text-center">
        <div className="flex items-center justify-center gap-2 mb-3">
          <img src="/imgs/ICON.png" alt="DOMATION" className="w-6 h-6 rounded-lg object-contain opacity-50 grayscale" />
          <span className="text-sm font-black tracking-widest text-white/25 uppercase">DOMATION</span>
        </div>
        <p className="text-slate-600 text-xs">© {new Date().getFullYear()} Nền tảng số hóa doanh nghiệp toàn diện.</p>
      </footer>
    </div>
  );
};
