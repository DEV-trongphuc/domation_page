import React, { useMemo, useState } from 'react';
import {
  ArrowRight,
  BookOpen,
  Bot,
  Compass,
  Database,
  Globe2,
  Home,
  Layers3,
  LineChart,
  Search,
  Sparkles,
  Workflow,
  Zap,
} from 'lucide-react';
import { Navbar } from './Navbar';
import { LuxuryGoldBackdrop } from './LuxuryGoldBackdrop';
import { ContactModal } from './ContactModal';
import { DomationFooter } from './components/DomationFooter';
import { usePageSeo } from './utils/seo';
import { getNotFoundSeoConfig } from './data/coreRouteSeo';
import { BOOST_ARTICLES } from './data/boostArticles';
import { handleSpaLinkClick, navigateTo } from './utils/navigation';

export interface NotFoundPageProps {
  path?: string;
}

const CORE_DESTINATIONS = [
  {
    href: '/erp',
    badge: 'CUSTOM OS 5.0',
    title: 'ERP DOMATION May Đo',
    desc: 'Hệ thống vận hành custom may đo, thiết kế flow riêng cho doanh nghiệp thời đại mới.',
    icon: Layers3,
    accent: 'text-[#1E40FF] bg-blue-50 border-blue-200',
  },
  {
    href: '/boost',
    badge: '74+ BÀI CHUYÊN SÂU',
    title: 'Blog DOMATION & SEO',
    desc: 'Kiến thức Vibecode, AI 5.0, Logic quản trị, Tối ưu Ads, Landing Page & Chiến dịch.',
    icon: BookOpen,
    accent: 'text-indigo-700 bg-indigo-50 border-indigo-200',
  },
  {
    href: '/crm',
    badge: 'PIPELINE 360°',
    title: 'CRM & Quản Trị Bán Hàng',
    desc: 'Kanban 8 bước, CDP khách hàng 360°, Live Cart & chống trùng khách tự động.',
    icon: LineChart,
    accent: 'text-emerald-700 bg-emerald-50 border-emerald-200',
  },
  {
    href: '/data',
    badge: 'ZALOBOT + SHEET',
    title: 'Auto Chia Data 1.5s',
    desc: 'Thu lead đa nguồn TikTok/Meta/Landing, chấm điểm AI Pre-Scorer & chia Round-Robin.',
    icon: Zap,
    accent: 'text-amber-700 bg-amber-50 border-amber-200',
  },
  {
    href: '/automation',
    badge: 'CUSTOM FLOW',
    title: 'Automation & AI Phòng Ban',
    desc: 'Flow IF/ELSE không giới hạn, trợ lý AI RAG bảo mật nội bộ & ZNS giữ chân khách.',
    icon: Workflow,
    accent: 'text-cyan-700 bg-cyan-50 border-cyan-200',
  },
  {
    href: '/meta-report',
    badge: 'ADS + CAPI SERVER',
    title: 'Tối Ưu Quảng Cáo Meta CAPI',
    desc: 'Đo ROAS thật 100%, gửi Conversion API server-side vượt chặn cookie trình duyệt.',
    icon: Bot,
    accent: 'text-violet-700 bg-violet-50 border-violet-200',
  },
  {
    href: '/web-design',
    badge: 'CRO + 3D WEBGL',
    title: 'Landing Page & Web May Đo',
    desc: 'Thiết kế Landing Page chuyển đổi cao, chuẩn Core Web Vitals & Sa bàn 3D WebGL.',
    icon: Globe2,
    accent: 'text-sky-700 bg-sky-50 border-sky-200',
  },
  {
    href: '/portfolio',
    badge: 'CASE STUDY THẬT',
    title: 'Portfolio Triển Khai',
    desc: 'Xem dự án thực tế DOMATION đã may đo cho BĐS, Chuỗi bán lẻ, Agency & Sản xuất.',
    icon: Database,
    accent: 'text-rose-700 bg-rose-50 border-rose-200',
  },
];

const STOP_WORDS = new Set([
  'html',
  'htm',
  'php',
  'asp',
  'aspx',
  'index',
  '404',
  'the',
  'and',
  'for',
  'with',
  'bai',
  'viet',
  'blog',
  'boost',
  'page',
]);

export const NotFoundPage: React.FC<NotFoundPageProps> = ({ path = '/404' }) => {
  const normalizedPath = path || '/404';
  const seoConfig = useMemo(
    () => getNotFoundSeoConfig(normalizedPath),
    [normalizedPath]
  );
  usePageSeo(seoConfig);

  const [searchQuery, setSearchQuery] = useState('');
  const [contactOpen, setContactOpen] = useState(false);

  const recommendedArticles = useMemo(() => {
    const tokens = normalizedPath
      .toLowerCase()
      .split(/[/\-_.\s?&=]+/)
      .filter((token) => token.length >= 2 && !STOP_WORDS.has(token));

    if (tokens.length === 0) {
      return BOOST_ARTICLES.slice(0, 3);
    }

    const scored = BOOST_ARTICLES.map((article) => {
      const haystack = [
        article.slug,
        article.title,
        article.focusKeyword,
        article.pillarLabel,
        article.industry,
        article.metaDescription,
        ...(article.secondaryKeywords || []),
      ]
        .join(' ')
        .toLowerCase();

      let score = 0;
      for (const token of tokens) {
        if (article.slug.toLowerCase().includes(token)) score += 4;
        if (article.focusKeyword.toLowerCase().includes(token)) score += 3;
        if (haystack.includes(token)) score += 1;
      }
      return { article, score };
    })
      .sort((a, b) => b.score - a.score)
      .slice(0, 3);

    if (scored.every((item) => item.score === 0)) {
      return BOOST_ARTICLES.slice(0, 3);
    }
    return scored.map((item) => item.article);
  }, [normalizedPath]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = searchQuery.trim();
    if (trimmed) {
      navigateTo(`/boost?q=${encodeURIComponent(trimmed)}`);
    } else {
      navigateTo('/boost');
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-slate-900 relative overflow-x-clip">
      <LuxuryGoldBackdrop />
      <Navbar activePage="not-found" onOpenContact={() => setContactOpen(true)} />

      <main className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-20">
        {/* Hero 404 Card */}
        <section className="inkica-glass-card rounded-3xl overflow-hidden border border-slate-200/80 shadow-xl">
          <div className="grid grid-cols-1 lg:grid-cols-12 items-center">
            <div className="lg:col-span-7 p-6 sm:p-10 space-y-6">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-xs font-bold text-[#1E40FF]">
                <Compass className="w-4 h-4" />
                <span>HTTP 404 • ĐIỀU HƯỚNG THÔNG MINH DOMATION</span>
              </div>

              <div className="space-y-3">
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-slate-900 leading-tight">
                  404 — Không Tìm Thấy Trang
                </h1>
                <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
                  Đường dẫn{' '}
                  <code className="px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-xs font-mono text-slate-800 break-all">
                    {normalizedPath}
                  </code>{' '}
                  không tồn tại hoặc đã được chuẩn hóa SLUG SEO mới trên hệ sinh thái{' '}
                  <strong className="text-slate-900">
                    DOMATION — Hệ thống vận hành custom may đo, thiết kế flow riêng cho doanh nghiệp thời đại mới
                  </strong>
                  .
                </p>
              </div>

              {/* Search redirect to Blog DOMATION */}
              <form
                onSubmit={handleSearchSubmit}
                className="flex flex-col sm:flex-row gap-2.5"
                role="search"
                aria-label="Tìm bài viết trên Blog DOMATION"
              >
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="search"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Tìm từ khóa: vibecode, ERP may đo, tối ưu quảng cáo, landing page..."
                    aria-label="Nhập từ khóa tìm kiếm trên Blog DOMATION"
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-white border border-slate-200 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1E40FF]/30 focus:border-[#1E40FF]"
                  />
                </div>
                <button
                  type="submit"
                  className="ql-btn-primary px-5 py-3 text-sm justify-center cursor-pointer whitespace-nowrap"
                >
                  <Search className="w-4 h-4" />
                  <span>Tìm trên Blog /boost</span>
                </button>
              </form>

              <div className="flex flex-wrap items-center gap-3 pt-1">
                <a
                  href="/"
                  onClick={(e) => handleSpaLinkClick(e, '/')}
                  className="ql-btn-outline px-4 py-2.5 text-xs sm:text-sm font-bold"
                >
                  <Home className="w-4 h-4" />
                  <span>Về Trang Chủ</span>
                </a>
                <a
                  href="/boost"
                  onClick={(e) => handleSpaLinkClick(e, '/boost')}
                  className="px-4 py-2.5 rounded-xl bg-blue-50 hover:bg-blue-100 border border-blue-200 text-[#1E40FF] text-xs sm:text-sm font-bold inline-flex items-center gap-2 transition-colors"
                >
                  <BookOpen className="w-4 h-4" />
                  <span>Khám Phá Blog DOMATION (74+ Bài)</span>
                </a>
                <a
                  href="/erp"
                  onClick={(e) => handleSpaLinkClick(e, '/erp')}
                  className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs sm:text-sm font-bold inline-flex items-center gap-2 transition-colors"
                >
                  <Sparkles className="w-4 h-4 text-cyan-300" />
                  <span>ERP 5.0 May Đo Flow Riêng</span>
                </a>
              </div>
            </div>

            <div className="lg:col-span-5 bg-slate-100/80 border-t lg:border-t-0 lg:border-l border-slate-200/80">
              <div className="aspect-[16/9] lg:aspect-[4/3] w-full overflow-hidden">
                <img
                  src="/imgs/boost/boost-404-lost-compass.jpg"
                  alt="La bàn số dẫn lối về hệ thống vận hành ERP may đo và Blog DOMATION"
                  width={1376}
                  height={768}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Smart URL-token Recommended Articles */}
        <section className="mt-12 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-[#1E40FF] mb-1">
                GỢI Ý THEO URL BẠN ĐANG TÌM
              </div>
              <h2 className="text-2xl font-bold text-slate-900">
                Bài Viết Phù Hợp Nhất Trên Blog DOMATION
              </h2>
            </div>
            <a
              href="/boost"
              onClick={(e) => handleSpaLinkClick(e, '/boost')}
              className="text-xs font-bold text-[#1E40FF] hover:underline inline-flex items-center gap-1"
            >
              <span>Xem toàn bộ 74 bài viết chuẩn SEO</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </a>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {recommendedArticles.map((art) => (
              <a
                key={art.id}
                href={`/boost/${art.slug}`}
                onClick={(e) => handleSpaLinkClick(e, `/boost/${art.slug}`)}
                className="inkica-glass-card rounded-2xl overflow-hidden flex flex-col justify-between group border border-slate-200/80"
              >
                <div>
                  <div className="aspect-[16/9] overflow-hidden bg-slate-100 border-b border-slate-200/70">
                    <img
                      src={art.coverImage}
                      alt={art.coverAlt}
                      width={1376}
                      height={768}
                      loading="lazy"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                  <div className="p-5 space-y-2">
                    <div className="flex items-center justify-between gap-2 text-[11px]">
                      <span className="font-bold text-[#1E40FF]">{art.pillarLabel}</span>
                      <span className="text-slate-500">{art.readingMinutes} phút đọc</span>
                    </div>
                    <h3 className="text-base font-bold text-slate-900 group-hover:text-[#1E40FF] transition-colors line-clamp-2">
                      {art.title}
                    </h3>
                    <p className="text-xs text-slate-600 line-clamp-2">{art.metaDescription}</p>
                  </div>
                </div>
                <div className="px-5 pb-4 pt-2 flex items-center justify-between text-xs font-bold text-[#1E40FF]">
                  <span>Đọc chi tiết</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </div>
              </a>
            ))}
          </div>
        </section>

        {/* Core Ecosystem Destinations */}
        <section className="mt-12 space-y-5">
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-[#1E40FF] mb-1">
              BẢN ĐỒ HỆ SINH THÁI DOMATION
            </div>
            <h2 className="text-2xl font-bold text-slate-900">
              Truy Cập Nhanh Các Phân Hệ Vận Hành & Tăng Trưởng
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {CORE_DESTINATIONS.map((dest) => {
              const Icon = dest.icon;
              return (
                <a
                  key={dest.href}
                  href={dest.href}
                  onClick={(e) => handleSpaLinkClick(e, dest.href)}
                  className="inkica-glass-card rounded-2xl p-5 border border-slate-200/80 hover:border-[#1E40FF]/40 transition-all group flex flex-col justify-between gap-4"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className={`inline-flex items-center justify-center w-9 h-9 rounded-xl border ${dest.accent}`}>
                        <Icon className="w-4 h-4" />
                      </span>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                        {dest.badge}
                      </span>
                    </div>
                    <h3 className="text-sm font-bold text-slate-900 group-hover:text-[#1E40FF] transition-colors">
                      {dest.title}
                    </h3>
                    <p className="text-xs text-slate-600 leading-relaxed">{dest.desc}</p>
                  </div>
                  <div className="flex items-center justify-between text-xs font-bold text-[#1E40FF]">
                    <span>Mở phân hệ</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </div>
                </a>
              );
            })}
          </div>
        </section>
      </main>

      <DomationFooter onOpenContact={() => setContactOpen(true)} />

      <ContactModal
        isOpen={contactOpen}
        onClose={() => setContactOpen(false)}
        defaultService="Enterprise ERP 5.0 (12 Phân hệ • Chấm công GPS & Payroll)"
        defaultNote={`Điều hướng từ trang 404 (${normalizedPath}) — Cần tư vấn ERP May Đo & Flow riêng`}
      />
    </div>
  );
};
