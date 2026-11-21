import React, { useEffect, useRef, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  BarChart3,
  CheckCircle2,
  GitBranch,
  Layers,
  Pause,
  Play,
  Smartphone,
  Sparkles,
  Wallet,
} from 'lucide-react';

export interface MobileAppSlideItem {
  id: string;
  tag: string;
  title: string;
  summary: string;
  highlight: string;
  image: string;
  icon: React.ComponentType<{ className?: string }>;
}

const MOBILE_APP_SLIDES: MobileAppSlideItem[] = [
  {
    id: 'data-routing',
    tag: 'PHÂN BỔ DATA TỨC THÌ',
    title: 'Theo Dõi Chia Vòng & Hiệu Suất Lead Real-time',
    summary:
      'Giám sát tổng data tiếp nhận, tỷ lệ chia vòng thành công 100%, lọc trùng 6 tháng, xử lý ticket data lỗi và xem lưu lượng đổ số theo ngày/giờ ngay trên di động.',
    highlight: 'Chia vòng 100% · Chống trùng 0% · Lịch sử theo giờ',
    image: '/imgs/mobile-showcase/06-data-routing-live.jpg',
    icon: GitBranch,
  },
  {
    id: 'overview-platform',
    tag: 'TỔNG QUAN CHIẾN DỊCH',
    title: 'Đo Lường Hiệu Quả Đa Kênh Facebook, Reels & Threads',
    summary:
      'Nắm bắt tức thì số chiến dịch đang chạy, lượt xem Video 3s, ThruPlay, Link Click và phân bổ ngân sách chi tiết theo từng nền tảng trên cùng một màn hình dọc.',
    highlight: 'Facebook 92.2% · CTR 0.88% · Đầy đủ chỉ số Video',
    image: '/imgs/mobile-showcase/01-overview-platform.jpg',
    icon: BarChart3,
  },
  {
    id: 'campaign-tree',
    tag: 'CÂY CHIẾN DỊCH ĐA TẦNG',
    title: 'Mở Nhóm Quảng Cáo & Soi CPQL Theo Từng Mẫu Ad',
    summary:
      'Giao diện thẻ mobile chuyên biệt giúp vuốt xem nhanh Spent, Results, CPR và mở cây Campaign → Adset → Ad mượt mà không cần phóng to bảng Excel.',
    highlight: 'Card mobile tối ưu · Mở insight 1 chạm · Đếm Adset',
    image: '/imgs/mobile-showcase/02-campaign-tree.jpg',
    icon: Layers,
  },
  {
    id: 'ai-insight',
    tag: 'AI PHÂN TÍCH CHUYÊN SÂU',
    title: 'Biểu Đồ Xu Hướng Ngày & Trợ Lý AI Chẩn Đoán Camp',
    summary:
      'Theo dõi biến động chi tiêu từng ngày bằng biểu đồ mượt, đối chiếu Reach, Impressions, CPC và kích hoạt AI gợi ý tối ưu ngân sách trực tiếp khi đang di chuyển.',
    highlight: 'AI Diagnostic 1 chạm · Daily Trend · Cảnh báo CPR',
    image: '/imgs/mobile-showcase/03-insight-ai-trend.jpg',
    icon: Sparkles,
  },
  {
    id: 'creative-breakdown',
    tag: 'CREATIVE & 8 CHIỀU META',
    title: 'Xem Trước Mẫu Quảng Cáo & Phân Rã Feed / Stories / Reels',
    summary:
      'Kiểm tra hình ảnh, thông điệp từng bài quảng cáo đi kèm bảng phân rã 8 chiều dữ liệu Meta Graph API (Placement, Tuổi, Giới tính, Khu vực, Thiết bị).',
    highlight: 'Preview Creatives · Feed / Stories / Reels · 8 Breakdowns',
    image: '/imgs/mobile-showcase/04-creative-breakdown.jpg',
    icon: CheckCircle2,
  },
  {
    id: 'ad-account-vat',
    tag: 'TÀI KHOẢN & DỰ BÁO VAT',
    title: 'Kiểm Soát Dư Nợ, Hạn Mức Cap & Thuế VAT +10%',
    summary:
      'Theo dõi thẻ thanh toán Visa/Mastercard, ước tính chi phí gồm VAT 10%, hạn mức chi tiêu tài khoản doanh nghiệp và biểu đồ ngân sách lũy kế cả năm.',
    highlight: 'Mastercard Billing · Dự toán VAT 10% · Lũy kế theo tháng',
    image: '/imgs/mobile-showcase/05-ad-account-vat.jpg',
    icon: Wallet,
  },
];

const AUTODATA_MOBILE_SLIDES: MobileAppSlideItem[] = [
  {
    id: 'autodata-delivery-history',
    tag: 'LỊCH SỬ GIAO ĐẠI LÝ F1',
    title: 'Theo Dõi Từng Data Đã Giao Tới Địa Ốc Tùng Long, Hợp Nhất, IHD',
    summary:
      'Danh sách lịch sử chia vòng mới nhất hiển thị rõ avatar từng Đại lý F1, vòng phân bổ tương ứng và bảng xếp hạng Top Sale nhận số công bằng.',
    highlight: 'Avatar Đại lý F1 · Minh bạch từng lượt · Bảng xếp hạng',
    image: '/imgs/mobile-showcase/08-autodata-delivery-history.jpg',
    icon: GitBranch,
  },
  {
    id: 'autodata-leads-cards',
    tag: 'QUẢN LÝ DATA & NGUỒN AD',
    title: 'Thẻ Khách Hàng Đính Kèm Bài Quảng Cáo & Chất Lượng Pipeline',
    summary:
      'Mỗi thẻ khách hàng trên mobile hiển thị đầy đủ trạng thái Thiện chí, Đã hẹn gặp, mã Ad ID nguồn thu về kèm nút xem Insight tức thì bằng 1 chạm.',
    highlight: 'Card mobile gọn đẹp · Preview Ad ID · Check trùng 6 tháng',
    image: '/imgs/mobile-showcase/10-autodata-leads-cards.jpg',
    icon: Layers,
  },
  {
    id: 'autodata-bottom-sheet',
    tag: 'IOS BOTTOM SHEET CHI TIẾT',
    title: 'Trượt Bottom Sheet Xem Hồ Sơ, Ghi Chú & Nguồn Chuyển Đổi',
    summary:
      'Trải nghiệm trượt từ đáy màn hình chuẩn iOS/Android Mobile App: bấm xem nhanh SĐT, email, mã Ad ID chuyển đổi và ghi chú nhu cầu thật của khách.',
    highlight: 'Native Bottom Sheet · Chép nhanh 1 chạm · Đính kèm Ad ID',
    image: '/imgs/mobile-showcase/11-autodata-bottom-sheet.jpg',
    icon: CheckCircle2,
  },
  {
    id: 'autodata-tickets',
    tag: 'DUYỆT TICKET LỖI DATA',
    title: 'Xử Lý & Bù Lượt Khiếu Nại Sai Số Từ Đại Lý F1 Ngay Lập Tức',
    summary:
      'Quản lý có thể duyệt hoặc từ chối ticket báo lỗi từ đại lý ngay trên điện thoại với thanh Bottom App Bar hiển thị badge đếm số phiếu đang chờ.',
    highlight: 'Badge đếm ticket · Duyệt / Từ chối 1 chạm · Tự động bù lượt',
    image: '/imgs/mobile-showcase/09-autodata-ticket-approval.jpg',
    icon: Sparkles,
  },
  {
    id: 'autodata-routing-chart',
    tag: 'HIỆU SUẤT XỬ LÝ DATA',
    title: 'Biểu Đồ Lưu Lượng Đổ Số Theo Ngày, Giờ & Heatmap Real-time',
    summary:
      'Theo dõi tốc độ đổ Lead về hệ thống theo từng ngày và khung giờ cao điểm giúp điều phối nhân sự trực số kịp thời không bỏ lỡ khách nóng.',
    highlight: 'Theo ngày / giờ / Heatmap · Giám sát 0% trùng lặp',
    image: '/imgs/mobile-showcase/06-data-routing-live.jpg',
    icon: BarChart3,
  },
  {
    id: 'autodata-meta-tree',
    tag: 'ĐỐI CHIẾU META ADS MOBILE',
    title: 'Mở Nhóm Quảng Cáo & Soi CPQL Theo Từng Chiến Dịch Trên Mobile',
    summary:
      'Xem ngay chi phí quảng cáo, số khách hàng đổ về CRM và hiệu quả từng nhóm quảng cáo trên cùng một thanh Bottom App Bar.',
    highlight: 'Đồng bộ Ads × CRM · Mở insight 1 chạm · Đếm Adset',
    image: '/imgs/mobile-showcase/02-campaign-tree.jpg',
    icon: Wallet,
  },
];

const HOME_MOBILE_SLIDES: MobileAppSlideItem[] = [
  AUTODATA_MOBILE_SLIDES[0],
  AUTODATA_MOBILE_SLIDES[1],
  AUTODATA_MOBILE_SLIDES[2],
  AUTODATA_MOBILE_SLIDES[3],
  MOBILE_APP_SLIDES[1],
  MOBILE_APP_SLIDES[2],
];

const AUTOMATION_MOBILE_SLIDES: MobileAppSlideItem[] = [
  {
    id: 'auto-mobile-dashboard',
    tag: 'TỔNG QUAN MARKETING',
    title: 'Cockpit Đa Kênh Email, Flow & Intent Trên Mobile',
    summary:
      'Theo dõi tức thì lượt gửi Email AWS SES, số kịch bản Automation đang chạy, khách truy cập web ý định cao và hội thoại Social ngay trên điện thoại.',
    highlight: '46.7K Email • 17 Active Flows • 0px tràn ngang',
    image: '/imgs/automation/mobile-marketing-dashboard.png',
    icon: BarChart3,
  },
  {
    id: 'auto-mobile-flows',
    tag: 'FLOW ENGINE DI ĐỘNG',
    title: 'Quản Lý Kịch Bản & Bật/Tắt Flow Chỉ Với 1 Chạm',
    summary:
      'Lọc nhanh Đang chạy / Tạm dừng, kiểm tra số bước, lượt tham gia và tỷ lệ hoàn thành từng Flow tự động hóa chuẩn giao diện iOS.',
    highlight: 'Segmented Tabs 1 hàng • Thao tác > 44px',
    image: '/imgs/automation/mobile-automation-flows.png',
    icon: GitBranch,
  },
  {
    id: 'auto-mobile-campaigns',
    tag: 'CHIẾN DỊCH AWS SES & ZNS',
    title: 'Giám Sát Open Rate & CTR Chiến Dịch Mọi Lúc',
    summary:
      'Kiểm soát hạn mức gửi 14 email/giây, tiến độ broadcast Email & Zalo ZNS và mở nhanh chi tiết từng chiến dịch khi đang di chuyển.',
    highlight: 'Open 22.8% • AWS SES 14/s • Live Progress',
    image: '/imgs/automation/mobile-email-campaigns.png',
    icon: Layers,
  },
  {
    id: 'auto-mobile-social-bot',
    tag: 'SOCIAL BOT & ZALO OA',
    title: 'Điều Phối Meta Messenger & Zalo ZNS Tập Trung',
    summary:
      'Chuyển mượt giữa Fanpage Messenger và Zalo Official Account, bật/tắt kịch bản chatbot AI RAG và chăm sóc hội thoại khách hàng 24/7.',
    highlight: 'Meta 24h Window • Zalo OA • Safe Dock Padding',
    image: '/imgs/automation/mobile-social-bot.png',
    icon: Sparkles,
  },
];

const DOM_AI_MOBILE_SLIDES: MobileAppSlideItem[] = [
  {
    id: 'dom-ai-portal-chat',
    tag: 'PORTAL TRỢ LÝ AI BYOK',
    title: 'Trợ Lý Tri Thức Nội Bộ 24/7 Theo Từng Dự Án',
    summary:
      'Đội ngũ Sale & Đại lý truy cập nhanh qua link riêng /ai/du-an ngay trên điện thoại để tra cứu quy trình, bảng giá và chính sách chuẩn của chủ đầu tư.',
    highlight: 'Thương hiệu DOMATION · Chọn phạm vi tài liệu 1 chạm',
    image: '/imgs/mobile-showcase/dom-ai-01-portal-chat.jpg',
    icon: Sparkles,
  },
  {
    id: 'dom-ai-qa-demo',
    tag: 'HỎI ĐÁP RAG KÈM TRÍCH DẪN',
    title: 'Trả Lời Chuyên Sâu Chính Sách Giá & Chiết Khấu Dưới 1 Giây',
    summary:
      'Hỏi trực tiếp bảng giá 2PN–3PN, chiết khấu thanh toán sớm 95% hay lãi suất 0%: AI trả lời chuẩn xác theo tài liệu nội bộ kèm thẻ nguồn trích dẫn.',
    highlight: 'Độ trễ 0.4s · Đính kèm Nguồn Trích Dẫn · Không bịa số',
    image: '/imgs/mobile-showcase/dom-ai-03-chat-qa-demo.jpg',
    icon: CheckCircle2,
  },
  {
    id: 'dom-ai-collections',
    tag: 'KHO TRI THỨC (22+ TÀI LIỆU)',
    title: 'Tìm Tài Liệu Dự Án & Bấm "Hỏi AI Về Tài Liệu Này"',
    summary:
      'Tra cứu nhanh danh mục vật liệu, tiện ích 60 hạng mục hay thông báo mở giỏ hàng đợt 1 với ô tìm kiếm gọn mượt và nút hỏi AI tức thì.',
    highlight: '22+ Tài liệu & Q&A · Đọc Markdown · Hỏi AI 1 chạm',
    image: '/imgs/mobile-showcase/dom-ai-02-collections.jpg',
    icon: Layers,
  },
  {
    id: 'dom-ai-studio-dashboard',
    tag: 'DOM AI STUDIO MOBILE',
    title: 'Quản Trị Portal AI, Lượt Hỏi & Cắm Gemini API Key Riêng',
    summary:
      'Theo dõi tổng câu hỏi RAG, người dùng hoạt động và chuyển đổi giữa nhiều Portal AI theo từng dự án ngay trên màn hình quản trị di động.',
    highlight: 'Miễn phí 100% BYOK · Đa Portal · Giám sát real-time',
    image: '/imgs/mobile-showcase/dom-ai-04-studio-dashboard.jpg',
    icon: BarChart3,
  },
  {
    id: 'dom-ai-studio-training',
    tag: 'ĐÀO TẠO & PHÂN NHÓM RAG',
    title: 'Sắp Xếp 5 Bộ Sưu Tập Tri Thức & Chuyển Log Thành Q&A',
    summary:
      'Tạo và phân loại bộ sưu tập Tổng quan, Sản phẩm, Pháp lý, Tiện ích EDGE, Quy trình Sale trực quan để khoanh vùng phạm vi trả lời của AI.',
    highlight: '5 Bộ sưu tập · Tự động Reindex Chunks · Sửa nhanh',
    image: '/imgs/mobile-showcase/dom-ai-06-studio-training.jpg',
    icon: GitBranch,
  },
  {
    id: 'dom-ai-prescreener',
    tag: 'AI PRE-SCREENER LỌC DATA',
    title: 'Tự Động Sàng Lọc Lead Rác & Đánh Giá Chất Lượng Trên Di Động',
    summary:
      'Hệ thống AI Pre-screener kiểm tra 100% Lead đổ về, tự động giữ lại số nghi ngờ/dưới chuẩn để đội vận hành duyệt nhanh trước khi chia cho Sale.',
    highlight: 'Đạt chuẩn 100% · Chống spam tức thì · Hàng chờ duyệt',
    image: '/imgs/mobile-showcase/dom-ai-05-prescreener.jpg',
    icon: Wallet,
  },
];

export interface MobileAppShowcaseSectionProps {
  variant?: 'home' | 'data' | 'meta' | 'crm' | 'erp' | 'dom-ai' | 'automation';
  id?: string;
}

const VARIANT_COPY: Record<
  NonNullable<MobileAppShowcaseSectionProps['variant']>,
  { badge: string; headingLead: string; headingAccent: string; desc: string }
> = {
  home: {
    badge: 'VẬN HÀNH LINH HOẠT TRÊN ĐIỆN THOẠI',
    headingLead: 'Báo Cáo & Phân Bổ Data',
    headingAccent: 'Ngay Trên Mobile',
    desc: 'Thiết kế chuẩn Mobile App mượt mà — CEO và Trưởng phòng dễ dàng soi hiệu quả từng bài quảng cáo, kiểm soát chia số cho Sale và duyệt dữ liệu mọi lúc.',
  },
  data: {
    badge: 'AUTO DATA MOBILE EXPERIENCE',
    headingLead: 'Quản Trị & Chia Lead',
    headingAccent: 'Tức Thì Trên Mobile',
    desc: 'Theo dõi tỷ lệ chia vòng real-time, duyệt ticket báo lỗi từ Đại lý F1/Sale và đối soát trực tiếp ngân sách quảng cáo ngay trên smartphone.',
  },
  meta: {
    badge: 'DOM META ON MOBILE',
    headingLead: 'Soi Chiến Dịch & CAPI',
    headingAccent: 'Chuẩn App Di Động',
    desc: 'Mọi biểu đồ Daily Trend, Video Hook Rate, phân rã 8 chiều và Lead CRM đều được tái cấu trúc gọn gàng cho thao tác một tay trên smartphone.',
  },
  crm: {
    badge: 'CRM CHỐT ĐƠN DI ĐỘNG',
    headingLead: 'Nắm Trọn Nguồn Khách',
    headingAccent: 'Mọi Lúc Mọi Nơi',
    desc: 'Quản lý vòng chia data và kiểm tra nguồn Lead từ từng mẫu quảng cáo Facebook ngay trên điện thoại với tốc độ phản hồi dưới 1 giây.',
  },
  erp: {
    badge: 'ERP ĐIỀU HÀNH DI ĐỘNG',
    headingLead: 'Điều Hành Doanh Số & Ads',
    headingAccent: 'Trong Lòng Bàn Tay',
    desc: 'Đồng bộ từ chi phí Meta Ads gồm VAT đến tỷ lệ chia Lead CRM cho đội ngũ Sale & Đại lý trên giao diện di động chuẩn native app.',
  },
  'dom-ai': {
    badge: 'DOM AI ASSISTANT BYOK & PRE-SCREENER',
    headingLead: 'Trợ Lý AI Tri Thức RAG',
    headingAccent: 'Ngay Trên Mobile',
    desc: 'Tra cứu tài liệu nội bộ kèm trích dẫn nguồn, hỏi đáp với Gemini API Key riêng, quản trị DOM AI Studio và theo dõi AI Pre-screener mọi lúc.',
  },
  automation: {
    badge: 'TRẢI NGHIỆM MOBILE CHUẨN APP iOS',
    headingLead: 'Theo Dõi Chiến Dịch &',
    headingAccent: 'Duyệt Flow Trên Mobile',
    desc: 'Toàn bộ Marketing Cockpit, Kịch bản Automation, Chiến dịch AWS SES và Social Bot đều tối ưu mượt mà cho màn hình 390px với thao tác 1 tay.',
  },
};

const AUTO_SLIDE_MS = 4500;

export const MobileAppShowcaseSection: React.FC<MobileAppShowcaseSectionProps> = ({
  variant = 'home',
  id = 'mobile-experience',
}) => {
  const [activeIdx, setActiveIdx] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const touchStartX = useRef<number | null>(null);
  const copy = VARIANT_COPY[variant] || VARIANT_COPY.home;
  const slides =
    variant === 'meta'
      ? MOBILE_APP_SLIDES
      : variant === 'dom-ai'
        ? DOM_AI_MOBILE_SLIDES
        : variant === 'automation'
          ? AUTOMATION_MOBILE_SLIDES
          : variant === 'home'
            ? HOME_MOBILE_SLIDES
            : AUTODATA_MOBILE_SLIDES;

  const total = slides.length;
  const safeActiveIdx = activeIdx % total;
  const prevIdx = (safeActiveIdx - 1 + total) % total;
  const nextIdx = (safeActiveIdx + 1) % total;
  const current = slides[safeActiveIdx];

  useEffect(() => {
    if (isPaused) return;
    if (typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
      return;
    }
    const timer = window.setInterval(() => {
      setActiveIdx((i) => (i + 1) % total);
    }, AUTO_SLIDE_MS);
    return () => window.clearInterval(timer);
  }, [isPaused, total]);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0]?.clientX ?? null;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const endX = e.changedTouches[0]?.clientX ?? touchStartX.current;
    const dx = endX - touchStartX.current;
    touchStartX.current = null;
    if (Math.abs(dx) > 40) {
      setActiveIdx((i) => (dx < 0 ? (i + 1) % total : (i - 1 + total) % total));
    }
  };

  return (
    <section
      id={id}
      className="relative py-14 sm:py-20 px-4 sm:px-6 lg:px-8 overflow-hidden"
      aria-label="Trải nghiệm xem báo cáo và phân bổ data trên điện thoại"
    >
      <div className="max-w-7xl mx-auto">
        <div
          className="relative rounded-3xl bg-gradient-to-br from-[#F8FAFF] via-white to-[#F0F7FF] border border-blue-200/75 shadow-[0_24px_64px_-28px_rgba(30,64,255,0.16)] p-5 sm:p-8 lg:p-11 overflow-hidden"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          {/* Ambient Royal Sapphire Glows */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -top-24 -right-24 w-72 h-72 rounded-full bg-gradient-to-br from-[#1E40FF]/12 to-[#06B6D4]/12 blur-3xl"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -bottom-24 -left-24 w-72 h-72 rounded-full bg-gradient-to-tr from-[#06B6D4]/10 to-[#1E40FF]/10 blur-3xl"
          />

          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center">
            {/* LEFT: Heading + 6 Interactive Feature Tabs + Controls */}
            <div className="lg:col-span-6 space-y-5">
              <div className="space-y-3">
                <div className="ql-eyebrow">
                  <Smartphone className="w-3.5 h-3.5 text-[#1E40FF]" />
                  <span>{copy.badge}</span>
                </div>
                <h2 className="text-[20px] sm:text-2xl lg:text-[32px] font-extrabold text-slate-900 leading-[1.2] tracking-tight">
                  {copy.headingLead}{' '}
                  <span className="text-gradient-inkica">{copy.headingAccent}</span>
                </h2>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-xl">
                  {copy.desc}
                </p>
              </div>

              {/* Interactive Screen Selector Grid (compact 2-col on mobile + sm for zero tall stacking) */}
              <div className="grid grid-cols-2 gap-2 sm:gap-2.5">
                {slides.map((item, idx) => {
                  const IconComp = item.icon;
                  const active = idx === safeActiveIdx;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setActiveIdx(idx)}
                      className={`group text-left rounded-xl sm:rounded-2xl p-2.5 sm:p-3 border transition-all duration-300 cursor-pointer relative overflow-hidden ${
                        active
                          ? 'bg-white border-[#1E40FF]/60 shadow-[0_10px_28px_-10px_rgba(30,64,255,0.28)]'
                          : 'bg-white/65 hover:bg-white border-slate-200/80 hover:border-blue-200'
                      }`}
                    >
                      <div className="flex items-start gap-2 sm:gap-2.5">
                        <div
                          className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                            active
                              ? 'bg-gradient-to-br from-[#1E40FF] to-[#06B6D4] text-white shadow-sm'
                              : 'bg-slate-100 text-slate-600 group-hover:bg-blue-50 group-hover:text-[#1E40FF]'
                          }`}
                        >
                          <IconComp className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-1">
                            <span
                              className={`text-[9px] sm:text-[10px] font-bold uppercase tracking-wider truncate ${
                                active ? 'text-[#1E40FF]' : 'text-slate-400'
                              }`}
                            >
                              {item.tag}
                            </span>
                            <span className="hidden sm:inline text-[10px] font-mono text-slate-400 shrink-0">
                              0{idx + 1}
                            </span>
                          </div>
                          <div
                            className={`text-[11px] sm:text-xs font-bold leading-snug mt-0.5 line-clamp-2 ${
                              active ? 'text-slate-900' : 'text-slate-700'
                            }`}
                          >
                            {item.title}
                          </div>
                        </div>
                      </div>
                      {active && !isPaused && (
                        <div
                          key={`bar-${activeIdx}`}
                          className="mt-2 h-0.5 rounded-full bg-slate-100 overflow-hidden"
                        >
                          <div
                            className="h-full bg-gradient-to-r from-[#1E40FF] to-[#06B6D4]"
                            style={{
                              animation: `domMobileSlideProgress ${AUTO_SLIDE_MS}ms linear forwards`,
                            }}
                          />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Active Slide Detail Strip + Playback Controls */}
              <div className="rounded-2xl bg-white/90 border border-slate-200/80 p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="min-w-0 space-y-1">
                  <div className="text-[11px] font-semibold text-[#1E40FF] truncate">
                    {current.highlight}
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed line-clamp-2">
                    {current.summary}
                  </p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
                  <button
                    type="button"
                    aria-label="Màn hình trước"
                    onClick={() => setActiveIdx(prevIdx)}
                    className="w-9 h-9 rounded-full border border-slate-200 bg-slate-50 hover:bg-blue-50 hover:border-blue-200 hover:text-[#1E40FF] text-slate-600 flex items-center justify-center transition-colors cursor-pointer"
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    aria-label={isPaused ? 'Tiếp tục chạy slide' : 'Tạm dừng slide'}
                    onClick={() => setIsPaused((p) => !p)}
                    className="w-9 h-9 rounded-full border border-slate-200 bg-slate-50 hover:bg-blue-50 hover:border-blue-200 hover:text-[#1E40FF] text-slate-600 flex items-center justify-center transition-colors cursor-pointer"
                  >
                    {isPaused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
                  </button>
                  <button
                    type="button"
                    aria-label="Màn hình tiếp theo"
                    onClick={() => setActiveIdx(nextIdx)}
                    className="w-9 h-9 rounded-full bg-[#1E40FF] hover:bg-blue-700 text-white flex items-center justify-center shadow-sm transition-colors cursor-pointer"
                  >
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* RIGHT: 3-Phone Depth Carousel with Center Titanium iPhone Frame */}
            <div
              className="lg:col-span-6 relative flex flex-col items-center justify-center select-none"
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
            >
              <div className="relative w-full flex items-center justify-center py-2">
                {/* Left Side-Peek Phone (< Prev) */}
                <button
                  type="button"
                  aria-label={`Xem ${slides[prevIdx].title}`}
                  onClick={() => setActiveIdx(prevIdx)}
                  className="hidden sm:block absolute left-2 xl:left-4 z-10 w-[180px] lg:w-[196px] rounded-[28px] p-1.5 bg-slate-900/90 border border-slate-700/70 shadow-xl opacity-55 hover:opacity-85 scale-[0.82] -translate-x-4 hover:-translate-x-2 transition-all duration-500 cursor-pointer overflow-hidden"
                >
                  <div className="rounded-[22px] overflow-hidden bg-white aspect-[516/1024]">
                      <img
                        src={slides[prevIdx].image}
                        alt={slides[prevIdx].title}
                        loading="lazy"
                        decoding="async"
                        className="w-full h-full object-contain object-top"
                      />
                  </div>
                </button>

                {/* Right Side-Peek Phone (Next >) */}
                <button
                  type="button"
                  aria-label={`Xem ${slides[nextIdx].title}`}
                  onClick={() => setActiveIdx(nextIdx)}
                  className="hidden sm:block absolute right-2 xl:right-4 z-10 w-[180px] lg:w-[196px] rounded-[28px] p-1.5 bg-slate-900/90 border border-slate-700/70 shadow-xl opacity-55 hover:opacity-85 scale-[0.82] translate-x-4 hover:translate-x-2 transition-all duration-500 cursor-pointer overflow-hidden"
                >
                  <div className="rounded-[22px] overflow-hidden bg-white aspect-[516/1024]">
                    <img
                      src={slides[nextIdx].image}
                      alt={slides[nextIdx].title}
                      loading="lazy"
                      decoding="async"
                      className="w-full h-full object-contain object-top"
                    />
                  </div>
                </button>

                {/* Center Flagship iPhone Frame */}
                <div className="relative z-20 w-[262px] sm:w-[286px] rounded-[42px] p-[9px] bg-gradient-to-b from-slate-700 via-slate-900 to-slate-800 shadow-[0_32px_70px_-18px_rgba(15,23,42,0.45),0_0_0_1px_rgba(255,255,255,0.18)_inset]">
                  <div className="relative rounded-[34px] overflow-hidden bg-white flex flex-col">
                    {/* Dedicated iOS Status Bar + Dynamic Island (Never obscures app header!) */}
                    <div
                      aria-hidden="true"
                      className="relative z-30 h-7 px-4 bg-white flex items-center justify-between text-[10px] font-bold text-slate-900 shrink-0 border-b border-slate-100/80"
                    >
                      <span className="tabular-nums">09:41</span>
                      <div className="w-[74px] h-[18px] rounded-full bg-slate-950 flex items-center justify-end pr-2 shadow-inner border border-slate-800">
                        <span className="w-2 h-2 rounded-full bg-indigo-950 ring-1 ring-white/15" />
                      </div>
                      <span className="flex items-center gap-1 text-[9px] text-slate-700">
                        <span>5G</span>
                        <span className="inline-block w-4 h-2 rounded-[3px] border border-slate-400 p-[1px]">
                          <span className="block w-full h-full rounded-[1px] bg-emerald-500" />
                        </span>
                      </span>
                    </div>

                    {/* Screen Viewport */}
                    <div className="relative w-full aspect-[516/1024] bg-white overflow-hidden">
                      {slides.map((slide, idx) => (
                        <img
                          key={slide.id}
                          src={slide.image}
                          alt={slide.title}
                          loading="lazy"
                          decoding="async"
                          className={`absolute inset-0 w-full h-full object-contain object-top transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                            idx === safeActiveIdx
                              ? 'opacity-100 scale-100'
                              : idx === prevIdx
                                ? 'opacity-0 -translate-x-6 scale-[0.97] pointer-events-none'
                                : 'opacity-0 translate-x-6 scale-[0.97] pointer-events-none'
                          }`}
                        />
                      ))}

                      {/* Subtle Home Indicator Bar */}
                      <div
                        aria-hidden="true"
                        className="pointer-events-none absolute bottom-1.5 left-1/2 -translate-x-1/2 w-24 h-1 rounded-full bg-slate-900/20"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Dots + Live Counter */}
              <div className="mt-4 flex items-center justify-center gap-2">
                {slides.map((s, idx) => (
                  <button
                    key={s.id}
                    type="button"
                    aria-label={`Chuyển tới màn hình ${idx + 1}: ${s.title}`}
                    onClick={() => setActiveIdx(idx)}
                    className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${
                      idx === safeActiveIdx
                        ? 'w-7 bg-gradient-to-r from-[#1E40FF] to-[#06B6D4]'
                        : 'w-2 bg-slate-300 hover:bg-slate-400'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes domMobileSlideProgress {
          from { width: 0%; }
          to { width: 100%; }
        }
      `}</style>
    </section>
  );
};

export default MobileAppShowcaseSection;
