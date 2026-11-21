import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowRight,
  BarChart3,
  BookOpen,
  Bot,
  CheckCircle2,
  Code2,
  ExternalLink,
  FileText,
  FolderOpen,
  Globe,
  GraduationCap,
  KeyRound,
  Layers,
  Lock,
  MessageSquare,
  Palette,
  Search,
  ShieldCheck,
  Sparkles,
  ThumbsUp,
  UserCheck,
  Zap,
  ZoomIn,
} from 'lucide-react';
import { Navbar } from './Navbar';
import { ContactModal } from './ContactModal';
import { LuxuryGoldBackdrop } from './LuxuryGoldBackdrop';
import { DomationFooter } from './components/DomationFooter';
import { BackToTopPill } from './components/BackToTopPill';
import { FounderAuthorityBlock } from './components/FounderAuthorityBlock';
import { SPECIALIST_ZALO_URL } from './components/common/ZaloSpecialistBanner';
import { MobileAppShowcaseSection } from './components/MobileAppShowcaseSection';
import { MotionVideoShowcase } from './components/MotionVideoShowcase';
import { ResponsiveSlideDeck } from './components/ResponsiveSlideDeck';
import { FaqAccordionSection } from './components/FaqAccordionSection';
import { ImageZoomModal } from './components/GlassModal';
import { DOM_AI_FAQS, getDomAiSeoConfig } from './data/coreRouteSeo';
import { usePageSeo } from './utils/seo';
import { handleSpaLinkClick } from './utils/navigation';

type ShowcaseScreenId = 'portal-chat' | 'collection-vault' | 'admin-dashboard' | 'admin-training';

interface ShowcaseScreen {
  id: ShowcaseScreenId;
  tabLabel: string;
  badge: string;
  title: string;
  desc: string;
  urlBar: string;
  src: string;
  highlights: string[];
}

const DOM_AI_TRUSTED_PARTNERS = [
  { name: 'RichLand', logo: '/assets/partners/partner_richland.webp' },
  { name: 'EcoLife Signature', logo: '/assets/partners/logo_ecolife_ngang.webp' },
  { name: 'Capital House', logo: '/assets/partners/logo_capital_house.webp' },
  { name: 'Viện IDEAS', logo: '/assets/partners/logo_ideas.webp' },
  { name: 'Nha Khoa Flora', logo: '/assets/partners/partner_flora.webp' },
];

const SHOWCASE_SCREENS: ShowcaseScreen[] = [
  {
    id: 'admin-training',
    tabLabel: 'Huấn Luyện RAG & Log Q&A',
    badge: '01 • RAG TRAINING & 1-CLICK Q&A',
    title: 'Nạp Tài Liệu, Kiểm Thử RAG & Chuyển Log Thành Q&A 1 Chạm',
    desc: 'Tải lên file .md/.txt/.csv, chạy Reindex chunks tức thì, kiểm thử truy vấn RAG ngay trên giao diện quản trị và biến mọi câu hỏi thực tế trong Log thành Q&A chuẩn chỉ với 1 cú nhấp.',
    urlBar: 'https://erp.domation.net/dom-ai-studio#training',
    src: '/imgs/dom-ai/admin-training.png',
    highlights: [
      'Upload nhanh .txt / .md / .csv hoặc biên soạn Q&A trực tiếp',
      'Sandbox Kiểm thử Truy vấn RAG xem điểm khớp từng chunk',
      '1-Click "Chuyển thành Q&A Huấn luyện" ngay từ Log người dùng',
    ],
  },
  {
    id: 'collection-vault',
    tabLabel: 'Kho Tài Liệu & Collections',
    badge: '02 • KNOWLEDGE VAULT',
    title: 'Kho Tài Liệu Đa Danh Mục & Tìm Kiếm Toàn Văn Tức Thì',
    desc: 'Phân loại toàn bộ quy trình SOP, bảng giá, chính sách và Q&A vào từng bộ sưu tập trực quan. Người dùng đọc văn bản ngay trong modal và nhấn 1 chạm "Hỏi AI về tài liệu này".',
    urlBar: 'https://erp.domation.net/ai/ten-du-an#collections',
    src: '/imgs/dom-ai/collection-vault.png',
    highlights: [
      'Lọc nhanh theo Bộ sưu tập, loại tài liệu & từ khóa',
      'Trình đọc Markdown sạch, không cần tải ứng dụng ngoài',
      'Nút "Hỏi AI" trên từng tài liệu giúp tra cứu sâu tức thì',
    ],
  },
  {
    id: 'portal-chat',
    tabLabel: '3-Pane AI Chat Studio',
    badge: '03 • USER PORTAL /ai/ten-du-an',
    title: 'Không Gian Trò Chuyện AI 3 Cột Kèm Nguồn Trích Dẫn',
    desc: 'Sidebar trái quản lý Group & lịch sử hội thoại, sân khấu trung tâm trả lời Markdown sắc nét kèm thẻ trích dẫn bấm xem tài liệu gốc, và ngăn Kho Tri Thức đóng mở linh hoạt bên phải.',
    urlBar: 'https://erp.domation.net/ai/ten-du-an',
    src: '/imgs/dom-ai/portal-chat.png',
    highlights: [
      'Phạm vi hỏi theo từng Collection hoặc toàn bộ kho tri thức',
      'Thẻ Nguồn Trích Dẫn (Citations) bấm mở ngay văn bản gốc',
      'Đánh giá 👍/👎 & góp ý trực tiếp để đội ngũ huấn luyện AI',
    ],
  },
  {
    id: 'admin-dashboard',
    tabLabel: 'Admin Dashboard Thống Kê',
    badge: '04 • ADMIN SUITE META REPORT STYLE',
    title: 'Dashboard Thống Kê Lưu Lượng Hỏi, Hài Lòng & Top Tài Liệu',
    desc: 'Ban lãnh đạo và quản trị viên nắm trọn số lượt hỏi theo ngày, người dùng hoạt động, tỷ lệ hài lòng 👍/👎, độ trễ phản hồi AI và tài liệu nào được đội ngũ tra cứu nhiều nhất.',
    urlBar: 'https://erp.domation.net/dom-ai-studio',
    src: '/imgs/dom-ai/admin-dashboard.png',
    highlights: [
      '4 thẻ KPI tổng quan: Lượt hỏi, Active Users, Hài lòng, Độ trễ',
      'Biểu đồ xu hướng hỏi đáp theo ngày & Top tài liệu trích dẫn',
      'Quản lý đa Portal trên cùng một không gian DOM AI Studio',
    ],
  },
];

const AUTH_MODES = [
  {
    step: 'MODE 01',
    icon: Globe,
    tag: 'KHÔNG RÀO CẢN',
    title: 'Bypass Mở Công Khai',
    desc: 'Khách hàng hoặc cộng tác viên chỉ cần mở đường dẫn là trò chuyện AI và tra cứu tài liệu ngay lập tức — không cần đăng ký tài khoản.',
    useCases: ['Cổng tra cứu sản phẩm / chính sách công khai', 'Nhúng Iframe trực tiếp lên Website / Landing Page', 'Tối ưu tốc độ tiếp cận cho khách hàng mới'],
    accent: 'from-[#1E40FF] to-[#0284C7]',
  },
  {
    step: 'MODE 02',
    icon: UserCheck,
    tag: 'KHUYÊN DÙNG',
    title: 'Đăng Nhập Lưu Lịch Sử',
    desc: 'Người dùng nhập nhanh Email & Họ tên để tự động đồng bộ lịch sử trò chuyện, tạo Group thư mục riêng và gắn sao các câu trả lời quan trọng.',
    useCases: ['Đội ngũ Sale, Đại lý F1, Đối tác phân phối', 'Tự động lưu lịch sử hỏi đáp trên mọi thiết bị', 'Thống kê người dùng hoạt động rõ ràng theo Email'],
    accent: 'from-[#0284C7] to-[#06B6D4]',
  },
  {
    step: 'MODE 03',
    icon: Lock,
    tag: 'BẢO MẬT NỘI BỘ',
    title: 'Whitelist Phân Quyền Collection',
    desc: 'Chỉ những Email có trong danh sách Viewer được Admin phê duyệt (kèm tùy chọn Access Code) mới được truy cập đúng các bộ tài liệu được giao.',
    useCases: ['Kho tri thức nội bộ HR, Pháp lý, Kế toán, Ban Giám Đốc', 'Phân quyền chi tiết từng Collection cho từng nhân sự', 'Nhập hàng loạt Email và tạm khóa/mở quyền tức thì'],
    accent: 'from-[#0F172A] to-[#1E40FF]',
  },
];

const QUICK_START_STEPS = [
  {
    step: '01',
    icon: KeyRound,
    title: 'Tạo Portal & Cắm Gemini API Key Miễn Phí',
    desc: 'Đặt tên Portal, chọn đường dẫn /ai/ten-du-an, tùy biến Logo & màu thương hiệu rồi dán Gemini API Key lấy miễn phí từ Google AI Studio (mã hóa AES-256).',
    meta: 'Hoàn tất trong ~60 giây',
  },
  {
    step: '02',
    icon: FolderOpen,
    title: 'Nạp Tài Liệu, Chia Collections & Test RAG',
    desc: 'Tổ chức tài liệu theo từng chủ đề, tải lên file .md/.txt/.csv hoặc soạn Q&A chuẩn. Dùng Sandbox Kiểm thử Truy vấn RAG để kiểm chứng độ chính xác trước khi phát hành.',
    meta: 'Tự động tách chunk & trích dẫn',
  },
  {
    step: '03',
    icon: BarChart3,
    title: 'Chia Sẻ Link /ai/ten-du-an & Theo Dõi Log',
    desc: 'Gửi link độc lập cho nhân sự/khách hàng hoặc nhúng Iframe vào Website. Giám sát Dashboard thống kê và chuyển các câu hỏi thực tế thành Q&A bằng 1 chạm.',
    meta: 'Càng dùng AI càng thông minh',
  },
];

const FEATURE_GRID = [
  {
    icon: MessageSquare,
    tag: '3-PANE STUDIO',
    title: 'Giao Diện 3 Cột Chuyên Nghiệp',
    desc: 'Thiết kế tối giản chuẩn DOMATION với Sidebar quản lý Group/Starred, luồng chat Markdown sắc nét và ngăn Kho Tài Liệu đóng mở mượt mà trên cả Mobile & Desktop.',
  },
  {
    icon: BookOpen,
    tag: 'RAG TRÍCH DẪN NGUỒN',
    title: 'Trả Lời Chính Xác — Không Bịa Số Liệu',
    desc: 'Mọi câu trả lời đều bám sát tài liệu nội bộ và đính kèm thẻ Nguồn trích dẫn bấm xem ngay văn bản gốc, loại bỏ hoàn toàn nỗi lo AI trả lời sai lệch.',
  },
  {
    icon: BarChart3,
    tag: 'META REPORT ANALYTICS',
    title: 'Dashboard Đo Lường Hiệu Quả Thực',
    desc: 'Theo dõi tổng lượt hỏi theo ngày, người dùng hoạt động, độ trễ trung bình, tỷ lệ hài lòng 👍/👎 và bảng xếp hạng tài liệu được tra cứu nhiều nhất.',
  },
  {
    icon: GraduationCap,
    tag: '1-CLICK Q&A TRAINING',
    title: 'Vòng Lặp Tự Học Từ Log Hội Thoại',
    desc: 'Lọc các câu hỏi nhận góp ý 👎 trong Log, biên tập lại câu trả lời chuẩn rồi nhấn "Chuyển thành Q&A" để AI lập tức ghi nhớ cho mọi lần hỏi tiếp theo.',
  },
  {
    icon: Palette,
    tag: 'MULTI-TENANT WHITE-LABEL',
    title: '100% Thương Hiệu Riêng & Zero Hardcode',
    desc: 'Tùy biến Logo, màu sắc chủ đạo, lời chào, System Prompt, mô hình Gemini và câu hỏi gợi ý riêng cho từng doanh nghiệp, ngành nghề hoặc phòng ban.',
  },
  {
    icon: Code2,
    tag: 'EMBED & SHARE',
    title: 'Link Độc Lập Hoặc Nhúng Iframe 1 Dòng',
    desc: 'Chạy độc lập tại /ai/ten-du-an với giao diện Sáng/Tối tự động, hoặc sao chép sẵn mã nhúng Iframe đưa trực tiếp vào Website, Intranet và Landing Page.',
  },
];

/**
 * Rich Architectural Live-UI Fallback Preview rendered gracefully if /imgs/dom-ai/*.png
 * has not yet been captured onto disk. Automatically yields to the real PNG when available.
 */
const ScreenLiveFallback: React.FC<{ screenId: ShowcaseScreenId }> = ({ screenId }) => {
  if (screenId === 'portal-chat') {
    return (
      <div className="w-full aspect-[16/10] bg-[#F8FAFC] grid grid-cols-12 text-left overflow-hidden select-none">
        {/* Left Sidebar Miniature */}
        <div className="hidden sm:flex col-span-3 bg-white border-r border-slate-200/90 p-3 flex-col justify-between">
          <div className="space-y-2.5">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
              <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-[#1E40FF] to-[#06B6D4] flex items-center justify-center text-white">
                <Sparkles className="w-3.5 h-3.5" />
              </div>
              <div className="text-[11px] font-bold text-slate-900 truncate">Doanh Nghiệp AI</div>
            </div>
            <div className="px-2.5 py-1.5 rounded-lg bg-[#1E40FF] text-white text-[10px] font-bold flex items-center justify-between">
              <span>Trò chuyện AI</span>
              <Sparkles className="w-3 h-3" />
            </div>
            <div className="px-2.5 py-1.5 rounded-lg bg-slate-100 text-slate-700 text-[10px] font-semibold flex items-center justify-between">
              <span>Kho Tài Liệu</span>
              <span className="px-1.5 py-0.5 rounded-full bg-white text-[9px] text-[#1E40FF] font-bold">24</span>
            </div>
            <div className="pt-2 space-y-1">
              <div className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Groups</div>
              <div className="px-2 py-1 rounded-md bg-blue-50/70 text-[10px] text-[#1E40FF] font-semibold">Chính sách 2026</div>
              <div className="px-2 py-1 rounded-md text-[10px] text-slate-600">Đào tạo Onboarding</div>
            </div>
          </div>
          <div className="pt-2 border-t border-slate-100 flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-[#1E40FF] text-white text-[9px] font-bold flex items-center justify-center">AN</div>
            <div className="min-w-0">
              <div className="text-[10px] font-bold text-slate-800 truncate">Minh An</div>
              <div className="text-[9px] text-slate-400 truncate">an@congty.vn</div>
            </div>
          </div>
        </div>

        {/* Center Chat Stage */}
        <div className="col-span-12 sm:col-span-6 p-4 flex flex-col justify-between bg-[#F8FAFC]">
          <div className="space-y-3">
            <div className="flex justify-end">
              <div className="px-3.5 py-2 rounded-2xl rounded-br-sm bg-gradient-to-r from-[#1E40FF] to-[#0284C7] text-white text-[11px] font-medium max-w-[85%] shadow-xs">
                Tóm tắt quy trình phê duyệt hợp đồng và chính sách chiết khấu Q4?
              </div>
            </div>
            <div className="rounded-2xl bg-white border border-slate-200 p-3.5 shadow-xs space-y-2">
              <div className="flex items-center gap-1.5 text-[10px] font-bold text-[#1E40FF]">
                <Sparkles className="w-3 h-3" />
                <span>DOM AI Assistant</span>
                <span className="text-slate-400 font-mono font-normal">• 1.2s</span>
              </div>
              <p className="text-[11px] text-slate-700 leading-relaxed">
                Theo <strong>Quy chế Bán hàng 2026</strong>, hợp đồng có giá trị từ 100 triệu đồng được duyệt qua 2 cấp trong vòng 4 giờ làm việc. Mức chiết khấu áp dụng từ <strong>5% – 12%</strong> tùy tiến độ thanh toán.
              </p>
              <div className="flex flex-wrap gap-1.5 pt-1 border-t border-slate-100">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-50 border border-blue-200/70 text-[9.5px] font-semibold text-[#1E40FF]">
                  <FileText className="w-2.5 h-2.5" /> Quy chế Bán hàng 2026
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-50 border border-blue-200/70 text-[9.5px] font-semibold text-[#1E40FF]">
                  <FileText className="w-2.5 h-2.5" /> Bảng Chiết Khấu Q4
                </span>
              </div>
            </div>
          </div>

          <div className="mt-3 flex items-center gap-2 p-2 rounded-xl bg-white border border-slate-200 shadow-xs">
            <span className="px-2 py-0.5 rounded-full bg-blue-50 text-[9.5px] font-semibold text-[#1E40FF]">
              Toàn bộ kho
            </span>
            <span className="text-[11px] text-slate-400 flex-1 truncate">
              Nhập câu hỏi tra cứu tài liệu doanh nghiệp...
            </span>
            <div className="w-6 h-6 rounded-lg bg-[#1E40FF] text-white flex items-center justify-center">
              <ArrowRight className="w-3 h-3" />
            </div>
          </div>
        </div>

        {/* Right Vault Panel */}
        <div className="hidden sm:flex col-span-3 bg-white border-l border-slate-200/90 p-3 flex-col gap-2">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1">
            <BookOpen className="w-3 h-3 text-[#1E40FF]" />
            <span>Kho Tri Thức</span>
          </div>
          <div className="px-2 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-[10px] text-slate-400 flex items-center gap-1">
            <Search className="w-3 h-3" /> Tìm tài liệu...
          </div>
          {[
            { title: 'Quy chế Bán hàng & Duyệt HĐ', tag: 'Chính sách' },
            { title: 'Sổ tay Onboarding Nhân sự', tag: 'SOP' },
            { title: 'Câu hỏi thường gặp Khách hàng', tag: 'Q&A' },
          ].map((doc) => (
            <div key={doc.title} className="p-2 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
              <div className="text-[10px] font-bold text-slate-800 line-clamp-1">{doc.title}</div>
              <div className="flex items-center justify-between">
                <span className="text-[9px] text-slate-400">{doc.tag}</span>
                <span className="px-1.5 py-0.5 rounded bg-[#1E40FF] text-white text-[8.5px] font-bold">Hỏi AI</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (screenId === 'collection-vault') {
    return (
      <div className="w-full aspect-[16/10] bg-[#F8FAFC] p-4 sm:p-6 flex flex-col gap-4 overflow-hidden select-none text-left">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-[#1E40FF]">Kho Tài Liệu &amp; Collections</div>
            <div className="text-sm font-bold text-slate-900">Tra Cứu Văn Bản, Quy Trình &amp; Q&amp;A Doanh Nghiệp</div>
          </div>
          <div className="flex items-center gap-1.5">
            {['Tất cả (24)', 'Chính sách (8)', 'SOP Nội bộ (9)', 'Q&A (7)'].map((tab, i) => (
              <span
                key={tab}
                className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                  i === 0 ? 'bg-[#1E40FF] text-white' : 'bg-white border border-slate-200 text-slate-600'
                }`}
              >
                {tab}
              </span>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 flex-1">
          {[
            { col: 'Chính sách', title: 'Chính Sách Chiết Khấu & Thanh Toán 2026', desc: 'Tổng hợp mức chiết khấu theo bậc giá trị, điều kiện thanh toán nhanh và biểu mẫu phê duyệt.' },
            { col: 'SOP Nội bộ', title: 'Quy Trình Tiếp Nhận & Xử Lý Khách Hàng', desc: 'Các bước SLA phản hồi trong 120 giây, kịch bản tư vấn tiêu chuẩn và bàn giao phòng ban.' },
            { col: 'Q&A Chuẩn', title: 'Bộ 50 Câu Hỏi Thường Gặp Từ Đối Tác', desc: 'Giải đáp nhanh về bảo hành, xuất hóa đơn điện tử, hợp đồng khung và chính sách hỗ trợ.' },
            { col: 'Sản phẩm', title: 'Danh Mục Thông Số Kỹ Thuật & Gói Dịch Vụ', desc: 'So sánh chi tiết tính năng giữa các gói dịch vụ, thời gian triển khai và cam kết SLA.' },
            { col: 'Nhân sự', title: 'Sổ Tay Hội Nhập Nhân Sự Mới (Onboarding)', desc: 'Hướng dẫn sử dụng công cụ làm việc, quy định chấm công, nghỉ phép và lộ trình đào tạo.' },
            { col: 'Pháp lý', title: 'Mẫu Hợp Đồng Chuẩn & Phụ Lục Bảo Mật NDA', desc: 'Điều khoản tiêu chuẩn, danh mục hồ sơ cần kiểm tra trước khi trình Ban Giám Đốc ký duyệt.' },
          ].map((item) => (
            <div key={item.title} className="rounded-xl bg-white border border-slate-200/90 p-3 flex flex-col justify-between">
              <div className="space-y-1">
                <span className="px-2 py-0.5 rounded-full bg-blue-50 text-[#1E40FF] text-[9px] font-bold uppercase">
                  {item.col}
                </span>
                <div className="text-[11px] font-bold text-slate-900 line-clamp-1">{item.title}</div>
                <p className="text-[10px] text-slate-500 line-clamp-2 leading-relaxed">{item.desc}</p>
              </div>
              <div className="pt-2 mt-2 border-t border-slate-100 flex items-center justify-between text-[9.5px] font-bold">
                <span className="text-slate-500">Đọc tài liệu</span>
                <span className="text-[#1E40FF]">✦ Hỏi AI</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (screenId === 'admin-dashboard') {
    return (
      <div className="w-full aspect-[16/10] bg-[#F8FAFC] p-4 sm:p-6 flex flex-col gap-4 overflow-hidden select-none text-left">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#1E40FF] text-white flex items-center justify-center">
              <BarChart3 className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900">DOM AI Studio — Dashboard Thống Kê</div>
              <div className="text-[10px] text-slate-400">Giám sát lưu lượng hỏi đáp, độ hài lòng &amp; hiệu quả kho tri thức</div>
            </div>
          </div>
          <span className="px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-bold">
            BYOK Gemini • 0₫/tháng
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {[
            { label: 'Lượt hỏi RAG', val: 'Theo ngày', sub: 'Cập nhật real-time' },
            { label: 'Người dùng', val: '3 Chế độ', sub: 'Bypass / Login / Whitelist' },
            { label: 'Tỷ lệ hài lòng', val: '👍 / 👎', sub: 'Đo trực tiếp từng câu' },
            { label: 'Độ trễ AI', val: 'Gemini 2.5', sub: 'Flash & Flash Lite' },
          ].map((k) => (
            <div key={k.label} className="rounded-xl bg-white border border-slate-200 p-3">
              <div className="text-[9.5px] font-bold uppercase text-slate-400">{k.label}</div>
              <div className="text-sm font-extrabold text-slate-900 mt-1">{k.val}</div>
              <div className="text-[9.5px] text-slate-500 mt-0.5">{k.sub}</div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-12 gap-3 flex-1">
          <div className="col-span-7 rounded-xl bg-white border border-slate-200 p-3.5 flex flex-col justify-between">
            <div className="text-[11px] font-bold text-slate-800">Biểu đồ lưu lượng câu hỏi theo ngày</div>
            <div className="flex items-end gap-1.5 h-28 pt-3">
              {[34, 48, 42, 66, 58, 74, 62, 85, 79, 92, 88, 96].map((h, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1 h-full justify-end">
                  <div
                    className="w-full rounded-t-md bg-gradient-to-t from-[#1E40FF] to-[#06B6D4] opacity-85"
                    style={{ height: `${h}%` }}
                  />
                </div>
              ))}
            </div>
          </div>
          <div className="col-span-5 rounded-xl bg-white border border-slate-200 p-3.5 space-y-2">
            <div className="text-[11px] font-bold text-slate-800">Top tài liệu được trích dẫn</div>
            {[
              { name: 'Chính sách & Bảng giá', pct: '88%' },
              { name: 'Quy trình SOP Vận hành', pct: '72%' },
              { name: 'FAQ Khách hàng & Đối tác', pct: '61%' },
              { name: 'Sổ tay Onboarding', pct: '45%' },
            ].map((bar) => (
              <div key={bar.name} className="space-y-1">
                <div className="text-[10px] font-medium text-slate-700 truncate">{bar.name}</div>
                <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                  <div className="h-full rounded-full bg-[#0284C7]" style={{ width: bar.pct }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full aspect-[16/10] bg-[#F8FAFC] p-4 sm:p-6 flex flex-col gap-3.5 overflow-hidden select-none text-left">
      <div className="flex items-center justify-between">
        <div className="text-xs font-bold text-slate-900 flex items-center gap-2">
          <GraduationCap className="w-4 h-4 text-emerald-600" />
          <span>Huấn Luyện RAG, Kiểm Thử Truy Vấn &amp; 1-Click Q&amp;A Từ Log</span>
        </div>
        <span className="px-2.5 py-1 rounded-lg bg-[#1E40FF] text-white text-[10px] font-bold">
          + Upload .md / .txt / .csv
        </span>
      </div>
      <div className="grid grid-cols-12 gap-3 flex-1">
        <div className="col-span-7 rounded-xl bg-white border border-slate-200 p-3.5 space-y-2.5">
          <div className="text-[10px] font-bold uppercase text-slate-400">Sandbox Kiểm Thử Truy Vấn RAG</div>
          <div className="px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-[10.5px] text-slate-700">
            Câu hỏi: &quot;Điều kiện bảo hành và thời gian xử lý ticket hỗ trợ?&quot;
          </div>
          <div className="p-2.5 rounded-lg bg-blue-50/70 border border-blue-200/70 space-y-1">
            <div className="flex items-center justify-between text-[10px] font-bold text-[#1E40FF]">
              <span>Chunk #1 • Chính sách Hỗ trợ &amp; SLA</span>
              <span className="font-mono">Match 0.94</span>
            </div>
            <p className="text-[10px] text-slate-600">
              Mọi yêu cầu kỹ thuật được tiếp nhận 24/7 và phản hồi lần đầu trong vòng 30 phút làm việc...
            </p>
          </div>
        </div>
        <div className="col-span-5 rounded-xl bg-white border border-slate-200 p-3.5 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="text-[10px] font-bold uppercase text-slate-400">Log Hội Thoại → Q&amp;A 1 Chạm</div>
            <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 space-y-1">
              <div className="text-[10px] font-bold text-slate-800">Khách hỏi quy trình đổi trả?</div>
              <div className="flex items-center justify-between pt-1">
                <span className="inline-flex items-center gap-1 text-[9.5px] text-emerald-600 font-semibold">
                  <ThumbsUp className="w-2.5 h-2.5" /> Đã kiểm duyệt
                </span>
                <span className="px-2 py-0.5 rounded bg-emerald-600 text-white text-[9px] font-bold">
                  Chuyển thành Q&amp;A
                </span>
              </div>
            </div>
          </div>
          <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-[10px] text-emerald-800 font-medium">
            ✓ Tự động tách chunks &amp; cập nhật tri thức AI ngay lập tức.
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Main Landing Page Component ───────────────────────────────────────────────

export const DomAiLanding: React.FC = () => {
  usePageSeo(getDomAiSeoConfig());
  const [activeScreenIdx, setActiveScreenIdx] = useState(0);
  const [imgFailed, setImgFailed] = useState<Record<string, boolean>>({});
  const [contactOpen, setContactOpen] = useState(false);
  const [contactDefaults, setContactDefaults] = useState<{ service?: string; note?: string }>({});
  const [zoomedShot, setZoomedShot] = useState<{ src: string; title: string; badge?: string; desc?: string } | null>(
    null
  );
  const [showBackTop, setShowBackTop] = useState(false);

  useEffect(() => {
    const onScroll = () => setShowBackTop(window.scrollY > 560);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const currentScreen = SHOWCASE_SCREENS[activeScreenIdx] || SHOWCASE_SCREENS[0];
  const hasRealImage = !imgFailed[currentScreen.id];

  const openContact = (service?: string, note?: string) => {
    setContactDefaults({
      service: service || 'Marketing Automation & Trợ lý AI Phòng ban (RAG)',
      note: note || 'Quan tâm triển khai DOM AI Assistant (Miễn phí 100% BYOK) cho doanh nghiệp',
    });
    setContactOpen(true);
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-slate-900 font-sans relative overflow-x-clip selection:bg-[#1E40FF] selection:text-white">
      <LuxuryGoldBackdrop />

      <Navbar
        activePage="dom-ai"
        onOpenContact={() => openContact()}
        contactLabel="Khởi Tạo Miễn Phí"
        mobileContactLabel="Dùng Free"
      />

      <main className="relative z-10 pt-28 sm:pt-32 md:pt-36">
        {/* ================================================================ */}
        {/* 1. HERO — SYNCHRONIZED WITH /DATA OPEN GLASS & ROYAL AESTHETIC   */}
        {/* ================================================================ */}
        <section id="hero" className="pb-10 sm:pb-16 px-4 sm:px-6 lg:px-8">
          <div className="max-w-5xl mx-auto text-center space-y-4 sm:space-y-6">
            <div className="ql-eyebrow mx-auto">
              <Sparkles className="w-3.5 h-3.5 text-[#1E40FF] shrink-0" />
              <span>TRỢ LÝ AI NỘI BỘ • CHUẨN DỮ LIỆU &amp; VĂN HÓA</span>
            </div>

            <h1 className="text-[1.45rem] sm:text-4xl lg:text-[46px] xl:text-[52px] font-black text-slate-900 leading-[1.2] tracking-[-0.02em]">
              <span className="lg:whitespace-nowrap">Trợ Lý AI Doanh Nghiệp</span>
              <span className="block text-gradient-inkica mt-1 lg:whitespace-nowrap">
                Chuẩn Dữ Liệu · Bản Sắc Riêng.
              </span>
            </h1>

            <p className="max-w-2xl mx-auto text-sm sm:text-lg text-slate-600 leading-relaxed">
              Biến toàn bộ quy trình, bảng giá, tài liệu nội bộ và bản sắc văn hóa công ty thành Trợ Lý AI am hiểu doanh nghiệp — hỏi gì đáp chuẩn nấy.
            </p>

            {/* 2 CTA buttons strictly matching /data hero pill buttons */}
            <div className="pt-1 sm:pt-2 grid grid-cols-2 sm:flex sm:flex-row items-center justify-center gap-2 sm:gap-3.5 max-w-md sm:max-w-none mx-auto">
              <a
                href="https://erp.domation.net/dom-ai-studio"
                target="_blank"
                rel="noopener noreferrer"
                className="btn-inkica-primary min-h-[44px] w-full sm:w-auto rounded-full px-3 sm:px-7 py-3 sm:py-3.5 text-xs sm:text-sm whitespace-nowrap justify-center"
              >
                <span className="sm:hidden">Tạo AI Riêng</span>
                <span className="hidden sm:inline">Khởi Tạo Trợ Lý AI Riêng</span>
                <ExternalLink className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
              </a>

              <a
                href="#product-showcase"
                className="ql-btn-outline min-h-[44px] w-full sm:w-auto rounded-full px-3 sm:px-6 py-3 sm:py-3.5 text-xs sm:text-sm whitespace-nowrap justify-center"
              >
                <span className="sm:hidden">Xem Huấn Luyện</span>
                <span className="hidden sm:inline">Xem Giao Diện Huấn Luyện</span>
                <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#1E40FF] shrink-0" />
              </a>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-x-2.5 gap-y-1 text-[11px] sm:text-xs text-slate-500">
              <span>
                Đào tạo <strong className="text-slate-900">chuẩn dữ liệu &amp; văn hóa doanh nghiệp</strong>
              </span>
              <span>·</span>
              <span>Cắm API Key riêng bảo mật</span>
              <span>·</span>
              <span>3 chế độ phân quyền linh hoạt</span>
            </div>
          </div>
        </section>

        {/* ================================================================ */}
        {/* 1B. TRUSTED ENTERPRISE PARTNERS STRIP (5 BRANDS)                 */}
        {/* ================================================================ */}
        <section id="partners" className="relative py-5 sm:py-7 px-4 sm:px-6">
          <div className="max-w-7xl mx-auto">
            <div className="rounded-2xl bg-white/90 backdrop-blur-xl border border-slate-200/85 shadow-2xs px-5 py-5 sm:px-7 sm:py-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
                <div className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-slate-600">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span>ĐỐI TÁC DOANH NGHIỆP ĐÃ TIN DÙNG DOM AI</span>
                </div>
                <span className="text-xs text-slate-500 font-medium">
                  RichLand • EcoLife Signature • Capital House • Viện IDEAS • Nha Khoa Flora
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 items-center">
                {DOM_AI_TRUSTED_PARTNERS.map((partner, index) => (
                  <div
                    key={partner.name}
                    className={`h-16 sm:h-[72px] rounded-xl bg-white border border-slate-200/85 px-4 py-2.5 flex items-center justify-center hover:border-blue-300 hover:shadow-xs transition-all ${
                      index === 4 ? 'col-span-2 sm:col-span-1' : ''
                    }`}
                    title={partner.name}
                  >
                    <img
                      src={partner.logo}
                      alt={partner.name}
                      loading="lazy"
                      className="max-h-9 sm:max-h-11 w-auto max-w-full object-contain"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ================================================================ */}
        {/* 2. PRODUCT SHOWCASE FIRST — HUẤN LUYỆN RAG & 4 MÀN HÌNH THỰC TẾ  */}
        {/* ================================================================ */}
        <section id="product-showcase" className="relative py-10 sm:py-14 px-4 sm:px-6">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
              <div>
                <div className="ql-eyebrow mb-2.5">
                  <Layers className="w-3.5 h-3.5 text-[#1E40FF]" />
                  <span>HUẤN LUYỆN TRI THỨC &amp; PORTAL NGƯỜI DÙNG</span>
                </div>
                <h2 className="text-[20px] sm:text-2xl lg:text-3xl font-bold text-slate-900 leading-[1.22] tracking-tight">
                  Từ Trung Tâm RAG Đến{' '}
                  <span className="text-gradient-inkica">Cổng Hỏi Đáp Riêng</span>
                </h2>
              </div>
              <p className="text-xs sm:text-sm text-slate-600 max-w-md leading-relaxed">
                Nạp tài liệu, test độ khớp chunk và biến câu hỏi thực tế thành Q&amp;A chuẩn chỉ trong vài giây — áp dụng linh hoạt cho mọi ngành hàng.
              </p>
            </div>

            {/* 4 Interactive Showcase Tabs */}
            <div className="grid grid-cols-2 lg:flex lg:items-center gap-2 mb-5">
              {SHOWCASE_SCREENS.map((sc, idx) => {
                const active = idx === activeScreenIdx;
                return (
                  <button
                    key={sc.id}
                    type="button"
                    onClick={() => setActiveScreenIdx(idx)}
                    className={`min-h-[42px] px-3 sm:px-4 py-2 rounded-2xl lg:rounded-full text-[11px] sm:text-xs font-semibold text-left lg:text-center whitespace-nowrap truncate transition-all cursor-pointer ${
                      active
                        ? 'bg-[#1E40FF] text-white shadow-md'
                        : 'bg-white border border-slate-200/90 text-slate-700 hover:border-blue-300 hover:text-[#1E40FF]'
                    }`}
                  >
                    {idx + 1}. {sc.tabLabel}
                  </button>
                );
              })}
            </div>

            {/* Browser Showcase Card */}
            <div className="rounded-[28px] bg-white/95 backdrop-blur-2xl border border-slate-200/90 shadow-[0_14px_38px_-22px_rgba(15,23,42,0.14)] p-5 sm:p-7">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-center">
                {/* Browser Frame (8 cols) */}
                <div className="lg:col-span-8">
                  <div className="rounded-2xl overflow-hidden border border-slate-200/95 bg-white shadow-md">
                    {/* macOS Browser Chrome */}
                    <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200/80 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className="w-2.5 h-2.5 rounded-full bg-rose-400" />
                        <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                      </div>
                      <div className="flex-1 max-w-md px-3 py-1 rounded-lg bg-white border border-slate-200 text-[11px] font-mono text-slate-500 truncate text-center">
                        {currentScreen.urlBar}
                      </div>
                      {hasRealImage ? (
                        <button
                          type="button"
                          onClick={() =>
                            setZoomedShot({
                              src: currentScreen.src,
                              title: currentScreen.title,
                              badge: currentScreen.badge,
                              desc: currentScreen.desc,
                            })
                          }
                          className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#1E40FF] hover:underline cursor-pointer shrink-0"
                        >
                          <ZoomIn className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">Phóng to</span>
                        </button>
                      ) : (
                        <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 shrink-0">
                          LIVE UI
                        </span>
                      )}
                    </div>

                    <AnimatePresence mode="wait">
                      <motion.div
                        key={currentScreen.id}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -6 }}
                        transition={{ duration: 0.22 }}
                      >
                        {hasRealImage ? (
                          <div
                            role="button"
                            tabIndex={0}
                            onClick={() =>
                              setZoomedShot({
                                src: currentScreen.src,
                                title: currentScreen.title,
                                badge: currentScreen.badge,
                                desc: currentScreen.desc,
                              })
                            }
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' || e.key === ' ') {
                                setZoomedShot({
                                  src: currentScreen.src,
                                  title: currentScreen.title,
                                  badge: currentScreen.badge,
                                  desc: currentScreen.desc,
                                });
                              }
                            }}
                            className="cursor-zoom-in bg-slate-50"
                          >
                            <img
                              src={currentScreen.src}
                              alt={currentScreen.title}
                              loading="lazy"
                              decoding="async"
                              onError={() =>
                                setImgFailed((prev) => ({ ...prev, [currentScreen.id]: true }))
                              }
                              className="w-full aspect-[16/10] object-cover object-top block"
                            />
                          </div>
                        ) : (
                          <ScreenLiveFallback screenId={currentScreen.id} />
                        )}
                      </motion.div>
                    </AnimatePresence>
                  </div>
                </div>

                {/* Screen Details (4 cols) */}
                <div className="lg:col-span-4 space-y-4">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200/70 text-[10px] font-bold uppercase tracking-wider text-[#1E40FF]">
                    {currentScreen.badge}
                  </span>
                  <h3 className="text-lg sm:text-xl font-bold text-slate-900 leading-snug">
                    {currentScreen.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                    {currentScreen.desc}
                  </p>
                  <div className="space-y-2.5 pt-2 border-t border-slate-100">
                    {currentScreen.highlights.map((hl) => (
                      <div key={hl} className="flex items-start gap-2 text-xs font-medium text-slate-700">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                        <span>{hl}</span>
                      </div>
                    ))}
                  </div>
                  <div className="pt-2">
                    <a
                      href="https://erp.domation.net/dom-ai-studio"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-inkica-primary w-full justify-center min-h-[44px] py-2.5 text-xs sm:text-sm font-bold"
                    >
                      <span>Mở DOM AI Studio Ngay</span>
                      <ArrowRight className="w-4 h-4" />
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ================================================================ */}
        {/* 2B. MOTION PRODUCT CLIP — PURE VIDEO OVERVIEW                    */}
        {/* ================================================================ */}
        <section id="motion-showcase" className="relative py-8 sm:py-12 px-4 sm:px-6">
          <div className="max-w-7xl mx-auto">
            <MotionVideoShowcase variant="spotlight" videoId="dom-ai" />
          </div>
        </section>

        <MobileAppShowcaseSection variant="dom-ai" />

        {/* ================================================================ */}
        {/* 3. 3 FLEXIBLE AUTH MODES                                         */}
        {/* ================================================================ */}
        <section id="auth-modes" className="relative py-12 sm:py-16 px-4 sm:px-6">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
              <div>
                <div className="ql-eyebrow mb-2.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#1E40FF]" />
                  <span>QUẢN TRỊ TRUY CẬP LINH HOẠT</span>
                </div>
                <h2 className="text-[20px] sm:text-2xl lg:text-3xl font-bold text-slate-900 leading-[1.22]">
                  3 Chế Độ Phân Quyền{' '}
                  <span className="text-gradient-inkica">— Đổi Chỉ 1 Chạm</span>
                </h2>
              </div>
              <p className="text-xs sm:text-sm text-slate-600 max-w-md">
                Mở công khai cho khách hàng tìm hiểu, lưu lịch sử cho đại lý/Sale hoặc khóa kín Whitelist theo từng Collection cho phòng ban nội bộ.
              </p>
            </div>

            <div className="md:hidden">
              <ResponsiveSlideDeck
                items={AUTH_MODES}
                mobilePerPage={1}
                mobileColsClass="grid-cols-1"
                gapClass="gap-3.5"
                ariaLabel="3 Chế độ phân quyền truy cập DOM AI"
                keyExtractor={(m) => m.step}
                renderItem={(m) => {
                  const Icon = m.icon;
                  return (
                    <div className="h-full rounded-[22px] bg-white/95 border border-slate-200/85 p-5 shadow-xs flex flex-col justify-between gap-4">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between gap-2">
                          <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${m.accent} text-white flex items-center justify-center shadow-sm`}>
                            <Icon className="w-5 h-5" />
                          </div>
                          <span className="px-2.5 py-1 rounded-full bg-slate-100 text-[10px] font-bold uppercase tracking-wider text-slate-600">
                            {m.tag}
                          </span>
                        </div>
                        <div>
                          <div className="text-[11px] font-mono font-semibold text-[#1E40FF]">{m.step}</div>
                          <h3 className="text-base font-bold text-slate-900 mt-0.5">{m.title}</h3>
                        </div>
                        <p className="text-xs text-slate-600 leading-relaxed">{m.desc}</p>
                      </div>
                      <div className="pt-3 border-t border-slate-100 space-y-1.5">
                        {m.useCases.map((uc) => (
                          <div key={uc} className="flex items-start gap-2 text-xs text-slate-700 font-medium">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                            <span>{uc}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                }}
              />
            </div>

            <div className="hidden md:grid md:grid-cols-3 gap-5">
              {AUTH_MODES.map((m) => {
                const Icon = m.icon;
                return (
                  <div
                    key={m.step}
                    className="rounded-[24px] bg-white/95 border border-slate-200/85 p-6 shadow-xs hover:border-blue-300 hover:shadow-md transition-all flex flex-col justify-between gap-5"
                  >
                    <div className="space-y-3.5">
                      <div className="flex items-center justify-between gap-2">
                        <div
                          className={`w-11 h-11 rounded-2xl bg-gradient-to-br ${m.accent} text-white flex items-center justify-center shadow-sm`}
                        >
                          <Icon className="w-5 h-5" />
                        </div>
                        <span className="px-2.5 py-1 rounded-full bg-slate-100 text-[10px] font-bold uppercase tracking-wider text-slate-600">
                          {m.tag}
                        </span>
                      </div>
                      <div>
                        <div className="text-[11px] font-mono font-semibold text-[#1E40FF]">{m.step}</div>
                        <h3 className="text-lg font-bold text-slate-900 mt-0.5">{m.title}</h3>
                      </div>
                      <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">{m.desc}</p>
                    </div>

                    <div className="pt-4 border-t border-slate-100 space-y-2">
                      {m.useCases.map((uc) => (
                        <div key={uc} className="flex items-start gap-2 text-xs text-slate-700 font-medium">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                          <span>{uc}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ================================================================ */}
        {/* 4. 3-STEP QUICK START                                            */}
        {/* ================================================================ */}
        <section id="quick-start" className="relative py-12 sm:py-16 px-4 sm:px-6">
          <div className="max-w-7xl mx-auto">
            <div className="rounded-[28px] bg-gradient-to-br from-[#F5F9FF] via-white to-[#F0FDFA] border border-blue-200/80 p-6 sm:p-10 shadow-xs">
              <div className="max-w-2xl mb-8">
                <div className="ql-eyebrow mb-2.5">
                  <Zap className="w-3.5 h-3.5 text-[#1E40FF]" />
                  <span>CÀI ĐẶT SIÊU TỐC • ZERO CODE</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 leading-[1.25]">
                  Sẵn Sàng Vận Hành Trong{' '}
                  <span className="text-gradient-inkica">3 Bước Đơn Giản</span>
                </h2>
              </div>

              <div className="md:hidden">
                <ResponsiveSlideDeck
                  items={QUICK_START_STEPS}
                  mobilePerPage={1}
                  mobileColsClass="grid-cols-1"
                  gapClass="gap-3.5"
                  ariaLabel="3 Bước khởi tạo trợ lý AI"
                  keyExtractor={(st) => st.step}
                  renderItem={(st) => {
                    const Icon = st.icon;
                    return (
                      <div className="h-full rounded-2xl bg-white border border-slate-200/85 p-5 flex flex-col justify-between gap-3.5 shadow-2xs">
                        <div className="space-y-2.5">
                          <div className="flex items-center justify-between">
                            <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 text-[#1E40FF] flex items-center justify-center">
                              <Icon className="w-5 h-5" />
                            </div>
                            <span className="font-mono text-2xl font-extrabold text-slate-200">{st.step}</span>
                          </div>
                          <h3 className="text-base font-bold text-slate-900 leading-snug">{st.title}</h3>
                          <p className="text-xs text-slate-600 leading-relaxed">{st.desc}</p>
                        </div>
                        <div className="pt-2.5 border-t border-slate-100 text-[11px] font-bold text-[#1E40FF]">{st.meta}</div>
                      </div>
                    );
                  }}
                />
              </div>

              <div className="hidden md:grid md:grid-cols-3 gap-5">
                {QUICK_START_STEPS.map((st) => {
                  const Icon = st.icon;
                  return (
                    <div
                      key={st.step}
                      className="rounded-2xl bg-white border border-slate-200/85 p-5 sm:p-6 flex flex-col justify-between gap-4 shadow-2xs"
                    >
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 text-[#1E40FF] flex items-center justify-center">
                            <Icon className="w-5 h-5" />
                          </div>
                          <span className="font-mono text-2xl font-extrabold text-slate-200">
                            {st.step}
                          </span>
                        </div>
                        <h3 className="text-base font-bold text-slate-900 leading-snug">{st.title}</h3>
                        <p className="text-xs sm:text-[13px] text-slate-600 leading-relaxed">{st.desc}</p>
                      </div>
                      <div className="pt-3 border-t border-slate-100 text-[11px] font-bold text-[#1E40FF]">
                        {st.meta}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        {/* ================================================================ */}
        {/* 5. FEATURE BENTO GRID                                            */}
        {/* ================================================================ */}
        <section id="features" className="relative py-12 sm:py-16 px-4 sm:px-6">
          <div className="max-w-7xl mx-auto">
            <div className="text-center max-w-2xl mx-auto mb-10">
              <div className="ql-eyebrow mb-3 mx-auto">
                <Bot className="w-3.5 h-3.5 text-[#1E40FF]" />
                <span>KIẾN TRÚC DOANH NGHIỆP CHUẨN DOMATION</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">
                Đầy Đủ Công Cụ Để{' '}
                <span className="text-gradient-inkica">Làm Chủ Tri Thức AI</span>
              </h2>
            </div>

            <div className="md:hidden">
              <ResponsiveSlideDeck
                items={FEATURE_GRID}
                mobilePerPage={1}
                mobileColsClass="grid-cols-1"
                gapClass="gap-3.5"
                ariaLabel="6 Công cụ làm chủ tri thức AI"
                keyExtractor={(feat) => feat.title}
                renderItem={(feat) => {
                  const Icon = feat.icon;
                  return (
                    <div className="h-full rounded-2xl bg-white/95 border border-slate-200/85 p-5 shadow-2xs space-y-2.5">
                      <div className="flex items-center justify-between gap-2">
                        <div className="w-9 h-9 rounded-xl bg-blue-50 text-[#1E40FF] border border-blue-100 flex items-center justify-center">
                          <Icon className="w-4 h-4" />
                        </div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          {feat.tag}
                        </span>
                      </div>
                      <h3 className="text-sm font-bold text-slate-900">{feat.title}</h3>
                      <p className="text-xs text-slate-600 leading-relaxed">{feat.desc}</p>
                    </div>
                  );
                }}
              />
            </div>

            <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-3 gap-5">
              {FEATURE_GRID.map((feat) => {
                const Icon = feat.icon;
                return (
                  <div
                    key={feat.title}
                    className="rounded-2xl bg-white/95 border border-slate-200/85 p-6 shadow-2xs hover:border-blue-300 hover:shadow-md transition-all space-y-3"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#1E40FF] border border-blue-100 flex items-center justify-center">
                        <Icon className="w-5 h-5" />
                      </div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        {feat.tag}
                      </span>
                    </div>
                    <h3 className="text-base font-bold text-slate-900">{feat.title}</h3>
                    <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">{feat.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ================================================================ */}
        {/* 6. PRICING — 0₫ / THÁNG MIỄN PHÍ TRỌN ĐỜI (BYOK)                */}
        {/* ================================================================ */}
        <section id="pricing" className="relative py-14 sm:py-20 px-4 sm:px-6">
          <div className="max-w-5xl mx-auto">
            <div className="text-center max-w-2xl mx-auto mb-10">
              <div className="ql-eyebrow mb-3 mx-auto">
                <Sparkles className="w-3.5 h-3.5 text-[#1E40FF]" />
                <span>CHI PHÍ MINH BẠCH • KHÔNG PHÍ ẨN</span>
              </div>
              <h2 className="text-2xl sm:text-4xl font-bold text-slate-900">
                Bắt Đầu Với{' '}
                <span className="text-gradient-inkica">0₫ / Tháng Trọn Đời</span>
              </h2>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
              {/* Flagship Free BYOK Card */}
              <div className="lg:col-span-7 rounded-[28px] bg-gradient-to-br from-[#EEF4FF] via-white to-[#ECFDF5] border-2 border-[#1E40FF]/40 p-7 sm:p-8 shadow-xl flex flex-col justify-between gap-6">
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="px-3 py-1 rounded-full bg-emerald-600 text-white text-[11px] font-bold uppercase tracking-wider">
                      MIỄN PHÍ 100% • BYOK
                    </span>
                    <span className="text-xs font-semibold text-[#1E40FF]">Sản phẩm độc lập</span>
                  </div>

                  <div>
                    <h3 className="text-xl sm:text-2xl font-bold text-slate-900">
                      DOM AI Assistant Standalone
                    </h3>
                    <div className="mt-3 flex items-baseline gap-2">
                      <span className="text-4xl sm:text-5xl font-extrabold tracking-tight text-slate-900">
                        0₫
                      </span>
                      <span className="text-sm font-semibold text-emerald-700">
                        / tháng • Miễn phí trọn đời khi dùng API Key riêng
                      </span>
                    </div>
                  </div>

                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                    Dành cho mọi doanh nghiệp, đội Sale, trường học và tổ chức muốn sở hữu ngay Cổng Trợ Lý AI RAG mang thương hiệu riêng mà không tốn chi phí thuê bao phần mềm.
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-4 border-t border-slate-200/80">
                    {[
                      'Cắm Gemini API Key riêng (AES-256)',
                      '3-Pane AI Studio & Kho Tài Liệu',
                      'Tùy biến Logo, Màu sắc & Slug riêng',
                      'Đầy đủ 3 chế độ phân quyền Auth',
                      'Dashboard thống kê & Top trích dẫn',
                      'Log hội thoại & 1-Click Q&A Training',
                      'Upload .txt / .md / .csv & RAG Sandbox',
                      'Nhúng Iframe vào Website không giới hạn',
                    ].map((feat) => (
                      <div key={feat} className="flex items-start gap-2 text-xs font-medium text-slate-800">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        <span>{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
                  <a
                    href="https://erp.domation.net/dom-ai-studio"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-inkica-primary flex-1 justify-center min-h-[48px] py-3.5 text-sm font-bold whitespace-nowrap"
                  >
                    <Sparkles className="w-4 h-4 text-cyan-200 shrink-0" />
                    <span>Tạo Portal Miễn Phí</span>
                    <ArrowRight className="w-4 h-4 shrink-0" />
                  </a>
                  <a
                    href={SPECIALIST_ZALO_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="min-h-[48px] px-5 py-3.5 rounded-xl bg-[#0068FF] hover:bg-[#0057D9] text-white text-xs sm:text-sm font-bold inline-flex items-center justify-center gap-1.5 whitespace-nowrap shadow-xs transition-colors"
                  >
                    <span>Chuyên Viên Setup Zalo</span>
                    <ExternalLink className="w-4 h-4 shrink-0" />
                  </a>
                </div>
              </div>

              {/* Ecosystem Upgrade Card */}
              <div className="lg:col-span-5 rounded-[28px] bg-white/95 border border-slate-200/85 p-7 sm:p-8 shadow-sm flex flex-col justify-between gap-6">
                <div className="space-y-4">
                  <span className="inline-block px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-[11px] font-bold uppercase tracking-wider">
                    MỞ RỘNG HỆ SINH THÁI
                  </span>
                  <h3 className="text-xl font-bold text-slate-900">
                    Kết Nối ERP 5.0, CRM &amp; ZaloBot
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                    Khi doanh nghiệp cần kết hợp DOM AI Assistant với luồng Chia Lead AutoData, Báo cáo Meta Ads, Automation Zalo ZNS hoặc ERP May Đo.
                  </p>
                  <div className="space-y-2.5 pt-3 border-t border-slate-100">
                    {[
                      'Đồng bộ dữ liệu khách hàng 2 chiều về CRM 360°',
                      'Tự động báo nóng ZaloBot / Telegram cho Sale',
                      'Kết nối Meta CAPI, DOM Meta Report & Automation Flow',
                      'Triển khai tên miền riêng & hạ tầng độc lập',
                    ].map((feat) => (
                      <div key={feat} className="flex items-start gap-2 text-xs text-slate-700 font-medium">
                        <CheckCircle2 className="w-4 h-4 text-[#1E40FF] shrink-0 mt-0.5" />
                        <span>{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-2.5">
                  <div className="grid grid-cols-2 gap-2">
                    <a
                      href={SPECIALIST_ZALO_URL}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="min-h-[44px] px-3 py-2.5 rounded-xl bg-[#0068FF] hover:bg-[#0057D9] text-white text-xs font-bold inline-flex items-center justify-center gap-1.5 whitespace-nowrap shadow-xs transition-colors"
                    >
                      <span>Chat Zalo Setup</span>
                      <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                    </a>
                    <button
                      type="button"
                      onClick={() =>
                        openContact(
                          'Enterprise ERP 5.0 (12 Phân hệ • Chấm công GPS & Payroll)',
                          'Muốn tích hợp DOM AI Assistant cùng hệ sinh thái CRM AutoData & ERP 5.0'
                        )
                      }
                      className="ql-btn-outline justify-center min-h-[44px] px-3 py-2.5 text-xs font-bold cursor-pointer whitespace-nowrap"
                    >
                      <span>Tư Vấn Lộ Trình</span>
                      <ArrowRight className="w-3.5 h-3.5 text-[#1E40FF] shrink-0" />
                    </button>
                  </div>
                  <a
                    href="/"
                    onClick={(e) => handleSpaLinkClick(e, '/')}
                    className="block text-center text-xs font-semibold text-slate-500 hover:text-[#1E40FF] transition-colors py-1"
                  >
                    ← Xem toàn bộ hệ sinh thái DOMATION
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>

        <FaqAccordionSection
          faqs={DOM_AI_FAQS}
          heading="Câu Hỏi Thường Gặp Về DOM AI Assistant"
          subtitle="Giải đáp trực diện về chính sách miễn phí trọn đời BYOK, bảo mật API Key, 3 chế độ phân quyền và độ chính xác RAG."
        />

        <FounderAuthorityBlock
          variant="subtle"
          onOpenContact={() => openContact()}
          contextNote="Kiến tạo bởi Founder & CEO Huỳnh Trọng Phúc (TurnioDEV) — Trợ lý AI RAG chuẩn xác theo tài liệu nội bộ, đội ngũ hỗ trợ cài đặt trọn gói A–Z."
        />
      </main>

      <DomationFooter onOpenContact={() => openContact()} />

      {/* Centered Blue Back to Top Pill */}
      <BackToTopPill show={showBackTop} />

      <ContactModal
        isOpen={contactOpen}
        onClose={() => setContactOpen(false)}
        defaultService={contactDefaults.service}
        defaultNote={contactDefaults.note}
      />

      <ImageZoomModal image={zoomedShot} onClose={() => setZoomedShot(null)} />
    </div>
  );
};

export default DomAiLanding;
