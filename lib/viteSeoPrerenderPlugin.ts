import fs from 'node:fs';
import path from 'node:path';
import type { Plugin } from 'vite';
import {
  getCoreStaticRouteSeoConfigs,
  getNotFoundSeoConfig,
} from '../src/data/coreRouteSeo.ts';
import {
  getAllBoostRouteSeoConfigs,
  getBoostHubSeoConfig,
} from '../src/data/boostRouteSeo.ts';
import { BOOST_ARTICLES_PART_1 } from '../src/data/boostArticlesPart1.ts';
import { BOOST_ARTICLES_PART_2 } from '../src/data/boostArticlesPart2.ts';
import { BOOST_ARTICLES_PART_3 } from '../src/data/boostArticlesPart3.ts';
import { BOOST_ARTICLES_PART_4 } from '../src/data/boostArticlesPart4.ts';
import { BOOST_ARTICLES_PART_5 } from '../src/data/boostArticlesPart5.ts';
import type { BoostArticle } from '../src/data/boostTypes.ts';
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
    `  <meta name="application-name" content="DOMATION" />`,
    `  <meta name="author" content="${escapeHtmlAttr(author)}" />`,
    `  <meta name="robots" content="${escapeHtmlAttr(robotsContent)}" />`,
    ...(config.noindex
      ? []
      : [
          `  <link rel="canonical" href="${escapeHtmlAttr(canonicalUrl)}" />`,
          `  <link rel="alternate" hreflang="vi" href="${escapeHtmlAttr(canonicalUrl)}" />`,
          `  <link rel="alternate" hreflang="x-default" href="${escapeHtmlAttr(canonicalUrl)}" />`,
        ]),
    `  <link rel="alternate" type="text/plain" title="LLM Context (GEO)" href="${SITE_URL}/llms.txt" />`,
    `  <link rel="alternate" type="text/plain" title="LLM Full Context (GEO)" href="${SITE_URL}/llms-full.txt" />`,
    `  <link rel="sitemap" type="application/xml" title="Sitemap" href="${SITE_URL}/sitemap.xml" />`,
    ``,
    `  <!-- Open Graph / Facebook / Zalo -->`,
    `  <meta property="og:type" content="${escapeHtmlAttr(ogType)}" />`,
    `  <meta property="og:locale" content="vi_VN" />`,
    `  <meta property="og:site_name" content="DOMATION" />`,
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

function renderStaticRouteBodyHtml(
  config: PageSeoConfig,
  allArticles: BoostArticle[],
  articlesBySlug: Map<string, BoostArticle>
): string {
  const navLinks = [
    { href: '/', label: 'Trang Chủ' },
    { href: '/erp', label: 'ERP 5.0 May Đo' },
    { href: '/boost', label: 'Blog DOMATION' },
    { href: '/crm', label: 'CRM 360°' },
    { href: '/data', label: 'Auto Chia Data' },
    { href: '/automation', label: 'Automation & AI' },
    { href: '/meta-report', label: 'Meta Ads Report' },
    { href: '/web-design', label: 'Thiết Kế Web & Landing Page' },
    { href: '/portfolio', label: 'Portfolio' },
  ];

  const headerHtml = `<header><nav aria-label="Điều hướng chính DOMATION">${navLinks
    .map((l) => `<a href="${l.href}">${escapeHtmlText(l.label)}</a>`)
    .join(' | ')}</nav></header>`;

  const footerHtml = `<footer><p><strong>DOMATION</strong> — Hệ sinh thái hợp nhất Website &amp; Landing Page 3D với CRM Auto Data &lt;5s, Báo cáo Meta &amp; Google Ads gắn Lead, Automation Zalo ZNS &amp; phần mềm ERP 5.0 may đo tích hợp Đa Trợ Lý AI.</p><nav aria-label="Liên kết chân trang"><a href="/boost">Blog DOMATION (74+ bài SEO)</a> | <a href="/erp">ERP 5.0 May Đo</a> | <a href="/llms.txt">llms.txt</a> | <a href="/sitemap.xml">sitemap.xml</a></nav></footer>`;

  const slugMatch = config.path.match(/^\/boost\/([^/]+)$/);
  const matchedArticle = slugMatch ? articlesBySlug.get(slugMatch[1]) : undefined;

  if (matchedArticle) {
    const related = allArticles
      .filter(
        (a) => a.slug !== matchedArticle.slug && a.pillar === matchedArticle.pillar
      )
      .slice(0, 4);

    return `${headerHtml}<main><article><h1>${escapeHtmlText(
      matchedArticle.title
    )}</h1><p>${escapeHtmlText(
      matchedArticle.metaDescription
    )}</p><img src="${escapeHtmlAttr(
      matchedArticle.coverImage
    )}" alt="${escapeHtmlAttr(
      matchedArticle.coverAlt
    )}" width="1376" height="768" /><section><h2>Tóm Tắt Nhanh (GEO TL;DR)</h2><p>${escapeHtmlText(
      matchedArticle.tldrSummary
    )}</p></section><section><h2>Vấn Đề Vận Hành Doanh Nghiệp</h2><ul>${matchedArticle.painPoints
      .map(
        (p) =>
          `<li><strong>${escapeHtmlText(p.title)}</strong>: ${escapeHtmlText(
            p.detail
          )} (${escapeHtmlText(p.impactMetric)})</li>`
      )
      .join('')}</ul></section><section><h2>Kiến Trúc Triển Khai Flow &amp; Hệ Thống</h2><ol>${matchedArticle.solutionSteps
      .map(
        (s) =>
          `<li><strong>${escapeHtmlText(s.title)}</strong>: ${escapeHtmlText(
            s.detail
          )}</li>`
      )
      .join('')}</ol></section>${matchedArticle.sections
      .map(
        (sec) =>
          `<section><h2>${escapeHtmlText(
            sec.heading
          )}</h2>${sec.paragraphs
            .map((p) => `<p>${escapeHtmlText(p)}</p>`)
            .join('')}${
            sec.bullets && sec.bullets.length > 0
              ? `<ul>${sec.bullets
                  .map((b) => `<li>${escapeHtmlText(b)}</li>`)
                  .join('')}</ul>`
              : ''
          }</section>`
      )
      .join('')}<section><h2>Câu Hỏi Thường Gặp</h2>${matchedArticle.faqs
      .map(
        (f) =>
          `<h3>${escapeHtmlText(f.question)}</h3><p>${escapeHtmlText(
            f.answer
          )}</p>`
      )
      .join('')}</section>${
      related.length > 0
        ? `<section><h2>Bài Viết Liên Quan Trên Blog DOMATION</h2><ul>${related
            .map(
              (r) =>
                `<li><a href="/boost/${escapeHtmlAttr(r.slug)}">${escapeHtmlText(
                  r.title
                )}</a></li>`
            )
            .join('')}</ul></section>`
        : ''
    }</article></main>${footerHtml}`;
  }

  if (config.path === '/boost') {
    const heroImg =
      config.ogImage || '/imgs/boost/boost-hero-growth-hub.jpg';
    return `${headerHtml}<main><section><h1>Blog DOMATION — Kiến Thức ERP May Đo, Vibecode, AI 5.0 &amp; Tối Ưu Chuyển Đổi</h1><p>${escapeHtmlText(
      config.description
    )}</p><img src="${escapeHtmlAttr(heroImg)}" alt="${escapeHtmlAttr(
      config.ogImageAlt || config.title
    )}" width="1376" height="768" /></section><section><h2>74+ Bài Viết Chuyên Sâu &amp; Case Study Triển Khai</h2><ul>${allArticles
      .map(
        (a) =>
          `<li><article><h3><a href="/boost/${escapeHtmlAttr(
            a.slug
          )}">${escapeHtmlText(a.title)}</a></h3><p>${escapeHtmlText(
            a.metaDescription
          )}</p></article></li>`
      )
      .join('')}</ul></section></main>${footerHtml}`;
  }

  if (config.noindex) {
    return `${headerHtml}<main><section><h1>404 — Không Tìm Thấy Trang</h1><p>${escapeHtmlText(
      config.description
    )}</p><img src="/imgs/boost/boost-404-lost-compass.jpg" alt="${escapeHtmlAttr(
      config.ogImageAlt || config.title
    )}" width="1376" height="768" /><h2>Điều Hướng Nhanh</h2><ul>${navLinks
      .map((l) => `<li><a href="${l.href}">${escapeHtmlText(l.label)}</a></li>`)
      .join('')}</ul></section></main>${footerHtml}`;
  }

  const matchedPosts = allArticles.filter((a) => a.relatedModuleUrl === config.path);
  const featuredPosts =
    matchedPosts.length >= 4
      ? matchedPosts.slice(0, 8)
      : [
          ...matchedPosts,
          ...allArticles.filter((a) => a.relatedModuleUrl !== config.path),
        ].slice(0, 6);

  const heroVisual = config.ogImage || '/imgs/boost/boost-hero-growth-hub.jpg';
  const heroMeta = inferOgImageMeta(config);
  const heroWidth = heroMeta.width || 1376;
  const heroHeight = heroMeta.height || 768;
  const headingText = config.title.split('|')[0]?.trim() || config.title;

  const jsonLdNodes = Array.isArray(config.jsonLd) ? config.jsonLd : [];
  const featureList: string[] = [];
  const offersList: { name: string; price: string; description?: string; url?: string }[] = [];
  const itemListElements: { name: string; url: string }[] = [];

  for (const node of jsonLdNodes) {
    if (Array.isArray(node.featureList)) {
      for (const f of node.featureList) {
        if (typeof f === 'string' && f.trim()) featureList.push(f.trim());
      }
    }
    const rawOffers = node.offers;
    const offerArray = Array.isArray(rawOffers)
      ? rawOffers
      : rawOffers && typeof rawOffers === 'object'
        ? [rawOffers]
        : [];
    for (const o of offerArray) {
      if (o && typeof o === 'object') {
        const offerObj = o as Record<string, unknown>;
        offersList.push({
          name: typeof offerObj.name === 'string' ? offerObj.name : headingText,
          price: typeof offerObj.price === 'string' ? offerObj.price : String(offerObj.price ?? ''),
          description:
            typeof offerObj.description === 'string' ? offerObj.description : undefined,
          url: typeof offerObj.url === 'string' ? offerObj.url : undefined,
        });
      }
    }
    const mainEntity = node.mainEntity as Record<string, unknown> | undefined;
    if (mainEntity && Array.isArray(mainEntity.itemListElement)) {
      for (const item of mainEntity.itemListElement) {
        if (item && typeof item === 'object') {
          const itemObj = item as Record<string, unknown>;
          if (typeof itemObj.name === 'string' && typeof itemObj.url === 'string') {
            itemListElements.push({ name: itemObj.name, url: itemObj.url });
          }
        }
      }
    }
  }

  const breadcrumbHtml =
    config.breadcrumbs && config.breadcrumbs.length > 0
      ? `<nav aria-label="Breadcrumb">${config.breadcrumbs
          .map((b) => `<a href="${escapeHtmlAttr(b.url)}">${escapeHtmlText(b.name)}</a>`)
          .join(' &gt; ')}</nav>`
      : '';

  const featuresHtml =
    featureList.length > 0
      ? `<section><h2>Kiến Trúc &amp; Tính Năng Cốt Lõi</h2><ul>${featureList
          .map((f) => `<li>${escapeHtmlText(f)}</li>`)
          .join('')}</ul></section>`
      : '';

  const offersHtml =
    offersList.length > 0
      ? `<section><h2>Bảng Giá &amp; Gói Triển Khai</h2><ul>${offersList
          .map(
            (o) =>
              `<li><strong>${escapeHtmlText(o.name)}</strong>${
                o.price && o.price !== '0' ? ` — ${escapeHtmlText(o.price)} VND` : ''
              }${o.description ? `: ${escapeHtmlText(o.description)}` : ''}</li>`
          )
          .join('')}</ul></section>`
      : '';

  const itemListHtml =
    itemListElements.length > 0
      ? `<section><h2>Danh Mục Dự Án &amp; Phân Hệ Triển Khai</h2><ul>${itemListElements
          .map(
            (it) =>
              `<li><a href="${escapeHtmlAttr(it.url)}">${escapeHtmlText(it.name)}</a></li>`
          )
          .join('')}</ul></section>`
      : '';

  const faqsHtml =
    config.faqs && config.faqs.length > 0
      ? `<section><h2>Câu Hỏi Thường Gặp (FAQ)</h2>${config.faqs
          .map(
            (f) =>
              `<article><h3>${escapeHtmlText(f.question)}</h3><p>${escapeHtmlText(
                f.answer
              )}</p></article>`
          )
          .join('')}</section>`
      : '';

  const keywordsHtml =
    config.keywords && config.keywords.length > 0
      ? `<section><h2>Từ Khóa &amp; Chủ Đề Chuyên Sâu</h2><ul>${config.keywords
          .map((kw) => `<li>${escapeHtmlText(kw)}</li>`)
          .join('')}</ul></section>`
      : '';

  return `${headerHtml}<main>${breadcrumbHtml}<section><h1>${escapeHtmlText(
    headingText
  )}</h1><p>${escapeHtmlText(
    config.description
  )}</p><img src="${escapeHtmlAttr(heroVisual)}" alt="${escapeHtmlAttr(
    config.ogImageAlt || config.title
  )}" width="${heroWidth}" height="${heroHeight}" /></section><section id="geo-tldr"><h2>Tóm Tắt Nhanh (GEO Direct Answer)</h2><p>${escapeHtmlText(
    config.description
  )}</p></section>${featuresHtml}${offersHtml}${itemListHtml}${faqsHtml}${keywordsHtml}<section><h2>Bài Viết &amp; Tài Liệu Liên Quan Trên Blog /boost</h2><ul>${featuredPosts
    .map(
      (a) =>
        `<li><a href="/boost/${escapeHtmlAttr(a.slug)}">${escapeHtmlText(
          a.title
        )}</a> — ${escapeHtmlText(a.metaDescription)}</li>`
    )
    .join('')}</ul></section></main>${footerHtml}`;
}

function injectStaticRootBody(html: string, staticBody: string): string {
  const rootPattern = /<div id="root">\s*<\/div>/;
  if (!rootPattern.test(html)) {
    return html;
  }
  return html.replace(
    rootPattern,
    `<div id="root"><div id="domation-seo-prerender" aria-hidden="true" style="position:fixed;left:-99999px;top:0;width:1px;height:1px;overflow:hidden;opacity:0;pointer-events:none;">${staticBody}</div></div>`
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

      const allArticles: BoostArticle[] = [
        ...BOOST_ARTICLES_PART_1,
        ...BOOST_ARTICLES_PART_2,
        ...BOOST_ARTICLES_PART_3,
        ...BOOST_ARTICLES_PART_4,
        ...BOOST_ARTICLES_PART_5,
      ];
      const articlesBySlug = new Map(allArticles.map((a) => [a.slug, a]));

      const coreConfigs = getCoreStaticRouteSeoConfigs();
      const erpConfig = coreConfigs.find((c) => c.path === '/erp');
      const boostHubConfig = getBoostHubSeoConfig();
      const notFoundConfig = getNotFoundSeoConfig('/404');

      const canonicalConfigs: PageSeoConfig[] = [
        ...coreConfigs,
        ...getAllBoostRouteSeoConfigs(),
      ];

      let emittedCount = 0;
      const emitRoute = (
        outputRelPath: string,
        config: PageSeoConfig,
        template: string
      ) => {
        const withHead = injectSeoHeadBlock(template, config);
        const staticBody = renderStaticRouteBodyHtml(
          config,
          allArticles,
          articlesBySlug
        );
        const renderedHtml = injectStaticRootBody(withHead, staticBody);
        const targetPath = outputRelPath
          ? path.join(distRoot, outputRelPath)
          : baseIndexPath;

        fs.mkdirSync(path.dirname(targetPath), { recursive: true });
        fs.writeFileSync(targetPath, renderedHtml, 'utf8');
        emittedCount += 1;
      };

      for (const config of canonicalConfigs) {
        const cleanRoute = config.path.replace(/^\/+|\/+$/g, '');
        const template = cleanRoute === 'crm' ? crmTemplate : baseTemplate;
        const outputRel = cleanRoute
          ? path.join(cleanRoute, 'index.html')
          : '';
        emitRoute(outputRel, config, template);
      }

      // Emit canonical-pointed aliases for static hosting (/blog, /bai-viet -> /boost; /ideas-erp, /enterprise -> /erp)
      emitRoute(path.join('blog', 'index.html'), boostHubConfig, baseTemplate);
      emitRoute(path.join('bai-viet', 'index.html'), boostHubConfig, baseTemplate);
      if (erpConfig) {
        emitRoute(path.join('ideas-erp', 'index.html'), erpConfig, baseTemplate);
        emitRoute(path.join('enterprise', 'index.html'), erpConfig, baseTemplate);
      }

      // Emit dedicated 404.html & /404/index.html (noindex, nofollow, no canonical)
      emitRoute('404.html', notFoundConfig, baseTemplate);
      emitRoute(path.join('404', 'index.html'), notFoundConfig, baseTemplate);

      console.log(
        `[domation-seo-prerender] Pre-rendered SEO/JSON-LD head + semantic body for ${emittedCount} HTML targets.`
      );
    },
  };
}
