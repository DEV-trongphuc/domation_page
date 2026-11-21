import React, { useEffect, useRef, useState } from 'react';
import { motion, useAnimation, useInView, AnimatePresence } from 'framer-motion';
import {
  BarChart3,
  Building2,
  Check,
  ArrowRight,
  Target,
  Send,
  X,
  Eye,
  Calendar,
  LifeBuoy,
  Users2,
} from 'lucide-react';
import { ContactModal } from './ContactModal';
import { SPECIALIST_ZALO_URL } from './components/common/ZaloSpecialistBanner';
import { Navbar } from './Navbar';
import { BackToTopPill } from './components/BackToTopPill';
import { LuxuryGoldBackdrop } from './LuxuryGoldBackdrop';
import { DomationLogoMark } from './components/DomationLogoMark';
import { FounderAuthorityBlock } from './components/FounderAuthorityBlock';
import { MobileAppShowcaseSection } from './components/MobileAppShowcaseSection';
import { MotionVideoShowcase } from './components/MotionVideoShowcase';
import { ResponsiveSlideDeck } from './components/ResponsiveSlideDeck';
import { DECOR_PNGS, DOMATION_SAAS_PLANS } from './data/enterpriseData';
import { getCrmSeoConfig } from './data/coreRouteSeo';
import { usePageSeo } from './utils/seo';

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

export const CrmLanding: React.FC = () => {
  usePageSeo(getCrmSeoConfig());
  const [isYearly, setIsYearly] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    size: '1-10',
    note: 'Đăng ký trải nghiệm CRM Landing',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [showContactModal, setShowContactModal] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const features = [
    {
      title: 'Pipeline Bán Hàng 9 Nấc',
      desc: 'Quản trị toàn bộ thương vụ từ Qualified, Booked, Booking, Deposited đến Closed với giao diện Kanban & CAPI.',
      icon: Target,
      accent: 'from-[#1E40FF] to-[#0284C7]',
    },
    {
      title: 'Khách Hàng 360° & Lọc Trùng 180 Ngày',
      desc: 'Hợp nhất lịch sử Web Tracking, Zalo, cuộc gọi, báo giá & chống trùng đa chiến dịch trong 6 tháng.',
      icon: Users2,
      accent: 'from-[#0284C7] to-[#06B6D4]',
    },
    {
      title: 'Giỏ Hàng BĐS Real-Time & MISA 2 Chiều',
      desc: 'Khóa căn giữ chỗ tức thì tránh trùng cọc, chia hoa hồng Co-care 100% và đồng bộ hóa đơn điện tử MISA.',
      icon: Building2,
      accent: 'from-blue-600 to-cyan-500',
    },
    {
      title: 'Chia Số Tức Thì & Van SLA 120s',
      desc: 'Tự động phân phối Lead qua ZaloBot / Telegram, thu hồi sau 120s nếu quá hạn và bù Ticket lỗi 1-đổi-1.',
      icon: Calendar,
      accent: 'from-emerald-500 to-teal-600',
    },
    {
      title: 'Đối Soát Doanh Thu Ads Thực',
      desc: 'Kết nối trực tiếp DomMeta Graph v25.0 & bắn ngược SHA-256 Meta CAPI giúp tối ưu ROAS từng bài quảng cáo.',
      icon: BarChart3,
      accent: 'from-[#1E40FF] to-[#06B6D4]',
    },
    {
      title: 'Kho Databank & Support Tickets',
      desc: 'Đồng hồ bảo mật tự trả lead nguội về kho chung khai thác song song, xử lý Ticket báo lỗi minh bạch.',
      icon: LifeBuoy,
      accent: 'from-indigo-500 to-[#1E40FF]',
    },
  ];

  const gallery = [
    '/crm_imgs/CRMS (2).jpg',
    '/crm_imgs/CRMS (3).jpg',
    '/crm_imgs/CRMS (4).jpg',
    '/crm_imgs/CRM (5).jpg',
    '/crm_imgs/CRM (6).jpg',
    '/crm_imgs/CRM (7).jpg',
    '/crm_imgs/CRM (8).jpg',
    '/crm_imgs/CRM (9).jpg',
    '/crm_imgs/CRM (10).jpg',
    '/crm_imgs/CRM (11).jpg',
    '/crm_imgs/CRM (12).jpg',
    '/crm_imgs/CRM (14).jpg',
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email) return;

    setIsSubmitting(true);
    try {
      const SCRIPT_URL =
        'https://script.google.com/macros/s/AKfycbwY3J_VJN6lhGHaoJ0zNnOyYxsswyb3I1KqQ7nrdeElMZreXEKO_cigKEOEhtH-0noK/exec';

      await fetch(SCRIPT_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          source: 'DOMATION CRM Landing',
          timestamp: new Date().toLocaleString('vi-VN'),
        }),
      });

      setIsSuccess(true);
      setTimeout(() => {
        setShowModal(false);
        setIsSuccess(false);
        setFormData({
          name: '',
          email: '',
          phone: '',
          company: '',
          size: '1-10',
          note: 'Đăng ký trải nghiệm CRM Landing',
        });
      }, 3000);
    } catch (error) {
      console.error('Submit error:', error);
      alert('Có lỗi xảy ra, vui lòng thử lại.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-slate-900 overflow-x-clip font-sans relative selection:bg-[#1E40FF] selection:text-white">
      <LuxuryGoldBackdrop />

      {/* Navigation */}
      <Navbar activePage="crm" onOpenContact={() => setShowContactModal(true)} />

      <main className="relative pt-28 md:pt-32 pb-24 px-4 md:px-6 z-10 w-full">
        {/* Floating 3D PNG Decors */}
        <motion.img
          src={DECOR_PNGS.torus}
          alt=""
          aria-hidden="true"
          animate={{ y: [0, -14, 0], rotate: [-4, 4, -4] }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
          className="hidden xl:block pointer-events-none select-none fixed top-32 left-[2%] w-28 h-28 object-contain opacity-65"
        />
        <motion.img
          src={DECOR_PNGS.prism}
          alt=""
          aria-hidden="true"
          animate={{ y: [0, 14, 0], rotate: [5, -5, 5] }}
          transition={{ duration: 7.5, repeat: Infinity, ease: 'easeInOut' }}
          className="hidden xl:block pointer-events-none select-none fixed top-44 right-[2%] w-28 h-28 object-contain opacity-65"
        />

        <div className="max-w-6xl mx-auto">
          {/* Hero Section */}
          <div className="text-center mb-16 md:mb-24">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              className="ql-eyebrow mb-6"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              ENTERPRISE CRM 360° &amp; AUTO CHIA DATA 5.0
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 22 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-[1.45rem] sm:text-5xl md:text-6xl font-black tracking-tight text-slate-900 mb-5 sm:mb-6 leading-[1.15]"
            >
              DOMATION CRM 360°{' '}
              <span className="text-gradient-inkica">&amp; Auto Data 5.0</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-slate-600 text-sm md:text-lg max-w-3xl mx-auto leading-relaxed mb-9 font-medium"
            >
              Hệ thống CRM 360° kết hợp Auto Chia Data tức thì qua ZaloBot &amp; Telegram: quản trị Sales Pipeline 9
              nấc chuẩn Meta CAPI, lọc trùng 180 ngày, giỏ hàng BĐS real-time &amp; đồng bộ hóa đơn điện tử MISA hai chiều.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="grid grid-cols-2 sm:inline-flex items-center justify-center gap-2.5 sm:gap-4 mb-10 sm:mb-14 max-w-md sm:max-w-none mx-auto"
            >
              <a
                href="https://crm-domation.vercel.app/"
                target="_blank"
                rel="noreferrer"
                className="btn-inkica-primary min-h-[44px] w-full sm:w-auto flex items-center justify-center gap-1.5 sm:gap-2 px-3.5 sm:px-8 py-3 sm:py-4 rounded-full text-xs sm:text-sm md:text-base font-bold whitespace-nowrap"
              >
                Trải nghiệm ngay <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
              </a>
              <button
                type="button"
                onClick={() => setShowModal(true)}
                className="ql-btn-outline min-h-[44px] w-full sm:w-auto flex items-center justify-center gap-1.5 sm:gap-2 px-3.5 sm:px-8 py-3 sm:py-4 rounded-full text-xs sm:text-sm md:text-base font-bold whitespace-nowrap cursor-pointer"
              >
                Xem báo giá
              </button>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.7 }}
              whileHover={{ y: -4 }}
              className="relative mx-auto rounded-[28px] p-2.5 bg-white/95 border border-slate-200/90 shadow-[0_24px_70px_-15px_rgba(30,64,255,0.16)] cursor-zoom-in"
              onClick={() => setPreviewImage('/crm_imgs/CRMS (1).jpg')}
            >
              <div className="rounded-[20px] overflow-hidden bg-slate-100 border border-slate-200/70 relative group">
                <img
                  src="/crm_imgs/CRMS (1).jpg"
                  alt="CRM Hero Dashboard"
                  loading="eager"
                  decoding="async"
                  fetchPriority="high"
                  className="w-full h-auto group-hover:scale-[1.02] transition-transform duration-700"
                />
              </div>
            </motion.div>
          </div>

          <div id="motion-showcase" className="mb-16 md:mb-20">
            <MotionVideoShowcase variant="spotlight" videoId="crm" />
          </div>

          <MobileAppShowcaseSection variant="crm" />

          {/* Features Grid */}
          <div className="mb-16 md:mb-24">
            <FadeIn className="text-center mb-8 sm:mb-12">
              <div className="ql-eyebrow mb-3">Module Linh Hoạt</div>
              <h2 className="text-[20px] sm:text-3xl lg:text-4xl font-black text-slate-900 mb-3 leading-[1.22]">
                Giải Pháp Quản Trị <span className="text-gradient-inkica">Đa Điểm Chạm</span>
              </h2>
              <p className="text-xs sm:text-base text-slate-600 max-w-2xl mx-auto">
                Tất cả những gì bạn cần để số hóa quy trình kinh doanh, không còn phải dùng rải rác nhiều phần mềm.
              </p>
            </FadeIn>

            <div className="md:hidden">
              <ResponsiveSlideDeck
                items={features}
                mobilePerPage={1}
                mobileColsClass="grid-cols-1"
                gapClass="gap-3.5"
                ariaLabel="6 tính năng quản trị CRM đa điểm chạm"
                keyExtractor={(f) => f.title}
                renderItem={(feat) => (
                  <div className="h-full rounded-2xl bg-white/95 border border-slate-200/85 p-5 shadow-xs flex flex-col">
                    <div
                      className={`w-11 h-11 rounded-2xl mb-4 flex items-center justify-center bg-gradient-to-br ${feat.accent} text-white shadow-sm`}
                    >
                      <feat.icon className="w-5 h-5" />
                    </div>
                    <h3 className="text-base font-bold text-slate-900 mb-2">{feat.title}</h3>
                    <p className="text-xs text-slate-600 leading-relaxed flex-1">{feat.desc}</p>
                  </div>
                )}
              />
            </div>

            <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-3 gap-6">
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

          {/* Deep Dive 1: Sales & Pipeline */}
          <div className="mb-20">
            <div className="inkica-glass-card p-7 md:p-12 relative overflow-hidden">
              <img
                src={DECOR_PNGS.funnel}
                alt=""
                aria-hidden="true"
                loading="lazy"
                decoding="async"
                className="hidden md:block pointer-events-none select-none absolute -top-6 -right-6 w-24 h-24 object-contain opacity-85 animate-float-decor z-20"
              />
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-12 items-center relative z-10">
                <div>
                  <div className="ql-eyebrow mb-5">
                    <Target className="w-3.5 h-3.5" /> Quản Lý Doanh Số Tối Đa
                  </div>
                  <h2 className="text-[20px] sm:text-3xl md:text-4xl font-black text-slate-900 mb-4 sm:mb-5 leading-[1.22]">
                    Tăng Tỷ Lệ Chốt Sale Với Kanban Pipeline
                  </h2>
                  <p className="text-slate-600 text-sm md:text-base mb-7 leading-relaxed">
                    Theo dõi hàng trăm thương vụ (Deals) cùng lúc mà không bị sót. Giao diện trực quan kéo thả giúp
                    Sales Manager nắm bắt dòng tiền dự kiến ngay tức thì.
                  </p>
                  <ul className="space-y-3.5">
                    {[
                      'Auto Chia Data qua ZaloBot tức thì, lọc trùng 180 ngày (6 tháng) & Van SLA 120s chống ôm số',
                      'Hồ sơ Khách hàng 360°, Pipeline Kanban 9 nấc & Giỏ hàng BĐS real-time khóa căn tức thì',
                      'Đồng bộ hóa đơn điện tử MISA hai chiều & bắn ngược Meta CAPI SHA-256 tối ưu quảng cáo',
                    ].map((pain, idx) => (
                      <li key={idx} className="flex items-start gap-3">
                        <div className="w-6 h-6 rounded-full bg-blue-50 border border-blue-200 flex items-center justify-center shrink-0 mt-0.5">
                          <Check className="w-3.5 h-3.5 text-[#1E40FF]" />
                        </div>
                        <span className="text-slate-700 font-medium text-sm">{pain}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div
                  className="relative group cursor-zoom-in rounded-2xl overflow-hidden border border-slate-200 bg-white p-1.5 shadow-xl"
                  onClick={() => setPreviewImage('/crm_imgs/CRMS (2).jpg')}
                >
                  <div className="relative rounded-xl overflow-hidden bg-slate-100">
                    <img
                      src="/crm_imgs/CRMS (2).jpg"
                      alt="Kanban Pipeline"
                      loading="lazy"
                      decoding="async"
                      className="w-full h-auto object-cover group-hover:scale-105 transition-transform duration-700"
                    />
                    <div className="absolute inset-0 bg-slate-900/40 z-10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <div className="flex items-center gap-2 text-slate-900 font-bold text-sm bg-white/95 px-4 py-2 rounded-full shadow">
                        <Eye className="w-4 h-4 text-[#1E40FF]" /> Phóng to
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Deep Dive 2: Inventory & Products */}
          <div className="mb-20">
            <FadeIn className="inkica-glass-card p-7 md:p-12 relative overflow-hidden group">
              <img
                src={DECOR_PNGS.shield}
                alt=""
                aria-hidden="true"
                loading="lazy"
                decoding="async"
                className="hidden md:block pointer-events-none select-none absolute -bottom-6 -left-6 w-24 h-24 object-contain opacity-85 animate-float-gentle z-20"
              />
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-12 items-center relative z-10">
                <div
                  className="order-2 lg:order-1 relative cursor-zoom-in rounded-2xl overflow-hidden border border-slate-200 bg-white p-1.5 shadow-xl"
                  onClick={() => setPreviewImage('/crm_imgs/CRM (11).jpg')}
                >
                  <div className="relative rounded-xl overflow-hidden bg-slate-100">
                    <img
                      src="/crm_imgs/CRM (11).jpg"
                      alt="Inventory Management"
                      loading="lazy"
                      decoding="async"
                      className="w-full h-auto object-cover group-hover:scale-105 transition-transform duration-700"
                    />
                    <div className="absolute inset-0 bg-slate-900/40 z-10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <div className="flex items-center gap-2 text-slate-900 font-bold text-sm bg-white/95 px-4 py-2 rounded-full shadow">
                        <Eye className="w-4 h-4 text-[#0284C7]" /> Phóng to
                      </div>
                    </div>
                  </div>
                </div>
                <div className="order-1 lg:order-2">
                  <div className="ql-eyebrow mb-5">
                    <Building2 className="w-3.5 h-3.5" /> Giỏ Hàng BĐS &amp; Kế Toán MISA
                  </div>
                  <h2 className="text-[20px] sm:text-3xl md:text-4xl font-black text-slate-900 mb-4 sm:mb-5 leading-[1.22]">
                    Giỏ Hàng Real-Time &amp; Đồng Bộ MISA
                  </h2>
                  <p className="text-slate-600 text-sm md:text-base mb-7 leading-relaxed">
                    Khóa căn giữ chỗ theo thời gian thực giữa các sàn F1 để triệt tiêu trùng cọc, tự sinh Phiếu Hợp Tác
                    Co-care 100% hoa hồng và đẩy hóa đơn điện tử thẳng sang kế toán MISA.
                  </p>
                  <div className="space-y-4">
                    <div className="p-4 rounded-2xl bg-slate-50/90 border border-slate-200/80">
                      <h3 className="font-bold text-slate-900 mb-1">Khóa Căn Tức Thì &amp; Phiếu Hợp Tác 100%</h3>
                      <p className="text-sm text-slate-600">
                        Cập nhật trạng thái Mở bán / Giữ chỗ / Đặt cọc real-time cho nội bộ lẫn Đại lý F1, minh bạch hoa hồng từng người hỗ trợ.
                      </p>
                    </div>
                    <div className="p-4 rounded-2xl bg-slate-50/90 border border-slate-200/80">
                      <h3 className="font-bold text-slate-900 mb-1">Đồng Bộ Hóa Đơn Điện Tử MISA &amp; VietQR</h3>
                      <p className="text-sm text-slate-600">
                        Webhook tự động map mã khách, mã số thuế, dòng tiền đặt cọc UNC/VietQR sang MISA và gạch nợ hai chiều tức thì.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </FadeIn>
          </div>

          {/* Gallery Section */}
          <div className="mb-20">
            <FadeIn className="text-center mb-10">
              <h2 className="text-[20px] sm:text-3xl md:text-4xl font-black text-slate-900 mb-3 leading-[1.22]">
                Mọi Chức Năng Hội Tụ <span className="text-gradient-inkica">Trên 1 Màn Hình</span>
              </h2>
              <p className="text-slate-600 max-w-2xl mx-auto">
                Click để xem chi tiết từng module được thiết kế với chuẩn UI/UX tối ưu cho khối lượng dữ liệu lớn.
              </p>
            </FadeIn>

            <div className="lg:hidden">
              <ResponsiveSlideDeck
                items={gallery}
                perPage={4}
                tabletPerPage={6}
                colsClass="grid-cols-2 gap-3"
                tabletColsClass="sm:grid-cols-3 gap-4"
                label="Bộ sưu tập CRM"
                accent="blue"
                renderItem={(img, idx) => (
                  <div
                    key={idx}
                    className="group relative rounded-2xl overflow-hidden border border-slate-200/90 aspect-video bg-white p-1 cursor-zoom-in shadow-sm"
                    onClick={() => setPreviewImage(img)}
                  >
                    <div className="relative w-full h-full rounded-xl overflow-hidden bg-slate-100">
                      <img
                        src={img}
                        alt={`CRM Screenshot ${idx + 1}`}
                        className="w-full h-full object-cover"
                        loading="lazy"
                        decoding="async"
                      />
                    </div>
                  </div>
                )}
              />
            </div>

            <div className="hidden lg:grid lg:grid-cols-4 gap-5">
              {gallery.map((img, idx) => (
                <FadeIn key={idx} delay={idx * 0.04}>
                  <div
                    className="group relative rounded-2xl overflow-hidden border border-slate-200/90 aspect-video bg-white p-1 cursor-zoom-in shadow-sm hover:shadow-lg transition-all"
                    onClick={() => setPreviewImage(img)}
                  >
                    <div className="relative w-full h-full rounded-xl overflow-hidden bg-slate-100">
                      <div className="absolute inset-0 flex items-center justify-center z-20 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900/35">
                        <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow">
                          <Eye className="w-5 h-5 text-[#1E40FF]" />
                        </div>
                      </div>
                      <img
                        src={img}
                        alt={`CRM Screenshot ${idx + 1}`}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                        loading="lazy"
                        decoding="async"
                      />
                    </div>
                  </div>
                </FadeIn>
              ))}
            </div>
          </div>

          {/* Pricing Section — Canonical DOMATION Suite */}
          <div className="max-w-7xl mx-auto mb-16" id="pricing">
            <FadeIn className="text-center mb-10">
              <h2 className="text-[20px] sm:text-3xl lg:text-4xl font-black text-slate-900 mb-3 leading-[1.22]">
                Bảng Giá <span className="text-gradient-inkica">CRM 360° &amp; Auto Data</span>
              </h2>
              <p className="text-slate-600 max-w-2xl mx-auto">
                Dùng thử miễn phí 30 ngày (0₫) • Giá theo gói doanh nghiệp minh bạch, nâng cấp liền mạch giữ nguyên 100% dữ liệu.
              </p>
            </FadeIn>

            <div className="flex items-center justify-center gap-4 mb-10">
              <span className={`text-sm font-bold transition-colors ${!isYearly ? 'text-slate-900' : 'text-slate-400'}`}>
                Theo Tháng
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
                  Theo Năm
                </span>
                <span className="bg-blue-50 text-[#1E40FF] text-[10px] font-bold px-2.5 py-0.5 rounded-full border border-blue-200">
                  TIẾT KIỆM 15%
                </span>
              </div>
            </div>

            <div className="xl:hidden">
              <ResponsiveSlideDeck
                items={DOMATION_SAAS_PLANS}
                mobilePerPage={1}
                mobileColsClass="grid-cols-1"
                tabletPerPage={2}
                tabletColsClass="grid-cols-2"
                gapClass="gap-4"
                ariaLabel="Bảng giá CRM 360"
                keyExtractor={(plan) => plan.name}
                renderItem={(plan) => {
                  const isCustom = plan.monthly === 'May Đo';
                  return (
                    <div
                      className={`h-full rounded-2xl border border-slate-200/85 bg-white p-5 sm:p-6 flex flex-col justify-between shadow-xs ${
                        plan.popular
                          ? 'bg-gradient-to-br from-[#0F172A] via-[#1E3A8A] to-[#0284C7] text-white'
                          : ''
                      }`}
                    >
                      <div>
                        <span
                          className={`inline-block text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full mb-3 ${
                            plan.popular ? 'bg-cyan-400/20 text-cyan-200' : 'bg-slate-100 text-[#1E40FF]'
                          }`}
                        >
                          {plan.badge}
                        </span>
                        <h3 className={`text-lg font-bold mb-1.5 ${plan.popular ? 'text-white' : 'text-slate-900'}`}>
                          {plan.name}
                        </h3>
                        <div className="mb-2.5 flex items-baseline gap-1.5">
                          <span className={`text-2xl font-black ${plan.popular ? 'text-white' : 'text-slate-900'}`}>
                            {isYearly ? plan.yearly : plan.monthly}
                          </span>
                          {!isCustom && (
                            <span className={`text-xs ${plan.popular ? 'text-blue-200' : 'text-slate-500'}`}>
                              {isYearly ? '/năm' : '/tháng'}
                            </span>
                          )}
                        </div>
                        <p className={`text-xs mb-4 ${plan.popular ? 'text-blue-100' : 'text-slate-600'}`}>
                          {plan.desc}
                        </p>
                        <ul className="space-y-2.5 mb-6">
                          {plan.features.map((item) => (
                            <li
                              key={item}
                              className={`flex items-start gap-2 text-xs ${
                                plan.popular ? 'text-blue-50' : 'text-slate-700'
                              }`}
                            >
                              <Check className={`w-3.5 h-3.5 shrink-0 mt-0.5 ${plan.popular ? 'text-cyan-300' : 'text-[#1E40FF]'}`} />
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                      {isCustom ? (
                        <a
                          href={SPECIALIST_ZALO_URL}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="min-h-[44px] w-full py-3 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 whitespace-nowrap bg-[#0068FF] hover:bg-[#0057D9] text-white shadow-sm transition-colors"
                        >
                          <span>Chat Zalo Setup Custom →</span>
                        </a>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setShowModal(true)}
                          className={`min-h-[44px] w-full py-3 rounded-xl font-bold text-xs cursor-pointer transition-colors whitespace-nowrap ${
                            plan.popular
                              ? 'bg-white text-[#1E40FF] hover:bg-blue-50 shadow-md'
                              : 'ql-btn-outline'
                          }`}
                        >
                          {`Chọn Gói ${plan.name}`}
                        </button>
                      )}
                    </div>
                  );
                }}
              />
            </div>

            <div className="hidden xl:grid rounded-[28px] overflow-hidden border border-slate-200/85 bg-white/90 backdrop-blur-xl shadow-xs xl:grid-cols-4 divide-x divide-slate-200/75">
              {DOMATION_SAAS_PLANS.map((plan, idx) => {
                const isCustom = plan.monthly === 'May Đo';
                return (
                  <div
                    key={plan.name}
                    className={`p-6 sm:p-7 flex flex-col justify-between ${
                      idx >= 2 ? 'md:border-t md:border-slate-200/75 xl:border-t-0' : ''
                    } ${
                      plan.popular
                        ? 'bg-gradient-to-br from-[#0F172A] via-[#1E3A8A] to-[#0284C7] text-white'
                        : ''
                    }`}
                  >
                    <div>
                      <span
                        className={`inline-block text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full mb-4 ${
                          plan.popular ? 'bg-cyan-400/20 text-cyan-200' : 'bg-slate-100 text-[#1E40FF]'
                        }`}
                      >
                        {plan.badge}
                      </span>
                      <h3 className={`text-lg font-bold mb-2 ${plan.popular ? 'text-white' : 'text-slate-900'}`}>
                        {plan.name}
                      </h3>
                      <div className="mb-3 flex items-baseline gap-1.5">
                        <span className={`text-2xl sm:text-3xl font-black ${plan.popular ? 'text-white' : 'text-slate-900'}`}>
                          {isYearly ? plan.yearly : plan.monthly}
                        </span>
                        {!isCustom && (
                          <span className={`text-xs ${plan.popular ? 'text-blue-200' : 'text-slate-500'}`}>
                            {isYearly ? '/năm' : '/tháng'}
                          </span>
                        )}
                      </div>
                      <p className={`text-xs sm:text-sm mb-5 ${plan.popular ? 'text-blue-100' : 'text-slate-600'}`}>
                        {plan.desc}
                      </p>
                      <ul className="space-y-3 mb-7">
                        {plan.features.map((item) => (
                          <li
                            key={item}
                            className={`flex items-start gap-2.5 text-xs sm:text-sm ${
                              plan.popular ? 'text-blue-50' : 'text-slate-700'
                            }`}
                          >
                            <Check className={`w-4 h-4 shrink-0 mt-0.5 ${plan.popular ? 'text-cyan-300' : 'text-[#1E40FF]'}`} />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    {isCustom ? (
                      <a
                        href={SPECIALIST_ZALO_URL}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="min-h-[44px] w-full py-3 px-4 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 whitespace-nowrap bg-[#0068FF] hover:bg-[#0057D9] text-white shadow-sm transition-colors"
                      >
                        <span>Chuyên Viên Tạo (Zalo)</span>
                      </a>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setShowModal(true)}
                        className={`min-h-[44px] w-full py-3 rounded-xl font-bold text-xs sm:text-sm cursor-pointer transition-colors ${
                          plan.popular
                            ? 'bg-white text-[#1E40FF] hover:bg-blue-50 shadow-lg'
                            : 'ql-btn-outline'
                        }`}
                      >
                        {`Chọn Gói ${plan.name}`}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <FounderAuthorityBlock
          variant="subtle"
          onOpenContact={() => setShowModal(true)}
          contextNote="DOMATION CRM 360° & Pipeline 9 nấc MISA được kiến trúc từ A–Z bởi Huỳnh Trọng Phúc (TurnioDEV) — Founder & CEO DOMATION."
        />
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200/80 py-10 px-6 bg-white/80 backdrop-blur-md relative z-10 text-center pb-24 sm:pb-12">
        <div className="flex items-center justify-center gap-2.5 mb-3">
          <DomationLogoMark size={30} />
          <span className="text-base font-black tracking-wider text-slate-900 uppercase">DOMATION CRM</span>
        </div>
        <p className="text-slate-500 text-xs font-medium">
          © {new Date().getFullYear()} DOMATION.NET • Nền tảng số hóa doanh nghiệp toàn diện.
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

      {/* Centered Blue Back to Top Pill */}
      <BackToTopPill />

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
                    <h3 className="text-2xl font-black text-slate-900 mb-1">Đăng Ký Tư Vấn CRM</h3>
                    <p className="text-slate-500 text-sm">Điền thông tin để trải nghiệm giải pháp số hóa toàn diện.</p>
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
                    <p className="text-slate-600">Chuyên viên tư vấn DOMATION sẽ liên hệ với bạn trong vòng 2h.</p>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                          Họ và tên <span className="text-rose-500">*</span>
                        </label>
                        <input
                          required
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#1E40FF] focus:bg-white transition-all"
                          placeholder="Nguyễn Văn A"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                          Số điện thoại
                        </label>
                        <input
                          type="tel"
                          value={formData.phone}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#1E40FF] focus:bg-white transition-all"
                          placeholder="09xx xxx xxx"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                          Email doanh nghiệp <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="email"
                          required
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#1E40FF] focus:bg-white transition-all"
                          placeholder="example@business.com"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                          Tên doanh nghiệp
                        </label>
                        <input
                          value={formData.company}
                          onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#1E40FF] focus:bg-white transition-all"
                          placeholder="Tên công ty của bạn..."
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                          Quy mô nhân sự
                        </label>
                        <select
                          value={formData.size}
                          onChange={(e) => setFormData({ ...formData, size: e.target.value })}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 focus:outline-none focus:border-[#1E40FF] focus:bg-white transition-all"
                        >
                          <option value="1-10">Dưới 10 nhân sự</option>
                          <option value="11-50">Từ 11 - 50 nhân sự</option>
                          <option value="51-200">Từ 51 - 200 nhân sự</option>
                          <option value="200+">Trên 200 nhân sự</option>
                        </select>
                      </div>
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
                          Nhận Báo Giá
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
              <img src={previewImage} alt="Preview" loading="lazy" decoding="async" className="w-full h-full max-h-[85vh] object-contain rounded-xl" />
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <ContactModal isOpen={showContactModal} onClose={() => setShowContactModal(false)} />
    </div>
  );
};
