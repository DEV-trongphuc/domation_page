import React, { useState } from 'react';
import { ArrowRight, Check, CheckCircle2, Layers, Shield, Sparkles } from 'lucide-react';
import { DOMATION_SAAS_PLANS } from '../../data/enterpriseData';
import { DEPLOYMENT_MODE_COMPARISON } from './automationShowcaseData';

interface AutomationModeComparisonSectionProps {
  onOpenContact: (topic?: string) => void;
}

export const AutomationModeComparisonSection: React.FC<AutomationModeComparisonSectionProps> = ({
  onOpenContact,
}) => {
  const [billing, setBilling] = useState<'monthly' | 'yearly'>('yearly');

  return (
    <section
      id="pricing-modes"
      className="scroll-mt-24 py-12 sm:py-16 px-4 sm:px-6 lg:px-8 relative z-10"
    >
      <div className="max-w-7xl mx-auto space-y-12">
        {/* Part 1: 3-Mode Scale Path */}
        <div className="rounded-[28px] bg-white/92 backdrop-blur-xl border border-slate-200/90 shadow-[0_22px_58px_-28px_rgba(30,64,255,0.16)] p-5 sm:p-8 lg:p-10 space-y-6">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
            <div className="space-y-2 max-w-2xl">
              <div className="ql-eyebrow">
                <Layers className="w-3.5 h-3.5 text-[#1E40FF] shrink-0" />
                <span>CHỌN DÙNG ĐỘC LẬP HOẶC HỢP NHẤT TOÀN HỆ SINH THÁI</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight leading-snug">
                Khởi Đầu Nhanh Với{' '}
                <span className="text-gradient-inkica">App Automation Độc Lập</span> — Lớn Lên Bật
                Thêm CRM &amp; ERP
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Khác biệt hoàn toàn với việc chắp vá nhiều phần mềm rời rạc: Toàn bộ Marketing
                Automation, Auto Chia Data Sale và ERP 5.0 chạy trên cùng lõi Multi-Tenant PostgreSQL
                RLS, nâng cấp 1 chạm không mất 1 dòng dữ liệu.
              </p>
            </div>

            <div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-bold text-emerald-700 shrink-0 self-start lg:self-auto">
              <Shield className="w-4 h-4 shrink-0" />
              <span>Zero Migration • 1 Click Scale</span>
            </div>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-200/90 bg-white">
            <table className="w-full min-w-[680px] text-left border-collapse">
              <thead>
                <tr className="bg-[#F8FAFF] border-b border-slate-200 text-xs font-bold text-slate-700">
                  <th className="py-3.5 px-4 w-[24%]">Năng lực hệ thống</th>
                  <th className="py-3.5 px-4 w-[25%] text-[#1E40FF]">
                    Standalone Marketing
                    <span className="block text-[10px] font-semibold text-slate-500 mt-0.5">
                      App Marketing độc lập (0 menu ERP)
                    </span>
                  </th>
                  <th className="py-3.5 px-4 w-[26%] text-[#0284C7]">
                    Growth Suite (Auto Data + CAPI)
                    <span className="block text-[10px] font-semibold text-slate-500 mt-0.5">
                      Kết nối Sale Round &amp; Meta Ads
                    </span>
                  </th>
                  <th className="py-3.5 px-4 w-[25%] text-slate-900">
                    DOM PROMAX ERP 5.0
                    <span className="block text-[10px] font-semibold text-slate-500 mt-0.5">
                      Hợp nhất 12 phân hệ doanh nghiệp
                    </span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/80 text-xs sm:text-[13px] text-slate-700">
                {DEPLOYMENT_MODE_COMPARISON.map((row) => (
                  <tr key={row.capability} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 font-bold text-slate-900">{row.capability}</td>
                    <td className="py-3 px-4 font-medium">{row.standalone}</td>
                    <td className="py-3 px-4 font-medium text-[#0284C7]">{row.growthCombo}</td>
                    <td className="py-3 px-4 font-medium">{row.domPromax}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Part 2: Transparent SaaS Pricing Plans */}
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div className="space-y-2 max-w-2xl">
              <div className="ql-eyebrow">
                <Sparkles className="w-3.5 h-3.5 text-[#1E40FF] shrink-0" />
                <span>BẢNG GIÁ NIÊM YẾT MINH BẠCH • DÙNG THỬ MIỄN PHÍ 30 NGÀY</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
                Linh Hoạt Theo Quy Mô{' '}
                <span className="text-gradient-inkica">Đội Ngũ Marketing &amp; Sale</span>
              </h2>
            </div>

            <div className="inline-flex p-1 rounded-full bg-white border border-slate-200/90 shadow-2xs self-start sm:self-auto">
              <button
                type="button"
                onClick={() => setBilling('monthly')}
                className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                  billing === 'monthly'
                    ? 'bg-[#1E40FF] text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Theo tháng
              </button>
              <button
                type="button"
                onClick={() => setBilling('yearly')}
                className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                  billing === 'yearly'
                    ? 'bg-[#1E40FF] text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Theo năm (-15%)
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
            {DOMATION_SAAS_PLANS.map((plan) => (
              <div
                key={plan.name}
                className={`rounded-[24px] p-5 sm:p-6 border flex flex-col justify-between gap-5 transition-all ${
                  plan.popular
                    ? 'bg-gradient-to-b from-[#1E40FF] to-[#0284C7] text-white border-[#1E40FF] shadow-[0_22px_52px_-20px_rgba(30,64,255,0.45)]'
                    : 'bg-white/95 border-slate-200/90 text-slate-900 shadow-xs hover:border-blue-300'
                }`}
              >
                <div className="space-y-4">
                  <span
                    className={`inline-block text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full ${
                      plan.popular
                        ? 'bg-white/20 text-white border border-white/30'
                        : 'bg-blue-50 text-[#1E40FF] border border-blue-200/80'
                    }`}
                  >
                    {plan.badge}
                  </span>

                  <div>
                    <h3 className="text-lg font-bold leading-snug">{plan.name}</h3>
                    <div className="mt-2 flex items-baseline gap-1.5">
                      <span className="text-2xl sm:text-[26px] font-extrabold tabular-nums">
                        {billing === 'yearly' ? plan.yearly : plan.monthly}
                      </span>
                      {plan.monthly !== 'May Đo' && (
                        <span
                          className={`text-xs font-medium ${
                            plan.popular ? 'text-blue-100' : 'text-slate-500'
                          }`}
                        >
                          /{billing === 'yearly' ? 'năm' : 'tháng'}
                        </span>
                      )}
                    </div>
                    <p
                      className={`mt-2 text-xs leading-relaxed ${
                        plan.popular ? 'text-blue-50' : 'text-slate-600'
                      }`}
                    >
                      {plan.desc}
                    </p>
                  </div>

                  <ul className="space-y-2 pt-2 border-t border-current/15">
                    {plan.features.map((feat) => (
                      <li key={feat} className="flex items-start gap-2 text-xs leading-snug">
                        {plan.popular ? (
                          <CheckCircle2 className="w-4 h-4 text-cyan-200 shrink-0 mt-0.5" />
                        ) : (
                          <Check className="w-4 h-4 text-[#1E40FF] shrink-0 mt-0.5" />
                        )}
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <button
                  type="button"
                  onClick={() => onOpenContact(`Đăng ký gói ${plan.name}`)}
                  className={`w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    plan.popular
                      ? 'bg-white text-[#1E40FF] hover:bg-blue-50 shadow-sm'
                      : 'btn-inkica-primary'
                  }`}
                >
                  <span>Nhận Tư Vấn &amp; Demo</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
