import React, { useMemo, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export interface ResponsiveSlideDeckProps<T> {
  items: readonly T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  keyExtractor: (item: T, index: number) => string;
  mobilePerPage?: number;
  mobileColsClass?: string;
  gapClass?: string;
  ariaLabel?: string;
  className?: string;
}

/**
 * Mobile/Tablet touch-swipeable carousel with SlideDots & Prev/Next controls.
 * Designed for compact mobile presentation (< lg) alongside desktop multi-column grids.
 */
export function ResponsiveSlideDeck<T>({
  items,
  renderItem,
  keyExtractor,
  mobilePerPage = 1,
  mobileColsClass = 'grid-cols-1',
  gapClass = 'gap-3',
  ariaLabel = 'Trình chiếu nội dung',
  className = '',
}: ResponsiveSlideDeckProps<T>) {
  const [page, setPage] = useState(0);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);

  const pages = useMemo(() => {
    const safePerPage = Math.max(1, mobilePerPage);
    const out: Array<Array<{ item: T; globalIndex: number }>> = [];
    for (let i = 0; i < items.length; i += safePerPage) {
      out.push(
        items.slice(i, i + safePerPage).map((item, offset) => ({
          item,
          globalIndex: i + offset,
        }))
      );
    }
    return out;
  }, [items, mobilePerPage]);

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
      aria-label={ariaLabel}
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
              <div className={`grid ${mobileColsClass} ${gapClass} h-full`}>
                {group.map(({ item, globalIndex }) => (
                  <React.Fragment key={keyExtractor(item, globalIndex)}>
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
