import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { BOOST_ALL_ARTICLES } from '../src/data/boostArticlesAllServer.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');
const OUT_PATH = path.join(ROOT, 'scripts', '.visual-specs-cache.json');

const specs = [];

for (const art of BOOST_ALL_ARTICLES) {
  const needsV2Cover = Boolean(art.coverImage?.startsWith('/imgs/boost/v2/'));
  const needsChartImg = Boolean(art.screenshotImage?.startsWith('/imgs/boost/charts/'));
  const figureTargets = (art.blocks || [])
    .filter((b) => b.type === 'visual-figure' && b.src?.startsWith('/imgs/boost/charts/'))
    .map((b) => ({ src: b.src, alt: b.alt, caption: b.caption, badge: b.badge || '' }));

  if (!needsV2Cover && !needsChartImg && figureTargets.length === 0) continue;

  const firstChart = (art.blocks || []).find((b) => b.type === 'chart-dashboard');
  const firstMatrix = (art.blocks || []).find((b) => b.type === 'comparison-matrix');

  specs.push({
    id: art.id,
    number: art.number,
    slug: art.slug,
    title: art.title,
    pillar: art.pillar,
    pillarLabel: art.pillarLabel,
    industry: art.industry,
    editorialFormat: art.editorialFormat || 'field-report',
    thumbnailTheme: art.thumbnailTheme || 'slate-cobalt-exec',
    thumbnailTitle: art.thumbnailTitle || art.title,
    thumbnailHook: art.thumbnailHook || art.metaDescription.slice(0, 95),
    thumbnailBadge: art.thumbnailBadge || art.pillarLabel,
    coverImage: art.coverImage,
    screenshotImage: art.screenshotImage,
    screenshotCaption: art.screenshotCaption,
    metricsOutcome: art.metricsOutcome || [],
    repoMeta: art.repoMeta || null,
    chartBlock: firstChart || null,
    matrixBlock: firstMatrix || null,
    figureTargets,
  });
}

fs.writeFileSync(OUT_PATH, JSON.stringify(specs, null, 2), 'utf8');
console.log(`Exported ${specs.length} visual generation specs to ${OUT_PATH}`);
