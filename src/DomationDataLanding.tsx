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
  CreditCard,
  EyeOff,
  FileCheck2,
  Gauge,
  Layers,
  Menu,
  RefreshCw,
  Scale,
  Share2,
  ShieldCheck,
  Sparkles,
  ToggleRight,
  UserCheck,
  Wallet,
  Webhook,
  X,
  ZoomIn,
} from 'lucide-react';
import AutoDataFullScreenSetup from './components/autodata/AutoDataFullScreenSetup';
import {
  DEFAULT_CLIENT_CATALOG,
  type ClientBillingCatalog,
  type ClientSessionState,
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
    desc: 'Theo dõi trực quan lưu lượng Lead đổ về từ các chiến dịch, tốc độ tiếp nhận SLA và trạng thái Online từng nhân sự.',
    src: '/CHIA DATA/chia_data (1).png',
  },
  {
    title: 'Ma Trận Trọng Số & Công Tắc Online / Nghỉ Phép',
    badge: 'Fair-Share Matrix',
    desc: 'Cấu hình hệ số nhận khách (Senior x3, Junior x1), bảo lưu lượt khi nghỉ phép và bật/tắt Cộng tác viên F1 tức thì.',
    src: '/CHIA DATA/chia_data (22).png',
  },
  {
    title: 'Phễu Chăm Sóc & Dòng Thời Gian Bất Biến',
    badge: 'Pipeline & SLA',
    desc: 'Mọi thao tác nhận khách, ghi chú cuộc gọi và chuyển bước đều đóng dấu thời gian phục vụ kiểm toán minh bạch.',
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
    desc: 'Đo lường độ lệch phân bổ dữ liệu giữa các phòng ban, chi nhánh và nguồn chiến dịch hoàn toàn minh bạch.',
    src: '/CHIA DATA/chia_data (19).png',
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

  // Interactive Hero Browser Preview state
  const [heroTab, setHeroTab] = useState<0 | 1 | 2 | 3>(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Pricing section cycle toggle
  const [pricingCycle, setPricingCycle] = useState<'annual' | 'monthly'>('annual');

  // Zoomable screenshot lightbox
  const [zoomImage, setZoomImage] = useState<ScreenshotItem | null>(null);

  // Sync live dynamic catalog & platform defaults from real backend bridge
  useEffect(() => {
    document.title = 'DOMATION Auto Data — Hệ Thống Tự Động Chia Vòng Lead Đa Kênh';
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

  const standardPlan = catalog.plans[0] || DEFAULT_CLIENT_CATALOG.plans[0];

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans antialiased selection:bg-blue-100 selection:text-blue-700 overflow-x-clip">
      {/* ====================================================================
          DEDICATED /data SUB-APP HEADER (Separate from Portfolio & Home Navbar)
         ==================================================================== */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <a href="/data" className="flex items-center gap-2.5 shrink-0">
              <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center font-black text-xs tracking-tight">
                AD
              </div>
              <span className="font-bold text-sm sm:text-base tracking-tight text-slate-950">
                DOMATION <span className="text-blue-600">DATA</span>
              </span>
            </a>

            <span className="hidden sm:inline text-slate-300">|</span>

            <a
              href="/"
              className="hidden sm:inline-flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-slate-900 transition-colors truncate"
            >
              <ArrowLeft className="w-3 h-3" />
              <span>Hệ sinh thái DOMATION.NET</span>
            </a>
          </div>

          <nav className="hidden lg:flex items-center gap-6 text-[13px] font-medium text-slate-600">
            <a href="#router-engine" className="hover:text-slate-950 transition-colors">
              Cơ chế Chia Vòng
            </a>
            <a href="#omni-channel" className="hover:text-slate-950 transition-colors">
              Luồng Đa Kênh
            </a>
            <a href="#screenshots" className="hover:text-slate-950 transition-colors">
              Giao diện Thật
            </a>
            <a href="#partners" className="hover:text-slate-950 transition-colors">
              Khách hàng
            </a>
            <a href="#pricing" className="hover:text-slate-950 transition-colors">
              Gói &amp; Gia hạn
            </a>
            <a href="#crm-erp-upgrade" className="text-blue-600 font-semibold hover:text-blue-700 transition-colors">
              Nâng cấp CRM / ERP
            </a>
          </nav>

          <div className="hidden sm:flex items-center gap-2.5 shrink-0">
            {session ? (
              <>
                <button
                  type="button"
                  onClick={() => openFullScreenApp('workspace_billing')}
                  className="rounded-full border border-slate-200 px-3.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Gói &amp; Topup ({session.subscription.days_remaining}d)
                </button>
                <button
                  type="button"
                  onClick={() => openFullScreenApp('workspace_router')}
                  className="rounded-full bg-slate-900 text-white px-4 py-2 text-xs font-semibold hover:bg-blue-600 transition-colors inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <span>Workspace ({session.tenant_slug})</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => openFullScreenApp('login')}
                  className="rounded-full px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Đăng nhập
                </button>
                <button
                  type="button"
                  onClick={() => openFullScreenApp('register')}
                  className="rounded-full bg-slate-900 text-white px-4 py-2 text-xs font-semibold hover:bg-blue-600 transition-colors inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <span>Dùng thử {catalog.trial_duration_months} tháng miễn phí</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </>
            )}
          </div>

          <button
            type="button"
            onClick={() => setMobileMenuOpen((v) => !v)}
            aria-label="Mở menu điều hướng"
            className="sm:hidden rounded-lg border border-slate-200 p-2 text-slate-700"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="sm:hidden border-t border-slate-200 bg-white px-4 py-4 space-y-3">
            <div className="grid grid-cols-2 gap-2 text-xs font-medium text-slate-700">
              <a href="#router-engine" onClick={() => setMobileMenuOpen(false)} className="py-1.5">
                Cơ chế Chia Vòng
              </a>
              <a href="#omni-channel" onClick={() => setMobileMenuOpen(false)} className="py-1.5">
                Luồng Đa Kênh
              </a>
              <a href="#partners" onClick={() => setMobileMenuOpen(false)} className="py-1.5">
                Khách hàng
              </a>
              <a href="#pricing" onClick={() => setMobileMenuOpen(false)} className="py-1.5">
                Bảng gói ({(catalog.base_monthly_price_vnd / 1000).toFixed(0)}k)
              </a>
              <a href="#crm-erp-upgrade" onClick={() => setMobileMenuOpen(false)} className="py-1.5 text-blue-600 font-semibold">
                Nâng cấp CRM / ERP
              </a>
              <a href="/" className="py-1.5 text-slate-500">
                ← Trang chủ DOMATION
              </a>
            </div>
            <div className="pt-2 border-t border-slate-100 flex gap-2">
              <button
                type="button"
                onClick={() => openFullScreenApp(session ? 'workspace_billing' : 'login')}
                className="flex-1 rounded-full border border-slate-300 py-2 text-xs font-semibold text-slate-800"
              >
                {session ? 'Quản lý Gói' : 'Đăng nhập'}
              </button>
              <button
                type="button"
                onClick={() => openFullScreenApp(session ? 'workspace_router' : 'register')}
                className="flex-1 rounded-full bg-slate-900 text-white py-2 text-xs font-semibold"
              >
                {session ? 'Mở Workspace' : `Miễn phí ${catalog.trial_duration_months} tháng`}
              </button>
            </div>
          </div>
        )}
      </header>

      {/* ====================================================================
          HERO SECTION (BlankBuilder Clean Minimalist High-Contrast Style)
          Industry-agnostic • Crisp 2-line headline • Centered CTAs • Browser Frame
         ==================================================================== */}
      <section className="pt-14 sm:pt-20 pb-16 sm:pb-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-white via-slate-50/40 to-white">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3.5 py-1 text-xs font-medium text-slate-600 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-blue-600" />
            <span>Auto Data Router cho mọi doanh nghiệp • Kết nối thật dưới 60 giây</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-[3.5rem] font-extrabold tracking-tight text-slate-950 leading-[1.12]">
            Tự động chia vòng Lead đa kênh.
            <span className="block text-blue-600 mt-1.5">
              Công bằng dưới 4 giây cho đội Sale.
            </span>
          </h1>

          <p className="max-w-2xl mx-auto text-base sm:text-lg text-slate-600 leading-relaxed">
            Nền tảng định tuyến dữ liệu khách hàng độc lập không giới hạn ngành nghề — tự động phân bổ theo trọng số, chống trùng SĐT 90 ngày, báo ZaloBot tức thì và đồng bộ ngược Meta CAPI.
          </p>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => openFullScreenApp(session ? 'workspace_router' : 'register')}
              className="w-full sm:w-auto rounded-full bg-slate-900 text-white px-7 py-3.5 text-sm font-semibold hover:bg-blue-600 transition-all shadow-sm inline-flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>
                {session
                  ? `Mở Không Gian Kết Nối (${session.tenant_slug})`
                  : `Bắt đầu ${catalog.trial_duration_months} tháng miễn phí`}
              </span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <a
              href="#router-engine"
              className="w-full sm:w-auto rounded-full border border-slate-300 bg-white text-slate-800 px-7 py-3.5 text-sm font-semibold hover:bg-slate-50 transition-colors inline-flex items-center justify-center gap-2"
            >
              <span>Xem cơ chế Vòng Chia Số</span>
            </a>
          </div>

          <p className="text-xs text-slate-500">
            Miễn phí <strong className="text-slate-700">{catalog.trial_duration_months} tháng đầu ({catalog.trial_duration_days} ngày)</strong> · Hết hạn gia hạn từ{' '}
            <strong className="text-slate-700">{catalog.base_monthly_price_vnd.toLocaleString('vi-VN')}₫/tháng</strong> · Mua năm tiết kiệm{' '}
            <strong className="text-emerald-700">{catalog.annual_discount_pct}% ({standardPlan.annual_monthly_equivalent_vnd.toLocaleString('vi-VN')}₫/tháng)</strong>
          </p>
        </div>

        {/* Clean Browser Window Interactive Preview (BlankBuilder Frame) */}
        <div className="max-w-6xl mx-auto mt-12 sm:mt-16">
          <div className="rounded-2xl sm:rounded-3xl border border-slate-200/90 bg-white shadow-[0_24px_70px_-20px_rgba(15,23,42,0.12)] overflow-hidden">
            {/* Browser Top Chrome */}
            <div className="px-4 sm:px-6 py-3 bg-slate-50 border-b border-slate-200/80 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-slate-300" />
                <span className="w-2.5 h-2.5 rounded-full bg-slate-300" />
                <span className="w-2.5 h-2.5 rounded-full bg-slate-300" />
                <span className="ml-2 text-xs font-mono text-slate-500 truncate">
                  domation.net/data • Auto Data Router Engine ({bridgeMode === 'upstream_rls_postgres' ? 'PostgreSQL RLS Live' : 'Serverless Live'})
                </span>
              </div>
              <button
                type="button"
                onClick={() => openFullScreenApp(session ? 'workspace_router' : 'register')}
                className="rounded-full bg-blue-600 text-white px-3.5 py-1 text-[11px] font-semibold hover:bg-blue-700 transition-colors cursor-pointer shrink-0"
              >
                Kết nối thật toàn màn hình →
              </button>
            </div>

            {/* Interactive 4-Pillar Router Switcher */}
            <div className="p-4 sm:p-8 space-y-6">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
                {[
                  { idx: 0 as const, label: '01. Thuật Toán Chia Vòng', icon: Scale },
                  { idx: 1 as const, label: '02. Chống Trùng 90 Ngày', icon: UserCheck },
                  { idx: 2 as const, label: '03. Công Tắc Online & Bù Số', icon: ToggleRight },
                  { idx: 3 as const, label: '04. ZaloBot & Meta CAPI', icon: Share2 },
                ].map((item) => {
                  const Icon = item.icon;
                  const active = heroTab === item.idx;
                  return (
                    <button
                      key={item.idx}
                      type="button"
                      onClick={() => setHeroTab(item.idx)}
                      className={`rounded-xl border px-3.5 py-2.5 text-left text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
                        active
                          ? 'border-slate-900 bg-slate-900 text-white shadow-sm'
                          : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                      }`}
                    >
                      <Icon className="w-4 h-4 shrink-0" />
                      <span className="truncate">{item.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Active Router Stage */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center bg-slate-50/70 rounded-2xl border border-slate-200/80 p-5 sm:p-7">
                <div className="lg:col-span-5 space-y-4">
                  {heroTab === 0 && (
                    <>
                      <div className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 uppercase tracking-wider">
                        <Scale className="w-4 h-4" />
                        <span>Deficit Weighted Fair-Share &amp; Round-Robin</span>
                      </div>
                      <h3 className="text-xl font-bold text-slate-900">
                        Chia số chính xác theo trọng số năng lực hoặc xoay vòng 1:1
                      </h3>
                      <p className="text-sm text-slate-600 leading-relaxed">
                        Hỗ trợ đồng thời 4 chế độ: Chia theo hệ số KPI (VD: Chuyên viên chính nhận 3 phần, Nhân sự mới nhận 1 phần), Xoay vòng tuần tự 1:1, Ưu tiên người ít tải nhất hoặc Hàng đợi duyệt tay theo từng chiến dịch UTM.
                      </p>
                    </>
                  )}
                  {heroTab === 1 && (
                    <>
                      <div className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 uppercase tracking-wider">
                        <UserCheck className="w-4 h-4" />
                        <span>90-Day Deduplication &amp; Ownership Lock</span>
                      </div>
                      <h3 className="text-xl font-bold text-slate-900">
                        Chấm dứt tranh chấp khách trùng giữa các nhân sự &amp; nguồn Ads
                      </h3>
                      <p className="text-sm text-slate-600 leading-relaxed">
                        Khi khách cũ để lại SĐT lần 2 từ chiến dịch khác trong chu kỳ 90 ngày, Router tự động nhận diện tức thì để định tuyến về đúng nhân sự đang chăm sóc hoặc ghi nối lịch sử mà không làm lệch lượt vòng chia.
                      </p>
                    </>
                  )}
                  {heroTab === 2 && (
                    <>
                      <div className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 uppercase tracking-wider">
                        <ToggleRight className="w-4 h-4" />
                        <span>Online Toggle, SLA 15m Recall &amp; 1-for-1 Credit</span>
                      </div>
                      <h3 className="text-xl font-bold text-slate-900">
                        Tự thu hồi khi quá hạn 15 phút &amp; đền bù 1-đổi-1 khi gặp số rác
                      </h3>
                      <p className="text-sm text-slate-600 leading-relaxed">
                        Nhân sự nghỉ phép bật Offline không bị đổ số oan. Quá 15 phút chưa nhận khách, hệ thống tự thu hồi chuyển người kế tiếp. Gặp SĐT sai/thuê bao, duyệt Ticket tự động cộng bù ngay lượt mới.
                      </p>
                    </>
                  )}
                  {heroTab === 3 && (
                    <>
                      <div className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 uppercase tracking-wider">
                        <Share2 className="w-4 h-4" />
                        <span>ZaloBot Instant Push &amp; Meta CAPI v21.0</span>
                      </div>
                      <h3 className="text-xl font-bold text-slate-900">
                        Báo số qua Zalo dưới 4 giây &amp; nuôi máy học quảng cáo tự động
                      </h3>
                      <p className="text-sm text-slate-600 leading-relaxed">
                        Nhận thông báo và bấm nhận khách ngay trên Zalo điện thoại; che giấu SĐT dạng <code className="font-mono text-slate-900">0912***678</code> với Cộng tác viên ngoài; tự gửi sự kiện khách nét về Facebook Dataset.
                      </p>
                    </>
                  )}

                  <div className="pt-1 flex flex-wrap items-center gap-3">
                    <button
                      type="button"
                      onClick={() => openFullScreenApp(session ? 'workspace_router' : 'register')}
                      className="rounded-xl bg-slate-900 text-white px-4 py-2.5 text-xs font-semibold hover:bg-blue-600 transition-colors inline-flex items-center gap-1.5 cursor-pointer"
                    >
                      <span>Thiết lập &amp; Bắn thử Lead thật</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Live Router Diagram Card on the Right */}
                <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 space-y-3.5 shadow-sm">
                  <div className="flex items-center justify-between text-xs border-b border-slate-100 pb-3">
                    <span className="font-bold text-slate-800">Mô phỏng trạng thái Vòng Chia Số Trực Tiếp</span>
                    <span className="rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700">
                      SLA &lt; 3.8s • Gini 0.02
                    </span>
                  </div>

                  <div className="space-y-2.5 text-xs">
                    {[
                      {
                        name: 'Trưởng nhóm Kinh doanh #01',
                        mode: 'Trọng số x3 • Nội bộ',
                        phoneView: '0912 888 678',
                        quota: 'Đã nhận: 12/12',
                        status: 'ONLINE',
                        tone: 'bg-emerald-100 text-emerald-800',
                      },
                      {
                        name: 'Chuyên viên Tư vấn #02',
                        mode: 'Trọng số x2 • Nội bộ',
                        phoneView: '0987 456 321',
                        quota: 'Đã nhận: 7/8 (+1 bù lỗi)',
                        status: 'ƯU TIÊN KẾ TIẾP',
                        tone: 'bg-blue-100 text-blue-800',
                      },
                      {
                        name: 'Đối tác Liên kết / CTV F1',
                        mode: 'Trọng số x1 • PII Masked',
                        phoneView: '0909 *** 412',
                        quota: 'Đã nhận: 4/4',
                        status: 'CHE SĐT BẢO MẬT',
                        tone: 'bg-slate-100 text-slate-700',
                      },
                      {
                        name: 'Chuyên viên Tư vấn #03',
                        mode: 'Đang bật chế độ Nghỉ phép',
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
                        <div>
                          <div className="font-semibold text-slate-900">{row.name}</div>
                          <div className="text-[11px] text-slate-500">
                            {row.mode} • Hiển thị: <code className="font-mono text-slate-700">{row.phoneView}</code>
                          </div>
                        </div>
                        <div className="flex items-center justify-between sm:justify-end gap-2.5 shrink-0">
                          <span className="text-[11px] text-slate-500 font-medium">{row.quota}</span>
                          <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${row.tone}`}>
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
          REAL PARTNERS STRIP (#partners) — Including IDEAS, RichLand, Nha khoa Flora
         ==================================================================== */}
      <section id="partners" className="py-12 sm:py-16 border-y border-slate-200/80 bg-slate-50/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="text-center space-y-1.5">
            <p className="text-xs font-bold uppercase tracking-widest text-slate-500">
              ĐƯỢC TIN DÙNG BỞI CÁC DOANH NGHIỆP ĐA LĨNH VỰC TRÊN TOÀN QUỐC
            </p>
            <h2 className="text-lg sm:text-xl font-bold text-slate-900">
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
          DEEP AUTO DATA ROUTER MECHANICS (#router-engine) — Universal & Detailed
         ==================================================================== */}
      <section id="router-engine" className="py-20 sm:py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto space-y-12">
          <div className="max-w-3xl space-y-3">
            <div className="text-xs font-bold uppercase tracking-widest text-blue-600">
              KIẾN TRÚC BỘ ĐỊNH TUYẾN AUTO DATA ROUTER
            </div>
            <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-slate-950">
              Giải quyết triệt để 6 bài toán cốt lõi của mọi phòng Kinh doanh &amp; Marketing
            </h2>
            <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
              Không phụ thuộc ngành nghề — dù doanh nghiệp của bạn có 5 chuyên viên tư vấn hay 200 đại lý cộng tác viên bên ngoài, toàn bộ vòng chia đều được tự động hóa theo luật minh bạch.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: Scale,
                title: '1. Chia Vòng Trọng Số & Xoay Vòng 1:1',
                desc: 'Tùy chọn linh hoạt giữa Deficit Weighted Fair-Share (chia theo định mức năng lực x1, x2, x5), Strict Round-Robin 1:1 hoặc Least-Loaded (ưu tiên nhân sự đang rảnh).',
              },
              {
                icon: UserCheck,
                title: '2. Chống Trùng SĐT 90 Ngày Đa Chính Sách',
                desc: 'Quét trùng tức thì bằng khóa nguyên tử cấp Database. Tự chọn: trả về nhân sự cũ đang chăm, ghi nối vào hồ sơ sẵn có, mở vòng mới theo sản phẩm hoặc chặn trùng tại cổng.',
              },
              {
                icon: Clock,
                title: '3. Tự Động Thu Hồi SLA Quá Hạn (Auto-Recall)',
                desc: 'Cấu hình thời gian cam kết phản hồi (VD: 15 phút). Nếu nhân sự chưa bấm tiếp nhận khách mới, Router tự động thu hồi và chuyển ngay sang người kế tiếp đang Online.',
              },
              {
                icon: RefreshCw,
                title: '4. Báo Số Rác & Đền Bù Tự Động 1-Đổi-1',
                desc: 'Gặp khách nhầm số, thuê bao hoặc sai đối tượng, nhân sự gửi báo cáo kèm lý do. Ngay khi Quản lý duyệt, hệ thống tự cộng trả 1 lượt bù ưu tiên ở vòng chia tiếp theo.',
              },
              {
                icon: EyeOff,
                title: '5. Che Giấu SĐT Cộng Tác Viên (PII Masking)',
                desc: 'Chia sẻ giỏ hàng an toàn cho Đại lý liên kết / CTV bên ngoài với định dạng che số 0912***678 ngay từ tầng API — chống sao chép danh sách khách hàng của công ty.',
              },
              {
                icon: Gauge,
                title: '6. Định Tuyến Theo UTM & Kiểm Toán Gini',
                desc: 'Tự động bẻ nhánh Lead về đúng đội chuyên trách dựa trên utm_source, chiến dịch, khu vực địa lý hoặc khung giờ trực ca, kèm chỉ số đo lường công bằng Gini.',
              },
            ].map((card, i) => {
              const Icon = card.icon;
              return (
                <div
                  key={i}
                  className="rounded-3xl border border-slate-200/90 bg-white p-6 sm:p-7 space-y-3.5 hover:border-slate-300 transition-colors"
                >
                  <div className="w-11 h-11 rounded-2xl bg-slate-900 text-white flex items-center justify-center">
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="text-base sm:text-lg font-bold text-slate-950">{card.title}</h3>
                  <p className="text-sm text-slate-600 leading-relaxed">{card.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ====================================================================
          OMNI-CHANNEL FLOW (#omni-channel)
         ==================================================================== */}
      <section id="omni-channel" className="py-16 sm:py-20 px-4 sm:px-6 lg:px-8 bg-slate-950 text-white">
        <div className="max-w-7xl mx-auto space-y-10">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
            <div className="max-w-2xl space-y-2.5">
              <div className="text-xs font-bold uppercase tracking-widest text-blue-400">
                LUỒNG KẾT NỐI ĐA KÊNH KHÉP KÍN
              </div>
              <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
                Từ lúc khách bấm Đăng ký Quảng cáo tới điện thoại Sale dưới 4 giây
              </h2>
            </div>
            <button
              type="button"
              onClick={() => openFullScreenApp(session ? 'workspace_router' : 'register')}
              className="self-start rounded-full bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 text-xs sm:text-sm font-semibold inline-flex items-center gap-2 transition-colors cursor-pointer"
            >
              <span>Lấy URL Webhook Thật Ngay</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
                desc: 'Chuẩn hóa đầu số Việt Nam (+84 -> 0), kiểm tra trùng 90 ngày và chọn nhân sự tối ưu theo thuật toán vòng chia đã cài.',
              },
              {
                step: 'BƯỚC 03 • TƯƠNG TÁC TỨC THÌ',
                icon: Bot,
                title: 'Đẩy ZaloBot & Đếm SLA',
                desc: 'Bắn thông báo đến Zalo nhân sự phụ trách; cho phép gõ lệnh nhanh để xác nhận tiếp nhận hoặc báo cáo SĐT lỗi.',
              },
              {
                step: 'BƯỚC 04 • TỐI ƯU ADS AI',
                icon: Activity,
                title: 'Phản hồi Meta CAPI v21.0',
                desc: 'Khi khách chuyển sang Đủ điều kiện hoặc Chốt đơn, hệ thống tự động gửi tín hiệu băm SHA-256 ngược về Meta Dataset.',
              },
            ].map((item, idx) => {
              const Icon = item.icon;
              return (
                <div key={idx} className="rounded-3xl border border-white/10 bg-white/5 p-6 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-mono font-bold text-blue-400">{item.step}</span>
                    <Icon className="w-5 h-5 text-slate-300" />
                  </div>
                  <h3 className="text-base font-bold text-white">{item.title}</h3>
                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">{item.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ====================================================================
          REAL PRODUCT SCREENSHOTS GALLERY (#screenshots)
         ==================================================================== */}
      <section id="screenshots" className="py-20 sm:py-24 px-4 sm:px-6 lg:px-8 bg-slate-50/60 border-b border-slate-200/80">
        <div className="max-w-7xl mx-auto space-y-10">
          <div className="max-w-2xl space-y-2.5">
            <div className="text-xs font-bold uppercase tracking-widest text-blue-600">
              GIAO DIỆN HỆ THỐNG THỰC TẾ
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-950">
              Trực quan, tinh gọn cho cả Quản trị viên lẫn Nhân viên Kinh doanh
            </h2>
            <p className="text-sm text-slate-600">
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
                  <span className="absolute bottom-3 right-3 rounded-full bg-slate-900/80 text-white px-2.5 py-1 text-[11px] font-semibold inline-flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <ZoomIn className="w-3.5 h-3.5" /> Phóng to
                  </span>
                </div>
                <div className="p-5 space-y-1.5 flex-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600">{shot.badge}</span>
                  <h3 className="text-sm sm:text-base font-bold text-slate-900">{shot.title}</h3>
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
      <section id="pricing" className="py-20 sm:py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto space-y-12">
          <div className="text-center max-w-3xl mx-auto space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 border border-emerald-200 px-4 py-1 text-xs font-bold text-emerald-800">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>MẶC ĐỊNH MIỄN PHÍ {catalog.trial_duration_months} THÁNG ĐẦU ({catalog.trial_duration_days} NGÀY)</span>
            </div>

            <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-slate-950">
              Trải nghiệm trọn vẹn {catalog.trial_duration_months} tháng 0đ. Hết hạn gia hạn linh hoạt từ {(catalog.base_monthly_price_vnd / 1000).toFixed(0)}k/tháng.
            </h2>

            <p className="text-sm sm:text-base text-slate-600">
              Sau {catalog.trial_duration_months} tháng dùng thử miễn phí, doanh nghiệp chủ động chọn gia hạn các gói Step bên dưới, nạp Ví Topup tự động hoặc nâng cấp thẳng lên Hệ sinh thái CRM / ERP.
            </p>

            {/* Billing Cycle Switcher */}
            <div className="pt-2 inline-flex items-center bg-slate-100 p-1.5 rounded-full">
              <button
                type="button"
                onClick={() => setPricingCycle('monthly')}
                className={`px-5 py-2 rounded-full text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                  pricingCycle === 'monthly' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'
                }`}
              >
                Thanh toán theo tháng ({(catalog.base_monthly_price_vnd / 1000).toFixed(0)}k/tháng)
              </button>
              <button
                type="button"
                onClick={() => setPricingCycle('annual')}
                className={`px-5 py-2 rounded-full text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                  pricingCycle === 'annual' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600'
                }`}
              >
                Mua theo năm • Tiết kiệm {catalog.annual_discount_pct}%
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
                        className={`text-xs font-mono font-bold uppercase ${
                          isEnterprise ? 'text-blue-400' : 'text-blue-600'
                        }`}
                      >
                        STEP 0{plan.step_order}
                      </span>
                      {plan.badge && (
                        <span
                          className={`rounded-full px-3 py-0.5 text-[11px] font-bold ${
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
                      <h3 className="text-xl font-bold">{plan.name}</h3>
                      <p className={`text-xs mt-1 leading-relaxed ${isEnterprise ? 'text-slate-300' : 'text-slate-500'}`}>
                        {plan.tagline}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-slate-200/20">
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-3xl sm:text-4xl font-extrabold font-mono tracking-tight">
                          {displayMonthly.toLocaleString('vi-VN')}₫
                        </span>
                        <span className={`text-xs ${isEnterprise ? 'text-slate-300' : 'text-slate-500'}`}>
                          / tháng
                        </span>
                      </div>
                      {pricingCycle === 'annual' ? (
                        <div
                          className={`text-xs font-semibold mt-1.5 ${
                            isEnterprise ? 'text-emerald-300' : 'text-emerald-700'
                          }`}
                        >
                          Thanh toán cả năm: {plan.annual_total_vnd.toLocaleString('vi-VN')}₫ (Tiết kiệm{' '}
                          {plan.annual_saved_vnd.toLocaleString('vi-VN')}₫ • -{plan.annual_discount_pct}%)
                        </div>
                      ) : (
                        <div className={`text-xs mt-1.5 ${isEnterprise ? 'text-slate-400' : 'text-slate-500'}`}>
                          Chu kỳ 1 tháng linh hoạt • Mua theo năm giảm ngay {plan.annual_discount_pct}%
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
                          <span className={isEnterprise ? 'text-slate-200' : 'text-slate-700'}>{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="pt-7 space-y-2">
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
                      className={`w-full rounded-full py-3 px-5 text-xs sm:text-sm font-semibold transition-colors inline-flex items-center justify-center gap-2 cursor-pointer ${
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
                            ? 'Yêu cầu nâng cấp CRM / ERP'
                            : 'Gia hạn / Nâng cấp gói này'
                          : `Dùng miễn phí ${catalog.trial_duration_months} tháng trước`}
                      </span>
                      <ArrowRight className="w-4 h-4" />
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
                  <h3 className="text-lg font-bold text-slate-900">
                    Cơ chế Nạp Ví Topup &amp; Gia Hạn Tự Động Không Gián Đoạn
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600">
                    Nạp sẵn hạn mức vào Ví doanh nghiệp để tự động gia hạn tức thì khi hết {catalog.trial_duration_months} tháng dùng thử — cộng dồn 100% số ngày còn dư.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => openFullScreenApp(session ? 'workspace_billing' : 'register')}
                className="self-start rounded-full border border-slate-300 bg-white px-5 py-2.5 text-xs font-semibold text-slate-800 hover:bg-slate-100 inline-flex items-center gap-1.5 cursor-pointer shrink-0"
              >
                <CreditCard className="w-4 h-4 text-blue-600" />
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
                        <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                          -{catalog.annual_discount_pct}%
                        </span>
                      )}
                    </div>
                    <div className="text-xl font-extrabold font-mono text-blue-600 mt-1.5">
                      {pkg.amount_vnd.toLocaleString('vi-VN')} ₫
                    </div>
                    <p className="text-xs text-slate-500 mt-1">{pkg.equivalent_months_note}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ====================================================================
          SEAMLESS UPGRADE TO DOMATION CRM 360 & ENTERPRISE ERP 5.0 (#crm-erp-upgrade)
         ==================================================================== */}
      <section id="crm-erp-upgrade" className="py-16 sm:py-20 px-4 sm:px-6 lg:px-8 bg-slate-50 border-t border-slate-200/80">
        <div className="max-w-7xl mx-auto rounded-3xl bg-white border border-slate-200 p-7 sm:p-12 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center shadow-sm">
          <div className="lg:col-span-7 space-y-4">
            <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-blue-600">
              <Sparkles className="w-4 h-4" />
              <span>LỘ TRÌNH MỞ RỘNG KHÔNG GIỚI HẠN</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-950">
              Khi doanh nghiệp mở rộng quy mô, nâng cấp liền mạch lên DOMATION CRM 360° &amp; ERP 5.0
            </h2>
            <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
              Bắt đầu nhẹ nhàng với Auto Data để chuẩn hóa vòng chia số. Bất cứ lúc nào cần quản lý hợp đồng, công nợ, hóa đơn điện tử, nhân sự chấm công GPS hay kho vận, bạn có thể nâng cấp trực tiếp mà không phải nhập lại bất kỳ dữ liệu nào.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 text-xs font-medium text-slate-700">
              <div className="flex items-center gap-2">
                <FileCheck2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Giữ nguyên 100% danh sách Lead &amp; lịch sử chăm sóc</span>
              </div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0" />
                <span>Đồng bộ nguyên vẹn sơ đồ phòng ban &amp; phân quyền</span>
              </div>
            </div>
          </div>

          <div className="lg:col-span-5 flex flex-col gap-3">
            <button
              type="button"
              onClick={() => openFullScreenApp(session ? 'workspace_crm_erp' : 'register')}
              className="w-full rounded-2xl bg-slate-900 text-white px-6 py-4 text-sm font-semibold hover:bg-blue-600 transition-colors flex items-center justify-between cursor-pointer"
            >
              <span>Khởi tạo / Đăng ký Nâng cấp Hệ sinh thái</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <div className="grid grid-cols-2 gap-3">
              <a
                href={catalog.crm_upgrade_url || '/crm'}
                className="rounded-2xl border border-slate-200 bg-slate-50 hover:bg-slate-100 px-4 py-3.5 text-xs font-bold text-slate-800 flex items-center justify-between transition-colors"
              >
                <span>Xem DOMATION CRM 360°</span>
                <ArrowUpRight className="w-4 h-4 text-blue-600" />
              </a>
              <a
                href={catalog.erp_upgrade_url || '/erp'}
                className="rounded-2xl border border-slate-200 bg-slate-50 hover:bg-slate-100 px-4 py-3.5 text-xs font-bold text-slate-800 flex items-center justify-between transition-colors"
              >
                <span>Xem Enterprise ERP 5.0</span>
                <ArrowUpRight className="w-4 h-4 text-emerald-600" />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Minimal Dedicated /data Footer */}
      <footer className="bg-white border-t border-slate-200 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-900">DOMATION AUTO DATA</span>
            <span>•</span>
            <span>Một sản phẩm thuộc Hệ sinh thái Quản trị Doanh nghiệp DOMATION.NET</span>
          </div>
          <div className="flex flex-wrap items-center gap-5 font-medium">
            <a href="/" className="hover:text-slate-900">
              Trang chủ DOMATION
            </a>
            <a href={catalog.crm_upgrade_url || '/crm'} className="hover:text-slate-900">
              CRM 360°
            </a>
            <a href={catalog.erp_upgrade_url || '/erp'} className="hover:text-slate-900">
              ERP 5.0
            </a>
            <button
              type="button"
              onClick={() => openFullScreenApp('login')}
              className="hover:text-slate-900 cursor-pointer"
            >
              Đăng nhập Workspace
            </button>
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
                className="rounded-full border border-slate-200 p-2 text-slate-600 hover:bg-slate-100 cursor-pointer"
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

      {/* FULL-SCREEN (100vw x 100vh) REAL CONNECT & WORKSPACE APP */}
      <AutoDataFullScreenSetup
        key={setupModalKey}
        open={setupOpen}
        initialIntent={setupIntent}
        catalog={catalog}
        session={session}
        onSessionChange={handleSessionChange}
        onClose={() => setSetupOpen(false)}
      />
    </div>
  );
}

export default DomationDataLanding;
