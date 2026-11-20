import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowUpRight,
  Check,
  Copy,
  CreditCard,
  Loader2,
  QrCode,
  RefreshCw,
  Sparkles,
  Wallet,
  X,
} from 'lucide-react';
import { apiRequest, formatVnd, getErrorMessage } from '../autodataApi';
import { DEFAULT_CLIENT_CATALOG, type ClientBillingCatalog, type ClientSubscriptionSnapshot } from '../autodataTypes';

interface BillingTransactionRow {
  id: string;
  tx_type: string;
  plan_code?: string | null;
  amount_vnd: number;
  payment_method: string;
  status: string;
  reference_code?: string | null;
  note?: string | null;
  created_at: string;
}

interface ExtendedSubscriptionSnapshot extends ClientSubscriptionSnapshot {
  status?: 'active' | 'trial' | 'grace' | 'suspended' | 'cancelled' | string;
  auto_renew?: boolean;
  cancel_at_period_end?: boolean;
  grace_ends_at?: string | null;
  scheduled_plan_code?: string | null;
  scheduled_billing_cycle?: string | null;
  limits?: {
    max_users?: number;
    max_sales?: number;
    max_managers?: number;
    max_rounds?: number;
    monthly_lead_quota?: number;
  };
}

interface BillingBankInfo {
  bank_name: string;
  account_number: string;
  account_holder: string;
  transfer_prefix: string;
}

interface BillingCatalogExtended extends ClientBillingCatalog {
  max_topup_vnd?: number;
}

interface BillingOverviewResponse {
  catalog?: BillingCatalogExtended;
  subscription?: ExtendedSubscriptionSnapshot;
  transactions?: BillingTransactionRow[];
  payment_bank_info?: BillingBankInfo;
  limits?: ExtendedSubscriptionSnapshot['limits'];
  wallet_balance_vnd?: number;
  status?: string;
  auto_renew?: boolean;
  cancel_at_period_end?: boolean;
  grace_ends_at?: string | null;
  scheduled_plan_code?: string | null;
  scheduled_billing_cycle?: string | null;
}

interface PendingPaymentOrder {
  label: string;
  amount_vnd: number;
  reference_code: string;
  qr_url: string;
  bank_info: BillingBankInfo;
  expires_at?: string;
}

export interface BillingViewProps {
  token: string;
  tenantSlug: string;
  catalog?: ClientBillingCatalog;
  hideHeaderCard?: boolean;
}

const TRIAL_PLAN_CODES = new Set(['trial', 'trial_1m', 'trial_3m', 'free_trial']);

const CANONICAL_PLAN_ALIASES: Record<string, string> = {
  autodata_standard: 'autodata_standard',
  starter: 'autodata_standard',
  autodata_crm: 'autodata_standard',
  standard: 'autodata_standard',
  standard_yearly: 'autodata_standard',
  standard_annual: 'autodata_standard',
  standard_monthly: 'autodata_standard',
  autodata_growth: 'autodata_growth',
  growth: 'autodata_growth',
  growth_combo: 'autodata_growth',
  pro: 'autodata_growth',
  scale_pro: 'autodata_growth',
  pro_yearly: 'autodata_growth',
  pro_annual: 'autodata_growth',
  pro_monthly: 'autodata_growth',
  domation_crm_erp: 'domation_crm_erp',
  enterprise: 'domation_crm_erp',
  domation_promax: 'domation_crm_erp',
  enterprise_yearly: 'domation_crm_erp',
  enterprise_annual: 'domation_crm_erp',
  enterprise_monthly: 'domation_crm_erp',
  marketing_standalone: 'marketing_standalone',
};

const normalizeCanonicalPlanCode = (value?: string | null): string => {
  const key = (value || '').toLowerCase().trim();
  if (!key) return '';
  if (TRIAL_PLAN_CODES.has(key)) return key;
  if (CANONICAL_PLAN_ALIASES[key]) return CANONICAL_PLAN_ALIASES[key];
  const stripped = key.replace(/_(yearly|annual|monthly)$/, '');
  if (stripped && !TRIAL_PLAN_CODES.has(stripped) && CANONICAL_PLAN_ALIASES[stripped]) {
    return CANONICAL_PLAN_ALIASES[stripped];
  }
  return stripped || key;
};

const formatPlanDisplayName = (
  planCode?: string | null,
  planTier?: string | null,
  planName?: string | null
): string => {
  const code = (planCode || '').toLowerCase().trim();
  const tier = (planTier || '').toLowerCase().trim();
  const rawName = (planName || '').trim();

  const codeMap: Record<string, string> = {
    enterprise_yearly: 'Enterprise • Chu kỳ Năm',
    enterprise_annual: 'Enterprise • Chu kỳ Năm',
    enterprise_monthly: 'Enterprise • Theo Tháng',
    enterprise: 'Enterprise • Doanh nghiệp',
    domation_crm_erp: 'CRM 360° & ERP 5.0 • Doanh nghiệp',
    domation_promax: 'CRM 360° & ERP 5.0 • Doanh nghiệp',
    standard_yearly: 'Standard • Chu kỳ Năm',
    standard_annual: 'Standard • Chu kỳ Năm',
    standard_monthly: 'Standard • Theo Tháng',
    standard: 'Standard • Tiêu chuẩn',
    autodata_standard: 'Standard • Tiêu chuẩn',
    autodata_crm: 'Standard • Auto Data CRM',
    pro_yearly: 'Pro • Chu kỳ Năm',
    pro_annual: 'Pro • Chu kỳ Năm',
    pro_monthly: 'Pro • Theo Tháng',
    pro: 'Pro • Tăng trưởng',
    scale_pro: 'Scale Pro • Chuyên sâu',
    autodata_growth: 'Pro • Mở rộng',
    growth: 'Pro • Tăng trưởng',
    growth_combo: 'Pro • Growth Combo',
    marketing_standalone: 'DOM Meta & CAPI Standalone',
    trial: 'Gói Dùng Thử',
    trial_1m: 'Gói Dùng Thử (30 ngày)',
    trial_3m: 'Gói Dùng Thử (90 ngày)',
    free_trial: 'Gói Dùng Thử Miễn Phí',
    starter: 'Standard • Khởi tạo',
  };

  if (code && codeMap[code]) {
    return codeMap[code];
  }
  if (rawName && codeMap[rawName.toLowerCase()]) {
    return codeMap[rawName.toLowerCase()];
  }
  if (rawName && !rawName.includes('_')) {
    if (tier && !tier.includes('_')) {
      const tierMap: Record<string, string> = {
        starter: 'Khởi tạo',
        growth: 'Tăng trưởng',
        pro: 'Chuyên nghiệp',
        enterprise: 'Doanh nghiệp',
      };
      const tierLabel = tierMap[tier] || tier;
      return `${rawName} • ${tierLabel}`;
    }
    return rawName;
  }
  const base = code || rawName || 'trial_1m';
  return codeMap[base] || base.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
};

const formatTierLabel = (tier?: string | null): string => {
  const t = (tier || '').toLowerCase().trim();
  const map: Record<string, string> = {
    starter: 'Tiêu chuẩn',
    growth: 'Tăng trưởng',
    pro: 'Chuyên nghiệp',
    enterprise: 'Doanh nghiệp',
    trial: 'Dùng thử',
  };
  return map[t] || t || 'Tiêu chuẩn';
};

function buildFallbackVietQrUrl(bankInfo: BillingBankInfo, amountVnd: number, refCode: string): string {
  return `https://img.vietqr.io/image/970407-${encodeURIComponent(bankInfo.account_number)}-compact2.png?amount=${Math.max(1000, Math.round(amountVnd))}&addInfo=${encodeURIComponent(refCode)}&accountName=${encodeURIComponent(bankInfo.account_holder)}`;
}

function buildFallbackOrderRef(prefix: string): string {
  return `${prefix}-${Date.now().toString(36).toUpperCase()}`;
}

function createIdempotencyKey(action: string, target?: string): string {
  const cleanTarget = String(target || 'op').replace(/[^a-z0-9_-]/gi, '').slice(0, 24) || 'op';
  const rand =
    typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID()
      : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
  return `bill_${action}_${cleanTarget}_${rand}`.slice(0, 120);
}

export const BillingView: React.FC<BillingViewProps> = ({
  token,
  tenantSlug,
  catalog,
  hideHeaderCard = false,
}) => {
  const [overview, setOverview] = useState<BillingOverviewResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [toast, setToast] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('annual');
  const [customAmountInput, setCustomAmountInput] = useState<string>('2000000');
  const [pendingOrder, setPendingOrder] = useState<PendingPaymentOrder | null>(null);
  const [copiedRef, setCopiedRef] = useState(false);

  // Lifecycle modals
  const [downgradePlanCode, setDowngradePlanCode] = useState<string | null>(null);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');

  const fetchBilling = useCallback(async () => {
    return apiRequest<BillingOverviewResponse>('/billing/overview', { token, tenantSlug });
  }, [token, tenantSlug]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetchBilling();
        if (!cancelled) setOverview(res);
      } catch {
        if (!cancelled) setOverview(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [fetchBilling]);

  const reload = async () => {
    setLoading(true);
    try {
      setOverview(await fetchBilling());
    } finally {
      setLoading(false);
    }
  };

  const activeCatalog: BillingCatalogExtended = overview?.catalog || catalog || DEFAULT_CLIENT_CATALOG;
  const sub = overview?.subscription;
  const plans = useMemo(() => activeCatalog.plans || [], [activeCatalog.plans]);
  const topups = useMemo(() => activeCatalog.topup_packages || [], [activeCatalog.topup_packages]);
  const bankInfo: BillingBankInfo =
    overview?.payment_bank_info ||
    activeCatalog.payment_bank_info ||
    DEFAULT_CLIENT_CATALOG.payment_bank_info;

  const minTopupVnd = activeCatalog.min_topup_vnd || 100_000;
  const maxTopupVnd = activeCatalog.max_topup_vnd || 500_000_000;

  const rawSubCode = (sub?.plan_code || '').toLowerCase().trim();
  const rawSubTier = (sub?.plan_tier || '').toLowerCase().trim();
  const normalizedSubCode = normalizeCanonicalPlanCode(sub?.plan_code);
  const normalizedSubTier = normalizeCanonicalPlanCode(sub?.plan_tier);
  const isTrialSubCode =
    TRIAL_PLAN_CODES.has(rawSubCode) || TRIAL_PLAN_CODES.has(normalizedSubCode);

  const matchedPlan = useMemo(() => {
    const byExactCode = rawSubCode
      ? plans.find((p) => String(p.code).toLowerCase() === rawSubCode)
      : undefined;
    if (byExactCode) return byExactCode;

    const byNormalizedCode =
      normalizedSubCode && !isTrialSubCode
        ? plans.find((p) => normalizeCanonicalPlanCode(p.code) === normalizedSubCode)
        : undefined;
    if (byNormalizedCode) return byNormalizedCode;

    const byTier =
      normalizedSubCode !== 'marketing_standalone' &&
      (rawSubTier || (normalizedSubTier && !TRIAL_PLAN_CODES.has(normalizedSubTier)))
        ? plans.find(
            (p) =>
              (normalizedSubTier !== '' &&
                !TRIAL_PLAN_CODES.has(normalizedSubTier) &&
                (normalizeCanonicalPlanCode(p.plan_tier) === normalizedSubTier ||
                  normalizeCanonicalPlanCode(p.code) === normalizedSubTier)) ||
              (rawSubTier !== '' && String(p.plan_tier).toLowerCase() === rawSubTier)
          )
        : undefined;
    return byTier || (normalizedSubCode === 'marketing_standalone' ? undefined : plans[0]);
  }, [plans, rawSubCode, rawSubTier, normalizedSubCode, normalizedSubTier, isTrialSubCode]);

  const effectiveLimits = sub?.limits || overview?.limits;
  const activeMaxUsers =
    effectiveLimits?.max_users ??
    matchedPlan?.max_users ??
    DEFAULT_CLIENT_CATALOG.plans[0].max_users;
  const activeMaxRounds = effectiveLimits?.max_rounds ?? matchedPlan?.max_rounds ?? 5;
  const activeLeadQuota = effectiveLimits?.monthly_lead_quota ?? matchedPlan?.monthly_lead_quota ?? 15000;

  const walletBalanceVnd = Number(overview?.wallet_balance_vnd ?? sub?.wallet_balance_vnd ?? 0);
  const effectiveStatus = overview?.status || sub?.status || (sub?.is_expired ? 'grace' : sub?.is_in_trial ? 'trial' : 'active');
  const autoRenew = overview?.auto_renew ?? sub?.auto_renew ?? false;
  const cancelAtPeriodEnd = overview?.cancel_at_period_end ?? sub?.cancel_at_period_end ?? false;
  const scheduledPlanCode = overview?.scheduled_plan_code ?? sub?.scheduled_plan_code ?? null;
  const graceEndsAt = overview?.grace_ends_at ?? sub?.grace_ends_at ?? null;

  const openPaymentOrderFromResponse = (
    res: {
      transaction?: { reference_code?: string; amount_vnd?: number };
      payment_bank_info?: BillingBankInfo;
      gateway_session?: { qr_url?: string; reference_code?: string; amount_vnd?: number; expires_at?: string };
    },
    fallbackLabel: string,
    fallbackAmount: number
  ) => {
    const usedBank = res.payment_bank_info || bankInfo;
    const ref =
      res.gateway_session?.reference_code ||
      res.transaction?.reference_code ||
      buildFallbackOrderRef(usedBank.transfer_prefix);
    const amt = Number(res.gateway_session?.amount_vnd || res.transaction?.amount_vnd || fallbackAmount);
    const qrUrl = res.gateway_session?.qr_url || buildFallbackVietQrUrl(usedBank, amt, ref);
    setPendingOrder({
      label: fallbackLabel,
      amount_vnd: amt,
      reference_code: ref,
      qr_url: qrUrl,
      bank_info: usedBank,
      expires_at: res.gateway_session?.expires_at,
    });
  };

  const handleTopup = async (packageId?: string, customAmountVnd?: number) => {
    setBusyKey(packageId || 'custom_topup');
    setToast(null);
    try {
      if (customAmountVnd !== undefined) {
        if (!Number.isFinite(customAmountVnd) || customAmountVnd < minTopupVnd || customAmountVnd > maxTopupVnd) {
          setToast({
            type: 'err',
            text: `Số tiền nạp phải nằm trong khoảng ${formatVnd(minTopupVnd)} – ${formatVnd(maxTopupVnd)}.`,
          });
          setBusyKey(null);
          return;
        }
      }
      const idempotencyKey = createIdempotencyKey('topup', packageId || 'custom');
      const res = await apiRequest<{
        transaction?: { reference_code?: string; amount_vnd?: number };
        payment_bank_info?: BillingBankInfo;
        gateway_session?: { qr_url?: string; reference_code?: string; amount_vnd?: number; expires_at?: string };
      }>('/billing/topup', {
        method: 'POST',
        token,
        tenantSlug,
        headers: { 'X-Idempotency-Key': idempotencyKey },
        body: packageId
          ? { package_id: packageId, idempotency_key: idempotencyKey }
          : { amount_vnd: customAmountVnd, idempotency_key: idempotencyKey },
      });
      const pkg = topups.find((t) => t.id === packageId);
      const label = pkg ? pkg.label : `Nạp ví tùy chỉnh`;
      const amt = pkg ? pkg.amount_vnd : Number(customAmountVnd || minTopupVnd);
      openPaymentOrderFromResponse(res, label, amt);
      setToast({
        type: 'ok',
        text: 'Đã tạo mã VietQR nạp ví. Quét QR hoặc chuyển khoản đúng nội dung để cộng tiền tự động.',
      });
      void reload();
    } catch (err: unknown) {
      setToast({ type: 'err', text: getErrorMessage(err, 'Không thể tạo lệnh nạp ví.') });
    } finally {
      setBusyKey(null);
    }
  };

  const handleSwitchOrSubscribe = async (
    planCode: string,
    options?: { scheduleAtPeriodEnd?: boolean; forceMethod?: 'wallet' | 'bank_transfer' }
  ) => {
    const plan = plans.find((p) => p.code === planCode);
    const needed = plan
      ? billingCycle === 'annual'
        ? plan.annual_total_vnd
        : plan.monthly_price_vnd
      : activeCatalog.base_monthly_price_vnd;
    const paymentMethod =
      options?.forceMethod || (walletBalanceVnd >= needed ? 'wallet' : 'bank_transfer');

    setBusyKey(`plan_${planCode}`);
    setToast(null);
    try {
      const endpoint =
        sub?.plan_code && !isTrialSubCode && !sub?.is_in_trial
          ? '/billing/switch-package'
          : '/billing/subscribe';
      const idempotencyKey = createIdempotencyKey(
        endpoint === '/billing/switch-package' ? 'switch' : 'subscribe',
        planCode
      );
      const bodyPayload =
        endpoint === '/billing/switch-package'
          ? {
              package_code: planCode,
              billing_cycle: billingCycle,
              payment_method: paymentMethod,
              schedule_at_period_end: options?.scheduleAtPeriodEnd ?? false,
              idempotency_key: idempotencyKey,
            }
          : {
              plan_code: planCode,
              billing_cycle: billingCycle,
              payment_method: paymentMethod,
              schedule_at_period_end: options?.scheduleAtPeriodEnd ?? false,
              idempotency_key: idempotencyKey,
            };

      const res = await apiRequest<{
        requires_payment?: boolean;
        scheduled_downgrade?: boolean;
        effective_at?: string;
        transaction?: { reference_code?: string; amount_vnd?: number };
        payment_bank_info?: BillingBankInfo;
        gateway_session?: { qr_url?: string; reference_code?: string; amount_vnd?: number; expires_at?: string };
      }>(endpoint, {
        method: 'POST',
        token,
        tenantSlug,
        headers: { 'X-Idempotency-Key': idempotencyKey },
        body: bodyPayload,
      });

      if (res?.requires_payment) {
        openPaymentOrderFromResponse(
          res,
          `Kích hoạt ${plan?.name || planCode} (${billingCycle === 'annual' ? 'Năm -15%' : 'Tháng'})`,
          needed
        );
        setToast({
          type: 'ok',
          text: 'Số dư ví chưa đủ — đã tạo mã VietQR thanh toán chuyển khoản bên dưới.',
        });
      } else if (res?.scheduled_downgrade) {
        setToast({
          type: 'ok',
          text: `Đã lên lịch chuyển sang ${plan?.name || planCode} vào cuối chu kỳ hiện tại.`,
        });
      } else {
        setToast({
          type: 'ok',
          text: `Đã kích hoạt gói ${plan?.name || planCode} thành công!`,
        });
      }
      setDowngradePlanCode(null);
      void reload();
    } catch (err: unknown) {
      setToast({
        type: 'err',
        text: getErrorMessage(err, 'Không thể xử lý đổi gói (kiểm tra số dư hoặc giới hạn nhân sự).'),
      });
    } finally {
      setBusyKey(null);
    }
  };

  const handleRenew = async () => {
    const needed = matchedPlan
      ? billingCycle === 'annual'
        ? matchedPlan.annual_total_vnd
        : matchedPlan.monthly_price_vnd
      : activeCatalog.base_monthly_price_vnd;
    const paymentMethod = walletBalanceVnd >= needed ? 'wallet' : 'bank_transfer';
    setBusyKey('renew');
    setToast(null);
    try {
      const idempotencyKey = createIdempotencyKey('renew', sub?.plan_code || matchedPlan?.code);
      const res = await apiRequest<{
        requires_payment?: boolean;
        transaction?: { reference_code?: string; amount_vnd?: number };
        payment_bank_info?: BillingBankInfo;
        gateway_session?: { qr_url?: string; reference_code?: string; amount_vnd?: number; expires_at?: string };
      }>('/billing/renew', {
        method: 'POST',
        token,
        tenantSlug,
        headers: { 'X-Idempotency-Key': idempotencyKey },
        body: {
          plan_code: sub?.plan_code || matchedPlan?.code,
          billing_cycle: billingCycle,
          payment_method: paymentMethod,
          idempotency_key: idempotencyKey,
        },
      });
      if (res?.requires_payment) {
        openPaymentOrderFromResponse(res, 'Gia hạn gói hiện tại', needed);
        setToast({ type: 'ok', text: 'Đã tạo mã VietQR gia hạn gói bên dưới.' });
      } else {
        setToast({ type: 'ok', text: 'Đã gia hạn chu kỳ gói cước thành công!' });
      }
      void reload();
    } catch (err: unknown) {
      setToast({ type: 'err', text: getErrorMessage(err, 'Không thể gia hạn gói cước.') });
    } finally {
      setBusyKey(null);
    }
  };

  const handleToggleAutoRenew = async () => {
    setBusyKey('auto_renew');
    setToast(null);
    try {
      await apiRequest('/billing/auto-renew', {
        method: 'PATCH',
        token,
        tenantSlug,
        body: { auto_renew: !autoRenew },
      });
      setToast({
        type: 'ok',
        text: !autoRenew ? 'Đã bật Tự động gia hạn từ Ví.' : 'Đã tắt Tự động gia hạn.',
      });
      void reload();
    } catch (err: unknown) {
      setToast({ type: 'err', text: getErrorMessage(err, 'Không thể cập nhật tự động gia hạn.') });
    } finally {
      setBusyKey(null);
    }
  };

  const handleCancelSubscription = async (immediate: boolean) => {
    setBusyKey(immediate ? 'cancel_now' : 'cancel_end');
    setToast(null);
    try {
      await apiRequest('/billing/cancel', {
        method: 'POST',
        token,
        tenantSlug,
        body: {
          immediate,
          reason: cancelReason.trim() || undefined,
        },
      });
      setCancelModalOpen(false);
      setCancelReason('');
      setToast({
        type: 'ok',
        text: immediate
          ? 'Đã hủy gói dịch vụ ngay lập tức.'
          : 'Đã đặt lịch hủy gia hạn vào cuối chu kỳ — bạn vẫn dùng hết ngày còn lại.',
      });
      void reload();
    } catch (err: unknown) {
      setToast({ type: 'err', text: getErrorMessage(err, 'Không thể hủy gói dịch vụ.') });
    } finally {
      setBusyKey(null);
    }
  };

  const handleUpgradeCrm = async () => {
    setBusyKey('upgrade_crm');
    try {
      await apiRequest('/billing/upgrade-request', {
        method: 'POST',
        token,
        tenantSlug,
        body: { target_suite: 'domation_crm_erp', note: 'Nâng cấp từ Auto Data lên DOMATION CRM 360° / ERP 5.0' },
      });
      setToast({ type: 'ok', text: 'Đã gửi yêu cầu nâng cấp liền mạch lên DOMATION CRM 360° / ERP 5.0.' });
      void reload();
    } catch (err: unknown) {
      setToast({ type: 'err', text: getErrorMessage(err, 'Không thể gửi yêu cầu nâng cấp.') });
    } finally {
      setBusyKey(null);
    }
  };

  return (
    <div className="space-y-5">
      {!hideHeaderCard ? (
        <div className="inkica-glass-card flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4">
          <div className="flex items-center gap-2.5 min-w-0">
            <CreditCard className="h-5 w-5 text-[#1E40FF] shrink-0" />
            <div className="min-w-0">
              <h1 className="text-base sm:text-lg font-bold text-slate-900 truncate">Gói Cước, Hạn Mức &amp; Ví Thanh Toán</h1>
              <p className="text-xs text-slate-500">Mặc định dùng thử 1 tháng (30 ngày) 0₫ • Nâng cấp liền mạch lên CRM 360° &amp; ERP 5.0</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => void reload()}
            className="min-h-[44px] min-w-[44px] rounded-xl border border-slate-200 p-2 hover:bg-slate-50 transition flex items-center justify-center shrink-0"
            title="Làm mới trạng thái gói cước"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      ) : (
        <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-2 text-xs text-slate-500">
          <p className="min-w-0">Mặc định dùng thử 30 ngày 0₫ • Thanh toán Ví / VietQR</p>
          <button
            type="button"
            onClick={() => void reload()}
            className="min-h-[44px] inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition shrink-0"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} /> Làm mới
          </button>
        </div>
      )}

      {toast && (
        <div
          className={`rounded-xl border px-4 py-3 text-xs font-semibold ${
            toast.type === 'err'
              ? 'border-rose-200 bg-rose-50 text-rose-800'
              : 'border-blue-200 bg-blue-50 text-[#1E40FF]'
          }`}
        >
          {toast.text}
        </div>
      )}

      {/* Lifecycle Warnings (Grace / Cancel at period end / Scheduled Downgrade) */}
      {(effectiveStatus === 'grace' || effectiveStatus === 'suspended' || cancelAtPeriodEnd || scheduledPlanCode) && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50/80 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-amber-900">
          <div className="flex items-start gap-2.5">
            <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              {effectiveStatus === 'grace' && (
                <div className="font-bold">
                  Gói đang trong thời gian ân hạn (Grace Period){graceEndsAt ? ` đến ${new Date(graceEndsAt).toLocaleDateString('vi-VN')}` : ''}. Vui lòng gia hạn để không gián đoạn chia số.
                </div>
              )}
              {cancelAtPeriodEnd && (
                <div className="font-bold">
                  Đã đặt lịch hủy tự động gia hạn vào cuối chu kỳ hiện tại.
                </div>
              )}
              {scheduledPlanCode && (
                <div>
                  Lịch chuyển gói tiếp theo: <strong>{formatPlanDisplayName(scheduledPlanCode)}</strong> vào cuối chu kỳ.
                </div>
              )}
            </div>
          </div>
          <button
            type="button"
            disabled={busyKey === 'renew'}
            onClick={() => void handleRenew()}
            className="min-h-[44px] w-full sm:w-auto rounded-xl bg-amber-600 hover:bg-amber-700 px-4 py-2 text-xs font-bold text-white shrink-0"
          >
            Gia hạn ngay
          </button>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {/* Card 1: Gói Hiện Tại + Lifecycle */}
        <div className="inkica-glass-card flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5">
          <div>
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs font-semibold text-slate-500">Gói Hiện Tại</p>
              <span
                className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                  effectiveStatus === 'cancelled' || effectiveStatus === 'suspended'
                    ? 'bg-rose-50 text-rose-700'
                    : effectiveStatus === 'grace' || sub?.is_expired
                    ? 'bg-amber-50 text-amber-700'
                    : sub?.is_in_trial
                    ? 'bg-amber-50 text-amber-700'
                    : 'bg-emerald-50 text-emerald-700'
                }`}
              >
                {effectiveStatus === 'cancelled'
                  ? 'Đã hủy'
                  : effectiveStatus === 'grace'
                  ? 'Ân hạn (Grace)'
                  : sub?.is_expired
                  ? 'Hết hạn'
                  : sub?.is_in_trial
                  ? `Dùng thử (${sub?.days_remaining ?? 30} ngày)`
                  : 'Đang hoạt động'}
              </span>
            </div>
            <p className="mt-2 text-base sm:text-lg font-extrabold text-[#1E40FF] leading-snug">
              {formatPlanDisplayName(sub?.plan_code, sub?.plan_tier, sub?.plan_name)}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Phân hạng: <span className="font-semibold text-slate-700">{formatTierLabel(sub?.plan_tier)}</span>
              {sub?.billing_cycle ? ` • Chu kỳ: ${sub.billing_cycle === 'annual' ? 'Năm (-15%)' : 'Tháng'}` : ''}
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 grid grid-cols-2 gap-2">
            <button
              type="button"
              disabled={busyKey === 'renew'}
              onClick={() => void handleRenew()}
              className="min-h-[44px] rounded-xl bg-blue-50 hover:bg-blue-100 text-[#1E40FF] px-3 py-2 text-xs font-bold cursor-pointer"
            >
              Gia hạn gói
            </button>
            <button
              type="button"
              onClick={() => setCancelModalOpen(true)}
              className="min-h-[44px] rounded-xl border border-slate-200 hover:bg-rose-50 hover:text-rose-700 text-slate-600 px-3 py-2 text-xs font-semibold cursor-pointer"
            >
              Hủy gói
            </button>
          </div>
        </div>

        {/* Card 2: Số Dư Ví + Auto-Renew */}
        <div className="inkica-glass-card flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5">
          <div>
            <p className="text-xs font-semibold text-slate-500">Số Dư Ví Gia Hạn</p>
            <p className="mt-2 flex items-center gap-2 text-2xl font-extrabold text-emerald-600">
              <Wallet className="h-5 w-5 text-emerald-600 shrink-0" /> {formatVnd(walletBalanceVnd)}
            </p>
            <p className="mt-1 text-xs text-slate-500">Ưu đãi -15% khi gia hạn chu kỳ Năm</p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 grid grid-cols-2 gap-2">
            <button
              type="button"
              disabled={busyKey === 'auto_renew'}
              onClick={() => void handleToggleAutoRenew()}
              className={`min-h-[44px] rounded-xl border px-3 py-2 text-xs font-bold cursor-pointer ${
                autoRenew
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                  : 'border-slate-200 bg-slate-50 text-slate-600'
              }`}
            >
              Auto-Renew: {autoRenew ? 'Bật' : 'Tắt'}
            </button>
            <button
              type="button"
              onClick={() => {
                document.querySelector('[data-tour="billing-topup"]')?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="min-h-[44px] rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-2 text-xs font-bold cursor-pointer"
            >
              + Nạp VietQR
            </button>
          </div>
        </div>

        {/* Card 3: Hạn Mức Quota */}
        <div className="inkica-glass-card flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5">
          <div>
            <p className="text-xs font-semibold text-slate-500">Hạn Mức Vận Hành</p>
            <p className="mt-2 text-base font-extrabold text-slate-900">
              Tối đa {activeMaxUsers.toLocaleString('vi-VN')} nhân sự •{' '}
              {activeMaxRounds.toLocaleString('vi-VN')} Vòng chia
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Quota: {Number(activeLeadQuota).toLocaleString('vi-VN')} lead/tháng
            </p>
          </div>
          <button
            type="button"
            disabled={busyKey === 'upgrade_crm'}
            onClick={() => void handleUpgradeCrm()}
            className="mt-4 min-h-[44px] w-full rounded-xl bg-[#0284C7]/10 hover:bg-[#0284C7]/20 text-[#0284C7] px-3 py-2 text-xs font-bold inline-flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Sparkles className="h-3.5 w-3.5 shrink-0" />
            <span>Nâng cấp CRM 360° / ERP 5.0</span>
            <ArrowUpRight className="h-3.5 w-3.5 shrink-0" />
          </button>
        </div>
      </div>

      {/* Package Catalog Cards */}
      <div data-tour="billing-catalog" className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div>
            <h2 className="text-sm font-bold text-slate-900">Bảng Gói Dịch Vụ SaaS Đồng Bộ</h2>
            <p className="text-xs text-slate-500">Nâng cấp hoặc chuyển / hạ gói trực tiếp theo hạn mức thực tế</p>
          </div>
          <div className="grid grid-cols-2 sm:inline-flex rounded-xl bg-slate-100 p-1 text-xs font-semibold">
            <button
              type="button"
              onClick={() => setBillingCycle('monthly')}
              className={`min-h-[44px] rounded-lg px-3 py-1 transition ${
                billingCycle === 'monthly' ? 'bg-white text-[#1E40FF] shadow-sm font-bold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Theo Tháng
            </button>
            <button
              type="button"
              onClick={() => setBillingCycle('annual')}
              className={`min-h-[44px] rounded-lg px-3 py-1 transition ${
                billingCycle === 'annual' ? 'bg-white text-[#1E40FF] shadow-sm font-bold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Theo Năm (-15%)
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          {plans.map((p) => {
            const normalizedPlanCode = normalizeCanonicalPlanCode(p.code);
            const hasDirectCodePlanMatch =
              !isTrialSubCode &&
              plans.some(
                (cand) =>
                  (rawSubCode !== '' && String(cand.code).toLowerCase() === rawSubCode) ||
                  (normalizedSubCode !== '' &&
                    normalizeCanonicalPlanCode(cand.code) === normalizedSubCode)
              );
            const isCurrent =
              !isTrialSubCode &&
              !sub?.is_in_trial &&
              ((rawSubCode !== '' && String(p.code).toLowerCase() === rawSubCode) ||
                (normalizedSubCode !== '' && normalizedPlanCode === normalizedSubCode) ||
                (!hasDirectCodePlanMatch &&
                  normalizedSubCode !== 'marketing_standalone' &&
                  normalizedSubTier !== '' &&
                  !TRIAL_PLAN_CODES.has(normalizedSubTier) &&
                  normalizedPlanCode === normalizedSubTier));
            const currentPrice = matchedPlan?.monthly_price_vnd ?? 0;
            const currentCodeNorm = normalizeCanonicalPlanCode(matchedPlan?.code);
            const isDowngrade =
              !isCurrent &&
              !sub?.is_in_trial &&
              !isTrialSubCode &&
              Boolean(matchedPlan) &&
              (p.monthly_price_vnd < currentPrice ||
                (p.monthly_price_vnd === currentPrice &&
                  normalizedPlanCode !== 'marketing_standalone' &&
                  currentCodeNorm !== 'marketing_standalone' &&
                  p.step_order < (matchedPlan?.step_order ?? 1)));
            const needed = billingCycle === 'annual' ? p.annual_total_vnd : p.monthly_price_vnd;
            const payLabel =
              isCurrent
                ? 'Gia hạn gói hiện tại'
                : isDowngrade
                ? 'Chuyển / Hạ gói'
                : walletBalanceVnd >= needed
                ? 'Nâng cấp bằng Ví'
                : 'Nâng cấp qua VietQR';

            return (
              <div
                key={p.code}
                className={`inkica-glass-card flex flex-col justify-between rounded-2xl border p-5 transition ${
                  isCurrent
                    ? 'border-[#1E40FF] bg-blue-50/20 ring-2 ring-blue-100'
                    : p.plan_tier === 'growth'
                    ? 'border-indigo-200 bg-white hover:border-indigo-500/50'
                    : 'border-slate-200 bg-white hover:border-[#1E40FF]/50'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-[10px] font-bold text-[#1E40FF]">
                      {p.badge || p.name}
                    </span>
                    {isCurrent && (
                      <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                        ĐANG DÙNG
                      </span>
                    )}
                  </div>
                  <h3 className="mt-2 text-base font-extrabold text-slate-900">{p.name}</h3>
                  <p className="mt-1 text-xs text-slate-500 line-clamp-1">{p.tagline}</p>
                  <p className="mt-3 text-2xl font-black text-slate-900">
                    {formatVnd(billingCycle === 'annual' ? p.annual_monthly_equivalent_vnd : p.monthly_price_vnd)}
                    <span className="text-xs font-normal text-slate-500">/tháng</span>
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    {p.max_users >= 9999 ? 'Không giới hạn nhân sự' : `${p.max_users} nhân sự (${p.max_sales ?? 20} Sale / ${p.max_managers ?? 5} QL)`} • {p.monthly_lead_quota.toLocaleString('vi-VN')} lead/th
                  </p>
                  <ul className="mt-3.5 space-y-2 text-xs text-slate-600">
                    {(p.features || []).map((f, idx) => (
                      <li key={idx} className="flex items-start gap-1.5 leading-snug">
                        <Check className="h-3.5 w-3.5 text-[#1E40FF] shrink-0 mt-0.5" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mt-5 grid grid-cols-1 gap-2">
                  <button
                    type="button"
                    disabled={busyKey === `plan_${p.code}`}
                    onClick={() => {
                      if (isDowngrade) {
                        setDowngradePlanCode(p.code);
                      } else if (p.is_enterprise_upgrade && sub?.is_in_trial) {
                        void handleSwitchOrSubscribe(p.code);
                      } else {
                        void handleSwitchOrSubscribe(p.code);
                      }
                    }}
                    className="btn-inkica-primary min-h-[44px] w-full rounded-xl py-2.5 text-xs font-semibold text-white shadow-sm hover:opacity-95 transition flex items-center justify-center gap-1.5"
                  >
                    {busyKey === `plan_${p.code}` && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                    <span>{payLabel}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Quick Topup + Custom Topup + VietQR Section */}
      <div data-tour="billing-topup" className="inkica-glass-card rounded-2xl border border-slate-200 bg-white p-5 space-y-4">
        <div>
          <h2 className="mb-1 text-sm font-bold text-slate-900">Nạp Ví Thanh Toán Nhanh &amp; Tùy Chỉnh (VietQR)</h2>
          <p className="text-xs text-slate-500">
            Hỗ trợ gói Topup sẵn hoặc nhập số tiền bất kỳ ({formatVnd(minTopupVnd)} – {formatVnd(maxTopupVnd)}).
          </p>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {topups.map((tp) => (
            <button
              key={tp.id}
              type="button"
              disabled={busyKey === tp.id}
              onClick={() => void handleTopup(tp.id)}
              className="min-h-[44px] rounded-2xl border border-slate-200 bg-slate-50/70 p-4 text-left transition hover:border-[#1E40FF] hover:bg-blue-50/30 cursor-pointer"
            >
              <p className="text-xs font-bold text-slate-900">{tp.label}</p>
              <p className="mt-1 text-lg font-extrabold text-[#1E40FF]">{formatVnd(tp.amount_vnd)}</p>
              <p className="mt-1 text-[11px] text-slate-500">{tp.equivalent_months_note}</p>
            </button>
          ))}
        </div>

        {/* Custom Topup Amount */}
        <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3.5 flex flex-col sm:flex-row sm:items-center gap-2.5">
          <div className="flex-1 min-w-0">
            <label className="block text-[11px] font-bold text-slate-700 mb-1">
              Hoặc nhập số tiền nạp tùy chỉnh (VNĐ):
            </label>
            <input
              type="number"
              min={minTopupVnd}
              max={maxTopupVnd}
              step={50000}
              value={customAmountInput}
              onChange={(e) => setCustomAmountInput(e.target.value)}
              className="w-full min-h-[44px] rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-900"
            />
          </div>
          <button
            type="button"
            disabled={busyKey === 'custom_topup'}
            onClick={() => void handleTopup(undefined, Number(customAmountInput))}
            className="min-h-[44px] w-full sm:w-auto sm:mt-5 rounded-xl bg-[#1E40FF] hover:bg-[#1E3A8A] px-5 py-2.5 text-xs font-bold text-white inline-flex items-center justify-center gap-1.5 shrink-0 cursor-pointer"
          >
            <QrCode className="h-4 w-4" />
            <span>Tạo mã VietQR nạp ví</span>
          </button>
        </div>

        {/* VietQR Pending Payment Card */}
        {pendingOrder && (
          <div className="rounded-2xl border border-blue-200 bg-[#F4F8FF] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 min-w-0">
              <img
                src={pendingOrder.qr_url}
                alt={`VietQR thanh toán ${pendingOrder.reference_code}`}
                className="w-32 h-32 rounded-xl border border-blue-200 bg-white object-contain p-1.5 shrink-0"
              />
              <div className="space-y-1 min-w-0">
                <div className="text-sm font-extrabold text-slate-900">{pendingOrder.label}</div>
                <div className="text-slate-600">
                  Ngân hàng: <strong>{pendingOrder.bank_info.bank_name}</strong> • STK:{' '}
                  <strong className="font-mono text-slate-900">{pendingOrder.bank_info.account_number}</strong>
                </div>
                <div className="text-slate-600">
                  Chủ TK: <strong>{pendingOrder.bank_info.account_holder}</strong>
                </div>
                <div className="text-slate-700">
                  Số tiền: <strong className="text-[#1E40FF]">{formatVnd(pendingOrder.amount_vnd)}</strong> • Nội dung CK:{' '}
                  <strong className="font-mono text-emerald-700 break-all">{pendingOrder.reference_code}</strong>
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                navigator.clipboard?.writeText(pendingOrder.reference_code).catch(() => {});
                setCopiedRef(true);
                setTimeout(() => setCopiedRef(false), 1800);
              }}
              className="min-h-[44px] w-full sm:w-auto rounded-xl bg-[#1E40FF] text-white px-4 py-2 font-bold inline-flex items-center justify-center gap-1.5 shrink-0 cursor-pointer"
            >
              {copiedRef ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              <span>{copiedRef ? 'Đã sao chép mã' : 'Copy Nội Dung CK'}</span>
            </button>
          </div>
        )}
      </div>

      {/* Transaction History */}
      {(overview?.transactions || []).length > 0 && (
        <div className="inkica-glass-card overflow-hidden rounded-2xl border border-slate-200 bg-white p-5">
          <h2 className="mb-3 text-sm font-bold text-slate-900">Lịch Sử Giao Dịch Gói Cước &amp; Ví</h2>
          <div className="space-y-2 text-xs">
            {(overview?.transactions || []).slice(0, 10).map((tx) => (
              <div key={tx.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 rounded-xl bg-slate-50 px-3.5 py-2.5">
                <div className="min-w-0">
                  <p className="font-semibold text-slate-900 truncate">{tx.note || tx.tx_type}</p>
                  <p className="font-mono text-[11px] text-slate-500 truncate">{tx.reference_code || tx.payment_method}</p>
                </div>
                <div className="flex sm:flex-col items-center sm:items-end justify-between gap-2 shrink-0">
                  <p className="font-bold text-[#1E40FF]">{formatVnd(tx.amount_vnd)}</p>
                  <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-semibold text-[#1E40FF]">
                    {tx.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Downgrade Schedule vs Immediate Modal */}
      {downgradePlanCode && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-[150] bg-slate-900/50 flex items-end sm:items-center justify-center p-0 sm:p-4"
          onClick={() => setDowngradePlanCode(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-t-[26px] sm:rounded-3xl bg-white border border-slate-200 p-5 space-y-4 shadow-2xl"
          >
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-base font-bold text-slate-900">Chuyển / Hạ Gói Dịch Vụ</h3>
              <button
                type="button"
                onClick={() => setDowngradePlanCode(null)}
                className="w-11 h-11 sm:w-9 sm:h-9 rounded-full border border-slate-200 flex items-center justify-center text-slate-500"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Bạn đang chuyển sang gói <strong>{formatPlanDisplayName(downgradePlanCode)}</strong>. Nên chọn chuyển vào cuối chu kỳ để giữ nguyên quyền lợi đã thanh toán.
            </p>
            <div className="grid grid-cols-1 gap-2">
              <button
                type="button"
                onClick={() => void handleSwitchOrSubscribe(downgradePlanCode, { scheduleAtPeriodEnd: true })}
                className="min-h-[44px] w-full rounded-xl bg-[#1E40FF] text-white text-xs font-bold px-4 py-2.5"
              >
                Chuyển vào cuối chu kỳ (Khuyên dùng)
              </button>
              <button
                type="button"
                onClick={() => void handleSwitchOrSubscribe(downgradePlanCode, { scheduleAtPeriodEnd: false })}
                className="min-h-[44px] w-full rounded-xl border border-slate-200 bg-slate-50 text-slate-700 text-xs font-semibold px-4 py-2.5"
              >
                Hạ gói ngay lập tức (Kiểm tra giới hạn nhân sự)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Subscription Modal */}
      {cancelModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-[150] bg-slate-900/50 flex items-end sm:items-center justify-center p-0 sm:p-4"
          onClick={() => setCancelModalOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-t-[26px] sm:rounded-3xl bg-white border border-slate-200 p-5 space-y-4 shadow-2xl"
          >
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-base font-bold text-slate-900">Hủy Gia Hạn / Hủy Gói</h3>
              <button
                type="button"
                onClick={() => setCancelModalOpen(false)}
                className="w-11 h-11 sm:w-9 sm:h-9 rounded-full border border-slate-200 flex items-center justify-center text-slate-500"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Chọn hủy tự động gia hạn cuối chu kỳ (vẫn sử dụng bình thường đến hết hạn) hoặc hủy ngay lập tức.
            </p>
            <input
              type="text"
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="Lý do (tùy chọn)..."
              className="w-full min-h-[44px] rounded-xl border border-slate-200 px-3.5 py-2 text-xs"
            />
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                disabled={busyKey !== null}
                onClick={() => void handleCancelSubscription(false)}
                className="min-h-[44px] rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold px-3 py-2"
              >
                Hủy cuối chu kỳ
              </button>
              <button
                type="button"
                disabled={busyKey !== null}
                onClick={() => void handleCancelSubscription(true)}
                className="min-h-[44px] rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold px-3 py-2"
              >
                Hủy ngay lập tức
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
