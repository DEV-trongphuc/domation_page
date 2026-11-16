export interface ClientBillingPlan {
  code: string;
  step_order: number;
  name: string;
  tagline: string;
  badge?: string;
  plan_tier: 'starter' | 'growth' | 'enterprise';
  monthly_price_vnd: number;
  annual_discount_pct: number;
  annual_total_vnd: number;
  annual_monthly_equivalent_vnd: number;
  annual_saved_vnd: number;
  max_sales?: number;
  max_managers?: number;
  max_users: number;
  max_rounds: number;
  monthly_lead_quota: number;
  is_enterprise_upgrade?: boolean;
  features: string[];
}

export interface ClientTopupPackage {
  id: string;
  label: string;
  amount_vnd: number;
  bonus_vnd: number;
  equivalent_months_note: string;
  highlight?: boolean;
}

export interface ClientBillingCatalog {
  currency: string;
  trial_duration_months: number;
  trial_duration_days: number;
  trial_warning_days: number;
  base_monthly_price_vnd: number;
  annual_discount_pct: number;
  min_topup_vnd: number;
  post_trial_policy: 'step_renewal_or_upgrade' | 'strict_lock';
  automation_upgrade_url?: string;
  crm_upgrade_url: string;
  erp_upgrade_url: string;
  payment_bank_info: {
    bank_name: string;
    account_number: string;
    account_holder: string;
    transfer_prefix: string;
  };
  plans: ClientBillingPlan[];
  topup_packages: ClientTopupPackage[];
}

export interface ClientSubscriptionSnapshot {
  plan_code: string;
  plan_name: string;
  plan_tier: 'starter' | 'growth' | 'enterprise';
  billing_cycle: string;
  is_in_trial: boolean;
  trial_duration_months: number;
  trial_duration_days: number;
  trial_started_at: string;
  trial_ends_at: string;
  subscription_expires_at: string | null;
  effective_expires_at: string;
  days_remaining: number;
  hours_remaining: number;
  is_expired: boolean;
  is_expiring_soon: boolean;
  wallet_balance_vnd: number;
  crm_erp_upgrade_status: string;
  recommended_next_action: 'enjoy_trial' | 'renew_step_plan' | 'upgrade_crm_erp';
}

export interface ClientBillingTransaction {
  id: string;
  tx_type: string;
  plan_code: string | null;
  billing_cycle: string;
  months_added: number;
  amount_vnd: number;
  discount_pct: number;
  payment_method: string;
  status: string;
  reference_code: string;
  note: string;
  created_at: string;
}

export interface ZaloBotSavedState {
  verified: boolean;
  verification_mode: 'live_zalo_api' | 'sandbox_bridge_verified';
  bot_name: string;
  chat_id: string;
  verified_at: string;
}

export interface ZaloVerifyResult {
  verified: boolean;
  verification_mode: 'live_zalo_api' | 'sandbox_bridge_verified';
  bot_name: string;
  chat_id: string;
  message_sent: boolean;
  preview_message: string;
  latency_ms: number;
}

export interface PersonalSaleLeadItem {
  id: string;
  name: string;
  phone: string;
  sale_owner_name: string;
  product_interest: string;
  note: string;
  sheet_sync_status: string;
  bypass_round_robin: boolean;
  quota_impact: number;
  sla_recall_exempt: boolean;
  created_at: string;
}

export interface WorkspaceSummaryItem {
  slug: string;
  company_name: string;
  industry: string;
  plan_tier: 'starter' | 'growth' | 'enterprise';
  plan_name: string;
  role: string;
  days_remaining: number;
  is_in_trial: boolean;
  is_expired: boolean;
  is_external_agency?: boolean;
  selected_channels?: string[];
  created_at?: string;
}

export interface AuthenticatedAccountUser {
  email: string;
  full_name: string;
  avatar_url?: string | null;
  auth_provider: 'password' | 'google';
}

export interface ClientSessionState {
  access_token: string;
  tenant_slug: string;
  company_name: string;
  admin_email: string;
  user_name?: string;
  auth_provider?: 'password' | 'google';
  webhook_url: string;
  webhook_token: string;
  is_external_agency?: boolean;
  zalo_bot?: ZaloBotSavedState | null;
  bridge_mode: 'upstream_rls_postgres' | 'vercel_serverless_engine';
  upstream_app_url: string | null;
  subscription: ClientSubscriptionSnapshot;
  workspaces?: WorkspaceSummaryItem[];
}

export type SetupModalIntent =
  | 'register'
  | 'login'
  | 'workspace_router'
  | 'workspace_sale_port'
  | 'workspace_zalo'
  | 'workspace_billing'
  | 'workspace_crm_erp';

export type HelpTopicKey =
  | 'apps_script'
  | 'round_robin_formula'
  | 'dedupe_90d'
  | 'sla_recall'
  | 'meta_capi'
  | 'zalobot_chatid'
  | 'billing_3m_900k'
  | 'internal_sale_default'
  | 'sale_port_personal';

export type LegalDocTab = 'terms' | 'privacy';

export interface CookieConsentPreferences {
  essential: true;
  analytics: boolean;
  marketing: boolean;
  updated_at: string;
}

export const COOKIE_CONSENT_STORAGE_KEY = 'domation_cookie_consent_v1';

export interface PersonalLeadImportDraft {
  name: string;
  phone: string;
  sale_owner_name?: string;
  product_interest?: string;
  note?: string;
}

export function buildGoogleAppsScriptSnippet(webhookUrl?: string, saleEmail?: string): string {
  const targetUrl =
    webhookUrl && webhookUrl.trim().length > 0
      ? webhookUrl.trim()
      : 'https://domation.net/api/autodata?action=webhook-test&slug=ten-cong-ty&token=whsec_xxx';
  const ownerHint = saleEmail && saleEmail.trim().length > 0 ? saleEmail.trim() : 'sale01@doanhnghiep.vn';
  const safeUrlLiteral = JSON.stringify(targetUrl);
  const safeOwnerLiteral = JSON.stringify(ownerHint);

  return `/**
 * DOMATION Auto Data — Google Apps Script Đồng Bộ 2 Chiều (Auto Data <-> Google Sheet Riêng Từng Sale)
 * Hướng dẫn: Mở Google Sheet -> Tiện ích mở rộng -> Apps Script -> Dán mã -> Triển khai Web App (doPost) & Cài Trigger onEdit / onFormSubmit
 */
const DOMATION_WEBHOOK_URL = ${safeUrlLiteral};
const SALE_OWNER_EMAIL = ${safeOwnerLiteral};

// Chiều 1 (Auto Data -> Sheet riêng của Sale): Nhận Lead mới từ Auto Data và tự động ghi/cập nhật dòng trên Google Sheet
function doPost(e) {
  const body = e && e.postData && e.postData.contents ? JSON.parse(e.postData.contents) : {};
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];
  sheet.appendRow([
    new Date(),
    body.name || 'Khách hàng mới',
    String(body.phone || '').trim(),
    body.utm_source || 'autodata_router',
    body.product_interest || 'Tư vấn trực tiếp',
    body.sale_status || 'Mới phân bổ',
    body.note || ''
  ]);
  return ContentService.createTextOutput(JSON.stringify({ ok: true })).setMimeType(ContentService.MimeType.JSON);
}

// Chiều 2A (Google Form / Sheet -> Auto Data): Tự động bắn dòng Lead mới vào Auto Data Router (< 4s)
function onFormSubmit(e) {
  const row = e && e.values ? e.values : [];
  const payload = {
    name: row[1] || 'Khách hàng Google Sheet',
    phone: String(row[2] || '').trim(),
    utm_source: row[3] || 'google_sheets',
    product_interest: row[4] || 'Tư vấn trực tiếp',
    sale_owner_email: SALE_OWNER_EMAIL
  };
  UrlFetchApp.fetch(DOMATION_WEBHOOK_URL, {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  });
}

// Chiều 2B (Sheet riêng của Sale -> Auto Data): Khi Sale sửa Trạng thái (Cột F) hoặc Ghi chú (Cột G) -> Đồng bộ ngược & kích hoạt Meta CAPI
function onEdit(e) {
  if (!e || !e.range) return;
  const col = e.range.getColumn();
  if (col !== 6 && col !== 7) return; // Chỉ đồng bộ khi sửa cột Trạng thái hoặc Ghi chú
  const sheet = e.range.getSheet();
  const r = e.range.getRow();
  if (r <= 1) return;
  const syncPayload = {
    sync_direction: 'sheet_to_autodata',
    phone: String(sheet.getRange(r, 3).getValue() || '').trim(),
    sale_status: String(sheet.getRange(r, 6).getValue() || '').trim(),
    sale_note: String(sheet.getRange(r, 7).getValue() || '').trim(),
    sale_owner_email: SALE_OWNER_EMAIL
  };
  UrlFetchApp.fetch(DOMATION_WEBHOOK_URL, {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify(syncPayload),
    muteHttpExceptions: true
  });
}`;
}

function sanitizeCsvFormulaValue(raw: string, isPhoneColumn = false): string {
  const str = String(raw ?? '');
  if (isPhoneColumn) {
    const trimmed = str.trim();
    if (/^\+84\d+/.test(trimmed.replace(/\s+/g, ''))) {
      return `0${trimmed.replace(/\s+/g, '').slice(3)}`;
    }
    if (/^[=+\-@]/.test(trimmed)) {
      return `'${trimmed}`;
    }
    return trimmed;
  }
  if (/^[=+\-@\t\r]/.test(str)) {
    return `'${str}`;
  }
  return str;
}

export function buildPersonalLeadsCsvContent(items: PersonalSaleLeadItem[]): string {
  const header = [
    'Mã Lead',
    'Họ tên khách hàng',
    'Số điện thoại',
    'Sale sở hữu',
    'Nhu cầu quan tâm',
    'Ghi chú cá nhân',
    'Chế độ định tuyến',
    'Đồng bộ Google Sheets',
    'Thời gian tạo',
  ];
  const escapeCell = (val: string, isPhone = false) =>
    `"${sanitizeCsvFormulaValue(val, isPhone).replace(/"/g, '""')}"`;
  const rows = items.map((item) => [
    item.id,
    item.name,
    item.phone,
    item.sale_owner_name,
    item.product_interest,
    item.note,
    'Cá nhân (Bỏ qua Vòng Chia • Sở hữu riêng)',
    item.sheet_sync_status,
    new Date(item.created_at).toLocaleString('vi-VN'),
  ]);
  const lines = [
    header.map((h) => escapeCell(h, false)).join(','),
    ...rows.map((row) => row.map((cell, colIdx) => escapeCell(cell, colIdx === 2)).join(',')),
  ];
  return `\uFEFF${lines.join('\r\n')}`;
}

function splitCsvRow(line: string, delimiter: string): string[] {
  const cells: string[] = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        cur += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === delimiter && !inQuotes) {
      cells.push(cur.trim().replace(/^'+/, ''));
      cur = '';
    } else {
      cur += ch;
    }
  }
  cells.push(cur.trim().replace(/^'+/, ''));
  return cells;
}

export function parsePersonalLeadsCsvContent(
  rawCsv: string,
  defaultOwner = 'Chuyên viên Sale Nội Bộ #01'
): PersonalLeadImportDraft[] {
  const cleaned = rawCsv.replace(/^\uFEFF/, '').trim();
  if (!cleaned) return [];
  const rawLines = cleaned
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);
  if (rawLines.length === 0) return [];

  const firstLine = rawLines[0];
  const delimiter =
    firstLine.includes('\t') && !firstLine.includes(',')
      ? '\t'
      : firstLine.split(';').length > firstLine.split(',').length
        ? ';'
        : ',';

  const parsedRows = rawLines.map((line) => splitCsvRow(line, delimiter));
  const headerProbe = parsedRows[0].map((c) => c.toLowerCase());
  const hasHeader = headerProbe.some(
    (c) =>
      c.includes('họ tên') ||
      c.includes('số điện thoại') ||
      c.includes('mã lead') ||
      c === 'name' ||
      c === 'phone' ||
      c === 'sdt'
  );

  const dataRows = hasHeader ? parsedRows.slice(1) : parsedRows;
  const isExportFormat =
    hasHeader &&
    (headerProbe[0]?.includes('mã lead') || headerProbe[0] === 'id') &&
    parsedRows[0].length >= 5;

  const results: PersonalLeadImportDraft[] = [];
  for (const cols of dataRows) {
    if (cols.length < 2) continue;
    const name = isExportFormat ? cols[1] || '' : cols[0] || '';
    const phone = isExportFormat ? cols[2] || '' : cols[1] || '';
    const owner = isExportFormat ? cols[3] || defaultOwner : cols[4] || defaultOwner;
    const interest = isExportFormat
      ? cols[4] || 'Khách hàng Import CSV cá nhân'
      : cols[2] || 'Khách hàng Import CSV cá nhân';
    const note = isExportFormat
      ? cols[5] || 'Import từ file CSV vào Cổng Sale Cá Nhân'
      : cols[3] || 'Import từ file CSV vào Cổng Sale Cá Nhân';

    if (name.trim() && phone.replace(/\D/g, '').length >= 9) {
      results.push({
        name: name.trim(),
        phone: phone.trim(),
        sale_owner_name: owner.trim() || defaultOwner,
        product_interest: interest.trim(),
        note: note.trim(),
      });
    }
  }
  return results;
}

export const DEFAULT_CLIENT_CATALOG: ClientBillingCatalog = {
  currency: 'VND',
  trial_duration_months: 1,
  trial_duration_days: 30,
  trial_warning_days: 14,
  base_monthly_price_vnd: 1_500_000,
  annual_discount_pct: 15,
  min_topup_vnd: 100_000,
  post_trial_policy: 'step_renewal_or_upgrade',
  automation_upgrade_url: '/automation',
  crm_upgrade_url: '/crm',
  erp_upgrade_url: '/erp',
  payment_bank_info: {
    bank_name: 'Techcombank (TCB)',
    account_number: '19038889996868',
    account_holder: 'CONG TY TNHH DOM MARKETING',
    transfer_prefix: 'DOMDATA',
  },
  plans: [
    {
      code: 'autodata_standard',
      step_order: 1,
      name: 'Auto Data Standard',
      tagline: 'Gói tiêu chuẩn cho đội Sale nội bộ — Mặc định sau 1 tháng 0đ.',
      badge: 'Mặc Định • Phổ Biến Nhất',
      plan_tier: 'starter',
      monthly_price_vnd: 1_500_000,
      annual_discount_pct: 15,
      annual_total_vnd: 15_300_000,
      annual_monthly_equivalent_vnd: 1_275_000,
      annual_saved_vnd: 2_700_000,
      max_sales: 5,
      max_managers: 3,
      max_users: 8,
      max_rounds: 5,
      monthly_lead_quota: 15_000,
      is_enterprise_upgrade: false,
      features: [
        'Chia số trực tiếp về Sale tức thì (1:1 hoặc năng lực)',
        'Cổng Sale riêng: tự nhập khách, xuất CSV & bật/tắt ca trực',
        'Báo khách qua ZaloBot & đồng bộ Google Sheets, API 2 chiều',
        'Phản hồi tín hiệu chất lượng về Meta Ads (CAPI)',
      ],
    },
    {
      code: 'autodata_growth',
      step_order: 2,
      name: 'Auto Data Pro',
      tagline: 'Mở rộng đa đội Sale, chi nhánh & tối ưu quảng cáo chuyên sâu.',
      badge: 'Đội Sale Mở Rộng',
      plan_tier: 'growth',
      monthly_price_vnd: 3_000_000,
      annual_discount_pct: 15,
      annual_total_vnd: 30_600_000,
      annual_monthly_equivalent_vnd: 2_550_000,
      annual_saved_vnd: 5_400_000,
      max_sales: 25,
      max_managers: 10,
      max_users: 35,
      max_rounds: 30,
      monthly_lead_quota: 100_000,
      is_enterprise_upgrade: false,
      features: [
        'Toàn bộ gói Standard + đa phễu độc lập theo từng sản phẩm',
        'Chia số theo chiến dịch, khu vực & khung giờ trực ca',
        'Tối ưu Ads đa kênh + Google Sheets & REST API không giới hạn',
        'Đền bù 1-đổi-1 khi duyệt số rác & báo cáo hiệu suất Lãnh Đạo',
      ],
    },
    {
      code: 'domation_crm_erp',
      step_order: 3,
      name: 'Automation • CRM 360° • ERP 5.0',
      tagline: 'Mở rộng liền mạch lên Automation, CRM 360° & ERP 5.0.',
      badge: 'Hệ Sinh Thái Toàn Diện',
      plan_tier: 'enterprise',
      monthly_price_vnd: 6_000_000,
      annual_discount_pct: 15,
      annual_total_vnd: 61_200_000,
      annual_monthly_equivalent_vnd: 5_100_000,
      annual_saved_vnd: 10_800_000,
      max_users: 9_999,
      max_rounds: 999,
      monthly_lead_quota: 1_000_000,
      is_enterprise_upgrade: true,
      features: [
        'Giữ nguyên 100% Lead, lịch sử Timeline & đội ngũ hiện có',
        'Automation: Flow rẽ nhánh IF/ELSE, Email kéo thả, Zalo ZNS & AI 24/7',
        'CRM 360°: Kanban 8 nấc, Báo giá, Hợp đồng & Hóa đơn điện tử',
        'ERP 5.0: 12 phân hệ HRM GPS AI, Lương KPI, Tài chính & Kho vận',
      ],
    },
  ],
  topup_packages: [
    {
      id: 'topup_1m',
      label: 'Gói Topup 1 Tháng',
      amount_vnd: 1_500_000,
      bonus_vnd: 0,
      equivalent_months_note: 'Đủ gia hạn ngay 1 tháng gói Auto Data Standard',
      highlight: false,
    },
    {
      id: 'topup_3m',
      label: 'Gói Topup 3 Tháng',
      amount_vnd: 4_500_000,
      bonus_vnd: 0,
      equivalent_months_note: 'Đủ gia hạn 1 quý (3 tháng) liên tục',
      highlight: false,
    },
    {
      id: 'topup_6m',
      label: 'Gói Topup 6 Tháng (+5% Bonus)',
      amount_vnd: 9_000_000,
      bonus_vnd: 450_000,
      equivalent_months_note: 'Tặng thêm 450.000₫ vào ví gia hạn',
      highlight: false,
    },
    {
      id: 'topup_12m',
      label: 'Gói Topup Năm (Tiết kiệm 15%)',
      amount_vnd: 15_300_000,
      bonus_vnd: 0,
      equivalent_months_note: 'Đủ mua gói Năm (-15%), chỉ 1.275.000₫/tháng',
      highlight: true,
    },
  ],
};
