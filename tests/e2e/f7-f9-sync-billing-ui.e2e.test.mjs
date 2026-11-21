import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

import {
  LP_ROOT,
  ERP_ROOT,
  fileExists,
  readText,
  compareFilesSha256,
  runSubprocess,
  verifyMyPortfolioInvariance,
  stripTsComments,
} from './helpers/frontend-e2e-harness.mjs';

function assertMetaAdsDailyReportDefaultOff(rawSrc, label) {
  const src = stripTsComments(rawSrc);
  assert.ok(src.includes('daily_report_include_meta_ads'), `${label} missing daily_report_include_meta_ads`);

  const stateMatch = src.match(
    /const\s+\[\s*(\w*(?:IncludeMetaAds|MetaAdsReport|ReportMetaAds)\w*)\s*,\s*(set\w+)\s*\]\s*=\s*useState(?:<boolean>)?\(\s*false\s*\)/i
  );
  assert.ok(
    stateMatch,
    `${label}: Meta Ads daily report toggle state must initialize strictly with useState(false)`
  );
  const [, stateVar, setterName] = stateMatch;

  assert.ok(
    new RegExp(`${setterName}\\([\\s\\S]{0,240}daily_report_include_meta_ads`).test(src),
    `${label}: ${setterName} must hydrate from daily_report_include_meta_ads`
  );
  assert.ok(
    !/daily_report_include_meta_ads\s*===\s*undefined\s*\?\s*true|daily_report_include_meta_ads[\s\S]{0,60}\?\?\s*true/.test(src),
    `${label}: daily_report_include_meta_ads hydration must NOT default undefined/null to true`
  );
  assert.ok(
    new RegExp(`daily_report_include_meta_ads\\s*:[\\s\\S]{0,60}\\b${stateVar}\\b`).test(src),
    `${label}: save settings payload must serialize daily_report_include_meta_ads from "${stateVar}"`
  );
  return { src, stateVar, setterName };
}

async function importTs(relPath) {
  return import(pathToFileURL(path.join(LP_ROOT, relPath)).href);
}

const SHARED_IDENTICAL_DOM_META_FILES = [
  'DomMetaCharts.tsx',
  'DomMetaLeadAttributionPanel.tsx',
  'DomMetaModals.tsx',
  'DomMetaQuickConnectModal.tsx',
  'DomMetaSelect.tsx',
  'domMetaTypes.ts',
  'GoogleAdsSetupGuide.tsx',
];

describe('F7 UI, F8 UI & F9: Synced Billing UI, Daily Report Meta Ads UI & Cross-Repo Guards', () => {
  // =========================================================================
  // F7 UI — Synced Plans, Topup & Billing Lifecycle UI (5 Tier 1 + 5 Tier 2)
  // =========================================================================

  describe('F7 UI Tier 1: Canonical Catalog Parity & Billing/Upgrade Controls', () => {
    it('F7-T1.1: DEFAULT_CLIENT_CATALOG matches canonical plans (1.5M/3M/6M, 20/85/9999 seats, 15k/100k/1M leads), -15% annual math & 4 topup packages', async () => {
      const { DEFAULT_CLIENT_CATALOG } = await importTs('src/components/autodata/autodataTypes.ts');
      assert.equal(DEFAULT_CLIENT_CATALOG.currency, 'VND');
      assert.equal(DEFAULT_CLIENT_CATALOG.annual_discount_pct, 15);

      const byCode = new Map(DEFAULT_CLIENT_CATALOG.plans.map((p) => [p.code, p]));
      const std = byCode.get('autodata_standard');
      const growth = byCode.get('autodata_growth');
      const erp = byCode.get('domation_crm_erp');

      assert.ok(std && growth && erp, 'Missing one of canonical plans in DEFAULT_CLIENT_CATALOG');

      assert.equal(std.monthly_price_vnd, 1_500_000);
      assert.equal(std.annual_total_vnd, 15_300_000);
      assert.equal(std.max_sales, 20);
      assert.equal(std.max_managers, 5);
      assert.equal(std.max_users, 25);
      assert.equal(std.monthly_lead_quota, 15_000);

      assert.equal(growth.monthly_price_vnd, 3_000_000);
      assert.equal(growth.annual_total_vnd, 30_600_000);
      assert.equal(growth.max_sales, 85);
      assert.equal(growth.max_managers, 15);
      assert.equal(growth.max_users, 100);
      assert.equal(growth.monthly_lead_quota, 100_000);

      assert.equal(erp.monthly_price_vnd, 6_000_000);
      assert.equal(erp.annual_total_vnd, 61_200_000);
      assert.equal(erp.max_users, 9_999);
      assert.equal(erp.monthly_lead_quota, 1_000_000);

      const topups = new Map(DEFAULT_CLIENT_CATALOG.topup_packages.map((t) => [t.id, t]));
      assert.equal(topups.size, 4);
      assert.equal(topups.get('topup_1m')?.amount_vnd, 1_500_000);
      assert.equal(topups.get('topup_3m')?.amount_vnd, 4_500_000);
      assert.equal(topups.get('topup_6m')?.amount_vnd, 9_000_000);
      assert.equal(topups.get('topup_6m')?.bonus_vnd, 450_000);
      assert.equal(topups.get('topup_12m')?.amount_vnd, 15_300_000);
    });

    it('F7-T1.2: DOMATION_SAAS_PLANS (enterpriseData.ts) aligns cleanly with Home #pricing and getHomeSeoConfig() offers', async () => {
      const { DOMATION_SAAS_PLANS } = await importTs('src/data/enterpriseData.ts');
      const { getHomeSeoConfig } = await importTs('src/data/coreRouteSeo.ts');
      const homeSrc = readText(path.join(LP_ROOT, 'src/DomationHome.tsx'));

      assert.ok(Array.isArray(DOMATION_SAAS_PLANS) && DOMATION_SAAS_PLANS.length >= 3);
      assert.ok(homeSrc.includes('DOMATION_SAAS_PLANS'), 'DomationHome.tsx must consume DOMATION_SAAS_PLANS');

      const homeSeo = getHomeSeoConfig();
      const offersText = JSON.stringify(homeSeo.jsonLd || []);
      for (const plan of DOMATION_SAAS_PLANS) {
        const numericMonthly = plan.monthly.replace(/[^\d]/g, '');
        if (numericMonthly.length >= 6) {
          assert.ok(
            offersText.includes(numericMonthly),
            `Home SEO JSON-LD offers drift for plan "${plan.name}" (${plan.monthly})`
          );
        }
      }
    });

    it('F7-T1.3: Zero stale 490k/690k or 250k/450k pricing drift across WorkspaceSettingsModal, DomationHome, DomationDataLanding, coreRouteSeo & llms.txt', () => {
      const strictNoMetaReportPriceFiles = [
        'src/components/dom-meta/DomMetaModals.tsx',
        'src/DomationHome.tsx',
        'src/DomationDataLanding.tsx',
      ];
      for (const rel of strictNoMetaReportPriceFiles) {
        const content = stripTsComments(readText(path.join(LP_ROOT, rel)));
        const contentWithoutTopupBonus = content.replace(/(?:Tặng\s*thêm\s*\+\s*|\+\s*)450[.,]000\s*₫?(?:\s*bonus|\s*\(=\s*9[.,]450[.,]000)?/gi, '');
        assert.ok(
          !/490[.,]000|690[.,]000|5[.,]880[.,]000/.test(content),
          `${rel} still contains stale Meta Report 490k/690k/5.88M pricing drift`
        );
        assert.ok(
          !/250[.,]000|450[.,]000|300[.,]000₫\/user|550[.,]000₫\/user|2[.,]990[.,]000|4[.,]990[.,]000/.test(contentWithoutTopupBonus),
          `${rel} still contains stale legacy 250k/450k/2.99M/4.99M pricing drift`
        );
      }

      const scopedMetaReportFiles = ['src/data/coreRouteSeo.ts', 'public/llms.txt'];
      for (const rel of scopedMetaReportFiles) {
        const raw = readText(path.join(LP_ROOT, rel));
        const content = rel.endsWith('.ts') ? stripTsComments(raw) : raw;
        const contentWithoutTopupBonus = content.replace(/(?:Tặng\s*thêm\s*\+\s*|\+\s*)450[.,]000\s*₫?(?:\s*bonus|\s*\(=\s*9[.,]450[.,]000)?/gi, '');
        assert.ok(
          !/250[.,]000|450[.,]000|300[.,]000₫\/user|550[.,]000₫\/user|2[.,]990[.,]000|4[.,]990[.,]000/.test(contentWithoutTopupBonus),
          `${rel} still contains banned legacy 250k/450k/2.99M/4.99M pricing drift`
        );
        for (const match of content.matchAll(/490[.,]000|690[.,]000|5[.,]880[.,]000/g)) {
          const idx = match.index ?? 0;
          const windowBefore = content.slice(Math.max(0, idx - 220), idx);
          const windowAround = content.slice(Math.max(0, idx - 220), Math.min(content.length, idx + 220));
          const scopedToMetaReport = /DOM\s*Meta\s*Report|Meta\s*Ad\s*Realtime\s*Report|\/meta-report/i.test(windowAround);
          const attachedToOtherProduct = /(?:Auto\s*Data|AutoData|CRM\s*360|ERP\s*5\.0|Marketing\s*Automation)[^.;\n]{0,40}$/i.test(windowBefore);
          assert.ok(
            scopedToMetaReport && !attachedToOtherProduct,
            `${rel}: 490k/690k/5.88M must only appear scoped to DOM Meta Report (/meta-report), found near "${windowAround.replace(/\s+/g, ' ').trim()}"`
          );
        }
      }
    });

    it('F7-T1.4: BillingView.tsx supports unified catalog, cancel/renew/auto-renew/downgrade controls & fixes fallback-to-25 quota bug', () => {
      const billing = readText(path.join(LP_ROOT, 'src/components/autodata/pages/BillingView.tsx'));
      assert.ok(billing.includes('/billing/overview') && billing.includes('/billing/topup') && billing.includes('/billing/subscribe'));
      assert.ok(billing.includes('/billing/cancel'), 'BillingView missing cancel subscription control');
      assert.ok(billing.includes('/billing/renew'), 'BillingView missing renew subscription control');
      assert.ok(billing.includes('/billing/auto-renew') || billing.includes('auto_renew'), 'BillingView missing auto_renew toggle');
      assert.ok(billing.includes('/billing/switch-package'), 'BillingView missing switch-package / downgrade flow');
      assert.ok(
        !/max_users\s*\?\?\s*25\b/.test(billing),
        'BillingView.tsx still contains fallback-to-25 max_users quota bug'
      );
    });

    it('F7-T1.5: ERP PackageUpgradePanel.tsx integrates unified billing catalog & switch-package / add-on lifecycle', () => {
      const erpPkg = readText(path.join(ERP_ROOT, 'src/components/Settings/PackageUpgradePanel.tsx'));
      assert.ok(
        erpPkg.includes('/api/v1/billing/catalog') || erpPkg.includes('monthly_price_vnd'),
        'ERP PackageUpgradePanel must consume unified /api/v1/billing/catalog prices & quotas'
      );
      assert.ok(erpPkg.includes('/api/v1/billing/switch-package'));
      assert.ok(erpPkg.includes('education_addon'));
    });
  });

  describe('F7 UI Tier 2: Math, Alias Formatting, Quotas & Edge Cases', () => {
    it('F7-T2.1: Every plan in DEFAULT_CLIENT_CATALOG satisfies exact -15% annual math', async () => {
      const { DEFAULT_CLIENT_CATALOG } = await importTs('src/components/autodata/autodataTypes.ts');
      for (const plan of DEFAULT_CLIENT_CATALOG.plans) {
        const expectedAnnual = Math.round(plan.monthly_price_vnd * 12 * (1 - plan.annual_discount_pct / 100));
        assert.equal(plan.annual_total_vnd, expectedAnnual, `${plan.code}: annual_total_vnd math mismatch`);
        assert.equal(
          plan.annual_monthly_equivalent_vnd,
          Math.round(plan.annual_total_vnd / 12),
          `${plan.code}: annual_monthly_equivalent_vnd mismatch`
        );
      }
    });

    it('F7-T2.2: DomationDataLanding.tsx renders catalog plan quotas dynamically without hardcoded 5/25 or 3/10 fallbacks', () => {
      const dataLanding = readText(path.join(LP_ROOT, 'src/DomationDataLanding.tsx'));
      assert.ok(dataLanding.includes('DEFAULT_CLIENT_CATALOG'));
      assert.ok(!/\?\s*5\s*:\s*25\b/.test(dataLanding) && !/\?\s*3\s*:\s*10\b/.test(dataLanding));
    });

    it('F7-T2.3: BillingView formatPlanDisplayName maps all canonical plan codes without leaking raw snake_case', async () => {
      const billing = readText(path.join(LP_ROOT, 'src/components/autodata/pages/BillingView.tsx'));
      for (const code of ['autodata_standard', 'autodata_growth', 'domation_crm_erp', 'starter', 'growth', 'enterprise', 'trial_1m']) {
        assert.ok(billing.includes(`${code}:`), `formatPlanDisplayName missing explicit mapping for "${code}"`);
      }
    });

    it('F7-T2.4: BillingView supports custom topup bounds (min_topup_vnd) and payment gateway metadata', () => {
      const billing = readText(path.join(LP_ROOT, 'src/components/autodata/pages/BillingView.tsx'));
      assert.ok(
        /min_topup_vnd|customAmount|custom_amount/i.test(billing),
        'BillingView must support custom topup amount bounded by min_topup_vnd'
      );
      assert.ok(billing.includes('payment_bank_info') || billing.includes('reference_code'));
    });

    it('F7-T2.5: CrmUpgradeShowcaseModal pricing tab references unified catalog prices (1.5M / 3.0M / 6.0M)', () => {
      const modals = stripTsComments(readText(path.join(LP_ROOT, 'src/components/dom-meta/DomMetaModals.tsx')));
      const startIdx = modals.indexOf('const FALLBACK_CRM_PLANS');
      const modalIdx = modals.indexOf('data-testid="crm-upgrade-showcase-modal"');
      assert.ok(startIdx !== -1 && modalIdx !== -1, 'Missing CrmUpgradeShowcaseModal in DomMetaModals.tsx');
      const showcaseSlice = modals.slice(startIdx, Math.min(modals.length, modalIdx + 25_000));

      assert.ok(showcaseSlice.includes('data-testid="crm-upgrade-tab-pricing"'), 'Missing pricing tab inside CrmUpgradeShowcaseModal');
      assert.ok(
        showcaseSlice.includes('plans.map') &&
          showcaseSlice.includes('monthly_price_vnd') &&
          showcaseSlice.includes('annual_monthly_equivalent_vnd'),
        'CrmUpgradeShowcaseModal must render plans.map using monthly_price_vnd / annual_monthly_equivalent_vnd'
      );
      assert.ok(showcaseSlice.includes('1_500_000') || showcaseSlice.includes('1.500.000'));
      assert.ok(showcaseSlice.includes('3_000_000') || showcaseSlice.includes('3.000.000'));
      assert.ok(showcaseSlice.includes('6_000_000') || showcaseSlice.includes('6.000.000'));
    });
  });

  // =========================================================================
  // F8 UI — Daily Report Meta Ads Toggle UI (5 Tier 1 + 5 Tier 2)
  // =========================================================================

  describe('F8 UI Tier 1: CRM & ERP Daily Report Meta Ads Default-OFF Settings UI', () => {
    it('F8-T1.1: CRM Settings.tsx (report tab) exposes daily_report_include_meta_ads toggle default OFF (false)', () => {
      const crmSettings = readText(path.join(LP_ROOT, 'src/components/autodata/cloned/pages/Settings.tsx'));
      assertMetaAdsDailyReportDefaultOff(crmSettings, 'CRM Settings.tsx');
    });

    it('F8-T1.2: ERP Settings.tsx (automated_reports tab) exposes daily_report_include_meta_ads toggle default OFF (false)', () => {
      const erpSettings = readText(path.join(ERP_ROOT, 'src/pages/Settings.tsx'));
      assertMetaAdsDailyReportDefaultOff(erpSettings, 'ERP Settings.tsx');
    });

    it('F8-T1.3: CRM & ERP Settings expose selectable Meta Ads metrics & multi-channel toggles (zalo, telegram, email, discord)', () => {
      const crmSettings = readText(path.join(LP_ROOT, 'src/components/autodata/cloned/pages/Settings.tsx'));
      const erpSettings = readText(path.join(ERP_ROOT, 'src/pages/Settings.tsx'));

      for (const [label, src] of [
        ['CRM Settings.tsx', crmSettings],
        ['ERP Settings.tsx', erpSettings],
      ]) {
        assert.ok(src.includes('daily_report_meta_ads_metrics'), `${label} missing daily_report_meta_ads_metrics`);
        for (const metric of ['results', 'leads', 'messages', 'reach', 'spend', 'peak_hours']) {
          assert.ok(src.includes(metric), `${label} missing Meta Ads metric "${metric}"`);
        }
        assert.ok(src.includes('daily_report_channels'), `${label} missing daily_report_channels`);
        for (const ch of ['zalo', 'telegram', 'email', 'discord']) {
          assert.ok(src.includes(ch), `${label} missing channel "${ch}"`);
        }
      }
    });

    it('F8-T1.4: CRM & ERP Settings expose optional daily_report_meta_account_ids filter & save in settings payload', () => {
      const crmSettings = readText(path.join(LP_ROOT, 'src/components/autodata/cloned/pages/Settings.tsx'));
      const erpSettings = readText(path.join(ERP_ROOT, 'src/pages/Settings.tsx'));
      assert.ok(crmSettings.includes('daily_report_meta_account_ids'), 'CRM Settings missing daily_report_meta_account_ids');
      assert.ok(erpSettings.includes('daily_report_meta_account_ids'), 'ERP Settings missing daily_report_meta_account_ids');
    });

    it('F8-T1.5: CRM & ERP Settings preserve daily_report_admins as string UUIDs (NO Number(admin.id) NaN coercion)', () => {
      const crmSettings = readText(path.join(LP_ROOT, 'src/components/autodata/cloned/pages/Settings.tsx'));
      const erpSettings = readText(path.join(ERP_ROOT, 'src/pages/Settings.tsx'));

      assert.ok(
        !/setDailyReportAdmins[\s\S]{0,180}Number\(\s*admin\.id\s*\)/.test(crmSettings),
        'CRM Settings still coerces daily_report_admins admin.id via Number() (breaks UUID strings with NaN!)'
      );
      assert.ok(
        !/setDailyReportAdmins[\s\S]{0,180}Number\(\s*admin\.id\s*\)/.test(erpSettings) &&
          !/dailyReportAdmins\.includes\(\s*Number\(\s*admin\.id\s*\)\s*\)/.test(erpSettings),
        'ERP Settings still coerces daily_report_admins admin.id via Number() (breaks UUID strings with NaN!)'
      );
    });
  });

  describe('F8 UI Tier 2: Report Toggle Boundaries & Safe Fallbacks', () => {
    it('F8-T2.1: CRM & ERP Meta metrics/accounts UI conditionally reflects daily_report_include_meta_ads ON/OFF state', () => {
      const crmSettings = readText(path.join(LP_ROOT, 'src/components/autodata/cloned/pages/Settings.tsx'));
      const erpSettings = readText(path.join(ERP_ROOT, 'src/pages/Settings.tsx'));

      for (const [label, rawSrc] of [
        ['CRM Settings.tsx', crmSettings],
        ['ERP Settings.tsx', erpSettings],
      ]) {
        const { src, stateVar } = assertMetaAdsDailyReportDefaultOff(rawSrc, label);
        const gatingRe = new RegExp(
          `(?:\\{${stateVar}\\s*&&|disabled=\\{!${stateVar}\\}|${stateVar}\\s*\\?)[\\s\\S]{0,1200}(?:metrics|account|results|leads|messages|reach|spend|peak_hours|daily_report_meta)`,
          'i'
        );
        assert.ok(
          gatingRe.test(src),
          `${label}: metrics/account selector UI must be conditionally gated by "${stateVar}"`
        );
      }
    });

    it('F8-T2.2: CRM Settings ticketNotifyAdmins also preserves string UUIDs without Number(admin.id) NaN coercion', () => {
      const crmSettings = readText(path.join(LP_ROOT, 'src/components/autodata/cloned/pages/Settings.tsx'));
      assert.ok(
        !/setTicketNotifyAdmins[\s\S]{0,180}Number\(\s*admin\.id\s*\)/.test(crmSettings),
        'CRM Settings still coerces ticket_notify_admins admin.id via Number()'
      );
    });

    it('F8-T2.3: Empty daily_report_meta_account_ids safely defaults to all active accounts in BOTH CRM & ERP', () => {
      const crmSettings = readText(path.join(LP_ROOT, 'src/components/autodata/cloned/pages/Settings.tsx'));
      const erpSettings = readText(path.join(ERP_ROOT, 'src/pages/Settings.tsx'));

      for (const [label, rawSrc] of [
        ['CRM Settings.tsx', crmSettings],
        ['ERP Settings.tsx', erpSettings],
      ]) {
        const src = stripTsComments(rawSrc);
        const accStateMatch = src.match(
          /const\s+\[\s*(\w*MetaAccountIds\w*)\s*,\s*(set\w+)\s*\]\s*=\s*useState(?:<[^>]+>)?\(\s*\[\s*\]\s*\)/i
        );
        assert.ok(accStateMatch, `${label}: daily_report_meta_account_ids state must initialize to []`);
        const [, accVar] = accStateMatch;
        assert.ok(
          new RegExp(`daily_report_meta_account_ids[\\s\\S]{0,200}${accVar}|${accVar}[\\s\\S]{0,200}daily_report_meta_account_ids`).test(src),
          `${label}: must hydrate and save daily_report_meta_account_ids`
        );
        assert.ok(
          new RegExp(`${accVar}\\.length\\s*===\\s*0[\\s\\S]{0,200}(?:tất cả|all)`, 'i').test(src) ||
            /(?:để trống|không chọn)[\s\S]{0,120}(?:tất cả|all)/i.test(src),
          `${label}: must render safe all-accounts fallback notice when daily_report_meta_account_ids is []`
        );
      }
    });

    it('F8-T2.4: Empty daily_report_admins shows fallback notice ("tất cả tài khoản Admin") in both CRM & ERP', () => {
      const crmSettings = readText(path.join(LP_ROOT, 'src/components/autodata/cloned/pages/Settings.tsx'));
      const erpSettings = readText(path.join(ERP_ROOT, 'src/pages/Settings.tsx'));
      assert.ok(crmSettings.includes('tất cả tài khoản Admin'));
      assert.ok(erpSettings.includes('tất cả tài khoản Admin'));
    });

    it('F8-T2.5: ERP NotificationSettingsModal preserves per-user channel toggles (zalo, telegram, email)', () => {
      const notifModal = readText(path.join(ERP_ROOT, 'src/components/ui/NotificationSettingsModal.tsx'));
      assert.ok(notifModal.includes('zalo') && notifModal.includes('telegram') && notifModal.includes('email'));
    });
  });

  // =========================================================================
  // F9 — Cross-Repo Sync, Shared AI Key, /ecolifesignature, Stability & MY_PORTFOLIO (6 Tier 1 + 6 Tier 2)
  // =========================================================================

  describe('F9 Tier 1: Cross-Repo Parity, AI Toggles, /ecolifesignature, Resilience & Portfolio Guard', () => {
    it('F9-T1.1: Byte-identical SHA-256 parity across LP & ERP for all 7 shared src/components/dom-meta/* files', () => {
      for (const fileName of SHARED_IDENTICAL_DOM_META_FILES) {
        const lpFile = path.join(LP_ROOT, 'src/components/dom-meta', fileName);
        const erpFile = path.join(ERP_ROOT, 'src/components/dom-meta', fileName);
        assert.equal(fileExists(lpFile), true, `Missing LP file ${lpFile}`);
        assert.equal(fileExists(erpFile), true, `Missing ERP file ${erpFile}`);

        const cmp = compareFilesSha256(lpFile, erpFile, { normalizeLf: false });
        assert.equal(
          cmp.equal,
          true,
          `SHA-256 mismatch for shared file ${fileName} (LP=${cmp.hashA} vs ERP=${cmp.hashB})`
        );
      }
    });

    it('F9-T1.2: DomMetaReportWorkspace.tsx uses <DomationLogoMark /> in BOTH LP and ERP (no domation_ai_icon.svg fallback)', () => {
      const lpWs = readText(path.join(LP_ROOT, 'src/components/dom-meta/DomMetaReportWorkspace.tsx'));
      const erpWs = readText(path.join(ERP_ROOT, 'src/components/dom-meta/DomMetaReportWorkspace.tsx'));

      assert.ok(lpWs.includes('<DomationLogoMark'), 'LP DomMetaReportWorkspace missing <DomationLogoMark');
      assert.ok(erpWs.includes('<DomationLogoMark'), 'ERP DomMetaReportWorkspace missing <DomationLogoMark');
      assert.ok(!lpWs.includes('domation_ai_icon.svg'), 'LP DomMetaReportWorkspace still references domation_ai_icon.svg');
      assert.ok(!erpWs.includes('domation_ai_icon.svg'), 'ERP DomMetaReportWorkspace still falls back to domation_ai_icon.svg');
    });

    it('F9-T1.3: Shared AI Key toggles (ai_lead_eval_enabled, ai_ads_eval_enabled default true) wired in CRM, DomMeta & ERP Settings', () => {
      const crmSettings = stripTsComments(readText(path.join(LP_ROOT, 'src/components/autodata/cloned/pages/Settings.tsx')));
      const erpSettings = stripTsComments(readText(path.join(ERP_ROOT, 'src/pages/Settings.tsx')));
      const lpTypes = stripTsComments(readText(path.join(LP_ROOT, 'src/components/dom-meta/domMetaTypes.ts')));
      const domMetaApi = stripTsComments(readText(path.join(LP_ROOT, 'src/components/dom-meta/domMetaApi.ts')));

      assert.ok(lpTypes.includes('ai_lead_eval_enabled') && lpTypes.includes('ai_ads_eval_enabled'));
      assert.ok(
        /ai_lead_eval_enabled:\s*true/.test(domMetaApi) && /ai_ads_eval_enabled:\s*true/.test(domMetaApi),
        'domMetaApi.ts createEmptyWorkspaceConfig() must default ai_lead_eval_enabled and ai_ads_eval_enabled to true'
      );

      for (const [label, src] of [
        ['CRM Settings.tsx', crmSettings],
        ['ERP Settings.tsx', erpSettings],
      ]) {
        assert.ok(
          src.includes('ai_lead_eval_enabled') && src.includes('ai_ads_eval_enabled'),
          `${label} must wire ai_lead_eval_enabled & ai_ads_eval_enabled toggles`
        );
        const leadState = src.match(
          /const\s+\[\s*(\w*LeadEval\w*)\s*,\s*(set\w+)\s*\]\s*=\s*useState(?:<boolean>)?\(\s*true\s*\)/i
        );
        const adsState = src.match(
          /const\s+\[\s*(\w*AdsEval\w*)\s*,\s*(set\w+)\s*\]\s*=\s*useState(?:<boolean>)?\(\s*true\s*\)/i
        );
        assert.ok(leadState && adsState, `${label} must initialize aiLeadEvalEnabled and aiAdsEvalEnabled to useState(true)`);
        assert.ok(
          /ai_lead_eval_enabled\s*===\s*undefined\s*\?\s*true|ai_lead_eval_enabled\s*!==\s*['"]?0['"]?[\s\S]{0,40}!==\s*false/.test(src) &&
            /ai_ads_eval_enabled\s*===\s*undefined\s*\?\s*true|ai_ads_eval_enabled\s*!==\s*['"]?0['"]?[\s\S]{0,40}!==\s*false/.test(src),
          `${label} must preserve true default when ai_lead_eval_enabled / ai_ads_eval_enabled is undefined`
        );
      }
    });

    it('F9-T1.4: /meta-report/ecolifesignature public viewer access & google_ads loading preserved', () => {
      const metaReport = readText(path.join(LP_ROOT, 'src/MetaAdReport.tsx'));
      const domMetaApi = readText(path.join(LP_ROOT, 'src/components/dom-meta/domMetaApi.ts'));
      const mainTsx = readText(path.join(LP_ROOT, 'src/main.tsx'));

      assert.ok(mainTsx.includes("path.startsWith('/meta-report/')"));
      assert.ok(metaReport.includes('resolvePublicDomMetaAccess') && metaReport.includes('toPublicViewerSession'));
      assert.ok(domMetaApi.includes('tryRecoverDomMetaSession') && domMetaApi.includes('dom-meta-public-fallback'));
      assert.ok(metaReport.includes('google_ads') || domMetaApi.includes('google_ads'), 'Missing google_ads workspace support');
    });

    it('F9-T1.5: ErrorBoundary wraps MetaAdReport/DomMetaReportWorkspace & LP root routes + vite.config.ts configures manualChunks', () => {
      const mainTsx = readText(path.join(LP_ROOT, 'src/main.tsx'));
      const metaReport = readText(path.join(LP_ROOT, 'src/MetaAdReport.tsx'));
      const viteCfg = readText(path.join(LP_ROOT, 'vite.config.ts'));

      assert.ok(mainTsx.includes('ErrorBoundary'), 'src/main.tsx must wrap routes with ErrorBoundary');
      assert.ok(metaReport.includes('ErrorBoundary'), 'src/MetaAdReport.tsx must wrap workspace with ErrorBoundary');
      assert.ok(viteCfg.includes('manualChunks'), 'vite.config.ts must configure manualChunks for bundle chunk splitting');
    });

    it('F9-T1.6: MY_PORTFOLIO invariance guard — zero unauthorized changes vs my-portfolio-baseline.json', () => {
      const result = verifyMyPortfolioInvariance();
      assert.equal(
        result.ok,
        true,
        `MY_PORTFOLIO modified unexpectedly! head=${result.currentHead}, unexpected=${JSON.stringify(
          result.unexpectedPorcelain
        )}, missing=${JSON.stringify(result.missingPorcelain)}, diffSha=${result.currentDiffSha256}`
      );
    });
  });

  describe('F9 Tier 2: Sync Boundaries, Typecheck, Viewer Mode & Chunk Safety', () => {
    it('F9-T2.1: DomMetaReportWorkspace & AiSummaryModal honor ai_ads_eval_enabled === false gate', () => {
      const lpWs = readText(path.join(LP_ROOT, 'src/components/dom-meta/DomMetaReportWorkspace.tsx'));
      assert.ok(
        lpWs.includes('ai_ads_eval_enabled'),
        'DomMetaReportWorkspace.tsx must honor config.ai_config?.ai_ads_eval_enabled toggle'
      );
    });

    it('F9-T2.2: domMetaApi.ts intentional divergence — LP preserves standalone tryRecoverDomMetaSession while sharing Graph v25.0 types', () => {
      const lpApi = readText(path.join(LP_ROOT, 'src/components/dom-meta/domMetaApi.ts'));
      const erpApi = readText(path.join(ERP_ROOT, 'src/components/dom-meta/domMetaApi.ts'));
      assert.ok(lpApi.includes('tryRecoverDomMetaSession'));
      assert.ok(lpApi.includes('DomMetaSharedAiConfig') && erpApi.includes('DomMetaSharedAiConfig'));
    });

    it('F9-T2.3: DomMetaAuthModal.tsx remains LP-only and public viewer enforces role === viewer read-only mode', () => {
      assert.equal(fileExists(path.join(LP_ROOT, 'src/components/dom-meta/DomMetaAuthModal.tsx')), true);
      assert.equal(fileExists(path.join(ERP_ROOT, 'src/components/dom-meta/DomMetaAuthModal.tsx')), false);
      const metaReport = readText(path.join(LP_ROOT, 'src/MetaAdReport.tsx'));
      assert.ok(metaReport.includes("role: 'viewer'"));
    });

    it('F9-T2.4: vite.config.ts preserves both main and crm HTML inputs alongside manualChunks', () => {
      const viteCfg = readText(path.join(LP_ROOT, 'vite.config.ts'));
      assert.ok(viteCfg.includes("'index.html'") && viteCfg.includes("'crm/index.html'"));
      assert.ok(viteCfg.includes('manualChunks'));
    });

    it('F9-T2.5: tsc -b --noEmit passes with exit code 0 in DOMATION_LANDINGPAGE', async () => {
      const tscScript = path.join(LP_ROOT, 'node_modules/typescript/bin/tsc');
      const res = await runSubprocess(process.execPath, [tscScript, '-b', '--noEmit'], { cwd: LP_ROOT, timeoutMs: 60_000 });
      assert.equal(
        res.exitCode,
        0,
        `tsc -b --noEmit failed (exit ${res.exitCode}):\n${res.stdout}\n${res.stderr}`
      );
    });

    it('F9-T2.6: MY_PORTFOLIO contains zero DOMATION test artifacts or accidental cross-repo writes', () => {
      const result = verifyMyPortfolioInvariance();
      assert.equal(result.unexpectedPorcelain.length, 0, `Unexpected files in MY_PORTFOLIO: ${result.unexpectedPorcelain.join(', ')}`);
    });
  });
});
