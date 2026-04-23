import React, { useEffect, useRef } from 'react';
import { motion, useAnimation, useInView, AnimatePresence } from 'framer-motion';
import { 
    Check, ArrowRight, ShieldCheck, Zap, MonitorPlay, Component, Target, 
    Layers, Users, Share2, MapPin, LayoutDashboard, Server, Globe2, PhoneCall, Sparkles, X, Send, Download
} from 'lucide-react';
import ExcelJS from 'exceljs';
// @ts-ignore
import { saveAs } from 'file-saver';


const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

const Counter = ({ to, suffix = '', prefix = '' }: { to: number; suffix?: string; prefix?: string }) => {
    const [count, setCount] = React.useState(to);
    const prevTo = React.useRef(to);

    React.useEffect(() => {
        let startValue = prevTo.current;
        const duration = 600; // ms
        const startTime = performance.now();

        const animate = (now: number) => {
            const elapsed = now - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // Ease out expo
            const easeProgress = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
            
            const currentCount = Math.floor(startValue + (to - startValue) * easeProgress);
            setCount(currentCount);

            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                prevTo.current = to;
            }
        };

        requestAnimationFrame(animate);
    }, [to]);

    return <span>{prefix}{count.toLocaleString()}{suffix}</span>;
};

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

export const WebDesignPricing: React.FC = () => {
    const [addons, setAddons] = React.useState({
        sales: false,
        payment: false,
        users: false,
        crmErp: false,
        multilingual: false,
        automation: false,
        elearning: false
    });
    const [showModal, setShowModal] = React.useState(false);
    const [formData, setFormData] = React.useState({ email: '', phone: '', message: '' });
    const [isSubmitting, setIsSubmitting] = React.useState(false);
    const [isSuccess, setIsSuccess] = React.useState(false);

    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    const basePrice = 12000000;
    const addonPrices = {
        sales: 3500000,
        payment: 2000000,
        users: 2500000,
        crmErp: 10000000,
        multilingual: 18623610,
        automation: 8911600,
        elearning: 4344610
    };

    const totalPrice = basePrice + 
        (addons.sales ? addonPrices.sales : 0) + 
        (addons.payment ? addonPrices.payment : 0) + 
        (addons.users ? addonPrices.users : 0) +
        (addons.crmErp ? addonPrices.crmErp : 0) +
        (addons.multilingual ? addonPrices.multilingual : 0) +
        (addons.automation ? addonPrices.automation : 0) +
        (addons.elearning ? addonPrices.elearning : 0);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        
        console.log("Form Submitted:", {
            ...formData,
            addonsSelected: addons,
            basePrice,
            totalPrice
        });

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

    const modules = [
        {
            title: "Thiết kế Giao diện (UI/UX)",
            price: "2.500.000",
            icon: MonitorPlay,
            gradient: "#f59e0b",
            features: [
                "Thiết kế độc quyền theo nhận diện thương hiệu.",
                "Giao diện chuẩn Responsive (tương thích Mobile, PC, Tablet).",
                "Hiệu ứng hình ảnh, animation mượt mà, chuyên nghiệp."
            ]
        },
        {
            title: "Module Trang chủ",
            price: "1.500.000",
            icon: LayoutDashboard,
            gradient: "#3b82f6",
            features: [
                "Slider banner tràn viền tự động chuyển động.",
                "Khối sản phẩm nổi bật/bán chạy chia theo đối tượng.",
                "Khối tóm tắt: Về chúng tôi, Tin tức, Đối tác, Chứng nhận."
            ]
        },
        {
            title: "Module Giới thiệu",
            price: "1.000.000",
            icon: Users,
            gradient: "#8b5cf6",
            features: [
                "Trang lịch sử hình thành, tầm nhìn, sứ mệnh.",
                "Hồ sơ năng lực, đội ngũ chuyên gia, hệ thống nhà máy/chứng nhận."
            ]
        },
        {
            title: "Module Sản phẩm (Cốt lõi)",
            price: "2.500.000",
            icon: Component,
            gradient: "#ec4899",
            features: [
                "Phân loại danh mục (Theo dòng sữa, độ tuổi, công dụng).",
                "Trang chi tiết: Ảnh zoom sắc nét, giá, bảng thành phần dinh dưỡng, công dụng, đối tượng.",
                "Thuật toán gợi ý \"Sản phẩm liên quan\"."
            ]
        },
        {
            title: "Module Hệ thống Điểm bán",
            price: "1.500.000",
            icon: MapPin,
            gradient: "#14b8a6",
            features: [
                "Danh sách đại lý, hệ thống phân phối toàn quốc.",
                "Bộ lọc tìm kiếm thông minh theo Tỉnh/Thành phố, Quận/Huyện."
            ]
        },
        {
            title: "Module Cẩm nang & Tuyển dụng",
            price: "1.000.000",
            icon: Layers,
            gradient: "#eab308",
            features: [
                "Trang Tin tức / Kiến thức dinh dưỡng chuẩn báo chí.",
                "Trang Tuyển dụng: Đăng vị trí, form nộp CV trực tuyến."
            ]
        },
        {
            title: "Module Tương tác & Chuyển đổi",
            price: "500.000",
            icon: Share2,
            gradient: "#ef4444",
            features: [
                "Nút liên hệ nhanh (Hotline, Zalo, Messenger Facebook).",
                "Form \"Nhận tư vấn/Đặt hàng\" gửi thẳng thông tin về Email.",
                "Tích hợp Google Maps chỉ đường."
            ]
        },
        {
            title: "Hệ thống Quản trị & Tối ưu SEO",
            price: "1.500.000",
            icon: ShieldCheck,
            gradient: "#22c55e",
            features: [
                "Cấu trúc web chuẩn SEO On-page, tối ưu tốc độ load (<3s).",
                "Tích hợp chứng chỉ bảo mật SSL (https).",
                "Trang Admin quản trị tiếng Việt, dễ dàng tự thêm/sửa/xóa nội dung."
            ]
        },
        {
            title: "Tên miền quốc tế/VN (.com/.vn)",
            price: "0",
            suffix: "(Tặng năm đầu)",
            icon: Globe2,
            gradient: "#6366f1",
            features: [
                "Đăng ký chính chủ định danh cho khách hàng trực tiếp."
            ]
        },
        {
            title: "Hosting Tốc độ cao",
            price: "0",
            suffix: "(Tặng năm đầu)",
            icon: Server,
            gradient: "#06b6d4",
            features: [
                "Dung lượng lưu trữ tối ưu.",
                "Băng thông rộng rãi với độ trễ thấp nhất."
            ]
        }
    ];

    const Toggle = ({ active, onClick, label, price, desc }: any) => (
        <div className={`p-5 rounded-2xl border transition-all duration-300 cursor-pointer flex flex-row items-start justify-between gap-4 ${active ? 'bg-amber-500/10 border-amber-500/50 shadow-[0_0_20px_rgba(245,158,11,0.1)]' : 'bg-white/5 border-white/10 hover:bg-white/10'}`} onClick={onClick}>
            <div className="flex flex-col gap-2 flex-1">
                <span className="text-white font-bold flex flex-wrap items-center gap-2">
                    {label}
                    <span className="text-xs font-bold text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded-md">+{price.toLocaleString()}đ</span>
                </span>
                {Array.isArray(desc) ? (
                    <ul className="text-xs text-slate-400 space-y-1.5 mt-1">
                        {desc.map((d: string, i: number) => (
                            <li key={i} className="flex items-start gap-1.5">
                                <span className="text-amber-500/50 mt-[2px]">•</span>
                                <span className="leading-relaxed">{d}</span>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <span className="text-xs text-slate-400 leading-relaxed">{desc}</span>
                )}
            </div>
            <div className={`w-12 h-6 rounded-full relative transition-colors duration-300 shrink-0 mt-1 ${active ? 'bg-amber-500' : 'bg-slate-700'}`}>
                <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all duration-300 ${active ? 'left-7' : 'left-1'}`} />
            </div>
        </div>
    );

    const exportToExcel = async () => {
        const workbook = new ExcelJS.Workbook();
        const sheet = workbook.addWorksheet('Báo Giá Website', {
            properties: { tabColor: { argb: 'FFF59E0B' } }
        });

        const cellStyle = {
            alignment: { vertical: 'middle', wrapText: true } as any,
            border: {
                top: {style:'thin', color: {argb:'FFE2E8F0'}} as any, left: {style:'thin', color: {argb:'FFE2E8F0'}} as any,
                bottom: {style:'thin', color: {argb:'FFE2E8F0'}} as any, right: {style:'thin', color: {argb:'FFE2E8F0'}} as any
            }
        };

        sheet.columns = [
            { header: 'STT', key: 'stt', width: 6 },
            { header: 'HẠNG MỤC TÍNH NĂNG', key: 'title', width: 35 },
            { header: 'MÔ TẢ CHI TIẾT', key: 'features', width: 55 },
            { header: 'ĐƠN GIÁ (VNĐ)', key: 'price', width: 22 }
        ];

        try {
            const response = await fetch(window.location.origin + '/imgs/ICON.png');
            const blob = await response.blob();
            const base64 = await new Promise<string>((resolve) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result as string);
                reader.readAsDataURL(blob);
            });
            const imageId = workbook.addImage({ base64, extension: 'png' });
            sheet.addImage(imageId, { tl: { col: 0.1, row: 0.1 }, ext: { width: 50, height: 50 } });
        } catch (e) { console.error('Logo failed', e); }

        sheet.insertRow(1, []);
        sheet.getRow(1).height = 45;
        
        sheet.getCell('B1').value = 'DOMATION';
        sheet.getCell('B1').font = { bold: true, size: 28, color: { argb: 'FFEA580C' } }; 
        sheet.getCell('B1').alignment = { vertical: 'middle', horizontal: 'left' };
        sheet.mergeCells('B1:D1');
        
        sheet.insertRow(2, ['', 'CÔNG TY TNHH CÔNG NGHỆ CHUYỂN ĐỔI SỐ DOMATION']);
        sheet.getCell('B2').font = { bold: true, size: 11, color: { argb: 'FF64748B' } };
        sheet.getCell('B2').alignment = { vertical: 'middle', horizontal: 'left' };
        sheet.mergeCells('B2:D2');

        sheet.insertRow(3, []);

        sheet.insertRow(4, ['BẢNG BÁO GIÁ DỊCH VỤ THIẾT KẾ WEBSITE']);
        sheet.getCell('A4').font = { bold: true, size: 16, color: { argb: 'FF1E293B' } };
        sheet.getCell('A4').alignment = { horizontal: 'center', vertical: 'middle' };
        sheet.getRow(4).height = 30;
        sheet.mergeCells('A4:D4');

        sheet.insertRow(5, []);

        const headerRow = sheet.getRow(6);
        headerRow.values = ['STT', 'HẠNG MỤC TÍNH NĂNG', 'MÔ TẢ CHI TIẾT', 'ĐƠN GIÁ (VNĐ)'];
        headerRow.eachCell(cell => {
            cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 12 };
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E293B' } };
            cell.alignment = { horizontal: 'center', vertical: 'middle' };
            cell.border = cellStyle.border;
        });
        headerRow.height = 30;

        let rowIndex = 7;
        let finalPrice = 0;
        
        modules.forEach((mod, idx) => {
            const numPrice = parseInt(mod.price.replace(/\./g, '')) || 0;
            const featuresText = mod.features.map((f: string) => '• ' + f).join('\n');
            const row = sheet.getRow(rowIndex);
            row.values = [idx + 1, mod.title, featuresText, numPrice];
            row.getCell(4).numFmt = '#,##0 "₫"';
            
            row.eachCell(cell => {
                cell.font = { size: 11 };
                cell.border = cellStyle.border;
                cell.alignment = cellStyle.alignment;
                if (Number(cell.col) === 1) cell.alignment = { ...cell.alignment, horizontal: 'center' };
            });
            row.getCell(2).font = { bold: true, size: 11, color: { argb: 'FF0F172A' } };
            row.getCell(4).font = { bold: true, size: 11, color: { argb: 'FF0F172A' } };
            row.height = Math.max(30, mod.features.length * 18);
            
            finalPrice += numPrice;
            rowIndex++;
        });

        const activeAddons = [];
        if (addons.sales) activeAddons.push({ title: "Module Add-on: Quản lý Bán hàng", price: addonPrices.sales, desc: "• Tích hợp Giỏ hàng & Thanh toán nội bộ\n• Quản lý đơn hàng, kho trạng thái" });
        if (addons.payment) activeAddons.push({ title: "Module Add-on: Thanh toán Online", price: addonPrices.payment, desc: "• Tích hợp quét mã QR chuyển khoản tự động\n• Cổng thanh toán VNPay/Momo/Paypal" });
        if (addons.users) activeAddons.push({ title: "Module Add-on: Quản lý Thành viên", price: addonPrices.users, desc: "• Chế độ Đăng ký/Đăng nhập, Quản lý Profile\n• Điểm thưởng khách hàng thân thiết" });
        if (addons.crmErp) activeAddons.push({ title: "Module Add-on: Đồng bộ CRM & ERP", price: addonPrices.crmErp, desc: "• Đẩy thông tin tự động về Getfly CRM\n• Đồng bộ tồn kho với Fast ERP" });
        if (addons.multilingual) activeAddons.push({ title: "Module Add-on: Đa Ngôn Ngữ", price: addonPrices.multilingual, desc: "• Cấu hình đa ngôn ngữ toàn diện\n• Bản quyền plugin WPML vĩnh viễn" });
        if (addons.automation) activeAddons.push({ title: "Module Add-on: Marketing Automation", price: addonPrices.automation, desc: "• Cài đặt Mautic & Tracking sâu\n• Gửi Email tự động qua Amazon SES" });
        if (addons.elearning) activeAddons.push({ title: "Module Add-on: E-Learning", price: addonPrices.elearning, desc: "• Hệ thống đào tạo trực tuyến\n• Bản quyền Ultimate Learning Pro" });

        activeAddons.forEach(item => {
            const row = sheet.getRow(rowIndex);
            row.values = ['+', item.title, item.desc, item.price];
            row.getCell(4).numFmt = '#,##0 "₫"';
            
            row.eachCell(cell => {
                cell.font = { size: 11, color: { argb: 'FFD97706' } };
                cell.border = cellStyle.border;
                cell.alignment = cellStyle.alignment;
                if (Number(cell.col) === 1) cell.alignment = { ...cell.alignment, horizontal: 'center' };
            });
            row.getCell(2).font = { bold: true, size: 11, color: { argb: 'FFD97706' } };
            row.getCell(4).font = { bold: true, size: 11, color: { argb: 'FFD97706' } };
            row.height = 40;
            finalPrice += item.price;
            rowIndex++;
        });

        const totalRow = sheet.getRow(rowIndex);
        totalRow.values = ['', 'TỔNG CỘNG HOÀN THIỆN', '', finalPrice];
        totalRow.getCell(2).font = { bold: true, size: 14, color: { argb: 'FFFFFFFF' } };
        totalRow.getCell(2).alignment = { horizontal: 'right', vertical: 'middle' };
        totalRow.getCell(4).numFmt = '#,##0 "₫"';
        totalRow.getCell(4).font = { bold: true, size: 14, color: { argb: 'FFFFFFFF' } };
        totalRow.height = 40;
        totalRow.eachCell((cell, colNum) => {
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEA580C' } };
            cell.border = cellStyle.border;
            if(Number(colNum) === 4) cell.alignment = { horizontal: 'left', vertical: 'middle' };
        });
        sheet.mergeCells('B' + rowIndex + ':C' + rowIndex);
        
        rowIndex += 2;
        sheet.getCell('B' + rowIndex).value = "* Ghi chú:";
        sheet.getCell('B' + rowIndex).font = { bold: true, italic: true };
        
        rowIndex++;
        sheet.getCell('B' + rowIndex).value = "- Báo giá trên đã bao gồm Tiêu chuẩn và các Add-on khách hàng đã chọn. Thanh toán 1 lần duy nhất.";
        
        rowIndex++;
        sheet.getCell('B' + rowIndex).value = "- Từ năm thứ 2 trở đi, khách hàng chỉ cần đóng phí duy trì cơ sở hạ tầng mạng (Chi phí này được thanh toán và gia hạn trực tiếp từ các nhà cung cấp dịch vụ bên thứ 3 uy tín dựa trên nhu cầu và sự chấp thuận của khách hàng):";
        
        rowIndex++;
        sheet.getCell('B' + rowIndex).value = "  + Tên miền (.com/.vn): 550.000 VNĐ / năm";
        
        rowIndex++;
        const hasAnyAddon = Object.values(addons).some(v => v);
        const hostingTuDong = hasAnyAddon ? "1.500.000" : "660.000";
        sheet.getCell('B' + rowIndex).value = `  + Hosting Tốc độ cao: ${hostingTuDong} VNĐ / năm`;
        
        rowIndex++;
        let minDays = 15;
        let maxDays = 20;
        if (addons.sales) { minDays += 3; maxDays += 5; }
        if (addons.payment) { minDays += 2; maxDays += 3; }
        if (addons.users) { minDays += 2; maxDays += 3; }
        sheet.getCell('B' + rowIndex).value = `- Thời gian hoàn thành dự kiến: ${minDays} - ${maxDays} ngày làm việc.`;

        const buffer = await workbook.xlsx.writeBuffer();
        const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        saveAs(blob, 'Bao_Gia_Website_DOMATION.xlsx');
    };

    return (
        <div className="min-h-screen bg-[#080c14] text-white overflow-x-hidden font-sans selection:bg-amber-500/30" style={{ scrollbarWidth: 'thin', scrollbarColor: '#f59e0b transparent' }}>
            {/* Background Animations */}
            <div className="fixed inset-0 pointer-events-none z-0" style={{ transform: 'translateZ(0)' }}>
                <div className="aurora-1 absolute top-[-25%] left-[-15%] w-[70%] h-[70%] rounded-full bg-amber-500/[0.12] blur-[120px] md:blur-[160px]" />
                <div className="aurora-2 absolute top-[5%] right-[-20%] w-[60%] h-[60%] rounded-full bg-indigo-600/[0.1] blur-[120px] md:blur-[160px]" />
                <div className="aurora-3 absolute bottom-[-5%] left-[15%] w-[50%] h-[50%] rounded-full bg-rose-500/[0.08] blur-[100px] md:blur-[140px]" />
                <div className="hidden md:block absolute inset-0 opacity-[0.035]" style={{
                    backgroundImage: 'linear-gradient(rgba(255,255,255,1) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,1) 1px,transparent 1px)',
                    backgroundSize: '60px 60px'
                }} />
                <div className="hidden md:block absolute inset-0 opacity-[0.025]" style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='1'/%3E%3C/svg%3E")`
                }} />
            </div>

            {/* Navigation */}
            <nav className="fixed top-0 left-0 right-0 z-50 bg-[#080c14]/90 backdrop-blur-xl border-b border-white/5">
                <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
                    <a href="/" className="flex items-center space-x-3 group">
                        <div className="relative float-y">
                            <img loading="lazy" decoding="async" src="/imgs/ICON.png" alt="DOMATION Logo" className="w-10 h-10 object-contain rounded-[14px] shadow-lg shadow-amber-500/30 group-hover:scale-105 transition-transform" />
                            <div className="absolute -inset-1 rounded-[18px] bg-amber-500/20 blur-md -z-10" />
                        </div>
                        <span className="text-xl font-black tracking-tight text-white group-hover:text-amber-400 transition-colors">
                            DOMATION
                        </span>
                    </a>
                    <div className="flex items-center space-x-3">
                        <button onClick={() => setShowModal(true)} className="glow-btn flex items-center gap-2 bg-gradient-to-r from-amber-400 to-orange-500 text-slate-900 px-5 py-2.5 rounded-full text-sm font-black hover:-translate-y-0.5 transition-transform duration-300 cursor-pointer">
                            Request
                        </button>
                    </div>
                </div>
            </nav>

            <main className="relative pt-32 pb-24 md:pb-20 px-4 md:px-6 z-10 w-full">
                <div className="max-w-5xl mx-auto">
                    
                    {/* Header */}
                    <div className="text-center mb-16 md:mb-24">
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold uppercase tracking-widest mb-6">
                            <Zap className="w-3.5 h-3.5" /> Source Code Sở Hữu Vĩnh Viễn
                        </motion.div>
                        <motion.h1 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="text-3xl md:text-5xl lg:text-6xl font-black text-white mb-6 leading-tight">
                            Bảng Báo Giá Dịch Vụ <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-400 shimmer-text">Thiết Kế Website</span>
                        </motion.h1>
                        <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="text-slate-400 text-base md:text-xl max-w-3xl mx-auto leading-relaxed">
                            Mẫu giao diện và chức năng tương đương website tiêu chuẩn quốc tế. Cấu trúc chuẩn SEO, thiết kế độc quyền, tăng cường chuyển đổi.
                        </motion.p>
                    </div>

                    {/* Main Content Order Wrapper */}
                    <div className="flex flex-col">
                        
                        {/* 1. Checkout Card (Top on Mobile) */}
                        <FadeIn delay={0.4} className="order-1 md:order-3 mb-10 md:mb-0">
                            <div className="relative rounded-[32px] md:rounded-[40px] p-[2px] pricing-highlight-glow bg-gradient-to-r from-amber-400 via-orange-500 to-rose-500 overflow-hidden shadow-[0_0_80px_rgba(245,158,11,0.2)]">
                                <div className="absolute inset-0 bg-gradient-to-r from-amber-400 via-orange-500 to-rose-500 blur-xl opacity-30 pointer-events-none" />
                                <div className="relative bg-[#0d1117] rounded-[30px] md:rounded-[38px] p-5 md:p-12 border border-white/10 flex flex-col items-center text-center">
                                    <span className="inline-block px-3 py-1.5 md:px-4 md:py-1.5 rounded-full bg-white/5 border border-white/10 text-[10px] md:text-xs font-bold text-slate-300 uppercase tracking-widest mb-3 md:mb-4">
                                        Thanh toán 1 lần • Sở hữu vĩnh viễn Source Code
                                    </span>
                                    <h3 className="text-lg md:text-2xl text-slate-400 font-bold mb-1 md:mb-2">Tổng Cộng Khoản Phí</h3>
                                    <div className="text-4xl md:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-amber-400 to-orange-500 mb-6 md:mb-8 shimmer-text">
                                        <Counter to={totalPrice} /> <span className="text-xl md:text-2xl text-amber-500 font-bold">VNĐ</span>
                                    </div>
                                    
                                    <div className="w-full max-w-sm mx-auto flex flex-col sm:flex-row gap-3 mb-8">
                                        <button onClick={() => setShowModal(true)} className="flex-1 bg-gradient-to-r from-amber-400 to-orange-500 text-slate-900 py-3.5 rounded-xl text-sm font-black shadow-[0_0_15px_rgba(245,158,11,0.4)] active:scale-95 transition-transform cursor-pointer">
                                            Yêu cầu tư vấn
                                        </button>
                                        <button onClick={exportToExcel} className="flex-1 bg-white/10 hover:bg-white/20 border border-white/20 text-white py-3.5 rounded-xl text-sm font-bold shadow-[0_0_15px_rgba(255,255,255,0.05)] active:scale-95 transition-transform cursor-pointer flex items-center justify-center gap-2">
                                            <Download className="w-4 h-4 text-emerald-400" /> Xuất Báo Giá
                                        </button>
                                    </div>

                                    <div className="w-full max-w-2xl bg-white/5 border border-white/10 rounded-[20px] p-4 md:p-6 text-left mb-2 md:mb-8">
                                        <h4 className="flex items-center gap-2 font-bold text-white text-sm md:text-base mb-2 md:mb-3"><Target className="w-4 h-4 md:w-5 md:h-5 text-amber-400" /> Ghi chú duy trì</h4>
                                        <p className="text-slate-400 text-[12px] md:text-sm leading-relaxed mb-2">
                                            * Chi phí trên là phí thiết kế trọn gói <strong className="text-white">trả 1 lần duy nhất</strong>.
                                        </p>
                                        <p className="text-slate-400 text-[12px] md:text-sm leading-relaxed">
                                            Từ <strong className="text-white">năm thứ 2</strong> trở đi, khách hàng chỉ cần đóng phí duy trì cơ sở hạ tầng mạng (Chi phí này được thanh toán và gia hạn trực tiếp từ các nhà cung cấp dịch vụ bên thứ 3 uy tín dựa trên nhu cầu và sự chấp thuận của khách hàng):
                                        </p>
                                        <ul className="list-disc list-inside text-[12px] md:text-sm text-slate-300 mt-2 md:mt-3 space-y-1 ml-2">
                                            <li>Tên miền (.com/.vn): <strong className="text-amber-400">550.000 VNĐ</strong> / năm</li>
                                            <li>Hosting Tốc độ cao: <strong className="text-amber-400">{Object.values(addons).some(v => v) ? "1.500.000" : "660.000"} VNĐ</strong> / năm</li>
                                        </ul>
                                        <div className="mt-3 md:mt-4 pt-3 md:pt-4 border-t border-white/5 flex flex-col sm:flex-row sm:items-center justify-between bg-black/20 rounded-xl p-3 gap-2">
                                            <span className="text-[12px] md:text-sm font-semibold text-slate-300">Tổng phí gia hạn dự kiến năm 2:</span>
                                            <span className="font-black text-rose-400 text-base md:text-lg">
                                                <Counter to={550000 + (Object.values(addons).some(v => v) ? 1500000 : 660000)} suffix=" VNĐ / năm" />
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </FadeIn>

                        {/* 2. Add-ons Toggles */}
                        <FadeIn delay={0.3} className="order-2 md:order-2 mb-12">
                            <div className="bg-[#161b22]/50 backdrop-blur-md rounded-[32px] p-6 md:p-8 border border-white/10">
                                <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                                    <Sparkles className="w-5 h-5 text-amber-400" /> Tùy chọn nâng cao (Options)
                                </h3>
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                    <Toggle 
                                        active={addons.sales} 
                                        label="Quản lý Bán hàng" 
                                        price={addonPrices.sales} 
                                        desc={[
                                            "Xây dựng tính năng thêm vào giỏ hàng, đặt hàng & thanh toán trực tuyến.",
                                            "Hệ thống bộ lọc sản phẩm & phụ tùng tùy biến chuyên sâu.",
                                            "Giao diện tương tác trực quan cho sản phẩm & phụ tùng đi kèm."
                                        ]}
                                        onClick={() => setAddons({ ...addons, sales: !addons.sales })}
                                    />
                                    <Toggle 
                                        active={addons.payment} 
                                        label="Thanh toán Online" 
                                        price={addonPrices.payment} 
                                        desc={[
                                            "Kết nối và thiết lập các cổng thanh toán (Momo, VNPay, ZaloPay, Paypal, ...).",
                                            "Hệ thống tự động nhận diện và quét mã QR chuyển khoản ngân hàng."
                                        ]}
                                        onClick={() => setAddons({ ...addons, payment: !addons.payment })}
                                    />
                                    <Toggle 
                                        active={addons.users} 
                                        label="Quản lý Thành viên" 
                                        price={addonPrices.users} 
                                        desc={[
                                            "Xây dựng cơ chế Đăng ký, Đăng nhập và Quản lý hồ sơ cá nhân.",
                                            "Hệ thống Affiliate (Tiếp thị liên kết), quản lý hoa hồng và điểm thưởng."
                                        ]}
                                        onClick={() => setAddons({ ...addons, users: !addons.users })}
                                    />
                                    <Toggle 
                                        active={addons.crmErp} 
                                        label="Đồng bộ CRM & ERP" 
                                        price={addonPrices.crmErp} 
                                        desc={[
                                            "Kết nối Getfly CRM: Tự động đẩy thông tin đơn hàng/khách hàng để CSKH.",
                                            "Kết nối Fast ERP: Đồng bộ dữ liệu và kiểm tra tình trạng tồn kho theo thời gian thực."
                                        ]}
                                        onClick={() => setAddons({ ...addons, crmErp: !addons.crmErp })}
                                    />
                                    <Toggle 
                                        active={addons.multilingual} 
                                        label="Đa Ngôn Ngữ" 
                                        price={addonPrices.multilingual} 
                                        desc={[
                                            "Cấu hình và triển khai nền tảng đa ngôn ngữ toàn diện (Tiếng Anh, ...).",
                                            "Bao gồm chi phí mua bản quyền plugin WPML Multilingual CMS (Giá trị vĩnh viễn)."
                                        ]}
                                        onClick={() => setAddons({ ...addons, multilingual: !addons.multilingual })}
                                    />
                                    <Toggle 
                                        active={addons.automation} 
                                        label="Marketing Automation" 
                                        price={addonPrices.automation} 
                                        desc={[
                                            "Thiết lập hệ thống Mautic Marketing Automation và các kịch bản nuôi dưỡng.",
                                            "Bao gồm chi phí máy chủ gửi Email qua Amazon SES (Gói 62,000 email/tháng & 20GB lưu trữ)."
                                        ]}
                                        onClick={() => setAddons({ ...addons, automation: !addons.automation })}
                                    />
                                    <Toggle 
                                        active={addons.elearning} 
                                        label="E-Learning" 
                                        price={addonPrices.elearning} 
                                        desc={[
                                            "Cấu hình hệ thống E-learning để phát hành khóa học, đào tạo nội bộ hoặc khách hàng.",
                                            "Bao gồm chi phí mua bản quyền plugin Ultimate Learning Pro WordPress (Giá trị vĩnh viễn)."
                                        ]}
                                        onClick={() => setAddons({ ...addons, elearning: !addons.elearning })}
                                    />
                                </div>
                            </div>
                        </FadeIn>

                        {/* 3. Pricing Grid (Bottom on Mobile) */}
                        <div className="order-3 md:order-1 grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 mb-16">
                            {modules.map((mod, i) => (
                                <FadeIn key={i} delay={i * 0.05} className="h-full">
                                    <div className="holo-card relative rounded-2xl p-px h-full bg-white/5 hover:bg-white/10 transition-all duration-500 group">
                                        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl"
                                            style={{ background: `radial-gradient(400px circle at bottom right, ${mod.gradient}15, transparent 70%)` }} />
                                        
                                        <div className="relative bg-[#161b22]/80 backdrop-blur-sm rounded-[15px] p-6 lg:p-8 flex flex-col h-full border border-white/5">
                                            <div className="flex items-center gap-4 mb-6">
                                                <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${mod.gradient}15`, border: `1px solid ${mod.gradient}30` }}>
                                                    <mod.icon className="w-6 h-6" style={{ color: mod.gradient }} />
                                                </div>
                                                <div>
                                                    <h3 className="text-lg font-bold text-white leading-tight">{mod.title}</h3>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <span className="text-xl font-black" style={{ color: mod.gradient }}>
                                                            {String(mod.price) !== "0" ? `${mod.price} VNĐ` : "Miễn Phí"}
                                                        </span>
                                                        {mod.suffix && <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-400">{mod.suffix}</span>}
                                                    </div>
                                                </div>
                                            </div>
                                            
                                            <ul className="space-y-3 flex-1 mt-2">
                                                {mod.features.map((feature, j) => (
                                                    <li key={j} className="flex items-start gap-3 text-sm text-slate-300">
                                                        <Check className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: mod.gradient }} />
                                                        <span className="leading-relaxed">{feature}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    </div>
                                </FadeIn>
                            ))}
                        </div>
                    </div>
                </div>
            </main>
            
            {/* Footer */}
            <footer className="border-t border-white/10 py-8 px-6 bg-[#080c14] relative z-10 text-center pb-28 md:pb-8">
                <p className="text-slate-500 text-sm font-medium">© {new Date().getFullYear()} DOMATION. All rights reserved.</p>
            </footer>

            {/* Fixed Bottom Price Bar (Mobile + PC) */}
            <div className="fixed bottom-0 left-0 right-0 bg-[#0d1117]/95 backdrop-blur-xl border-t border-amber-500/20 z-[60] shadow-[0_-20px_40px_rgba(245,158,11,0.15)] transition-all duration-300">
                 <div className="max-w-7xl mx-auto p-4 md:px-6 md:py-4 flex items-center justify-between">
                     <div className="flex flex-col">
                          <span className="text-[10px] md:text-xs text-amber-400/80 font-bold uppercase tracking-wider mb-1">Tổng thiết kế</span>
                          <span className="text-2xl md:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-300 to-orange-500 shimmer-text leading-none">
                              <Counter to={totalPrice} /> <span className="text-sm md:text-base text-amber-500">đ</span>
                          </span>
                     </div>
                     <div className="flex flex-col items-end gap-1.5 md:gap-2">
                          <div className="flex items-center gap-2 md:gap-4">
                              <button onClick={exportToExcel} className="p-2.5 md:px-4 md:py-2.5 flex items-center gap-2 border border-white/20 rounded-full text-emerald-400 bg-white/10 hover:bg-white/20 active:scale-95 transition-all cursor-pointer" title="Xuất Báo Giá Excel">
                                  <Download className="w-4 h-4" />
                                  <span className="hidden md:inline text-sm font-bold">Xuất File Báo Giá</span>
                              </button>
                              <button onClick={() => setShowModal(true)} className="bg-gradient-to-r from-amber-400 to-orange-500 text-slate-900 px-5 md:px-8 py-2.5 rounded-full text-sm font-black shadow-[0_0_15px_rgba(245,158,11,0.4)] hover:shadow-[0_0_25px_rgba(245,158,11,0.6)] active:scale-95 transition-all cursor-pointer">
                                  Request
                              </button>
                          </div>
                          <span className="text-[9px] md:text-xs text-slate-400 font-medium">
                              Duy trì: <span className="text-rose-400"><Counter to={550000 + (Object.values(addons).some(v => v) ? 1500000 : 660000)} /> đ/năm</span>
                          </span>
                     </div>
                 </div>
            </div>

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
                            className="relative w-full max-w-lg bg-[#0d1117] rounded-3xl border border-white/10 overflow-hidden shadow-[0_0_80px_rgba(245,158,11,0.1)] z-10"
                        >
                            <div className="p-6 md:p-8">
                                <div className="flex items-start justify-between mb-6">
                                    <div>
                                        <h3 className="text-2xl font-black text-white mb-1">Request Service</h3>
                                        <p className="text-slate-400 text-sm">Điền thông tin để được hỗ trợ & tư vấn chi tiết.</p>
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
                                                onChange={e => setFormData({...formData, email: e.target.value})}
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
                                                onChange={e => setFormData({...formData, phone: e.target.value})}
                                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-slate-600 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/50 transition-all"
                                                placeholder="Nhập số điện thoại..."
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Nội dung</label>
                                            <textarea 
                                                required
                                                value={formData.message}
                                                onChange={e => setFormData({...formData, message: e.target.value})}
                                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-slate-600 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/50 transition-all min-h-[100px] resize-none"
                                                placeholder="Yêu cầu chi tiết của bạn..."
                                            />
                                        </div>

                                        {/* Current selection summary */}
                                        <div className="bg-black/30 rounded-xl p-4 mt-6">
                                            <h5 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Thông tin tùy chọn</h5>
                                            <div className="flex justify-between items-center mb-1">
                                                 <span className="text-sm text-slate-300">Tổng phí (1 lần):</span>
                                                 <span className="text-sm font-bold text-amber-400">{totalPrice.toLocaleString()} VNĐ</span>
                                            </div>
                                            <div className="flex gap-2 flex-wrap mt-2">
                                                 {addons.sales && <span className="text-[10px] px-2 py-1 rounded bg-amber-500/10 text-amber-500 border border-amber-500/20">+ Bán hàng</span>}
                                                 {addons.payment && <span className="text-[10px] px-2 py-1 rounded bg-amber-500/10 text-amber-500 border border-amber-500/20">+ TT Online</span>}
                                                 {addons.users && <span className="text-[10px] px-2 py-1 rounded bg-amber-500/10 text-amber-500 border border-amber-500/20">+ QL Thành viên</span>}
                                                 {!addons.sales && !addons.payment && !addons.users && <span className="text-[10px] text-slate-500">Mặc định (Không chọn thêm)</span>}
                                            </div>
                                        </div>

                                        <button 
                                            type="submit" 
                                            disabled={isSubmitting}
                                            className="w-full bg-gradient-to-r from-amber-400 to-orange-500 text-slate-900 font-black py-4 rounded-xl mt-4 flex items-center justify-center gap-2 hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                                        >
                                            {isSubmitting ? (
                                                <div className="w-5 h-5 border-2 border-slate-900/30 border-t-slate-900 rounded-full animate-spin" />
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
        </div>
    );
};



