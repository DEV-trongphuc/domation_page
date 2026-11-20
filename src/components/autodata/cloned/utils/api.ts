import { loadAutodataSessionV2, refreshAutodataSessionV2 } from '../../autodataApi';

export const getApiBaseUrl = () => '/api/v1/legacy';

let _loadedDicts: Record<string, Record<string, string>> | null = null;

export function registerLoadedTranslations(dicts: Record<string, Record<string, string>>) {
  _loadedDicts = dicts;
}

function getTranslatedError(key: string, replacements?: Record<string, string | number>): string {
  const lang = (typeof window !== 'undefined' && localStorage.getItem('domation_lang')) || 'vi';
  if (lang === 'vi' || !_loadedDicts) return key;
  let translated = (_loadedDicts[lang] && _loadedDicts[lang][key]) || key;
  if (replacements) {
    Object.entries(replacements).forEach(([k, v]) => {
      translated = translated.replace(`{${k}}`, String(v));
    });
  }
  return translated;
}

let _isHandlingSessionExpiry = false;
const pendingRequests = new Map<string, Promise<any>>();

export async function fetchAPI(action: string, options: RequestInit = {}, retries = 1) {
  const isGet = !options.method || options.method.toUpperCase() === 'GET';
  let requestKey = '';
  if (isGet) {
    try {
      requestKey = `${action}_${JSON.stringify(options)}`;
    } catch {
      requestKey = `${action}_opts`;
    }
  }

  if (isGet && pendingRequests.has(requestKey)) {
    return pendingRequests.get(requestKey);
  }

  const promise = (async () => {
    const v2 = loadAutodataSessionV2();
    const token = v2?.access_token || (typeof window !== 'undefined' ? localStorage.getItem('domation_token') : null);
    const tenantSlug = v2?.tenant_slug || '';

    const headers: Record<string, string> = {
      ...(options.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
      ...(options.headers as Record<string, string>),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
      headers['X-Auth-Token'] = token;
    }
    if (tenantSlug) {
      headers['X-Tenant-Slug'] = tenantSlug;
    }

    const qIdx = action.indexOf('&');
    const actionName = qIdx === -1 ? action : action.slice(0, qIdx);
    const extraQuery = qIdx === -1 ? '' : `&${action.slice(qIdx + 1)}`;
    const url = `${getApiBaseUrl()}?action=${encodeURIComponent(actionName)}${extraQuery}`;

    let lastError: any;
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const response = await fetch(url, {
          ...options,
          headers,
        });
        const json = await response.json().catch(() => ({ success: false, message: 'Invalid JSON response' }));

        if (!response.ok) {
          if (response.status === 401 && actionName !== 'login') {
            const refreshed = await refreshAutodataSessionV2(tenantSlug);
            if (refreshed?.access_token) {
              headers['Authorization'] = `Bearer ${refreshed.access_token}`;
              headers['X-Auth-Token'] = refreshed.access_token;
              if (refreshed.tenant_slug) {
                headers['X-Tenant-Slug'] = refreshed.tenant_slug;
              }
              const retryRes = await fetch(url, {
                ...options,
                headers,
              });
              const retryJson = await retryRes.json().catch(() => ({
                success: false,
                message: 'Invalid JSON response',
              }));
              if (retryRes.ok) {
                return retryJson;
              }
            }
            if (!_isHandlingSessionExpiry && typeof window !== 'undefined') {
              _isHandlingSessionExpiry = true;
              setTimeout(() => {
                _isHandlingSessionExpiry = false;
              }, 1500);
              window.dispatchEvent(new CustomEvent('autodata-session-expired'));
            }
          }
          const errMsg = json?.error?.message || json?.message || getTranslatedError('Lỗi dữ liệu phía người dùng');
          if (response.status >= 400 && response.status < 500) {
            throw new Error(errMsg);
          }
          throw new Error(errMsg || getTranslatedError('Lỗi kết nối máy chủ ({status})', { status: response.status }));
        }

        return json;
      } catch (err: any) {
        lastError = err;
        const isNetworkError = err instanceof TypeError && err.message === 'Failed to fetch';
        if (!isNetworkError || attempt === retries) {
          throw err;
        }
        await new Promise((res) => setTimeout(res, 800 * Math.pow(2, attempt)));
      }
    }
    throw lastError;
  })();

  if (isGet) {
    pendingRequests.set(requestKey, promise);
    try {
      return await promise;
    } finally {
      pendingRequests.delete(requestKey);
    }
  }
  return promise;
}

export async function fetchPublicAPI(action: string, options: RequestInit = {}) {
  return fetchAPI(action, options, 0);
}

export const VN_TIMEZONE = 'Asia/Ho_Chi_Minh';
const VN_OFFSET_MS = 7 * 60 * 60 * 1000;

export function parseServerDateVN(dateStr?: string | null): Date | null {
  if (!dateStr) return null;
  const trimmed = String(dateStr).trim();
  if (!trimmed || trimmed === '0000-00-00 00:00:00' || trimmed === '0000-00-00') return null;

  if (/^\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}(:\d{2}(\.\d+)?)?([Zz]|[+-]\d{2}:?\d{2})$/.test(trimmed)) {
    const d = new Date(trimmed.replace(' ', 'T'));
    return isNaN(d.getTime()) ? null : d;
  }
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    const d = new Date(`${trimmed}T00:00:00+07:00`);
    return isNaN(d.getTime()) ? null : d;
  }
  if (/^\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}(:\d{2})?$/.test(trimmed)) {
    const normalized = trimmed.replace(' ', 'T') + (trimmed.length === 16 ? ':00' : '') + '+07:00';
    const d = new Date(normalized);
    return isNaN(d.getTime()) ? null : d;
  }
  const d = new Date(trimmed);
  return isNaN(d.getTime()) ? null : d;
}

export function getVNWallClockParts(input: Date | number = Date.now()): {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
  dayOfWeek: number;
} {
  const ms = input instanceof Date ? input.getTime() : input;
  const vnDate = new Date(ms + VN_OFFSET_MS);
  return {
    year: vnDate.getUTCFullYear(),
    month: vnDate.getUTCMonth() + 1,
    day: vnDate.getUTCDate(),
    hour: vnDate.getUTCHours(),
    minute: vnDate.getUTCMinutes(),
    second: vnDate.getUTCSeconds(),
    dayOfWeek: vnDate.getUTCDay(),
  };
}

export function formatDateYYYYMMDD_VN(input: Date | number = Date.now(), offsetDays = 0): string {
  const ms = (input instanceof Date ? input.getTime() : input) + offsetDays * 86400000;
  const { year, month, day } = getVNWallClockParts(ms);
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

export function nowSqlDateTimeVN(input: Date | number = Date.now()): string {
  const { year, month, day, hour, minute, second } = getVNWallClockParts(input);
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')} ${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:${String(second).padStart(2, '0')}`;
}

export function formatDateTimeVN(
  dateStr?: string | Date | null,
  options: Intl.DateTimeFormatOptions = {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }
): string {
  if (!dateStr) return '';
  const d = dateStr instanceof Date ? dateStr : parseServerDateVN(dateStr);
  if (!d || isNaN(d.getTime())) return typeof dateStr === 'string' ? dateStr : '';
  return d.toLocaleString('vi-VN', { ...options, timeZone: VN_TIMEZONE });
}

export function getWeekRangeVN(weeksAgo = 0): { start: string; end: string } {
  const { year, month, day, dayOfWeek } = getVNWallClockParts();
  const distanceToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const mondayUtcMs = Date.UTC(year, month - 1, day + distanceToMonday - weeksAgo * 7);
  const sundayUtcMs = mondayUtcMs + 6 * 86400000;
  const fmt = (utcMs: number) => {
    const d = new Date(utcMs);
    return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;
  };
  return { start: fmt(mondayUtcMs), end: fmt(sundayUtcMs) };
}

export function normalizeGlobalDateFilter(val: string | null | undefined): string {
  if (!val) return getDefaultDateFilter();
  const trimmed = String(val).trim();
  const map: Record<string, string> = {
    today: 'Hôm nay',
    yesterday: 'Hôm qua',
    yesterday_to_today: 'Hôm qua - Hôm nay',
    '7days': '7 ngày qua',
    '7_days': '7 ngày qua',
    last_7days: '7 ngày qua',
    '30days': '30 ngày qua',
    '30_days': '30 ngày qua',
    last_30days: '30 ngày qua',
    this_week: 'Tuần này',
    last_week: 'Tuần trước',
    this_month: 'Tháng này',
    last_month: 'Tháng trước',
    'Tất cả thời gian': 'all',
  };
  return map[trimmed] || trimmed;
}

export function getDefaultDateFilter(): string {
  return getVNWallClockParts().day >= 7 ? 'Tháng này' : '30 ngày qua';
}

export interface NotificationChannelStatus {
  status: string;
  sent_at?: string | null;
  target?: string | null;
  id?: string | number | null;
  error?: string | null;
}

export interface NormalizedNotificationStatus {
  email: NotificationChannelStatus;
  zalo: NotificationChannelStatus;
  telegram?: NotificationChannelStatus;
  is_accepted?: boolean;
  accepted_at?: string | null;
  sent_at?: string | null;
  consultant_name?: string | null;
  consultant_email?: string | null;
  has_zalo?: boolean;
  has_telegram?: boolean;
  [key: string]: any;
}

export function normalizeNotificationStatus(res: any): NormalizedNotificationStatus {
  if (!res || typeof res !== 'object') {
    return {
      email: { status: 'none', sent_at: null, target: null, id: null },
      zalo: { status: 'none', sent_at: null, target: null, id: null },
      telegram: { status: 'none', sent_at: null, target: null, id: null },
    };
  }

  const emailObj = res.email && typeof res.email === 'object' ? res.email : {};
  const zaloObj = res.zalo && typeof res.zalo === 'object' ? res.zalo : {};
  const teleObj = res.telegram && typeof res.telegram === 'object' ? res.telegram : {};

  const emailStatus = emailObj.status || res.email_status || 'none';
  const zaloStatus = zaloObj.status || res.zalo_status || (!res.has_zalo && res.has_zalo !== undefined ? 'no_zalo_config' : 'none');
  const teleStatus = teleObj.status || res.telegram_status || 'none';

  return {
    ...res,
    email: {
      status: emailStatus,
      sent_at: emailObj.sent_at || res.sent_at || null,
      target: emailObj.target || res.consultant_email || null,
      id: emailObj.id ?? res.email_id ?? null,
      error: emailObj.error ?? null,
    },
    zalo: {
      status: zaloStatus,
      sent_at: zaloObj.sent_at || res.sent_at || null,
      target: zaloObj.target || res.zalo_chat_id || null,
      id: zaloObj.id ?? res.zalo_id ?? null,
      error: zaloObj.error ?? null,
    },
    telegram: {
      status: teleStatus,
      sent_at: teleObj.sent_at || res.sent_at || null,
      target: teleObj.target || res.telegram_chat_id || null,
      id: teleObj.id ?? res.telegram_id ?? null,
      error: teleObj.error ?? null,
    },
    is_accepted: Boolean(res.is_accepted),
    accepted_at: res.accepted_at || null,
    sent_at: res.sent_at || null,
    consultant_name: res.consultant_name || '-',
    consultant_email: res.consultant_email || '-',
    has_zalo: Boolean(res.has_zalo ?? res.zalo_chat_id),
    has_telegram: Boolean(res.has_telegram ?? res.telegram_chat_id),
  };
}

