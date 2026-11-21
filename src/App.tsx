import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowRight,
  Bot,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  GitBranch,
  Globe,
  LayoutGrid,
  Mail,
  Maximize2,
  MessageCircle,
  Sparkles,
  Ticket,
  Zap,
} from 'lucide-react';
import { Navbar } from './Navbar';
import { ContactModal } from './ContactModal';
import { LuxuryGoldBackdrop } from './LuxuryGoldBackdrop';
import { GlassModal } from './components/GlassModal';
import { ClosedLoopSixCardSection } from './components/ClosedLoopSixCardSection';
import { MobileAppShowcaseSection } from './components/MobileAppShowcaseSection';
import { MotionVideoShowcase } from './components/MotionVideoShowcase';
import { FounderAuthorityBlock } from './components/FounderAuthorityBlock';
import { FaqAccordionSection } from './components/FaqAccordionSection';
import { DomationFooter } from './components/DomationFooter';
import { BackToTopPill } from './components/BackToTopPill';
import { ResponsiveSlideDeck } from './components/ResponsiveSlideDeck';
import { DomResponsiveSubtabs } from './components/dom-meta/DomMetaSelect';
import { AUTOMATION_FAQS, getAutomationSeoConfig } from './data/coreRouteSeo';
import { usePageSeo } from './utils/seo';
import {
  AUTOMATION_SCREENS,
  type AutomationScreenItem,
} from './components/automation/automationShowcaseData';
import { AutomationFlowSimulator } from './components/automation/AutomationFlowSimulator';
import { AutomationModeComparisonSection } from './components/automation/AutomationModeComparisonSection';

const HERO_CHANNELS = [
  { label: 'Email SES 14/s', icon: Mail },
  { label: 'Flow IF/ELSE', icon: GitBranch },
  { label: 'Zalo OA & ZNS', icon: MessageCircle },
  { label: 'Chatbot AI RAG', icon: Bot },
  { label: 'Web Tracking', icon: Globe },
  { label: 'Voucher & QR', icon: Ticket },
];

const GALLERY_SHOT_IDS = [
  'dashboard',
  'flows-list',
  'flow-builder',
  'campaigns',
  'email-templates',
  'email-editor',
];

const SHOT_CATEGORIES = [
  { id: 'all', label: 'Tất cả' },
  { id: 'flows', label: 'Flow & Kịch bản' },
  { id: 'campaigns', label: 'Email & Chiến dịch' },
  { id: 'analytics', label: 'Báo cáo Tổng quan' },
] as const;

type ShotCategory = (typeof SHOT_CATEGORIES)[number]['id'];

export const Landing: React.FC = () => {
  usePageSeo(getAutomationSeoConfig());

  const [showContactModal, setShowContactModal] = useState(false);
  const [contactService, setContactService] = useState(
    'Marketing Automation & Trợ lý AI Phòng ban (RAG)'
  );
  const [shotCat, setShotCat] = useState<ShotCategory>('all');
  const [showBackToTop, setShowBackToTop] = useState(false);

  const appLoginUrl =
    typeof window !== 'undefined' &&
    ['127.0.0.1', 'localhost'].includes(window.location.hostname) &&
    window.location.port === '5175'
      ? 'http://127.0.0.1:5174/login?tenant=ideas-showcase-standalone&email=showcase-standalone@domation.local'
      : 'https://crm.domation.net/login';

  useEffect(() => {
    const onScroll = () => setShowBackToTop(window.scrollY > 420);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const [lightboxState, setLightboxState] = useState<{
    screenId?: string;
    image: string;
    title: string;
    subtitle?: string;
  } | null>(null);

  const galleryScreens = useMemo(
    () =>
      GALLERY_SHOT_IDS.map((id) => AUTOMATION_SCREENS.find((s) => s.id === id)).filter(
        (s): s is AutomationScreenItem => Boolean(s)
      ),
    []
  );

  const filteredScreens = useMemo(() => {
    if (shotCat === 'all') return galleryScreens;
    return galleryScreens.filter((s) => s.category === shotCat);
  }, [galleryScreens, shotCat]);

  const openContact = (topic?: string) => {
    if (topic) setContactService(topic);
    setShowContactModal(true);
  };

  const inspectScreen = (screen: AutomationScreenItem) => {
    setLightboxState({
      screenId: screen.id,
      image: screen.image,
      title: screen.title,
      subtitle: screen.subtitle,
    });
  };

  const inspectImage = (image: string, title: string, subtitle?: string) => {
    const matched = AUTOMATION_SCREENS.find((s) => s.image === image);
    setLightboxState({
      screenId: matched?.id,
      image,
      title,
      subtitle: subtitle || matched?.subtitle,
    });
  };

  const activeLightboxIdx = lightboxState?.screenId
    ? galleryScreens.findIndex((s) => s.id === lightboxState.screenId)
    : -1;

  const stepLightbox = (delta: number) => {
    if (activeLightboxIdx < 0) return;
    const nextIdx = (activeLightboxIdx + delta + galleryScreens.length) % galleryScreens.length;
    inspectScreen(galleryScreens[nextIdx]);
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] relative overflow-x-clip text-slate-900 font-sans selection:bg-[#1E40FF] selection:text-white">
      <LuxuryGoldBackdrop />

      <Navbar
        activePage="automation"
        onOpenContact={() => openContact()}
      />

      <main className="relative z-10 pt-28 sm:pt-32 md:pt-36">
        {/* 1. HERO SECTION — Clean Outcome Hook + Channel Connector Bar (Matched with /data & /meta-report) */}
        <section className="pb-10 sm:pb-16 px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center space-y-4 sm:space-y-6">
            <div className="ql-eyebrow mx-auto max-w-full !whitespace-normal text-center leading-snug py-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#1E40FF] shrink-0" />
              <span>DOMATION MARKETING • ĐỘC LẬP HOẶC ERP</span>
            </div>

            <h1 className="text-[1.5rem] sm:text-4xl lg:text-5xl xl:text-[52px] font-black text-slate-900 leading-[1.18] tracking-[-0.02em]">
              Tự động chăm sóc khách hàng
              <span className="block text-gradient-inkica mt-1">
                từ lúc để số đến lúc chốt đơn.
              </span>
            </h1>

            <p className="max-w-2xl mx-auto text-sm sm:text-lg text-slate-600 leading-relaxed">
              Chấm dứt cảnh khách vừa đăng ký xong đã nguội vì gửi tin rời rạc hay quên chăm lại — tự động phản hồi đúng lúc theo hành vi thật, giữ trọn quan tâm cho tới khi chốt đơn.
            </p>

            {/* 2 Primary Pills: Demo Request + Direct Workspace Login */}
            <div className="pt-1 sm:pt-2 grid grid-cols-2 sm:flex sm:flex-row items-center justify-center gap-2 sm:gap-3.5 max-w-md sm:max-w-none mx-auto">
              <button
                type="button"
                onClick={() => openContact('Marketing Automation & Trợ lý AI Phòng ban (RAG)')}
                className="btn-inkica-primary min-h-[44px] w-full sm:w-auto rounded-full px-3 sm:px-7 py-3 sm:py-3.5 text-xs sm:text-sm cursor-pointer whitespace-nowrap justify-center"
              >
                <Zap className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                <span className="sm:hidden">Nhận Demo</span>
                <span className="hidden sm:inline">Dùng Thử &amp; Nhận Demo</span>
              </button>

              <a
                href={appLoginUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="ql-btn-outline min-h-[44px] w-full sm:w-auto rounded-full px-3 sm:px-6 py-3 sm:py-3.5 text-xs sm:text-sm cursor-pointer whitespace-nowrap justify-center"
              >
                <span className="sm:hidden">Đăng nhập</span>
                <span className="hidden sm:inline">Đăng nhập App Automation</span>
                <ExternalLink className="w-3.5 h-3.5 text-[#1E40FF] shrink-0" />
              </a>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-x-2.5 gap-y-1 text-[11px] sm:text-xs text-slate-500">
              <span>
                Không lẫn menu ERP rườm rà
              </span>
              <span>·</span>
              <span>
                PostgreSQL RLS <strong className="text-slate-900">cô lập từng doanh nghiệp</strong>
              </span>
              <span className="hidden sm:inline">·</span>
              <span className="hidden sm:inline">
                Dùng thử <strong className="text-emerald-700">30 ngày miễn phí</strong>
              </span>
            </div>
          </div>

          {/* Compact Omnichannel Connector Strip matching /data */}
          <div className="max-w-5xl mx-auto mt-8 sm:mt-12 rounded-2xl sm:rounded-[28px] bg-white/90 sm:bg-white/85 sm:backdrop-blur-2xl border border-slate-200/80 shadow-[0_24px_64px_-24px_rgba(15,23,42,0.08)] p-4 sm:p-7 flex flex-col gap-4 sm:gap-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-1 text-left">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-800">
                    ĐA KÊNH ĐỒNG BỘ • EMAIL SES, VISUAL FLOW, ZALO ZNS, AI RAG &amp; WEB TRACKING
                  </span>
                </div>
                <p className="text-xs text-slate-500">
                  Thu thập Lead từ Landing Page/Webhook, tự động gửi Email + Zalo ZNS theo kịch bản rẽ nhánh và kích hoạt AI Bot trả lời tức thì.
                </p>
              </div>
              <a
                href="#flow-simulator"
                className="self-start sm:self-center ql-btn-outline min-h-[42px] rounded-full px-4 py-2 text-xs cursor-pointer whitespace-nowrap shrink-0 inline-flex items-center gap-1.5"
              >
                <span>Mô phỏng Flow</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </a>
            </div>

            <div className="pt-4 border-t border-slate-200/75 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
              {HERO_CHANNELS.map((ch) => {
                const Icon = ch.icon;
                return (
                  <div
                    key={ch.label}
                    className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-[#F8FAFF] border border-slate-200/80 text-xs font-semibold text-slate-800"
                  >
                    <span className="w-7 h-7 rounded-lg bg-white border border-blue-100 text-[#1E40FF] flex items-center justify-center shrink-0 shadow-2xs">
                      <Icon className="w-3.5 h-3.5" />
                    </span>
                    <span className="truncate text-[11px] sm:text-xs">{ch.label}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* 2. 6-CARD INTRO CAPABILITIES (Matched with /data & /meta-report) */}
        <ClosedLoopSixCardSection variant="automation" />

        {/* 3. 3-COLUMN LIVE SCREENSHOTS GALLERY (Matched with /meta-report) */}
        <section
          id="live-screenshots"
          className="scroll-mt-24 py-10 sm:py-16 px-4 sm:px-6 lg:px-8 border-t border-slate-200/70"
        >
          <div className="max-w-7xl mx-auto space-y-6 sm:space-y-8">
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 text-center lg:text-left">
              <div className="max-w-xl mx-auto lg:mx-0">
                <div className="ql-eyebrow mb-2.5 mx-auto lg:mx-0">
                  <LayoutGrid className="w-3.5 h-3.5 text-[#1E40FF] shrink-0" />
                  <span>GIAO DIỆN APP STANDALONE THỰC TẾ</span>
                </div>
                <h2 className="text-[20px] sm:text-2xl lg:text-3xl font-bold text-slate-900 leading-[1.22] tracking-tight">
                  Trải Nghiệm Bộ Màn Hình{' '}
                  <span className="text-gradient-inkica">DOMATION Marketing</span>
                </h2>
              </div>

              <div className="shrink-0">
                <DomResponsiveSubtabs
                  tabs={SHOT_CATEGORIES.map((c) => ({ id: c.id, label: c.label }))}
                  value={shotCat}
                  onChange={(id) => setShotCat(id as ShotCategory)}
                  maxMobile={2}
                />
              </div>
            </div>

            {/* Mobile/Tablet: Swipeable SlideDeck */}
            <div className="lg:hidden">
              <ResponsiveSlideDeck
                items={filteredScreens}
                mobilePerPage={1}
                mobileColsClass="grid-cols-1"
                tabletPerPage={2}
                tabletColsClass="grid-cols-2"
                gapClass="gap-4"
                ariaLabel="Thư viện màn hình DOMATION Marketing"
                keyExtractor={(s) => s.id}
                renderItem={(shot) => (
                  <div
                    onClick={() => inspectScreen(shot)}
                    className="group h-full rounded-2xl bg-white/95 border border-slate-200/85 shadow-sm overflow-hidden cursor-zoom-in flex flex-col"
                  >
                    <div className="relative aspect-[16/10] bg-slate-100 overflow-hidden border-b border-slate-100">
                      <img
                        src={shot.image}
                        alt={shot.title}
                        loading="lazy"
                        decoding="async"
                        className="w-full h-full object-cover object-top"
                      />
                      <div className="absolute top-2.5 left-2.5">
                        <span className="px-2.5 py-0.5 rounded-full bg-white/95 border border-blue-100 text-[#1E40FF] text-[10px] font-bold shadow-xs">
                          {shot.tabLabel}
                        </span>
                      </div>
                      <div className="absolute bottom-2.5 right-2.5 w-7 h-7 rounded-full bg-white/90 border border-slate-200 flex items-center justify-center text-slate-700 shadow-sm">
                        <Maximize2 className="w-3.5 h-3.5" />
                      </div>
                    </div>
                    <div className="p-4 space-y-1 flex-1">
                      <h3 className="text-sm font-bold text-slate-900 leading-snug line-clamp-2">
                        {shot.title}
                      </h3>
                      <p className="text-xs text-slate-600 leading-relaxed line-clamp-2">
                        {shot.subtitle}
                      </p>
                    </div>
                  </div>
                )}
              />
            </div>

            {/* Desktop: Crisp 3-Col Card Grid */}
            <div className="hidden lg:grid lg:grid-cols-3 gap-5">
              {filteredScreens.map((shot) => (
                <div
                  key={shot.id}
                  onClick={() => inspectScreen(shot)}
                  className="group rounded-2xl bg-white border border-slate-200/90 shadow-[0_14px_36px_-22px_rgba(30,64,255,0.16)] hover:border-[#1E40FF] overflow-hidden cursor-zoom-in transition-all flex flex-col"
                >
                  <div className="relative aspect-[16/10] bg-slate-100 overflow-hidden border-b border-slate-100">
                    <img
                      src={shot.image}
                      alt={shot.title}
                      loading="lazy"
                      className="w-full h-full object-cover object-top group-hover:scale-[1.02] transition-transform duration-500"
                    />
                    <div className="absolute top-2.5 left-2.5">
                      <span className="px-2.5 py-0.5 rounded-full bg-white/95 border border-blue-100 text-[#1E40FF] text-[10px] font-bold shadow-xs">
                        {shot.tabLabel}
                      </span>
                    </div>
                    <div className="absolute bottom-2.5 right-2.5 w-7 h-7 rounded-full bg-white/90 backdrop-blur-sm border border-slate-200 flex items-center justify-center text-slate-700 group-hover:text-[#1E40FF] shadow-sm">
                      <Maximize2 className="w-3.5 h-3.5" />
                    </div>
                  </div>
                  <div className="p-4 space-y-1 flex-1">
                    <h3 className="text-sm font-bold text-slate-900 group-hover:text-[#1E40FF] transition-colors leading-snug">
                      {shot.title}
                    </h3>
                    <p className="text-xs text-slate-600 leading-relaxed line-clamp-2">
                      {shot.subtitle}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 4. INTERACTIVE FLOW ENGINE SIMULATOR */}
        <AutomationFlowSimulator
          onOpenContact={(topic) => openContact(topic)}
          onInspectImage={inspectImage}
        />

        {/* 5. SYNCHRONIZED MOBILE APP SHOWCASE (Matched 1:1 with /data & /meta-report) */}
        <MobileAppShowcaseSection variant="automation" />

        {/* 6. MOTION VIDEO SHOWCASE */}
        <section className="py-8 sm:py-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <MotionVideoShowcase
              videoId="automation"
              variant="spotlight"
              layout="split-right"
              eyebrowText="SYSTEM ARCHITECTURE VIDEO • DOMATION AUTOMATION"
              sectionTitle={
                <>
                  Hệ Điều Hành <span className="text-gradient-inkica">Tự Động Hóa Tự Vận Hành</span>
                </>
              }
            />
          </div>
        </section>

        {/* 7. DEPLOYMENT MODES + SAAS PRICING */}
        <AutomationModeComparisonSection onOpenContact={(topic) => openContact(topic)} />

        {/* 8. FAQ + COMPACT FOUNDER SETUP STRIP */}
        <FaqAccordionSection
          faqs={AUTOMATION_FAQS}
          eyebrow="CÂU HỎI THƯỜNG GẶP • AUTOMATION"
          heading="Giải Đáp Về DOMATION Marketing Automation"
          subtitle="Mọi thắc mắc về việc dùng độc lập app Automation, đăng nhập workspace và nâng cấp mở rộng."
        />

        <FounderAuthorityBlock
          variant="subtle"
          contextNote="Kiến trúc DOMATION Marketing Automation — vận hành độc lập siêu mượt và mở rộng 1 chạm lên Auto Chia Data Sale & ERP 5.0."
          onOpenContact={() => openContact()}
        />
      </main>

      <DomationFooter onOpenContact={() => openContact()} />
      <BackToTopPill show={showBackToTop} />

      <ContactModal
        isOpen={showContactModal}
        onClose={() => setShowContactModal(false)}
        themeColor="blue-600"
        defaultService={contactService}
      />

      {/* HD Screenshot Lightbox */}
      <GlassModal
        isOpen={Boolean(lightboxState)}
        onClose={() => setLightboxState(null)}
        title={lightboxState?.title}
        subtitle={lightboxState?.subtitle}
        eyebrow="XEM MÀN HÌNH THỰC TẾ"
        maxWidthClass="max-w-6xl"
        headerActions={
          activeLightboxIdx >= 0 ? (
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => stepLightbox(-1)}
                aria-label="Màn hình trước"
                className="w-8 h-8 rounded-full border border-slate-200 bg-white hover:bg-slate-50 flex items-center justify-center text-slate-700 cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-xs font-mono text-slate-500 px-1.5 tabular-nums">
                {activeLightboxIdx + 1}/{galleryScreens.length}
              </span>
              <button
                type="button"
                onClick={() => stepLightbox(1)}
                aria-label="Màn hình tiếp theo"
                className="w-8 h-8 rounded-full border border-slate-200 bg-white hover:bg-slate-50 flex items-center justify-center text-slate-700 cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          ) : null
        }
      >
        {lightboxState && (
          <div className="rounded-2xl overflow-hidden border border-slate-200/85 bg-slate-50">
            <img
              src={lightboxState.image}
              alt={lightboxState.title}
              className="w-full h-auto max-h-[75vh] object-contain mx-auto"
            />
          </div>
        )}
      </GlassModal>
    </div>
  );
};

export default Landing;
