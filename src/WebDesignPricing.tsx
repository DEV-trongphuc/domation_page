import React, { useEffect, useRef } from 'react';
import { motion, useAnimation, useInView, AnimatePresence } from 'framer-motion';
import { 
    Check, ArrowUp, ShieldCheck, Zap, MonitorPlay, Component, Target, 
    Layers, Users, Share2, MapPin, LayoutDashboard, Server, Globe2, Sparkles, X, Send, Download
} from 'lucide-react';
import { ContactModal } from './ContactModal';
import { Navbar } from './Navbar';
import { LuxuryGoldBackdrop } from './LuxuryGoldBackdrop';
import { DomationLogoMark } from './components/DomationLogoMark';
import { DECOR_PNGS } from './data/enterpriseData';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

interface PricingToggleProps {
    active: boolean;
    onClick: () => void;
    label: string;
    price: number;
    desc: string | string[];
}

const Toggle: React.FC<PricingToggleProps> = ({ active, onClick, label, price, desc }) => (
    <div className={`p-5 rounded-2xl border transition-all duration-300 cursor-pointer flex flex-row items-start justify-between gap-4 ${active ? 'bg-gradient-to-br from-blue-50/90 to-cyan-50/75 border-[#1E40FF]/45 shadow-[0_12px_28px_rgba(30,64,255,0.10)]' : 'bg-white/85 border-slate-200/90 hover:border-blue-300 hover:bg-white shadow-sm'}`} onClick={onClick}>
        <div className="flex flex-col gap-2 flex-1">
            <span className="text-slate-900 font-bold flex flex-wrap items-center gap-2">
                {label}
                <span className="text-xs font-bold text-[#1E40FF] bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-md">+{price.toLocaleString()}đ</span>
            </span>
            {Array.isArray(desc) ? (
                <ul className="text-xs text-slate-600 space-y-1.5 mt-1">
                    {desc.map((d: string, i: number) => (
                        <li key={i} className="flex items-start gap-1.5">
                            <span className="text-[#1E40FF] mt-[2px]">•</span>
                            <span className="leading-relaxed">{d}</span>
                        </li>
                    ))}
                </ul>
            ) : (
                <span className="text-xs text-slate-600 leading-relaxed">{desc}</span>
            )}
        </div>
        <div className={`w-12 h-6 rounded-full relative transition-colors duration-300 shrink-0 mt-1 ${active ? 'bg-[#1E40FF]' : 'bg-slate-300'}`}>
            <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow-sm transition-all duration-300 ${active ? 'left-7' : 'left-1'}`} />
        </div>
    </div>
);

const Counter = ({ to, suffix = '', prefix = '' }: { to: number; suffix?: string; prefix?: string }) => {
    const [count, setCount] = React.useState(to);
    const prevTo = React.useRef(to);

    React.useEffect(() => {
        const startValue = prevTo.current;
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
    const ref = useRef<HTMLDivElement>(null);
    const inView = useInView(ref, { once: true, amount: 0.02 });
    const initial = from === 'left' ? { opacity: 0.96, x: -16 } : from === 'right' ? { opacity: 0.96, x: 16 } : { opacity: 0.96, y: 14 };

    useEffect(() => {
        if (inView) controls.start({ opacity: 1, x: 0, y: 0 });
    }, [controls, inView]);

    return (
        <motion.div ref={ref} animate={controls} initial={initial}
            transition={{ duration: 0.45, delay: Math.min(delay * 0.35, 0.2), ease: [0.22, 1, 0.36, 1] }}
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
    const [showContactModal, setShowContactModal] = React.useState(false);
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
            gradient: "#1E40FF",
            features: [
                "Thiết kế riêng theo nhận diện thương hiệu.",
                "Giao diện chuẩn Responsive (tương thích Mobile, PC, Tablet).",
                "Hiệu ứng hình ảnh, animation mượt mà, chuyên nghiệp."
            ]
        },
        {
            title: "Module Trang chủ",
            price: "1.500.000",
            icon: LayoutDashboard,
            gradient: "#0284C7",
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
            gradient: "#2563EB",
            features: [
                "Trang lịch sử hình thành, tầm nhìn, sứ mệnh.",
                "Hồ sơ năng lực, đội ngũ chuyên gia, hệ thống nhà máy/chứng nhận."
            ]
        },
        {
            title: "Module Sản phẩm (Cốt lõi)",
            price: "2.500.000",
            icon: Component,
            gradient: "#0EA5E9",
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
            gradient: "#06B6D4",
            features: [
                "Danh sách đại lý, hệ thống phân phối toàn quốc.",
                "Bộ lọc tìm kiếm thông minh theo Tỉnh/Thành phố, Quận/Huyện."
            ]
        },
        {
            title: "Module Cẩm nang & Tuyển dụng",
            price: "1.000.000",
            icon: Layers,
            gradient: "#0284C7",
            features: [
                "Trang Tin tức / Kiến thức dinh dưỡng chuẩn báo chí.",
                "Trang Tuyển dụng: Đăng vị trí, form nộp CV trực tuyến."
            ]
        },
        {
            title: "Module Tương tác & Chuyển đổi",
            price: "500.000",
            icon: Share2,
            gradient: "#1E40FF",
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
            gradient: "#10B981",
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
            gradient: "#2563EB",
            features: [
                "Đăng ký chính chủ định danh cho khách hàng trực tiếp."
            ]
        },
        {
            title: "Hosting Tốc độ cao",
            price: "0",
            suffix: "(Tặng năm đầu)",
            icon: Server,
            gradient: "#06B6D4",
            features: [
                "Dung lượng lưu trữ tối ưu.",
                "Băng thông rộng rãi với độ trễ thấp nhất."
            ]
        }
    ];

    const exportToExcel = async () => {
        const workbook = new ExcelJS.Workbook();
        const sheet = workbook.addWorksheet('Báo Giá Website', {
            properties: { tabColor: { argb: 'FF1E40FF' } }
        });

        const cellStyle: {
            alignment: Partial<ExcelJS.Alignment>;
            border: Partial<ExcelJS.Borders>;
        } = {
            alignment: { vertical: 'middle', wrapText: true },
            border: {
                top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
                left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
                bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
                right: { style: 'thin', color: { argb: 'FFE2E8F0' } }
            }
        };

        sheet.columns = [
            { header: 'STT', key: 'stt', width: 6 },
            { header: 'HẠNG MỤC TÍNH NĂNG', key: 'title', width: 35 },
            { header: 'MÔ TẢ CHI TIẾT', key: 'features', width: 55 },
            { header: 'ĐƠN GIÁ (VNĐ)', key: 'price', width: 22 }
        ];

        try {
            const response = await fetch(window.location.origin + '/domation-logo.svg');
            const svgText = await response.text();
            const svgBlob = new Blob([svgText], { type: 'image/svg+xml;charset=utf-8' });
            const svgUrl = URL.createObjectURL(svgBlob);
            const base64 = await new Promise<string>((resolve, reject) => {
                const img = new Image();
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    canvas.width = 128;
                    canvas.height = 128;
                    const ctx = canvas.getContext('2d');
                    if (ctx) {
                        ctx.drawImage(img, 0, 0, 128, 128);
                        resolve(canvas.toDataURL('image/png'));
                    } else {
                        reject(new Error('Canvas context missing'));
                    }
                    URL.revokeObjectURL(svgUrl);
                };
                img.onerror = (err) => {
                    URL.revokeObjectURL(svgUrl);
                    reject(err);
                };
                img.src = svgUrl;
            });
            const imageId = workbook.addImage({ base64, extension: 'png' });
            sheet.addImage(imageId, { tl: { col: 0.1, row: 0.1 }, ext: { width: 50, height: 50 } });
        } catch (e) { console.error('Logo failed', e); }

        sheet.insertRow(1, []);
        sheet.getRow(1).height = 45;
        
        sheet.getCell('B1').value = 'DOMATION';
        sheet.getCell('B1').font = { bold: true, size: 28, color: { argb: 'FF1E40FF' } }; 
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
                cell.font = { size: 11, color: { argb: 'FF1E40FF' } };
                cell.border = cellStyle.border;
                cell.alignment = cellStyle.alignment;
                if (Number(cell.col) === 1) cell.alignment = { ...cell.alignment, horizontal: 'center' };
            });
            row.getCell(2).font = { bold: true, size: 11, color: { argb: 'FF1E40FF' } };
            row.getCell(4).font = { bold: true, size: 11, color: { argb: 'FF1E40FF' } };
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
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E40FF' } };
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
        <div className="min-h-screen bg-[#F8F9FA] text-slate-900 relative overflow-x-clip font-sans selection:bg-blue-600/20">
            <LuxuryGoldBackdrop />

            {/* Floating 3D Glass Decor */}
            <motion.img
                src={DECOR_PNGS.prism}
                alt=""
                aria-hidden="true"
                animate={{ y: [0, -14, 0], rotate: [0, 3, 0] }}
                transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
                className="pointer-events-none select-none hidden lg:block fixed top-28 right-8 w-36 xl:w-44 opacity-55 drop-shadow-[0_18px_36px_rgba(30,64,255,0.16)] z-[1]"
            />
            <motion.img
                src={DECOR_PNGS.torus}
                alt=""
                aria-hidden="true"
                animate={{ y: [0, 12, 0], rotate: [0, -3, 0] }}
                transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut' }}
                className="pointer-events-none select-none hidden lg:block fixed bottom-28 left-8 w-32 xl:w-40 opacity-50 drop-shadow-[0_18px_36px_rgba(6,182,212,0.16)] z-[1]"
            />

            {/* Navigation */}
            <Navbar activePage="web-design" onOpenContact={() => setShowContactModal(true)} />

            <main className="relative pt-32 pb-28 md:pb-24 px-4 md:px-6 z-10 w-full">
                <div className="max-w-5xl mx-auto">
                    
                    {/* Header */}
                    <div className="text-center mb-14 md:mb-20">
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50/90 border border-blue-200 text-[#1E40FF] text-xs font-bold uppercase tracking-widest mb-6 shadow-sm">
                            <Zap className="w-3.5 h-3.5" /> Source Code Sở Hữu Vĩnh Viễn
                        </motion.div>
                        <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="text-3xl md:text-5xl lg:text-6xl font-bold text-slate-900 mb-6 leading-[1.24] md:leading-[1.22] tracking-tight">
                            Bảng Báo Giá Dịch Vụ <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#1E40FF] via-[#0284C7] to-[#06B6D4]">Thiết Kế Website</span>
                        </motion.h1>
                        <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="text-slate-600 text-base md:text-xl max-w-3xl mx-auto leading-relaxed">
                            Mẫu giao diện và chức năng tương đương website tiêu chuẩn quốc tế. Cấu trúc chuẩn SEO, thiết kế may đo riêng, tăng cường chuyển đổi.
                        </motion.p>
                    </div>

                    {/* Main Content Order Wrapper */}
                    <div className="flex flex-col">
                        
                        {/* 1. Checkout Card (Top on Mobile) */}
                        <FadeIn delay={0.4} className="order-1 md:order-3 mb-10 md:mb-0">
                            <div className="relative rounded-[32px] md:rounded-[38px] p-[1.5px] bg-gradient-to-r from-[#1E40FF] via-[#0284C7] to-[#06B6D4] overflow-hidden shadow-[0_24px_60px_rgba(30,64,255,0.14)]">
                                <div className="relative bg-white/95 backdrop-blur-xl rounded-[30px] md:rounded-[36px] p-6 md:p-12 flex flex-col items-center text-center">
                                    <span className="inline-block px-3 py-1.5 md:px-4 md:py-1.5 rounded-full bg-blue-50 border border-blue-200/80 text-[10px] md:text-xs font-bold text-[#1E40FF] uppercase tracking-widest mb-3 md:mb-4">
                                        Thanh toán 1 lần • Sở hữu vĩnh viễn Source Code
                                    </span>
                                    <h3 className="text-lg md:text-2xl text-slate-600 font-bold mb-1 md:mb-2">Tổng Cộng Khoản Phí</h3>
                                    <div className="text-4xl md:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[#0F172A] via-[#1E40FF] to-[#06B6D4] mb-6 md:mb-8">
                                        <Counter to={totalPrice} /> <span className="text-xl md:text-2xl text-[#1E40FF] font-bold">VNĐ</span>
                                    </div>
                                    
                                    <div className="w-full max-w-sm mx-auto flex flex-col sm:flex-row gap-3 mb-8">
                                        <button onClick={() => setShowModal(true)} className="flex-1 btn-inkica-primary py-3.5 rounded-xl text-sm font-black shadow-[0_12px_28px_rgba(30,64,255,0.28)] active:scale-95 transition-transform cursor-pointer">
                                            Yêu cầu tư vấn
                                        </button>
                                        <button onClick={exportToExcel} className="flex-1 ql-btn-outline bg-white hover:bg-slate-50 border border-slate-200 text-slate-800 py-3.5 rounded-xl text-sm font-bold shadow-sm active:scale-95 transition-transform cursor-pointer flex items-center justify-center gap-2">
                                            <Download className="w-4 h-4 text-emerald-600" /> Xuất Báo Giá
                                        </button>
                                    </div>

                                    <div className="w-full max-w-2xl bg-slate-50/90 border border-slate-200 rounded-[20px] p-4 md:p-6 text-left mb-2 md:mb-4">
                                        <h4 className="flex items-center gap-2 font-bold text-slate-900 text-sm md:text-base mb-2 md:mb-3"><Target className="w-4 h-4 md:w-5 md:h-5 text-[#1E40FF]" /> Ghi chú duy trì</h4>
                                        <p className="text-slate-600 text-[12px] md:text-sm leading-relaxed mb-2">
                                            * Chi phí trên là phí thiết kế trọn gói <strong className="text-slate-900">trả 1 lần duy nhất</strong>.
                                        </p>
                                        <p className="text-slate-600 text-[12px] md:text-sm leading-relaxed">
                                            Từ <strong className="text-slate-900">năm thứ 2</strong> trở đi, khách hàng chỉ cần đóng phí duy trì cơ sở hạ tầng mạng (Chi phí này được thanh toán và gia hạn trực tiếp từ các nhà cung cấp dịch vụ bên thứ 3 uy tín dựa trên nhu cầu và sự chấp thuận của khách hàng):
                                        </p>
                                        <ul className="list-disc list-inside text-[12px] md:text-sm text-slate-700 mt-2 md:mt-3 space-y-1 ml-2">
                                            <li>Tên miền (.com/.vn): <strong className="text-[#1E40FF]">550.000 VNĐ</strong> / năm</li>
                                            <li>Hosting Tốc độ cao: <strong className="text-[#1E40FF]">{Object.values(addons).some(v => v) ? "1.500.000" : "660.000"} VNĐ</strong> / năm</li>
                                        </ul>
                                        <div className="mt-3 md:mt-4 pt-3 md:pt-4 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between bg-blue-50/75 border border-blue-100 rounded-xl p-3 gap-2">
                                            <span className="text-[12px] md:text-sm font-semibold text-slate-700">Tổng phí gia hạn dự kiến năm 2:</span>
                                            <span className="font-black text-[#0284C7] text-base md:text-lg">
                                                <Counter to={550000 + (Object.values(addons).some(v => v) ? 1500000 : 660000)} suffix=" VNĐ / năm" />
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </FadeIn>

                        {/* 2. Add-ons Toggles */}
                        <FadeIn delay={0.3} className="order-2 md:order-2 mb-12">
                            <div className="inkica-glass-card rounded-[28px] p-6 md:p-8 border border-white/90">
                                <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                                    <Sparkles className="w-5 h-5 text-[#1E40FF]" /> Tùy chọn nâng cao (Options)
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
                                    <div className="inkica-glass-card relative rounded-[24px] p-6 lg:p-8 flex flex-col h-full border border-white/90 hover:-translate-y-1 transition-all duration-300 group">
                                        <div className="flex items-center gap-4 mb-6">
                                            <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: `${mod.gradient}14`, border: `1px solid ${mod.gradient}28` }}>
                                                <mod.icon className="w-6 h-6" style={{ color: mod.gradient }} />
                                            </div>
                                            <div>
                                                <h3 className="text-lg font-bold text-slate-900 leading-tight">{mod.title}</h3>
                                                <div className="flex items-center gap-2 mt-1 flex-wrap">
                                                    <span className="text-xl font-black" style={{ color: mod.gradient }}>
                                                        {String(mod.price) !== "0" ? `${mod.price} VNĐ` : "Miễn Phí"}
                                                    </span>
                                                    {mod.suffix && <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-700">{mod.suffix}</span>}
                                                </div>
                                            </div>
                                        </div>
                                        
                                        <ul className="space-y-3 flex-1 mt-2">
                                            {mod.features.map((feature, j) => (
                                                <li key={j} className="flex items-start gap-3 text-sm text-slate-600">
                                                    <Check className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: mod.gradient }} />
                                                    <span className="leading-relaxed">{feature}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </FadeIn>
                            ))}
                        </div>
                    </div>
                </div>
            </main>
            
            {/* Footer */}
            <footer className="border-t border-slate-200/80 py-10 px-6 bg-white/70 backdrop-blur-md relative z-10 text-center pb-36 md:pb-32">
                <div className="max-w-7xl mx-auto flex flex-col items-center gap-3">
                    <div className="flex items-center gap-2.5">
                        <DomationLogoMark className="w-8 h-8" />
                        <span className="text-lg font-black tracking-tight text-slate-900">
                            DOMATION<span className="text-[#1E40FF]">.NET</span>
                        </span>
                    </div>
                    <p className="text-slate-500 text-sm font-medium">© {new Date().getFullYear()} DOMATION. All rights reserved.</p>
                </div>
            </footer>

            {/* Centered Scroll-to-Top Pill (above fixed price bar) */}
            <button
                type="button"
                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                className="fixed bottom-[94px] sm:bottom-[90px] left-1/2 -translate-x-1/2 z-40 inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-white/95 backdrop-blur-xl border border-slate-200 shadow-[0_8px_24px_rgba(15,23,42,0.10)] text-xs font-bold text-slate-800 hover:border-blue-300 hover:text-[#1E40FF] active:scale-95 transition-all cursor-pointer"
            >
                <ArrowUp className="w-3.5 h-3.5 text-[#1E40FF]" />
                <span>Đầu trang</span>
            </button>

            {/* Fixed Bottom Price Bar (Mobile + PC) */}
            <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-xl border-t border-slate-200 z-[50] shadow-[0_-12px_36px_rgba(15,23,42,0.08)] transition-all duration-300">
                 <div className="max-w-7xl mx-auto p-3.5 pr-28 sm:pr-44 md:pl-6 md:py-4 flex items-center justify-between gap-3">
                     <div className="flex flex-col shrink-0">
                          <span className="text-[10px] md:text-xs text-[#1E40FF] font-semibold uppercase tracking-wider mb-0.5">Tổng thiết kế</span>
                          <span className="text-xl sm:text-2xl md:text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#0F172A] via-[#1E40FF] to-[#06B6D4] leading-none whitespace-nowrap">
                              <Counter to={totalPrice} /> <span className="text-sm md:text-base text-[#1E40FF]">đ</span>
                          </span>
                     </div>
                     <div className="flex flex-col items-end gap-1">
                          <div className="flex items-center gap-2 md:gap-3">
                              <button onClick={exportToExcel} className="p-2.5 md:px-4 md:py-2.5 flex items-center gap-2 border border-slate-200 rounded-full text-emerald-700 bg-slate-50 hover:bg-emerald-50 hover:border-emerald-300 active:scale-95 transition-all cursor-pointer" title="Xuất Báo Giá Excel">
                                  <Download className="w-4 h-4" />
                                  <span className="hidden md:inline text-sm font-bold">Xuất File Báo Giá</span>
                              </button>
                              <button onClick={() => setShowModal(true)} className="btn-inkica-primary px-4 sm:px-6 md:px-8 py-2.5 rounded-full text-xs sm:text-sm font-black shadow-[0_10px_24px_rgba(30,64,255,0.26)] active:scale-95 transition-all cursor-pointer">
                                  Request
                              </button>
                          </div>
                          <span className="text-[10px] md:text-xs text-slate-500 font-medium">
                              Duy trì: <span className="text-[#0284C7] font-bold"><Counter to={550000 + (Object.values(addons).some(v => v) ? 1500000 : 660000)} /> đ/năm</span>
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
                            className="absolute inset-0 bg-slate-900/45 backdrop-blur-sm"
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
                                        <h3 className="text-2xl font-black text-slate-900 mb-1">Request Service</h3>
                                        <p className="text-slate-600 text-sm">Điền thông tin để được hỗ trợ & tư vấn chi tiết.</p>
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
                                        <div className="w-16 h-16 bg-emerald-50 border border-emerald-200 rounded-full flex items-center justify-center mb-4">
                                            <Check className="w-8 h-8 text-emerald-600" />
                                        </div>
                                        <h4 className="text-xl font-bold text-slate-900 mb-2">Gửi thành công!</h4>
                                        <p className="text-slate-600">Chúng tôi sẽ liên hệ với bạn trong thời gian sớm nhất.</p>
                                    </div>
                                ) : (
                                    <form onSubmit={handleSubmit} className="space-y-4">
                                        <div>
                                            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">Email</label>
                                            <input 
                                                type="email" 
                                                required
                                                value={formData.email}
                                                onChange={e => setFormData({...formData, email: e.target.value})}
                                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#1E40FF] focus:ring-2 focus:ring-blue-500/20 transition-all"
                                                placeholder="Nhập địa chỉ email..."
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">Số điện thoại</label>
                                            <input 
                                                type="tel" 
                                                required
                                                value={formData.phone}
                                                onChange={e => setFormData({...formData, phone: e.target.value})}
                                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#1E40FF] focus:ring-2 focus:ring-blue-500/20 transition-all"
                                                placeholder="Nhập số điện thoại..."
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">Nội dung</label>
                                            <textarea 
                                                required
                                                value={formData.message}
                                                onChange={e => setFormData({...formData, message: e.target.value})}
                                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#1E40FF] focus:ring-2 focus:ring-blue-500/20 transition-all min-h-[100px] resize-none"
                                                placeholder="Yêu cầu chi tiết của bạn..."
                                            />
                                        </div>

                                        {/* Current selection summary */}
                                        <div className="bg-blue-50/75 border border-blue-200/80 rounded-xl p-4 mt-6">
                                            <h5 className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">Thông tin tùy chọn</h5>
                                            <div className="flex justify-between items-center mb-1">
                                                 <span className="text-sm text-slate-700">Tổng phí (1 lần):</span>
                                                 <span className="text-sm font-bold text-[#1E40FF]">{totalPrice.toLocaleString()} VNĐ</span>
                                            </div>
                                            <div className="flex gap-2 flex-wrap mt-2">
                                                 {addons.sales && <span className="text-[10px] font-bold px-2 py-1 rounded bg-white text-[#1E40FF] border border-blue-200">+ Bán hàng</span>}
                                                 {addons.payment && <span className="text-[10px] font-bold px-2 py-1 rounded bg-white text-[#1E40FF] border border-blue-200">+ TT Online</span>}
                                                 {addons.users && <span className="text-[10px] font-bold px-2 py-1 rounded bg-white text-[#1E40FF] border border-blue-200">+ QL Thành viên</span>}
                                                 {addons.crmErp && <span className="text-[10px] font-bold px-2 py-1 rounded bg-white text-[#1E40FF] border border-blue-200">+ CRM & ERP</span>}
                                                 {addons.multilingual && <span className="text-[10px] font-bold px-2 py-1 rounded bg-white text-[#1E40FF] border border-blue-200">+ Đa Ngôn Ngữ</span>}
                                                 {addons.automation && <span className="text-[10px] font-bold px-2 py-1 rounded bg-white text-[#1E40FF] border border-blue-200">+ Automation</span>}
                                                 {addons.elearning && <span className="text-[10px] font-bold px-2 py-1 rounded bg-white text-[#1E40FF] border border-blue-200">+ E-Learning</span>}
                                                 {!Object.values(addons).some(Boolean) && <span className="text-[10px] text-slate-500">Mặc định (Không chọn thêm)</span>}
                                            </div>
                                        </div>

                                        <button 
                                            type="submit" 
                                            disabled={isSubmitting}
                                            className="w-full btn-inkica-primary font-black py-4 rounded-xl mt-4 flex items-center justify-center gap-2 hover:opacity-95 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shadow-[0_12px_28px_rgba(30,64,255,0.25)]"
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

            <ContactModal isOpen={showContactModal} onClose={() => setShowContactModal(false)} themeColor="blue-600" />
        </div>
    );
};



