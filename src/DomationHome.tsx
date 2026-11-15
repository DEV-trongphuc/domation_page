import React, { useEffect, useState } from 'react';
import {
  ArrowRight,
  ArrowUp,
  Bot,
  Building2,
  Calculator,
  CheckCircle2,
  Cpu,
  Database,
  ExternalLink,
  Layers,
  MonitorSmartphone,
  Network,
  Sparkles,
  Workflow,
} from 'lucide-react';
import { Navbar } from './Navbar';
import { ContactModal } from './ContactModal';
import { LuxuryGoldBackdrop } from './LuxuryGoldBackdrop';
import { InteractiveBrandSphere } from './components/InteractiveBrandSphere';
import {
  type InspectionTabId,
  ProductInspectionModal,
} from './components/ProductInspectionModal';
import { WebEstimatorModal } from './components/WebEstimatorModal';
import { PartnersTrustSection } from './components/PartnersTrustSection';
import { SectionQuickDock } from './components/SectionQuickDock';
import { DomationLogoMark } from './components/DomationLogoMark';
import {
  CASE_STUDY_SPOTLIGHTS,
  CORE_OPERATION_PILLARS,
  DECOR_PNGS,
  DOMATION_SAAS_PLANS,
  ENTERPRISE_STORY_CHAPTERS,
  MULTI_AGENT_NODES,
} from './data/enterpriseData';
import { ChannelLogoStrip } from './components/ChannelLogoStrip';

const DEDICATED_APP_LINKS = [
  { label: 'ERP 5.0', href: '/erp' },
  { label: 'CRM 360°', href: '/crm' },
  { label: 'AI & Flow', href: '/automation' },
  { label: 'Auto Data', href: '/data' },
  { label: 'Meta Ads BI', href: '/meta-report' },
  { label: 'Thiết Kế Web', href: '/web-design' },
];

const AGENT_ICONS = [Workflow, Bot, Cpu, Layers];

export const DomationHome: React.FC = () => {
  const [inspectionOpen, setInspectionOpen] = useState(false);
  const [inspectionTab, setInspectionTab] = useState<InspectionTabId>('erp');
  const [estimatorOpen, setEstimatorOpen] = useState(false);
  const [contactOpen, setContactOpen] = useState(false);
  const [contactDefaults, setContactDefaults] = useState<{
    service?: string;
    note?: string;
  }>({});

  const [activePillarIdx, setActivePillarIdx] = useState(0);
  const [billingYearly, setBillingYearly] = useState(true);
  const [showBackTop, setShowBackTop] = useState(false);

  const openInspection = (tab: InspectionTabId) => {
    setInspectionTab(tab);
    setInspectionOpen(true);
  };

  const openContact = (service?: string, note?: string) => {
    setContactDefaults({ service, note });
    setContactOpen(true);
  };

  useEffect(() => {
    const onScroll = () => setShowBackTop(window.scrollY > 560);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const currentPillar =
    CORE_OPERATION_PILLARS[activePillarIdx] || CORE_OPERATION_PILLARS[0];

  return (
    <div className="min-h-screen relative text-slate-900 selection:bg-blue-600 selection:text-white font-sans">
      <LuxuryGoldBackdrop />
      <SectionQuickDock />

      <Navbar
        activePage="home"
        onOpenContact={() => openContact()}
        onOpenShowcase={() => openInspection('erp')}
      />

      <main className="relative z-10 pt-20 sm:pt-24">
        {/* ================================================================ */}
        {/* 1. HERO — BESPOKE ENTERPRISE OS & MULTI-AGENT FOCUS              */}
        {/* ================================================================ */}
        <section
          id="hero"
          className="relative px-4 sm:px-6 pt-4 pb-14 sm:pb-20 overflow-hidden"
        >
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
              {/* Left Executive Narrative */}
              <div className="lg:col-span-6 space-y-6 text-center lg:text-left">
                <div className="inline-flex items-center justify-center lg:justify-start">
                  <span className="ql-eyebrow">
                    <Sparkles className="w-3.5 h-3.5 text-[#1E40FF]" />
                    <span>THIẾT KẾ RIÊNG CHO TỪNG DOANH NGHIỆP • BESPOKE AI &amp; ERP</span>
                  </span>
                </div>

                <h1 className="text-3xl sm:text-4xl xl:text-[44px] font-bold text-slate-900 tracking-[-0.015em] space-y-2">
                  <span className="block leading-[1.3]">Hệ Điều Hành Vận Hành &amp;</span>
                  <span className="block leading-[1.3] text-gradient-inkica">
                    Multi-Agent Thiết Kế Riêng
                  </span>
                </h1>

                {/* Concise Value Proposition Glass Box (Zero 3D mention, zero clutter) */}
                <div className="relative rounded-2xl inkica-glass-card px-4 py-3.5 sm:px-5 sm:py-4 max-w-xl mx-auto lg:mx-0">
                  <p className="text-sm sm:text-[15px] text-slate-600 leading-[1.75] font-normal">
                    May đo kiến trúc{' '}
                    <span className="font-semibold text-[#1E40FF]">
                      ERP – CRM – Flow Tự Động
                    </span>{' '}
                    và đội ngũ{' '}
                    <span className="font-semibold text-slate-900">
                      Multi-Agent AI
                    </span>{' '}
                    bám sát 100% cơ cấu tổ chức, quy trình phê duyệt và đặc thù vận hành của từng doanh nghiệp.
                  </p>
                </div>

                {/* Clean 3-Row Executive Focus Card + Integrated Channel Logos */}
                <div className="rounded-2xl bg-white/85 backdrop-blur-xl border border-slate-200/80 p-4 sm:p-5 shadow-xs max-w-xl mx-auto lg:mx-0 text-left space-y-3">
                  <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-slate-200/70">
                    <span className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-slate-700">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      Trọng Tâm Kiến Trúc DOMATION
                    </span>
                    <span className="text-[10px] font-mono text-slate-400 whitespace-nowrap shrink-0">
                      BESPOKE OS
                    </span>
                  </div>

                  <div className="space-y-2.5 text-xs sm:text-[13px] text-slate-600">
                    <div className="flex items-start gap-2.5">
                      <Cpu className="w-4 h-4 text-[#1E40FF] shrink-0 mt-0.5" />
                      <span className="leading-snug">
                        <strong className="font-semibold text-slate-800">May Đo Vận Hành:</strong>{' '}
                        ERP 5.0, Task, Nhân sự &amp; Cấp duyệt riêng
                      </span>
                    </div>

                    <div className="flex items-start gap-2.5">
                      <Network className="w-4 h-4 text-[#0284C7] shrink-0 mt-0.5" />
                      <span className="leading-snug">
                        <strong className="font-semibold text-slate-800">Multi-Agent AI:</strong>{' '}
                        Đội ngũ Agent chuyên trách phối hợp 24/7
                      </span>
                    </div>

                    <div className="pt-1 flex flex-wrap items-center justify-between gap-2">
                      <span className="inline-flex items-center gap-2 font-semibold text-slate-800">
                        <Bot className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>Tích Hợp Đa Kênh:</span>
                      </span>
                      <ChannelLogoStrip variant="compact" />
                    </div>
                  </div>
                </div>

                {/* 2 Buttons on 1 Single Row */}
                <div className="grid grid-cols-2 sm:inline-flex items-center gap-2.5 sm:gap-3 pt-1 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={() =>
                      openContact(
                        'Tư Vấn Kiến Trúc Thiết Kế Riêng (ERP • CRM • Multi-Agent)',
                        'Mong muốn khảo sát quy trình và thiết kế hệ thống riêng cho doanh nghiệp'
                      )
                    }
                    className="btn-inkica-primary justify-center px-3 sm:px-6 py-3 text-[11px] sm:text-sm font-semibold cursor-pointer whitespace-nowrap"
                  >
                    <span>Tư Vấn Kiến Trúc</span>
                    <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                  </button>

                  <button
                    type="button"
                    onClick={() => openInspection('erp')}
                    className="ql-btn-outline justify-center px-3 sm:px-5 py-3 text-[11px] sm:text-sm font-semibold cursor-pointer whitespace-nowrap"
                  >
                    <MonitorSmartphone className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#1E40FF] shrink-0" />
                    <span>Màn Hình Thực Tế</span>
                  </button>
                </div>
              </div>

              {/* Right Enlarged Interactive Brand Sphere */}
              <div className="lg:col-span-6 relative flex flex-col items-center">
                <div className="w-full max-w-[580px] lg:max-w-[600px] mx-auto">
                  <InteractiveBrandSphere />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ================================================================ */}
        {/* 2. ENTERPRISE STORY — WHY BESPOKE DESIGN MATTERS                 */}
        {/* ================================================================ */}
        <section id="story" className="relative py-20 sm:py-26 px-4 sm:px-6">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-12">
              <div className="max-w-2xl">
                <div className="ql-eyebrow mb-3">
                  <Sparkles className="w-3.5 h-3.5 text-[#1E40FF]" />
                  <span>CÂU CHUYỆN DOANH NGHIỆP • TRIẾT LÝ MAY ĐO</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 leading-[1.25] tracking-tight">
                  Mỗi Doanh Nghiệp Là Một{' '}
                  <span className="text-gradient-inkica">Bản Thiết Kế Riêng</span>
                </h2>
              </div>
              <p className="text-sm text-slate-600 max-w-md leading-relaxed">
                Phần mềm đóng gói buộc đội ngũ sửa quy trình theo công cụ; DOMATION kiến tạo hệ thống xoay quanh chính mô hình của bạn.
              </p>
            </div>

            {/* 3 Spacious Story Chapters — Calm Swiss Hairline Architecture */}
            <div className="rounded-[28px] bg-white/80 backdrop-blur-xl border border-slate-200/80 shadow-xs grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-slate-200/75 overflow-hidden">
              {ENTERPRISE_STORY_CHAPTERS.map((chapter) => (
                <div
                  key={chapter.step}
                  className="p-7 sm:p-9 flex flex-col justify-between gap-6"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-semibold text-[#1E40FF] bg-slate-100 px-2.5 py-0.5 rounded-full">
                          {chapter.step}
                        </span>
                        <span className="text-[11px] font-semibold uppercase tracking-wider text-[#0284C7]">
                          {chapter.tag}
                        </span>
                      </div>
                      <img
                        src={chapter.decorImg}
                        alt=""
                        aria-hidden="true"
                        loading="lazy"
                        className="w-12 h-12 object-contain shrink-0 drop-shadow-[0_10px_16px_rgba(30,64,255,0.12)]"
                      />
                    </div>

                    <h3 className="text-base sm:text-lg font-semibold text-slate-900 leading-snug pt-1">
                      {chapter.title}
                    </h3>

                    <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                      {chapter.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ================================================================ */}
        {/* 3. MULTI-AGENT ORCHESTRATION & INTEGRATED PLATFORMS              */}
        {/* ================================================================ */}
        <section id="multi-agent" className="relative py-20 sm:py-26 px-4 sm:px-6">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-12">
              <div className="max-w-2xl">
                <div className="ql-eyebrow mb-3">
                  <Network className="w-3.5 h-3.5 text-[#1E40FF]" />
                  <span>AGENT HỖ TRỢ &amp; MULTI-AGENT • TỰ ĐỘNG HÓA LIÊN PHÒNG BAN</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 leading-[1.25] tracking-tight">
                  Một Trung Tâm Điều Phối,{' '}
                  <span className="text-gradient-inkica">Nhiều Agent Cùng Vận Hành</span>
                </h2>
              </div>
              <p className="text-sm text-slate-600 max-w-md leading-relaxed">
                Huấn luyện trực tiếp từ tài liệu nội bộ, các AI Agent chia sẻ ngữ cảnh và phối hợp xử lý tác vụ xuyên suốt 24/7.
              </p>
            </div>

            <div className="rounded-[28px] bg-white/85 backdrop-blur-2xl border border-slate-200/80 shadow-[0_24px_64px_-24px_rgba(15,23,42,0.07)] p-6 sm:p-10">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center">
                {/* Left: Bespoke 3D Fluent Glass Orchestrator Hub */}
                <div className="lg:col-span-5 space-y-4">
                  <div className="relative rounded-2xl overflow-hidden border border-slate-200/75 bg-[#F4F8FF]">
                    <img
                      src="/imgs/enterprise/sol-multi-agent.webp"
                      alt="DOMATION Multi-Agent Orchestrator Hub"
                      loading="lazy"
                      className="w-full h-56 sm:h-64 object-cover"
                    />
                  </div>
                  <div className="px-1 space-y-1.5">
                    <div className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-[#1E40FF]">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      <span>Orchestrator Core • Tri Thức Nội Bộ</span>
                    </div>
                    <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                      Tiếp nhận yêu cầu, kiểm soát phân quyền dữ liệu và kích hoạt đúng Agent chuyên môn theo quy trình riêng của từng doanh nghiệp.
                    </p>
                  </div>
                </div>

                {/* Right: 4 Specialized Enterprise Agents (Clean 2x2 Grid, Zero Bullet Lists) */}
                <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {MULTI_AGENT_NODES.map((agent, idx) => {
                    const Icon = AGENT_ICONS[idx % AGENT_ICONS.length];
                    return (
                      <div
                        key={agent.id}
                        className="rounded-2xl bg-slate-50/75 hover:bg-white border border-slate-200/75 p-5 sm:p-6 transition-colors flex flex-col justify-between gap-3"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="w-9 h-9 rounded-xl bg-white border border-slate-200/80 text-[#1E40FF] flex items-center justify-center shadow-2xs">
                            <Icon className="w-4 h-4" />
                          </div>
                          <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 bg-white px-2.5 py-1 rounded-full border border-slate-200/70">
                            {agent.roleTag}
                          </span>
                        </div>

                        <div>
                          <h3 className="text-sm sm:text-base font-semibold text-slate-900 mb-1">
                            {agent.name}
                          </h3>
                          <p className="text-xs text-slate-600 leading-relaxed">
                            {agent.focus}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Integrated Platforms Logo Dock — Visual Brand Logos Instead of Text Lists */}
              <div className="mt-8 pt-7 border-t border-slate-200/75 flex flex-col xl:flex-row xl:items-center justify-between gap-4">
                <div className="shrink-0">
                  <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-800">
                    Platform &amp; Kênh Tích Hợp Đồng Bộ
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Kết nối hai chiều thời gian thực với hệ sinh thái sẵn có của doanh nghiệp.
                  </p>
                </div>

                <ChannelLogoStrip variant="platforms" />
              </div>
            </div>
          </div>
        </section>

        {/* ================================================================ */}
        {/* 4. CORE FUNCTIONS & OPERATIONS — CLEAN 4-PILLAR STUDIO           */}
        {/* ================================================================ */}
        <section id="solutions" className="relative py-20 sm:py-26 px-4 sm:px-6">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
              <div className="max-w-2xl">
                <div className="ql-eyebrow mb-3">
                  <Layers className="w-3.5 h-3.5 text-[#1E40FF]" />
                  <span>CHỨC NĂNG &amp; VẬN HÀNH TRỌNG TÂM</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 leading-[1.25] tracking-tight">
                  Bốn Trụ Cột{' '}
                  <span className="text-gradient-inkica">Vận Hành Doanh Nghiệp Khép Kín</span>
                </h2>
              </div>
              <p className="text-sm text-slate-600 max-w-md leading-relaxed">
                Tập trung vào những nghiệp vụ cốt lõi tạo ra hiệu suất thực — tinh gọn, trực quan và sẵn sàng mở rộng.
              </p>
            </div>

            {/* Clean 4-Pillar Selector (2 per row on mobile, 4 on desktop — zero cluttered subtabs) */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3 mb-6">
              {CORE_OPERATION_PILLARS.map((pillar, idx) => {
                const active = activePillarIdx === idx;
                return (
                  <button
                    key={pillar.id}
                    type="button"
                    onClick={() => setActivePillarIdx(idx)}
                    className={`rounded-2xl px-3 sm:px-4 py-3 sm:py-3.5 text-left border transition-all cursor-pointer flex items-center justify-between gap-1.5 sm:gap-2 ${
                      active
                        ? 'bg-slate-900 text-white border-slate-900 shadow-md'
                        : 'bg-white/80 text-slate-700 border-slate-200/80 hover:bg-white'
                    }`}
                  >
                    <div className="min-w-0">
                      <div
                        className={`text-[10px] font-mono font-semibold ${
                          active ? 'text-cyan-300' : 'text-slate-400'
                        }`}
                      >
                        {pillar.step}
                      </div>
                      <div className="text-[11px] sm:text-sm font-semibold leading-snug mt-0.5">
                        {pillar.tabLabel}
                      </div>
                    </div>
                    <ArrowRight
                      className={`w-3.5 h-3.5 shrink-0 hidden sm:block ${
                        active ? 'text-cyan-300' : 'text-slate-400'
                      }`}
                    />
                  </button>
                );
              })}
            </div>

            {/* Spacious Active Operation Stage */}
            <div className="rounded-[28px] bg-white/85 backdrop-blur-2xl border border-slate-200/80 shadow-[0_24px_64px_-24px_rgba(15,23,42,0.07)] p-6 sm:p-10 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center">
              <div className="lg:col-span-6">
                <div className="relative rounded-2xl overflow-hidden border border-slate-200/75 bg-[#F4F8FF]">
                  <img
                    src={currentPillar.image}
                    alt={currentPillar.tabLabel}
                    className="w-full h-56 sm:h-72 object-cover"
                  />
                </div>
              </div>

              <div className="lg:col-span-6 space-y-5">
                <div>
                  <div className="text-[11px] font-semibold uppercase tracking-wider text-[#1E40FF] mb-1.5">
                    {currentPillar.eyebrow}
                  </div>
                  <h3 className="text-xl sm:text-2xl font-bold text-slate-900 leading-snug">
                    {currentPillar.title}{' '}
                    <span className="text-gradient-inkica">{currentPillar.accent}</span>
                  </h3>
                  <p className="text-sm text-slate-600 leading-relaxed mt-3">
                    {currentPillar.summary}
                  </p>
                </div>

                {/* 3 Crisp Focus Pills Instead of Long Bullet Sentences */}
                <div className="flex flex-wrap gap-2 pt-1">
                  {currentPillar.keyTags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100/90 text-xs font-medium text-slate-700"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      <span>{tag}</span>
                    </span>
                  ))}
                </div>

                {/* 2 Buttons on 1 Single Row */}
                <div className="grid grid-cols-2 sm:inline-flex items-center gap-2.5 sm:gap-3 pt-2 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={() => openInspection(currentPillar.inspectionTab)}
                    className="btn-inkica-primary justify-center px-3 sm:px-5 py-2.5 sm:py-3 text-[11px] sm:text-sm font-semibold cursor-pointer whitespace-nowrap"
                  >
                    <MonitorSmartphone className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                    <span>Màn Hình Thực Tế</span>
                  </button>

                  <a
                    href={currentPillar.routeUrl}
                    className="ql-btn-outline justify-center px-3 sm:px-5 py-2.5 sm:py-3 text-[11px] sm:text-sm font-semibold whitespace-nowrap"
                  >
                    <span>{currentPillar.routeLabel}</span>
                    <ArrowRight className="w-3.5 h-3.5 shrink-0" />
                  </a>
                </div>
              </div>
            </div>

            {/* Minimalist Direct Links to Dedicated Product Pages */}
            <div className="mt-6 px-2 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
              <span className="font-medium text-slate-600">
                Truy cập nhanh chuyên trang từng ứng dụng:
              </span>
              <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
                {DEDICATED_APP_LINKS.map((app) => (
                  <a
                    key={app.href}
                    href={app.href}
                    className="font-semibold text-slate-700 hover:text-[#1E40FF] inline-flex items-center gap-1 transition-colors"
                  >
                    <span>{app.label}</span>
                    <ArrowRight className="w-3 h-3" />
                  </a>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ================================================================ */}
        {/* 5. BESPOKE ENTERPRISE CASE STUDIES                               */}
        {/* ================================================================ */}
        <section id="cases" className="relative py-20 sm:py-26 px-4 sm:px-6">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-12">
              <div className="max-w-2xl">
                <div className="ql-eyebrow mb-3">
                  <Building2 className="w-3.5 h-3.5 text-[#1E40FF]" />
                  <span>CÂU CHUYỆN TRIỂN KHAI THỰC TẾ</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 leading-[1.25]">
                  Kiến Trúc May Đo{' '}
                  <span className="text-gradient-inkica">Tại Doanh Nghiệp Đối Tác</span>
                </h2>
              </div>
              <p className="text-sm text-slate-600 max-w-md leading-relaxed">
                Mỗi dự án được thiết kế riêng từ luồng dữ liệu, trợ lý AI đến giao diện vận hành để giải quyết đúng bài toán ngành.
              </p>
            </div>

            <div className="rounded-[28px] bg-white/80 backdrop-blur-xl border border-slate-200/80 shadow-xs grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-slate-200/75 overflow-hidden">
              {CASE_STUDY_SPOTLIGHTS.map((cs, idx) => {
                const isInkica = cs.id === 'inkica';
                return (
                  <div
                    key={cs.id}
                    className={`p-7 sm:p-9 flex flex-col justify-between gap-5 ${
                      idx >= 2 ? 'lg:border-t lg:border-slate-200/75' : ''
                    }`}
                  >
                    <div>
                      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                        <div className="flex items-center gap-3.5">
                          <div className="h-11 px-3 rounded-xl bg-white border border-slate-200/80 shadow-2xs flex items-center gap-1.5 shrink-0">
                            <img
                              src={cs.logo}
                              alt={cs.company}
                              loading="lazy"
                              className="h-6 max-w-[115px] object-contain"
                            />
                            {isInkica && (
                              <span className="text-sm font-bold tracking-tight text-slate-900">
                                inkica<span className="text-[#1E40FF]">.</span>
                              </span>
                            )}
                          </div>
                          <div>
                            <h3 className="text-base font-semibold text-slate-900">
                              {cs.company}
                            </h3>
                            <div className="text-xs font-medium text-slate-500">
                              {cs.sector}
                            </div>
                          </div>
                        </div>
                      </div>

                      <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                        {cs.summary}
                      </p>
                    </div>

                    <div className="pt-4 border-t border-slate-200/70 flex flex-wrap items-center justify-between gap-3">
                      <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-semibold">
                        <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-[#1E40FF]">
                          {cs.result}
                        </span>
                        <span className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700">
                          {cs.cost}
                        </span>
                        <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700">
                          {cs.impact}
                        </span>
                      </div>

                      <div className="flex items-center gap-4">
                        {cs.inspectionTab && (
                          <button
                            type="button"
                            onClick={() => openInspection(cs.inspectionTab!)}
                            className="text-xs font-semibold text-[#1E40FF] hover:text-cyan-600 flex items-center gap-1 cursor-pointer"
                          >
                            <MonitorSmartphone className="w-3.5 h-3.5" />
                            <span>Xem Thực Tế</span>
                          </button>
                        )}
                        {cs.url && (
                          <a
                            href={cs.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs font-semibold text-slate-600 hover:text-slate-900 flex items-center gap-1"
                          >
                            <span>Live</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ================================================================ */}
        {/* 6. STRATEGIC PARTNERS & F1 DISTRIBUTION NETWORK                  */}
        {/* ================================================================ */}
        <PartnersTrustSection />

        {/* ================================================================ */}
        {/* 7. TRANSPARENT INVESTMENT & BESPOKE ROADMAP                      */}
        {/* ================================================================ */}
        <section id="pricing" className="relative py-20 sm:py-26 px-4 sm:px-6">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-12">
              <div>
                <div className="ql-eyebrow mb-3">
                  <Database className="w-3.5 h-3.5 text-[#1E40FF]" />
                  <span>LỘ TRÌNH ĐẦU TƯ MINH BẠCH • KHỞI ĐỘNG NHANH HOẶC MAY ĐO RIÊNG</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">
                  Giải Pháp Tương Xứng{' '}
                  <span className="text-gradient-inkica">Quy Mô Từng Doanh Nghiệp</span>
                </h2>
              </div>

              <div className="inline-flex items-center p-1 rounded-full bg-white border border-slate-200 shadow-2xs w-fit">
                <button
                  type="button"
                  onClick={() => setBillingYearly(false)}
                  className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                    !billingYearly ? 'bg-[#1E40FF] text-white' : 'text-slate-600'
                  }`}
                >
                  Theo Tháng
                </button>
                <button
                  type="button"
                  onClick={() => setBillingYearly(true)}
                  className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                    billingYearly ? 'bg-[#1E40FF] text-white' : 'text-slate-600'
                  }`}
                >
                  <span>Theo Năm</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                      billingYearly
                        ? 'bg-white/20 text-white'
                        : 'bg-emerald-100 text-emerald-700'
                    }`}
                  >
                    -15%
                  </span>
                </button>
              </div>
            </div>

            {/* Clean 3-Column Matrix (Max 3 Crisp Points Per Plan, Spotlighting Bespoke Enterprise) */}
            <div className="rounded-[28px] overflow-hidden border border-slate-200/85 bg-white/85 backdrop-blur-xl shadow-xs grid grid-cols-1 lg:grid-cols-3 divide-y lg:divide-y-0 lg:divide-x divide-slate-200/75 mb-10">
              {DOMATION_SAAS_PLANS.map((plan) => {
                const isCustom = plan.monthly === 'May Đo';
                return (
                  <div
                    key={plan.name}
                    className={`p-7 sm:p-9 flex flex-col justify-between ${
                      plan.popular
                        ? 'bg-gradient-to-br from-slate-950 via-[#0F172A] to-[#0A2568] text-white'
                        : ''
                    }`}
                  >
                    <div>
                      <div
                        className={`inline-block text-[10px] font-semibold uppercase tracking-widest px-3 py-1 rounded-full mb-4 ${
                          plan.popular
                            ? 'bg-cyan-400/20 text-cyan-300'
                            : 'bg-slate-100 text-[#1E40FF]'
                        }`}
                      >
                        {plan.badge}
                      </div>

                      <h3
                        className={`text-xl font-bold ${
                          plan.popular ? 'text-white' : 'text-slate-900'
                        }`}
                      >
                        {plan.name}
                      </h3>

                      <div className="mt-3 mb-2.5 flex items-baseline gap-1.5">
                        <span
                          className={`text-3xl sm:text-4xl font-bold tracking-tight ${
                            plan.popular ? 'text-white' : 'text-slate-900'
                          }`}
                        >
                          {billingYearly ? plan.yearly : plan.monthly}
                        </span>
                        {!isCustom && (
                          <span
                            className={`text-xs font-medium ${
                              plan.popular ? 'text-slate-300' : 'text-slate-500'
                            }`}
                          >
                            {billingYearly ? '/ năm' : '/ tháng'}
                          </span>
                        )}
                      </div>

                      <p
                        className={`text-xs sm:text-sm leading-relaxed mb-6 ${
                          plan.popular ? 'text-slate-300' : 'text-slate-600'
                        }`}
                      >
                        {plan.desc}
                      </p>

                      <div
                        className={`space-y-3 pt-5 border-t ${
                          plan.popular ? 'border-white/15' : 'border-slate-200/75'
                        }`}
                      >
                        {plan.features.map((feat) => (
                          <div key={feat} className="flex items-start gap-2.5 text-xs sm:text-[13px]">
                            <CheckCircle2
                              className={`w-4 h-4 shrink-0 mt-0.5 ${
                                plan.popular ? 'text-cyan-300' : 'text-emerald-500'
                              }`}
                            />
                            <span
                              className={
                                plan.popular ? 'text-slate-100' : 'text-slate-700'
                              }
                            >
                              {feat}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        openContact(
                          isCustom
                            ? 'Thiết Kế Riêng Bespoke Enterprise (ERP • CRM • Multi-Agent)'
                            : 'Hệ thống Auto Chia Data ZaloBot & Flow Automation',
                          `Quan tâm gói DOMATION ${plan.name} (${
                            billingYearly ? plan.yearly : plan.monthly
                          })`
                        )
                      }
                      className={`mt-8 w-full py-3.5 px-5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer ${
                        plan.popular
                          ? 'bg-gradient-to-r from-[#1E40FF] via-[#2563EB] to-[#06B6D4] text-white hover:brightness-110 shadow-lg'
                          : 'ql-btn-outline'
                      }`}
                    >
                      <span>
                        {isCustom ? 'Đặt Lịch Khảo Sát & Thiết Kế Riêng' : `Chọn Gói ${plan.name}`}
                      </span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Clean Website Estimator Banner (2 Buttons 1 Row) */}
            <div className="rounded-[28px] bg-white/80 backdrop-blur-xl border border-slate-200/80 p-6 sm:p-9 relative overflow-hidden shadow-xs">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
                <div className="lg:col-span-2 hidden lg:flex items-center justify-center">
                  <img
                    src={DECOR_PNGS.prism}
                    alt=""
                    aria-hidden="true"
                    loading="lazy"
                    className="w-20 h-20 object-contain animate-float-decor drop-shadow-[0_14px_22px_rgba(30,64,255,0.16)]"
                  />
                </div>

                <div className="lg:col-span-6 space-y-2">
                  <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#1E40FF]">
                    <Calculator className="w-4 h-4" />
                    <span>THIẾT KẾ WEBSITE THƯƠNG HIỆU &amp; TƯƠNG TÁC</span>
                  </div>
                  <h3 className="text-xl sm:text-2xl font-bold text-slate-900">
                    Dự Toán Chi Phí Website Từ{' '}
                    <span className="text-[#1E40FF]">12.000.000₫</span>
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                    Tùy chọn linh hoạt các hạng mục giao diện, bảng hàng, cổng thanh toán và đồng bộ CRM ngay trên bảng tính trực quan.
                  </p>
                </div>

                <div className="lg:col-span-4 grid grid-cols-2 items-center gap-2.5 sm:gap-3">
                  <button
                    type="button"
                    onClick={() => setEstimatorOpen(true)}
                    className="btn-inkica-primary justify-center px-3 sm:px-5 py-3 text-[11px] sm:text-sm font-semibold cursor-pointer whitespace-nowrap"
                  >
                    <Calculator className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                    <span>Dự Toán Web</span>
                  </button>
                  <a
                    href="/web-design"
                    className="ql-btn-outline justify-center px-3 sm:px-5 py-3 text-[11px] sm:text-sm font-semibold whitespace-nowrap"
                  >
                    <span>Bảng Giá Web</span>
                    <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* ================================================================ */}
      {/* 8. EXECUTIVE NAVY-SAPPHIRE FOOTER                                */}
      {/* ================================================================ */}
      <footer className="relative z-10 bg-gradient-to-br from-slate-950 via-[#0F172A] to-[#0A2568] text-white border-t border-slate-800/40 pt-14 pb-20 sm:pb-10 px-4 sm:px-6 mt-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 pb-10 border-b border-white/10">
            <div className="md:col-span-5 space-y-4">
              <div className="flex items-center gap-3">
                <DomationLogoMark className="w-10 h-10 shrink-0 shadow-md" />
                <div>
                  <div className="text-lg font-bold tracking-tight">
                    DOMATION<span className="text-cyan-400">.NET</span>
                  </div>
                  <div className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">
                    Bespoke Enterprise OS &amp; Multi-Agent AI
                  </div>
                </div>
              </div>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-md">
                Thiết kế riêng kiến trúc ERP 5.0, CRM 360°, Flow rẽ nhánh và đội ngũ Multi-Agent AI đồng bộ đa nền tảng cho từng doanh nghiệp.
              </p>
            </div>

            <div className="md:col-span-3 space-y-2.5">
              <div className="text-xs font-semibold uppercase tracking-widest text-cyan-300">
                Chuyên Trang Giải Pháp
              </div>
              <ul className="space-y-2 text-xs text-slate-300">
                <li>
                  <a href="/erp" className="hover:text-white transition-colors">
                    Enterprise ERP 5.0
                  </a>
                </li>
                <li>
                  <a href="/crm" className="hover:text-white transition-colors">
                    CRM 360° &amp; Đồng Bộ MISA
                  </a>
                </li>
                <li>
                  <a href="/automation" className="hover:text-white transition-colors">
                    Multi-Agent &amp; Flow Automation
                  </a>
                </li>
                <li>
                  <a href="/data" className="hover:text-white transition-colors">
                    Auto Chia Data &amp; Meta CAPI
                  </a>
                </li>
                <li>
                  <a href="/meta-report" className="hover:text-white transition-colors">
                    Meta Ads Realtime Report
                  </a>
                </li>
                <li>
                  <a href="/web-design" className="hover:text-white transition-colors">
                    Thiết Kế Website Thương Hiệu
                  </a>
                </li>
              </ul>
            </div>

            <div className="md:col-span-4 space-y-3">
              <div className="text-xs font-semibold uppercase tracking-widest text-cyan-300">
                Kết Nối Solution Architect
              </div>
              <div className="space-y-2 text-xs text-slate-300">
                <div>
                  Hotline / Zalo:{' '}
                  <a
                    href="https://zalo.me/0378859736"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-semibold text-white hover:text-cyan-300 font-mono"
                  >
                    0378.859.736
                  </a>
                </div>
                <div>
                  Email:{' '}
                  <a
                    href="mailto:turniodev@gmail.com"
                    className="font-semibold text-white hover:text-cyan-300"
                  >
                    turniodev@gmail.com
                  </a>
                </div>
                <div>
                  Facebook:{' '}
                  <a
                    href="https://www.facebook.com/turni0"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-semibold text-white hover:text-cyan-300"
                  >
                    fb.com/turni0
                  </a>
                </div>
              </div>
              <button
                type="button"
                onClick={() => openContact()}
                className="mt-2 inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-blue-500/30 border border-white/15 text-xs font-semibold text-white transition-colors cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-cyan-300" />
                <span>Đặt Lịch Tư Vấn 1-1</span>
              </button>
            </div>
          </div>

          <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-slate-400">
            <span>© 2026 DOMATION Enterprise Technology. All rights reserved.</span>
            <span>Bespoke Enterprise Architecture • Multi-Agent AI Systems.</span>
          </div>
        </div>
      </footer>

      {showBackTop && (
        <button
          type="button"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          aria-label="Lên đầu trang"
          className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 px-4 py-2 rounded-full bg-white/95 backdrop-blur-xl border border-slate-200 shadow-lg text-xs font-semibold text-slate-800 hover:text-[#1E40FF] flex items-center gap-1.5 transition-all cursor-pointer"
        >
          <ArrowUp className="w-3.5 h-3.5 text-[#1E40FF]" />
          <span>Đầu trang</span>
        </button>
      )}

      <ProductInspectionModal
        isOpen={inspectionOpen}
        initialTab={inspectionTab}
        onClose={() => setInspectionOpen(false)}
        onOpenContact={(topic) => openContact(undefined, topic)}
      />

      <WebEstimatorModal
        isOpen={estimatorOpen}
        onClose={() => setEstimatorOpen(false)}
        onRequestQuote={(summary) =>
          openContact('Website Thương Hiệu & Tương Tác (Từ 12.0M₫)', summary)
        }
      />

      <ContactModal
        isOpen={contactOpen}
        onClose={() => setContactOpen(false)}
        defaultService={contactDefaults.service}
        defaultNote={contactDefaults.note}
      />
    </div>
  );
};
