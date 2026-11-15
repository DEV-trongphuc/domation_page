import React, { useEffect, useState } from 'react';
import {
  Activity,
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  Bot,
  Check,
  CheckCircle2,
  Clock,
  Compass,
  Cookie,
  Copy,
   Cpu,
  CreditCard,
  Download,
  FileCheck2,
  FileText,
  FolderKanban,
  Gauge,
  Layers,
  Menu,
  PlusCircle,
  RefreshCw,
  Scale,
  Share2,
  ShieldCheck,
  Sparkles,
  Table2,
  ToggleRight,
  UserCheck,
  Users,
  Wallet,
  Webhook,
  Workflow,
  X,
  ZoomIn,
} from 'lucide-react';
import AutoDataFullScreenSetup from './components/autodata/AutoDataFullScreenSetup';
import { AutoDataHelpTrigger, AutoDataStepTourModal } from './components/autodata/AutoDataHelpTour';
import { AutoDataCookieConsent, AutoDataLegalModal } from './components/autodata/AutoDataLegalAndCookie';
import { AutoDataZaloBotGuide } from './components/autodata/AutoDataZaloBotGuide';
import {
  DEFAULT_CLIENT_CATALOG,
  buildGoogleAppsScriptSnippet,
  buildPersonalLeadsCsvContent,
  type ClientBillingCatalog,
  type ClientSessionState,
  type HelpTopicKey,
  type LegalDocTab,
  type PersonalSaleLeadItem,
  type SetupModalIntent,
} from './components/autodata/autodataTypes';

const SESSION_STORAGE_KEY = 'domation_autodata_session_v1';

interface PartnerBrand {
  name: string;
  sector: string;
  logo: string;
}

const PARTNER_BRANDS: PartnerBrand[] = [
  {
    name: 'Viện Quốc Tế IDEAS',
    sector: 'Giáo dục & Đào tạo Quốc tế',
    logo: '/assets/partners/logo_ideas.webp',
  },
  {
    name: 'RichLand',
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
    sector: 'Tập đoàn Đầu tư Đa ngành',
    logo: '/assets/partners/logo_capital_house.webp',
  },
  {
    name: 'EcoLife Signature',
    sector: 'Chuỗi Dự án Xanh Cao cấp',
    logo: '/assets/partners/logo_ecolife_ngang.webp',
  },
  {
    name: 'Tùng Long Group',
    sector: 'Thương mại & Dịch vụ',
    logo: '/assets/partners/logo_tung_long.webp',
  },
  {
    name: 'Hợp Nhất Land',
    sector: 'Liên minh Kinh doanh Khu vực',
    logo: '/assets/partners/logo_hop_nhat.webp',
  },
  {
    name: 'IHD Group',
    sector: 'Tập đoàn Đầu tư & Vận hành',
    logo: '/assets/partners/logo_ihd_group.webp',
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
    desc: 'Khi nhân sự xác nhận khách chất lượng hoặc chốt đơn, hệ thống tự bắn sự kiện HTTP 200 tối ưu máy học quảng cáo.',
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

function readSavedSession(): ClientSessionState | null {
  try {
    const raw = window.localStorage.getItem(SESSION_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ClientSessionState;
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

export function DomationDataLanding() {
  const [catalog, setCatalog] = useState<ClientBillingCatalog>(DEFAULT_CLIENT_CATALOG);
  const [session, setSession] = useState<ClientSessionState | null>(() => readSavedSession());
  const [bridgeMode, setBridgeMode] = useState<'upstream_rls_postgres' | 'vercel_serverless_engine'>(
    'vercel_serverless_engine'
  );

  // Full-screen setup app state
  const [setupOpen, setSetupOpen] = useState(false);
  const [setupIntent, setSetupIntent] = useState<SetupModalIntent>('register');
  const [setupModalKey, setSetupModalKey] = useState(0);

  // Guided Tour, Legal Docs & Cookie Consent state
  const [tourOpen, setTourOpen] = useState(false);
  const [legalOpen, setLegalOpen] = useState<boolean>(() => detectInitialLegalModal().open);
  const [legalTab, setLegalTab] = useState<LegalDocTab>(() => detectInitialLegalModal().tab);
  const [cookieForceCounter, setCookieForceCounter] = useState(0);

  // Interactive Hero Browser Preview state — Default is strictly Internal Sale (showExternalAgencyPreview = false)
  const [heroTab, setHeroTab] = useState<0 | 1 | 2 | 3>(0);
  const [showExternalAgencyPreview, setShowExternalAgencyPreview] = useState<boolean>(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Copy feedback for Apps Script on landing
  const [copiedLandingScript, setCopiedLandingScript] = useState(false);

  // Pricing section cycle toggle
  const [pricingCycle, setPricingCycle] = useState<'annual' | 'monthly'>('annual');

  // Zoomable screenshot lightbox
  const [zoomImage, setZoomImage] = useState<ScreenshotItem | null>(null);

  // Sync live dynamic catalog & platform defaults from real backend bridge
  useEffect(() => {
    document.title =
      'DOMATION Auto Data (Bản Lite) — Chuyên Cho Sale & Tự Động Chia Vòng Lead Đa Kênh';
    let mounted = true;
    const bootstrapFromApi = async () => {
      try {
        const res = await fetch('/api/autodata?action=bootstrap');
        const json = (await res.json()) as {
          success?: boolean;
          bridge_mode?: 'upstream_rls_postgres' | 'vercel_serverless_engine';
          data?: { catalog?: ClientBillingCatalog };
        };
        if (!mounted || !json.success || !json.data?.catalog) return;
        setCatalog(json.data.catalog);
        if (json.bridge_mode) {
          setBridgeMode(json.bridge_mode);
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

  const handleSessionChange = (nextSession: ClientSessionState | null) => {
    setSession(nextSession);
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
    setMobileMenuOpen(false);
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

  const handleCopyAppsScriptLanding = async () => {
    const code = buildGoogleAppsScriptSnippet(session?.webhook_url, session?.admin_email);
    try {
      await navigator.clipboard.writeText(code);
      setCopiedLandingScript(true);
      window.setTimeout(() => setCopiedLandingScript(false), 1800);
    } catch {
      // Ignore clipboard failure
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
    helpTopic: HelpTopicKey;
  }> = [
    {
      icon: Scale,
      title: '1. Chia Vòng Trọng Số & Xoay Vòng 1:1',
      desc: 'Tùy chọn linh hoạt giữa Deficit Weighted Fair-Share (chia theo năng lực Sale Senior x3, Junior x1), Strict Round-Robin 1:1 hoặc Least-Loaded.',
      helpTopic: 'round_robin_formula',
    },
    {
      icon: UserCheck,
      title: '2. Chống Trùng SĐT 90 Ngày Đa Chính Sách',
      desc: 'Chuẩn hóa đầu số +84 → 0 và đối chiếu nguyên tử cấp Database. Tự động trả về đúng Sale cũ đang chăm sóc hoặc ghi nối lịch sử mới.',
      helpTopic: 'dedupe_90d',
    },
    {
      icon: Clock,
      title: '3. Tự Động Thu Hồi SLA Quá Hạn (15 Phút)',
      desc: 'Nếu quá thời gian cam kết mà Sale chưa bấm nhận khách Ads, Router tự động thu hồi và chuyển ngay sang Sale kế tiếp đang Online.',
      helpTopic: 'sla_recall',
    },
    {
      icon: RefreshCw,
      title: '4. Báo Số Rác & Đền Bù Tự Động 1-Đổi-1',
      desc: 'Gặp khách nhầm số, thuê bao hoặc sai đối tượng, Sale gửi báo cáo ngay trên ZaloBot; Admin duyệt là cộng trả 1 lượt bù ưu tiên.',
      helpTopic: 'sla_recall',
    },
    {
      icon: Users,
      title: '5. Mặc Định Sale Nội Bộ & Tùy Chọn Che Số F1',
      desc: 'Mặc định chia trực tiếp cho từng Sale nội bộ (is_external_agency = false, hiển thị đủ SĐT). Tùy chọn bật thêm Đại lý F1 với chế độ che SĐT 0912***678.',
      helpTopic: 'internal_sale_default',
    },
    {
      icon: Gauge,
      title: '6. Phản Hồi Meta CAPI v21.0 & Kiểm Toán Gini',
      desc: 'Tự động gửi sự kiện khách chất lượng băm SHA-256 ngược về Facebook Dataset (HTTP 200) kèm chỉ số đo lường công bằng Gini.',
      helpTopic: 'meta_capi',
    },
  ];

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans antialiased selection:bg-blue-100 selection:text-blue-700 overflow-x-clip">
      {/* ====================================================================
          DEDICATED /data SUB-APP HEADER (Crisp spacing, zero button wrap)
         ==================================================================== */}
      <header className="sticky top-0 z-50 bg-white/92 backdrop-blur-md border-b border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <a href="/data" className="flex items-center gap-2.5 shrink-0">
              <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center font-black text-xs">
                AD
              </div>
              <span className="font-bold text-sm sm:text-base text-slate-950 whitespace-nowrap">
                DOMATION <span className="text-blue-600">DATA</span>
              </span>
              <span className="hidden md:inline-flex items-center rounded-full bg-blue-50 border border-blue-200 px-2 py-0.5 text-[10px] font-bold text-blue-700 whitespace-nowrap">
                Bản Lite
              </span>
            </a>

            <span className="hidden xl:inline text-slate-300">|</span>

            <a
              href="/"
              className="hidden xl:inline-flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-slate-900 transition-colors whitespace-nowrap"
            >
              <ArrowLeft className="w-3 h-3 shrink-0" />
              <span>Hệ sinh thái DOMATION</span>
            </a>
          </div>

          <nav
            aria-label="Điều hướng phân hệ Auto Data"
            className="hidden lg:flex items-center gap-5 text-[13px] font-medium text-slate-600"
          >
            <a href="#router-engine" className="hover:text-slate-950 transition-colors whitespace-nowrap">
              Chia Vòng
            </a>
            <a href="#sale-port" className="hover:text-slate-950 transition-colors whitespace-nowrap">
              Cổng Sale &amp; Sheets
            </a>
            <a href="#zalo-connect-guide" className="hover:text-slate-950 transition-colors whitespace-nowrap">
              Zalo Bot A–Z
            </a>
            <a href="#pricing" className="hover:text-slate-950 transition-colors whitespace-nowrap">
              Gói &amp; Gia Hạn
            </a>
            <a
              href="#crm-erp-upgrade"
              className="text-blue-600 font-semibold hover:text-blue-700 transition-colors whitespace-nowrap"
            >
              Nâng Cấp Suite
            </a>
          </nav>

          <div className="hidden sm:flex items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={() => setTourOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50/80 px-3.5 py-2 text-xs font-semibold text-blue-700 hover:bg-blue-100 transition-colors cursor-pointer whitespace-nowrap"
            >
              <Compass className="w-3.5 h-3.5 shrink-0" />
              <span>? Hướng dẫn</span>
            </button>

            {session ? (
              <>
                <button
                  type="button"
                  onClick={() => openFullScreenApp('workspace_billing')}
                  className="rounded-full border border-slate-200 px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer whitespace-nowrap"
                >
                  Gói ({session.subscription.days_remaining}d)
                </button>
                <button
                  type="button"
                  onClick={() => openFullScreenApp('workspace_router')}
                  className="rounded-full bg-slate-900 text-white px-4 py-2 text-xs font-semibold hover:bg-blue-600 transition-colors inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                >
                  <span>Workspace ({session.tenant_slug})</span>
                  <ArrowRight className="w-3.5 h-3.5 shrink-0" />
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => openFullScreenApp('login')}
                  className="rounded-full px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer whitespace-nowrap"
                >
                  Đăng nhập
                </button>
                <button
                  type="button"
                  onClick={() => openFullScreenApp('register')}
                  className="rounded-full bg-slate-900 text-white px-4 py-2 text-xs font-semibold hover:bg-blue-600 transition-colors inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                >
                  <span>Dùng thử {catalog.trial_duration_months} tháng 0đ</span>
                  <ArrowRight className="w-3.5 h-3.5 shrink-0" />
                </button>
              </>
            )}
          </div>

          <div className="flex sm:hidden items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setTourOpen(true)}
              aria-label="Mở hướng dẫn từng bước"
              className="rounded-lg border border-blue-200 bg-blue-50 px-2.5 py-2 text-xs font-bold text-blue-700 whitespace-nowrap"
            >
              ? Tour
            </button>
            <button
              type="button"
              onClick={() => setMobileMenuOpen((v) => !v)}
              aria-label="Mở menu điều hướng"
              className="rounded-lg border border-slate-200 p-2 text-slate-700"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="sm:hidden border-t border-slate-200 bg-white px-4 py-4 space-y-3">
            <div className="grid grid-cols-2 gap-2.5 text-xs font-medium text-slate-700">
              <a href="#router-engine" onClick={() => setMobileMenuOpen(false)} className="py-1.5 whitespace-nowrap">
                Cơ chế Chia Vòng
              </a>
              <a href="#sale-port" onClick={() => setMobileMenuOpen(false)} className="py-1.5 whitespace-nowrap">
                Cổng Sale &amp; Sheets
              </a>
              <a href="#zalo-connect-guide" onClick={() => setMobileMenuOpen(false)} className="py-1.5 whitespace-nowrap">
                Zalo Bot A–Z
              </a>
              <a href="#pricing" onClick={() => setMobileMenuOpen(false)} className="py-1.5 whitespace-nowrap">
                Bảng gói ({(catalog.base_monthly_price_vnd / 1000).toFixed(0)}k)
              </a>
              <a
                href="#crm-erp-upgrade"
                onClick={() => setMobileMenuOpen(false)}
                className="py-1.5 text-blue-600 font-semibold whitespace-nowrap"
              >
                Nâng cấp Suite
              </a>
              <a href="/" className="py-1.5 text-slate-500 whitespace-nowrap">
                ← Trang chủ DOMATION
              </a>
            </div>
            <div className="pt-2 border-t border-slate-100 flex gap-2.5">
              <button
                type="button"
                onClick={() => openFullScreenApp(session ? 'workspace_billing' : 'login')}
                className="flex-1 rounded-full border border-slate-300 py-2.5 px-3 text-xs font-semibold text-slate-800 whitespace-nowrap"
              >
                {session ? 'Quản lý Gói' : 'Đăng nhập'}
              </button>
              <button
                type="button"
                onClick={() => openFullScreenApp(session ? 'workspace_router' : 'register')}
                className="flex-1 rounded-full bg-slate-900 text-white py-2.5 px-3 text-xs font-semibold whitespace-nowrap"
              >
                {session ? 'Mở Workspace' : `Miễn phí ${catalog.trial_duration_months} tháng`}
              </button>
            </div>
          </div>
        )}
      </header>

      {/* ====================================================================
          HERO SECTION — Lite Positioning, Internal Sale Default & Crisp Spacing
         ==================================================================== */}
      <section className="pt-14 sm:pt-20 pb-16 sm:pb-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-white via-slate-50/45 to-white">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <div className="inline-flex flex-wrap items-center justify-center gap-2 rounded-full border border-blue-200 bg-blue-50/70 px-4 py-1.5 text-xs font-semibold text-blue-800 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0" />
            <span>Bản Lite chuyên cho Sale &amp; Chia Data • Mặc định cho từng Sale nội bộ</span>
            <AutoDataHelpTrigger topic="internal_sale_default" onOpenTour={() => setTourOpen(true)} />
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-[3.35rem] font-extrabold text-slate-950 leading-[1.22]">
            Tự động chia vòng Lead đa kênh.
            <span className="block text-blue-600 mt-2">
              Công bằng dưới 4 giây cho từng nhân viên Sale.
            </span>
          </h1>

          <p className="max-w-2xl mx-auto text-base sm:text-lg text-slate-600 leading-relaxed">
            Phiên bản tinh gọn triển khai trong 60 giây — mặc định phân bổ trực tiếp cho từng Sale nội bộ (hiển thị đủ SĐT), tích hợp Cổng Sale cá nhân, đồng bộ Google Sheets 2 chiều, ZaloBot &amp; Meta CAPI.
          </p>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3.5">
            <button
              type="button"
              onClick={() => openFullScreenApp(session ? 'workspace_router' : 'register')}
              className="w-full sm:w-auto rounded-full bg-slate-900 text-white px-7 py-3.5 text-sm font-semibold hover:bg-blue-600 transition-all shadow-sm inline-flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap"
            >
              <span>
                {session
                  ? `Mở Workspace (${session.tenant_slug})`
                  : `Dùng thử ${catalog.trial_duration_months} tháng miễn phí`}
              </span>
              <ArrowRight className="w-4 h-4 shrink-0" />
            </button>

            <button
              type="button"
              onClick={() => setTourOpen(true)}
              className="w-full sm:w-auto rounded-full border border-slate-300 bg-white text-slate-800 px-6 py-3.5 text-sm font-semibold hover:bg-slate-50 transition-colors inline-flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap"
            >
              <Compass className="w-4 h-4 text-blue-600 shrink-0" />
              <span>Xem Tour hướng dẫn A–Z</span>
            </button>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1.5 text-xs text-slate-500">
            <span>
              Miễn phí <strong className="text-slate-800">{catalog.trial_duration_months} tháng đầu ({catalog.trial_duration_days} ngày)</strong>
            </span>
            <span>·</span>
            <span>
              Gia hạn từ <strong className="text-slate-800">{catalog.base_monthly_price_vnd.toLocaleString('vi-VN')}₫/tháng</strong>
            </span>
            <span>·</span>
            <span>
              Mua năm giảm <strong className="text-emerald-700">{catalog.annual_discount_pct}% ({standardPlan.annual_monthly_equivalent_vnd.toLocaleString('vi-VN')}₫/tháng)</strong>
            </span>
            <AutoDataHelpTrigger topic="billing_3m_900k" onOpenTour={() => setTourOpen(true)} />
          </div>
        </div>

        {/* Clean Browser Window Interactive Preview */}
        <div className="max-w-6xl mx-auto mt-12 sm:mt-16">
          <div className="rounded-2xl sm:rounded-3xl border border-slate-200/90 bg-white shadow-[0_24px_70px_-20px_rgba(15,23,42,0.12)] overflow-hidden">
            {/* Browser Top Chrome */}
            <div className="px-4 sm:px-6 py-3 bg-slate-50 border-b border-slate-200/80 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 min-w-0">
                <span className="w-2.5 h-2.5 rounded-full bg-slate-300 shrink-0" />
                <span className="w-2.5 h-2.5 rounded-full bg-slate-300 shrink-0" />
                <span className="w-2.5 h-2.5 rounded-full bg-slate-300 shrink-0" />
                <span className="ml-2 text-xs font-mono text-slate-500 truncate">
                  domation.net/data • Auto Data Lite ({bridgeMode === 'upstream_rls_postgres' ? 'PostgreSQL RLS Live' : 'Serverless Live'})
                </span>
              </div>
              <button
                type="button"
                onClick={() => openFullScreenApp(session ? 'workspace_router' : 'register')}
                className="rounded-full bg-blue-600 text-white px-4 py-1.5 text-xs font-semibold hover:bg-blue-700 transition-colors cursor-pointer whitespace-nowrap shrink-0"
              >
                <span className="hidden sm:inline">Kết nối thật toàn màn hình →</span>
                <span className="sm:hidden">Mở App →</span>
              </button>
            </div>

            {/* Interactive 4-Pillar Router Switcher */}
            <div className="p-4 sm:p-8 space-y-6">
              <div className="flex overflow-x-auto pb-1 lg:pb-0 lg:grid lg:grid-cols-4 gap-2.5">
                {[
                  { idx: 0 as const, label: '01. Thuật Toán Chia Vòng', icon: Scale },
                  { idx: 1 as const, label: '02. Chống Trùng 90 Ngày', icon: UserCheck },
                  { idx: 2 as const, label: '03. Công Tắc Online & SLA', icon: ToggleRight },
                  { idx: 3 as const, label: '04. ZaloBot & Meta CAPI', icon: Share2 },
                ].map((item) => {
                  const Icon = item.icon;
                  const active = heroTab === item.idx;
                  return (
                    <button
                      key={item.idx}
                      type="button"
                      onClick={() => setHeroTab(item.idx)}
                      className={`shrink-0 rounded-xl border px-4 py-2.5 text-left text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
                        active
                          ? 'border-slate-900 bg-slate-900 text-white shadow-sm'
                          : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                      }`}
                    >
                      <Icon className="w-4 h-4 shrink-0" />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Active Router Stage */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center bg-slate-50/70 rounded-2xl border border-slate-200/80 p-5 sm:p-7">
                <div className="lg:col-span-5 space-y-4">
                  {heroTab === 0 && (
                    <>
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 uppercase tracking-wider">
                          <Scale className="w-4 h-4 shrink-0" />
                          <span>Weighted Fair-Share &amp; Round-Robin</span>
                        </span>
                        <AutoDataHelpTrigger topic="round_robin_formula" onOpenTour={() => setTourOpen(true)} />
                      </div>
                      <h3 className="text-xl font-bold text-slate-900 leading-snug">
                        Chia trực tiếp cho từng Sale nội bộ theo trọng số hoặc xoay vòng 1:1
                      </h3>
                      <p className="text-sm text-slate-600 leading-relaxed">
                        Mặc định phân bổ thẳng cho từng chuyên viên Sale trong công ty (VD: Senior x3, Junior x1) kèm đầy đủ SĐT để gọi ngay, kết hợp Cổng Sale cá nhân nhập khách riêng không tốn quota.
                      </p>
                    </>
                  )}
                  {heroTab === 1 && (
                    <>
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 uppercase tracking-wider">
                          <UserCheck className="w-4 h-4 shrink-0" />
                          <span>90-Day Deduplication Lock</span>
                        </span>
                        <AutoDataHelpTrigger topic="dedupe_90d" onOpenTour={() => setTourOpen(true)} />
                      </div>
                      <h3 className="text-xl font-bold text-slate-900 leading-snug">
                        Chấm dứt tranh chấp khách trùng giữa các nhân viên Sale
                      </h3>
                      <p className="text-sm text-slate-600 leading-relaxed">
                        Khi khách cũ để lại SĐT lần 2 từ chiến dịch khác trong chu kỳ 90 ngày, Router nhận diện tức thì để định tuyến về đúng Sale đang chăm sóc mà không làm lệch lượt vòng chia.
                      </p>
                    </>
                  )}
                  {heroTab === 2 && (
                    <>
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 uppercase tracking-wider">
                          <ToggleRight className="w-4 h-4 shrink-0" />
                          <span>Online Toggle &amp; SLA 15m Recall</span>
                        </span>
                        <AutoDataHelpTrigger topic="sla_recall" onOpenTour={() => setTourOpen(true)} />
                      </div>
                      <h3 className="text-xl font-bold text-slate-900 leading-snug">
                        Tự thu hồi khi quá hạn 15 phút &amp; đền bù 1-đổi-1 khi gặp số rác
                      </h3>
                      <p className="text-sm text-slate-600 leading-relaxed">
                        Sale nghỉ phép bật Offline không bị đổ số oan. Quá 15 phút chưa nhận khách Ads, hệ thống tự thu hồi chuyển Sale kế tiếp. Khách cá nhân Sale tự nhập được miễn thu hồi 100%.
                      </p>
                    </>
                  )}
                  {heroTab === 3 && (
                    <>
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 uppercase tracking-wider">
                          <Share2 className="w-4 h-4 shrink-0" />
                          <span>ZaloBot /chatid &amp; Meta CAPI v21.0</span>
                        </span>
                        <AutoDataHelpTrigger topic="zalobot_chatid" onOpenTour={() => setTourOpen(true)} />
                        <AutoDataHelpTrigger topic="meta_capi" onOpenTour={() => setTourOpen(true)} />
                      </div>
                      <h3 className="text-xl font-bold text-slate-900 leading-snug">
                        Báo số qua Zalo dưới 4 giây &amp; nuôi máy học quảng cáo tự động
                      </h3>
                      <p className="text-sm text-slate-600 leading-relaxed">
                        Mỗi Sale gõ <code className="font-mono font-bold text-slate-900">/chatid</code> để nhận thông báo riêng trên điện thoại; khi xác nhận khách nét hệ thống tự gửi sự kiện HTTP 200 về Facebook Dataset.
                      </p>
                    </>
                  )}

                  <div className="pt-1 flex flex-wrap items-center gap-3">
                    <button
                      type="button"
                      onClick={() => openFullScreenApp(session ? 'workspace_router' : 'register')}
                      className="rounded-xl bg-slate-900 text-white px-5 py-2.5 text-xs font-semibold hover:bg-blue-600 transition-colors inline-flex items-center gap-2 cursor-pointer whitespace-nowrap"
                    >
                      <span>Thiết lập &amp; Bắn thử Lead thật</span>
                      <ArrowRight className="w-3.5 h-3.5 shrink-0" />
                    </button>
                    <button
                      type="button"
                      onClick={() => openFullScreenApp(session ? 'workspace_sale_port' : 'register')}
                      className="rounded-xl border border-slate-300 bg-white text-slate-800 px-4 py-2.5 text-xs font-semibold hover:bg-slate-100 transition-colors cursor-pointer whitespace-nowrap"
                    >
                      Mở Cổng Sale Cá Nhân
                    </button>
                  </div>
                </div>

                {/* Live Router Diagram Card — Default Internal Sales + Optional External Agency F1 Toggle */}
                <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 space-y-3.5 shadow-sm">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900">
                        Vòng Chia Số: Mặc Định Từng Sale Nội Bộ
                      </span>
                      <span className="rounded-full bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[10px] font-bold text-emerald-700 whitespace-nowrap">
                        SLA &lt; 3.8s
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => setShowExternalAgencyPreview((v) => !v)}
                      className={`self-start sm:self-center rounded-full px-3 py-1 text-[11px] font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                        showExternalAgencyPreview
                          ? 'bg-slate-900 text-white'
                          : 'border border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      {showExternalAgencyPreview
                        ? 'Tùy chọn Đại lý F1: Đang Bật'
                        : 'Tùy chọn Đại lý F1: Đang Tắt'}
                    </button>
                  </div>

                  <div className="space-y-2.5 text-xs">
                    {[
                      {
                        name: 'Trưởng nhóm Sale Nội Bộ #01',
                        mode: 'Trọng số x3 • Sale Nội Bộ (is_external_agency = false)',
                        phoneView: '0912 888 678',
                        quota: 'Đã nhận: 12/12',
                        status: 'ONLINE • ĐỦ SĐT',
                        tone: 'bg-emerald-100 text-emerald-800',
                      },
                      {
                        name: 'Chuyên viên Sale Nội Bộ #02',
                        mode: 'Trọng số x2 • Sale Nội Bộ + Google Sheets 2 Chiều',
                        phoneView: '0987 456 321',
                        quota: 'Đã nhận: 7/8 (+1 bù lỗi)',
                        status: 'ƯU TIÊN KẾ TIẾP',
                        tone: 'bg-blue-100 text-blue-800',
                      },
                      showExternalAgencyPreview
                        ? {
                            name: 'Đối tác Đại lý / CTV F1 (Tùy chọn bật thêm)',
                            mode: 'Trọng số x1 • Đại lý ngoài (is_external_agency = true)',
                            phoneView: '0909 *** 412',
                            quota: 'Đã nhận: 4/4',
                            status: 'F1 CHE SĐT',
                            tone: 'bg-purple-100 text-purple-800',
                          }
                        : {
                            name: 'Chuyên viên Sale Nội Bộ #03',
                            mode: 'Trọng số x2 • Sale Nội Bộ + 5 Lead cá nhân (0 Quota)',
                            phoneView: '0909 555 412',
                            quota: 'Đã nhận Ads: 6/6',
                            status: 'ONLINE • ĐỦ SĐT',
                            tone: 'bg-emerald-100 text-emerald-800',
                          },
                      {
                        name: 'Chuyên viên Sale Nội Bộ #04',
                        mode: 'Đang bật chế độ Nghỉ phép ca chiều',
                        phoneView: 'Tạm ngưng đổ số',
                        quota: 'Bảo lưu định mức (Skipped Credit)',
                        status: 'OFFLINE',
                        tone: 'bg-amber-100 text-amber-800',
                      },
                    ].map((row, idx) => (
                      <div
                        key={idx}
                        className="rounded-xl border border-slate-100 bg-slate-50/70 px-3.5 py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                      >
                        <div className="min-w-0">
                          <div className="font-semibold text-slate-900">{row.name}</div>
                          <div className="text-[11px] text-slate-500">
                            {row.mode} • SĐT: <code className="font-mono text-slate-800">{row.phoneView}</code>
                          </div>
                        </div>
                        <div className="flex items-center justify-between sm:justify-end gap-2.5 shrink-0">
                          <span className="text-[11px] text-slate-500 font-medium whitespace-nowrap">{row.quota}</span>
                          <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold whitespace-nowrap ${row.tone}`}>
                            {row.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ====================================================================
          REAL PARTNERS STRIP (#partners)
         ==================================================================== */}
      <section id="partners" className="py-12 sm:py-16 border-y border-slate-200/80 bg-slate-50/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="text-center space-y-2">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
              ĐƯỢC TIN DÙNG BỞI CÁC ĐỘI SALE &amp; DOANH NGHIỆP TRÊN TOÀN QUỐC
            </p>
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 leading-snug">
              Vận hành thực tế từ Giáo dục Quốc tế (IDEAS), Y tế (Nha khoa Flora) đến Bất động sản (RichLand, Capital House)
            </h2>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {PARTNER_BRANDS.map((partner) => (
              <div
                key={partner.name}
                className="rounded-2xl bg-white border border-slate-200/80 px-5 py-4 flex flex-col items-center justify-center text-center gap-2.5 hover:border-slate-300 transition-colors"
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
                  <div className="text-[11px] text-slate-500">{partner.sector}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ====================================================================
          DEEP AUTO DATA ROUTER MECHANICS (#router-engine) + ? Help Triggers
         ==================================================================== */}
      <section id="router-engine" className="scroll-mt-20 py-20 sm:py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto space-y-12">
          <div className="max-w-3xl space-y-3">
            <div className="text-xs font-bold uppercase tracking-wider text-blue-600">
              KIẾN TRÚC BỘ ĐỊNH TUYẾN AUTO DATA ROUTER
            </div>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-950 leading-[1.24]">
              Giải quyết triệt để 6 bài toán cốt lõi của mọi đội ngũ Sale &amp; Marketing
            </h2>
            <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
              Mặc định tối ưu sẵn cho từng nhân viên Sale nội bộ, đồng thời có sẵn công tắc tùy chọn khi doanh nghiệp hợp tác thêm với Đại lý ngoài. Nhấn biểu tượng <strong>?</strong> trên từng thẻ để xem công thức và mã mẫu.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {routerEngineCards.map((card, i) => {
              const Icon = card.icon;
              return (
                <div
                  key={i}
                  className="rounded-3xl border border-slate-200/90 bg-white p-6 sm:p-7 space-y-3.5 hover:border-slate-300 transition-colors flex flex-col justify-between"
                >
                  <div className="space-y-3.5">
                    <div className="flex items-center justify-between gap-3">
                      <div className="w-11 h-11 rounded-2xl bg-slate-900 text-white flex items-center justify-center shrink-0">
                        <Icon className="w-5 h-5" />
                      </div>
                      <AutoDataHelpTrigger
                        topic={card.helpTopic}
                        webhookUrl={session?.webhook_url}
                        saleEmail={session?.admin_email}
                        onOpenTour={() => setTourOpen(true)}
                      />
                    </div>
                    <h3 className="text-base sm:text-lg font-bold text-slate-950 leading-snug">
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
          SHOWCASE: SALE PORT PERSONAL LEADS, CSV EXPORT & 2-WAY SHEETS SYNC (#sale-port)
         ==================================================================== */}
      <section
        id="sale-port"
        className="scroll-mt-20 py-20 sm:py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-slate-50 via-blue-50/30 to-slate-50 border-y border-slate-200/80"
      >
        <div className="max-w-7xl mx-auto space-y-12">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
            <div className="max-w-3xl space-y-3">
              <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-600">
                <FolderKanban className="w-4 h-4 shrink-0" />
                <span>KHÔNG GIAN RIÊNG CHO TỪNG NHÂN VIÊN SALE (SALE PORT)</span>
                <AutoDataHelpTrigger topic="sale_port_personal" onOpenTour={() => setTourOpen(true)} />
              </div>
              <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-950 leading-[1.24]">
                Tự nhập Lead cá nhân không mất Quota, Xuất CSV &amp; Đồng bộ Google Sheets 2 Chiều
              </h2>
              <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
                Sale giỏi luôn có nguồn khách riêng tự khai thác. Auto Data tách bạch hoàn toàn giỏ khách cá nhân khỏi vòng chia Ads công ty, đồng thời kết nối 2 chiều với Google Sheet riêng của từng Sale.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 shrink-0">
              <button
                type="button"
                onClick={handleDownloadSamplePersonalCsv}
                className="inline-flex items-center justify-center gap-2 rounded-full border border-slate-300 bg-white hover:bg-slate-100 px-5 py-3 text-xs sm:text-sm font-semibold text-slate-800 transition-colors cursor-pointer whitespace-nowrap"
              >
                <Download className="w-4 h-4 text-blue-600 shrink-0" />
                <span>Tải mẫu CSV Cá Nhân</span>
              </button>
              <button
                type="button"
                onClick={() => openFullScreenApp(session ? 'workspace_sale_port' : 'register')}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-slate-900 hover:bg-blue-600 text-white px-6 py-3 text-xs sm:text-sm font-semibold transition-colors cursor-pointer whitespace-nowrap"
              >
                <span>Trải nghiệm Cổng Sale</span>
                <ArrowRight className="w-4 h-4 shrink-0" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Feature 1: Personal Leads Bypass Round-Robin & Recall */}
            <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-7 space-y-4 shadow-sm flex flex-col justify-between">
              <div className="space-y-3.5">
                <div className="flex items-center justify-between gap-2">
                  <div className="w-11 h-11 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
                    <PlusCircle className="w-5 h-5" />
                  </div>
                  <span className="rounded-full bg-emerald-50 border border-emerald-200 px-3 py-1 text-[11px] font-bold text-emerald-800 whitespace-nowrap">
                    Bypass Round-Robin • 0 Quota
                  </span>
                </div>
                <h3 className="text-lg font-bold text-slate-950 leading-snug">
                  1. Nhập / Import Data Cá Nhân Độc Lập
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Sale tự nhập tay hoặc import file khách hàng riêng vào Cổng Sale: đi thẳng vào giỏ cá nhân, <strong>không qua vòng chia chung</strong>, <strong>không trừ định mức nhận Lead Ads</strong> và <strong>miễn 100% thu hồi SLA 15 phút</strong>.
                </p>
              </div>
              <div className="rounded-2xl bg-slate-50 border border-slate-200/80 p-3.5 text-xs text-slate-700 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-semibold">Tác động vòng chia công ty:</span>
                  <span className="font-mono font-bold text-emerald-700">0 lượt (Độc lập)</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-semibold">Quy tắc thu hồi SLA 15p:</span>
                  <span className="font-mono font-bold text-blue-700">Miễn trừ vĩnh viễn</span>
                </div>
              </div>
            </div>

            {/* Feature 2: Personal CSV Export */}
            <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-7 space-y-4 shadow-sm flex flex-col justify-between">
              <div className="space-y-3.5">
                <div className="flex items-center justify-between gap-2">
                  <div className="w-11 h-11 rounded-2xl bg-blue-600 text-white flex items-center justify-center shrink-0">
                    <Download className="w-5 h-5" />
                  </div>
                  <span className="rounded-full bg-blue-50 border border-blue-200 px-3 py-1 text-[11px] font-bold text-blue-800 whitespace-nowrap">
                    UTF-8 BOM Chuẩn Excel
                  </span>
                </div>
                <h3 className="text-lg font-bold text-slate-950 leading-snug">
                  2. Xuất File CSV Cá Nhân 1 Chạm
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Mỗi nhân viên Sale chủ động lọc theo trạng thái, nguồn khách hoặc ngày tạo và tải danh sách khách hàng thuộc quyền sở hữu của mình ra file <strong>.CSV chuẩn tiếng Việt</strong> mở ngay trên Excel.
                </p>
              </div>
              <div className="rounded-2xl bg-slate-50 border border-slate-200/80 p-3.5 text-xs text-slate-700 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-semibold">Phân quyền dữ liệu:</span>
                  <span className="font-bold text-slate-900">Sale nào chỉ xuất giỏ đó</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-semibold">Bảng mã tiếng Việt:</span>
                  <span className="font-mono font-bold text-emerald-700">UTF-8 with BOM</span>
                </div>
              </div>
            </div>

            {/* Feature 3: Per-Sale 2-Way Google Sheets Sync */}
            <div className="rounded-3xl border border-blue-200 bg-white p-6 sm:p-7 space-y-4 shadow-sm flex flex-col justify-between">
              <div className="space-y-3.5">
                <div className="flex items-center justify-between gap-2">
                  <div className="w-11 h-11 rounded-2xl bg-slate-900 text-white flex items-center justify-center shrink-0">
                    <Table2 className="w-5 h-5" />
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="rounded-full bg-amber-50 border border-amber-200 px-3 py-1 text-[11px] font-bold text-amber-800 whitespace-nowrap">
                      Real-Time 2 Chiều
                    </span>
                    <AutoDataHelpTrigger
                      topic="apps_script"
                      webhookUrl={session?.webhook_url}
                      saleEmail={session?.admin_email}
                      onOpenTour={() => setTourOpen(true)}
                    />
                  </div>
                </div>
                <h3 className="text-lg font-bold text-slate-950 leading-snug">
                  3. Đồng Bộ Google Sheets 2 Chiều Từng Sale
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Gắn Google Sheet cá nhân cho từng Sale: Lead mới tự động chảy vào Sheet; khi Sale đổi cột <strong>Trạng thái / Ghi chú</strong> ngay trên Sheet, dữ liệu tự đồng bộ ngược về Auto Data &amp; kích hoạt Meta CAPI!
                </p>
              </div>
              <button
                type="button"
                onClick={() => void handleCopyAppsScriptLanding()}
                className="w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap"
              >
                {copiedLandingScript ? <Check className="w-4 h-4 shrink-0" /> : <Copy className="w-4 h-4 shrink-0" />}
                <span>
                  {copiedLandingScript
                    ? 'Đã sao chép mã Google Apps Script!'
                    : 'Sao chép Apps Script Sheets 2 Chiều'}
                </span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ====================================================================
          OMNI-CHANNEL FLOW (#omni-channel)
         ==================================================================== */}
      <section id="omni-channel" className="scroll-mt-20 py-16 sm:py-20 px-4 sm:px-6 lg:px-8 bg-slate-950 text-white">
        <div className="max-w-7xl mx-auto space-y-10">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
            <div className="max-w-2xl space-y-2.5">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-400">
                <span>LUỒNG KẾT NỐI ĐA KÊNH KHÉP KÍN</span>
                <AutoDataHelpTrigger
                  topic="apps_script"
                  tone="dark"
                  webhookUrl={session?.webhook_url}
                  saleEmail={session?.admin_email}
                  onOpenTour={() => setTourOpen(true)}
                />
              </div>
              <h2 className="text-2xl sm:text-4xl font-extrabold leading-[1.24]">
                Từ lúc khách bấm Đăng ký Quảng cáo tới điện thoại Sale dưới 4 giây
              </h2>
            </div>
            <button
              type="button"
              onClick={() => openFullScreenApp(session ? 'workspace_router' : 'register')}
              className="self-start rounded-full bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 text-xs sm:text-sm font-semibold inline-flex items-center gap-2 transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              <span>Lấy URL Webhook Thật Ngay</span>
              <ArrowRight className="w-4 h-4 shrink-0" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              {
                step: 'BƯỚC 01 • THU HÚT',
                icon: Webhook,
                title: 'Hội tụ mọi nguồn Lead',
                desc: 'Nhận dữ liệu thời gian thực từ Facebook Lead Ads, TikTok, LadiPage, WordPress, Google Sheets qua cổng Webhook chuẩn hóa.',
              },
              {
                step: 'BƯỚC 02 • LỌC & CHIA VÒNG',
                icon: Layers,
                title: 'Chống trùng & Định tuyến',
                desc: 'Chuẩn hóa đầu số Việt Nam (+84 → 0), kiểm tra trùng 90 ngày và chọn nhân viên Sale nội bộ tối ưu theo trọng số đã cài.',
              },
              {
                step: 'BƯỚC 03 • TƯƠNG TÁC TỨC THÌ',
                icon: Bot,
                title: 'Đẩy ZaloBot & Sheet Riêng',
                desc: 'Bắn thông báo đến Zalo cá nhân của Sale dưới 4 giây, đồng thời ghi dòng mới vào Google Sheet 2 chiều của Sale đó.',
              },
              {
                step: 'BƯỚC 04 • TỐI ƯU ADS AI',
                icon: Activity,
                title: 'Phản hồi Meta CAPI v21.0',
                desc: 'Khi Sale chuyển trạng thái Đủ điều kiện hoặc Chốt đơn, hệ thống tự động gửi tín hiệu băm SHA-256 ngược về Meta Dataset.',
              },
            ].map((item, idx) => {
              const Icon = item.icon;
              return (
                <div key={idx} className="rounded-3xl border border-white/10 bg-white/5 p-6 space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-mono font-bold text-blue-400 whitespace-nowrap">
                      {item.step}
                    </span>
                    <Icon className="w-5 h-5 text-slate-300 shrink-0" />
                  </div>
                  <h3 className="text-base font-bold text-white leading-snug">{item.title}</h3>
                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">{item.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ====================================================================
          REQUIRED VS OPTIONAL CONNECT CLARITY + ZALO BOT A-Z LIVE VERIFICATION (#zalo-connect-guide)
         ==================================================================== */}
      <section id="zalo-connect-guide" className="scroll-mt-20 py-20 sm:py-24 px-4 sm:px-6 lg:px-8 bg-white border-b border-slate-200/80">
        <div className="max-w-7xl mx-auto space-y-10">
          <div className="max-w-3xl space-y-3">
            <div className="text-xs font-bold uppercase tracking-wider text-blue-600">
              KHỞI TẠO KHÔNG RÀO CẢN • BẮT BUỘC VS TÙY CHỌN MINH BẠCH
            </div>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-950 leading-[1.24]">
              Vào dùng ngay trong 30 giây — Hoặc làm theo hướng dẫn Zalo Bot A–Z &amp; Test trực tiếp
            </h2>
            <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
              Chúng tôi tách biệt rõ bước <strong>Bắt buộc</strong> (tạo không gian nhận URL Webhook ngay) và các kết nối <strong>Tùy chọn</strong> để đội Sale của bạn không bao giờ bị kẹt ở khâu cấu hình kỹ thuật.
            </p>
          </div>

          {/* Required vs Optional Comparison Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="rounded-3xl border border-slate-200 bg-slate-50/70 p-6 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <span className="rounded-full bg-rose-100 px-3 py-1 text-xs font-bold text-rose-800 whitespace-nowrap">
                  BẮT BUỘC • CHỈ 30 GIÂY
                </span>
                <span className="text-xs font-semibold text-slate-500 whitespace-nowrap">Dùng được ngay 100%</span>
              </div>
              <h3 className="text-lg font-bold text-slate-950">
                1. Tài khoản Tổ chức &amp; Cổng Webhook Mặc Định
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Chỉ cần điền Tên đội Sale, Email và Mật khẩu. Hệ thống cấp sẵn URL Webhook riêng, kích hoạt vòng chia mặc định cho từng Sale nội bộ và mở Cổng Sale Cá Nhân ngay lập tức.
              </p>
            </div>

            <div className="rounded-3xl border border-amber-200 bg-amber-50/40 p-6 space-y-3 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-900 whitespace-nowrap">
                    TÙY CHỌN • CÀI BẤT CỨ LÚC NÀO
                  </span>
                  <span className="text-xs font-semibold text-amber-800 whitespace-nowrap">Không chặn quy trình</span>
                </div>
                <h3 className="text-lg font-bold text-slate-950">
                  2. Zalo Bot (/chatid), Meta CAPI &amp; Google Sheets 2 Chiều
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  Chưa kịp tạo Zalo Bot hay lấy Meta Dataset Token? Nhấn nút bỏ qua nhanh bên dưới để vào làm việc trước, sau đó quay lại kết nối bất kỳ lúc nào trong Workspace.
                </p>
              </div>
              <div className="pt-1">
                <button
                  type="button"
                  onClick={() => openFullScreenApp(session ? 'workspace_router' : 'register')}
                  className="inline-flex items-center gap-2 rounded-full bg-slate-900 hover:bg-blue-600 text-white px-5 py-2.5 text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap"
                >
                  <span>Tùy chọn — Tạm bỏ qua &amp; vào setup ngay</span>
                  <ArrowRight className="w-3.5 h-3.5 shrink-0" />
                </button>
              </div>
            </div>
          </div>

          {/* Embedded A-Z Zalo Bot Step-by-Step Guide & Live Connection Verification Test */}
          <AutoDataZaloBotGuide
            accessToken={session?.access_token}
            tenantSlug={session?.tenant_slug}
            savedZaloBot={session?.zalo_bot}
            onVerified={(saved) => {
              if (session) {
                handleSessionChange({
                  ...session,
                  zalo_bot: saved,
                });
              }
            }}
            onFastSkip={() => openFullScreenApp(session ? 'workspace_router' : 'register')}
            fastSkipLabel="Tùy chọn — Tạm bỏ qua & vào setup ngay"
            onOpenTour={() => setTourOpen(true)}
          />
        </div>
      </section>

      {/* ====================================================================
          REAL PRODUCT SCREENSHOTS GALLERY (#screenshots)
         ==================================================================== */}
      <section id="screenshots" className="py-20 sm:py-24 px-4 sm:px-6 lg:px-8 bg-slate-50/60 border-b border-slate-200/80">
        <div className="max-w-7xl mx-auto space-y-10">
          <div className="max-w-2xl space-y-2.5">
            <div className="text-xs font-bold uppercase tracking-wider text-blue-600">
              GIAO DIỆN HỆ THỐNG THỰC TẾ
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-950 leading-[1.24]">
              Trực quan, tinh gọn cho cả Quản trị viên lẫn Nhân viên Sale
            </h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              Nhấn vào từng màn hình để phóng to chi tiết các phân hệ điều hành bên trong Auto Data.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {SYSTEM_SCREENSHOTS.map((shot) => (
              <button
                key={shot.title}
                type="button"
                onClick={() => setZoomImage(shot)}
                className="group rounded-3xl border border-slate-200 bg-white overflow-hidden text-left hover:border-blue-300 transition-all shadow-sm cursor-pointer flex flex-col"
              >
                <div className="relative aspect-[16/10] bg-slate-100 overflow-hidden border-b border-slate-100">
                  <img
                    src={shot.src}
                    alt={shot.title}
                    loading="lazy"
                    className="w-full h-full object-cover object-top group-hover:scale-[1.02] transition-transform duration-300"
                  />
                  <span className="absolute bottom-3 right-3 rounded-full bg-slate-900/80 text-white px-3 py-1 text-[11px] font-semibold inline-flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                    <ZoomIn className="w-3.5 h-3.5 shrink-0" />
                    <span>Phóng to</span>
                  </span>
                </div>
                <div className="p-5 space-y-1.5 flex-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600">{shot.badge}</span>
                  <h3 className="text-sm sm:text-base font-bold text-slate-900 leading-snug">{shot.title}</h3>
                  <p className="text-xs text-slate-500 leading-relaxed">{shot.desc}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ====================================================================
          LIVE DYNAMIC PRICING: 3-MONTH FREE TRIAL -> STEP RENEWAL (900K / -15%) & TOPUP
         ==================================================================== */}
      <section id="pricing" className="scroll-mt-20 py-20 sm:py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto space-y-12">
          <div className="text-center max-w-3xl mx-auto space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 border border-emerald-200 px-4 py-1.5 text-xs font-bold text-emerald-800">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>MIỄN PHÍ {catalog.trial_duration_months} THÁNG ĐẦU ({catalog.trial_duration_days} NGÀY)</span>
              <AutoDataHelpTrigger topic="billing_3m_900k" onOpenTour={() => setTourOpen(true)} />
            </div>

            <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-950 leading-[1.24]">
              Trải nghiệm trọn vẹn {catalog.trial_duration_months} tháng 0đ. Gia hạn linh hoạt từ {(catalog.base_monthly_price_vnd / 1000).toFixed(0)}k/tháng.
            </h2>

            <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
              Sau {catalog.trial_duration_months} tháng dùng thử miễn phí, doanh nghiệp chủ động chọn gia hạn gói Lite bên dưới, nạp Ví Topup cộng dồn ngày hoặc nâng cấp thẳng lên Marketing Automation, CRM 360° &amp; ERP 5.0.
            </p>

            {/* Billing Cycle Switcher — Zero-wrap concise labels */}
            <div className="pt-2 inline-flex items-center bg-slate-100 p-1.5 rounded-full gap-1.5">
              <button
                type="button"
                onClick={() => setPricingCycle('monthly')}
                className={`px-4 sm:px-5 py-2 rounded-full text-xs sm:text-sm font-semibold transition-all cursor-pointer whitespace-nowrap ${
                  pricingCycle === 'monthly' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'
                }`}
              >
                Theo tháng ({(catalog.base_monthly_price_vnd / 1000).toFixed(0)}k)
              </button>
              <button
                type="button"
                onClick={() => setPricingCycle('annual')}
                className={`px-4 sm:px-5 py-2 rounded-full text-xs sm:text-sm font-semibold transition-all cursor-pointer whitespace-nowrap ${
                  pricingCycle === 'annual' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600'
                }`}
              >
                Theo năm • Giảm {catalog.annual_discount_pct}%
              </button>
            </div>
          </div>

          {/* 3 Step Plans */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
            {catalog.plans.map((plan) => {
              const displayMonthly =
                pricingCycle === 'annual' ? plan.annual_monthly_equivalent_vnd : plan.monthly_price_vnd;
              const isEnterprise = Boolean(plan.is_enterprise_upgrade);
              const isDefaultStandard = plan.code === 'autodata_standard';

              return (
                <div
                  key={plan.code}
                  className={`rounded-3xl border p-7 flex flex-col justify-between transition-all ${
                    isEnterprise
                      ? 'bg-slate-950 text-white border-slate-900'
                      : isDefaultStandard
                        ? 'bg-white text-slate-900 border-blue-600 ring-2 ring-blue-100 shadow-md'
                        : 'bg-white text-slate-900 border-slate-200'
                  }`}
                >
                  <div className="space-y-5">
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className={`text-xs font-mono font-bold uppercase whitespace-nowrap ${
                          isEnterprise ? 'text-blue-400' : 'text-blue-600'
                        }`}
                      >
                        STEP 0{plan.step_order}
                      </span>
                      {plan.badge && (
                        <span
                          className={`rounded-full px-3 py-0.5 text-[11px] font-bold whitespace-nowrap ${
                            isEnterprise
                              ? 'bg-white/15 text-white'
                              : isDefaultStandard
                                ? 'bg-blue-600 text-white'
                                : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {plan.badge}
                        </span>
                      )}
                    </div>

                    <div>
                      <h3 className="text-xl font-bold leading-snug">{plan.name}</h3>
                      <p className={`text-xs mt-1.5 leading-relaxed ${isEnterprise ? 'text-slate-300' : 'text-slate-500'}`}>
                        {plan.tagline}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-slate-200/20">
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-3xl sm:text-4xl font-extrabold font-mono">
                          {displayMonthly.toLocaleString('vi-VN')}₫
                        </span>
                        <span className={`text-xs whitespace-nowrap ${isEnterprise ? 'text-slate-300' : 'text-slate-500'}`}>
                          / tháng
                        </span>
                      </div>
                      {pricingCycle === 'annual' ? (
                        <div
                          className={`text-xs font-semibold mt-1.5 ${
                            isEnterprise ? 'text-emerald-300' : 'text-emerald-700'
                          }`}
                        >
                          Cả năm: {plan.annual_total_vnd.toLocaleString('vi-VN')}₫ (Tiết kiệm{' '}
                          {plan.annual_saved_vnd.toLocaleString('vi-VN')}₫ • -{plan.annual_discount_pct}%)
                        </div>
                      ) : (
                        <div className={`text-xs mt-1.5 ${isEnterprise ? 'text-slate-400' : 'text-slate-500'}`}>
                          Chu kỳ 1 tháng linh hoạt • Mua năm giảm ngay {plan.annual_discount_pct}%
                        </div>
                      )}
                    </div>

                    <ul className="space-y-2.5 text-xs sm:text-sm pt-2">
                      {plan.features.map((feat, idx) => (
                        <li key={idx} className="flex items-start gap-2.5">
                          <Check
                            className={`w-4 h-4 shrink-0 mt-0.5 ${
                              isEnterprise ? 'text-blue-400' : 'text-blue-600'
                            }`}
                          />
                          <span className={`leading-relaxed ${isEnterprise ? 'text-slate-200' : 'text-slate-700'}`}>
                            {feat}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="pt-7">
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
                      className={`w-full rounded-full py-3.5 px-5 text-xs sm:text-sm font-semibold transition-colors inline-flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap ${
                        isEnterprise
                          ? 'bg-white text-slate-950 hover:bg-blue-50'
                          : isDefaultStandard
                            ? 'bg-blue-600 text-white hover:bg-blue-700'
                            : 'bg-slate-900 text-white hover:bg-blue-600'
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
                </div>
              );
            })}
          </div>

          {/* Wallet Topup Packages Strip */}
          <div className="rounded-3xl border border-slate-200 bg-slate-50/80 p-6 sm:p-8 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="w-11 h-11 rounded-2xl bg-blue-600 text-white flex items-center justify-center shrink-0">
                  <Wallet className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 leading-snug">
                    Cơ chế Nạp Ví Topup &amp; Gia Hạn Tự Động Không Gián Đoạn
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mt-0.5">
                    Nạp sẵn hạn mức vào Ví doanh nghiệp để tự động gia hạn tức thì khi hết {catalog.trial_duration_months} tháng dùng thử — cộng dồn 100% số ngày còn dư.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => openFullScreenApp(session ? 'workspace_billing' : 'register')}
                className="self-start rounded-full border border-slate-300 bg-white px-5 py-2.5 text-xs font-semibold text-slate-800 hover:bg-slate-100 inline-flex items-center gap-2 cursor-pointer whitespace-nowrap shrink-0"
              >
                <CreditCard className="w-4 h-4 text-blue-600 shrink-0" />
                <span>Mở Quản lý Gói &amp; Ví Topup</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {catalog.topup_packages.map((pkg) => (
                <div
                  key={pkg.id}
                  className={`rounded-2xl border bg-white p-5 flex flex-col justify-between gap-3 ${
                    pkg.highlight ? 'border-blue-600 ring-1 ring-blue-100' : 'border-slate-200'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-bold text-slate-800">{pkg.label}</span>
                      {pkg.highlight && (
                        <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800 whitespace-nowrap">
                          -{catalog.annual_discount_pct}%
                        </span>
                      )}
                    </div>
                    <div className="text-xl font-extrabold font-mono text-blue-600 mt-1.5">
                      {pkg.amount_vnd.toLocaleString('vi-VN')} ₫
                    </div>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">{pkg.equivalent_months_note}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ====================================================================
          LITE POSITIONING & 3-PATH ECOSYSTEM UPGRADE CARDS (#crm-erp-upgrade)
          Upgrade paths to Marketing Automation (/automation), Full CRM 360 (/crm) & ERP 5.0 (/erp)
         ==================================================================== */}
      <section id="crm-erp-upgrade" className="scroll-mt-20 py-20 sm:py-24 px-4 sm:px-6 lg:px-8 bg-slate-50 border-t border-slate-200/80">
        <div className="max-w-7xl mx-auto space-y-10">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
            <div className="max-w-3xl space-y-3">
              <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 border border-blue-200 px-3.5 py-1 text-xs font-bold text-blue-700 whitespace-nowrap">
                <Sparkles className="w-3.5 h-3.5 shrink-0" />
                <span>ĐỊNH VỊ BẢN LITE &amp; LỘ TRÌNH NÂNG CẤP HỆ SINH THÁI</span>
              </div>
              <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-950 leading-[1.24]">
                Bắt đầu gọn nhẹ với <span className="text-blue-600">Bản Lite chuyên cho Sale &amp; Chia Data</span> — Mở rộng không giới hạn khi cần
              </h2>
              <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
                DOMATION Auto Data (/data) được tối ưu để đội Sale vận hành ngay không tốn thời gian đào tạo. Khi doanh nghiệp cần nuôi dưỡng tự động đa kênh, quản lý hợp đồng MISA hay quản trị tổng thể 12 phân hệ, nâng cấp liền mạch mà không phải nhập lại bất kỳ dữ liệu nào.
              </p>
            </div>

            <button
              type="button"
              onClick={() => openFullScreenApp(session ? 'workspace_crm_erp' : 'register')}
              className="self-start rounded-full bg-slate-900 hover:bg-blue-600 text-white px-6 py-3.5 text-xs sm:text-sm font-semibold transition-colors inline-flex items-center gap-2 cursor-pointer whitespace-nowrap shrink-0"
            >
              <span>Đăng ký Nâng cấp (Giữ 100% Data)</span>
              <ArrowRight className="w-4 h-4 shrink-0" />
            </button>
          </div>

          {/* 3 Clear Upgrade Cards: Marketing Automation (/automation), Full CRM 360 (/crm), Enterprise ERP 5.0 (/erp) */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
            {/* Upgrade Path 1: Marketing Automation */}
            <div className="rounded-3xl border border-slate-200 bg-white p-7 flex flex-col justify-between gap-6 hover:border-blue-300 transition-colors shadow-sm">
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-2">
                  <div className="w-11 h-11 rounded-2xl bg-blue-600 text-white flex items-center justify-center shrink-0">
                    <Workflow className="w-5 h-5" />
                  </div>
                  <span className="rounded-full bg-blue-50 border border-blue-200 px-3 py-1 text-[11px] font-bold text-blue-700 whitespace-nowrap">
                    Nâng cấp Nuôi Dưỡng &amp; AI
                  </span>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-950">
                    Marketing Automation &amp; AI RAG
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 mt-1.5 leading-relaxed">
                    Tự động chăm sóc lại khách chưa chốt từ Auto Data bằng kịch bản rẽ nhánh IF/ELSE đa kênh và trợ lý AI trực 24/7.
                  </p>
                </div>
                <ul className="space-y-2 text-xs sm:text-sm text-slate-700">
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                    <span>Visual Flow Builder tự động gửi Email Kéo Thả &amp; Zalo ZNS</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                    <span>AI Chatbot huấn luyện theo tài liệu riêng từng phòng ban</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                    <span>Web Tracking chạm Click, QR sự kiện &amp; Voucher Hub</span>
                  </li>
                </ul>
              </div>
              <a
                href={catalog.automation_upgrade_url || '/automation'}
                className="w-full rounded-2xl border border-slate-300 bg-slate-50 hover:bg-blue-600 hover:text-white hover:border-blue-600 px-5 py-3.5 text-xs sm:text-sm font-bold text-slate-900 flex items-center justify-between transition-colors whitespace-nowrap"
              >
                <span>Khám phá Marketing Automation</span>
                <ArrowUpRight className="w-4 h-4 shrink-0" />
              </a>
            </div>

            {/* Upgrade Path 2: Full CRM 360 */}
            <div className="rounded-3xl border border-slate-200 bg-white p-7 flex flex-col justify-between gap-6 hover:border-blue-300 transition-colors shadow-sm">
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-2">
                  <div className="w-11 h-11 rounded-2xl bg-slate-900 text-white flex items-center justify-center shrink-0">
                    <Layers className="w-5 h-5" />
                  </div>
                  <span className="rounded-full bg-emerald-50 border border-emerald-200 px-3 py-1 text-[11px] font-bold text-emerald-800 whitespace-nowrap">
                    Nâng cấp Quản Trị Bán Hàng
                  </span>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-950">
                    Full DOMATION CRM 360° &amp; MISA
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 mt-1.5 leading-relaxed">
                    Mở rộng từ chia số nhanh lên quản trị toàn diện vòng đời khách hàng B2B/B2C, báo giá, hợp đồng và doanh thu thực thu.
                  </p>
                </div>
                <ul className="space-y-2 text-xs sm:text-sm text-slate-700">
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>Phễu Kanban 8 nấc chuyên sâu &amp; Hồ sơ khách hàng 360°</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>Tạo Báo giá, Hợp đồng, Đợt thanh toán &amp; Hóa đơn MISA</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>Kho Databank tái khai thác Lead cũ &amp; Co-care hoa hồng</span>
                  </li>
                </ul>
              </div>
              <a
                href={catalog.crm_upgrade_url || '/crm'}
                className="w-full rounded-2xl border border-slate-300 bg-slate-50 hover:bg-slate-900 hover:text-white hover:border-slate-900 px-5 py-3.5 text-xs sm:text-sm font-bold text-slate-900 flex items-center justify-between transition-colors whitespace-nowrap"
              >
                <span>Khám phá Full CRM 360°</span>
                <ArrowUpRight className="w-4 h-4 shrink-0" />
              </a>
            </div>

            {/* Upgrade Path 3: Enterprise ERP 5.0 */}
            <div className="rounded-3xl border border-slate-900 bg-slate-950 text-white p-7 flex flex-col justify-between gap-6 shadow-md">
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-2">
                  <div className="w-11 h-11 rounded-2xl bg-blue-600 text-white flex items-center justify-center shrink-0">
                    <Cpu className="w-5 h-5" />
                  </div>
                  <span className="rounded-full bg-white/15 px-3 py-1 text-[11px] font-bold text-blue-200 whitespace-nowrap">
                    Hệ Điều Hành Toàn Doanh Nghiệp
                  </span>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">
                    DOMATION Enterprise ERP 5.0
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-300 mt-1.5 leading-relaxed">
                    Hợp nhất toàn bộ 12 phân hệ vận hành nội bộ cho doanh nghiệp quy mô lớn trên một nền tảng duy nhất.
                  </p>
                </div>
                <ul className="space-y-2 text-xs sm:text-sm text-slate-200">
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                    <span>HRM Chấm công GPS AI, Bảng lương KPI &amp; Phiếu lương PDF</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                    <span>Tài chính thu chi, Công nợ, Kho vận &amp; Phê duyệt đa cấp</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                    <span>Bảo mật Row-Level Security (RLS) &amp; Triển khai Server riêng</span>
                  </li>
                </ul>
              </div>
              <a
                href={catalog.erp_upgrade_url || '/erp'}
                className="w-full rounded-2xl bg-white hover:bg-blue-50 text-slate-950 px-5 py-3.5 text-xs sm:text-sm font-bold flex items-center justify-between transition-colors whitespace-nowrap"
              >
                <span>Khám phá Enterprise ERP 5.0</span>
                <ArrowUpRight className="w-4 h-4 text-blue-600 shrink-0" />
              </a>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-600">
            <div className="flex items-center gap-2">
              <FileCheck2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>
                Cam kết chuyển đổi liền mạch: <strong>Giữ nguyên 100% danh sách Lead, lịch sử chăm sóc, Cổng Sale cá nhân &amp; URL Webhook</strong> khi nâng cấp.
              </span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0" />
              <span className="font-semibold text-slate-800 whitespace-nowrap">Hỗ trợ kỹ thuật 1-1</span>
            </div>
          </div>
        </div>
      </section>

      {/* ====================================================================
          DEDICATED /data FOOTER — With Terms, Privacy & Cookie Consent Controls
         ==================================================================== */}
      <footer className="bg-white border-t border-slate-200 py-9 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto space-y-5">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 text-xs text-slate-500">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-bold text-slate-900">DOMATION AUTO DATA (BẢN LITE)</span>
              <span>•</span>
              <span>Chuyên cho Sale &amp; Chia Data thuộc Hệ sinh thái DOMATION.NET</span>
            </div>

            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 font-medium">
              <a href="/" className="hover:text-slate-900 whitespace-nowrap">
                Trang chủ DOMATION
              </a>
              <a href={catalog.automation_upgrade_url || '/automation'} className="hover:text-slate-900 whitespace-nowrap">
                Marketing Automation
              </a>
              <a href={catalog.crm_upgrade_url || '/crm'} className="hover:text-slate-900 whitespace-nowrap">
                Full CRM 360°
              </a>
              <a href={catalog.erp_upgrade_url || '/erp'} className="hover:text-slate-900 whitespace-nowrap">
                ERP 5.0
              </a>
              <button
                type="button"
                onClick={() => openFullScreenApp('login')}
                className="hover:text-slate-900 cursor-pointer whitespace-nowrap"
              >
                Đăng nhập Workspace
              </button>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-500">
            <div>© {new Date().getFullYear()} Công ty TNHH Giải pháp Công nghệ DOMATION Việt Nam.</div>

            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 font-medium">
              <a
                href="/data?legal=terms"
                onClick={(e) => {
                  e.preventDefault();
                  openLegalDoc('terms');
                }}
                className="inline-flex items-center gap-1 hover:text-blue-600 transition-colors whitespace-nowrap"
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
                className="inline-flex items-center gap-1 hover:text-blue-600 transition-colors whitespace-nowrap"
              >
                <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                <span>Chính sách bảo mật</span>
              </a>

              <button
                type="button"
                onClick={() => setCookieForceCounter((c) => c + 1)}
                className="inline-flex items-center gap-1 hover:text-blue-600 transition-colors cursor-pointer whitespace-nowrap"
              >
                <Cookie className="w-3.5 h-3.5 shrink-0" />
                <span>Tùy chỉnh Cookie</span>
              </button>
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

      {/* Interactive 7-Step Guided Tour Modal */}
      <AutoDataStepTourModal
        open={tourOpen}
        onClose={() => setTourOpen(false)}
        webhookUrl={session?.webhook_url}
        saleEmail={session?.admin_email}
        onActionStartSetup={() => openFullScreenApp(session ? 'workspace_router' : 'register')}
      />

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

      {/* FULL-SCREEN (100vw x 100vh) REAL CONNECT & WORKSPACE APP */}
      <AutoDataFullScreenSetup
        key={setupModalKey}
        open={setupOpen}
        initialIntent={setupIntent}
        catalog={catalog}
        session={session}
        onSessionChange={handleSessionChange}
        onClose={() => setSetupOpen(false)}
        onOpenLegal={(t) => openLegalDoc(t)}
        onOpenTour={() => setTourOpen(true)}
      />
    </div>
  );
}

export default DomationDataLanding;
