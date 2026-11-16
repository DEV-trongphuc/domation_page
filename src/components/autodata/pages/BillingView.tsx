import React, { useCallback, useEffect, useState } from 'react';
import { ArrowUpRight, Check, CreditCard, RefreshCw, Sparkles, Wallet } from 'lucide-react';
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

interface BillingOverviewResponse {
  catalog?: ClientBillingCatalog;
  subscription?: ClientSubscriptionSnapshot;
  transactions?: BillingTransactionRow[];
}

export interface BillingViewProps {
  token: string;
  tenantSlug: string;
  catalog?: ClientBillingCatalog;
  hideHeaderCard?: boolean;
}

export const formatPlanDisplayName = (
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
    standard_yearly: 'Standard • Chu kỳ Năm',
    standard_annual: 'Standard • Chu kỳ Năm',
    standard_monthly: 'Standard • Theo Tháng',
    standard: 'Standard • Tiêu chuẩn',
    autodata_standard: 'Standard • Tiêu chuẩn',
    pro_yearly: 'Pro • Chu kỳ Năm',
    pro_annual: 'Pro • Chu kỳ Năm',
    pro_monthly: 'Pro • Theo Tháng',
    pro: 'Pro • Tăng trưởng',
    scale_pro: 'Scale Pro • Chuyên sâu',
    autodata_growth: 'Pro • Mở rộng',
    growth: 'Pro • Tăng trưởng',
    trial: 'Gói Dùng Thử',
    trial_1m: 'Gói Dùng Thử (30 ngày)',
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

export const formatTierLabel = (tier?: string | null): string => {
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

export const BillingView: React.FC<BillingViewProps> = ({
  token,
  tenantSlug,
  catalog,
  hideHeaderCard = false,
}) => {
  const [overview, setOverview] = useState<BillingOverviewResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<string | null>(null);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('annual');

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

  const activeCatalog = overview?.catalog || catalog || DEFAULT_CLIENT_CATALOG;
  const sub = overview?.subscription;
  const plans = activeCatalog.plans || [];
  const topups = activeCatalog.topup_packages || [];

  const handleTopup = async (packageId: string) => {
    try {
      await apiRequest('/billing/topup', {
        method: 'POST',
        token,
        tenantSlug,
        body: { package_id: packageId },
      });
      setToast('Đã tạo yêu cầu nạp ví. Vui lòng chuyển khoản theo mã giao dịch.');
      void reload();
    } catch (err: unknown) {
      setToast(getErrorMessage(err, 'Không thể tạo lệnh nạp ví.'));
    }
  };

  const handleSubscribe = async (planCode: string) => {
    try {
      await apiRequest('/billing/subscribe', {
        method: 'POST',
        token,
        tenantSlug,
        body: { plan_code: planCode, billing_cycle: billingCycle, payment_method: 'wallet' },
      });
      setToast('Đã gia hạn / kích hoạt gói thành công.');
      void reload();
    } catch (err: unknown) {
      setToast(getErrorMessage(err, 'Số dư ví chưa đủ hoặc không thể kích hoạt gói.'));
    }
  };

  const handleUpgradeCrm = async () => {
    try {
      await apiRequest('/billing/upgrade-request', {
        method: 'POST',
        token,
        tenantSlug,
        body: { target_suite: 'domation_crm_erp', note: 'Nâng cấp từ Auto Data lên DOMATION CRM 360° / ERP 5.0' },
      });
      setToast('Đã gửi yêu cầu nâng cấp liền mạch lên DOMATION CRM 360° / ERP 5.0.');
      void reload();
    } catch (err: unknown) {
      setToast(getErrorMessage(err, 'Không thể gửi yêu cầu nâng cấp.'));
    }
  };

  return (
    <div className="space-y-6">
      {!hideHeaderCard ? (
        <div className="inkica-glass-card flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4">
          <div className="flex items-center gap-2.5">
            <CreditCard className="h-5 w-5 text-[#1E40FF]" />
            <div>
              <h1 className="text-lg font-bold text-slate-900">Gói Cước, Hạn Mức & Ví Thanh Toán</h1>
              <p className="text-xs text-slate-500">Mặc định dùng thử 1 tháng (30 ngày) 0₫ • Nâng cấp liền mạch lên CRM 360° & ERP 5.0</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => void reload()}
            className="rounded-xl border border-slate-200 p-2 hover:bg-slate-50 transition"
            title="Làm mới trạng thái gói cước"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      ) : (
        <div className="flex items-center justify-between border-b border-slate-100 pb-2 text-xs text-slate-500">
          <p>Mặc định dùng thử 30 ngày 0₫ • Nâng cấp liền mạch lên CRM 360° & ERP 5.0</p>
          <button
            type="button"
            onClick={() => void reload()}
            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} /> Làm mới
          </button>
        </div>
      )}

      {toast && (
        <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-2.5 text-xs font-semibold text-[#1E40FF]">
          {toast}
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {/* Card 1: Gói Hiện Tại */}
        <div className="inkica-glass-card flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5">
          <div>
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-slate-500">Gói Hiện Tại</p>
              <span
                className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                  sub?.is_expired
                    ? 'bg-red-50 text-red-600'
                    : sub?.is_in_trial
                    ? 'bg-amber-50 text-amber-700'
                    : 'bg-emerald-50 text-emerald-700'
                }`}
              >
                {sub?.is_expired
                  ? 'Hết hạn'
                  : sub?.is_in_trial
                  ? `Dùng thử (${sub?.days_remaining ?? 30} ngày)`
                  : 'Đang hoạt động'}
              </span>
            </div>
            <p className="mt-2 text-lg font-extrabold text-[#1E40FF] leading-snug">
              {formatPlanDisplayName(sub?.plan_code, sub?.plan_tier, sub?.plan_name)}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Phân hạng: <span className="font-semibold text-slate-700">{formatTierLabel(sub?.plan_tier)}</span>
              {sub?.billing_cycle ? ` • Chu kỳ: ${sub.billing_cycle === 'annual' ? 'Năm (-15%)' : 'Tháng'}` : ''}
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              document.querySelector('[data-tour="billing-catalog"]')?.scrollIntoView({ behavior: 'smooth' });
            }}
            className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-[#1E40FF] hover:underline cursor-pointer text-left"
          >
            Đổi gói cước <ArrowUpRight className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Card 2: Số Dư Ví */}
        <div className="inkica-glass-card flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5">
          <div>
            <p className="text-xs font-semibold text-slate-500">Số Dư Ví Gia Hạn</p>
            <p className="mt-2 flex items-center gap-2 text-2xl font-extrabold text-emerald-600">
              <Wallet className="h-5 w-5 text-emerald-600" /> {formatVnd(sub?.wallet_balance_vnd || 0)}
            </p>
            <p className="mt-1 text-xs text-slate-500">Ưu đãi -15% khi gia hạn chu kỳ Năm</p>
          </div>
          <button
            type="button"
            onClick={() => {
              document.querySelector('[data-tour="billing-topup"]')?.scrollIntoView({ behavior: 'smooth' });
            }}
            className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-emerald-700 hover:underline cursor-pointer text-left"
          >
            + Nạp tiền vào ví <ArrowUpRight className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Card 3: Hạn Mức Quota */}
        <div className="inkica-glass-card flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5">
          <div>
            <p className="text-xs font-semibold text-slate-500">Hạn Mức Vận Hành</p>
            <p className="mt-2 text-base font-extrabold text-slate-900">
              Tối đa {plans.find((p) => p.plan_tier === sub?.plan_tier)?.max_users ?? 25} nhân sự •{' '}
              {plans.find((p) => p.plan_tier === sub?.plan_tier)?.max_rounds ?? 5} Vòng chia
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Quota: {Number(plans.find((p) => p.plan_tier === sub?.plan_tier)?.monthly_lead_quota ?? 15000).toLocaleString('vi-VN')} lead/tháng
            </p>
          </div>
          <button
            type="button"
            onClick={() => void handleUpgradeCrm()}
            className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-[#0284C7] hover:underline text-left cursor-pointer"
          >
            <Sparkles className="h-3.5 w-3.5" /> Nâng cấp CRM 360° / ERP 5.0 <ArrowUpRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Package Catalog Cards */}
      <div data-tour="billing-catalog" className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900">Bảng Gói Dịch Vụ SaaS</h2>
            <p className="text-xs text-slate-500">Lựa chọn gói phù hợp quy mô đội ngũ</p>
          </div>
          <div className="flex rounded-xl bg-slate-100 p-1 text-xs font-semibold">
            <button
              type="button"
              onClick={() => setBillingCycle('monthly')}
              className={`rounded-lg px-3 py-1 transition ${
                billingCycle === 'monthly' ? 'bg-white text-[#1E40FF] shadow-sm font-bold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Theo Tháng
            </button>
            <button
              type="button"
              onClick={() => setBillingCycle('annual')}
              className={`rounded-lg px-3 py-1 transition ${
                billingCycle === 'annual' ? 'bg-white text-[#1E40FF] shadow-sm font-bold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Theo Năm (-15%)
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          {plans.map((p) => (
            <div
              key={p.code}
              className={`inkica-glass-card flex flex-col justify-between rounded-2xl border p-5 transition ${
                p.plan_tier === 'starter'
                  ? 'border-blue-200 bg-white hover:border-[#1E40FF]/50'
                  : p.plan_tier === 'growth'
                  ? 'border-indigo-200 bg-white hover:border-indigo-500/50'
                  : 'border-slate-300 bg-gradient-to-b from-white to-slate-50/50 hover:border-[#1E40FF]'
              }`}
            >
              <div>
                <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-[10px] font-bold text-[#1E40FF]">
                  {p.badge}
                </span>
                <h3 className="mt-2 text-base font-extrabold text-slate-900">{p.name}</h3>
                <p className="mt-1 text-xs text-slate-500 line-clamp-1">{p.tagline}</p>
                <p className="mt-3 text-2xl font-black text-slate-900">
                  {formatVnd(billingCycle === 'annual' ? p.annual_monthly_equivalent_vnd : p.monthly_price_vnd)}
                  <span className="text-xs font-normal text-slate-500">/tháng</span>
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
              <button
                type="button"
                onClick={() => void (p.is_enterprise_upgrade ? handleUpgradeCrm() : handleSubscribe(p.code))}
                className="btn-inkica-primary mt-5 w-full rounded-xl py-2.5 text-xs font-semibold text-white shadow-sm hover:opacity-95 transition"
              >
                {p.is_enterprise_upgrade ? 'Yêu cầu nâng cấp CRM / ERP' : 'Kích hoạt bằng Ví'}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Topup Section */}
      <div data-tour="billing-topup" className="inkica-glass-card rounded-2xl border border-slate-200 bg-white p-5">
        <h2 className="mb-1 text-sm font-bold text-slate-900">Nạp Ví Thanh Toán Nhanh</h2>
        <p className="mb-3 text-xs text-slate-500">Số dư ví dùng để tự động gia hạn gói cước hàng tháng hoặc hàng năm</p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {topups.map((tp) => (
            <button
              key={tp.id}
              type="button"
              onClick={() => void handleTopup(tp.id)}
              className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 text-left transition hover:border-[#1E40FF] hover:bg-blue-50/30"
            >
              <p className="text-xs font-bold text-slate-900">{tp.label}</p>
              <p className="mt-1 text-lg font-extrabold text-[#1E40FF]">{formatVnd(tp.amount_vnd)}</p>
              <p className="mt-1 text-[11px] text-slate-500">{tp.equivalent_months_note}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Transaction History */}
      {(overview?.transactions || []).length > 0 && (
        <div className="inkica-glass-card overflow-hidden rounded-2xl border border-slate-200 bg-white p-5">
          <h2 className="mb-3 text-sm font-bold text-slate-900">Lịch Sử Giao Dịch Gói Cước & Ví</h2>
          <div className="space-y-2 text-xs">
            {(overview?.transactions || []).slice(0, 10).map((tx) => (
              <div key={tx.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-slate-50 px-3.5 py-2.5">
                <div>
                  <p className="font-semibold text-slate-900">{tx.note || tx.tx_type}</p>
                  <p className="font-mono text-[11px] text-slate-500">{tx.reference_code || tx.payment_method}</p>
                </div>
                <div className="text-right">
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
    </div>
  );
};
