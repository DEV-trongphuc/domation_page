import React, { useState } from 'react';
import {
  Activity,
  ArrowRight,
  CheckCircle2,
  Megaphone,
  RefreshCw,
  ShieldCheck,
  Zap,
} from 'lucide-react';

export interface ClosedLoopCockpitMetrics {
  spendVnd?: number;
  adLeads?: number;
  crmAttributedLeads?: number;
  qualifiedLeads?: number;
  closedRevenueVnd?: number;
  capiSentCount?: number;
  blockedJunkCount?: number;
}

interface ClosedLoopFlywheelCockpitProps {
  metrics?: ClosedLoopCockpitMetrics;
  compact?: boolean;
  onOpenCampaigns?: () => void;
  onOpenRouting?: () => void;
  onOpenAttribution?: () => void;
  onOpenCapi?: () => void;
}

function fmtCompactVnd(n: number): string {
  if (!Number.isFinite(n) || n <= 0) return '0₫';
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)} Tỷ`;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)} Tr`;
  return `${Math.round(n).toLocaleString('vi-VN')}₫`;
}

export const ClosedLoopFlywheelCockpit: React.FC<ClosedLoopFlywheelCockpitProps> = ({
  metrics,
  compact = false,
  onOpenCampaigns,
  onOpenRouting,
  onOpenAttribution,
  onOpenCapi,
}) => {
  const [selectedStage, setSelectedStage] = useState<'ads' | 'routing' | 'crm' | 'capi'>('ads');

  const spendVnd = metrics?.spendVnd ?? 0;
  const adLeads = metrics?.adLeads ?? 0;
  const crmAttributedLeads = metrics?.crmAttributedLeads ?? adLeads;
  const qualifiedLeads = metrics?.qualifiedLeads ?? 0;
  const closedRevenueVnd = metrics?.closedRevenueVnd ?? 0;
  const capiSentCount = metrics?.capiSentCount ?? qualifiedLeads;
  const blockedJunkCount = metrics?.blockedJunkCount ?? 0;

  const stages = [
    {
      id: 'ads' as const,
      step: '01',
      title: 'Meta & Google Ads',
      primaryVal: fmtCompactVnd(spendVnd),
      subVal: `${adLeads.toLocaleString('vi-VN')} Lead đổ về`,
      detail:
        'Thu thập tín hiệu từng chiến dịch, nhóm, bài QC theo thời gian thực (Meta Graph v25.0 & Google Ads).',
      ctaLabel: 'Xem Chiến dịch QC',
      onAction: onOpenCampaigns,
      icon: <Megaphone className="w-4 h-4" />,
      tone: 'text-[#1E40FF] bg-blue-50 border-blue-200',
    },
    {
      id: 'routing' as const,
      step: '02',
      title: 'Auto-Router Tức Thì',
      primaryVal: 'Tức thì',
      subVal: '120s SLA • Hoàn 1:1',
      detail:
        'Lọc trùng 180 ngày (6 tháng), chống trễ SLA 120s tự thu hồi và đền bù ticket sai số tỷ lệ 1:1.',
      ctaLabel: 'Mở Vòng chia số',
      onAction: onOpenRouting,
      icon: <Zap className="w-4 h-4" />,
      tone: 'text-amber-700 bg-amber-50 border-amber-200',
    },
    {
      id: 'crm' as const,
      step: '03',
      title: 'Pipeline CRM 9 Tầng',
      primaryVal: `${crmAttributedLeads.toLocaleString('vi-VN')} Lead`,
      subVal:
        closedRevenueVnd > 0
          ? `Doanh thu ${fmtCompactVnd(closedRevenueVnd)}`
          : `${qualifiedLeads.toLocaleString('vi-VN')} Qualified`,
      detail:
        'Đối chiếu từng khách hàng từ trạng thái Qualified, Đặt cọc đến Chốt đơn thật để tính CPQL & ROAS chuẩn xác.',
      ctaLabel: 'Đối chiếu Lead CRM',
      onAction: onOpenAttribution,
      icon: <Activity className="w-4 h-4" />,
      tone: 'text-emerald-700 bg-emerald-50 border-emerald-200',
    },
    {
      id: 'capi' as const,
      step: '04',
      title: 'Meta CAPI SHA-256',
      primaryVal: `${capiSentCount.toLocaleString('vi-VN')} Events`,
      subVal: blockedJunkCount > 0 ? `Chặn ${blockedJunkCount} rác` : 'Học tệp chuẩn',
      detail:
        'Băm SHA-256 thông tin khách đạt chuẩn gửi ngược về Meta CAPI (Lead, Purchase) và loại bỏ Spam/Notlead (DisqualifiedLead).',
      ctaLabel: 'Cấu hình Meta CAPI',
      onAction: onOpenCapi,
      icon: <ShieldCheck className="w-4 h-4" />,
      tone: 'text-indigo-700 bg-indigo-50 border-indigo-200',
    },
  ];

  const activeNode = stages.find((s) => s.id === selectedStage) || stages[0];

  return (
    <section
      data-tour="closed-loop-cockpit"
      className={`rounded-2xl border border-blue-200/75 bg-gradient-to-br from-white via-[#F8FAFF] to-blue-50/45 shadow-xs ${
        compact ? 'p-3.5 sm:p-4 space-y-3' : 'p-4 sm:p-5 space-y-4'
      }`}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="w-8 h-8 rounded-xl bg-[#1E40FF] text-white flex items-center justify-center shrink-0">
            <RefreshCw className="w-4 h-4" />
          </span>
          <div className="min-w-0">
            <div className="text-[10px] font-extrabold uppercase tracking-wider text-[#1E40FF]">
              CLOSED-LOOP FLYWHEEL COCKPIT
            </div>
            <h3 className="text-xs sm:text-sm font-bold text-slate-900 truncate">
              Vòng Tròn Tối Ưu: Ads → Auto-Router Tức Thì → CRM → Meta CAPI SHA-256
            </h3>
          </div>
        </div>
        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-1 text-[10px] font-bold text-emerald-700 shrink-0">
          <CheckCircle2 className="w-3 h-3" />
          <span>Đồng bộ Real-time</span>
        </span>
      </div>

      {/* 4 Stage Cards: 2x2 on mobile, 4-col on desktop */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
        {stages.map((st) => {
          const isActive = st.id === selectedStage;
          return (
            <button
              key={st.id}
              type="button"
              aria-pressed={isActive}
              onClick={() => setSelectedStage(st.id)}
              className={`rounded-xl border p-2.5 sm:p-3 text-left transition-all cursor-pointer min-w-0 ${
                isActive
                  ? 'border-[#1E40FF] bg-white ring-2 ring-blue-100 shadow-sm'
                  : 'border-slate-200/80 bg-white/85 hover:border-blue-300'
              }`}
            >
              <div className="flex items-center justify-between gap-1.5 mb-1.5">
                <span className={`inline-flex items-center gap-1 rounded-lg border px-1.5 py-0.5 text-[10px] font-extrabold ${st.tone}`}>
                  {st.icon}
                  <span>{st.step}</span>
                </span>
                {st.onAction && (
                  <ArrowRight className="w-3.5 h-3.5 text-slate-400 shrink-0 hidden sm:inline" />
                )}
              </div>
              <div className="text-[11px] font-bold text-slate-700 truncate">{st.title}</div>
              <div className="text-xs sm:text-sm font-black text-slate-900 truncate mt-0.5">
                {st.primaryVal}
              </div>
              <div className="text-[10px] text-slate-500 truncate">{st.subVal}</div>
            </button>
          );
        })}
      </div>

      {/* Active Stage Detail & Single Primary Action */}
      <div className="rounded-xl border border-slate-200/85 bg-white px-3.5 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div className="min-w-0">
          <div className="text-xs font-bold text-slate-900">
            {activeNode.step}. {activeNode.title}
          </div>
          <p className="text-[11px] sm:text-xs text-slate-600 leading-relaxed mt-0.5">
            {activeNode.detail}
          </p>
        </div>
        {activeNode.onAction && (
          <button
            type="button"
            onClick={activeNode.onAction}
            className="min-h-[44px] w-full sm:w-auto inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#1E40FF] hover:bg-[#1E3A8A] px-4 py-2 text-xs font-bold text-white shrink-0 cursor-pointer"
          >
            <span>{activeNode.ctaLabel}</span>
            <ArrowRight className="w-3.5 h-3.5 shrink-0" />
          </button>
        )}
      </div>
    </section>
  );
};
