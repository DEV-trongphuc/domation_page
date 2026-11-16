import fs from 'node:fs';
import path from 'node:path';
import type { Plugin } from 'vite';
import { getCoreStaticRouteSeoConfigs } from '../src/data/coreRouteSeo.ts';
import { getAllBoostRouteSeoConfigs } from '../src/data/boostRouteSeo.ts';
import {
  FOUNDER_PRIMARY_URL,
  SITE_URL,
  buildSeoGraphDocument,
  inferOgImageMeta,
  normalizeIsoDateTime,
  toAbsoluteUrl,
  type PageSeoConfig,
} from '../src/utils/seoSchema.ts';

const SEO_START_MARKER = '<!-- DOMATION_SEO_HEAD_START -->';
const SEO_END_MARKER = '<!-- DOMATION_SEO_HEAD_END -->';

function escapeHtmlAttr(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function escapeHtmlText(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

export function renderRouteSeoHeadBlock(config: PageSeoConfig): string {
  const canonicalUrl = toAbsoluteUrl(config.path);
  const imageMeta = inferOgImageMeta(config);
  const ogImageAlt = config.ogImageAlt || config.title;
  const ogType = config.ogType || 'website';
  const robotsContent = config.noindex
    ? 'noindex, nofollow'
    : 'index, follow, max-image-preview:large, max-snippet:-1';
  const author = config.authorName || 'Huỳnh Trọng Phúc (TurnioDEV) — DOMATION.NET';

  const lines: string[] = [
    SEO_START_MARKER,
    `  <!-- Primary Meta Tags -->`,
    `  <title>${escapeHtmlText(config.title)}</title>`,
    `  <meta name="title" content="${escapeHtmlAttr(config.title)}" />`,
    `  <meta name="description" content="${escapeHtmlAttr(config.description)}" />`,
  ];

  if (config.keywords && config.keywords.length > 0) {
    lines.push(`  <meta name="keywords" content="${escapeHtmlAttr(config.keywords.join(', '))}" />`);
  }

  lines.push(
    `  <meta name="author" content="${escapeHtmlAttr(author)}" />`,
    `  <meta name="robots" content="${escapeHtmlAttr(robotsContent)}" />`,
    `  <link rel="canonical" href="${escapeHtmlAttr(canonicalUrl)}" />`,
    `  <link rel="alternate" type="text/plain" title="LLM Context (GEO)" href="${SITE_URL}/llms.txt" />`,
    `  <link rel="alternate" type="text/plain" title="LLM Full Context (GEO)" href="${SITE_URL}/llms-full.txt" />`,
    `  <link rel="sitemap" type="application/xml" title="Sitemap" href="${SITE_URL}/sitemap.xml" />`,
    ``,
    `  <!-- Open Graph / Facebook / Zalo -->`,
    `  <meta property="og:type" content="${escapeHtmlAttr(ogType)}" />`,
    `  <meta property="og:locale" content="vi_VN" />`,
    `  <meta property="og:site_name" content="DOMATION Việt Nam" />`,
    `  <meta property="og:url" content="${escapeHtmlAttr(canonicalUrl)}" />`,
    `  <meta property="og:title" content="${escapeHtmlAttr(config.title)}" />`,
    `  <meta property="og:description" content="${escapeHtmlAttr(config.description)}" />`,
    `  <meta property="og:image" content="${escapeHtmlAttr(imageMeta.url)}" />`
  );

  if (imageMeta.secureUrl) {
    lines.push(
      `  <meta property="og:image:secure_url" content="${escapeHtmlAttr(imageMeta.secureUrl)}" />`
    );
  }
  if (imageMeta.type) {
    lines.push(`  <meta property="og:image:type" content="${escapeHtmlAttr(imageMeta.type)}" />`);
  }
  if (imageMeta.width !== undefined) {
    lines.push(`  <meta property="og:image:width" content="${imageMeta.width}" />`);
  }
  if (imageMeta.height !== undefined) {
    lines.push(`  <meta property="og:image:height" content="${imageMeta.height}" />`);
  }
  lines.push(`  <meta property="og:image:alt" content="${escapeHtmlAttr(ogImageAlt)}" />`);

  if (ogType === 'article') {
    if (config.publishedTime) {
      lines.push(
        `  <meta property="article:published_time" content="${escapeHtmlAttr(
          normalizeIsoDateTime(config.publishedTime, '08:00:00+07:00')
        )}" />`
      );
    }
    if (config.modifiedTime) {
      lines.push(
        `  <meta property="article:modified_time" content="${escapeHtmlAttr(
          normalizeIsoDateTime(config.modifiedTime, '09:00:00+07:00')
        )}" />`
      );
    }
    if (config.section) {
      lines.push(`  <meta property="article:section" content="${escapeHtmlAttr(config.section)}" />`);
    }
    lines.push(
      `  <meta property="article:author" content="${escapeHtmlAttr(FOUNDER_PRIMARY_URL)}" />`
    );
  }

  lines.push(
    ``,
    `  <!-- Twitter / X -->`,
    `  <meta name="twitter:card" content="summary_large_image" />`,
    `  <meta name="twitter:url" content="${escapeHtmlAttr(canonicalUrl)}" />`,
    `  <meta name="twitter:title" content="${escapeHtmlAttr(config.title)}" />`,
    `  <meta name="twitter:description" content="${escapeHtmlAttr(config.description)}" />`,
    `  <meta name="twitter:image" content="${escapeHtmlAttr(imageMeta.url)}" />`,
    `  <meta name="twitter:image:alt" content="${escapeHtmlAttr(ogImageAlt)}" />`
  );

  const graphDocument = buildSeoGraphDocument(config);
  if (graphDocument) {
    const safeJson = JSON.stringify(graphDocument, null, 2).replace(/</g, '\\u003c');
    lines.push(
      ``,
      `  <!-- Structured Data JSON-LD (Unified GEO Entity Graph) -->`,
      `  <script type="application/ld+json" data-domation-seo="true">`,
      safeJson,
      `  </script>`
    );
  }

  lines.push(`  ${SEO_END_MARKER}`);
  return lines.join('\n');
}

export function injectSeoHeadBlock(htmlTemplate: string, config: PageSeoConfig): string {
  const startIdx = htmlTemplate.indexOf(SEO_START_MARKER);
  const endIdx = htmlTemplate.indexOf(SEO_END_MARKER);
  if (startIdx === -1 || endIdx === -1 || endIdx < startIdx) {
    throw new Error(`Missing SEO head markers in HTML template for route ${config.path}`);
  }
  const block = renderRouteSeoHeadBlock(config);
  return (
    htmlTemplate.slice(0, startIdx) +
    block +
    htmlTemplate.slice(endIdx + SEO_END_MARKER.length)
  );
}

export function seoPrerenderPlugin(): Plugin {
  let outDir = 'dist';
  let isBuild = false;

  return {
    name: 'domation-seo-prerender',
    configResolved(resolved) {
      outDir = resolved.build.outDir || 'dist';
      isBuild = resolved.command === 'build';
    },
    closeBundle() {
      if (!isBuild) return;
      const distRoot = path.resolve(process.cwd(), outDir);
      const baseIndexPath = path.join(distRoot, 'index.html');
      if (!fs.existsSync(baseIndexPath)) return;

      const baseTemplate = fs.readFileSync(baseIndexPath, 'utf8');
      const crmIndexPath = path.join(distRoot, 'crm', 'index.html');
      const crmTemplate = fs.existsSync(crmIndexPath)
        ? fs.readFileSync(crmIndexPath, 'utf8')
        : baseTemplate;

      const allConfigs: PageSeoConfig[] = [
        ...getCoreStaticRouteSeoConfigs(),
        ...getAllBoostRouteSeoConfigs(),
      ];

      let emittedCount = 0;
      for (const config of allConfigs) {
        const cleanRoute = config.path.replace(/^\/+|\/+$/g, '');
        const template = cleanRoute === 'crm' ? crmTemplate : baseTemplate;
        const renderedHtml = injectSeoHeadBlock(template, config);
        const targetPath = cleanRoute
          ? path.join(distRoot, cleanRoute, 'index.html')
          : baseIndexPath;

        fs.mkdirSync(path.dirname(targetPath), { recursive: true });
        fs.writeFileSync(targetPath, renderedHtml, 'utf8');
        emittedCount += 1;
      }

      console.log(`[domation-seo-prerender] Pre-rendered SEO/JSON-LD head for ${emittedCount} routes.`);
    },
  };
}
