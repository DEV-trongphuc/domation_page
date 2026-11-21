import React from 'react';
import { ArrowRight, Bookmark, Clock } from 'lucide-react';
import type { BoostArticleSummary } from '../../data/boostTypes';
import { getArticleScheduledDate } from '../../data/publishSchedule';
import { handleSpaLinkClick } from '../../utils/navigation';
import { getArticleCategory } from './blogMeta';

interface BlogArticleCardProps {
  article: BoostArticleSummary;
  variant?: 'standard' | 'compact' | 'list';
  isBookmarked?: boolean;
  onToggleBookmark?: (slug: string) => void;
}

export const BlogArticleCard: React.FC<BlogArticleCardProps> = ({
  article,
  variant = 'standard',
  isBookmarked = false,
  onToggleBookmark,
}) => {
  const href = `/boost/${article.slug}`;
  const category = getArticleCategory(article.pillar);
  const displayDate = getArticleScheduledDate(article);

  if (variant === 'compact') {
    return (
      <article className="group flex items-start gap-3.5 py-3 first:pt-0 last:pb-0">
        <a
          href={href}
          onClick={(e) => handleSpaLinkClick(e, href)}
          className="w-20 h-16 rounded-xl overflow-hidden bg-slate-100 border border-slate-200/80 shrink-0 mt-0.5"
        >
          <img
            src={article.coverImage}
            alt={article.coverAlt}
            width={1376}
            height={768}
            loading="lazy"
            decoding="async"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        </a>

        <div className="flex-1 min-w-0 space-y-1">
          <div className="flex items-center justify-between gap-2">
            <span className={`text-[11px] font-bold truncate ${category.textClass}`}>
              {category.label}
            </span>
            <span className="text-[11px] text-slate-600 shrink-0 font-medium">
              {article.readingMinutes} phút
            </span>
          </div>
          <h3 className="text-[13.5px] font-bold text-slate-900 leading-snug line-clamp-2 group-hover:text-[#1E40FF] transition-colors">
            <a href={href} onClick={(e) => handleSpaLinkClick(e, href)}>
              {article.title}
            </a>
          </h3>
        </div>
      </article>
    );
  }

  if (variant === 'list') {
    return (
      <article className="rounded-[24px] bg-white/95 border border-slate-200/85 p-4 sm:p-5 shadow-[0_8px_28px_-16px_rgba(15,23,42,0.08)] hover:border-blue-300/90 hover:shadow-[0_20px_44px_-16px_rgba(30,64,255,0.14)] transition-all duration-300 grid grid-cols-1 md:grid-cols-12 gap-5 items-center group">
        <div className="md:col-span-4 relative">
          <a
            href={href}
            onClick={(e) => handleSpaLinkClick(e, href)}
            className="block aspect-[16/10] rounded-2xl overflow-hidden bg-slate-100 border border-slate-200/80"
          >
            <img
              src={article.coverImage}
              alt={article.coverAlt}
              width={1376}
              height={768}
              loading="lazy"
              decoding="async"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          </a>
          {onToggleBookmark && (
            <button
              type="button"
              onClick={() => onToggleBookmark(article.slug)}
              aria-label={isBookmarked ? 'Bỏ lưu bài viết' : 'Lưu bài viết'}
              aria-pressed={isBookmarked}
              className={`absolute top-2.5 right-2.5 p-1.5 rounded-full border shadow-xs backdrop-blur-md transition-colors cursor-pointer ${
                isBookmarked
                  ? 'bg-[#1E40FF] border-[#1E40FF] text-white'
                  : 'bg-white/90 border-slate-200/90 text-slate-500 hover:text-[#1E40FF]'
              }`}
            >
              <Bookmark className={`w-3.5 h-3.5 ${isBookmarked ? 'fill-white' : ''}`} />
            </button>
          )}
        </div>

        <div className="md:col-span-8 flex flex-col justify-between gap-3">
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2 text-xs">
              <span className={`font-bold ${category.textClass}`}>{category.label}</span>
              <span className="inline-flex items-center gap-1 text-slate-500">
                <Clock className="w-3.5 h-3.5" />
                {article.readingMinutes} phút đọc
              </span>
            </div>

            <h3 className="text-base sm:text-lg font-extrabold text-slate-900 leading-snug group-hover:text-[#1E40FF] transition-colors line-clamp-2">
              <a href={href} onClick={(e) => handleSpaLinkClick(e, href)}>
                {article.title}
              </a>
            </h3>

            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed line-clamp-2">
              {article.metaDescription}
            </p>
          </div>

          <div className="pt-2.5 border-t border-slate-200/75 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 text-xs text-slate-500">
              <img
                src="/assets/brands/founder_turnio.webp"
                alt="Huỳnh Trọng Phúc"
                width={22}
                height={22}
                loading="lazy"
                className="w-5.5 h-5.5 rounded-full object-cover object-top border border-slate-200"
              />
              <span className="font-semibold text-slate-700">Huỳnh Trọng Phúc</span>
              <span className="text-slate-300">•</span>
              <span>{displayDate}</span>
            </div>

            <a
              href={href}
              onClick={(e) => handleSpaLinkClick(e, href)}
              className="text-xs font-bold text-[#1E40FF] hover:text-cyan-600 inline-flex items-center gap-1.5 whitespace-nowrap"
            >
              <span>Đọc tiếp</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </a>
          </div>
        </div>
      </article>
    );
  }

  // Default: 'standard' clean magazine card
  return (
    <article className="rounded-[24px] bg-white/95 border border-slate-200/85 shadow-[0_8px_26px_-16px_rgba(15,23,42,0.08)] hover:border-blue-300/90 hover:shadow-[0_20px_46px_-16px_rgba(30,64,255,0.14)] hover:-translate-y-1 transition-all duration-300 overflow-hidden flex flex-col justify-between group h-full">
      <div>
        <div className="relative">
          <a
            href={href}
            onClick={(e) => handleSpaLinkClick(e, href)}
            className="block aspect-[16/9] bg-slate-100 border-b border-slate-200/70 overflow-hidden"
          >
            <img
              src={article.coverImage}
              alt={article.coverAlt}
              width={1376}
              height={768}
              loading="lazy"
              decoding="async"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          </a>

          {onToggleBookmark && (
            <button
              type="button"
              onClick={() => onToggleBookmark(article.slug)}
              aria-label={isBookmarked ? 'Bỏ lưu bài viết' : 'Lưu bài viết'}
              aria-pressed={isBookmarked}
              className={`absolute top-3 right-3 p-1.5 rounded-full border shadow-xs backdrop-blur-md transition-colors cursor-pointer ${
                isBookmarked
                  ? 'bg-[#1E40FF] border-[#1E40FF] text-white'
                  : 'bg-white/90 border-slate-200/90 text-slate-500 hover:text-[#1E40FF]'
              }`}
            >
              <Bookmark className={`w-3.5 h-3.5 ${isBookmarked ? 'fill-white' : ''}`} />
            </button>
          )}
        </div>

        <div className="p-5 space-y-2.5">
          <div className="flex items-center justify-between gap-2 text-xs">
            <span className={`font-bold truncate ${category.textClass}`}>
              {category.label}
            </span>
            <span className="text-slate-500 shrink-0 text-[11px]">
              {article.readingMinutes} phút đọc
            </span>
          </div>

          <h3 className="text-[15.5px] sm:text-base font-extrabold text-slate-900 leading-snug group-hover:text-[#1E40FF] transition-colors line-clamp-2">
            <a href={href} onClick={(e) => handleSpaLinkClick(e, href)}>
              {article.title}
            </a>
          </h3>

          <p className="text-xs sm:text-[13px] text-slate-600 leading-relaxed line-clamp-2">
            {article.metaDescription}
          </p>
        </div>
      </div>

      <div className="px-5 py-3.5 bg-slate-50/60 border-t border-slate-200/70 flex items-center justify-between gap-2 text-[11.5px] text-slate-500">
        <div className="flex items-center gap-2 min-w-0">
          <img
            src="/assets/brands/founder_turnio.webp"
            alt="Huỳnh Trọng Phúc"
            width={20}
            height={20}
            loading="lazy"
            className="w-5 h-5 rounded-full object-cover object-top border border-slate-200 shrink-0"
          />
          <span className="truncate font-medium text-slate-700">Huỳnh Trọng Phúc</span>
        </div>

        <span className="shrink-0">{displayDate}</span>
      </div>
    </article>
  );
};
