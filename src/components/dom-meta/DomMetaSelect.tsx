import React, { useEffect, useId, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Check, ChevronDown, MoreHorizontal } from 'lucide-react';

export interface DomMetaSelectOption {
  value: string | number;
  label: string;
  group?: string;
  description?: string;
  disabled?: boolean;
  icon?: React.ReactNode;
  avatarUrl?: string;
}

export interface DomMetaSelectProps {
  value: string | number;
  options: DomMetaSelectOption[];
  onChange: (value: string) => void;
  placeholder?: string;
  icon?: React.ReactNode;
  ariaLabel?: string;
  testId?: string;
  disabled?: boolean;
  variant?: 'pill' | 'rounded' | 'compact';
  align?: 'left' | 'right';
  className?: string;
  menuClassName?: string;
}

export const DomMetaSelect: React.FC<DomMetaSelectProps> = ({
  value,
  options,
  onChange,
  placeholder = 'Chọn...',
  icon,
  ariaLabel,
  testId,
  disabled = false,
  variant = 'pill',
  align = 'left',
  className = '',
  menuClassName = '',
}) => {
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState<{
    top: number;
    left: number;
    minWidth: number;
    maxWidth: number;
    openUp: boolean;
  } | null>(null);

  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const menuId = useId();

  const selectedOption = useMemo(
    () => options.find((opt) => String(opt.value) === String(value)),
    [options, value]
  );

  const groupedSections = useMemo(() => {
    const sections: Array<{ group: string | null; items: DomMetaSelectOption[] }> = [];
    for (const opt of options) {
      const grp = opt.group || null;
      const last = sections[sections.length - 1];
      if (!last || last.group !== grp) {
        sections.push({ group: grp, items: [opt] });
      } else {
        last.items.push(opt);
      }
    }
    return sections;
  }, [options]);

  const updatePosition = () => {
    if (!triggerRef.current || typeof window === 'undefined') return;
    const rect = triggerRef.current.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const estimatedMenuHeight = Math.min(300, Math.max(120, options.length * 36 + 24));
    const spaceBelow = vh - rect.bottom - 12;
    const spaceAbove = rect.top - 12;
    const openUp = spaceBelow < estimatedMenuHeight && spaceAbove > spaceBelow;
    const minWidth = Math.max(rect.width, 176);
    const maxWidth = Math.min(340, vw - 16);
    let left = align === 'right' ? rect.right - minWidth : rect.left;
    left = Math.max(8, Math.min(left, vw - minWidth - 8));
    const top = openUp ? Math.max(8, rect.top - 6) : Math.min(vh - 8, rect.bottom + 6);
    setCoords({ top, left, minWidth, maxWidth, openUp });
  };

  useEffect(() => {
    if (!open) return;
    updatePosition();

    const handlePointerDown = (e: MouseEvent | TouchEvent) => {
      const target = e.target as Node | null;
      if (!target) return;
      if (triggerRef.current?.contains(target)) return;
      if (menuRef.current?.contains(target)) return;
      setOpen(false);
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false);
      }
    };

    const handleScrollOrResize = (e: Event) => {
      if (menuRef.current && e.target instanceof Node && menuRef.current.contains(e.target)) {
        return;
      }
      updatePosition();
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('touchstart', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    window.addEventListener('scroll', handleScrollOrResize, true);
    window.addEventListener('resize', handleScrollOrResize);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('touchstart', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('scroll', handleScrollOrResize, true);
      window.removeEventListener('resize', handleScrollOrResize);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, options.length, align]);

  const baseTriggerStyle =
    variant === 'compact'
      ? 'rounded-lg px-2.5 py-1.5 text-xs font-semibold'
      : variant === 'rounded'
        ? 'rounded-xl px-3.5 py-2 text-xs font-semibold'
        : 'rounded-full px-3.5 py-2 text-xs font-semibold';

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        data-testid={testId}
        disabled={disabled}
        onClick={() => {
          if (disabled) return;
          setOpen((v) => !v);
        }}
        className={`inline-flex items-center justify-between gap-2 bg-slate-50/90 hover:bg-white border transition-colors outline-none select-none cursor-pointer disabled:opacity-65 disabled:cursor-not-allowed ${
          open
            ? 'border-[#1E40FF] bg-white text-[#1E40FF] ring-2 ring-[#1E40FF]/12'
            : 'border-slate-200/90 text-slate-700 hover:border-slate-300'
        } ${baseTriggerStyle} ${className}`}
      >
        <span className="inline-flex items-center gap-2 min-w-0">
          {selectedOption?.avatarUrl ? (
            <img
              src={selectedOption.avatarUrl}
              alt=""
              className="w-4 h-4 rounded-full object-cover shrink-0 border border-slate-200/80 bg-white"
            />
          ) : selectedOption?.icon ? (
            <span className="shrink-0 flex items-center">{selectedOption.icon}</span>
          ) : (
            icon && <span className="shrink-0 text-slate-500 flex items-center">{icon}</span>
          )}
          <span className="truncate">{selectedOption ? selectedOption.label : placeholder}</span>
        </span>
        <ChevronDown
          className={`w-3.5 h-3.5 shrink-0 transition-transform duration-150 ${
            open ? 'rotate-180 text-[#1E40FF]' : 'text-slate-400'
          }`}
        />
      </button>

      {open &&
        coords &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            ref={menuRef}
            id={menuId}
            role="listbox"
            style={{
              position: 'fixed',
              left: coords.left,
              top: coords.top,
              minWidth: coords.minWidth,
              maxWidth: coords.maxWidth,
              transform: coords.openUp ? 'translateY(-100%)' : undefined,
              zIndex: 2147483645,
            }}
            className={`max-h-[280px] overflow-y-auto rounded-2xl bg-white/95 backdrop-blur-xl border border-slate-200/90 shadow-[0_14px_38px_rgba(15,23,42,0.14)] p-1.5 text-slate-700 ${menuClassName}`}
          >
            {groupedSections.map((sec, secIdx) => (
              <div key={`${sec.group || 'ungrouped'}-${secIdx}`} className="py-0.5">
                {sec.group && (
                  <div className="px-2.5 pt-2 pb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    {sec.group}
                  </div>
                )}
                {sec.items.map((opt) => {
                  const isSelected = String(opt.value) === String(value);
                  return (
                    <button
                      key={`${String(opt.value)}-${opt.label}`}
                      type="button"
                      role="option"
                      aria-selected={isSelected}
                      disabled={opt.disabled}
                      onClick={() => {
                        if (opt.disabled) return;
                        onChange(String(opt.value));
                        setOpen(false);
                      }}
                      className={`w-full px-2.5 py-2 rounded-xl text-left text-xs flex items-center justify-between gap-2.5 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
                        isSelected
                          ? 'bg-[#F4F8FF] text-[#1E40FF] font-semibold'
                          : 'text-slate-700 hover:bg-slate-100/80 font-medium'
                      }`}
                    >
                      <div className="min-w-0 flex-1 flex items-center gap-2">
                        {opt.avatarUrl ? (
                          <img
                            src={opt.avatarUrl}
                            alt=""
                            className="w-[18px] h-[18px] rounded-full object-cover shrink-0 border border-slate-200 bg-white"
                          />
                        ) : opt.icon ? (
                          <span className="shrink-0 flex items-center">{opt.icon}</span>
                        ) : null}
                        <div className="min-w-0 flex-1">
                          <div className="truncate">{opt.label}</div>
                          {opt.description && (
                            <div className="text-[10.5px] font-normal text-slate-400 truncate mt-0.5">
                              {opt.description}
                            </div>
                          )}
                        </div>
                      </div>
                      {isSelected && <Check className="w-3.5 h-3.5 text-[#1E40FF] shrink-0" />}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>,
          document.body
        )}
    </>
  );
};

export interface DomSubtabItem {
  id: string;
  label: string;
  shortLabel?: string;
  icon?: React.ReactNode;
  badge?: string | number;
  testId?: string;
}

export const DomResponsiveSubtabs: React.FC<{
  tabs: DomSubtabItem[];
  value?: string;
  activeId?: string;
  onChange: (id: string) => void;
  maxMobile?: number;
  maxTablet?: number;
  maxDesktop?: number;
  variant?: 'pill' | 'segmented';
  className?: string;
  moreLabel?: string;
}> = ({
  tabs,
  value,
  activeId,
  onChange,
  maxMobile = 2,
  maxTablet = 3,
  maxDesktop = 5,
  variant = 'pill',
  className = '',
  moreLabel = 'Khác',
}) => {
  const resolvedValue = value ?? activeId ?? '';
  const [open, setOpen] = useState(false);
  const [vw, setVw] = useState<number>(() =>
    typeof window !== 'undefined' ? window.innerWidth : 1280
  );
  const [coords, setCoords] = useState<{
    top: number;
    left: number;
    minWidth: number;
    maxWidth: number;
    openUp: boolean;
  } | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const onResize = () => setVw(window.innerWidth);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // On mobile (< 640px), strictly enforce <= 2 horizontal buttons total:
  // if <= 2 tabs exist, render both inline; if >= 3 tabs exist, render 1 inline tab + 1 `⋯` overflow dropdown (= 2 buttons total, zero clipping!).
  const effectiveMobileInline = tabs.length > 2 ? Math.min(maxMobile, 1) : tabs.length;
  const maxInline = vw < 640 ? effectiveMobileInline : vw < 1024 ? maxTablet : maxDesktop;
  const needsOverflow = tabs.length > maxInline;
  const inlineCount = needsOverflow ? Math.max(1, maxInline) : tabs.length;
  const inlineTabs = tabs.slice(0, inlineCount);
  const overflowTabs = needsOverflow ? tabs.slice(inlineCount) : [];
  const activeOverflowTab = overflowTabs.find((t) => t.id === resolvedValue);

  const updatePos = () => {
    if (!triggerRef.current || typeof window === 'undefined') return;
    const rect = triggerRef.current.getBoundingClientRect();
    const winW = window.innerWidth;
    const winH = window.innerHeight;
    const estH = Math.min(300, overflowTabs.length * 40 + 20);
    const openUp = winH - rect.bottom - 12 < estH && rect.top > winH - rect.bottom;
    const minWidth = Math.min(220, winW - 16);
    const maxWidth = Math.min(300, winW - 16);
    const left = Math.max(8, Math.min(rect.right - minWidth, winW - minWidth - 8));
    const top = openUp ? Math.max(8, rect.top - 6) : Math.min(winH - 8, rect.bottom + 6);
    setCoords({ top, left, minWidth, maxWidth, openUp });
  };

  useEffect(() => {
    if (!open) return;
    updatePos();
    const onDown = (e: MouseEvent | TouchEvent) => {
      const t = e.target as Node | null;
      if (!t) return;
      if (triggerRef.current?.contains(t) || menuRef.current?.contains(t)) return;
      setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    const onScroll = () => updatePos();
    document.addEventListener('mousedown', onDown);
    document.addEventListener('touchstart', onDown);
    document.addEventListener('keydown', onKey);
    window.addEventListener('scroll', onScroll, true);
    window.addEventListener('resize', onScroll);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('touchstart', onDown);
      document.removeEventListener('keydown', onKey);
      window.removeEventListener('scroll', onScroll, true);
      window.removeEventListener('resize', onScroll);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, overflowTabs.length]);

  const containerCls =
    variant === 'segmented'
      ? 'inline-flex items-center gap-1 p-1 rounded-xl bg-slate-100/90 border border-slate-200/75 max-w-full min-w-0 overflow-hidden flex-nowrap'
      : 'inline-flex items-center gap-1.5 max-w-full min-w-0 overflow-hidden flex-nowrap';

  const getTabCls = (active: boolean, isOverflowBtn = false) =>
    variant === 'segmented'
      ? `px-2.5 sm:px-3 py-1.5 rounded-lg text-xs whitespace-nowrap transition-all cursor-pointer inline-flex items-center justify-center gap-1.5 min-w-0 ${
          isOverflowBtn ? 'shrink-0' : 'shrink'
        } dom-ios-press ${
          active
            ? 'bg-white text-[#1E40FF] font-bold shadow-xs'
            : 'text-slate-600 font-medium hover:text-slate-900'
        }`
      : `px-2.5 sm:px-3 py-1.5 rounded-full text-xs whitespace-nowrap transition-all cursor-pointer inline-flex items-center justify-center gap-1.5 min-w-0 ${
          isOverflowBtn ? 'shrink-0' : 'shrink'
        } dom-ios-press ${
          active
            ? 'bg-[#1E40FF] text-white font-semibold shadow-xs'
            : 'bg-slate-100 hover:bg-slate-200/80 text-slate-600 font-medium'
        }`;

  return (
    <div className={`${containerCls} ${className}`}>
      {inlineTabs.map((t) => {
        const active = t.id === resolvedValue;
        return (
          <button
            key={t.id}
            type="button"
            data-testid={t.testId}
            onClick={() => onChange(t.id)}
            className={getTabCls(active, false)}
          >
            {t.icon && <span className="shrink-0 flex items-center">{t.icon}</span>}
            <span className="min-w-0 truncate max-w-[140px] sm:max-w-[175px]">
              {vw < 640 && t.shortLabel ? t.shortLabel : t.label}
            </span>
            {t.badge !== undefined && (
              <span
                className={`shrink-0 px-1.5 py-0.5 rounded-full text-[10px] font-bold tabular-nums ${
                  active
                    ? variant === 'segmented'
                      ? 'bg-blue-50 text-[#1E40FF]'
                      : 'bg-white/20 text-white'
                    : 'bg-slate-200/80 text-slate-600'
                }`}
              >
                {t.badge}
              </span>
            )}
          </button>
        );
      })}

      {overflowTabs.length > 0 && (
        <>
          <button
            ref={triggerRef}
            type="button"
            aria-label="Mở thêm tab"
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
            className={getTabCls(Boolean(activeOverflowTab), true)}
          >
            <MoreHorizontal className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate max-w-[96px] sm:max-w-[125px]">
              {activeOverflowTab
                ? activeOverflowTab.shortLabel || activeOverflowTab.label
                : `${moreLabel} (${overflowTabs.length})`}
            </span>
            <ChevronDown
              className={`w-3 h-3 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`}
            />
          </button>

          {open &&
            coords &&
            typeof document !== 'undefined' &&
            createPortal(
              <div
                ref={menuRef}
                role="menu"
                style={{
                  position: 'fixed',
                  left: coords.left,
                  top: coords.top,
                  minWidth: coords.minWidth,
                  maxWidth: coords.maxWidth,
                  transform: coords.openUp ? 'translateY(-100%)' : undefined,
                  zIndex: 2147483645,
                }}
                className="max-h-[300px] overflow-y-auto rounded-2xl bg-white border border-slate-200/95 shadow-[0_16px_42px_rgba(15,23,42,0.18)] p-1.5 text-slate-700 space-y-0.5"
              >
                {overflowTabs.map((t) => {
                  const active = t.id === resolvedValue;
                  return (
                    <button
                      key={t.id}
                      type="button"
                      role="menuitem"
                      data-testid={t.testId}
                      onClick={() => {
                        onChange(t.id);
                        setOpen(false);
                      }}
                      className={`w-full px-3 py-2.5 rounded-xl text-left text-xs flex items-center justify-between gap-2.5 cursor-pointer transition-colors ${
                        active
                          ? 'bg-[#F4F8FF] text-[#1E40FF] font-bold'
                          : 'text-slate-700 hover:bg-slate-100 font-medium'
                      }`}
                    >
                      <span className="inline-flex items-center gap-2 min-w-0">
                        {t.icon && <span className="shrink-0 flex items-center">{t.icon}</span>}
                        <span className="truncate">{t.label}</span>
                      </span>
                      <span className="inline-flex items-center gap-1.5 shrink-0">
                        {t.badge !== undefined && (
                          <span className="px-1.5 py-0.5 rounded-full bg-slate-100 text-[10px] font-bold text-slate-600 tabular-nums">
                            {t.badge}
                          </span>
                        )}
                        {active && <Check className="w-3.5 h-3.5 text-[#1E40FF]" />}
                      </span>
                    </button>
                  );
                })}
              </div>,
              document.body
            )}
        </>
      )}
    </div>
  );
};

export interface DomOverflowActionItem {
  id: string;
  label: string;
  description?: string;
  icon?: React.ReactNode;
  badge?: string | number;
  danger?: boolean;
  active?: boolean;
  testId?: string;
  onClick: () => void;
}

export const DomOverflowMenu: React.FC<{
  items: DomOverflowActionItem[];
  ariaLabel?: string;
  testId?: string;
  label?: string;
  badgeCount?: number;
  variant?: 'icon' | 'pill' | 'dark-icon';
  className?: string;
}> = ({
  items,
  ariaLabel = 'Tùy chọn khác',
  testId,
  label,
  badgeCount = 0,
  variant = 'icon',
  className = '',
}) => {
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState<{
    top: number;
    left: number;
    minWidth: number;
    maxWidth: number;
    openUp: boolean;
  } | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);

  const updatePos = () => {
    if (!triggerRef.current || typeof window === 'undefined') return;
    const rect = triggerRef.current.getBoundingClientRect();
    const winW = window.innerWidth;
    const winH = window.innerHeight;
    const estH = Math.min(320, items.length * 44 + 20);
    const openUp = winH - rect.bottom - 12 < estH && rect.top > winH - rect.bottom;
    const minWidth = Math.min(236, winW - 16);
    const maxWidth = Math.min(300, winW - 16);
    const left = Math.max(8, Math.min(rect.right - minWidth, winW - minWidth - 8));
    const top = openUp ? Math.max(8, rect.top - 6) : Math.min(winH - 8, rect.bottom + 6);
    setCoords({ top, left, minWidth, maxWidth, openUp });
  };

  useEffect(() => {
    if (!open) return;
    updatePos();
    const onDown = (e: MouseEvent | TouchEvent) => {
      const t = e.target as Node | null;
      if (!t) return;
      if (triggerRef.current?.contains(t) || menuRef.current?.contains(t)) return;
      setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    const onScroll = () => updatePos();
    document.addEventListener('mousedown', onDown);
    document.addEventListener('touchstart', onDown);
    document.addEventListener('keydown', onKey);
    window.addEventListener('scroll', onScroll, true);
    window.addEventListener('resize', onScroll);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('touchstart', onDown);
      document.removeEventListener('keydown', onKey);
      window.removeEventListener('scroll', onScroll, true);
      window.removeEventListener('resize', onScroll);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, items.length]);

  if (items.length === 0) return null;

  const btnCls =
    variant === 'dark-icon'
      ? 'relative w-9 h-9 rounded-xl bg-white/12 hover:bg-white/20 border border-white/15 text-white flex items-center justify-center shrink-0 cursor-pointer dom-ios-press'
      : variant === 'pill'
        ? 'relative inline-flex items-center gap-1.5 px-3 py-2 rounded-full bg-slate-100 hover:bg-slate-200/80 border border-slate-200/90 text-xs font-semibold text-slate-700 shrink-0 cursor-pointer dom-ios-press'
        : 'relative w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200/80 border border-slate-200/90 text-slate-700 flex items-center justify-center shrink-0 cursor-pointer dom-ios-press';

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        aria-label={ariaLabel}
        aria-expanded={open}
        data-testid={testId}
        onClick={() => setOpen((v) => !v)}
        className={`${btnCls} ${className}`}
      >
        <MoreHorizontal className="w-4 h-4 shrink-0" />
        {label && <span className="truncate">{label}</span>}
        {badgeCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full bg-rose-500 text-white text-[9.5px] font-bold flex items-center justify-center">
            {badgeCount}
          </span>
        )}
      </button>

      {open &&
        coords &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            ref={menuRef}
            role="menu"
            style={{
              position: 'fixed',
              left: coords.left,
              top: coords.top,
              minWidth: coords.minWidth,
              maxWidth: coords.maxWidth,
              transform: coords.openUp ? 'translateY(-100%)' : undefined,
              zIndex: 2147483645,
            }}
            className="max-h-[340px] overflow-y-auto rounded-2xl bg-white border border-slate-200/95 shadow-[0_18px_46px_rgba(15,23,42,0.2)] p-1.5 text-slate-700 space-y-0.5"
          >
            {items.map((item) => (
              <button
                key={item.id}
                type="button"
                role="menuitem"
                data-testid={item.testId}
                onClick={() => {
                  setOpen(false);
                  item.onClick();
                }}
                className={`w-full px-3 py-2.5 rounded-xl text-left text-xs flex items-center justify-between gap-2.5 cursor-pointer transition-colors ${
                  item.danger
                    ? 'text-rose-600 hover:bg-rose-50 font-semibold'
                    : item.active
                      ? 'bg-[#F4F8FF] text-[#1E40FF] font-bold'
                      : 'text-slate-700 hover:bg-slate-100 font-medium'
                }`}
              >
                <div className="min-w-0 flex-1 flex items-center gap-2.5">
                  {item.icon && (
                    <span className="w-6 h-6 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center shrink-0">
                      {item.icon}
                    </span>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="truncate">{item.label}</div>
                    {item.description && (
                      <div className="text-[10.5px] font-normal text-slate-400 truncate">
                        {item.description}
                      </div>
                    )}
                  </div>
                </div>
                {item.badge !== undefined && (
                  <span className="px-1.5 py-0.5 rounded-full bg-rose-50 text-rose-600 text-[10px] font-bold shrink-0 tabular-nums">
                    {item.badge}
                  </span>
                )}
              </button>
            ))}
          </div>,
          document.body
        )}
    </>
  );
};
