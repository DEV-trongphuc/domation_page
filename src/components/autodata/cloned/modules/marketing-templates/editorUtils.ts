import {
  createDefaultEmailBlock,
  type EmailBlockItem,
  type EmailBodyStyle,
} from './htmlCompiler';
import type {
  ColumnLayoutPreset,
  EmailBlockSpacing,
  EmailColumnItem,
  MediaAssetItem,
  SavedReusableBlock,
} from './templateTypes';

export const DEFAULT_EMAIL_BODY_STYLE: Required<EmailBodyStyle> = {
  canvasColor: '#F8F9FA',
  cardColor: '#FFFFFF',
  primaryColor: '#1E40FF',
  textColor: '#0F172A',
  fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Arial, sans-serif',
  maxWidth: 600,
};

export const EMAIL_FONT_OPTIONS: ReadonlyArray<{ value: string; label: string }> = [
  { value: 'Inter, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Arial, sans-serif', label: 'Inter (Chuẩn SaaS)' },
  { value: 'Roboto, Arial, sans-serif', label: 'Roboto' },
  { value: 'Arial, Helvetica, sans-serif', label: 'Arial' },
  { value: 'Georgia, Times New Roman, serif', label: 'Georgia Serif' },
  { value: 'Tahoma, Verdana, sans-serif', label: 'Tahoma' },
  { value: "'Courier New', Courier, monospace", label: 'Courier Monospace' },
];

export const SAPPHIRE_COLOR_SWATCHES: ReadonlyArray<string> = [
  '#1E40FF',
  '#0284C7',
  '#0F172A',
  '#334155',
  '#059669',
  '#D97706',
  '#7C3AED',
  '#EFF6FF',
  '#F8F9FA',
  '#FFFFFF',
];

export const COLUMN_PRESET_OPTIONS: ReadonlyArray<{
  key: ColumnLayoutPreset;
  label: string;
  widths: number[];
}> = [
  { key: '1', label: '1 Cột (100%)', widths: [100] },
  { key: '50/50', label: '2 Cột (50 / 50)', widths: [50, 50] },
  { key: '33/67', label: '2 Cột (33 / 67)', widths: [33, 67] },
  { key: '67/33', label: '2 Cột (67 / 33)', widths: [67, 33] },
  { key: '3', label: '3 Cột (33 / 34 / 33)', widths: [33, 34, 33] },
  { key: '4', label: '4 Cột (25% x 4)', widths: [25, 25, 25, 25] },
];

export const SOCIAL_NETWORK_OPTIONS: ReadonlyArray<string> = [
  'Website',
  'Facebook',
  'Zalo OA',
  'LinkedIn',
  'YouTube',
  'TikTok',
];

export const DEFAULT_MEDIA_FOLDERS: ReadonlyArray<string> = [
  'all',
  'banners',
  'products',
  'logos',
  'campaigns',
];

export const FALLBACK_TENANT_MEDIA_ASSETS: ReadonlyArray<MediaAssetItem> = [
  {
    id: 'seed-banner-growth',
    name: 'domation-growth-banner.png',
    url: 'https://placehold.co/600x260/EFF6FF/1E40FF?text=DOMATION+Growth+Suite',
    folder: 'banners',
    alt_text: 'Banner Giải pháp Tăng trưởng DOMATION',
    width: 600,
    height: 260,
    size_bytes: 48200,
  },
  {
    id: 'seed-product-crm',
    name: 'crm-pipeline-card.png',
    url: 'https://placehold.co/480x320/F8FAFF/0284C7?text=360+Customer+Data',
    folder: 'products',
    alt_text: 'Nền tảng dữ liệu khách hàng 360',
    width: 480,
    height: 320,
    size_bytes: 39100,
  },
  {
    id: 'seed-logo-brand',
    name: 'brand-header-clean.png',
    url: 'https://placehold.co/320x96/FFFFFF/1E40FF?text=DOMATION+CLOUD',
    folder: 'logos',
    alt_text: 'Logo thương hiệu doanh nghiệp',
    width: 320,
    height: 96,
    size_bytes: 18400,
  },
];

export interface StarterPresetDefinition {
  id: string;
  name: string;
  desc: string;
  subject: string;
  preheader: string;
  buildBlocks: (makeId: () => string) => EmailBlockItem[];
}

export const STARTER_TEMPLATE_PRESETS: ReadonlyArray<StarterPresetDefinition> = [
  {
    id: 'preset-welcome-vip',
    name: 'Chào mừng & Cấp Mã Ưu Đãi',
    desc: 'Hero + Lời chào + Hộp Voucher + Đồng hồ SVG',
    subject: '[{{tenant.name}}] Chào mừng {{lead.name}} & Ưu đãi đặc quyền',
    preheader: 'Món quà khởi đầu dành riêng cho đối tác mới.',
    buildBlocks: (makeId) => [
      createDefaultEmailBlock('hero_banner', makeId()),
      createDefaultEmailBlock('text', makeId()),
      createDefaultEmailBlock('voucher_box', makeId()),
      createDefaultEmailBlock('countdown_timer', makeId()),
      createDefaultEmailBlock('social_links', makeId()),
    ],
  },
  {
    id: 'preset-b2b-proposal',
    name: 'Báo giá & Bảng Quyền Lợi B2B',
    desc: 'Hero + Cột đôi 50/50 + Bảng đối chiếu + Pricing CTA',
    subject: 'Đề xuất triển khai giải pháp cho {{lead.name}} từ {{tenant.name}}',
    preheader: 'Tổng hợp hạng mục kỹ thuật & chi phí tối ưu.',
    buildBlocks: (makeId) => [
      createDefaultEmailBlock('hero_banner', makeId()),
      createDefaultEmailBlock('columns', makeId()),
      createDefaultEmailBlock('table', makeId()),
      createDefaultEmailBlock('pricing_card', makeId()),
    ],
  },
  {
    id: 'preset-product-showcase',
    name: 'Ra mắt Sản phẩm & Phản hồi',
    desc: 'Banner + Thẻ sản phẩm + Video + Đánh giá khách hàng',
    subject: 'Khám phá phiên bản mới phù hợp với {{lead.product_interest}}',
    preheader: 'Xem video thực tế 2 phút và ưu đãi ra mắt.',
    buildBlocks: (makeId) => [
      createDefaultEmailBlock('image', makeId()),
      createDefaultEmailBlock('product_card', makeId()),
      createDefaultEmailBlock('video_thumbnail', makeId()),
      createDefaultEmailBlock('testimonial', makeId()),
      createDefaultEmailBlock('button', makeId()),
    ],
  },
];

export function cloneBlockWithNewId(block: EmailBlockItem, newId: string): EmailBlockItem {
  return {
    ...block,
    id: newId,
    columns: block.columns ? block.columns.map((c) => ({ ...c })) : undefined,
    rows: block.rows ? block.rows.map((r) => [...r]) : undefined,
    socialLinks: block.socialLinks ? block.socialLinks.map((s) => ({ ...s })) : undefined,
    spacing: block.spacing ? { ...block.spacing } : undefined,
    border: block.border ? { ...block.border } : undefined,
    typography: block.typography ? { ...block.typography } : undefined,
  };
}

export function applyColumnPresetToBlock(
  block: EmailBlockItem,
  preset: ColumnLayoutPreset
): EmailBlockItem {
  const normalizedPreset = preset === '2' ? '50/50' : preset;
  const spec = COLUMN_PRESET_OPTIONS.find((p) => p.key === normalizedPreset) || COLUMN_PRESET_OPTIONS[1];
  const existing = block.columns || [];
  const nextCols: EmailColumnItem[] = spec.widths.map((w, idx) => {
    const prev = existing[idx];
    return {
      heading: prev?.heading ?? `Điểm nhấn #${idx + 1}`,
      body: prev?.body ?? 'Mô tả ngắn gọn giá trị thực tế mang lại cho khách hàng.',
      ctaLabel: prev?.ctaLabel ?? 'Tìm hiểu',
      ctaUrl: prev?.ctaUrl ?? 'https://domation.net',
      widthPct: w,
      imageUrl: prev?.imageUrl,
    };
  });
  return {
    ...block,
    type: 'columns',
    columnLayout: preset,
    columns: nextCols,
  };
}

export function parseSpacing(padding?: string, spacing?: EmailBlockSpacing): EmailBlockSpacing {
  if (spacing) return spacing;
  if (!padding) return { top: 16, right: 28, bottom: 16, left: 28 };
  const nums = padding
    .trim()
    .split(/\s+/)
    .map((part) => Number.parseInt(part.replace('px', ''), 10))
    .filter((n) => Number.isFinite(n));
  if (nums.length === 1) return { top: nums[0], right: nums[0], bottom: nums[0], left: nums[0] };
  if (nums.length === 2) return { top: nums[0], right: nums[1], bottom: nums[0], left: nums[1] };
  if (nums.length >= 4) return { top: nums[0], right: nums[1], bottom: nums[2], left: nums[3] };
  return { top: 16, right: 28, bottom: 16, left: 28 };
}

export function formatSpacingToPadding(spacing: EmailBlockSpacing): string {
  return `${spacing.top}px ${spacing.right}px ${spacing.bottom}px ${spacing.left}px`;
}

function savedBlocksStorageKey(tenantSlug?: string | null): string {
  return `domation_mkt_saved_blocks_v1_${tenantSlug || 'default'}`;
}

export function loadSavedReusableBlocks(tenantSlug?: string | null): SavedReusableBlock[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(savedBlocksStorageKey(tenantSlug));
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? (parsed as SavedReusableBlock[]) : [];
  } catch {
    return [];
  }
}

export function persistSavedReusableBlocks(
  items: SavedReusableBlock[],
  tenantSlug?: string | null
): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(savedBlocksStorageKey(tenantSlug), JSON.stringify(items));
  } catch {
    // ignore storage quota errors
  }
}

export function parseRecipientsInput(raw: string): string[] {
  const parts = raw
    .split(/[\n\r,;]+/)
    .map((s) => {
      const trimmed = s.trim();
      const angle = trimmed.match(/<([^>]+)>/);
      return (angle ? angle[1] : trimmed).trim().toLowerCase();
    })
    .filter((email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email));
  return Array.from(new Set(parts));
}
