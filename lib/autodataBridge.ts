import type { IncomingMessage, ServerResponse } from 'node:http';

const HOP_BY_HOP_HEADERS = new Set([
  'connection',
  'keep-alive',
  'proxy-authenticate',
  'proxy-authorization',
  'te',
  'trailers',
  'transfer-encoding',
  'upgrade',
  'host',
  'content-length',
]);

function sendJson(res: ServerResponse, statusCode: number, body: unknown): void {
  if (res.headersSent) return;
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(body));
}

async function readRawBody(req: IncomingMessage): Promise<Buffer> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks);
}

function resolveBaseUrl(explicitApiUrl?: string): string {
  const raw = (explicitApiUrl || process.env.AUTODATA_API_URL || '').trim().replace(/\/+$/, '');
  return raw;
}

function resolveUpstreamTarget(reqUrl: string, baseUrl: string): string | null {
  const parsed = new URL(reqUrl, 'http://localhost');

  // Direct /api/v1/* or /v1/* proxy
  if (parsed.pathname.startsWith('/api/v1/') || parsed.pathname === '/api/v1') {
    return `${baseUrl}${parsed.pathname}${parsed.search}`;
  }
  if (parsed.pathname.startsWith('/v1/')) {
    return `${baseUrl}${parsed.pathname}${parsed.search}`;
  }

  // Vercel rewrite passthrough
  const v1Rewrite = parsed.searchParams.get('__v1_path');
  if (v1Rewrite) {
    parsed.searchParams.delete('__v1_path');
    const qs = parsed.searchParams.toString();
    return `${baseUrl}/api/v1/${v1Rewrite.replace(/^\/+/, '')}${qs ? `?${qs}` : ''}`;
  }
  const rawV1Rewrite = parsed.searchParams.get('__raw_v1_path');
  if (rawV1Rewrite) {
    parsed.searchParams.delete('__raw_v1_path');
    const qs = parsed.searchParams.toString();
    return `${baseUrl}/v1/${rawV1Rewrite.replace(/^\/+/, '')}${qs ? `?${qs}` : ''}`;
  }

  // Legacy /api/autodata?action=... mapping to canonical /api/v1/* endpoints
  const action = (parsed.searchParams.get('action') || '').trim();
  if (!action) return null;

  const extraParams = new URLSearchParams(parsed.searchParams);
  extraParams.delete('action');
  const qs = extraParams.toString() ? `?${extraParams.toString()}` : '';

  const actionMap: Record<string, string> = {
    bootstrap: '/api/v1/billing/bootstrap-public',
    health: '/api/v1/health',
    'check-slug': '/api/v1/auth/check-slug',
    register: '/api/v1/auth/register',
    login: '/api/v1/auth/login',
    google: '/api/v1/auth/google',
    'google-login': '/api/v1/auth/google-login',
    'google-create-workspace': '/api/v1/auth/google-create-workspace',
    'switch-workspace': '/api/v1/auth/switch-workspace',
    'create-workspace': '/api/v1/auth/create-workspace',
    'workspace-overview': '/api/v1/workspace/bootstrap',
    topup: '/api/v1/billing/topup',
    subscribe: '/api/v1/billing/subscribe',
    'upgrade-request': '/api/v1/billing/upgrade-request',
    'personal-lead': '/api/v1/leads/personal',
    'telegram-config': '/api/v1/integrations/telegram/config',
    'telegram-test': '/api/v1/integrations/telegram/test',
    'zalo-updates': '/api/v1/integrations/zalo/updates',
    'zalo-verify': '/api/v1/integrations/zalo/verify',
    'webhook-test': '/api/v1/leads/quick-test',
  };

  const mappedPath = actionMap[action];
  if (mappedPath) {
    return `${baseUrl}${mappedPath}${qs}`;
  }
  // Forward full legacy compatibility actions to Multi-Tenant Kernel (/api/v1/legacy)
  return `${baseUrl}/api/v1/legacy?action=${encodeURIComponent(action)}${extraParams.toString() ? `&${extraParams.toString()}` : ''}`;
}

export async function handleAutodataBridgeHttp(
  req: IncomingMessage,
  res: ServerResponse,
  explicitApiUrl?: string
): Promise<void> {
  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
    res.setHeader(
      'Access-Control-Allow-Headers',
      'Content-Type, Authorization, X-Tenant-Slug, X-Webhook-Signature, X-Idempotency-Key'
    );
    res.end();
    return;
  }

  const baseUrl = resolveBaseUrl(explicitApiUrl);
  if (!baseUrl) {
    sendJson(res, 503, {
      success: false,
      error: {
        code: 'BACKEND_UNAVAILABLE',
        message: 'AUTODATA_API_URL chưa được cấu hình. Vui lòng kết nối Backend Kernel tại cổng 3100.',
      },
    });
    return;
  }

  const reqUrl = req.url || '/';
  const targetUrl = resolveUpstreamTarget(reqUrl, baseUrl);
  if (!targetUrl) {
    sendJson(res, 404, {
      success: false,
      error: {
        code: 'UNKNOWN_PROXY_ROUTE',
        message: `Không tìm thấy route API tương ứng cho '${reqUrl}'.`,
      },
    });
    return;
  }

  try {
    const method = (req.method || 'GET').toUpperCase();
    const rawBody = method === 'GET' || method === 'HEAD' ? undefined : await readRawBody(req);

    const headers: Record<string, string> = {};
    for (const [k, v] of Object.entries(req.headers)) {
      const lower = k.toLowerCase();
      if (HOP_BY_HOP_HEADERS.has(lower) || v === undefined) continue;
      headers[k] = Array.isArray(v) ? v.join(', ') : v;
    }

    const upstreamResp = await fetch(targetUrl, {
      method,
      headers,
      body: rawBody && rawBody.length > 0 ? new Uint8Array(rawBody) : undefined,
      signal: AbortSignal.timeout(25_000),
    });

    res.statusCode = upstreamResp.status;
    upstreamResp.headers.forEach((value, key) => {
      const lower = key.toLowerCase();
      if (HOP_BY_HOP_HEADERS.has(lower) || lower === 'content-encoding' || lower === 'content-length') return;
      res.setHeader(key, value);
    });

    const buf = Buffer.from(await upstreamResp.arrayBuffer());
    res.end(buf);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Backend AutoData không phản hồi';
    sendJson(res, 503, {
      success: false,
      error: {
        code: 'BACKEND_UNAVAILABLE',
        message: `Không thể kết nối tới Backend AutoData (${msg}). Vui lòng kiểm tra server :3100.`,
      },
    });
  }
}
