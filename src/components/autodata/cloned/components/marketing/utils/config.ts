import axios from 'axios';
import { getTenantFrontendUrl } from '../../../contexts/TenantConfigContext';
import { loadAutodataSessionV2 } from '../../../../autodataApi';

/**
 * Core Configuration Hub — Unified DOMATION Marketing & Automation Bridge
 */

export const isLocal =
  typeof window !== 'undefined' &&
  (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

export const DEMO_MODE =
  typeof window !== 'undefined' && window.location.hostname === 'open.automation.net';

export const API_BASE_URL = isLocal
  ? '/api/v1/myerp/automation'
  : typeof window !== 'undefined'
    ? `${window.location.origin}/api/v1/myerp/automation`
    : `${getTenantFrontendUrl() || ''}/api/v1/myerp/automation`;

export const EXTERNAL_API_BASE =
  typeof window !== 'undefined' && !isLocal
    ? `${window.location.origin}/api/v1/myerp/automation`
    : `${getTenantFrontendUrl() || ''}/api/v1/myerp/automation`;

export const EXTERNAL_ASSET_BASE =
  typeof window !== 'undefined' && !isLocal
    ? window.location.origin
    : getTenantFrontendUrl() || '';

export function getMarketingAuthToken(): string {
  if (typeof window === 'undefined') return '';
  try {
    const v2 = loadAutodataSessionV2();
    return (
      v2?.access_token ||
      localStorage.getItem('Ideas_token') ||
      localStorage.getItem('access_token') ||
      localStorage.getItem('_mf_token') ||
      localStorage.getItem('ai_space_access_token') ||
      ''
    );
  } catch {
    return '';
  }
}

export function getMarketingTenantSlug(): string {
  if (typeof window === 'undefined') return '';
  try {
    return loadAutodataSessionV2()?.tenant_slug || localStorage.getItem('domation_tenant_slug') || '';
  } catch {
    return '';
  }
}

export function getMarketingAuthHeaders(): Record<string, string> {
  const token = getMarketingAuthToken();
  const slug = getMarketingTenantSlug();
  const h: Record<string, string> = {};
  if (token) h['Authorization'] = `Bearer ${token}`;
  if (slug) h['X-Tenant-Slug'] = slug;
  return h;
}

export function rewriteLegacyMarketingUrl(rawUrl: string): string {
  if (!rawUrl || typeof rawUrl !== 'string') return rawUrl;
  let url = rawUrl;
  if (/^https?:\/\/[^/]+\/mail_api/i.test(url)) {
    url = url.replace(/^https?:\/\/[^/]+\/mail_api/i, API_BASE_URL);
  } else if (url.startsWith('/mail_api/') || url === '/mail_api') {
    url = url.replace(/^\/mail_api/, '/api/v1/myerp/automation');
  } else if (url.startsWith('/backend/automation/') || url === '/backend/automation') {
    url = url.replace(/^\/backend\/automation/, '/api/v1/myerp/automation');
  } else if (url.startsWith('/api/surveys.php')) {
    url = url.replace(/^\/api\/surveys\.php/, '/api/v1/myerp/automation/surveys.php');
  }
  return url;
}

if (typeof window !== 'undefined' && !(window as any).__myerpMarketingNetPatched) {
  (window as any).__myerpMarketingNetPatched = true;

  axios.interceptors.request.use((config) => {
    if (config.url) {
      config.url = rewriteLegacyMarketingUrl(config.url);
    }
    const targetUrl = String(config.url || '');
    if (
      targetUrl.includes('/api/v1/myerp/automation') ||
      targetUrl.includes('/automation/') ||
      targetUrl.endsWith('.php')
    ) {
      const token = getMarketingAuthToken();
      const slug = getMarketingTenantSlug();
      config.headers = config.headers || ({} as any);
      if (token) {
        const curAuth = String(config.headers.Authorization || config.headers.authorization || '').trim();
        if (!curAuth || curAuth === 'Bearer null' || curAuth === 'Bearer undefined' || curAuth === 'Bearer') {
          config.headers.Authorization = `Bearer ${token}`;
        }
      }
      if (slug && !config.headers['X-Tenant-Slug']) {
        config.headers['X-Tenant-Slug'] = slug;
      }
    }
    return config;
  });

  const originalFetch = window.fetch.bind(window);
  window.fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const urlStr = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
    const rewritten = rewriteLegacyMarketingUrl(urlStr);
    const isAutomationCall =
      rewritten.includes('/api/v1/myerp/automation') ||
      rewritten.includes('/backend/automation') ||
      rewritten.includes('/automation/') ||
      rewritten.includes('/mail_api');

    if (isAutomationCall) {
      const token = getMarketingAuthToken();
      const slug = getMarketingTenantSlug();
      const nextHeaders = new Headers(init?.headers || (input instanceof Request ? input.headers : undefined));
      const curAuth = (nextHeaders.get('Authorization') || '').trim();
      if (token && (!curAuth || curAuth === 'Bearer null' || curAuth === 'Bearer undefined' || curAuth === 'Bearer')) {
        nextHeaders.set('Authorization', `Bearer ${token}`);
      }
      if (slug && !nextHeaders.get('X-Tenant-Slug')) {
        nextHeaders.set('X-Tenant-Slug', slug);
      }
      const nextInit: RequestInit = { ...(init || {}), headers: nextHeaders };
      return originalFetch(rewritten, nextInit);
    }

    if (rewritten !== urlStr) {
      return originalFetch(rewritten, init);
    }
    return originalFetch(input, init);
  };
}
