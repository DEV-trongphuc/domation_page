import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

import {
  LP_ROOT,
  ERP_ROOT,
  BACKEND_ROOT,
  fileExists,
  readText,
  startPreviewServer,
  extractLinks,
  extractJsonLdGraphs,
  extractScripts,
  extractRootSemanticStructure,
  parseSitemapXml,
  parseLlmsMarkdown,
  compareFilesSha256,
  verifyMyPortfolioInvariance,
  stripTsComments,
  withBrowserPage,
} from './helpers/frontend-e2e-harness.mjs';

const STALE_DEDUP_90D_RE =
  /(?:lọc\s*trùng|chống\s*trùng|trùng\s*lặp|dedup(?:e|lication)?|quay\s*lại\s*trong)[^\n.]{0,40}(?<![0-9][–-])\b90\s*ngày|(?<![0-9][–-])\b90\s*ngày[^\n.]{0,25}(?:lọc\s*trùng|chống\s*trùng|dedup)/i;

function assertDefaultCollapsedCodeToggle(rawSrc, label) {
  const src = stripTsComments(rawSrc);
  const stateMatch = src.match(
    /const\s+\[\s*(\w*(?:Advanced|Code|Snippet|Script|RawCode|ScopesJson)\w*)\s*,\s*(set\w+)\s*\]\s*=\s*useState(?:<boolean>)?\(\s*false\s*\)/i
  );
  assert.ok(stateMatch, `${label}: missing default-collapsed useState(false) toggle for raw code`);
  const [, stateVar, setterName] = stateMatch;
  assert.ok(
    new RegExp(`onClick=\\{[\\s\\S]{0,120}\\b${setterName}\\b`).test(src),
    `${label}: toggle setter "${setterName}" must be wired to an onClick handler`
  );
  assert.ok(
    new RegExp(`\\{${stateVar}\\s*(?:&&|\\?)[\\s\\S]{0,1500}<(?:pre|textarea|code)\\b`, 'i').test(src),
    `${label}: raw code block must be conditionally gated by "${stateVar}"`
  );
}

async function importTs(relPath) {
  return import(pathToFileURL(path.join(LP_ROOT, relPath)).href);
}

describe('Tier 3 (Cross-Feature Pairwise) & Tier 4 (Real-World Ecosystem Scenarios 5 & 6)', () => {
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
  // Tier 3 — Pairwise Feature Combinations (>= 5 tests)
  // =========================================================================

  describe('Tier 3: Pairwise Cross-Feature & Cross-Repo Combinations', () => {
    it('Tier3-P1 (F1 × F7): Route truth + Unified Catalog pricing parity across /, /data, /crm, coreRouteSeo & llms.txt', async () => {
      const { DEFAULT_CLIENT_CATALOG } = await importTs('src/components/autodata/autodataTypes.ts');
      const { getCoreStaticRouteSeoConfigs } = await importTs('src/data/coreRouteSeo.ts');

      const mainTsx = readText(path.join(LP_ROOT, 'src/main.tsx'));
      assert.ok(!/const\s+isCrm\s*=\s*false\b/.test(mainTsx), '/crm route split-brain must be fixed');

      const seoConfigs = getCoreStaticRouteSeoConfigs();
      const dataSeo = seoConfigs.find((c) => c.path === '/data');
      const crmSeo = seoConfigs.find((c) => c.path === '/crm');
      assert.ok(dataSeo && crmSeo);

      const std = DEFAULT_CLIENT_CATALOG.plans.find((p) => p.code === 'autodata_standard');
      assert.ok(std);
      assert.ok(JSON.stringify(dataSeo.jsonLd).includes(String(std.monthly_price_vnd)));
      assert.ok(!JSON.stringify(crmSeo.jsonLd).includes('"250000"'), '/crm SEO JSON-LD must not emit stale 250k');

      const llms = readText(path.join(LP_ROOT, 'public/llms.txt'));
      const llmsWithoutTopupBonus = llms.replace(/(?:Tặng\s*thêm\s*\+\s*|\+\s*)450[.,]000\s*₫?(?:\s*bonus|\s*\(=\s*9[.,]450[.,]000)?/gi, '');
      assert.ok(!/250[.,]000|450[.,]000|2[.,]990[.,]000|4[.,]990[.,]000/.test(llmsWithoutTopupBonus), 'llms.txt must not contain stale 250k/450k/2.99M/4.99M pricing');
      for (const line of llms.split(/\r?\n/).filter((l) => /490[.,]000|690[.,]000|5[.,]880[.,]000/.test(l))) {
        assert.ok(
          /DOM\s*Meta\s*Report|Meta\s*Ad\s*Realtime\s*Report|\/meta-report/i.test(line),
          `llms.txt 490k/690k pricing must be strictly scoped to DOM Meta Report (/meta-report), got: ${line}`
        );
      }
    });

    it('Tier3-P2 (F2 × F3): Closed-Loop flywheel metrics (<5s, 120s SLA, 1:1, 180 ngày / 6 tháng, 9-stage CAPI) stay consistent across UI, SEO & Tours', async () => {
      const home = readText(path.join(LP_ROOT, 'src/DomationHome.tsx'));
      const dataLanding = readText(path.join(LP_ROOT, 'src/DomationDataLanding.tsx'));
      const componentsDir = path.join(LP_ROOT, 'src/components');
      const flywheelSrc = fs
        .readdirSync(componentsDir)
        .filter((f) => /(?:closed[-_]?loop|flywheel)/i.test(f) && /\.(tsx|ts)$/.test(f))
        .map((f) => readText(path.join(componentsDir, f)))
        .join('\n');
      const capi = readText(path.join(LP_ROOT, 'src/components/autodata/cloned/components/AdsCapiPanel.tsx'));
      const { SCREEN_TOUR_DECKS } = await importTs('src/components/autodata/autoDataScreenTours.ts');
      const { AUTODATA_FAQS } = await importTs('src/data/coreRouteSeo.ts');

      // Zero 90 ngày anywhere in flywheel / FAQ / tours / landing
      assert.ok(!/90\s*ngày/i.test(dataLanding));
      assert.ok(!/90\s*ngày/i.test(flywheelSrc));
      assert.ok(!/90\s*ngày/i.test(JSON.stringify(SCREEN_TOUR_DECKS)));
      assert.ok(!/90\s*ngày/i.test(JSON.stringify(AUTODATA_FAQS)));

      // Both landing flywheel and AdsCapiPanel share exact 9-stage events
      for (const evt of ['Lead', 'Schedule', 'InitiateCheckout', 'AddPaymentInfo', 'Purchase', 'DisqualifiedLead', 'Skip']) {
        assert.ok(capi.includes(evt));
        assert.ok((home + '\n' + dataLanding + '\n' + flywheelSrc).includes(evt), `Landing flywheel missing ${evt}`);
      }
    });

    it('Tier3-P3 (F5 × F6): Non-coder Setup Wizard + Advanced-Code Collapse + Focus Tour Persistence + Mobile Clamping', () => {
      const auth = readText(path.join(LP_ROOT, 'src/components/autodata/AutoDataAuthModal.tsx'));
      const wh = readText(path.join(LP_ROOT, 'src/components/autodata/AutoDataWebhookGuide.tsx'));
      const email = readText(path.join(LP_ROOT, 'src/components/autodata/AutoDataEmailGuide.tsx'));
      const tour = stripTsComments(readText(path.join(LP_ROOT, 'src/components/autodata/AutoDataHelpTour.tsx')));
      const root = readText(path.join(LP_ROOT, 'src/components/autodata/cloned/AutodataClonedRoot.tsx'));

      assert.ok(auth.includes('WIZARD_TOUR_STEPS') && auth.includes('syncUiToTourStep'));
      assertDefaultCollapsedCodeToggle(wh, 'AutoDataWebhookGuide.tsx');
      assertDefaultCollapsedCodeToggle(email, 'AutoDataEmailGuide.tsx');
      assert.ok(/\b768\b/.test(tour), 'Missing desktop breakpoint >= 768');
      assert.ok(
        /Math\.min\(\s*\d+\s*,\s*[a-zA-Z_$][\w.]*\s*-\s*\d+\s*\)/.test(tour),
        'Missing mobile card width clamping against viewport width'
      );
      assert.ok(
        /Math\.max\([\s\S]{0,80}Math\.min\([\s\S]{0,80}-\s*[a-zA-Z_$][\w.]*\s*-\s*\d+/.test(tour),
        'Missing horizontal viewport boundary clamping'
      );
      assert.ok(root.includes('/auth/onboarding') && root.includes('PATCH'));
    });

    it('Tier3-P4 (F7 × F9): Shared DomMetaModals (CrmUpgradeShowcaseModal) SHA-256 sync + CRM BillingView + ERP PackageUpgradePanel', () => {
      const cmp = compareFilesSha256(
        path.join(LP_ROOT, 'src/components/dom-meta/DomMetaModals.tsx'),
        path.join(ERP_ROOT, 'src/components/dom-meta/DomMetaModals.tsx')
      );
      assert.equal(cmp.equal, true, 'DomMetaModals.tsx must remain byte-identical across LP and ERP');

      const modals = readText(path.join(LP_ROOT, 'src/components/dom-meta/DomMetaModals.tsx'));
      const billing = readText(path.join(LP_ROOT, 'src/components/autodata/pages/BillingView.tsx'));
      const erpPkg = readText(path.join(ERP_ROOT, 'src/components/Settings/PackageUpgradePanel.tsx'));

      assert.ok(/vietqr|img\.vietqr\.io|qr_url|qrCode/i.test(modals));
      assert.ok(/vietqr|img\.vietqr\.io|qr_url|qrCode/i.test(billing));
      assert.ok(erpPkg.includes('/api/v1/billing/catalog') || erpPkg.includes('monthly_price_vnd'));
    });

    it('Tier3-P5 (F8 × F9): Daily Report Meta Ads Default-OFF + String UUID Admins + Shared AI Key Toggles across CRM & ERP', () => {
      const crmSettings = readText(path.join(LP_ROOT, 'src/components/autodata/cloned/pages/Settings.tsx'));
      const erpSettings = readText(path.join(ERP_ROOT, 'src/pages/Settings.tsx'));
      const lpWs = readText(path.join(LP_ROOT, 'src/components/dom-meta/DomMetaReportWorkspace.tsx'));

      for (const src of [crmSettings, erpSettings]) {
        assert.ok(src.includes('daily_report_include_meta_ads'));
        assert.ok(src.includes('ai_lead_eval_enabled') && src.includes('ai_ads_eval_enabled'));
        assert.ok(!/setDailyReportAdmins[\s\S]{0,180}Number\(\s*admin\.id\s*\)/.test(src));
      }
      assert.ok(lpWs.includes('ai_ads_eval_enabled'));
    });

    it('Tier3-P6 (F3 × F4 × F9): GEO Assets (sitemap.xml, llms.txt, robots.txt) + Strategy Doc + MY_PORTFOLIO Guard', async () => {
      const [sitemapRes, llmsRes, robotsRes] = await Promise.all([
        preview.fetchText('/sitemap.xml'),
        preview.fetchText('/llms.txt'),
        preview.fetchText('/robots.txt'),
      ]);
      assert.equal(sitemapRes.status, 200);
      assert.equal(llmsRes.status, 200);
      assert.equal(robotsRes.status, 200);

      const strategyPath = path.join(LP_ROOT, 'docs/DOMATION_SEO_GEO_VIETNAM_STRATEGY.md');
      assert.equal(fileExists(strategyPath), true);
      const strategy = readText(strategyPath);
      assert.ok(strategy.includes('llms.txt') && strategy.includes('/data') && !STALE_DEDUP_90D_RE.test(strategy));

      const portfolio = verifyMyPortfolioInvariance();
      assert.equal(portfolio.ok, true, 'MY_PORTFOLIO invariance violated');
    });
  });

  // =========================================================================
  // Tier 4 — Real-World Ecosystem Scenarios (Scenarios 5 & 6 from TEST_INFRA.md)
  // =========================================================================

  describe('Tier 4: End-to-End Multi-Feature Ecosystem Scenarios', () => {
    it('Tier4-Scenario5: Landing Closed-Loop Conversion -> Catalog Truth Parity (LP <-> Backend <-> CRM BillingView <-> ERP PackageUpgradePanel) -> Non-Coder Setup + Focus Tour Persistence', async () => {
      // Step 1: Landing entry & Closed-Loop Circle on / and /data
      const homeRes = await preview.fetchPrerenderedRoute('/');
      const dataRes = await preview.fetchPrerenderedRoute('/data');
      assert.equal(homeRes.status, 200);
      assert.equal(dataRes.status, 200);

      const homeSrc = readText(path.join(LP_ROOT, 'src/DomationHome.tsx'));
      const dataSrc = readText(path.join(LP_ROOT, 'src/DomationDataLanding.tsx'));
      assert.ok(/closed[-_ ]?loop|vòng\s*tròn|flywheel/i.test(homeSrc) && /closed[-_ ]?loop|vòng\s*tròn|flywheel/i.test(dataSrc));
      assert.ok(/onboarding|FocusTour|SpotlightTour/i.test(homeSrc + '\n' + dataSrc));

      // Step 2: Non-coder 3-step onboarding & check-step verification
      const { SESSION_V2_STORAGE_KEY } = await importTs('src/components/autodata/autodataTypes.ts');
      assert.equal(SESSION_V2_STORAGE_KEY, 'domation_autodata_session_v2');
      const authSrc = readText(path.join(LP_ROOT, 'src/components/autodata/AutoDataAuthModal.tsx'));
      const authClean = stripTsComments(authSrc);
      const autodataApiSrc = readText(path.join(LP_ROOT, 'src/components/autodata/autodataApi.ts'));
      assert.ok(authSrc.includes('data-tour="setup-stepper"'));
      assert.ok(authSrc.includes('/auth/check-slug'));
      assert.ok(
        authSrc.includes('saveAutodataSessionV2') &&
          autodataApiSrc.includes('saveAutodataSessionV2') &&
          (autodataApiSrc.includes('SESSION_V2_STORAGE_KEY') || autodataApiSrc.includes('domation_autodata_session_v2')) &&
          /localStorage\.setItem\(\s*(?:SESSION_V2_STORAGE_KEY|['"]domation_autodata_session_v2['"])/.test(autodataApiSrc),
        'Missing SESSION_V2_STORAGE_KEY persistence wiring between AutoDataAuthModal & autodataApi'
      );
      assert.ok(
        /const\s+\[\s*dedupDays\s*,\s*setDedupDays\s*\]\s*=\s*useState(?:<number>)?\(\s*180\s*\)/.test(authClean) &&
          !/90\s*ngày|dedupe_90d/i.test(authClean),
        'AutoDataAuthModal must default dedupDays to 180 with zero 90 ngày / dedupe_90d references'
      );

      // Step 3: Cross-repo catalog truth parity (LP DEFAULT_CLIENT_CATALOG <-> Backend billing/entitlements <-> CRM BillingView <-> ERP PackageUpgradePanel)
      const { DEFAULT_CLIENT_CATALOG } = await importTs('src/components/autodata/autodataTypes.ts');
      const std = DEFAULT_CLIENT_CATALOG.plans.find((p) => p.code === 'autodata_standard');
      const growth = DEFAULT_CLIENT_CATALOG.plans.find((p) => p.code === 'autodata_growth');
      const erp = DEFAULT_CLIENT_CATALOG.plans.find((p) => p.code === 'domation_crm_erp');
      assert.ok(std && growth && erp);

      // Verify Backend entitlements/billing references same canonical codes & limits
      const backendBillingPath = path.join(BACKEND_ROOT, 'server/services/billing.service.ts');
      const backendEntitlementsPath = path.join(BACKEND_ROOT, 'server/core/security/entitlements.ts');
      assert.equal(fileExists(backendBillingPath), true);
      assert.equal(fileExists(backendEntitlementsPath), true);
      const backendBilling = readText(backendBillingPath);
      const backendEntitlements = readText(backendEntitlementsPath);
      for (const code of ['autodata_standard', 'autodata_growth', 'domation_crm_erp']) {
        assert.ok(
          backendBilling.includes(code) || backendEntitlements.includes(code),
          `Backend missing canonical plan code "${code}"`
        );
      }

      // Verify CRM BillingView & ERP PackageUpgradePanel share unified lifecycle & VietQR
      const billingView = readText(path.join(LP_ROOT, 'src/components/autodata/pages/BillingView.tsx'));
      const erpPkg = readText(path.join(ERP_ROOT, 'src/components/Settings/PackageUpgradePanel.tsx'));
      assert.ok(billingView.includes('/billing/cancel') && billingView.includes('/billing/renew'));
      assert.ok(erpPkg.includes('education_addon') && erpPkg.includes('/api/v1/billing/switch-package'));

      // Step 4: In-app Focus Tour persistence across CRM, DomMeta & ERP
      const rootSrc = readText(path.join(LP_ROOT, 'src/components/autodata/cloned/AutodataClonedRoot.tsx'));
      const wsSrc = readText(path.join(LP_ROOT, 'src/components/dom-meta/DomMetaReportWorkspace.tsx'));
      assert.ok(rootSrc.includes('/auth/onboarding') && rootSrc.includes('PATCH'));
      assert.ok(/SpotlightTour|DomMetaSpotlightTour|FocusTour/i.test(wsSrc));
    });

    it('Tier4-Scenario6: Full SEO/GEO Prerender + sitemap.xml + llms.txt + Strategy Doc + /ecolifesignature + ERP Sync + MY_PORTFOLIO Invariance', async () => {
      // Step 1: HTTP Prerender, hreflang, CWV & JSON-LD @graph across all core routes
      const coreRoutes = ['/', '/data', '/crm', '/erp', '/automation', '/meta-report', '/web-design', '/portfolio', '/boost'];
      for (const route of coreRoutes) {
        const res = await preview.fetchPrerenderedRoute(route);
        assert.equal(res.status, 200);
        const sem = extractRootSemanticStructure(res.body);
        assert.equal(sem.hasNonEmptyRoot, true);
        assert.equal(sem.h1Count, 1);

        const links = extractLinks(res.body);
        assert.ok(links.some((l) => l.rel === 'canonical'));
        assert.ok(links.some((l) => l.rel === 'alternate' && l.hreflang === 'vi'));
        assert.ok(links.some((l) => l.rel === 'alternate' && l.hreflang === 'x-default'));

        const scripts = extractScripts(res.body);
        assert.equal(
          scripts.some((s) => (s.src || '').includes('accounts.google.com/gsi/client')),
          false,
          `${route}: eager gsi/client script must be removed`
        );

        const graphs = extractJsonLdGraphs(res.body);
        const seoGraph = graphs.find((g) => g.dataDomationSeo);
        assert.ok(seoGraph && seoGraph.error === null);
      }

      // Step 2: Sitemap, Robots & llms.txt / llms-full.txt
      const sitemap = parseSitemapXml((await preview.fetchText('/sitemap.xml')).body);
      assert.ok(sitemap.urls.length >= 83);
      const llms = parseLlmsMarkdown((await preview.fetchText('/llms.txt')).body);
      assert.equal(llms.sectionNames[llms.sectionNames.length - 1], 'Optional');

      // Step 3: Vietnam Top-1 SEO/GEO Strategy Doc
      const strategyPath = path.join(LP_ROOT, 'docs/DOMATION_SEO_GEO_VIETNAM_STRATEGY.md');
      assert.equal(fileExists(strategyPath), true);
      assert.ok(readText(strategyPath).length >= 3000);

      // Step 4: /ecolifesignature Public Viewer + ErrorBoundary + manualChunks + ERP Sync + MY_PORTFOLIO Guard
      const metaReport = readText(path.join(LP_ROOT, 'src/MetaAdReport.tsx'));
      const mainTsx = readText(path.join(LP_ROOT, 'src/main.tsx'));
      const viteCfg = readText(path.join(LP_ROOT, 'vite.config.ts'));
      assert.ok(metaReport.includes('resolvePublicDomMetaAccess') && metaReport.includes('ErrorBoundary'));
      assert.ok(mainTsx.includes('ErrorBoundary'));
      assert.ok(viteCfg.includes('manualChunks'));

      for (const fileName of [
        'DomMetaCharts.tsx',
        'DomMetaLeadAttributionPanel.tsx',
        'DomMetaModals.tsx',
        'DomMetaQuickConnectModal.tsx',
        'DomMetaSelect.tsx',
        'domMetaTypes.ts',
        'GoogleAdsSetupGuide.tsx',
      ]) {
        const cmp = compareFilesSha256(
          path.join(LP_ROOT, 'src/components/dom-meta', fileName),
          path.join(ERP_ROOT, 'src/components/dom-meta', fileName)
        );
        assert.equal(cmp.equal, true, `Shared file ${fileName} out of sync with DOMATION_ERP_FULL`);
      }

      const erpWs = readText(path.join(ERP_ROOT, 'src/components/dom-meta/DomMetaReportWorkspace.tsx'));
      assert.ok(erpWs.includes('<DomationLogoMark') && !erpWs.includes('domation_ai_icon.svg'));

      const portfolioGuard = verifyMyPortfolioInvariance();
      assert.equal(portfolioGuard.ok, true, 'MY_PORTFOLIO invariance check failed');
    });

    it('Tier4-Scenario7 (Browser DOM): Real headless Chromium render of /, /data, /erp, /meta-report with 0 pageerrors & zero horizontal overflow (1280x800 & 375x812)', async () => {
      await withBrowserPage(preview.baseUrl, async ({ page, baseUrl, pageErrors }) => {
        const routesToRender = ['/', '/data', '/erp', '/meta-report'];
        const viewports = [
          { name: 'desktop', width: 1280, height: 800 },
          { name: 'mobile', width: 375, height: 812 },
        ];
        for (const vp of viewports) {
          await page.setViewport({ width: vp.width, height: vp.height });
          for (const route of routesToRender) {
            await page.goto(`${baseUrl}${route}`, { waitUntil: 'networkidle2', timeout: 30_000 });
            await page.waitForFunction(
              () => (document.getElementById('root')?.innerText || '').trim().length > 40,
              { timeout: 10_000 }
            );
            const metrics = await page.evaluate(() => ({
              innerWidth: window.innerWidth,
              scrollWidth: document.documentElement.scrollWidth,
              rootLen: (document.getElementById('root')?.innerText || '').trim().length,
            }));
            assert.ok(metrics.rootLen > 40, `${route} (${vp.name}): empty #root content in headless Chromium`);
            assert.ok(
              metrics.scrollWidth <= metrics.innerWidth,
              `${route} (${vp.name}): horizontal overflow ${metrics.scrollWidth} > ${metrics.innerWidth}`
            );
          }
        }
        assert.deepEqual(pageErrors, [], `Unexpected browser pageerrors in Tier4-Scenario7: ${pageErrors.join(' | ')}`);
      });
    });

    it('Tier4-Scenario8 (Browser DOM): Interactive / Closed-Loop stage tabs & /data?setup=quick dialog + [data-tour="setup-stepper"] on mobile 375x812', async () => {
      await withBrowserPage(preview.baseUrl, async ({ page, baseUrl, pageErrors }) => {
        await page.setViewport({ width: 1280, height: 800 });
        await page.goto(`${baseUrl}/`, { waitUntil: 'networkidle2', timeout: 30_000 });
        await page.waitForSelector('main', { timeout: 10_000 });

        const tabButtons = await page.$$('#closed-loop [aria-pressed], #closed-loop [role="tab"]');
        const effectiveButtons = tabButtons.length >= 2 ? tabButtons : await page.$$('[aria-pressed]');
        assert.ok(effectiveButtons.length >= 2, `Expected >=2 interactive Closed-Loop stage controls on /, got ${effectiveButtons.length}`);

        await effectiveButtons[1].click();
        await page.waitForFunction(
          (el) => el.getAttribute('aria-pressed') === 'true' || el.getAttribute('aria-selected') === 'true',
          { timeout: 5_000 },
          effectiveButtons[1]
        );
        const clickedState = await page.evaluate((el) => ({
          pressed: el.getAttribute('aria-pressed'),
          selected: el.getAttribute('aria-selected'),
        }), effectiveButtons[1]);
        assert.ok(
          clickedState.pressed === 'true' || clickedState.selected === 'true',
          `Clicking interactive Closed-Loop stage tab must set aria-pressed/aria-selected="true" (got ${JSON.stringify(clickedState)})`
        );

        await page.setViewport({ width: 375, height: 812 });
        await page.goto(`${baseUrl}/data?setup=quick`, { waitUntil: 'networkidle2', timeout: 30_000 });
        await page.waitForSelector('[role="dialog"]', { timeout: 10_000 });
        await page.waitForSelector('[data-tour="setup-stepper"]', { timeout: 10_000 });

        const setupModalDom = await page.evaluate(() => ({
          innerWidth: window.innerWidth,
          scrollWidth: document.documentElement.scrollWidth,
          dialogs: document.querySelectorAll('[role="dialog"]').length,
          hasSetupStepper: Boolean(document.querySelector('[data-tour="setup-stepper"]')),
        }));
        assert.ok(setupModalDom.dialogs >= 1, 'Expected open [role="dialog"] on /data?setup=quick');
        assert.equal(setupModalDom.hasSetupStepper, true, 'Expected [data-tour="setup-stepper"] in /data?setup=quick modal');
        assert.ok(
          setupModalDom.scrollWidth <= setupModalDom.innerWidth,
          `Mobile /data?setup=quick horizontal overflow: ${setupModalDom.scrollWidth} > ${setupModalDom.innerWidth}`
        );
        assert.deepEqual(pageErrors, [], `Unexpected browser pageerrors in Tier4-Scenario8: ${pageErrors.join(' | ')}`);
      });
    });
  });
});
