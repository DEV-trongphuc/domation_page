import React from 'react';
import { Award, Sparkles } from 'lucide-react';
import {
  ECOSYSTEM_PARTNERS,
  F1_AGENCY_PARTNERS,
  FLAGSHIP_PARTNERS,
} from '../data/enterpriseData';

export const PartnersTrustSection: React.FC = () => {
  return (
    <section id="partners" className="relative py-20 sm:py-26 px-4 sm:px-6 overflow-hidden">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10 sm:mb-12">
          <div className="max-w-2xl">
            <div className="ql-eyebrow mb-3">
              <Award className="w-3.5 h-3.5 text-[#1E40FF]" />
              <span>ĐỐI TÁC CHIẾN LƯỢC &amp; MẠNG LƯỚI ĐẠI LÝ F1</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 leading-[1.25] tracking-tight">
              Đồng Hành Cùng{' '}
              <span className="text-gradient-inkica">Chủ Đầu Tư &amp; Doanh Nghiệp Dẫn Đầu</span>
            </h2>
          </div>
          <p className="text-sm text-slate-600 max-w-md leading-relaxed">
            Hạ tầng may đo vận hành thực tế cho Chủ đầu tư, nền tảng AI quốc tế và hệ thống sàn phân phối.
          </p>
        </div>

        {/* Flagship Strategic Partners — Clean Minimalist Rows */}
        <div className="rounded-[28px] bg-white/80 backdrop-blur-xl border border-slate-200/80 shadow-sm divide-y divide-slate-200/75 overflow-hidden mb-7">
          {FLAGSHIP_PARTNERS.map((partner) => {
            const isInkica = partner.id === 'inkica';
            return (
              <div
                key={partner.id}
                className="p-6 sm:p-8 grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-8 items-center hover:bg-slate-50/60 transition-colors"
              >
                {/* Logo & Name */}
                <div className="lg:col-span-4 flex items-center gap-4">
                  <div className="h-16 w-40 sm:w-44 px-3 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-center justify-center gap-2 shrink-0 overflow-hidden">
                    <img
                      src={partner.logo}
                      alt={partner.name}
                      loading="lazy"
                      className={
                        partner.id === 'ideas-business'
                          ? 'h-11 max-w-[138px] object-contain'
                          : partner.id === 'richland'
                            ? 'h-10 max-w-[120px] object-contain'
                            : 'h-9 max-w-[125px] object-contain'
                      }
                    />
                    {isInkica && (
                      <span className="text-base font-bold tracking-tight text-slate-900 select-none">
                        inkica<span className="text-[#1E40FF]">.</span>
                      </span>
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="text-[10px] font-semibold uppercase tracking-wider text-[#1E40FF]">
                      {partner.badge}
                    </div>
                    <h3 className="text-base font-semibold text-slate-900 leading-snug mt-0.5">
                      {partner.name}
                    </h3>
                  </div>
                </div>

                {/* Concise 1-Sentence Story */}
                <div className="lg:col-span-5">
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                    {partner.subtitle}
                  </p>
                </div>

                {/* Crisp Pills */}
                <div className="lg:col-span-3 flex flex-wrap items-center lg:justify-end gap-2">
                  {partner.metrics.map((metric) => (
                    <span
                      key={metric}
                      className="px-2.5 py-1 rounded-full bg-slate-100 text-[11px] font-medium text-slate-700"
                    >
                      {metric}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* 3 F1 Distribution Network Strip */}
        <div className="rounded-[24px] bg-white/75 backdrop-blur-xl border border-slate-200/80 p-5 sm:p-7">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-5 pb-3.5 border-b border-slate-200/70">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-800">
              <Sparkles className="w-4 h-4 text-[#1E40FF]" />
              <span>Mạng Lưới 3 Đại Lý F1 • Chia Số Tự Động Công Bằng</span>
            </div>
            <span className="text-[11px] font-medium text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full w-fit">
              Tỷ lệ 1 : 1 : 1 • Độ lệch ~ 0%
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-slate-200/75">
            {F1_AGENCY_PARTNERS.map((f1, i) => (
              <div
                key={f1.id}
                className={`flex items-center gap-3.5 py-3.5 md:py-0 ${
                  i === 0 ? 'md:pr-6' : i === 1 ? 'md:px-6' : 'md:pl-6'
                }`}
              >
                <div className="w-12 h-12 rounded-xl bg-white border border-slate-200/80 p-1.5 flex items-center justify-center shrink-0">
                  <img
                    src={f1.logo}
                    alt={f1.name}
                    loading="lazy"
                    className="max-w-full max-h-full object-contain"
                  />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-semibold text-slate-900 truncate">{f1.name}</div>
                  <div className="text-[11px] font-medium text-[#1E40FF] mt-0.5">{f1.routeMetric}</div>
                  <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">{f1.note}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Ecosystem Brand Logos — All Cooperating Enterprises */}
        <div className="mt-7 rounded-[24px] bg-white/80 backdrop-blur-xl border border-slate-200/80 p-5 sm:p-7">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-5 pb-3.5 border-b border-slate-200/70">
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-800">
              CÁC DOANH NGHIỆP &amp; THƯƠNG HIỆU ĐÃ HỢP TÁC
            </div>
            <span className="text-[11px] font-medium text-slate-500">
              {ECOSYSTEM_PARTNERS.length}+ Thương hiệu Đa Ngành (F&amp;B • BĐS • Giáo dục • Y tế • Bán lẻ)
            </span>
          </div>

          <div className="flex flex-wrap justify-center gap-3">
            {ECOSYSTEM_PARTNERS.map((brand) => (
              <a
                key={brand.name}
                href={brand.website}
                target="_blank"
                rel="noopener noreferrer"
                title={`${brand.name} • ${brand.industry}`}
                className="w-[calc(50%-6px)] sm:w-[calc(25%-9px)] md:w-[calc(16.666667%-10px)] group rounded-2xl bg-slate-50/75 hover:bg-white border border-slate-200/75 hover:border-blue-200 p-3.5 flex flex-col items-center justify-center text-center gap-2 transition-all hover:shadow-xs"
              >
                <div className="h-10 w-full flex items-center justify-center">
                  <img
                    src={brand.image}
                    alt={brand.name}
                    loading="lazy"
                    className="max-h-9 max-w-[110px] w-auto object-contain grayscale-[15%] group-hover:grayscale-0 transition-all"
                  />
                </div>
                <span className="text-[11px] font-semibold text-slate-700 group-hover:text-[#1E40FF] truncate w-full">
                  {brand.name}
                </span>
              </a>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
