import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowUpRight,
  Cpu,
  Activity,
  TrendingUp,
  GitFork,
  MessageSquare,
  Sparkles,
  ArrowRight,
  ExternalLink,
  Play
} from 'lucide-react';
import { ContactModal } from './ContactModal';

interface ToolCardProps {
  title: string;
  subtitle: string;
  description: string;
  badges: string[];
  mainUrl: string;
  detailUrl: string;
  icon: React.ComponentType<any>;
  themeColor: 'amber' | 'blue' | 'emerald' | 'cyan' | 'purple';
  imageUrl: string;
  delay: number;
}

const ToolCard: React.FC<ToolCardProps> = ({
  title,
  subtitle,
  description,
  badges,
  mainUrl,
  detailUrl,
  icon: Icon,
  themeColor,
  imageUrl,
  delay
}) => {
  const themeClasses = {
    amber: {
      border: 'hover:border-amber-500/40',
      badge: 'bg-amber-500/10 border-amber-500/20 text-amber-400',
      iconBg: 'bg-amber-500/10 border-amber-500/20 text-amber-400',
      shadow: 'hover:shadow-[0_0_50px_rgba(245,158,11,0.15)]',
      glow: 'from-amber-500/20 to-orange-500/5',
      button: 'bg-gradient-to-r from-amber-400 to-orange-500 text-slate-900 font-bold hover:shadow-[0_0_20px_rgba(245,158,11,0.4)]'
    },
    blue: {
      border: 'hover:border-blue-500/40',
      badge: 'bg-blue-500/10 border-blue-500/20 text-blue-400',
      iconBg: 'bg-blue-500/10 border-blue-500/20 text-blue-400',
      shadow: 'hover:shadow-[0_0_50px_rgba(59,130,246,0.15)]',
      glow: 'from-blue-500/20 to-indigo-500/5',
      button: 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-bold hover:shadow-[0_0_20px_rgba(59,130,246,0.4)]'
    },
    emerald: {
      border: 'hover:border-emerald-500/40',
      badge: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400',
      iconBg: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400',
      shadow: 'hover:shadow-[0_0_50px_rgba(16,185,129,0.15)]',
      glow: 'from-emerald-500/20 to-teal-500/5',
      button: 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold hover:shadow-[0_0_20px_rgba(16,185,129,0.4)]'
    },
    purple: {
      border: 'hover:border-purple-500/40',
      badge: 'bg-purple-500/10 border-purple-500/20 text-purple-400',
      iconBg: 'bg-purple-500/10 border-purple-500/20 text-purple-400',
      shadow: 'hover:shadow-[0_0_50px_rgba(168,85,247,0.15)]',
      glow: 'from-purple-500/20 to-pink-500/5',
      button: 'bg-gradient-to-r from-purple-500 to-pink-600 text-white font-bold hover:shadow-[0_0_20px_rgba(168,85,247,0.4)]'
    },
    cyan: {
      border: 'hover:border-cyan-500/40',
      badge: 'bg-cyan-500/10 border-cyan-500/20 text-cyan-400',
      iconBg: 'bg-cyan-500/10 border-cyan-500/20 text-cyan-400',
      shadow: 'hover:shadow-[0_0_50px_rgba(6,182,212,0.15)]',
      glow: 'from-cyan-500/20 to-blue-500/5',
      button: 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold hover:shadow-[0_0_20px_rgba(6,182,212,0.4)]'
    }
  };

  const classes = themeClasses[themeColor];

  return (
    <motion.a
      href={mainUrl}
      target="_blank"
      rel="noreferrer"
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, delay, ease: [0.16, 1, 0.3, 1] }}
      className={`block group relative rounded-3xl p-6 md:p-8 bg-white/[0.02] border border-white/10 ${classes.border} transition-all duration-500 overflow-hidden ${classes.shadow}`}
    >
      {/* Background glow overlay */}
      <div className={`absolute inset-0 bg-gradient-to-br ${classes.glow} opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none rounded-3xl`} />

      {/* Decorative noise grid details */}
      <div className="absolute inset-0 opacity-[0.015] pointer-events-none" style={{
        backgroundImage: 'linear-gradient(rgba(255,255,255,1) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,1) 1px,transparent 1px)',
        backgroundSize: '20px 20px'
      }} />

      <div className="relative z-10 flex flex-col h-full justify-between">
        <div>
          {/* Header section with Icon & link indicator */}
          <div className="flex items-center justify-between mb-6">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border ${classes.iconBg}`}>
              <Icon className="w-6 h-6" />
            </div>
            <div
              className="text-slate-500 group-hover:text-white p-2 group-hover:bg-white/5 rounded-full transition-colors"
            >
              <ArrowUpRight className="w-5 h-5" />
            </div>
          </div>

          {/* Title and Subtitle */}
          <span className={`text-xs font-bold uppercase tracking-wider ${themeColor === 'amber' ? 'text-amber-400' : themeColor === 'blue' ? 'text-blue-400' : themeColor === 'purple' ? 'text-purple-400' : themeColor === 'emerald' ? 'text-emerald-400' : 'text-cyan-400'} mb-1.5 block`}>
            {subtitle}
          </span>
          <h3 className="text-xl md:text-2xl font-black text-white mb-3 tracking-tight group-hover:text-white transition-colors">
            {title}
          </h3>

          {/* Description */}
          <p className="text-slate-400 text-sm leading-relaxed mb-6">
            {description}
          </p>

          {/* Card Mockup Image */}
          <div className="relative rounded-xl overflow-hidden border border-white/5 bg-slate-950/40 mb-6 aspect-[16/10] group-hover:border-white/10 transition-colors">
            <img
              src={imageUrl}
              alt={`${title} Interface`}
              className="w-full h-full object-cover object-top group-hover:scale-[1.03] transition-transform duration-700"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />
          </div>

          {/* Badges */}
          <div className="flex flex-wrap gap-2 mb-8">
            {badges.map((badge) => (
              <span
                key={badge}
                className={`px-3 py-1 rounded-lg border text-xs font-semibold ${classes.badge}`}
              >
                {badge}
              </span>
            ))}
          </div>
        </div>

        {/* Buttons / Actions */}
        <div className="pt-4 border-t border-white/5">
          <div
            className={`w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl text-sm transition-all duration-300 ${classes.button}`}
          >
            Truy cập App
            <ExternalLink className="w-4 h-4" />
          </div>
        </div>
      </div>
    </motion.a>
  );
};

export const IdeasLanding: React.FC = () => {
  const [scrolled, setScrolled] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
    document.title = "IDEAS Company Ecosystem | DOMATION";

    // Dynamically update meta description for SEO best practices
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) {
      metaDesc.setAttribute('content', 'Trang tổng hợp liên kết truy cập các ứng dụng phần mềm được tùy biến chuyên biệt dành cho Viện IDEAS: Marketing Automation, Meta Report, Chia data Auto, Misa CRM Report.');
    }

    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const ideasLogoUrl = "https://ideas.edu.vn/wp-content/uploads/2025/10/518336360_122227900856081421_6060559121060410681_n.webp";


  const tools: ToolCardProps[] = [
    {
      title: "Marketing Automation",
      subtitle: "Tự động hóa kịch bản đa kênh",
      description: "Xây dựng kịch bản tiếp thị đa kênh (Email, Zalo, Messenger) tự động. Hỗ trợ rẽ nhánh thông minh dựa trên tương tác, Lead Score và tích hợp trợ lý AI 24/7 đón đầu khách hàng tiềm năng.",
      badges: ["Amazon SES", "Zalo ZNS", "Messenger Bot", "AI Virtual Agent"],
      mainUrl: "https://automation.ideas.edu.vn/",
      detailUrl: "/automation",
      icon: Cpu,
      themeColor: "amber" as const,
      imageUrl: "/imgs/home.jpg",
      delay: 0.1
    },
    {
      title: "Meta Realtime Report",
      subtitle: "Báo cáo quảng cáo Meta Ads tức thì",
      description: "Hệ thống tổng hợp báo cáo chi tiết hiệu suất quảng cáo Facebook & Instagram thời gian thực. Phân tích khung giờ chuyển đổi vàng, admin log chi tiết, tối ưu hóa ngân sách và scale chiến dịch.",
      badges: ["Realtime Ads", "Hour Metrics", "AI Analytics", "Budget Optimizer"],
      mainUrl: "https://meta.domation.net/ideas",
      detailUrl: "/meta-report",
      icon: Activity,
      themeColor: "amber" as const,
      imageUrl: "/meta/meta_app.png",
      delay: 0.2
    },
    {
      title: "Auto Lead Router",
      subtitle: "Phân bổ dữ liệu tự động cho Sale",
      description: "Điều phối Lead tự động từ Landing Page/Form về đội ngũ kinh doanh theo cơ chế xoay vòng (Round-Robin). Thông báo qua Zalo Bot tức thì, tự động đền bù data lỗi minh bạch.",
      badges: ["Round-Robin", "Zalo Bot Notify", "Data Compensation", "Auto Routing"],
      mainUrl: "https://ideas-data.vercel.app/",
      detailUrl: "/data",
      icon: GitFork,
      themeColor: "purple" as const,
      imageUrl: "/meta/auto_data.png",
      delay: 0.3
    },
    {
      title: "Report CRM MISA",
      subtitle: "Đồng bộ phễu & thống kê doanh số",
      description: "Đồng bộ dữ liệu trực tiếp từ hệ thống CRM MISA AMIS. Báo cáo trực quan sales pipeline, thống kê doanh số theo nguồn data, đo lường năng lực chốt đơn của sales và cảnh báo trễ hạn.",
      badges: ["MISA AMIS Sync", "Sales Pipeline", "CRM Dashboard", "Performance KPI"],
      mainUrl: "https://dev-trongphuc.github.io/DOM_MISA_IDEAS_CRM/",
      detailUrl: "/crm",
      icon: TrendingUp,
      themeColor: "cyan" as const,
      imageUrl: "/meta/misa_data.png",
      delay: 0.4
    }
  ];

  return (
    <div className="min-h-screen bg-[#080c14] text-white overflow-x-hidden font-sans selection:bg-amber-500/30">
      <style>{`
        @keyframes shimmer-sweep {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        .shimmer-text {
          background: linear-gradient(90deg, #f59e0b 0%, #fb923c 20%, #fde68a 40%, #f97316 60%, #ef4444 80%, #f59e0b 100%);
          background-size: 200% auto;
          -webkit-background-clip: text;
          background-clip: text;
          -webkit-text-fill-color: transparent;
          animation: shimmer-sweep 4s linear infinite;
        }
        .shimmer-orange {
          background: linear-gradient(90deg, #f59e0b 0%, #f97316 50%, #f59e0b 100%);
          background-size: 200% auto;
          -webkit-background-clip: text;
          background-clip: text;
          -webkit-text-fill-color: transparent;
          animation: shimmer-sweep 3s linear infinite;
        }
        @keyframes float-y {
          0%,100% { transform: translate3d(0,0px,0); }
          50% { transform: translate3d(0,-8px,0); }
        }
        .float {
          animation: float-y 6s ease-in-out infinite;
        }
      `}</style>

      {/* ── Background: Premium Blurry Auroras ── */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-20%] left-[-15%] w-[60%] h-[60%] rounded-full bg-amber-500/[0.08] blur-[140px] md:blur-[180px]" />
        <div className="absolute top-[10%] right-[-15%] w-[55%] h-[55%] rounded-full bg-blue-600/[0.07] blur-[140px] md:blur-[180px]" />
        <div className="absolute bottom-[-10%] left-[20%] w-[50%] h-[50%] rounded-full bg-emerald-500/[0.05] blur-[120px] md:blur-[160px]" />
        <div className="absolute bottom-[20%] right-[-10%] w-[45%] h-[45%] rounded-full bg-cyan-500/[0.06] blur-[120px]" />

        {/* Sleek Grid Overlay */}
        <div className="absolute inset-0 opacity-[0.02]" style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,1) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,1) 1px,transparent 1px)',
          backgroundSize: '80px 80px'
        }} />
      </div>

      {/* ── Navigation Header ── */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-[#080c14]/90 backdrop-blur-xl border-b border-white/5 shadow-2xl' : 'bg-transparent'}`}>
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <a href="/" className="flex items-center gap-3 group">
            <div className="float relative">
              <img
                loading="lazy"
                decoding="async"
                src="/imgs/ICON.png"
                alt="DOMATION Logo"
                className="w-10 h-10 object-contain rounded-[14px] shadow-lg shadow-orange-500/25 group-hover:scale-105 transition-transform"
              />
              <div className="absolute -inset-1 rounded-[18px] bg-orange-500/20 blur-md -z-10" />
            </div>
            <span className="text-xl font-black tracking-tight shimmer-orange uppercase">
              DOMATION
            </span>
          </a>

          {/* Center Brand Divider */}
          <div className="hidden sm:flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-slate-300 text-xs font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
            <span>IDEAS.EDU.VN</span>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={() => setShowContactModal(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-full text-xs md:text-sm font-bold text-slate-300 border border-white/10 hover:border-amber-500/40 hover:bg-amber-500/5 hover:text-amber-400 transition-all duration-300"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              Liên hệ hỗ trợ
            </button>
          </div>
        </div>
      </nav>

      {/* ── Hero Section ── */}
      <section className="relative pt-32 pb-8 md:pt-40 md:pb-12 px-6 z-10 flex flex-col items-center justify-center">
        <div className="max-w-4xl mx-auto text-center">

          {/* Badge */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-[#161b22]/80 border border-amber-500/30 text-amber-400 text-[10px] md:text-xs font-bold uppercase tracking-widest mb-4 backdrop-blur-md shadow-[0_0_20px_rgba(245,158,11,0.1)]"
          >
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div> READY TO SCALE 🚀
          </motion.div>

          {/* Heading */}
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-xs sm:text-sm md:text-base font-bold text-white/60 uppercase tracking-[0.3em] mb-3 md:mb-4"
          >
            HỆ THỐNG CÔNG CỤ HỖ TRỢ
          </motion.h2>
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="text-3xl sm:text-[2.5rem] md:text-[3.25rem] lg:text-[3.75rem] xl:text-[4.5rem] 2xl:text-[5rem] font-black uppercase mb-6 py-2 leading-normal tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-orange-400 to-amber-500 drop-shadow-[0_0_35px_rgba(245,158,11,0.45)] sm:whitespace-nowrap"
            style={{ animation: 'shimmer-sweep 4s linear infinite', backgroundSize: '200% auto' }}
          >
            MARKETING TOOLS
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-slate-400 text-sm sm:text-base md:text-lg max-w-2xl mx-auto leading-relaxed mb-0"
          >
            Trang tổng hợp hệ thống dashboard và các công cụ tự động hóa (automation tools) được tùy biến chuyên biệt nhằm tối ưu hóa quy trình vận hành nội bộ, nâng cao hiệu suất theo dõi và tự động báo cáo số liệu tức thời cho <strong className="text-slate-200">IDEAS</strong>.
          </motion.p>

          <motion.div 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ duration: 0.8, delay: 0.3 }}
            className="flex flex-wrap items-center justify-center gap-3 mt-10 w-full max-w-4xl"
          >
            {tools.map((tool, idx) => (
                <a key={idx} href={tool.mainUrl} target="_blank" rel="noreferrer" className="flex items-center gap-2.5 px-4 md:px-5 py-3 rounded-2xl bg-[#161b22] border border-white/5 hover:border-amber-500/40 hover:bg-white/5 text-slate-300 hover:text-white hover:-translate-y-0.5 transition-all duration-300 text-xs md:text-sm font-bold shadow-lg">
                    <tool.icon className={`w-4 h-4 ${tool.themeColor === 'amber' ? 'text-amber-500' : tool.themeColor === 'blue' ? 'text-blue-500' : tool.themeColor === 'purple' ? 'text-purple-500' : tool.themeColor === 'emerald' ? 'text-emerald-500' : 'text-cyan-500'}`} />
                    {tool.title === "Auto Lead Router" ? "Auto Chia Data" : tool.title === "Report CRM MISA" ? "CRM Quản trị doanh nghiệp" : tool.title}
                </a>
            ))}
          </motion.div>


        </div>
      </section>

      {/* ── 4 Tool Cards Grid Section ── */}
      <section id="tools" className="pb-24 px-6 z-10 relative max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
          {tools.map((tool, index) => (
            <ToolCard key={tool.title} {...tool} />
          ))}
        </div>
      </section>

      {/* ── Partner Section ── */}
      <section className="py-16 border-t border-white/5 bg-white/[0.01] z-10 relative">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-6">Được liên kết & vận hành trực tiếp bởi</h3>
          <div className="flex items-center justify-center gap-6 md:gap-8 opacity-70 hover:opacity-100 transition-opacity duration-300">
            <div className="flex items-center gap-2">
              <img src="/imgs/ICON.png" alt="DOMATION" className="h-6 object-contain rounded" />
              <span className="text-sm font-bold text-slate-300">DOMATION</span>
            </div>
            <div className="w-1.5 h-1.5 rounded-full bg-slate-700" />
            <div className="flex items-center gap-2">
              <img src={ideasLogoUrl} alt="IDEAS" className="h-6 object-contain rounded" />
              <span className="text-sm font-bold text-slate-300">IDEAS</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
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

      {/* ── Support Contact Modal ── */}
      <ContactModal isOpen={showContactModal} onClose={() => setShowContactModal(false)} themeColor="amber-500" />
    </div>
  );
};
