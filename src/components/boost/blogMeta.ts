import type {
  BoostArticleSummary,
  BoostPillarId,
  EditorialFormatId,
} from '../../data/boostTypes';
import { getArticleScheduledDate } from '../../data/publishSchedule';

export type BlogCategoryId =
  | 'all'
  | 'ai'
  | 'engineering'
  | 'management'
  | 'sales'
  | 'growth'
  | 'security';

export interface BlogCategoryDef {
  id: BlogCategoryId;
  label: string;
  pillars: readonly BoostPillarId[];
  textClass: string;
  badgeClass: string;
}

export const BLOG_CATEGORIES: readonly BlogCategoryDef[] = [
  {
    id: 'all',
    label: 'Tất cả',
    pillars: [],
    textClass: 'text-[#1E40FF]',
    badgeClass: 'bg-blue-50 text-[#1E40FF] border-blue-200/80',
  },
  {
    id: 'ai',
    label: 'AI & Tự động hóa',
    pillars: ['multi-agent-ai', 'llm-models-mcp-skills', 'automation-zns'],
    textClass: 'text-[#1E40FF]',
    badgeClass: 'bg-blue-50 text-[#1E40FF] border-blue-200/80',
  },
  {
    id: 'engineering',
    label: 'Kỹ thuật & Mã nguồn',
    pillars: ['github-vibecode-audit', 'vibecode-ops'],
    textClass: 'text-teal-700',
    badgeClass: 'bg-teal-50 text-teal-800 border-teal-200/80',
  },
  {
    id: 'management',
    label: 'Quản trị & ERP',
    pillars: ['erp-operations'],
    textClass: 'text-indigo-700',
    badgeClass: 'bg-indigo-50 text-indigo-700 border-indigo-200/80',
  },
  {
    id: 'sales',
    label: 'Kinh doanh & CRM',
    pillars: ['crm-misa-sales', 'auto-data-capi'],
    textClass: 'text-sky-700',
    badgeClass: 'bg-sky-50 text-sky-700 border-sky-200/80',
  },
  {
    id: 'growth',
    label: 'Marketing & Dữ liệu',
    pillars: ['ads-cro-seo', 'web3d-ads-seo'],
    textClass: 'text-amber-700',
    badgeClass: 'bg-amber-50 text-amber-800 border-amber-200/80',
  },
  {
    id: 'security',
    label: 'Bảo mật',
    pillars: ['ai-data-security'],
    textClass: 'text-rose-700',
    badgeClass: 'bg-rose-50 text-rose-700 border-rose-200/80',
  },
];

export function getArticleCategory(pillar: BoostPillarId): BlogCategoryDef {
  return (
    BLOG_CATEGORIES.find((cat) => cat.id !== 'all' && cat.pillars.includes(pillar)) ||
    BLOG_CATEGORIES[1]
  );
}

export const POPULAR_TOPICS: readonly string[] = [
  'AI Agent',
  'ERP',
  'Automation',
  'Bảo mật',
  'Meta Ads',
  'CRM',
  'GitHub',
  'Claude & Gemini',
];

export interface EditorialFormatVisualMeta {
  label: string;
  shortLabel: string;
  tldrLabel: string;
  badgeClass: string;
  accentBarClass: string;
  heroBgClass: string;
  tldrBgClass: string;
}

export const EDITORIAL_FORMAT_META: Record<
  EditorialFormatId | 'legacy',
  EditorialFormatVisualMeta
> = {
  'field-report': {
    label: 'Báo cáo thực tế',
    shortLabel: 'Thực tế',
    tldrLabel: 'Tóm tắt nhanh',
    badgeClass: 'bg-blue-50 text-[#1E40FF] border-blue-200/90',
    accentBarClass: 'from-[#1E40FF] via-[#2563EB] to-[#06B6D4]',
    heroBgClass: 'bg-gradient-to-br from-white via-[#F6FAFF] to-[#EEF6FF] border-blue-200/80',
    tldrBgClass: 'bg-gradient-to-br from-blue-50/90 via-white to-cyan-50/70 border-blue-200/80',
  },
  'forensic-postmortem': {
    label: 'Phân tích sự cố',
    shortLabel: 'Bảo mật',
    tldrLabel: 'Điểm chính cần nắm',
    badgeClass: 'bg-rose-50 text-rose-700 border-rose-200/90',
    accentBarClass: 'from-rose-500 via-orange-500 to-amber-500',
    heroBgClass: 'bg-gradient-to-br from-white via-rose-50/40 to-amber-50/35 border-rose-200/85',
    tldrBgClass: 'bg-gradient-to-br from-rose-50/80 via-white to-amber-50/60 border-rose-200/80',
  },
  'contrarian-essay': {
    label: 'Góc nhìn chuyên sâu',
    shortLabel: 'Góc nhìn',
    tldrLabel: 'Luận điểm chính',
    badgeClass: 'bg-amber-50 text-amber-800 border-amber-200/90',
    accentBarClass: 'from-amber-500 via-orange-500 to-[#1E40FF]',
    heroBgClass: 'bg-gradient-to-br from-[#FFFEFA] via-white to-amber-50/35 border-amber-200/80',
    tldrBgClass: 'bg-gradient-to-br from-amber-50/65 via-white to-slate-50/80 border-amber-200/80',
  },
  'repo-teardown': {
    label: 'Đánh giá mã nguồn',
    shortLabel: 'Mã nguồn',
    tldrLabel: 'Nhận định nhanh',
    badgeClass: 'bg-teal-50 text-teal-800 border-teal-200/90',
    accentBarClass: 'from-teal-500 via-[#0284C7] to-[#1E40FF]',
    heroBgClass: 'bg-gradient-to-br from-white via-teal-50/35 to-sky-50/60 border-teal-200/80',
    tldrBgClass: 'bg-gradient-to-br from-teal-50/70 via-white to-sky-50/65 border-teal-200/80',
  },
  'head-to-head-arena': {
    label: 'So sánh công cụ',
    shortLabel: 'So sánh',
    tldrLabel: 'Tổng kết so sánh',
    badgeClass: 'bg-indigo-50 text-indigo-700 border-indigo-200/90',
    accentBarClass: 'from-indigo-600 via-[#1E40FF] to-[#06B6D4]',
    heroBgClass: 'bg-gradient-to-br from-white via-indigo-50/45 to-cyan-50/50 border-indigo-200/80',
    tldrBgClass: 'bg-gradient-to-br from-indigo-50/75 via-white to-cyan-50/65 border-indigo-200/80',
  },
  'architecture-blueprint': {
    label: 'Thiết kế hệ thống',
    shortLabel: 'Kiến trúc',
    tldrLabel: 'Tóm tắt giải pháp',
    badgeClass: 'bg-sky-50 text-[#0369A1] border-sky-200/90',
    accentBarClass: 'from-[#0284C7] via-[#1E40FF] to-[#06B6D4]',
    heroBgClass: 'bg-gradient-to-br from-white via-sky-50/55 to-blue-50/45 border-sky-200/85',
    tldrBgClass: 'bg-gradient-to-br from-sky-50/80 via-white to-blue-50/70 border-sky-200/80',
  },
  'playbook-manual': {
    label: 'Hướng dẫn triển khai',
    shortLabel: 'Hướng dẫn',
    tldrLabel: 'Tóm tắt quy trình',
    badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200/90',
    accentBarClass: 'from-emerald-500 via-teal-500 to-[#0284C7]',
    heroBgClass: 'bg-gradient-to-br from-white via-emerald-50/35 to-cyan-50/45 border-emerald-200/80',
    tldrBgClass: 'bg-gradient-to-br from-emerald-50/75 via-white to-cyan-50/60 border-emerald-200/80',
  },
  'executive-dossier': {
    label: 'Nghiên cứu & Số liệu',
    shortLabel: 'Nghiên cứu',
    tldrLabel: 'Tóm tắt nổi bật',
    badgeClass: 'bg-violet-50 text-violet-700 border-violet-200/90',
    accentBarClass: 'from-[#1E40FF] via-violet-600 to-[#06B6D4]',
    heroBgClass: 'bg-gradient-to-br from-white via-violet-50/35 to-blue-50/55 border-violet-200/80',
    tldrBgClass: 'bg-gradient-to-br from-violet-50/70 via-white to-blue-50/70 border-violet-200/80',
  },
  legacy: {
    label: 'Kinh nghiệm thực tế',
    shortLabel: 'Chia sẻ',
    tldrLabel: 'Tóm tắt nội dung',
    badgeClass: 'bg-slate-100 text-slate-700 border-slate-200',
    accentBarClass: 'from-[#1E40FF] via-[#0284C7] to-[#06B6D4]',
    heroBgClass: 'bg-white/95 border-slate-200/85',
    tldrBgClass: 'bg-gradient-to-br from-blue-50/85 via-white to-cyan-50/70 border-blue-200/80',
  },
};

export type BlogSortMode = 'newest' | 'deepest' | 'quick';

function parseArticleNum(id: string): number {
  const n = parseInt(id.replace(/^art-/i, ''), 10);
  return Number.isFinite(n) ? n : 0;
}

export function sortCatalogArticles(
  articles: BoostArticleSummary[],
  sortBy: BlogSortMode = 'newest'
): BoostArticleSummary[] {
  const copy = [...articles];
  if (sortBy === 'deepest') {
    copy.sort(
      (a, b) =>
        (b.wordCount || b.readingMinutes * 240) - (a.wordCount || a.readingMinutes * 240) ||
        parseArticleNum(b.id) - parseArticleNum(a.id)
    );
    return copy;
  }
  if (sortBy === 'quick') {
    copy.sort(
      (a, b) =>
        a.readingMinutes - b.readingMinutes ||
        getArticleScheduledDate(b).localeCompare(getArticleScheduledDate(a)) ||
        parseArticleNum(b.id) - parseArticleNum(a.id)
    );
    return copy;
  }
  copy.sort(
    (a, b) =>
      getArticleScheduledDate(b).localeCompare(getArticleScheduledDate(a)) ||
      parseArticleNum(b.id) - parseArticleNum(a.id)
  );
  return copy;
}

export function selectFeaturedSlideArticles(
  published: BoostArticleSummary[],
  limit = 5
): BoostArticleSummary[] {
  const preferredIds = ['art-222', 'art-148', 'art-200', 'art-133', 'art-76'];
  const picked: BoostArticleSummary[] = [];
  const used = new Set<string>();

  for (const id of preferredIds) {
    const found = published.find((a) => a.id === id);
    if (found && !used.has(found.id)) {
      used.add(found.id);
      picked.push(found);
    }
  }

  if (picked.length < limit) {
    const newest = sortCatalogArticles(published, 'newest');
    for (const art of newest) {
      if (picked.length >= limit) break;
      if (!used.has(art.id)) {
        used.add(art.id);
        picked.push(art);
      }
    }
  }

  return picked.slice(0, limit);
}

export function selectMostReadArticles(
  published: BoostArticleSummary[],
  excludeIds: Set<string>,
  limit = 5
): BoostArticleSummary[] {
  const candidates = sortCatalogArticles(published, 'deepest').filter(
    (a) => !excludeIds.has(a.id)
  );
  const picked: BoostArticleSummary[] = [];
  const usedCats = new Set<string>();

  for (const art of candidates) {
    if (picked.length >= limit) break;
    const cat = getArticleCategory(art.pillar).id;
    if (!usedCats.has(cat)) {
      usedCats.add(cat);
      picked.push(art);
    }
  }

  for (const art of candidates) {
    if (picked.length >= limit) break;
    if (!picked.some((p) => p.id === art.id)) {
      picked.push(art);
    }
  }

  return picked.slice(0, limit);
}

export type ReaderFontScale = 'sm' | 'md' | 'lg';

export const BOOKMARKS_STORAGE_KEY = 'domation_blog_bookmarks_v1';
export const READER_FONT_STORAGE_KEY = 'domation_reader_font_v1';
export const BLOG_BOOKMARKS_EVENT = 'domation:blog-bookmarks';

export function readBookmarkedSlugs(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(BOOKMARKS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === 'string') : [];
  } catch {
    return [];
  }
}

export function toggleBookmarkedSlug(slug: string): string[] {
  if (typeof window === 'undefined') return [];
  const current = readBookmarkedSlugs();
  const next = current.includes(slug) ? current.filter((s) => s !== slug) : [slug, ...current];
  try {
    window.localStorage.setItem(BOOKMARKS_STORAGE_KEY, JSON.stringify(next));
    window.dispatchEvent(new CustomEvent(BLOG_BOOKMARKS_EVENT, { detail: next }));
  } catch {
    // ignore storage errors
  }
  return next;
}

export function readReaderFontScale(): ReaderFontScale {
  if (typeof window === 'undefined') return 'md';
  try {
    const val = window.localStorage.getItem(READER_FONT_STORAGE_KEY);
    return val === 'sm' || val === 'md' || val === 'lg' ? val : 'md';
  } catch {
    return 'md';
  }
}

export function saveReaderFontScale(scale: ReaderFontScale): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(READER_FONT_STORAGE_KEY, scale);
  } catch {
    // ignore
  }
}
