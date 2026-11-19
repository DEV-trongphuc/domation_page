import React, { useEffect, useId, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Check, ChevronDown } from 'lucide-react';

export interface DomMetaSelectOption {
  value: string | number;
  label: string;
  group?: string;
  description?: string;
  disabled?: boolean;
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
      ? 'rounded-lg px-2.5 py-1 text-xs font-semibold'
      : variant === 'rounded'
        ? 'rounded-xl px-3 py-2 text-xs font-semibold'
        : 'rounded-full px-3.5 py-1.5 text-xs font-medium';

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
        <span className="inline-flex items-center gap-1.5 min-w-0">
          {icon && <span className="shrink-0 text-slate-500">{icon}</span>}
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
                      <div className="min-w-0 flex-1">
                        <div className="truncate">{opt.label}</div>
                        {opt.description && (
                          <div className="text-[10.5px] font-normal text-slate-400 truncate mt-0.5">
                            {opt.description}
                          </div>
                        )}
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
