import React, { useEffect, useRef, useState } from 'react';
import { motion, useAnimation, useInView, AnimatePresence } from 'framer-motion';
import {
  BarChart3,
  Check,
  ArrowRight,
  Target,
  Send,
  X,
  Eye,
  Box,
  Calendar,
  LifeBuoy,
  Package,
  Users2,
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

export const CrmLanding: React.FC = () => {
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
      title: 'Pipeline Bán Hàng',
      desc: 'Theo dõi mọi Deal từ lúc tiếp cận đến khi chốt đơn thành công với giao diện Kanban.',
      icon: Target,
      accent: 'from-[#1E40FF] to-[#0284C7]',
    },
    {
      title: 'Khách Hàng 360°',
      desc: 'Lưu trữ toàn bộ lịch sử tương tác, báo giá, hóa đơn của từng Contact & Company.',
      icon: Users2,
      accent: 'from-[#0284C7] to-[#06B6D4]',
    },
    {
      title: 'Quản Lý Kho Thông Minh',
      desc: 'Theo dõi số lượng tồn kho, biến động sản phẩm và quản lý nhà cung cấp chặt chẽ.',
      icon: Package,
      accent: 'from-blue-600 to-cyan-500',
    },
    {
      title: 'Nhắc Việc & Lịch Trình',
      desc: 'Không bỏ lỡ bất kỳ hoạt động nào với hệ thống Calendar và nhắc nhở Activities.',
      icon: Calendar,
      accent: 'from-emerald-500 to-teal-600',
    },
    {
      title: 'Báo Cáo Trực Quan',
      desc: 'Dashboard thời gian thực tổng hợp doanh thu, tiến độ nhân sự và hiệu suất kinh doanh.',
      icon: BarChart3,
      accent: 'from-[#1E40FF] to-[#06B6D4]',
    },
    {
      title: 'Hỗ Trợ Tickets',
      desc: 'Tiếp nhận và xử lý sự cố khách hàng nhanh chóng, phân luồng theo mức độ ưu tiên.',
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
              ENTERPRISE CRM &amp; MISA SYNC
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 22 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tight text-slate-900 mb-6 leading-[1.12]"
            >
              Hệ Thống Quản Trị{' '}
              <span className="text-gradient-inkica">Doanh Nghiệp 4.0</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-slate-600 text-sm md:text-lg max-w-3xl mx-auto leading-relaxed mb-9 font-medium"
            >
              Số hóa toàn diện quy trình làm việc. Từ Sales Pipeline 8 nấc, quản lý khách hàng (CRM), tồn kho (Inventory)
              đến đồng bộ hóa đơn MISA &amp; Ticket hỗ trợ trên một nền tảng duy nhất.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-4 flex-wrap mb-14"
            >
              <a
                href="https://crm-domation.vercel.app/"
                target="_blank"
                rel="noreferrer"
                className="btn-inkica-primary w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-4 rounded-full text-sm md:text-base font-bold"
              >
                Trải nghiệm ngay <ArrowRight className="w-4 h-4" />
              </a>
              <button
                type="button"
                onClick={() => setShowModal(true)}
                className="ql-btn-outline w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-4 rounded-full text-sm md:text-base font-bold cursor-pointer"
              >
                Xem báo giá chi tiết
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
                  className="w-full h-auto group-hover:scale-[1.02] transition-transform duration-700"
                />
              </div>
            </motion.div>
          </div>

          {/* Features Grid */}
          <div className="mb-20 md:mb-24">
            <FadeIn className="text-center mb-12">
              <div className="ql-eyebrow mb-4">Module Linh Hoạt</div>
              <h2 className="text-3xl md:text-4xl font-black text-slate-900 mb-3">
                Giải Pháp Quản Trị <span className="text-gradient-inkica">Đa Điểm Chạm</span>
              </h2>
              <p className="text-slate-600 max-w-2xl mx-auto">
                Tất cả những gì bạn cần để số hóa quy trình kinh doanh, không còn phải dùng rải rác nhiều phần mềm.
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

          {/* Deep Dive 1: Sales & Pipeline */}
          <div className="mb-20">
            <div className="inkica-glass-card p-7 md:p-12 relative overflow-hidden">
              <img
                src={DECOR_PNGS.funnel}
                alt=""
                aria-hidden="true"
                className="hidden md:block pointer-events-none select-none absolute -top-6 -right-6 w-24 h-24 object-contain opacity-85 animate-float-decor z-20"
              />
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-12 items-center relative z-10">
                <div>
                  <div className="ql-eyebrow mb-5">
                    <Target className="w-3.5 h-3.5" /> Quản Lý Doanh Số Tối Đa
                  </div>
                  <h2 className="text-2xl md:text-4xl font-black text-slate-900 mb-5 leading-tight">
                    Tăng Tỷ Lệ Chốt Sale Với Kanban Pipeline
                  </h2>
                  <p className="text-slate-600 text-sm md:text-base mb-7 leading-relaxed">
                    Theo dõi hàng trăm thương vụ (Deals) cùng lúc mà không bị sót. Giao diện trực quan kéo thả giúp
                    Sales Manager nắm bắt dòng tiền dự kiến ngay tức thì.
                  </p>
                  <ul className="space-y-3.5">
                    {[
                      'Tự động tạo báo giá (Quotes) & hóa đơn MISA chuyên nghiệp trong 2 click',
                      'Kết nối trực tiếp Contact và Company vào mỗi Deal',
                      'Nhắc nhở tự động khi có Deal đến hạn (Deadlines)',
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
                    <Box className="w-3.5 h-3.5" /> Quản Lý Kho Tiên Tiến
                  </div>
                  <h2 className="text-2xl md:text-4xl font-black text-slate-900 mb-5 leading-tight">
                    Kiểm Soát Tồn Kho Theo Thời Gian Thực
                  </h2>
                  <p className="text-slate-600 text-sm md:text-base mb-7 leading-relaxed">
                    Hệ thống quản lý sản phẩm (Products), tồn kho (Inventory) kết nối đồng bộ với đơn hàng (Invoices).
                    Tránh tình trạng hụt hàng hoặc thất thoát không đáng có.
                  </p>
                  <div className="space-y-4">
                    <div className="p-4 rounded-2xl bg-slate-50/90 border border-slate-200/80">
                      <h4 className="font-bold text-slate-900 mb-1">Kiểm Kê Sản Phẩm Tự Động</h4>
                      <p className="text-sm text-slate-600">
                        Tự động trừ kho khi xuất Invoice. Có hệ thống định mức tối thiểu cảnh báo cần nhập hàng từ Suppliers.
                      </p>
                    </div>
                    <div className="p-4 rounded-2xl bg-slate-50/90 border border-slate-200/80">
                      <h4 className="font-bold text-slate-900 mb-1">Theo Dõi Thu Chi (Expenses)</h4>
                      <p className="text-sm text-slate-600">
                        Ghi nhận mọi khoản chi phí công ty, giúp tính toán Profit Margin chuẩn xác tới từng đồng.
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
              <h2 className="text-3xl md:text-4xl font-black text-slate-900 mb-3">
                Mọi Chức Năng Hội Tụ <span className="text-gradient-inkica">Trên Một Màn Hình</span>
              </h2>
              <p className="text-slate-600 max-w-2xl mx-auto">
                Click để xem chi tiết từng module được thiết kế với chuẩn UI/UX tối ưu cho khối lượng dữ liệu lớn.
              </p>
            </FadeIn>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-5">
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
                      />
                    </div>
                  </div>
                </FadeIn>
              ))}
            </div>
          </div>

          {/* Pricing Section */}
          <div className="max-w-5xl mx-auto mb-16" id="pricing">
            <FadeIn className="text-center mb-10">
              <h2 className="text-3xl md:text-4xl font-black text-slate-900 mb-3">
                Bảng Báo Giá <span className="text-gradient-inkica">DOMATION CRM</span>
              </h2>
              <p className="text-slate-600 max-w-2xl mx-auto">
                Chọn giải pháp phù hợp với quy mô doanh nghiệp của bạn. Không giới hạn tính năng cơ bản, chỉ tính phí
                dựa trên số người dùng (Users).
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
                  ƯU ĐÃI 20%
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Starter */}
              <FadeIn delay={0.08}>
                <div className="inkica-glass-card p-8 h-full flex flex-col">
                  <h3 className="text-xl font-bold text-slate-900 mb-2">Starter</h3>
                  <p className="text-slate-600 text-sm mb-6">Phù hợp đội nhóm kinh doanh nhỏ dưới 5 người.</p>
                  <div className="mb-6">
                    <span className="text-4xl font-black text-slate-900">{isYearly ? '250K' : '300K'}</span>
                    <span className="text-slate-500 text-sm">/user/tháng</span>
                  </div>
                  <ul className="space-y-3.5 mb-8 flex-1">
                    {[
                      'Quản lý Khách hàng & Công ty',
                      'Sales Pipeline & Kanban',
                      'Calendar & Nhắc việc',
                      'Báo cáo doanh thu cơ bản',
                      'Hỗ trợ giờ hành chính',
                    ].map((item, i) => (
                      <li key={i} className="flex items-start gap-3 text-sm text-slate-700">
                        <Check className="w-4 h-4 text-[#1E40FF] shrink-0 mt-0.5" /> {item}
                      </li>
                    ))}
                  </ul>
                  <button
                    type="button"
                    onClick={() => setShowModal(true)}
                    className="ql-btn-outline w-full py-3 rounded-xl font-bold cursor-pointer"
                  >
                    Bắt đầu ngay
                  </button>
                </div>
              </FadeIn>

              {/* Professional */}
              <FadeIn delay={0.16} className="relative">
                <div className="relative rounded-[24px] p-8 bg-gradient-to-br from-[#0F172A] via-[#1E3A8A] to-[#0284C7] text-white h-full flex flex-col shadow-[0_24px_60px_-12px_rgba(30,64,255,0.4)]">
                  <div className="absolute top-0 right-0 bg-[#06B6D4] text-white text-[10px] font-bold px-3.5 py-1 rounded-bl-xl rounded-tr-[23px] uppercase tracking-wider">
                    Phổ biến nhất
                  </div>
                  <h3 className="text-xl font-bold text-cyan-300 mb-2">Professional</h3>
                  <p className="text-blue-100 text-sm mb-6">Cho doanh nghiệp SMB cần vận hành chuyên sâu.</p>
                  <div className="mb-6">
                    <span className="text-4xl font-black text-white">{isYearly ? '450K' : '550K'}</span>
                    <span className="text-blue-200 text-sm">/user/tháng</span>
                  </div>
                  <ul className="space-y-3.5 mb-8 flex-1">
                    {[
                      'Mọi tính năng của Starter',
                      'Quản lý Sản phẩm & Tồn kho',
                      'Tạo Báo giá (Quotes) & Hóa đơn MISA',
                      'Quản lý Support Tickets',
                      'Dashboard phân tích chi tiết',
                      'Phân quyền Role đa cấp độ',
                    ].map((item, i) => (
                      <li key={i} className="flex items-start gap-3 text-sm text-blue-50">
                        <Check className="w-4 h-4 text-cyan-300 shrink-0 mt-0.5" /> {item}
                      </li>
                    ))}
                  </ul>
                  <button
                    type="button"
                    onClick={() => setShowModal(true)}
                    className="w-full py-3.5 rounded-xl bg-white text-[#1E40FF] font-black hover:bg-blue-50 transition-colors shadow-lg cursor-pointer"
                  >
                    Đăng ký Professional
                  </button>
                </div>
              </FadeIn>

              {/* Enterprise */}
              <FadeIn delay={0.24}>
                <div className="inkica-glass-card p-8 h-full flex flex-col">
                  <h3 className="text-xl font-bold text-slate-900 mb-2">Enterprise</h3>
                  <p className="text-slate-600 text-sm mb-6">Giải pháp tùy chỉnh riêng cho tập đoàn lớn.</p>
                  <div className="mb-6">
                    <span className="text-3xl font-black text-slate-900">Liên hệ</span>
                  </div>
                  <ul className="space-y-3.5 mb-8 flex-1">
                    {[
                      'Triển khai trên Private Server',
                      'Tính năng code theo yêu cầu',
                      'Tích hợp API phần mềm thứ 3',
                      'Tự động hóa luồng phức tạp',
                      'Account Manager hỗ trợ 1-1',
                      'Bảo mật SLA cấp cao',
                    ].map((item, i) => (
                      <li key={i} className="flex items-start gap-3 text-sm text-slate-700">
                        <Check className="w-4 h-4 text-[#0284C7] shrink-0 mt-0.5" /> {item}
                      </li>
                    ))}
                  </ul>
                  <button
                    type="button"
                    onClick={() => setShowModal(true)}
                    className="ql-btn-outline w-full py-3 rounded-xl font-bold cursor-pointer"
                  >
                    Nhận tư vấn riêng
                  </button>
                </div>
              </FadeIn>
            </div>
          </div>
        </div>
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
              <img src={previewImage} alt="Preview" className="w-full h-full max-h-[85vh] object-contain rounded-xl" />
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <ContactModal isOpen={showContactModal} onClose={() => setShowContactModal(false)} />
    </div>
  );
};
