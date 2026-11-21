import React from 'react';
import {
  ArrowRight,
  Award,
  BookOpen,
  Briefcase,
  Cpu,
  ExternalLink,
  Globe,
  Layers,
  Megaphone,
  MessageCircle,
  ShieldCheck,
  Sparkles,
  TrendingUp,
} from 'lucide-react';
import { ResponsiveSlideDeck } from './ResponsiveSlideDeck';
import { SPECIALIST_ZALO_DISPLAY, SPECIALIST_ZALO_URL } from './common/ZaloSpecialistBanner';
import { handleSpaLinkClick } from '../utils/navigation';
import {
  FOUNDER_GITHUB_URL,
  FOUNDER_LINKEDIN_URL,
  FOUNDER_PORTFOLIO_URL,
  FOUNDER_PRIMARY_URL,
} from '../utils/seoSchema';

export interface FounderAuthorityBlockProps {
  variant?: 'full' | 'author' | 'subtle';
  contextNote?: string;
  onOpenContact?: () => void;
  className?: string;
}

const FOUNDER_AVATAR = '/assets/brands/founder_turnio.webp';
const FOUNDER_PROFILE_ARTICLE =
  '/boost/huynh-trong-phuc-turniodev-founder-ceo-domation-chuyen-gia-ai-automation-digital-marketing';
const FOUNDER_AZ_ARTICLE =
  '/boost/kinh-nghiem-xay-dung-he-thong-doanh-nghiep-tu-a-z-ai-automation-turniodev';

const CORE_PILLARS = [
  {
    icon: Cpu,
    title: 'Chuyên Gia AI Automation',
    desc: 'Kiến trúc Multi-Agent AI, RAG Vector nội bộ 98.4% chính xác, ONNX Computer Vision 300 DPI & tự động hóa quy trình liên phòng ban.',
  },
  {
    icon: Layers,
    title: 'Xây Dựng Hệ Thống Từ A–Z',
    desc: 'Trực tiếp thiết kế 35+ hệ thống thực chiến: Database Multi-Tenant RLS, ERP 5.0 12 phân hệ, CRM 360°, Web 3D WebGL & Zalo Mini App.',
  },
  {
    icon: Megaphone,
    title: 'Chuyên Gia Digital Marketing',
    desc: 'Thực chiến tối ưu ngân sách quy mô lớn, ROAS 4.8x–8.2x, Meta CAPI SHA-256, Server-Side Tracking & tác giả sách Facebook Ads 154 trang.',
  },
  {
    icon: Briefcase,
    title: 'Founder & CEO DOMATION',
    desc: 'Đồng hành cùng 30+ doanh nghiệp lớn (Capital House, INKICA AI, IDEAS, Phúc Lộc Thọ, Ampersand, En Group, Flora, RichLand, NavaTek).',
  },
];

const CAREER_MILESTONES = [
  {
    period: '2019 – 2022',
    role: 'Nền Tảng Digital Marketing & Fullstack',
    detail:
      'ĐH Ngân hàng TP.HCM (QTKD – Marketing) & 8 chứng chỉ xác thực (FreeCodeCamp, F8, TOP CV). Vận hành >1.2 tỷ ngân sách F&B Ads, bàn giao hợp đồng VITRAC 136.4M & xuất bản sách 154 trang.',
  },
  {
    period: '2023 – 2024',
    role: 'Kiến Trúc MarTech & Auto Data Router',
    detail:
      'Xây dựng Router chia Lead < 4 giây, GTM Server-Side Cloudflare Workers; giúp Viện IDEAS tăng +300% quy mô MBA (-30% CPA) và chuỗi Phúc Lộc Thọ mở rộng 20+ cửa hàng (ROAS 5+).',
  },
  {
    period: '2025 – 2026+',
    role: 'Founder & CEO DOMATION • Tổng Thầu Hệ Thống A–Z',
    detail:
      'Sáng lập hệ sinh thái DOMATION Enterprise OS (18 modules, ERP 5.0 12 phân hệ), kiến trúc sư Fullstack INKICA AI 208 SKU 3D CAD, tổng thầu số hóa 7 trụ cột EcoLife Signature (Capital House).',
  },
];

export const FounderAuthorityBlock: React.FC<FounderAuthorityBlockProps> = ({
  variant = 'subtle',
  contextNote,
  onOpenContact,
  className = '',
}) => {
  if (variant === 'full') {
    return (
      <section
        id="founder-turniodev"
        aria-label="Hỗ trợ kỹ thuật setup A–Z & Hồ sơ Founder DOMATION"
        className={`rounded-[28px] bg-white/95 backdrop-blur-2xl border border-slate-200/85 p-6 sm:p-10 shadow-[0_24px_64px_-24px_rgba(15,23,42,0.08)] space-y-8 ${className}`}
      >
        <div className="rounded-2xl border border-blue-200/80 bg-gradient-to-r from-[#EEF4FF]/90 via-white to-cyan-50/70 p-4 sm:p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1.5 max-w-2xl">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white border border-blue-200/80 text-[#1E40FF] text-[10.5px] font-bold uppercase tracking-wider">
              <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
              <span>Hỗ Trợ Kỹ Thuật &amp; Tư Vấn 1-1</span>
            </div>
            <h3 className="text-base sm:text-xl font-extrabold text-slate-900 leading-snug">
              Hỗ Trợ Kỹ Thuật Setup A–Z &amp; Tư Vấn Mô Hình Phù Hợp
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Chuyên viên DOMATION trực tiếp đồng hành khảo sát bài toán thực tế, tư vấn gói tối ưu và cấu hình trọn gói từ A–Z qua Zalo ({SPECIALIST_ZALO_DISPLAY}) trước khi bàn giao.
            </p>
          </div>
          <div className="grid grid-cols-2 sm:flex items-center gap-2.5 shrink-0 w-full lg:w-auto">
            <a
              href={SPECIALIST_ZALO_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="min-h-[44px] px-4 py-2.5 rounded-xl bg-[#0068FF] hover:bg-[#0057D9] text-white text-xs sm:text-sm font-bold inline-flex items-center justify-center gap-1.5 whitespace-nowrap shadow-xs transition-colors"
            >
              <MessageCircle className="w-4 h-4 shrink-0" />
              <span>Chat Zalo Setup</span>
            </a>
            {onOpenContact && (
              <button
                type="button"
                onClick={onOpenContact}
                className="ql-btn-outline min-h-[44px] px-4 py-2.5 text-xs sm:text-sm font-bold inline-flex items-center justify-center gap-1.5 whitespace-nowrap cursor-pointer"
              >
                <span>Tư Vấn Lộ Trình</span>
                <ArrowRight className="w-4 h-4 shrink-0" />
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-4 flex flex-col items-center lg:items-start text-center lg:text-left gap-4">
            <div className="relative">
              <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-3xl overflow-hidden border-2 border-[#1E40FF]/20 shadow-[0_18px_40px_-14px_rgba(30,64,255,0.28)] bg-slate-100">
                <img
                  src={FOUNDER_AVATAR}
                  alt="Huỳnh Trọng Phúc (TurnioDEV) — Founder & CEO DOMATION, Chuyên gia AI Automation & Digital Marketing"
                  width={128}
                  height={128}
                  loading="lazy"
                  className="w-full h-full object-cover object-top"
                />
              </div>
              <span className="absolute -bottom-2 -right-2 inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#1E40FF] text-white text-[10px] font-bold shadow-md">
                <Sparkles className="w-3 h-3" />
                <span>TurnioDEV</span>
              </span>
            </div>

            <div className="space-y-1.5">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-[#1E40FF] text-[11px] font-bold uppercase tracking-wider">
                <span>FOUNDER &amp; CEO DOMATION</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                Huỳnh Trọng Phúc{' '}
                <span className="text-gradient-inkica">(TurnioDEV)</span>
              </h2>
              <p className="text-xs sm:text-sm font-semibold text-slate-600">
                Chuyên Gia AI Automation • Kiến Trúc Sư Hệ Thống Từ A–Z • Chuyên Gia Digital Marketing &amp; MarTech
              </p>
            </div>

            <div className="grid grid-cols-2 sm:flex sm:flex-wrap justify-center lg:justify-start gap-2 pt-1 w-full sm:w-auto">
              <a
                href={FOUNDER_PORTFOLIO_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-inkica-primary col-span-2 sm:col-span-1 min-h-[42px] px-4 py-2 text-xs whitespace-nowrap justify-center"
              >
                <span>Portfolio TurnioDEV</span>
                <ExternalLink className="w-3.5 h-3.5 shrink-0" />
              </a>
              <a
                href={FOUNDER_LINKEDIN_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="ql-btn-outline min-h-[42px] px-3.5 py-2 text-xs whitespace-nowrap justify-center"
              >
                <Globe className="w-3.5 h-3.5 text-[#0A66C2] shrink-0" />
                <span>LinkedIn</span>
              </a>
              <a
                href={FOUNDER_GITHUB_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="ql-btn-outline min-h-[42px] px-3.5 py-2 text-xs whitespace-nowrap justify-center"
              >
                <span>GitHub</span>
              </a>
            </div>
          </div>

          <div className="lg:col-span-8 space-y-5">
            <p className="text-sm sm:text-base text-slate-700 leading-relaxed">
              <strong className="text-slate-950">Huỳnh Trọng Phúc (TurnioDEV)</strong> là Founder &amp; CEO sáng lập hệ sinh thái{' '}
              <strong className="text-[#1E40FF]">DOMATION</strong>, trực tiếp tham gia khảo sát, thiết kế kiến trúc và xây dựng hệ thống doanh nghiệp{' '}
              <strong className="text-slate-950">từ A–Z</strong> — giao thoa hiếm có giữa{' '}
              <strong className="text-slate-950">Software Engineering Fullstack</strong>,{' '}
              <strong className="text-slate-950">AI Automation &amp; Multi-Agent</strong> và{' '}
              <strong className="text-slate-950">Digital Marketing thực chiến</strong>. Tác giả cuốn sách{' '}
              <em>&ldquo;Facebook Ads: AI Chạy Không Được&rdquo;</em> (154 trang, 500+ doanh nghiệp đọc) cùng cộng đồng 10.5K+ followers.
            </p>

            {/* Key Empirical Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { val: '35+', label: 'Hệ thống A–Z bàn giao' },
                { val: '30+', label: 'Doanh nghiệp đối tác' },
                { val: '150,000+', label: 'Leads xử lý thực tế' },
                { val: '4.8x – 8.2x', label: 'ROAS • Thực chiến' },
              ].map((m) => (
                <div
                  key={m.label}
                  className="rounded-2xl bg-slate-50/90 border border-slate-200/80 p-3.5 text-center"
                >
                  <div className="text-lg sm:text-xl font-black text-[#1E40FF]">{m.val}</div>
                  <div className="text-[11px] font-semibold text-slate-600 mt-0.5">{m.label}</div>
                </div>
              ))}
            </div>

            {/* 4 Pillars */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {CORE_PILLARS.map((p) => {
                const Icon = p.icon;
                return (
                  <div
                    key={p.title}
                    className="rounded-2xl bg-slate-50/75 border border-slate-200/80 p-4 space-y-1.5"
                  >
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
                      <Icon className="w-4 h-4 text-[#1E40FF] shrink-0" />
                      <span>{p.title}</span>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">{p.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Career Timeline + Deep-dive Profile Articles */}
        <div className="pt-6 border-t border-slate-200/80 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#1E40FF]">
              <Award className="w-4 h-4" />
              <span>Lộ Trình Thực Chiến Kiến Tạo Hệ Thống Từ A–Z (2019 – 2026+)</span>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <a
                href={FOUNDER_PROFILE_ARTICLE}
                onClick={(e) => handleSpaLinkClick(e, FOUNDER_PROFILE_ARTICLE)}
                className="font-semibold text-[#1E40FF] hover:underline inline-flex items-center gap-1"
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>Hồ sơ chi tiết Huỳnh Trọng Phúc</span>
              </a>
              <span className="text-slate-300">•</span>
              <a
                href={FOUNDER_AZ_ARTICLE}
                onClick={(e) => handleSpaLinkClick(e, FOUNDER_AZ_ARTICLE)}
                className="font-semibold text-slate-700 hover:text-[#1E40FF] hover:underline inline-flex items-center gap-1"
              >
                <span>Kinh nghiệm xây hệ thống A–Z</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>

          <div className="md:hidden">
            <ResponsiveSlideDeck
              items={CAREER_MILESTONES}
              mobilePerPage={1}
              mobileColsClass="grid-cols-1"
              gapClass="gap-3"
              ariaLabel="Lộ trình thực chiến Founder"
              keyExtractor={(step) => step.period}
              renderItem={(step) => (
                <div className="h-full rounded-2xl bg-gradient-to-br from-slate-50 to-blue-50/35 border border-slate-200/80 p-4 space-y-1.5">
                  <div className="text-[11px] font-mono font-bold text-[#1E40FF]">{step.period}</div>
                  <div className="text-xs sm:text-sm font-bold text-slate-900">{step.role}</div>
                  <p className="text-xs text-slate-600 leading-relaxed">{step.detail}</p>
                </div>
              )}
            />
          </div>
          <div className="hidden md:grid md:grid-cols-3 gap-4">
            {CAREER_MILESTONES.map((step) => (
              <div
                key={step.period}
                className="rounded-2xl bg-gradient-to-br from-slate-50 to-blue-50/35 border border-slate-200/80 p-4 space-y-1.5"
              >
                <div className="text-[11px] font-mono font-bold text-[#1E40FF]">{step.period}</div>
                <div className="text-xs sm:text-sm font-bold text-slate-900">{step.role}</div>
                <p className="text-xs text-slate-600 leading-relaxed">{step.detail}</p>
              </div>
            ))}
          </div>

          {onOpenContact && (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-slate-950 text-white px-5 py-4">
              <div className="text-xs sm:text-sm text-slate-200">
                <strong className="text-white">Trao đổi trực tiếp 1-1 với Founder &amp; CEO Huỳnh Trọng Phúc</strong> về bài toán kiến trúc ERP, CRM, AI Automation hoặc tăng trưởng Digital Marketing của doanh nghiệp bạn.
              </div>
              <button
                type="button"
                onClick={onOpenContact}
                className="btn-inkica-primary min-h-[40px] px-4 py-2 text-xs shrink-0 cursor-pointer"
              >
                <span>Đặt Lịch Tư Vấn 1-1</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </section>
    );
  }

  if (variant === 'author') {
    return (
      <section
        aria-label="Thông tin tác giả bài viết Huỳnh Trọng Phúc (TurnioDEV)"
        className={`rounded-3xl bg-gradient-to-br from-white via-blue-50/35 to-cyan-50/25 border border-slate-200/85 p-5 sm:p-7 shadow-xs ${className}`}
      >
        <div className="flex flex-col sm:flex-row items-start gap-4 sm:gap-5">
          <img
            src={FOUNDER_AVATAR}
            alt="Tác giả Huỳnh Trọng Phúc (TurnioDEV) — Founder & CEO DOMATION"
            width={72}
            height={72}
            loading="lazy"
            className="w-16 h-16 sm:w-[72px] sm:h-[72px] rounded-2xl object-cover object-top border border-blue-200/80 shadow-sm shrink-0 bg-slate-100"
          />
          <div className="space-y-2.5 flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-blue-50 border border-blue-200 text-[#1E40FF] text-[10px] font-bold uppercase tracking-wider">
                Tác Giả &amp; Kiến Trúc Sư Hệ Thống
              </span>
              <span className="text-[11px] font-semibold text-slate-500">
                35+ Hệ Thống A–Z • 30+ Doanh Nghiệp • ROAS 4.8x
              </span>
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-extrabold text-slate-900">
                Huỳnh Trọng Phúc (TurnioDEV) — Founder &amp; CEO DOMATION
              </h3>
              <p className="text-xs font-semibold text-[#1E40FF] mt-0.5">
                Chuyên Gia AI Automation • Kiến Trúc Sư Hệ Thống A–Z • Chuyên Gia Digital Marketing &amp; MarTech
              </p>
            </div>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Trực tiếp kiến trúc và triển khai hơn 35+ hệ thống phần mềm vận hành từ A–Z (AutoData Chia Lead &amp; Meta CAPI, ERP 5.0 12 phân hệ, CRM 360°, Multi-Agent AI RAG, INKICA 3D CAD 208 SKU, Web 3D WebGL) cho Capital House, IDEAS Business, Phúc Lộc Thọ, Ampersand, En Group và Nha khoa Flora. Tác giả sách{' '}
              <em>&ldquo;Facebook Ads: AI Chạy Không Được&rdquo;</em> (154 trang).
            </p>
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <a
                href={FOUNDER_PORTFOLIO_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#1E40FF] hover:bg-blue-700 text-white text-xs font-bold transition-colors"
              >
                <span>Portfolio TurnioDEV</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
              <a
                href="/portfolio"
                onClick={(e) => handleSpaLinkClick(e, '/portfolio')}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-blue-50 border border-slate-200 text-slate-800 hover:text-[#1E40FF] text-xs font-bold transition-colors"
              >
                <span>Hồ Sơ Dự Án DOMATION</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </a>
              <a
                href={FOUNDER_PROFILE_ARTICLE}
                onClick={(e) => handleSpaLinkClick(e, FOUNDER_PROFILE_ARTICLE)}
                className="inline-flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-[#1E40FF] transition-colors"
              >
                <span>Đọc Hồ Sơ Chuyên Gia</span>
              </a>
              <a
                href={FOUNDER_LINKEDIN_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-[#0A66C2] transition-colors"
              >
                <Globe className="w-3.5 h-3.5" />
                <span>LinkedIn</span>
              </a>
            </div>
          </div>
        </div>
      </section>
    );
  }

  // variant === 'subtle': Customer-first A-Z Setup Support & Consulting -> Action CTAs -> Humble Founder Profile below
  return (
    <section
      aria-label="Hỗ trợ kỹ thuật setup từ A–Z và Kiến trúc sư Huỳnh Trọng Phúc (TurnioDEV)"
      className={`relative z-10 px-4 sm:px-6 py-6 ${className}`}
    >
      <div className="max-w-7xl mx-auto rounded-3xl bg-white/90 backdrop-blur-xl border border-slate-200/85 p-5 sm:p-7 shadow-[0_14px_38px_-18px_rgba(15,23,42,0.10)] space-y-5">
        {/* 1. Customer-first Support Emphasis + Primary Action Buttons */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1.5 max-w-2xl">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-50 border border-blue-200/80 text-[#1E40FF] text-[10.5px] font-bold uppercase tracking-wider">
              <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
              <span>Đồng Hành Setup Trọn Gói</span>
            </div>
            <h3 className="text-base sm:text-xl font-extrabold text-slate-900 leading-snug">
              Hỗ Trợ Kỹ Thuật Setup A–Z &amp; Tư Vấn Phù Hợp
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Không cần tự mày mò kỹ thuật — chuyên viên DOMATION trực tiếp tư vấn mô hình đúng nhu cầu, hỗ trợ setup từ A–Z (Webhook, ZaloBot, API, CRM/ERP) và bàn giao chạy ổn định.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:flex items-center gap-2.5 shrink-0 w-full lg:w-auto">
            <a
              href={SPECIALIST_ZALO_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="min-h-[44px] px-4 py-2.5 rounded-xl bg-[#0068FF] hover:bg-[#0057D9] text-white text-xs sm:text-sm font-bold inline-flex items-center justify-center gap-1.5 whitespace-nowrap shadow-xs transition-colors"
            >
              <MessageCircle className="w-4 h-4 shrink-0" />
              <span>Chat Zalo Setup</span>
            </a>
            {onOpenContact ? (
              <button
                type="button"
                onClick={onOpenContact}
                className="ql-btn-outline min-h-[44px] px-4 py-2.5 text-xs sm:text-sm font-bold inline-flex items-center justify-center gap-1.5 whitespace-nowrap cursor-pointer"
              >
                <span>Tư Vấn Giải Pháp</span>
                <ArrowRight className="w-4 h-4 shrink-0" />
              </button>
            ) : (
              <a
                href="/portfolio"
                onClick={(e) => handleSpaLinkClick(e, '/portfolio')}
                className="ql-btn-outline min-h-[44px] px-4 py-2.5 text-xs sm:text-sm font-bold inline-flex items-center justify-center gap-1.5 whitespace-nowrap"
              >
                <span>Dự Án Thực Tế</span>
                <ArrowRight className="w-4 h-4 shrink-0" />
              </a>
            )}
          </div>
        </div>

        {/* 2. Organic Founder & CEO TurnioDEV Profile Strip Underneath */}
        <div className="pt-4 border-t border-slate-200/75 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <img
              src={FOUNDER_AVATAR}
              alt="Huỳnh Trọng Phúc (TurnioDEV) — Founder & CEO DOMATION"
              width={44}
              height={44}
              loading="lazy"
              className="w-11 h-11 rounded-xl object-cover object-top border border-blue-200/80 shrink-0 bg-slate-100"
            />
            <div className="min-w-0 space-y-0.5">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                <span className="text-xs sm:text-sm font-bold text-slate-900">
                  Huỳnh Trọng Phúc (TurnioDEV)
                </span>
                <span className="text-[11px] font-semibold text-slate-500">
                  • Founder &amp; CEO DOMATION
                </span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                {contextNote ||
                  'Trực tiếp định hướng kiến trúc & bảo chứng triển khai từ A–Z cùng đội ngũ kỹ thuật DOMATION.'}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:flex items-center gap-2 shrink-0 w-full md:w-auto">
            <a
              href={FOUNDER_PORTFOLIO_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="min-h-[44px] sm:min-h-[38px] inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-50 hover:bg-[#1E40FF] text-[#1E40FF] hover:text-white border border-blue-200/80 text-xs font-semibold transition-colors whitespace-nowrap"
            >
              <TrendingUp className="w-3.5 h-3.5 shrink-0" />
              <span>Profile TurnioDEV</span>
              <ExternalLink className="w-3 h-3 shrink-0" />
            </a>
            <a
              href={onOpenContact ? '/portfolio' : FOUNDER_PROFILE_ARTICLE}
              onClick={(e) => handleSpaLinkClick(e, onOpenContact ? '/portfolio' : FOUNDER_PROFILE_ARTICLE)}
              className="min-h-[44px] sm:min-h-[38px] inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200/80 text-slate-800 text-xs font-semibold transition-colors whitespace-nowrap"
            >
              <BookOpen className="w-3.5 h-3.5 shrink-0" />
              <span>{onOpenContact ? 'Dự Án A–Z' : 'Hồ Sơ Founder'}</span>
            </a>
            <a
              href={FOUNDER_PRIMARY_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="sr-only"
            >
              TurnioDEV Executive Portal
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};
