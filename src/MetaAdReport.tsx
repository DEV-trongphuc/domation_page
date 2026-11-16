import React, { useEffect, useRef, useState } from 'react';
import { motion, useAnimation, useInView, AnimatePresence } from 'framer-motion';
import {
  Activity,
  Bot,
  BarChart3,
  TrendingUp,
  Network,
  Settings2,
  Check,
  ArrowRight,
  Target,
  Send,
  X,
  Play,
  ShieldCheck,
  Filter,
  Clock,
  MousePointerClick,
  Eye,
  Users,
} from 'lucide-react';
import { ContactModal } from './ContactModal';
import { Navbar } from './Navbar';
import { LuxuryGoldBackdrop } from './LuxuryGoldBackdrop';
import { DomationLogoMark } from './components/DomationLogoMark';
import { DECOR_PNGS } from './data/enterpriseData';

const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

const FadeIn = ({
  children,
  delay = 0,
  className = '',
  from = 'bottom',
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
  from?: 'bottom' | 'left' | 'right';
}) => {
  const controls = useAnimation();
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-40px' });
  const initial = isMobile
    ? { opacity: 0, y: 18 }
    : from === 'left'
    ? { opacity: 0, x: -32 }
    : from === 'right'
    ? { opacity: 0, x: 32 }
    : { opacity: 0, y: 24 };
  useEffect(() => {
    if (inView) controls.start({ opacity: 1, x: 0, y: 0 });
  }, [controls, inView]);

  return (
    <motion.div
      ref={ref}
      animate={controls}
      initial={initial}
      transition={{
        duration: isMobile ? 0.45 : 0.65,
        delay: isMobile ? delay * 0.4 : delay,
        ease: [0.22, 1, 0.36, 1],
      }}
      className={className}
      style={{ willChange: 'opacity, transform' }}
    >
      {children}
    </motion.div>
  );
};

export const MetaAdReport: React.FC = () => {
  const [isYearly, setIsYearly] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ email: '', phone: '', message: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const features = [
    {
      title: 'Realtime Tracking',
      desc: 'Cập nhật chỉ số chiến dịch quảng cáo theo thời gian thực',
      icon: Activity,
      accent: 'from-[#1E40FF] to-[#0284C7]',
    },
    {
      title: 'AI Phân Tích',
      desc: 'Tích hợp AI dự báo, đánh giá hiệu quả và đề xuất tối ưu Ads',
      icon: Bot,
      accent: 'from-[#0284C7] to-[#06B6D4]',
    },
    {
      title: 'Báo Cáo Trực Quan',
      desc: 'Hệ thống Dashboard biểu đồ hiển thị ROI, CPA, ROAS rõ ràng',
      icon: BarChart3,
      accent: 'from-blue-600 to-cyan-500',
    },
    {
      title: 'Dự Đoán Xu Hướng',
      desc: 'Học máy (Machine Learning) dự báo xu hướng chi phí và chuyển đổi',
      icon: TrendingUp,
      accent: 'from-emerald-500 to-teal-600',
    },
    {
      title: 'Đồng Bộ API',
      desc: 'Kết nối trực tiếp Meta Ads API đảm bảo dữ liệu chính xác 100%',
      icon: Network,
      accent: 'from-indigo-500 to-[#1E40FF]',
    },
    {
      title: 'Tự Động Hóa Quản Trị',
      desc: 'Ngắt/Bật Ads tự động dựa trên quy tắc thông minh, chống lãng phí',
      icon: Settings2,
      accent: 'from-[#06B6D4] to-[#1E40FF]',
    },
  ];

  const gallery = [
    '/imgs/dom_rp (1).webp',
    '/imgs/dom_rp (2).webp',
    '/imgs/dom_rp (3).webp',
    '/imgs/dom_rp (4).webp',
    '/imgs/dom_rp (5).webp',
    '/imgs/dom_rp (6).webp',
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSuccess(true);
      setTimeout(() => {
        setShowModal(false);
        setIsSuccess(false);
        setFormData({ email: '', phone: '', message: '' });
      }, 3000);
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-slate-900 overflow-x-clip font-sans relative selection:bg-[#1E40FF] selection:text-white">
      <LuxuryGoldBackdrop />

      {/* Navigation */}
      <Navbar activePage="meta-report" onOpenContact={() => setShowContactModal(true)} />

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
        src={DECOR_PNGS.funnel}
        alt=""
        aria-hidden="true"
        animate={{ y: [0, 14, 0], rotate: [5, -5, 5] }}
        transition={{ duration: 7.5, repeat: Infinity, ease: 'easeInOut' }}
        className="hidden xl:block pointer-events-none select-none fixed top-44 right-[2%] w-28 h-28 object-contain opacity-65 z-0"
      />

      <main className="relative pt-28 md:pt-32 pb-24 px-4 md:px-6 z-10 w-full">
        <div className="max-w-6xl mx-auto">
          {/* Hero Section */}
          <div className="text-center mb-16 md:mb-24">
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="ql-eyebrow mb-6">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              META DASHBOARD • READY TO SCALE
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 22 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.12 }}
              className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tight text-slate-900 mb-6 leading-[1.12]"
            >
              Meta Ads Report &amp;{' '}
              <span className="text-gradient-inkica">Creative Hook Rate</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-slate-600 text-sm md:text-lg max-w-3xl mx-auto leading-relaxed mb-9 font-medium"
            >
              Tích hợp AI phân tích dữ liệu quảng cáo Meta theo thời gian thực. Đo chuẩn Hook Rate, Hold Rate, đối soát
              ROAS thực từ CRM và cảnh báo Admin Log từng giây.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.28 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-4 flex-wrap"
            >
              <a
                href="https://meta.domation.net"
                target="_blank"
                rel="noreferrer"
                className="btn-inkica-primary w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-4 rounded-full text-sm md:text-base font-bold"
              >
                Miễn phí dùng thử <ArrowRight className="w-4 h-4" />
              </a>
              <button
                type="button"
                onClick={() => setShowVideoModal(true)}
                className="ql-btn-outline w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-4 rounded-full text-sm md:text-base font-bold cursor-pointer"
              >
                <Play className="w-4 h-4 text-[#1E40FF]" fill="currentColor" />
                Video hướng dẫn
              </button>
            </motion.div>
          </div>

          {/* Gallery Section */}
          <div className="mb-20 md:mb-24">
            <FadeIn className="text-center mb-10">
              <h2 className="text-3xl md:text-4xl font-black text-slate-900 mb-3">
                Giao Diện <span className="text-gradient-inkica">Dashboard</span>
              </h2>
              <p className="text-slate-600 max-w-2xl mx-auto">
                Hệ thống báo cáo trực quan, theo dõi mọi chỉ số ngay trong một màn hình.
              </p>
            </FadeIn>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {gallery.map((img, idx) => (
                <FadeIn key={idx} delay={idx * 0.06}>
                  <div
                    className="inkica-glass-card group relative overflow-hidden aspect-[4/3] p-1.5 cursor-zoom-in"
                    onClick={() => setPreviewImage(img)}
                  >
                    <div className="relative w-full h-full rounded-2xl overflow-hidden bg-slate-100">
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-900/65 via-transparent to-transparent z-10 opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                        <div className="flex items-center gap-2 text-white font-bold text-sm">
                          <Target className="w-4 h-4 text-cyan-300" /> Xem chi tiết
                        </div>
                      </div>
                      <img
                        src={img}
                        alt={`Dashboard Screenshot ${idx + 1}`}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                        loading="lazy"
                      />
                    </div>
                  </div>
                </FadeIn>
              ))}
            </div>
          </div>

          {/* Features Grid */}
          <div className="mb-20 md:mb-24">
            <FadeIn className="text-center mb-10">
              <h2 className="text-3xl md:text-4xl font-black text-slate-900 mb-3">
                Giải Pháp Tối Ưu <span className="text-gradient-inkica">Quản Trị Quảng Cáo</span>
              </h2>
              <p className="text-slate-600 max-w-2xl mx-auto">
                Kiểm soát chi phí, gia tăng tỷ lệ chuyển đổi và ra quyết định tức thời với sự hỗ trợ từ AI.
              </p>
            </FadeIn>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {features.map((feat, idx) => (
                <FadeIn key={idx} delay={idx * 0.08} className="h-full">
                  <div className="inkica-glass-card p-6 lg:p-7 flex flex-col h-full group hover:border-blue-300 transition-all">
                    <div
                      className={`w-12 h-12 rounded-2xl mb-5 flex items-center justify-center bg-gradient-to-br ${feat.accent} text-white shadow-[0_8px_20px_-4px_rgba(30,64,255,0.28)]`}
                    >
                      <feat.icon className="w-5 h-5" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 mb-2.5 group-hover:text-[#1E40FF] transition-colors">
                      {feat.title}
                    </h3>
                    <p className="text-sm text-slate-600 leading-relaxed flex-1">{feat.desc}</p>
                  </div>
                </FadeIn>
              ))}
            </div>
          </div>

          {/* Admin Log & Pain Points */}
          <div className="mb-20">
            <div className="inkica-glass-card p-7 md:p-12 relative overflow-hidden">
              <img
                src={DECOR_PNGS.shield}
                alt=""
                aria-hidden="true"
                className="hidden md:block pointer-events-none select-none absolute -top-6 -right-6 w-24 h-24 object-contain opacity-85 animate-float-decor z-20"
              />
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-12 items-center relative z-10">
                <div>
                  <div className="ql-eyebrow mb-5">
                    <ShieldCheck className="w-3.5 h-3.5" /> Giải Quyết Nỗi Đau Doanh Nghiệp
                  </div>
                  <h2 className="text-2xl md:text-4xl font-black text-slate-900 mb-5 leading-tight">
                    Mất Kiểm Soát Tài Khoản Quảng Cáo?
                  </h2>
                  <p className="text-slate-600 text-sm md:text-lg mb-7 leading-relaxed">
                    Bạn là chủ doanh nghiệp hay đang thuê Agency chạy trên BM, nhưng lại{' '}
                    <strong className="text-[#1E40FF]">không thể kiểm soát</strong> được:
                  </p>
                  <ul className="space-y-3.5 mb-7">
                    {[
                      'Ai đã vào sửa tệp khách hàng (Target Audience) của bạn?',
                      'Admin nào vừa tắt/bật chiến dịch giữa đêm gây lãng phí ngân sách?',
                      'Thay đổi nội dung, ngân sách lúc nào và do ai thực hiện?',
                    ].map((pain, idx) => (
                      <li key={idx} className="flex items-start gap-3">
                        <div className="w-6 h-6 rounded-full bg-rose-50 border border-rose-200 flex items-center justify-center shrink-0 mt-0.5">
                          <X className="w-3.5 h-3.5 text-rose-600" />
                        </div>
                        <span className="text-slate-700 font-medium text-sm">{pain}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="p-5 rounded-2xl bg-blue-50/70 border border-blue-200/80">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                        <Check className="w-4 h-4 text-emerald-600" />
                      </div>
                      <h4 className="font-bold text-slate-900">Tính Năng Quản Lý Admin Log</h4>
                    </div>
                    <p className="text-sm text-slate-600">
                      Lưu trữ lịch sử thao tác (Log) chi tiết đến từng giây. Biết chính xác ai, làm gì, khi nào trên tài
                      khoản quảng cáo của bạn.
                    </p>
                  </div>
                </div>
                <div className="relative group cursor-zoom-in" onClick={() => setPreviewImage('/meta/admin_log.png')}>
                  <div className="relative rounded-[22px] overflow-hidden border border-slate-200/90 shadow-xl bg-white flex flex-col">
                    <div className="h-10 w-full bg-slate-100 flex items-center justify-between px-4 border-b border-slate-200 shrink-0 z-20">
                      <div className="flex space-x-2">
                        <div className="w-3 h-3 rounded-full bg-[#ff5f56]" />
                        <div className="w-3 h-3 rounded-full bg-[#ffbd2e]" />
                        <div className="w-3 h-3 rounded-full bg-[#27c93f]" />
                      </div>
                      <div className="flex items-center gap-2 text-slate-500 text-xs font-semibold">
                        <Settings2 className="w-3.5 h-3.5 text-[#1E40FF]" /> Admin Log
                      </div>
                    </div>
                    <div className="relative overflow-hidden bg-slate-50">
                      <div className="absolute inset-0 bg-slate-900/35 z-10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <div className="flex items-center gap-2 text-slate-900 font-bold text-sm bg-white/95 px-4 py-2 rounded-full shadow">
                          <Target className="w-4 h-4 text-[#1E40FF]" /> Xem chi tiết
                        </div>
                      </div>
                      <img
                        src="/meta/admin_log.png"
                        alt="Admin Log Screenshot"
                        className="w-full h-auto object-cover group-hover:scale-105 transition-transform duration-700"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Advanced Reports Section */}
          <div className="mb-20 space-y-10">
            {/* 1. Phễu Khách Hàng */}
            <FadeIn className="inkica-glass-card p-7 md:p-10 relative overflow-hidden">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10 lg:gap-12 items-center relative z-10">
                <div className="order-2 md:order-1 flex flex-col gap-3">
                  {[
                    {
                      title: 'Lượt Hiển Thị (Impressions)',
                      value: 'Tiếp cận 100k+ người dùng',
                      icon: Eye,
                      color: 'from-[#1E40FF] to-[#0284C7]',
                      width: '100%',
                    },
                    {
                      title: 'Lượt Click (CTR)',
                      value: 'Tỷ lệ Click ~ 5%',
                      icon: MousePointerClick,
                      color: 'from-[#0284C7] to-[#06B6D4]',
                      width: '80%',
                    },
                    {
                      title: 'Lượt Đăng Ký (Leads)',
                      value: 'Chi phí Lead tối ưu',
                      icon: Users,
                      color: 'from-blue-600 to-cyan-500',
                      width: '60%',
                    },
                    {
                      title: 'Chuyển Đổi (Sales)',
                      value: 'ROAS tăng trưởng',
                      icon: Target,
                      color: 'from-emerald-500 to-teal-500',
                      width: '40%',
                    },
                  ].map((step, idx) => (
                    <div
                      key={idx}
                      className="w-full bg-white/95 rounded-2xl border border-slate-200/85 p-4 md:p-5 shadow-sm"
                    >
                      <div className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200/80 flex items-center justify-center shrink-0">
                          <step.icon className="w-4 h-4 text-[#1E40FF]" />
                        </div>
                        <div className="flex-1 flex flex-col gap-2.5">
                          <div>
                            <h3 className="font-bold text-slate-900 text-sm">{step.title}</h3>
                            <p className="text-[11px] text-slate-500 mt-0.5">{step.value}</p>
                          </div>
                          <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              whileInView={{ width: step.width }}
                              viewport={{ once: true }}
                              transition={{ duration: 0.9, delay: idx * 0.12, ease: 'easeOut' }}
                              className={`h-full bg-gradient-to-r ${step.color} rounded-full`}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="order-1 md:order-2">
                  <div className="ql-eyebrow mb-5">
                    <Filter className="w-3.5 h-3.5" /> Phễu Chuyển Đổi
                  </div>
                  <h2 className="text-2xl md:text-4xl font-black text-slate-900 mb-5 leading-tight">
                    Phân Tích Hành Trình Khách Hàng Trực Quan
                  </h2>
                  <p className="text-slate-600 text-sm md:text-base mb-7 leading-relaxed">
                    Nhìn thấu mọi điểm rơi rụng (Drop-off rate) trong phễu quảng cáo. Biết chính xác chiến dịch đang
                    "kẹt" ở bước nào để tối ưu ngay lập tức.
                  </p>
                  <ul className="space-y-3">
                    {['Theo dõi ROI/ROAS ở từng giai đoạn', 'Phát hiện nội dung có CTR thấp', 'Tối ưu chi phí mỗi Lead (CPL)'].map(
                      (item, i) => (
                        <li key={i} className="flex items-center gap-3 text-sm text-slate-700 font-medium">
                          <Check className="w-4 h-4 text-[#1E40FF]" /> {item}
                        </li>
                      )
                    )}
                  </ul>
                </div>
              </div>
            </FadeIn>

            {/* 2. Tracking Thời Gian */}
            <FadeIn className="inkica-glass-card p-7 md:p-10 relative overflow-hidden">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10 lg:gap-12 items-center relative z-10">
                <div>
                  <div className="ql-eyebrow mb-5">
                    <Clock className="w-3.5 h-3.5" /> Giờ Vàng Chốt Sale
                  </div>
                  <h2 className="text-2xl md:text-4xl font-black text-slate-900 mb-5 leading-tight">
                    Theo Dõi Chuyển Đổi Theo Khung Giờ
                  </h2>
                  <p className="text-slate-600 text-sm md:text-base mb-7 leading-relaxed">
                    Không còn lên camp dựa vào cảm tính. Hệ thống phân tích dữ liệu lịch sử để tìm ra{' '}
                    <strong className="text-[#1E40FF]">"Khung Giờ Vàng"</strong> có tỷ lệ chuyển đổi cao nhất.
                  </p>
                  <div className="flex flex-row gap-4">
                    <div className="flex-1 p-4 rounded-xl bg-white border border-slate-200/85 shadow-sm">
                      <div className="text-lg md:text-xl font-black text-slate-900 mb-1">08:00 - 10:00</div>
                      <div className="text-[11px] md:text-xs text-slate-500">Tỷ lệ tương tác cao</div>
                    </div>
                    <div className="flex-1 p-4 rounded-xl bg-blue-50/90 border border-blue-200 shadow-sm">
                      <div className="text-lg md:text-xl font-black text-[#1E40FF] mb-1">20:00 - 23:00</div>
                      <div className="text-[11px] md:text-xs text-slate-700 font-medium">Đỉnh điểm chuyển đổi</div>
                    </div>
                  </div>
                </div>
                <div className="relative h-[280px] bg-slate-50/90 rounded-2xl border border-slate-200 p-6 md:p-8 flex flex-col justify-end">
                  <div className="absolute inset-0 p-6 md:p-8 flex flex-col justify-between pointer-events-none opacity-60">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="w-full h-px bg-slate-200" />
                    ))}
                  </div>
                  <div className="relative flex items-end justify-between gap-1 md:gap-2 h-full z-10 w-full pt-8">
                    {[
                      { h: 30, time: '8h' },
                      { h: 20, time: '10h' },
                      { h: 50, time: '12h' },
                      { h: 25, time: '14h' },
                      { h: 70, time: '16h' },
                      { h: 100, time: '20h' },
                      { h: 40, time: '22h' },
                      { h: 15, time: '24h' },
                    ].map((item, i) => (
                      <div key={i} className="flex flex-col items-center gap-3 h-full justify-end group w-full">
                        <div className="w-full relative flex justify-center items-end h-full">
                          {item.h === 100 && (
                            <div className="absolute -top-7 bg-[#1E40FF] text-white text-[10px] font-black py-0.5 px-2 rounded-md shadow z-20">
                              {item.h}%
                            </div>
                          )}
                          <motion.div
                            initial={{ height: 0 }}
                            whileInView={{ height: `${item.h}%` }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.8, delay: i * 0.08, ease: 'easeOut' }}
                            className={`w-full max-w-[28px] rounded-t-[6px] ${
                              item.h === 100
                                ? 'bg-gradient-to-t from-[#1E40FF] to-[#06B6D4]'
                                : 'bg-gradient-to-t from-blue-300 to-blue-500'
                            }`}
                          />
                        </div>
                        <span className="text-[10px] font-semibold text-slate-500">{item.time}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </FadeIn>
          </div>

          {/* Pricing Section */}
          <div className="max-w-4xl mx-auto mb-16" id="pricing">
            <FadeIn className="text-center mb-10">
              <h2 className="text-3xl md:text-4xl font-black text-slate-900 mb-3">
                Bảng Giá <span className="text-gradient-inkica">Dịch Vụ</span>
              </h2>
              <p className="text-slate-600 max-w-2xl mx-auto">
                Chi phí tối ưu cho một giải pháp toàn diện. Đăng ký để sở hữu hệ thống báo cáo thông minh.
              </p>
            </FadeIn>

            <div className="flex items-center justify-center gap-4 mb-10">
              <span className={`text-sm font-bold transition-colors ${!isYearly ? 'text-slate-900' : 'text-slate-400'}`}>
                Hàng Tháng
              </span>
              <button
                type="button"
                onClick={() => setIsYearly(!isYearly)}
                className="relative w-14 h-7 bg-white border border-slate-300 rounded-full transition-colors focus:outline-none cursor-pointer shadow-inner"
                aria-label="Chuyển đổi gói tháng và năm"
              >
                <div
                  className={`absolute top-1/2 -translate-y-1/2 left-1 w-5 h-5 rounded-full bg-gradient-to-r from-[#1E40FF] to-[#06B6D4] transition-transform duration-300 ${
                    isYearly ? 'translate-x-7' : 'translate-x-0'
                  }`}
                />
              </button>
              <div className="flex items-center gap-2">
                <span className={`text-sm font-bold transition-colors ${isYearly ? 'text-slate-900' : 'text-slate-400'}`}>
                  Hàng Năm
                </span>
                <span className="bg-blue-50 text-[#1E40FF] text-[10px] font-bold px-2.5 py-0.5 rounded-full border border-blue-200">
                  GIẢM 29%
                </span>
              </div>
            </div>

            <FadeIn delay={0.15}>
              <div className="rounded-[28px] p-8 md:p-12 bg-gradient-to-br from-[#0F172A] via-[#1E3A8A] to-[#0284C7] text-white text-center shadow-[0_24px_60px_-12px_rgba(30,64,255,0.4)]">
                <div className="inline-block px-4 py-1.5 rounded-full bg-white/15 border border-white/25 text-xs font-bold text-cyan-200 uppercase tracking-widest mb-6">
                  Gói Dịch Vụ Cốt Lõi
                </div>

                <div className="flex items-center justify-center mb-6">
                  <span className="text-5xl md:text-7xl font-black text-white">
                    {isYearly ? '490.000' : '690.000'}
                  </span>
                  <span className="text-xl md:text-2xl text-blue-200 font-bold ml-2">đ</span>
                  <span className="text-blue-200 ml-1">/ tháng</span>
                </div>

                {isYearly && (
                  <div className="text-sm text-cyan-300 mb-8 font-semibold">
                    Thanh toán theo năm: 5.880.000đ / năm (Tiết kiệm 2.400.000đ)
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left max-w-2xl mx-auto mb-10">
                  {[
                    'Realtime tracking campaign',
                    'AI dự báo, tối ưu Ads',
                    'Đồng bộ API trực tiếp Meta',
                    'Hệ thống tự động hóa Bật/Tắt Ads',
                    'Dashboard trực quan CPA/ROAS',
                    'Dự đoán xu hướng máy học',
                  ].map((item, idx) => (
                    <div key={idx} className="flex items-start gap-3">
                      <div className="w-5 h-5 rounded-full bg-white/15 border border-white/30 flex items-center justify-center mt-0.5 shrink-0">
                        <Check className="w-3 h-3 text-cyan-300" />
                      </div>
                      <span className="text-blue-50 text-sm">{item}</span>
                    </div>
                  ))}
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-4 max-w-2xl mx-auto">
                  <a
                    href="https://zalo.me/0378859736"
                    target="_blank"
                    rel="noreferrer"
                    className="w-full flex items-center justify-center gap-2 bg-[#0068FF] hover:bg-[#0055D4] text-white py-4 rounded-xl font-bold shadow-lg hover:-translate-y-0.5 transition-all"
                  >
                    <img
                      src="https://stc-zpl.zdn.vn/favicon.ico"
                      className="w-5 h-5 object-contain rounded-sm bg-white p-0.5"
                      alt="Zalo"
                    />
                    Liên hệ qua Zalo
                  </a>
                  <a
                    href="https://fb.com/turni0"
                    target="_blank"
                    rel="noreferrer"
                    className="w-full flex items-center justify-center gap-2 bg-white text-[#1E40FF] hover:bg-blue-50 py-4 rounded-xl font-bold shadow-lg hover:-translate-y-0.5 transition-all"
                  >
                    Liên hệ Facebook
                  </a>
                </div>
              </div>
            </FadeIn>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200/80 py-10 px-6 bg-white/80 backdrop-blur-md relative z-10 text-center pb-24 sm:pb-12">
        <div className="flex items-center justify-center gap-2.5 mb-2.5">
          <DomationLogoMark size={28} />
          <span className="text-sm font-black tracking-wider text-slate-900 uppercase">DOMATION.NET</span>
        </div>
        <p className="text-slate-500 text-xs font-medium">
          © {new Date().getFullYear()} DOMATION. All rights reserved.
        </p>
        <p className="text-slate-400 text-[11px] mt-1.5">
          Powered by{' '}
          <a
            href="https://turnio.vercel.app/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#1E40FF] hover:underline font-semibold"
          >
            Turnio DEV
          </a>
        </p>
      </footer>

      {/* Centered Sticky Back to Top */}
      <button
        type="button"
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        aria-label="Lên đầu trang"
        className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-full bg-white/95 backdrop-blur-md border border-slate-200/90 shadow-[0_8px_24px_rgba(15,23,42,0.1)] text-xs font-bold text-slate-700 hover:text-[#1E40FF] transition-all cursor-pointer"
      >
        ↑ Đầu trang
      </button>

      {/* Request Modal */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/55 backdrop-blur-sm"
              onClick={() => !isSubmitting && setShowModal(false)}
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-lg bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-2xl z-10"
            >
              <div className="p-6 md:p-8">
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <h3 className="text-2xl font-black text-slate-900 mb-1">Nhận Tư Vấn</h3>
                    <p className="text-slate-500 text-sm">Điền thông tin để trải nghiệm hệ thống Meta Ads Report.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="p-2 bg-slate-100 hover:bg-slate-200 rounded-full transition-colors cursor-pointer"
                  >
                    <X className="w-5 h-5 text-slate-600" />
                  </button>
                </div>

                {isSuccess ? (
                  <div className="py-12 flex flex-col items-center text-center">
                    <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mb-4">
                      <Check className="w-8 h-8 text-emerald-600" />
                    </div>
                    <h4 className="text-xl font-bold text-slate-900 mb-2">Gửi thành công!</h4>
                    <p className="text-slate-600">Chúng tôi sẽ liên hệ với bạn trong thời gian sớm nhất.</p>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Email</label>
                      <input
                        type="email"
                        required
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#1E40FF] focus:bg-white transition-all"
                        placeholder="Nhập địa chỉ email..."
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                        Số điện thoại
                      </label>
                      <input
                        type="tel"
                        required
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#1E40FF] focus:bg-white transition-all"
                        placeholder="Nhập số điện thoại..."
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Nội dung</label>
                      <textarea
                        required
                        value={formData.message}
                        onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#1E40FF] focus:bg-white transition-all min-h-[100px] resize-none"
                        placeholder="Yêu cầu chi tiết của bạn..."
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="btn-inkica-primary w-full font-black py-4 rounded-xl mt-4 flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                    >
                      {isSubmitting ? (
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <>
                          <Send className="w-4 h-4" />
                          Gửi Yêu Cầu
                        </>
                      )}
                    </button>
                  </form>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Image Preview Modal */}
      <AnimatePresence>
        {previewImage && (
          <div
            className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/65 backdrop-blur-sm"
            onClick={() => setPreviewImage(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-6xl max-h-[90vh] bg-white p-2 rounded-2xl shadow-2xl flex items-center justify-center"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                onClick={() => setPreviewImage(null)}
                className="absolute -top-11 right-0 p-2 rounded-full bg-white text-slate-800 shadow hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-6 h-6" />
              </button>
              <img src={previewImage} alt="Preview" className="w-full h-full max-h-[85vh] object-contain rounded-xl" />
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Video Modal */}
      <AnimatePresence>
        {showVideoModal && (
          <div
            className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/75 backdrop-blur-sm"
            onClick={() => setShowVideoModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-5xl flex flex-col items-center gap-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="relative w-full aspect-video rounded-3xl overflow-hidden shadow-2xl bg-slate-950 border border-white/20">
                <button
                  type="button"
                  onClick={() => setShowVideoModal(false)}
                  className="absolute top-4 right-4 z-10 p-2.5 bg-white/90 hover:bg-white text-slate-900 rounded-full transition-colors cursor-pointer shadow"
                >
                  <X className="w-5 h-5" />
                </button>
                <iframe
                  width="100%"
                  height="100%"
                  src="https://www.youtube.com/embed/fvIHSrpsAlI?autoplay=1"
                  title="Hướng dẫn kích hoạt report"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                  className="absolute inset-0"
                />
              </div>
              <a
                href="https://youtu.be/fvIHSrpsAlI?si=u4Ch5TjsjZWyvkkW"
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 px-7 py-3 rounded-full bg-white text-[#1E40FF] hover:bg-blue-50 text-sm font-bold transition-all shadow-lg"
              >
                <Play className="w-5 h-5" fill="currentColor" />
                Xem trên YouTube
              </a>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <ContactModal isOpen={showContactModal} onClose={() => setShowContactModal(false)} />
    </div>
  );
};
