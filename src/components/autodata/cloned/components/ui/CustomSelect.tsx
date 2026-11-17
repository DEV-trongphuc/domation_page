import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Search, Check } from 'lucide-react';
import styles from './CustomSelect.module.css';
import { motion, AnimatePresence } from 'framer-motion';
import { Avatar } from './Avatar';
import { useLanguage } from '../../contexts/LanguageContext';
import toast from 'react-hot-toast';

export interface SelectOption {
  value: string | number;
  label: string;
  icon?: React.ReactNode;
  avatar?: string;
  sublabel?: string;
  disabled?: boolean;
  disabledReason?: string;
  disabledType?: 'round' | 'sale';
}

export type CustomSelectValue = string | number | boolean | Array<string | number>;

export interface CustomSelectProps {
  options: SelectOption[];
  value: CustomSelectValue | null | undefined;
  onChange(value: CustomSelectValue): void;
  placeholder?: string;
  label?: string;
  searchable?: boolean;
  showAvatars?: boolean;
  width?: string | number;
  direction?: 'up' | 'down';
  multiple?: boolean;
  align?: 'left' | 'right';
  size?: 'sm' | 'md';
  hideTriggerSublabel?: boolean;
}

export const CustomSelect: React.FC<CustomSelectProps> = ({
  options,
  value,
  onChange,
  placeholder = 'Chọn...',
  label,
  searchable = false,
  showAvatars = false,
  width,
  direction = 'down',
  multiple = false,
  align = 'left',
  size = 'md',
  hideTriggerSublabel = false
}) => {
  const { t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [computedAlign, setComputedAlign] = useState<'left' | 'right'>(align);
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  useEffect(() => {
    if (isOpen && searchable) {
      const frame = requestAnimationFrame(() => {
        searchInputRef.current?.focus({ preventScroll: true });
      });
      return () => cancelAnimationFrame(frame);
    }
    return undefined;
  }, [isOpen, searchable]);

  const handleToggleTrigger = () => {
    const nextOpen = !isOpen;
    if (nextOpen) {
      if (align === 'right') {
        setComputedAlign('right');
      } else if (containerRef.current && typeof window !== 'undefined') {
        const rect = containerRef.current.getBoundingClientRect();
        const spaceRight = window.innerWidth - rect.left;
        setComputedAlign(spaceRight < 280 && rect.right > 280 ? 'right' : 'left');
      }
    }
    setIsOpen(nextOpen);
  };

  const selectedOption = multiple ? null : options.find(opt => opt.value == value);
  const filtered = searchable ? options.filter(o =>
    t(o.label).toLowerCase().includes(search.toLowerCase()) ||
    (o.sublabel && t(o.sublabel).toLowerCase().includes(search.toLowerCase()))
  ) : options;

  const isSelected = (val: string | number) => {
    if (multiple) {
      return Array.isArray(value) && value.some(v => String(v) === String(val));
    }
    return value == val;
  };

  const handleSelect = (option: SelectOption, e: React.MouseEvent) => {
    e.stopPropagation();
    if (option.disabled) {
      const reason = option.disabledReason ||
        (option.disabledType === 'round' ? t('Vòng không hoạt động') :
          option.disabledType === 'sale' ? t('Đại lý không hoạt động') :
            t('Lựa chọn này không hoạt động'));
      toast.error(reason);
      return;
    }
    const val = option.value;
    if (multiple) {
      const arr = Array.isArray(value) ? [...value] : [];
      if (val === 'all') {
        onChange(['all']);
      } else {
        const hasVal = arr.some(v => String(v) === String(val));
        const newArr = hasVal
          ? arr.filter(v => String(v) !== String(val))
          : [...arr.filter(v => String(v) !== 'all'), val];
        if (newArr.length === 0) onChange(['all']);
        else onChange(newArr);
      }
    } else {
      onChange(val);
      setIsOpen(false);
      setSearch('');
    }
  };

  const renderOptionLeading = (opt: SelectOption) => {
    if (showAvatars) {
      if (opt.value === '') {
        return (
          <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'var(--color-border-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-muted)', flexShrink: 0 }}>?</div>
        );
      }
      if (opt.icon && !opt.avatar && (opt.value === 'all' || opt.value === '')) {
        return (
          <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'var(--color-primary-light)', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            {opt.icon}
          </div>
        );
      }
      return <Avatar src={opt.avatar} name={t(opt.label)} size="sm" style={{ flexShrink: 0 }} />;
    }
    if (opt.icon) {
      return <span style={{ display: 'flex', flexShrink: 0 }}>{opt.icon}</span>;
    }
    return null;
  };

  const renderTriggerContent = () => {
    if (multiple) {
      const arr = Array.isArray(value) ? value : [];
      if (arr.length === 0 || arr.some(v => String(v) === 'all')) {
        const allOption = options.find(o => String(o.value) === 'all');
        return (
          <span className={styles.triggerContent}>
            {allOption?.icon && <span style={{ display: 'flex', flexShrink: 0 }}>{allOption.icon}</span>}
            <span className={styles.triggerText}>{allOption ? t(allOption.label) : t(placeholder)}</span>
          </span>
        );
      }
      const selectedOpts = options.filter(o => arr.some(v => String(v) === String(o.value)));
      if (selectedOpts.length === 1) {
        return (
          <span className={styles.triggerContent}>
            {!showAvatars && selectedOpts[0].icon && <span style={{ display: 'flex', flexShrink: 0 }}>{selectedOpts[0].icon}</span>}
            <span className={styles.triggerText}>{t(selectedOpts[0].label)}</span>
          </span>
        );
      }
      return (
        <span className={styles.triggerContent}>
          <span className={styles.triggerText}>{t('Đã chọn')} ({selectedOpts.length})</span>
        </span>
      );
    }
    return selectedOption ? (
      <span className={styles.triggerContent}>
        {renderOptionLeading(selectedOption)}
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          <span className={styles.triggerText}>{t(selectedOption.label)}</span>
          {!hideTriggerSublabel && selectedOption.sublabel && (
            <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', fontWeight: 400, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>({t(selectedOption.sublabel)})</span>
          )}
        </span>
      </span>
    ) : (
      <span className={styles.triggerText}>{t(placeholder)}</span>
    );
  };

  const wrapperStyle: React.CSSProperties =
    typeof width === 'number'
      ? { minWidth: width, width: 'auto', maxWidth: Math.max(width + 120, 300) }
      : width
      ? { width }
      : {};

  return (
    <div className={styles.wrapper} ref={containerRef} style={wrapperStyle}>
      {label && <label className={styles.label}>{t(label)}</label>}
      <div
        className={`${styles.trigger} ${isOpen ? styles.open : ''}`}
        onClick={handleToggleTrigger}
        style={{
          ...(size === 'sm' ? {
            minHeight: '32px',
            padding: '4px 10px',
            fontSize: '0.8rem',
            borderRadius: 'var(--radius-md)'
          } : {}),
          ...((size === 'sm' && isOpen) ? {
            boxShadow: '0 0 0 3px rgba(30, 64, 255, 0.1)'
          } : {})
        }}
      >
        <span className={(multiple && Array.isArray(value) && value.length > 0) || selectedOption ? styles.selectedValue : styles.placeholder}>
          {renderTriggerContent()}
        </span>
        <ChevronDown size={size === 'sm' ? 14 : 16} className={`${styles.icon} ${isOpen ? styles.iconOpen : ''}`} />
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: direction === 'down' ? -18 : 18, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: direction === 'down' ? -18 : 18, scale: 0.96 }}
            transition={{ type: "spring", duration: 0.32, bounce: 0.05 }}
            className={styles.dropdown}
            style={{
              top: direction === 'down' ? 'calc(100% + 0.5rem)' : 'auto',
              bottom: direction === 'up' ? 'calc(100% + 0.5rem)' : 'auto',
              left: computedAlign === 'right' ? 'auto' : 0,
              right: computedAlign === 'right' ? 0 : 'auto',
              minWidth: (searchable || showAvatars) ? 'max(100%, 240px)' : '100%',
              transformOrigin: direction === 'down' ? 'top' : 'bottom'
            }}
          >
            {searchable && (
              <div className={styles.searchBox}>
                <Search size={14} className={styles.searchIcon} />
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder={t("Tìm kiếm...")}
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  onClick={e => e.stopPropagation()}
                  className={styles.searchInput}
                />
              </div>
            )}
            <div className={`${styles.list} custom-scrollbar`}>
              {filtered.length > 0 ? filtered.map((option) => (
                <div
                  key={option.value}
                  className={`${styles.option} ${isSelected(option.value) ? styles.optionSelected : ''} ${option.disabled ? styles.optionDisabled : ''}`}
                  onClick={(e) => handleSelect(option, e)}
                >
                  <div className={styles.optionLabel}>
                    {renderOptionLeading(option)}
                    <div className={styles.optionText}>
                      <span className={styles.optionMainLabel}>{t(option.label)}</span>
                      {option.sublabel && <span className={styles.optionSublabel}>{t(option.sublabel)}</span>}
                    </div>
                  </div>
                  {isSelected(option.value) && <Check size={14} className={styles.checkIcon} />}
                </div>
              )) : (
                <div className={styles.empty}>{t("Không tìm thấy")}</div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
