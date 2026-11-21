import React from 'react';
import {
  BarChart3,
  Bot,
  Expand,
  Globe2,
  MessageSquareHeart,
  Radar,
  ShieldCheck,
  Sparkles,
  Ticket,
} from 'lucide-react';
import { SmoothAppImage } from '../SmoothAppImage';

interface AutomationAnalyticsAiSectionProps {
  onInspectImage: (imageSrc: string, title: string, subtitle?: string) => void;
}

const FEATURED_SPOTLIGHTS = [
  {
    id: 'campaign-drawer',
    eyebrow: 'CAMPAIGN ANALYTICS DRAWER',
    title: 'Báo Cáo Từng Chiến Dịch: Open Rate, CTR & Từng Liên Kết Click',
    desc: 'Lấy cảm hứng từ độ sắc nét của Meta Ad Report: Drawer bật mượt ngay trên màn hình, hiển thị biểu đồ Phễu, danh sách từng Link được bấm nhiều nhất và thiết bị đọc Mail.',
    image: '/imgs/automation/campaign-detail-drawer.png',
    icon: BarChart3,
    accentClass: 'text-[#1E40FF] bg-blue-50 border-blue-200',
    stats: ['Phễu Sent → Open → Click', 'Top Link Attribution', 'Mobile/Desktop Breakdown'],
  },
  {
    id: 'ai-rag',
    eyebrow: 'ENTERPRISE AI RAG KNOWLEDGE',
    title: 'Đào Tạo Bot AI Bằng 150+ Tài Liệu Riêng Theo Từng Thương Hiệu',
    desc: 'Upload PDF, URL, FAQ hoặc Bảng giá riêng cho từng website. AI hiểu sâu sản phẩm, trả lời 1.850+ hội thoại chính xác theo tri thức nội bộ và chuyển CRM khi phát hiện Intent mua.',
    image: '/imgs/automation/ai-bot-training.png',
    icon: Bot,
    accentClass: 'text-emerald-700 bg-emerald-50 border-emerald-200',
    stats: ['98.4% RAG Accuracy', 'Multi-Brand Workspace', 'Tự tắt Bot khi Sale vào'],
  },
  {
    id: 'web-tracking',
    eyebrow: 'FIRST-PARTY WEB INTENT & HEATMAP',
    title: 'Đo Lường 54.652+ Phiên Web & Nối Ngược Lịch Sử Ẩn Danh',
    desc: 'Ghi nhận thời gian đọc, cuộn trang, click xem Bảng giá và tự động nối ngược (Retroactive Stitch) toàn bộ hành vi web trước đó ngay khi khách điền Form lần đầu.',
    image: '/imgs/automation/web-tracking.png',
    icon: Radar,
    accentClass: 'text-[#DC2626] bg-red-50 border-red-200',
    stats: ['294 Tín hiệu Bảng giá', 'Top CTA Heatmap', 'Không phụ thuộc Cookie 3P'],
  },
  {
    id: 'zalo-oa-messenger',
    eyebrow: 'ZALO OA, ZNS & MESSENGER BOT',
    title: 'Chăm Sóc Song Song Meta Messenger & Zalo OA ZNS Trong 1 Cổng',
    desc: 'Tự động gửi tin ZNS giao dịch đúng khung giờ 06:00–22:00, phân nhóm khách theo quy tắc 24h Meta Messenger và giữ đồng bộ toàn bộ lịch sử chăm sóc.',
    image: '/imgs/automation/social-bot-zalo.png',
    icon: MessageSquareHeart,
    accentClass: 'text-[#0284C7] bg-sky-50 border-sky-200',
    stats: ['Zalo OA 4 Tabs Clean UI', 'Meta X-Hub-Signature', 'Chống trùng 0xxx ↔ 84xxx'],
  },
];

const COMPACT_MODULES = [
  {
    icon: ShieldCheck,
    title: 'Khảo Sát Ma Trận & Điểm NPS Tự Động',
    desc: 'Hiển thị biểu đồ Recharts tĩnh nét cao, giải mã chuẩn &/% và tự gắn Tag phân khúc theo điểm hài lòng.',
    image: '/imgs/automation/survey-report-modal.png',
    tag: 'Survey Analytics',
  },
  {
    icon: Ticket,
    title: 'Kho Voucher Độc Bản, Link Rút Gọn & QR',
    desc: 'Phát mã cá nhân hóa theo Lead, nhúng Form API nhận ưu đãi chuẩn v1 và quét QR tại sự kiện.',
    image: '/imgs/automation/vouchers-qr.png',
    tag: 'Voucher & QR',
  },
  {
    icon: Globe2,
    title: 'Thư Viện 116+ Mẫu Thiết Kế Email Đã Việt Hóa',
    desc: 'Tải tức thì qua ảnh thumbnail WebP, chấm điểm chống Spam real-time và nhân bản 1 chạm.',
    image: '/imgs/automation/email-templates.png',
    tag: 'Template Library',
  },
];

export const AutomationAnalyticsAiSection: React.FC<AutomationAnalyticsAiSectionProps> = ({
  onInspectImage,
}) => {
  return (
    <section
      id="analytics-ai"
      className="scroll-mt-24 py-10 sm:py-16 px-4 sm:px-6 lg:px-8 relative z-10"
    >
      <div className="max-w-7xl mx-auto space-y-8 sm:space-y-10">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto space-y-2.5">
          <div className="ql-eyebrow mx-auto">
            <Sparkles className="w-3.5 h-3.5 text-[#1E40FF] shrink-0" />
            <span>BÁO CÁO CHUẨN META REPORT • AI TRI THỨC & ĐA KÊNH</span>
          </div>
          <h2 className="text-2xl sm:text-3xl lg:text-[36px] font-bold text-slate-900 leading-[1.2] tracking-tight">
            Mọi Điểm Chạm Marketing Đều{' '}
            <span className="text-gradient-inkica">Đo Lường Được Bằng Con Số Thực</span>
          </h2>
          <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
            Thiết kế tối giản chuẩn iOS — loại bỏ các bảng biểu rườm rà, tập trung thẳng vào tỷ lệ
            mở, CTR, tín hiệu nóng Website và hiệu quả AI tự động chốt lịch.
          </p>
        </div>

        {/* 2x2 Bento Spotlights */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-6">
          {FEATURED_SPOTLIGHTS.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.id}
                className="group rounded-[24px] bg-white/92 backdrop-blur-xl border border-slate-200/90 shadow-[0_18px_48px_-24px_rgba(15,23,42,0.12)] hover:border-blue-300 transition-all overflow-hidden flex flex-col justify-between"
              >
                <div className="p-5 sm:p-6 space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={`inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border ${item.accentClass}`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      <span>{item.eyebrow}</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => onInspectImage(item.image, item.title, item.desc)}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-[#1E40FF] hover:underline cursor-pointer"
                    >
                      <Expand className="w-3.5 h-3.5" />
                      <span>Xem lớn</span>
                    </button>
                  </div>

                  <h3 className="text-base sm:text-lg font-bold text-slate-900 leading-snug">
                    {item.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                    {item.desc}
                  </p>

                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {item.stats.map((st) => (
                      <span
                        key={st}
                        className="text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-[#F8FAFF] border border-slate-200/85 text-slate-700"
                      >
                        {st}
                      </span>
                    ))}
                  </div>
                </div>

                <div
                  onClick={() => onInspectImage(item.image, item.title, item.desc)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      onInspectImage(item.image, item.title, item.desc);
                    }
                  }}
                  aria-label={`Xem màn hình ${item.title}`}
                  className="mx-4 mb-4 sm:mx-5 sm:mb-5 rounded-2xl border border-slate-200/85 overflow-hidden bg-slate-50 cursor-zoom-in"
                >
                  <SmoothAppImage
                    src={item.image}
                    alt={item.title}
                    aspectClass="aspect-[16/10]"
                    fit="contain"
                    bgClass="bg-slate-50"
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* 3 Secondary Deep Modules */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {COMPACT_MODULES.map((mod) => {
            const Icon = mod.icon;
            return (
              <div
                key={mod.title}
                onClick={() => onInspectImage(mod.image, mod.title, mod.desc)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onInspectImage(mod.image, mod.title, mod.desc);
                  }
                }}
                aria-label={`Phóng to ${mod.title}`}
                className="group rounded-2xl bg-white/92 border border-slate-200/90 hover:border-blue-300 shadow-xs hover:shadow-md transition-all p-4 flex flex-col justify-between gap-4 cursor-zoom-in"
              >
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="w-8 h-8 rounded-xl bg-blue-50 text-[#1E40FF] border border-blue-200/80 flex items-center justify-center">
                      <Icon className="w-4 h-4" />
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600">
                      {mod.tag}
                    </span>
                  </div>
                  <h3 className="text-sm sm:text-[15px] font-bold text-slate-900 leading-snug">
                    {mod.title}
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed">{mod.desc}</p>
                </div>

                <div className="rounded-xl border border-slate-200/80 overflow-hidden bg-slate-50">
                  <SmoothAppImage
                    src={mod.image}
                    alt={mod.title}
                    aspectClass="aspect-[16/10]"
                    fit="contain"
                    bgClass="bg-slate-50"
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
