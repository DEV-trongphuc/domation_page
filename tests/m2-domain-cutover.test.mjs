import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import vm from 'node:vm';
import { pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const ROOT = path.resolve(import.meta.dirname, '..');
const SRC = path.join(ROOT, 'src');
const DIST = path.join(ROOT, 'dist');
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

function readSrc(relPath) {
  return fs.readFileSync(path.join(SRC, relPath), 'utf8');
}

function walkFiles(dirPath, filterFn, acc = []) {
  if (!fs.existsSync(dirPath)) return acc;
  for (const entry of fs.readdirSync(dirPath, { withFileTypes: true })) {
    const full = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      walkFiles(full, filterFn, acc);
    } else if (filterFn(full)) {
      acc.push(full);
    }
  }
  return acc;
}

async function importTsxModule(relPath, expandAdvancedCode = false) {
  const esbuild = resolveEsbuild();
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'domation-lp-m2-'));
  const outFile = path.join(tmpDir, 'mod.mjs');
  const absEntry = path.join(SRC, relPath);
  try {
    await esbuild.build({
      entryPoints: [absEntry],
      outfile: outFile,
      bundle: true,
      format: 'esm',
      platform: 'node',
      external: ['react', 'react-dom', 'react-dom/server', 'lucide-react'],
      define: {
        'import.meta.env': JSON.stringify({}),
      },
      plugins: [
        {
          name: 'resolve-workspace-externals',
          setup(build) {
            build.onResolve({ filter: /^(react|react-dom|lucide-react)(\/.*)?$/ }, (args) => ({
              path: pathToFileURL(require.resolve(args.path)).href,
              external: true,
            }));
          },
        },
        ...(expandAdvancedCode
          ? [
              {
                name: 'expand-advanced-code',
                setup(build) {
                  build.onLoad({ filter: /\.(ts|tsx)$/ }, (args) => {
                    let contents = fs.readFileSync(args.path, 'utf8');
                    if (path.resolve(args.path) === path.resolve(absEntry)) {
                      contents = contents.replace(
                        'const [showAdvancedCode, setShowAdvancedCode] = useState(false);',
                        'const [showAdvancedCode, setShowAdvancedCode] = useState(true);'
                      );
                    }
                    return {
                      contents,
                      loader: args.path.endsWith('.tsx') ? 'tsx' : 'ts',
                    };
                  });
                },
              },
            ]
          : []),
      ],
    });
    const mod = await import(`${pathToFileURL(outFile).href}?t=${Date.now()}-${Math.random()}`);
    return mod;
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
}

describe('M2 Domain Cutover — DOMATION_LANDINGPAGE', () => {
  it('source files use canonical https://data.domation.net URLs without legacy leaks', () => {
    const webhookGuide = readSrc('components/autodata/AutoDataWebhookGuide.tsx');
    assert.match(webhookGuide, /https:\/\/data\.domation\.net/);
    assert.match(webhookGuide, /\/api\/v1\/webhooks\/\$\{safeSlugSegment\}\/\$\{safeTokenSegment\}/);
    assert.doesNotMatch(webhookGuide, /\/data\/\$\{tenantSlug\}\/submit/);
    assert.doesNotMatch(webhookGuide, /https:\/\/domation\.net\/api\/v1\/webhooks/);
    assert.doesNotMatch(webhookGuide, /localhost:3100/);

    const integrationsCloned = readSrc('components/autodata/cloned/pages/Integrations.tsx');
    assert.match(integrationsCloned, /const BASE_WEBHOOK = 'https:\/\/data\.domation\.net\/api\/v1\/webhooks'/);
    assert.match(
      integrationsCloned,
      /\$\{BASE_WEBHOOK\}\/\$\{encodeURIComponent\(tenantSlug \|\| '<tenant_slug>'\)\}\/\$\{encodeURIComponent\(token\)\}/
    );
    assert.match(integrationsCloned, /<AutoDataWebhookGuide[\s\S]*connectionToken=/);
    assert.doesNotMatch(integrationsCloned, /BASE_WEBHOOK\}\?token=/);
    assert.doesNotMatch(integrationsCloned, /https:\/\/domation\.net\/api\/v1\/webhooks/);

    const integrationsView = readSrc('components/autodata/pages/IntegrationsView.tsx');
    assert.match(integrationsView, /https:\/\/data\.domation\.net/);
    assert.match(integrationsView, /\/api\/v1\/webhooks\/\$\{encodeURIComponent\(tenantSlug\)\}\//);
    assert.match(integrationsView, /\/api\/v1\/integrations\/telegram\/webhook/);
    assert.doesNotMatch(integrationsView, /window\.location\.origin\}\/api\/v1\//);

    const telegramGuide = readSrc('components/autodata/AutoDataTelegramBotGuide.tsx');
    assert.match(telegramGuide, /https:\/\/data\.domation\.net\/api\/v1\/integrations\/telegram\/webhook/);
    assert.doesNotMatch(telegramGuide, /localhost:3100/);

    const autodataTypes = readSrc('components/autodata/autodataTypes.ts');
    assert.match(autodataTypes, /https:\/\/data\.domation\.net\/api\/v1\/webhooks\/<tenant_slug>\/<connection_token>/);
    assert.doesNotMatch(autodataTypes, /https:\/\/domation\.net\/api\/autodata\?action=webhook-test/);

    const nonCoderModal = readSrc('components/onboarding/NonCoderSetupModal.tsx');
    assert.match(nonCoderModal, /POST https:\/\/data\.domation\.net\/api\/v1\/webhooks\/<tenant_slug>\/<connection_token>/);
    assert.doesNotMatch(nonCoderModal, /https:\/\/domation\.net\/api\/v1\/webhooks/);

    const settingsCloned = readSrc('components/autodata/cloned/pages/Settings.tsx');
    assert.match(settingsCloned, /https:\/\/data\.domation\.net\/api\/v1\/webhooks\/zalo\/\$\{tenantSlug \|\| '<tenant_slug>'\}/);
    assert.match(settingsCloned, /Ví dụ: https:\/\/data\.domation\.net/);
    assert.doesNotMatch(settingsCloned, /https:\/\/domation\.net\/api\/v1\/integrations\/zalo/);
  });

  it('runtime React SSR render checks for AutoDataWebhookGuide, AutoDataTelegramBotGuide, and NonCoderSetupModal', async () => {
    const { AutoDataWebhookGuide } = await importTsxModule('components/autodata/AutoDataWebhookGuide.tsx', true);
    const { AutoDataTelegramBotGuide } = await importTsxModule('components/autodata/AutoDataTelegramBotGuide.tsx', true);
    const { NonCoderSetupModal } = await importTsxModule('components/onboarding/NonCoderSetupModal.tsx', true);

    const htmlWithToken = ReactDOMServer.renderToStaticMarkup(
      React.createElement(AutoDataWebhookGuide, {
        tenantSlug: 'ideas',
        connectionToken: 'whk_123',
      })
    );
    assert.ok(
      htmlWithToken.includes('https://data.domation.net/api/v1/webhooks/ideas/whk_123'),
      'Expected canonical webhook URL with connectionToken'
    );

    const htmlWithoutToken = ReactDOMServer.renderToStaticMarkup(
      React.createElement(AutoDataWebhookGuide, {
        tenantSlug: 'ideas',
      })
    );
    assert.ok(
      htmlWithoutToken.includes('https://data.domation.net/api/v1/webhooks/ideas/&lt;connection_token&gt;') ||
        htmlWithoutToken.includes('https://data.domation.net/api/v1/webhooks/ideas/<connection_token>'),
      'Expected placeholder <connection_token> when connectionToken is omitted'
    );

    const htmlSpecialChars = ReactDOMServer.renderToStaticMarkup(
      React.createElement(AutoDataWebhookGuide, {
        tenantSlug: 'ideas / ?a=1',
        connectionToken: 'whk/+=& 1',
      })
    );
    assert.ok(
      htmlSpecialChars.includes('https://data.domation.net/api/v1/webhooks/ideas%20%2F%20%3Fa%3D1/whk%2F%2B%3D%26%201'),
      'Expected URI-encoded tenantSlug and connectionToken'
    );

    const htmlExplicitUrl = ReactDOMServer.renderToStaticMarkup(
      React.createElement(AutoDataWebhookGuide, {
        tenantSlug: 'ideas',
        connectionToken: 'whk_123',
        webhookUrl: 'https://data.domation.net/api/v1/webhooks/custom/explicit_99',
      })
    );
    assert.ok(
      htmlExplicitUrl.includes('https://data.domation.net/api/v1/webhooks/custom/explicit_99'),
      'Expected explicit webhookUrl override'
    );

    const htmlTelegramEmpty = ReactDOMServer.renderToStaticMarkup(
      React.createElement(AutoDataTelegramBotGuide, {
        accessToken: 'tok',
        tenantSlug: 'ideas',
        savedTelegram: {
          status: 'inactive',
          enabled: false,
          silent_mode: true,
          server_silent_enforced: true,
          chat_id: '',
          bot_token_masked: '',
          webhook_url: '',
        },
        onUpdated: () => {},
        onFeedback: () => {},
      })
    );
    assert.ok(
      htmlTelegramEmpty.includes('https://data.domation.net/api/v1/integrations/telegram/webhook'),
      'Expected empty webhook_url to fall back to https://data.domation.net/api/v1/integrations/telegram/webhook'
    );
    assert.equal(htmlTelegramEmpty.includes('localhost:3100'), false);

    const htmlNonCoder = ReactDOMServer.renderToStaticMarkup(
      React.createElement(NonCoderSetupModal, {
        open: true,
        initialProduct: 'autodata',
        onClose: () => {},
      })
    );
    assert.ok(
      htmlNonCoder.includes('POST https://data.domation.net/api/v1/webhooks/'),
      'Expected NonCoderSetupModal to render canonical webhook POST snippet'
    );
    assert.equal(htmlNonCoder.includes('https://domation.net/api/v1/webhooks'), false);
  });

  it('routing & slug detection extracts ideas cleanly for meta.domation.net/ideas, /meta-report/ideas, and data.domation.net/ideas', () => {
    const metaSrc = readSrc('MetaAdReport.tsx');
    const reservedMatch = metaSrc.match(/const META_RESERVED_PATHS = new Set\(\[[\s\S]*?\]\);/);
    const detectMetaMatch = metaSrc.match(/function detectMetaPathSlug\(\): string \| null \{[\s\S]*?\n\}/);
    assert.ok(reservedMatch && detectMetaMatch, 'Could not locate META_RESERVED_PATHS or detectMetaPathSlug in MetaAdReport.tsx');

    const landingSrc = readSrc('DomationDataLanding.tsx');
    const detectDataMatch = landingSrc.match(/function detectWorkspacePathSlug\(\): string \| null \{[\s\S]*?\n\}/);
    assert.ok(detectDataMatch, 'Could not locate detectWorkspacePathSlug in DomationDataLanding.tsx');

    const evalMetaSlug = (hostname, pathname) => {
      const code = `
        const window = { location: { hostname: ${JSON.stringify(hostname)}, pathname: ${JSON.stringify(pathname)} } };
        ${reservedMatch[0]}
        ${detectMetaMatch[0].replace('function detectMetaPathSlug(): string | null', 'function detectMetaPathSlug()')}
        detectMetaPathSlug();
      `;
      return vm.runInNewContext(code);
    };

    const evalDataSlug = (hostname, pathname) => {
      const code = `
        const window = { location: { hostname: ${JSON.stringify(hostname)}, pathname: ${JSON.stringify(pathname)} } };
        ${detectDataMatch[0].replace('function detectWorkspacePathSlug(): string | null', 'function detectWorkspacePathSlug()')}
        detectWorkspacePathSlug();
      `;
      return vm.runInNewContext(code);
    };

    assert.equal(evalMetaSlug('meta.domation.net', '/ideas'), 'ideas');
    assert.equal(evalMetaSlug('meta.domation.net', '/ideas/'), 'ideas');
    assert.equal(evalMetaSlug('meta.domation.net', '/IDEAS'), 'ideas');
    assert.equal(evalMetaSlug('domation.net', '/meta-report/ideas'), 'ideas');
    assert.equal(evalMetaSlug('domation.net', '/meta-report/ideas/'), 'ideas');
    assert.equal(evalMetaSlug('meta.domation.net', '/login'), null);
    assert.equal(evalMetaSlug('meta.domation.net', '/workspaces'), null);
    assert.equal(evalMetaSlug('domation.net', '/meta-report/privacy'), null);

    assert.equal(evalDataSlug('data.domation.net', '/ideas'), 'ideas');
    assert.equal(evalDataSlug('data.domation.net', '/ideas/'), 'ideas');
    assert.equal(evalDataSlug('domation.net', '/data/ideas'), 'ideas');
    assert.equal(evalDataSlug('data.domation.net', '/privacy'), null);

    const mainSrc = readSrc('main.tsx');
    const isDataIdx = mainSrc.indexOf('isData && <DomationDataLanding />');
    const isIdeasIdx = mainSrc.indexOf('isIdeas && <IdeasLanding />');
    assert.ok(isDataIdx > 0 && isIdeasIdx > isDataIdx, 'main.tsx must evaluate isData before isIdeas for data.domation.net/ideas');
    assert.match(mainSrc, /!isData &&[\s\S]*isIdeas && <IdeasLanding \/>/);
  });

  it('buildGoogleAppsScriptSnippet() emits canonical https://data.domation.net webhook URL', async () => {
    const modUrl = pathToFileURL(path.join(SRC, 'components/autodata/autodataTypes.ts')).href;
    const mod = await import(modUrl);
    const defaultSnippet = mod.buildGoogleAppsScriptSnippet();
    assert.match(
      defaultSnippet,
      /const DOMATION_WEBHOOK_URL = "https:\/\/data\.domation\.net\/api\/v1\/webhooks\/<tenant_slug>\/<connection_token>";/
    );
    assert.doesNotMatch(defaultSnippet, /https:\/\/domation\.net\/api\/autodata/);

    const customSnippet = mod.buildGoogleAppsScriptSnippet(
      'https://data.domation.net/api/v1/webhooks/ideas/tok_abc123',
      'ops@ideas.edu.vn'
    );
    assert.match(
      customSnippet,
      /const DOMATION_WEBHOOK_URL = "https:\/\/data\.domation\.net\/api\/v1\/webhooks\/ideas\/tok_abc123";/
    );
  });

  it('src/, dist/assets/*.js, and dist/**/*.html contain required routes and zero domain/token/localhost leaks', () => {
    assert.equal(fs.existsSync(DIST), true, 'dist/ directory must exist (run npm run build first)');

    const requiredHtml = [
      'index.html',
      path.join('data', 'index.html'),
      path.join('meta-report', 'index.html'),
      path.join('ideas', 'index.html'),
      path.join('crm', 'index.html'),
    ];
    for (const rel of requiredHtml) {
      const full = path.join(DIST, rel);
      assert.equal(fs.existsSync(full), true, `Missing prerendered/built HTML: ${rel}`);
    }

    const forbidden = [
      'crm.domation.net',
      'localhost:3100',
      '127.0.0.1:3100',
      '?token=',
      'https://domation.net/api/v1/webhooks',
      'https://domation.net/api/v1/integrations/zalo',
      'https://domation.net/api/autodata?action=webhook-test',
    ];

    const srcFiles = walkFiles(SRC, (f) => /\.(ts|tsx|js|jsx|mjs|cjs)$/.test(f));
    assert.ok(srcFiles.length > 0, 'Expected source files in src/');
    for (const filePath of srcFiles) {
      const content = fs.readFileSync(filePath, 'utf8');
      for (const pat of forbidden) {
        assert.equal(content.includes(pat), false, `Leak "${pat}" in ${path.relative(ROOT, filePath)}`);
      }
    }

    const assetsDir = path.join(DIST, 'assets');
    assert.equal(fs.existsSync(assetsDir), true, 'dist/assets must exist');
    const jsFiles = fs.readdirSync(assetsDir).filter((f) => f.endsWith('.js'));
    assert.ok(jsFiles.length > 0, 'Expected JS bundle files in dist/assets');

    let foundCanonicalWebhook = false;
    for (const file of jsFiles) {
      const code = fs.readFileSync(path.join(assetsDir, file), 'utf8');
      for (const pat of forbidden) {
        assert.equal(code.includes(pat), false, `Leak "${pat}" in ${file}`);
      }
      if (code.includes('https://data.domation.net/api/v1/webhooks')) {
        foundCanonicalWebhook = true;
      }
    }
    assert.equal(foundCanonicalWebhook, true, 'Expected https://data.domation.net/api/v1/webhooks in dist/assets/*.js');

    const htmlFiles = walkFiles(DIST, (f) => f.endsWith('.html'));
    assert.ok(htmlFiles.length > 0, 'Expected built HTML files in dist/');
    for (const filePath of htmlFiles) {
      const html = fs.readFileSync(filePath, 'utf8');
      for (const pat of forbidden) {
        assert.equal(html.includes(pat), false, `Leak "${pat}" in ${path.relative(ROOT, filePath)}`);
      }
    }
  });

  it('sync-unified-shared.cjs 9 synced files match SHA-256 and 2 skipped ERP files retain customization markers', () => {
    const erpSrc = 'D:/GITHUB_SPACE/DOMATION_ERP_FULL/src';
    if (!fs.existsSync(erpSrc)) return;
    const crypto = require('node:crypto');
    const hash = (s) => crypto.createHash('sha256').update(s).digest('hex');
    const pairs = [
      ['utils/workspaceIpGuard.ts', 'utils/workspaceIpGuard.ts'],
      ['components/common/unifiedDateFilter.ts', 'components/common/unifiedDateFilter.ts'],
      ['components/dom-meta/domMetaTypes.ts', 'components/dom-meta/domMetaTypes.ts'],
      ['components/dom-meta/domMetaApi.ts', 'components/dom-meta/domMetaApi.ts'],
      ['components/dom-meta/GoogleAdsSetupGuide.tsx', 'components/dom-meta/GoogleAdsSetupGuide.tsx'],
      ['components/dom-meta/DomMetaModals.tsx', 'components/dom-meta/DomMetaModals.tsx'],
      ['components/dom-meta/DomMetaCharts.tsx', 'components/dom-meta/DomMetaCharts.tsx'],
      ['components/dom-meta/DomMetaSpotlightTour.tsx', 'components/dom-meta/DomMetaSpotlightTour.tsx'],
      ['components/dom-meta/DomMetaReportWorkspace.tsx', 'components/dom-meta/DomMetaReportWorkspace.tsx'],
    ];
    for (const [s, d] of pairs) {
      let srcContent = fs.readFileSync(path.join(SRC, s), 'utf8');
      if (s.endsWith('DomMetaReportWorkspace.tsx')) {
        srcContent = srcContent
          .replace("from '../DomationLogoMark'", "from '../common/DomationLogoMark'")
          .replace("from '../DomationProgressLoader'", "from '../common/DomationProgressLoader'");
      }
      const dstContent = fs.readFileSync(path.join(erpSrc, d), 'utf8');
      assert.equal(hash(srcContent), hash(dstContent), `Shared file drifted: ${d}`);
    }

    // Verify 2 intentionally skipped customized ERP files retain their customization markers
    const loaderDst = fs.readFileSync(path.join(erpSrc, 'components/common/DomationProgressLoader.tsx'), 'utf8');
    assert.ok(loaderDst.includes('mkt-scope'), 'DomationProgressLoader.tsx missing mkt-scope marker');
    assert.ok(loaderDst.includes('fluent-brand-ambient-bg'), 'DomationProgressLoader.tsx missing fluent-brand-ambient-bg marker');

    const datePickerDst = fs.readFileSync(path.join(erpSrc, 'components/common/DomUnifiedDatePicker.tsx'), 'utf8');
    assert.ok(datePickerDst.includes('dom-ios-modal'), 'DomUnifiedDatePicker.tsx missing dom-ios-modal marker');
    assert.ok(datePickerDst.includes('border-[#E2E8F0]'), 'DomUnifiedDatePicker.tsx missing border-[#E2E8F0] marker');
  });
});
