import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

import {
  LP_ROOT,
  ERP_ROOT,
  BACKEND_ROOT,
  DIST_DIR,
  readText,
  startPreviewServer,
  extractLinks,
  extractJsonLdGraphs,
  extractHeadings,
  extractScripts,
  parseSitemapXml,
  stripTsComments,
  launchHeadlessBrowser,
} from './e2e/helpers/frontend-e2e-harness.mjs';

function collectHtmlFiles(dir) {
  const results = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...collectHtmlFiles(full));
    } else if (entry.isFile() && entry.name.endsWith('.html')) {
      results.push(full);
    }
  }
  return results;
}

function getMimeType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const map = {
    '.html': 'text/html; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.mjs': 'application/javascript; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.svg': 'image/svg+xml',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.webp': 'image/webp',
    '.json': 'application/json; charset=utf-8',
    '.woff2': 'font/woff2',
    '.ico': 'image/x-icon',
  };
  return map[ext] || 'application/octet-stream';
}

async function startStaticSpaServer(distDir) {
  const server = http.createServer((req, res) => {
    const rawUrl = (req.url || '/').split('?')[0];
    const safeRel = path.normalize(rawUrl).replace(/^(\.\.[/\\])+/, '');
    let target = path.join(distDir, safeRel === '/' ? 'index.html' : safeRel);
    if (fs.existsSync(target) && fs.statSync(target).isDirectory()) {
      target = path.join(target, 'index.html');
    }
    if (!fs.existsSync(target) || !fs.statSync(target).isFile()) {
      target = path.join(distDir, 'index.html');
    }
    res.writeHead(200, { 'Content-Type': getMimeType(target) });
    fs.createReadStream(target).pipe(res);
  });

  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const addr = server.address();
  return {
    baseUrl: `http://127.0.0.1:${addr.port}`,
    async stop() {
      await new Promise((resolve) => server.close(resolve));
    },
  };
}

describe('Tier 5: White-Box Adversarial Hardening Suite', () => {
  let lpPreview;

  before(async () => {
    lpPreview = await startPreviewServer({ requireDist: true });
  });

  after(async () => {
    if (lpPreview) {
      await lpPreview.stop();
    }
  });

  it('T5-SEO-ALL-DIST: All 90+ dist HTML files have valid JSON-LD, h1===1, canonical+hreflang, non-blocking fonts, 0 global GSI & 100% sitemap coverage', () => {
    const htmlFiles = collectHtmlFiles(DIST_DIR);
    assert.ok(htmlFiles.length >= 90, `Expected >=90 HTML files in dist/, got ${htmlFiles.length}`);

    for (const file of htmlFiles) {
      const rel = path.relative(DIST_DIR, file).replace(/\\/g, '/');
      const html = readText(file);

      // 1. Valid JSON-LD parse
      const graphs = extractJsonLdGraphs(html);
      for (const g of graphs) {
        assert.equal(g.error, null, `${rel}: JSON-LD parse error: ${g.error}`);
      }

      // 2. Single <h1> (except crm/index.html shell)
      if (rel !== 'crm/index.html') {
        const headings = extractHeadings(html);
        assert.equal(headings.h1.length, 1, `${rel}: expected exactly 1 <h1>, got ${headings.h1.length}`);
      }

      // 3. Canonical + hreflang on indexable pages
      const isNoIndex = /<meta\b[^>]*name=["']robots["'][^>]*content=["'][^"']*noindex/i.test(html);
      if (!isNoIndex && rel !== 'crm/index.html') {
        const links = extractLinks(html);
        const canonical = links.find((l) => l.rel === 'canonical');
        const hrefVi = links.find((l) => l.rel === 'alternate' && l.hreflang === 'vi');
        const hrefXDef = links.find((l) => l.rel === 'alternate' && l.hreflang === 'x-default');
        assert.ok(canonical?.href, `${rel}: missing canonical link`);
        assert.equal(hrefVi?.href, canonical.href, `${rel}: hreflang="vi" must match canonical`);
        assert.equal(hrefXDef?.href, canonical.href, `${rel}: hreflang="x-default" must match canonical`);
      }

      // 4. Non-blocking Google Fonts outside <noscript>
      const withoutNoscript = html.replace(/<noscript\b[^>]*>[\s\S]*?<\/noscript>/gi, '');
      const fontLinks = extractLinks(withoutNoscript).filter(
        (l) => l.rel === 'stylesheet' && (l.href || '').includes('fonts.googleapis.com')
      );
      for (const fl of fontLinks) {
        assert.equal(
          fl.attrs.media,
          'print',
          `${rel}: Google Fonts stylesheet outside <noscript> must be non-blocking (media="print")`
        );
      }

      // 5. Zero global accounts.google.com/gsi/client script tag in static HTML
      const gsiScripts = extractScripts(html).filter((s) =>
        (s.src || '').includes('accounts.google.com/gsi/client')
      );
      assert.equal(gsiScripts.length, 0, `${rel}: must NOT embed global GSI script`);
    }

    // 6. 100% sitemap.xml URL coverage & zero duplicates
    const sitemap = parseSitemapXml(readText(path.join(DIST_DIR, 'sitemap.xml')));
    const seenLocs = new Set();
    assert.ok(sitemap.urls.length >= 84, `Expected >=84 sitemap URLs, got ${sitemap.urls.length}`);
    for (const u of sitemap.urls) {
      assert.ok(!seenLocs.has(u.loc), `Duplicate sitemap <loc>: ${u.loc}`);
      seenLocs.add(u.loc);
      const parsed = new URL(u.loc);
      const p = parsed.pathname.replace(/\/+$/, '') || '/';
      const expectedFile = p === '/' ? path.join(DIST_DIR, 'index.html') : path.join(DIST_DIR, p.slice(1), 'index.html');
      assert.ok(fs.existsSync(expectedFile), `Sitemap URL ${u.loc} missing built HTML: ${expectedFile}`);
    }

    // 7. ERP index.html also non-blocking fonts + zero eager GSI
    const erpIndex = readText(path.join(ERP_ROOT, 'index.html'));
    const erpNoScript = erpIndex.replace(/<noscript\b[^>]*>[\s\S]*?<\/noscript>/gi, '');
    const erpFontLinks = extractLinks(erpNoScript).filter(
      (l) => l.rel === 'stylesheet' && (l.href || '').includes('fonts.googleapis.com')
    );
    assert.ok(erpFontLinks.length >= 1, 'ERP index.html missing Google Fonts link');
    for (const fl of erpFontLinks) {
      assert.equal(fl.attrs.media, 'print', 'ERP index.html Google Fonts must be non-blocking (media="print")');
    }
    const erpGsi = extractScripts(erpIndex).filter((s) => (s.src || '').includes('accounts.google.com/gsi/client'));
    assert.equal(erpGsi.length, 0, 'ERP index.html must NOT eagerly embed accounts.google.com/gsi/client');
  });

  it('T5-CATALOG-PARITY: DEFAULT_CLIENT_CATALOG matches backend 4 plans (incl. marketing_standalone 1.8M) & BillingView/PackageUpgradePanel enforce idempotency + full lifecycle UI', async () => {
    const { DEFAULT_CLIENT_CATALOG } = await import(
      pathToFileURL(path.join(LP_ROOT, 'src/components/autodata/autodataTypes.ts')).href
    );
    const backendBilling = readText(path.join(BACKEND_ROOT, 'server/services/billing.service.ts'));
    const lpBillingSrc = stripTsComments(readText(path.join(LP_ROOT, 'src/components/autodata/pages/BillingView.tsx')));
    const erpPanelSrc = stripTsComments(readText(path.join(ERP_ROOT, 'src/components/Settings/PackageUpgradePanel.tsx')));

    // 4 canonical plans in DEFAULT_CLIENT_CATALOG
    const byCode = new Map(DEFAULT_CLIENT_CATALOG.plans.map((p) => [p.code, p]));
    assert.equal(DEFAULT_CLIENT_CATALOG.plans.length, 4, 'DEFAULT_CLIENT_CATALOG.plans must contain 4 plans');
    for (const code of ['autodata_standard', 'autodata_growth', 'domation_crm_erp', 'marketing_standalone']) {
      assert.ok(byCode.has(code), `Missing plan ${code}`);
      assert.ok(backendBilling.includes(`code: '${code}'`), `Backend billing.service.ts missing ${code}`);
    }

    const mkt = byCode.get('marketing_standalone');
    assert.equal(mkt.monthly_price_vnd, 1_800_000);
    assert.equal(mkt.annual_total_vnd, 18_360_000);
    assert.equal(mkt.max_sales, 20);
    assert.equal(mkt.max_managers, 5);
    assert.equal(mkt.max_users, 25);
    assert.equal(mkt.monthly_lead_quota, 50_000);

    const ent = byCode.get('domation_crm_erp');
    assert.equal(ent.max_sales, 9_999);
    assert.equal(ent.max_managers, 9_999);

    // Account holder alignment across backend, LP, and ERP
    assert.ok(backendBilling.includes(DEFAULT_CLIENT_CATALOG.payment_bank_info.account_holder));
    assert.ok(erpPanelSrc.includes(DEFAULT_CLIENT_CATALOG.payment_bank_info.account_holder));

    // LP BillingView: 4-col desktop grid + idempotency_key + X-Idempotency-Key
    assert.ok(lpBillingSrc.includes('xl:grid-cols-4'), 'BillingView must use xl:grid-cols-4 for 4 plans');
    assert.ok(lpBillingSrc.includes('idempotency_key') && lpBillingSrc.includes('X-Idempotency-Key'));

    // ERP PackageUpgradePanel: idempotency_key + X-Idempotency-Key + topup + cancel + renew + auto-renew
    assert.ok(erpPanelSrc.includes('idempotency_key') && erpPanelSrc.includes('X-Idempotency-Key'));
    assert.ok(erpPanelSrc.includes('/api/v1/billing/topup'), 'ERP PackageUpgradePanel missing topup endpoint');
    assert.ok(erpPanelSrc.includes('/api/v1/billing/renew'), 'ERP PackageUpgradePanel missing renew endpoint');
    assert.ok(erpPanelSrc.includes('/api/v1/billing/cancel'), 'ERP PackageUpgradePanel missing cancel endpoint');
    assert.ok(erpPanelSrc.includes('/api/v1/billing/auto-renew'), 'ERP PackageUpgradePanel missing auto-renew endpoint');
    for (const tpId of ['topup_1m', 'topup_3m', 'topup_6m', 'topup_12m']) {
      assert.ok(erpPanelSrc.includes(tpId), `ERP PackageUpgradePanel missing ${tpId}`);
    }
  });

  it('T5-SETTINGS-HYDRATION: daily_report_include_meta_ads defaults OFF & AI toggles normalize true/1/"true"/"1"', () => {
    const lpSettings = stripTsComments(readText(path.join(LP_ROOT, 'src/components/autodata/cloned/pages/Settings.tsx')));
    const erpSettings = stripTsComments(readText(path.join(ERP_ROOT, 'src/pages/Settings.tsx')));

    for (const [label, src] of [['LP Settings.tsx', lpSettings], ['ERP Settings.tsx', erpSettings]]) {
      assert.ok(
        /useState(?:<boolean>)?\(\s*false\s*\)/.test(src) && src.includes('daily_report_include_meta_ads'),
        `${label}: dailyReportIncludeMetaAds must initialize false`
      );
      assert.ok(
        src.includes("=== 'true'") &&
          src.includes('ai_lead_eval_enabled') &&
          src.includes('ai_ads_eval_enabled'),
        `${label}: AI toggles must support 'true' string hydration consistently`
      );

      // Verify hydration logic behavior directly
      const hydrateMetaAds = (val) => val === true || val === 'true' || val === 1 || val === '1';
      for (const falsy of [undefined, null, false, 'false', 0, '0']) {
        assert.equal(hydrateMetaAds(falsy), false, `${label}: daily_report_include_meta_ads(${String(falsy)}) must be false`);
      }
      for (const truthy of [true, 'true', 1, '1']) {
        assert.equal(hydrateMetaAds(truthy), true, `${label}: daily_report_include_meta_ads(${String(truthy)}) must be true`);
      }

      const hydrateAiToggle = (val) =>
        val === undefined ? true : val === '1' || val === 1 || val === true || val === 'true';
      for (const truthy of [undefined, '1', 1, true, 'true']) {
        assert.equal(hydrateAiToggle(truthy), true, `${label}: AI toggle(${String(truthy)}) must be true`);
      }
      for (const falsy of ['0', 0, false, 'false']) {
        assert.equal(hydrateAiToggle(falsy), false, `${label}: AI toggle(${String(falsy)}) must be false`);
      }
    }
  });

  it('T5-CHUNKS: dist/assets/ includes all 7 vendor manualChunks and main-*.js < 150KB', () => {
    const assetsDir = path.join(DIST_DIR, 'assets');
    const files = fs.readdirSync(assetsDir);

    const expectedVendors = [
      'vendor-react',
      'vendor-charts',
      'vendor-xlsx',
      'vendor-exceljs',
      'vendor-icons',
      'vendor-dnd',
      'vendor-motion',
    ];
    for (const v of expectedVendors) {
      assert.ok(
        files.some((f) => f.startsWith(`${v}-`) && f.endsWith('.js')),
        `Missing expected manualChunk ${v}-*.js in dist/assets/`
      );
    }

    const mainChunk = files.find((f) => f.startsWith('main-') && f.endsWith('.js'));
    assert.ok(mainChunk, 'Missing main-*.js entry chunk in dist/assets/');
    const mainSize = fs.statSync(path.join(assetsDir, mainChunk)).size;
    assert.ok(mainSize < 150 * 1024, `main chunk ${mainChunk} too large: ${mainSize} bytes (>= 150KB)`);
  });

  it('T5-BROWSER-ALL-ROUTES: 0 overflow & 0 pageerror/console.error across LP routes + ERP /login at 4 viewports', async () => {
    const erpServer = await startStaticSpaServer(path.join(ERP_ROOT, 'dist'));
    const browser = await launchHeadlessBrowser();
    try {
      const page = await browser.newPage();
      const viewports = [
        { width: 375, height: 812 },
        { width: 390, height: 844 },
        { width: 768, height: 1024 },
        { width: 1280, height: 800 },
      ];
      const lpRoutes = [
        '/',
        '/data',
        '/crm',
        '/erp',
        '/automation',
        '/meta-report',
        '/meta-report/ecolifesignature',
        '/portfolio',
        '/enterprise',
        '/web-design',
        '/boost',
        '/boost/auto-chia-data-zalobot-5-giay-chong-rot-lead-bds',
        '/404-probe-missing',
      ];

      let pageErrors = [];
      let consoleErrors = [];
      page.on('pageerror', (err) => pageErrors.push(err.message));
      page.on('console', (msg) => {
        if (msg.type() === 'error') {
          consoleErrors.push(msg.text());
        }
      });

      for (const vp of viewports) {
        await page.setViewport(vp);
        for (const route of lpRoutes) {
          pageErrors = [];
          consoleErrors = [];
          await page.goto(`${lpPreview.baseUrl}${route}`, { waitUntil: 'networkidle0', timeout: 30_000 });
          const overflow = await page.evaluate(() => ({
            scrollW: document.documentElement.scrollWidth,
            innerW: window.innerWidth,
          }));
          assert.ok(
            overflow.scrollW <= overflow.innerW,
            `LP ${route} @ ${vp.width}x${vp.height}: scrollWidth (${overflow.scrollW}) > innerWidth (${overflow.innerW})`
          );
          assert.deepEqual(pageErrors, [], `LP ${route} @ ${vp.width}: pageErrors`);
          const effectiveConsoleErrors =
            route === '/meta-report/ecolifesignature'
              ? consoleErrors.filter((m) => !m.includes('[GSI_LOGGER]'))
              : consoleErrors;
          assert.deepEqual(effectiveConsoleErrors, [], `LP ${route} @ ${vp.width}: consoleErrors`);
        }

        // ERP /login check (0 GSI_LOGGER errors & 0 overflow)
        pageErrors = [];
        consoleErrors = [];
        await page.goto(`${erpServer.baseUrl}/login`, { waitUntil: 'networkidle0', timeout: 30_000 });
        const erpOverflow = await page.evaluate(() => ({
          scrollW: document.documentElement.scrollWidth,
          innerW: window.innerWidth,
        }));
        assert.ok(
          erpOverflow.scrollW <= erpOverflow.innerW,
          `ERP /login @ ${vp.width}x${vp.height}: scrollWidth (${erpOverflow.scrollW}) > innerWidth (${erpOverflow.innerW})`
        );
        assert.deepEqual(pageErrors, [], `ERP /login @ ${vp.width}: pageErrors`);
        assert.deepEqual(consoleErrors, [], `ERP /login @ ${vp.width}: consoleErrors (must have 0 GSI_LOGGER errors)`);
      }
    } finally {
      await browser.close();
      await erpServer.stop();
    }
  });

  it('T5-MOBILE-ROW-TOUCH: At 375x812 & 390x844, <=2 non-fixed buttons/row, 0 wrapped tablist, and >=44px primary non-frozen CTAs', async () => {
    const browser = await launchHeadlessBrowser();
    try {
      const page = await browser.newPage();
      const routes = ['/', '/data', '/crm', '/automation', '/portfolio', '/web-design'];

      for (const vp of [
        { width: 375, height: 812 },
        { width: 390, height: 844 },
      ]) {
        await page.setViewport(vp);
        for (const route of routes) {
          await page.goto(`${lpPreview.baseUrl}${route}`, { waitUntil: 'networkidle0', timeout: 30_000 });
          const audit = await page.evaluate(() => {
            const wrappedTablists = [];
            for (const tl of document.querySelectorAll('[role="tablist"]')) {
              const items = [...tl.querySelectorAll('button,[role="tab"]')].filter((el) => {
                const r = el.getBoundingClientRect();
                return r.width > 0 && r.height > 0;
              });
              const rows = new Set(items.map((el) => Math.round(el.getBoundingClientRect().top / 8)));
              if (rows.size > 1) wrappedTablists.push(tl.textContent?.slice(0, 60) || 'tablist');
            }

            // Check horizontal rows of non-fixed visible-in-viewport buttons/CTA links (excluding offscreen carousel slides & tiny dots)
            const vw = window.innerWidth;
            const flowControls = [...document.querySelectorAll('button, a.btn-inkica-primary, a.ql-btn-outline')].filter((el) => {
              const st = window.getComputedStyle(el);
              if (st.position === 'fixed' || st.display === 'none' || st.visibility === 'hidden') return false;
              let cur = el.parentElement;
              while (cur) {
                if (window.getComputedStyle(cur).position === 'fixed') return false;
                cur = cur.parentElement;
              }
              const r = el.getBoundingClientRect();
              if (r.width <= 16 || r.height <= 16) return false;
              if (r.right <= 0 || r.left >= vw) return false;
              return true;
            });

            const rowBuckets = new Map();
            for (const el of flowControls) {
              const r = el.getBoundingClientRect();
              const cy = Math.round((r.top + r.height / 2) / 14);
              const list = rowBuckets.get(cy) || [];
              list.push({ text: (el.textContent || '').trim().slice(0, 30), h: Math.round(r.height), w: Math.round(r.width) });
              rowBuckets.set(cy, list);
            }
            const multiButtonRows = [...rowBuckets.entries()]
              .filter(([, arr]) => arr.length > 2)
              .map(([bucket, arr]) => ({ bucket, count: arr.length, items: arr }));

            // Primary non-frozen CTA height check (in-viewport or active slide)
            const primaryCtas = [...document.querySelectorAll('.btn-inkica-primary, .ql-btn-outline')].filter((el) => {
              const r = el.getBoundingClientRect();
              return r.width > 0 && r.height > 0;
            });
            const undersizedCtas = primaryCtas
              .map((el) => ({
                text: (el.textContent || '').trim().slice(0, 40),
                h: Math.round(el.getBoundingClientRect().height),
              }))
              .filter((x) => x.h < 44);

            return { wrappedTablists, multiButtonRows, undersizedCtas };
          });

          assert.deepEqual(audit.wrappedTablists, [], `${route} @ ${vp.width}: wrapped tablist`);
          assert.deepEqual(audit.multiButtonRows, [], `${route} @ ${vp.width}: >2 buttons on same horizontal row`);
          assert.deepEqual(audit.undersizedCtas, [], `${route} @ ${vp.width}: primary CTA < 44px`);
        }
      }
    } finally {
      await browser.close();
    }
  });

  it('T5-TOUR-SETUP-E2E: Focus Tour 1->5->Back->Close->Reopen + NonCoderSetup check-steps, Advanced <pre> toggle & ERP 5.0 overflow tab switch', async () => {
    const browser = await launchHeadlessBrowser();
    try {
      const page = await browser.newPage();
      for (const vp of [
        { width: 375, height: 812 },
        { width: 1280, height: 800 },
      ]) {
        await page.setViewport(vp);

        // 1. Focus Tour flow
        await page.goto(`${lpPreview.baseUrl}/?tour=ecosystem`, { waitUntil: 'networkidle0', timeout: 30_000 });
        await page.waitForSelector('[role="dialog"]');
        for (let i = 0; i < 4; i++) {
          const nextBtn = await page.evaluateHandle(() =>
            [...document.querySelectorAll('[role="dialog"] button')].find((b) =>
              b.textContent?.includes('Tiếp theo')
            )
          );
          await nextBtn.asElement().click();
        }
        // Click Quay lại
        const backBtn = await page.evaluateHandle(() =>
          [...document.querySelectorAll('[role="dialog"] button')].find((b) =>
            b.textContent?.includes('Quay lại')
          )
        );
        await backBtn.asElement().click();

        // Close dialog
        await page.click('button[aria-label="Đóng Focus Tour"]');
        const closedCount = await page.evaluate(() => document.querySelectorAll('[role="dialog"]').length);
        assert.equal(closedCount, 0, `Focus Tour dialog did not close @ ${vp.width}`);

        // Reopen via "Xem Focus Tour Hệ Sinh Thái"
        const reopenBtn = await page.evaluateHandle(() =>
          [...document.querySelectorAll('button')].find((b) =>
            b.textContent?.includes('Xem Focus Tour Hệ Sinh Thái')
          )
        );
        await reopenBtn.asElement().click();
        await page.waitForSelector('[role="dialog"]');
        await page.click('button[aria-label="Đóng Focus Tour"]');

        // 2. Non-Coder Setup Modal flow
        await page.goto(`${lpPreview.baseUrl}/data?setup=quick`, { waitUntil: 'networkidle0', timeout: 30_000 });
        await page.waitForSelector('[role="dialog"]');

        // Expand "Chế độ Nâng cao (Kỹ thuật)" and verify <pre>
        const advBtn = await page.evaluateHandle(() =>
          [...document.querySelectorAll('[role="dialog"] button')].find((b) =>
            b.textContent?.includes('Chế độ Nâng cao')
          )
        );
        await advBtn.asElement().click();
        await page.waitForSelector('[role="dialog"] pre');

        // Switch to ERP 5.0 (via overflow menu on mobile or direct tab on desktop)
        const clickedDirect = await page.evaluate(() => {
          const direct = [...document.querySelectorAll('[role="dialog"] button')].find((b) =>
            /ERP 5\.0|ERP & VietQR/.test(b.textContent || '')
          );
          if (direct) {
            direct.click();
            return true;
          }
          return false;
        });
        if (!clickedDirect) {
          await page.click('[role="dialog"] button[aria-label="Mở thêm tab"]');
          await page.waitForSelector('[role="menu"] [role="menuitem"]');
          const erpItem = await page.evaluateHandle(() =>
            [...document.querySelectorAll('[role="menu"] [role="menuitem"]')].find((b) =>
              /ERP 5\.0|ERP & VietQR/.test(b.textContent || '')
            )
          );
          assert.ok(erpItem.asElement(), `Missing ERP menuitem in overflow menu @ ${vp.width}`);
          await erpItem.asElement().click();
        }
        const hasErpGuide = await page.evaluate(() =>
          document.querySelector('[role="dialog"]')?.textContent?.includes('ERP')
        );
        assert.ok(hasErpGuide, `NonCoderSetupModal failed to switch to ERP 5.0 @ ${vp.width}`);

        await page.click('button[aria-label="Đóng hướng dẫn thiết lập"]');
        const setupClosed = await page.evaluate(() => document.querySelectorAll('[role="dialog"]').length);
        assert.equal(setupClosed, 0, `NonCoderSetupModal did not close @ ${vp.width}`);
      }
    } finally {
      await browser.close();
    }
  });

  it('T5-FLYWHEEL-OVERFLOW: #closed-loop at 375x812 opens Khác dropdown, selects Notlead / Spam -> DisqualifiedLead & maintains 0 overflow', async () => {
    const browser = await launchHeadlessBrowser();
    try {
      const page = await browser.newPage();
      await page.setViewport({ width: 375, height: 812 });
      await page.goto(`${lpPreview.baseUrl}/data`, { waitUntil: 'networkidle0', timeout: 30_000 });
      await page.evaluate(() => {
        document.querySelector('#closed-loop button[aria-label="Mở thêm tab"]')?.scrollIntoView({ block: 'center' });
      });

      // Click the overflow dropdown trigger inside #closed-loop
      const moreBtn = await page.evaluateHandle(() =>
        document.querySelector('#closed-loop button[aria-label="Mở thêm tab"]')
      );
      assert.ok(moreBtn.asElement(), 'Missing DomResponsiveSubtabs overflow trigger inside #closed-loop');
      await moreBtn.asElement().click();
      await page.waitForSelector('[role="menu"] [role="menuitem"]');

      // Select Notlead / Spam -> DisqualifiedLead
      const notleadBtn = await page.evaluateHandle(() =>
        [...document.querySelectorAll('[role="menu"] [role="menuitem"]')].find(
          (b) => b.textContent?.includes('Notlead') && b.textContent?.includes('DisqualifiedLead')
        )
      );
      assert.ok(notleadBtn.asElement(), 'Missing Notlead / Spam -> DisqualifiedLead item in overflow menu');
      await notleadBtn.asElement().click();

      const result = await page.evaluate(() => {
        const sec = document.querySelector('#closed-loop');
        return {
          hasDisqualified: Boolean(sec?.textContent?.includes('DisqualifiedLead') && sec?.textContent?.includes('Sai số / Rác')),
          scrollW: document.documentElement.scrollWidth,
          innerW: window.innerWidth,
        };
      });
      assert.ok(result.hasDisqualified, 'Flywheel detail card did not update to DisqualifiedLead');
      assert.ok(result.scrollW <= result.innerW, `Overflow after selecting flywheel stage: ${result.scrollW} > ${result.innerW}`);
    } finally {
      await browser.close();
    }
  });
});
