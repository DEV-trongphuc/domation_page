import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { BOOST_ALL_ARTICLES, BOOST_ALL_SHARD_ENTRIES } from '../src/data/boostArticlesAllServer.ts';
import { computeArticleWordCount } from '../src/data/boostRouteSeo.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');
const PUBLIC_DIR = path.join(ROOT, 'public');
const VERIFY_IMAGES = process.argv.includes('--verify-images');
const TARGET_SHARD = process.argv.find((a) => a.startsWith('--shard='))?.split('=')[1];

const FORBIDDEN_HEADING_RE =
  /^\s*[1-9]\.\s*(Thực trạng|Thách thức|Khó khăn|Trở ngại|Kiến trúc|Giải pháp|Kết quả|Kết luận)\b/i;

const allSlugs = new Set(BOOST_ALL_ARTICLES.map((a) => a.slug));
const seenSlugs = new Map();
const seenIds = new Map();
const seenFocusKw = new Map();

const errors = [];
const warnings = [];
const shardStats = [];

for (const entry of BOOST_ALL_SHARD_ENTRIES) {
  if (TARGET_SHARD && entry.shardId !== TARGET_SHARD) continue;
  const isNewShard = entry.shardId.startsWith('shard');
  let totalWords = 0;
  let minWords = Infinity;
  let prevFormat = '';

  for (const art of entry.articles) {
    if (seenSlugs.has(art.slug)) {
      errors.push(`[DUP_SLUG] ${art.slug} in ${entry.shardId} (already in ${seenSlugs.get(art.slug)})`);
    } else {
      seenSlugs.set(art.slug, entry.shardId);
    }

    if (seenIds.has(art.id)) {
      errors.push(`[DUP_ID] ${art.id} in ${entry.shardId} (already in ${seenIds.get(art.id)})`);
    } else {
      seenIds.set(art.id, entry.shardId);
    }

    const kwNorm = (art.focusKeyword || '').trim().toLowerCase();
    if (seenFocusKw.has(kwNorm)) {
      warnings.push(`[DUP_KW] "${art.focusKeyword}" (${art.slug} vs ${seenFocusKw.get(kwNorm)})`);
    } else if (kwNorm) {
      seenFocusKw.set(kwNorm, art.slug);
    }

    const wc = computeArticleWordCount(art);
    totalWords += wc;
    if (wc < minWords) minWords = wc;

    if (isNewShard) {
      if (wc < 1400) {
        errors.push(`[LOW_WORD_COUNT] ${entry.shardId} :: ${art.id} (${art.slug}) = ${wc} words (< 1400)`);
      }
      if (!art.blocks || art.blocks.length < 5) {
        errors.push(`[FEW_BLOCKS] ${entry.shardId} :: ${art.id} has ${art.blocks?.length ?? 0} blocks (need >= 5)`);
      }
      if (art.editorialFormat && art.editorialFormat === prevFormat) {
        warnings.push(`[ADJACENT_FORMAT] ${entry.shardId} :: ${art.id} repeats "${art.editorialFormat}"`);
      }
      prevFormat = art.editorialFormat || '';

      for (const blk of art.blocks || []) {
        const heading = 'heading' in blk && blk.heading ? blk.heading : '';
        if (heading && FORBIDDEN_HEADING_RE.test(heading)) {
          errors.push(`[COOKIE_CUTTER_HEADING] ${art.slug} :: "${heading}"`);
        }
        if (blk.type === 'chart-dashboard') {
          if (!blk.chart?.data || blk.chart.data.length < 4) {
            errors.push(`[THIN_CHART] ${art.slug} :: chart "${blk.heading}" has < 4 data points`);
          }
        }
        if (VERIFY_IMAGES && blk.type === 'visual-figure' && blk.src) {
          const p = path.join(PUBLIC_DIR, blk.src.replace(/^\/+/, ''));
          if (!fs.existsSync(p)) {
            errors.push(`[MISSING_FIGURE_IMG] ${art.slug} :: ${blk.src}`);
          }
        }
      }

      const blockTypes = new Set((art.blocks || []).map((b) => b.type));
      if (art.pillar === 'github-vibecode-audit') {
        if (!art.repoMeta || !blockTypes.has('repo-card')) {
          errors.push(`[MISSING_REPO_CARD] ${art.slug}`);
        }
        if (!blockTypes.has('code-recipe')) {
          errors.push(`[MISSING_CODE_RECIPE] Track B ${art.slug}`);
        }
      } else if (art.pillar === 'llm-models-mcp-skills') {
        if (!blockTypes.has('comparison-matrix')) {
          errors.push(`[MISSING_MATRIX] Track C ${art.slug}`);
        }
        if (!blockTypes.has('chart-dashboard')) {
          errors.push(`[MISSING_CHART] Track C ${art.slug}`);
        }
        if (!blockTypes.has('decision-tree')) {
          errors.push(`[MISSING_DECISION_TREE] Track C ${art.slug}`);
        }
      } else {
        if (!blockTypes.has('chart-dashboard')) {
          errors.push(`[MISSING_CHART] Track A ${art.slug}`);
        }
      }

      for (const rSlug of art.relatedSlugs || []) {
        if (!allSlugs.has(rSlug) && !TARGET_SHARD) {
          errors.push(`[BROKEN_RELATED_SLUG] ${art.slug} -> ${rSlug}`);
        }
      }
    }

    if (VERIFY_IMAGES || !isNewShard) {
      for (const imgRel of [art.coverImage, art.screenshotImage].filter(Boolean)) {
        const p = path.join(PUBLIC_DIR, imgRel.replace(/^\/+/, ''));
        if (!fs.existsSync(p)) {
          errors.push(`[MISSING_IMG] ${art.slug} :: ${imgRel}`);
        }
      }
    }
  }

  const count = entry.articles.length;
  shardStats.push({
    shardId: entry.shardId,
    count,
    avgWords: count > 0 ? Math.round(totalWords / count) : 0,
    minWords: count > 0 && minWords < Infinity ? minWords : 0,
  });
}

console.log('=== DOMATION BOOST ARTICLE AUDIT ===');
console.table(shardStats);
console.log(`Total articles loaded: ${BOOST_ALL_ARTICLES.length}`);
console.log(`Warnings (${warnings.length}):`);
warnings.slice(0, 25).forEach((w) => console.log('  WARN:', w));
if (warnings.length > 25) console.log(`  ... +${warnings.length - 25} more warnings`);

if (errors.length > 0) {
  console.error(`\nFAILED with ${errors.length} errors:`);
  errors.slice(0, 50).forEach((e) => console.error('  ERR:', e));
  if (errors.length > 50) console.error(`  ... +${errors.length - 50} more errors`);
  process.exit(1);
}

console.log('\nAUDIT PASSED CLEANLY (0 blocking errors).');
