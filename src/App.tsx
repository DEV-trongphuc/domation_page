import React, { useEffect, useRef, useState } from 'react';
import { motion, useAnimation, useInView, AnimatePresence } from 'framer-motion';
import {
    Bot, Zap, Mail, MessageSquare, BarChart3,
    ArrowRight, ArrowUp, Workflow, Users, ShieldCheck,
    Cpu, Activity, Layers, Sparkles, Check,
    Globe, Star,
    Play, Target, Database,
    Lock, Rocket, Pointer, ScanLine, LayoutTemplate, BoxSelect, Settings2, FileText, Ticket, Code2,
    ClipboardList, GanttChart, EyeOff, Monitor
} from 'lucide-react';
import { ContactModal } from './ContactModal';
import { Navbar } from './Navbar';
import { LuxuryGoldBackdrop } from './LuxuryGoldBackdrop';
import { DomationLogoMark } from './components/DomationLogoMark';
import { DOMATION_SAAS_PLANS } from './data/enterpriseData';
import { handleSpaLinkClick } from './utils/navigation';
import { getAutomationSeoConfig } from './data/coreRouteSeo';
import { usePageSeo } from './utils/seo';

// ─── Constants ────────────────────────────────────────────────
const LOGOS = {
    zalo: '/assets/brands/zalobot-logo.webp',
    meta: '/assets/brands/meta-icon.svg',
    aws_ses: '/assets/brands/aws-ses.svg'
};

// ─── Helpers ───────────────────────────────────────────────────
// Detect mobile once at module level to avoid repeated checks
const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

const FadeIn = ({ children, delay = 0, className = '', from = 'bottom' }: {
    children: React.ReactNode; delay?: number; className?: string; from?: 'bottom' | 'left' | 'right';
}) => {
    const controls = useAnimation();
    const ref = useRef(null);
    const inView = useInView(ref, { once: true, margin: '-40px' });
    // On mobile: always use simple Y fade to avoid jitter from X translations
    const initial = isMobile
        ? { opacity: 0, y: 20 }
        : from === 'left' ? { opacity: 0, x: -40 } : from === 'right' ? { opacity: 0, x: 40 } : { opacity: 0, y: 30 };

    useEffect(() => {
        if (!inView) return;
        const target = isMobile
            ? { opacity: 1, y: 0 }
            : from === 'left' || from === 'right' ? { opacity: 1, x: 0 } : { opacity: 1, y: 0 };
        controls.start(target);
    }, [controls, inView, from]);

    return (
        <motion.div ref={ref} animate={controls} initial={initial}
            transition={{ duration: isMobile ? 0.45 : 0.7, delay: isMobile ? delay * 0.5 : delay, ease: [0.22, 1, 0.36, 1] }}
            className={className}
            style={{ willChange: 'opacity, transform' }}>
            {children}
        </motion.div>
    );
};

// Animated counter
const Counter = ({ to, suffix = '', prefix = '' }: { to: number; suffix?: string; prefix?: string }) => {
    const [count, setCount] = useState(0);
    const ref = useRef(null);
    const inView = useInView(ref, { once: true });
    useEffect(() => {
        if (!inView) return;
        let start = 0;
        const step = Math.ceil(to / 60);
        const timer = setInterval(() => {
            start += step;
            if (start >= to) { setCount(to); clearInterval(timer); }
            else setCount(start);
        }, 16);
        return () => clearInterval(timer);
    }, [inView, to]);
    return <span ref={ref}>{prefix}{count.toLocaleString()}{suffix}</span>;
};

const TESTIMONIALS = [
    {
        name: 'Capital House • EcoLife Signature',
        role: 'Chủ đầu tư BĐS Xanh • Đà Nẵng',
        text: 'Hợp nhất Sa bàn 3D WebGL, AI Sales Portal 24/7 và hệ thống Auto Chia Data về 3 Đại lý F1 tức thì với tỷ lệ 1:1:1 độ lệch gần ~0%.',
        avatar: 'CH',
    },
    {
        name: 'Viện Đào Tạo IDEAS Business',
        role: 'Giáo dục Sau Đại Học & MBA',
        text: 'Thay thế 14 file Excel rời rạc bằng Automation nuôi dưỡng phễu tuyển sinh, Meta Ads BI và ERP 5.0 — tăng 300% quy mô lớp MBA và giảm 30% CPA.',
        avatar: 'ID',
    },
    {
        name: 'Hệ Thống Phúc Lộc Thọ',
        role: 'Chuỗi F&B & Nhượng Quyền 30+ Cửa Hàng',
        text: 'Đồng bộ POS cửa hàng với Zalo ZNS, Voucher Hub và phễu CRM nhượng quyền tự động: đạt ROAS 5+ và thu về 1.600+ đối tác tiềm năng.',
        avatar: 'PLT',
    },
];

const TestimonialSection = () => {
    const [activeTestimonial, setActiveTestimonial] = useState(0);
    const testimonials = TESTIMONIALS;

    useEffect(() => {
        const t = setInterval(() => setActiveTestimonial(p => (p + 1) % TESTIMONIALS.length), 5000);
        return () => clearInterval(t);
    }, []);

    return (
        <section className="py-24 px-6 relative z-10 border-t border-slate-200/70">
            <div className="max-w-4xl mx-auto">
                <FadeIn className="text-center mb-16">
                    <div className="flex items-center justify-center gap-1 mb-4">
                        {[...Array(5)].map((_, i) => <Star key={i} className="w-5 h-5 fill-[#1E40FF] text-[#1E40FF]" />)}
                    </div>
                    <h2 className="text-3xl md:text-4xl font-black text-slate-900 mb-4">Khách Hàng Nói Gì?</h2>
                    <p className="text-slate-600">Hàng trăm doanh nghiệp đang tăng trưởng cùng nền tảng của chúng tôi</p>
                </FadeIn>

                <div className="relative min-h-[240px]">
                    <AnimatePresence mode="wait">
                        <motion.div key={activeTestimonial}
                            initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                            transition={{ duration: 0.4 }}
                            className="inkica-glass-card border border-white/90 rounded-3xl p-10 text-center shadow-[0_18px_50px_rgba(30,64,255,0.08)]">
                            <p className="text-lg text-slate-800 mb-8 leading-relaxed max-w-2xl mx-auto font-medium">
                                "{testimonials[activeTestimonial].text}"
                            </p>
                            <div className="flex items-center justify-center gap-4">
                                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#1E40FF] to-[#06B6D4] flex items-center justify-center text-white font-black text-sm shadow-md">
                                    {testimonials[activeTestimonial].avatar}
                                </div>
                                <div className="text-left">
                                    <p className="font-bold text-slate-900">{testimonials[activeTestimonial].name}</p>
                                    <p className="text-sm text-slate-500">{testimonials[activeTestimonial].role}</p>
                                </div>
                            </div>
                        </motion.div>
                    </AnimatePresence>
                </div>

                <div className="flex justify-center gap-2 mt-8">
                    {testimonials.map((_, i) => (
                        <button key={i} onClick={() => setActiveTestimonial(i)}
                            className={`rounded-full transition-all duration-300 ${i === activeTestimonial ? 'w-8 h-2 bg-[#1E40FF]' : 'w-2 h-2 bg-slate-300 hover:bg-slate-400'}`} />
                    ))}
                </div>
            </div>
        </section>
    );
};

const WebDesignSection = () => {
    const projects = [
        { name: 'Nava Store', desc: 'E-commerce Website, giao diện hiện đại tối ưu mua hàng.', link: 'https://navastore.vn/', preview: '/landingpage_avatar/nava.webp', badge: 'E-Commerce' },
        { name: 'Viện IDEAS MBA', desc: 'Landing Page giáo dục, tuyển sinh khóa học MBA.', link: 'https://ideas.edu.vn/mba', preview: '/landingpage_avatar/ideasmba.webp', badge: 'Education MBA' },
        { name: 'Turnio Portfolio', desc: 'Creative Agency / Portfolio kiến trúc hệ thống cao cấp.', link: '/portfolio', preview: '/landingpage_avatar/portfolio.webp', badge: 'Portfolio' },
    ];

    return (
        <section id="other-services" className="py-24 px-6 relative z-10 border-t border-slate-200/70 bg-white/45 backdrop-blur-sm">
            <div className="max-w-7xl mx-auto">
                <FadeIn className="text-center mb-16">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 border border-blue-200 text-[#1E40FF] text-xs font-bold uppercase tracking-widest mb-4">
                        <Monitor className="w-3.5 h-3.5" /> Dịch Vụ Mở Rộng
                    </div>
                    <h2 className="text-3xl md:text-5xl font-black text-slate-900 mb-4">
                        Thiết Kế <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#1E40FF] to-[#06B6D4]">Website &amp; Landing Page</span>
                    </h2>
                    <p className="text-slate-600 max-w-2xl mx-auto text-base md:text-lg mb-6">
                        Không chỉ cung cấp nền tảng Automation, DOMATION còn mang đến giải pháp xây dựng hình ảnh thương hiệu trực tuyến với thiết kế hiện đại, chuẩn SEO và tỷ lệ chuyển đổi cao.
                    </p>
                    <div className="flex flex-wrap items-center justify-center gap-3">
                        <a
                            href="/portfolio"
                            onClick={(e) => handleSpaLinkClick(e, '/portfolio')}
                            className="ql-btn-outline min-h-[44px] px-4 py-2 text-xs"
                        >
                            Xem Toàn Bộ Portfolio
                        </a>
                        <a
                            href="/boost"
                            onClick={(e) => handleSpaLinkClick(e, '/boost')}
                            className="ql-btn-outline min-h-[44px] px-4 py-2 text-xs"
                        >
                            Đọc 74+ Bài Blog Chuyên Sâu
                        </a>
                    </div>
                </FadeIn>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
                    {projects.map((p, i) => (
                        <FadeIn key={i} delay={i * 0.1} className="h-full">
                            <a
                                href={p.link}
                                target={p.link.startsWith('/') ? undefined : '_blank'}
                                rel={p.link.startsWith('/') ? undefined : 'noreferrer'}
                                onClick={p.link.startsWith('/') ? (e) => handleSpaLinkClick(e, p.link) : undefined}
                                className="group block inkica-glass-card rounded-2xl overflow-hidden transition-all border border-white/90 hover:border-blue-300 hover:-translate-y-2 h-full shadow-[0_14px_36px_rgba(30,64,255,0.08)] hover:shadow-[0_22px_50px_rgba(30,64,255,0.16)]"
                            >
                                <div className="relative p-6 flex flex-col h-full">
                                    <div className="w-full h-44 rounded-xl mb-6 overflow-hidden relative border border-slate-200 bg-slate-100 shadow-sm">
                                        <img
                                            src={p.preview}
                                            alt={`${p.name} - Thiết kế Website DOMATION`}
                                            loading="lazy"
                                            className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-500"
                                        />
                                        <span className="absolute top-2.5 left-2.5 px-2.5 py-0.5 rounded-full bg-white/95 border border-slate-200 text-[10px] font-bold text-[#1E40FF]">
                                            {p.badge}
                                        </span>
                                    </div>
                                    <h3 className="text-xl font-bold text-slate-900 mb-2 group-hover:text-[#1E40FF] transition-colors">{p.name}</h3>
                                    <p className="text-sm text-slate-600 mb-6 flex-1">{p.desc}</p>
                                    <div className="mt-auto flex items-center justify-between text-xs text-slate-500 group-hover:text-[#1E40FF] transition-colors font-semibold">
                                        <span className="inline-flex items-center">
                                            <Globe className="w-3.5 h-3.5 mr-1.5" />
                                            {p.link.replace('https://', '')}
                                        </span>
                                        <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                                    </div>
                                </div>
                            </a>
                        </FadeIn>
                    ))}
                </div>
            </div>
        </section>
    );
};

const MetaAdReportFeatureSection = () => {
    return (
        <section id="meta-ad-report-feature" className="py-24 px-6 relative z-10 border-t border-slate-200/70">
            <div className="max-w-7xl mx-auto">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                    <FadeIn>
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 border border-blue-200 text-[#1E40FF] text-xs font-bold uppercase tracking-widest mb-6">
                            <Activity className="w-3.5 h-3.5" /> Sản Phẩm Mới
                        </div>
                        <h2 className="text-4xl md:text-5xl font-black text-slate-900 mb-6 leading-tight">
                            Hệ Thống Báo Cáo <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#1E40FF] to-[#06B6D4]">Hiệu Suất Meta Ads</span>
                        </h2>
                        <p className="text-slate-600 text-lg mb-8 leading-relaxed">
                            Nền tảng báo cáo real-time độc lập, phân tích dữ liệu chuyên sâu bằng AI. Khám phá Khung Giờ Vàng chốt sale, theo dõi Admin Log chi tiết và tối ưu chiến dịch quảng cáo chưa từng có.
                        </p>
                        <a
                            href="/meta-report"
                            onClick={(e) => handleSpaLinkClick(e, '/meta-report')}
                            className="inline-flex items-center gap-2 min-h-[44px] px-8 py-4 rounded-full btn-inkica-primary text-white font-bold transition-all shadow-[0_12px_30px_rgba(30,64,255,0.28)] hover:-translate-y-1"
                        >
                            Khám Phá Ngay <ArrowRight className="w-5 h-5" />
                        </a>
                    </FadeIn>
                    <FadeIn delay={0.2}>
                        <div className="relative w-full aspect-video rounded-2xl overflow-hidden shadow-[0_24px_60px_rgba(15,23,42,0.14)] border border-slate-200 bg-slate-900 group">
                            <iframe 
                                width="100%" 
                                height="100%" 
                                src="https://www.youtube.com/embed/fvIHSrpsAlI?autoplay=0&mute=1" 
                                title="Hướng dẫn hệ thống Meta Ad Report" 
                                frameBorder="0" 
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
                                allowFullScreen
                                className="relative z-10 w-full h-full rounded-2xl"
                            ></iframe>
                        </div>
                    </FadeIn>
                </div>
            </div>
        </section>
    );
};

const DomationDataSection = () => {
    return (
        <section id="domation-data" className="py-20 px-6 relative z-10 border-t border-slate-200/70 bg-white/45 backdrop-blur-sm">
            <div className="max-w-7xl mx-auto flex flex-col-reverse lg:flex-row items-center gap-12 lg:gap-20">
                <div className="w-full lg:w-1/2">
                    <FadeIn delay={0.2} from="left">
                        <div className="rounded-3xl border border-slate-200 bg-white p-2.5 shadow-[0_20px_54px_rgba(30,64,255,0.12)] space-y-3">
                            <img
                                loading="lazy"
                                decoding="async"
                                src="/imgs/autodata/showcase/screen_dashboard.jpg"
                                alt="DOMATION Auto Data Dashboard"
                                className="w-full rounded-2xl object-cover"
                            />
                            <div className="flex items-center justify-between gap-3 px-3 py-2.5 rounded-2xl bg-[#F4F8FF] border border-blue-100">
                                <div className="flex items-center gap-2.5">
                                    <div className="w-7 h-7 rounded-full bg-white flex items-center justify-center border border-blue-200 shrink-0">
                                        <img src={LOGOS.zalo} className="w-4 h-4" alt="Zalo" />
                                    </div>
                                    <div className="text-xs text-slate-700">
                                        <span className="font-bold text-[#1E40FF]">ZaloBot Tức Thì:</span> Chia vòng công bằng &amp; lọc trùng 180 ngày
                                    </div>
                                </div>
                                <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shrink-0" />
                            </div>
                        </div>
                    </FadeIn>
                </div>

                <div className="w-full lg:w-1/2 z-20">
                    <FadeIn from="right">
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 border border-blue-200 text-[#1E40FF] text-xs font-bold uppercase tracking-widest mb-6">
                            <Database className="w-3.5 h-3.5" /> DOMATION AUTO DATA
                        </div>
                        <h2 className="text-3xl md:text-5xl font-black text-slate-900 mb-6 leading-tight">
                            Hệ Thống Phân Bổ <br />
                            <span className="text-gradient-inkica">Data Tự Động Tức Thì</span>
                        </h2>
                        <p className="text-slate-600 text-base md:text-lg mb-7 leading-relaxed">
                            <strong className="text-[#1E40FF] font-semibold block mb-2">Chấm dứt tình trạng Data bị sót hoặc Sale nhận số chậm làm nguội khách hàng.</strong>
                            Thu lead đa kênh tức thì, AI chấm điểm, lọc trùng 180 ngày (6 tháng), báo ZaloBot cá nhân &amp; bắn ngược Meta CAPI SHA-256.
                        </p>

                        <div className="space-y-3 mb-8">
                            {[
                                { t: 'Tích Hợp Realtime Tức Thì', d: 'Đồng bộ Meta Lead Ads, TikTok, LadiPage, Google Sheets & Website ngay lập tức.' },
                                { t: 'Van SLA 120s & Bù Lỗi 1:1', d: 'Quá 120s chưa nhận tự chuyển vòng; duyệt ticket số sai tự cộng bù +1 lượt.' },
                                { t: 'Bắn Ngược Meta CAPI SHA-256', d: 'Đồng bộ 9 trạng thái từ Qualified đến Closed & DisqualifiedLead về Meta Ads.' },
                            ].map((box) => (
                                <div key={box.t} className="flex gap-3.5 p-3.5 rounded-xl bg-white/90 border border-slate-200 hover:border-blue-300 transition-colors shadow-sm">
                                    <div className="mt-0.5 w-7 h-7 rounded border border-blue-200 bg-blue-50 flex shrink-0 items-center justify-center">
                                        <Check className="w-3.5 h-3.5 text-[#1E40FF]" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-slate-900 text-sm mb-0.5">{box.t}</h3>
                                        <p className="text-xs text-slate-600 leading-relaxed">{box.d}</p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="flex">
                            <a
                                href="/data"
                                onClick={(e) => handleSpaLinkClick(e, '/data')}
                                className="btn-inkica-primary inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl text-white font-bold"
                            >
                                <Monitor className="w-5 h-5" /> Trải Nghiệm Auto Data (Free 30 Ngày)
                            </a>
                        </div>
                    </FadeIn>
                </div>
            </div>
        </section>
    );
};

const ALL_MODULES = [
    {
        id: 'domation-data', title: 'Hệ Thống Phân Bổ Data', sub: 'Hệ thống logic chia vòng DATA tự động. Định tuyến luồng thông minh, thông báo Zalo Bot/Email Real-time cho từng tư vấn viên.', icon: Database, color: 'from-emerald-500 to-teal-600', tags: ['Data', 'Routing', 'Bot']
    },
    {
        id: 'campaigns', title: 'Campaigns', sub: 'Gửi kịch bản hàng loạt đa kênh Mail & Zalo ZNS. Tối ưu tỷ lệ mở với bộ lọc đối tượng thông minh.', icon: Mail, color: 'from-[#1E40FF] to-[#06B6D4]', tags: ['Marketing', 'Bulk']
    },
    {
        id: 'flows', title: 'Automation', sub: 'Thiết lập kịch bản dựa trên hành vi và sự kiện thực tế. Tự động hóa 100% quy trình CSKH đa kênh.', icon: Zap, color: 'from-blue-600 to-indigo-600', tags: ['Trigger', 'Workflow']
    },
    {
        id: 'templates', title: 'Email Design', sub: 'Thư viện mẫu thiết kế chuyên nghiệp, kéo thả linh hoạt. Hỗ trợ đầy đủ các khối nội dung và biến cá nhân hóa.', icon: FileText, color: 'from-sky-500 to-blue-600', tags: ['Drag & Drop', 'Design']
    },
    {
        id: 'ai-training', title: 'AI Training', sub: 'Huấn luyện bộ não AI theo dữ liệu riêng của doanh nghiệp. AI phản hồi Khách hàng chính xác theo ngữ cảnh.', icon: Bot, color: 'from-[#0F172A] to-[#1E40FF]', tags: ['AI', 'Smart']
    },
    {
        id: 'ai-space', title: 'AI Space', sub: 'Training kiến thức AI và giao diện chuyên nghiệp riêng biệt dành cho đội nhóm & các phòng ban độc lập.', icon: Sparkles, color: 'from-[#0284C7] to-[#06B6D4]', tags: ['Agents', 'Workspace']
    },
    {
        id: 'vouchers', title: 'Voucher Hub', sub: 'Quản lý tập trung toàn bộ mã ưu đãi, quà tặng. Tự động sinh mã ngẫu nhiên và theo dõi lượt sử dụng thời gian thực.', icon: Ticket, color: 'from-[#1E40FF] to-[#0EA5E9]', tags: ['Promo', 'Loyalty']
    },
    {
        id: 'survey', title: 'Survey Builder', sub: 'Thiết kế khảo sát kéo thả siêu dễ. Tracking qua mail, kích hoạt Flow tự động sau khảo sát. Hỗ trợ ẩn danh hoặc thu thập đầy đủ thông tin.', icon: ClipboardList, color: 'from-cyan-500 to-sky-600', tags: ['Survey', 'Trigger']
    },
    {
        id: 'qr-tracking', title: 'QR Code Tracking', sub: 'Tạo mã QR có ID giúp tracking chuẩn xác lượt quét cho từng chiến dịch sự kiện. Thiết kế custom đa dạng.', icon: ScanLine, color: 'from-blue-600 to-cyan-600', tags: ['QR', 'Offline']
    },
    {
        id: 'zalo-oa', title: 'Zalo Connect', sub: 'Tích hợp Zalo Official Account. Gửi tin nhắn quan tâm, thông báo ZNS và quản lý hội thoại tập trung.', icon: MessageSquare, color: 'from-[#0068FF] to-[#00c6ff]', tags: ['Zalo', 'ZNS']
    },
    {
        id: 'meta-api', title: 'Meta API', sub: 'Kết nối Facebook Messenger & Instagram. Tự động trả lời tin nhắn, đồng bộ dữ liệu và quản lý Ads hiệu quả.', icon: MessageSquare, color: 'from-[#0668E1] to-[#00f2fe]', tags: ['Meta', 'Ads']
    },
    {
        id: 'web-tracking', title: 'Web Tracking', sub: 'Theo dõi chính xác từng click, scroll và hành vi Khách hàng trên website để phục vụ kịch bản Automation.', icon: Globe, color: 'from-cyan-500 to-blue-600'
    },
    {
        id: 'audience', title: 'Audiences', sub: 'Quản lý tập trung mọi điểm chạm. Phân loại đối tượng tự động dựa trên hành vi và lịch sử tương tác.', icon: Users, color: 'from-emerald-500 to-teal-600'
    },
    {
        id: 'reports', title: 'Analytics', sub: 'Phân tích hiệu suất chi tiết theo từng chiến dịch. Theo dõi tỷ lệ chuyển đổi và tăng trưởng Khách hàng.', icon: BarChart3, color: 'from-slate-700 to-slate-900'
    },
    {
        id: 'api-triggers', title: 'API Triggers', sub: 'Thiết lập Webhook và API kết nối 2 chiều. Kích hoạt Automation trực tiếp từ các hệ thống ngoại vi.', icon: Code2, color: 'from-indigo-500 to-blue-600', tags: ['Dev', 'API']
    },
    {
        id: 'web-design', title: 'Thiết Kế Web & Landing Page', sub: 'Thiết kế Website và Landing Page chuyên nghiệp, chuẩn SEO, tối ưu tỷ lệ chuyển đổi cao, tích hợp sẵn các công cụ tracking.', icon: Monitor, color: 'from-[#1E40FF] to-[#06B6D4]', tags: ['Web', 'Landing']
    },
    {
        id: 'meta-ad-report', title: 'Meta Ad Realtime Report', sub: 'Hệ thống báo cáo hiệu suất Meta Ads tích hợp AI phân tích dữ liệu chuyên sâu, hỗ trợ ra quyết định Scale hay Vít ngân sách.', icon: Activity, color: 'from-blue-600 to-cyan-500', tags: ['Meta Ads', 'Report', 'AI']
    },
    {
        id: 'settings', title: 'Cấu hình', sub: 'Quản lý tài khoản, phân quyền thành viên và thiết lập các kết nối API ngoại vi cho hệ thống.', icon: Settings2, color: 'from-slate-500 to-slate-700'
    }
];

// ─── Main Component ─────────────────────────────────────────────
const Landing: React.FC = () => {
    usePageSeo(getAutomationSeoConfig());
    const [isYearly, setIsYearly] = useState(true);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [formStatus, setFormStatus] = useState<'idle' | 'submitting' | 'success'>('idle');
    const [emailVolume, setEmailVolume] = useState('500k Emails');
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [isDemoModalOpen, setIsDemoModalOpen] = useState(false);
    const [previewImage, setPreviewImage] = useState<string | null>(null);
    const [showContactModal, setShowContactModal] = useState(false);

    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    const handleFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setFormStatus('submitting');

        const formData = new FormData(e.currentTarget);
        const data = {
            email: formData.get('email'),
            phone: formData.get('phone'),
            company: `${formData.get('company')} | ${formData.get('problem')}`,
            volume: emailVolume
        };

        // Thay URL này bằng link Web App của Google Apps Script sau khi deploy
        const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzeo1UmYbTKqzOF5ZsQ-QVy4t5j6iXS_yJD-XTQJFYcUPh_ZDHUFcI1a7crph-oDkCI/exec';

        fetch(SCRIPT_URL, {
            method: 'POST',
            mode: 'no-cors',
            body: JSON.stringify(data),
            headers: {
                'Content-Type': 'text/plain;charset=utf-8',
            }
        }).then(() => {
            setFormStatus('success');
        }).catch((err) => {
            console.error('Lỗi khi gửi form:', err);
            // Vẫn show success modal để không block trải nghiệm nếu có lỗi mạng/CORS
            setFormStatus('success');
        });
    };

    const stats = [
        { value: 98, suffix: '%', label: 'Tỉ lệ inbox Email' },
        { value: 100, suffix: '%', label: 'Hiển thị ZNS Zalo' },
        { value: 50, suffix: 'M+', label: 'Hành động Tracking/Tháng' },
        { value: 24, suffix: '/7', label: 'AI Support hoạt động' },
    ];

    return (
        <div className="min-h-screen bg-[#F8F9FA] text-slate-900 relative overflow-x-clip font-sans selection:bg-blue-600/20">
            <LuxuryGoldBackdrop />

            {/* ── Navigation ── */}
            <Navbar activePage="automation" onOpenContact={() => setShowContactModal(true)} />

            <main>
            {/* ── Hero ── */}
            <section className="relative pt-32 pb-16 md:pt-40 md:pb-20 px-4 md:px-6 z-10 flex flex-col items-center justify-center">
                <div className="max-w-5xl mx-auto text-center">
                    {/* Badge Hook */}
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
                        className="inline-flex items-center gap-2.5 px-6 py-2.5 rounded-full bg-blue-50/90 border border-blue-200 text-sm font-bold mb-8 shadow-sm backdrop-blur-sm">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                        <span className="text-[#1E40FF] tracking-wide uppercase">Automation &amp; Multi-Agent AI 5.0</span>
                    </motion.div>

                    {/* Heading */}
                    <motion.h1 initial={{ opacity: 0, y: 40, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: 1, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
                        className="font-black tracking-tight leading-[1.2] md:leading-[1.1] mb-8 w-full relative z-10 text-center">
                        <span className="block text-xl md:text-3xl lg:text-4xl text-slate-800 mb-2 md:mb-3 tracking-[0.2em] font-extrabold">DIGITAL AI</span>
                        <span className="text-gradient-inkica block pb-2 text-4xl sm:text-5xl md:text-6xl lg:text-7xl">
                            MARKETING AUTOMATION
                        </span>
                    </motion.h1>

                    <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.3 }}
                        className="text-sm sm:text-base md:text-xl text-slate-600 mb-10 md:mb-12 max-w-3xl mx-auto leading-relaxed px-2">
                        Thế hệ tiếp theo của Marketing Automation - Trải nghiệm sức mạnh tự động hóa vượt trội từ <strong className="text-slate-900">Automation Flow, Email, Zalo, Meta &amp; AI</strong> — Tối ưu hóa quy trình, tiết kiệm nguồn lực và thời gian.
                    </motion.p>

                    {/* CTA */}
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.3 }}
                        className="flex flex-col sm:flex-row items-center justify-center gap-3 md:gap-4 mb-16 w-full">
                        <button onClick={() => setIsFormOpen(true)}
                            className="w-full sm:w-auto min-h-[44px] btn-inkica-primary group relative flex items-center justify-center gap-2 md:gap-3 text-white px-6 md:px-8 py-3.5 md:py-4 rounded-xl md:rounded-2xl text-sm md:text-base font-black hover:-translate-y-1 transition-transform duration-300 shadow-[0_14px_32px_rgba(30,64,255,0.28)]">
                            <span className="relative z-10 flex items-center gap-2 md:gap-3">
                                Bắt Đầu Tăng Trưởng
                                <ArrowRight className="w-4 h-4 md:w-5 md:h-5 group-hover:translate-x-1 transition-transform" />
                            </span>
                        </button>
                        <button onClick={() => setIsDemoModalOpen(true)} className="w-full sm:w-auto min-h-[44px] justify-center flex items-center gap-2 md:gap-3 px-6 md:px-8 py-3.5 md:py-4 rounded-xl md:rounded-2xl text-sm md:text-base font-bold text-slate-800 bg-white/90 border border-slate-200 hover:border-blue-300 hover:bg-white hover:-translate-y-0.5 transition-all duration-300 shadow-sm">
                            <Play className="w-4 h-4 md:w-5 md:h-5 text-[#1E40FF]" />
                            Khám Phá Tính Năng
                        </button>
                    </motion.div>

                    {/* Platform Bar */}
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1, delay: 0.5 }}
                        className="flex flex-wrap items-center justify-center gap-4 md:gap-6 p-4 md:p-6 rounded-3xl bg-white/85 border border-slate-200/90 backdrop-blur-md shadow-sm">
                        <div className="text-xs font-bold text-slate-500 uppercase tracking-widest w-full mb-1">Kết nối trực tiếp</div>
                        {[
                            { name: 'Amazon SES', icon: LOGOS.aws_ses },
                            { name: 'Zalo ZNS', icon: LOGOS.zalo },
                            { name: 'Meta Messenger', icon: LOGOS.meta },
                            { name: 'Google Sheets', icon: '/assets/brands/sheets-icon.svg' },
                            { name: 'Gemini AI', icon: '/assets/brands/gemini-icon.svg' },
                            { name: 'DOMATION CRM', icon: '/domation-logo.svg' }
                        ].map((plat) => (
                            <div key={plat.name} className="flex items-center gap-2 hover:-translate-y-0.5 transition-transform duration-300">
                                <img loading="lazy" decoding="async" src={plat.icon} alt={plat.name} className="h-7 md:h-8 object-contain rounded-md" />
                                <span className="font-bold text-slate-700 hidden sm:block text-sm">{plat.name}</span>
                            </div>
                        ))}
                    </motion.div>
                </div>

                {/* Hero Image — Luminous Frosted Frame */}
                <div style={{ perspective: '1200px' }} className="w-full max-w-6xl mx-auto mt-14 md:mt-18 relative px-4 z-20">
                    <motion.div initial={{ opacity: 0, y: 80, rotateX: 16, scale: 0.96 }} animate={{ opacity: 1, y: 0, rotateX: 0, scale: 1 }} transition={{ duration: 1.2, delay: 0.35, ease: [0.16, 1, 0.3, 1] }}
                        className="relative w-full rounded-[30px] p-[2px] bg-gradient-to-br from-[#1E40FF]/35 via-[#0284C7]/25 to-[#06B6D4]/35 group z-10 shadow-[0_28px_70px_rgba(30,64,255,0.14)]"
                    >
                        <div className="relative z-10 rounded-[28px] overflow-hidden bg-white p-1.5">
                            <img src="/imgs/home.jpg" alt="DOM Marketing Overview" className="w-full h-auto rounded-[22px] object-cover" loading="eager" />
                        </div>

                        {/* Floating badges */}
                        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 1.0, duration: 0.6 }} className="absolute -top-4 right-4 md:right-8 flex items-center gap-2 bg-white/95 border border-emerald-200 rounded-full px-3 md:px-4 py-1.5 md:py-2 shadow-lg backdrop-blur-sm z-20">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                            <span className="text-emerald-700 text-xs font-bold">Live System</span>
                        </motion.div>
                        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 1.2, duration: 0.6 }} className="absolute -bottom-4 left-4 md:left-8 flex items-center gap-2 bg-white/95 border border-blue-200 rounded-full px-3 md:px-4 py-1.5 md:py-2 shadow-lg backdrop-blur-sm z-20">
                            <Zap className="w-3.5 h-3.5 text-[#1E40FF]" />
                            <span className="text-[#1E40FF] text-xs font-bold">98% Inbox Rate</span>
                        </motion.div>
                    </motion.div>
                </div>
            </section>

            {/* ── Stats Bar ── */}
            <section className="py-16 px-6 relative z-10 border-y border-slate-200/70 bg-white/40 backdrop-blur-sm">
                <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
                    {stats.map((s, i) => (
                        <FadeIn key={s.label} delay={i * 0.1}>
                            <div className="inkica-glass-card relative text-center p-5 rounded-2xl border border-white/90 hover:border-blue-300/70 transition-all duration-300 group overflow-hidden">
                                <div className="text-4xl md:text-5xl font-black mb-2 text-transparent bg-clip-text bg-gradient-to-r from-[#0F172A] via-[#1E40FF] to-[#06B6D4]">
                                    <Counter to={s.value} suffix={s.suffix} />
                                </div>
                                <p className="text-xs md:text-sm text-slate-600 font-semibold">{s.label}</p>
                            </div>
                        </FadeIn>
                    ))}
                </div>
            </section>

            {/* ── All Features ── */}
            <section id="features" className="py-16 md:py-28 px-4 md:px-6 relative z-10 scroll-mt-20">
                <div className="max-w-7xl mx-auto">
                    <FadeIn className="text-center mb-12 md:mb-20">
                        <h2 className="text-3xl md:text-5xl font-black text-slate-900 mb-4 md:mb-5 leading-tight">
                            Công Cụ Nền Tảng<br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#1E40FF] to-[#06B6D4]">Cho Chiến Lược Đa Kênh</span>
                        </h2>
                        <p className="text-slate-600 text-base md:text-lg max-w-2xl mx-auto">
                            Tất cả mọi thứ bạn cần để thu hút, nuôi dưỡng và chuyển đổi khách hàng hoàn toàn tự động.
                        </p>
                    </FadeIn>

                    <div className="w-full relative border border-slate-200 rounded-[24px] md:rounded-[32px] p-2 md:p-3 bg-white/95 backdrop-blur-sm shadow-[0_24px_64px_rgba(30,64,255,0.10)] flex-shrink-0 cursor-pointer group" onClick={() => setIsDemoModalOpen(true)}>
                        <img loading="lazy" decoding="async" src="/imgs/cac_tinh_nang.png" alt="Các tính năng nổi bật" className="w-full h-auto rounded-[18px] md:rounded-[24px] object-cover group-hover:opacity-95 transition-opacity" />
                    </div>

                    <FadeIn delay={0.2} className="mt-10 md:mt-16 flex justify-center">
                        <button onClick={() => setIsDemoModalOpen(true)} className="btn-inkica-primary text-white font-bold px-8 md:px-10 py-3.5 md:py-4 rounded-xl hover:-translate-y-1 transition-all flex items-center gap-2.5 shadow-[0_14px_32px_rgba(30,64,255,0.28)]">
                            <Layers className="w-5 h-5" />
                            Xem Chi Tiết Các Tính Năng
                        </button>
                    </FadeIn>
                </div>
            </section>

            {/* ── Email Drag & Drop Builder ── */}
            <section id="builder" className="py-16 md:py-28 px-4 md:px-6 relative z-10 scroll-mt-20">
                <div className="max-w-7xl mx-auto flex flex-col-reverse lg:flex-row items-center gap-10 lg:gap-16">
                    {/* Visual */}
                    <div className="w-full lg:w-1/2">
                        <FadeIn from="left">
                            <div className="relative rounded-2xl md:rounded-3xl border border-slate-200/90 bg-white/95 p-3 md:p-4 shadow-[0_24px_60px_rgba(30,64,255,0.10)] cursor-pointer group" onClick={() => setPreviewImage('/imgs/email build.jpg')}>
                                <div className="flex justify-between items-center px-2 pb-3 md:pb-4 border-b border-slate-200 mb-3 md:mb-4">
                                    <div className="flex gap-1.5">
                                        <div className="w-2.5 h-2.5 md:w-3 md:h-3 rounded-full bg-rose-400" />
                                        <div className="w-2.5 h-2.5 md:w-3 md:h-3 rounded-full bg-[#1E40FF]" />
                                        <div className="w-2.5 h-2.5 md:w-3 md:h-3 rounded-full bg-emerald-400" />
                                    </div>
                                    <div className="text-xs font-bold text-slate-500 flex items-center gap-1.5"><LayoutTemplate className="w-3.5 h-3.5 text-[#1E40FF]" /> Studio Design</div>
                                </div>
                                <div className="p-1">
                                    <img loading="lazy" decoding="async" src="/imgs/email build.jpg" alt="Email Builder Drag and Drop" className="w-full h-auto rounded-xl md:rounded-2xl shadow-md object-cover group-hover:opacity-95 transition-opacity" />
                                </div>
                            </div>
                        </FadeIn>
                    </div>

                    {/* Content */}
                    <div className="w-full lg:w-1/2">
                        <FadeIn from="right">
                            <div className="inline-flex items-center gap-2 px-3 md:px-4 py-2 rounded-full bg-blue-50 border border-blue-200 text-[#1E40FF] text-xs font-bold uppercase tracking-widest mb-5">
                                <Pointer className="w-3.5 h-3.5" />
                                Email Builder Studio
                            </div>
                            <h2 className="text-3xl md:text-5xl font-black text-slate-900 mb-4 md:mb-6 leading-tight">
                                Thiết Kế Email Kéo Thả <br />
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#1E40FF] to-[#06B6D4]">Siêu Mượt, Siêu Tốc</span>
                            </h2>
                            <p className="text-slate-600 text-lg mb-8 leading-relaxed">
                                <strong className="text-[#0284C7] font-semibold block mb-2">Marketing loay hoay thiết kế Email chuyên nghiệp? Hay đành "chữa cháy" bằng một bức ảnh đơn lẻ dễ bay vào hòm thư Spam?</strong>
                                Yên tâm, công cụ kéo thả (Drag &amp; Drop) thông minh sẽ giải quyết mọi rắc rối. Giờ đây bạn có thể dễ dàng "lắp ráp" các tài liệu tiếp thị lộng lẫy, chuẩn Responsive mà không tốn lấy một giọt mồ hôi.
                            </p>
                            <ul className="space-y-4 mb-10">
                                {[
                                    '100+ Khối nội dung có sẵn: Banner, Nút bấm, Bảng giá',
                                    'Responsive Design - Auto tương thích mọi thiết bị',
                                    'Hỗ trợ Code Custom & Dynamic Tags {user.name}',
                                    'Kho biểu tượng và hình nền tích hợp sẵn'
                                ].map((item, i) => (
                                    <li key={i} className="flex items-start gap-3">
                                        <div className="mt-1 w-5 h-5 rounded-md bg-blue-50 border border-blue-200 flex items-center justify-center flex-shrink-0">
                                            <Check className="w-3 h-3 text-[#1E40FF]" />
                                        </div>
                                        <span className="text-slate-700 font-medium">{item}</span>
                                    </li>
                                ))}
                            </ul>
                        </FadeIn>
                    </div>
                </div>
            </section>

            {/* ── Flow Builder ── */}
            <section id="flow" className="py-16 md:py-28 px-4 md:px-6 relative z-10 overflow-hidden border-y border-slate-200/70 bg-white/45 backdrop-blur-sm scroll-mt-20">
                <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-10 lg:gap-24">
                    {/* Text */}
                    <div className="w-full lg:w-1/2">
                        <FadeIn from="left">
                            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 border border-blue-200 text-[#1E40FF] text-xs font-bold uppercase tracking-widest mb-6">
                                <Workflow className="w-3.5 h-3.5" />
                                Automation Flow Tree
                            </div>
                            <h2 className="text-4xl md:text-5xl font-black text-slate-900 mb-4 md:mb-6 leading-tight">
                                Kéo Thả <br />
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#1E40FF] to-[#0284C7]">Các Nhánh Kịch Bản</span>
                            </h2>
                            <p className="text-slate-600 text-base md:text-lg mb-6 leading-relaxed">
                                <strong className="text-[#0284C7] font-semibold block mb-2">Chăm sóc tự động chuẩn xác nhờ rẽ nhánh hành vi thông minh!</strong>
                                Tự do xây dựng quy trình chăm sóc phức tạp. Hệ thống tự động phân loại theo hành vi, kiểm duyệt an toàn, và điều phối gửi nhận tùy theo sự tương tác của Khách hàng với độ chính xác cao nhất.
                            </p>
                            <div className="grid grid-cols-2 gap-4">
                                {[
                                    { t: "Rẽ Nhánh Điều Kiện", d: "Tự động phân luồng theo hành động: Nhận, Mở, Click Link..." },
                                    { t: "Rẽ Nhánh Nâng Cao", d: "Kết hợp linh hoạt với hệ thống Logic biểu thức (AND/OR)." },
                                    { t: "Kiểm Duyệt Kịch Bản", d: "Quy trình xác nhận và phê duyệt bản nháp trước lúc Live." },
                                    { t: "Wait/Delay Timer", d: "Kiểm soát thời gian gửi bằng cách thiết lập chờ dễ dàng." }
                                ].map((box, i) => (
                                    <div key={i} className="bg-white/90 border border-slate-200 rounded-xl p-4 shadow-sm hover:border-blue-300 transition-colors">
                                        <div className="text-sm font-bold text-slate-900 mb-1">{box.t}</div>
                                        <div className="text-xs text-slate-600">{box.d}</div>
                                    </div>
                                ))}
                            </div>
                        </FadeIn>
                    </div>

                    {/* Flow Visual — Clean Glass Frame */}
                    <div className="w-full lg:w-1/2">
                        <FadeIn delay={0.2} from="right">
                            <div className="space-y-3">
                                <div
                                    className="cursor-pointer rounded-3xl border border-slate-200 bg-white p-2 shadow-[0_20px_54px_rgba(30,64,255,0.10)] hover:border-blue-300 transition-all"
                                    onClick={() => setPreviewImage('/imgs/flow.png')}
                                >
                                    <img loading="lazy" decoding="async" src="/imgs/flow.png" alt="Automation Flow Builder" className="w-full h-auto rounded-2xl object-cover" />
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    {[
                                        { src: '/imgs/flow_renhanh.png', alt: 'Cấu hình rẽ nhánh IF/ELSE' },
                                        { src: '/imgs/flow.jpg', alt: 'Sơ đồ kịch bản tự động' },
                                    ].map((img) => (
                                        <button
                                            key={img.src}
                                            type="button"
                                            onClick={() => setPreviewImage(img.src)}
                                            className="cursor-pointer rounded-2xl border border-slate-200 bg-white p-1.5 shadow-sm hover:border-blue-300 transition-all overflow-hidden"
                                        >
                                            <img loading="lazy" decoding="async" src={img.src} alt={img.alt} className="w-full aspect-[16/10] rounded-xl object-cover" />
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </FadeIn>
                    </div>
                </div>
            </section>

            {/* ── Campaign Tracking Section ── */}
            <section id="campaign-tracking" className="py-16 md:py-24 px-4 md:px-6 relative z-10 scroll-mt-20">
                <div className="max-w-7xl mx-auto flex flex-col-reverse lg:flex-row items-center gap-12 lg:gap-20">
                    {/* Visual — Clean Glass Frame */}
                    <div className="w-full lg:w-1/2">
                        <FadeIn delay={0.2} from="left">
                            <div className="space-y-3">
                                <div
                                    className="cursor-pointer rounded-3xl border border-slate-200 bg-white p-2 shadow-[0_20px_54px_rgba(30,64,255,0.10)] hover:border-cyan-300 transition-all"
                                    onClick={() => setPreviewImage('/imgs/campain_track_heatmap.png')}
                                >
                                    <img loading="lazy" decoding="async" src="/imgs/campain_track_heatmap.png" alt="Campaign Heatmap Tracking" className="w-full h-auto rounded-2xl object-cover" />
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    {[
                                        { src: '/imgs/campain_track_3.png', alt: 'Mail Detail Track' },
                                        { src: '/imgs/campain_track_4.png', alt: 'Device Analytics' },
                                    ].map((img) => (
                                        <button
                                            key={img.src}
                                            type="button"
                                            onClick={() => setPreviewImage(img.src)}
                                            className="cursor-pointer rounded-2xl border border-slate-200 bg-white p-1.5 shadow-sm hover:border-cyan-300 transition-all overflow-hidden"
                                        >
                                            <img loading="lazy" decoding="async" src={img.src} alt={img.alt} className="w-full aspect-[16/10] rounded-xl object-cover" />
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </FadeIn>
                    </div>

                    {/* Content */}
                    <div className="w-full lg:w-1/2">
                        <FadeIn from="right">
                            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-50 border border-cyan-200 text-[#0284C7] text-xs font-bold uppercase tracking-widest mb-6">
                                <BarChart3 className="w-3.5 h-3.5" />
                                Campaign Deep Analytics
                            </div>
                            <h2 className="text-4xl md:text-5xl font-black text-slate-900 mb-6 leading-tight">
                                Theo Dõi Chiến Dịch <br />
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#0284C7] to-[#06B6D4]">Siêu Chi Tiết Tâm Điểm</span>
                            </h2>
                            <p className="text-slate-600 text-lg mb-8 leading-relaxed">
                                Nắm bắt trọn vẹn hành vi của từng người nhận. Hệ thống phân tích đa chiều không bỏ sót bất kỳ điểm chạm nào: Tỷ lệ Click theo khu vực vị trí, Môi trường thiết bị, và cả bản đồ tương tác (Heatmap) ngay trên file Mail/Landing.
                            </p>
                            <div className="grid grid-cols-2 gap-4">
                                {[
                                    { t: "Heatmap Click", d: "Bản đồ nhiệt biết nơi KH hay tương tác nhất" },
                                    { t: "Device & Browser", d: "Thống kê Thiết bị & Trình duyệt (Mobile vs PC)" },
                                    { t: "Location Tracking", d: "Báo cáo vị trí mở theo Quốc gia/Thành phố" },
                                    { t: "Time Matrix", d: "Biểu đồ phân tích khung giờ mở cực đại" }
                                ].map((box, i) => (
                                    <div key={i} className="bg-white/90 border border-slate-200 rounded-xl p-4 shadow-sm hover:border-cyan-300 transition-colors">
                                        <div className="text-sm font-bold text-slate-900 mb-1">{box.t}</div>
                                        <div className="text-xs text-slate-600">{box.d}</div>
                                    </div>
                                ))}
                            </div>
                        </FadeIn>
                    </div>
                </div>
            </section>

            {/* ── Voucher & Promotion Section ── */}
            <section id="voucher" className="py-24 md:py-32 px-4 md:px-6 relative z-10 overflow-hidden border-y border-slate-200/70 bg-white/45 backdrop-blur-sm scroll-mt-20">
                <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-16 lg:gap-24">
                    {/* Content */}
                    <div className="w-full lg:w-1/2 z-20">
                        <FadeIn from="left">
                            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 border border-blue-200 text-[#1E40FF] text-xs font-bold uppercase tracking-widest mb-6">
                                <Star className="w-3.5 h-3.5 fill-[#1E40FF] text-[#1E40FF]" />
                                Voucher &amp; Promotion
                            </div>
                            <h2 className="text-4xl md:text-5xl font-black text-slate-900 mb-6 leading-tight">
                                Khuyến Mãi <br />
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#1E40FF] to-[#06B6D4]">Tích Hợp &amp; Cá Nhân Hoá</span>
                            </h2>
                            <p className="text-slate-600 text-lg mb-8 leading-relaxed">
                                <strong className="text-[#1E40FF] font-semibold block mb-2">Thúc đẩy tỷ lệ chuyển đổi bằng các mã ưu đãi cá nhân hóa?</strong>
                                Tích hợp voucher trực tiếp vào các luồng Email Marketing và Automation của bạn. Nền tảng ghi nhận theo thời gian thực mỗi lượt khách hàng tương tác nhận (collect) và sử dụng (redeem) ngay trên hệ thống.
                            </p>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                                {[
                                    { t: "Đa Dạng Loại Thẻ", d: "Linh hoạt tuỳ chọn theo hình thức Giảm Phần Trăm (%), Giảm Số Tiền, hay Tặng Quà." },
                                    { t: "Quản Lý Người Dùng", d: "Giới hạn khách hàng mục tiêu để tối ưu hoá ngân sách và ngăn chặn lạm dụng." },
                                    { t: "Quản Lý Số Lượng", d: "Kiểm soát lượng phân phối tổng và số vòng quay tối đa của mỗi chương trình." },
                                    { t: "Tracking & Redeem", d: "Dữ liệu được cập nhật Real-Time thống nhất vào luồng theo dõi Users Journey." }
                                ].map((box, i) => (
                                    <div key={i} className="flex gap-4 p-4 rounded-xl bg-white/90 border border-slate-200 shadow-sm hover:border-blue-300 transition-colors">
                                        <div className="mt-1 w-8 h-8 rounded border border-blue-200 bg-blue-50 flex shrink-0 items-center justify-center">
                                            <Check className="w-4 h-4 text-[#1E40FF]" />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-slate-900 text-sm mb-1">{box.t}</h3>
                                            <p className="text-xs text-slate-600 leading-relaxed">{box.d}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </FadeIn>
                    </div>

                    {/* Visual Gallery — Clean Glass Frame */}
                    <div className="w-full lg:w-1/2">
                        <FadeIn delay={0.2} from="right">
                            <div className="space-y-3">
                                <div
                                    className="cursor-pointer rounded-3xl border border-slate-200 bg-white p-2 shadow-[0_20px_54px_rgba(30,64,255,0.10)] hover:border-blue-300 transition-all"
                                    onClick={() => setPreviewImage('/imgs/voucher3.png')}
                                >
                                    <img loading="lazy" decoding="async" src="/imgs/voucher3.png" alt="Promotion Dashboard" className="w-full rounded-2xl object-cover" />
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    {[
                                        { src: '/imgs/voucher2.png', alt: 'Voucher Setup Rules' },
                                        { src: '/imgs/voucher.png', alt: 'Tracking & Redeem' },
                                    ].map((img) => (
                                        <button
                                            key={img.src}
                                            type="button"
                                            onClick={() => setPreviewImage(img.src)}
                                            className="cursor-pointer rounded-2xl border border-slate-200 bg-white p-1.5 shadow-sm hover:border-blue-300 transition-all overflow-hidden"
                                        >
                                            <img loading="lazy" decoding="async" src={img.src} alt={img.alt} className="w-full aspect-[16/10] rounded-xl object-cover" />
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </FadeIn>
                    </div>
                </div>
            </section>

            {/* ── Survey Builder Section ── */}
            <section id="survey" className="py-16 md:py-24 px-4 md:px-6 relative z-10 overflow-hidden scroll-mt-20">
                <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-12 lg:gap-20">
                    {/* ── Visual (left) ── */}
                    <div className="w-full lg:w-[52%]">
                        <FadeIn delay={0.2} from="left">
                            <div className="space-y-3">
                                <div
                                    className="cursor-pointer rounded-3xl border border-slate-200 bg-white p-2 shadow-[0_20px_54px_rgba(6,182,212,0.10)] hover:border-cyan-300 transition-all"
                                    onClick={() => setPreviewImage('/imgs/ks.png')}
                                >
                                    <img loading="lazy" decoding="async" src="/imgs/ks.png" alt="Survey Dashboard" className="w-full rounded-2xl object-cover" />
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    {[
                                        { src: '/imgs/ks2.png', alt: 'Survey Builder' },
                                        { src: '/imgs/ks3.png', alt: 'Survey Statistics' },
                                    ].map((img) => (
                                        <button
                                            key={img.src}
                                            type="button"
                                            onClick={() => setPreviewImage(img.src)}
                                            className="cursor-pointer rounded-2xl border border-slate-200 bg-white p-1.5 shadow-sm hover:border-cyan-300 transition-all overflow-hidden"
                                        >
                                            <img loading="lazy" decoding="async" src={img.src} alt={img.alt} className="w-full aspect-[16/10] rounded-xl object-cover" />
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </FadeIn>
                    </div>

                    {/* ── Content (right) ── */}
                    <div className="w-full lg:w-[48%] z-20">
                        <FadeIn from="right">
                            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-50 border border-cyan-200 text-[#0284C7] text-xs font-bold uppercase tracking-widest mb-6">
                                <ClipboardList className="w-3.5 h-3.5" />
                                Survey &amp; Feedback Hub
                            </div>

                            <h2 className="text-4xl md:text-5xl font-black text-slate-900 mb-6 leading-tight">
                                Khảo Sát Thông Minh<br />
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#0284C7] to-[#06B6D4]">Kích Hoạt Chăm Sóc Tự Động</span>
                            </h2>

                            <p className="text-slate-600 text-lg mb-8 leading-relaxed">
                                <strong className="text-[#0284C7] font-semibold block mb-2">Chưa biết khách hàng thực sự nghĩ gì? Dữ liệu phản hồi bị lãng quên mà không tạo ra hành động tiếp theo?</strong>
                                Thiết kế khảo sát kéo thả siêu dễ trong vài phút. Hệ thống tự động tracking phản hồi qua mail, nhận diện điểm cần cải thiện và kích hoạt Flow Automation chăm sóc sau khảo sát ngay lập tức.
                            </p>

                            {/* Feature cards grid */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                                {[
                                    {
                                        icon: GanttChart,
                                        t: 'Kéo Thả Thiết Kế',
                                        d: 'Tạo form khảo sát trực quan tức thì. Hỗ trợ trắc nghiệm, xếp hạng, bổ sung văn bản tự do.'
                                    },
                                    {
                                        icon: Mail,
                                        t: 'Tracking Qua Mail',
                                        d: 'Nhúng khảo sát vào email, theo dõi ai đã phản hồi. Kích hoạt nhắc nhở tự động cho người chưa hoàn thành.'
                                    },
                                    {
                                        icon: Zap,
                                        t: 'Flow Trigger Tự Động',
                                        d: 'Sau khi nhận phản hồi, hệ thống tự kích hoạt chuỗi chăm sóc phù hợp với từng phân nhóm điểm số.'
                                    },
                                    {
                                        icon: EyeOff,
                                        t: 'Ẩn Danh / Thu Thập',
                                        d: 'Linh hoạt chọn mode ẩn danh để nhận phản hồi thật lòng, hoặc thu thập thông tin để cá nhân hóa follow-up.'
                                    },
                                ].map((box, i) => (
                                    <div key={i} className="flex gap-3.5 p-4 rounded-xl bg-white/90 border border-slate-200 shadow-sm hover:border-cyan-300 transition-colors">
                                        <div className="mt-0.5 w-8 h-8 rounded-lg border border-cyan-200 bg-cyan-50 flex shrink-0 items-center justify-center">
                                            <box.icon className="w-4 h-4 text-[#0284C7]" />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-slate-900 text-sm mb-1">{box.t}</h3>
                                            <p className="text-xs text-slate-600 leading-relaxed">{box.d}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Stats strip */}
                            <div className="flex items-center gap-4 p-4 rounded-2xl bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-200">
                                {[
                                    { val: '3 phút', sub: 'Tạo xong 1 khảo sát' },
                                    { val: '92%', sub: 'Tỷ lệ phản hồi thu thập' },
                                    { val: 'Real-time', sub: 'Kích hoạt Flow ngay lập tức' },
                                ].map((s, i) => (
                                    <div key={i} className="flex-1 text-center">
                                        <p className="text-base md:text-lg font-black text-[#1E40FF]">{s.val}</p>
                                        <p className="text-[10px] text-slate-600 leading-tight mt-0.5">{s.sub}</p>
                                    </div>
                                ))}
                            </div>
                        </FadeIn>
                    </div>
                </div>
            </section>

            {/* ── QR Link Tracking Section ── */}
            <section id="qr-tracking" className="py-24 md:py-32 px-4 md:px-6 relative z-10 overflow-hidden border-y border-slate-200/70 bg-white/45 backdrop-blur-sm scroll-mt-20">
                <div className="max-w-7xl mx-auto flex flex-col lg:flex-row-reverse items-center gap-16 lg:gap-24">
                    {/* Visual (right side) — Clean Glass Frame */}
                    <div className="w-full lg:w-1/2">
                        <FadeIn delay={0.2} from="right">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div
                                    className="cursor-pointer rounded-3xl border border-slate-200 bg-white p-2 shadow-[0_20px_54px_rgba(30,64,255,0.10)] hover:border-blue-300 transition-all"
                                    onClick={() => setPreviewImage('/imgs/qr_code.png')}
                                >
                                    <img loading="lazy" decoding="async" src="/imgs/qr_code.png" alt="QR Thiết Kế Đẹp" className="w-full rounded-2xl object-cover" />
                                </div>
                                <div
                                    className="cursor-pointer rounded-3xl border border-slate-200 bg-white p-2 shadow-[0_20px_54px_rgba(6,182,212,0.10)] hover:border-blue-300 transition-all"
                                    onClick={() => setPreviewImage('/imgs/qr_code2.png')}
                                >
                                    <img loading="lazy" decoding="async" src="/imgs/qr_code2.png" alt="QR Tracking Report" className="w-full rounded-2xl object-cover" />
                                </div>
                            </div>
                        </FadeIn>
                    </div>

                    {/* Content (left side) */}
                    <div className="w-full lg:w-1/2 z-20">
                        <FadeIn from="left">
                            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 border border-blue-200 text-[#1E40FF] text-xs font-bold uppercase tracking-widest mb-6">
                                <ScanLine className="w-3.5 h-3.5" />
                                QR Tracking &amp; Analytics
                            </div>

                            <h2 className="text-4xl md:text-5xl font-black text-slate-900 mb-6 leading-tight">
                                Tracking Mã QR<br />
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#1E40FF] to-[#06B6D4]">Từ Offline Lên Online</span>
                            </h2>

                            <p className="text-slate-600 text-lg mb-8 leading-relaxed">
                                <strong className="text-[#1E40FF] font-semibold block mb-2">Phát tờ rơi, chạy standee sự kiện nhưng không biết có bao nhiêu người thực sự chú ý và quét mã?</strong>
                                Xóa nhòa ranh giới giữa Offline và Online. Trình tạo mã QR chuyên nghiệp cho phép tuỳ biến thiết kế, đính kèm Logo thương hiệu và đo lường trực tiếp số người quét theo từng chiến dịch (Event) hiệu quả kinh ngạc.
                            </p>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                                {[
                                    {
                                        icon: LayoutTemplate,
                                        t: 'Thiết Kế Custom QR',
                                        d: 'Đổi kiểu dáng điểm, thêm màu sắc gradient và chèn Logo chuyên nghiệp.'
                                    },
                                    {
                                        icon: BarChart3,
                                        t: 'Thống Kê Lượt Quét',
                                        d: 'Theo dõi chi tiết báo cáo Scan hàng ngày đo chính xác tỷ lệ quan tâm tại điểm vật lý.'
                                    },
                                    {
                                        icon: Zap,
                                        t: 'Cập Nhật Dynamic Link',
                                        d: 'Sửa link đích tuỳ ý phía sau mã mà không cần phải in hay phát hành lại QR bản cứng.'
                                    },
                                    {
                                        icon: Target,
                                        t: 'Quản Lý Theo Tổ Chức',
                                        d: 'Nhóm các mã quét theo từng chuỗi dự án để tối ưu hóa ngân sách OOH (Out Of Home).'
                                    },
                                    {
                                        icon: Globe,
                                        t: 'Điều Hướng Thiết Bị',
                                        d: 'Nhận diện tự động hệ điều hành (iOS/Android) để điều hướng tải App hoặc Link tương ứng.'
                                    },
                                ].map((box, i) => (
                                    <div key={i} className="flex gap-3.5 p-4 rounded-xl bg-white/90 border border-slate-200 shadow-sm hover:border-blue-300 transition-colors">
                                        <div className="mt-0.5 w-8 h-8 rounded-lg border border-blue-200 bg-blue-50 flex shrink-0 items-center justify-center">
                                            <box.icon className="w-4 h-4 text-[#1E40FF]" />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-slate-900 text-sm mb-1">{box.t}</h3>
                                            <p className="text-xs text-slate-600 leading-relaxed">{box.d}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </FadeIn>
                    </div>
                </div>
            </section>

            {/* ── Tracking & Lead Scoring Section ── */}
            <section id="analytics" className="py-28 px-6 relative z-10">
                <div className="max-w-7xl mx-auto flex flex-col lg:flex-row-reverse items-center gap-16">
                    {/* Text */}
                    <div className="w-full lg:w-1/2">
                        <FadeIn from="right">
                            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold uppercase tracking-widest mb-6">
                                <ScanLine className="w-3.5 h-3.5" />
                                Web Analytics &amp; Lead Score
                            </div>
                            <h2 className="text-4xl md:text-5xl font-black text-slate-900 mb-6 leading-tight">
                                Tracking Mọi Chạm <br />
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-500">Trên Hành Trình Users</span>
                            </h2>
                            <p className="text-slate-600 text-lg mb-8 leading-relaxed">
                                Bạn nghĩ khách truy cập website là những cái bóng vô hình? DOM Pixel ghi lại hành động Scroll màn hình, Click từng nút bấm. Kết hợp bộ xử lý Điểm Tiềm Năng (Lead Scoring) tự động phân đoạn luồng chăm sóc.
                            </p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-8">
                                <div className="inkica-glass-card border border-white/90 rounded-2xl p-5">
                                    <Bot className="w-6 h-6 text-emerald-600 mb-3" />
                                    <h3 className="font-bold text-slate-900 mb-1">AI Phân Tích Segment</h3>
                                    <p className="text-xs text-slate-600 leading-relaxed">Phân cụm hành vi khách hàng hoàn toàn tự động, phân group nóng/lạnh chuẩn xác.</p>
                                </div>
                                <div className="inkica-glass-card border border-white/90 rounded-2xl p-5">
                                    <Target className="w-6 h-6 text-[#1E40FF] mb-3" />
                                    <h3 className="font-bold text-slate-900 mb-1">Cộng/Trừ Điểm Tự Động</h3>
                                    <p className="text-xs text-slate-600 leading-relaxed">Score += 5 nếu Scroll 100%. Tiết kiệm sức cho Telesale khi gọi đúng người.</p>
                                </div>
                            </div>
                        </FadeIn>
                    </div>

                    {/* Dashboard Mock — Clean Glass Frame */}
                    <div className="w-full lg:w-1/2">
                        <FadeIn delay={0.2} from="left" className="w-full">
                            <div className="space-y-3">
                                <div
                                    className="cursor-pointer rounded-3xl border border-slate-200 bg-white p-2 shadow-[0_20px_54px_rgba(30,64,255,0.10)] hover:border-blue-300 transition-all"
                                    onClick={() => setPreviewImage('/imgs/website tracking.jpg')}
                                >
                                    <img loading="lazy" decoding="async" src="/imgs/website tracking.jpg" alt="Website Tracking Metrics" className="w-full h-auto rounded-2xl object-cover" />
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    {[
                                        { src: '/imgs/website_tracking1.png', alt: 'User Journey Vertical' },
                                        { src: '/imgs/user_jouney.jpg', alt: 'Tracking Timeline' },
                                    ].map((img) => (
                                        <button
                                            key={img.src}
                                            type="button"
                                            onClick={() => setPreviewImage(img.src)}
                                            className="cursor-pointer rounded-2xl border border-slate-200 bg-white p-1.5 shadow-sm hover:border-blue-300 transition-all overflow-hidden"
                                        >
                                            <img loading="lazy" decoding="async" src={img.src} alt={img.alt} className="w-full aspect-[16/10] rounded-xl object-cover" />
                                        </button>
                                    ))}
                                </div>
                                <div className="rounded-2xl bg-white/95 border border-slate-200 p-4 shadow-sm">
                                    <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100">
                                        <div>
                                            <p className="text-xs font-bold text-slate-900">Live Tracking Log</p>
                                            <p className="text-[10px] text-slate-500">Ghi nhận tương tác Real-time</p>
                                        </div>
                                        <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                                        {[
                                            { ev: 'SCROLL 75%', user: 'ng**n', score: '+5 pt', iconColor: 'text-emerald-600' },
                                            { ev: 'CLICK PRICING', user: 'tr**a', score: '+20 pt', iconColor: 'text-[#1E40FF]' },
                                            { ev: 'EMAIL OPENED', user: 'le**c', score: '+2 pt', iconColor: 'text-[#0284C7]' },
                                        ].map((row) => (
                                            <div key={row.ev} className="flex items-center justify-between gap-2 p-2 rounded-xl bg-slate-50 border border-slate-200/80 text-[10px]">
                                                <div className="flex items-center gap-1.5 min-w-0">
                                                    <Pointer className={`w-3 h-3 shrink-0 ${row.iconColor}`} />
                                                    <span className="font-bold text-slate-800 truncate">{row.ev}</span>
                                                </div>
                                                <span className="px-1.5 py-0.5 rounded bg-blue-50 font-bold text-[#1E40FF] shrink-0">{row.score}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </FadeIn>
                    </div>
                </div>
            </section>

            {/* ── AI Chatbot Section ── */}
            <section id="ai" className="py-20 px-6 relative z-10 overflow-hidden border-y border-slate-200/70 bg-white/45 backdrop-blur-sm">
                <div className="max-w-7xl mx-auto flex flex-col lg:flex-row-reverse items-center gap-12 lg:gap-20">
                    {/* Text */}
                    <div className="w-full lg:w-1/2">
                        <FadeIn from="right">
                            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 border border-blue-200 text-[#1E40FF] text-xs font-bold uppercase tracking-widest mb-8">
                                <Cpu className="w-3.5 h-3.5" />
                                AI Chatbot System
                            </div>
                            <h2 className="text-3xl md:text-5xl font-black text-slate-900 mb-6 leading-tight">
                                Trợ Lý Ảo AI<br />
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#1E40FF] to-[#06B6D4]">Thông Minh Như Chuyên Gia</span>
                            </h2>
                            <p className="text-slate-600 text-lg mb-10 leading-relaxed">
                                Train AI từ tài liệu nội bộ, website của bạn. Thiết lập nền tảng kiến thức (Knowledge Base) thông minh, trả lời trực tiếp thắc mắc Khách hàng 24/7.
                            </p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10">
                                {[
                                    { icon: Sparkles, label: 'Giao Diện Branding', value: 'Custom màu sắc, UI Design & Logo riêng' },
                                    { icon: Settings2, label: 'Thiết Lập Văn Hóa', value: 'Tuỳ chỉnh tone giọng, chuẩn văn hoá Brand' },
                                    { icon: Users, label: 'Giao Tiếp Tự Nhiên', value: 'Tư vấn, hỏi đáp, chốt sale như người thật' },
                                    { icon: Database, label: 'Train Kiến Thức', value: 'Máy học thần tốc qua File, Web URL' },
                                ].map((item) => (
                                    <div key={item.label} className="inkica-glass-card border border-white/90 rounded-2xl p-5 hover:border-blue-300 transition-colors">
                                        <item.icon className="w-6 h-6 text-[#1E40FF] mb-3" />
                                        <p className="text-xs text-slate-500 font-bold mb-1 uppercase tracking-wider">{item.label}</p>
                                        <p className="text-sm font-semibold text-slate-900 leading-relaxed">{item.value}</p>
                                    </div>
                                ))}
                            </div>
                        </FadeIn>
                    </div>

                    {/* Screenshot — Clean Glass Frame */}
                    <div className="w-full lg:w-1/2">
                        <FadeIn delay={0.2} from="left">
                            <div className="space-y-3">
                                <div
                                    className="cursor-pointer rounded-3xl border border-slate-200 bg-white p-2 shadow-[0_20px_54px_rgba(30,64,255,0.10)] hover:border-blue-300 transition-all"
                                    onClick={() => setPreviewImage('/imgs/ai_2.jpg')}
                                >
                                    <img loading="lazy" decoding="async" src="/imgs/ai_2.jpg" alt="AI Chatbot Interaction" className="w-full h-auto rounded-2xl object-cover" />
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    {[
                                        { src: '/imgs/kien thuc ai.jpg', alt: 'Knowledge Base Platform' },
                                        { src: '/imgs/AIchatbot.png', alt: 'Custom AI Chatbot' },
                                    ].map((img) => (
                                        <button
                                            key={img.src}
                                            type="button"
                                            onClick={() => setPreviewImage(img.src)}
                                            className="cursor-pointer rounded-2xl border border-slate-200 bg-white p-1.5 shadow-sm hover:border-blue-300 transition-all overflow-hidden"
                                        >
                                            <img loading="lazy" decoding="async" src={img.src} alt={img.alt} className="w-full aspect-[16/10] rounded-xl object-cover" />
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </FadeIn>
                    </div>
                </div>
            </section>

            {/* ── AI Segment Analytics ── */}
            <section id="ai-segment" className="py-16 md:py-24 px-4 md:px-6 relative z-10 overflow-hidden scroll-mt-20">
                <div className="max-w-7xl mx-auto flex flex-col-reverse lg:flex-row items-center gap-12 lg:gap-20">
                    {/* Visual — Clean Glass Frame */}
                    <div className="w-full lg:w-[55%]">
                        <FadeIn delay={0.2} from="left">
                            <div className="space-y-3">
                                <div
                                    className="cursor-pointer rounded-3xl border border-slate-200 bg-white p-2 shadow-[0_20px_54px_rgba(30,64,255,0.10)] hover:border-blue-300 transition-all"
                                    onClick={() => setPreviewImage('/imgs/phan_tich_ai_3.png')}
                                >
                                    <img loading="lazy" decoding="async" src="/imgs/phan_tich_ai_3.png" alt="Phân Tích Độ Chính Xác" className="w-full h-auto rounded-2xl object-cover" />
                                </div>
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                                    {[
                                        { src: '/imgs/thauhieu.png', alt: 'Thấu Hiểu Khách Hàng' },
                                        { src: '/imgs/phan_tich_ai_1.png', alt: 'Phân Tích AI Segment' },
                                        { src: '/imgs/phan_tich_ai_2.png', alt: 'Phân Tích Chủ Đề' },
                                    ].map((img) => (
                                        <button
                                            key={img.src}
                                            type="button"
                                            onClick={() => setPreviewImage(img.src)}
                                            className="cursor-pointer rounded-2xl border border-slate-200 bg-white p-1.5 shadow-sm hover:border-blue-300 transition-all overflow-hidden"
                                        >
                                            <img loading="lazy" decoding="async" src={img.src} alt={img.alt} className="w-full aspect-[16/10] rounded-xl object-cover" />
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </FadeIn>
                    </div>

                    {/* Content */}
                    <div className="w-full lg:w-[45%] z-20">
                        <FadeIn from="right">
                            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-bold uppercase tracking-widest mb-6">
                                <Users className="w-3.5 h-3.5" />
                                Cụm Hành Vi (AI Segment)
                            </div>
                            <h2 className="text-3xl md:text-5xl font-black text-slate-900 mb-6 leading-tight">
                                <span className="sm:whitespace-nowrap">Phân Tích &amp; Thấu Hiểu</span><br />
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#1E40FF] to-[#0284C7]">Từng Khách Hàng</span>
                            </h2>
                            <p className="text-slate-600 text-lg mb-8 leading-relaxed">
                                <strong className="text-[#1E40FF] font-semibold block mb-2">Bắn tin nhắn rác hàng loạt và lãng phí hàng triệu đồng cho SMS, ZNS cực kỳ vô ích mỗi tháng?</strong>
                                Đừng ép khách hàng chặn bạn. AI đào sâu vào hội thoại, đếm nhịp tương tác để tự định lượng mức độ "tiềm năng" hay "do dự" của khách. Gửi đúng thông điệp, đúng người – x3 tỷ lệ chốt sale!
                            </p>
                            <div className="space-y-4 mb-4">
                                {[
                                    { t: "AI Segment Grouping", d: "Tự động phân tập theo xu hướng hội thoại" },
                                    { t: "Đề xuất kịch bản chăm sóc", d: "Tạo Flow Automation phù hợp cho từng nhóm chỉ với 1 click" },
                                    { t: "Theo dõi độ chính xác (Accuracy)", d: "Bảng điều khiển đo lường tỷ lệ trả lời đúng của Bot" },
                                    { t: "Khai thác chủ đề quan tâm", d: "Top từ khóa, chủ đề khách hàng hỏi nhiều nhất" }
                                ].map((box, i) => (
                                    <div key={i} className="flex items-start gap-4 p-4 rounded-xl bg-white/90 border border-slate-200 shadow-sm hover:border-blue-300 transition-colors">
                                        <div className="mt-1 w-6 h-6 rounded border border-blue-200 bg-blue-50 flex shrink-0 items-center justify-center">
                                            <Check className="w-3.5 h-3.5 text-[#1E40FF]" />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-slate-900 text-sm mb-1">{box.t}</h3>
                                            <p className="text-xs text-slate-600">{box.d}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </FadeIn>
                    </div>
                </div>
            </section>

            {/* ── AI Space Section ── */}
            <section id="ai-space" className="py-28 px-6 relative z-10 overflow-hidden border-t border-slate-200/70 bg-white/45 backdrop-blur-sm">
                <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-16 lg:gap-24">
                    {/* Content */}
                    <div className="w-full lg:w-[45%] z-20">
                        <FadeIn from="left">
                            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 border border-blue-200 text-[#1E40FF] text-xs font-bold uppercase tracking-widest mb-6">
                                <Sparkles className="w-3.5 h-3.5" />
                                Nền tảng AI Workspace
                            </div>
                            <h2 className="text-4xl md:text-5xl font-black text-slate-900 mb-6 leading-tight">
                                Không Gian AI <br />
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#0284C7] to-[#06B6D4] sm:whitespace-nowrap">Độc Lập Cho Phòng Ban</span>
                            </h2>
                            <p className="text-slate-600 text-lg mb-8 leading-relaxed">
                                <strong className="text-[#1E40FF] font-semibold block mb-2">Nhân sự cạn kiệt ý tưởng, tư vấn nhầm lẫn? Khách hàng bức xúc vì chờ đợi trả lời quá lâu?</strong>
                                Đã đến lúc "thuê" một nhân sự AI xuất sắc. Phân chia rõ ràng AI chuyên gia Sale - Marketing - CSKH. Được huấn luyện khắt khe dưới tiêu chuẩn Knowledge Base đóng, triệt tiêu tình trạng AI bịa chuyện, làm việc xuyên đêm 24/7.
                            </p>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                                {[
                                    { icon: Layers, t: "Training Chuyên Biệt", d: "Data độc lập, kiến thức phân quyền theo từng phòng ban" },
                                    { icon: ScanLine, t: "Chế Độ Đa Năng", d: "Tích hợp IMAGE mode, CodeMode, và Expert mode" },
                                    { icon: ShieldCheck, t: "Knowledge Khắt khe", d: "Kiểm soát truy xuất tài liệu, cấm AI bịa chuyện" },
                                    { icon: Users, t: "Phong Cách AI", d: "Giọng điệu Mentoring chân thật, hướng dẫn chi tiết" },
                                ].map((box, i) => (
                                    <div key={i} className="flex gap-4 p-4 rounded-xl bg-white/90 border border-slate-200 shadow-sm hover:border-blue-300 transition-colors">
                                        <div className="mt-1 w-8 h-8 rounded border border-blue-200 bg-blue-50 flex shrink-0 items-center justify-center">
                                            <box.icon className="w-4 h-4 text-[#1E40FF]" />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-slate-900 text-sm mb-1">{box.t}</h3>
                                            <p className="text-xs text-slate-600 leading-relaxed">{box.d}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </FadeIn>
                    </div>

                    {/* Visual Gallery — Clean Glass Frame */}
                    <div className="w-full lg:w-[55%]">
                        <FadeIn delay={0.2} from="right">
                            <div className="space-y-3">
                                <div
                                    className="cursor-pointer rounded-3xl border border-slate-200 bg-white p-2 shadow-[0_20px_54px_rgba(30,64,255,0.10)] hover:border-blue-300 transition-all"
                                    onClick={() => setPreviewImage('/imgs/AI GROUP (1).png')}
                                >
                                    <img loading="lazy" decoding="async" src="/imgs/AI GROUP (1).png" alt="AI Space" className="w-full rounded-2xl" />
                                </div>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                                    {[
                                        { src: '/imgs/AI GROUP (2).png', alt: 'Department Training' },
                                        { src: '/imgs/AI GROUP (4).png', alt: 'AI Expert Mode' },
                                        { src: '/imgs/AI GROUP (3).png', alt: 'Image Mode' },
                                        { src: '/imgs/AI GROUP (5).png', alt: 'Code Mode' },
                                    ].map((img) => (
                                        <button
                                            key={img.src}
                                            type="button"
                                            onClick={() => setPreviewImage(img.src)}
                                            className="cursor-pointer rounded-2xl border border-slate-200 bg-white p-1.5 shadow-sm hover:border-blue-300 transition-all overflow-hidden"
                                        >
                                            <img loading="lazy" decoding="async" src={img.src} alt={img.alt} className="w-full aspect-[16/10] rounded-xl object-cover" />
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </FadeIn>
                    </div>
                </div>
            </section>

            {/* ── Dashboard & Reporting ── */}
            <section id="dashboard" className="py-20 px-6 relative z-10 overflow-hidden">
                <div className="max-w-7xl mx-auto flex flex-col lg:flex-row-reverse items-center gap-12 lg:gap-20">
                    {/* Content */}
                    <div className="w-full lg:w-[45%] z-20">
                        <FadeIn from="right">
                            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 border border-blue-200 text-[#1E40FF] text-xs font-bold uppercase tracking-widest mb-6">
                                <BarChart3 className="w-3.5 h-3.5" />
                                Theo dõi Real-time
                            </div>
                            <h2 className="text-4xl md:text-5xl font-black text-slate-900 mb-6 leading-tight">
                                Báo Cáo Thông Minh <br />
                                <span className="text-gradient-inkica">Kiểm Soát Mọi Điểm Chạm</span>
                            </h2>
                            <p className="text-slate-600 text-lg mb-8 leading-relaxed">
                                <strong className="text-[#0284C7] font-semibold block mb-2">Mù mờ về số liệu thực tế? Phải đợi đến cuối tháng rà soát lại mới vỡ lẽ chiến dịch đang bốc hơi hàng chục triệu đồng?</strong>
                                Làm chủ dòng chảy dữ liệu. Nắm bắt toàn bộ bức tranh hiệu suất trải dài từ tần suất tương tác Website, tốc độ chốt đơn của AI, đến tỷ lệ phản hồi Zalo OA/Email với độ trễ gần như bằng 0.
                            </p>

                            <div className="space-y-4 mb-4">
                                {[
                                    { t: "Dashboard Tổng Quan", d: "Mọi chỉ số cốt lõi từ Website, Zalo, Meta... hội tụ trên một màn hình duy nhất." },
                                    { t: "Biểu Đồ Trực Quan", d: "Đánh giá sức khỏe chiến dịch với đa dạng loại biểu đồ trực quan, dễ hiểu." },
                                    { t: "Triết Xuất Chi Tiết", d: "Truy vết tăng trưởng, cập nhật sự kiện hàng ngày theo thời gian thực." }
                                ].map((box, i) => (
                                    <div key={i} className="flex items-start gap-4 p-4 rounded-xl bg-white/90 border border-slate-200 shadow-sm hover:border-blue-300 transition-colors">
                                        <div className="mt-1 w-6 h-6 rounded border border-blue-200 bg-blue-50 flex shrink-0 items-center justify-center">
                                            <Check className="w-3.5 h-3.5 text-[#1E40FF]" />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-slate-900 text-sm mb-1">{box.t}</h3>
                                            <p className="text-xs text-slate-600">{box.d}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </FadeIn>
                    </div>

                    {/* Visual Gallery — Clean Glass Frame */}
                    <div className="w-full lg:w-[55%]">
                        <FadeIn delay={0.2} from="left">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div
                                    className="cursor-pointer rounded-3xl border border-slate-200 bg-white p-2 shadow-[0_20px_54px_rgba(30,64,255,0.10)] hover:border-blue-300 transition-all sm:col-span-2"
                                    onClick={() => setPreviewImage('/imgs/dash1.png')}
                                >
                                    <img loading="lazy" decoding="async" src="/imgs/dash1.png" alt="Dashboard Tổng Quan" className="w-full rounded-2xl" />
                                </div>
                                <div
                                    className="cursor-pointer rounded-2xl border border-slate-200 bg-white p-2 shadow-sm hover:border-blue-300 transition-all sm:col-span-2"
                                    onClick={() => setPreviewImage('/imgs/dash.png')}
                                >
                                    <img loading="lazy" decoding="async" src="/imgs/dash.png" alt="Biểu Diễn Số Liệu" className="w-full rounded-xl" />
                                </div>
                            </div>
                        </FadeIn>
                    </div>
                </div>
            </section>

            {/* ── Web Design & Landing Page ── */}
            <WebDesignSection />

            {/* Meta Ad Report Feature */}
            <MetaAdReportFeatureSection />

            {/* Domation Data Feature */}
            <DomationDataSection />

            {/* ── Testimonials ── */}
            <TestimonialSection />

            {/* ── Canonical Pricing ── */}
            <section id="pricing" className="py-20 px-6 relative z-10 scroll-mt-20">
                <div className="max-w-7xl mx-auto">
                    <FadeIn className="text-center mb-12">
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 border border-blue-200 text-[#1E40FF] text-xs font-bold uppercase tracking-widest mb-5">
                            <BoxSelect className="w-3.5 h-3.5" /> Bảng Giá Hệ Sinh Thái Đồng Bộ
                        </div>
                        <h2 className="text-3xl md:text-5xl font-black text-slate-900 mb-4">
                            Giải Pháp Tương Xứng{' '}
                            <span className="text-gradient-inkica">Mọi Quy Mô Doanh Nghiệp</span>
                        </h2>
                        <p className="text-slate-600 text-sm md:text-base max-w-2xl mx-auto">
                            Dùng thử miễn phí 30 ngày (0₫) • Giá đồng bộ xuyên suốt toàn hệ sinh thái DOMATION.
                        </p>

                        <div className="mt-7 flex flex-row items-center justify-center gap-3">
                            <span className={`text-sm font-bold transition-colors ${!isYearly ? 'text-slate-900' : 'text-slate-500'}`}>Hàng Tháng</span>
                            <button
                                type="button"
                                onClick={() => setIsYearly(!isYearly)}
                                aria-label="Chuyển đổi chu kỳ thanh toán tháng và năm"
                                className="relative w-14 h-7 rounded-full bg-slate-200 border border-slate-300 flex items-center p-1 cursor-pointer transition-colors"
                            >
                                <div className={`w-5 h-5 rounded-full shadow-md transform transition-transform duration-300 ${isYearly ? 'translate-x-[26px] bg-[#1E40FF]' : 'translate-x-0 bg-white'}`} />
                            </button>
                            <span className={`text-sm font-bold transition-colors flex items-center gap-2 ${isYearly ? 'text-slate-900' : 'text-slate-500'}`}>
                                Hàng Năm <span className="inline-block px-2 py-0.5 rounded text-[10px] bg-blue-50 text-[#1E40FF] border border-blue-200 uppercase tracking-widest leading-none">Giảm 15%</span>
                            </span>
                        </div>
                    </FadeIn>

                    <div className="rounded-[28px] overflow-hidden border border-slate-200/85 bg-white/90 backdrop-blur-xl shadow-xs grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-slate-200/75">
                        {DOMATION_SAAS_PLANS.map((plan, idx) => {
                            const isCustom = plan.monthly === 'May Đo';
                            return (
                                <div
                                    key={plan.name}
                                    className={`p-6 sm:p-7 flex flex-col justify-between ${
                                        idx >= 2 ? 'md:border-t md:border-slate-200/75 xl:border-t-0' : ''
                                    } ${
                                        plan.popular
                                            ? 'bg-gradient-to-br from-[#EEF4FF] via-white to-[#ECFEFF] ring-2 ring-inset ring-[#1E40FF]/35'
                                            : ''
                                    }`}
                                >
                                    <div>
                                        <span
                                            className={`inline-block text-[10px] font-semibold uppercase tracking-widest px-3 py-1 rounded-full mb-4 ${
                                                plan.popular
                                                    ? 'bg-gradient-to-r from-[#1E40FF] to-[#06B6D4] text-white'
                                                    : 'bg-slate-100 text-[#1E40FF]'
                                            }`}
                                        >
                                            {plan.badge}
                                        </span>
                                        <h3 className="text-lg font-bold text-slate-900">{plan.name}</h3>
                                        <div className="mt-3 mb-2.5 flex items-baseline gap-1.5">
                                            <span className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
                                                {isYearly ? plan.yearly : plan.monthly}
                                            </span>
                                            {!isCustom && (
                                                <span className="text-xs font-medium text-slate-500">
                                                    {isYearly ? '/ năm' : '/ tháng'}
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-xs sm:text-sm leading-relaxed mb-5 text-slate-600">{plan.desc}</p>
                                        <ul className="space-y-2.5 pt-4 border-t border-slate-200/75">
                                            {plan.features.map((feat) => (
                                                <li key={feat} className="flex items-start gap-2 text-xs text-slate-700">
                                                    <Check className="w-4 h-4 shrink-0 mt-0.5 text-[#1E40FF]" />
                                                    <span>{feat}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setIsFormOpen(true)}
                                        className={`mt-7 min-h-[44px] w-full py-3 px-4 rounded-xl font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer ${
                                            plan.popular ? 'btn-inkica-primary text-white' : 'ql-btn-outline'
                                        }`}
                                    >
                                        <span>{isCustom ? 'Tư Vấn May Đo' : 'Bắt Đầu Ngay'}</span>
                                        <ArrowRight className="w-4 h-4" />
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </section>

            {/* ── CTA Final ── */}
            <section className="py-20 px-6 relative z-10 overflow-hidden">
                <div className="max-w-5xl mx-auto">
                    <div className="relative rounded-[2.5rem] overflow-hidden shadow-[0_30px_70px_rgba(30,64,255,0.24)]">
                        <div className="absolute inset-0 bg-gradient-to-br from-[#0F172A] via-[#1E40FF] to-[#06B6D4]" />
                        <div className="absolute inset-0">
                            <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-300/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4" />
                            <div className="absolute bottom-0 left-0 w-80 h-80 bg-blue-900/40 rounded-full blur-3xl translate-y-1/2 -translate-x-1/4" />
                            <div className="absolute inset-0 opacity-[0.06]" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,1) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,1) 1px,transparent 1px)', backgroundSize: '40px 40px' }} />
                        </div>
                        <FadeIn className="relative z-10 p-10 md:p-20 text-center">
                            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/15 border border-white/25 mb-8">
                                <span className="w-2 h-2 rounded-full bg-cyan-300 animate-pulse" />
                                <span className="text-white text-xs font-bold uppercase tracking-widest">Sẵn Sàng Tăng Trưởng</span>
                            </div>
                            <h2 className="text-xl md:text-2xl font-extrabold text-white/95 mb-6 leading-tight tracking-tight">
                                Tăng Trưởng Cùng Hệ Thống <br />
                                <span className="text-4xl md:text-5xl lg:text-5xl font-black text-white block mt-2">
                                    AI DIGITAL VISION
                                </span>
                            </h2>
                            <p className="text-blue-50 text-base md:text-lg mb-12 max-w-xl mx-auto font-medium leading-relaxed">
                                Bắt đầu khám phá sức mạnh của Automation Đa Kênh. Miễn phí setup, đội ngũ chuyên gia hỗ trợ bạn từng bước.
                            </p>
                            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                                <button onClick={() => setIsFormOpen(true)} className="group w-full sm:w-auto flex items-center justify-center gap-2 md:gap-3 bg-white text-[#1E40FF] px-6 md:px-10 py-3.5 md:py-4 rounded-xl md:rounded-2xl text-sm md:text-lg font-black shadow-xl hover:-translate-y-1 hover:scale-105 transition-all duration-300">
                                    <Rocket className="w-4 h-4 md:w-5 md:h-5 text-[#1E40FF] group-hover:-translate-y-1 group-hover:translate-x-1 transition-transform" /> Đăng Ký Trải Nghiệm
                                </button>
                            </div>
                        </FadeIn>
                    </div>
                </div>
            </section>
            </main>

            {/* ── Footer ── */}
            <footer className="relative z-10 border-t border-slate-200/80 bg-white/75 backdrop-blur-md py-16 pb-24 px-6 overflow-hidden">
                <div className="max-w-7xl mx-auto">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-8">
                        <div className="md:col-span-1">
                            <div className="flex items-center gap-3 mb-5">
                                <DomationLogoMark className="w-10 h-10" />
                                <span className="text-xl font-black tracking-tight text-slate-900">
                                    DOMATION<span className="text-[#1E40FF]">.NET</span>
                                </span>
                            </div>
                            <p className="text-slate-600 text-sm leading-relaxed mb-5">Nền tảng tự động hoá marketing đa kênh. Automation flow, AI chatbot, Email Drag Drop siêu việt.</p>
                            <p className="text-xs text-slate-500">© {new Date().getFullYear()} DOMATION. All rights reserved.</p>
                        </div>
                        {[
                            { title: 'Công Cụ Marketing', links: [['#builder', 'Email Builder Kéo Thả'], ['#flow', 'Automation Flow'], ['#survey', 'Tạo Khảo Sát (Survey)'], ['#voucher', 'Smart Voucher Hub']] },
                            { title: 'Tracking & Phân Tích', links: [['#campaign-tracking', 'Web Tracking Pixel'], ['#analytics', 'Web Analytics Tracking'], ['#ai-segment', 'AI Phân Tích (Lead)'], ['#dashboard', 'Báo Cáo Tăng Trưởng']] },
                            { title: 'Trí Tuệ Nhân Tạo & Thêm', links: [['#ai', 'Chatbot Meta AI'], ['#ai-space', 'AI Workspace'], ['#features', 'Toàn Bộ Tính Năng'], ['/data#pricing', 'Bảng Giá Hệ Thống']] },
                        ].map((col) => (
                            <div key={col.title}>
                                <h3 className="text-sm font-bold text-slate-900 mb-5 uppercase tracking-wider">{col.title}</h3>
                                <ul className="space-y-3">
                                    {col.links.map(([href, l]) => (
                                        <li key={l}>
                                            <a
                                                href={href}
                                                onClick={href.startsWith('/') ? (e) => handleSpaLinkClick(e, href) : undefined}
                                                className="text-sm text-slate-600 hover:text-[#1E40FF] transition-colors duration-200"
                                            >
                                                {l}
                                            </a>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="max-w-7xl mx-auto mt-10 pt-6 border-t border-slate-200/80 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500">
                    <span>© {new Date().getFullYear()} DOMATION.NET • Marketing Automation.</span>
                    <span>
                        Powered by{' '}
                        <a
                            href="https://turnio.vercel.app/"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[#1E40FF] hover:underline font-semibold"
                        >
                            Turnio DEV
                        </a>
                    </span>
                </div>
            </footer>

            {/* Centered Scroll-to-Top Pill */}
            <button
                type="button"
                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 min-h-[44px] inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-white/95 backdrop-blur-xl border border-slate-200 shadow-[0_8px_24px_rgba(15,23,42,0.10)] text-xs font-bold text-slate-800 hover:border-blue-300 hover:text-[#1E40FF] active:scale-95 transition-all cursor-pointer"
            >
                <ArrowUp className="w-3.5 h-3.5 text-[#1E40FF]" />
                <span>Đầu trang</span>
            </button>


            {/* ── Form Modal ── */}
            <AnimatePresence>
                {isFormOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/45 backdrop-blur-sm"
                    >
                        <motion.div
                            initial={{ scale: 0.95, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.95, y: 20 }}
                            className="relative w-full max-w-lg bg-white border border-slate-200 rounded-t-[26px] sm:rounded-3xl p-5 sm:p-8 max-h-[92dvh] overflow-y-auto shadow-2xl"
                        >
                            <button
                                onClick={() => { setIsFormOpen(false); setFormStatus('idle'); }}
                                className="absolute top-3.5 right-3.5 sm:top-4 sm:right-4 w-11 h-11 sm:w-8 sm:h-8 flex items-center justify-center rounded-full bg-slate-100 hover:bg-slate-200 transition-colors text-slate-600"
                            >
                                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M13 1L1 13M1 1L13 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            </button>

                            {formStatus === 'success' ? (
                                <div className="text-center py-8">
                                    <div className="w-16 h-16 bg-gradient-to-tr from-[#1E40FF] to-[#06B6D4] rounded-full flex items-center justify-center mx-auto mb-6 shadow-md">
                                        <Check className="w-8 h-8 text-white" />
                                    </div>
                                    <h3 className="text-2xl font-black text-slate-900 mb-2">Cảm ơn bạn!</h3>
                                    <p className="text-slate-600">Thông tin đã được ghi nhận. Chuyên gia của chúng tôi sẽ liên hệ với bạn trong thời gian sớm nhất qua số Zalo để demo trực tiếp hệ thống.</p>
                                    <button onClick={() => { setIsFormOpen(false); setFormStatus('idle'); }} className="mt-8 bg-slate-100 hover:bg-slate-200 px-6 py-2.5 rounded-full text-slate-800 font-semibold transition-colors">Đóng lại</button>
                                </div>
                            ) : (
                                <div>
                                    <div className="flex items-center gap-3 mb-8 pb-6 border-b border-slate-200">
                                        <DomationLogoMark className="w-11 h-11" />
                                        <span className="text-2xl font-black tracking-tight text-slate-900">
                                            DOMATION<span className="text-[#1E40FF]">.NET</span>
                                        </span>
                                    </div>
                                    <h3 className="text-2xl font-black text-slate-900 mb-2">Đăng Ký Tư Vấn &amp; Demo</h3>
                                    <p className="text-slate-600 text-sm mb-6">Để lại thông tin để trực tiếp trải nghiệm nền tảng Marketing Automation số 1.</p>
                                    <form onSubmit={handleFormSubmit} className="space-y-4">
                                        <div>
                                            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">Email liên hệ</label>
                                            <input required name="email" type="email" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#1E40FF] focus:ring-2 focus:ring-blue-500/20 transition-colors" placeholder="name@company.com" />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">Số điện thoại (Zalo)</label>
                                            <input required name="phone" type="tel" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#1E40FF] focus:ring-2 focus:ring-blue-500/20 transition-colors" placeholder="09xx xxx xxx" />
                                        </div>
                                        <div className="flex flex-col sm:flex-row gap-3">
                                            <div className="w-full sm:w-[60%]">
                                                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">Doanh nghiệp / Dự án</label>
                                                <input required name="company" type="text" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#1E40FF] focus:ring-2 focus:ring-blue-500/20 transition-colors" placeholder="Website công ty" />
                                            </div>
                                            <div className="w-full sm:w-[40%] relative">
                                                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">Số lượng Email/tháng</label>
                                                <div
                                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 flex justify-between items-center cursor-pointer hover:border-[#1E40FF] transition-colors"
                                                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                                >
                                                    <span className="text-sm truncate">{emailVolume}</span>
                                                    <svg className={`w-4 h-4 text-slate-500 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>

                                                    {isDropdownOpen && (
                                                        <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-200 rounded-xl shadow-2xl z-50 overflow-hidden py-1">
                                                            {['100.000 Emails', '500.000 Emails', '1.000.000 Emails'].map(vol => (
                                                                <div
                                                                    key={vol}
                                                                    className="px-4 py-2.5 text-sm text-slate-700 cursor-pointer hover:bg-blue-50 hover:text-[#1E40FF] transition-colors"
                                                                    onClick={() => setEmailVolume(vol)}
                                                                >
                                                                    {vol}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">Vấn đề khó khăn &amp; Nhu cầu Automation</label>
                                            <textarea required name="problem" rows={3} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#1E40FF] focus:ring-2 focus:ring-blue-500/20 transition-colors resize-none" placeholder="Mô tả khó khăn và nhu cầu áp dụng Automation Marketing..."></textarea>
                                        </div>
                                        <button disabled={formStatus === 'submitting'} type="submit" className="w-full mt-6 btn-inkica-primary text-white font-black py-4 rounded-xl flex items-center justify-center gap-2 shadow-[0_12px_28px_rgba(30,64,255,0.26)] transition-all disabled:opacity-70">
                                            {formStatus === 'submitting' ? 'Đang gửi...' : 'Gửi Yêu Cầu Demo'}
                                            {formStatus !== 'submitting' && <ArrowRight className="w-5 h-5" />}
                                        </button>
                                    </form>

                                    <div className="mt-8 pt-6 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
                                        <span className="text-xs text-slate-500 font-medium">Hoặc liên hệ nhanh qua:</span>
                                        <div className="flex items-center gap-3">
                                            <a href="https://zalo.me/0378859736" target="_blank" rel="noreferrer" className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-50 text-[#0068FF] hover:bg-blue-100 border border-blue-200 transition-all text-sm font-bold">
                                                <img loading="lazy" decoding="async" src={LOGOS.zalo} alt="Zalo" className="w-4 h-4 object-contain" />
                                                Zalo
                                            </a>
                                            <a href="https://www.facebook.com/turni0" target="_blank" rel="noreferrer" className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-50 text-[#0866FF] hover:bg-blue-100 border border-blue-200 transition-all text-sm font-bold">
                                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.469h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.469h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" /></svg>
                                                Facebook
                                            </a>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── Demo Modal ── */}
            <AnimatePresence>
                {isDemoModalOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/45 backdrop-blur-sm overflow-y-auto"
                        onClick={(e) => {
                            if (e.target === e.currentTarget) setIsDemoModalOpen(false);
                        }}
                    >
                        <motion.div
                            initial={{ scale: 0.95, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.95, y: 20 }}
                            className="relative w-full max-w-5xl bg-white border border-slate-200 rounded-t-[26px] sm:rounded-3xl p-5 sm:p-6 md:p-10 shadow-2xl overflow-hidden max-h-[92dvh] flex flex-col"
                        >
                            <button
                                onClick={() => setIsDemoModalOpen(false)}
                                className="absolute top-3.5 right-3.5 md:top-6 md:right-6 w-11 h-11 sm:w-10 sm:h-10 flex items-center justify-center rounded-full bg-slate-100 hover:bg-slate-200 transition-colors z-50 text-slate-600"
                            >
                                <svg width="16" height="16" viewBox="0 0 14 14" fill="none" stroke="currentColor">
                                    <path d="M13 1L1 13M1 1L13 13" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            </button>

                            <div className="mb-6 md:mb-10 text-center relative z-10 shrink-0">
                                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 border border-blue-200 text-[#1E40FF] text-xs font-bold uppercase tracking-widest mb-4">
                                    <Sparkles className="w-4 h-4" /> Hệ Sinh Thái DOMATION
                                </div>
                                <h3 className="text-3xl md:text-4xl font-black text-slate-900 mb-3">Tính Năng Hệ Thống</h3>
                                <p className="text-slate-600 max-w-2xl mx-auto">Trải nghiệm toàn bộ các công cụ Digital AI Marketing Automation tiên tiến nhất được tích hợp trên cùng một nền tảng chuyên nghiệp.</p>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 relative z-10 flex-1 overflow-y-auto pr-2">
                                {ALL_MODULES.map(module => (
                                    <div key={module.id} className="group flex flex-col bg-slate-50/90 border border-slate-200 hover:border-blue-300 hover:bg-white rounded-2xl p-5 hover:-translate-y-1 hover:shadow-lg transition-all duration-300">
                                        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${module.color} flex items-center justify-center text-white mb-4 shrink-0 shadow-md`}>
                                            <module.icon className="w-6 h-6" />
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                                                <h4 className="font-bold text-slate-900 text-lg">{module.title}</h4>
                                                {module.tags && module.tags[0] && (
                                                    <span className="px-2 py-0.5 rounded bg-blue-50 border border-blue-200 text-[9px] font-bold uppercase text-[#1E40FF] whitespace-nowrap">
                                                        {module.tags[0]}
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-xs text-slate-600 leading-relaxed">{module.sub}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="mt-6 md:mt-8 pt-6 border-t border-slate-200 flex justify-center relative z-10 shrink-0">
                                <button onClick={() => { setIsDemoModalOpen(false); setIsFormOpen(true); }} className="btn-inkica-primary text-white font-bold px-8 py-3.5 rounded-xl shadow-[0_12px_28px_rgba(30,64,255,0.26)] hover:-translate-y-0.5 transition-all flex items-center gap-2">
                                    <Lock className="w-4 h-4" /> Mở Khoá Trải Nghiệm Khám Phá
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── Image Preview Modal ── */}
            <AnimatePresence>
                {previewImage && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[200] flex items-center justify-center p-4 xl:p-8 bg-slate-900/75 backdrop-blur-md"
                        onClick={() => setPreviewImage(null)}
                    >
                        <motion.button
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="absolute top-4 right-4 md:top-8 md:right-8 w-12 h-12 flex items-center justify-center rounded-full btn-inkica-primary hover:scale-110 transition-all z-50 text-white shadow-xl"
                        >
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M18 6L6 18M6 6l12 12" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                        </motion.button>
                        <motion.img
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            src={previewImage}
                            alt="Preview"
                            className="max-w-full max-h-[95vh] object-contain rounded-2xl shadow-2xl relative z-40 border border-white/20"
                            onClick={(e) => e.stopPropagation()}
                        />
                    </motion.div>
                )}
            </AnimatePresence>

            <ContactModal isOpen={showContactModal} onClose={() => setShowContactModal(false)} themeColor="blue-600" />
        </div>
    );
};

export default Landing;
