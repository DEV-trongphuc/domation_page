import React, { useEffect, useRef, useState } from 'react';
import { motion, useAnimation, useInView, AnimatePresence } from 'framer-motion';
import {
    Activity, Bot, BarChart3, TrendingUp, Network, Settings2,
    Check, ArrowRight, Target, Send, X, Play, ShieldCheck, Monitor,
    Filter, Clock, MousePointerClick, Eye, Users, Box, Calendar, LifeBuoy, Package, Users2
} from 'lucide-react';

const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

const FadeIn = ({ children, delay = 0, className = '', from = 'bottom' }: {
    children: React.ReactNode; delay?: number; className?: string; from?: 'bottom' | 'left' | 'right';
}) => {
    const controls = useAnimation();
    const ref = useRef(null);
    const inView = useInView(ref, { once: true, margin: '-40px' });
    const initial = isMobile
        ? { opacity: 0, y: 20 }
        : from === 'left' ? { opacity: 0, x: -40 } : from === 'right' ? { opacity: 0, x: 40 } : { opacity: 0, y: 30 };
    const animate = isMobile
        ? { opacity: 1, y: 0 }
        : from === 'left' || from === 'right' ? { opacity: 1, x: 0 } : { opacity: 1, y: 0 };

    useEffect(() => { if (inView) controls.start(animate); }, [controls, inView]);

    return (
        <motion.div ref={ref} animate={controls} initial={initial}
            transition={{ duration: isMobile ? 0.45 : 0.7, delay: isMobile ? delay * 0.5 : delay, ease: [0.22, 1, 0.36, 1] }}
            className={className}
            style={{ willChange: 'opacity, transform' }}>
            {children}
        </motion.div>
    );
};

export const CrmLanding: React.FC = () => {
    const [scrolled, setScrolled] = useState(false);
    const [isYearly, setIsYearly] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({ name: '', email: '', phone: '', company: '', size: '1-10', note: 'Đăng ký trải nghiệm CRM Landing' });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [previewImage, setPreviewImage] = useState<string | null>(null);

    useEffect(() => {
        window.scrollTo(0, 0);
        const handleScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const features = [
        {
            title: "Pipeline Bán Hàng",
            desc: "Theo dõi mọi Deal từ lúc tiếp cận đến khi chốt đơn thành công với giao diện Kanban.",
            icon: Target,
            gradient: "#a855f7" // purple
        },
        {
            title: "Khách Hàng 360°",
            desc: "Lưu trữ toàn bộ lịch sử tương tác, báo giá, hóa đơn của từng Contact & Company.",
            icon: Users2,
            gradient: "#3b82f6" // blue
        },
        {
            title: "Quản Lý Kho Thông Minh",
            desc: "Theo dõi số lượng tồn kho, biến động sản phẩm và quản lý nhà cung cấp chặt chẽ.",
            icon: Package,
            gradient: "#ec4899" // pink
        },
        {
            title: "Nhắc Việc & Lịch Trình",
            desc: "Không bỏ lỡ bất kỳ hoạt động nào với hệ thống Calendar và nhắc nhở Activities.",
            icon: Calendar,
            gradient: "#14b8a6" // teal
        },
        {
            title: "Báo Cáo Trực Quan",
            desc: "Dashboard thời gian thực tổng hợp doanh thu, tiến độ nhân sự và hiệu suất kinh doanh.",
            icon: BarChart3,
            gradient: "#f59e0b" // amber
        },
        {
            title: "Hỗ Trợ Tickets",
            desc: "Tiếp nhận và xử lý sự cố khách hàng nhanh chóng, phân luồng theo mức độ ưu tiên.",
            icon: LifeBuoy,
            gradient: "#8b5cf6" // violet
        }
    ];

    const gallery = [
        "/crm_imgs/CRMS (2).jpg",
        "/crm_imgs/CRMS (3).jpg",
        "/crm_imgs/CRMS (4).jpg",
        "/crm_imgs/CRM (5).jpg",
        "/crm_imgs/CRM (6).jpg",
        "/crm_imgs/CRM (7).jpg",
        "/crm_imgs/CRM (8).jpg",
        "/crm_imgs/CRM (9).jpg",
        "/crm_imgs/CRM (10).jpg",
        "/crm_imgs/CRM (11).jpg",
        "/crm_imgs/CRM (12).jpg",
        "/crm_imgs/CRM (14).jpg"
    ];

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name || !formData.email) return;

        setIsSubmitting(true);
        try {
            const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwY3J_VJN6lhGHaoJ0zNnOyYxsswyb3I1KqQ7nrdeElMZreXEKO_cigKEOEhtH-0noK/exec'; 
            
            await fetch(SCRIPT_URL, {
                method: 'POST',
                mode: 'no-cors',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...formData,
                    source: 'DOMATION CRM Landing',
                    timestamp: new Date().toLocaleString('vi-VN')
                })
            });

            setIsSuccess(true);
            setTimeout(() => {
                setShowModal(false);
                setIsSuccess(false);
                setFormData({ name: '', email: '', phone: '', company: '', size: '1-10', note: 'Đăng ký trải nghiệm CRM Landing' });
            }, 3000);
        } catch (error) {
            console.error('Submit error:', error);
            alert('Có lỗi xảy ra, vui lòng thử lại.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#080811] text-white overflow-x-hidden font-sans selection:bg-purple-500/30" style={{ scrollbarWidth: 'thin', scrollbarColor: '#a855f7 transparent' }}>
            <style>{`
                @keyframes shimmer-sweep {
                    0% { background-position: -200% center; }
                    100% { background-position: 200% center; }
                }
                .shimmer-text {
                    background: linear-gradient(90deg, #c084fc 0%, #a855f7 20%, #e879f9 40%, #c084fc 60%, #818cf8 80%, #c084fc 100%);
                    background-size: 200% auto;
                    -webkit-background-clip: text;
                    background-clip: text;
                    -webkit-text-fill-color: transparent;
                    animation: shimmer-sweep 4s linear infinite;
                }
                @keyframes float-y {
                    0%,100% { transform: translate3d(0,0px,0); }
                    50% { transform: translate3d(0,-8px,0); }
                }
                @keyframes aurora-1 {
                    0%,100% { transform: translate3d(0,0,0) scale(1); opacity:0.12; }
                    33% { transform: translate3d(8%,-12%,0) scale(1.1); opacity:0.16; }
                    66% { transform: translate3d(-5%,8%,0) scale(0.92); opacity:0.1; }
                }
                @keyframes aurora-2 {
                    0%,100% { transform: translate3d(0,0,0) scale(1); opacity:0.1; }
                    40% { transform: translate3d(-8%,8%,0) scale(1.12); opacity:0.14; }
                    70% { transform: translate3d(5%,-5%,0) scale(0.88); opacity:0.08; }
                }
                @keyframes aurora-3 {
                    0%,100% { transform: translate3d(0,0,0) scale(1); }
                    50% { transform: translate3d(10%,6%,0) scale(1.08); }
                }
            `}</style>
            
            {/* Background Animations */}
            <div className="fixed inset-0 pointer-events-none z-0" style={{ transform: 'translateZ(0)' }}>
                <div className="absolute top-[-25%] left-[-15%] w-[70%] h-[70%] rounded-full bg-purple-600/[0.12] blur-[120px] md:blur-[160px]" style={{ animation: 'aurora-1 18s ease-in-out infinite' }} />
                <div className="absolute top-[5%] right-[-20%] w-[60%] h-[60%] rounded-full bg-fuchsia-600/[0.1] blur-[120px] md:blur-[160px]" style={{ animation: 'aurora-2 24s ease-in-out infinite' }} />
                <div className="absolute bottom-[-5%] left-[15%] w-[50%] h-[50%] rounded-full bg-indigo-600/[0.08] blur-[100px] md:blur-[140px]" style={{ animation: 'aurora-3 30s ease-in-out infinite' }} />
                <div className="hidden md:block absolute inset-0 opacity-[0.035]" style={{
                    backgroundImage: 'linear-gradient(rgba(255,255,255,1) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,1) 1px,transparent 1px)',
                    backgroundSize: '60px 60px'
                }} />
            </div>

            {/* Navigation */}
            <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-[#080811]/90 backdrop-blur-xl border-b border-white/5' : 'bg-transparent'}`}>
                <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
                    <a href="/" className="flex items-center space-x-3 group">
                        <div className="relative" style={{ animation: 'float-y 6s ease-in-out infinite' }}>
                            <img loading="lazy" decoding="async" src="https://crm-domation.vercel.app/LOGO.jpg" alt="DOMATION Logo" className="w-10 h-10 object-contain rounded-[14px] shadow-lg shadow-purple-500/30 group-hover:scale-105 transition-transform" />
                            <div className="absolute -inset-1 rounded-[18px] bg-purple-500/20 blur-md -z-10" />
                        </div>
                        <span className="text-xl font-black tracking-tight shimmer-text">
                            DOMATION
                        </span>
                    </a>
                    <div className="flex items-center gap-2">
                        <a href="/automation" className="hidden md:flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold text-amber-400 border border-amber-500/30 hover:bg-amber-500/10 hover:-translate-y-0.5 transition-all duration-300">
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
                            Marketing Automation
                        </a>
                        <a href="/meta-report" className="hidden md:flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold text-orange-400 border border-orange-500/30 hover:bg-orange-500/10 hover:-translate-y-0.5 transition-all duration-300">
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
                            Meta-Report
                        </a>
                        <button onClick={() => setShowModal(true)} className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold text-slate-300 border border-white/10 hover:border-purple-500/40 hover:bg-purple-500/5 hover:-translate-y-0.5 transition-all duration-300">
                            Nhận Báo Giá
                        </button>
                        <a href="https://crm-domation.vercel.app/" target="_blank" rel="noreferrer" className="flex items-center gap-2 bg-gradient-to-r from-purple-500 to-fuchsia-600 text-white px-5 py-2.5 rounded-full text-sm font-black hover:-translate-y-0.5 transition-transform duration-300 shadow-[0_0_15px_rgba(168,85,247,0.4)]">
                            Demo CRM
                        </a>
                    </div>
                </div>
            </nav>

            <main className="relative pt-32 pb-24 md:pb-20 px-4 md:px-6 z-10 w-full">
                <div className="max-w-6xl mx-auto">
                    {/* Hero Section */}
                    <div className="text-center mb-20 md:mb-28">
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-[#11111a]/80 border border-purple-500/30 text-purple-400 text-[10px] md:text-xs font-bold uppercase tracking-widest mb-8 backdrop-blur-md shadow-[0_0_20px_rgba(168,85,247,0.1)]">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div> ENTERPRISE CRM 🚀
                        </motion.div>
                        <motion.h2 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="text-xl md:text-3xl font-black text-white uppercase tracking-[0.25em] mb-2 md:mb-4">
                            HỆ THỐNG QUẢN TRỊ
                        </motion.h2>
                        <motion.h1 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="text-5xl md:text-7xl lg:text-[6rem] font-black uppercase mb-8 leading-[1.1] tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-purple-300 via-fuchsia-400 to-purple-600 drop-shadow-[0_0_30px_rgba(168,85,247,0.4)]" style={{ animation: 'shimmer-sweep 4s linear infinite', backgroundSize: '200% auto' }}>
                            DOANH NGHIỆP 4.0
                        </motion.h1>
                        <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="text-slate-400 text-sm md:text-lg max-w-3xl mx-auto leading-relaxed mb-10">
                            Số hóa toàn diện quy trình làm việc. Từ Sales Pipeline, quản lý khách hàng (CRM), tồn kho (Inventory) đến Ticket hỗ trợ, giúp doanh nghiệp vận hành trơn tru trên một nền tảng duy nhất.
                        </motion.p>

                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="flex flex-col sm:flex-row items-center justify-center gap-4 flex-wrap mb-16">
                            <a href="https://crm-domation.vercel.app/" target="_blank" rel="noreferrer" className="w-full sm:w-auto flex items-center justify-center gap-2 bg-gradient-to-r from-purple-500 to-fuchsia-600 text-white px-8 py-4 rounded-2xl text-sm md:text-base font-black hover:-translate-y-1 transition-transform duration-300 shadow-[0_0_30px_rgba(168,85,247,0.3)]">
                                Trải nghiệm ngay <ArrowRight className="w-4 h-4" />
                            </a>
                            <button onClick={() => setShowModal(true)} className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-4 rounded-2xl text-sm md:text-base font-bold text-slate-300 bg-[#11111a] border border-white/10 hover:border-purple-500/40 hover:bg-white/5 hover:-translate-y-0.5 transition-all duration-300">
                                Xem báo giá chi tiết
                            </button>
                        </motion.div>

                        <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5, duration: 0.8 }} className="relative mx-auto rounded-[32px] p-px bg-gradient-to-b from-purple-500/30 to-transparent">
                            <div className="rounded-[31px] overflow-hidden bg-[#0a0a0f] border border-white/5 relative group">
                                <div className="absolute inset-0 bg-gradient-to-t from-[#080811]/80 to-transparent z-10 pointer-events-none" />
                                <img src="/crm_imgs/CRMS (1).jpg" alt="CRM Hero Dashboard" className="w-full h-auto rounded-[31px] shadow-2xl scale-[1.01] group-hover:scale-[1.03] transition-transform duration-700" />
                            </div>
                        </motion.div>
                    </div>

                    {/* Features Grid */}
                    <div className="mb-24 mt-20">
                        <FadeIn className="text-center mb-12">
                            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-xs font-bold uppercase tracking-widest mb-4">
                                Module Linh Hoạt
                            </div>
                            <h2 className="text-3xl md:text-4xl font-black text-white mb-4">Giải Pháp Quản Trị Đa Điểm Chạm</h2>
                            <p className="text-slate-400 max-w-2xl mx-auto">Tất cả những gì bạn cần để số hóa quy trình kinh doanh, không còn phải dùng rải rác nhiều phần mềm.</p>
                        </FadeIn>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {features.map((feat, idx) => (
                                <FadeIn key={idx} delay={idx * 0.1} className="h-full">
                                    <div className="relative rounded-[20px] p-px bg-white/5 hover:bg-white/10 transition-all duration-500 group h-full">
                                        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-[20px]"
                                            style={{ background: `radial-gradient(400px circle at bottom right, ${feat.gradient}15, transparent 70%)` }} />

                                        <div className="relative bg-[#11111a]/80 backdrop-blur-sm rounded-[19px] p-6 lg:p-8 flex flex-col h-full border border-white/5">
                                            <div className="w-12 h-12 rounded-xl mb-6 flex items-center justify-center" style={{ backgroundColor: `${feat.gradient}15`, border: `1px solid ${feat.gradient}30` }}>
                                                <feat.icon className="w-6 h-6" style={{ color: feat.gradient }} />
                                            </div>
                                            <h3 className="text-xl font-bold text-white mb-3 leading-tight">{feat.title}</h3>
                                            <p className="text-sm text-slate-400 leading-relaxed flex-1">{feat.desc}</p>
                                        </div>
                                    </div>
                                </FadeIn>
                            ))}
                        </div>
                    </div>

                    {/* Deep Dive 1: Sales & Pipeline */}
                    <div className="mb-24">
                        <div className="bg-gradient-to-br from-purple-500/10 to-[#080811] border border-purple-500/20 rounded-[32px] p-8 md:p-12 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/10 blur-[80px] rounded-full pointer-events-none" />

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center relative z-10">
                                <div>
                                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-500/20 border border-purple-500/30 text-purple-400 text-xs font-bold uppercase tracking-widest mb-6">
                                        <Target className="w-3.5 h-3.5" /> Quản Lý Doanh Số Tối Đa
                                    </div>
                                    <h2 className="text-3xl md:text-4xl font-black text-white mb-6 leading-tight">
                                        Tăng Tỷ Lệ Chốt Sale Với Kanban Pipeline
                                    </h2>
                                    <p className="text-slate-300 text-base md:text-lg mb-8 leading-relaxed">
                                        Theo dõi hàng trăm thương vụ (Deals) cùng lúc mà không bị sót. Giao diện trực quan kéo thả giúp Sales Manager nắm bắt dòng tiền dự kiến ngay tức thì.
                                    </p>
                                    <ul className="space-y-4 mb-8">
                                        {[
                                            "Tự động tạo báo giá (Quotes) chuyên nghiệp chỉ trong 2 click",
                                            "Kết nối trực tiếp Contact và Company vào mỗi Deal",
                                            "Nhắc nhở tự động khi có Deal đến hạn (Deadlines)"
                                        ].map((pain, idx) => (
                                            <li key={idx} className="flex items-start gap-3">
                                                <div className="w-6 h-6 rounded-full bg-purple-500/20 border border-purple-500/40 flex items-center justify-center shrink-0 mt-0.5">
                                                    <Check className="w-3.5 h-3.5 text-purple-400" />
                                                </div>
                                                <span className="text-slate-300 font-medium">{pain}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                                <div className="relative group cursor-pointer" onClick={() => setPreviewImage('/crm_imgs/CRMS (2).jpg')}>
                                    <div className="absolute inset-0 bg-gradient-to-tr from-purple-500/20 to-indigo-500/20 rounded-[24px] blur-xl group-hover:blur-2xl transition-all duration-500" />
                                    <div className="relative rounded-[24px] overflow-hidden border border-white/10 shadow-2xl bg-[#080811]">
                                        <img src="/crm_imgs/CRMS (2).jpg" alt="Kanban Pipeline" className="w-full h-auto object-cover group-hover:scale-105 transition-transform duration-700" />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent z-10 opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center pb-6">
                                            <div className="flex items-center gap-2 text-white font-bold text-sm bg-white/10 backdrop-blur-md px-4 py-2 rounded-full border border-white/20">
                                                <Eye className="w-4 h-4 text-purple-400" /> Phóng to
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Deep Dive 2: Inventory & Products */}
                    <div className="mb-24">
                        <FadeIn className="bg-[#0b0c16] border border-white/5 rounded-[32px] p-8 md:p-12 relative overflow-hidden group">
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center relative z-10">
                                <div className="order-2 lg:order-1 relative cursor-pointer" onClick={() => setPreviewImage('/crm_imgs/CRM (11).jpg')}>
                                    <div className="absolute inset-0 bg-gradient-to-br from-fuchsia-500/20 to-pink-500/20 rounded-[24px] blur-xl group-hover:blur-2xl transition-all duration-500" />
                                    <div className="relative rounded-[24px] overflow-hidden border border-white/10 shadow-2xl bg-[#080811]">
                                        <img src="/crm_imgs/CRM (11).jpg" alt="Inventory Management" className="w-full h-auto object-cover group-hover:scale-105 transition-transform duration-700" />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent z-10 opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center pb-6">
                                            <div className="flex items-center gap-2 text-white font-bold text-sm bg-white/10 backdrop-blur-md px-4 py-2 rounded-full border border-white/20">
                                                <Eye className="w-4 h-4 text-fuchsia-400" /> Phóng to
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="order-1 lg:order-2">
                                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-fuchsia-500/20 border border-fuchsia-500/30 text-fuchsia-400 text-xs font-bold uppercase tracking-widest mb-6">
                                        <Box className="w-3.5 h-3.5" /> Quản Lý Kho Tiên Tiến
                                    </div>
                                    <h2 className="text-3xl md:text-4xl font-black text-white mb-6 leading-tight">
                                        Kiểm Soát Tồn Kho Theo Thời Gian Thực
                                    </h2>
                                    <p className="text-slate-300 text-base md:text-lg mb-8 leading-relaxed">
                                        Hệ thống quản lý sản phẩm (Products), tồn kho (Inventory) kết nối đồng bộ với đơn hàng (Invoices). Tránh tình trạng hụt hàng hoặc thất thoát không đáng có.
                                    </p>
                                    <div className="space-y-4">
                                        <div className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
                                            <h4 className="font-bold text-white mb-1">Kiểm Kê Sản Phẩm Tự Động</h4>
                                            <p className="text-sm text-slate-400">Tự động trừ kho khi xuất Invoice. Có hệ thống định mức tối thiểu cảnh báo cần nhập hàng từ Suppliers.</p>
                                        </div>
                                        <div className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
                                            <h4 className="font-bold text-white mb-1">Theo Dõi Thu Chi (Expenses)</h4>
                                            <p className="text-sm text-slate-400">Ghi nhận mọi khoản chi phí công ty, giúp tính toán Profit Margin chuẩn xác tới từng đồng.</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </FadeIn>
                    </div>

                    {/* Gallery Section */}
                    <div className="mb-24">
                        <FadeIn className="text-center mb-12">
                            <h2 className="text-3xl md:text-4xl font-black text-white mb-4">Mọi Chức Năng Hội Tụ Màn Hình</h2>
                            <p className="text-slate-400 max-w-2xl mx-auto">Click để xem chi tiết từng module được thiết kế với chuẩn UI/UX tối ưu cho khối lượng dữ liệu lớn.</p>
                        </FadeIn>

                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                            {gallery.map((img, idx) => (
                                <FadeIn key={idx} delay={idx * 0.05}>
                                    <div className="group relative rounded-xl overflow-hidden border border-white/10 aspect-video bg-[#11111a] cursor-pointer shadow-lg" onClick={() => setPreviewImage(img)}>
                                        <div className="absolute inset-0 bg-purple-900/40 z-10 opacity-0 group-hover:opacity-100 transition-opacity mix-blend-overlay" />
                                        <div className="absolute inset-0 flex items-center justify-center z-20 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <div className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20">
                                                <Eye className="w-5 h-5 text-white" />
                                            </div>
                                        </div>
                                        <img src={img} alt={`CRM Screenshot ${idx + 1}`} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" loading="lazy" />
                                    </div>
                                </FadeIn>
                            ))}
                        </div>
                    </div>

                    {/* Pricing Section (Báo giá) */}
                    <div className="max-w-5xl mx-auto mb-20" id="pricing">
                        <FadeIn className="text-center mb-12">
                            <h2 className="text-3xl md:text-4xl font-black text-white mb-4">Bảng Báo Giá DOMATION CRM</h2>
                            <p className="text-slate-400 max-w-2xl mx-auto">Chọn giải pháp phù hợp với quy mô doanh nghiệp của bạn. Không giới hạn tính năng cơ bản, chỉ tính phí dựa trên số người dùng (Users).</p>
                        </FadeIn>

                        {/* Toggle */}
                        <div className="flex items-center justify-center gap-4 mb-10">
                            <span className={`text-sm font-bold transition-colors ${!isYearly ? 'text-white' : 'text-slate-400'}`}>
                                Theo Tháng
                            </span>
                            <button
                                onClick={() => setIsYearly(!isYearly)}
                                className="relative w-14 h-7 bg-white/5 border border-white/10 rounded-full transition-colors focus:outline-none cursor-pointer hover:bg-white/10"
                            >
                                <div className={`absolute top-1/2 -translate-y-1/2 left-1 w-5 h-5 rounded-full bg-gradient-to-r from-purple-500 to-fuchsia-500 transition-transform duration-300 shadow-[0_0_10px_rgba(168,85,247,0.5)] ${isYearly ? 'translate-x-7' : 'translate-x-0'}`} />
                            </button>
                            <div className="flex items-center gap-2">
                                <span className={`text-sm font-bold transition-colors ${isYearly ? 'text-white' : 'text-slate-400'}`}>
                                    Theo Năm
                                </span>
                                <span className="bg-purple-500/10 text-purple-400 text-[10px] font-bold px-2 py-0.5 rounded border border-purple-500/20">
                                    ƯU ĐÃI 20%
                                </span>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            {/* Starter */}
                            <FadeIn delay={0.1}>
                                <div className="bg-[#11111a] rounded-[24px] p-8 border border-white/10 h-full flex flex-col hover:border-purple-500/30 transition-colors">
                                    <h3 className="text-xl font-bold text-white mb-2">Starter</h3>
                                    <p className="text-slate-400 text-sm mb-6">Phù hợp đội nhóm kinh doanh nhỏ dưới 5 người.</p>
                                    <div className="mb-6">
                                        <span className="text-4xl font-black text-white">{isYearly ? "250K" : "300K"}</span>
                                        <span className="text-slate-500 text-sm">/user/tháng</span>
                                    </div>
                                    <ul className="space-y-4 mb-8 flex-1">
                                        {["Quản lý Khách hàng & Công ty", "Sales Pipeline & Kanban", "Calendar & Nhắc việc", "Báo cáo doanh thu cơ bản", "Hỗ trợ giờ hành chính"].map((item, i) => (
                                            <li key={i} className="flex items-start gap-3 text-sm text-slate-300">
                                                <Check className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" /> {item}
                                            </li>
                                        ))}
                                    </ul>
                                    <button onClick={() => setShowModal(true)} className="w-full py-3 rounded-xl border border-white/10 text-white font-bold hover:bg-white/5 transition-colors">
                                        Bắt đầu ngay
                                    </button>
                                </div>
                            </FadeIn>

                            {/* Professional (Highlighted) */}
                            <FadeIn delay={0.2} className="relative">
                                <div className="absolute inset-0 bg-gradient-to-b from-purple-500 to-fuchsia-600 rounded-[24px] blur-lg opacity-40 pointer-events-none" />
                                <div className="relative bg-gradient-to-b from-[#1a142c] to-[#11111a] rounded-[24px] p-8 border border-purple-500/50 h-full flex flex-col shadow-[0_0_30px_rgba(168,85,247,0.2)]">
                                    <div className="absolute top-0 right-0 bg-purple-500 text-white text-[10px] font-bold px-3 py-1 rounded-bl-xl rounded-tr-[23px] uppercase tracking-wider">
                                        Phổ biến nhất
                                    </div>
                                    <h3 className="text-xl font-bold text-purple-400 mb-2">Professional</h3>
                                    <p className="text-slate-400 text-sm mb-6">Cho doanh nghiệp SMB cần vận hành chuyên sâu.</p>
                                    <div className="mb-6">
                                        <span className="text-4xl font-black text-white">{isYearly ? "450K" : "550K"}</span>
                                        <span className="text-slate-500 text-sm">/user/tháng</span>
                                    </div>
                                    <ul className="space-y-4 mb-8 flex-1">
                                        {["Mọi tính năng của Starter", "Quản lý Sản phẩm & Tồn kho", "Tạo Báo giá (Quotes) & Hóa đơn", "Quản lý Support Tickets", "Dashboard phân tích chi tiết", "Phân quyền Role đa cấp độ"].map((item, i) => (
                                            <li key={i} className="flex items-start gap-3 text-sm text-slate-300">
                                                <Check className="w-4 h-4 text-fuchsia-400 shrink-0 mt-0.5" /> {item}
                                            </li>
                                        ))}
                                    </ul>
                                    <button onClick={() => setShowModal(true)} className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-500 to-fuchsia-600 text-white font-black hover:opacity-90 transition-opacity shadow-[0_0_15px_rgba(168,85,247,0.4)]">
                                        Đăng ký Professional
                                    </button>
                                </div>
                            </FadeIn>

                            {/* Enterprise */}
                            <FadeIn delay={0.3}>
                                <div className="bg-[#11111a] rounded-[24px] p-8 border border-white/10 h-full flex flex-col hover:border-purple-500/30 transition-colors">
                                    <h3 className="text-xl font-bold text-white mb-2">Enterprise</h3>
                                    <p className="text-slate-400 text-sm mb-6">Giải pháp tùy chỉnh riêng cho tập đoàn lớn.</p>
                                    <div className="mb-6">
                                        <span className="text-3xl font-black text-white">Liên hệ</span>
                                    </div>
                                    <ul className="space-y-4 mb-8 flex-1">
                                        {["Triển khai trên Private Server", "Tính năng code theo yêu cầu", "Tích hợp API phần mềm thứ 3", "Tự động hóa luồng phức tạp", "Account Manager hỗ trợ 1-1", "Bảo mật SLA cấp cao"].map((item, i) => (
                                            <li key={i} className="flex items-start gap-3 text-sm text-slate-300">
                                                <Check className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" /> {item}
                                            </li>
                                        ))}
                                    </ul>
                                    <button onClick={() => setShowModal(true)} className="w-full py-3 rounded-xl border border-white/10 text-white font-bold hover:bg-white/5 transition-colors">
                                        Nhận tư vấn riêng
                                    </button>
                                </div>
                            </FadeIn>
                        </div>
                    </div>
                </div>
            </main>

            {/* Footer */}
            <footer className="border-t border-white/10 py-12 px-6 bg-[#040408] relative z-10 text-center">
                <div className="flex items-center justify-center space-x-2 mb-4">
                    <img src="https://crm-domation.vercel.app/LOGO.jpg" alt="DOMATION" className="w-6 h-6 object-contain rounded opacity-50 grayscale" />
                    <span className="text-lg font-black tracking-widest text-white/30 uppercase">DOMATION CRM</span>
                </div>
                <p className="text-slate-600 text-sm font-medium">© {new Date().getFullYear()} Nền tảng số hóa doanh nghiệp toàn diện.</p>
            </footer>

            {/* Request Modal */}
            <AnimatePresence>
                {showModal && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-[#080811]/80 backdrop-blur-sm"
                            onClick={() => !isSubmitting && setShowModal(false)}
                        />

                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="relative w-full max-w-lg bg-[#0d0d16] rounded-3xl border border-white/10 overflow-hidden shadow-[0_0_80px_rgba(168,85,247,0.15)] z-10"
                        >
                            <div className="p-6 md:p-8">
                                <div className="flex items-start justify-between mb-6">
                                    <div>
                                        <h3 className="text-2xl font-black text-white mb-1">Đăng Ký Tư Vấn CRM</h3>
                                        <p className="text-slate-400 text-sm">Điền thông tin để trải nghiệm giải pháp số hóa toàn diện.</p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setShowModal(false)}
                                        className="p-2 bg-white/5 hover:bg-white/10 rounded-full transition-colors cursor-pointer"
                                    >
                                        <X className="w-5 h-5 text-slate-400" />
                                    </button>
                                </div>

                                {isSuccess ? (
                                    <div className="py-12 flex flex-col items-center text-center">
                                        <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mb-4">
                                            <Check className="w-8 h-8 text-emerald-400" />
                                        </div>
                                        <h4 className="text-xl font-bold text-white mb-2">Gửi thành công!</h4>
                                        <p className="text-slate-400">Chuyên viên tư vấn DOMATION sẽ liên hệ với bạn trong vòng 2h.</p>
                                    </div>
                                ) : (
                                    <form onSubmit={handleSubmit} className="space-y-4">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Họ và tên <span className="text-rose-500">*</span></label>
                                                <input
                                                    required
                                                    value={formData.name}
                                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-slate-600 focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/50 transition-all"
                                                    placeholder="Nguyễn Văn A"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Số điện thoại</label>
                                                <input
                                                    type="tel"
                                                    value={formData.phone}
                                                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-slate-600 focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/50 transition-all"
                                                    placeholder="09xx xxx xxx"
                                                />
                                            </div>
                                            <div className="md:col-span-2">
                                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Email doanh nghiệp <span className="text-rose-500">*</span></label>
                                                <input
                                                    type="email"
                                                    required
                                                    value={formData.email}
                                                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-slate-600 focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/50 transition-all"
                                                    placeholder="example@business.com"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Tên doanh nghiệp</label>
                                                <input
                                                    value={formData.company}
                                                    onChange={e => setFormData({ ...formData, company: e.target.value })}
                                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-slate-600 focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/50 transition-all"
                                                    placeholder="Tên công ty của bạn..."
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Quy mô nhân sự</label>
                                                <select
                                                    value={formData.size}
                                                    onChange={e => setFormData({ ...formData, size: e.target.value })}
                                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-slate-600 focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/50 transition-all appearance-none"
                                                >
                                                    <option value="1-10" className="bg-[#0d0d16]">Dưới 10 nhân sự</option>
                                                    <option value="11-50" className="bg-[#0d0d16]">Từ 11 - 50 nhân sự</option>
                                                    <option value="51-200" className="bg-[#0d0d16]">Từ 51 - 200 nhân sự</option>
                                                    <option value="200+" className="bg-[#0d0d16]">Trên 200 nhân sự</option>
                                                </select>
                                            </div>
                                        </div>

                                        <button
                                            type="submit"
                                            disabled={isSubmitting}
                                            className="w-full bg-gradient-to-r from-purple-500 to-fuchsia-600 text-white font-black py-4 rounded-xl mt-4 flex items-center justify-center gap-2 hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
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
                    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm" onClick={() => setPreviewImage(null)}>
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="relative w-full max-w-6xl max-h-[90vh] flex items-center justify-center"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <button onClick={() => setPreviewImage(null)} className="absolute -top-12 right-0 p-2 text-white/70 hover:text-white transition-colors cursor-pointer">
                                <X className="w-8 h-8" />
                            </button>
                            <img src={previewImage} alt="Preview" className="w-full h-full object-contain rounded-2xl shadow-2xl" />
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};
