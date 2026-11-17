import { apiRequest } from '../../autodataApi';

export interface CrmAuthCreds {
  token?: string | null;
  tenantSlug?: string | null;
}

export async function crmGet<T>(
  subPath: string,
  creds: CrmAuthCreds,
  params?: Record<string, string | number | boolean | undefined | null>
): Promise<T> {
  const qs = new URLSearchParams();
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined && v !== null && String(v) !== '') {
        qs.set(k, String(v));
      }
    }
  }
  const suffix = qs.toString() ? `?${qs.toString()}` : '';
  return apiRequest<T>(`/crm-360${subPath}${suffix}`, {
    method: 'GET',
    token: creds.token,
    tenantSlug: creds.tenantSlug,
  });
}

export async function crmMutate<T>(
  subPath: string,
  method: 'POST' | 'PUT' | 'PATCH' | 'DELETE',
  creds: CrmAuthCreds,
  body?: unknown
): Promise<T> {
  return apiRequest<T>(`/crm-360${subPath}`, {
    method,
    token: creds.token,
    tenantSlug: creds.tenantSlug,
    body,
  });
}

export function formatCurrencyVnd(val: unknown): string {
  const num = Math.round(Number(val || 0));
  if (!Number.isFinite(num) || num === 0) return '0 ₫';
  return `${num.toLocaleString('vi-VN')} ₫`;
}

export function formatCompactVnd(val: unknown): string {
  const num = Number(val || 0);
  if (!Number.isFinite(num) || num === 0) return '0 ₫';
  if (Math.abs(num) >= 1_000_000_000) return `${(num / 1_000_000_000).toFixed(1)} tỷ`;
  if (Math.abs(num) >= 1_000_000) return `${(num / 1_000_000).toFixed(1)} tr`;
  if (Math.abs(num) >= 1_000) return `${Math.round(num / 1_000)} K`;
  return `${Math.round(num)} ₫`;
}

export function formatDateTimeVi(iso?: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return String(iso);
  return d.toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatRelativeTimeVi(iso?: string | null): string {
  if (!iso) return 'Chưa tương tác';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  const diffSec = Math.round((Date.now() - d.getTime()) / 1000);
  if (diffSec < 60) return 'Vừa xong';
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)} phút trước`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)} giờ trước`;
  if (diffSec < 86400 * 7) return `${Math.floor(diffSec / 86400)} ngày trước`;
  return d.toLocaleDateString('vi-VN');
}

export function formatDurationCompact(seconds?: number | null): string {
  const s = Math.max(0, Math.round(Number(seconds || 0)));
  if (s < 60) return `${s}s`;
  if (s < 3600) return `${Math.round(s / 60)} phút`;
  if (s < 86400) return `${(s / 3600).toFixed(1)} giờ`;
  return `${(s / 86400).toFixed(1)} ngày`;
}

export function getHeatTier(score: number): {
  key: 'hot' | 'warm' | 'cool';
  label: string;
  color: string;
  bg: string;
} {
  const s = Number(score || 0);
  if (s >= 75) {
    return { key: 'hot', label: 'Nóng (Hot)', color: '#D97706', bg: '#FEF3C7' };
  }
  if (s >= 45) {
    return { key: 'warm', label: 'Ấm (Warm)', color: '#1E40FF', bg: '#EFF6FF' };
  }
  return { key: 'cool', label: 'Tiềm năng', color: '#475569', bg: '#F1F5F9' };
}

export function maskClientPiiFallback(
  raw: string | null | undefined,
  canUnmask: boolean,
  kind: 'phone' | 'email'
): string {
  if (!raw) return '—';
  if (canUnmask || raw.includes('*')) return raw;
  if (kind === 'phone') {
    const clean = raw.trim();
    if (clean.length < 7) return '***';
    return `${clean.slice(0, 4)}***${clean.slice(-3)}`;
  }
  const atIdx = raw.indexOf('@');
  if (atIdx <= 1) return `***${atIdx >= 0 ? raw.slice(atIdx) : ''}`;
  return `${raw.slice(0, 2)}***${raw.slice(atIdx)}`;
}

const VI_DIGITS = ['không', 'một', 'hai', 'ba', 'bốn', 'năm', 'sáu', 'bảy', 'tăm', 'chín'];

function readThreeDigits(n: number): string {
  const tr = Math.floor(n / 100);
  const ch = Math.floor((n % 100) / 10);
  const dv = n % 10;
  const parts: string[] = [];
  if (tr > 0) parts.push(`${VI_DIGITS[tr] === 'tăm' ? 'tám' : VI_DIGITS[tr]} trăm`);
  if (ch > 1) {
    parts.push(`${VI_DIGITS[ch] === 'tăm' ? 'tám' : VI_DIGITS[ch]} mươi`);
    if (dv === 1) parts.push('mốt');
    else if (dv === 5) parts.push('lăm');
    else if (dv > 0) parts.push(VI_DIGITS[dv] === 'tăm' ? 'tám' : VI_DIGITS[dv]);
  } else if (ch === 1) {
    parts.push('mười');
    if (dv === 5) parts.push('lăm');
    else if (dv > 0) parts.push(VI_DIGITS[dv] === 'tăm' ? 'tám' : VI_DIGITS[dv]);
  } else if (tr > 0 && dv > 0) {
    parts.push('lẻ');
    parts.push(VI_DIGITS[dv] === 'tăm' ? 'tám' : VI_DIGITS[dv]);
  } else if (dv > 0) {
    parts.push(VI_DIGITS[dv] === 'tăm' ? 'tám' : VI_DIGITS[dv]);
  }
  return parts.join(' ');
}

export function vndToVietnameseWords(amount: number): string {
  const n = Math.round(Math.abs(Number(amount || 0)));
  if (!n) return 'Không đồng';
  const units = ['', 'nghìn', 'triệu', 'tỷ', 'nghìn tỷ'];
  let rem = n;
  let uIdx = 0;
  const chunks: string[] = [];
  while (rem > 0 && uIdx < units.length) {
    const grp = rem % 1000;
    if (grp > 0) {
      const txt = readThreeDigits(grp);
      chunks.unshift(`${txt}${units[uIdx] ? ` ${units[uIdx]}` : ''}`);
    }
    rem = Math.floor(rem / 1000);
    uIdx++;
  }
  const sentence = chunks.join(' ').trim();
  return `${sentence.charAt(0).toUpperCase()}${sentence.slice(1)} đồng chẵn`;
}

export const DEAL_STAGES_META: ReadonlyArray<{
  key: string;
  label: string;
  color: string;
  bg: string;
  probability: number;
}> = [
  { key: 'qualification', label: 'Tiếp nhận & Sàng lọc', color: '#0284C7', bg: '#F0F9FF', probability: 20 },
  { key: 'discovery', label: 'Khảo sát Nhu cầu', color: '#1E40FF', bg: '#EFF6FF', probability: 40 },
  { key: 'proposal', label: 'Gửi Báo giá / Đề xuất', color: '#7C3AED', bg: '#F5F3FF', probability: 60 },
  { key: 'negotiation', label: 'Đàm phán Hợp đồng', color: '#D97706', bg: '#FFFBEB', probability: 80 },
  { key: 'won', label: 'Chốt Thành công (Won)', color: '#059669', bg: '#ECFDF5', probability: 100 },
  { key: 'lost', label: 'Tạm dừng / Thất bại', color: '#64748B', bg: '#F8FAFC', probability: 0 },
];
