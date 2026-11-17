import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  BookOpen,
  Calendar,
  Clock,
  Filter,
  Layers,
  Search,
  Sparkles,
  TrendingUp,
  Wrench,
} from 'lucide-react';
import { Navbar } from './Navbar';
import { ContactModal } from './ContactModal';
import { LuxuryGoldBackdrop } from './LuxuryGoldBackdrop';
import { DomationFooter } from './components/DomationFooter';
import { BOOST_ARTICLES } from './data/boostArticles';
import { BOOST_PILLAR_META, INDUSTRY_PAIN_PLAYBOOK } from './data/boostSeoData';
import { FaqAccordionSection } from './components/FaqAccordionSection';
import { BOOST_FAQS, getBoostHubSeoConfig } from './data/boostRouteSeo';
import { DOMATION_NAV_EVENT, handleSpaLinkClick } from './utils/navigation';
import { usePageSeo } from './utils/seo';

const PILLAR_FILTERS = [
  { id: 'all', label: 'Tất Cả Chuyên Mục' },
  ...Object.values(BOOST_PILLAR_META),
];

const ARTICLES_PAGE_SIZE = 12;

function readSearchFiltersFromUrl(): { q: string; pillar: string } {
  if (typeof window === 'undefined') return { q: '', pillar: 'all' };
  const params = new URLSearchParams(window.location.search);
  const q = params.get('q') || '';
  const rawPillar = params.get('pillar') || 'all';
  const pillar =
    rawPillar === 'all' || Boolean(BOOST_PILLAR_META[rawPillar]) ? rawPillar : 'all';
  return { q, pillar };
}

export const BoostHubPage: React.FC = () => {
  const initialUrlState = readSearchFiltersFromUrl();

  const [articleSearch, setArticleSearch] = useState(initialUrlState.q);
  const [articlePillar, setArticlePillar] = useState(initialUrlState.pillar);
  const [articleIndustry, setArticleIndustry] = useState('all');
  const [visibleCount, setVisibleCount] = useState(ARTICLES_PAGE_SIZE);

  useEffect(() => {
    const syncFromUrl = () => {
      const next = readSearchFiltersFromUrl();
      setArticleSearch(next.q);
      setArticlePillar(next.pillar);
      setVisibleCount(ARTICLES_PAGE_SIZE);
    };
    window.addEventListener(DOMATION_NAV_EVENT, syncFromUrl);
    window.addEventListener('popstate', syncFromUrl);
    return () => {
      window.removeEventListener(DOMATION_NAV_EVENT, syncFromUrl);
      window.removeEventListener('popstate', syncFromUrl);
    };
  }, []);

  const [activeIndustryId, setActiveIndustryId] = useState(INDUSTRY_PAIN_PLAYBOOK[0].id);

  const [contactOpen, setContactOpen] = useState(false);
  const [contactDefaults, setContactDefaults] = useState<{
    service?: string;
    note?: string;
  }>({});

  usePageSeo(getBoostHubSeoConfig());

  const uniqueIndustries = useMemo(() => {
    const set = new Set(BOOST_ARTICLES.map((a) => a.industry));
    return ['all', ...Array.from(set)];
  }, []);

  const hasActiveFilter =
    Boolean(articleSearch.trim()) || articlePillar !== 'all' || articleIndustry !== 'all';

  const featuredArticle =
    BOOST_ARTICLES.find((a) => a.id === 'art-25') || BOOST_ARTICLES[0];

  const filteredArticles = useMemo(() => {
    const q = articleSearch.trim().toLowerCase();
    return BOOST_ARTICLES.filter((art) => {
      if (!hasActiveFilter && featuredArticle && art.id === featuredArticle.id) {
        return false;
      }
      if (articlePillar !== 'all' && art.pillar !== articlePillar) return false;
      if (articleIndustry !== 'all' && art.industry !== articleIndustry) return false;
      if (!q) return true;
      const haystack = [
        art.title,
        art.focusKeyword,
        art.industry,
        art.pillarLabel,
        art.metaDescription,
        ...art.secondaryKeywords,
      ]
        .join(' ')
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [articleSearch, articlePillar, articleIndustry, hasActiveFilter, featuredArticle]);

  const displayedArticles = useMemo(
    () => filteredArticles.slice(0, visibleCount),
    [filteredArticles, visibleCount]
  );

  const activeIndustry =
    INDUSTRY_PAIN_PLAYBOOK.find((i) => i.id === activeIndustryId) ||
    INDUSTRY_PAIN_PLAYBOOK[0];

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-slate-900 relative overflow-x-clip font-sans selection:bg-blue-600/20">
      <LuxuryGoldBackdrop />

      <Navbar
        activePage="boost"
        onOpenContact={() => {
          setContactDefaults({});
          setContactOpen(true);
        }}
        contactLabel="Tư Vấn Triển Khai"
      />

      <main className="relative z-10 pt-24 sm:pt-28 pb-20 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto space-y-12">
          {/* ================================================================ */}
          {/* 1. CLEAN EDITORIAL PUBLICATION HEADER & FEATURED STORY            */}
          {/* ================================================================ */}
          <section className="space-y-6">
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 border-b border-slate-200/80 pb-6">
              <div className="space-y-2.5 max-w-3xl">
                <div className="ql-eyebrow">
                  <BookOpen className="w-3.5 h-3.5 text-[#1E40FF]" />
                  <span>BLOG DOMATION • ERP MAY ĐO, VIBECODE &amp; AI 5.0</span>
                </div>
                <h1 className="text-3xl sm:text-4xl xl:text-[42px] font-extrabold text-slate-900 leading-[1.2] tracking-tight">
                  Blog DOMATION &amp;{' '}
                  <span className="text-gradient-inkica">Chiến Lược Vận Hành Thời Đại 5.0</span>
                </h1>
                <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
                  Chia sẻ kiến thức thực chiến về{' '}
                  <strong className="text-slate-900">
                    ERP DOMATION custom may đo thiết kế flow riêng
                  </strong>
                  , Vibecode, AI doanh nghiệp thời đại 5.0, logic quản trị doanh nghiệp và chiến lược
                  tối ưu quảng cáo, Landing Page, chiến dịch chuyển đổi cao.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                <a
                  href="#articles"
                  className="btn-inkica-primary px-5 py-2.5 text-xs sm:text-sm"
                >
                  <span>Bài Viết Chuyên Sâu</span>
                  <ArrowRight className="w-4 h-4" />
                </a>
                <a
                  href="#pain-points"
                  className="ql-btn-outline px-4 py-2.5 text-xs sm:text-sm"
                >
                  <span>Theo Ngành Nghề</span>
                </a>
                <a
                  href="#faq"
                  className="ql-btn-outline px-4 py-2.5 text-xs sm:text-sm"
                >
                  <span>FAQ</span>
                </a>
              </div>
            </div>

            {/* Featured Story Spotlight (shown when no active filter) */}
            {!hasActiveFilter && featuredArticle && (
              <article className="inkica-glass-card rounded-[28px] overflow-hidden grid grid-cols-1 lg:grid-cols-12 group">
                <a
                  href={`/boost/${featuredArticle.slug}`}
                  onClick={(e) => handleSpaLinkClick(e, `/boost/${featuredArticle.slug}`)}
                  className="lg:col-span-7 relative aspect-[16/9] lg:aspect-auto lg:min-h-[340px] bg-slate-100 overflow-hidden"
                >
                  <img
                    src={featuredArticle.coverImage}
                    alt={featuredArticle.coverAlt}
                    width={1376}
                    height={768}
                    fetchPriority="high"
                    className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500"
                  />
                  <span className="absolute top-4 left-4 px-3 py-1 rounded-full bg-white/95 text-[#1E40FF] text-[11px] font-bold border border-blue-200 shadow-xs">
                    {featuredArticle.industry}
                  </span>
                </a>

                <div className="lg:col-span-5 p-6 sm:p-8 flex flex-col justify-between gap-5">
                  <div className="space-y-3.5">
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-[#1E40FF] font-bold">
                        Tiêu Điểm Mới Nhất
                      </span>
                      <span className="font-semibold text-[#0369A1]">
                        {featuredArticle.pillarLabel}
                      </span>
                    </div>

                    <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 leading-snug group-hover:text-[#1E40FF] transition-colors">
                      <a
                        href={`/boost/${featuredArticle.slug}`}
                        onClick={(e) => handleSpaLinkClick(e, `/boost/${featuredArticle.slug}`)}
                      >
                        {featuredArticle.title}
                      </a>
                    </h2>

                    <p className="text-xs sm:text-sm text-slate-600 leading-relaxed line-clamp-3">
                      {featuredArticle.metaDescription}
                    </p>
                  </div>

                  <div className="pt-4 border-t border-slate-200/75 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 text-xs text-slate-500">
                      <span className="inline-flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        {featuredArticle.publishedAt}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {featuredArticle.readingMinutes} phút đọc
                      </span>
                    </div>
                    <a
                      href={`/boost/${featuredArticle.slug}`}
                      onClick={(e) => handleSpaLinkClick(e, `/boost/${featuredArticle.slug}`)}
                      className="text-xs sm:text-sm font-bold text-[#1E40FF] hover:text-cyan-600 inline-flex items-center gap-1.5"
                    >
                      <span>Đọc bài viết</span>
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </a>
                  </div>
                </div>
              </article>
            )}
          </section>

          {/* ================================================================ */}
          {/* 2. NEWS ARCHIVE FEED & CATEGORY FILTERS                          */}
          {/* ================================================================ */}
          <section id="articles" className="space-y-6 scroll-mt-24">
            {/* Editorial Filter Bar */}
            <div className="rounded-2xl bg-white/90 backdrop-blur-xl border border-slate-200/85 p-4 space-y-3.5 shadow-xs">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                <div className="md:col-span-7 relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={articleSearch}
                    onChange={(e) => {
                      setArticleSearch(e.target.value);
                      setVisibleCount(ARTICLES_PAGE_SIZE);
                    }}
                    placeholder="Tìm kiếm bài viết theo chủ đề, ngành nghề hoặc giải pháp..."
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-[#1E40FF] focus:bg-white"
                  />
                </div>
                <div className="md:col-span-5 flex items-center gap-2">
                  <Filter className="w-4 h-4 text-slate-500 shrink-0" />
                  <select
                    aria-label="Lọc bài viết theo lĩnh vực"
                    value={articleIndustry}
                    onChange={(e) => {
                      setArticleIndustry(e.target.value);
                      setVisibleCount(ARTICLES_PAGE_SIZE);
                    }}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs sm:text-sm font-medium text-slate-800 focus:outline-none focus:border-[#1E40FF]"
                  >
                    <option value="all">Tất cả lĩnh vực</option>
                    {uniqueIndustries
                      .filter((x) => x !== 'all')
                      .map((ind) => (
                        <option key={ind} value={ind}>
                          {ind}
                        </option>
                      ))}
                  </select>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-1.5">
                {PILLAR_FILTERS.map((p) => {
                  const active = articlePillar === p.id;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => {
                        setArticlePillar(p.id);
                        setVisibleCount(ARTICLES_PAGE_SIZE);
                      }}
                      className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                        active ? 'ql-pill-tab-active' : 'ql-pill-tab'
                      }`}
                    >
                      {p.label}
                    </button>
                  );
                })}
                {hasActiveFilter && (
                  <button
                    type="button"
                    onClick={() => {
                      setArticleSearch('');
                      setArticlePillar('all');
                      setArticleIndustry('all');
                      setVisibleCount(ARTICLES_PAGE_SIZE);
                    }}
                    className="ml-auto text-xs font-semibold text-[#1E40FF] hover:underline cursor-pointer"
                  >
                    Xóa bộ lọc
                  </button>
                )}
              </div>
            </div>

            {/* Editorial Articles Grid */}
            {filteredArticles.length === 0 ? (
              <div className="rounded-2xl bg-white border border-slate-200 p-10 text-center space-y-3">
                <p className="text-sm font-semibold text-slate-700">
                  Không tìm thấy bài viết phù hợp với từ khóa hoặc bộ lọc hiện tại.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setArticleSearch('');
                    setArticlePillar('all');
                    setArticleIndustry('all');
                    setVisibleCount(ARTICLES_PAGE_SIZE);
                  }}
                  className="ql-btn-outline px-4 py-2 text-xs cursor-pointer"
                >
                  Xem tất cả bài viết
                </button>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {displayedArticles.map((art) => (
                    <article
                      key={art.id}
                      className="inkica-glass-card rounded-[22px] overflow-hidden flex flex-col justify-between group"
                    >
                      <div>
                        <a
                          href={`/boost/${art.slug}`}
                          onClick={(e) => handleSpaLinkClick(e, `/boost/${art.slug}`)}
                          className="block relative aspect-[16/9] bg-slate-100 border-b border-slate-200/75 overflow-hidden"
                        >
                          <img
                            src={art.coverImage}
                            alt={art.coverAlt}
                            width={1376}
                            height={768}
                            loading="lazy"
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                          <span className="absolute top-3 left-3 px-2.5 py-0.5 rounded-full bg-white/95 text-[#1E40FF] text-[10px] font-bold border border-blue-200">
                            {art.industry}
                          </span>
                        </a>

                        <div className="p-5 space-y-3">
                          <div className="flex items-center justify-between gap-2 text-[11px]">
                            <span className="font-bold text-[#0369A1]">{art.pillarLabel}</span>
                            <span className="inline-flex items-center gap-1 text-slate-500">
                              <Clock className="w-3 h-3" />
                              {art.readingMinutes} phút
                            </span>
                          </div>

                          <h3 className="text-base font-bold text-slate-900 leading-snug group-hover:text-[#1E40FF] transition-colors">
                            <a
                              href={`/boost/${art.slug}`}
                              onClick={(e) => handleSpaLinkClick(e, `/boost/${art.slug}`)}
                            >
                              {art.title}
                            </a>
                          </h3>

                          <p className="text-xs text-slate-600 leading-relaxed line-clamp-3">
                            {art.metaDescription}
                          </p>
                        </div>
                      </div>

                      <div className="px-5 py-3.5 bg-slate-50/75 border-t border-slate-200/75 flex items-center justify-between gap-2">
                        <span className="text-[11px] text-slate-500 inline-flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {art.publishedAt}
                        </span>
                        <a
                          href={`/boost/${art.slug}`}
                          onClick={(e) => handleSpaLinkClick(e, `/boost/${art.slug}`)}
                          className="text-xs font-bold text-[#1E40FF] hover:text-cyan-600 inline-flex items-center gap-1.5"
                        >
                          <span>Đọc tiếp</span>
                          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                        </a>
                      </div>
                    </article>
                  ))}
                </div>

                {visibleCount < filteredArticles.length && (
                  <div className="flex justify-center pt-2">
                    <button
                      type="button"
                      onClick={() => setVisibleCount((prev) => prev + ARTICLES_PAGE_SIZE)}
                      className="ql-btn-outline px-6 py-2.5 text-xs sm:text-sm cursor-pointer"
                    >
                      Xem thêm bài viết cũ hơn
                    </button>
                  </div>
                )}
              </>
            )}
          </section>

          {/* ================================================================ */}
          {/* 3. INDUSTRY PRACTICAL CHALLENGES & SOLUTIONS                     */}
          {/* ================================================================ */}
          <section id="pain-points" className="space-y-6 scroll-mt-24 pt-2">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
              <div>
                <div className="ql-eyebrow mb-2.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                  <span>GÓC NHÌN TRIỂN KHAI THEO LĨNH VỰC</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">
                  Bài Toán Vận Hành{' '}
                  <span className="text-gradient-inkica">Theo Từng Ngành Nghề</span>
                </h2>
              </div>
              <p className="text-xs sm:text-sm text-slate-600 max-w-md">
                Chọn lĩnh vực bên dưới để xem những điểm nghẽn vận hành thường gặp và kinh nghiệm xử lý thực tế từ đội ngũ kỹ sư DOMATION.
              </p>
            </div>

            {/* Industry Selector Tabs */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {INDUSTRY_PAIN_PLAYBOOK.map((ind) => {
                const active = ind.id === activeIndustry.id;
                return (
                  <button
                    key={ind.id}
                    type="button"
                    onClick={() => setActiveIndustryId(ind.id)}
                    className={`rounded-2xl p-3.5 text-left border transition-all cursor-pointer ${
                      active
                        ? 'bg-slate-900 text-white border-slate-900 shadow-md'
                        : 'bg-white/90 text-slate-700 border-slate-200/85 hover:border-blue-300'
                    }`}
                  >
                    <div
                      className={`text-[9px] font-bold uppercase tracking-wider truncate ${
                        active ? 'text-cyan-300' : 'text-[#1E40FF]'
                      }`}
                    >
                      {ind.badge}
                    </div>
                    <div className="text-xs sm:text-[13px] font-bold mt-1 line-clamp-2 leading-snug">
                      {ind.industry}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Active Industry Guide Card */}
            <div className="rounded-[28px] bg-white/90 backdrop-blur-2xl border border-slate-200/85 p-6 sm:p-9 shadow-[0_24px_64px_-24px_rgba(15,23,42,0.08)] space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                <div className="lg:col-span-5 space-y-4">
                  <div className="rounded-2xl overflow-hidden border border-slate-200/80 bg-[#F4F8FF]">
                    <img
                      src={activeIndustry.coverImage}
                      alt={activeIndustry.industry}
                      loading="lazy"
                      className="w-full aspect-[16/9] object-cover"
                    />
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {activeIndustry.keyMetrics.map((m) => (
                      <span
                        key={m}
                        className="px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-[11px] font-bold"
                      >
                        {m}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="lg:col-span-7 space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-[#1E40FF]">
                      {activeIndustry.badge}
                    </span>
                    <span className="text-xs text-slate-500">
                      Tiêu biểu:{' '}
                      <strong className="text-slate-800">
                        {activeIndustry.representativeClients.join(', ')}
                      </strong>
                    </span>
                  </div>

                  <h3 className="text-2xl font-bold text-slate-900">
                    {activeIndustry.industry}
                  </h3>

                  <div className="rounded-2xl bg-slate-950 text-white p-4 sm:p-5 space-y-1.5">
                    <div className="text-[11px] font-bold uppercase tracking-wider text-cyan-300 flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5" />
                      <span>Hướng Giải Quyết Trong Thực Tế</span>
                    </div>
                    <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
                      {activeIndustry.domationArchitecture}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2.5">
                    <a
                      href={activeIndustry.targetModuleUrl}
                      onClick={(e) => handleSpaLinkClick(e, activeIndustry.targetModuleUrl)}
                      className="btn-inkica-primary px-4 py-2.5 text-xs"
                    >
                      <span>{activeIndustry.targetModuleLabel}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </a>
                    <button
                      type="button"
                      onClick={() => {
                        setContactDefaults({
                          service: activeIndustry.targetModuleLabel,
                          note: `Cần tư vấn giải pháp vận hành cho lĩnh vực: ${activeIndustry.industry}`,
                        });
                        setContactOpen(true);
                      }}
                      className="ql-btn-outline px-4 py-2.5 text-xs cursor-pointer"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-[#1E40FF]" />
                      <span>Trao Đổi Cùng Chuyên Gia</span>
                    </button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-2 border-t border-slate-200/75">
                <div className="rounded-2xl bg-rose-50/55 border border-rose-200/75 p-5 space-y-3">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-rose-700">
                    <AlertTriangle className="w-4 h-4" />
                    <span>Thách Thức Vận Hành Thường Gặp</span>
                  </div>
                  <ul className="space-y-2.5">
                    {activeIndustry.corePainPoints.map((pain) => (
                      <li key={pain} className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-700">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0 mt-2" />
                        <span>{pain}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="rounded-2xl bg-amber-50/55 border border-amber-200/75 p-5 space-y-3">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-800">
                    <Wrench className="w-4 h-4" />
                    <span>Lưu Ý Thực Tế Khi Triển Khai</span>
                  </div>
                  <ul className="space-y-2.5">
                    {activeIndustry.deploymentFriction.map((fric) => (
                      <li key={fric} className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-700">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-600 shrink-0 mt-2" />
                        <span>{fric}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Linked Articles for this Industry */}
              <div className="pt-2 flex flex-wrap items-center gap-2">
                <span className="text-xs font-bold text-slate-700 mr-1">
                  Bài viết liên quan:
                </span>
                {activeIndustry.relatedArticleSlugs.map((slug) => {
                  const found = BOOST_ARTICLES.find((a) => a.slug === slug);
                  if (!found) return null;
                  return (
                    <a
                      key={slug}
                      href={`/boost/${slug}`}
                      onClick={(e) => handleSpaLinkClick(e, `/boost/${slug}`)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-[#1E40FF] text-[#1E40FF] hover:text-white border border-blue-200 text-xs font-semibold transition-colors max-w-full"
                    >
                      <span className="truncate">{found.title}</span>
                      <ArrowRight className="w-3 h-3 shrink-0" />
                    </a>
                  );
                })}
              </div>
            </div>
          </section>

          {/* Visible FAQ Section */}
          <div className="scroll-mt-24">
            <FaqAccordionSection
              faqs={BOOST_FAQS}
              className="!px-0 !py-0"
              heading="Câu Hỏi Thường Gặp Về Blog & ERP May Đo"
              subtitle="Giải đáp nhanh về nội dung chuyên mục, lộ trình triển khai và cách đặt lịch tư vấn ERP may đo cùng DOMATION."
            />
          </div>

          {/* Bottom Consultation CTA */}
          <section className="rounded-[28px] bg-gradient-to-br from-slate-950 via-[#0F172A] to-[#0A2568] text-white p-7 sm:p-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-2 max-w-2xl">
              <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-cyan-300">
                <TrendingUp className="w-4 h-4" />
                <span>TRIỂN KHAI THỰC TẾ CHO DOANH NGHIỆP CỦA BẠN</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-white">
                Cần Thiết Kế Hệ Thống Vận Hành Custom May Đo &amp; Flow Riêng?
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                Đặt lịch trao đổi 1-1 cùng Solution Architect của DOMATION để may đo ERP 5.0,
                CRM MISA, luồng Auto Chia Data, Vibecode AI Agent hoặc hệ thống tối ưu quảng cáo
                &amp; Landing Page chuyển đổi cao cho doanh nghiệp của bạn.
              </p>
            </div>
            <div className="flex flex-wrap gap-3 shrink-0">
              <button
                type="button"
                onClick={() => {
                  setContactDefaults({
                    service: 'Enterprise ERP 5.0 (12 Phân hệ • Chấm công GPS & Payroll)',
                    note: 'Liên hệ từ Blog DOMATION (/boost) — Muốn tư vấn ERP may đo & thiết kế flow riêng',
                  });
                  setContactOpen(true);
                }}
                className="btn-inkica-primary px-6 py-3.5 text-sm cursor-pointer"
              >
                <Sparkles className="w-4 h-4" />
                <span>Đặt Lịch Khảo Sát 1-1</span>
              </button>
            </div>
          </section>
        </div>
      </main>

      <DomationFooter
        onOpenContact={() => {
          setContactDefaults({});
          setContactOpen(true);
        }}
      />

      <ContactModal
        isOpen={contactOpen}
        onClose={() => setContactOpen(false)}
        defaultService={contactDefaults.service}
        defaultNote={contactDefaults.note}
      />
    </div>
  );
};
