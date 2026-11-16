import React, { useEffect, useState } from 'react';
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Briefcase,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock,
  Code2,
  Copy,
  Layers,
  ListChecks,
  Sparkles,
  Tag,
  TrendingUp,
  UserCheck,
  Wrench,
  X,
  ZoomIn,
} from 'lucide-react';
import { Navbar } from './Navbar';
import { ContactModal } from './ContactModal';
import { LuxuryGoldBackdrop } from './LuxuryGoldBackdrop';
import { DomationLogoMark } from './components/DomationLogoMark';
import { DomationFooter } from './components/DomationFooter';
import { BOOST_ARTICLES, getArticleBySlug, getRelatedArticles } from './data/boostArticles';
import { getSinglePostSeoConfig } from './data/boostRouteSeo';
import { PORTFOLIO_PROJECTS } from './data/portfolioData';
import type { BoostArticle } from './data/boostTypes';
import { handleSpaLinkClick, navigateTo } from './utils/navigation';
import { FOUNDER_PRIMARY_URL, type PageSeoConfig, usePageSeo } from './utils/seo';

interface SinglePostPageProps {
  slug: string;
}

export const SinglePostPage: React.FC<SinglePostPageProps> = ({ slug }) => {
  const matchedArticle = getArticleBySlug(slug);
  const article: BoostArticle = matchedArticle || BOOST_ARTICLES[0];
  const currentIdx = matchedArticle
    ? BOOST_ARTICLES.findIndex((a) => a.slug === article.slug)
    : -1;
  const prevArticle = currentIdx > 0 ? BOOST_ARTICLES[currentIdx - 1] : null;
  const nextArticle =
    currentIdx >= 0 && currentIdx < BOOST_ARTICLES.length - 1
      ? BOOST_ARTICLES[currentIdx + 1]
      : null;
  const relatedArticles = matchedArticle
    ? getRelatedArticles(article, 3)
    : BOOST_ARTICLES.slice(0, 3);
  const relatedPortfolio =
    matchedArticle && article.relatedPortfolioId
      ? PORTFOLIO_PROJECTS.find((p) => p.id === article.relatedPortfolioId)
      : undefined;

  const [readProgress, setReadProgress] = useState(0);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [collapsedFaqSet, setCollapsedFaqSet] = useState<Record<number, boolean>>({});
  const [zoomImage, setZoomImage] = useState<{ src: string; caption: string } | null>(null);
  const [contactOpen, setContactOpen] = useState(false);

  const seoConfig: PageSeoConfig = matchedArticle
    ? getSinglePostSeoConfig(article)
    : {
        title: 'Không Tìm Thấy Bài Viết | Blog DOMATION',
        description:
          'Bài viết bạn tìm không tồn tại hoặc đã được chuyển chuyên mục. Khám phá Blog DOMATION — kiến thức ERP may đo, Vibecode, AI 5.0 & tối ưu quảng cáo.',
        path: `/boost/${encodeURIComponent(slug)}`,
        ogImage: '/imgs/boost/boost-hero-growth-hub.jpg',
        ogImageAlt: 'Blog DOMATION — Hệ Sinh Thái Triển Khai & SEO Doanh Nghiệp 5.0',
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

  if (!matchedArticle) {
    const tokens = slug.toLowerCase().split(/[-_\s]+/).filter((t) => t.length >= 2);
    const suggested = BOOST_ARTICLES.filter((a) =>
      tokens.some(
        (tk) =>
          a.slug.includes(tk) ||
          a.title.toLowerCase().includes(tk) ||
          a.focusKeyword.toLowerCase().includes(tk)
      )
    );
    const displaySuggestions = (suggested.length > 0 ? suggested : BOOST_ARTICLES).slice(0, 3);

    return (
      <div className="min-h-screen bg-[#F8F9FA] text-slate-900 relative overflow-x-clip font-sans selection:bg-blue-600/20">
        <LuxuryGoldBackdrop />
        <Navbar
          activePage="boost"
          onOpenContact={() => setContactOpen(true)}
          contactLabel="Tư Vấn Triển Khai"
        />
        <main className="relative z-10 pt-28 pb-20 px-4 sm:px-6">
          <div className="max-w-4xl mx-auto space-y-8">
            <section className="rounded-[28px] bg-white/95 backdrop-blur-2xl border border-slate-200/85 p-8 sm:p-12 text-center shadow-[0_24px_64px_-24px_rgba(15,23,42,0.08)] space-y-5">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-xs font-bold uppercase tracking-wider">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>404 • Không Tìm Thấy Bài Viết</span>
              </div>
              <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-900 leading-tight">
                Bài Viết Không Tồn Tại Hoặc Đã Được Chuyển Mục
              </h1>
              <p className="text-sm sm:text-base text-slate-600 max-w-xl mx-auto leading-relaxed">
                Nội dung bạn đang truy cập hiện không còn ở đường dẫn này. Bạn có thể quay về Blog DOMATION (/boost) để xem 74+ bài phân tích SEO, ERP may đo, Vibecode và chiến lược tối ưu chuyển đổi mới nhất.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                <a
                  href="/boost"
                  onClick={(e) => handleSpaLinkClick(e, '/boost')}
                  className="btn-inkica-primary px-6 py-3 text-xs sm:text-sm"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Quay Lại Blog DOMATION</span>
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
              <h2 className="text-lg font-bold text-slate-900">
                Bài Viết Đề Xuất Dành Cho Bạn
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {displaySuggestions.map((rel) => (
                  <a
                    key={rel.id}
                    href={`/boost/${rel.slug}`}
                    onClick={(e) => handleSpaLinkClick(e, `/boost/${rel.slug}`)}
                    className="inkica-glass-card rounded-2xl overflow-hidden flex flex-col justify-between group"
                  >
                    <div>
                      <div className="aspect-[16/9] overflow-hidden bg-slate-100 border-b border-slate-200/70">
                        <img
                          src={rel.coverImage}
                          alt={rel.coverAlt}
                          loading="lazy"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      </div>
                      <div className="p-4 space-y-1.5">
                        <div className="text-[11px] font-bold text-[#1E40FF]">{rel.pillarLabel}</div>
                        <h3 className="text-sm font-bold text-slate-900 group-hover:text-[#1E40FF] line-clamp-2">
                          {rel.title}
                        </h3>
                      </div>
                    </div>
                    <div className="px-4 pb-3 text-xs font-bold text-[#1E40FF] inline-flex items-center gap-1">
                      <span>Đọc tiếp</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </div>
                  </a>
                ))}
              </div>
            </section>
          </div>
        </main>
        <DomationFooter onOpenContact={() => setContactOpen(true)} />
        <ContactModal isOpen={contactOpen} onClose={() => setContactOpen(false)} />
      </div>
    );
  }

  const handleCopyUrl = async () => {
    try {
      const fullUrl = `${window.location.origin}/boost/${article.slug}`;
      await navigator.clipboard.writeText(fullUrl);
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 2000);
    } catch {
      setCopiedUrl(false);
    }
  };

  const tocItems = [
    { id: 'geo-tldr', label: 'Tóm tắt nội dung' },
    { id: 'pain-points', label: '1. Thực trạng & Thách thức ngành' },
    { id: 'challenges', label: '2. Trở ngại triển khai & Cách xử lý' },
    { id: 'architecture', label: '3. Kiến trúc & Quy trình thực hiện' },
    ...article.sections.map((s, idx) => ({
      id: s.id,
      label: `${idx + 4}. ${s.heading}`,
    })),
    { id: 'outcomes', label: 'Kết quả thực tế & Dự án liên quan' },
    { id: 'faq', label: 'Câu hỏi thường gặp' },
  ];

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-slate-900 relative overflow-x-clip font-sans selection:bg-blue-600/20">
      <LuxuryGoldBackdrop />

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

      <main className="relative z-10 pt-24 sm:pt-28 pb-20 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          {/* Breadcrumbs */}
          <nav
            aria-label="Breadcrumb"
            className="flex flex-wrap items-center gap-1.5 text-xs text-slate-500 mb-6"
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
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            <a
              href={`/boost?pillar=${article.pillar}`}
              onClick={(e) => handleSpaLinkClick(e, `/boost?pillar=${article.pillar}`)}
              className="text-[#1E40FF] font-semibold hover:underline"
            >
              {article.pillarLabel}
            </a>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-700 font-medium truncate max-w-[260px] sm:max-w-md">
              {article.title}
            </span>
          </nav>

          {/* Article Header Card */}
          <header className="rounded-[28px] bg-white/90 backdrop-blur-2xl border border-slate-200/85 shadow-[0_24px_64px_-24px_rgba(15,23,42,0.08)] overflow-hidden mb-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 p-6 sm:p-9 items-center">
              <div className="lg:col-span-7 space-y-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-[#1E40FF] text-[11px] font-bold uppercase tracking-wider">
                    <Sparkles className="w-3 h-3" />
                    {article.pillarLabel}
                  </span>
                  <span className="px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[11px] font-bold">
                    {article.industry}
                  </span>
                </div>

                <h1 className="text-2xl sm:text-3xl lg:text-[34px] font-extrabold text-slate-900 leading-[1.25] tracking-tight">
                  {article.title}
                </h1>

                <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
                  {article.metaDescription}
                </p>

                {/* SEO & Author Metadata Strip */}
                <div className="pt-3 border-t border-slate-200/75 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-600">
                  <div className="flex flex-wrap items-center gap-4">
                    <a
                      href={FOUNDER_PRIMARY_URL}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 font-semibold text-slate-800 hover:text-[#1E40FF] transition-colors"
                    >
                      <UserCheck className="w-4 h-4 text-[#1E40FF]" />
                      <span>Huỳnh Trọng Phúc (TurnioDEV)</span>
                    </a>
                    <span className="inline-flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      {article.readingMinutes} phút đọc
                    </span>
                    <span>Cập nhật: {article.updatedAt}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleCopyUrl}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-[#1E40FF] font-semibold transition-colors cursor-pointer"
                    >
                      {copiedUrl ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Đã copy link</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Chia sẻ link</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Generated Cover Artwork */}
              <div className="lg:col-span-5">
                <div className="rounded-2xl overflow-hidden border border-slate-200/80 bg-[#F4F8FF] shadow-sm">
                  <img
                    src={article.coverImage}
                    alt={article.coverAlt}
                    width={1376}
                    height={768}
                    fetchPriority="high"
                    className="w-full aspect-[16/9] object-cover"
                  />
                </div>
                <div className="mt-2.5 flex items-center justify-between gap-2 text-[11px] text-slate-500 px-1">
                  <span className="truncate">{article.coverAlt}</span>
                </div>
              </div>
            </div>
          </header>

          {/* 2-Column Article Body + Sticky Sidebar */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left Sticky TOC & CTA Sidebar */}
            <aside className="lg:col-span-4 space-y-5 lg:sticky lg:top-24">
              {/* Back to Archive */}
              <a
                href="/boost"
                onClick={(e) => handleSpaLinkClick(e, '/boost')}
                className="w-full ql-btn-outline py-2.5 px-4 text-xs justify-start"
              >
                <ArrowLeft className="w-3.5 h-3.5 text-[#1E40FF]" />
                <span>Quay lại Danh sách Bài viết</span>
              </a>

              {/* Table of Contents */}
              <div className="rounded-2xl bg-white/90 backdrop-blur-xl border border-slate-200/85 p-5 shadow-xs">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-800 mb-3 pb-2.5 border-b border-slate-200/75">
                  <BookOpen className="w-4 h-4 text-[#1E40FF]" />
                  <span>Mục Lục Bài Viết</span>
                </div>
                <ul className="space-y-2 text-xs">
                  {tocItems.map((item) => (
                    <li key={item.id}>
                      <a
                        href={`#${item.id}`}
                        className="block py-1 text-slate-600 hover:text-[#1E40FF] font-medium transition-colors leading-snug"
                      >
                        {item.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Author E-E-A-T Box */}
              <div className="rounded-2xl bg-white/90 backdrop-blur-xl border border-slate-200/85 p-5 shadow-xs space-y-3">
                <div className="flex items-center gap-3">
                  <DomationLogoMark className="w-10 h-10 shrink-0" />
                  <div>
                    <div className="text-xs font-bold text-slate-900">
                      Huỳnh Trọng Phúc (TurnioDEV)
                    </div>
                    <div className="text-[11px] text-[#1E40FF] font-semibold">
                      Founder &amp; Solution Architect • DOMATION
                    </div>
                  </div>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Trực tiếp thiết kế và triển khai hệ thống Auto Data CAPI, ERP 5.0 (12 phân hệ), CRM 360° &amp; AI Agent cho 30+ doanh nghiệp (Capital House, INKICA, IDEAS, Phúc Lộc Thọ).
                </p>
                <div className="pt-2 flex flex-col gap-2">
                  <button
                    type="button"
                    onClick={() => setContactOpen(true)}
                    className="btn-inkica-primary w-full py-2.5 px-4 text-xs cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Nhờ Kiến Trúc Sư Khảo Sát Bài Toán Này</span>
                  </button>
                  <a
                    href={article.relatedModuleUrl}
                    onClick={(e) => handleSpaLinkClick(e, article.relatedModuleUrl)}
                    className="ql-btn-outline w-full py-2.5 px-4 text-xs"
                  >
                    <span>{article.relatedModuleLabel}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            </aside>

            {/* Right Main Content Column */}
            <article className="lg:col-span-8 space-y-8">
              {/* Summary Brief */}
              <section
                id="geo-tldr"
                className="rounded-3xl bg-gradient-to-br from-blue-50/90 via-white to-cyan-50/75 border border-blue-200/80 p-6 sm:p-8 shadow-xs space-y-4"
              >
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-blue-200 text-[11px] font-bold uppercase tracking-wider text-[#1E40FF]">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Tóm Tắt Nhanh</span>
                </div>
                <p className="text-sm sm:text-[15px] text-slate-800 leading-relaxed font-medium">
                  {article.tldrSummary}
                </p>
                <div className="pt-3 border-t border-blue-200/60 space-y-2">
                  <div className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    Điểm Cốt Lõi Rút Ra:
                  </div>
                  <ul className="space-y-2">
                    {article.keyTakeaways.map((kt) => (
                      <li key={kt} className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-700">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        <span>{kt}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </section>

              {/* 1. Pain Points */}
              <section
                id="pain-points"
                className="rounded-3xl bg-white/90 backdrop-blur-xl border border-slate-200/85 p-6 sm:p-8 shadow-xs space-y-5"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center shrink-0">
                    <AlertTriangle className="w-4 h-4" />
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
                    1. Thực Trạng &amp; Thách Thức Ngành {article.industry}
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
                      <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                        {pp.detail}
                      </p>
                    </div>
                  ))}
                </div>
              </section>

              {/* 2. Real Implementation Challenges & DOMATION Fixes */}
              <section
                id="challenges"
                className="rounded-3xl bg-white/90 backdrop-blur-xl border border-slate-200/85 p-6 sm:p-8 shadow-xs space-y-5"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-200 text-[#1E40FF] flex items-center justify-center shrink-0">
                    <Wrench className="w-4 h-4" />
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
                    2. Khó Khăn Khi Triển Khai Thực Tế &amp; Cách DOMATION Tháo Gỡ
                  </h2>
                </div>

                <div className="space-y-4">
                  {article.implementationChallenges.map((item, idx) => (
                    <div
                      key={idx}
                      className="rounded-2xl border border-slate-200/85 overflow-hidden bg-white"
                    >
                      <div className="bg-slate-900 text-white px-5 py-3 text-xs sm:text-sm font-bold flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded bg-blue-500/30 text-cyan-300 font-mono text-[11px]">
                          VẤN ĐỀ #{idx + 1}
                        </span>
                        <span>{item.challenge}</span>
                      </div>
                      <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs sm:text-sm">
                        <div className="rounded-xl bg-amber-50/70 border border-amber-200/70 p-4 space-y-1">
                          <div className="text-[11px] font-bold uppercase tracking-wider text-amber-800">
                            Nguyên Nhân Gốc Rễ
                          </div>
                          <p className="text-slate-700 leading-relaxed">{item.rootCause}</p>
                        </div>
                        <div className="rounded-xl bg-emerald-50/70 border border-emerald-200/70 p-4 space-y-1">
                          <div className="text-[11px] font-bold uppercase tracking-wider text-emerald-800">
                            Giải Pháp Thực Chiến Của DOMATION
                          </div>
                          <p className="text-slate-700 leading-relaxed">{item.domationFix}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              {/* 3. Solution Blueprint + Real Screenshot */}
              <section
                id="architecture"
                className="rounded-3xl bg-white/90 backdrop-blur-xl border border-slate-200/85 p-6 sm:p-8 shadow-xs space-y-6"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center shrink-0">
                    <Layers className="w-4 h-4" />
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
                    3. Kiến Trúc Triển Khai &amp; Quy Trình Từng Bước
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
                        <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                          {st.detail}
                        </p>
                      </div>
                      {st.techStack && (
                        <div className="pt-2 border-t border-slate-200/70 text-[11px] font-mono text-slate-500">
                          {st.techStack}
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Authentic DOMATION Interface Screenshot */}
                <div className="rounded-2xl border border-slate-200/85 bg-slate-50/75 p-4 space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                      Màn Hình Hệ Thống Thực Tế
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
                  <div
                    onClick={() =>
                      setZoomImage({
                        src: article.screenshotImage,
                        caption: article.screenshotCaption,
                      })
                    }
                    className="rounded-xl overflow-hidden border border-slate-200 bg-white cursor-zoom-in"
                  >
                    <img
                      src={article.screenshotImage}
                      alt={article.screenshotCaption}
                      loading="lazy"
                      className="w-full max-h-[420px] object-cover object-top"
                    />
                  </div>
                  <p className="text-xs text-slate-600 italic">{article.screenshotCaption}</p>
                </div>
              </section>

              {/* 4+. Detailed Technical Sections */}
              {article.sections.map((sec, idx) => (
                <section
                  key={sec.id}
                  id={sec.id}
                  className="rounded-3xl bg-white/90 backdrop-blur-xl border border-slate-200/85 p-6 sm:p-8 shadow-xs space-y-4"
                >
                  <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
                    {idx + 4}. {sec.heading}
                  </h2>
                  <div className="space-y-3">
                    {sec.paragraphs.map((p, pIdx) => (
                      <p key={pIdx} className="text-sm sm:text-[15px] text-slate-700 leading-[1.8]">
                        {p}
                      </p>
                    ))}
                  </div>
                  {sec.bullets && sec.bullets.length > 0 && (
                    <ul className="space-y-2 pt-2">
                      {sec.bullets.map((b, bIdx) => (
                        <li key={bIdx} className="flex items-start gap-2.5 text-sm text-slate-700">
                          <CheckCircle2 className="w-4 h-4 text-[#1E40FF] shrink-0 mt-1" />
                          <span>{b}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                  {sec.codeSnippet && (
                    <div className="mt-4 rounded-2xl bg-slate-950 text-slate-100 p-4 sm:p-5 overflow-x-auto border border-slate-800">
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

              {/* Outcomes & Related Portfolio Case */}
              <section
                id="outcomes"
                className="rounded-3xl bg-white/90 backdrop-blur-xl border border-slate-200/85 p-6 sm:p-8 shadow-xs space-y-6"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-200 text-[#1E40FF] flex items-center justify-center shrink-0">
                    <TrendingUp className="w-4 h-4" />
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
                    Kết Quả Đo Lường Thực Tế &amp; Case Đối Chiếu
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
                  <div className="rounded-2xl bg-slate-950 text-white p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1.5">
                      <div className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-cyan-300">
                        <Briefcase className="w-3.5 h-3.5" />
                        <span>Case Study Trong Portfolio DOMATION</span>
                      </div>
                      <h3 className="text-base sm:text-lg font-bold text-white">
                        {relatedPortfolio.name}
                      </h3>
                      <p className="text-xs text-slate-300 leading-relaxed max-w-xl">
                        {relatedPortfolio.architecture}
                      </p>
                    </div>
                    <div className="flex flex-wrap sm:flex-col gap-2 shrink-0">
                      <a
                        href="/portfolio"
                        onClick={(e) => handleSpaLinkClick(e, '/portfolio')}
                        className="px-4 py-2 rounded-xl bg-white text-slate-900 text-xs font-bold inline-flex items-center justify-center gap-1.5 hover:bg-blue-50 transition-colors"
                      >
                        <span>Xem Portfolio</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  </div>
                )}
              </section>

              {/* FAQ Accordion */}
              <section
                id="faq"
                className="rounded-3xl bg-white/90 backdrop-blur-xl border border-slate-200/85 p-6 sm:p-8 shadow-xs space-y-4"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-cyan-50 border border-cyan-200 text-[#0369A1] flex items-center justify-center shrink-0">
                    <ListChecks className="w-4 h-4" />
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
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
                          <div className="px-5 pb-4 text-xs sm:text-sm text-slate-600 leading-relaxed">
                            {faq.answer}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </section>

              {/* Topic Tags */}
              <section className="rounded-2xl bg-white/85 border border-slate-200/80 p-5 space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-700">
                  <Tag className="w-4 h-4 text-[#1E40FF]" />
                  <span>Chủ Đề Liên Quan</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  <span className="px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-[#1E40FF] text-xs font-semibold">
                    {article.focusKeyword}
                  </span>
                  {article.secondaryKeywords.map((kw) => (
                    <span
                      key={kw}
                      className="px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-slate-700 text-xs font-medium"
                    >
                      {kw}
                    </span>
                  ))}
                </div>
              </section>

              {/* Prev / Next Navigation */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {prevArticle ? (
                  <a
                    href={`/boost/${prevArticle.slug}`}
                    onClick={(e) => handleSpaLinkClick(e, `/boost/${prevArticle.slug}`)}
                    className="rounded-2xl bg-white/90 border border-slate-200/85 p-5 hover:border-blue-300 transition-all flex flex-col gap-1.5 group"
                  >
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 inline-flex items-center gap-1">
                      <ArrowLeft className="w-3 h-3" /> Bài trước
                    </span>
                    <span className="text-sm font-bold text-slate-900 group-hover:text-[#1E40FF] line-clamp-2">
                      {prevArticle.title}
                    </span>
                  </a>
                ) : (
                  <div />
                )}

                {nextArticle && (
                  <a
                    href={`/boost/${nextArticle.slug}`}
                    onClick={(e) => handleSpaLinkClick(e, `/boost/${nextArticle.slug}`)}
                    className="rounded-2xl bg-white/90 border border-slate-200/85 p-5 hover:border-blue-300 transition-all flex flex-col gap-1.5 text-right group"
                  >
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 inline-flex items-center justify-end gap-1">
                      Bài tiếp theo <ArrowRight className="w-3 h-3" />
                    </span>
                    <span className="text-sm font-bold text-slate-900 group-hover:text-[#1E40FF] line-clamp-2">
                      {nextArticle.title}
                    </span>
                  </a>
                )}
              </div>
            </article>
          </div>

          {/* Related Articles */}
          <section className="mt-14 pt-10 border-t border-slate-200/80">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-6">
              <div>
                <div className="text-xs font-bold uppercase tracking-wider text-[#1E40FF] mb-1">
                  ĐỌC TIẾP CÙNG CHỦ ĐỀ
                </div>
                <h2 className="text-2xl font-bold text-slate-900">
                  Bài Viết Liên Quan
                </h2>
              </div>
              <button
                type="button"
                onClick={() => navigateTo('/boost')}
                className="ql-btn-outline px-4 py-2 text-xs w-fit cursor-pointer"
              >
                <span>Xem tất cả bài viết</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {relatedArticles.map((rel) => (
                <a
                  key={rel.id}
                  href={`/boost/${rel.slug}`}
                  onClick={(e) => handleSpaLinkClick(e, `/boost/${rel.slug}`)}
                  className="inkica-glass-card rounded-2xl overflow-hidden flex flex-col justify-between group"
                >
                  <div>
                    <div className="aspect-[16/9] overflow-hidden bg-slate-100 border-b border-slate-200/70">
                      <img
                        src={rel.coverImage}
                        alt={rel.coverAlt}
                        width={1376}
                        height={768}
                        loading="lazy"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    </div>
                    <div className="p-5 space-y-2">
                      <div className="flex items-center justify-between gap-2 text-[11px]">
                        <span className="font-bold text-[#1E40FF]">{rel.pillarLabel}</span>
                        <span className="text-slate-500">{rel.readingMinutes} phút</span>
                      </div>
                      <h3 className="text-base font-bold text-slate-900 group-hover:text-[#1E40FF] transition-colors line-clamp-2">
                        {rel.title}
                      </h3>
                      <p className="text-xs text-slate-600 line-clamp-2">{rel.metaDescription}</p>
                    </div>
                  </div>
                  <div className="px-5 pb-4 pt-2 flex items-center justify-between text-xs font-bold text-[#1E40FF]">
                    <span>Đọc tiếp</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </div>
                </a>
              ))}
            </div>
          </section>
        </div>
      </main>

      <DomationFooter onOpenContact={() => setContactOpen(true)} />

      {/* Image Zoom Lightbox */}
      {zoomImage && (
        <div
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
            <img src={zoomImage.src} alt={zoomImage.caption} className="w-full max-h-[80vh] object-contain bg-slate-50" />
          </div>
        </div>
      )}

      <ContactModal
        isOpen={contactOpen}
        onClose={() => setContactOpen(false)}
        defaultService={article.pillarLabel}
        defaultNote={`Đọc bài "${article.title}" — Mong muốn tư vấn giải pháp cho ngành ${article.industry}`}
      />
    </div>
  );
};
