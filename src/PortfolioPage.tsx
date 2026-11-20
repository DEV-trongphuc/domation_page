import React, { useState } from 'react';
import {
  AlertCircle,
  ArrowRight,
  Award,
  BookOpen,
  Briefcase,
  CheckCircle2,
  Layers,
  MonitorSmartphone,
  Sparkles,
  Wrench,
} from 'lucide-react';
import { Navbar } from './Navbar';
import { ContactModal } from './ContactModal';
import { LuxuryGoldBackdrop } from './LuxuryGoldBackdrop';
import { DomationFooter } from './components/DomationFooter';
import { DomResponsiveSubtabs } from './components/dom-meta/DomMetaSelect';
import {
  type InspectionTabId,
  ProductInspectionModal,
} from './components/ProductInspectionModal';
import { ECOSYSTEM_PARTNERS } from './data/enterpriseData';
import { PORTFOLIO_PROJECTS } from './data/portfolioData';
import { handleSpaLinkClick } from './utils/navigation';
import { getPortfolioSeoConfig } from './data/boostRouteSeo';
import { usePageSeo } from './utils/seo';

const PORTFOLIO_CATEGORIES = [
  'Tất cả',
  'Bất Động Sản',
  'Giáo Dục & ERP',
  'F&B & Nhượng Quyền',
  'AI & Prepress 3D',
  'Y Tế & Nha Khoa',
  'E-Commerce & B2B',
] as const;

export const PortfolioPage: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>('Tất cả');
  const [contactOpen, setContactOpen] = useState(false);
  const [contactNote, setContactNote] = useState<string | undefined>(undefined);
  const [inspectionOpen, setInspectionOpen] = useState(false);
  const [inspectionTab, setInspectionTab] = useState<InspectionTabId>('web-3d');

  usePageSeo(getPortfolioSeoConfig());

  const filteredProjects =
    selectedCategory === 'Tất cả'
      ? PORTFOLIO_PROJECTS
      : PORTFOLIO_PROJECTS.filter((p) => p.category === selectedCategory);

  const openInspection = (tab: InspectionTabId) => {
    setInspectionTab(tab);
    setInspectionOpen(true);
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-slate-900 relative overflow-x-clip font-sans selection:bg-blue-600/20">
      <LuxuryGoldBackdrop />

      <Navbar
        activePage="portfolio"
        onOpenContact={() => {
          setContactNote(undefined);
          setContactOpen(true);
        }}
        onOpenShowcase={() => openInspection('web-3d')}
      />

      <main className="relative z-10 pt-24 sm:pt-28 pb-20 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto space-y-12">
          {/* Hero */}
          <section className="rounded-[28px] bg-white/90 backdrop-blur-2xl border border-slate-200/85 p-6 sm:p-10 shadow-[0_24px_64px_-24px_rgba(15,23,42,0.08)]">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              <div className="lg:col-span-7 space-y-4">
                <div className="ql-eyebrow">
                  <Briefcase className="w-3.5 h-3.5 text-[#1E40FF]" />
                  <span>PORTFOLIO TRIỂN KHAI THỰC TẾ • 30+ DOANH NGHIỆP ĐỐI TÁC</span>
                </div>
                <h1 className="text-3xl sm:text-4xl lg:text-[42px] font-extrabold text-slate-900 leading-[1.2] tracking-tight">
                  Portfolio Kiến Trúc May Đo &amp;{' '}
                  <span className="text-gradient-inkica">Case Study Đa Ngành</span>
                </h1>
                <p className="text-sm sm:text-base text-slate-600 leading-relaxed max-w-2xl">
                  Mỗi dự án trong Portfolio của DOMATION đi kèm đầy đủ: Bài toán ban đầu, Khó khăn thực tế khi triển khai, Kiến trúc kỹ thuật xử lý, Số liệu đo lường thật và bài phân tích chuyên sâu trên <strong className="text-slate-900">Blog DOMATION</strong>.
                </p>

                <div className="grid grid-cols-1 sm:flex sm:flex-wrap items-center gap-3 pt-2">
                  <a
                    href="/boost"
                    onClick={(e) => handleSpaLinkClick(e, '/boost')}
                    className="btn-inkica-primary min-h-[44px] px-5 py-3 text-xs sm:text-sm"
                  >
                    <BookOpen className="w-4 h-4" />
                    <span>Đọc Blog DOMATION</span>
                  </a>
                  <button
                    type="button"
                    onClick={() => openInspection('web-3d')}
                    className="ql-btn-outline min-h-[44px] px-5 py-3 text-xs sm:text-sm cursor-pointer"
                  >
                    <MonitorSmartphone className="w-4 h-4 text-[#1E40FF]" />
                    <span>Mở Thư Viện Màn Hình Thực Tế</span>
                  </button>
                </div>
              </div>

              <div className="lg:col-span-5">
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { num: '30+', label: 'Doanh nghiệp đồng hành' },
                    { num: '10', label: 'Flagship Case Study sâu' },
                    { num: '74+', label: 'Bài phân tích chuẩn SEO' },
                    { num: 'Tức thì', label: 'SLA Chia Lead thực chiến' },
                  ].map((stat) => (
                    <div
                      key={stat.label}
                      className="rounded-2xl bg-slate-50/90 border border-slate-200/80 p-4 text-center"
                    >
                      <div className="text-2xl sm:text-3xl font-black text-[#1E40FF]">
                        {stat.num}
                      </div>
                      <div className="text-xs font-semibold text-slate-600 mt-1">
                        {stat.label}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* Category Filter Pills (Mobile <=2 buttons/row + >=44px touch targets) */}
          <section className="space-y-6">
            <DomResponsiveSubtabs
              tabs={PORTFOLIO_CATEGORIES.map((cat) => ({
                id: cat,
                label: cat,
              }))}
              value={selectedCategory}
              onChange={setSelectedCategory}
              maxMobile={2}
              maxTablet={4}
              maxDesktop={7}
              moreLabel="Thêm ngành"
              className="[&>button]:min-h-[44px] sm:[&>button]:min-h-[40px]"
            />

            {/* Projects Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {filteredProjects.map((project) => (
                <article
                  key={project.id}
                  className="rounded-[26px] bg-white/90 backdrop-blur-xl border border-slate-200/85 shadow-sm overflow-hidden flex flex-col justify-between"
                >
                  <div>
                    {/* Preview Image */}
                    <div className="relative aspect-[16/9] bg-slate-100 border-b border-slate-200/75 overflow-hidden group">
                      <img
                        src={project.previewImage}
                        alt={project.name}
                        loading="lazy"
                        className="w-full h-full object-cover object-top group-hover:scale-[1.03] transition-transform duration-500"
                      />
                      <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
                        <span className="px-3 py-1 rounded-full bg-white/95 backdrop-blur-md border border-slate-200 text-[11px] font-bold text-[#1E40FF] shadow-xs">
                          {project.category}
                        </span>
                        <span className="px-2.5 py-1 rounded-full bg-slate-900/85 text-white text-[11px] font-mono">
                          {project.year}
                        </span>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-6 space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-white border border-slate-200/85 p-1.5 flex items-center justify-center shrink-0">
                          <img
                            src={project.logo}
                            alt={project.client}
                            loading="lazy"
                            className="max-w-full max-h-full object-contain"
                          />
                        </div>
                        <div className="min-w-0">
                          <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 truncate">
                            {project.client} • {project.industry}
                          </div>
                          <h2 className="text-lg font-bold text-slate-900 leading-snug">
                            {project.name}
                          </h2>
                        </div>
                      </div>

                      {/* Metrics Pills */}
                      <div className="flex flex-wrap gap-1.5">
                        {project.metrics.map((m) => (
                          <span
                            key={m}
                            className="px-2.5 py-1 rounded-lg bg-blue-50 border border-blue-200/70 text-[#1E40FF] text-[11px] font-bold"
                          >
                            {m}
                          </span>
                        ))}
                      </div>

                      {/* Problem -> Friction -> Architecture */}
                      <div className="space-y-2.5 text-xs text-slate-600 leading-relaxed">
                        <div className="rounded-xl bg-slate-50 border border-slate-200/75 p-3">
                          <div className="flex items-center gap-1.5 font-bold text-slate-800 mb-0.5">
                            <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                            <span>Bài Toán Doanh Nghiệp:</span>
                          </div>
                          <p>{project.problem}</p>
                        </div>
                        <div className="rounded-xl bg-amber-50/50 border border-amber-200/60 p-3">
                          <div className="flex items-center gap-1.5 font-bold text-amber-900 mb-0.5">
                            <Wrench className="w-3.5 h-3.5 text-amber-700" />
                            <span>Khó Khăn Thực Tế Khi Triển Khai:</span>
                          </div>
                          <p className="text-slate-700">{project.implementationPain}</p>
                        </div>
                        <div className="rounded-xl bg-emerald-50/50 border border-emerald-200/60 p-3">
                          <div className="flex items-center gap-1.5 font-bold text-emerald-900 mb-0.5">
                            <Layers className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Kiến Trúc DOMATION Tháo Gỡ:</span>
                          </div>
                          <p className="text-slate-700">{project.architecture}</p>
                        </div>
                      </div>

                      {/* Deliverables */}
                      <ul className="space-y-1.5 pt-1">
                        {project.deliverables.map((del) => (
                          <li key={del} className="flex items-start gap-2 text-xs text-slate-700">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                            <span>{del}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Card Footer Actions */}
                  <div className="px-6 py-4 bg-slate-50/80 border-t border-slate-200/75 flex flex-wrap items-center justify-between gap-2">
                    <a
                      href={`/boost/${project.relatedArticleSlug}`}
                      onClick={(e) =>
                        handleSpaLinkClick(e, `/boost/${project.relatedArticleSlug}`)
                      }
                      className="btn-inkica-primary min-h-[44px] px-4 py-2 text-xs"
                    >
                      <BookOpen className="w-3.5 h-3.5" />
                      <span>Đọc Bài Phân Tích Triển Khai</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </a>

                    {project.inspectionTab && (
                      <button
                        type="button"
                        onClick={() => openInspection(project.inspectionTab!)}
                        className="ql-btn-outline min-h-[44px] px-3 py-2 text-xs cursor-pointer"
                      >
                        <MonitorSmartphone className="w-3.5 h-3.5 text-[#1E40FF]" />
                        <span>Xem UI</span>
                      </button>
                    )}
                  </div>
                </article>
              ))}
            </div>
          </section>

          {/* 24 Ecosystem Partner Brands */}
          <section className="rounded-[28px] bg-white/90 backdrop-blur-xl border border-slate-200/85 p-6 sm:p-8 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
              <div>
                <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#1E40FF] mb-1">
                  <Award className="w-4 h-4" />
                  <span>HỆ SINH THÁI 38+ THƯƠNG HIỆU ĐÃ TRIỂN KHAI</span>
                </div>
                <h2 className="text-2xl font-bold text-slate-900">
                  Mạng Lưới Doanh Nghiệp Đồng Hành Cùng DOMATION
                </h2>
              </div>
              <button
                type="button"
                onClick={() => {
                  setContactNote('Muốn xem demo kiến trúc tương tự trong Portfolio DOMATION');
                  setContactOpen(true);
                }}
                className="btn-inkica-primary min-h-[44px] px-4 py-2.5 text-xs w-fit cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Đặt Lịch Tư Vấn Theo Ngành</span>
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {ECOSYSTEM_PARTNERS.map((brand) => (
                <div
                  key={brand.name}
                  className="rounded-2xl bg-slate-50/80 hover:bg-white border border-slate-200/80 p-3.5 flex flex-col items-center text-center gap-2 transition-colors"
                >
                  <div className="h-10 flex items-center justify-center">
                    <img
                      src={brand.image}
                      alt={brand.name}
                      loading="lazy"
                      className="max-h-9 max-w-[100px] object-contain"
                    />
                  </div>
                  <div className="text-xs font-bold text-slate-800 truncate w-full">
                    {brand.name}
                  </div>
                  <div className="text-[10px] text-slate-500 truncate w-full">
                    {brand.industry}
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </main>

      <DomationFooter
        onOpenContact={() => {
          setContactNote(undefined);
          setContactOpen(true);
        }}
      />

      <ProductInspectionModal
        isOpen={inspectionOpen}
        initialTab={inspectionTab}
        onClose={() => setInspectionOpen(false)}
        onOpenContact={(topic) => {
          setContactNote(topic);
          setContactOpen(true);
        }}
      />

      <ContactModal
        isOpen={contactOpen}
        onClose={() => setContactOpen(false)}
        defaultNote={contactNote}
      />
    </div>
  );
};
