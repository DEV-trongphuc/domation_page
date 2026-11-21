import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

import {
  LP_ROOT,
  ERP_ROOT,
  fileExists,
  readText,
  stripTsComments,
} from './helpers/frontend-e2e-harness.mjs';

async function importTs(relPath) {
  return import(pathToFileURL(path.join(LP_ROOT, relPath)).href);
}

function listComponentFilesRecursive(dir) {
  if (!fs.existsSync(dir)) return [];
  const results = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...listComponentFilesRecursive(full));
    } else if (entry.isFile() && /\.(tsx|ts)$/.test(entry.name)) {
      results.push(full);
    }
  }
  return results;
}

function resolveImportedComponentPaths(entrySrc, baseDir = path.join(LP_ROOT, 'src')) {
  const resolved = [];
  const importRegex = /from\s+['"](\.[^'"]+)['"]/g;
  let match;
  while ((match = importRegex.exec(entrySrc)) !== null) {
    const rel = match[1];
    for (const ext of ['', '.tsx', '.ts', '/index.tsx', '/index.ts']) {
      const candidate = path.resolve(baseDir, `${rel}${ext}`);
      if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
        resolved.push(candidate);
        break;
      }
    }
  }
  return [...new Set(resolved)];
}

function assertDefaultCollapsedCodeToggle(rawSrc, label) {
  const src = stripTsComments(rawSrc);
  const stateMatch = src.match(
    /const\s+\[\s*(\w*(?:Advanced|Code|Snippet|Script|RawCode|ScopesJson)\w*)\s*,\s*(set\w+)\s*\]\s*=\s*useState(?:<boolean>)?\(\s*false\s*\)/i
  );
  assert.ok(
    stateMatch,
    `${label}: must declare a default-collapsed boolean useState(false) toggle for raw/advanced code`
  );
  const [, stateVar, setterName] = stateMatch;
  assert.ok(
    new RegExp(`onClick=\\{[\\s\\S]{0,120}\\b${setterName}\\b`).test(src),
    `${label}: toggle setter "${setterName}" must be wired to an onClick button/control`
  );
  const conditionalBlockRe = new RegExp(
    `\\{${stateVar}\\s*(?:&&|\\?)[\\s\\S]{0,1500}<(?:pre|textarea|code)\\b`,
    'i'
  );
  assert.ok(
    conditionalBlockRe.test(src),
    `${label}: raw code/snippet block (<pre>/<textarea>/<code>) must be conditionally gated by "${stateVar}"`
  );
}

describe('F5 & F6: Non-Coder Setup Wizards, Check-Step, Topup UI & Ecosystem Focus Tours', () => {
  // =========================================================================
  // F5 — Non-Coder Step-by-Step Setup, Check-Step & Topup Modals (5 Tier 1 + 5 Tier 2)
  // =========================================================================

  describe('F5 Tier 1: Setup Wizards, 4 Channel Guides, Advanced Toggle & VietQR/Add-on UI', () => {
    it('F5-T1.1: Non-coder 3-step setup wizard (AutoDataAuthModal) exposes check-step pills, slug check, non-coder defaults & session continuity', async () => {
      const { SESSION_V2_STORAGE_KEY } = await importTs('src/components/autodata/autodataTypes.ts');
      assert.equal(SESSION_V2_STORAGE_KEY, 'domation_autodata_session_v2');

      const authSrc = readText(path.join(LP_ROOT, 'src/components/autodata/AutoDataAuthModal.tsx'));
      const apiSrc = readText(path.join(LP_ROOT, 'src/components/autodata/autodataApi.ts'));
      assert.ok(authSrc.includes('data-tour="setup-stepper"'), 'Missing setup-stepper tour anchor');
      assert.ok(authSrc.includes('Bắt buộc') && authSrc.includes('Tùy chọn'), 'Missing required/optional step pills');
      assert.ok(authSrc.includes('/auth/check-slug'), 'Missing real-time slug availability check');
      assert.ok(authSrc.includes('isExternalAgency') && authSrc.includes('weighted_round_robin'), 'Missing non-coder Step 2 routing defaults');
      assert.ok(
        authSrc.includes('saveAutodataSessionV2') &&
          apiSrc.includes('saveAutodataSessionV2') &&
          (apiSrc.includes('SESSION_V2_STORAGE_KEY') || apiSrc.includes('domation_autodata_session_v2')) &&
          /localStorage\.setItem\(\s*(?:SESSION_V2_STORAGE_KEY|['"]domation_autodata_session_v2['"])/.test(apiSrc),
        'Missing onboarding-to-workspace session persistence via SESSION_V2_STORAGE_KEY'
      );
      assert.ok(authSrc.includes('Bỏ qua & vào ngay'), 'Missing instant workspace entry CTA');
    });

    it('F5-T1.2: All 4 CRM channel guides + GoogleAdsSetupGuide expose step verification & live/sandbox test states', () => {
      const zalo = readText(path.join(LP_ROOT, 'src/components/autodata/AutoDataZaloBotGuide.tsx'));
      const tg = readText(path.join(LP_ROOT, 'src/components/autodata/AutoDataTelegramBotGuide.tsx'));
      const wh = readText(path.join(LP_ROOT, 'src/components/autodata/AutoDataWebhookGuide.tsx'));
      const email = readText(path.join(LP_ROOT, 'src/components/autodata/AutoDataEmailGuide.tsx'));
      const gads = readText(path.join(LP_ROOT, 'src/components/dom-meta/GoogleAdsSetupGuide.tsx'));

      assert.ok(zalo.includes('zalo-verify') && zalo.includes('zalo-updates'), 'Zalo guide missing live/sandbox verify & chat ID discovery');
      assert.ok(tg.includes('telegram-config') && tg.includes('telegram-test'), 'Telegram guide missing config & test actions');
      assert.ok(wh.includes('/leads/personal') && /BƯỚC|activeStep/i.test(wh), 'Webhook guide missing multi-step flow & test endpoint');
      assert.ok(email.includes('/integrations/email/test') && email.includes('appscript') && email.includes('smtp'), 'Email guide missing Apps Script/SMTP & live test');
      assert.ok(gads.includes('GOOGLE_ADS_SETUP_STEPS') && gads.includes('data-testid="google-ads-toggle"'), 'GoogleAdsSetupGuide missing 5-step cards & switch');
    });

    it('F5-T1.3: Advanced-code toggle hides raw JSON/cURL/AppsScript code by default for non-coders', () => {
      const gads = readText(path.join(LP_ROOT, 'src/components/dom-meta/GoogleAdsSetupGuide.tsx'));
      const wh = readText(path.join(LP_ROOT, 'src/components/autodata/AutoDataWebhookGuide.tsx'));
      const email = readText(path.join(LP_ROOT, 'src/components/autodata/AutoDataEmailGuide.tsx'));

      assertDefaultCollapsedCodeToggle(gads, 'GoogleAdsSetupGuide.tsx');
      assertDefaultCollapsedCodeToggle(wh, 'AutoDataWebhookGuide.tsx');
      assertDefaultCollapsedCodeToggle(email, 'AutoDataEmailGuide.tsx');
    });

    it('F5-T1.4: DomMetaQuickConnectModal exposes 1-click auto-reuse banner & 2-step multi-account verification', () => {
      const qc = readText(path.join(LP_ROOT, 'src/components/dom-meta/DomMetaQuickConnectModal.tsx'));
      assert.ok(qc.includes('data-testid="dom-meta-quick-connect-modal"'));
      assert.ok(qc.includes('data-testid="quick-connect-auto-reuse-banner"'));
      assert.ok(qc.includes('data-testid="quick-connect-reuse-btn"'));
      assert.ok(qc.includes('auto_reuse: true'));
      assert.ok(/step\s*===\s*1|step\s*===\s*2/.test(qc) || qc.includes('setStep'));
    });

    it('F5-T1.5: VietQR / bank-transfer top-up UI in CrmUpgradeShowcaseModal & BillingView + ERP PackageUpgradePanel add-on toggle', () => {
      const modals = readText(path.join(LP_ROOT, 'src/components/dom-meta/DomMetaModals.tsx'));
      const billing = readText(path.join(LP_ROOT, 'src/components/autodata/pages/BillingView.tsx'));
      const erpPkg = readText(path.join(ERP_ROOT, 'src/components/Settings/PackageUpgradePanel.tsx'));

      assert.ok(modals.includes('data-testid="crm-upgrade-showcase-modal"'));
      assert.ok(
        /vietqr|img\.vietqr\.io|qr_url|qrCode/i.test(modals),
        'CrmUpgradeShowcaseModal must render VietQR QR payload/image for topup orders'
      );
      assert.ok(
        /vietqr|img\.vietqr\.io|qr_url|qrCode/i.test(billing),
        'BillingView.tsx must render VietQR QR payload/image for topup orders'
      );
      assert.ok(
        erpPkg.includes('education_addon') && erpPkg.includes('/api/v1/myerp/package-entitlements/upgrade'),
        'ERP PackageUpgradePanel must support education_addon conversion toggle'
      );
    });
  });

  describe('F5 Tier 2: Setup Validation, Defaults & Error Handling Boundaries', () => {
    it('F5-T2.1: AutoDataAuthModal handles HTTP 409 slug collision and validates required Step 1 fields', () => {
      const authSrc = readText(path.join(LP_ROOT, 'src/components/autodata/AutoDataAuthModal.tsx'));
      assert.ok(authSrc.includes('409'), 'Missing 409 slug conflict handling');
      assert.ok(/trim\(\)|!companyName|!email|!password/i.test(authSrc), 'Missing Step 1 required field validation');
    });

    it('F5-T2.2: Telegram Silent Mode defaults ON (true) and Google Ads toggle defaults OFF (false)', () => {
      const tg = stripTsComments(readText(path.join(LP_ROOT, 'src/components/autodata/AutoDataTelegramBotGuide.tsx')));
      const gads = stripTsComments(readText(path.join(LP_ROOT, 'src/components/dom-meta/GoogleAdsSetupGuide.tsx')));
      const domMetaApi = stripTsComments(readText(path.join(LP_ROOT, 'src/components/dom-meta/domMetaApi.ts')));
      const domMetaWs = stripTsComments(readText(path.join(LP_ROOT, 'src/components/dom-meta/DomMetaReportWorkspace.tsx')));

      assert.ok(/savedTelegram\?\.silent_mode\s*\?\?\s*true/.test(tg), 'Telegram silentMode must default to true');

      const emptyConfigFnMatch = domMetaApi.match(
        /export\s+function\s+createEmptyWorkspaceConfig\s*\([^)]*\)[^{]*\{([\s\S]*?)^\}/m
      );
      assert.ok(emptyConfigFnMatch, 'Missing createEmptyWorkspaceConfig() in domMetaApi.ts');
      assert.ok(
        /google_ads:\s*\{\s*enabled:\s*false\b/.test(emptyConfigFnMatch[1]),
        'createEmptyWorkspaceConfig() must default google_ads.enabled to false'
      );

      assert.ok(
        domMetaWs.includes('createEmptyWorkspaceConfig()') &&
          /!config\.google_ads\.enabled\s*&&\s*activeView\s*===\s*['"]google_ads['"]/.test(domMetaWs) &&
          /config\.google_ads\.enabled\s*\?/.test(domMetaWs),
        'DomMetaReportWorkspace.tsx must initialize with createEmptyWorkspaceConfig() and gate Google Ads view/nav on config.google_ads.enabled'
      );

      assert.ok(
        gads.includes('role="switch"') &&
          /aria-checked=\{value\.enabled\}/.test(gads) &&
          /\{value\.enabled\s*&&/.test(gads),
        'GoogleAdsSetupGuide must expose role="switch", aria-checked={value.enabled}, and conditional setup expansion'
      );
    });

    it('F5-T2.3: Email & Webhook guides validate malformed email / invalid JSON before network dispatch', () => {
      const wh = readText(path.join(LP_ROOT, 'src/components/autodata/AutoDataWebhookGuide.tsx'));
      const email = readText(path.join(LP_ROOT, 'src/components/autodata/AutoDataEmailGuide.tsx'));
      assert.ok(wh.includes('JSON.parse(testPayload)'), 'Webhook guide must validate JSON payload before POST');
      assert.ok(email.includes("includes('@')"), 'Email guide must validate recipient email before POST');
    });

    it('F5-T2.4: Non-coder setup/check-step UI is wired cleanly from landing -> app and AutoDataAuthModal dedup default is 180 days (not 90)', () => {
      const homeSrc = stripTsComments(readText(path.join(LP_ROOT, 'src/DomationHome.tsx')));
      const dataLandingSrc = stripTsComments(readText(path.join(LP_ROOT, 'src/DomationDataLanding.tsx')));
      const authClean = stripTsComments(readText(path.join(LP_ROOT, 'src/components/autodata/AutoDataAuthModal.tsx')));

      const importedPaths = [
        ...resolveImportedComponentPaths(homeSrc),
        ...resolveImportedComponentPaths(dataLandingSrc),
      ];
      const allComponents = listComponentFilesRecursive(path.join(LP_ROOT, 'src/components'));
      const setupCandidates = [...new Set([
        ...importedPaths.filter((p) => /(?:setup|onboard|wizard|authmodal)/i.test(p)),
        ...allComponents.filter((p) => /(?:setup|onboard|wizard)/i.test(p) && !/tests[\\/]/i.test(p)),
        path.join(LP_ROOT, 'src/components/autodata/AutoDataAuthModal.tsx'),
      ])].filter((p) => fs.existsSync(p));

      const combinedSetup = setupCandidates.map((p) => stripTsComments(readText(p))).join('\n');
      assert.ok(
        setupCandidates.length >= 1 &&
          /Bắt buộc/.test(combinedSetup) &&
          /Tùy chọn/.test(combinedSetup) &&
          /role="dialog"/.test(combinedSetup) &&
          /(?:setup-stepper|Bước\s*1|Step\s*1)/i.test(combinedSetup),
        'Expected non-coder setup modal with check-step indicators (Bắt buộc/Tùy chọn, role="dialog", stepper)'
      );

      assert.ok(
        /const\s+\[\s*dedupDays\s*,\s*setDedupDays\s*\]\s*=\s*useState(?:<number>)?\(\s*180\s*\)/.test(authClean),
        'AutoDataAuthModal.tsx must initialize dedupDays to 180'
      );
      assert.ok(
        !/90\s*ngày|dedupe_90d/i.test(authClean),
        'AutoDataAuthModal.tsx still contains stale 90 ngày / dedupe_90d copy instead of 180 ngày'
      );
    });

    it('F5-T2.5: CrmUpgradeShowcaseModal & BillingView handle API failures gracefully and map fast support to target_suite', () => {
      const modals = readText(path.join(LP_ROOT, 'src/components/dom-meta/DomMetaModals.tsx'));
      const billing = readText(path.join(LP_ROOT, 'src/components/autodata/pages/BillingView.tsx'));
      assert.ok(modals.includes('data-testid="crm-upgrade-fast-support-btn"') && modals.includes('/billing/upgrade-request'));
      assert.ok(billing.includes('getErrorMessage'), 'BillingView must map errors cleanly via getErrorMessage');
    });
  });

  // =========================================================================
  // F6 — Interactive Ecosystem Focus Tour Modals (5 Tier 1 + 5 Tier 2)
  // =========================================================================

  describe('F6 Tier 1: Landing, CRM, Meta Report & ERP Focus Tours', () => {
    it('F6-T1.1: Landing pages include an interactive pre-signup Focus Tour (beyond static screenshot ProductInspectionModal)', () => {
      const home = stripTsComments(readText(path.join(LP_ROOT, 'src/DomationHome.tsx')));
      const dataLanding = stripTsComments(readText(path.join(LP_ROOT, 'src/DomationDataLanding.tsx')));

      const landingImports = [
        ...resolveImportedComponentPaths(home),
        ...resolveImportedComponentPaths(dataLanding),
      ];
      const tourFiles = landingImports.filter((p) =>
        /(?:FocusTour|SpotlightTour|Ecosystem.*Tour|TourModal)/i.test(path.basename(p))
      );

      const hasLandingTrigger =
        (/domation:open-focus-tour/.test(home) || /\?tour=ecosystem|tourParam/.test(home)) &&
        (/domation:open-focus-tour/.test(dataLanding) || /\?tour=ecosystem|tourParam/.test(dataLanding));
      const hasImportedTourComponent =
        tourFiles.length >= 1 &&
        (/SpotlightTour|FocusTour|EcosystemFocusTour|TourModal/i.test(home) ||
          /SpotlightTour|FocusTour|EcosystemFocusTour|TourModal/i.test(dataLanding));

      assert.ok(
        hasLandingTrigger && hasImportedTourComponent,
        'Landing pages (/ & /data) must integrate an interactive pre-signup Focus Tour modal component (not merely fallback to static ProductInspectionModal)'
      );

      const tourContent = tourFiles.map((f) => stripTsComments(readText(f))).join('\n');
      assert.ok(
        /aria-modal/.test(tourContent) && /role="dialog"/.test(tourContent),
        'Pre-signup Focus Tour modal must expose role="dialog" and aria-modal semantics'
      );
      assert.ok(
        /(?:Tiếp theo|Tiếp tục|Bỏ qua|onStepChange|steps\.map)/i.test(tourContent),
        'Pre-signup Focus Tour modal must expose multi-step navigation controls'
      );
    });

    it('F6-T1.2: AutoDataSpotlightTour & SCREEN_TOUR_DECKS provide step navigation, skip, finish & keyboard shortcuts', async () => {
      const tourSrc = readText(path.join(LP_ROOT, 'src/components/autodata/AutoDataHelpTour.tsx'));
      assert.ok(tourSrc.includes("e.key === 'Escape'"), 'Missing Escape handler');
      assert.ok(tourSrc.includes("e.key === 'ArrowRight'"), 'Missing ArrowRight handler');
      assert.ok(tourSrc.includes("e.key === 'ArrowLeft'"), 'Missing ArrowLeft handler');
      assert.ok(tourSrc.includes('onFinish'), 'Missing onFinish callback');
      assert.ok(tourSrc.includes('Bỏ qua tour'), 'Missing Skip Tour button');

      const { SCREEN_TOUR_DECKS } = await importTs('src/components/autodata/autoDataScreenTours.ts');
      assert.ok(Object.keys(SCREEN_TOUR_DECKS).length >= 20, 'Expected >= 20 screen tour decks in SCREEN_TOUR_DECKS');
    });

    it('F6-T1.3: AutodataClonedRoot persists tour completion via PATCH /auth/onboarding and supports header reopen trigger', () => {
      const rootSrc = readText(path.join(LP_ROOT, 'src/components/autodata/cloned/AutodataClonedRoot.tsx'));
      const headerSrc = readText(path.join(LP_ROOT, 'src/components/autodata/cloned/components/Layout/Header.tsx'));
      assert.ok(rootSrc.includes('/auth/onboarding') && rootSrc.includes('PATCH'), 'Missing PATCH /auth/onboarding persistence');
      assert.ok(rootSrc.includes('screen_tours'), 'Missing screen_tours payload');
      assert.ok(headerSrc.includes('Tour hướng dẫn màn hình hiện tại'), 'Missing header compass reopen trigger');
    });

    it('F6-T1.4: DomMetaReportWorkspace integrates DomMetaSpotlightTour on /meta-report with reopen trigger', () => {
      const ws = readText(path.join(LP_ROOT, 'src/components/dom-meta/DomMetaReportWorkspace.tsx'));
      assert.ok(
        /SpotlightTour|DomMetaSpotlightTour|FocusTour/i.test(ws),
        'DomMetaReportWorkspace.tsx must integrate an interactive DomMetaSpotlightTour for /meta-report'
      );
    });

    it('F6-T1.5: DOMATION_ERP_FULL includes interactive Focus Tour modal (beyond static renderHelpBanner)', () => {
      const erpSettings = readText(path.join(ERP_ROOT, 'src/pages/Settings.tsx'));
      const erpComponentsDir = path.join(ERP_ROOT, 'src/components');
      const hasErpTourFile =
        fileExists(path.join(erpComponentsDir, 'onboarding')) ||
        fs.readdirSync(erpComponentsDir, { recursive: true }).some((f) => /SpotlightTour|FocusTour/i.test(String(f)));

      assert.ok(
        hasErpTourFile || /SpotlightTour|FocusTour/i.test(erpSettings),
        'DOMATION_ERP_FULL must include an interactive Focus Tour / SpotlightTour component'
      );
    });
  });

  describe('F6 Tier 2: Responsive Viewport Clamping, Portal Safety & Deck Integrity', () => {
    it('F6-T2.1: AutoDataSpotlightTour clamps coachmark dimensions on both desktop (>=768) and mobile (<768)', () => {
      const tourSrc = stripTsComments(readText(path.join(LP_ROOT, 'src/components/autodata/AutoDataHelpTour.tsx')));
      assert.ok(/\b768\b/.test(tourSrc), 'Missing desktop breakpoint >= 768');
      assert.ok(
        /Math\.min\(\s*\d+\s*,\s*[a-zA-Z_$][\w.]*\s*-\s*\d+\s*\)/.test(tourSrc),
        'Missing mobile card width clamping against viewport width'
      );
      assert.ok(
        /Math\.max\([\s\S]{0,80}Math\.min\([\s\S]{0,80}-\s*[a-zA-Z_$][\w.]*\s*-\s*\d+/.test(tourSrc),
        'Missing horizontal viewport boundary clamping'
      );
    });

    it('F6-T2.2: AutoDataSpotlightTour clamps out-of-range activeStepIndex and portals with role="dialog" & aria-modal', () => {
      const tourSrc = readText(path.join(LP_ROOT, 'src/components/autodata/AutoDataHelpTour.tsx'));
      assert.ok(tourSrc.includes('createPortal('), 'Tour must portal to document.body');
      assert.ok(tourSrc.includes('role="dialog"') && tourSrc.includes('aria-modal="true"'), 'Missing dialog ARIA attributes');
      assert.ok(tourSrc.includes('Math.max(0, Math.min(steps.length - 1, activeStepIndex))'), 'Missing step index clamping');
    });

    it('F6-T2.3: AutoDataAuthModal syncs tour step changes with wizard steps and exposes reopen triggers', () => {
      const authSrc = readText(path.join(LP_ROOT, 'src/components/autodata/AutoDataAuthModal.tsx'));
      assert.ok(authSrc.includes('WIZARD_TOUR_STEPS'), 'Missing WIZARD_TOUR_STEPS');
      assert.ok(authSrc.includes('syncUiToTourStep'), 'Missing syncUiToTourStep wizard coupling');
      assert.ok(authSrc.includes('Tour hướng dẫn'), 'Missing reopen Tour hướng dẫn button');
      assert.ok(authSrc.includes('AutoDataHelpTrigger'), 'Missing contextual ? trigger');
    });

    it('F6-T2.4: All SCREEN_TOUR_DECKS entries have valid step fields and zero stale 90 ngày references', async () => {
      const { SCREEN_TOUR_DECKS } = await importTs('src/components/autodata/autoDataScreenTours.ts');
      for (const [screenKey, steps] of Object.entries(SCREEN_TOUR_DECKS)) {
        assert.ok(Array.isArray(steps) && steps.length >= 1, `Deck ${screenKey} must have >=1 step`);
        for (const step of steps) {
          assert.ok(step.id && step.target && step.title && step.description, `Deck ${screenKey} step incomplete`);
          assert.ok(Array.isArray(step.chips) && step.chips.length >= 1, `Deck ${screenKey} step ${step.id} missing chips`);
          assert.ok(
            !/90\s*ngày/i.test(step.description) && !/90\s*ngày/i.test(step.title),
            `Deck ${screenKey} step ${step.id} still mentions stale 90 ngày`
          );
        }
      }
    });

    it('F6-T2.5: ProductInspectionModal retains all 7 product gallery tabs, ERP filter pills & zoom dialog', () => {
      const pim = readText(path.join(LP_ROOT, 'src/components/ProductInspectionModal.tsx'));
      for (const tabId of ['data-capi', 'erp', 'crm', 'autoflow', 'meta-report', 'web-3d', 'inkica']) {
        assert.ok(pim.includes(`'${tabId}'`), `ProductInspectionModal missing tab ${tabId}`);
      }
      assert.ok(pim.includes('ImageZoomModal'), 'ProductInspectionModal missing zoom viewer');
      assert.ok(pim.includes('erpCategory'), 'ProductInspectionModal missing ERP category filter');
    });
  });
});
