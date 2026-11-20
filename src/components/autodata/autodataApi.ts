import { SESSION_V2_STORAGE_KEY, type TenantSessionV2 } from './autodataTypes';

export class AutodataApiError extends Error {
  status: number;
  code: string;
  constructor(status: number, code: string, message: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

export function purgeLegacyAutodataStorage(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem('domation_autodata_session_v1');
    localStorage.removeItem('domation_global_date');
  } catch {
    // ignore storage errors
  }
}

export function loadAutodataSessionV2(): TenantSessionV2 | null {
  if (typeof window === 'undefined') return null;
  purgeLegacyAutodataStorage();
  try {
    const raw = localStorage.getItem(SESSION_V2_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as TenantSessionV2;
    if (!parsed || !parsed.access_token || !parsed.tenant_slug) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function saveAutodataSessionV2(session: TenantSessionV2): void {
  if (typeof window === 'undefined') return;
  purgeLegacyAutodataStorage();
  try {
    localStorage.setItem(SESSION_V2_STORAGE_KEY, JSON.stringify(session));
  } catch {
    // ignore quota errors
  }
}

export function clearAutodataSessionV2(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(SESSION_V2_STORAGE_KEY);
  } catch {
    // ignore
  }
}

export function getErrorMessage(err: unknown, fallback: string): string {
  if (err instanceof Error && err.message) return err.message;
  if (typeof err === 'string' && err) return err;
  return fallback;
}

let _refreshPromise: Promise<TenantSessionV2 | null> | null = null;

export async function refreshAutodataSessionV2(
  targetSlug?: string | null
): Promise<TenantSessionV2 | null> {
  if (typeof window === 'undefined') return null;
  if (_refreshPromise) return _refreshPromise;

  _refreshPromise = (async () => {
    try {
      const current = loadAutodataSessionV2();
      if (!current) return null;
      if (!current.refresh_token && !current.account_token) return null;

      const slug = (targetSlug || current.tenant_slug || '').trim().toLowerCase();
      const res = await fetch('/api/v1/auth/refresh', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(slug ? { 'X-Tenant-Slug': slug } : {}),
        },
        body: JSON.stringify({
          refresh_token: current.refresh_token || '',
          account_token: current.account_token || '',
          tenant_slug: slug,
        }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.success || !json?.data?.access_token) {
        return null;
      }
      const d = json.data;
      const updated: TenantSessionV2 = {
        ...current,
        access_token: d.access_token,
        refresh_token: d.refresh_token || current.refresh_token,
        account_token: d.account_token || current.account_token,
        tenant_slug: d.tenant?.slug || slug || current.tenant_slug,
        company_name: d.tenant?.name || current.company_name,
        industry: d.tenant?.industry || current.industry,
        admin_email: d.user?.email || current.admin_email,
        user_id: d.user?.id || current.user_id,
        user_name: d.user?.full_name || current.user_name,
        role: d.user?.role || current.role,
        workspaces: Array.isArray(d.workspaces) ? d.workspaces : current.workspaces,
        subscription: d.subscription || current.subscription,
      };
      saveAutodataSessionV2(updated);
      window.dispatchEvent(new CustomEvent('autodata-session-refreshed', { detail: updated }));
      return updated;
    } catch {
      return null;
    } finally {
      _refreshPromise = null;
    }
  })();

  return _refreshPromise;
}

export async function apiRequest<T = Record<string, unknown>>(
  path: string,
  options?: {
    method?: string;
    token?: string | null;
    tenantSlug?: string | null;
    body?: unknown;
    headers?: Record<string, string>;
    isCsv?: boolean;
  }
): Promise<T> {
  const executeFetch = async (overrideToken?: string | null) => {
    const headers: Record<string, string> = {
      ...(options?.headers || {}),
    };
    const effectiveToken = overrideToken !== undefined ? overrideToken : options?.token;
    if (effectiveToken) {
      headers['Authorization'] = `Bearer ${effectiveToken}`;
    }
    if (options?.tenantSlug) {
      headers['X-Tenant-Slug'] = options.tenantSlug;
    }
    if (options?.body !== undefined) {
      headers['Content-Type'] = 'application/json';
    }

    const url = path.startsWith('/api/')
      ? path
      : `/api/v1${path.startsWith('/') ? path : `/${path}`}`;
    return fetch(url, {
      method: options?.method || 'GET',
      headers,
      body: options?.body !== undefined ? JSON.stringify(options.body) : undefined,
    });
  };

  let res = await executeFetch();
  if (res.status === 401 && options?.token && !path.includes('/auth/refresh')) {
    const refreshed = await refreshAutodataSessionV2(options?.tenantSlug);
    if (refreshed?.access_token) {
      res = await executeFetch(refreshed.access_token);
    }
  }

  if (options?.isCsv) {
    if (!res.ok) {
      throw new AutodataApiError(res.status, 'EXPORT_FAILED', `Không thể xuất CSV (${res.status})`);
    }
    return (await res.text()) as unknown as T;
  }

  const json = await res.json().catch(() => null);
  if (!res.ok || (json && json.success === false)) {
    const code = json?.error?.code || 'API_ERROR';
    const message = json?.error?.message || `Yêu cầu thất bại (HTTP ${res.status})`;
    throw new AutodataApiError(res.status, code, message);
  }
  return (json && 'data' in json ? json.data : json) as T;
}

export function formatVnd(amount: number): string {
  return `${Math.round(Number(amount || 0)).toLocaleString('vi-VN')}₫`;
}

export function formatShortDate(iso?: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return String(iso);
  return d.toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}
