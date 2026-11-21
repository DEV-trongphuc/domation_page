import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

import {
  LP_ROOT,
  DIST_DIR,
  fileExists,
  readText,
  startPreviewServer,
  extractTitle,
  extractMeta,
  getMetaContent,
  extractLinks,
  extractJsonLdGraphs,
  extractHeadings,
  extractScripts,
  stripHtml,
  extractRootSemanticStructure,
  parseSitemapXml,
  parseLlmsMarkdown,
  stripTsComments,
} from './helpers/frontend-e2e-harness.mjs';

const STALE_DEDUP_90D_RE =
  /(?:lọc\s*trùng|chống\s*trùng|trùng\s*lặp|dedup(?:e|lication)?|quay\s*lại\s*trong)[^\n.]{0,40}(?<![0-9][–-])\b90\s*ngày|(?<![0-9][–-])\b90\s*ngày[^\n.]{0,25}(?:lọc\s*trùng|chống\s*trùng|dedup)/i;

function collectMatchingTsxFiles(dir, pattern) {
  if (!fs.existsSync(dir)) return [];
  const results = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...collectMatchingTsxFiles(full, pattern));
    } else if (entry.isFile() && /\.(tsx|ts)$/.test(entry.name) && pattern.test(entry.name)) {
      results.push(full);
    }
  }
  return results;
}

function readLandingWithFlywheel(entryRelPath) {
  const entrySrc = readText(path.join(LP_ROOT, entryRelPath));
  const componentsDir = path.join(LP_ROOT, 'src/components');
  const flywheelFiles = fs.existsSync(componentsDir)
    ? fs
        .readdirSync(componentsDir)
        .filter((f) => /(?:closed[-_]?loop|flywheel)/i.test(f) && /\.(tsx|ts)$/.test(f))
    : [];
  const importedParts = [];
  for (const file of flywheelFiles) {
    const baseName = file.replace(/\.(tsx|ts)$/, '');
    if (entrySrc.includes(baseName)) {
      importedParts.push(readText(path.join(componentsDir, file)));
    }
  }
  return {
    entrySrc,
    importedFlywheelSrc: importedParts.join('\n'),
    combined: entrySrc + '\n' + importedParts.join('\n'),
  };
}

const CORE_ROUTES = [
  '/',
  '/data',
  '/crm',
  '/erp',
  '/automation',
  '/meta-report',
  '/web-design',
  '/portfolio',
  '/boost',
];

const CAPI_STAGES_CANONICAL = [
  { stage: 'Qualified', event: 'Lead' },
  { stage: 'Booked', event: 'Schedule' },
  { stage: 'Booking', event: 'InitiateCheckout' },
  { stage: 'Deposited', event: 'AddPaymentInfo' },
  { stage: 'Closed', event: 'Purchase' },
  { stage: 'Badtiming', event: 'Skip' },
  { stage: 'NoAnswer', event: 'Skip' },
  { stage: 'Notlead', event: 'DisqualifiedLead' },
  { stage: 'Spam', event: 'DisqualifiedLead' },
];

async function importTs(relPath) {
  return import(pathToFileURL(path.join(LP_ROOT, relPath)).href);
}

describe('F1–F4: Landing Redesign, Closed-Loop, SEO/GEO/CWV & Vietnam Strategy Doc', () => {
  let preview;

  before(async () => {
    preview = await startPreviewServer({ requireDist: true });
  });

  after(async () => {
    if (preview) {
      await preview.stop();
    }
  });

  // =========================================================================
  // F1 — Landing Page Concise Redesign & Route Truth (5 Tier 1 + 5 Tier 2)
  // =========================================================================

  describe('F1 Tier 1: Core Routes, /enterprise, /crm Truth & Quiet Luxury', () => {
    it('F1-T1.1: All 9 core landing routes return HTTP 200 with prerendered <header><main><footer>, single <h1>, and indexable robots', async () => {
      for (const route of CORE_ROUTES) {
        const bareRes = await preview.fetchText(route);
        assert.equal(bareRes.status, 200, `Expected HTTP 200 for ${route}`);

        const prerendered = await preview.fetchPrerenderedRoute(route);
        assert.equal(prerendered.status, 200, `Expected HTTP 200 for prerendered ${route}`);

        const sem = extractRootSemanticStructure(prerendered.body);
        assert.equal(sem.hasNonEmptyRoot, true, `${route}: <div id="root"> must contain prerendered body`);
        assert.equal(sem.hasHeader, true, `${route}: missing <header>`);
        assert.equal(sem.hasMain, true, `${route}: missing <main>`);
        assert.equal(sem.hasFooter, true, `${route}: missing <footer>`);
        assert.equal(sem.h1Count, 1, `${route}: expected exactly 1 <h1>, got ${sem.h1Count}`);

        const robots = getMetaContent(prerendered.body, 'name', 'robots') || '';
        assert.ok(!robots.includes('noindex'), `${route}: core route must not be noindex (got "${robots}")`);
      }
    });

    it('F1-T1.2: /enterprise does NOT fall through to 404 (handled in router/vercel/prerender)', () => {
      const mainTsx = readText(path.join(LP_ROOT, 'src/main.tsx'));
      const vercelJson = JSON.parse(readText(path.join(LP_ROOT, 'vercel.json')));

      const handledInRouter = /['"]\/enterprise['"]/.test(mainTsx) || /page=enterprise/.test(mainTsx);
      const handledInVercelRedirects = (vercelJson.redirects || []).some((r) => r.source === '/enterprise');
      const handledInVercelRewrites = (vercelJson.rewrites || []).some((r) => r.source === '/enterprise');

      assert.ok(
        handledInRouter || handledInVercelRedirects || handledInVercelRewrites,
        '/enterprise must be explicitly routed/redirected in src/main.tsx or vercel.json instead of falling through to NotFoundPage'
      );
      if (handledInRouter) {
        assert.ok(
          /path\s*===\s*['"]\/enterprise['"]/.test(mainTsx),
          'src/main.tsx must explicitly match path === "/enterprise"'
        );
      }
    });

    it('F1-T1.3: /crm routing and prerendered SEO/pricing truth are aligned (no isCrm = false split-brain)', async () => {
      const mainTsx = readText(path.join(LP_ROOT, 'src/main.tsx'));
      assert.ok(
        !/const\s+isCrm\s*=\s*false\b/.test(mainTsx),
        'src/main.tsx still contains dead "const isCrm = false" causing /crm split-brain with crm/index.html'
      );

      const crmRes = await preview.fetchPrerenderedRoute('/crm');
      assert.equal(crmRes.status, 200);
      const graphs = extractJsonLdGraphs(crmRes.body);
      const allOffers = graphs.flatMap((g) =>
        (g.parsed?.['@graph'] || []).flatMap((node) => node.offers || [])
      );
      for (const offer of allOffers) {
        const priceNum = Number(offer.price || 0);
        assert.ok(
          priceNum !== 250000 && priceNum !== 450000,
          `Prerendered /crm JSON-LD still emits stale per-user 250k/450k offer (${offer.price}); must align with unified catalog`
        );
      }
    });

    it('F1-T1.4: Quiet Luxury styling unified across landing pages and zero dead /#pricing links on /automation', () => {
      const files = [
        'src/DomationHome.tsx',
        'src/DomationDataLanding.tsx',
        'src/ErpLanding.tsx',
        'src/App.tsx',
        'src/CrmLanding.tsx',
      ];
      for (const rel of files) {
        const src = readText(path.join(LP_ROOT, rel));
        const hasQuietLuxuryToken =
          src.includes('LuxuryGoldBackdrop') ||
          src.includes('ql-eyebrow') ||
          src.includes('inkica-glass-card') ||
          src.includes('ql-btn-outline') ||
          src.includes('#1E40FF');
        assert.ok(hasQuietLuxuryToken, `${rel} must use unified Quiet Luxury styling tokens`);
      }

      const appSrc = readText(path.join(LP_ROOT, 'src/App.tsx'));
      const hidesPricing = /showLegacyPricing\s*=\s*false/.test(appSrc) || !appSrc.includes('id="pricing"');
      if (hidesPricing) {
        assert.ok(
          !appSrc.includes('#pricing'),
          'src/App.tsx (/automation) hides #pricing yet still contains dead #pricing or /#pricing anchor references'
        );
      }
      assert.ok(
        !appSrc.includes('holo-card') && !appSrc.includes('shimmer-text'),
        'src/App.tsx (/automation) still contains legacy holo-card/shimmer-text styling instead of unified Quiet Luxury'
      );
    });

    it('F1-T1.5: Home landing page stays concise without multi-section EcoLife showcase duplication', () => {
      const homeSrc = readText(path.join(LP_ROOT, 'src/DomationHome.tsx'));
      const sectionMatches = [...homeSrc.matchAll(/<section\b([^>]*)>/g)];
      assert.ok(
        sectionMatches.length >= 4 && sectionMatches.length <= 12,
        `DomationHome section count (${sectionMatches.length}) should remain concise`
      );

      // Verify EcoLife showcase is not duplicated across multiple separate sections
      const sectionBlocks = [...homeSrc.matchAll(/<section\b[^>]*>[\s\S]*?<\/section>/g)].map((m) => m[0]);
      assert.ok(sectionBlocks.length >= 4, 'DomationHome.tsx must contain well-formed <section>...</section> blocks');
      const sectionsWithEcolifeShowcase = sectionBlocks.filter((block) => {
        const sanitized = block.replace(/excludeFlagshipIds=\{[^}]*\}/g, '');
        return /EcoLife/i.test(sanitized);
      });
      assert.ok(
        sectionsWithEcolifeShowcase.length <= 1,
        `EcoLife appears across ${sectionsWithEcolifeShowcase.length} separate sections in DomationHome.tsx; trim duplicate case bloat`
      );
    });
  });

  describe('F1 Tier 2: Boundary & Negative Routing Cases', () => {
    it('F1-T2.1: /404 and /404.html emit noindex, nofollow and zero canonical link', async () => {
      for (const route of ['/404', '/404.html']) {
        const res = await preview.fetchText(route);
        assert.equal(res.status, 200);
        const robots = getMetaContent(res.body, 'name', 'robots');
        assert.equal(robots, 'noindex, nofollow', `${route} must have robots="noindex, nofollow"`);
        const links = extractLinks(res.body);
        const canonical = links.find((l) => l.rel === 'canonical');
        assert.equal(canonical, undefined, `${route} must NOT emit <link rel="canonical">`);
      }
    });

    it('F1-T2.2: Alias prerendered pages (/blog, /bai-viet, /ideas-erp) point canonical to primary URLs', async () => {
      const aliasTargets = [
        { route: '/blog', expectedCanonical: 'https://domation.net/boost' },
        { route: '/bai-viet', expectedCanonical: 'https://domation.net/boost' },
        { route: '/ideas-erp', expectedCanonical: 'https://domation.net/erp' },
      ];
      for (const { route, expectedCanonical } of aliasTargets) {
        const res = await preview.fetchPrerenderedRoute(route);
        assert.equal(res.status, 200);
        const canonical = extractLinks(res.body).find((l) => l.rel === 'canonical');
        assert.equal(canonical?.href, expectedCanonical, `${route} canonical mismatch`);
      }
    });

    it('F1-T2.3: Subdomain & query-param routes in src/main.tsx exclude /portfolio and /boost/:slug', () => {
      const mainTsx = readText(path.join(LP_ROOT, 'src/main.tsx'));
      assert.ok(
        mainTsx.includes('!isPortfolio') && mainTsx.includes('!isBoostHub') && mainTsx.includes('!singlePostSlug'),
        'Subdomain fallback routing must preserve /portfolio, /boost, and /boost/:slug precedence'
      );
    });

    it('F1-T2.4: Unknown routes in src/main.tsx terminate in <NotFoundPage /> fallback', () => {
      const mainTsx = readText(path.join(LP_ROOT, 'src/main.tsx'));
      assert.ok(
        mainTsx.includes('<NotFoundPage'),
        'src/main.tsx must render <NotFoundPage /> for unmatched paths'
      );
    });

    it('F1-T2.5: Every core route has non-empty <title> and <meta name="description"> >= 40 chars', async () => {
      for (const route of CORE_ROUTES) {
        const res = await preview.fetchPrerenderedRoute(route);
        const title = extractTitle(res.body);
        const desc = getMetaContent(res.body, 'name', 'description');
        assert.ok(title && title.length >= 10, `${route} missing valid <title>`);
        assert.ok(desc && desc.length >= 40, `${route} description too short`);
      }
    });
  });

  // =========================================================================
  // F2 Landing — Closed-Loop Meta Ads <-> CRM <-> CAPI (3 Tier 1 + 3 Tier 2)
  // =========================================================================

  describe('F2 Landing Tier 1: Closed-Loop Circle & 9-Stage CAPI Showcase', () => {
    it('F2-T1.1: Home page (DomationHome.tsx) contains dedicated Closed-Loop Circle section covering Ads -> <5s Routing/120s SLA/1:1 -> Sale -> CAPI', () => {
      const { combined } = readLandingWithFlywheel('src/DomationHome.tsx');
      const hasLoopSection =
        /closed[-_ ]?loop|vòng\s*tròn|flywheel/i.test(combined) &&
        /Meta\s*(?:Lead\s*)?Ads|Facebook/i.test(combined) &&
        /<\s*5\s*(?:s|giây)/i.test(combined) &&
        /120\s*(?:s|giây)/i.test(combined) &&
        /(?:1:1|1-đổi-1)/i.test(combined) &&
        /CAPI/i.test(combined) &&
        /SHA-?256/i.test(combined);

      assert.ok(
        hasLoopSection,
        'DomationHome.tsx must include a dedicated Closed-Loop Circle section (Ads -> <5s Routing + 120s SLA + 1:1 Refund -> Sale -> SHA-256 CAPI learning)'
      );
    });

    it('F2-T1.2: /data landing (DomationDataLanding.tsx) contains dedicated Closed-Loop Circle section', () => {
      const { combined } = readLandingWithFlywheel('src/DomationDataLanding.tsx');
      const hasLoopSection =
        /closed[-_ ]?loop|vòng\s*tròn|flywheel/i.test(combined) &&
        /<\s*5\s*(?:s|giây)/i.test(combined) &&
        /120\s*(?:s|giây)/i.test(combined) &&
        /(?:1:1|1-đổi-1)/i.test(combined) &&
        /CAPI/i.test(combined) &&
        /SHA-?256/i.test(combined);

      assert.ok(
        hasLoopSection,
        'DomationDataLanding.tsx must include a dedicated Closed-Loop Circle section with full loop metrics'
      );
    });

    it('F2-T1.3: Landing Closed-Loop copy matches canonical 9-stage CAPI events from AdsCapiPanel.tsx', () => {
      const capiSrc = readText(path.join(LP_ROOT, 'src/components/autodata/cloned/components/AdsCapiPanel.tsx'));
      for (const { stage, event } of CAPI_STAGES_CANONICAL) {
        assert.ok(capiSrc.includes(stage), `AdsCapiPanel missing stage ${stage}`);
        assert.ok(capiSrc.includes(event), `AdsCapiPanel missing Meta CAPI event ${event}`);
      }

      const homeLoop = readLandingWithFlywheel('src/DomationHome.tsx');
      const dataLoop = readLandingWithFlywheel('src/DomationDataLanding.tsx');
      const combinedLanding = homeLoop.combined + '\n' + dataLoop.combined;

      for (const eventName of ['Lead', 'Schedule', 'InitiateCheckout', 'AddPaymentInfo', 'Purchase', 'DisqualifiedLead', 'Skip']) {
        assert.ok(
          combinedLanding.includes(eventName),
          `Landing Closed-Loop showcase must accurately document 9-stage Meta CAPI event "${eventName}"`
        );
      }
    });

    it('F2-T1.4: In-app Flywheel cockpit (autodata & dom-meta) connects Ads Ingress -> <5s/SLA Auto-Routing -> CAPI/SHA-256 feedback', () => {
      const autodataDir = path.join(LP_ROOT, 'src/components/autodata');
      const domMetaDir = path.join(LP_ROOT, 'src/components/dom-meta');
      const cockpitFiles = [
        ...collectMatchingTsxFiles(autodataDir, /(?:flywheel|cockpit|closed[-_]?loop)/i),
        ...collectMatchingTsxFiles(domMetaDir, /(?:flywheel|cockpit|closed[-_]?loop)/i),
      ];
      const dashboardSrc = readText(path.join(autodataDir, 'cloned/pages/Dashboard.tsx'));
      const wsSrc = readText(path.join(domMetaDir, 'DomMetaReportWorkspace.tsx'));
      const candidateSources = [
        ...cockpitFiles.map((f) => stripTsComments(readText(f))),
        stripTsComments(dashboardSrc),
        stripTsComments(wsSrc),
      ];

      const hasUnifiedCockpit = candidateSources.some(
        (src) =>
          /(?:flywheel|closed[-_ ]?loop|vòng\s*tròn\s*tối\s*ưu)/i.test(src) &&
          /(?:\/meta-report|Meta\s*Ads|Google\s*Ads)/i.test(src) &&
          /(?:<\s*5\s*(?:s|giây)|120\s*(?:s|giây)|auto[-_ ]?rout|round)/i.test(src) &&
          /CAPI/i.test(src) &&
          /SHA-?256/i.test(src)
      );

      assert.ok(
        hasUnifiedCockpit,
        'M4 in-app Flywheel cockpit missing in src/components/autodata/ or src/components/dom-meta/ connecting Ads Ingress -> <5s/120s SLA Auto-Routing -> SHA-256 CAPI feedback'
      );
    });
  });

  describe('F2 Landing Tier 2: Interactivity, Accessibility & Signal Boundaries', () => {
    it('F2-T2.1: Closed-Loop section exposes interactive stage selector controls with accessible attributes', () => {
      const homeLoop = readLandingWithFlywheel('src/DomationHome.tsx');
      const dataLoop = readLandingWithFlywheel('src/DomationDataLanding.tsx');
      const flywheelSrc = homeLoop.importedFlywheelSrc || dataLoop.importedFlywheelSrc;
      const combined = homeLoop.combined + '\n' + dataLoop.combined;

      const hasClosedLoopInteractive =
        (flywheelSrc.length > 0 &&
          /(?:aria-pressed|aria-selected|role="tab")/.test(flywheelSrc) &&
          /DisqualifiedLead|Purchase|CAPI/i.test(flywheelSrc)) ||
        /(?:closed-?loop|vòng\s*tròn\s*tối\s*ưu)[\s\S]{0,4000}(?:aria-pressed|aria-selected|role="tab")[\s\S]{0,4000}(?:DisqualifiedLead|Purchase|SHA-?256)/i.test(combined);

      assert.ok(
        hasClosedLoopInteractive,
        'Closed-Loop Circle UI must expose accessible interactive stage selector controls (aria-pressed/aria-selected/role="tab") alongside CAPI loop stages'
      );
    });

    it('F2-T2.2: Closed-Loop copy distinguishes positive signals, neutral Skip (Badtiming/NoAnswer), and negative DisqualifiedLead (Notlead/Spam)', () => {
      const homeLoop = readLandingWithFlywheel('src/DomationHome.tsx');
      const dataLoop = readLandingWithFlywheel('src/DomationDataLanding.tsx');
      const combined = homeLoop.combined + '\n' + dataLoop.combined;

      assert.ok(combined.includes('DisqualifiedLead'), 'Closed-Loop must explicitly explain DisqualifiedLead exclusion feedback');
      assert.ok(combined.includes('Skip'), 'Closed-Loop must explicitly explain neutral Skip handling');
      assert.ok(
        /Spam|Notlead|rác|sai tệp/i.test(combined),
        'Closed-Loop must explain filtering Spam/Notlead out of Meta optimization'
      );
    });

    it('F2-T2.3: Closed-Loop copy specifies SHA-256 privacy hashing and Forward-Only / Meta CAPI server delivery', () => {
      const homeLoop = readLandingWithFlywheel('src/DomationHome.tsx');
      const dataLoop = readLandingWithFlywheel('src/DomationDataLanding.tsx');
      const capiSrc = readText(path.join(LP_ROOT, 'src/components/autodata/cloned/components/AdsCapiPanel.tsx'));
      const combined = homeLoop.combined + '\n' + dataLoop.combined;

      assert.ok(/SHA-?256/i.test(combined), 'Closed-Loop must mention SHA-256 hashing');
      assert.ok(
        /Forward-Only|Meta\s*Conversions\s*API|HTTP\s*200/i.test(combined) && /HTTP\s*200|200/i.test(capiSrc),
        'Closed-Loop must document Forward-Only / Meta Conversions API delivery'
      );
    });

    it('F2-T2.4: In-app Flywheel cockpit wires live interactive navigation links between Meta Report, Auto-Routing & CAPI panel', () => {
      const autodataDir = path.join(LP_ROOT, 'src/components/autodata');
      const domMetaDir = path.join(LP_ROOT, 'src/components/dom-meta');
      const cockpitFiles = [
        ...collectMatchingTsxFiles(autodataDir, /(?:flywheel|cockpit|closed[-_]?loop)/i),
        ...collectMatchingTsxFiles(domMetaDir, /(?:flywheel|cockpit|closed[-_]?loop)/i),
      ];
      const dashboardSrc = stripTsComments(readText(path.join(autodataDir, 'cloned/pages/Dashboard.tsx')));
      const wsSrc = stripTsComments(readText(path.join(domMetaDir, 'DomMetaReportWorkspace.tsx')));
      const combinedCockpit = [
        ...cockpitFiles.map((f) => stripTsComments(readText(f))),
        ...(/(?:flywheel|closed[-_ ]?loop)/i.test(dashboardSrc) ? [dashboardSrc] : []),
        ...(/(?:flywheel|closed[-_ ]?loop)/i.test(wsSrc) ? [wsSrc] : []),
      ].join('\n');

      assert.ok(combinedCockpit.length > 0, 'Missing in-app Flywheel cockpit source for interactive nav linkage check');
      assert.ok(
        /\/meta-report|onOpenMetaReport|meta_report/i.test(combinedCockpit) &&
          /\/rounds|rounds|routing/i.test(combinedCockpit) &&
          /meta_capi|AdsCapiPanel|\/capi|capi/i.test(combinedCockpit) &&
          /(?:navigate\(|onClick=|href=)/.test(combinedCockpit),
        'In-app Flywheel cockpit must expose interactive navigation controls across Meta Report, Auto-Routing & CAPI stages'
      );
    });
  });

  // =========================================================================
  // F3 — On-Page SEO/GEO, Prerender & CWV Optimization (6 Tier 1 + 6 Tier 2)
  // =========================================================================

  describe('F3 Tier 1: Dedup/Quota Consistency, hreflang, CWV, JSON-LD & GEO Assets', () => {
    it('F3-T1.1: Unified 180 ngày / 6 tháng dedup window across landing, auth modal, SEO, llms.txt & dist/data', () => {
      const filesToCheck = [
        'src/DomationDataLanding.tsx',
        'src/components/autodata/AutoDataAuthModal.tsx',
        'src/data/coreRouteSeo.ts',
        'public/llms.txt',
        'public/llms-full.txt',
        'dist/data/index.html',
      ];
      for (const rel of filesToCheck) {
        const raw = readText(path.join(LP_ROOT, rel));
        const content = /\.(ts|tsx)$/.test(rel) ? stripTsComments(raw) : raw;
        assert.ok(
          !STALE_DEDUP_90D_RE.test(content),
          `${rel} still contains stale "90 ngày" dedup claim (contract requires 180 ngày / 6 tháng)`
        );
      }

      const dataLanding = readText(path.join(LP_ROOT, 'src/DomationDataLanding.tsx'));
      assert.ok(
        /180\s*ngày|6\s*tháng/i.test(dataLanding),
        'DomationDataLanding.tsx must state 180 ngày / 6 tháng dedup window'
      );
    });

    it('F3-T1.2: Unified 20 Sale / 5 Quản lý & 85 Sale / 15 Quản lý quotas (zero stale 5/3/25/10 fallback strings)', () => {
      const dataLanding = readText(path.join(LP_ROOT, 'src/DomationDataLanding.tsx'));
      const authModal = readText(path.join(LP_ROOT, 'src/components/autodata/AutoDataAuthModal.tsx'));
      const coreSeo = readText(path.join(LP_ROOT, 'src/data/coreRouteSeo.ts'));
      const llmsTxt = readText(path.join(LP_ROOT, 'public/llms.txt'));

      assert.ok(
        !/\?\s*5\s*:\s*25\b/.test(dataLanding) && !/\?\s*3\s*:\s*10\b/.test(dataLanding),
        'DomationDataLanding.tsx still has stale 5:25 / 3:10 quota fallbacks'
      );
      assert.ok(
        !/5\s*Sale\s*&\s*3\s*Quản lý/i.test(authModal),
        'AutoDataAuthModal.tsx still claims stale "5 Sale & 3 Quản lý"'
      );
      assert.ok(
        !/Tối đa 25 Sale/i.test(coreSeo),
        'coreRouteSeo.ts still claims stale "Tối đa 25 Sale" for Auto Data Pro'
      );
      assert.ok(
        !/5\s*Sale|25\s*Sale/i.test(llmsTxt),
        'public/llms.txt contains stale 5 Sale / 25 Sale quota text'
      );
    });

    it('F3-T1.3: hreflang="vi", hreflang="x-default" & canonical emitted on all core routes and SEO helpers', async () => {
      for (const route of CORE_ROUTES) {
        const res = await preview.fetchPrerenderedRoute(route);
        const links = extractLinks(res.body);
        const canonical = links.find((l) => l.rel === 'canonical');
        const viAlt = links.find((l) => l.rel === 'alternate' && l.hreflang === 'vi');
        const xDefaultAlt = links.find((l) => l.rel === 'alternate' && l.hreflang === 'x-default');

        assert.ok(canonical?.href?.startsWith('https://domation.net'), `${route}: missing canonical`);
        assert.ok(viAlt?.href?.startsWith('https://domation.net'), `${route}: missing hreflang="vi"`);
        assert.ok(xDefaultAlt?.href?.startsWith('https://domation.net'), `${route}: missing hreflang="x-default"`);
      }

      const { renderRouteSeoHeadBlock } = await importTs('lib/viteSeoPrerenderPlugin.ts');
      const { getHomeSeoConfig } = await importTs('src/data/coreRouteSeo.ts');
      const headBlock = renderRouteSeoHeadBlock(getHomeSeoConfig());
      assert.ok(headBlock.includes('hreflang="vi"'), 'renderRouteSeoHeadBlock must emit hreflang="vi"');
      assert.ok(headBlock.includes('hreflang="x-default"'), 'renderRouteSeoHeadBlock must emit hreflang="x-default"');

      const seoTs = readText(path.join(LP_ROOT, 'src/utils/seo.ts'));
      assert.ok(seoTs.includes('hreflang'), 'src/utils/seo.ts applyPageSeo must also sync hreflang links');
    });

    it('F3-T1.4: CWV — zero eager gsi/client script tag in HTML templates/dist and trimmed Google Fonts with display=swap', async () => {
      const htmlFiles = ['index.html', 'crm/index.html', 'dist/index.html', 'dist/crm/index.html', 'dist/data/index.html'];
      for (const rel of htmlFiles) {
        const html = readText(path.join(LP_ROOT, rel));
        const scripts = extractScripts(html);
        const eagerGsi = scripts.find((s) => (s.src || '').includes('accounts.google.com/gsi/client'));
        assert.equal(eagerGsi, undefined, `${rel} must NOT eagerly load accounts.google.com/gsi/client`);

        const fontLinks = extractLinks(html).filter(
          (l) => l.rel === 'stylesheet' && (l.href || '').includes('fonts.googleapis.com')
        );
        assert.ok(fontLinks.length >= 1, `${rel} missing Google Fonts stylesheet link`);
        for (const fl of fontLinks) {
          assert.ok(fl.href.includes('display=swap'), `${rel} Google Fonts link must include display=swap`);
          assert.ok(!/family=Inter\b/i.test(fl.href) && !/family=Roboto\b/i.test(fl.href), `${rel} Google Fonts still includes unused Inter/Roboto bloat`);
        }
      }
    });

    it('F3-T1.5: Valid JSON-LD @graph on all core routes over vite preview', async () => {
      for (const route of CORE_ROUTES) {
        const res = await preview.fetchPrerenderedRoute(route);
        const graphs = extractJsonLdGraphs(res.body);
        const seoGraph = graphs.find((g) => g.dataDomationSeo);
        assert.ok(seoGraph, `${route}: missing <script type="application/ld+json" data-domation-seo="true">`);
        assert.equal(seoGraph.error, null, `${route}: invalid JSON-LD (${seoGraph.error})`);
        assert.equal(seoGraph.parsed['@context'], 'https://schema.org');
        const nodes = seoGraph.parsed['@graph'];
        assert.ok(Array.isArray(nodes) && nodes.length >= 4, `${route}: expected >=4 nodes in @graph`);
        const types = new Set(nodes.map((n) => n['@type']));
        assert.ok(types.has('Organization'), `${route}: missing Organization in @graph`);
        assert.ok(types.has('Person'), `${route}: missing Person in @graph`);
        assert.ok(types.has('WebSite'), `${route}: missing WebSite in @graph`);
        assert.ok(types.has('WebPage') || types.has('CollectionPage'), `${route}: missing WebPage/CollectionPage in @graph`);
      }
    });

    it('F3-T1.6: Valid sitemap.xml (core + 74 boost URLs + existing images), robots.txt & llms.txt/llms-full.txt', async () => {
      const sitemapRes = await preview.fetchText('/sitemap.xml');
      assert.equal(sitemapRes.status, 200);
      const parsedMap = parseSitemapXml(sitemapRes.body);
      assert.equal(parsedMap.hasXmlDecl, true);
      assert.equal(parsedMap.hasUrlset, true);
      assert.ok(parsedMap.urls.length >= 83, `Expected >=83 URLs in sitemap.xml, got ${parsedMap.urls.length}`);

      const boostUrls = parsedMap.urls.filter((u) => u.loc.includes('/boost/'));
      assert.ok(boostUrls.length >= 74, `Expected >=74 /boost/* URLs in sitemap.xml, got ${boostUrls.length}`);

      for (const entry of parsedMap.urls) {
        for (const imgUrl of entry.images) {
          if (imgUrl.startsWith('https://domation.net/')) {
            const relImg = decodeURIComponent(imgUrl.replace('https://domation.net/', ''));
            assert.ok(
              fileExists(path.join(LP_ROOT, 'public', relImg)),
              `Sitemap image asset missing on disk: public/${relImg}`
            );
          }
        }
      }

      const robotsRes = await preview.fetchText('/robots.txt');
      assert.equal(robotsRes.status, 200);
      for (const bot of ['GPTBot', 'PerplexityBot', 'ClaudeBot', 'Google-Extended']) {
        assert.ok(robotsRes.body.includes(bot), `robots.txt missing ${bot}`);
      }

      const llmsRes = await preview.fetchText('/llms.txt');
      assert.equal(llmsRes.status, 200);
      assert.ok(llmsRes.body.length >= 1500);
      const llmsFullRes = await preview.fetchText('/llms-full.txt');
      assert.equal(llmsFullRes.status, 200);
      assert.ok(llmsFullRes.body.length > llmsRes.body.length);
    });
  });

  describe('F3 Tier 2: SEO/GEO/CWV Boundary & Edge Cases', () => {
    it('F3-T2.1: renderRouteSeoHeadBlock omits canonical and hreflang on noindex 404 config', async () => {
      const { renderRouteSeoHeadBlock } = await importTs('lib/viteSeoPrerenderPlugin.ts');
      const { getNotFoundSeoConfig } = await importTs('src/data/coreRouteSeo.ts');
      const html404 = renderRouteSeoHeadBlock(getNotFoundSeoConfig('/404'));
      assert.ok(html404.includes('noindex, nofollow'));
      assert.ok(!html404.includes('rel="canonical"'));
      assert.ok(!html404.includes('hreflang='));
    });

    it('F3-T2.2: llms.txt & llms-full.txt follow llmstxt.org format (# H1, > blockquote, ## Optional strictly last)', async () => {
      for (const route of ['/llms.txt', '/llms-full.txt']) {
        const res = await preview.fetchText(route);
        const parsed = parseLlmsMarkdown(res.body);
        assert.ok(parsed.h1, `${route}: missing # H1`);
        assert.ok(parsed.blockquote, `${route}: missing > blockquote`);
        assert.ok(parsed.sectionNames.length >= 3, `${route}: missing H2 sections`);
        assert.equal(
          parsed.sectionNames[parsed.sectionNames.length - 1],
          'Optional',
          `${route}: ## Optional must be the final section`
        );
      }
    });

    it('F3-T2.3: All core + 74 boost SEO configs render zero undefined/NaN strings in JSON-LD or meta', async () => {
      const { getCoreStaticRouteSeoConfigs } = await importTs('src/data/coreRouteSeo.ts');
      const { getAllBoostRouteSeoConfigs } = await importTs('src/data/boostRouteSeo.ts');
      const { renderRouteSeoHeadBlock } = await importTs('lib/viteSeoPrerenderPlugin.ts');

      const allConfigs = [...getCoreStaticRouteSeoConfigs(), ...getAllBoostRouteSeoConfigs()];
      assert.ok(allConfigs.length >= 83);
      for (const cfg of allConfigs) {
        const block = renderRouteSeoHeadBlock(cfg);
        assert.ok(!/\bundefined\b/.test(block), `Route ${cfg.path} contains literal "undefined" in SEO head`);
        assert.ok(!/\bNaN\b/.test(block), `Route ${cfg.path} contains literal "NaN" in SEO head`);
      }
    });

    it('F3-T2.4: Dynamic lazy GSI loader remains intact in AutoDataAuthModal.tsx and DomMetaAuthModal.tsx', () => {
      const autoAuth = readText(path.join(LP_ROOT, 'src/components/autodata/AutoDataAuthModal.tsx'));
      const metaAuth = readText(path.join(LP_ROOT, 'src/components/dom-meta/DomMetaAuthModal.tsx'));
      assert.ok(autoAuth.includes('accounts.google.com/gsi/client'), 'AutoDataAuthModal lost lazy GSI loader');
      assert.ok(metaAuth.includes('accounts.google.com/gsi/client'), 'DomMetaAuthModal lost lazy GSI loader');
    });

    it('F3-T2.5: robots.txt blocks /api/ and declares Sitemap, llms.txt, llms-full.txt', async () => {
      const res = await preview.fetchText('/robots.txt');
      assert.ok(res.body.includes('Disallow: /api/'));
      assert.ok(res.body.includes('Sitemap: https://domation.net/sitemap.xml'));
      assert.ok(res.body.includes('https://domation.net/llms.txt'));
      assert.ok(res.body.includes('https://domation.net/llms-full.txt'));
    });

    it('F3-T2.6: hreflang="vi" and "x-default" URLs match canonical URL on each core route', async () => {
      for (const route of CORE_ROUTES) {
        const res = await preview.fetchPrerenderedRoute(route);
        const links = extractLinks(res.body);
        const canonical = links.find((l) => l.rel === 'canonical');
        const viAlt = links.find((l) => l.rel === 'alternate' && l.hreflang === 'vi');
        const xDefaultAlt = links.find((l) => l.rel === 'alternate' && l.hreflang === 'x-default');
        assert.equal(viAlt?.href, canonical?.href, `${route}: hreflang="vi" must match canonical`);
        assert.equal(xDefaultAlt?.href, canonical?.href, `${route}: hreflang="x-default" must match canonical`);
      }
    });
  });

  // =========================================================================
  // F4 — Vietnam Top-1 SEO/GEO & Web/FB Strategy Doc (5 Tier 1 + 5 Tier 2)
  // =========================================================================

  describe('F4 Tier 1: Vietnam SEO/GEO Strategy Deliverable Rubric', () => {
    const strategyPath = path.join(LP_ROOT, 'docs/DOMATION_SEO_GEO_VIETNAM_STRATEGY.md');

    it('F4-T1.1: docs/DOMATION_SEO_GEO_VIETNAM_STRATEGY.md exists, >= 3,000 chars, valid UTF-8', () => {
      assert.equal(fileExists(strategyPath), true, `Missing strategy doc at ${strategyPath}`);
      const content = readText(strategyPath);
      assert.ok(content.length >= 3000, `Strategy doc too short (${content.length} chars < 3000)`);
      assert.ok(!content.includes('\uFFFD'), 'Strategy doc contains invalid UTF-8 replacement character');
    });

    it('F4-T1.2: Covers Vietnam short-tail & long-tail keyword clusters across DOMATION pillars', () => {
      const content = readText(strategyPath);
      for (const kw of [/CRM/i, /Auto\s*(?:Chia\s*)?Data/i, /Meta\s*Ads|CAPI/i, /ERP\s*5\.0/i, /Automation/i, /Zalo/i, /AI\s*Agent|RAG/i, /Web\s*3D|WebGL/i]) {
        assert.ok(kw.test(content), `Strategy doc missing keyword cluster coverage for ${kw}`);
      }
      assert.ok(/short-?tail|từ khóa ngắn/i.test(content), 'Must distinguish short-tail keywords');
      assert.ok(/long-?tail|từ khóa dài/i.test(content), 'Must distinguish long-tail keywords');
    });

    it('F4-T1.3: Covers GEO AI citation strategy (ChatGPT, Gemini, Perplexity, Claude, llms.txt, JSON-LD)', () => {
      const content = readText(strategyPath);
      for (const engine of [/ChatGPT/i, /Gemini|AI Overview/i, /Perplexity/i, /Claude/i]) {
        assert.ok(engine.test(content), `Strategy doc missing GEO engine ${engine}`);
      }
      assert.ok(content.includes('llms.txt'), 'Strategy doc must reference llms.txt');
      assert.ok(/JSON-LD|@graph/i.test(content), 'Strategy doc must reference JSON-LD / @graph');
    });

    it('F4-T1.4: Covers Facebook & Web omni-channel funnel and DOMATION touchpoints', () => {
      const content = readText(strategyPath);
      assert.ok(/Facebook|Meta/i.test(content), 'Must cover Facebook/Meta channel funnel');
      for (const route of ['/data', '/meta-report', '/erp', '/automation', '/web-design', '/boost']) {
        assert.ok(content.includes(route), `Strategy doc must map DOMATION touchpoint ${route}`);
      }
    });

    it('F4-T1.5: Includes phased execution roadmap and concrete numeric/percentage KPIs', () => {
      const content = readText(strategyPath);
      assert.ok(/(?:Giai đoạn|Phase|Quý|Q[1-4]|Tháng)\s*[1-6]/i.test(content), 'Must include phased timeline/roadmap');
      const percentMatches = content.match(/\d+(?:[.,]\d+)?\s*%/g) || [];
      assert.ok(percentMatches.length >= 3, 'Must include concrete numeric percentage KPI targets');
      assert.ok(/KPI/i.test(content), 'Must include dedicated KPI section/metrics');
    });
  });

  describe('F4 Tier 2: Grounding, Accuracy & Anti-Hallucination Rubric', () => {
    const strategyPath = path.join(LP_ROOT, 'docs/DOMATION_SEO_GEO_VIETNAM_STRATEGY.md');

    it('F4-T2.1: Zero hallucinated pricing — canonical suite pricing matches catalog, zero 250k/450k/2.99M/4.99M, and 490k/690k/5.88M scoped strictly to DOM Meta Report', async () => {
      const content = readText(strategyPath);
      const contentWithoutTopupBonus = content.replace(/(?:Tặng\s*thêm\s*\+\s*|\+\s*)450[.,]000\s*₫?(?:\s*bonus|\s*\(=\s*9[.,]450[.,]000)?/gi, '');
      assert.ok(
        /1[.,]500[.,]000|1[.,]5\s*(?:triệu|tr|M)/i.test(content),
        'Strategy doc must ground Standard pricing at 1.5M/month'
      );
      assert.ok(
        !/250[.,]000|450[.,]000|2[.,]990[.,]000|4[.,]990[.,]000/.test(contentWithoutTopupBonus),
        'Strategy doc must NOT repeat stale legacy 250k/450k/2.99M/4.99M pricing'
      );
      const metaReportPriceLines = content
        .split(/\r?\n/)
        .filter((line) => /490[.,]000|690[.,]000|5[.,]880[.,]000/.test(line));
      for (const line of metaReportPriceLines) {
        const scopedToMetaReport = /DOM\s*Meta\s*Report|Meta\s*Ad\s*Realtime\s*Report|\/meta-report/i.test(line);
        const leaksToOtherProduct = /Auto\s*Data|AutoData|CRM\s*360|ERP\s*5\.0|Marketing\s*Automation/i.test(line);
        assert.ok(
          scopedToMetaReport && !leaksToOtherProduct,
          `490k/690k/5.88M pricing in strategy doc must be strictly scoped to DOM Meta Report (/meta-report), found: "${line.trim()}"`
        );
      }
    });

    it('F4-T2.2: Grounded in real DOMATION mechanics (<5s, 120s SLA, 1:1 refund, 180d/6m dedup, 9-stage CAPI, 12-module ERP)', () => {
      const content = readText(strategyPath);
      assert.ok(/<\s*5\s*(?:s|giây)/i.test(content), 'Must cite real <5s routing speed');
      assert.ok(/120\s*(?:s|giây)/i.test(content), 'Must cite real 120s SLA');
      assert.ok(/1:1/.test(content), 'Must cite real 1:1 ticket refund');
      assert.ok(/180\s*ngày|6\s*tháng/i.test(content), 'Must cite real 180 ngày / 6 tháng dedup');
      assert.ok(!STALE_DEDUP_90D_RE.test(content), 'Must NOT contain stale 90 ngày dedup');
      assert.ok(/SHA-?256/i.test(content), 'Must cite real SHA-256 CAPI');
      assert.ok(/12\s*phân\s*hệ/i.test(content), 'Must cite real 12 ERP modules');
    });

    it('F4-T2.3: Structured Markdown hierarchy (1 H1 and >= 5 H2 sections)', () => {
      const content = readText(strategyPath);
      const h1s = content.match(/^#\s+.+$/gm) || [];
      const h2s = content.match(/^##\s+.+$/gm) || [];
      assert.equal(h1s.length, 1, `Expected 1 H1 in strategy doc, got ${h1s.length}`);
      assert.ok(h2s.length >= 5, `Expected >= 5 H2 sections in strategy doc, got ${h2s.length}`);
    });

    it('F4-T2.4: Zero placeholder or incomplete draft markers (TODO, TBD, Lorem ipsum)', () => {
      const content = readText(strategyPath);
      assert.ok(!/\b(?:TODO|TBD|FIXME|Lorem ipsum)\b/i.test(content), 'Strategy doc must not contain placeholder text');
    });

    it('F4-T2.5: Closed-loop Meta Ads -> CRM -> CAPI flywheel featured as conversion moat', () => {
      const content = readText(strategyPath);
      assert.ok(
        /CAPI/i.test(content) && /DisqualifiedLead|Purchase|học\s*tệp|vòng\s*tròn/i.test(content),
        'Strategy doc must leverage closed-loop CAPI signal feedback in Vietnam FB+Web growth strategy'
      );
    });
  });
});
