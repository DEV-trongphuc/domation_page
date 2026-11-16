import React, { Suspense, useEffect, useState } from 'react';
import {
  Activity,
  ArrowRight,
  ArrowUp,
  ArrowUpRight,
  Bot,
  Briefcase,
  Building2,
  Car,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  Cookie,
  Cpu,
  CreditCard,
  Download,
  FileCheck2,
  FileText,
  FolderKanban,
  Gauge,
  GraduationCap,
  HeartPulse,
  Layers,
  PlusCircle,
  RefreshCw,
  Scale,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Table2,
  UserCheck,
  Users,
  Wallet,
  Webhook,
  Workflow,
  X,
  ZoomIn,
} from 'lucide-react';
import { LuxuryGoldBackdrop } from './LuxuryGoldBackdrop';
import { Navbar } from './Navbar';
import { ChannelLogoStrip } from './components/ChannelLogoStrip';
import { DomationLogoMark } from './components/DomationLogoMark';
import { FaqAccordionSection } from './components/FaqAccordionSection';
import { handleSpaLinkClick } from './utils/navigation';
import { AUTODATA_FAQS, getDataSeoConfig } from './data/coreRouteSeo';
import { usePageSeo } from './utils/seo';
import { AutoDataAuthModal } from './components/autodata/AutoDataAuthModal';
const AutoDataWorkspaceApp = React.lazy(() => import('./components/autodata/AutoDataWorkspaceApp'));
import { purgeLegacyAutodataStorage } from './components/autodata/autodataApi';
import { AutoDataCookieConsent, AutoDataLegalModal } from './components/autodata/AutoDataLegalAndCookie';
import {
  DEFAULT_CLIENT_CATALOG,
  SESSION_V2_STORAGE_KEY,
  buildPersonalLeadsCsvContent,
  type ClientBillingCatalog,
  type LegalDocTab,
  type PersonalSaleLeadItem,
  type SetupModalIntent,
  type TenantSessionV2,
} from './components/autodata/autodataTypes';

const SESSION_STORAGE_KEY = SESSION_V2_STORAGE_KEY;

interface PartnerBrand {
  name: string;
  sector: string;
  logo: string;
}

const PARTNER_BRANDS: PartnerBrand[] = [
  {
    name: 'IDEAS Business',
    sector: 'Giáo dục & Đào tạo Doanh nghiệp',
    logo: '/assets/partners/logo_ideas.webp',
  },
  {
    name: 'Rich Land',
    sector: 'Phát triển & Phân phối BĐS',
    logo: '/assets/partners/partner_richland.webp',
  },
  {
    name: 'Hệ Thống Nha Khoa Flora',
    sector: 'Y tế & Nha khoa Thẩm mỹ',
    logo: '/assets/partners/partner_flora.webp',
  },
  {
    name: 'Capital House',
    sector: 'Chủ đầu tư Bất động sản',
    logo: '/assets/partners/logo_capital_house.webp',
  },
  {
    name: 'EcoLife Signature',
    sector: 'Chuỗi Dự án Xanh Cao cấp',
    logo: '/assets/partners/logo_ecolife_ngang.webp',
  },
  {
    name: 'Tùng Long Property',
    sector: 'Đại lý F1 Bất động sản',
    logo: '/assets/partners/logo_tung_long.webp',
  },
  {
    name: 'Hợp Nhất Land',
    sector: 'Đại lý F1 Bất động sản',
    logo: '/assets/partners/logo_hop_nhat.webp',
  },
  {
    name: 'IHD Group',
    sector: 'Đại lý F1 Bất động sản',
    logo: '/assets/partners/logo_ihd_group.webp',
  },
  {
    name: 'MINTH Store',
    sector: 'Nước hoa & Mỹ phẩm Retail',
    logo: '/assets/partners/logo_minth.webp',
  },
  {
    name: 'Navatek',
    sector: 'Công nghiệp & Công nghệ',
    logo: '/assets/partners/logo_navatek.webp',
  },
  {
    name: 'Mystery Tarot',
    sector: 'AI Tâm linh & Giải trí',
    logo: '/assets/partners/logo_mystery_tarot.webp',
  },
  {
    name: 'Bếp Nhà SON',
    sector: 'F&B • Bếp Nhà Đãi Khách',
    logo: '/assets/partners/logo_son_fnb.webp',
  },
];

interface ScreenshotItem {
  title: string;
  badge: string;
  desc: string;
  src: string;
}

const SYSTEM_SCREENSHOTS: ScreenshotItem[] = [
  {
    title: 'Bảng Điều Khiển Vòng Chia Số Real-Time',
    badge: 'Router Console',
    desc: 'Theo dõi trực quan lưu lượng Lead đổ về từ các chiến dịch, tốc độ tiếp nhận SLA và trạng thái Online từng nhân viên Sale.',
    src: '/CHIA DATA/chia_data (1).png',
  },
  {
    title: 'Ma Trận Trọng Số & Công Tắc Online / Nghỉ Phép',
    badge: 'Fair-Share Matrix',
    desc: 'Cấu hình hệ số nhận khách cho từng Sale nội bộ (Senior x3, Junior x1), bảo lưu lượt khi nghỉ phép và tùy chọn bật thêm CTV F1.',
    src: '/CHIA DATA/chia_data (22).png',
  },
  {
    title: 'Cổng Sale Cá Nhân & Dòng Thời Gian Chăm Sóc',
    badge: 'Sale Port & SLA',
    desc: 'Mỗi Sale quản lý giỏ khách được chia cùng tệp khách cá nhân tự nhập (miễn thu hồi SLA), xuất CSV và đồng bộ Google Sheets 2 chiều.',
    src: '/CHIA DATA/chia_data (20).png',
  },
  {
    title: 'Đồng Bộ Ngược Tín Hiệu Meta CAPI v21.0',
    badge: 'Meta Conversion API',
    desc: 'Khi nhân sự xác nhận khách chất lượng hoặc chốt đơn, hệ thống tự động phản hồi tín hiệu chuyển đổi để tối ưu máy học quảng cáo.',
    src: '/CHIA DATA/chia_data (16).png',
  },
  {
    title: 'Cơ Chế Duyệt Lỗi & Đền Bù Tự Động 1-Đổi-1',
    badge: 'Compensation Engine',
    desc: 'Nhân sự báo số rác/sai đối tượng ngay trên ZaloBot; Admin duyệt 1 chạm tự động cộng bù định mức ở vòng kế tiếp.',
    src: '/CHIA DATA/chia_data (14).png',
  },
  {
    title: 'Báo Cáo Đối Soát Độ Công Bằng Gini',
    badge: 'Fairness Audit',
    desc: 'Đo lường độ lệch phân bổ dữ liệu giữa các nhân viên Sale, phòng ban và nguồn chiến dịch hoàn toàn minh bạch.',
    src: '/CHIA DATA/chia_data (19).png',
  },
];

const DEMO_PERSONAL_LEADS_CSV: PersonalSaleLeadItem[] = [
  {
    id: 'plead_01',
    name: 'Nguyễn Minh Tuấn (Khách tự khai thác)',
    phone: '0909888777',
    sale_owner_name: 'Chuyên viên Sale Nội Bộ #01',
    product_interest: 'Gói dịch vụ Doanh nghiệp',
    note: 'Khách quen giới thiệu — Không qua vòng chia, không tính quota',
    sheet_sync_status: 'Đồng bộ 2 chiều ↔ Google Sheet riêng (Sale #01)',
    bypass_round_robin: true,
    quota_impact: 0,
    sla_recall_exempt: true,
    created_at: '2026-11-15T09:30:00.000Z',
  },
  {
    id: 'plead_02',
    name: 'Lê Thu Hà (Danh sách hội thảo riêng)',
    phone: '0912666555',
    sale_owner_name: 'Chuyên viên Sale Nội Bộ #01',
    product_interest: 'Tư vấn chuyên sâu 1-1',
    note: 'Đã cập nhật ghi chú từ Google Sheet cá nhân',
    sheet_sync_status: 'Đã đồng bộ ngược từ Sheet (Quan tâm cao)',
    bypass_round_robin: true,
    quota_impact: 0,
    sla_recall_exempt: true,
    created_at: '2026-11-15T10:15:00.000Z',
  },
];

function readSavedSession(): TenantSessionV2 | null {
  purgeLegacyAutodataStorage();
  try {
    const raw = window.localStorage.getItem(SESSION_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as TenantSessionV2;
    if (parsed && parsed.access_token && parsed.tenant_slug) {
      return parsed;
    }
  } catch {
    // Ignore corrupted localStorage
  }
  return null;
}

function detectInitialLegalModal(): { open: boolean; tab: LegalDocTab } {
  if (typeof window === 'undefined') return { open: false, tab: 'terms' };
  const path = window.location.pathname.toLowerCase();
  const params = new URLSearchParams(window.location.search);
  const legalParam = (params.get('legal') || '').toLowerCase();
  const hash = window.location.hash.toLowerCase();

  if (path.endsWith('/privacy') || legalParam === 'privacy' || hash === '#privacy') {
    return { open: true, tab: 'privacy' };
  }
  if (path.endsWith('/terms') || legalParam === 'terms' || hash === '#terms') {
    return { open: true, tab: 'terms' };
  }
  return { open: false, tab: 'terms' };
}

function detectWorkspacePathSlug(): string | null {
  if (typeof window === 'undefined') return null;
  const pathname = window.location.pathname.replace(/\/+$/, '');
  const match = pathname.match(/^\/data\/([^/]+)$/i);
  if (match && match[1]) {
    const slug = match[1].toLowerCase();
    if (slug !== 'privacy' && slug !== 'terms') return slug;
  }
  if (/^data\./i.test(window.location.hostname)) {
    const subMatch = pathname.match(/^\/([^/]+)$/);
    if (subMatch && subMatch[1]) {
      const slug = subMatch[1].toLowerCase();
      if (slug !== 'data' && slug !== 'privacy' && slug !== 'terms') return slug;
    }
  }
  return null;
}

function syncWorkspaceUrlSlug(slug: string | null): void {
  if (typeof window === 'undefined') return;
  try {
    const isSubdomain = /^data\./i.test(window.location.hostname);
    const targetPath = slug ? (isSubdomain ? `/${slug}` : `/data/${slug}`) : isSubdomain ? '/' : '/data';
    if (window.location.pathname !== targetPath) {
      window.history.replaceState(null, '', targetPath);
    }
  } catch {
    // Ignore history replace errors
  }
}

export function DomationDataLanding() {
  usePageSeo(getDataSeoConfig());
  const [catalog, setCatalog] = useState<ClientBillingCatalog>(DEFAULT_CLIENT_CATALOG);
  const [googleClientId, setGoogleClientId] = useState<string | null>(() => {
    const viteClientId = (import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined)?.trim();
    return viteClientId || '641158233158-nsg8a8tdsj3fdgb34dc9tugm8god7tho.apps.googleusercontent.com';
  });
  const [session, setSession] = useState<TenantSessionV2 | null>(() => readSavedSession());

  // Full-screen setup app state (auto-open if URL targets /data/:slug or data.domation.net/:slug)
  const initialPathSlug = detectWorkspacePathSlug();
  const [setupOpen, setSetupOpen] = useState<boolean>(() => Boolean(initialPathSlug));
  const [setupIntent, setSetupIntent] = useState<SetupModalIntent>(() =>
    initialPathSlug && readSavedSession()?.tenant_slug === initialPathSlug
      ? 'workspace_router'
      : initialPathSlug
        ? 'login'
        : 'register'
  );
  const [setupModalKey, setSetupModalKey] = useState(0);

  // Legal Docs & Cookie Consent state
  const [legalOpen, setLegalOpen] = useState<boolean>(() => detectInitialLegalModal().open);
  const [legalTab, setLegalTab] = useState<LegalDocTab>(() => detectInitialLegalModal().tab);
  const [cookieForceCounter, setCookieForceCounter] = useState(0);

  // Pricing section cycle toggle & topup wallet toggle (hidden by default)
  const [pricingCycle, setPricingCycle] = useState<'annual' | 'monthly'>('annual');
  const [showTopupWallet, setShowTopupWallet] = useState(false);
  const [showBackTop, setShowBackTop] = useState(false);

  // Zoomable screenshot lightbox
  const [zoomImage, setZoomImage] = useState<ScreenshotItem | null>(null);

  useEffect(() => {
    const onScroll = () => setShowBackTop(window.scrollY > 560);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Sync live dynamic catalog & platform defaults from real backend bridge
  useEffect(() => {
    let mounted = true;
    const bootstrapFromApi = async () => {
      try {
        const res = await fetch('/api/autodata?action=bootstrap');
        const json = (await res.json()) as {
          success?: boolean;
          data?: {
            catalog?: ClientBillingCatalog;
            google_oauth?: { enabled?: boolean; client_id?: string | null };
          };
        };
        if (!mounted || !json.success || !json.data) return;
        if (json.data.catalog) setCatalog(json.data.catalog);
        if (json.data.google_oauth?.client_id) {
          setGoogleClientId(json.data.google_oauth.client_id);
        }
      } catch {
        // Fallback catalog remains active
      }
    };
    void bootstrapFromApi();
    return () => {
      mounted = false;
    };
  }, []);

  const handleSessionChange = (nextSession: TenantSessionV2 | null) => {
    setSession(nextSession);
    syncWorkspaceUrlSlug(nextSession ? nextSession.tenant_slug : null);
    try {
      if (nextSession) {
        window.localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(nextSession));
      } else {
        window.localStorage.removeItem(SESSION_STORAGE_KEY);
      }
    } catch {
      // Ignore storage quota issues
    }
  };

  const openFullScreenApp = (intent: SetupModalIntent) => {
    setSetupIntent(intent);
    setSetupModalKey((k) => k + 1);
    setSetupOpen(true);
    if (session && intent.startsWith('workspace_')) {
      syncWorkspaceUrlSlug(session.tenant_slug);
    }
  };

  const openLegalDoc = (tab: LegalDocTab) => {
    setLegalTab(tab);
    setLegalOpen(true);
    try {
      const nextUrl = `/data?legal=${tab}`;
      if (window.location.pathname.startsWith('/data')) {
        window.history.replaceState(null, '', nextUrl);
      }
    } catch {
      // Ignore history replace errors
    }
  };

  const closeLegalDoc = () => {
    setLegalOpen(false);
    try {
      if (window.location.search.includes('legal=')) {
        window.history.replaceState(null, '', '/data');
      }
    } catch {
      // Ignore history replace errors
    }
  };

  const handleDownloadSamplePersonalCsv = () => {
    const csv = buildPersonalLeadsCsvContent(DEMO_PERSONAL_LEADS_CSV);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'mau-du-lieu-cong-sale-ca-nhan-domation.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const standardPlan = catalog.plans[0] || DEFAULT_CLIENT_CATALOG.plans[0];

  const routerEngineCards: Array<{
    icon: React.ComponentType<{ className?: string }>;
    title: string;
    desc: string;
  }> = [
    {
      icon: Scale,
      title: '1. Chia Vòng Theo Năng Lực & Xoay Vòng 1:1',
      desc: 'Tùy chỉnh tỷ lệ phân bổ linh hoạt (chẳng hạn Sale kinh nghiệm nhận 3 khách, Sale mới nhận 1 khách) hoặc chia đều xoay vòng 1:1 theo ca trực.',
    },
    {
      icon: UserCheck,
      title: '2. Chống Trùng Khách Hàng Trong 90 Ngày',
      desc: 'Tự động nhận diện khách hàng cũ quay lại từ các chiến dịch khác để chuyển thẳng về đúng chuyên viên đang chăm sóc, chấm dứt tranh chấp nội bộ.',
    },
    {
      icon: Clock,
      title: '3. Giữ Lead Luôn Nóng & Giao Zalo Tức Thì',
      desc: 'Khách vừa để lại thông tin là tự động phân bổ cho Sale đang Online qua Zalo ngay lập tức — không chờ gom cuối ngày, tạo cảm giác được phục vụ tức thì cho khách hàng.',
    },
    {
      icon: RefreshCw,
      title: '4. Báo Số Lỗi & Cơ Chế Bù Data 1-Đổi-1',
      desc: 'Gặp khách sai số, thuê bao hoặc sai đối tượng nhu cầu, Sale báo lỗi ngay trên Zalo; Quản lý duyệt là hệ thống tự động cộng trả 1 lượt bù ưu tiên công bằng.',
    },
    {
      icon: Users,
      title: '5. Mặc Định Sale Nội Bộ & Tùy Chọn Đại Lý',
      desc: 'Phân bổ thẳng cho từng chuyên viên Sale nội bộ (hiển thị đầy đủ SĐT để gọi ngay). Khi mở rộng thêm CTV ngoài có thể bật chế độ bảo mật che số.',
    },
    {
      icon: Gauge,
      title: '6. Đo Lường Công Bằng & Nuôi Máy Học Ads',
      desc: 'Đồng bộ kết quả chất lượng từ đội Sale về Facebook để tối ưu chi phí quảng cáo, kèm báo cáo minh bạch hiệu suất từng nhân sự cho Ban Lãnh Đạo.',
    },
  ];

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-slate-900 font-sans relative overflow-x-clip selection:bg-[#1E40FF] selection:text-white">
      <LuxuryGoldBackdrop />

      {/* Unified DOMATION Global Navigation Bar (100% consistent, zero overlap) */}
      <Navbar
        activePage="data"
        onOpenShowcase={() => {
          document.getElementById('router-engine')?.scrollIntoView({ behavior: 'smooth' });
        }}
        onOpenContact={() => openFullScreenApp(session ? 'workspace_router' : 'register')}
        contactLabel={session ? 'Mở Workspace' : 'Dùng Thử Miễn Phí'}
      />

      <main className="relative z-10 pt-28 md:pt-32">
        {/* ====================================================================
            HERO SECTION — DOMATION Clean Glass & Royal-to-Sky Aesthetics
           ==================================================================== */}
        <section className="pb-16 sm:pb-24 px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center space-y-6">
            <div className="ql-eyebrow flex-wrap justify-center">
              <Sparkles className="w-3.5 h-3.5 text-[#1E40FF] shrink-0" />
              <span>DÀNH CHO CÁC DOANH NGHIỆP CÓ SALE TƯ VẤN KHÁCH HÀNG</span>
            </div>

            <h1 className="text-3xl sm:text-5xl xl:text-[52px] font-black text-slate-900 leading-[1.22] tracking-[-0.02em]">
              Tự động chia vòng Lead đa kênh
              <span className="block text-gradient-inkica mt-1.5">
                cho từng nhân viên Sale.
              </span>
            </h1>

            <p className="max-w-2xl mx-auto text-base sm:text-lg text-slate-600 leading-relaxed">
              Chấm dứt cảnh mỗi ngày Marketing mới gom file chia data làm nguội khách — khách vừa đăng ký là tự động phân bổ cho Sale chăm sóc tức thì, giữ trọn độ nóng &amp; tối ưu Meta Ads.
            </p>

            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3.5">
              <button
                type="button"
                onClick={() => openFullScreenApp(session ? 'workspace_router' : 'register')}
                className="btn-inkica-primary w-full sm:w-auto rounded-full px-7 py-3.5 text-sm cursor-pointer whitespace-nowrap"
              >
                <span>
                  {session
                    ? `Mở Workspace: ${session.company_name}`
                    : `Dùng thử ${catalog.trial_duration_months} tháng miễn phí`}
                </span>
                <ArrowRight className="w-4 h-4 shrink-0" />
              </button>

              <button
                type="button"
                onClick={() => openFullScreenApp(session ? 'workspace_billing' : 'login')}
                className="ql-btn-outline w-full sm:w-auto rounded-full px-6 py-3.5 text-sm cursor-pointer whitespace-nowrap"
              >
                <span>
                  {session
                    ? `Quản lý Gói & Ví (${session.subscription?.days_remaining ?? 30} ngày)`
                    : 'Đăng nhập Workspace'}
                </span>
              </button>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1.5 text-xs text-slate-500">
              <span>
                Miễn phí <strong className="text-slate-900">{catalog.trial_duration_months} tháng đầu ({catalog.trial_duration_days} ngày)</strong>
              </span>
              <span>·</span>
              <span>
                Gia hạn từ <strong className="text-slate-900">{catalog.base_monthly_price_vnd.toLocaleString('vi-VN')}₫/tháng</strong>
              </span>
              <span>·</span>
              <span>
                Mua năm giảm <strong className="text-emerald-700">{catalog.annual_discount_pct}% ({standardPlan.annual_monthly_equivalent_vnd.toLocaleString('vi-VN')}₫/tháng)</strong>
              </span>
            </div>
          </div>

          {/* DOMATION Unified Connector & 2-Way Sync Bar */}
          <div className="max-w-5xl mx-auto mt-12 rounded-[28px] bg-white/85 backdrop-blur-2xl border border-slate-200/80 shadow-[0_24px_64px_-24px_rgba(15,23,42,0.08)] p-6 sm:p-8 flex flex-col gap-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-1 text-left">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-800">
                    KẾT NỐI ĐA KÊNH • ZALO, TELEGRAM, GOOGLE SHEETS &amp; REST API 2 CHIỀU
                  </span>
                </div>
                <p className="text-xs text-slate-500">
                  Nhận khách tức thì từ quảng cáo, chia thẳng vòng sang Zalo / Telegram cá nhân của Sale và đồng bộ ngược trạng thái chốt đơn.
                </p>
              </div>
              <button
                type="button"
                onClick={() => openFullScreenApp(session ? 'workspace_router' : 'register')}
                className="self-start sm:self-center ql-btn-outline rounded-full px-4 py-2 text-xs cursor-pointer whitespace-nowrap shrink-0"
              >
                <span>Khởi tạo 60 giây</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="pt-4 border-t border-slate-200/75">
              <ChannelLogoStrip variant="autodata" />
            </div>
          </div>
        </section>

      {/* ====================================================================
          REAL PARTNERS STRIP (#partners)
         ==================================================================== */}
      <section id="partners" className="py-16 sm:py-20 px-4 sm:px-6 lg:px-8 border-y border-slate-200/70 bg-white/55 backdrop-blur-md">
        <div className="max-w-7xl mx-auto space-y-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div className="max-w-2xl">
              <div className="ql-eyebrow mb-3">
                <span>ĐỒNG HÀNH CÙNG CHỦ ĐẦU TƯ &amp; ĐỘI NGŨ KINH DOANH</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 leading-[1.25] tracking-tight">
                Được Tin Dùng Bởi{' '}
                <span className="text-gradient-inkica">Các Đội Sale &amp; Doanh Nghiệp Toàn Quốc</span>
              </h2>
            </div>
            <p className="text-sm text-slate-600 max-w-md leading-relaxed">
              Hạ tầng vận hành thực tế cho Bất động sản, Giáo dục, Y tế, Chủ đầu tư và các Đại lý phân phối F1.
            </p>
          </div>

          <div className="rounded-[28px] bg-white/80 backdrop-blur-xl border border-slate-200/80 shadow-xs grid grid-cols-2 sm:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-slate-200/75 overflow-hidden">
            {PARTNER_BRANDS.map((partner, idx) => (
              <div
                key={partner.name}
                className={`px-5 py-6 flex flex-col items-center justify-center text-center gap-3 hover:bg-slate-50/70 transition-colors ${
                  idx >= 4 ? 'sm:border-t sm:border-slate-200/75' : ''
                }`}
              >
                <div className="h-11 flex items-center justify-center">
                  <img
                    src={partner.logo}
                    alt={partner.name}
                    loading="lazy"
                    className="max-h-10 max-w-[150px] w-auto object-contain"
                  />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-800">{partner.name}</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">{partner.sector}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ====================================================================
          INDUSTRIES FIT (#industries) — DOMATION Swiss Glass + 3D Decor
         ==================================================================== */}
      <section id="industries" className="scroll-mt-24 py-20 sm:py-26 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10 sm:mb-12">
            <div className="max-w-2xl">
              <div className="ql-eyebrow mb-3">
                <Sparkles className="w-3.5 h-3.5 text-[#1E40FF]" />
                <span>PHÙ HỢP VỚI CÁC DOANH NGHIỆP NÀO?</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 leading-[1.25] tracking-tight">
                Thiết Kế Chuẩn Cho{' '}
                <span className="text-gradient-inkica">Mọi Doanh Nghiệp Có Sale Tư Vấn</span>
              </h2>
            </div>
            <p className="text-sm text-slate-600 max-w-md leading-relaxed">
              Dù đội ngũ 3 người hay hệ thống đa chi nhánh, phễu chia số sẵn sàng hoạt động ngay theo đặc thù ngành hàng.
            </p>
          </div>

          {/* Top Flagship Multi-Industry Card + 6 Specialized Sector Cards inside Clean Glass Grid */}
          <div className="rounded-[28px] bg-white/80 backdrop-blur-xl border border-slate-200/80 shadow-xs overflow-hidden divide-y divide-slate-200/75">
            {/* Flagship Row */}
            <div className="p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 bg-gradient-to-r from-[#F4F8FF]/85 via-white/95 to-white">
              <div className="flex items-start gap-4 max-w-2xl">
                <div className="w-12 h-12 rounded-2xl bg-[#1E40FF] text-white shadow-sm flex items-center justify-center shrink-0">
                  <Users className="w-5 h-5" />
                </div>
                <div className="space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-white border border-slate-200/80 px-2.5 py-0.5 text-[10px] font-semibold text-slate-700">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      Mặc định tối ưu
                    </span>
                    <span className="text-[11px] font-medium text-slate-500">Đổi linh hoạt bất cứ lúc nào</span>
                  </div>
                  <h3 className="text-lg font-bold text-slate-900">
                    Đa Ngành / Đội Sale Nội Bộ
                  </h3>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    Phân bổ khách hàng trực tiếp cho từng nhân viên Sale &amp; tư vấn viên nội bộ, hiển thị đầy đủ SĐT để gọi ngay tức thì qua Zalo.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-5 shrink-0">
                <img
                  src="/imgs/enterprise/decor-crystal-prism.png"
                  alt=""
                  aria-hidden="true"
                  loading="lazy"
                  className="w-14 h-14 object-contain hidden sm:block animate-float-decor drop-shadow-[0_12px_20px_rgba(30,64,255,0.16)]"
                />
                <button
                  type="button"
                  onClick={() => openFullScreenApp(session ? 'workspace_router' : 'register')}
                  className="btn-inkica-primary rounded-full px-5 py-2.5 text-xs cursor-pointer whitespace-nowrap"
                >
                  <span>Chọn phễu ngành này</span>
                  <ArrowRight className="w-3.5 h-3.5 shrink-0" />
                </button>
              </div>
            </div>

            {/* 6 Specialized Sectors Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-slate-200/75">
              {[
                {
                  icon: Building2,
                  tag: 'Dự án & Sàn F1',
                  title: 'Bất Động Sản & Sàn Kinh Doanh',
                  desc: 'Chia giỏ dự án công bằng cho Sale nội bộ; tùy chọn mở rộng thêm CTV hoặc Đại lý F1.',
                },
                {
                  icon: HeartPulse,
                  tag: 'Chuỗi phòng khám',
                  title: 'Nha Khoa, Thẩm Mỹ & Phòng Khám',
                  desc: 'Đặt lịch tư vấn bác sĩ, phân tuyến khách hàng theo từng chi nhánh & khu vực cơ sở.',
                },
                {
                  icon: GraduationCap,
                  tag: 'Tuyển sinh & Khóa học',
                  title: 'Giáo Dục, Học Viện & Du Học',
                  desc: 'Phân bổ học viên tiềm năng theo khóa học, chương trình kiểm tra đầu vào & cơ sở.',
                },
                {
                  icon: Briefcase,
                  tag: 'Tư vấn doanh nghiệp',
                  title: 'Dịch Vụ B2B, Phần Mềm & Agency',
                  desc: 'Định tuyến khách doanh nghiệp theo quy mô hợp đồng & chuyên viên tư vấn phụ trách.',
                },
                {
                  icon: ShoppingBag,
                  tag: 'Chốt đơn đa kênh',
                  title: 'Thương Mại & Chuỗi Bán Lẻ',
                  desc: 'Gom đơn từ Landing Page, TikTok, Facebook và chia vòng xử lý tức thì không sót khách.',
                },
                {
                  icon: Car,
                  tag: 'Giá trị đơn cao',
                  title: 'Showroom Ô Tô & Tài Chính Bảo Hiểm',
                  desc: 'Phân bổ lịch đăng ký lái thử, thẩm định hồ sơ tư vấn vay tức thì ngay khi khách đăng ký.',
                },
              ].map((sector, idx) => {
                const SectorIcon = sector.icon;
                return (
                  <div
                    key={sector.title}
                    className={`p-6 sm:p-8 flex flex-col justify-between gap-4 hover:bg-slate-50/65 transition-colors ${
                      idx >= 3 ? 'lg:border-t lg:border-slate-200/75' : ''
                    } ${idx >= 2 ? 'md:border-t md:border-slate-200/75 lg:border-t-0' : ''}`}
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between gap-2">
                        <div className="w-10 h-10 rounded-xl bg-white border border-slate-200/80 text-[#1E40FF] shadow-2xs flex items-center justify-center shrink-0">
                          <SectorIcon className="w-4 h-4" />
                        </div>
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 bg-slate-50 px-2.5 py-1 rounded-full border border-slate-200/70">
                          {sector.tag}
                        </span>
                      </div>
                      <h3 className="text-base font-bold text-slate-900 leading-snug">
                        {sector.title}
                      </h3>
                      <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                        {sector.desc}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* ====================================================================
          DEEP AUTO DATA ROUTER MECHANICS (#router-engine) — Swiss Hairline Grid + Decor
         ==================================================================== */}
      <section id="router-engine" className="scroll-mt-24 py-20 sm:py-24 px-4 sm:px-6 lg:px-8 border-t border-slate-200/70 bg-white/40 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8 sm:mb-10">
            <div className="max-w-2xl">
              <div className="ql-eyebrow mb-3">
                <span>GIỮ LEAD LUÔN NÓNG • CHĂM SÓC NGAY LẬP TỨC</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 leading-[1.25] tracking-tight">
                Phân Bổ Tức Thì Khi Khách Vừa Quan Tâm —{' '}
                <span className="text-gradient-inkica">Không Để Lead Bị Nguội</span>
              </h2>
            </div>
            <p className="text-sm text-slate-600 max-w-md leading-relaxed">
              Thay vì chờ Marketing cuối ngày hay sáng hôm sau mới chia file khiến khách quên mất mình vừa hỏi gì, hệ thống đưa Lead tới tay Sale tức thì để tạo cảm giác phản hồi ngay lập tức.
            </p>
          </div>

          <div className="mb-6 rounded-[24px] bg-white/85 backdrop-blur-xl border border-slate-200/80 shadow-xs grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-200/75 overflow-hidden">
            <div className="p-5 sm:p-6 bg-slate-100/95 space-y-1.5">
              <div className="inline-flex items-center gap-1.5 rounded-full bg-rose-100 border border-rose-200 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-rose-700">
                Cách chia cũ • Lead bị nguội
              </div>
              <div className="text-sm font-bold text-slate-700">
                Mỗi ngày Marketing mới tổng hợp &amp; chia data 1 lần
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Khách để lại SĐT buổi sáng nhưng chiều hoặc hôm sau Sale mới gọi → khách đã nguội nhu cầu, quên thông tin tư vấn hoặc chốt sang đối thủ phản hồi nhanh hơn.
              </p>
            </div>
            <div className="p-5 sm:p-6 bg-gradient-to-r from-[#F4F8FF]/90 to-white space-y-1.5">
              <div className="inline-flex items-center gap-1.5 rounded-full bg-[#1E40FF]/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#1E40FF]">
                DOMATION Auto Data • Giữ Lead luôn nóng
              </div>
              <div className="text-sm font-bold text-slate-900">
                Khách vừa gửi form là phân bổ cho Sale gọi ngay tức thì
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Hệ thống tự động chọn đúng Sale đang trực, gửi thông báo Zalo tức thì để Sale liên hệ ngay khi khách còn đang cầm điện thoại — tạo ấn tượng chuyên nghiệp &amp; nâng cao tỷ lệ chốt.
              </p>
            </div>
          </div>

          <div className="rounded-[28px] bg-white/80 backdrop-blur-xl border border-slate-200/80 shadow-xs grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-slate-200/75 overflow-hidden">
            {routerEngineCards.map((card, i) => {
              const Icon = card.icon;
              const decorSrc =
                i === 0
                  ? '/imgs/enterprise/decor-funnel-orb.png'
                  : i === 2
                    ? '/imgs/enterprise/decor-shield-node.png'
                    : i === 4
                      ? '/imgs/enterprise/decor-torus-ring.png'
                      : null;
              return (
                <div
                  key={i}
                  className={`p-7 sm:p-9 flex flex-col justify-between gap-4 group hover:bg-slate-50/60 transition-colors ${
                    i >= 3 ? 'lg:border-t lg:border-slate-200/75' : ''
                  } ${i >= 2 ? 'md:border-t md:border-slate-200/75 lg:border-t-0' : ''}`}
                >
                  <div className="space-y-3.5">
                    <div className="flex items-center justify-between gap-3">
                      <div className="inline-flex items-center gap-2.5">
                        <span className="w-9 h-9 rounded-xl bg-white border border-slate-200/80 text-[#1E40FF] shadow-2xs flex items-center justify-center shrink-0">
                          <Icon className="w-4 h-4" />
                        </span>
                        <span className="text-[11px] font-semibold tracking-wider text-slate-400 font-mono">
                          0{i + 1}
                        </span>
                      </div>
                      {decorSrc && (
                        <img
                          src={decorSrc}
                          alt=""
                          aria-hidden="true"
                          loading="lazy"
                          className="w-10 h-10 object-contain drop-shadow-[0_10px_16px_rgba(30,64,255,0.16)]"
                        />
                      )}
                    </div>
                    <h3 className="text-base sm:text-lg font-bold text-slate-900 group-hover:text-[#1E40FF] transition-colors leading-snug">
                      {card.title}
                    </h3>
                    <p className="text-sm text-slate-600 leading-relaxed">{card.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ====================================================================
          SPOTLIGHT: AI LEAD PRE-SCORING & 1-FOR-1 FAULTY DATA COMPENSATION (#ai-quality-compensation)
         ==================================================================== */}
      <section
        id="ai-quality-compensation"
        className="scroll-mt-24 py-20 sm:py-24 px-4 sm:px-6 lg:px-8 border-t border-slate-200/70 bg-gradient-to-b from-white/75 via-[#F4F8FF]/55 to-white/60 backdrop-blur-sm"
      >
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10 sm:mb-12">
            <div className="max-w-2xl">
              <div className="ql-eyebrow mb-3">
                <Sparkles className="w-3.5 h-3.5 text-[#1E40FF] shrink-0" />
                <span>LỌC CHẤT LƯỢNG ĐẦU VÀO &amp; BẢO VỆ QUYỀN LỢI SALE</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 leading-[1.25] tracking-tight">
                AI Đánh Giá Trước Khi Giao Lead{' '}
                <span className="text-gradient-inkica">&amp; Bù Data Lỗi 1-Đổi-1</span>
              </h2>
            </div>
            <p className="text-sm text-slate-600 max-w-md leading-relaxed">
              Hai lớp bảo vệ giúp đội Sale chỉ tập trung gọi khách chất lượng thật và không bao giờ chịu thiệt khi lỡ nhận phải data lỗi.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Pillar 1: AI Đánh Giá Trước Khi Giao Lead */}
            <div className="rounded-[28px] bg-white/90 backdrop-blur-xl border border-blue-200/80 shadow-[0_24px_60px_-28px_rgba(30,64,255,0.18)] p-7 sm:p-9 flex flex-col justify-between gap-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-3">
                  <span className="inline-flex items-center gap-2 rounded-full bg-[#1E40FF] text-white px-3.5 py-1 text-[11px] font-bold uppercase tracking-wider shadow-2xs">
                    <Sparkles className="w-3.5 h-3.5 shrink-0" />
                    <span>AI ĐÁNH GIÁ TRƯỚC KHI GIAO LEAD</span>
                  </span>
                  <img
                    src="/imgs/enterprise/decor-crystal-prism.png"
                    alt=""
                    aria-hidden="true"
                    loading="lazy"
                    className="w-10 h-10 object-contain drop-shadow-[0_10px_18px_rgba(30,64,255,0.2)] shrink-0"
                  />
                </div>

                <h3 className="text-xl sm:text-2xl font-bold text-slate-900 leading-snug">
                  Chấm điểm &amp; sàng lọc độ nóng trước khi đẩy cho Sale
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Trước khi phân bổ tới nhân sự, AI tự động phân tích ngữ cảnh để phân loại mức độ tiềm năng, loại bỏ form rác/sai SĐT và gắn tóm tắt nhu cầu giúp Sale mở lời chuẩn xác ngay cuộc gọi đầu tiên.
                </p>

                <div className="space-y-2.5 pt-2">
                  {[
                    {
                      step: '01',
                      title: 'Chấm điểm nhu cầu & phân hạng Hot / Warm Lead',
                      desc: 'Đánh giá mức độ quan tâm từ nội dung đăng ký, chiến dịch & sản phẩm khách chọn trước khi chia.',
                    },
                    {
                      step: '02',
                      title: 'Lọc SĐT ảo, spam form & kiểm tra trùng 90 ngày',
                      desc: 'Chặn dữ liệu rác ngay tại cổng tiếp nhận để không làm loãng giỏ khách và quota của từng Sale.',
                    },
                    {
                      step: '03',
                      title: 'Kèm tóm tắt AI ngay trong tin báo Zalo Sale',
                      desc: 'Sale biết trước khách đang quan tâm phân khúc nào, độ nóng ra sao để tư vấn trúng điểm chạm.',
                    },
                  ].map((row) => (
                    <div
                      key={row.step}
                      className="rounded-2xl bg-[#F4F8FF]/85 border border-blue-100/90 px-4 py-3 flex items-start gap-3"
                    >
                      <span className="mt-0.5 rounded-lg bg-white border border-blue-200/80 px-2 py-0.5 text-[11px] font-mono font-bold text-[#1E40FF] shrink-0">
                        {row.step}
                      </span>
                      <div>
                        <div className="text-xs sm:text-sm font-bold text-slate-900">{row.title}</div>
                        <div className="text-xs text-slate-600 mt-0.5 leading-relaxed">{row.desc}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200/75 flex items-center justify-between gap-3 text-xs">
                <span className="font-semibold text-slate-700">Kết quả: Giảm cuộc gọi rác &amp; tăng tỷ lệ nhấc máy</span>
                <span className="inline-flex items-center gap-1 font-bold text-[#1E40FF] whitespace-nowrap">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>Hoạt động tự động</span>
                </span>
              </div>
            </div>

            {/* Pillar 2: Cơ Chế Bù Data Khi Nhận Data Lỗi */}
            <div className="rounded-[28px] bg-white/90 backdrop-blur-xl border border-emerald-200/80 shadow-[0_24px_60px_-28px_rgba(16,185,129,0.16)] p-7 sm:p-9 flex flex-col justify-between gap-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-3">
                  <span className="inline-flex items-center gap-2 rounded-full bg-emerald-600 text-white px-3.5 py-1 text-[11px] font-bold uppercase tracking-wider shadow-2xs">
                    <RefreshCw className="w-3.5 h-3.5 shrink-0" />
                    <span>CƠ CHẾ BÙ DATA LỖI 1-ĐỔI-1</span>
                  </span>
                  <img
                    src="/imgs/enterprise/decor-shield-node.png"
                    alt=""
                    aria-hidden="true"
                    loading="lazy"
                    className="w-10 h-10 object-contain drop-shadow-[0_10px_18px_rgba(16,185,129,0.2)] shrink-0"
                  />
                </div>

                <h3 className="text-xl sm:text-2xl font-bold text-slate-900 leading-snug">
                  Nhận nhầm số lỗi? Tự động hoàn trả +1 lượt bù công bằng
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Chấm dứt tình trạng Sale ấm ức vì mất lượt khi gặp số thuê bao, nhầm số hay khách spam. Cơ chế đối soát &amp; hoàn trả 1-đổi-1 bảo vệ trọn vẹn sự công bằng cho toàn đội kinh doanh.
                </p>

                <div className="space-y-2.5 pt-2">
                  {[
                    {
                      step: '01',
                      title: 'Sale báo data lỗi 1 chạm ngay trên Zalo / Cổng Sale',
                      desc: 'Chọn nhanh lý do (sai SĐT, không liên lạc được, spam/sai khu vực) kèm ghi chú thực tế.',
                    },
                    {
                      step: '02',
                      title: 'Quản lý duyệt minh bạch — đối soát theo bằng chứng',
                      desc: 'Mọi yêu cầu báo lỗi được lưu lịch sử rõ ràng theo từng chiến dịch để Marketing tối ưu lại nguồn.',
                    },
                    {
                      step: '03',
                      title: 'Tự động cộng trả +1 lượt ưu tiên ở vòng chia kế tiếp',
                      desc: 'Khi được duyệt, hệ thống lập tức bù lại đúng 1 khách mới cho Sale bị nhận data lỗi — công bằng tuyệt đối.',
                    },
                  ].map((row) => (
                    <div
                      key={row.step}
                      className="rounded-2xl bg-emerald-50/65 border border-emerald-100/90 px-4 py-3 flex items-start gap-3"
                    >
                      <span className="mt-0.5 rounded-lg bg-white border border-emerald-200/80 px-2 py-0.5 text-[11px] font-mono font-bold text-emerald-700 shrink-0">
                        {row.step}
                      </span>
                      <div>
                        <div className="text-xs sm:text-sm font-bold text-slate-900">{row.title}</div>
                        <div className="text-xs text-slate-600 mt-0.5 leading-relaxed">{row.desc}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200/75 flex items-center justify-between gap-3 text-xs">
                <span className="font-semibold text-slate-700">Kết quả: Sale an tâm nhận số, không mất quyền lợi</span>
                <span className="inline-flex items-center gap-1 font-bold text-emerald-700 whitespace-nowrap">
                  <ShieldCheck className="w-4 h-4 shrink-0" />
                  <span>Hoàn lượt 1-đổi-1</span>
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ====================================================================
          SHOWCASE: SALE PORT PERSONAL LEADS, CSV EXPORT & 2-WAY SHEETS/API SYNC (#sale-port)
         ==================================================================== */}
      <section
        id="sale-port"
        className="scroll-mt-24 py-20 sm:py-24 px-4 sm:px-6 lg:px-8 border-y border-slate-200/70 bg-white/45 backdrop-blur-sm"
      >
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-5 mb-10 sm:mb-12">
            <div className="max-w-2xl">
              <div className="ql-eyebrow mb-3">
                <FolderKanban className="w-3.5 h-3.5 text-[#1E40FF] shrink-0" />
                <span>CỔNG LÀM VIỆC RIÊNG TỪNG SALE</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 leading-[1.25] tracking-tight">
                Giỏ khách cá nhân,{' '}
                <span className="text-gradient-inkica">Google Sheets &amp; REST API 2 Chiều</span>
              </h2>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={handleDownloadSamplePersonalCsv}
                className="ql-btn-outline rounded-full px-5 py-2.5 text-xs cursor-pointer whitespace-nowrap"
              >
                <Download className="w-3.5 h-3.5 text-[#1E40FF] shrink-0" />
                <span>Tải mẫu CSV Cá Nhân</span>
              </button>
              <button
                type="button"
                onClick={() => openFullScreenApp(session ? 'workspace_sale_port' : 'register')}
                className="btn-inkica-primary rounded-full px-5 py-2.5 text-xs cursor-pointer whitespace-nowrap"
              >
                <span>Trải nghiệm Cổng Sale</span>
                <ArrowRight className="w-3.5 h-3.5 shrink-0" />
              </button>
            </div>
          </div>

          <div className="rounded-[28px] bg-white/85 backdrop-blur-xl border border-slate-200/80 shadow-xs grid grid-cols-1 lg:grid-cols-3 divide-y lg:divide-y-0 lg:divide-x divide-slate-200/75 overflow-hidden">
            {/* Feature 1: Personal Leads Bypass Round-Robin */}
            <div className="p-7 sm:p-9 space-y-5 flex flex-col justify-between">
              <div className="space-y-3.5">
                <div className="flex items-center justify-between gap-2">
                  <div className="w-10 h-10 rounded-xl bg-white border border-slate-200/80 text-[#1E40FF] shadow-2xs flex items-center justify-center shrink-0">
                    <PlusCircle className="w-5 h-5" />
                  </div>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-50 border border-slate-200/80 px-2.5 py-1 text-[10px] font-semibold text-slate-700 whitespace-nowrap">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    Giỏ riêng • 0 Quota
                  </span>
                </div>
                <h3 className="text-lg font-bold text-slate-900 leading-snug">
                  1. Nhập / Import Data Cá Nhân Độc Lập
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Sale tự nhập tay hoặc import file khách hàng riêng vào Cổng Sale: đi thẳng vào giỏ cá nhân, <strong>không qua vòng chia chung</strong> và <strong>không trừ định mức nhận khách Ads</strong>.
                </p>
              </div>
              <div className="rounded-2xl bg-slate-50/85 border border-slate-200/75 p-4 text-xs text-slate-700 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Tác động vòng chia chung:</span>
                  <span className="font-mono font-semibold text-slate-900">0 lượt (Độc lập)</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Quyền quản lý khách riêng:</span>
                  <span className="font-semibold text-[#1E40FF]">Sở hữu 100%</span>
                </div>
              </div>
            </div>

            {/* Feature 2: Personal CSV Export */}
            <div className="p-7 sm:p-9 space-y-5 flex flex-col justify-between">
              <div className="space-y-3.5">
                <div className="flex items-center justify-between gap-2">
                  <div className="w-10 h-10 rounded-xl bg-white border border-slate-200/80 text-[#1E40FF] shadow-2xs flex items-center justify-center shrink-0">
                    <Download className="w-5 h-5" />
                  </div>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-50 border border-slate-200/80 px-2.5 py-1 text-[10px] font-semibold text-slate-700 whitespace-nowrap">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#1E40FF]" />
                    Chuẩn Excel tiếng Việt
                  </span>
                </div>
                <h3 className="text-lg font-bold text-slate-900 leading-snug">
                  2. Xuất File CSV Cá Nhân 1 Chạm
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Mỗi nhân viên Sale chủ động lọc theo trạng thái, nguồn khách hoặc ngày tạo và tải danh sách khách hàng thuộc quyền phụ trách ra file <strong>.CSV chuẩn tiếng Việt</strong>.
                </p>
              </div>
              <div className="rounded-2xl bg-slate-50/85 border border-slate-200/75 p-4 text-xs text-slate-700 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Phân quyền dữ liệu:</span>
                  <span className="font-semibold text-slate-900">Sale nào chỉ xuất giỏ đó</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Định dạng tương thích:</span>
                  <span className="font-mono font-semibold text-slate-900">UTF-8 Excel Ready</span>
                </div>
              </div>
            </div>

            {/* Feature 3: Google Sheets & REST API 2-Way Sync */}
            <div className="p-7 sm:p-9 space-y-5 flex flex-col justify-between">
              <div className="space-y-3.5">
                <div className="flex items-center justify-between gap-2">
                  <div className="w-10 h-10 rounded-xl bg-white border border-slate-200/80 text-[#1E40FF] shadow-2xs flex items-center justify-center shrink-0">
                    <Table2 className="w-5 h-5" />
                  </div>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-50 border border-slate-200/80 px-2.5 py-1 text-[10px] font-semibold text-slate-700 whitespace-nowrap">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-500" />
                    Đồng Bộ 2 Chiều
                  </span>
                </div>
                <h3 className="text-lg font-bold text-slate-900 leading-snug">
                  3. Google Sheets &amp; REST API Đồng Bộ 2 Chiều
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Kết nối cả <strong>Google Sheets</strong> cho từng Sale lẫn <strong>REST API / Webhook 2 chiều</strong> cho hệ thống sẵn có — mọi cập nhật trạng thái &amp; kết quả tư vấn tự động đồng bộ tức thì cả hai phía.
                </p>
              </div>
              <div className="rounded-2xl bg-slate-50/85 border border-slate-200/75 p-4 text-xs text-slate-700 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Google Sheets &amp; API:</span>
                  <span className="font-semibold text-[#1E40FF]">Đồng bộ Real-Time 2 chiều</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Thao tác nhân viên:</span>
                  <span className="font-semibold text-emerald-700">Quen thuộc, sẵn dùng ngay</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ====================================================================
          OMNI-CHANNEL FLOW (#omni-channel) — DOMATION Home Hub Showcase
         ==================================================================== */}
      <section id="omni-channel" className="scroll-mt-24 py-20 sm:py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10 sm:mb-12">
            <div className="max-w-2xl">
              <div className="ql-eyebrow mb-3">
                <span>QUY TRÌNH VẬN HÀNH KHÉP KÍN</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 leading-[1.25] tracking-tight">
                Từ Quảng Cáo Đến Zalo Sale{' '}
                <span className="text-gradient-inkica">Ngay Lập Tức</span>
              </h2>
            </div>
            <p className="text-sm text-slate-600 max-w-md leading-relaxed">
              4 bước tự động hoàn toàn giúp Ban Lãnh Đạo kiểm soát trọn vẹn hành trình khách hàng và chi phí Ads.
            </p>
          </div>

          <div className="rounded-[28px] bg-white/85 backdrop-blur-2xl border border-slate-200/80 shadow-[0_24px_64px_-24px_rgba(15,23,42,0.07)] p-6 sm:p-10">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center">
              {/* Left Visual Card matching DomationHome Hub */}
              <div className="lg:col-span-5 space-y-5">
                <div className="relative rounded-2xl overflow-hidden border border-slate-200/75 bg-[#F4F8FF]">
                  <img
                    src="/imgs/enterprise/sol-data-capi.webp"
                    alt="Trung tâm điều phối và đồng bộ dữ liệu DOMATION Auto Data"
                    loading="lazy"
                    className="w-full h-56 sm:h-64 object-cover"
                  />
                </div>
                <div className="space-y-2.5">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-[#1E40FF]">
                      AUTO ROUTING ENGINE • CHIA THẲNG TỨC THÌ
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                    Nhận dữ liệu đa nguồn, khử trùng 90 ngày, giao thẳng qua Zalo Sale đang Online và đồng bộ ngược kết quả về Facebook CAPI, Google Sheets &amp; API 2 chiều.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => openFullScreenApp(session ? 'workspace_router' : 'register')}
                  className="btn-inkica-primary rounded-full px-6 py-3 text-xs sm:text-sm cursor-pointer whitespace-nowrap"
                >
                  <span>Trải nghiệm hệ thống ngay</span>
                  <ArrowRight className="w-4 h-4 shrink-0" />
                </button>
              </div>

              {/* Right 2x2 Flow Cards matching DomationHome Orchestrator */}
              <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  {
                    step: 'BƯỚC 01 • THU HÚT',
                    icon: Webhook,
                    title: 'Hội tụ mọi nguồn khách',
                    desc: 'Nhận dữ liệu thời gian thực từ Facebook Lead Ads, TikTok, LadiPage, Website và Form tư vấn về một nơi duy nhất.',
                  },
                  {
                    step: 'BƯỚC 02 • AI ĐÁNH GIÁ & CHIA VÒNG',
                    icon: Layers,
                    title: 'AI chấm điểm, lọc trùng & chia đều',
                    desc: 'AI đánh giá mức độ tiềm năng & chặn số rác trước khi giao, tự động lọc trùng 90 ngày và bù lượt 1-đổi-1 nếu phát sinh data lỗi.',
                  },
                  {
                    step: 'BƯỚC 03 • TƯƠNG TÁC TỨC THÌ',
                    icon: Bot,
                    title: 'Báo Zalo & Cập nhật Sheet',
                    desc: 'Gửi tin báo khách mới đến Zalo cá nhân của Sale ngay lập tức, đồng thời đồng bộ 2 chiều qua Google Sheets & REST API.',
                  },
                  {
                    step: 'BƯỚC 04 • TỐI ƯU CHI PHÍ',
                    icon: Activity,
                    title: 'Đo lường hiệu quả Ads',
                    desc: 'Khi Sale xác nhận khách nét hoặc chốt đơn, tín hiệu chất lượng được phản hồi tự động để tối ưu ngân sách quảng cáo.',
                  },
                ].map((item, idx) => {
                  const Icon = item.icon;
                  return (
                    <div
                      key={idx}
                      className="rounded-2xl bg-slate-50/75 hover:bg-white border border-slate-200/75 p-5 sm:p-6 transition-colors flex flex-col justify-between gap-3"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="w-9 h-9 rounded-xl bg-white border border-slate-200/80 text-[#1E40FF] flex items-center justify-center shadow-2xs shrink-0">
                          <Icon className="w-4 h-4" />
                        </div>
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 bg-white px-2.5 py-1 rounded-full border border-slate-200/70 whitespace-nowrap">
                          {item.step}
                        </span>
                      </div>
                      <div>
                        <h3 className="text-sm sm:text-base font-semibold text-slate-900 mb-1">
                          {item.title}
                        </h3>
                        <p className="text-xs text-slate-600 leading-relaxed">{item.desc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Integrated Connectors Strip matching DomationHome */}
            <div className="mt-8 pt-7 border-t border-slate-200/75 flex flex-col xl:flex-row xl:items-center justify-between gap-4">
              <div className="shrink-0">
                <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-800">
                  ZALO, TELEGRAM, GOOGLE SHEETS &amp; REST API 2 CHIỀU
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Kết nối hai chiều thời gian thực với hệ sinh thái marketing &amp; bán hàng sẵn có của doanh nghiệp.
                </p>
              </div>

              <ChannelLogoStrip variant="autodata" className="w-full xl:max-w-[740px]" />
            </div>
          </div>
        </div>
      </section>

      {/* ====================================================================
          EXECUTIVE ONBOARDING PROMISE (#zalo-connect-guide) — Swiss Hairline + Refined Dot Badges
         ==================================================================== */}
      <section id="zalo-connect-guide" className="scroll-mt-24 py-20 sm:py-24 px-4 sm:px-6 lg:px-8 border-y border-slate-200/70 bg-white/55 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-5 mb-10 sm:mb-12">
            <div className="max-w-2xl">
              <div className="ql-eyebrow mb-3">
                <span>TRIỂN KHAI TRONG 60 GIÂY • KHÔNG CẦN ĐỘI NGŨ IT</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 leading-[1.25] tracking-tight">
                Vận Hành Ngay —{' '}
                <span className="text-gradient-inkica">Hướng Dẫn Từng Bước Trong App</span>
              </h2>
            </div>
            <button
              type="button"
              onClick={() => openFullScreenApp(session ? 'workspace_router' : 'register')}
              className="btn-inkica-primary self-start lg:self-end rounded-full px-6 py-3 text-xs sm:text-sm cursor-pointer whitespace-nowrap shrink-0"
            >
              <span>Bắt đầu dùng thử {catalog.trial_duration_months} tháng 0đ</span>
              <ArrowRight className="w-4 h-4 shrink-0" />
            </button>
          </div>

          <div className="rounded-[28px] bg-white/80 backdrop-blur-xl border border-slate-200/80 shadow-xs grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-slate-200/75 overflow-hidden">
            {[
              {
                badge: 'BƯỚC 01 • BẮT BUỘC (30 GIÂY)',
                dotTone: 'bg-rose-500',
                decor: '/imgs/enterprise/decor-funnel-orb.png',
                title: 'Tạo Không Gian Làm Việc Riêng',
                desc: 'Chỉ cần điền thông tin đội Sale và tài khoản quản trị để mở khóa ngay bộ chia số thông minh và Cổng làm việc cho từng nhân viên.',
              },
              {
                badge: 'BƯỚC 02 • LINH HOẠT THEO QUY MÔ',
                dotTone: 'bg-amber-500',
                decor: '/imgs/enterprise/decor-crystal-prism.png',
                title: 'Chọn Quy Tắc Chia Số Đội Ngũ',
                desc: 'Mặc định chia thẳng cho từng Sale nội bộ theo năng lực hoặc xoay vòng 1:1. Điều chỉnh tỷ lệ, ngày chống trùng bất cứ lúc nào.',
              },
              {
                badge: 'BƯỚC 03 • TÙY CHỌN & TOUR TRONG APP',
                dotTone: 'bg-emerald-500',
                decor: '/imgs/enterprise/decor-torus-ring.png',
                title: 'Hướng Dẫn Chỉ Điểm Từng Bước',
                desc: 'Khi cần kết nối thông báo Zalo hoặc Google Sheets cho Sale, Tour hướng dẫn chỉ điểm ngay bên trong Workspace sẽ dẫn dắt từng thao tác.',
              },
            ].map((item, idx) => (
              <div key={idx} className="p-7 sm:p-9 space-y-4 flex flex-col justify-between">
                <div className="space-y-4">
                  <div className="flex items-center justify-between gap-3">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-white border border-slate-200/80 px-2.5 py-1 text-[10px] font-semibold text-slate-700 whitespace-nowrap">
                      <span className={`w-1.5 h-1.5 rounded-full ${item.dotTone} shrink-0`} />
                      <span>{item.badge}</span>
                    </span>
                    <img
                      src={item.decor}
                      alt=""
                      aria-hidden="true"
                      loading="lazy"
                      className="w-10 h-10 object-contain drop-shadow-[0_10px_16px_rgba(30,64,255,0.16)]"
                    />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 leading-snug">{item.title}</h3>
                  <p className="text-sm text-slate-600 leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ====================================================================
          REAL PRODUCT SCREENSHOTS GALLERY (#screenshots)
         ==================================================================== */}
      <section id="screenshots" className="py-20 sm:py-24 px-4 sm:px-6 lg:px-8 border-b border-slate-200/70">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10 sm:mb-12">
            <div className="max-w-2xl">
              <div className="ql-eyebrow mb-3">
                <span>GIAO DIỆN HỆ THỐNG THỰC TẾ</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 leading-[1.25] tracking-tight">
                Trực Quan Cho{' '}
                <span className="text-gradient-inkica">Quản Lý &amp; Nhân Viên Sale</span>
              </h2>
            </div>
            <p className="text-sm text-slate-600 max-w-md leading-relaxed">
              Nhấn vào từng màn hình để phóng to chi tiết các phân hệ điều hành bên trong hệ thống.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {SYSTEM_SCREENSHOTS.map((shot) => (
              <button
                key={shot.title}
                type="button"
                onClick={() => setZoomImage(shot)}
                className="inkica-glass-card group rounded-[24px] overflow-hidden text-left cursor-pointer flex flex-col"
              >
                <div className="relative aspect-[16/10] bg-slate-100 overflow-hidden border-b border-slate-100">
                  <img
                    src={shot.src}
                    alt={shot.title}
                    loading="lazy"
                    className="w-full h-full object-cover object-top group-hover:scale-[1.02] transition-transform duration-300"
                  />
                  <span className="absolute bottom-3 right-3 rounded-full bg-slate-900/85 text-white px-3 py-1 text-[11px] font-semibold inline-flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                    <ZoomIn className="w-3.5 h-3.5 shrink-0" />
                    <span>Phóng to</span>
                  </span>
                </div>
                <div className="p-5 sm:p-6 space-y-1.5 flex-1">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-[#1E40FF]">{shot.badge}</span>
                  <h3 className="text-sm sm:text-base font-bold text-slate-900 leading-snug">{shot.title}</h3>
                  <p className="text-xs text-slate-500 leading-relaxed">{shot.desc}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ====================================================================
          LIVE DYNAMIC PRICING (#pricing) — Unified DOMATION Home Hairline Matrix
         ==================================================================== */}
      <section id="pricing" className="scroll-mt-24 py-20 sm:py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10 sm:mb-12">
            <div className="max-w-2xl">
              <div className="ql-eyebrow mb-3">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>MIỄN PHÍ {catalog.trial_duration_months} THÁNG ĐẦU ({catalog.trial_duration_days} NGÀY)</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 leading-[1.25] tracking-tight">
                Giải Pháp Tương Xứng{' '}
                <span className="text-gradient-inkica">Quy Mô Từng Đội Ngũ Sale</span>
              </h2>
            </div>

            {/* Unified DOMATION Billing Cycle Pill Switcher */}
            <div className="inline-flex items-center p-1 rounded-full bg-white border border-slate-200 shadow-2xs w-fit shrink-0">
              <button
                type="button"
                onClick={() => setPricingCycle('monthly')}
                className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                  pricingCycle === 'monthly' ? 'bg-[#1E40FF] text-white' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Theo Tháng
              </button>
              <button
                type="button"
                onClick={() => setPricingCycle('annual')}
                className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                  pricingCycle === 'annual' ? 'bg-[#1E40FF] text-white' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span>Theo Năm</span>
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                    pricingCycle === 'annual'
                      ? 'bg-white/20 text-white'
                      : 'bg-emerald-50 text-emerald-700'
                  }`}
                >
                  -{catalog.annual_discount_pct}%
                </span>
              </button>
            </div>
          </div>

          {/* Unified 3-Column Matrix (Matching DomationHome.tsx Bespoke Dark Contrast Card) */}
          <div className="rounded-[28px] overflow-hidden border border-slate-200/85 bg-white/85 backdrop-blur-xl shadow-xs grid grid-cols-1 lg:grid-cols-3 divide-y lg:divide-y-0 lg:divide-x divide-slate-200/75 mb-10">
            {catalog.plans.map((plan) => {
              const displayMonthly =
                pricingCycle === 'annual' ? plan.annual_monthly_equivalent_vnd : plan.monthly_price_vnd;
              const isEnterprise = Boolean(plan.is_enterprise_upgrade);

              return (
                <div
                  key={plan.code}
                  className={`p-7 sm:p-9 flex flex-col justify-between ${
                    isEnterprise
                      ? 'bg-gradient-to-br from-slate-950 via-[#0F172A] to-[#0A2568] text-white'
                      : ''
                  }`}
                >
                  <div>
                    <div className="mb-3.5">
                      {plan.badge && (
                        <div
                          className={`inline-block text-[10px] font-semibold uppercase tracking-widest px-3 py-1 rounded-full ${
                            isEnterprise
                              ? 'bg-cyan-400/20 text-cyan-300'
                              : 'bg-slate-100 text-[#1E40FF]'
                          }`}
                        >
                          {plan.badge}
                        </div>
                      )}
                    </div>

                    <h3
                      className={`text-lg sm:text-xl font-bold ${
                        isEnterprise ? 'text-white' : 'text-slate-900'
                      }`}
                    >
                      {plan.name}
                    </h3>

                    <div className="mt-2.5 mb-1.5 flex items-baseline gap-1.5">
                      <span
                        className={`text-3xl sm:text-4xl font-bold tracking-tight ${
                          isEnterprise ? 'text-white' : 'text-slate-900'
                        }`}
                      >
                        {displayMonthly.toLocaleString('vi-VN')}₫
                      </span>
                      <span
                        className={`text-xs font-medium ${
                          isEnterprise ? 'text-slate-300' : 'text-slate-500'
                        }`}
                      >
                        / tháng
                      </span>
                    </div>

                    {pricingCycle === 'annual' ? (
                      <div
                        className={`text-xs font-medium mb-3 ${
                          isEnterprise ? 'text-cyan-300' : 'text-emerald-700'
                        }`}
                      >
                        {plan.annual_total_vnd.toLocaleString('vi-VN')}₫/năm • Tiết kiệm{' '}
                        {plan.annual_saved_vnd.toLocaleString('vi-VN')}₫
                      </div>
                    ) : (
                      <div
                        className={`text-xs mb-3 ${
                          isEnterprise ? 'text-slate-300' : 'text-slate-500'
                        }`}
                      >
                        Dùng thử {catalog.trial_duration_months} tháng 0đ • Năm -{plan.annual_discount_pct}%
                      </div>
                    )}

                    {/* Clean Quota Pills */}
                    <div className="flex flex-wrap gap-1.5 mb-3.5">
                      {isEnterprise ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 border border-white/15 px-2.5 py-1 text-[11px] font-semibold text-cyan-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-cyan-300" />
                          Không giới hạn Sale &amp; Quản lý
                        </span>
                      ) : (
                        <>
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-50 border border-slate-200/80 px-2.5 py-1 text-[11px] font-semibold text-slate-700">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#1E40FF]" />
                            Tối đa {plan.max_sales ?? (plan.code === 'autodata_standard' ? 5 : 25)} Sale
                          </span>
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-50 border border-slate-200/80 px-2.5 py-1 text-[11px] font-semibold text-slate-600">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            Tối đa {plan.max_managers ?? (plan.code === 'autodata_standard' ? 3 : 10)} Quản lý
                          </span>
                        </>
                      )}
                    </div>

                    <p
                      className={`text-xs sm:text-sm leading-relaxed mb-5 ${
                        isEnterprise ? 'text-slate-300' : 'text-slate-600'
                      }`}
                    >
                      {plan.tagline}
                    </p>

                    <div
                      className={`space-y-2.5 pt-4 border-t ${
                        isEnterprise ? 'border-white/15' : 'border-slate-200/75'
                      }`}
                    >
                      {plan.features.map((feat, idx) => (
                        <div key={idx} className="flex items-start gap-2.5 text-xs sm:text-[13px] leading-snug">
                          <CheckCircle2
                            className={`w-4 h-4 shrink-0 mt-0.5 ${
                              isEnterprise ? 'text-cyan-300' : 'text-emerald-500'
                            }`}
                          />
                          <span className={isEnterprise ? 'text-slate-100' : 'text-slate-700'}>
                            {feat}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      openFullScreenApp(
                        isEnterprise
                          ? session
                            ? 'workspace_crm_erp'
                            : 'register'
                          : session
                            ? 'workspace_billing'
                            : 'register'
                      )
                    }
                    className={`mt-8 w-full py-3.5 px-5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
                      isEnterprise
                        ? 'bg-gradient-to-r from-[#1E40FF] via-[#2563EB] to-[#06B6D4] text-white hover:brightness-110 shadow-lg'
                        : 'ql-btn-outline'
                    }`}
                  >
                    <span>
                      {session
                        ? isEnterprise
                          ? 'Yêu cầu nâng cấp Suite'
                          : 'Gia hạn / Chọn gói này'
                        : `Dùng thử ${catalog.trial_duration_months} tháng 0đ`}
                    </span>
                    <ArrowRight className="w-4 h-4 shrink-0" />
                  </button>
                </div>
              );
            })}
          </div>

          {/* Wallet Topup Packages Banner — Collapsible Toggle (Hidden by Default) */}
          <div className="rounded-[24px] bg-white/80 backdrop-blur-xl border border-slate-200/80 px-5 py-4 sm:px-7 sm:py-5 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setShowTopupWallet((prev) => !prev)}
                aria-expanded={showTopupWallet}
                className="flex items-center gap-3 text-left cursor-pointer group min-w-0"
              >
                <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-100 text-[#1E40FF] flex items-center justify-center shrink-0">
                  <Wallet className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs sm:text-sm font-bold text-slate-900 group-hover:text-[#1E40FF] transition-colors">
                    Ví Topup &amp; Gia hạn tự động
                  </div>
                  <p className="text-[11px] sm:text-xs text-slate-500 truncate">
                    Nạp sẵn hạn mức — Cộng dồn 100% số ngày còn dư
                  </p>
                </div>
              </button>

              <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                {showTopupWallet && (
                  <button
                    type="button"
                    onClick={() => openFullScreenApp(session ? 'workspace_billing' : 'register')}
                    className="btn-inkica-primary rounded-xl px-4 py-2 text-xs cursor-pointer whitespace-nowrap"
                  >
                    <CreditCard className="w-3.5 h-3.5 shrink-0" />
                    <span>Mở Quản lý Gói &amp; Ví</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setShowTopupWallet((prev) => !prev)}
                  aria-expanded={showTopupWallet}
                  className="ql-btn-outline rounded-xl px-3.5 py-2 text-xs font-semibold cursor-pointer inline-flex items-center gap-1.5 whitespace-nowrap"
                >
                  <span>{showTopupWallet ? 'Thu gọn' : 'Xem gói Topup'}</span>
                  {showTopupWallet ? (
                    <ChevronUp className="w-3.5 h-3.5" />
                  ) : (
                    <ChevronDown className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            </div>

            {showTopupWallet && (
              <div className="mt-5 pt-5 border-t border-slate-200/75 space-y-4">
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  Chủ động nạp vào Ví doanh nghiệp để hệ thống tự gia hạn khi hết {catalog.trial_duration_months} tháng miễn phí mà không làm gián đoạn luồng chia số của Sale.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-slate-200/75 rounded-2xl border border-slate-200/80 bg-slate-50/60 overflow-hidden">
                  {catalog.topup_packages.map((pkg, idx) => (
                    <div
                      key={pkg.id}
                      className={`p-5 flex flex-col justify-between gap-2 ${
                        pkg.highlight ? 'bg-white' : ''
                      } ${idx >= 2 ? 'sm:border-t sm:border-slate-200/75 lg:border-t-0' : ''}`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-semibold text-slate-700">{pkg.label}</span>
                        {pkg.highlight && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200/70 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 whitespace-nowrap">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            -{catalog.annual_discount_pct}%
                          </span>
                        )}
                      </div>
                      <div className="text-xl font-bold font-mono text-[#1E40FF]">
                        {pkg.amount_vnd.toLocaleString('vi-VN')} ₫
                      </div>
                      <p className="text-xs text-slate-500 leading-relaxed">{pkg.equivalent_months_note}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ====================================================================
          ECOSYSTEM UPGRADE PATHS (#crm-erp-upgrade)
         ==================================================================== */}
      <section id="crm-erp-upgrade" className="scroll-mt-24 py-20 sm:py-24 px-4 sm:px-6 lg:px-8 border-t border-slate-200/70 bg-white/45 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-5 mb-10 sm:mb-12">
            <div className="max-w-2xl">
              <div className="ql-eyebrow mb-3">
                <Sparkles className="w-3.5 h-3.5 text-[#1E40FF] shrink-0" />
                <span>LỘ TRÌNH MỞ RỘNG HỆ SINH THÁI DOMATION</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 leading-[1.25] tracking-tight">
                Khởi Đầu Chuẩn Mực —{' '}
                <span className="text-gradient-inkica">Mở Rộng Toàn Diện</span>
              </h2>
            </div>
            <button
              type="button"
              onClick={() => openFullScreenApp(session ? 'workspace_crm_erp' : 'register')}
              className="btn-inkica-primary self-start lg:self-end rounded-full px-6 py-3 text-xs sm:text-sm cursor-pointer whitespace-nowrap shrink-0"
            >
              <span>Đăng ký Nâng cấp (Giữ 100% Data)</span>
              <ArrowRight className="w-4 h-4 shrink-0" />
            </button>
          </div>

          <div className="rounded-[28px] bg-white/85 backdrop-blur-xl border border-slate-200/80 shadow-xs grid grid-cols-1 lg:grid-cols-3 divide-y lg:divide-y-0 lg:divide-x divide-slate-200/75 overflow-hidden mb-6">
            {/* Upgrade Path 1: Marketing Automation */}
            <div className="p-7 sm:p-9 flex flex-col justify-between gap-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-2">
                  <div className="w-10 h-10 rounded-xl bg-white border border-slate-200/80 text-[#1E40FF] shadow-2xs flex items-center justify-center shrink-0">
                    <Workflow className="w-5 h-5" />
                  </div>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-50 border border-slate-200/80 px-2.5 py-1 text-[10px] font-semibold text-slate-700 whitespace-nowrap">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#1E40FF]" />
                    Nuôi Dưỡng &amp; AI
                  </span>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900">Marketing Automation &amp; AI RAG</h3>
                  <p className="text-xs sm:text-sm text-slate-600 mt-1.5 leading-relaxed">
                    Tự động chăm sóc lại khách chưa chốt bằng kịch bản rẽ nhánh IF/ELSE đa kênh và trợ lý AI trực 24/7.
                  </p>
                </div>
                <ul className="space-y-2 text-xs sm:text-sm text-slate-700">
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-[#1E40FF] shrink-0 mt-0.5" />
                    <span>Visual Flow Builder gửi Email Kéo Thả &amp; Zalo ZNS</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-[#1E40FF] shrink-0 mt-0.5" />
                    <span>AI Chatbot huấn luyện theo tài liệu từng phòng ban</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-[#1E40FF] shrink-0 mt-0.5" />
                    <span>Web Tracking, QR sự kiện &amp; Voucher Hub</span>
                  </li>
                </ul>
              </div>
              <a
                href={catalog.automation_upgrade_url || '/automation'}
                onClick={(e) => handleSpaLinkClick(e, catalog.automation_upgrade_url || '/automation')}
                className="ql-btn-outline w-full rounded-xl px-4 py-3 text-xs sm:text-sm justify-between whitespace-nowrap"
              >
                <span>Khám phá Marketing Automation</span>
                <ArrowUpRight className="w-4 h-4 shrink-0" />
              </a>
            </div>

            {/* Upgrade Path 2: Full CRM 360 */}
            <div className="p-7 sm:p-9 flex flex-col justify-between gap-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-2">
                  <div className="w-10 h-10 rounded-xl bg-white border border-slate-200/80 text-[#1E40FF] shadow-2xs flex items-center justify-center shrink-0">
                    <Layers className="w-5 h-5" />
                  </div>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-50 border border-slate-200/80 px-2.5 py-1 text-[10px] font-semibold text-slate-700 whitespace-nowrap">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    Quản Trị Bán Hàng
                  </span>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900">Full DOMATION CRM 360°</h3>
                  <p className="text-xs sm:text-sm text-slate-600 mt-1.5 leading-relaxed">
                    Mở rộng lên quản trị toàn diện vòng đời khách hàng B2B/B2C, báo giá, hợp đồng và doanh thu thực thu.
                  </p>
                </div>
                <ul className="space-y-2 text-xs sm:text-sm text-slate-700">
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>Phễu Kanban 8 nấc chuyên sâu &amp; Hồ sơ 360°</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>Báo giá, Hợp đồng, Thanh toán &amp; Hóa đơn điện tử</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>Kho Databank tái khai thác Lead &amp; Co-care hoa hồng</span>
                  </li>
                </ul>
              </div>
              <a
                href={catalog.crm_upgrade_url || '/crm'}
                onClick={(e) => handleSpaLinkClick(e, catalog.crm_upgrade_url || '/crm')}
                className="ql-btn-outline w-full rounded-xl px-4 py-3 text-xs sm:text-sm justify-between whitespace-nowrap"
              >
                <span>Khám phá Full CRM 360°</span>
                <ArrowUpRight className="w-4 h-4 shrink-0" />
              </a>
            </div>

            {/* Upgrade Path 3: Enterprise ERP 5.0 */}
            <div className="p-7 sm:p-9 flex flex-col justify-between gap-6 bg-gradient-to-br from-[#F4F8FF]/90 via-white to-white">
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-2">
                  <div className="w-10 h-10 rounded-xl bg-[#1E40FF] text-white shadow-sm flex items-center justify-center shrink-0">
                    <Cpu className="w-5 h-5" />
                  </div>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-white border border-slate-200/80 px-2.5 py-1 text-[10px] font-semibold text-[#1E40FF] whitespace-nowrap">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-500" />
                    Toàn Doanh Nghiệp
                  </span>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900">DOMATION Enterprise ERP 5.0</h3>
                  <p className="text-xs sm:text-sm text-slate-600 mt-1.5 leading-relaxed">
                    Hợp nhất toàn bộ 12 phân hệ vận hành nội bộ cho doanh nghiệp quy mô lớn trên một nền tảng duy nhất.
                  </p>
                </div>
                <ul className="space-y-2 text-xs sm:text-sm text-slate-700">
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-[#1E40FF] shrink-0 mt-0.5" />
                    <span>HRM Chấm công GPS AI, Bảng lương KPI &amp; Phiếu lương PDF</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-[#1E40FF] shrink-0 mt-0.5" />
                    <span>Tài chính thu chi, Công nợ, Kho vận &amp; Phê duyệt đa cấp</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-[#1E40FF] shrink-0 mt-0.5" />
                    <span>Bảo mật phân quyền từng dòng &amp; Triển khai Server riêng</span>
                  </li>
                </ul>
              </div>
              <a
                href={catalog.erp_upgrade_url || '/erp'}
                onClick={(e) => handleSpaLinkClick(e, catalog.erp_upgrade_url || '/erp')}
                className="btn-inkica-primary w-full rounded-xl px-4 py-3 text-xs sm:text-sm justify-between whitespace-nowrap"
              >
                <span>Khám phá Enterprise ERP 5.0</span>
                <ArrowUpRight className="w-4 h-4 shrink-0" />
              </a>
            </div>
          </div>

          <div className="rounded-2xl bg-white/80 backdrop-blur-xl border border-slate-200/80 px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-600">
            <div className="flex items-center gap-2">
              <FileCheck2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>
                Cam kết chuyển đổi liền mạch: <strong>Giữ nguyên 100% danh sách Lead, lịch sử chăm sóc &amp; Cổng Sale cá nhân</strong> khi nâng cấp.
              </span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <ShieldCheck className="w-4 h-4 text-[#1E40FF] shrink-0" />
              <span className="font-semibold text-slate-800 whitespace-nowrap">Hỗ trợ kỹ thuật 1-1</span>
            </div>
          </div>
        </div>
      </section>

      <FaqAccordionSection
        faqs={AUTODATA_FAQS}
        heading="Câu Hỏi Thường Gặp Về Auto Data & Meta CAPI"
        subtitle="Giải đáp về tốc độ chia số <5s, cơ chế bù Ticket lỗi 1:1, Van SLA 120s và chi phí vận hành."
      />
      </main>

      {/* ====================================================================
          EXECUTIVE NAVY-SAPPHIRE FOOTER — Unified with DOMATION Home
         ==================================================================== */}
      <footer className="relative z-10 bg-gradient-to-br from-slate-950 via-[#0F172A] to-[#0A2568] text-white border-t border-slate-800/40 pt-14 pb-12 px-4 sm:px-6 lg:px-8 mt-8">
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
                    DOMATION Auto Data • Enterprise Ecosystem
                  </div>
                </div>
              </div>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-md">
                Hệ thống Điều phối &amp; Chia vòng Khách hàng tự động cho đội ngũ Sale — kết nối Zalo, Google Sheets &amp; REST API 2 chiều.
              </p>
            </div>

            <div className="md:col-span-3 space-y-2.5">
              <div className="text-xs font-semibold uppercase tracking-widest text-cyan-300">
                Hệ Sinh Thái Giải Pháp
              </div>
              <ul className="space-y-2 text-xs text-slate-300">
                <li>
                  <a
                    href="/"
                    onClick={(e) => handleSpaLinkClick(e, '/')}
                    className="hover:text-white transition-colors"
                  >
                    Trang chủ DOMATION
                  </a>
                </li>
                <li>
                  <a
                    href={catalog.automation_upgrade_url || '/automation'}
                    onClick={(e) =>
                      handleSpaLinkClick(e, catalog.automation_upgrade_url || '/automation')
                    }
                    className="hover:text-white transition-colors"
                  >
                    Marketing Automation
                  </a>
                </li>
                <li>
                  <a
                    href={catalog.crm_upgrade_url || '/crm'}
                    onClick={(e) => handleSpaLinkClick(e, catalog.crm_upgrade_url || '/crm')}
                    className="hover:text-white transition-colors"
                  >
                    Full CRM 360°
                  </a>
                </li>
                <li>
                  <a
                    href={catalog.erp_upgrade_url || '/erp'}
                    onClick={(e) => handleSpaLinkClick(e, catalog.erp_upgrade_url || '/erp')}
                    className="hover:text-white transition-colors"
                  >
                    Enterprise ERP 5.0
                  </a>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => openFullScreenApp('login')}
                    className="hover:text-white transition-colors cursor-pointer"
                  >
                    Đăng nhập Workspace
                  </button>
                </li>
              </ul>
            </div>

            <div className="md:col-span-4 space-y-3">
              <div className="text-xs font-semibold uppercase tracking-widest text-cyan-300">
                Pháp Lý &amp; Quyền Riêng Tư
              </div>
              <div className="flex flex-col gap-2 text-xs text-slate-300">
                <a
                  href="/data?legal=terms"
                  onClick={(e) => {
                    e.preventDefault();
                    openLegalDoc('terms');
                  }}
                  className="inline-flex items-center gap-1.5 hover:text-cyan-300 transition-colors"
                >
                  <FileText className="w-3.5 h-3.5 shrink-0" />
                  <span>Điều khoản sử dụng</span>
                </a>
                <a
                  href="/data?legal=privacy"
                  onClick={(e) => {
                    e.preventDefault();
                    openLegalDoc('privacy');
                  }}
                  className="inline-flex items-center gap-1.5 hover:text-cyan-300 transition-colors"
                >
                  <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                  <span>Chính sách bảo mật dữ liệu</span>
                </a>
                <button
                  type="button"
                  onClick={() => setCookieForceCounter((c) => c + 1)}
                  className="inline-flex items-center gap-1.5 hover:text-cyan-300 transition-colors cursor-pointer text-left"
                >
                  <Cookie className="w-3.5 h-3.5 shrink-0" />
                  <span>Tùy chỉnh Cookie</span>
                </button>
              </div>
            </div>
          </div>

          <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-slate-400">
            <span>© {new Date().getFullYear()} CÔNG TY TNHH DOM MARKETING.</span>
            <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1">
              <span>DOMATION Auto Data • Đồng bộ 2 chiều Google Sheets, Zalo &amp; REST API.</span>
              <span className="hidden sm:inline text-slate-600">•</span>
              <span>
                Powered by{' '}
                <a
                  href="https://turnio.vercel.app/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-cyan-300 hover:text-cyan-200 hover:underline font-semibold"
                >
                  Turnio DEV
                </a>
              </span>
            </div>
          </div>
        </div>
      </footer>

      {/* Screenshot Lightbox Modal */}
      {zoomImage && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={() => setZoomImage(null)}
          className="fixed inset-0 z-[110] bg-slate-950/80 backdrop-blur-sm p-4 sm:p-8 flex items-center justify-center"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="max-w-5xl w-full bg-white rounded-3xl overflow-hidden shadow-2xl"
          >
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between gap-4">
              <div>
                <div className="text-sm font-bold text-slate-900">{zoomImage.title}</div>
                <div className="text-xs text-slate-500">{zoomImage.desc}</div>
              </div>
              <button
                type="button"
                onClick={() => setZoomImage(null)}
                aria-label="Đóng ảnh phóng to"
                className="rounded-full border border-slate-200 p-2 text-slate-600 hover:bg-slate-100 cursor-pointer shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="bg-slate-100 max-h-[78vh] overflow-auto p-2 sm:p-4">
              <img src={zoomImage.src} alt={zoomImage.title} className="w-full h-auto rounded-xl" />
            </div>
          </div>
        </div>
      )}

      {/* Legal Modal (Terms of Service & Privacy Policy) */}
      <AutoDataLegalModal
        open={legalOpen}
        activeTab={legalTab}
        onTabChange={(t) => openLegalDoc(t)}
        onClose={closeLegalDoc}
      />

      {/* Clean Cookie Consent Banner on /data */}
      <AutoDataCookieConsent
        hidden={setupOpen}
        forceOpenCounter={cookieForceCounter}
        onOpenLegal={(t) => openLegalDoc(t)}
      />

      {/* Bottom-center Back to Top button matching DOMATION Home */}
      {showBackTop && !setupOpen && (
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

      {/* FULL-SCREEN UNIFIED WORKSPACE APP OR AUTH MODAL */}
      {setupOpen && session && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-[#F8F9FA]">
          <Suspense
            fallback={
              <div className="min-h-screen flex items-center justify-center bg-[#F8F9FA] text-slate-600 text-sm font-medium">
                Đang tải không gian vận hành AutoData...
              </div>
            }
          >
            <AutoDataWorkspaceApp
              key={`${session.tenant_slug}-${setupModalKey}`}
              session={session}
              initialView={
                typeof window !== 'undefined' && window.location.pathname.endsWith('/report-data')
                  ? 'report_data'
                  : setupIntent === 'workspace_billing'
                    ? 'billing'
                    : setupIntent === 'workspace_zalo'
                      ? 'integrations'
                      : 'dashboard'
              }
              onSessionUpdated={(next) => handleSessionChange(next)}
              onSwitchWorkspaceRequested={() => {
                handleSessionChange(null);
                setSetupIntent('login');
                setSetupOpen(true);
              }}
              onNavigateSlug={(slug) => syncWorkspaceUrlSlug(slug)}
              onLoggedOut={() => {
                setSetupOpen(false);
                handleSessionChange(null);
              }}
            />
          </Suspense>
        </div>
      )}

      <AutoDataAuthModal
        key={setupModalKey}
        isOpen={setupOpen && !session}
        initialMode={setupIntent === 'register' ? 'register' : 'login'}
        catalog={catalog}
        googleClientId={googleClientId}
        onOpenLegal={(t) => openLegalDoc(t)}
        onClose={() => {
          setSetupOpen(false);
          syncWorkspaceUrlSlug(null);
        }}
        onAuthenticated={(next) => {
          handleSessionChange(next);
          setSetupOpen(true);
        }}
      />
    </div>
  );
}

export default DomationDataLanding;
