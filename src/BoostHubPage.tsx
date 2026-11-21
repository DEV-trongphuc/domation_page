import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowRight,
  Bookmark,
  ChevronLeft,
  ChevronRight,
  Flame,
  LayoutGrid,
  List,
  Search,
  Sparkles,
  X,
} from 'lucide-react';
import { Navbar } from './Navbar';
import { ContactModal } from './ContactModal';
import { LuxuryGoldBackdrop } from './LuxuryGoldBackdrop';
import { DomationFooter } from './components/DomationFooter';
import { BackToTopPill } from './components/BackToTopPill';
import { BlogArticleCard } from './components/boost/BlogArticleCard';
import {
  BLOG_BOOKMARKS_EVENT,
  BLOG_CATEGORIES,
  POPULAR_TOPICS,
  getArticleCategory,
  readBookmarkedSlugs,
  selectFeaturedSlideArticles,
  selectMostReadArticles,
  sortCatalogArticles,
  toggleBookmarkedSlug,
  type BlogCategoryId,
} from './components/boost/blogMeta';
import { BOOST_CATALOG } from './data/boostCatalog';
import type { BoostPillarId } from './data/boostTypes';
import { getBoostHubSeoConfig } from './data/boostRouteSeo';
import { filterPublishedArticles, getArticleScheduledDate } from './data/publishSchedule';
import { DOMATION_NAV_EVENT, handleSpaLinkClick } from './utils/navigation';
import { usePageSeo } from './utils/seo';

const ARTICLES_PAGE_SIZE = 10;

function readUrlState(): { q: string; cat: BlogCategoryId } {
  if (typeof window === 'undefined') return { q: '', cat: 'all' };
  const params = new URLSearchParams(window.location.search);
  const q = params.get('q') || '';
  const rawCat = params.get('cat') || 'all';
  const matchedCat = BLOG_CATEGORIES.find((c) => c.id === rawCat);
  if (matchedCat) return { q, cat: matchedCat.id };

  // Support legacy ?pillar=... links seamlessly
  const rawPillar = params.get('pillar');
  if (rawPillar) {
    const byPillar = BLOG_CATEGORIES.find(
      (c) => c.id !== 'all' && c.pillars.includes(rawPillar as BoostPillarId)
    );
    if (byPillar) return { q, cat: byPillar.id };
  }
  return { q, cat: 'all' };
}

export const BoostHubPage: React.FC = () => {
  const initialUrlState = readUrlState();

  const [searchQuery, setSearchQuery] = useState(initialUrlState.q);
  const [activeCat, setActiveCat] = useState<BlogCategoryId>(initialUrlState.cat);
  const [onlySaved, setOnlySaved] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [visibleCount, setVisibleCount] = useState(ARTICLES_PAGE_SIZE);

  const [slideIdx, setSlideIdx] = useState(0);
  const [carouselPaused, setCarouselPaused] = useState(false);
  const [bookmarkedSlugs, setBookmarkedSlugs] = useState<string[]>([]);
  const [contactOpen, setContactOpen] = useState(false);

  const railRef = useRef<HTMLDivElement | null>(null);

  usePageSeo(getBoostHubSeoConfig());

  const publishedCatalog = useMemo(() => filterPublishedArticles(BOOST_CATALOG), []);
  const sortedNewest = useMemo(
    () => sortCatalogArticles(publishedCatalog, 'newest'),
    [publishedCatalog]
  );

  useEffect(() => {
    setBookmarkedSlugs(readBookmarkedSlugs());
    const syncBookmarks = () => setBookmarkedSlugs(readBookmarkedSlugs());
    window.addEventListener(BLOG_BOOKMARKS_EVENT, syncBookmarks);
    window.addEventListener('storage', syncBookmarks);
    return () => {
      window.removeEventListener(BLOG_BOOKMARKS_EVENT, syncBookmarks);
      window.removeEventListener('storage', syncBookmarks);
    };
  }, []);

  useEffect(() => {
    const syncFromUrl = () => {
      const next = readUrlState();
      setSearchQuery(next.q);
      setActiveCat(next.cat);
      setOnlySaved(false);
      setVisibleCount(ARTICLES_PAGE_SIZE);
    };
    window.addEventListener(DOMATION_NAV_EVENT, syncFromUrl);
    window.addEventListener('popstate', syncFromUrl);
    return () => {
      window.removeEventListener(DOMATION_NAV_EVENT, syncFromUrl);
      window.removeEventListener('popstate', syncFromUrl);
    };
  }, []);

  const featuredSlides = useMemo(
    () => selectFeaturedSlideArticles(publishedCatalog, 5),
    [publishedCatalog]
  );

  useEffect(() => {
    if (carouselPaused || featuredSlides.length <= 1) return;
    const timer = window.setInterval(() => {
      setSlideIdx((prev) => (prev + 1) % featuredSlides.length);
    }, 6500);
    return () => window.clearInterval(timer);
  }, [carouselPaused, featuredSlides.length]);

  const handleToggleBookmark = (slug: string) => {
    setBookmarkedSlugs(toggleBookmarkedSlug(slug));
  };

  const hasActiveFilter =
    Boolean(searchQuery.trim()) || activeCat !== 'all' || onlySaved;

  const activeCategoryObj = useMemo(
    () => BLOG_CATEGORIES.find((c) => c.id === activeCat) || BLOG_CATEGORIES[0],
    [activeCat]
  );

  const featuredIds = useMemo(
    () => new Set(featuredSlides.map((s) => s.id)),
    [featuredSlides]
  );

  const mostReadArticles = useMemo(() => {
    const leadIdSet = new Set<string>(featuredSlides[0] ? [featuredSlides[0].id] : []);
    return selectMostReadArticles(publishedCatalog, leadIdSet, 5);
  }, [publishedCatalog, featuredSlides]);

  const filteredArticles = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return sortedNewest.filter((art) => {
      if (!hasActiveFilter && featuredIds.has(art.id)) return false;
      if (onlySaved && !bookmarkedSlugs.includes(art.slug)) return false;
      if (activeCat !== 'all' && !activeCategoryObj.pillars.includes(art.pillar)) {
        return false;
      }
      if (!q) return true;
      const haystack = [
        art.title,
        art.metaDescription,
        art.focusKeyword,
        art.industry,
        art.pillarLabel,
        getArticleCategory(art.pillar).label,
        ...art.secondaryKeywords,
      ]
        .join(' ')
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [
    sortedNewest,
    hasActiveFilter,
    featuredIds,
    onlySaved,
    bookmarkedSlugs,
    activeCat,
    activeCategoryObj,
    searchQuery,
  ]);

  const displayedArticles = useMemo(
    () => filteredArticles.slice(0, visibleCount),
    [filteredArticles, visibleCount]
  );

  const spotlightRailArticles = useMemo(() => {
    const used = new Set<string>([
      ...featuredSlides.map((s) => s.id),
      ...displayedArticles.slice(0, 8).map((a) => a.id),
    ]);
    const pool = sortCatalogArticles(publishedCatalog, 'deepest').filter(
      (a) => !used.has(a.id)
    );
    const picked: typeof pool = [];
    const catSeen = new Set<string>();
    for (const art of pool) {
      if (picked.length >= 8) break;
      const cId = getArticleCategory(art.pillar).id;
      if (!catSeen.has(cId)) {
        catSeen.add(cId);
        picked.push(art);
      }
    }
    for (const art of pool) {
      if (picked.length >= 8) break;
      if (!picked.some((p) => p.id === art.id)) picked.push(art);
    }
    return picked;
  }, [publishedCatalog, featuredSlides, displayedArticles]);

  const currentSlide = featuredSlides[slideIdx] || featuredSlides[0];
  const currentSlideCat = currentSlide ? getArticleCategory(currentSlide.pillar) : null;

  const scrollRail = (dir: -1 | 1) => {
    if (!railRef.current) return;
    railRef.current.scrollBy({ left: dir * 360, behavior: 'smooth' });
  };

  const resetFilters = () => {
    setSearchQuery('');
    setActiveCat('all');
    setOnlySaved(false);
    setVisibleCount(ARTICLES_PAGE_SIZE);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFD] text-slate-900 relative overflow-x-clip font-sans selection:bg-blue-600/20">
      <LuxuryGoldBackdrop />

      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[120] focus:px-4 focus:py-2 focus:rounded-xl focus:bg-[#1E40FF] focus:text-white focus:font-bold focus:shadow-lg"
      >
        Chuyển tới nội dung chính
      </a>

      <Navbar
        activePage="boost"
        onOpenContact={() => setContactOpen(true)}
        contactLabel="Tư Vấn Triển Khai"
      />

      <main id="main-content" className="relative z-10 pt-24 sm:pt-28 pb-20 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto space-y-10">
          {/* ================================================================ */}
          {/* 1. CLEAN EDITORIAL HEADER & CATEGORY TABS                        */}
          {/* ================================================================ */}
          <section className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-5 pb-6 border-b border-slate-200/80">
              <div className="space-y-2 max-w-2xl">
                <h1 className="text-3xl sm:text-4xl lg:text-[42px] font-black text-slate-900 tracking-tight leading-[1.15]">
                  Blog <span className="text-gradient-inkica">DOMATION</span>
                </h1>
                <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
                  Chia sẻ góc nhìn, kinh nghiệm triển khai hệ thống, AI và công nghệ vận hành doanh nghiệp từ thực tế.
                </p>
              </div>

              <div className="flex items-center gap-2.5 w-full md:w-auto">
                <div className="relative flex-1 md:w-72">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    aria-label="Tìm kiếm bài viết"
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setVisibleCount(ARTICLES_PAGE_SIZE);
                    }}
                    placeholder="Tìm kiếm bài viết..."
                    className="w-full pl-10 pr-8 py-2.5 rounded-xl bg-white/95 border border-slate-200/90 text-xs sm:text-sm text-slate-900 shadow-xs focus:outline-none focus:border-[#1E40FF]"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => {
                        setSearchQuery('');
                        setVisibleCount(ARTICLES_PAGE_SIZE);
                      }}
                      aria-label="Xóa tìm kiếm"
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-700 cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setOnlySaved((prev) => !prev);
                    setVisibleCount(ARTICLES_PAGE_SIZE);
                  }}
                  aria-pressed={onlySaved}
                  className={`px-3.5 py-2.5 rounded-xl border text-xs sm:text-sm font-semibold inline-flex items-center gap-1.5 transition-colors shrink-0 cursor-pointer ${
                    onlySaved
                      ? 'bg-[#1E40FF] border-[#1E40FF] text-white'
                      : 'bg-white/95 border-slate-200/90 text-slate-700 hover:border-blue-300 hover:text-[#1E40FF]'
                  }`}
                >
                  <Bookmark className={`w-3.5 h-3.5 ${onlySaved ? 'fill-white' : ''}`} />
                  <span>Đã lưu</span>
                </button>
              </div>
            </div>

            {/* Clean Category Tabs (Zero Counts) */}
            <nav
              aria-label="Chuyên mục bài viết"
              className="flex items-center gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            >
              {BLOG_CATEGORIES.map((cat) => {
                const active = activeCat === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    aria-current={active ? 'true' : undefined}
                    onClick={() => {
                      setActiveCat(cat.id);
                      setVisibleCount(ARTICLES_PAGE_SIZE);
                    }}
                    className={`px-4 py-2 rounded-full text-xs sm:text-[13px] font-bold whitespace-nowrap shrink-0 transition-all cursor-pointer border ${
                      active
                        ? 'bg-[#1E40FF] border-[#1E40FF] text-white shadow-[0_8px_20px_-6px_rgba(30,64,255,0.42)]'
                        : 'bg-white/90 border-slate-200/85 text-slate-600 hover:text-slate-900 hover:border-blue-300'
                    }`}
                  >
                    {cat.label}
                  </button>
                );
              })}
            </nav>
          </section>

          {/* ================================================================ */}
          {/* 2. FEATURED STORIES INTERACTIVE CAROUSEL (BÀI VIẾT NỔI BẬT)      */}
          {/* ================================================================ */}
          {!hasActiveFilter && currentSlide && currentSlideCat && (
            <section
              aria-label="Bài viết nổi bật"
              aria-roledescription="carousel"
              onMouseEnter={() => setCarouselPaused(true)}
              onMouseLeave={() => setCarouselPaused(false)}
              className="space-y-4"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="inline-flex items-center gap-2 text-xs sm:text-sm font-extrabold uppercase tracking-wider text-slate-800">
                  <Sparkles className="w-4 h-4 text-[#1E40FF]" />
                  <span>Bài viết nổi bật</span>
                </div>

                {featuredSlides.length > 1 && (
                  <div className="flex items-center gap-2.5">
                    <div className="hidden sm:flex items-center gap-1.5 mr-1">
                      {featuredSlides.map((sl, idx) => (
                        <button
                          key={sl.id}
                          type="button"
                          onClick={() => setSlideIdx(idx)}
                          aria-label={`Chuyển đến bài nổi bật ${idx + 1}`}
                          className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                            idx === slideIdx
                              ? 'w-7 bg-[#1E40FF]'
                              : 'w-2 bg-slate-300 hover:bg-slate-400'
                          }`}
                        />
                      ))}
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        setSlideIdx(
                          (prev) => (prev - 1 + featuredSlides.length) % featuredSlides.length
                        )
                      }
                      aria-label="Bài nổi bật trước"
                      className="w-9 h-9 rounded-full bg-white border border-slate-200/90 text-slate-700 hover:border-blue-300 hover:text-[#1E40FF] flex items-center justify-center shadow-xs transition-colors cursor-pointer"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setSlideIdx((prev) => (prev + 1) % featuredSlides.length)}
                      aria-label="Bài nổi bật tiếp theo"
                      className="w-9 h-9 rounded-full bg-white border border-slate-200/90 text-slate-700 hover:border-blue-300 hover:text-[#1E40FF] flex items-center justify-center shadow-xs transition-colors cursor-pointer"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>

              <article
                key={currentSlide.id}
                className="rounded-[28px] bg-white/95 border border-slate-200/85 shadow-[0_22px_56px_-24px_rgba(30,64,255,0.14)] overflow-hidden grid grid-cols-1 lg:grid-cols-12 group animate-[smoothImgIn_0.35s_ease]"
              >
                <div className="lg:col-span-7 relative">
                  <a
                    href={`/boost/${currentSlide.slug}`}
                    onClick={(e) => handleSpaLinkClick(e, `/boost/${currentSlide.slug}`)}
                    className="block relative aspect-[16/9] lg:h-full bg-slate-100 overflow-hidden"
                  >
                    <img
                      src={currentSlide.coverImage}
                      alt={currentSlide.coverAlt}
                      width={1376}
                      height={768}
                      fetchPriority="high"
                      className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-700"
                    />
                  </a>

                  <button
                    type="button"
                    onClick={() => handleToggleBookmark(currentSlide.slug)}
                    aria-label={
                      bookmarkedSlugs.includes(currentSlide.slug)
                        ? 'Bỏ lưu bài viết'
                        : 'Lưu bài viết'
                    }
                    aria-pressed={bookmarkedSlugs.includes(currentSlide.slug)}
                    className={`absolute top-4 right-4 p-2 rounded-full border shadow-xs backdrop-blur-md transition-colors cursor-pointer ${
                      bookmarkedSlugs.includes(currentSlide.slug)
                        ? 'bg-[#1E40FF] border-[#1E40FF] text-white'
                        : 'bg-white/92 border-slate-200 text-slate-600 hover:text-[#1E40FF]'
                    }`}
                  >
                    <Bookmark
                      className={`w-4 h-4 ${
                        bookmarkedSlugs.includes(currentSlide.slug) ? 'fill-white' : ''
                      }`}
                    />
                  </button>
                </div>

                <div className="lg:col-span-5 p-6 sm:p-8 flex flex-col justify-between gap-6">
                  <div className="space-y-3.5">
                    <div className="flex items-center justify-between gap-2 text-xs">
                      <span
                        className={`px-3 py-1 rounded-full border font-bold ${currentSlideCat.badgeClass}`}
                      >
                        {currentSlideCat.label}
                      </span>
                      <span className="text-slate-500 font-medium">
                        {currentSlide.readingMinutes} phút đọc
                      </span>
                    </div>

                    <h2 className="text-xl sm:text-2xl lg:text-[26px] font-black text-slate-900 leading-snug group-hover:text-[#1E40FF] transition-colors line-clamp-3">
                      <a
                        href={`/boost/${currentSlide.slug}`}
                        onClick={(e) => handleSpaLinkClick(e, `/boost/${currentSlide.slug}`)}
                      >
                        {currentSlide.title}
                      </a>
                    </h2>

                    <p className="text-xs sm:text-sm text-slate-600 leading-relaxed line-clamp-3">
                      {currentSlide.metaDescription}
                    </p>
                  </div>

                  <div className="pt-4 border-t border-slate-200/75 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 text-xs text-slate-500 min-w-0">
                      <img
                        src="/assets/brands/founder_turnio.webp"
                        alt="Huỳnh Trọng Phúc"
                        width={26}
                        height={26}
                        className="w-6.5 h-6.5 rounded-full object-cover object-top border border-blue-200 shrink-0"
                      />
                      <div className="min-w-0">
                        <div className="font-bold text-slate-800 truncate">Huỳnh Trọng Phúc</div>
                        <div className="text-[11px] text-slate-500">
                          {getArticleScheduledDate(currentSlide)}
                        </div>
                      </div>
                    </div>

                    <a
                      href={`/boost/${currentSlide.slug}`}
                      onClick={(e) => handleSpaLinkClick(e, `/boost/${currentSlide.slug}`)}
                      className="btn-inkica-primary px-4 py-2.5 text-xs shrink-0"
                    >
                      <span>Đọc bài viết</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>
              </article>

              {/* Mobile slide dots */}
              {featuredSlides.length > 1 && (
                <div className="flex sm:hidden items-center justify-center gap-1.5 pt-1">
                  {featuredSlides.map((sl, idx) => (
                    <button
                      key={sl.id}
                      type="button"
                      onClick={() => setSlideIdx(idx)}
                      aria-label={`Slide ${idx + 1}`}
                      className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                        idx === slideIdx ? 'w-7 bg-[#1E40FF]' : 'w-2 bg-slate-300'
                      }`}
                    />
                  ))}
                </div>
              )}
            </section>
          )}

          {/* ================================================================ */}
          {/* 3. 2-COLUMN EDITORIAL CORE: LATEST FEED + MOST READ SIDEBAR      */}
          {/* ================================================================ */}
          <section id="articles" className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start scroll-mt-24">
            {/* Left Main Feed: Bài viết gần nhất */}
            <div className="lg:col-span-8 space-y-5">
              <div className="flex items-center justify-between gap-3 pb-3 border-b border-slate-200/80">
                <div className="flex items-center gap-3 min-w-0">
                  <h2 className="text-xl sm:text-2xl font-black text-slate-900 truncate">
                    {onlySaved
                      ? 'Bài viết đã lưu'
                      : searchQuery.trim()
                        ? `Kết quả cho "${searchQuery.trim()}"`
                        : activeCat !== 'all'
                          ? activeCategoryObj.label
                          : 'Bài viết gần nhất'}
                  </h2>
                  {hasActiveFilter && (
                    <button
                      type="button"
                      onClick={resetFilters}
                      className="text-xs font-semibold text-[#1E40FF] hover:underline shrink-0 cursor-pointer"
                    >
                      Xóa lọc
                    </button>
                  )}
                </div>

                <div className="hidden sm:inline-flex items-center p-1 rounded-xl bg-white border border-slate-200/90 shadow-xs shrink-0">
                  <button
                    type="button"
                    onClick={() => setViewMode('grid')}
                    aria-label="Hiển thị dạng lưới"
                    className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                      viewMode === 'grid'
                        ? 'bg-blue-50 text-[#1E40FF]'
                        : 'text-slate-400 hover:text-slate-700'
                    }`}
                  >
                    <LayoutGrid className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode('list')}
                    aria-label="Hiển thị dạng danh sách"
                    className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                      viewMode === 'list'
                        ? 'bg-blue-50 text-[#1E40FF]'
                        : 'text-slate-400 hover:text-slate-700'
                    }`}
                  >
                    <List className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {filteredArticles.length === 0 ? (
                <div className="rounded-3xl bg-white/95 border border-slate-200/85 p-10 text-center space-y-3 shadow-xs">
                  <p className="text-sm sm:text-base font-bold text-slate-800">
                    {onlySaved
                      ? 'Bạn chưa lưu bài viết nào.'
                      : 'Không tìm thấy bài viết phù hợp.'}
                  </p>
                  <p className="text-xs sm:text-sm text-slate-500">
                    {onlySaved
                      ? 'Nhấn biểu tượng dấu trang trên bài viết để lưu lại đọc sau.'
                      : 'Thử từ khóa khác hoặc quay lại danh sách bài viết mới nhất.'}
                  </p>
                  <button
                    type="button"
                    onClick={resetFilters}
                    className="btn-inkica-primary px-5 py-2.5 text-xs cursor-pointer"
                  >
                    Xem tất cả bài viết
                  </button>
                </div>
              ) : (
                <>
                  <div
                    className={
                      viewMode === 'list'
                        ? 'space-y-4'
                        : 'grid grid-cols-1 sm:grid-cols-2 gap-6'
                    }
                  >
                    {displayedArticles.map((art) => (
                      <BlogArticleCard
                        key={art.id}
                        article={art}
                        variant={viewMode === 'list' ? 'list' : 'standard'}
                        isBookmarked={bookmarkedSlugs.includes(art.slug)}
                        onToggleBookmark={handleToggleBookmark}
                      />
                    ))}
                  </div>

                  {visibleCount < filteredArticles.length && (
                    <div className="flex justify-center pt-4">
                      <button
                        type="button"
                        onClick={() => setVisibleCount((prev) => prev + ARTICLES_PAGE_SIZE)}
                        className="ql-btn-outline px-6 py-2.5 text-xs sm:text-sm bg-white cursor-pointer"
                      >
                        <span>Xem thêm bài viết</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Right Sticky Sidebar: Đọc nhiều + Chủ đề + Tác giả */}
            <aside className="lg:col-span-4 space-y-6 lg:sticky lg:top-24">
              {/* Đọc nhiều (Most Read) */}
              <div className="rounded-[24px] bg-white/95 backdrop-blur-xl border border-slate-200/85 p-5 sm:p-6 shadow-[0_12px_36px_-22px_rgba(15,23,42,0.12)] space-y-4">
                <div className="flex items-center gap-2 pb-3 border-b border-slate-200/75">
                  <Flame className="w-4 h-4 text-[#1E40FF]" />
                  <h2 className="text-sm font-extrabold uppercase tracking-wider text-slate-900">
                    Đọc nhiều
                  </h2>
                </div>

                <div className="divide-y divide-slate-200/70">
                  {mostReadArticles.map((art) => (
                    <BlogArticleCard key={art.id} article={art} variant="compact" />
                  ))}
                </div>
              </div>

              {/* Chủ đề nổi bật */}
              <div className="rounded-[24px] bg-white/95 backdrop-blur-xl border border-slate-200/85 p-5 sm:p-6 shadow-xs space-y-3.5">
                <h2 className="text-sm font-extrabold uppercase tracking-wider text-slate-900">
                  Chủ đề quan tâm
                </h2>
                <div className="flex flex-wrap gap-2">
                  {POPULAR_TOPICS.map((topic) => (
                    <button
                      key={topic}
                      type="button"
                      onClick={() => {
                        setSearchQuery(topic);
                        setActiveCat('all');
                        setOnlySaved(false);
                        setVisibleCount(ARTICLES_PAGE_SIZE);
                        document
                          .getElementById('articles')
                          ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                      }}
                      className="px-3 py-1.5 rounded-full bg-slate-50 hover:bg-blue-50 border border-slate-200/90 hover:border-blue-300 text-xs font-semibold text-slate-700 hover:text-[#1E40FF] transition-colors cursor-pointer"
                    >
                      {topic}
                    </button>
                  ))}
                </div>
              </div>

              {/* Minimal Editorial Note & Contact */}
              <div className="rounded-[24px] bg-gradient-to-br from-[#EEF4FF] via-white to-[#ECFEFF] border border-blue-200/80 p-5 sm:p-6 space-y-3.5 shadow-xs">
                <div className="flex items-center gap-3">
                  <img
                    src="/assets/brands/founder_turnio.webp"
                    alt="Huỳnh Trọng Phúc (TurnioDEV)"
                    width={44}
                    height={44}
                    loading="lazy"
                    className="w-11 h-11 rounded-full object-cover object-top border border-blue-200 shrink-0"
                  />
                  <div>
                    <div className="text-sm font-extrabold text-slate-900">
                      Huỳnh Trọng Phúc
                    </div>
                    <div className="text-xs font-medium text-[#1E40FF]">
                      Founder &amp; CEO DOMATION
                    </div>
                  </div>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Trao đổi trực tiếp về bài toán công nghệ, quy trình vận hành hoặc thiết kế giải pháp phù hợp cho đội ngũ của bạn.
                </p>
                <button
                  type="button"
                  onClick={() => setContactOpen(true)}
                  className="btn-inkica-primary w-full py-2.5 px-4 text-xs cursor-pointer"
                >
                  <span>Liên hệ trao đổi</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </aside>
          </section>

          {/* ================================================================ */}
          {/* 4. HORIZONTAL SPOTLIGHT SLIDE RAIL (ĐÁNG ĐỌC)                    */}
          {/* ================================================================ */}
          {!hasActiveFilter && spotlightRailArticles.length > 0 && (
            <section className="pt-8 border-t border-slate-200/80 space-y-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-xl sm:text-2xl font-black text-slate-900">
                    Đáng đọc tuần này
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                    Những bài phân tích chuyên sâu được bạn đọc lựa chọn nhiều nhất
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => scrollRail(-1)}
                    aria-label="Cuộn trái"
                    className="w-9 h-9 rounded-full bg-white border border-slate-200/90 text-slate-700 hover:border-blue-300 hover:text-[#1E40FF] flex items-center justify-center shadow-xs transition-colors cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => scrollRail(1)}
                    aria-label="Cuộn phải"
                    className="w-9 h-9 rounded-full bg-white border border-slate-200/90 text-slate-700 hover:border-blue-300 hover:text-[#1E40FF] flex items-center justify-center shadow-xs transition-colors cursor-pointer"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div
                ref={railRef}
                className="flex gap-5 overflow-x-auto snap-x snap-mandatory pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
              >
                {spotlightRailArticles.map((art) => (
                  <div
                    key={art.id}
                    className="w-[290px] sm:w-[330px] shrink-0 snap-start"
                  >
                    <BlogArticleCard
                      article={art}
                      variant="standard"
                      isBookmarked={bookmarkedSlugs.includes(art.slug)}
                      onToggleBookmark={handleToggleBookmark}
                    />
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      </main>

      <DomationFooter onOpenContact={() => setContactOpen(true)} />

      <BackToTopPill />

      <ContactModal
        isOpen={contactOpen}
        onClose={() => setContactOpen(false)}
      />
    </div>
  );
};
