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

export interface ClientSessionState {
  access_token: string;
  tenant_slug: string;
  company_name: string;
  admin_email: string;
  webhook_url: string;
  webhook_token: string;
  is_external_agency?: boolean;
  zalo_bot?: ZaloBotSavedState | null;
  bridge_mode: 'upstream_rls_postgres' | 'vercel_serverless_engine';
  upstream_app_url: string | null;
  subscription: ClientSubscriptionSnapshot;
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

export function buildGoogleAppsScriptSnippet(webhookUrl?: string, saleEmail?: string): string {
  const targetUrl =
    webhookUrl && webhookUrl.trim().length > 0
      ? webhookUrl.trim()
      : 'https://domation.net/api/autodata?action=webhook-test&slug=ten-cong-ty&token=whsec_xxx';
  const ownerHint = saleEmail && saleEmail.trim().length > 0 ? saleEmail.trim() : 'sale01@doanhnghiep.vn';

  return `/**
 * DOMATION Auto Data — Google Apps Script Đồng Bộ 2 Chiều (Inbound Lead & Per-Sale Sheet Sync)
 * Hướng dẫn: Mở Google Sheet -> Tiện ích mở rộng -> Apps Script -> Dán mã -> Lưu & Cài Trigger onEdit / onFormSubmit
 */
const DOMATION_WEBHOOK_URL = '${targetUrl}';
const SALE_OWNER_EMAIL = '${ownerHint}';

// Chiều 1: Tự động bắn dòng Lead mới từ Google Form / Sheet vào Auto Data Router (< 4s)
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

// Chiều 2: Khi Sale cập nhật Trạng thái (Cột F) hoặc Ghi chú (Cột G) trên Sheet riêng -> Đồng bộ ngược về Auto Data
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
  const escapeCell = (val: string) => `"${String(val ?? '').replace(/"/g, '""')}"`;
  const rows = items.map((item) => [
    item.id,
    item.name,
    item.phone,
    item.sale_owner_name,
    item.product_interest,
    item.note,
    'Cá nhân (Bypass Vòng Chia • Miễn SLA Recall)',
    item.sheet_sync_status,
    new Date(item.created_at).toLocaleString('vi-VN'),
  ]);
  const lines = [header, ...rows].map((row) => row.map(escapeCell).join(','));
  return `\uFEFF${lines.join('\r\n')}`;
}

export const DEFAULT_CLIENT_CATALOG: ClientBillingCatalog = {
  currency: 'VND',
  trial_duration_months: 3,
  trial_duration_days: 90,
  trial_warning_days: 14,
  base_monthly_price_vnd: 900_000,
  annual_discount_pct: 15,
  min_topup_vnd: 100_000,
  post_trial_policy: 'step_renewal_or_upgrade',
  automation_upgrade_url: '/automation',
  crm_upgrade_url: '/crm',
  erp_upgrade_url: '/erp',
  payment_bank_info: {
    bank_name: 'Techcombank (TCB)',
    account_number: '19038889996868',
    account_holder: 'CONG TY GIAI PHAP CONG NGHE DOMATION',
    transfer_prefix: 'DOMDATA',
  },
  plans: [
    {
      code: 'autodata_standard',
      step_order: 1,
      name: 'Auto Data Lite Standard',
      tagline: 'Bản Lite chuyên cho Sale & Chia Data — Mặc định sau 3 tháng dùng thử 0đ.',
      badge: 'Mặc Định • Phổ Biến Nhất',
      plan_tier: 'starter',
      monthly_price_vnd: 900_000,
      annual_discount_pct: 15,
      annual_total_vnd: 9_180_000,
      annual_monthly_equivalent_vnd: 765_000,
      annual_saved_vnd: 1_620_000,
      max_users: 25,
      max_rounds: 5,
      monthly_lead_quota: 15_000,
      is_enterprise_upgrade: false,
      features: [
        'Mặc định chia trực tiếp tới từng Sale nội bộ < 4s (Round-Robin / Trọng số)',
        'Cổng Sale cá nhân: Tự nhập/Import Lead riêng (không tính quota), Xuất CSV & Đồng bộ Sheets 2 chiều',
        'Kết nối Webhook đa kênh, báo số ZaloBot cá nhân & phản hồi Meta CAPI v21.0 (HTTP 200)',
        'Công tắc Online / Nghỉ phép, Thu hồi SLA 15 phút & Tùy chọn bật thêm Đại lý F1 (che SĐT)',
        'Quản lý tới 25 nhân sự Sale nhận số & 5 vòng định tuyến song song',
      ],
    },
    {
      code: 'autodata_growth',
      step_order: 2,
      name: 'Auto Data Scale Pro',
      tagline: 'Mở rộng đa phòng ban Sale, đa chi nhánh & Dual-Send Meta CAPI nâng cao.',
      badge: 'Đội Sale Quy Mô Lớn',
      plan_tier: 'growth',
      monthly_price_vnd: 1_800_000,
      annual_discount_pct: 15,
      annual_total_vnd: 18_360_000,
      annual_monthly_equivalent_vnd: 1_530_000,
      annual_saved_vnd: 3_240_000,
      max_users: 100,
      max_rounds: 30,
      monthly_lead_quota: 100_000,
      is_enterprise_upgrade: false,
      features: [
        'Toàn bộ tính năng gói Lite Standard + Đa phễu Pipeline độc lập theo dòng sản phẩm',
        'Routing Rules chuyên sâu theo UTM Source, Chiến dịch, Khu vực & Khung giờ trực ca',
        'Dual-Send Meta CAPI 2 Dataset song song + Đồng bộ Google Sheets 2 chiều không giới hạn',
        'Đền bù tự động 1-đổi-1 khi duyệt Ticket số rác & Báo cáo đối soát công bằng Gini',
        'Quản lý tới 100 nhân sự Sale nội bộ (kèm tùy chọn Đại lý F1) & 100.000 Leads / tháng',
      ],
    },
    {
      code: 'domation_crm_erp',
      step_order: 3,
      name: 'Nâng Cấp Automation / CRM 360° / ERP 5.0',
      tagline: 'Lộ trình nâng cấp liền mạch từ Bản Lite lên Marketing Automation, Full CRM 360° & ERP 5.0.',
      badge: 'Hệ Sinh Thái Toàn Diện',
      plan_tier: 'enterprise',
      monthly_price_vnd: 3_600_000,
      annual_discount_pct: 15,
      annual_total_vnd: 36_720_000,
      annual_monthly_equivalent_vnd: 3_060_000,
      annual_saved_vnd: 6_480_000,
      max_users: 9_999,
      max_rounds: 999,
      monthly_lead_quota: 1_000_000,
      is_enterprise_upgrade: true,
      features: [
        'Giữ nguyên 100% danh sách Lead, dữ liệu Sale cá nhân, Timeline & nhân sự hiện có',
        'Marketing Automation (/automation): Flow rẽ nhánh IF/ELSE, Email kéo thả, Zalo ZNS & AI 24/7',
        'Full CRM 360° (/crm): Kanban 8 nấc chuyên sâu, Báo giá, Hợp đồng & Hóa đơn MISA',
        'Enterprise ERP 5.0 (/erp): 12 phân hệ HRM Chấm công GPS AI, Lương KPI, Tài chính & Kho vận',
      ],
    },
  ],
  topup_packages: [
    {
      id: 'topup_1m',
      label: 'Gói Topup 1 Tháng',
      amount_vnd: 900_000,
      bonus_vnd: 0,
      equivalent_months_note: 'Đủ gia hạn ngay 1 tháng gói Lite Standard',
      highlight: false,
    },
    {
      id: 'topup_3m',
      label: 'Gói Topup 3 Tháng',
      amount_vnd: 2_700_000,
      bonus_vnd: 0,
      equivalent_months_note: 'Đủ gia hạn 1 quý (3 tháng) liên tục',
      highlight: false,
    },
    {
      id: 'topup_6m',
      label: 'Gói Topup 6 Tháng (+5% Bonus)',
      amount_vnd: 5_400_000,
      bonus_vnd: 270_000,
      equivalent_months_note: 'Tặng thêm 270.000₫ vào ví gia hạn',
      highlight: false,
    },
    {
      id: 'topup_12m',
      label: 'Gói Topup Năm (Tiết kiệm 15%)',
      amount_vnd: 9_180_000,
      bonus_vnd: 0,
      equivalent_months_note: 'Đủ mua gói Năm (-15%), chỉ 765.000₫/tháng',
      highlight: true,
    },
  ],
};
