import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowUpRight,
  Cpu,
  Activity,
  GitFork,
  ExternalLink,
} from 'lucide-react';
import { ContactModal } from './ContactModal';
import { Navbar } from './Navbar';
import { BackToTopPill } from './components/BackToTopPill';
import { LuxuryGoldBackdrop } from './LuxuryGoldBackdrop';
import { DomationLogoMark } from './components/DomationLogoMark';
import { DECOR_PNGS } from './data/enterpriseData';
import { getIdeasSeoConfig } from './data/coreRouteSeo';
import { usePageSeo } from './utils/seo';

interface ToolCardProps {
  title: string;
  subtitle: string;
  description: string;
  badges: string[];
  mainUrl: string;
  detailUrl: string;
  icon: React.ComponentType<{ className?: string }>;
  imageUrl: string;
  delay: number;
}

const ToolCard: React.FC<ToolCardProps> = ({
  title,
  subtitle,
  description,
  badges,
  mainUrl,
  icon: Icon,
  imageUrl,
  delay,
}) => {
  return (
    <motion.a
      href={mainUrl}
      target="_blank"
      rel="noreferrer"
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      whileHover={{ y: -5 }}
      transition={{ duration: 0.55, delay, ease: [0.16, 1, 0.3, 1] }}
      className="inkica-glass-card block group relative p-6 md:p-8 overflow-hidden hover:border-blue-300 transition-all duration-300"
    >
      <div className="relative z-10 flex flex-col h-full justify-between">
        <div>
          {/* Header section */}
          <div className="flex items-center justify-between mb-6">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-gradient-to-br from-[#1E40FF] to-[#0284C7] text-white shadow-[0_8px_20px_-4px_rgba(30,64,255,0.3)]">
              <Icon className="w-5 h-5" />
            </div>
            <div className="text-slate-400 group-hover:text-[#1E40FF] p-2 group-hover:bg-blue-50 rounded-full transition-colors">
              <ArrowUpRight className="w-5 h-5" />
            </div>
          </div>

          <span className="text-xs font-bold uppercase tracking-wider text-[#1E40FF] mb-1.5 block">
            {subtitle}
          </span>
          <h2 className="text-xl md:text-2xl font-black text-slate-900 mb-3 tracking-tight group-hover:text-[#1E40FF] transition-colors">
            {title}
          </h2>

          <p className="text-slate-600 text-sm leading-relaxed mb-6">{description}</p>

          {/* Card Mockup Image */}
          <div className="relative rounded-2xl overflow-hidden border border-slate-200/90 bg-slate-100 mb-6 aspect-[16/10] shadow-sm">
            <img
              src={imageUrl}
              alt={`${title} Interface`}
              className="w-full h-full object-cover object-top group-hover:scale-[1.03] transition-transform duration-700"
              loading="lazy"
            />
          </div>

          {/* Badges */}
          <div className="flex flex-wrap gap-2 mb-7">
            {badges.map((badge) => (
              <span
                key={badge}
                className="px-3 py-1 rounded-full bg-blue-50/90 border border-blue-200/80 text-[#1E40FF] text-xs font-semibold"
              >
                {badge}
              </span>
            ))}
          </div>
        </div>

        {/* Action */}
        <div className="pt-4 border-t border-slate-200/80">
          <div className="btn-inkica-primary w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl text-sm font-bold">
            Truy cập App
            <ExternalLink className="w-4 h-4" />
          </div>
        </div>
      </div>
    </motion.a>
  );
};

export const IdeasLanding: React.FC = () => {
  const [showContactModal, setShowContactModal] = useState(false);

  usePageSeo(getIdeasSeoConfig());

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const ideasLogoUrl = '/assets/partners/logo_ideas.webp';

  const tools: ToolCardProps[] = [
    {
      title: 'Marketing Automation',
      subtitle: 'Tự động hóa kịch bản đa kênh',
      description:
        'Xây dựng kịch bản tiếp thị đa kênh (Email, Zalo, Messenger) tự động. Hỗ trợ rẽ nhánh thông minh dựa trên tương tác, Lead Score và tích hợp trợ lý AI 24/7 đón đầu khách hàng tiềm năng.',
      badges: ['Amazon SES', 'Zalo ZNS', 'Messenger Bot', 'AI Virtual Agent'],
      mainUrl: 'https://automation.ideas.edu.vn/',
      detailUrl: '/automation',
      icon: Cpu,
      imageUrl: '/imgs/home.jpg',
      delay: 0.1,
    },
    {
      title: 'Meta Realtime Report',
      subtitle: 'Báo cáo quảng cáo Meta Ads tức thì',
      description:
        'Hệ thống tổng hợp báo cáo chi tiết hiệu suất quảng cáo Facebook & Instagram thời gian thực. Phân tích khung giờ chuyển đổi vàng, admin log chi tiết, tối ưu hóa ngân sách và scale chiến dịch.',
      badges: ['Realtime Ads', 'Hour Metrics', 'AI Analytics', 'Budget Optimizer'],
      mainUrl: 'https://meta.domation.net/ideas',
      detailUrl: '/meta-report',
      icon: Activity,
      imageUrl: '/meta/meta_app.png',
      delay: 0.2,
    },
    {
      title: 'Auto Lead Router',
      subtitle: 'Phân bổ dữ liệu tự động cho Sale',
      description:
        'Điều phối Lead tự động từ Landing Page/Form về đội ngũ kinh doanh theo cơ chế xoay vòng (Round-Robin). Thông báo qua Zalo Bot tức thì, tự động đền bù data lỗi minh bạch.',
      badges: ['Round-Robin', 'Zalo Bot Notify', 'Data Compensation', 'Auto Routing'],
      mainUrl: 'https://ideas-data.vercel.app/',
      detailUrl: '/data',
      icon: GitFork,
      imageUrl: '/meta/auto_data.png',
      delay: 0.3,
    },
  ];

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-slate-900 overflow-x-clip font-sans relative selection:bg-[#1E40FF] selection:text-white">
      <LuxuryGoldBackdrop />

      {/* Navigation Header */}
      <Navbar activePage="ideas" onOpenContact={() => setShowContactModal(true)} />

      {/* Floating 3D PNG Decors */}
      <motion.img
        src={DECOR_PNGS.prism}
        alt=""
        aria-hidden="true"
        animate={{ y: [0, -14, 0], rotate: [-4, 4, -4] }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        className="hidden xl:block pointer-events-none select-none fixed top-32 left-[2%] w-28 h-28 object-contain opacity-65 z-0"
      />
      <motion.img
        src={DECOR_PNGS.torus}
        alt=""
        aria-hidden="true"
        animate={{ y: [0, 14, 0], rotate: [5, -5, 5] }}
        transition={{ duration: 7.5, repeat: Infinity, ease: 'easeInOut' }}
        className="hidden xl:block pointer-events-none select-none fixed top-44 right-[2%] w-28 h-28 object-contain opacity-65 z-0"
      />

      {/* Hero Section */}
      <main>
      <section className="relative pt-28 pb-10 md:pt-36 md:pb-14 px-6 z-10 flex flex-col items-center justify-center">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="ql-eyebrow mb-5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> READY TO SCALE • IDEAS ECOSYSTEM
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, delay: 0.12 }}
            className="text-[24px] sm:text-5xl md:text-6xl font-black tracking-tight text-slate-900 mb-5 leading-[1.15]"
          >
            Hệ Thống Công Cụ{' '}
            <span className="text-gradient-inkica">Marketing Tools</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, delay: 0.2 }}
            className="text-slate-600 text-sm sm:text-base md:text-lg max-w-2xl mx-auto leading-relaxed font-medium"
          >
            Trang tổng hợp hệ thống dashboard và các công cụ tự động hóa được tùy biến chuyên biệt nhằm tối ưu hóa quy
            trình vận hành nội bộ, nâng cao hiệu suất theo dõi và tự động báo cáo số liệu tức thời cho{' '}
            <strong className="text-slate-900">IDEAS</strong>.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, delay: 0.28 }}
            className="grid grid-cols-2 lg:flex lg:items-center lg:justify-center gap-2.5 sm:gap-3 mt-8 w-full max-w-md lg:max-w-4xl mx-auto"
          >
            {tools.map((tool, idx) => (
              <a
                key={idx}
                href={tool.mainUrl}
                target="_blank"
                rel="noreferrer"
                className={`ql-btn-outline flex items-center justify-center gap-2 px-3.5 md:px-5 py-3 min-h-[44px] rounded-full text-xs md:text-sm font-bold whitespace-nowrap ${
                  idx === tools.length - 1 && tools.length % 2 === 1 ? 'col-span-2 lg:col-span-1' : ''
                }`}
              >
                <tool.icon className="w-4 h-4 text-[#1E40FF] shrink-0" />
                <span>{tool.title === 'Auto Lead Router' ? 'Auto Chia Data' : tool.title}</span>
              </a>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Tool Cards Grid Section */}
      <section id="tools" className="pb-20 px-6 z-10 relative max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-7">
          {tools.map((tool) => (
            <ToolCard key={tool.title} {...tool} />
          ))}
        </div>
      </section>

      {/* Partner Section */}
      <section className="py-14 border-t border-slate-200/80 bg-white/55 backdrop-blur-sm z-10 relative">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-6">
            Được liên kết &amp; vận hành trực tiếp bởi
          </h2>
          <div className="flex items-center justify-center gap-6 md:gap-8">
            <div className="flex items-center gap-2.5 px-4 py-2 rounded-full bg-white border border-slate-200/90 shadow-sm">
              <DomationLogoMark size={24} />
              <span className="text-sm font-black text-slate-900">DOMATION.NET</span>
            </div>
            <div className="w-1.5 h-1.5 rounded-full bg-slate-300" />
            <div className="flex items-center gap-2.5 px-4 py-2 rounded-full bg-white border border-slate-200/90 shadow-sm">
              <img src={ideasLogoUrl} alt="IDEAS" loading="lazy" decoding="async" className="h-6 object-contain rounded" />
              <span className="text-sm font-black text-slate-900">IDEAS</span>
            </div>
          </div>
        </div>
      </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200/80 py-10 px-6 bg-white/80 backdrop-blur-md z-10 relative text-center pb-24 sm:pb-12">
        <div className="flex items-center justify-center gap-2.5 mb-3">
          <DomationLogoMark size={28} />
          <span className="text-sm font-black tracking-wider text-slate-900 uppercase">DOMATION.NET</span>
        </div>
        <p className="text-slate-500 text-xs mb-1.5">
          © {new Date().getFullYear()} Nền tảng số hóa doanh nghiệp toàn diện.
        </p>
        <p className="text-slate-400 text-[10px] uppercase tracking-[0.2em]">
          Powered by{' '}
          <a
            href="https://turnio.vercel.app/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#1E40FF] hover:underline font-bold"
          >
            Turnio DEV
          </a>
        </p>
      </footer>

      {/* Centered Blue Back to Top Pill */}
      <BackToTopPill />

      {/* Support Contact Modal */}
      <ContactModal isOpen={showContactModal} onClose={() => setShowContactModal(false)} />
    </div>
  );
};
