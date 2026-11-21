import React from 'react';
import {
  ArrowDown,
  ArrowRight,
  BarChart3,
  CheckCircle2,
  Filter,
  RefreshCw,
  Sparkles,
  Users,
  Zap,
} from 'lucide-react';
import { ResponsiveSlideDeck } from './ResponsiveSlideDeck';

export interface ClosedLoopSixCardSectionProps {
  variant?: 'home' | 'data' | 'meta' | 'automation';
}

interface LoopCardItem {
  step: string;
  tag: string;
  title: string;
  desc: string;
  metric: string;
  accentBg: string;
  accentText: string;
  icon: React.ComponentType<{ className?: string }>;
}

const TOP_ROW_CARDS: LoopCardItem[] = [
  {
    step: '01',
    tag: 'Không sót khách',
    title: 'Khách Nhắn Là Hệ Thống Nhận Ngay',
    desc: 'Khách từ Facebook, TikTok hay Website tự động gom về một nơi trong tích tắc, không cần nhân viên copy tay.',
    metric: 'Tự động 100%',
    accentBg: 'bg-blue-50 border-blue-200/80',
    accentText: 'text-[#1E40FF]',
    icon: Zap,
  },
  {
    step: '02',
    tag: 'Tránh tranh khách',
    title: 'Tự Lọc Số Rác & Khách Cũ Quay Lại',
    desc: 'Phát hiện khách cũ để đưa thẳng về đúng Sale đang chăm, đồng thời loại bỏ số sai định dạng trước khi chia.',
    metric: 'Công bằng nội bộ',
    accentBg: 'bg-cyan-50 border-cyan-200/80',
    accentText: 'text-cyan-700',
    icon: Filter,
  },
  {
    step: '03',
    tag: 'Gọi lúc còn nóng',
    title: 'Chia Tức Thì — Xoay Vòng Công Bằng',
    desc: 'Báo ngay qua Zalo cho Sale đang trực theo lượt xoay vòng công bằng, giữ đúng nhịp gọi khi khách vừa quan tâm.',
    metric: 'Không lo nguội khách',
    accentBg: 'bg-indigo-50 border-indigo-200/80',
    accentText: 'text-indigo-700',
    icon: Users,
  },
];

const BOTTOM_ROW_CARDS: LoopCardItem[] = [
  {
    step: '04',
    tag: 'Kiểm soát Sale',
    title: 'Quản Lý Sát Sao Từng Bước Chăm Khách',
    desc: 'Sếp nhìn một màn hình biết ngay từng khách đang ở đâu: mới tư vấn, đang cân nhắc hay đã mua hàng.',
    metric: 'Chống Sale bỏ sót',
    accentBg: 'bg-emerald-50 border-emerald-200/80',
    accentText: 'text-emerald-700',
    icon: CheckCircle2,
  },
  {
    step: '05',
    tag: 'Biết rõ lời lỗ',
    title: 'Biết Ngay Bài Quảng Cáo Nào Ra Tiền',
    desc: 'Doanh thu chốt đơn cộng ngược về đúng chiến dịch tạo ra khách, sếp thấy rõ bài nào sinh lời, bài nào đốt tiền.',
    metric: 'Đo hiệu quả thực',
    accentBg: 'bg-amber-50 border-amber-200/80',
    accentText: 'text-amber-700',
    icon: BarChart3,
  },
  {
    step: '06',
    tag: 'Càng chạy càng rẻ',
    title: 'Tự Dạy Quảng Cáo Tìm Đúng Khách Mua',
    desc: 'Hệ thống báo Conversion API cho Facebook biết ai đã mua thật, giúp lần sau quảng cáo tự tìm người giống khách chốt đơn.',
    metric: 'Giảm dần số rác',
    accentBg: 'bg-blue-50 border-blue-200/80',
    accentText: 'text-[#1E40FF]',
    icon: Sparkles,
  },
];

const AUTOMATION_TOP_CARDS: LoopCardItem[] = [
  {
    step: '01',
    tag: 'Thu Lead & Chống trùng',
    title: 'Nhận Khách Từ Form, Survey & Webhook',
    desc: 'Gom Lead từ Landing Page, Elementor, Form nhúng & API v1 có chữ ký HMAC-SHA256, tự lọc trùng và gắn Phân khúc ngay lập tức.',
    metric: '21+ Biểu mẫu & API',
    accentBg: 'bg-blue-50 border-blue-200/80',
    accentText: 'text-[#1E40FF]',
    icon: Zap,
  },
  {
    step: '02',
    tag: 'AWS SES 14/giây',
    title: 'Gửi Email Studio Kèm Countdown SVG',
    desc: 'Kéo thả Template chuyên nghiệp, chèn biến cá nhân hóa, Open Pixel + Click Wrap và đồng hồ đếm ngược SVG render động từ backend.',
    metric: 'Token-Bucket 14/s',
    accentBg: 'bg-sky-50 border-sky-200/80',
    accentText: 'text-[#0284C7]',
    icon: Sparkles,
  },
  {
    step: '03',
    tag: 'Flow IF/ELSE & Wait',
    title: 'Tự Động Rẽ Nhánh Theo Hành Vi Thật',
    desc: 'Wait Delay lưu trạng thái vào PostgreSQL không ngốn RAM, đánh thức đúng bước kế và phân nhánh theo Mở Mail, Click link hoặc Ý định Web.',
    metric: 'Zero-Duplicate Cron',
    accentBg: 'bg-cyan-50 border-cyan-200/80',
    accentText: 'text-cyan-700',
    icon: Filter,
  },
];

const AUTOMATION_BOTTOM_CARDS: LoopCardItem[] = [
  {
    step: '04',
    tag: '06:00–22:00 VN',
    title: 'Nhắc Lịch Zalo OA, ZNS & Social Bot',
    desc: 'Tự động chuẩn hóa SĐT 0xxx ↔ 84xxx, lùi lịch ngoài khung giờ đêm, tự làm mới OAuth token và gộp hội thoại Messenger + Zalo về 1 màn hình.',
    metric: 'ZNS Compliance Guard',
    accentBg: 'bg-blue-50 border-blue-200/80',
    accentText: 'text-[#0068FF]',
    icon: Users,
  },
  {
    step: '05',
    tag: 'RAG 150+ Tài liệu',
    title: 'Chatbot AI Tri Thức & Web Tracking Intent',
    desc: 'Huấn luyện AI Bot theo tài liệu riêng từng thương hiệu, ghi nhận phiên xem bảng giá (/pricing) và tự phát mã Voucher/QR cá nhân hóa.',
    metric: '98.4% Độ chính xác RAG',
    accentBg: 'bg-emerald-50 border-emerald-200/80',
    accentText: 'text-emerald-700',
    icon: CheckCircle2,
  },
  {
    step: '06',
    tag: 'Scale 1 Chạm',
    title: 'Dùng Độc Lập Hoặc Bật CRM & Meta CAPI',
    desc: 'Chạy App Marketing hoàn toàn tách biệt không lẫn menu ERP — khi quy mô lớn chỉ cần bật thêm Chia số Sale ZaloBot & Meta CAPI 2xx.',
    metric: 'PostgreSQL Multi-Tenant RLS',
    accentBg: 'bg-amber-50 border-amber-200/80',
    accentText: 'text-amber-700',
    icon: BarChart3,
  },
];

const renderCard = (card: LoopCardItem) => {
  const Icon = card.icon;
  return (
    <div
      key={card.step}
      className="group relative h-full rounded-2xl bg-white border border-slate-200/90 hover:border-blue-300 shadow-[0_6px_20px_-14px_rgba(15,23,42,0.12)] hover:shadow-[0_14px_30px_-16px_rgba(30,64,255,0.22)] transition-all p-5 flex flex-col justify-between gap-4"
    >
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <span className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#1E40FF] to-[#06B6D4] text-white flex items-center justify-center shadow-xs shrink-0">
              <Icon className="w-4 h-4" />
            </span>
            <span className="text-[11px] font-mono font-bold text-[#1E40FF] bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-md">
              BƯỚC {card.step}
            </span>
          </div>
          <span
            className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border ${card.accentBg} ${card.accentText}`}
          >
            {card.tag}
          </span>
        </div>

        <h3 className="text-[15px] sm:text-base font-bold text-slate-900 leading-snug">
          {card.title}
        </h3>
        <p className="text-xs sm:text-[13px] text-slate-600 leading-relaxed">
          {card.desc}
        </p>
      </div>

      <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] font-semibold text-slate-500">
        <span>{card.metric}</span>
        <span className="w-2 h-2 rounded-full bg-[#1E40FF]/75" />
      </div>
    </div>
  );
};

export const ClosedLoopSixCardSection: React.FC<ClosedLoopSixCardSectionProps> = ({
  variant = 'home',
}) => {
  const isAutomation = variant === 'automation';
  const topCards = isAutomation ? AUTOMATION_TOP_CARDS : TOP_ROW_CARDS;
  const bottomCards = isAutomation ? AUTOMATION_BOTTOM_CARDS : BOTTOM_ROW_CARDS;

  const eyebrowText = isAutomation
    ? '6 TRỤ CỘT AUTOMATION • THU LEAD → FLOW → ZALO ZNS → CHỐT ĐƠN'
    : variant === 'meta'
      ? 'VÒNG LẶP TỰ TỐI ƯU • QUẢNG CÁO → CHỐT ĐƠN → TÌM KHÁCH CHUẨN'
      : 'QUY TRÌNH 6 BƯỚC • NHẬN KHÁCH → CHIA SALE → BÁO CÁO LỜI LỖ';

  return (
    <section
      id="closed-loop"
      className="scroll-mt-24 py-10 sm:py-16 px-4 sm:px-6 lg:px-8"
    >
      <div className="max-w-7xl mx-auto">
        <div className="rounded-[28px] bg-white/90 backdrop-blur-xl border border-slate-200/85 shadow-[0_20px_56px_-28px_rgba(30,64,255,0.14)] p-5 sm:p-8 lg:p-10">
          {/* Concise Executive Header */}
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-3 mb-7 sm:mb-9 text-center lg:text-left">
            <div className="space-y-2 max-w-2xl mx-auto lg:mx-0">
              <div className="ql-eyebrow mx-auto lg:mx-0">
                <RefreshCw className="w-3.5 h-3.5 text-[#1E40FF] shrink-0" />
                <span>{eyebrowText}</span>
              </div>
              <h2 className="text-[20px] sm:text-3xl font-bold text-slate-900 leading-[1.24] tracking-tight">
                {isAutomation ? (
                  <>
                    Kịch Bản Đa Kênh Chạy Chuẩn{' '}
                    <span className="text-gradient-inkica">— Từng Điểm Chạm Ra Đơn</span>
                  </>
                ) : (
                  <>
                    Khách Hỏi Là Có Sale Gọi{' '}
                    <span className="text-gradient-inkica">— Rõ Từng Đồng Doanh Thu</span>
                  </>
                )}
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto lg:mx-0 leading-relaxed">
              {isAutomation
                ? 'Kết hợp Email AWS SES, Flow IF/ELSE, Zalo ZNS, Chatbot AI RAG và Web Tracking trên một lõi Multi-Tenant bảo mật.'
                : '6 bước vận hành tự động từ lúc khách để lại số đến khi chốt hợp đồng — giúp Sếp kiểm soát đội Sale và biết bài quảng cáo nào thực sự sinh lời.'}
            </p>
          </div>

          {/* MOBILE & TABLET (< lg): Native Swipe Carousel + SlideDots */}
          <div className="lg:hidden">
            <ResponsiveSlideDeck
              items={[...topCards, ...bottomCards]}
              mobilePerPage={1}
              mobileColsClass="grid-cols-1"
              tabletPerPage={2}
              tabletColsClass="grid-cols-2"
              gapClass="gap-3.5"
              ariaLabel="Quy trình 6 bước vận hành tự động"
              keyExtractor={(card) => card.step}
              renderItem={(card) => renderCard(card)}
            />
          </div>

          {/* DESKTOP (>= lg): Dual 3+3 Flow with Center Connector */}
          <div className="hidden lg:block">
            {/* TOP ROW — 3 CARDS (01 -> 02 -> 03) */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6 relative">
              {topCards.map((card, idx) => (
                <div key={card.step} className="relative h-full">
                  {renderCard(card)}
                  {idx < topCards.length - 1 && (
                    <div
                      aria-hidden="true"
                      className="hidden lg:flex absolute top-1/2 -right-5 -translate-y-1/2 z-10 w-4 h-4 items-center justify-center rounded-full bg-white border border-blue-200 text-[#1E40FF] shadow-2xs"
                    >
                      <ArrowRight className="w-2.5 h-2.5" />
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* CENTER CONNECTOR BRIDGE (TOP ROW <-> BOTTOM ROW) */}
            <div className="relative my-5 sm:my-6 flex items-center justify-center">
              <div
                aria-hidden="true"
                className="absolute inset-x-4 sm:inset-x-10 h-px bg-gradient-to-r from-blue-200/40 via-[#1E40FF]/50 to-cyan-300/60"
              />
              <div className="relative z-10 inline-flex items-center gap-2 sm:gap-3 px-4 sm:px-5 py-2 rounded-full bg-gradient-to-r from-[#EEF4FF] via-white to-[#ECFEFF] border border-blue-200/90 shadow-xs text-[11px] sm:text-xs font-bold text-slate-800">
                <span className="w-6 h-6 rounded-full bg-[#1E40FF] text-white flex items-center justify-center shrink-0">
                  <ArrowDown className="w-3.5 h-3.5" />
                </span>
                <span className="whitespace-nowrap">
                  {isAutomation ? (
                    <>
                      ĐỒNG BỘ HÀNH VI • <span className="text-[#1E40FF]">EMAIL &amp; ZALO ZNS</span> ↔{' '}
                      <span className="text-cyan-700">AI RAG &amp; CRM</span>
                    </>
                  ) : (
                    <>
                      ĐỒNG BỘ TỰ ĐỘNG • <span className="text-[#1E40FF]">CHỐT ĐƠN TỪ SALE</span> ↔{' '}
                      <span className="text-cyan-700">TỐI ƯU QUẢNG CÁO</span>
                    </>
                  )}
                </span>
                <span className="w-6 h-6 rounded-full bg-cyan-50 border border-cyan-200 text-cyan-700 flex items-center justify-center shrink-0">
                  <RefreshCw className="w-3 h-3" />
                </span>
              </div>
            </div>

            {/* BOTTOM ROW — 3 CARDS (04 -> 05 -> 06) */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6 relative">
              {bottomCards.map((card, idx) => (
                <div key={card.step} className="relative h-full">
                  {renderCard(card)}
                  {idx < bottomCards.length - 1 && (
                    <div
                      aria-hidden="true"
                      className="hidden lg:flex absolute top-1/2 -right-5 -translate-y-1/2 z-10 w-4 h-4 items-center justify-center rounded-full bg-white border border-blue-200 text-[#1E40FF] shadow-2xs"
                    >
                      <ArrowRight className="w-2.5 h-2.5" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ClosedLoopSixCardSection;
