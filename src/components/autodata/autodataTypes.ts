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

export interface ClientSessionState {
  access_token: string;
  tenant_slug: string;
  company_name: string;
  admin_email: string;
  webhook_url: string;
  webhook_token: string;
  bridge_mode: 'upstream_rls_postgres' | 'vercel_serverless_engine';
  upstream_app_url: string | null;
  subscription: ClientSubscriptionSnapshot;
}

export type SetupModalIntent =
  | 'register'
  | 'login'
  | 'workspace_router'
  | 'workspace_billing'
  | 'workspace_crm_erp';

export const DEFAULT_CLIENT_CATALOG: ClientBillingCatalog = {
  currency: 'VND',
  trial_duration_months: 3,
  trial_duration_days: 90,
  trial_warning_days: 14,
  base_monthly_price_vnd: 900_000,
  annual_discount_pct: 15,
  min_topup_vnd: 100_000,
  post_trial_policy: 'step_renewal_or_upgrade',
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
      name: 'Auto Data Standard',
      tagline: 'Gói mặc định sau 3 tháng dùng thử cho mọi doanh nghiệp.',
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
        'Tự động chia vòng Auto Data Router < 4s (Round-Robin / Trọng số)',
        'Kết nối Webhook đa kênh (Facebook Ads, Website, TikTok, Google Sheets)',
        'Bắn thông báo ZaloBot cá nhân & phản hồi Meta CAPI v21.0 (HTTP 200)',
        'Công tắc Online / Nghỉ phép & Che giấu SĐT bảo mật cho Cộng tác viên / F1',
        'Quản lý tới 25 nhân sự nhận số & 5 vòng định tuyến song song',
      ],
    },
    {
      code: 'autodata_growth',
      step_order: 2,
      name: 'Auto Data Scale Pro',
      tagline: 'Mở rộng đa phòng ban, đa chi nhánh & Dual-Send Meta CAPI nâng cao.',
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
        'Toàn bộ tính năng gói Standard + Đa phễu Pipeline độc lập theo sản phẩm',
        'Routing Rules chuyên sâu theo UTM Source, Chiến dịch, Khu vực & Khung giờ',
        'Dual-Send Meta CAPI 2 Dataset song song + SLA Auto-Recall tự thu hồi số trễ',
        'Đền bù tự động 1-đổi-1 khi duyệt Ticket lỗi & Báo cáo đối soát Gini',
        'Quản lý tới 100 nhân sự / Đại lý liên kết & 100.000 Leads / tháng',
      ],
    },
    {
      code: 'domation_crm_erp',
      step_order: 3,
      name: 'Nâng Cấp DOMATION CRM 360° / ERP 5.0',
      tagline: 'Chuyển đổi liền mạch từ Auto Data lên Hệ sinh thái Quản trị Toàn diện DOMATION.',
      badge: 'Hệ Sinh Thái Enterprise',
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
        'Giữ nguyên 100% dữ liệu Lead, lịch sử Timeline & cấu hình nhân sự hiện có',
        'DOMATION CRM 360°: Kanban 8 nấc, kịch bản CSKH tự động, hợp đồng & hóa đơn MISA',
        'DOMATION ERP 5.0: 12 phân hệ HRM/Chấm công GPS, Lương KPI, Tài chính, Kho vận',
        'Hỗ trợ triển khai Private Cloud hoặc Server độc lập riêng của doanh nghiệp',
      ],
    },
  ],
  topup_packages: [
    {
      id: 'topup_1m',
      label: 'Gói Topup 1 Tháng',
      amount_vnd: 900_000,
      bonus_vnd: 0,
      equivalent_months_note: 'Đủ gia hạn ngay 1 tháng gói Standard',
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
