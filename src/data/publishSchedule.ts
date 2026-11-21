export const DRIP_START_DATE = '2026-11-21';
export const DRIP_PER_DAY = 15;

const SHARD_RANGES: readonly { start: number; end: number; first?: number }[] = [
  { start: 77, end: 86 },
  { start: 87, end: 96 },
  { start: 97, end: 105 },
  { start: 106, end: 114 },
  { start: 115, end: 122 },
  { start: 123, end: 131 },
  { start: 132, end: 140, first: 133 },
  { start: 141, end: 148, first: 148 },
  { start: 149, end: 158 },
  { start: 159, end: 168 },
  { start: 169, end: 179 },
  { start: 180, end: 190 },
  { start: 191, end: 200, first: 200 },
  { start: 201, end: 211 },
  { start: 212, end: 222, first: 222 },
];

function buildExpansionQueue(): string[] {
  const buckets: string[][] = SHARD_RANGES.map((range) => {
    const ids: string[] = [];
    if (range.first !== undefined) {
      ids.push(`art-${range.first}`);
    }
    for (let n = range.start; n <= range.end; n++) {
      if (n !== range.first) {
        ids.push(`art-${n}`);
      }
    }
    return ids;
  });

  const queue: string[] = [];
  const maxLen = Math.max(...buckets.map((b) => b.length));
  for (let round = 0; round < maxLen; round++) {
    for (const bucket of buckets) {
      if (round < bucket.length) {
        queue.push(bucket[round]);
      }
    }
  }
  return queue;
}

export const EXPANSION_QUEUE: readonly string[] = buildExpansionQueue();

const EXPANSION_INDEX_BY_ID = new Map<string, number>(
  EXPANSION_QUEUE.map((id, idx) => [id, idx])
);

function addDaysIso(baseIso: string, daysToAdd: number): string {
  const [y, m, d] = baseIso.split('-').map((v) => parseInt(v, 10));
  const utc = Date.UTC(y, m - 1, d + daysToAdd);
  return new Date(utc).toISOString().slice(0, 10);
}

export function getVietnamTodayIso(overrideDate?: string): string {
  if (overrideDate && /^\d{4}-\d{2}-\d{2}$/.test(overrideDate)) {
    return overrideDate;
  }
  const nodeProc = (
    globalThis as { process?: { env?: Record<string, string | undefined> } }
  ).process;
  const envDate = nodeProc?.env?.DOMATION_PUBLISH_DATE?.trim();
  if (envDate && /^\d{4}-\d{2}-\d{2}$/.test(envDate)) {
    return envDate;
  }
  return new Date(Date.now() + 7 * 3600 * 1000).toISOString().slice(0, 10);
}

export function isExpansionArticleId(id: string): boolean {
  return EXPANSION_INDEX_BY_ID.has(id);
}

export function getArticleScheduledDate(article: {
  id: string;
  publishedAt?: string;
}): string {
  const qIdx = EXPANSION_INDEX_BY_ID.get(article.id);
  if (qIdx !== undefined) {
    const dayOffset = Math.floor(qIdx / DRIP_PER_DAY);
    return addDaysIso(DRIP_START_DATE, dayOffset);
  }
  return article.publishedAt || '2026-11-20';
}

export function getEffectiveArticleDates(article: {
  id: string;
  publishedAt: string;
  updatedAt: string;
}): { publishedAt: string; updatedAt: string } {
  const scheduled = getArticleScheduledDate(article);
  if (EXPANSION_INDEX_BY_ID.has(article.id)) {
    const effectiveUpdated = article.updatedAt > scheduled ? article.updatedAt : scheduled;
    return { publishedAt: scheduled, updatedAt: effectiveUpdated };
  }
  return { publishedAt: article.publishedAt, updatedAt: article.updatedAt };
}

export function isArticlePublished(
  article: { id: string; publishedAt?: string },
  asOfDate?: string
): boolean {
  if (!EXPANSION_INDEX_BY_ID.has(article.id)) {
    return true;
  }
  const today = getVietnamTodayIso(asOfDate);
  return getArticleScheduledDate(article) <= today;
}

export function filterPublishedArticles<T extends { id: string; publishedAt?: string }>(
  articles: readonly T[],
  asOfDate?: string
): T[] {
  const today = getVietnamTodayIso(asOfDate);
  return articles.filter((art) => isArticlePublished(art, today));
}

export function getPublishedBatchForDate<T extends { id: string; publishedAt?: string }>(
  articles: readonly T[],
  dateIso?: string
): T[] {
  const targetDate = getVietnamTodayIso(dateIso);
  return articles.filter(
    (art) => EXPANSION_INDEX_BY_ID.has(art.id) && getArticleScheduledDate(art) === targetDate
  );
}

export interface DripBatchSummary {
  date: string;
  count: number;
  cumulative: number;
  articleIds: string[];
}

export interface DripScheduleSummary {
  asOfDate: string;
  totalCount: number;
  baselineCount: number;
  publishedCount: number;
  scheduledCount: number;
  todayBatchCount: number;
  nextPublishDate: string | null;
  nextBatchCount: number;
  batches: DripBatchSummary[];
}

export function getDripScheduleSummary(
  articles: readonly { id: string; publishedAt?: string }[],
  asOfDate?: string
): DripScheduleSummary {
  const today = getVietnamTodayIso(asOfDate);
  let baselineCount = 0;
  let publishedCount = 0;
  let scheduledCount = 0;
  let todayBatchCount = 0;

  const byDate = new Map<string, string[]>();

  for (const art of articles) {
    if (!EXPANSION_INDEX_BY_ID.has(art.id)) {
      baselineCount += 1;
      publishedCount += 1;
      continue;
    }
    const sched = getArticleScheduledDate(art);
    const list = byDate.get(sched) || [];
    list.push(art.id);
    byDate.set(sched, list);

    if (sched <= today) {
      publishedCount += 1;
      if (sched === today) {
        todayBatchCount += 1;
      }
    } else {
      scheduledCount += 1;
    }
  }

  const sortedDates = Array.from(byDate.keys()).sort();
  let running = baselineCount;
  const batches: DripBatchSummary[] = sortedDates.map((d) => {
    const ids = byDate.get(d) || [];
    running += ids.length;
    return {
      date: d,
      count: ids.length,
      cumulative: running,
      articleIds: ids,
    };
  });

  const futureBatch = batches.find((b) => b.date > today) || null;

  return {
    asOfDate: today,
    totalCount: articles.length,
    baselineCount,
    publishedCount,
    scheduledCount,
    todayBatchCount,
    nextPublishDate: futureBatch ? futureBatch.date : null,
    nextBatchCount: futureBatch ? futureBatch.count : 0,
    batches,
  };
}

export function getPublishedRelatedSummaries<
  T extends {
    id: string;
    slug: string;
    pillar: string;
    industry: string;
    clusterId?: string;
    relatedSlugs?: string[];
  },
>(summary: T, publishedPool: readonly T[], limit = 3): T[] {
  const used = new Set<string>([summary.slug]);
  const picked: T[] = [];

  if (summary.relatedSlugs && summary.relatedSlugs.length > 0) {
    for (const rSlug of summary.relatedSlugs) {
      if (picked.length >= limit) break;
      const found = publishedPool.find((item) => item.slug === rSlug && !used.has(item.slug));
      if (found) {
        used.add(found.slug);
        picked.push(found);
      }
    }
  }

  const addMatches = (predicate: (item: T) => boolean) => {
    for (const item of publishedPool) {
      if (picked.length >= limit) break;
      if (!used.has(item.slug) && predicate(item)) {
        used.add(item.slug);
        picked.push(item);
      }
    }
  };

  if (summary.clusterId) {
    addMatches((item) => item.clusterId === summary.clusterId);
  }
  addMatches((item) => item.pillar === summary.pillar && item.industry === summary.industry);
  addMatches((item) => item.pillar === summary.pillar || item.industry === summary.industry);
  addMatches(() => true);

  return picked.slice(0, limit);
}
