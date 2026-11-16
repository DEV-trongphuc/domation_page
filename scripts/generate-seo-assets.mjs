import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { BOOST_ARTICLES_PART_1 } from '../src/data/boostArticlesPart1.ts';
import { BOOST_ARTICLES_PART_2 } from '../src/data/boostArticlesPart2.ts';
import { BOOST_ARTICLES_PART_3 } from '../src/data/boostArticlesPart3.ts';
import { BOOST_ARTICLES_PART_4 } from '../src/data/boostArticlesPart4.ts';
import { BOOST_ARTICLES_PART_5 } from '../src/data/boostArticlesPart5.ts';
import {
  BOOST_74_SEO_TOPICS,
  BOOST_KEYWORD_CLUSTERS,
  INDUSTRY_PAIN_PLAYBOOK,
} from '../src/data/boostSeoData.ts';
import { PORTFOLIO_PROJECTS } from '../src/data/portfolioData.ts';
import { getCrmSeoConfig, getHomeSeoConfig } from '../src/data/coreRouteSeo.ts';
import { injectSeoHeadBlock } from '../lib/viteSeoPrerenderPlugin.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');
const PUBLIC_DIR = path.join(ROOT, 'public');
const SITE_URL = 'https://domation.net';
const TODAY = new Date().toISOString().slice(0, 10);

const ALL_ARTICLES = [
  ...BOOST_ARTICLES_PART_1,
  ...BOOST_ARTICLES_PART_2,
  ...BOOST_ARTICLES_PART_3,
  ...BOOST_ARTICLES_PART_4,
  ...BOOST_ARTICLES_PART_5,
];
const LATEST_ARTICLE_DATE = ALL_ARTICLES.reduce(
  (max, a) => (a.updatedAt > max ? a.updatedAt : max),
  TODAY
);

const CORE_ROUTES = [
  {
    loc: '/',
    changefreq: 'weekly',
    priority: '1.0',
    lastmod: TODAY,
    images: [
      {
        src: '/imgs/og-domation-v2.jpg',
        title: 'Hệ Sinh Thái Công Nghệ Doanh Nghiệp DOMATION.NET — Bespoke Enterprise OS & Multi-Agent AI',
      },
      {
        src: '/imgs/enterprise/sol-multi-agent.webp',
        title: 'Trung Tâm Điều Phối Multi-Agent AI Liên Phòng Ban DOMATION',
      },
      {
        src: '/imgs/enterprise/hero-domation-hub.webp',
        title: 'DOMATION Bespoke Enterprise Hub',
      },
    ],
  },
  {
    loc: '/boost',
    changefreq: 'daily',
    priority: '0.95',
    lastmod: LATEST_ARTICLE_DATE,
    images: [
      {
        src: '/imgs/boost/boost-hero-growth-hub.jpg',
        title: `Blog DOMATION — ${ALL_ARTICLES.length}+ Bài Chuẩn SEO & ${BOOST_74_SEO_TOPICS.length} Chủ Đề Vận Hành 5.0`,
      },
    ],
  },
  {
    loc: '/portfolio',
    changefreq: 'weekly',
    priority: '0.90',
    lastmod: TODAY,
    images: [
      {
        src: '/landingpage_avatar/portfolio.webp',
        title: 'Portfolio Dự Án & Case Study Đa Ngành DOMATION.NET',
      },
      {
        src: '/assets/ecolife/bocmai/bocmai_3d_b3.webp',
        title: 'EcoLife Signature Đà Nẵng — Sa Bàn 3D Bóc Mái & Auto F1 Router',
      },
      {
        src: '/assets/inkica/inkica_aop_3d.jpg',
        title: 'INKICA AI POD Studio — Multi-Agent AI Prepress 208 SKU 3D CAD',
      },
    ],
  },
  {
    loc: '/data',
    changefreq: 'weekly',
    priority: '0.90',
    lastmod: TODAY,
    images: [
      {
        src: '/imgs/enterprise/sol-data-capi.webp',
        title: 'DOMATION Auto Chia Data ZaloBot < 5s & Meta CAPI SHA-256',
      },
      {
        src: '/assets/domation/data_v2_overview.webp',
        title: 'Bảng Điều Khiển Auto Chia Data V2 Real-Time & ZaloBot',
      },
    ],
  },
  {
    loc: '/erp',
    changefreq: 'weekly',
    priority: '0.90',
    lastmod: TODAY,
    images: [
      {
        src: '/imgs/enterprise/sol-erp-operations.webp',
        title: 'DOMATION Enterprise ERP 5.0 (12 Phân Hệ)',
      },
      {
        src: '/ERP-Product/1788856550308_2141578413905312186_2310722037673454867_9dee6011fca6751ff38ce855f9b34ee2.jpg',
        title: 'Dashboard Vận Hành & Phân Bổ Data Doanh Nghiệp ERP 5.0',
      },
    ],
  },
  {
    loc: '/crm',
    changefreq: 'weekly',
    priority: '0.90',
    lastmod: TODAY,
    images: [
      {
        src: '/imgs/enterprise/sol-crm-misa.webp',
        title: 'DOMATION CRM 360° Pipeline Kanban 8 Nấc & Hóa Đơn MISA',
      },
      {
        src: '/crm_imgs/CRMS (1).jpg',
        title: 'Giao Diện DOMATION CRM 360° Dashboard Thực Tế',
      },
    ],
  },
  {
    loc: '/automation',
    changefreq: 'weekly',
    priority: '0.85',
    lastmod: TODAY,
    images: [
      {
        src: '/imgs/enterprise/sol-ai-automation.webp',
        title: 'DOMATION Marketing Automation, Amazon SES & AI RAG 24/7',
      },
      {
        src: '/imgs/home.jpg',
        title: 'Bảng Điều Khiển Marketing Automation Đa Kênh DOMATION',
      },
    ],
  },
  {
    loc: '/meta-report',
    changefreq: 'weekly',
    priority: '0.85',
    lastmod: TODAY,
    images: [
      {
        src: '/imgs/enterprise/sol-web3d-meta.webp',
        title: 'Meta Ad Realtime Report & Video Hook Rate Analytics',
      },
      {
        src: '/meta/admin_log.png',
        title: 'Hệ Thống Giám Sát Admin Audit Log Quảng Cáo Meta',
      },
    ],
  },
  {
    loc: '/web-design',
    changefreq: 'weekly',
    priority: '0.85',
    lastmod: TODAY,
    images: [
      {
        src: '/imgs/enterprise/hero-domation-hub.webp',
        title: 'Thiết Kế Website Doanh Nghiệp & Sa Bàn 3D WebGL Từ 12M₫',
      },
    ],
  },
  {
    loc: '/ideas',
    changefreq: 'monthly',
    priority: '0.75',
    lastmod: TODAY,
    images: [
      {
        src: '/landingpage_avatar/ideasmba.webp',
        title: 'IDEAS Company Ecosystem Portal — Case Study Tuyển Sinh & Automation',
      },
    ],
  },
];

function escapeXml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function toSafeAssetUrl(assetPath) {
  const clean = assetPath.startsWith('/') ? assetPath : `/${assetPath}`;
  return `${SITE_URL}${encodeURI(clean)}`;
}

// Verify every referenced local asset exists in public/
for (const route of CORE_ROUTES) {
  for (const img of route.images) {
    const filePath = path.join(PUBLIC_DIR, img.src.replace(/^\/+/, ''));
    if (!fs.existsSync(filePath)) {
      throw new Error(`Missing sitemap image asset for ${route.loc}: ${filePath}`);
    }
  }
}
for (const art of ALL_ARTICLES) {
  for (const imgPath of [art.coverImage, art.screenshotImage].filter(Boolean)) {
    const filePath = path.join(PUBLIC_DIR, imgPath.replace(/^\/+/, ''));
    if (!fs.existsSync(filePath)) {
      throw new Error(`Missing article image asset for ${art.slug}: ${filePath}`);
    }
  }
}

// 1. Generate sitemap.xml (with Google Image Sitemap extension)
const sitemapEntries = [
  ...CORE_ROUTES.map((r) => {
    const imageXml = r.images
      .map(
        (img) => `    <image:image>
      <image:loc>${escapeXml(toSafeAssetUrl(img.src))}</image:loc>
      <image:title>${escapeXml(img.title)}</image:title>
    </image:image>`
      )
      .join('\n');
    return `  <url>
    <loc>${SITE_URL}${r.loc}</loc>
    <lastmod>${r.lastmod}</lastmod>
    <changefreq>${r.changefreq}</changefreq>
    <priority>${r.priority}</priority>
${imageXml}
  </url>`;
  }),
  ...ALL_ARTICLES.map((art) => {
    const images = [
      {
        loc: toSafeAssetUrl(art.coverImage),
        title: art.title,
        caption: art.coverAlt,
      },
    ];
    if (art.screenshotImage && art.screenshotImage !== art.coverImage) {
      images.push({
        loc: toSafeAssetUrl(art.screenshotImage),
        title: `${art.title} — Giao diện thực tế`,
        caption: art.screenshotCaption || art.coverAlt,
      });
    }
    const imageXml = images
      .map(
        (img) => `    <image:image>
      <image:loc>${escapeXml(img.loc)}</image:loc>
      <image:title>${escapeXml(img.title)}</image:title>
      <image:caption>${escapeXml(img.caption)}</image:caption>
    </image:image>`
      )
      .join('\n');

    return `  <url>
    <loc>${SITE_URL}/boost/${escapeXml(art.slug)}</loc>
    <lastmod>${escapeXml(art.updatedAt)}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.80</priority>
${imageXml}
  </url>`;
  }),
];

const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${sitemapEntries.join('\n')}
</urlset>
`;

fs.writeFileSync(path.join(PUBLIC_DIR, 'sitemap.xml'), sitemapXml, 'utf8');

// 2. Shared core body for llms.txt & llms-full.txt (keeps ## Optional strictly at the end per llmstxt.org spec)
const llmsCoreBody = `# DOMATION.NET — Bespoke Enterprise OS, Auto Data CAPI & Multi-Agent AI

> Công ty TNHH DOMATION Việt Nam (DOMARKETING / DOM MARKETING, sáng lập bởi Huỳnh Trọng Phúc / TurnioDEV) là hệ thống vận hành custom may đo, thiết kế flow riêng cho doanh nghiệp thời đại mới: ERP 5.0 (12 phân hệ, Payroll PDF, Chấm công GPS AI), CRM 360° & Hóa đơn MISA, Auto Chia Data ZaloBot <5s & Meta CAPI SHA-256, Vibecode & Multi-Agent AI RAG 24/7 thời đại 5.0, cùng hệ thống tối ưu quảng cáo, Landing Page CRO & Website/Sa bàn 3D WebGL.

## Core Product & Portfolio Routes
- [Trang chủ DOMATION Enterprise OS](${SITE_URL}/): Hệ thống vận hành custom may đo, thiết kế flow riêng cho doanh nghiệp thời đại mới, 4 trụ cột, Multi-Agent AI Hub và bảng giá SaaS tổng thể.
- [Auto Chia Data ZaloBot & Meta CAPI](${SITE_URL}/data): Phân bổ Lead Round-Robin 5 cổng dưới 5 giây, lọc trùng 180 ngày, Van SLA 120s, đền bù Ticket lỗi 1:1 và bắn Meta CAPI SHA-256 HTTP 200.
- [Enterprise ERP 5.0 May Đo (12 Phân hệ)](${SITE_URL}/erp): Hệ thống vận hành ERP 5.0 custom may đo thiết kế flow riêng (Task Kanban, Chấm công GPS + Selfie AI, Hộp thư Phê duyệt đa cấp PO/Đơn từ, Payroll Engine xuất PDF ký số).
- [CRM 360° & Đồng bộ MISA](${SITE_URL}/crm): Pipeline Kanban 8 nấc, Giỏ hàng live thời gian thực và đồng bộ hóa đơn điện tử MISA hai chiều.
- [Marketing Automation & AI RAG](${SITE_URL}/automation): Visual Flow IF/ELSE rẽ nhánh tự động, Amazon SES 98% Inbox, Zalo ZNS, Voucher Hub, QR Tracking O2O và AI Phòng Ban 24/7.
- [Meta Ad Realtime Report](${SITE_URL}/meta-report): Đối chiếu chi phí Graph API với doanh thu thực CRM, phân tích Video Hook Rate 3s & Creative Fatigue.
- [Thiết kế Website & Sa bàn 3D WebGL](${SITE_URL}/web-design): Trọn gói từ 12.000.000₫ (sở hữu vĩnh viễn source code), Landing Page CRO tốc độ cao, sa bàn Three.js và công cụ dự toán Excel.
- [Portfolio Dự Án & Case Study](${SITE_URL}/portfolio): Hồ sơ triển khai thực tế tại Capital House (EcoLife Signature Đà Nẵng), INKICA AI (208 SKU 3D), IDEAS Business (+300% quy mô MBA, -30% CPA), Phúc Lộc Thọ (30+ cửa hàng, ROAS 5+), Nha khoa Flora, Navastore, RichLand, ImplantSwiss.
- [Blog DOMATION & SEO/GEO Cluster Hub](${SITE_URL}/boost): ${ALL_ARTICLES.length} bài viết chuyên sâu chuẩn SEO, ${BOOST_74_SEO_TOPICS.length} chủ đề SEO, ${BOOST_KEYWORD_CLUSTERS.length} cụm từ khóa Chính–Phụ Ngắn–Dài (Vibecode, AI 5.0, ERP may đo, logic quản trị, tối ưu Ads/Landing/Chiến dịch) và ${INDUSTRY_PAIN_PLAYBOOK.length} cẩm nang ngành nghề.
- [IDEAS Company Ecosystem Portal](${SITE_URL}/ideas): Cổng ứng dụng tùy biến riêng cho Viện IDEAS (Marketing Automation, Meta Realtime Report & Auto Lead Router).

## Verified Pricing & Plans (VND)
- **DOMATION SaaS Suite (Trang chủ /#pricing)**: Starter 2.990.000₫/tháng (30.498.000₫/năm), Growth 4.990.000₫/tháng (50.898.000₫/năm), Bespoke Enterprise (Khảo sát báo giá riêng).
- **Auto Chia Data & Meta CAPI (/data#pricing)**: Dùng thử miễn phí 30 ngày (0₫); Auto Data Standard 1.500.000₫/tháng (1.275.000₫/tháng khi đóng năm); Auto Data Pro 3.000.000₫/tháng; Nâng cấp Automation • CRM 360° • ERP 5.0: 6.000.000₫/tháng.
- **DOMATION CRM 360° (/crm#pricing)**: Starter 250.000₫/user/tháng (năm) hoặc 300.000₫/user/tháng (tháng); Professional 450.000₫/user/tháng (năm) hoặc 550.000₫/user/tháng (tháng); Enterprise theo quy mô.
- **Meta Ad Realtime Report (/meta-report#pricing)**: 490.000₫/tháng (5.880.000₫/năm) hoặc 690.000₫/tháng.
- **Thiết kế Website & Sa bàn 3D WebGL (/web-design)**: Gói Core 8 Module từ 12.000.000₫ thanh toán 1 lần, sở hữu source code vĩnh viễn.
- **Enterprise ERP 5.0 (/erp)**: Thiết kế may đo theo quy mô 12 phân hệ (tư vấn & báo giá trực tiếp).

## Featured Implementation Articles (Singlepost — ${ALL_ARTICLES.length} Guides)
${ALL_ARTICLES.map(
  (art) =>
    `- [#${art.number} ${art.title}](${SITE_URL}/boost/${art.slug}): ${art.metaDescription}`
).join('\n')}

## Contact & Entity Verification
- Website: ${SITE_URL}/
- Founder & Solution Architect: Huỳnh Trọng Phúc (TurnioDEV) — https://turnio.vercel.app/ | Portfolio: https://portfo-turnio.vercel.app/
- Hotline / Zalo: +84 378 859 736 (https://zalo.me/0378859736)
- Email: turniodev@gmail.com
- Facebook: https://www.facebook.com/turni0`;

const llmsTxt = `${llmsCoreBody}

## Optional
- [Full GEO Reference (llms-full.txt)](${SITE_URL}/llms-full.txt): Tài liệu chi tiết gồm ${PORTFOLIO_PROJECTS.length} Case Study Portfolio, ${INDUSTRY_PAIN_PLAYBOOK.length} Industry Playbooks, TL;DR & Fix kỹ thuật ${ALL_ARTICLES.length} bài viết, ${BOOST_74_SEO_TOPICS.length} chủ đề SEO và ${BOOST_KEYWORD_CLUSTERS.length} Keyword Silos.
- [XML Sitemap](${SITE_URL}/sitemap.xml): Toàn bộ ${CORE_ROUTES.length + ALL_ARTICLES.length} URLs chuẩn canonical và Image Sitemap.
- [Robots Policy](${SITE_URL}/robots.txt): Quyền thu thập dữ liệu cho Search & AI Crawlers.
`;

fs.writeFileSync(path.join(PUBLIC_DIR, 'llms.txt'), llmsTxt, 'utf8');

// 3. Generate llms-full.txt (Comprehensive self-contained GEO knowledge context, with ## Optional strictly at the end)
const llmsFull = `${llmsCoreBody}

---

## Portfolio & Verified Case Studies (${PORTFOLIO_PROJECTS.length} Flagship Deployments)
${PORTFOLIO_PROJECTS.map(
  (proj, idx) => `### ${idx + 1}. ${proj.name}
- Client: ${proj.client} | Industry: ${proj.industry} (${proj.category}, ${proj.year})
- Live URL: ${proj.liveUrl || 'Private Enterprise Deployment'}
- Problem: ${proj.problem}
- Implementation Pain: ${proj.implementationPain}
- DOMATION Architecture: ${proj.architecture}
- Deliverables: ${proj.deliverables.join(' | ')}
- Verified Metrics: ${proj.metrics.join(', ')}
- Deep-Dive Article: ${SITE_URL}/boost/${proj.relatedArticleSlug}`
).join('\n\n')}

---

## Industry Pain Points & Implementation Fixes (${INDUSTRY_PAIN_PLAYBOOK.length} Industries)
${INDUSTRY_PAIN_PLAYBOOK.map(
  (ind) => `### ${ind.industry} (${ind.badge})
- Clients: ${ind.representativeClients.join(', ')}
- Pain Points: ${ind.corePainPoints.join(' | ')}
- Deployment Friction: ${ind.deploymentFriction.join(' | ')}
- DOMATION Architecture: ${ind.domationArchitecture}
- Outcomes: ${ind.keyMetrics.join(', ')}
- Target Module: ${SITE_URL}${ind.targetModuleUrl}
- Related Singleposts: ${ind.relatedArticleSlugs.map((s) => `${SITE_URL}/boost/${s}`).join(', ')}`
).join('\n\n')}

---

## Complete Implementation Guides (${ALL_ARTICLES.length} Singlepost Deep Dives)
${ALL_ARTICLES.map(
  (art) => `### #${art.number} ${art.title}
- URL: ${SITE_URL}/boost/${art.slug}
- Pillar: ${art.pillarLabel} | Industry: ${art.industry} | Intent: ${art.searchIntent} | Updated: ${art.updatedAt}
- Focus Keyword: "${art.focusKeyword}" | Secondary: ${art.secondaryKeywords.join(', ')}
- Direct-Answer TL;DR: ${art.tldrSummary}
- Key Takeaways: ${art.keyTakeaways.join(' | ')}
- Pain Points: ${art.painPoints.map((p) => `${p.title} (${p.impactMetric}): ${p.detail}`).join(' || ')}
- Challenges & Fixes: ${art.implementationChallenges.map((c) => `[${c.challenge}] Root Cause: ${c.rootCause} -> Fix: ${c.domationFix}`).join(' || ')}
- Measured Outcomes: ${art.metricsOutcome.map((m) => `${m.label}: ${m.value}`).join(', ')}
- FAQs: ${art.faqs.map((f) => `Q: ${f.question} A: ${f.answer}`).join(' | ')}`
).join('\n\n')}

---

## ${BOOST_74_SEO_TOPICS.length} Curated Enterprise SEO Topics for DOMATION
${BOOST_74_SEO_TOPICS.map(
  (t) =>
    `- [${t.code}] (${t.pillarLabel} | ${t.funnelStage} | ${t.searchIntent}) ${t.title} — Primary KW: "${t.primaryKeyword}" -> Target: ${SITE_URL}${t.targetLandingPage}${t.linkedArticleSlug ? ` | Article: ${SITE_URL}/boost/${t.linkedArticleSlug}` : ''}`
).join('\n')}

---

## Keyword Clusters Summary (${BOOST_KEYWORD_CLUSTERS.length} Silos — Short/Long & Primary/Secondary)
${BOOST_KEYWORD_CLUSTERS.map(
  (c) =>
    `- ${c.name} (${SITE_URL}${c.hubUrl}) | Short-tail: ${(c.shortTailTerms || []).join(', ')} | Long-tail: ${(c.longTailTerms || []).join(', ')} | Keywords: ${c.keywords.map((k) => `${k.keyword} [${k.lsiVariants.join('; ')}]`).join(' | ')}`
).join('\n')}

---

## Optional
- [Concise GEO Index (llms.txt)](${SITE_URL}/llms.txt): Bản tóm tắt chuẩn llmstxt.org cho AI Crawlers.
- [XML Sitemap](${SITE_URL}/sitemap.xml): Toàn bộ ${CORE_ROUTES.length + ALL_ARTICLES.length} URLs chuẩn canonical và Image Sitemap.
- [Robots Policy](${SITE_URL}/robots.txt): Quyền thu thập dữ liệu cho Search & AI Crawlers.
`;

fs.writeFileSync(path.join(PUBLIC_DIR, 'llms-full.txt'), llmsFull, 'utf8');

// 4. Sync vercel.json headers & per-route pre-rendered rewrites
const vercelConfig = {
  headers: [
    {
      source: '/llms.txt',
      headers: [
        { key: 'Content-Type', value: 'text/plain; charset=utf-8' },
        { key: 'Cache-Control', value: 'public, max-age=3600, s-maxage=86400' },
      ],
    },
    {
      source: '/llms-full.txt',
      headers: [
        { key: 'Content-Type', value: 'text/plain; charset=utf-8' },
        { key: 'Cache-Control', value: 'public, max-age=3600, s-maxage=86400' },
      ],
    },
    {
      source: '/robots.txt',
      headers: [
        { key: 'Content-Type', value: 'text/plain; charset=utf-8' },
        { key: 'Cache-Control', value: 'public, max-age=3600, s-maxage=86400' },
      ],
    },
    {
      source: '/sitemap.xml',
      headers: [
        { key: 'Content-Type', value: 'application/xml; charset=utf-8' },
        { key: 'Cache-Control', value: 'public, max-age=3600, s-maxage=86400' },
      ],
    },
  ],
  redirects: [
    { source: '/blog', destination: '/boost', permanent: true },
    { source: '/blog/', destination: '/boost', permanent: true },
    { source: '/blog/:slug', destination: '/boost/:slug', permanent: true },
    { source: '/bai-viet', destination: '/boost', permanent: true },
    { source: '/bai-viet/', destination: '/boost', permanent: true },
    { source: '/bai-viet/:slug', destination: '/boost/:slug', permanent: true },
    { source: '/ideas-erp', destination: '/erp', permanent: true },
    { source: '/ideas-erp/', destination: '/erp', permanent: true },
  ],
  rewrites: [
    ...['crm', 'erp', 'data', 'automation', 'meta-report', 'web-design', 'ideas', 'portfolio', 'boost', '404'].flatMap(
      (route) => [
        { source: `/${route}`, destination: `/${route}/index.html` },
        { source: `/${route}/`, destination: `/${route}/index.html` },
      ]
    ),
    { source: '/404.html', destination: '/404.html' },
    { source: '/magnific', destination: '/index.html' },
    { source: '/magnific/', destination: '/index.html' },
    ...ALL_ARTICLES.flatMap((art) => [
      { source: `/boost/${art.slug}`, destination: `/boost/${art.slug}/index.html` },
      { source: `/boost/${art.slug}/`, destination: `/boost/${art.slug}/index.html` },
    ]),
  ],
};

fs.writeFileSync(path.join(ROOT, 'vercel.json'), `${JSON.stringify(vercelConfig, null, 2)}\n`, 'utf8');

// 5. Sync index.html and crm/index.html pre-hydration SEO & JSON-LD blocks from coreRouteSeo.ts
const indexHtmlPath = path.join(ROOT, 'index.html');
const crmHtmlPath = path.join(ROOT, 'crm', 'index.html');
fs.writeFileSync(
  indexHtmlPath,
  injectSeoHeadBlock(fs.readFileSync(indexHtmlPath, 'utf8'), getHomeSeoConfig()),
  'utf8'
);
fs.writeFileSync(
  crmHtmlPath,
  injectSeoHeadBlock(fs.readFileSync(crmHtmlPath, 'utf8'), getCrmSeoConfig()),
  'utf8'
);

console.log(
  `Generated sitemap.xml (${CORE_ROUTES.length + ALL_ARTICLES.length} URLs + Image Sitemap), llms.txt, llms-full.txt, and synced vercel.json + index.html + crm/index.html successfully.`
);
