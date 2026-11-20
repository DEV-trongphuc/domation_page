import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Calendar, ChevronDown, ChevronLeft, ChevronRight, X } from 'lucide-react';
import {
  UNIFIED_DATE_PRESET_OPTIONS,
  buildUnifiedCalendarMonthGrid,
  createUnifiedDateValue,
  formatIsoToVnDisplay,
  getUnifiedPresetLabel,
  getVnNowParts,
  isValidIsoDate,
  resolveUnifiedDateRange,
  type UnifiedDateFilterValue,
  type UnifiedDatePreset,
} from './unifiedDateFilter';

export interface DomUnifiedDatePickerProps {
  value: UnifiedDateFilterValue;
  onChange: (next: UnifiedDateFilterValue) => void;
  allowAllTime?: boolean;
  lang?: 'vi' | 'en';
  align?: 'left' | 'right' | 'auto';
  showRangeBadge?: boolean;
  compact?: boolean;
  variant?: 'light' | 'auto';
  className?: string;
  buttonTestId?: string;
  popoverTestId?: string;
}

const MONTH_NAMES_VI = [
  'Tháng 1',
  'Tháng 2',
  'Tháng 3',
  'Tháng 4',
  'Tháng 5',
  'Tháng 6',
  'Tháng 7',
  'Tháng 8',
  'Tháng 9',
  'Tháng 10',
  'Tháng 11',
  'Tháng 12',
];

const MONTH_NAMES_EN = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

const WEEKDAYS_VI = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
const WEEKDAYS_EN = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

function readIsDarkMode(): boolean {
  if (typeof document === 'undefined') return false;
  const root = document.documentElement;
  return root.getAttribute('data-theme') === 'dark' || root.classList.contains('dark');
}

export const DomUnifiedDatePicker: React.FC<DomUnifiedDatePickerProps> = ({
  value,
  onChange,
  allowAllTime = true,
  lang = 'vi',
  align = 'auto',
  showRangeBadge = true,
  compact = false,
  variant = 'auto',
  className = '',
  buttonTestId = 'open-date-picker',
  popoverTestId = 'unified-date-picker-popover',
}) => {
  const triggerRef = useRef<HTMLDivElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  const [open, setOpen] = useState(false);
  const [domIsDark, setDomIsDark] = useState<boolean>(() => readIsDarkMode());
  const isDark = variant === 'auto' ? domIsDark : false;
  const [popoverCoords, setPopoverCoords] = useState<{
    isMobile: boolean;
    top: number;
    left: number;
  }>({ isMobile: false, top: 68, left: 12 });

  const effectiveResolved = useMemo(() => {
    if (value.preset === 'all') {
      const fallback = resolveUnifiedDateRange('this_month');
      return {
        since: fallback.since || getVnNowParts().iso,
        until: fallback.until || getVnNowParts().iso,
        isAll: true,
      };
    }
    const r = resolveUnifiedDateRange(value.preset, value.since, value.until);
    const todayIso = getVnNowParts().iso;
    return {
      since: r.since || todayIso,
      until: r.until || todayIso,
      isAll: false,
    };
  }, [value]);

  const [draftPreset, setDraftPreset] = useState<UnifiedDatePreset>(value.preset);
  const [draftStart, setDraftStart] = useState<string>(effectiveResolved.since);
  const [draftEnd, setDraftEnd] = useState<string>(effectiveResolved.until);
  const [pickPhase, setPickPhase] = useState<'start' | 'end'>('start');
  const [calendarMonth, setCalendarMonth] = useState<{ year: number; month: number }>(() => {
    const parts = effectiveResolved.until.split('-').map(Number);
    if (parts[0] && parts[1]) return { year: parts[0], month: parts[1] - 1 };
    const vn = getVnNowParts();
    return { year: vn.year, month: vn.month };
  });

  useEffect(() => {
    if (variant !== 'auto' || typeof document === 'undefined') return;
    const obs = new MutationObserver(() => {
      setDomIsDark(readIsDarkMode());
    });
    obs.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme', 'class'],
    });
    return () => obs.disconnect();
  }, [variant]);

  const presetOptions = useMemo(
    () => UNIFIED_DATE_PRESET_OPTIONS.filter((opt) => allowAllTime || opt.key !== 'all'),
    [allowAllTime]
  );

  const computePopoverCoords = useCallback(() => {
    if (typeof window === 'undefined') {
      return { isMobile: false, top: 68, left: 12 };
    }
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const isMobile = vw < 640;
    if (isMobile) {
      return { isMobile: true, top: 68, left: 12 };
    }
    const rect = triggerRef.current?.getBoundingClientRect();
    if (!rect) {
      return { isMobile: false, top: 68, left: 12 };
    }

    const popW = 596;
    const estH = 496;
    const pad = 12;

    let left: number;
    if (align === 'left') {
      left = rect.left;
    } else if (align === 'right') {
      left = rect.right - popW;
    } else {
      const preferRight = rect.left > vw / 2;
      left = preferRight ? rect.right - popW : rect.left;
    }
    if (left + popW > vw - pad) left = vw - popW - pad;
    if (left < pad) left = pad;

    let top = rect.bottom + 8;
    if (top + estH > vh - pad && rect.top - estH - 8 >= pad) {
      top = rect.top - estH - 8;
    } else if (top + estH > vh - pad) {
      top = Math.max(pad, vh - estH - pad);
    }

    return { isMobile: false, top, left };
  }, [align]);

  useEffect(() => {
    if (!open) return;
    const onRelayout = () => setPopoverCoords(computePopoverCoords());
    window.addEventListener('resize', onRelayout);
    window.addEventListener('scroll', onRelayout, true);
    return () => {
      window.removeEventListener('resize', onRelayout);
      window.removeEventListener('scroll', onRelayout, true);
    };
  }, [open, computePopoverCoords]);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: MouseEvent) => {
      const target = e.target as Node;
      if (triggerRef.current?.contains(target)) return;
      if (popoverRef.current?.contains(target)) return;
      setOpen(false);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  const handleToggleOpen = () => {
    if (!open) {
      setDomIsDark(readIsDarkMode());
      setPopoverCoords(computePopoverCoords());
      setDraftPreset(value.preset);
      setDraftStart(effectiveResolved.since);
      setDraftEnd(effectiveResolved.until);
      setPickPhase('start');
      const parts = effectiveResolved.until.split('-').map(Number);
      if (parts[0] && parts[1]) {
        setCalendarMonth({ year: parts[0], month: parts[1] - 1 });
      }
    }
    setOpen((prev) => !prev);
  };

  const commitSelection = (preset: UnifiedDatePreset, customSince?: string | null, customUntil?: string | null) => {
    const next = createUnifiedDateValue(preset, customSince, customUntil);
    onChange(next);
    setOpen(false);
  };

  const presetLabel = getUnifiedPresetLabel(value.preset, lang);
  const rangeText = effectiveResolved.isAll
    ? lang === 'en'
      ? 'All history'
      : 'Toàn bộ lịch sử'
    : `${formatIsoToVnDisplay(effectiveResolved.since)} - ${formatIsoToVnDisplay(effectiveResolved.until)}`;

  const sMin = draftStart <= draftEnd ? draftStart : draftEnd;
  const sMax = draftStart <= draftEnd ? draftEnd : draftStart;
  const monthGrid = useMemo(
    () => buildUnifiedCalendarMonthGrid(calendarMonth.year, calendarMonth.month),
    [calendarMonth.year, calendarMonth.month]
  );

  const monthNames = lang === 'en' ? MONTH_NAMES_EN : MONTH_NAMES_VI;
  const weekdays = lang === 'en' ? WEEKDAYS_EN : WEEKDAYS_VI;

  const triggerClasses = isDark
    ? 'bg-slate-800/90 hover:bg-slate-800 border-slate-700 text-slate-100'
    : 'bg-slate-50 hover:bg-blue-50/70 border-slate-200/90 text-slate-800';

  const popoverSurfaceClasses = isDark
    ? 'bg-slate-900 border-slate-700/90 text-slate-100'
    : 'bg-white border-slate-200/95 text-slate-800';

  const leftColClasses = isDark
    ? 'bg-slate-950/60 border-slate-800'
    : 'bg-slate-50/65 border-slate-100';

  const popoverNode =
    open && typeof document !== 'undefined'
      ? createPortal(
          <div className="mkt-scope" style={{ display: 'contents' }}>
            {popoverCoords.isMobile && (
              <div
                style={{ zIndex: 10050 }}
                className="fixed inset-0 bg-slate-950/45 backdrop-blur-sm"
                onClick={() => setOpen(false)}
              />
            )}
            <div
              ref={popoverRef}
              data-testid={popoverTestId}
              style={
                popoverCoords.isMobile
                  ? {
                      position: 'fixed',
                      left: '12px',
                      right: '12px',
                      top: '68px',
                      maxHeight: 'calc(100dvh - 84px)',
                      zIndex: 10051,
                    }
                  : {
                      position: 'fixed',
                      top: `${popoverCoords.top}px`,
                      left: `${popoverCoords.left}px`,
                      width: '596px',
                      maxWidth: 'calc(100vw - 24px)',
                      zIndex: 10051,
                    }
              }
              className={`rounded-2xl border border-solid shadow-[0_24px_60px_-15px_rgba(15,23,42,0.28)] overflow-y-auto sm:overflow-hidden flex flex-col sm:flex-row ${popoverSurfaceClasses}`}
            >
              {/* Left Column: Preset Radio List */}
              <div
                className={`sm:w-[196px] shrink-0 border-b sm:border-b-0 sm:border-r border-solid p-2.5 grid grid-cols-2 sm:grid-cols-1 gap-0.5 max-h-48 sm:max-h-none overflow-y-auto ${leftColClasses}`}
              >
                {presetOptions.map((opt) => {
                  const isSelected = draftPreset === opt.key;
                  const optLabel = lang === 'en' ? opt.labelEn : opt.labelVi;
                  return (
                    <button
                      key={opt.key}
                      type="button"
                      data-testid={`date-preset-${opt.key}`}
                      onClick={() => {
                        setDraftPreset(opt.key);
                        if (opt.key === 'all') {
                          commitSelection('all', null, null);
                          return;
                        }
                        if (opt.key !== 'custom_range') {
                          const next = resolveUnifiedDateRange(opt.key);
                          if (next.since && next.until) {
                            setDraftStart(next.since);
                            setDraftEnd(next.until);
                            const parts = next.until.split('-').map(Number);
                            if (parts[0] && parts[1]) {
                              setCalendarMonth({ year: parts[0], month: parts[1] - 1 });
                            }
                          }
                          commitSelection(opt.key, next.since, next.until);
                        }
                      }}
                      className={`w-full px-2.5 py-2 rounded-xl border-0 flex items-center gap-2 text-left text-xs transition-colors cursor-pointer ${
                        isSelected
                          ? isDark
                            ? 'bg-blue-500/20 text-blue-300 font-semibold'
                            : 'bg-blue-50/90 text-[#1E40FF] font-semibold'
                          : isDark
                            ? 'bg-transparent text-slate-300 font-medium hover:bg-slate-800/80'
                            : 'bg-transparent text-slate-600 font-medium hover:bg-white'
                      }`}
                    >
                      <span
                        className={`w-3.5 h-3.5 rounded-full border border-solid flex items-center justify-center shrink-0 ${
                          isSelected
                            ? isDark
                              ? 'border-blue-400'
                              : 'border-[#1E40FF]'
                            : isDark
                              ? 'border-slate-600'
                              : 'border-slate-300'
                        }`}
                      >
                        {isSelected && (
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              isDark ? 'bg-blue-400' : 'bg-[#1E40FF]'
                            }`}
                          />
                        )}
                      </span>
                      <span className="truncate">{optLabel}</span>
                    </button>
                  );
                })}
              </div>

              {/* Right Column: Interactive Monthly Calendar Grid + Summary + Footer */}
              <div className="flex-1 p-4 flex flex-col justify-between gap-3">
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <div
                        className={`text-xs font-bold ${
                          isDark ? 'text-slate-100' : 'text-slate-900'
                        }`}
                      >
                        {lang === 'en' ? 'Select Date Range' : 'Chọn khoảng thời gian'}
                      </div>
                      <div
                        className={`text-[11px] mt-0.5 ${
                          isDark ? 'text-slate-400' : 'text-slate-500'
                        }`}
                      >
                        {pickPhase === 'start'
                          ? lang === 'en'
                            ? 'Click start date'
                            : 'Chạm chọn ngày bắt đầu'
                          : lang === 'en'
                            ? 'Click end date'
                            : 'Chạm chọn ngày kết thúc'}
                      </div>
                    </div>
                    {popoverCoords.isMobile && (
                      <button
                        type="button"
                        onClick={() => setOpen(false)}
                        aria-label={lang === 'en' ? 'Close' : 'Đóng'}
                        className={`w-7 h-7 rounded-lg border-0 flex items-center justify-center cursor-pointer ${
                          isDark
                            ? 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {/* Summary pill: Từ ngày ... → Đến ngày ... */}
                  <div
                    className={`rounded-xl px-3 py-1.5 text-[11px] font-medium flex items-center justify-between gap-2 border border-solid ${
                      isDark
                        ? 'bg-slate-800/80 text-slate-200 border-slate-700/80'
                        : 'bg-blue-50/60 text-slate-700 border-blue-100'
                    }`}
                  >
                    {draftPreset === 'all' ? (
                      <span className="w-full text-center">
                        <strong className={isDark ? 'text-blue-300' : 'text-[#1E40FF]'}>
                          {lang === 'en' ? 'All Time — Full History' : 'Tất cả thời gian — Toàn bộ lịch sử'}
                        </strong>
                      </span>
                    ) : (
                      <>
                        <span>
                          {lang === 'en' ? 'From' : 'Từ ngày'}{' '}
                          <strong className={isDark ? 'text-blue-300' : 'text-[#1E40FF]'}>
                            {formatIsoToVnDisplay(sMin)}
                          </strong>
                        </span>
                        <span className={isDark ? 'text-slate-500' : 'text-slate-400'}>→</span>
                        <span>
                          {lang === 'en' ? 'To' : 'Đến ngày'}{' '}
                          <strong className={isDark ? 'text-blue-300' : 'text-[#1E40FF]'}>
                            {formatIsoToVnDisplay(sMax)}
                          </strong>
                        </span>
                      </>
                    )}
                  </div>

                  {/* Month Navigation */}
                  <div className="flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        setCalendarMonth((prev) =>
                          prev.month === 0
                            ? { year: prev.year - 1, month: 11 }
                            : { year: prev.year, month: prev.month - 1 }
                        )
                      }
                      className={`w-7 h-7 rounded-lg border-0 flex items-center justify-center cursor-pointer ${
                        isDark
                          ? 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                      }`}
                      aria-label={lang === 'en' ? 'Previous month' : 'Tháng trước'}
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <div
                      className={`text-xs sm:text-sm font-bold ${
                        isDark ? 'text-slate-100' : 'text-slate-800'
                      }`}
                    >
                      {monthNames[calendarMonth.month]} {calendarMonth.year}
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        setCalendarMonth((prev) =>
                          prev.month === 11
                            ? { year: prev.year + 1, month: 0 }
                            : { year: prev.year, month: prev.month + 1 }
                        )
                      }
                      className={`w-7 h-7 rounded-lg border-0 flex items-center justify-center cursor-pointer ${
                        isDark
                          ? 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                      }`}
                      aria-label={lang === 'en' ? 'Next month' : 'Tháng sau'}
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Calendar Grid */}
                  <div className="grid grid-cols-7 gap-1 text-center">
                    {weekdays.map((wd) => (
                      <div
                        key={wd}
                        className={`text-[11px] font-semibold py-1 ${
                          isDark ? 'text-slate-400' : 'text-slate-400'
                        }`}
                      >
                        {wd}
                      </div>
                    ))}
                    {monthGrid.map((cell) => {
                      const isAllDraft = draftPreset === 'all';
                      const isEdge = !isAllDraft && (cell.iso === sMin || cell.iso === sMax);
                      const inRange = !isAllDraft && cell.iso > sMin && cell.iso < sMax;
                      return (
                        <button
                          key={cell.iso}
                          type="button"
                          data-date-iso={cell.iso}
                          onClick={() => {
                            setDraftPreset('custom_range');
                            if (pickPhase === 'start') {
                              setDraftStart(cell.iso);
                              setDraftEnd(cell.iso);
                              setPickPhase('end');
                            } else {
                              if (cell.iso < draftStart) {
                                setDraftEnd(draftStart);
                                setDraftStart(cell.iso);
                              } else {
                                setDraftEnd(cell.iso);
                              }
                              setPickPhase('start');
                            }
                          }}
                          className={`h-8 w-full rounded-lg border-0 text-xs font-medium transition-colors cursor-pointer ${
                            isEdge
                              ? 'bg-[#1E40FF] text-white font-bold shadow-sm'
                              : inRange
                                ? isDark
                                  ? 'bg-blue-500/20 text-blue-300 font-semibold'
                                  : 'bg-blue-50 text-[#1E40FF] font-semibold'
                                : cell.inMonth
                                  ? isDark
                                    ? 'bg-transparent text-slate-200 hover:bg-slate-800'
                                    : 'bg-transparent text-slate-700 hover:bg-slate-100'
                                  : isDark
                                    ? 'bg-transparent text-slate-600 hover:bg-slate-800/40'
                                    : 'bg-transparent text-slate-300 hover:bg-slate-50'
                          }`}
                        >
                          {cell.day}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Date Inputs + Apply/Cancel Footer */}
                <div
                  className={`pt-3 border-t border-solid flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center justify-between gap-2 ${
                    isDark ? 'border-slate-800' : 'border-slate-100'
                  }`}
                >
                  <div className="grid grid-cols-2 sm:flex items-center gap-1.5 min-w-0">
                    <input
                      type="date"
                      value={draftStart}
                      style={{ colorScheme: isDark ? 'dark' : 'light' }}
                      onChange={(e) => {
                        const v = e.target.value;
                        if (v) {
                          setDraftPreset('custom_range');
                          setDraftStart(v);
                          if (isValidIsoDate(v)) {
                            const parts = v.split('-').map(Number);
                            if (parts[0] && parts[1]) {
                              setCalendarMonth({ year: parts[0], month: parts[1] - 1 });
                            }
                          }
                        }
                      }}
                      className={`w-full sm:w-[132px] min-w-0 rounded-xl border border-solid px-2.5 py-1.5 text-xs font-medium focus:border-[#1E40FF] outline-none ${
                        isDark
                          ? 'bg-slate-800 border-slate-700 text-slate-100'
                          : 'bg-white border-slate-200 text-slate-700'
                      }`}
                    />
                    <span className="hidden sm:inline text-slate-400 text-xs">-</span>
                    <input
                      type="date"
                      value={draftEnd}
                      style={{ colorScheme: isDark ? 'dark' : 'light' }}
                      onChange={(e) => {
                        const v = e.target.value;
                        if (v) {
                          setDraftPreset('custom_range');
                          setDraftEnd(v);
                          if (isValidIsoDate(v)) {
                            const parts = v.split('-').map(Number);
                            if (parts[0] && parts[1]) {
                              setCalendarMonth({ year: parts[0], month: parts[1] - 1 });
                            }
                          }
                        }
                      }}
                      className={`w-full sm:w-[132px] min-w-0 rounded-xl border border-solid px-2.5 py-1.5 text-xs font-medium focus:border-[#1E40FF] outline-none ${
                        isDark
                          ? 'bg-slate-800 border-slate-700 text-slate-100'
                          : 'bg-white border-slate-200 text-slate-700'
                      }`}
                    />
                  </div>
                  <div className="grid grid-cols-2 sm:flex items-center gap-2 sm:ml-auto">
                    <button
                      type="button"
                      onClick={() => setOpen(false)}
                      className={`px-3 py-2 sm:py-1.5 rounded-xl border-0 text-xs font-semibold cursor-pointer text-center ${
                        isDark
                          ? 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                      }`}
                    >
                      {lang === 'en' ? 'Cancel' : 'Huỷ'}
                    </button>
                    <button
                      type="button"
                      data-testid="date-picker-apply"
                      onClick={() => {
                        if (draftPreset === 'all') {
                          commitSelection('all', null, null);
                          return;
                        }
                        if (isValidIsoDate(draftStart) && isValidIsoDate(draftEnd)) {
                          commitSelection(draftPreset, draftStart, draftEnd);
                        } else {
                          commitSelection(draftPreset);
                        }
                      }}
                      className="px-4 py-2 sm:py-1.5 rounded-xl border-0 bg-[#1E40FF] hover:bg-blue-700 text-xs font-semibold text-white shadow-sm cursor-pointer text-center"
                    >
                      {lang === 'en' ? 'Update' : 'Áp dụng'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>,
          document.body
        )
      : null;

  return (
    <div className="mkt-scope" style={{ display: 'contents' }}>
      <div ref={triggerRef} className={`relative inline-flex items-center gap-2 shrink-0 ${className}`}>
        <button
          type="button"
          data-testid={buttonTestId}
          title={rangeText}
          onClick={handleToggleOpen}
          className={`inline-flex items-center gap-1.5 ${
            compact ? 'px-2.5 py-1.5 text-xs' : 'px-3 py-1.5 lg:px-3.5 lg:py-2 text-xs'
          } rounded-full border border-solid font-semibold cursor-pointer transition-colors ${triggerClasses}`}
        >
          <Calendar className="w-3.5 h-3.5 text-[#1E40FF] shrink-0" />
          <span className="whitespace-nowrap">{presetLabel}</span>
          {showRangeBadge && !effectiveResolved.isAll && (
            <span
              className={`hidden md:inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium tabular-nums whitespace-nowrap ${
                isDark
                  ? 'bg-slate-900/80 text-slate-300 border border-solid border-slate-700/80'
                  : 'bg-white text-slate-500 border border-solid border-slate-200/80'
              }`}
            >
              {formatIsoToVnDisplay(effectiveResolved.since)} - {formatIsoToVnDisplay(effectiveResolved.until)}
            </span>
          )}
          <ChevronDown
            className={`w-3.5 h-3.5 shrink-0 transition-transform ${
              open ? 'rotate-180' : ''
            } ${isDark ? 'text-slate-400' : 'text-slate-400'}`}
          />
        </button>
        {popoverNode}
      </div>
    </div>
  );
};

export default DomUnifiedDatePicker;
