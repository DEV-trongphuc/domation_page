import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Bookmark,
  BookOpen,
  Briefcase,
  Calendar,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock,
  Code2,
  Copy,
  Layers,
  ListChecks,
  Quote,
  Sparkles,
  Tag,
  TrendingUp,
  Type,
  Wrench,
  X,
  ZoomIn,
} from 'lucide-react';
import { Navbar } from './Navbar';
import { ContactModal } from './ContactModal';
import { LuxuryGoldBackdrop } from './LuxuryGoldBackdrop';
import { DomationFooter } from './components/DomationFooter';
import { BackToTopPill } from './components/BackToTopPill';
import { FounderAuthorityBlock } from './components/FounderAuthorityBlock';
import { ArticleBlockRenderer } from './components/boost/ArticleBlockRenderer';
import { BlogArticleCard } from './components/boost/BlogArticleCard';
import {
  BLOG_BOOKMARKS_EVENT,
  EDITORIAL_FORMAT_META,
  getArticleCategory,
  readBookmarkedSlugs,
  readReaderFontScale,
  saveReaderFontScale,
  sortCatalogArticles,
  toggleBookmarkedSlug,
  type ReaderFontScale,
} from './components/boost/blogMeta';
import { BOOST_CATALOG, getCatalogSummaryBySlug } from './data/boostCatalog';
import { getCachedArticleBySlug, loadArticleBySlug } from './data/boostArticleLoader';
import { getSinglePostSeoConfig } from './data/boostRouteSeo';
import {
  filterPublishedArticles,
  getArticleScheduledDate,
  getPublishedRelatedSummaries,
  isArticlePublished,
} from './data/publishSchedule';
import { PORTFOLIO_PROJECTS } from './data/portfolioData';
import type { ArticleContentBlock, BoostArticle } from './data/boostTypes';
import { handleSpaLinkClick, navigateTo } from './utils/navigation';
import { FOUNDER_PRIMARY_URL, type PageSeoConfig, usePageSeo } from './utils/seo';

interface SinglePostPageProps {
  slug: string;
}

const LEGACY_TEXT_SCALE: Record<ReaderFontScale, { body: string; sub: string }> = {
  sm: {
    body: 'text-sm sm:text-[14.5px] leading-[1.78]',
    sub: 'text-xs sm:text-[13.5px] leading-relaxed',
  },
  md: {
    body: 'text-[14.5px] sm:text-[16px] leading-[1.85]',
    sub: 'text-sm sm:text-[15px] leading-relaxed',
  },
  lg: {
    body: 'text-[15.5px] sm:text-[17.5px] leading-[1.88]',
    sub: 'text-[14.5px] sm:text-[16px] leading-relaxed',
  },
};

function getBlockTocItem(
  block: ArticleContentBlock,
  index: number
): { id: string; label: string } | null {
  const id = block.id || `block-${index}`;
  switch (block.type) {
    case 'prose':
    case 'chart-dashboard':
    case 'comparison-matrix':
    case 'code-recipe':
    case 'timeline-flow':
    case 'checklist-audit':
    case 'stat-grid':
    case 'myth-vs-reality':
    case 'decision-tree':
      return { id, label: block.heading };
    case 'repo-card':
      return { id, label: block.heading || `Đánh giá ${block.repo.fullName}` };
    case 'visual-figure':
      return { id, label: block.badge || block.caption };
    case 'callout-verdict':
      return block.id ? { id: block.id, label: block.title } : null;
    default:
      return null;
  }
}

export const SinglePostPage: React.FC<SinglePostPageProps> = ({ slug }) => {
  const matchedSummary = getCatalogSummaryBySlug(slug);
  const isPublished = matchedSummary ? isArticlePublished(matchedSummary) : false;

  const [loadedArticle, setLoadedArticle] = useState<BoostArticle | null>(() =>
    matchedSummary && isPublished ? getCachedArticleBySlug(matchedSummary.slug) || null : null
  );
  const [loadingBody, setLoadingBody] = useState<boolean>(() =>
    Boolean(matchedSummary && isPublished && !getCachedArticleBySlug(matchedSummary.slug))
  );

  useEffect(() => {
    let active = true;
    if (!matchedSummary || !isPublished) {
      setLoadedArticle(null);
      setLoadingBody(false);
      return;
    }
    const cached = getCachedArticleBySlug(matchedSummary.slug);
    if (cached) {
      setLoadedArticle(cached);
      setLoadingBody(false);
      return;
    }
    setLoadingBody(true);
    loadArticleBySlug(matchedSummary.slug)
      .then((art) => {
        if (!active) return;
        setLoadedArticle(art || null);
        setLoadingBody(false);
      })
      .catch(() => {
        if (!active) return;
        setLoadingBody(false);
      });
    return () => {
      active = false;
    };
  }, [slug, matchedSummary?.slug, isPublished]);

  const publishedCatalog = useMemo(() => filterPublishedArticles(BOOST_CATALOG), []);
  const sortedPublished = useMemo(
    () => sortCatalogArticles(publishedCatalog, 'newest'),
    [publishedCatalog]
  );

  const currentPublishedIdx =
    matchedSummary && isPublished
      ? sortedPublished.findIndex((a) => a.slug === matchedSummary.slug)
      : -1;
  const prevArticle =
    currentPublishedIdx > 0 ? sortedPublished[currentPublishedIdx - 1] : null;
  const nextArticle =
    currentPublishedIdx >= 0 && currentPublishedIdx < sortedPublished.length - 1
      ? sortedPublished[currentPublishedIdx + 1]
      : null;

  const relatedArticles = useMemo(() => {
    if (!matchedSummary || !isPublished) return sortedPublished.slice(0, 3);
    return getPublishedRelatedSummaries(matchedSummary, publishedCatalog, 3);
  }, [matchedSummary, isPublished, publishedCatalog, sortedPublished]);

  const relatedPortfolio =
    matchedSummary && isPublished && matchedSummary.relatedPortfolioId
      ? PORTFOLIO_PROJECTS.find((p) => p.id === matchedSummary.relatedPortfolioId)
      : undefined;

  const sameCategoryQuickReads = useMemo(() => {
    if (!matchedSummary || !isPublished) return [];
    const currentCat = getArticleCategory(matchedSummary.pillar);
    return sortedPublished
      .filter(
        (a) =>
          a.slug !== matchedSummary.slug &&
          getArticleCategory(a.pillar).id === currentCat.id
      )
      .slice(0, 3);
  }, [matchedSummary?.pillar, matchedSummary?.slug, isPublished, sortedPublished]);

  const [readProgress, setReadProgress] = useState(0);
  const [activeSectionId, setActiveSectionId] = useState<string>('geo-tldr');
  const [mobileTocOpen, setMobileTocOpen] = useState(false);
  const [readerFontSize, setReaderFontSize] = useState<ReaderFontScale>('md');
  const [bookmarkedSlugs, setBookmarkedSlugs] = useState<string[]>([]);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [copiedCite, setCopiedCite] = useState(false);
  const [collapsedFaqSet, setCollapsedFaqSet] = useState<Record<number, boolean>>({});
  const [zoomImage, setZoomImage] = useState<{ src: string; caption: string } | null>(null);
  const [contactOpen, setContactOpen] = useState(false);

  useEffect(() => {
    setReaderFontSize(readReaderFontScale());
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
    if (!zoomImage) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setZoomImage(null);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [zoomImage]);

  const handleFontChange = (scale: ReaderFontScale) => {
    setReaderFontSize(scale);
    saveReaderFontScale(scale);
  };

  const handleToggleBookmark = (targetSlug: string) => {
    setBookmarkedSlugs(toggleBookmarkedSlug(targetSlug));
  };

  const scheduledDate = matchedSummary ? getArticleScheduledDate(matchedSummary) : '';

  const seoConfig: PageSeoConfig =
    matchedSummary && isPublished
      ? getSinglePostSeoConfig(loadedArticle || matchedSummary)
      : matchedSummary && !isPublished
        ? {
            title: 'Bài Viết Sắp Ra Mắt | Blog DOMATION',
            description:
              'Bài viết này đang nằm trong lịch xuất bản sắp tới của Blog DOMATION. Khám phá các bài viết mới nhất đã phát hành trên Blog DOMATION.',
            path: `/boost/${matchedSummary.slug}`,
            ogImage: '/imgs/boost/boost-hero-growth-hub.jpg',
            ogImageAlt: 'Blog DOMATION',
            noindex: true,
          }
        : {
            title: 'Không Tìm Thấy Bài Viết | Blog DOMATION',
            description:
              'Bài viết bạn tìm không tồn tại hoặc đã được chuyển chuyên mục. Khám phá Blog DOMATION — góc nhìn thực tế về AI, công nghệ và vận hành doanh nghiệp.',
            path: `/boost/${encodeURIComponent(slug)}`,
            ogImage: '/imgs/boost/boost-hero-growth-hub.jpg',
            ogImageAlt: 'Blog DOMATION',
            noindex: true,
          };

  usePageSeo(seoConfig);

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      const h = document.documentElement.scrollHeight - window.innerHeight;
      setReadProgress(h > 0 ? Math.min(100, Math.max(0, (y / h) * 100)) : 0);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, [slug]);

  const article = loadedArticle;
  const hasCustomBlocks = Boolean(article?.blocks && article.blocks.length > 0);
  const editorialFormat = matchedSummary?.editorialFormat;
  const formatMeta =
    EDITORIAL_FORMAT_META[editorialFormat || 'legacy'] || EDITORIAL_FORMAT_META.legacy;
  const cleanCategory = matchedSummary
    ? getArticleCategory(matchedSummary.pillar)
    : undefined;

  const tocItems: { id: string; label: string }[] = useMemo(() => {
    if (!article) return [{ id: 'geo-tldr', label: 'Đang tải mục lục...' }];
    if (hasCustomBlocks) {
      return [
        { id: 'geo-tldr', label: formatMeta.tldrLabel },
        ...article.blocks!
          .map((b, i) => getBlockTocItem(b, i))
          .filter((x): x is { id: string; label: string } => Boolean(x)),
        ...(article.metricsOutcome && article.metricsOutcome.length > 0
          ? [{ id: 'outcomes', label: 'Kết quả & Đối chiếu thực tế' }]
          : []),
        ...(article.faqs && article.faqs.length > 0
          ? [{ id: 'faq', label: 'Câu hỏi thường gặp' }]
          : []),
      ];
    }
    return [
      { id: 'geo-tldr', label: 'Tóm tắt nội dung' },
      { id: 'pain-points', label: '1. Thực trạng & Thách thức' },
      { id: 'challenges', label: '2. Trở ngại triển khai & Cách xử lý' },
      { id: 'architecture', label: '3. Kiến trúc & Quy trình' },
      ...article.sections.map((s, idx) => ({
        id: s.id,
        label: `${idx + 4}. ${s.heading}`,
      })),
      { id: 'outcomes', label: 'Kết quả thực tế' },
      { id: 'faq', label: 'Câu hỏi thường gặp' },
    ];
  }, [article, hasCustomBlocks, formatMeta.tldrLabel]);

  // Live Scrollspy tracking visible section for sticky TOC
  useEffect(() => {
    if (typeof window === 'undefined' || !('IntersectionObserver' in window) || !article) return;
    const ids = tocItems.map((t) => t.id);
    const elements = ids
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => Boolean(el));
    if (elements.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible.length > 0 && visible[0].target.id) {
          setActiveSectionId(visible[0].target.id);
        }
      },
      { rootMargin: '-18% 0px -64% 0px', threshold: 0.01 }
    );

    for (const el of elements) observer.observe(el);
    return () => observer.disconnect();
  }, [article, tocItems]);

  // Gate 1: Scheduled for future drip release (noindex + clean "Coming soon" screen)
  if (matchedSummary && !isPublished) {
    const suggested = sortedPublished.slice(0, 3);
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
        <main id="main-content" className="relative z-10 pt-28 pb-20 px-4 sm:px-6">
          <div className="max-w-5xl mx-auto space-y-10">
            <section className="rounded-[28px] bg-white/95 backdrop-blur-2xl border border-slate-200/85 p-8 sm:p-12 text-center shadow-[0_24px_64px_-24px_rgba(15,23,42,0.08)] space-y-5">
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-blue-50 border border-blue-200 text-[#1E40FF] text-xs font-bold">
                <Calendar className="w-3.5 h-3.5" />
                <span>Sắp ra mắt • Dự kiến ngày {scheduledDate}</span>
              </div>
              <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-900 leading-tight">
                Bài Viết Đang Trong Lịch Xuất Bản Sắp Tới
              </h1>
              <p className="text-sm sm:text-base text-slate-600 max-w-xl mx-auto leading-relaxed">
                Nội dung này sẽ được phát hành tự động vào ngày <strong>{scheduledDate}</strong>. Trong lúc chờ đợi, mời bạn xem những bài viết mới nhất đã lên sóng trên Blog DOMATION.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                <a
                  href="/boost"
                  onClick={(e) => handleSpaLinkClick(e, '/boost')}
                  className="btn-inkica-primary px-6 py-3 text-xs sm:text-sm"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Quay lại Blog DOMATION</span>
                </a>
              </div>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl font-extrabold text-slate-900">Bài viết mới phát hành</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {suggested.map((rel) => (
                  <BlogArticleCard
                    key={rel.id}
                    article={rel}
                    variant="standard"
                    isBookmarked={bookmarkedSlugs.includes(rel.slug)}
                    onToggleBookmark={handleToggleBookmark}
                  />
                ))}
              </div>
            </section>
          </div>
        </main>
        <DomationFooter onOpenContact={() => setContactOpen(true)} />
        <BackToTopPill />
        <ContactModal isOpen={contactOpen} onClose={() => setContactOpen(false)} />
      </div>
    );
  }

  // Gate 2: Not found (404)
  if (!matchedSummary) {
    const tokens = slug.toLowerCase().split(/[-_\s]+/).filter((t) => t.length >= 2);
    const suggested = sortedPublished.filter((a) =>
      tokens.some(
        (tk) =>
          a.slug.includes(tk) ||
          a.title.toLowerCase().includes(tk) ||
          a.focusKeyword.toLowerCase().includes(tk)
      )
    );
    const displaySuggestions = (suggested.length > 0 ? suggested : sortedPublished).slice(0, 3);

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
        <main id="main-content" className="relative z-10 pt-28 pb-20 px-4 sm:px-6">
          <div className="max-w-5xl mx-auto space-y-10">
            <section className="rounded-[28px] bg-white/95 backdrop-blur-2xl border border-slate-200/85 p-8 sm:p-12 text-center shadow-[0_24px_64px_-24px_rgba(15,23,42,0.08)] space-y-5">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-xs font-bold uppercase tracking-wider">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>404 • Không Tìm Thấy Bài Viết</span>
              </div>
              <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-900 leading-tight">
                Bài Viết Không Tồn Tại Hoặc Đã Được Chuyển Mục
              </h1>
              <p className="text-sm sm:text-base text-slate-600 max-w-xl mx-auto leading-relaxed">
                Nội dung bạn đang truy cập hiện không còn ở đường dẫn này. Mời bạn quay về Blog DOMATION để đọc các bài chia sẻ mới nhất.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                <a
                  href="/boost"
                  onClick={(e) => handleSpaLinkClick(e, '/boost')}
                  className="btn-inkica-primary px-6 py-3 text-xs sm:text-sm"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Quay lại Blog DOMATION</span>
                </a>
                <a
                  href="/"
                  onClick={(e) => handleSpaLinkClick(e, '/')}
                  className="ql-btn-outline px-5 py-3 text-xs sm:text-sm"
                >
                  <span>Về Trang Chủ</span>
                </a>
              </div>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl font-extrabold text-slate-900">Bài viết gợi ý</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {displaySuggestions.map((rel) => (
                  <BlogArticleCard
                    key={rel.id}
                    article={rel}
                    variant="standard"
                    isBookmarked={bookmarkedSlugs.includes(rel.slug)}
                    onToggleBookmark={handleToggleBookmark}
                  />
                ))}
              </div>
            </section>
          </div>
        </main>
        <DomationFooter onOpenContact={() => setContactOpen(true)} />
        <BackToTopPill />
        <ContactModal isOpen={contactOpen} onClose={() => setContactOpen(false)} />
      </div>
    );
  }

  const handleCopyUrl = async () => {
    try {
      const fullUrl = `${window.location.origin}/boost/${matchedSummary.slug}`;
      await navigator.clipboard.writeText(fullUrl);
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 2000);
    } catch {
      setCopiedUrl(false);
    }
  };

  const handleCopyCitation = async () => {
    try {
      const fullUrl = `${window.location.origin}/boost/${matchedSummary.slug}`;
      const citeText = `${matchedSummary.title} — Huỳnh Trọng Phúc, DOMATION (${scheduledDate}). ${fullUrl}`;
      await navigator.clipboard.writeText(citeText);
      setCopiedCite(true);
      setTimeout(() => setCopiedCite(false), 2000);
    } catch {
      setCopiedCite(false);
    }
  };

  const isBookmarked = bookmarkedSlugs.includes(matchedSummary.slug);
  const textScale = LEGACY_TEXT_SCALE[readerFontSize] || LEGACY_TEXT_SCALE.md;

  return (
    <div className="min-h-screen bg-[#F8FAFD] text-slate-900 relative overflow-x-clip font-sans selection:bg-blue-600/20">
      <LuxuryGoldBackdrop />

      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[120] focus:px-4 focus:py-2 focus:rounded-xl focus:bg-[#1E40FF] focus:text-white focus:font-bold focus:shadow-lg"
      >
        Chuyển tới nội dung chính
      </a>

      {/* Top Reading Progress Bar */}
      <div className="fixed top-0 left-0 right-0 h-[3px] z-[80] bg-transparent pointer-events-none">
        <div
          className="h-full bg-gradient-to-r from-[#1E40FF] via-[#0284C7] to-[#06B6D4] transition-[width] duration-75"
          style={{ width: `${readProgress}%` }}
        />
      </div>

      <Navbar
        activePage="boost"
        onOpenContact={() => setContactOpen(true)}
        contactLabel="Tư Vấn Triển Khai"
      />

      <main id="main-content" className="relative z-10 pt-24 sm:pt-28 pb-20 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          {/* Clean Editorial Breadcrumbs */}
          <nav
            aria-label="Breadcrumb"
            className="flex flex-wrap items-center gap-1.5 text-xs text-slate-600 mb-5"
          >
            <a
              href="/"
              onClick={(e) => handleSpaLinkClick(e, '/')}
              className="hover:text-[#1E40FF] font-medium transition-colors"
            >
              Trang Chủ
            </a>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            <a
              href="/boost"
              onClick={(e) => handleSpaLinkClick(e, '/boost')}
              className="hover:text-[#1E40FF] font-medium transition-colors"
            >
              Blog
            </a>
            {cleanCategory && (
              <>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                <a
                  href={`/boost?cat=${cleanCategory.id}`}
                  onClick={(e) => handleSpaLinkClick(e, `/boost?cat=${cleanCategory.id}`)}
                  className="text-[#1E40FF] font-semibold hover:underline"
                >
                  {cleanCategory.label}
                </a>
              </>
            )}
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-700 font-medium truncate max-w-[260px] sm:max-w-md">
              {matchedSummary.title}
            </span>
          </nav>

          {/* Luminous Swiss Daylight Article Header */}
          <header
            className={`rounded-[28px] backdrop-blur-2xl border shadow-[0_22px_58px_-24px_rgba(30,64,255,0.12)] overflow-hidden mb-8 ${formatMeta.heroBgClass}`}
          >
            <div className={`h-1.5 w-full bg-gradient-to-r ${formatMeta.accentBarClass}`} />
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 p-6 sm:p-9 items-center">
              <div className="lg:col-span-7 space-y-4">
                <div className="flex flex-wrap items-center gap-2.5 text-xs">
                  {cleanCategory && (
                    <a
                      href={`/boost?cat=${cleanCategory.id}`}
                      onClick={(e) => handleSpaLinkClick(e, `/boost?cat=${cleanCategory.id}`)}
                      className={`px-3 py-1 rounded-full border font-bold transition-opacity hover:opacity-85 ${cleanCategory.badgeClass}`}
                    >
                      {cleanCategory.label}
                    </a>
                  )}
                  <span className="text-slate-500 font-medium inline-flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    {matchedSummary.readingMinutes} phút đọc
                  </span>
                  <span className="text-slate-300">•</span>
                  <span className="text-slate-600 font-medium inline-flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    {scheduledDate}
                  </span>
                </div>

                <h1 className="text-2xl sm:text-3xl lg:text-[34px] font-black leading-[1.22] tracking-tight text-slate-900">
                  {matchedSummary.title}
                </h1>

                <p className="text-sm sm:text-base leading-relaxed text-slate-600">
                  {matchedSummary.metaDescription}
                </p>

                {/* Author & Subtle Reader Controls Bar */}
                <div className="pt-4 border-t border-slate-200/80 flex flex-wrap items-center justify-between gap-3">
                  <a
                    href={FOUNDER_PRIMARY_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2.5 text-xs font-bold text-slate-900 hover:text-[#1E40FF] transition-colors"
                  >
                    <img
                      src="/assets/brands/founder_turnio.webp"
                      alt="Huỳnh Trọng Phúc"
                      width={28}
                      height={28}
                      className="w-7 h-7 rounded-full object-cover object-top border border-blue-200"
                    />
                    <div>
                      <div>Huỳnh Trọng Phúc</div>
                      <div className="text-[11px] font-medium text-slate-500">
                        Founder &amp; CEO DOMATION
                      </div>
                    </div>
                  </a>

                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <div
                      className="inline-flex items-center gap-0.5 p-1 rounded-xl bg-slate-100/90 border border-slate-200/85"
                      role="group"
                      aria-label="Cỡ chữ đọc bài"
                    >
                      <span className="px-1.5 text-slate-500" aria-hidden="true">
                        <Type className="w-3.5 h-3.5" />
                      </span>
                      {(
                        [
                          { id: 'sm', label: 'A-' },
                          { id: 'md', label: 'A' },
                          { id: 'lg', label: 'A+' },
                        ] as const
                      ).map((opt) => (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => handleFontChange(opt.id)}
                          aria-pressed={readerFontSize === opt.id}
                          aria-label={`Cỡ chữ ${opt.label}`}
                          className={`px-2 py-1 rounded-lg text-[11px] font-bold transition-colors cursor-pointer ${
                            readerFontSize === opt.id
                              ? 'bg-white text-[#1E40FF] shadow-xs'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>

                    <button
                      type="button"
                      onClick={() => handleToggleBookmark(matchedSummary.slug)}
                      aria-pressed={isBookmarked}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border font-semibold transition-colors cursor-pointer ${
                        isBookmarked
                          ? 'bg-[#1E40FF] border-[#1E40FF] text-white'
                          : 'bg-white border-slate-200 text-slate-700 hover:border-blue-300 hover:text-[#1E40FF]'
                      }`}
                    >
                      <Bookmark className={`w-3.5 h-3.5 ${isBookmarked ? 'fill-white' : ''}`} />
                      <span>{isBookmarked ? 'Đã lưu' : 'Lưu bài'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleCopyUrl}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-700 hover:border-blue-300 hover:text-[#1E40FF] font-semibold transition-colors cursor-pointer"
                    >
                      {copiedUrl ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Đã copy</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Chia sẻ</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={handleCopyCitation}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-700 hover:border-blue-300 hover:text-[#1E40FF] font-semibold transition-colors cursor-pointer"
                    >
                      {copiedCite ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Đã copy</span>
                        </>
                      ) : (
                        <>
                          <Quote className="w-3.5 h-3.5" />
                          <span>Trích dẫn</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Cover Artwork (Accessible Button) */}
              <div className="lg:col-span-5">
                <button
                  type="button"
                  onClick={() =>
                    setZoomImage({
                      src: matchedSummary.coverImage,
                      caption: matchedSummary.coverAlt,
                    })
                  }
                  aria-label={`Phóng to ảnh bìa: ${matchedSummary.coverAlt}`}
                  className="block w-full text-left rounded-2xl overflow-hidden border border-slate-200/90 bg-[#F4F8FF] shadow-sm cursor-zoom-in group relative"
                >
                  <img
                    src={matchedSummary.coverImage}
                    alt={matchedSummary.coverAlt}
                    width={1376}
                    height={768}
                    fetchPriority="high"
                    className="w-full aspect-[16/9] object-cover group-hover:scale-[1.02] transition-transform duration-500"
                  />
                  <span className="absolute bottom-2.5 right-2.5 px-2.5 py-1 rounded-lg bg-white/90 backdrop-blur-md border border-slate-200 text-[10.5px] font-bold text-slate-700 inline-flex items-center gap-1 shadow-xs">
                    <ZoomIn className="w-3 h-3 text-[#1E40FF]" />
                    <span>Phóng to</span>
                  </span>
                </button>
              </div>
            </div>
          </header>

          {/* Collapsible Mobile / Tablet TOC */}
          <div className="lg:hidden mb-6 space-y-3">
            <a
              href="/boost"
              onClick={(e) => handleSpaLinkClick(e, '/boost')}
              className="ql-btn-outline py-2 px-3.5 text-xs bg-white inline-flex"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-[#1E40FF]" />
              <span>Quay lại Blog</span>
            </a>

            <div className="rounded-2xl bg-white/95 border border-slate-200/85 shadow-xs overflow-hidden">
              <button
                type="button"
                onClick={() => setMobileTocOpen((p) => !p)}
                aria-expanded={mobileTocOpen}
                className="w-full px-4 py-3 flex items-center justify-between gap-2 text-xs font-bold text-slate-800 cursor-pointer"
              >
                <span className="inline-flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-[#1E40FF]" />
                  <span>Mục lục bài viết</span>
                </span>
                <ChevronDown
                  className={`w-4 h-4 text-slate-500 transition-transform ${
                    mobileTocOpen ? 'rotate-180 text-[#1E40FF]' : ''
                  }`}
                />
              </button>
              {mobileTocOpen && (
                <ul className="px-4 pb-3 pt-1 border-t border-slate-200/75 space-y-1.5 text-xs">
                  {tocItems.map((item) => (
                    <li key={item.id}>
                      <a
                        href={`#${item.id}`}
                        aria-current={activeSectionId === item.id ? 'location' : undefined}
                        onClick={() => setMobileTocOpen(false)}
                        className={`block py-1.5 pl-2.5 border-l-2 leading-snug ${
                          activeSectionId === item.id
                            ? 'border-[#1E40FF] text-[#1E40FF] font-bold bg-blue-50/70 rounded-r-lg'
                            : 'border-transparent text-slate-600 hover:text-[#1E40FF]'
                        }`}
                      >
                        {item.label}
                      </a>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {/* 2-Column Article Body + Desktop Sticky Sidebar */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <aside className="hidden lg:block lg:col-span-4 space-y-5 lg:sticky lg:top-24">
              <a
                href="/boost"
                onClick={(e) => handleSpaLinkClick(e, '/boost')}
                className="w-full ql-btn-outline py-2.5 px-4 text-xs justify-start bg-white"
              >
                <ArrowLeft className="w-3.5 h-3.5 text-[#1E40FF]" />
                <span>Quay lại Blog DOMATION</span>
              </a>

              {/* Clean Sticky Scrollspy TOC */}
              <div className="rounded-2xl bg-white/95 backdrop-blur-xl border border-slate-200/85 p-5 shadow-xs space-y-3">
                <div className="flex items-center gap-2 pb-2.5 border-b border-slate-200/75 text-xs font-extrabold uppercase tracking-wider text-slate-800">
                  <BookOpen className="w-4 h-4 text-[#1E40FF]" />
                  <span>Mục lục</span>
                </div>

                <ul className="space-y-1 text-xs max-h-[340px] overflow-y-auto pr-1">
                  {tocItems.map((item) => {
                    const isActive = activeSectionId === item.id;
                    return (
                      <li key={item.id}>
                        <a
                          href={`#${item.id}`}
                          aria-current={isActive ? 'location' : undefined}
                          className={`block py-1.5 pl-3 pr-2 border-l-2 rounded-r-lg transition-all leading-snug ${
                            isActive
                              ? 'border-[#1E40FF] bg-blue-50/85 text-[#1E40FF] font-bold'
                              : 'border-transparent text-slate-600 hover:text-[#1E40FF] hover:bg-slate-50 font-medium'
                          }`}
                        >
                          {item.label}
                        </a>
                      </li>
                    );
                  })}
                </ul>
              </div>

              {/* Same-Category Quick Reads */}
              {sameCategoryQuickReads.length > 0 && cleanCategory && (
                <div className="rounded-2xl bg-white/95 backdrop-blur-xl border border-slate-200/85 p-5 shadow-xs space-y-3">
                  <div className="text-xs font-extrabold uppercase tracking-wider text-slate-800 pb-2 border-b border-slate-200/75">
                    Cùng chuyên mục • {cleanCategory.label}
                  </div>
                  <div className="divide-y divide-slate-200/70">
                    {sameCategoryQuickReads.map((item) => (
                      <BlogArticleCard key={item.slug} article={item} variant="compact" />
                    ))}
                  </div>
                </div>
              )}

              {/* Author Card */}
              <div className="rounded-2xl bg-white/95 backdrop-blur-xl border border-slate-200/85 p-5 shadow-xs space-y-3">
                <div className="flex items-center gap-3">
                  <img
                    src="/assets/brands/founder_turnio.webp"
                    alt="Huỳnh Trọng Phúc (TurnioDEV)"
                    width={44}
                    height={44}
                    loading="lazy"
                    className="w-11 h-11 rounded-xl object-cover object-top border border-blue-200/80 shrink-0 bg-slate-100"
                  />
                  <div>
                    <div className="text-xs font-bold text-slate-900">
                      Huỳnh Trọng Phúc (TurnioDEV)
                    </div>
                    <div className="text-[11px] text-[#1E40FF] font-semibold">
                      Founder &amp; CEO DOMATION
                    </div>
                  </div>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Chia sẻ góc nhìn thực tế về kiến trúc phần mềm, AI Automation, dữ liệu và vận hành doanh nghiệp.
                </p>
                <div className="pt-2 flex flex-col gap-2">
                  <button
                    type="button"
                    onClick={() => setContactOpen(true)}
                    className="btn-inkica-primary w-full py-2.5 px-4 text-xs cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Trao đổi cùng tác giả</span>
                  </button>
                  <a
                    href={matchedSummary.relatedModuleUrl}
                    onClick={(e) => handleSpaLinkClick(e, matchedSummary.relatedModuleUrl)}
                    className="ql-btn-outline w-full py-2.5 px-4 text-xs"
                  >
                    <span>{matchedSummary.relatedModuleLabel}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            </aside>

            {/* Right Main Content Column */}
            <article className="lg:col-span-8 space-y-8 min-w-0">
              {loadingBody || !article ? (
                <div className="space-y-6">
                  <div className="rounded-3xl bg-white/95 border border-slate-200/85 p-8 space-y-4 animate-pulse">
                    <div className="h-5 w-40 rounded-full bg-blue-100" />
                    <div className="h-4 w-full rounded bg-slate-200" />
                    <div className="h-4 w-5/6 rounded bg-slate-200" />
                    <div className="h-4 w-4/5 rounded bg-slate-200" />
                  </div>
                  <div className="rounded-3xl bg-white/95 border border-slate-200/85 p-8 space-y-4 animate-pulse">
                    <div className="h-6 w-2/3 rounded bg-slate-200" />
                    <div className="h-64 w-full rounded-2xl bg-slate-100" />
                  </div>
                </div>
              ) : (
                <>
                  {/* Executive Summary */}
                  <section
                    id="geo-tldr"
                    className={`rounded-3xl border p-6 sm:p-8 shadow-xs space-y-4 scroll-mt-24 ${formatMeta.tldrBgClass}`}
                  >
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-blue-200 text-[11px] font-bold uppercase tracking-wider text-[#1E40FF]">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>{formatMeta.tldrLabel}</span>
                    </div>
                    <p className={`text-slate-800 font-medium ${textScale.body}`}>
                      {article.tldrSummary}
                    </p>
                    <div className="pt-3 border-t border-slate-200/75 space-y-2.5">
                      <div className="text-xs font-extrabold uppercase tracking-wider text-slate-700">
                        Điểm chính trong bài:
                      </div>
                      <ul className="space-y-2">
                        {article.keyTakeaways.map((kt) => (
                          <li
                            key={kt}
                            className={`flex items-start gap-2.5 text-slate-700 ${textScale.sub}`}
                          >
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-1" />
                            <span>{kt}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </section>

                  {hasCustomBlocks ? (
                    <ArticleBlockRenderer
                      blocks={article.blocks!}
                      onZoomImage={setZoomImage}
                      proseScale={readerFontSize}
                    />
                  ) : (
                    <>
                      {/* 1. Pain Points */}
                      <section
                        id="pain-points"
                        className="rounded-3xl bg-white/95 backdrop-blur-xl border border-slate-200/85 p-6 sm:p-8 shadow-xs space-y-5 scroll-mt-24"
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="w-9 h-9 rounded-xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center shrink-0">
                            <AlertTriangle className="w-4 h-4" />
                          </div>
                          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900">
                            1. Thực Trạng &amp; Thách Thức
                          </h2>
                        </div>

                        <div className="grid grid-cols-1 gap-4">
                          {article.painPoints.map((pp) => (
                            <div
                              key={pp.title}
                              className="rounded-2xl bg-slate-50/85 border border-slate-200/80 p-5 space-y-2"
                            >
                              <div className="flex flex-wrap items-center justify-between gap-2">
                                <h3 className="text-base font-bold text-slate-900">{pp.title}</h3>
                                <span className="px-2.5 py-1 rounded-full bg-rose-50 border border-rose-200 text-rose-700 text-[11px] font-bold">
                                  {pp.impactMetric}
                                </span>
                              </div>
                              <p className={`text-slate-600 ${textScale.sub}`}>{pp.detail}</p>
                            </div>
                          ))}
                        </div>
                      </section>

                      {/* 2. Implementation Challenges (Daylight) */}
                      <section
                        id="challenges"
                        className="rounded-3xl bg-white/95 backdrop-blur-xl border border-slate-200/85 p-6 sm:p-8 shadow-xs space-y-5 scroll-mt-24"
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-200 text-[#1E40FF] flex items-center justify-center shrink-0">
                            <Wrench className="w-4 h-4" />
                          </div>
                          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900">
                            2. Khó Khăn Khi Triển Khai Thực Tế &amp; Cách Xử Lý
                          </h2>
                        </div>

                        <div className="space-y-4">
                          {article.implementationChallenges.map((item, idx) => (
                            <div
                              key={idx}
                              className="rounded-2xl border border-slate-200/85 overflow-hidden bg-white shadow-xs"
                            >
                              <div className="bg-slate-50/95 border-b border-slate-200/80 text-slate-900 px-5 py-3.5 text-xs sm:text-sm font-bold flex items-center gap-2.5">
                                <span className="px-2.5 py-0.5 rounded-md bg-[#1E40FF] text-white font-mono text-[11px] shrink-0">
                                  VẤN ĐỀ #{idx + 1}
                                </span>
                                <span>{item.challenge}</span>
                              </div>
                              <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="rounded-xl bg-amber-50/70 border border-amber-200/70 p-4 space-y-1.5">
                                  <div className="text-[11px] font-bold uppercase tracking-wider text-amber-800">
                                    Nguyên Nhân Gốc Rễ
                                  </div>
                                  <p className={`text-slate-700 ${textScale.sub}`}>
                                    {item.rootCause}
                                  </p>
                                </div>
                                <div className="rounded-xl bg-emerald-50/70 border border-emerald-200/70 p-4 space-y-1.5">
                                  <div className="text-[11px] font-bold uppercase tracking-wider text-emerald-800">
                                    Cách Tháo Gỡ Thực Tế
                                  </div>
                                  <p className={`text-slate-700 ${textScale.sub}`}>
                                    {item.domationFix}
                                  </p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </section>

                      {/* 3. Solution Architecture + Screenshot */}
                      <section
                        id="architecture"
                        className="rounded-3xl bg-white/95 backdrop-blur-xl border border-slate-200/85 p-6 sm:p-8 shadow-xs space-y-6 scroll-mt-24"
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center shrink-0">
                            <Layers className="w-4 h-4" />
                          </div>
                          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900">
                            3. Kiến Trúc &amp; Quy Trình Triển Khai
                          </h2>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {article.solutionSteps.map((st) => (
                            <div
                              key={st.step}
                              className="rounded-2xl bg-slate-50/90 border border-slate-200/80 p-5 flex flex-col justify-between gap-3"
                            >
                              <div className="space-y-2">
                                <span className="inline-block font-mono text-xs font-bold text-[#1E40FF] bg-blue-50 border border-blue-200 px-2.5 py-0.5 rounded-full">
                                  BƯỚC {st.step}
                                </span>
                                <h3 className="text-sm sm:text-base font-bold text-slate-900">
                                  {st.title}
                                </h3>
                                <p className={`text-slate-600 ${textScale.sub}`}>{st.detail}</p>
                              </div>
                              {st.techStack && (
                                <div className="pt-2 border-t border-slate-200/70 text-[11px] font-mono text-slate-500">
                                  {st.techStack}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>

                        <div className="rounded-2xl border border-slate-200/85 bg-slate-50/75 p-4 space-y-3">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                              Hình Ảnh Minh Họa Hệ Thống
                            </span>
                            <button
                              type="button"
                              onClick={() =>
                                setZoomImage({
                                  src: article.screenshotImage,
                                  caption: article.screenshotCaption,
                                })
                              }
                              className="inline-flex items-center gap-1 text-xs font-semibold text-[#1E40FF] hover:underline cursor-pointer"
                            >
                              <ZoomIn className="w-3.5 h-3.5" />
                              <span>Phóng to ảnh</span>
                            </button>
                          </div>
                          <button
                            type="button"
                            onClick={() =>
                              setZoomImage({
                                src: article.screenshotImage,
                                caption: article.screenshotCaption,
                              })
                            }
                            aria-label={`Phóng to ảnh minh họa: ${article.screenshotCaption}`}
                            className="block w-full text-left rounded-xl overflow-hidden border border-slate-200 bg-white cursor-zoom-in"
                          >
                            <img
                              src={article.screenshotImage}
                              alt={article.screenshotCaption}
                              loading="lazy"
                              decoding="async"
                              className="w-full max-h-[420px] object-cover object-top"
                            />
                          </button>
                          <p className="text-xs text-slate-600 italic">{article.screenshotCaption}</p>
                        </div>
                      </section>

                      {/* 4+. Detailed Sections */}
                      {article.sections.map((sec, idx) => (
                        <section
                          key={sec.id}
                          id={sec.id}
                          className="rounded-3xl bg-white/95 backdrop-blur-xl border border-slate-200/85 p-6 sm:p-8 shadow-xs space-y-4 scroll-mt-24"
                        >
                          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900">
                            {idx + 4}. {sec.heading}
                          </h2>
                          <div className="space-y-4">
                            {sec.paragraphs.map((p, pIdx) => (
                              <p key={pIdx} className={`text-slate-700 ${textScale.body}`}>
                                {p}
                              </p>
                            ))}
                          </div>
                          {sec.bullets && sec.bullets.length > 0 && (
                            <ul className="space-y-2.5 pt-2">
                              {sec.bullets.map((b, bIdx) => (
                                <li
                                  key={bIdx}
                                  className={`flex items-start gap-2.5 text-slate-700 ${textScale.sub}`}
                                >
                                  <CheckCircle2 className="w-4 h-4 text-[#1E40FF] shrink-0 mt-1" />
                                  <span>{b}</span>
                                </li>
                              ))}
                            </ul>
                          )}
                          {sec.codeSnippet && (
                            <div className="mt-4 rounded-2xl bg-[#0F172A] text-slate-100 p-4 sm:p-5 overflow-x-auto border border-slate-800">
                              <div className="flex items-center gap-2 text-[11px] font-mono text-cyan-300 uppercase tracking-wider mb-2.5">
                                <Code2 className="w-3.5 h-3.5" />
                                <span>{sec.codeSnippet.label}</span>
                              </div>
                              <pre className="text-xs font-mono leading-relaxed text-slate-200 whitespace-pre">
                                <code>{sec.codeSnippet.content}</code>
                              </pre>
                            </div>
                          )}
                        </section>
                      ))}
                    </>
                  )}

                  {/* Outcomes & Case Study */}
                  {article.metricsOutcome && article.metricsOutcome.length > 0 && (
                    <section
                      id="outcomes"
                      className="rounded-3xl bg-white/95 backdrop-blur-xl border border-slate-200/85 p-6 sm:p-8 shadow-xs space-y-6 scroll-mt-24"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-200 text-[#1E40FF] flex items-center justify-center shrink-0">
                          <TrendingUp className="w-4 h-4" />
                        </div>
                        <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900">
                          Kết Quả &amp; Đối Chiếu Thực Tế
                        </h2>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {article.metricsOutcome.map((m) => (
                          <div
                            key={m.label}
                            className="rounded-2xl bg-gradient-to-br from-slate-50 to-blue-50/60 border border-slate-200/80 p-4 text-center"
                          >
                            <div className="text-lg sm:text-xl font-black text-[#1E40FF]">
                              {m.value}
                            </div>
                            <div className="text-[11px] font-semibold text-slate-600 mt-1">
                              {m.label}
                            </div>
                          </div>
                        ))}
                      </div>

                      {relatedPortfolio && (
                        <div className="rounded-2xl bg-gradient-to-br from-[#EEF4FF] via-[#F8FAFF] to-[#ECFEFF] border border-blue-200/85 text-slate-900 p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <div className="space-y-1.5">
                            <div className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-[#1E40FF]">
                              <Briefcase className="w-3.5 h-3.5" />
                              <span>Dự án thực tế liên quan</span>
                            </div>
                            <h3 className="text-base sm:text-lg font-extrabold text-slate-900">
                              {relatedPortfolio.name}
                            </h3>
                            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-xl">
                              {relatedPortfolio.architecture}
                            </p>
                          </div>
                          <div className="flex flex-wrap sm:flex-col gap-2 shrink-0">
                            <a
                              href="/portfolio"
                              onClick={(e) => handleSpaLinkClick(e, '/portfolio')}
                              className="btn-inkica-primary px-4 py-2.5 text-xs"
                            >
                              <span>Xem Portfolio</span>
                              <ArrowRight className="w-3.5 h-3.5" />
                            </a>
                          </div>
                        </div>
                      )}
                    </section>
                  )}

                  {/* FAQ Accordion */}
                  {article.faqs && article.faqs.length > 0 && (
                    <section
                      id="faq"
                      className="rounded-3xl bg-white/95 backdrop-blur-xl border border-slate-200/85 p-6 sm:p-8 shadow-xs space-y-4 scroll-mt-24"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-xl bg-cyan-50 border border-cyan-200 text-[#0369A1] flex items-center justify-center shrink-0">
                          <ListChecks className="w-4 h-4" />
                        </div>
                        <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900">
                          Câu Hỏi Thường Gặp
                        </h2>
                      </div>

                      <div className="divide-y divide-slate-200/80 border border-slate-200/80 rounded-2xl overflow-hidden">
                        {article.faqs.map((faq, idx) => {
                          const isOpen = !collapsedFaqSet[idx];
                          return (
                            <div key={faq.question} className="bg-white">
                              <button
                                type="button"
                                onClick={() =>
                                  setCollapsedFaqSet((prev) => ({ ...prev, [idx]: !prev[idx] }))
                                }
                                aria-expanded={isOpen}
                                className="w-full px-5 py-4 text-left flex items-center justify-between gap-4 hover:bg-slate-50 transition-colors cursor-pointer"
                              >
                                <span className="text-sm font-bold text-slate-900">
                                  {faq.question}
                                </span>
                                <ChevronDown
                                  className={`w-4 h-4 text-slate-500 shrink-0 transition-transform ${
                                    isOpen ? 'rotate-180 text-[#1E40FF]' : ''
                                  }`}
                                />
                              </button>
                              {isOpen && (
                                <div className={`px-5 pb-4 text-slate-600 ${textScale.sub}`}>
                                  {faq.answer}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </section>
                  )}
                </>
              )}

              {/* Author E-E-A-T Card */}
              <FounderAuthorityBlock variant="author" />

              {/* Clean Topic Tags */}
              <section className="rounded-2xl bg-white/95 border border-slate-200/85 p-5 space-y-3 shadow-xs">
                <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-slate-700">
                  <Tag className="w-4 h-4 text-[#1E40FF]" />
                  <span>Thẻ bài viết</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  <a
                    href={`/boost?q=${encodeURIComponent(matchedSummary.focusKeyword)}`}
                    onClick={(e) =>
                      handleSpaLinkClick(
                        e,
                        `/boost?q=${encodeURIComponent(matchedSummary.focusKeyword)}`
                      )
                    }
                    className="px-3 py-1 rounded-full bg-blue-50 hover:bg-[#1E40FF] border border-blue-200 text-[#1E40FF] hover:text-white text-xs font-bold transition-colors"
                  >
                    {matchedSummary.focusKeyword}
                  </a>
                  {matchedSummary.secondaryKeywords.map((kw) => (
                    <a
                      key={kw}
                      href={`/boost?q=${encodeURIComponent(kw)}`}
                      onClick={(e) =>
                        handleSpaLinkClick(e, `/boost?q=${encodeURIComponent(kw)}`)
                      }
                      className="px-3 py-1 rounded-full bg-slate-100 hover:bg-blue-50 border border-slate-200 hover:border-blue-200 text-slate-700 hover:text-[#1E40FF] text-xs font-medium transition-colors"
                    >
                      {kw}
                    </a>
                  ))}
                </div>
              </section>

              {/* Prev / Next Navigation with Cover Thumbnails */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {prevArticle ? (
                  <a
                    href={`/boost/${prevArticle.slug}`}
                    onClick={(e) => handleSpaLinkClick(e, `/boost/${prevArticle.slug}`)}
                    className="rounded-2xl bg-white/95 border border-slate-200/85 p-4 hover:border-blue-300 hover:shadow-sm transition-all flex items-center gap-3.5 group"
                  >
                    <img
                      src={prevArticle.coverImage}
                      alt={prevArticle.coverAlt}
                      width={80}
                      height={56}
                      loading="lazy"
                      decoding="async"
                      className="w-20 h-14 rounded-xl object-cover shrink-0 border border-slate-200 bg-slate-100"
                    />
                    <div className="min-w-0 flex-1 space-y-1">
                      <span className="text-[10.5px] font-bold uppercase tracking-wider text-slate-600 inline-flex items-center gap-1">
                        <ArrowLeft className="w-3 h-3" /> Bài trước
                      </span>
                      <div className="text-xs sm:text-sm font-bold text-slate-900 group-hover:text-[#1E40FF] line-clamp-2 leading-snug">
                        {prevArticle.title}
                      </div>
                    </div>
                  </a>
                ) : (
                  <div />
                )}

                {nextArticle && (
                  <a
                    href={`/boost/${nextArticle.slug}`}
                    onClick={(e) => handleSpaLinkClick(e, `/boost/${nextArticle.slug}`)}
                    className="rounded-2xl bg-white/95 border border-slate-200/85 p-4 hover:border-blue-300 hover:shadow-sm transition-all flex items-center gap-3.5 text-right group"
                  >
                    <div className="min-w-0 flex-1 space-y-1">
                      <span className="text-[10.5px] font-bold uppercase tracking-wider text-slate-600 inline-flex items-center justify-end gap-1">
                        Bài tiếp theo <ArrowRight className="w-3 h-3" />
                      </span>
                      <div className="text-xs sm:text-sm font-bold text-slate-900 group-hover:text-[#1E40FF] line-clamp-2 leading-snug">
                        {nextArticle.title}
                      </div>
                    </div>
                    <img
                      src={nextArticle.coverImage}
                      alt={nextArticle.coverAlt}
                      width={80}
                      height={56}
                      loading="lazy"
                      decoding="async"
                      className="w-20 h-14 rounded-xl object-cover shrink-0 border border-slate-200 bg-slate-100"
                    />
                  </a>
                )}
              </div>
            </article>
          </div>

          {/* Related Articles */}
          <section className="mt-14 pt-10 border-t border-slate-200/80">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-6">
              <div>
                <h2 className="text-2xl font-black text-slate-900">Bài viết liên quan</h2>
              </div>
              <button
                type="button"
                onClick={() => navigateTo('/boost')}
                className="ql-btn-outline px-4 py-2 text-xs w-fit cursor-pointer bg-white"
              >
                <span>Xem thêm bài viết</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {relatedArticles.map((rel) => (
                <BlogArticleCard
                  key={rel.id}
                  article={rel}
                  variant="standard"
                  isBookmarked={bookmarkedSlugs.includes(rel.slug)}
                  onToggleBookmark={handleToggleBookmark}
                />
              ))}
            </div>
          </section>
        </div>
      </main>

      <DomationFooter onOpenContact={() => setContactOpen(true)} />
      <BackToTopPill />

      {/* Accessible Image Zoom Lightbox */}
      {zoomImage && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={zoomImage.caption}
          className="fixed inset-0 z-[100] bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4"
          onClick={() => setZoomImage(null)}
        >
          <div
            className="max-w-5xl w-full bg-white rounded-3xl overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-3 border-b border-slate-200">
              <span className="text-xs font-bold text-slate-800">{zoomImage.caption}</span>
              <button
                type="button"
                onClick={() => setZoomImage(null)}
                className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600 cursor-pointer"
                aria-label="Đóng ảnh"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <img
              src={zoomImage.src}
              alt={zoomImage.caption}
              className="w-full max-h-[80vh] object-contain bg-slate-50"
            />
          </div>
        </div>
      )}

      <ContactModal
        isOpen={contactOpen}
        onClose={() => setContactOpen(false)}
        defaultService={cleanCategory ? cleanCategory.label : matchedSummary.pillarLabel}
        defaultNote={`Đọc bài "${matchedSummary.title}" — Mong muốn trao đổi thêm`}
      />
    </div>
  );
};
