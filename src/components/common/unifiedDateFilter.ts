import { useCallback, useEffect, useMemo, useState } from 'react';

export type UnifiedDatePreset =
  | 'today'
  | 'yesterday'
  | 'yesterday_to_today'
  | 'last_7days'
  | 'last_30days'
  | 'this_week'
  | 'last_week'
  | 'this_month'
  | 'last_month'
  | 'all'
  | 'custom_range';

export interface UnifiedDateFilterValue {
  preset: UnifiedDatePreset;
  since: string | null;
  until: string | null;
}

export interface UnifiedDatePresetOption {
  key: UnifiedDatePreset;
  labelVi: string;
  labelEn: string;
}

export const UNIFIED_DATE_STORAGE_KEY = 'domation_global_date_v2';
export const LEGACY_DATE_STORAGE_KEY = 'domation_global_date';
export const LEGACY_ERP_DATE_STORAGE_KEY = 'Ideas_global_date';
export const UNIFIED_DATE_CHANGE_EVENT = 'domation-global-date-change';
export const LEGACY_DATE_CHANGE_EVENT = 'global-date-change';

const VN_OFFSET_MS = 7 * 60 * 60 * 1000;

export const UNIFIED_DATE_PRESET_OPTIONS: UnifiedDatePresetOption[] = [
  { key: 'today', labelVi: 'Hôm nay', labelEn: 'Today' },
  { key: 'yesterday', labelVi: 'Hôm qua', labelEn: 'Yesterday' },
  { key: 'yesterday_to_today', labelVi: 'Hôm qua - Hôm nay', labelEn: 'Yesterday - Today' },
  { key: 'last_7days', labelVi: '7 ngày qua', labelEn: 'Last 7 days' },
  { key: 'last_30days', labelVi: '30 ngày qua', labelEn: 'Last 30 days' },
  { key: 'this_week', labelVi: 'Tuần này', labelEn: 'This Week' },
  { key: 'last_week', labelVi: 'Tuần trước', labelEn: 'Last Week' },
  { key: 'this_month', labelVi: 'Tháng này', labelEn: 'This Month' },
  { key: 'last_month', labelVi: 'Tháng trước', labelEn: 'Last Month' },
  { key: 'all', labelVi: 'Tất cả thời gian', labelEn: 'All Time' },
  { key: 'custom_range', labelVi: 'Tuỳ chọn ngày', labelEn: 'Custom Date' },
];

export function isValidIsoDate(raw?: string | null): raw is string {
  if (!raw || typeof raw !== 'string') return false;
  const trimmed = raw.trim();
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(trimmed);
  if (!m) return false;
  const y = Number(m[1]);
  const mo = Number(m[2]);
  const d = Number(m[3]);
  if (mo < 1 || mo > 12 || d < 1 || d > 31) return false;
  const dt = new Date(Date.UTC(y, mo - 1, d));
  return dt.getUTCFullYear() === y && dt.getUTCMonth() === mo - 1 && dt.getUTCDate() === d;
}

export function getVnNowParts(nowRef?: Date): {
  year: number;
  month: number; // 0-indexed
  day: number;
  isoDow: number; // 1=Mon .. 7=Sun
  iso: string;
} {
  const nowMs = nowRef ? nowRef.getTime() : Date.now();
  const vn = new Date(nowMs + VN_OFFSET_MS);
  const year = vn.getUTCFullYear();
  const month = vn.getUTCMonth();
  const day = vn.getUTCDate();
  const utcDay = vn.getUTCDay();
  const isoDow = utcDay === 0 ? 7 : utcDay;
  const iso = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  return { year, month, day, isoDow, iso };
}

function utcDateToIso(year: number, month: number, day: number): string {
  const dt = new Date(Date.UTC(year, month, day));
  return `${dt.getUTCFullYear()}-${String(dt.getUTCMonth() + 1).padStart(2, '0')}-${String(dt.getUTCDate()).padStart(2, '0')}`;
}

export function shiftIsoDate(iso: string, deltaDays: number): string {
  const dt = new Date(`${iso}T00:00:00Z`);
  dt.setUTCDate(dt.getUTCDate() + deltaDays);
  return dt.toISOString().slice(0, 10);
}

export function formatIsoToVnDisplay(iso?: string | null): string {
  if (!iso) return '';
  const parts = String(iso).trim().split('-');
  if (parts.length !== 3) return String(iso);
  return `${parts[2]}/${parts[1]}/${parts[0]}`;
}

export function getUnifiedPresetLabel(preset: UnifiedDatePreset, lang: 'vi' | 'en' = 'vi'): string {
  const found = UNIFIED_DATE_PRESET_OPTIONS.find((opt) => opt.key === preset);
  if (!found) return lang === 'en' ? 'This Month' : 'Tháng này';
  return lang === 'en' ? found.labelEn : found.labelVi;
}

export function resolveUnifiedDateRange(
  preset: UnifiedDatePreset,
  customSince?: string | null,
  customUntil?: string | null,
  nowRef?: Date
): {
  preset: UnifiedDatePreset;
  since: string | null;
  until: string | null;
  prevSince: string | null;
  prevUntil: string | null;
} {
  if (preset === 'all') {
    return {
      preset: 'all',
      since: null,
      until: null,
      prevSince: null,
      prevUntil: null,
    };
  }

  const { year, month, day, isoDow, iso: todayIso } = getVnNowParts(nowRef);
  let since = todayIso;
  let until = todayIso;

  switch (preset) {
    case 'today':
      since = todayIso;
      until = todayIso;
      break;
    case 'yesterday': {
      const yIso = utcDateToIso(year, month, day - 1);
      since = yIso;
      until = yIso;
      break;
    }
    case 'yesterday_to_today':
      since = utcDateToIso(year, month, day - 1);
      until = todayIso;
      break;
    case 'last_7days':
      since = utcDateToIso(year, month, day - 6);
      until = todayIso;
      break;
    case 'last_30days':
      since = utcDateToIso(year, month, day - 29);
      until = todayIso;
      break;
    case 'this_week':
      since = utcDateToIso(year, month, day - (isoDow - 1));
      until = todayIso;
      break;
    case 'last_week': {
      const monOffset = day - (isoDow - 1);
      since = utcDateToIso(year, month, monOffset - 7);
      until = utcDateToIso(year, month, monOffset - 1);
      break;
    }
    case 'this_month':
      since = utcDateToIso(year, month, 1);
      until = todayIso;
      break;
    case 'last_month':
      since = utcDateToIso(year, month - 1, 1);
      until = utcDateToIso(year, month, 0);
      break;
    case 'custom_range':
      if (isValidIsoDate(customSince) && isValidIsoDate(customUntil)) {
        since = customSince.trim();
        until = customUntil.trim();
      } else {
        since = utcDateToIso(year, month, day - 6);
        until = todayIso;
      }
      break;
  }

  if (since > until) {
    const tmp = since;
    since = until;
    until = tmp;
  }

  const startMs = Date.parse(`${since}T00:00:00Z`);
  const endMs = Date.parse(`${until}T00:00:00Z`);
  const spanDays = Math.max(1, Math.round((endMs - startMs) / 86_400_000) + 1);
  const prevUntil = shiftIsoDate(since, -1);
  const prevSince = shiftIsoDate(prevUntil, -(spanDays - 1));

  return {
    preset,
    since,
    until,
    prevSince,
    prevUntil,
  };
}

export function createUnifiedDateValue(
  preset: UnifiedDatePreset,
  customSince?: string | null,
  customUntil?: string | null,
  nowRef?: Date
): UnifiedDateFilterValue {
  const resolved = resolveUnifiedDateRange(preset, customSince, customUntil, nowRef);
  return {
    preset: resolved.preset,
    since: resolved.since,
    until: resolved.until,
  };
}

export function getDefaultUnifiedDateFilter(nowRef?: Date): UnifiedDateFilterValue {
  const { day } = getVnNowParts(nowRef);
  return createUnifiedDateValue(day >= 7 ? 'this_month' : 'last_30days', null, null, nowRef);
}

const PRESET_TO_LEGACY_VI: Record<Exclude<UnifiedDatePreset, 'custom_range'>, string> = {
  today: 'Hôm nay',
  yesterday: 'Hôm qua',
  yesterday_to_today: 'Hôm qua - Hôm nay',
  last_7days: '7 ngày qua',
  last_30days: '30 ngày qua',
  this_week: 'Tuần này',
  last_week: 'Tuần trước',
  this_month: 'Tháng này',
  last_month: 'Tháng trước',
  all: 'all',
};

export function serializeUnifiedDateForLegacyApi(val: UnifiedDateFilterValue): string {
  if (val.preset === 'all') return 'all';
  if (val.preset === 'custom_range') {
    if (isValidIsoDate(val.since) && isValidIsoDate(val.until)) {
      return `${val.since} - ${val.until}`;
    }
    return '7 ngày qua';
  }
  return PRESET_TO_LEGACY_VI[val.preset] || 'Tháng này';
}

export function buildUnifiedDateQueryParams(val: UnifiedDateFilterValue): Record<string, string> {
  const legacyDate = serializeUnifiedDateForLegacyApi(val);
  if (val.preset === 'all') {
    return { date: 'all' };
  }
  const resolved =
    isValidIsoDate(val.since) && isValidIsoDate(val.until)
      ? { since: val.since, until: val.until }
      : resolveUnifiedDateRange(val.preset, val.since, val.until);

  const out: Record<string, string> = { date: legacyDate };
  if (resolved.since && resolved.until) {
    out.since = resolved.since;
    out.until = resolved.until;
  }
  return out;
}

export function appendUnifiedDateQueryParams(url: string, val: UnifiedDateFilterValue): string {
  const params = buildUnifiedDateQueryParams(val);
  const qs = Object.entries(params)
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    .join('&');
  if (!qs) return url;
  return `${url}${url.includes('?') ? '&' : '?'}${qs}`;
}

export function parseLegacyDateStringToUnified(
  raw: string | UnifiedDateFilterValue | null | undefined,
  fallbackPreset?: UnifiedDatePreset,
  nowRef?: Date
): UnifiedDateFilterValue {
  if (raw && typeof raw === 'object' && 'preset' in raw) {
    return normalizeUnifiedDateValue(raw, fallbackPreset, nowRef);
  }

  const trimmed = String(raw || '').trim();
  if (!trimmed) {
    return fallbackPreset
      ? createUnifiedDateValue(fallbackPreset, null, null, nowRef)
      : getDefaultUnifiedDateFilter(nowRef);
  }

  // Handle JSON-encoded UnifiedDateFilterValue
  if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
    try {
      const parsed = JSON.parse(trimmed) as Partial<UnifiedDateFilterValue>;
      if (parsed && typeof parsed.preset === 'string') {
        return normalizeUnifiedDateValue(parsed as UnifiedDateFilterValue, fallbackPreset, nowRef);
      }
    } catch {
      // fall through to string parsing
    }
  }

  const lower = trimmed.toLowerCase();

  // Handle explicit custom range strings: "YYYY-MM-DD - YYYY-MM-DD" or "YYYY-MM-DD đến YYYY-MM-DD"
  if (lower.includes(' - ') || lower.includes('đến') || lower.includes(' ~ ') || lower.includes('..')) {
    const parts = trimmed.split(/\s*(?:đến| - | ~ |\.\.)\s*/i).map((s) => s.trim());
    if (parts.length === 2 && isValidIsoDate(parts[0]) && isValidIsoDate(parts[1])) {
      return createUnifiedDateValue('custom_range', parts[0], parts[1], nowRef);
    }
  }

  const aliasMap: Record<string, UnifiedDatePreset> = {
    today: 'today',
    'hôm nay': 'today',
    yesterday: 'yesterday',
    'hôm qua': 'yesterday',
    yesterday_to_today: 'yesterday_to_today',
    'hôm qua - hôm nay': 'yesterday_to_today',
    'hôm qua – hôm nay': 'yesterday_to_today',
    'yesterday - today': 'yesterday_to_today',
    last_7days: 'last_7days',
    last_7_days: 'last_7days',
    last_7d: 'last_7days',
    '7_days': 'last_7days',
    '7days': 'last_7days',
    '7 ngày qua': 'last_7days',
    '7 ngày gần nhất': 'last_7days',
    'last 7 days': 'last_7days',
    last_30days: 'last_30days',
    last_30_days: 'last_30days',
    last_30d: 'last_30days',
    '30_days': 'last_30days',
    '30days': 'last_30days',
    '30 ngày qua': 'last_30days',
    '30 ngày gần nhất': 'last_30days',
    'last 30 days': 'last_30days',
    this_week: 'this_week',
    'tuần này': 'this_week',
    'this week': 'this_week',
    last_week: 'last_week',
    'tuần trước': 'last_week',
    'last week': 'last_week',
    'tuần trước nữa': 'last_7days',
    this_month: 'this_month',
    'tháng này': 'this_month',
    'this month': 'this_month',
    last_month: 'last_month',
    'tháng trước': 'last_month',
    'last month': 'last_month',
    all: 'all',
    'tất cả': 'all',
    'tất cả thời gian': 'all',
    'toàn bộ lịch sử': 'all',
    'all time': 'all',
  };

  const matched = aliasMap[lower];
  if (matched) {
    return createUnifiedDateValue(matched, null, null, nowRef);
  }

  return fallbackPreset
    ? createUnifiedDateValue(fallbackPreset, null, null, nowRef)
    : getDefaultUnifiedDateFilter(nowRef);
}

export function normalizeUnifiedDateValue(
  input: Partial<UnifiedDateFilterValue> | null | undefined,
  fallbackPreset?: UnifiedDatePreset,
  nowRef?: Date
): UnifiedDateFilterValue {
  const validPresets = new Set<UnifiedDatePreset>(UNIFIED_DATE_PRESET_OPTIONS.map((o) => o.key));
  const rawPreset = String(input?.preset || '').trim() as UnifiedDatePreset;
  if (validPresets.has(rawPreset)) {
    return createUnifiedDateValue(rawPreset, input?.since, input?.until, nowRef);
  }
  return fallbackPreset
    ? createUnifiedDateValue(fallbackPreset, null, null, nowRef)
    : getDefaultUnifiedDateFilter(nowRef);
}

export function areUnifiedDateValuesEqual(
  a: UnifiedDateFilterValue | null | undefined,
  b: UnifiedDateFilterValue | null | undefined
): boolean {
  if (!a || !b) return false;
  return a.preset === b.preset && a.since === b.since && a.until === b.until;
}

export function readStoredUnifiedDateFilter(
  fallbackPreset?: UnifiedDatePreset,
  nowRef?: Date
): UnifiedDateFilterValue {
  if (typeof window === 'undefined') {
    return fallbackPreset
      ? createUnifiedDateValue(fallbackPreset, null, null, nowRef)
      : getDefaultUnifiedDateFilter(nowRef);
  }
  try {
    const rawV2 = window.localStorage.getItem(UNIFIED_DATE_STORAGE_KEY);
    if (rawV2) {
      const parsed = JSON.parse(rawV2) as Partial<UnifiedDateFilterValue>;
      if (parsed && typeof parsed.preset === 'string') {
        return normalizeUnifiedDateValue(parsed, fallbackPreset, nowRef);
      }
    }
    const rawLegacy =
      window.localStorage.getItem(LEGACY_DATE_STORAGE_KEY) ||
      window.localStorage.getItem(LEGACY_ERP_DATE_STORAGE_KEY);
    if (rawLegacy) {
      return parseLegacyDateStringToUnified(rawLegacy, fallbackPreset, nowRef);
    }
  } catch {
    // ignore storage errors
  }
  return fallbackPreset
    ? createUnifiedDateValue(fallbackPreset, null, null, nowRef)
    : getDefaultUnifiedDateFilter(nowRef);
}

export function writeStoredUnifiedDateFilter(next: UnifiedDateFilterValue): UnifiedDateFilterValue {
  const normalized = normalizeUnifiedDateValue(next);
  if (typeof window !== 'undefined') {
    const legacySerialized = serializeUnifiedDateForLegacyApi(normalized);
    try {
      window.localStorage.setItem(UNIFIED_DATE_STORAGE_KEY, JSON.stringify(normalized));
      window.localStorage.setItem(LEGACY_DATE_STORAGE_KEY, legacySerialized);
      window.localStorage.setItem(LEGACY_ERP_DATE_STORAGE_KEY, legacySerialized);
    } catch {
      // ignore storage quota errors
    }
    window.dispatchEvent(new CustomEvent<UnifiedDateFilterValue>(UNIFIED_DATE_CHANGE_EVENT, { detail: normalized }));
    window.dispatchEvent(
      new CustomEvent<string>(LEGACY_DATE_CHANGE_EVENT, {
        detail: legacySerialized,
      })
    );
  }
  return normalized;
}

export function buildUnifiedCalendarMonthGrid(
  year: number,
  month: number
): Array<{ iso: string; day: number; inMonth: boolean }> {
  const firstDow = new Date(Date.UTC(year, month, 1)).getUTCDay();
  const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  const prevMonthDays = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const toIso = (y: number, m: number, d: number) => {
    const dt = new Date(Date.UTC(y, m, d));
    return `${dt.getUTCFullYear()}-${String(dt.getUTCMonth() + 1).padStart(2, '0')}-${String(dt.getUTCDate()).padStart(2, '0')}`;
  };
  const cells: Array<{ iso: string; day: number; inMonth: boolean }> = [];
  for (let i = firstDow - 1; i >= 0; i--) {
    const d = prevMonthDays - i;
    cells.push({ iso: toIso(year, month - 1, d), day: d, inMonth: false });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ iso: toIso(year, month, d), day: d, inMonth: true });
  }
  const rem = 42 - cells.length;
  for (let d = 1; d <= rem; d++) {
    cells.push({ iso: toIso(year, month + 1, d), day: d, inMonth: false });
  }
  return cells;
}

export interface UseUnifiedDateFilterOptions {
  allowAllTime?: boolean;
  fallbackPreset?: UnifiedDatePreset;
  /** When `allowAllTime` is false and global state is `'all'`, coerce view to this preset without mutating storage. */
  allTimeFallbackPreset?: Exclude<UnifiedDatePreset, 'all' | 'custom_range'>;
}

export interface UnifiedDateFilterHelpers {
  legacyDate: string;
  since: string | null;
  until: string | null;
  queryParams: Record<string, string>;
  queryString: string;
  displayRange: string;
  setPreset: (preset: UnifiedDatePreset, customSince?: string | null, customUntil?: string | null) => void;
  setFromLegacy: (raw: string) => void;
}

export function useUnifiedDateFilter(
  options?: UseUnifiedDateFilterOptions
): [UnifiedDateFilterValue, (next: UnifiedDateFilterValue) => void, UnifiedDateFilterHelpers] {
  const allowAllTime = options?.allowAllTime ?? true;
  const fallbackPreset = options?.fallbackPreset;
  const allTimeFallbackPreset = options?.allTimeFallbackPreset ?? 'last_30days';

  const coerce = useCallback(
    (val: UnifiedDateFilterValue): UnifiedDateFilterValue => {
      if (!allowAllTime && val.preset === 'all') {
        return createUnifiedDateValue(allTimeFallbackPreset);
      }
      return val;
    },
    [allowAllTime, allTimeFallbackPreset]
  );

  const [value, setValueState] = useState<UnifiedDateFilterValue>(() =>
    coerce(readStoredUnifiedDateFilter(fallbackPreset))
  );

  const setValue = useCallback(
    (next: UnifiedDateFilterValue) => {
      const coerced = coerce(normalizeUnifiedDateValue(next, fallbackPreset));
      setValueState((prev) => (areUnifiedDateValuesEqual(prev, coerced) ? prev : coerced));
      writeStoredUnifiedDateFilter(coerced);
    },
    [coerce, fallbackPreset]
  );

  useEffect(() => {
    const handleUnified = (e: Event) => {
      const detail = (e as CustomEvent<UnifiedDateFilterValue>).detail;
      if (!detail || typeof detail !== 'object') return;
      const coerced = coerce(normalizeUnifiedDateValue(detail, fallbackPreset));
      setValueState((prev) => (areUnifiedDateValuesEqual(prev, coerced) ? prev : coerced));
    };

    const handleLegacy = (e: Event) => {
      const detail = (e as CustomEvent<string>).detail;
      if (typeof detail !== 'string') return;
      const parsed = coerce(parseLegacyDateStringToUnified(detail, fallbackPreset));
      setValueState((prev) => (areUnifiedDateValuesEqual(prev, parsed) ? prev : parsed));
    };

    const handleStorage = (e: StorageEvent) => {
      if (
        e.key !== UNIFIED_DATE_STORAGE_KEY &&
        e.key !== LEGACY_DATE_STORAGE_KEY &&
        e.key !== LEGACY_ERP_DATE_STORAGE_KEY
      ) {
        return;
      }
      const next = coerce(readStoredUnifiedDateFilter(fallbackPreset));
      setValueState((prev) => (areUnifiedDateValuesEqual(prev, next) ? prev : next));
    };

    window.addEventListener(UNIFIED_DATE_CHANGE_EVENT, handleUnified);
    window.addEventListener(LEGACY_DATE_CHANGE_EVENT, handleLegacy);
    window.addEventListener('storage', handleStorage);
    return () => {
      window.removeEventListener(UNIFIED_DATE_CHANGE_EVENT, handleUnified);
      window.removeEventListener(LEGACY_DATE_CHANGE_EVENT, handleLegacy);
      window.removeEventListener('storage', handleStorage);
    };
  }, [coerce, fallbackPreset]);

  const helpers = useMemo<UnifiedDateFilterHelpers>(() => {
    const legacyDate = serializeUnifiedDateForLegacyApi(value);
    const queryParams = buildUnifiedDateQueryParams(value);
    const queryString = Object.entries(queryParams)
      .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
      .join('&');
    const displayRange =
      value.preset === 'all' || !value.since || !value.until
        ? 'Tất cả thời gian'
        : `${formatIsoToVnDisplay(value.since)} - ${formatIsoToVnDisplay(value.until)}`;
    return {
      legacyDate,
      since: value.since,
      until: value.until,
      queryParams,
      queryString,
      displayRange,
      setPreset: (preset, customSince, customUntil) => {
        setValue(createUnifiedDateValue(preset, customSince, customUntil));
      },
      setFromLegacy: (raw) => {
        setValue(parseLegacyDateStringToUnified(raw, fallbackPreset));
      },
    };
  }, [value, setValue, fallbackPreset]);

  return [value, setValue, helpers];
}
