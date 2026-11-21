import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';
import {
  ERP_ROOT,
  startPreviewServer,
  launchHeadlessBrowser,
} from './e2e/helpers/frontend-e2e-harness.mjs';

const require = createRequire(import.meta.url);
const ROOT = path.resolve(import.meta.dirname, '..');
const SRC = path.join(ROOT, 'src');
const React = require('react');
const ReactDOMServer = require('react-dom/server');

function resolveEsbuild() {
  const candidates = [
    path.join(ROOT, 'node_modules/esbuild'),
    path.resolve(ROOT, '../DOMATION_ERP_FULL/node_modules/esbuild'),
  ];
  for (const cand of candidates) {
    if (fs.existsSync(cand)) {
      return require(cand);
    }
  }
  return require('esbuild');
}
const esbuild = resolveEsbuild();

async function withBundled(entryRelPath, fn, { winShim, docShim, external = [] } = {}) {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'dom-landing-audit-'));
  const outFile = path.join(tmpDir, 'mod.mjs');
  try {
    const plugins = external.length
      ? [
          {
            name: 'landing-ssr',
            setup(build) {
              build.onResolve({ filter: /^(react|lucide-react|framer-motion)(\/.*)?$/ }, (args) => ({
                path: pathToFileURL(require.resolve(args.path)).href,
                external: true,
              }));
              build.onResolve({ filter: /^react-dom$/ }, () => ({
                path: 'mock-rd',
                namespace: 'mock-rd',
              }));
              build.onLoad({ filter: /.*/, namespace: 'mock-rd' }, () => ({
                contents: `export const createPortal = (c) => c; export default { createPortal };`,
                loader: 'js',
              }));
            },
          },
        ]
      : [];

    await esbuild.build({
      entryPoints: [path.join(SRC, entryRelPath)],
      outfile: outFile,
      bundle: true,
      format: 'esm',
      platform: 'node',
      write: true,
      plugins,
    });

    const prevWin = globalThis.window;
    const prevDoc = globalThis.document;
    if (winShim !== undefined) globalThis.window = winShim;
    if (docShim !== undefined) globalThis.document = docShim;
    try {
      const mod = await import(`${pathToFileURL(outFile).href}?t=${Date.now()}-${Math.random()}`);
      return await fn(mod);
    } finally {
      if (prevWin === undefined) delete globalThis.window;
      else globalThis.window = prevWin;
      if (prevDoc === undefined) delete globalThis.document;
      else globalThis.document = prevDoc;
    }
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
}

describe('UI/UX, Back-Guard & Meta API Cache Audit — DOMATION_LANDINGPAGE', () => {
  it('overlayStack provides LIFO modal/drawer close, ref-counted scroll lock, and global bridge', async () => {
    const listeners = {};
    const fakeWin = {
      addEventListener: (ev, cb) => {
        listeners[ev] = cb;
      },
    };
    const fakeDoc = { body: { style: { overflow: '' } } };

    await withBundled(
      'utils/overlayStack.ts',
      (mod) => {
        const closed = [];
        const unregA = mod.pushOverlay('modal-a', () => closed.push('a'), 100);
        const unregB = mod.pushOverlay('modal-b', () => closed.push('b'), 200);
        assert.equal(mod.getTopOverlayId(), 'modal-b');
        assert.equal(mod.popAndCloseTopOverlay(), true);
        unregB();
        assert.equal(mod.popAndCloseTopOverlay(), true);
        unregA();
        assert.deepEqual(closed, ['b', 'a']);

        mod.lockBodyScroll();
        mod.lockBodyScroll();
        assert.equal(fakeDoc.body.style.overflow, 'hidden');
        mod.unlockBodyScroll();
        assert.equal(fakeDoc.body.style.overflow, 'hidden');
        mod.unlockBodyScroll();
        assert.equal(fakeDoc.body.style.overflow, '');

        assert.ok(fakeWin.__DOMATION_OVERLAY_BRIDGE__, 'Global overlay bridge must be exposed');
        assert.equal(typeof mod.getOverlayCount, 'function');

        // Re-entrancy & synthetic Escape recursion guard: a close handler dispatching Escape must NOT stack-overflow
        let escCalls = 0;
        const unregRec = mod.pushOverlay(
          'synthetic-esc-modal',
          () => {
            escCalls += 1;
            const syntheticEvt = { key: 'Escape', isComposing: false, __domOverlaySyntheticEsc: true, preventDefault() {}, stopPropagation() {} };
            listeners.keydown?.(syntheticEvt);
            // Even an unmarked re-entrant pop must be blocked by isPoppingOverlay
            mod.popAndCloseTopOverlay();
          },
          300
        );
        listeners.keydown?.({ key: 'Escape', isComposing: false, preventDefault() {}, stopPropagation() {} });
        assert.equal(escCalls, 1, 'Synthetic/re-entrant Escape must invoke close handler exactly once without infinite recursion');
        unregRec();
      },
      { winShim: fakeWin, docShim: fakeDoc }
    );
  });

  it('GlassModal & ImageZoomModal render iOS sheet ergonomics, overlay-close hook, and empty closed states safely', async () => {
    const fakeDoc = { body: { style: {} } };
    const fakeWin = { innerWidth: 390, addEventListener: () => {}, removeEventListener: () => {} };

    await withBundled(
      'components/GlassModal.tsx',
      ({ GlassModal, ImageZoomModal }) => {
        const closedHtml = ReactDOMServer.renderToStaticMarkup(
          React.createElement(GlassModal, { isOpen: false, onClose: () => {}, title: 'Hidden' }, 'Body')
        );
        assert.equal(closedHtml.includes('Body'), false);

        const openHtml = ReactDOMServer.renderToStaticMarkup(
          React.createElement(GlassModal, { isOpen: true, onClose: () => {}, title: 'Tư vấn' }, 'Nội dung')
        );
        assert.ok(openHtml.includes('Tư vấn') && openHtml.includes('Nội dung'));
        assert.ok(openHtml.includes('data-dom-overlay-close="true"'));
        assert.ok(openHtml.includes('rounded-t-[24px]'));

        const nullZoom = ReactDOMServer.renderToStaticMarkup(
          React.createElement(ImageZoomModal, { image: null, onClose: () => {} })
        );
        assert.equal(nullZoom, '');
      },
      { winShim: fakeWin, docShim: fakeDoc, external: ['react'] }
    );
  });

  it('main.tsx mounts useNativeAppBackGuard, DomMetaModalPortal bridges overlayStack, and index.css enforces overscroll & macOS/iOS motion', () => {
    const mainSrc = fs.readFileSync(path.join(SRC, 'main.tsx'), 'utf8');
    assert.match(mainSrc, /useNativeAppBackGuard\(locationKey\)/);

    const guardSrc = fs.readFileSync(path.join(SRC, 'hooks/useNativeAppBackGuard.ts'), 'utf8');
    assert.match(guardSrc, /pushHistoryGuardSentinel\(2\)/);
    assert.match(guardSrc, /window\.innerWidth <= 1280/);
    assert.match(guardSrc, /tryCloseVisibleDomModal/);

    const metaModals = fs.readFileSync(path.join(SRC, 'components/dom-meta/DomMetaModals.tsx'), 'utf8');
    assert.match(metaModals, /__DOMATION_OVERLAY_BRIDGE__/);

    const metaApi = fs.readFileSync(path.join(SRC, 'components/dom-meta/domMetaApi.ts'), 'utf8');
    assert.match(metaApi, /setBoundedCache/);
    assert.match(metaApi, /getBoundedCache/);
    assert.match(metaApi, /inFlightCrmAttr/);
    assert.match(metaApi, /crmAttrMemCache/);
    assert.match(metaApi, /authScope/);

    const css = fs.readFileSync(path.join(SRC, 'index.css'), 'utf8');
    assert.match(css, /overscroll-behavior-x:\s*none/);
    assert.match(css, /--ease-ios-sheet:\s*cubic-bezier\(0\.32,\s*0\.72,\s*0,\s*1\)/);
    assert.match(css, /--ease-macos-spring:\s*cubic-bezier\(0\.22,\s*1,\s*0\.36,\s*1\)/);
  });

  it('fetchDomMetaCrmAttribution isolates cache by auth token scope and honors forceRefresh', async () => {
    const fetchLog = [];
    const origFetch = globalThis.fetch;
    globalThis.fetch = async (url, init) => {
      const auth = String(init?.headers?.Authorization || init?.headers?.authorization || '');
      fetchLog.push({ url: String(url), auth });
      const isAdmin = auth.includes('TOKEN_ADMIN_AAA');
      return {
        ok: true,
        status: 200,
        json: async () => ({
          success: true,
          data: {
            summary: {
              total_leads: isAdmin ? 99 : 12,
              attributed_leads: isAdmin ? 80 : 10,
              qualified_leads: 5,
              closed_leads: 2,
              negative_leads: 0,
              total_revenue_vnd: isAdmin ? 500_000_000 : 10_000_000,
              capi_sent_count: 5,
            },
            by_ad: {},
            by_adset: {},
            by_campaign: {},
          },
        }),
      };
    };

    try {
      await withBundled('components/dom-meta/domMetaApi.ts', async (mod) => {
        mod.clearDomMetaClientCaches?.();
        const adminCtx = { apiBaseUrl: 'https://data.domation.net', tenantSlug: 'ideas', accessToken: 'Bearer_TOKEN_ADMIN_AAA_1234567890' };
        const viewerCtx = { apiBaseUrl: 'https://data.domation.net', tenantSlug: 'ideas', accessToken: 'Bearer_TOKEN_VIEWER_BBB_0987654321' };

        const r1 = await mod.fetchDomMetaCrmAttribution(adminCtx, { since: '2026-10-01', until: '2026-10-31' });
        const r2 = await mod.fetchDomMetaCrmAttribution(adminCtx, { since: '2026-10-01', until: '2026-10-31' });
        assert.equal(r1.summary.total_leads, 99);
        assert.equal(r2.summary.total_leads, 99);
        assert.equal(fetchLog.length, 1, 'Identical admin token request within TTL should hit cache');

        const rViewer = await mod.fetchDomMetaCrmAttribution(viewerCtx, { since: '2026-10-01', until: '2026-10-31' });
        assert.equal(rViewer.summary.total_leads, 12, 'Different auth token must NEVER receive admin cached payload');
        assert.equal(fetchLog.length, 2);

        const rForce = await mod.fetchDomMetaCrmAttribution(adminCtx, { since: '2026-10-01', until: '2026-10-31', forceRefresh: true });
        assert.equal(rForce.summary.total_leads, 99);
        assert.equal(fetchLog.length, 3, 'forceRefresh must bypass cache');
      });
    } finally {
      globalThis.fetch = origFetch;
    }
  });

  it('Live Headless Chromium Mobile (375x812) & Tablet (768x1024): LIFO overlay unwind, 1-hop/multi-hop in-app back, edge-swipe back & never exits app on both Landing and ERP', async () => {
    const startStaticSpa = async (distDir) => {
      const mimeMap = {
        '.html': 'text/html; charset=utf-8',
        '.js': 'application/javascript; charset=utf-8',
        '.css': 'text/css; charset=utf-8',
        '.svg': 'image/svg+xml',
        '.png': 'image/png',
        '.webp': 'image/webp',
        '.json': 'application/json; charset=utf-8',
        '.woff2': 'font/woff2',
        '.ico': 'image/x-icon',
      };
      const server = http.createServer((req, res) => {
        const rawUrl = (req.url || '/').split('?')[0];
        const safeRel = path.normalize(rawUrl).replace(/^(\.\.[/\\])+/, '');
        let target = path.join(distDir, safeRel === '/' ? 'index.html' : safeRel);
        if (fs.existsSync(target) && fs.statSync(target).isDirectory()) target = path.join(target, 'index.html');
        if (!fs.existsSync(target) || !fs.statSync(target).isFile()) target = path.join(distDir, 'index.html');
        res.writeHead(200, { 'Content-Type': mimeMap[path.extname(target).toLowerCase()] || 'application/octet-stream' });
        fs.createReadStream(target).pipe(res);
      });
      await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
      const port = server.address().port;
      return {
        baseUrl: `http://127.0.0.1:${port}`,
        stop: () => new Promise((resolve) => server.close(resolve)),
      };
    };

    const lpServer = await startPreviewServer({ requireDist: true });
    const erpServer = await startStaticSpa(path.join(ERP_ROOT, 'dist'));
    const browser = await launchHeadlessBrowser();

    try {
      const page = await browser.newPage();
      const pageErrors = [];
      page.on('pageerror', (err) => pageErrors.push(err.message));

      // --- PART A: DOMATION_LANDINGPAGE at Mobile 375x812 ---
      await page.setViewport({ width: 375, height: 812, isMobile: true, hasTouch: true });
      await page.goto(`${lpServer.baseUrl}/`, { waitUntil: 'networkidle0', timeout: 30_000 });

      const initChecks = await page.evaluate(() => ({
        overscrollX: window.getComputedStyle(document.documentElement).overscrollBehaviorX,
        scrollW: document.documentElement.scrollWidth,
        innerW: window.innerWidth,
        hasBridge: Boolean(window.__DOMATION_OVERLAY_BRIDGE__?.pushOverlay),
        hasSentinel: Boolean(window.history.state?.__domLandingAppGuard),
      }));
      assert.equal(initChecks.overscrollX, 'none', 'Landing html must enforce overscroll-behavior-x: none');
      assert.ok(initChecks.scrollW <= initChecks.innerW, `Landing overflow @ 375: ${initChecks.scrollW} > ${initChecks.innerW}`);
      assert.equal(initChecks.hasBridge, true, 'Landing must expose __DOMATION_OVERLAY_BRIDGE__');
      assert.equal(initChecks.hasSentinel, true, 'Landing mobile must arm history sentinel on mount');

      // Navigate SPA: / -> /boost -> /boost/auto-chia-data-zalobot-5-giay-chong-rot-lead-bds
      await page.evaluate(() => {
        window.history.pushState({}, '', '/boost');
        window.dispatchEvent(new CustomEvent('domation:navigate'));
      });
      await page.waitForFunction(() => window.location.pathname === '/boost', { timeout: 10_000 });
      await new Promise((r) => setTimeout(r, 150));

      await page.evaluate(() => {
        window.history.pushState({}, '', '/boost/auto-chia-data-zalobot-5-giay-chong-rot-lead-bds');
        window.dispatchEvent(new CustomEvent('domation:navigate'));
      });
      await page.waitForFunction(
        () => window.location.pathname === '/boost/auto-chia-data-zalobot-5-giay-chong-rot-lead-bds',
        { timeout: 10_000 }
      );
      await new Promise((r) => setTimeout(r, 150));

      // Push 2 nested overlays (drawer + modal) -> Back must unwind modal -> drawer BEFORE navigating away!
      await page.evaluate(() => {
        window.__testClosed = [];
        const b = window.__DOMATION_OVERLAY_BRIDGE__;
        let unA;
        let unB;
        unA = b.pushOverlay('test-drawer', () => {
          window.__testClosed.push('drawer');
          unA();
        }, 100);
        unB = b.pushOverlay('test-modal', () => {
          window.__testClosed.push('modal');
          unB();
        }, 200);
      });
      await new Promise((r) => setTimeout(r, 60));

      // Back #1: closes modal, stays on article
      await page.evaluate(() => window.history.back());
      await new Promise((r) => setTimeout(r, 140));
      let st = await page.evaluate(() => ({ path: window.location.pathname, closed: window.__testClosed }));
      assert.deepEqual(st.closed, ['modal'], 'First back must close topmost modal only');
      assert.equal(st.path, '/boost/auto-chia-data-zalobot-5-giay-chong-rot-lead-bds');

      // Back #2: closes drawer, stays on article
      await page.evaluate(() => window.history.back());
      await new Promise((r) => setTimeout(r, 140));
      st = await page.evaluate(() => ({ path: window.location.pathname, closed: window.__testClosed }));
      assert.deepEqual(st.closed, ['modal', 'drawer'], 'Second back must close drawer');
      assert.equal(st.path, '/boost/auto-chia-data-zalobot-5-giay-chong-rot-lead-bds');

      // Back #3: navigates to /boost
      await page.evaluate(() => window.history.back());
      await new Promise((r) => setTimeout(r, 160));
      assert.equal(await page.evaluate(() => window.location.pathname), '/boost', 'Third back must step back to /boost');

      // Back #4 (1-hop to earliest route!): navigates to /
      await page.evaluate(() => window.history.back());
      await new Promise((r) => setTimeout(r, 160));
      assert.equal(await page.evaluate(() => window.location.pathname), '/', 'Fourth back must step back 1-hop to / (not get stuck on /boost)');

      // Back #5, #6, #7 at root /: must NEVER exit app!
      for (let i = 0; i < 3; i++) {
        await page.evaluate(() => window.history.back());
        await new Promise((r) => setTimeout(r, 120));
      }
      const rootAfterRapidBack = await page.evaluate(() => ({
        href: window.location.href,
        path: window.location.pathname,
      }));
      assert.ok(rootAfterRapidBack.href.startsWith(lpServer.baseUrl), 'Rapid back at root must NEVER exit the app');
      assert.equal(rootAfterRapidBack.path, '/');

      // Left-edge inward swipe test: / -> /boost -> swipe x=12..130 -> returns to /
      await page.evaluate(() => {
        window.history.pushState({}, '', '/boost');
        window.dispatchEvent(new CustomEvent('domation:navigate'));
      });
      await new Promise((r) => setTimeout(r, 150));
      await page.evaluate(() => {
        const mkTouch = (x, y) => new Touch({ identifier: 1, target: document.body, clientX: x, clientY: y, pageX: x, pageY: y });
        document.dispatchEvent(new TouchEvent('touchstart', { touches: [mkTouch(12, 320)], changedTouches: [mkTouch(12, 320)], cancelable: true, bubbles: true }));
        document.dispatchEvent(new TouchEvent('touchmove', { touches: [mkTouch(130, 326)], changedTouches: [mkTouch(130, 326)], cancelable: true, bubbles: true }));
        document.dispatchEvent(new TouchEvent('touchend', { touches: [], changedTouches: [mkTouch(130, 326)], cancelable: true, bubbles: true }));
      });
      await new Promise((r) => setTimeout(r, 150));
      assert.equal(await page.evaluate(() => window.location.pathname), '/', 'Left-edge inward swipe must trigger natural in-app back to /');

      // --- PART B: DOMATION_ERP_FULL at Tablet 768x1024 ---
      await page.setViewport({ width: 768, height: 1024, isMobile: true, hasTouch: true });
      await page.goto(`${erpServer.baseUrl}/login`, { waitUntil: 'networkidle0', timeout: 30_000 });

      const erpInit = await page.evaluate(() => ({
        overscrollX: window.getComputedStyle(document.documentElement).overscrollBehaviorX,
        scrollW: document.documentElement.scrollWidth,
        innerW: window.innerWidth,
        hasBridge: Boolean(window.__DOMATION_OVERLAY_BRIDGE__?.pushOverlay),
        hasSentinel: Boolean(window.history.state?.__myerpAppGuard),
      }));
      assert.equal(erpInit.overscrollX, 'none', 'ERP html must enforce overscroll-behavior-x: none');
      assert.ok(erpInit.scrollW <= erpInit.innerW, `ERP /login overflow @ 768: ${erpInit.scrollW} > ${erpInit.innerW}`);
      assert.equal(erpInit.hasBridge, true, 'ERP must expose __DOMATION_OVERLAY_BRIDGE__');
      assert.equal(erpInit.hasSentinel, true, 'ERP tablet must arm history sentinel on mount');

      // Push nested ERP drawer + modal -> verify LIFO back unwind + root guard never exits ERP
      await page.evaluate(() => {
        window.__erpClosed = [];
        const b = window.__DOMATION_OVERLAY_BRIDGE__;
        let unD;
        let unM;
        unD = b.pushOverlay('customer-profile-drawer', () => {
          window.__erpClosed.push('drawer');
          unD();
        }, 100);
        unM = b.pushOverlay('confirm-submodal', () => {
          window.__erpClosed.push('submodal');
          unM();
        }, 2147483644);
      });
      await new Promise((r) => setTimeout(r, 80));

      await page.evaluate(() => window.history.back());
      await new Promise((r) => setTimeout(r, 140));
      assert.deepEqual(await page.evaluate(() => window.__erpClosed), ['submodal']);

      await page.evaluate(() => window.history.back());
      await new Promise((r) => setTimeout(r, 140));
      assert.deepEqual(await page.evaluate(() => window.__erpClosed), ['submodal', 'drawer']);

      // Rapid 3x back at ERP root must NEVER exit ERP
      for (let i = 0; i < 3; i++) {
        await page.evaluate(() => window.history.back());
        await new Promise((r) => setTimeout(r, 120));
      }
      const erpAfterBack = await page.evaluate(() => window.location.href);
      assert.ok(erpAfterBack.startsWith(erpServer.baseUrl), 'Rapid back at ERP root must NEVER exit app');
      assert.deepEqual(pageErrors, [], `Unexpected browser pageErrors: ${pageErrors.join('; ')}`);
    } finally {
      await browser.close();
      await erpServer.stop();
      await lpServer.stop();
    }
  });
});
