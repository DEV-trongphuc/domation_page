import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export interface ResponsiveSlideDeckProps<T> {
  items: readonly T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  keyExtractor?: (item: T, index: number) => string;
  mobilePerPage?: number;
  mobileColsClass?: string;
  /** Convenience aliases supported for per-page / grid cols / label */
  perPage?: number;
  colsClass?: string;
  label?: string;
  accent?: 'blue' | 'cyan' | 'emerald';
  tabletPerPage?: number;
  tabletColsClass?: string;
  gapClass?: string;
  ariaLabel?: string;
  className?: string;
}

/**
 * Mobile/Tablet touch-swipeable carousel with SlideDots & Prev/Next controls.
 * Supports distinct Mobile (<768px) and Tablet (768px-1023px) items-per-page.
 */
export function ResponsiveSlideDeck<T>({
  items,
  renderItem,
  keyExtractor,
  mobilePerPage,
  mobileColsClass,
  perPage,
  colsClass,
  label,
  tabletPerPage,
  tabletColsClass = 'grid-cols-2',
  gapClass = 'gap-3',
  ariaLabel,
  className = '',
}: ResponsiveSlideDeckProps<T>) {
  const [page, setPage] = useState(0);
  const [isTablet, setIsTablet] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth >= 640 : false
  );
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined' || !tabletPerPage) return;
    const mq = window.matchMedia('(min-width: 640px)');
    const sync = () => setIsTablet(mq.matches);
    sync();
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  }, [tabletPerPage]);

  const resolvedMobilePerPage = mobilePerPage ?? perPage ?? 1;
  const resolvedMobileCols = mobileColsClass ?? colsClass ?? 'grid-cols-1';
  const resolvedAriaLabel = ariaLabel ?? label ?? 'Trình chiếu nội dung';

  const effectivePerPage = Math.max(1, isTablet && tabletPerPage ? tabletPerPage : resolvedMobilePerPage);
  const effectiveColsClass = isTablet && tabletPerPage ? tabletColsClass : resolvedMobileCols;

  const pages = useMemo(() => {
    const out: Array<Array<{ item: T; globalIndex: number }>> = [];
    for (let i = 0; i < items.length; i += effectivePerPage) {
      out.push(
        items.slice(i, i + effectivePerPage).map((item, offset) => ({
          item,
          globalIndex: i + offset,
        }))
      );
    }
    return out;
  }, [items, effectivePerPage]);

  const totalPages = Math.max(1, pages.length);
  const activePage = Math.min(page, totalPages - 1);

  const goPrev = () => setPage((p) => (Math.min(p, totalPages - 1) > 0 ? Math.min(p, totalPages - 1) - 1 : totalPages - 1));
  const goNext = () => setPage((p) => (Math.min(p, totalPages - 1) < totalPages - 1 ? Math.min(p, totalPages - 1) + 1 : 0));

  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    const touch = e.touches[0];
    if (!touch) return;
    touchStartRef.current = { x: touch.clientX, y: touch.clientY };
  };

  const handleTouchEnd = (e: React.TouchEvent<HTMLDivElement>) => {
    const start = touchStartRef.current;
    touchStartRef.current = null;
    if (!start || totalPages <= 1) return;
    const touch = e.changedTouches[0];
    if (!touch) return;
    const dx = touch.clientX - start.x;
    const dy = touch.clientY - start.y;
    if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy) * 1.15) {
      if (dx < 0) goNext();
      else goPrev();
    }
  };

  const MAX_VISIBLE_DOTS = 6;
  const dotWindowStart =
    totalPages <= MAX_VISIBLE_DOTS
      ? 0
      : Math.max(0, Math.min(activePage - Math.floor(MAX_VISIBLE_DOTS / 2), totalPages - MAX_VISIBLE_DOTS));
  const dotIndices = Array.from(
    { length: Math.min(totalPages, MAX_VISIBLE_DOTS) },
    (_, offset) => dotWindowStart + offset
  );

  return (
    <div
      role="region"
      aria-roledescription="carousel"
      aria-label={resolvedAriaLabel}
      className={`w-full ${className}`}
    >
      <div
        className="overflow-hidden w-full touch-pan-y"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <div
          className="flex transition-transform duration-300 ease-out will-change-transform"
          style={{ transform: `translate3d(-${activePage * 100}%, 0, 0)` }}
        >
          {pages.map((group, pIdx) => (
            <div key={pIdx} className="w-full shrink-0 px-0.5">
              <div className={`grid ${effectiveColsClass} ${gapClass} h-full`}>
                {group.map(({ item, globalIndex }) => (
                  <React.Fragment key={keyExtractor ? keyExtractor(item, globalIndex) : String(globalIndex)}>
                    {renderItem(item, globalIndex)}
                  </React.Fragment>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {totalPages > 1 && (
        <div className="mt-3.5 flex items-center justify-center gap-2">
          <button
            type="button"
            onClick={goPrev}
            aria-label="Trang trước"
            className="w-9 h-9 rounded-full bg-white border border-slate-200 hover:border-[#1E40FF] text-slate-700 hover:text-[#1E40FF] flex items-center justify-center shadow-2xs transition-colors cursor-pointer shrink-0"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/95 border border-slate-200/90 shadow-2xs">
            {dotIndices.map((idx) => {
              const active = idx === activePage;
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setPage(idx)}
                  aria-label={`Chuyển đến slide ${idx + 1}`}
                  aria-current={active ? 'true' : undefined}
                  className="p-0.5 cursor-pointer flex items-center justify-center"
                >
                  <span
                    className={`block h-2 rounded-full transition-all duration-300 ${
                      active
                        ? 'w-5 bg-gradient-to-r from-[#1E40FF] to-[#0EA5E9]'
                        : 'w-2 bg-slate-300 hover:bg-blue-300'
                    }`}
                  />
                </button>
              );
            })}
            {totalPages > 4 && (
              <span className="ml-1.5 pl-1.5 border-l border-slate-200 text-[10.5px] font-mono font-bold text-slate-500 tabular-nums">
                {String(activePage + 1).padStart(2, '0')}/{String(totalPages).padStart(2, '0')}
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={goNext}
            aria-label="Trang tiếp theo"
            className="w-9 h-9 rounded-full bg-white border border-slate-200 hover:border-[#1E40FF] text-slate-700 hover:text-[#1E40FF] flex items-center justify-center shadow-2xs transition-colors cursor-pointer shrink-0"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}

export default ResponsiveSlideDeck;
