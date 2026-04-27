import React, { useEffect, useRef, useState } from 'react';
import { motion, useAnimation, useInView, AnimatePresence } from 'framer-motion';
import {
    Activity, Bot, BarChart3, TrendingUp, Network, Settings2,
    Check, ArrowRight, Zap, Target, Send, X, Play, ShieldCheck, Monitor,
    Filter, Clock, MousePointerClick, Eye, Users
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

export const MetaAdReport: React.FC = () => {
    const [scrolled, setScrolled] = useState(false);
    const [isYearly, setIsYearly] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({ email: '', phone: '', message: '' });
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
            title: "Realtime Tracking",
            desc: "Cập nhật chỉ số chiến dịch quảng cáo theo thời gian thực",
            icon: Activity,
            gradient: "#f59e0b" // amber
        },
        {
            title: "AI Phân Tích",
            desc: "Tích hợp AI dự báo, đánh giá hiệu quả và đề xuất tối ưu Ads",
            icon: Bot,
            gradient: "#3b82f6" // blue
        },
        {
            title: "Báo Cáo Trực Quan",
            desc: "Hệ thống Dashboard biểu đồ hiển thị ROI, CPA, ROAS rõ ràng",
            icon: BarChart3,
            gradient: "#ec4899" // pink
        },
        {
            title: "Dự Đoán Xu Hướng",
            desc: "Học máy (Machine Learning) dự báo xu hướng chi phí và chuyển đổi",
            icon: TrendingUp,
            gradient: "#14b8a6" // teal
        },
        {
            title: "Đồng Bộ API",
            desc: "Kết nối trực tiếp Meta Ads API đảm bảo dữ liệu chính xác 100%",
            icon: Network,
            gradient: "#8b5cf6" // purple
        },
        {
            title: "Tự Động Hóa Quản Trị",
            desc: "Ngắt/Bật Ads tự động dựa trên quy tắc thông minh, chống lãng phí",
            icon: Settings2,
            gradient: "#ef4444" // red
        }
    ];

    const gallery = [
        "https://portfo-turnio.vercel.app/assets/dom_rp%20(1)-z9-_yBNr.jpg",
        "https://portfo-turnio.vercel.app/assets/dom_rp%20(2)-CMkJ9oWy.jpg",
        "https://portfo-turnio.vercel.app/assets/dom_rp%20(3)-QpcZBQYW.jpg",
        "https://portfo-turnio.vercel.app/assets/dom_rp%20(4)-C7VhGmXk.jpg",
        "https://portfo-turnio.vercel.app/assets/dom_rp%20(5)-DERnmrih.jpg",
        "https://portfo-turnio.vercel.app/assets/dom_rp%20(6)-CDWL6ejy.jpg"
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
        <div className="min-h-screen bg-[#080c14] text-white overflow-x-hidden font-sans selection:bg-amber-500/30" style={{ scrollbarWidth: 'thin', scrollbarColor: '#f59e0b transparent' }}>
            {/* Background Animations */}
            <div className="fixed inset-0 pointer-events-none z-0" style={{ transform: 'translateZ(0)' }}>
                <div className="absolute top-[-25%] left-[-15%] w-[70%] h-[70%] rounded-full bg-amber-500/[0.12] blur-[120px] md:blur-[160px]" style={{ animation: 'aurora-1 18s ease-in-out infinite' }} />
                <div className="absolute top-[5%] right-[-20%] w-[60%] h-[60%] rounded-full bg-orange-600/[0.1] blur-[120px] md:blur-[160px]" style={{ animation: 'aurora-2 24s ease-in-out infinite' }} />
                <div className="absolute bottom-[-5%] left-[15%] w-[50%] h-[50%] rounded-full bg-rose-600/[0.08] blur-[100px] md:blur-[140px]" style={{ animation: 'aurora-3 30s ease-in-out infinite' }} />
                <div className="hidden md:block absolute inset-0 opacity-[0.035]" style={{
                    backgroundImage: 'linear-gradient(rgba(255,255,255,1) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,1) 1px,transparent 1px)',
                    backgroundSize: '60px 60px'
                }} />
            </div>

            {/* Navigation */}
            <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-[#080c14]/90 backdrop-blur-xl border-b border-white/5' : 'bg-transparent'}`}>
                <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
                    <a href="/" className="flex items-center space-x-3 group">
                        <div className="relative" style={{ animation: 'float-y 6s ease-in-out infinite' }}>
                            <img loading="lazy" decoding="async" src="/imgs/ICON.png" alt="DOMATION Logo" className="w-10 h-10 object-contain rounded-[14px] shadow-lg shadow-amber-500/30 group-hover:scale-105 transition-transform" />
                            <div className="absolute -inset-1 rounded-[18px] bg-amber-500/20 blur-md -z-10" />
                        </div>
                        <span className="text-xl font-black tracking-tight text-white group-hover:text-amber-400 transition-colors">
                            DOMATION
                        </span>
                    </a>
                    <div className="flex items-center space-x-3">
                        <button onClick={() => setShowModal(true)} className="flex items-center gap-2 bg-gradient-to-r from-amber-400 to-orange-500 text-slate-900 px-5 py-2.5 rounded-full text-sm font-black hover:-translate-y-0.5 transition-transform duration-300 shadow-[0_0_15px_rgba(245,158,11,0.4)]">
                            Đăng Ký Trải Nghiệm
                        </button>
                    </div>
                </div>
            </nav>

            <main className="relative pt-32 pb-24 md:pb-20 px-4 md:px-6 z-10 w-full">
                <div className="max-w-6xl mx-auto">
                    {/* Hero Section */}
                    <div className="text-center mb-20 md:mb-28">
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-bold uppercase tracking-widest mb-6 backdrop-blur-md">
                            <Activity className="w-3.5 h-3.5" /> Meta Ads Realtime Report
                        </motion.div>
                        <motion.h1 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="text-4xl md:text-6xl lg:text-7xl font-black text-white mb-6 leading-tight tracking-tight">
                            Hệ Thống Báo Cáo <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-400" style={{ animation: 'shimmer-sweep 4s linear infinite', backgroundSize: '200% auto' }}>Hiệu Suất Meta Ads</span>
                        </motion.h1>
                        <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="text-slate-400 text-lg md:text-xl max-w-3xl mx-auto leading-relaxed mb-10">
                            Tích hợp AI phân tích dữ liệu chuyên sâu, hỗ trợ ra quyết định Scale hay Vít ngân sách dựa trên thời gian thực.
                        </motion.p>

                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="flex flex-col sm:flex-row items-center justify-center gap-4">
                            <a href="https://meta.domation.net" target="_blank" rel="noreferrer" className="w-full sm:w-auto flex items-center justify-center gap-2 bg-gradient-to-r from-amber-400 to-orange-500 text-slate-900 px-8 py-4 rounded-xl text-base font-black hover:-translate-y-1 transition-transform duration-300 shadow-[0_0_30px_rgba(245,158,11,0.3)]">
                                Dùng Thử Ngay <ArrowRight className="w-4 h-4" />
                            </a>
                            <button onClick={() => setShowModal(true)} className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-4 rounded-xl text-base font-bold text-slate-300 border border-white/10 hover:border-amber-500/40 hover:bg-amber-500/5 hover:-translate-y-0.5 transition-all duration-300">
                                Nhận Tư Vấn
                            </button>
                        </motion.div>
                    </div>

                    {/* Gallery Section */}
                    <div className="mb-24">
                        <FadeIn className="text-center mb-12">
                            <h2 className="text-3xl md:text-4xl font-black text-white mb-4">Giao Diện Dashboard</h2>
                            <p className="text-slate-400 max-w-2xl mx-auto">Hệ thống báo cáo trực quan, theo dõi mọi chỉ số ngay trong một màn hình.</p>
                        </FadeIn>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {gallery.map((img, idx) => (
                                <FadeIn key={idx} delay={idx * 0.1}>
                                    <div className="group relative rounded-2xl overflow-hidden border border-white/10 aspect-[4/3] bg-[#161b22] cursor-pointer" onClick={() => setPreviewImage(img)}>
                                        <div className="absolute inset-0 bg-gradient-to-t from-[#080c14]/80 to-transparent z-10 opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                                            <div className="flex items-center gap-2 text-white font-bold text-sm">
                                                <Target className="w-4 h-4 text-amber-400" /> Xem chi tiết
                                            </div>
                                        </div>
                                        <img src={img} alt={`Dashboard Screenshot ${idx + 1}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" loading="lazy" />
                                    </div>
                                </FadeIn>
                            ))}
                        </div>
                    </div>

                    {/* Features Grid */}
                    <div className="mb-24">
                        <FadeIn className="text-center mb-12">
                            <h2 className="text-3xl md:text-4xl font-black text-white mb-4">Giải Pháp Tối Ưu Quản Trị Quảng Cáo</h2>
                            <p className="text-slate-400 max-w-2xl mx-auto">Kiểm soát chi phí, gia tăng tỷ lệ chuyển đổi và ra quyết định tức thời với sự hỗ trợ từ AI.</p>
                        </FadeIn>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {features.map((feat, idx) => (
                                <FadeIn key={idx} delay={idx * 0.1} className="h-full">
                                    <div className="relative rounded-[20px] p-px bg-white/5 hover:bg-white/10 transition-all duration-500 group h-full">
                                        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-[20px]"
                                            style={{ background: `radial-gradient(400px circle at bottom right, ${feat.gradient}15, transparent 70%)` }} />

                                        <div className="relative bg-[#161b22]/80 backdrop-blur-sm rounded-[19px] p-6 lg:p-8 flex flex-col h-full border border-white/5">
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

                    {/* Admin Log & Pain Points */}
                    <div className="mb-24">
                        <div className="bg-gradient-to-br from-rose-500/10 to-[#080c14] border border-rose-500/20 rounded-[32px] p-8 md:p-12 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-rose-500/10 blur-[80px] rounded-full pointer-events-none" />

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center relative z-10">
                                <div>
                                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-rose-500/20 border border-rose-500/30 text-rose-400 text-xs font-bold uppercase tracking-widest mb-6">
                                        <ShieldCheck className="w-3.5 h-3.5" /> Giải Quyết Nỗi Đau Doanh Nghiệp
                                    </div>
                                    <h2 className="text-3xl md:text-4xl font-black text-white mb-6 leading-tight">
                                        Mất Kiểm Soát Tài Khoản Quảng Cáo?
                                    </h2>
                                    <p className="text-slate-300 text-base md:text-lg mb-8 leading-relaxed">
                                        Bạn là chủ doanh nghiệp hay đang thuế Agency chạy trên BM, nhưng lại <strong className="text-rose-400">không thể kiểm soát</strong> được:
                                    </p>
                                    <ul className="space-y-4 mb-8">
                                        {[
                                            "Ai đã vào sửa tệp khách hàng (Target Audience) của bạn?",
                                            "Admin nào vừa tắt/bật chiến dịch giữa đêm gây lãng phí ngân sách?",
                                            "Thay đổi nội dung, ngân sách lúc nào và do ai thực hiện?"
                                        ].map((pain, idx) => (
                                            <li key={idx} className="flex items-start gap-3">
                                                <div className="w-6 h-6 rounded-full bg-rose-500/20 border border-rose-500/40 flex items-center justify-center shrink-0 mt-0.5">
                                                    <X className="w-3.5 h-3.5 text-rose-400" />
                                                </div>
                                                <span className="text-slate-300 font-medium">{pain}</span>
                                            </li>
                                        ))}
                                    </ul>
                                    <div className="p-5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
                                        <div className="flex items-center gap-3 mb-2">
                                            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                                                <Check className="w-4 h-4 text-emerald-400" />
                                            </div>
                                            <h4 className="font-bold text-white">Tính Năng Quản Lý Admin</h4>
                                        </div>
                                        <p className="text-sm text-slate-400">
                                            Lưu trữ lịch sử thao tác (Log) chi tiết đến từng giây. Biết chính xác ai, làm gì, khi nào trên tài khoản quảng cáo của bạn.
                                        </p>
                                    </div>
                                </div>
                                <div className="relative group">
                                    <div className="absolute inset-0 bg-gradient-to-tr from-rose-500/20 to-amber-500/20 rounded-[24px] blur-xl group-hover:blur-2xl transition-all duration-500" />
                                    <div className="relative rounded-[24px] overflow-hidden border border-white/10 shadow-2xl bg-[#161b22]">
                                        <img src="/meta/admin_log.png" alt="Admin Log Screenshot" className="w-full h-auto object-cover group-hover:scale-105 transition-transform duration-700" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Advanced Reports Section */}
                    <div className="mb-24 space-y-12">
                        {/* 1. Phễu Khách Hàng */}
                        <FadeIn className="bg-[#161b22] border border-white/5 rounded-[32px] p-8 md:p-12 relative overflow-hidden group">
                            <div className="absolute inset-0 bg-gradient-to-r from-amber-500/5 to-orange-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center relative z-10">
                                <div className="order-2 md:order-1 flex flex-col gap-4">
                                    {[
                                        { title: "Lượt Hiển Thị (Impressions)", value: "Tiếp cận 100k+ người dùng", icon: Eye, color: "from-blue-500 to-cyan-500", width: "100%" },
                                        { title: "Lượt Click (CTR)", value: "Tỷ lệ Click ~ 5%", icon: MousePointerClick, color: "from-emerald-500 to-teal-500", width: "80%" },
                                        { title: "Lượt Đăng Ký (Leads)", value: "Chi phí Lead tối ưu", icon: Users, color: "from-amber-400 to-orange-500", width: "60%" },
                                        { title: "Chuyển Đổi (Sales)", value: "ROAS tăng trưởng", icon: Target, color: "from-rose-500 to-pink-500", width: "40%" }
                                    ].map((step, idx) => (
                                        <div key={idx} className="relative w-full h-16 bg-[#0d1117] rounded-xl overflow-hidden border border-white/5 flex items-center px-4">
                                            <div className={`absolute left-0 top-0 bottom-0 bg-gradient-to-r ${step.color} opacity-10`} style={{ width: step.width }} />
                                            <div className="relative z-10 w-full flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${step.color} flex items-center justify-center p-0.5`}>
                                                        <div className="w-full h-full bg-[#0d1117] rounded-[6px] flex items-center justify-center">
                                                            <step.icon className="w-4 h-4 text-white" />
                                                        </div>
                                                    </div>
                                                    <span className="font-bold text-white text-sm md:text-base">{step.title}</span>
                                                </div>
                                                <span className="text-xs text-slate-400 hidden sm:block">{step.value}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <div className="order-1 md:order-2">
                                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-400 text-xs font-bold uppercase tracking-widest mb-6">
                                        <Filter className="w-3.5 h-3.5" /> Phễu Chuyển Đổi
                                    </div>
                                    <h2 className="text-3xl md:text-4xl font-black text-white mb-6 leading-tight">
                                        Phân Tích Hành Trình Khách Hàng Trực Quan
                                    </h2>
                                    <p className="text-slate-400 text-base md:text-lg mb-8 leading-relaxed">
                                        Nhìn thấu mọi điểm rơi rụng (Drop-off rate) trong phễu quảng cáo. Biết chính xác chiến dịch đang "kẹt" ở bước nào để tối ưu ngay lập tức thay vì đốt tiền mù quáng.
                                    </p>
                                    <ul className="space-y-3">
                                        {["Theo dõi ROI/ROAS ở từng giai đoạn", "Phát hiện nội dung có CTR thấp", "Tối ưu chi phí mỗi Lead (CPL)"].map((item, i) => (
                                            <li key={i} className="flex items-center gap-3 text-sm text-slate-300 font-medium">
                                                <Check className="w-4 h-4 text-orange-400" /> {item}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        </FadeIn>

                        {/* 2. Tracking Thời Gian */}
                        <FadeIn className="bg-gradient-to-r from-[#161b22] to-[#0d1117] border border-white/5 rounded-[32px] p-8 md:p-12 relative overflow-hidden group">
                            <div className="absolute -right-20 -top-20 w-64 h-64 bg-emerald-500/10 blur-[100px] rounded-full" />
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center relative z-10">
                                <div>
                                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold uppercase tracking-widest mb-6">
                                        <Clock className="w-3.5 h-3.5" /> Giờ Vàng Chốt Sale
                                    </div>
                                    <h2 className="text-3xl md:text-4xl font-black text-white mb-6 leading-tight">
                                        Theo Dõi Chuyển Đổi Theo Khung Giờ
                                    </h2>
                                    <p className="text-slate-400 text-base md:text-lg mb-8 leading-relaxed">
                                        Không còn lên camp dựa vào cảm tính. Hệ thống phân tích dữ liệu lịch sử để tìm ra <strong className="text-emerald-400">"Khung Giờ Vàng"</strong> có tỷ lệ chuyển đổi cao nhất.
                                    </p>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                                            <div className="text-2xl font-black text-white mb-1">08:00 - 10:00</div>
                                            <div className="text-sm text-slate-400">Tỷ lệ tương tác cao</div>
                                        </div>
                                        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
                                            <div className="text-2xl font-black text-emerald-400 mb-1">20:00 - 23:00</div>
                                            <div className="text-sm text-slate-300">Đỉnh điểm chuyển đổi</div>
                                        </div>
                                    </div>
                                </div>
                                <div className="relative h-64 flex items-end gap-2 px-4">
                                    {[40, 25, 60, 30, 80, 100, 45, 20].map((height, i) => (
                                        <div key={i} className="flex-1 bg-gradient-to-t from-emerald-500/40 to-emerald-400/80 rounded-t-lg group-hover:from-emerald-500/60 transition-colors" style={{ height: `${height}%`, animation: `pulse 3s infinite ${i * 0.2}s` }} />
                                    ))}
                                    <div className="absolute bottom-0 left-0 right-0 h-px bg-white/20" />
                                </div>
                            </div>
                        </FadeIn>
                    </div>
                    {/* Pricing Section */}
                    <div className="max-w-4xl mx-auto mb-20" id="pricing">
                        <FadeIn className="text-center mb-12">
                            <h2 className="text-3xl md:text-4xl font-black text-white mb-4">Bảng Giá Dịch Vụ</h2>
                            <p className="text-slate-400 max-w-2xl mx-auto">Chi phí tối ưu cho một giải pháp toàn diện. Đăng ký để sở hữu hệ thống báo cáo thông minh.</p>
                        </FadeIn>

                        {/* Toggle */}
                        <div className="flex justify-center mb-10">
                            <div className="bg-white/5 p-1 rounded-full border border-white/10 flex items-center relative">
                                <button onClick={() => setIsYearly(false)} className={`relative px-6 py-2.5 rounded-full text-sm font-bold transition-all z-10 ${!isYearly ? 'text-white' : 'text-slate-400 hover:text-white'}`}>
                                    Thanh Toán Tháng
                                </button>
                                <button onClick={() => setIsYearly(true)} className={`relative px-6 py-2.5 rounded-full text-sm font-bold transition-all z-10 flex items-center gap-2 ${isYearly ? 'text-white' : 'text-slate-400 hover:text-white'}`}>
                                    Thanh Toán Năm
                                    <span className="bg-emerald-500/20 text-emerald-400 text-[10px] px-2 py-0.5 rounded-full border border-emerald-500/20">Giảm 29%</span>
                                </button>
                                <div className="absolute top-1 bottom-1 w-[50%] bg-white/10 rounded-full transition-all duration-300" style={{ left: isYearly ? '50%' : '4px', width: isYearly ? 'calc(50% - 4px)' : 'calc(50% - 4px)' }} />
                            </div>
                        </div>

                        {/* Pricing Card */}
                        <FadeIn delay={0.2}>
                            <div className="relative rounded-[32px] p-px bg-gradient-to-r from-amber-400 via-orange-500 to-rose-500 overflow-hidden shadow-[0_0_80px_rgba(245,158,11,0.2)]">
                                <div className="absolute inset-0 bg-gradient-to-r from-amber-400 to-orange-500 blur-xl opacity-30 pointer-events-none" />
                                <div className="relative bg-[#0d1117] rounded-[31px] p-8 md:p-12 border border-white/10 text-center">
                                    <div className="inline-block px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs font-bold text-slate-300 uppercase tracking-widest mb-6">
                                        Gói Dịch Vụ Cốt Lõi
                                    </div>

                                    <div className="flex items-center justify-center mb-8">
                                        <span className="text-5xl md:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-400">
                                            {isYearly ? "490.000" : "690.000"}
                                        </span>
                                        <span className="text-xl md:text-2xl text-slate-400 font-bold ml-2">đ</span>
                                        <span className="text-slate-500 ml-1">/ tháng</span>
                                    </div>

                                    {isYearly && (
                                        <div className="text-sm text-emerald-400 mb-8 font-medium">
                                            Thanh toán theo năm: 5.880.000đ / năm (Tiết kiệm 2.400.000đ)
                                        </div>
                                    )}

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left max-w-2xl mx-auto mb-10">
                                        {["Realtime tracking campaign", "AI dự báo, tối ưu Ads", "Đồng bộ API trực tiếp Meta", "Hệ thống tự động hóa Bật/Tắt Ads", "Dashboard trực quan CPA/ROAS", "Dự đoán xu hướng máy học"].map((item, idx) => (
                                            <div key={idx} className="flex items-start gap-3">
                                                <div className="w-5 h-5 rounded-full bg-amber-500/20 border border-amber-500/40 flex items-center justify-center mt-0.5 shrink-0">
                                                    <Check className="w-3 h-3 text-amber-400" />
                                                </div>
                                                <span className="text-slate-300 text-sm">{item}</span>
                                            </div>
                                        ))}
                                    </div>

                                    <button onClick={() => setShowModal(true)} className="w-full max-w-md mx-auto bg-gradient-to-r from-amber-400 to-orange-500 text-slate-900 py-4 rounded-xl font-black shadow-[0_0_20px_rgba(245,158,11,0.4)] active:scale-95 transition-transform flex items-center justify-center gap-2">
                                        Đăng Ký Ngay
                                    </button>
                                </div>
                            </div>
                        </FadeIn>
                    </div>
                </div>
            </main>

            {/* Footer */}
            <footer className="border-t border-white/10 py-8 px-6 bg-[#080c14] relative z-10 text-center pb-8">
                <p className="text-slate-500 text-sm font-medium">© {new Date().getFullYear()} DOMATION. All rights reserved.</p>
            </footer>

            {/* Request Modal */}
            <AnimatePresence>
                {showModal && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-[#080c14]/80 backdrop-blur-sm"
                            onClick={() => !isSubmitting && setShowModal(false)}
                        />

                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="relative w-full max-w-lg bg-[#0d1117] rounded-3xl border border-white/10 overflow-hidden shadow-[0_0_80px_rgba(245,158,11,0.15)] z-10"
                        >
                            <div className="p-6 md:p-8">
                                <div className="flex items-start justify-between mb-6">
                                    <div>
                                        <h3 className="text-2xl font-black text-white mb-1">Nhận Tư Vấn</h3>
                                        <p className="text-slate-400 text-sm">Điền thông tin để trải nghiệm hệ thống Meta Ads Report.</p>
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
                                        <p className="text-slate-400">Chúng tôi sẽ liên hệ với bạn trong thời gian sớm nhất.</p>
                                    </div>
                                ) : (
                                    <form onSubmit={handleSubmit} className="space-y-4">
                                        <div>
                                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Email</label>
                                            <input
                                                type="email"
                                                required
                                                value={formData.email}
                                                onChange={e => setFormData({ ...formData, email: e.target.value })}
                                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-slate-600 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/50 transition-all"
                                                placeholder="Nhập địa chỉ email..."
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Số điện thoại</label>
                                            <input
                                                type="tel"
                                                required
                                                value={formData.phone}
                                                onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-slate-600 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/50 transition-all"
                                                placeholder="Nhập số điện thoại..."
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Nội dung</label>
                                            <textarea
                                                required
                                                value={formData.message}
                                                onChange={e => setFormData({ ...formData, message: e.target.value })}
                                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-slate-600 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/50 transition-all min-h-[100px] resize-none"
                                                placeholder="Yêu cầu chi tiết của bạn..."
                                            />
                                        </div>

                                        <button
                                            type="submit"
                                            disabled={isSubmitting}
                                            className="w-full bg-gradient-to-r from-amber-400 to-orange-500 text-slate-900 font-black py-4 rounded-xl mt-4 flex items-center justify-center gap-2 hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
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
