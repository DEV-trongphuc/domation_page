import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { BOOST_ALL_SHARD_ENTRIES } from '../src/data/boostArticlesAllServer.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');
const OUT_PATH = path.join(ROOT, 'src', 'data', 'boostCatalog.ts');

function extractBlockText(block) {
  if (!block || typeof block !== 'object') return '';
  switch (block.type) {
    case 'prose':
      return [block.heading, block.pullQuote || '', ...(block.paragraphs || []), ...(block.bullets || [])].join(' ');
    case 'chart-dashboard':
      return [
        block.heading,
        block.subtitle || '',
        block.chart?.title || '',
        block.chart?.subtitle || '',
        ...(block.chart?.kpis || []).map((k) => `${k.label} ${k.value}`),
        block.insightSummary || '',
      ].join(' ');
    case 'comparison-matrix':
      return [
        block.heading,
        block.caption || '',
        ...(block.columns || []),
        ...(block.rows || []).flatMap((r) => [r.criterion, ...(r.values || []), r.winnerNote || '']),
        block.footnote || '',
      ].join(' ');
    case 'repo-card':
      return [
        block.heading || '',
        block.repo?.fullName || '',
        block.repo?.category || '',
        block.repo?.bestFor || '',
        block.repo?.avoidWhen || '',
        block.repo?.domationSynergy || '',
      ].join(' ');
    case 'callout-verdict':
      return [block.title, block.body].join(' ');
    case 'code-recipe':
      return [block.heading, block.description || ''].join(' ');
    case 'timeline-flow':
      return [
        block.heading,
        ...(block.items || []).map((it) => `${it.tag} ${it.title} ${it.detail}`),
      ].join(' ');
    case 'checklist-audit':
      return [
        block.heading,
        ...(block.items || []).map((it) => `${it.check} ${it.verificationHow} ${it.passThreshold}`),
      ].join(' ');
    case 'visual-figure':
      return [block.caption, block.alt].join(' ');
    case 'stat-grid':
      return [
        block.heading,
        ...(block.stats || []).map((s) => `${s.value} ${s.label} ${s.context || ''}`),
      ].join(' ');
    case 'myth-vs-reality':
      return [
        block.heading,
        ...(block.pairs || []).map((p) => `${p.myth} ${p.reality} ${p.proofMetric || ''}`),
      ].join(' ');
    case 'decision-tree':
      return [
        block.heading,
        block.subtitle || '',
        ...(block.scenarios || []).map(
          (s) => `${s.condition} ${s.recommendedChoice} ${s.rationale} ${s.avoidIf || ''}`
        ),
      ].join(' ');
    default:
      return '';
  }
}

function countArticleWords(art) {
  const parts = [
    art.title,
    art.metaDescription,
    art.tldrSummary,
    ...(art.keyTakeaways || []),
    ...(art.painPoints || []).map((p) => `${p.title} ${p.detail}`),
    ...(art.implementationChallenges || []).map((c) => `${c.challenge} ${c.rootCause} ${c.domationFix}`),
    ...(art.solutionSteps || []).map((s) => `${s.title} ${s.detail}`),
    ...(art.sections || []).flatMap((s) => [s.heading, ...(s.paragraphs || []), ...(s.bullets || [])]),
    ...(art.blocks || []).map(extractBlockText),
    ...(art.faqs || []).map((f) => `${f.question} ${f.answer}`),
  ];
  return parts.join(' ').trim().split(/\s+/).filter(Boolean).length;
}

const catalogEntries = [];
const seenSlugs = new Set();

for (const entry of BOOST_ALL_SHARD_ENTRIES) {
  for (const art of entry.articles) {
    if (seenSlugs.has(art.slug)) {
      throw new Error(`Duplicate article slug in ${entry.shardId}: ${art.slug}`);
    }
    seenSlugs.add(art.slug);

    const summary = {
      id: art.id,
      number: art.number,
      slug: art.slug,
      title: art.title,
      seoTitle: art.seoTitle,
      metaDescription: art.metaDescription,
      focusKeyword: art.focusKeyword,
      secondaryKeywords: art.secondaryKeywords,
      pillar: art.pillar,
      pillarLabel: art.pillarLabel,
      industry: art.industry,
      searchIntent: art.searchIntent,
      readingMinutes: art.readingMinutes,
      publishedAt: art.publishedAt,
      updatedAt: art.updatedAt,
      coverImage: art.coverImage,
      coverAlt: art.coverAlt,
      screenshotImage: art.screenshotImage,
      screenshotCaption: art.screenshotCaption,
      ...(art.relatedPortfolioId ? { relatedPortfolioId: art.relatedPortfolioId } : {}),
      relatedModuleUrl: art.relatedModuleUrl,
      relatedModuleLabel: art.relatedModuleLabel,
      shardId: art.shardId || entry.shardId,
      wordCount: countArticleWords(art),
      ...(art.editorialFormat ? { editorialFormat: art.editorialFormat } : {}),
      ...(art.schemaType ? { schemaType: art.schemaType } : {}),
      ...(art.clusterId ? { clusterId: art.clusterId } : {}),
      ...(art.relatedSlugs && art.relatedSlugs.length > 0 ? { relatedSlugs: art.relatedSlugs } : {}),
      ...(art.thumbnailHook ? { thumbnailHook: art.thumbnailHook } : {}),
      ...(art.thumbnailBadge ? { thumbnailBadge: art.thumbnailBadge } : {}),
      ...(art.repoMeta?.fullName ? { repoFullName: art.repoMeta.fullName } : {}),
    };

    catalogEntries.push(summary);
  }
}

const fileContent = `import type { BoostArticleSummary } from './boostTypes.ts';

// Auto-generated by scripts/build-boost-catalog.mjs — DO NOT EDIT MANUALLY.
export const BOOST_CATALOG: BoostArticleSummary[] = ${JSON.stringify(catalogEntries, null, 2)};

export function getCatalogSummaryBySlug(slug: string): BoostArticleSummary | undefined {
  const normalized = slug.replace(/^\\/+|\\/+$/g, '');
  return BOOST_CATALOG.find((art) => art.slug === normalized);
}

export function getRelatedCatalogSummaries(
  summary: Pick<BoostArticleSummary, 'slug' | 'pillar' | 'industry' | 'clusterId' | 'relatedSlugs'>,
  limit = 3
): BoostArticleSummary[] {
  const used = new Set<string>([summary.slug]);
  const picked: BoostArticleSummary[] = [];

  if (summary.relatedSlugs && summary.relatedSlugs.length > 0) {
    for (const rSlug of summary.relatedSlugs) {
      if (picked.length >= limit) break;
      const found = BOOST_CATALOG.find((item) => item.slug === rSlug && !used.has(item.slug));
      if (found) {
        used.add(found.slug);
        picked.push(found);
      }
    }
  }

  const addMatches = (predicate: (item: BoostArticleSummary) => boolean) => {
    for (const item of BOOST_CATALOG) {
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
`;

fs.writeFileSync(OUT_PATH, fileContent, 'utf8');
console.log(`Built src/data/boostCatalog.ts with ${catalogEntries.length} article summaries.`);
