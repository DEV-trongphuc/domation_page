import React, { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import {
  Activity,
  ArrowRight,
  ArrowUp,
  Award,
  BarChart3,
  Check,
  CheckCircle2,
  Clock,
  Cookie,
  Cpu,
  Database,
  ExternalLink,
  Eye,
  FileText,
  KeyRound,
  Layers,
  Link2,
  Maximize2,
  Play,
  RefreshCw,
  ShieldCheck,
  Sliders,
  Sparkles,
  TrendingUp,
  Users,
  X,
  Zap,
} from 'lucide-react';
import { LuxuryGoldBackdrop } from './LuxuryGoldBackdrop';
import { Navbar } from './Navbar';
import { DomationLogoMark } from './components/DomationLogoMark';
import { DomationProgressLoader } from './components/DomationProgressLoader';
import { FaqAccordionSection } from './components/FaqAccordionSection';
import ResponsiveSlideDeck from './components/ResponsiveSlideDeck';
import { DOMATION_NAV_EVENT, handleSpaLinkClick, navigateTo } from './utils/navigation';
import { META_REPORT_FAQS, getMetaReportSeoConfig } from './data/coreRouteSeo';
import { usePageSeo } from './utils/seo';
import { ErrorBoundary } from './components/autodata/cloned/components/ErrorBoundary';
import { DomResponsiveSubtabs } from './components/dom-meta/DomMetaSelect';
import { ClosedLoopFlywheelCockpit } from './components/dom-meta/ClosedLoopFlywheelCockpit';
import {
  apiRequest,
  clearAutodataSessionV2,
  loadAutodataSessionV2,
  saveAutodataSessionV2,
} from './components/autodata/autodataApi';
import {
  AutoDataCookieConsent,
  AutoDataLegalModal,
} from './components/autodata/AutoDataLegalAndCookie';
import type {
  ClientSubscriptionSnapshot,
  LegalDocTab,
  TenantSessionV2,
  WorkspaceSummaryItem,
} from './components/autodata/autodataTypes';
import { DomMetaAuthModal, type DomMetaAuthMode } from './components/dom-meta/DomMetaAuthModal';
import { DomMetaModalPortal } from './components/dom-meta/DomMetaModals';
import { GoogleAdsSetupGuide } from './components/dom-meta/GoogleAdsSetupGuide';
import type { DomMetaGoogleAdsConfig, DomMetaNavView } from './components/dom-meta/domMetaTypes';
import {
  getCachedPublicDomMetaAccess,
  resolvePublicDomMetaAccess,
  type DomMetaAuthContext,
  type DomMetaPublicAccessPayload,
} from './components/dom-meta/domMetaApi';

const loadDomMetaWorkspaceChunk = () => import('./components/dom-meta/DomMetaReportWorkspace');

const DomMetaReportWorkspace = React.lazy(() =>
  loadDomMetaWorkspaceChunk().then((m) => ({
    default: m.DomMetaReportWorkspace,
  }))
);

const META_VIDEO_EMBED_URL = 'https://www.youtube.com/embed/fvIHSrpsAlI';
const META_VIDEO_YOUTUBE_URL = 'https://youtu.be/fvIHSrpsAlI?si=u4Ch5TjsjZWyvkkW';

interface PreviewInjectionConfig {
  authContext: DomMetaAuthContext;
  workspaceName: string;
  userDisplayName: string;
  userRoleLabel: string;
  mode?: 'standalone' | 'embedded';
  enableCrmAttribution?: boolean;
  erpMode?: boolean;
  showCapiTab?: boolean;
  crmShellPreview?: boolean;
  defaultQuickConnectOpen?: boolean;
  initialEntityModalTab?: 'insights' | 'crm_leads';
  initialView?: DomMetaNavView;
  initialCustomRange?: { since: string; until: string };
}

declare global {
  interface Window {
    __DOM_META_PREVIEW__?: PreviewInjectionConfig;
  }
}

type MetaShotCat = 'all' | 'dashboard' | 'modals' | 'creative';

interface MetaLiveShot {
  id: string;
  category: Exclude<MetaShotCat, 'all'>;
  tag: string;
  title: string;
  highlight: string;
  desc: string;
  src: string;
}

const SHOT_CATEGORIES: Array<{ id: MetaShotCat; label: string }> = [
  { id: 'all', label: 'Tất cả (9)' },
  { id: 'dashboard', label: 'Tổng quan & Giờ vàng' },
  { id: 'modals', label: 'Chiến dịch & Nội dung' },
  { id: 'creative', label: 'CRM, Lịch sử & Google Ads' },
];

const META_LIVE_SHOTS: MetaLiveShot[] = [
  {
    id: 'meta-dashboard',
    category: 'dashboard',
    tag: 'Tổng Quan',
    title: 'Bảng Tổng Quan Chi Tiêu & Kết Quả Real-Time',
    highlight: 'Chi tiêu • Xu hướng • Độ tuổi',
    desc: 'Xem ngay tổng chi tiêu, tăng giảm kỳ trước, biểu đồ ngày, Facebook/Instagram và độ tuổi.',
    src: '/imgs/meta-screens/meta-dashboard.webp',
  },
  {
    id: 'meta-heatmap-region',
    category: 'dashboard',
    tag: 'Khung Giờ & Vùng',
    title: 'Bản Đồ Nhiệt Giờ Vàng & Tỉnh Thành Ra Khách',
    highlight: '7 Ngày × 24 Giờ • Tỉnh thành',
    desc: 'Chỉ rõ khung giờ ra khách rẻ nhất trong tuần và tỉnh thành phản hồi tốt nhất.',
    src: '/imgs/meta-screens/meta-heatmap-region.webp',
  },
  {
    id: 'meta-performance-compare-modal',
    category: 'dashboard',
    tag: 'So Sánh Chu Kỳ',
    title: 'So Sánh Trực Diện Hiệu Quả Giữa Hai Giai Đoạn',
    highlight: 'Tự động tính % tăng giảm',
    desc: 'Đối chiếu nhanh chi tiêu, tiếp cận, lượt nhấp và chi phí/khách giữa hai chu kỳ.',
    src: '/imgs/meta-screens/meta-performance-compare-modal.webp',
  },
  {
    id: 'meta-campaigns',
    category: 'modals',
    tag: 'Chiến Dịch',
    title: 'Bảng Chiến Dịch → Nhóm → Bài Viết Tập Trung',
    highlight: 'Lọc thương hiệu • Xuất CSV',
    desc: 'Quản lý toàn bộ chiến dịch, nhóm và từng bài chạy trên một bảng cuộn mượt mà.',
    src: '/imgs/meta-screens/meta-campaigns.webp',
  },
  {
    id: 'meta-ad-detail-modal',
    category: 'modals',
    tag: 'Giữ Chân Video',
    title: 'Đo Tỷ Lệ Giữ Chân 3 Giây & Tần Suất Lặp',
    highlight: 'Hook 3s • Xem trọn video',
    desc: 'Đánh giá độ hút 3 giây đầu và cảnh báo sớm khi mẫu quảng cáo lặp quá nhiều.',
    src: '/imgs/meta-screens/meta-ad-detail-modal.webp',
  },
  {
    id: 'meta-ads-library',
    category: 'modals',
    tag: 'Thư Viện Bài Chạy',
    title: 'Thư Viện Trực Quan Mọi Ảnh & Video Đang Chạy',
    highlight: 'Xem bài thật • Mở post gốc',
    desc: 'Xem ảnh, video từng bài chạy kèm chi phí, số khách và mở thẳng bài viết gốc.',
    src: '/imgs/meta-screens/meta-ads-library.webp',
  },
  {
    id: 'meta-ad-account-logs',
    category: 'creative',
    tag: 'Lịch Sử Tài Khoản',
    title: 'Tổng Hợp Chi Tiêu Năm, Thuế VAT & Nhật Ký Sửa',
    highlight: 'Minh bạch 100% thao tác',
    desc: 'Thống kê ngân sách 12 tháng, thuế VAT và ghi vết ai vừa chỉnh sửa chiến dịch.',
    src: '/imgs/meta-screens/meta-ad-account-logs.webp',
  },
  {
    id: 'fusion-campaign-crm-leads',
    category: 'creative',
    tag: 'Hợp Nhất CRM',
    title: 'Đối Soát Lead CRM, CPQL Thực & Sale Phụ Trách',
    highlight: 'Lead thật • Doanh thu • Sale',
    desc: 'Xem trực tiếp số khách chất lượng, doanh thu chốt và Sale đang chăm trên từng bài chạy.',
    src: '/imgs/meta-screens/fusion-campaign-crm-leads.webp',
  },
  {
    id: 'meta-google-ads-guide-modal',
    category: 'creative',
    tag: 'Mở Rộng Google Ads',
    title: 'Bật Thêm Báo Cáo Google Ads Theo 5 Bước Gọn Lẹ',
    highlight: 'Theo dõi đa kênh khi cần',
    desc: 'Giữ giao diện gọn cho Meta Ads; bật thêm Google Ads bất cứ lúc nào chạy đa kênh.',
    src: '/imgs/meta-screens/meta-google-ads-guide-modal.webp',
  },
];

interface PartnerBrandItem {
  name: string;
  sector: string;
  logo: string;
}

const PARTNER_BRANDS: PartnerBrandItem[] = [
  {
    name: 'Capital House',
    sector: 'Chủ đầu tư Bất động sản Xanh',
    logo: '/assets/partners/logo_capital_house.webp',
  },
  {
    name: 'EcoLife Signature',
    sector: 'Dự án Bất động sản Cao cấp',
    logo: '/assets/partners/logo_ecolife_ngang.webp',
  },
  {
    name: 'IDEAS Business',
    sector: 'Giáo dục Sau đại học & MBA',
    logo: '/assets/partners/logo_ideas.webp',
  },
  {
    name: 'Phúc Lộc Thọ',
    sector: 'Chuỗi F&B 30+ Cửa hàng',
    logo: '/assets/partners/partner_phucloctho.webp',
  },
  {
    name: 'Hệ Thống Nha Khoa Flora',
    sector: 'Y tế & Nha khoa Thẩm mỹ',
    logo: '/assets/partners/partner_flora.webp',
  },
  {
    name: 'Rich Land',
    sector: 'Phát triển & Phân phối BĐS',
    logo: '/assets/partners/partner_richland.webp',
  },
  {
    name: 'INKICA Studio',
    sector: 'Công nghệ AI & 3D Studio',
    logo: '/assets/partners/logo_inkica_icon.svg',
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
    name: 'En Group',
    sector: 'Tập đoàn Ẩm thực & Nhà hàng',
    logo: '/assets/partners/partner_engroup.webp',
  },
  {
    name: 'Haagen Dazs',
    sector: 'Thương hiệu Kem Cao cấp',
    logo: '/assets/partners/partner_haagendazs.webp',
  },
  {
    name: 'The Running Bean',
    sector: 'Chuỗi Cafe & Brunch',
    logo: '/assets/partners/partner_therunningbean.webp',
  },
  {
    name: 'BEAN',
    sector: 'Chuỗi Cafe Hiện đại',
    logo: '/assets/partners/partner_bean.webp',
  },
  {
    name: 'Esta Saigon',
    sector: 'Nhà hàng Fine Dining',
    logo: '/assets/partners/partner_estasaigon.webp',
  },
  {
    name: 'Cowboy Steak',
    sector: 'Hệ thống Nhà hàng Âu',
    logo: '/assets/partners/partner_cowboysteak.webp',
  },
  {
    name: 'Abiru-EN',
    sector: 'Ẩm thực Nhật Bản',
    logo: '/assets/partners/partner_abiruen.webp',
  },
  {
    name: 'KA-EN',
    sector: 'Nhà hàng Nhật Bản',
    logo: '/assets/partners/partner_kaen.webp',
  },
  {
    name: 'Kiwami Ramen',
    sector: 'Chuỗi Mì Ramen Nhật',
    logo: '/assets/partners/logo_kiwami.webp',
  },
  {
    name: 'Le Petit',
    sector: 'Nhà hàng Bistro Pháp',
    logo: '/assets/partners/partner_lepetit.webp',
  },
  {
    name: 'Snowee',
    sector: 'Chuỗi Kem Gelato Ý',
    logo: '/assets/partners/partner_snowee.webp',
  },
  {
    name: 'Cơm Gà Đệ Nhất',
    sector: 'Chuỗi Nhà hàng Ẩm thực',
    logo: '/assets/partners/logo_plt_partner.webp',
  },
  {
    name: 'Bếp Nhà SON',
    sector: 'Nhà hàng Ẩm thực Việt',
    logo: '/assets/partners/logo_son_fnb.webp',
  },
  {
    name: 'Ampersand',
    sector: 'Quản trị Vận hành F&B',
    logo: '/assets/partners/partner_ampersand.jpg',
  },
  {
    name: 'The Crumb Club',
    sector: 'Coffee & Bakes',
    logo: '/assets/partners/partner_the_crumb_club.jpg',
  },
  {
    name: 'Brandson',
    sector: 'Học viện Đào tạo Nha khoa',
    logo: '/assets/partners/partner_brandson.webp',
  },
  {
    name: 'Implantswiss',
    sector: 'Giải pháp Implant Thụy Sĩ',
    logo: '/assets/partners/partner_implantswiss.png',
  },
  {
    name: 'College de Paris',
    sector: 'Đại học Quốc tế Pháp',
    logo: '/assets/partners/partner_collegedeparis.webp',
  },
  {
    name: 'Ascencia',
    sector: 'Trường Kinh doanh Quốc tế',
    logo: '/assets/partners/partner_ascencia.webp',
  },
  {
    name: 'ESTIAM Paris',
    sector: 'Học viện Công nghệ Pháp',
    logo: '/assets/partners/logo_estiam.webp',
  },
  {
    name: 'ISTEC Paris',
    sector: 'Trường Thương mại Paris',
    logo: '/assets/partners/logo_istec.webp',
  },
  {
    name: 'Swiss UMEF',
    sector: 'Đại học Quản trị Thụy Sĩ',
    logo: '/assets/partners/partner_swissumef.webp',
  },
  {
    name: 'VTCI Edu',
    sector: 'Đào tạo & Chuyển giao Quốc tế',
    logo: '/assets/partners/partner_vtciedu.webp',
  },
  {
    name: 'Duyên Mai',
    sector: 'Thời trang & Bán lẻ',
    logo: '/assets/partners/partner_duyenmai.webp',
  },
  {
    name: 'Navastore',
    sector: 'Thương mại Điện tử',
    logo: '/assets/partners/partner_navastore.webp',
  },
  {
    name: 'Navatek',
    sector: 'Thiết bị Công nghệ & Bán lẻ',
    logo: '/assets/partners/logo_navatek.webp',
  },
  {
    name: 'MINTH Store',
    sector: 'Mỹ phẩm & Nước hoa',
    logo: '/assets/partners/logo_minth.webp',
  },
  {
    name: 'An Ninh Tiên Hoàng',
    sector: 'Dịch vụ An ninh Chuyên nghiệp',
    logo: '/assets/partners/partner_anninhtienhoang.webp',
  },
  {
    name: 'Mystery Tarot',
    sector: 'Ứng dụng Giải trí & AI',
    logo: '/assets/partners/logo_mystery_tarot.webp',
  },
];

const META_RESERVED_PATHS = new Set([
  'meta-report',
  'privacy',
  'terms',
  'workspaces',
  'register',
  'login',
  '404',
  '404.html',
  'index.html',
  'favicon.ico',
]);

function detectMetaActionPath(): 'workspaces' | 'login' | 'register' | null {
  if (typeof window === 'undefined') return null;
  if (!/^meta\./i.test(window.location.hostname)) return null;
  const clean = window.location.pathname.replace(/\/+$/, '').toLowerCase();
  if (clean === '/workspaces') return 'workspaces';
  if (clean === '/login') return 'login';
  if (clean === '/register') return 'register';
  return null;
}

function toPublicViewerSession(payload: DomMetaPublicAccessPayload): TenantSessionV2 {
  return {
    access_token: payload.access_token,
    tenant_slug: payload.tenant.slug,
    company_name: payload.tenant.name,
    industry: 'general',
    admin_email: payload.user.email || 'public-viewer@domation.net',
    user_id: payload.user.id,
    user_name: payload.user.full_name || `${payload.tenant.name} (Viewer)`,
    role: 'viewer',
  };
}

function detectMetaPathSlug(): string | null {
  if (typeof window === 'undefined') return null;
  const clean = window.location.pathname.replace(/\/+$/, '');
  const m = clean.match(/^\/meta-report\/([^/]+)$/i);
  if (m && m[1]) {
    const s = decodeURIComponent(m[1]).toLowerCase();
    if (!META_RESERVED_PATHS.has(s)) return s;
  }
  if (/^meta\./i.test(window.location.hostname)) {
    const sub = clean.match(/^\/([^/]+)$/);
    if (sub && sub[1]) {
      const s = decodeURIComponent(sub[1]).toLowerCase();
      if (!META_RESERVED_PATHS.has(s)) return s;
    }
  }
  return null;
}

function syncMetaUrlSlug(slug: string | null, preserveSearch = false): void {
  if (typeof window === 'undefined') return;
  try {
    const isSub = /^meta\./i.test(window.location.hostname);
    const basePath = slug
      ? isSub
        ? `/${slug}`
        : `/meta-report/${slug}`
      : isSub
        ? '/'
        : '/meta-report';
    const searchSuffix = slug && preserveSearch ? window.location.search : '';
    const target = `${basePath}${searchSuffix}`;
    if (window.location.pathname !== basePath) {
      window.history.replaceState(null, '', target);
    } else if (!slug && window.location.search) {
      window.history.replaceState(null, '', basePath);
    }
  } catch {
    // ignore history errors
  }
}

interface SwitchWorkspaceResponse {
  access_token?: string;
  refresh_token?: string;
  account_token?: string;
  tenant?: { id?: string; slug?: string; name?: string; industry?: string };
  workspace?: { id?: string; slug?: string; company_name?: string; industry?: string };
  user?: { id?: string; email?: string; full_name?: string; role?: string };
  subscription?: ClientSubscriptionSnapshot;
  workspaces?: WorkspaceSummaryItem[];
}

export const MetaAdReport: React.FC = () => {
  usePageSeo(getMetaReportSeoConfig());

  const initialPreview = typeof window !== 'undefined' ? window.__DOM_META_PREVIEW__ || null : null;
  const initialSlug = detectMetaPathSlug();
  const initialActionPath = detectMetaActionPath();

  // Eagerly preload workspace bundle in parallel with auth/public-access resolution when visiting /<slug>
  useEffect(() => {
    if (initialSlug || initialPreview || loadAutodataSessionV2()) {
      void loadDomMetaWorkspaceChunk();
    }
  }, [initialSlug, initialPreview]);

  const [googleClientId, setGoogleClientId] = useState<string | null>(() => {
    const viteClientId = (import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined)?.trim();
    return viteClientId || '641158233158-nsg8a8tdsj3fdgb34dc9tugm8god7tho.apps.googleusercontent.com';
  });
  const [session, setSession] = useState<TenantSessionV2 | null>(() => loadAutodataSessionV2());
  const sessionRef = useRef<TenantSessionV2 | null>(session);

  useEffect(() => {
    sessionRef.current = session;
  }, [session]);

  const [requestedSlug, setRequestedSlug] = useState<string | null>(initialSlug);
  const [publicViewerSession, setPublicViewerSession] = useState<TenantSessionV2 | null>(() => {
    if (initialPreview || !initialSlug) return null;
    if (loadAutodataSessionV2()) return null;
    const cachedPub = getCachedPublicDomMetaAccess(initialSlug);
    return cachedPub ? toPublicViewerSession(cachedPub) : null;
  });
  const [resolvedPublicSlug, setResolvedPublicSlug] = useState<string | null>(() => {
    if (initialPreview || !initialSlug) return null;
    if (loadAutodataSessionV2()) return null;
    return getCachedPublicDomMetaAccess(initialSlug) ? initialSlug : null;
  });
  const [workspaceOpen, setWorkspaceOpen] = useState<boolean>(() =>
    Boolean(
      initialPreview ||
        (initialSlug && loadAutodataSessionV2()?.tenant_slug.toLowerCase() === initialSlug) ||
        (initialSlug && !loadAutodataSessionV2() && getCachedPublicDomMetaAccess(initialSlug))
    )
  );
  const [authModalOpen, setAuthModalOpen] = useState<boolean>(() =>
    Boolean(!initialPreview && !initialSlug && initialActionPath)
  );

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const onRefreshed = (ev: Event) => {
      const detail = (ev as CustomEvent<TenantSessionV2 | undefined>).detail;
      if (detail?.access_token) {
        setPublicViewerSession(null);
        setSession(detail);
      }
    };
    const onPublicFallback = (ev: Event) => {
      const detail = (ev as CustomEvent<DomMetaPublicAccessPayload | undefined>).detail;
      if (detail?.public_view && detail.access_token) {
        clearAutodataSessionV2();
        setSession(null);
        setPublicViewerSession(toPublicViewerSession(detail));
        setResolvedPublicSlug(detail.tenant.slug.toLowerCase());
        setAuthModalOpen(false);
        setWorkspaceOpen(true);
      }
    };
    const onExpired = () => {
      clearAutodataSessionV2();
      setSession(null);
    };
    window.addEventListener('autodata-session-refreshed', onRefreshed);
    window.addEventListener('dom-meta-public-fallback', onPublicFallback);
    window.addEventListener('autodata-session-expired', onExpired);
    return () => {
      window.removeEventListener('autodata-session-refreshed', onRefreshed);
      window.removeEventListener('dom-meta-public-fallback', onPublicFallback);
      window.removeEventListener('autodata-session-expired', onExpired);
    };
  }, []);
  const [authMode, setAuthMode] = useState<DomMetaAuthMode>(() => {
    if (initialActionPath === 'register') return 'register';
    if (initialActionPath === 'workspaces') {
      return loadAutodataSessionV2() ? 'select_workspace' : 'login';
    }
    return initialSlug ? 'login' : 'register';
  });
  const [authModalKey, setAuthModalKey] = useState(0);
  const [switchingSlug, setSwitchingSlug] = useState<string | null>(null);

  // Landing interactive states
  const [shotCat, setShotCat] = useState<MetaShotCat>('all');
  const [zoomShot, setZoomShot] = useState<MetaLiveShot | null>(null);
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [pricingCycle, setPricingCycle] = useState<'annual' | 'monthly'>('annual');
  const [demoGAdsConfig, setDemoGAdsConfig] = useState<DomMetaGoogleAdsConfig>({
    enabled: false,
    customer_id: '',
    apps_script_url: '',
    developer_token: '',
  });

  // Legal & Cookie Consent
  const [legalOpen, setLegalOpen] = useState(false);
  const [legalTab, setLegalTab] = useState<LegalDocTab>('terms');
  const [cookieForceCounter, setCookieForceCounter] = useState(0);
  const [showBackTop, setShowBackTop] = useState(false);

  useEffect(() => {
    const onScroll = () => setShowBackTop(window.scrollY > 560);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Close video or screenshot modal on Escape
  useEffect(() => {
    if (!showVideoModal && !zoomShot) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowVideoModal(false);
        setZoomShot(null);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [showVideoModal, zoomShot]);

  // Bootstrap Google OAuth client ID from backend
  useEffect(() => {
    let mounted = true;
    const bootstrapFromApi = async () => {
      try {
        const res = await fetch('/api/autodata?action=bootstrap');
        const json = (await res.json()) as {
          success?: boolean;
          data?: {
            google_oauth?: { enabled?: boolean; client_id?: string | null };
          };
        };
        if (!mounted || !json.success || !json.data) return;
        if (json.data.google_oauth?.client_id) {
          setGoogleClientId(json.data.google_oauth.client_id);
        }
      } catch {
        // Keep fallback client ID
      }
    };
    void bootstrapFromApi();
    return () => {
      mounted = false;
    };
  }, []);

  // Track browser back/forward & SPA navigation to workspace slug or auth paths
  useEffect(() => {
    const syncFromUrl = () => {
      const slug = detectMetaPathSlug();
      const actionPath = detectMetaActionPath();
      setRequestedSlug(slug);
      if (!slug && !initialPreview) {
        setPublicViewerSession(null);
        setResolvedPublicSlug(null);
        setWorkspaceOpen(false);
        if (actionPath) {
          setAuthMode(
            actionPath === 'register'
              ? 'register'
              : sessionRef.current
                ? 'select_workspace'
                : 'login'
          );
          setAuthModalKey((k) => k + 1);
          setAuthModalOpen(true);
        }
        return;
      }
      if (slug && !initialPreview) {
        const current = sessionRef.current;
        if (current && current.tenant_slug.toLowerCase() === slug) {
          setPublicViewerSession(null);
          setAuthModalOpen(false);
          setWorkspaceOpen(true);
        }
      }
    };
    window.addEventListener('popstate', syncFromUrl);
    window.addEventListener(DOMATION_NAV_EVENT, syncFromUrl);
    return () => {
      window.removeEventListener('popstate', syncFromUrl);
      window.removeEventListener(DOMATION_NAV_EVENT, syncFromUrl);
    };
  }, [initialPreview]);

  // Public share resolver when visiting `/<slug>` without a session
  useEffect(() => {
    if (initialPreview || !requestedSlug || session) {
      return;
    }
    const cachedPub = getCachedPublicDomMetaAccess(requestedSlug);
    if (cachedPub && resolvedPublicSlug === requestedSlug) {
      return;
    }

    let cancelled = false;
    const targetSlug = requestedSlug;
    void (async () => {
      try {
        const pub = await resolvePublicDomMetaAccess(targetSlug);
        if (cancelled) return;
        if (pub && pub.public_view && pub.access_token) {
          setPublicViewerSession(toPublicViewerSession(pub));
          setAuthModalOpen(false);
          setWorkspaceOpen(true);
          return;
        }
      } catch {
        // Fallback to login prompt when not public
      } finally {
        if (!cancelled) {
          setResolvedPublicSlug(targetSlug);
        }
      }
      if (!cancelled) {
        setPublicViewerSession(null);
        setWorkspaceOpen(false);
        setAuthMode('login');
        setAuthModalKey((k) => k + 1);
        setAuthModalOpen(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [initialPreview, requestedSlug, resolvedPublicSlug, session]);

  // Auto-switch workspace when URL targets another tenant slug
  useEffect(() => {
    if (initialPreview || !requestedSlug || !session) return;
    if (session.tenant_slug.toLowerCase() === requestedSlug) {
      return;
    }

    let cancelled = false;
    const targetSlug = requestedSlug;
    const token = session.account_token || session.access_token;
    void (async () => {
      await Promise.resolve();
      if (cancelled) return;
      setSwitchingSlug(targetSlug);
      try {
        const d = await apiRequest<SwitchWorkspaceResponse>(
          '/api/autodata?action=switch-workspace',
          {
            method: 'POST',
            token,
            body: { tenant_slug: targetSlug },
          }
        );
        if (cancelled) return;
        const resolvedSlug = d.workspace?.slug || d.tenant?.slug || targetSlug;
        if (d.access_token) {
          const nextSession: TenantSessionV2 = {
            ...session,
            tenant_slug: resolvedSlug,
            company_name: d.workspace?.company_name || d.tenant?.name || resolvedSlug,
            industry: d.workspace?.industry || d.tenant?.industry || session.industry,
            admin_email: d.user?.email || session.admin_email,
            user_id: d.user?.id || session.user_id,
            user_name: d.user?.full_name || session.user_name,
            role: d.user?.role || session.role,
            access_token: d.access_token,
            refresh_token: d.refresh_token || session.refresh_token,
            account_token: d.account_token || session.account_token,
            workspaces: d.workspaces || session.workspaces,
            subscription: d.subscription || session.subscription,
          };
          saveAutodataSessionV2(nextSession);
          setPublicViewerSession(null);
          setSession(nextSession);
          setAuthModalOpen(false);
          setWorkspaceOpen(true);
          syncMetaUrlSlug(resolvedSlug, true);
          return;
        }
      } catch {
        // User is not a member of targetSlug -> check if targetSlug allows public viewer read-only access
      } finally {
        setSwitchingSlug((curr) => (curr === targetSlug ? null : curr));
      }

      if (!cancelled) {
        try {
          const pub = await resolvePublicDomMetaAccess(targetSlug);
          if (!cancelled && pub && pub.public_view && pub.access_token) {
            setPublicViewerSession(toPublicViewerSession(pub));
            setResolvedPublicSlug(targetSlug);
            setAuthModalOpen(false);
            setWorkspaceOpen(true);
            return;
          }
        } catch {
          // ignore
        } finally {
          if (!cancelled) setResolvedPublicSlug(targetSlug);
        }
      }

      if (!cancelled) {
        setPublicViewerSession(null);
        setWorkspaceOpen(false);
        setAuthMode('login');
        setAuthModalKey((k) => k + 1);
        setAuthModalOpen(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [initialPreview, requestedSlug, session]);

  const effectiveSession = useMemo(() => {
    if (session && (!requestedSlug || session.tenant_slug.toLowerCase() === requestedSlug)) {
      return session;
    }
    if (
      publicViewerSession &&
      requestedSlug &&
      publicViewerSession.tenant_slug.toLowerCase() === requestedSlug
    ) {
      return publicViewerSession;
    }
    return null;
  }, [session, publicViewerSession, requestedSlug]);

  const workspaceAuthCtx = useMemo<DomMetaAuthContext | null>(() => {
    if (initialPreview) return initialPreview.authContext;
    if (!effectiveSession) return null;
    return {
      accessToken: effectiveSession.access_token,
      tenantSlug: effectiveSession.tenant_slug,
      standaloneSessionRecovery: true,
    };
  }, [initialPreview, effectiveSession]);

  const isPublicViewerMode = Boolean(
    !initialPreview && effectiveSession && publicViewerSession && effectiveSession === publicViewerSession
  );

  const isCheckingPublic = Boolean(
    !initialPreview &&
      requestedSlug &&
      !effectiveSession &&
      !authModalOpen &&
      resolvedPublicSlug !== requestedSlug
  );

  const isSwitchingWorkspace = Boolean(
    (switchingSlug &&
      requestedSlug &&
      switchingSlug === requestedSlug &&
      !isPublicViewerMode &&
      (!session || session.tenant_slug.toLowerCase() !== requestedSlug)) ||
      isCheckingPublic
  );

  const isSlugMatched =
    Boolean(initialPreview) ||
    !requestedSlug ||
    Boolean(effectiveSession);

  // Hide floating AI chatbot while full-screen workspace is open
  useEffect(() => {
    if (typeof document === 'undefined') return;
    if (workspaceOpen && isSlugMatched) {
      document.documentElement.setAttribute('data-autodata-workspace', 'active');
    } else {
      document.documentElement.removeAttribute('data-autodata-workspace');
    }
    return () => {
      document.documentElement.removeAttribute('data-autodata-workspace');
    };
  }, [workspaceOpen, isSlugMatched]);

  const filteredShots = useMemo(
    () =>
      shotCat === 'all'
        ? META_LIVE_SHOTS
        : META_LIVE_SHOTS.filter((s) => s.category === shotCat),
    [shotCat]
  );

  const openAuthModalWithMode = (nextMode: DomMetaAuthMode) => {
    setAuthMode(nextMode);
    setAuthModalKey((k) => k + 1);
    setAuthModalOpen(true);
  };

  const openStartFlow = (targetMode: 'login' | 'register') => {
    if (session) {
      if (targetMode === 'login') {
        openAuthModalWithMode('select_workspace');
        return;
      }
      setRequestedSlug(session.tenant_slug);
      syncMetaUrlSlug(session.tenant_slug);
      setWorkspaceOpen(true);
      return;
    }
    openAuthModalWithMode(targetMode);
  };

  const resolvedExistingWorkspaces: WorkspaceSummaryItem[] = useMemo(() => {
    if (!session) return [];
    if (session.workspaces && session.workspaces.length > 0) {
      return session.workspaces;
    }
    return [
      {
        slug: session.tenant_slug,
        company_name: session.company_name,
        industry: session.industry || 'general',
        plan_tier: session.subscription?.plan_tier || 'starter',
        plan_name: session.subscription?.plan_name || 'Dùng thử 30 ngày',
        role: session.role || 'tenant_admin',
        days_remaining: session.subscription?.days_remaining ?? 30,
        is_in_trial: session.subscription?.is_in_trial ?? true,
        is_expired: session.subscription?.is_expired ?? false,
      },
    ];
  }, [session]);

  const renderAuthModal = () => (
    <DomMetaAuthModal
      key={authModalKey}
      isOpen={authModalOpen}
      initialMode={authMode}
      googleClientId={googleClientId}
      existingAccountToken={session ? session.account_token || session.access_token : null}
      existingWorkspaces={resolvedExistingWorkspaces}
      existingUserEmail={session?.admin_email || ''}
      existingUserName={session?.user_name || ''}
      requestedSlug={
        requestedSlug && (!session || session.tenant_slug.toLowerCase() !== requestedSlug)
          ? requestedSlug
          : null
      }
      onClose={() => {
        setAuthModalOpen(false);
        if (!session) {
          setRequestedSlug(null);
          syncMetaUrlSlug(null);
        } else if (requestedSlug && session.tenant_slug.toLowerCase() !== requestedSlug) {
          setRequestedSlug(workspaceOpen ? session.tenant_slug : null);
          syncMetaUrlSlug(workspaceOpen ? session.tenant_slug : null);
        }
      }}
      onAuthenticated={(nextSession) => {
        saveAutodataSessionV2(nextSession);
        setPublicViewerSession(null);
        setResolvedPublicSlug(nextSession.tenant_slug);
        setSession(nextSession);
        setRequestedSlug(nextSession.tenant_slug);
        setAuthModalOpen(false);
        syncMetaUrlSlug(nextSession.tenant_slug);
        setWorkspaceOpen(true);
      }}
    />
  );

  const analyticsPillars = [
    {
      icon: Activity,
      title: '1. Tự Động Đồng Bộ Số Liệu',
      desc: 'Đổ dữ liệu từ Meta Ads qua Google Sheets lên Dashboard theo thời gian thực.',
    },
    {
      icon: Eye,
      title: '2. Đo Giữ Chân Video 3 Giây',
      desc: 'Biết ngay video nào giữ chân người xem tốt và bài nào lặp gây bão hòa.',
    },
    {
      icon: Clock,
      title: '3. Tìm Khung Giờ Ra Khách Rẻ',
      desc: 'Bản đồ 7 ngày × 24 giờ chỉ rõ giờ vàng tập trung ngân sách hiệu quả.',
    },
    {
      icon: Layers,
      title: '4. Tự Tạo Cột Chỉ Số Riêng',
      desc: 'Thiết lập công thức tính theo ngành và lưu mẫu xem nhanh 1 chạm.',
    },
    {
      icon: ShieldCheck,
      title: '5. Minh Bạch Lịch Sử Sửa Ads',
      desc: 'Xem ai vừa tăng giảm ngân sách hay bật tắt bài mà không cần vào BM.',
    },
    {
      icon: Sliders,
      title: '6. Mở Rộng Google Ads Khi Cần',
      desc: 'Giữ gọn cho Meta Ads từ đầu; bật thêm Google Ads ngay khi chạy đa kênh.',
    },
  ];

  // Switching workspace state
  if (isSwitchingWorkspace) {
    return (
      <DomationProgressLoader
        title="DOM Meta Report"
        subtitle="Đang chuyển sang không gian báo cáo của doanh nghiệp..."
      />
    );
  }

  // Full-screen Standalone Workspace
  if (workspaceOpen && isSlugMatched && workspaceAuthCtx) {
    const authCtx = workspaceAuthCtx;

    const workspaceNode = (
      <DomMetaReportWorkspace
        key={`${authCtx.tenantSlug || 'preview'}:${isPublicViewerMode ? 'public' : 'auth'}`}
        mode={initialPreview?.mode || 'standalone'}
        authContext={authCtx}
        workspaceName={
          initialPreview?.workspaceName || effectiveSession?.company_name || 'DOM Workspace'
        }
        userDisplayName={
          initialPreview?.userDisplayName || effectiveSession?.user_name || 'Signature'
        }
        userRoleLabel={initialPreview?.userRoleLabel || effectiveSession?.role || 'admin'}
        canManageConfig={Boolean(
          initialPreview ||
            (!isPublicViewerMode &&
              (!effectiveSession?.role ||
                ['tenant_admin', 'admin', 'superadmin', 'owner'].includes(effectiveSession.role)))
        )}
        daysRemaining={effectiveSession?.subscription?.days_remaining ?? 30}
        enableCrmAttribution={initialPreview?.enableCrmAttribution}
        erpMode={initialPreview?.erpMode}
        initialEntityModalTab={initialPreview?.initialEntityModalTab}
        defaultQuickConnectOpen={initialPreview?.defaultQuickConnectOpen}
        capiPanel={
          initialPreview?.showCapiTab ? (
            <div className="space-y-4">
              <div className="rounded-2xl bg-white border border-slate-200 p-5 text-xs text-slate-600">
                Đồng bộ tự động tín hiệu khách hàng chất lượng từ CRM về Meta CAPI để tối ưu phân phối quảng cáo.
              </div>
              <ClosedLoopFlywheelCockpit compact />
            </div>
          ) : undefined
        }
        onOpenLead={initialPreview?.enableCrmAttribution ? () => {} : undefined}
        initialView={initialPreview?.initialView || 'dashboard'}
        initialCustomRange={initialPreview?.initialCustomRange}
        workspacesCount={resolvedExistingWorkspaces.length}
        onRequestSwitchWorkspace={
          initialPreview
            ? undefined
            : () => openAuthModalWithMode(session ? 'select_workspace' : 'login')
        }
        onRequestCreateWorkspace={
          initialPreview ? undefined : () => openAuthModalWithMode('create_workspace')
        }
        onExitStandalone={() => {
          setPublicViewerSession(null);
          setWorkspaceOpen(false);
          setRequestedSlug(null);
          syncMetaUrlSlug(null);
        }}
        onLogout={() => {
          if (isPublicViewerMode) {
            setPublicViewerSession(null);
            setWorkspaceOpen(false);
            openAuthModalWithMode('login');
            return;
          }
          clearAutodataSessionV2();
          setPublicViewerSession(null);
          setSession(null);
          setRequestedSlug(null);
          setWorkspaceOpen(false);
          syncMetaUrlSlug(null);
        }}
      />
    );

    return (
      <div className="min-h-screen bg-[#F4F6FA]">
        <ErrorBoundary resetKey={`${authCtx.tenantSlug || 'preview'}:${isPublicViewerMode ? 'public' : 'auth'}`}>
          <Suspense
            fallback={
              <DomationProgressLoader
                title="DOM Meta Report"
                subtitle="Đang khởi tạo không gian báo cáo DOM Meta Report..."
              />
            }
          >
            {initialPreview?.crmShellPreview ? (
              <div className="min-h-screen flex bg-[#F4F6FA]">
                <aside className="hidden lg:flex w-[238px] shrink-0 bg-white border-r border-slate-200/90 flex-col justify-between p-4 select-none">
                <div className="space-y-5">
                  <div className="flex items-center gap-2.5 px-1">
                    <DomationLogoMark size={32} />
                    <div>
                      <div className="text-sm font-black text-slate-900 leading-none">DOMATION</div>
                      <div className="text-[10px] font-bold tracking-wider uppercase text-[#1E40FF] mt-1">
                        AUTO CHIA DATA CRM
                      </div>
                    </div>
                  </div>

                  <div className="rounded-xl bg-slate-50 border border-slate-200/80 px-3 py-2">
                    <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                      Không gian doanh nghiệp
                    </div>
                    <div className="text-xs font-bold text-slate-800 truncate mt-0.5">
                      {initialPreview.workspaceName || 'EcoLife Signature'}
                    </div>
                  </div>

                  <nav className="space-y-1 text-xs">
                    {[
                      { label: 'Tổng quan chia số', active: false },
                      { label: 'Danh sách Khách hàng', active: false },
                      { label: 'Cổng Sale cá nhân', active: false },
                      { label: 'Báo cáo Quảng cáo', active: true, badge: 'Hợp nhất' },
                      { label: 'Vòng chia tự động', active: false },
                      { label: 'Nhân sự & Đại lý', active: false },
                      { label: 'Đối soát công bằng', active: false },
                      { label: 'Kết nối Zalo & Sheets', active: false },
                    ].map((nav) => (
                      <div
                        key={nav.label}
                        className={`px-3 py-2.5 rounded-xl flex items-center justify-between gap-2 ${
                          nav.active
                            ? 'bg-gradient-to-r from-[#1E40FF] to-[#2563EB] text-white font-semibold shadow-sm'
                            : 'text-slate-600 font-medium'
                        }`}
                      >
                        <span className="truncate">{nav.label}</span>
                        {nav.badge && (
                          <span className="px-2 py-0.5 rounded-full bg-white/20 text-white text-[9.5px] font-semibold">
                            {nav.badge}
                          </span>
                        )}
                      </div>
                    ))}
                  </nav>
                </div>

                <div className="rounded-xl bg-[#F4F8FF] border border-blue-100 p-3 space-y-1">
                  <div className="text-[10.5px] font-semibold text-[#1E40FF]">
                    Liên thông 2 chiều tự động
                  </div>
                  <div className="text-[11px] text-slate-600 leading-snug">
                    Dùng chung kết nối Meta của CRM, không cần nhập lại mã.
                  </div>
                </div>
              </aside>
              <div className="flex-1 min-w-0">{workspaceNode}</div>
            </div>
          ) : (
            workspaceNode
          )}
          </Suspense>
        </ErrorBoundary>
        {renderAuthModal()}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-slate-900 font-sans relative overflow-x-clip selection:bg-[#1E40FF] selection:text-white">
      <LuxuryGoldBackdrop />

      <Navbar
        activePage="meta-report"
        onOpenShowcase={() => {
          document.getElementById('live-screenshots')?.scrollIntoView({ behavior: 'smooth' });
        }}
        onOpenContact={() => openStartFlow(session ? 'register' : 'login')}
        contactLabel={session ? 'Mở Workspace' : 'Đăng nhập'}
        mobileContactLabel={session ? 'Workspace' : 'Đăng nhập'}
      />

      <main className="relative z-10 pt-28 sm:pt-32 md:pt-36">
        {/* ====================================================================
            HERO SECTION — Punchy 2-Line Outcome Hook + Meta -> Sheets -> Dashboard
           ==================================================================== */}
        <section className="pb-10 sm:pb-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center space-y-4 sm:space-y-6">
            <div className="ql-eyebrow mx-auto">
              <Sparkles className="w-3.5 h-3.5 text-[#1E40FF] shrink-0" />
              <span>BÁO CÁO META ADS TỰ ĐỘNG</span>
            </div>

            <h1 className="text-[1.68rem] sm:text-4xl md:text-[2.5rem] lg:text-5xl xl:text-[52px] font-black text-slate-900 leading-[1.22] tracking-[-0.02em]">
              Kiểm soát từng đồng Meta Ads,
              <span className="block text-gradient-inkica mt-1">
                biết rõ nội dung nào ra khách.
              </span>
            </h1>

            <p className="max-w-2xl mx-auto text-sm sm:text-lg text-slate-600 leading-relaxed">
              Chấm dứt cảnh xuất file Excel thủ công để dò từng chiến dịch — tự động đồng bộ chi phí
              qua Google Sheets, chỉ rõ video giữ chân người xem, khung giờ hiệu quả nhất và lịch sử
              chỉnh sửa trên một màn hình trực quan.
            </p>

            {/* Primary CTA Row + Video Guide Trigger */}
            <div className="pt-1 sm:pt-2 flex flex-col sm:flex-row items-center justify-center gap-2.5 sm:gap-3 max-w-md sm:max-w-none mx-auto">
              <div className="grid grid-cols-2 sm:flex sm:flex-row items-center justify-center gap-2 sm:gap-3 w-full sm:w-auto">
                <button
                  type="button"
                  data-testid="hero-start-free-trial"
                  onClick={() => openStartFlow('register')}
                  className="btn-inkica-primary w-full sm:w-auto rounded-full px-3 sm:px-7 py-3 sm:py-3.5 text-xs sm:text-sm cursor-pointer whitespace-nowrap justify-center"
                >
                  <span className="sm:hidden">
                    {session ? 'Mở Báo Cáo' : 'Dùng thử Free'}
                  </span>
                  <span className="hidden sm:inline">
                    {session
                      ? `Mở Báo Cáo: ${session.company_name}`
                      : 'Dùng thử 1 tháng miễn phí'}
                  </span>
                  <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                </button>

                <button
                  type="button"
                  data-testid="hero-watch-video"
                  onClick={() => setShowVideoModal(true)}
                  className="ql-btn-outline w-full sm:w-auto rounded-full px-3 sm:px-6 py-3 sm:py-3.5 text-xs sm:text-sm cursor-pointer whitespace-nowrap justify-center"
                >
                  <Play className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#1E40FF] shrink-0" fill="currentColor" />
                  <span>Video hướng dẫn</span>
                </button>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-x-2.5 gap-y-1 text-[11px] sm:text-xs text-slate-500">
              <span>
                Miễn phí <strong className="text-slate-900">trọn vẹn 1 tháng đầu</strong>
              </span>
              <span>·</span>
              <span>
                Gia hạn từ <strong className="text-slate-900">690.000₫/tháng</strong>
              </span>
              <span className="hidden sm:inline">·</span>
              <span className="hidden sm:inline">
                Gói năm tiết kiệm <strong className="text-emerald-700">29% còn 490.000₫/tháng</strong>
              </span>
            </div>
          </div>

          {/* Automated 3-Step Pipeline Banner: Meta Ads -> Google Sheets -> Dashboard */}
          <div className="max-w-5xl mx-auto mt-8 sm:mt-12 rounded-2xl sm:rounded-[28px] bg-white/90 sm:bg-white/85 sm:backdrop-blur-2xl border border-slate-200/80 shadow-[0_24px_64px_-24px_rgba(15,23,42,0.08)] p-4 sm:p-8 flex flex-col gap-4 sm:gap-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-1 text-left">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-800">
                    LUỒNG ĐỒNG BỘ TỰ ĐỘNG • META ADS → GOOGLE SHEETS → DASHBOARD BÁO CÁO
                  </span>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Số liệu chiến dịch được tự động kéo về, lưu trữ chuẩn hóa trên Google Sheets và lên
                  biểu đồ trực quan tức thì — dùng độc lập hoặc đồng bộ thẳng với hệ sinh thái DOMATION.
                </p>
              </div>
              <button
                type="button"
                onClick={() => openStartFlow('register')}
                className="self-start sm:self-center ql-btn-outline rounded-full px-4 py-2 text-xs cursor-pointer whitespace-nowrap shrink-0"
              >
                <span>Khởi tạo 60 giây</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="pt-4 border-t border-slate-200/75 grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4 relative">
              {[
                {
                  step: 'Bước 01',
                  title: 'Tài khoản Meta Ads',
                  desc: 'Kết nối an toàn nhiều tài khoản doanh nghiệp và cá nhân, tự động lấy chi tiêu, lượt tiếp cận, tin nhắn và video.',
                  renderLogo: () => (
                    <img
                      src="/assets/brands/meta-icon.svg"
                      alt="Meta Ads"
                      className="w-9 h-9 rounded-xl object-contain shrink-0"
                    />
                  ),
                },
                {
                  step: 'Bước 02',
                  title: 'Google Sheets trung tâm',
                  desc: 'Chuẩn hóa và lưu trữ lịch sử dữ liệu sạch sẽ trên trang tính riêng của doanh nghiệp, minh bạch và dễ kiểm chứng.',
                  renderLogo: () => (
                    <img
                      src="/assets/brands/sheets-icon.svg"
                      alt="Google Sheets"
                      className="w-9 h-9 rounded-xl object-contain shrink-0"
                    />
                  ),
                },
                {
                  step: 'Bước 03',
                  title: 'Dashboard trực quan',
                  desc: 'Biểu đồ xu hướng, khung giờ ra khách, thư viện mẫu quảng cáo và đường dẫn chia sẻ báo cáo an toàn.',
                  renderLogo: () => (
                    <div className="w-9 h-9 rounded-xl bg-[#F4F8FF] border border-blue-100 flex items-center justify-center shrink-0">
                      <DomationLogoMark size={22} />
                    </div>
                  ),
                },
              ].map((node, index) => (
                <div
                  key={node.step}
                  className="relative rounded-2xl bg-slate-50/75 hover:bg-white border border-slate-200/80 p-4 flex flex-col gap-2.5 transition-colors text-left"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      {node.renderLogo()}
                      <div className="min-w-0">
                        <div className="text-[10px] font-bold uppercase tracking-wider text-[#1E40FF]">
                          {node.step}
                        </div>
                        <div className="text-sm font-bold text-slate-900 leading-snug">{node.title}</div>
                      </div>
                    </div>
                    {index < 2 && (
                      <span className="hidden lg:inline-flex w-6 h-6 rounded-full bg-white border border-slate-200 text-[#1E40FF] items-center justify-center shrink-0">
                        <ArrowRight className="w-3.5 h-3.5" />
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">{node.desc}</p>
                </div>
              ))}
            </div>

            {/* Brand Sapphire Connect-Link Divider: Bridging Dashboard Step 3 into CRM Auto Closed-Loop Optimization */}
            <div className="relative py-3 flex items-center justify-center">
              <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-px bg-gradient-to-r from-transparent via-blue-200 to-transparent" />
              <div className="relative z-10 inline-flex items-center gap-2 rounded-full border border-blue-200 bg-[#F4F8FF]/95 px-3.5 sm:px-4 py-1.5 shadow-xs">
                <span className="w-6 h-6 rounded-full bg-gradient-to-br from-[#1E40FF] to-[#0284C7] text-white flex items-center justify-center shrink-0 shadow-xs">
                  <Link2 className="w-3.5 h-3.5" />
                </span>
                <span className="text-[10px] sm:text-[11px] font-extrabold uppercase tracking-wider text-[#1E40FF]">
                  Kết Hợp Auto Data CRM • Vòng Tròn Tối Ưu Khép Kín
                </span>
              </div>
            </div>

            <div
              data-testid="meta-crm-closed-loop-bridge"
              className="rounded-2xl bg-gradient-to-br from-[#F4F8FF] via-white to-[#ECFEFF]/75 border border-blue-200/80 p-4 sm:p-5 space-y-4 text-left"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-[#1E40FF]">
                    <RefreshCw className="w-3.5 h-3.5 shrink-0" />
                    <span>Từ Dashboard Bước 03 → Vận Hành CRM &amp; Học Tệp CAPI Tự Động</span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Đừng chỉ xem báo cáo đẹp trên màn hình — kết nối thẳng số liệu Bước 03 với Auto Data CRM để mỗi đồng chi tiêu Ads tự xoay vòng sinh lời ngày càng chuẩn xác:
                  </p>
                </div>
                <button
                  type="button"
                  data-testid="meta-crm-connect-now"
                  onClick={() => navigateTo('/data?setup=quick')}
                  className="self-start sm:self-center inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#1E40FF] to-[#0284C7] hover:brightness-110 text-white px-5 py-2.5 min-h-[44px] text-xs font-bold shadow-[0_6px_18px_rgba(30,64,255,0.28)] transition-all cursor-pointer whitespace-nowrap shrink-0"
                >
                  <Link2 className="w-3.5 h-3.5 shrink-0" />
                  <span>Connect ngay</span>
                  <ArrowRight className="w-3.5 h-3.5 shrink-0" />
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4">
                {[
                  {
                    badge: 'Từ Bước 03 → Chia Sale < 5s',
                    title: 'Chia cho từng Sale tư vấn chăm sóc',
                    desc: 'Lead đổ về từ bài Ads trên Dashboard được lọc trùng 180 ngày và chia vòng công bằng 1:1 tới Zalo/Telegram của từng Sale chỉ trong dưới 5 giây.',
                    renderLogo: () => (
                      <img
                        src="/assets/brands/zalobot-logo.webp"
                        alt="ZaloBot Chia Sale"
                        className="w-9 h-9 rounded-xl object-contain bg-white border border-blue-100 p-1 shrink-0"
                      />
                    ),
                  },
                  {
                    badge: 'Đối soát 2 chiều theo từng Ads',
                    title: 'Báo cáo trạng thái từng Lead trên từng Ads',
                    desc: 'Hiển thị trực tiếp từng Lead thuộc bài quảng cáo nào đang Hẹn gặp, Tiềm năng, Chốt đơn hay Số rác — biết chính xác bài nào ra doanh thu thật.',
                    renderLogo: () => (
                      <div className="w-9 h-9 rounded-xl bg-[#F4F8FF] border border-blue-100 flex items-center justify-center shrink-0">
                        <DomationLogoMark size={22} />
                      </div>
                    ),
                  },
                  {
                    badge: 'Vòng tròn tối ưu thuật toán Meta',
                    title: 'Bắn Meta CAPI học tệp tối ưu',
                    desc: 'Tự động mã hóa SHA-256 và gửi ngược tín hiệu chất lượng (Qualified, Purchase) về Meta CAPI để thuật toán né số ảo, nhân bản đúng tệp khách chốt.',
                    renderLogo: () => (
                      <img
                        src="/assets/brands/meta-icon.svg"
                        alt="Meta CAPI SHA-256"
                        className="w-9 h-9 rounded-xl object-contain bg-white border border-blue-100 p-1 shrink-0"
                      />
                    ),
                  },
                ].map((stage, idx) => (
                  <div
                    key={stage.badge}
                    className="rounded-2xl bg-white/95 hover:bg-white border border-slate-200/85 p-4 flex flex-col gap-2.5 shadow-2xs transition-colors"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        {stage.renderLogo()}
                        <div className="min-w-0">
                          <div className="text-[10px] font-bold uppercase tracking-wider text-[#1E40FF] truncate">
                            {stage.badge}
                          </div>
                          <div className="text-sm font-bold text-slate-900 leading-snug">
                            {stage.title}
                          </div>
                        </div>
                      </div>
                      {idx < 2 && (
                        <span className="hidden lg:inline-flex w-6 h-6 rounded-full bg-slate-50 border border-slate-200 text-[#1E40FF] items-center justify-center shrink-0">
                          <ArrowRight className="w-3.5 h-3.5" />
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">{stage.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ====================================================================
            PARTNERS TRUST STRIP (#partners) — Full 38 DOM Partner Brands
           ==================================================================== */}
        <section
          id="partners"
          className="py-10 sm:py-16 px-4 sm:px-6 lg:px-8 border-y border-slate-200/70 bg-white/65 sm:bg-white/55 sm:backdrop-blur-md"
        >
          <div className="max-w-7xl mx-auto space-y-6 sm:space-y-8">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-3 sm:gap-4 text-center md:text-left">
              <div className="max-w-2xl mx-auto md:mx-0">
                <div className="ql-eyebrow mb-2.5 sm:mb-3 mx-auto md:mx-0">
                  <Award className="w-3.5 h-3.5 text-[#1E40FF] shrink-0" />
                  <span>ĐỒNG HÀNH CÙNG {PARTNER_BRANDS.length}+ THƯƠNG HIỆU</span>
                </div>
                <h2 className="text-xl sm:text-3xl font-bold text-slate-900 leading-[1.25] tracking-tight">
                  Được Tin Dùng Bởi Chủ Đầu Tư, Chuỗi Dịch Vụ &amp;{' '}
                  <span className="text-gradient-inkica">Đội Ngũ Marketing Đa Ngành</span>
                </h2>
              </div>
              <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto md:mx-0 leading-relaxed">
                Triển khai thực tế cho Bất động sản, Chuỗi F&amp;B, Giáo dục Quốc tế, Nha khoa Thẩm mỹ và Bán lẻ.
              </p>
            </div>

            {/* Mobile: Compact 2x3 SlideDeck */}
            <div className="sm:hidden">
              <ResponsiveSlideDeck
                items={PARTNER_BRANDS}
                keyExtractor={(p) => p.name}
                mobilePerPage={6}
                mobileColsClass="grid-cols-2"
                gapClass="gap-2.5"
                ariaLabel="Các thương hiệu đồng hành cùng DOMATION"
                renderItem={(partner) => (
                  <div className="rounded-2xl bg-white border border-slate-200/85 px-3 py-3.5 flex flex-col items-center justify-center text-center gap-2 shadow-sm h-full">
                    <div className="h-9 flex items-center justify-center">
                      <img
                        src={partner.logo}
                        alt={partner.name}
                        loading="lazy"
                        className="max-h-8 max-w-[110px] w-auto object-contain"
                      />
                    </div>
                    <div className="min-w-0 w-full">
                      <div className="text-[11px] font-bold text-slate-800 truncate">
                        {partner.name}
                      </div>
                      <div className="text-[10px] text-slate-500 truncate mt-0.5">
                        {partner.sector}
                      </div>
                    </div>
                  </div>
                )}
              />
            </div>

            {/* Tablet & Desktop: Complete 38-Brand Partner Showcase */}
            <div className="hidden sm:block rounded-[28px] bg-white/85 backdrop-blur-xl border border-slate-200/80 shadow-sm p-5 sm:p-7">
              <div className="flex flex-wrap items-center justify-between gap-2 pb-4 mb-5 border-b border-slate-200/70">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-800">
                  Mạng lưới doanh nghiệp &amp; thương hiệu đã hợp tác triển khai
                </span>
                <span className="text-[11px] font-medium text-slate-500">
                  {PARTNER_BRANDS.length} thương hiệu • Bất động sản · F&amp;B · Giáo dục · Y tế · Bán lẻ
                </span>
              </div>

              <div className="flex flex-wrap justify-center gap-3">
                {PARTNER_BRANDS.map((partner) => (
                  <div
                    key={partner.name}
                    className="w-[calc(33.333333%-8px)] md:w-[calc(25%-9px)] lg:w-[calc(16.666667%-10px)] group rounded-2xl bg-slate-50/75 hover:bg-white border border-slate-200/75 hover:border-blue-200 px-3.5 py-4 flex flex-col items-center justify-center text-center gap-2 transition-all hover:shadow-xs"
                  >
                    <div className="h-10 w-full flex items-center justify-center">
                      <img
                        src={partner.logo}
                        alt={partner.name}
                        loading="lazy"
                        className="max-h-9 max-w-[115px] w-auto object-contain grayscale-[10%] group-hover:grayscale-0 transition-all"
                      />
                    </div>
                    <div className="min-w-0 w-full">
                      <div className="text-[11.5px] font-bold text-slate-800 group-hover:text-[#1E40FF] truncate transition-colors">
                        {partner.name}
                      </div>
                      <div className="text-[10px] text-slate-500 truncate mt-0.5">
                        {partner.sector}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ====================================================================
            VIDEO WALKTHROUGH & DEMO CLIP (#video-demo)
           ==================================================================== */}
        <section
          id="video-demo"
          className="scroll-mt-24 pt-12 sm:pt-20 pb-6 sm:pb-10 px-4 sm:px-6 lg:px-8"
        >
          <div className="max-w-7xl mx-auto">
            <div className="rounded-3xl bg-white/90 backdrop-blur-xl border border-slate-200/85 shadow-[0_20px_56px_-24px_rgba(15,23,42,0.1)] p-5 sm:p-8 lg:p-10 grid grid-cols-1 lg:grid-cols-12 gap-7 lg:gap-10 items-center">
              <div className="lg:col-span-5 space-y-4">
                <div className="ql-eyebrow">
                  <Play className="w-3.5 h-3.5 text-[#1E40FF] shrink-0" fill="currentColor" />
                  <span>VIDEO HƯỚNG DẪN THỰC TẾ</span>
                </div>
                <h2 className="text-xl sm:text-3xl font-bold text-slate-900 leading-[1.25] tracking-tight">
                  Xem Cách Hệ Thống Lên Báo Cáo{' '}
                  <span className="text-gradient-inkica">Chỉ Trong Vài Phút</span>
                </h2>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  Từ bước kết nối tài khoản Meta Ads, đồng bộ qua Google Sheets đến cách đọc hiệu quả
                  từng nội dung video, tìm khung giờ vàng chốt đơn và kiểm tra lịch sử chỉnh sửa ngân sách.
                </p>

                <ul className="space-y-2.5 text-xs sm:text-sm text-slate-700 pt-1">
                  {[
                    'Xem báo cáo rõ ràng mà không cần cấp quyền vào Business Manager gốc',
                    'Biết ngay điểm rơi khách hàng từ lúc thấy quảng cáo đến khi nhắn tin',
                    'Kiểm soát minh bạch ai vừa bật tắt chiến dịch hoặc đổi ngân sách',
                  ].map((point) => (
                    <li key={point} className="flex items-start gap-2.5">
                      <Check className="w-4 h-4 text-[#1E40FF] shrink-0 mt-0.5" />
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>

                <div className="pt-2 flex flex-wrap items-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => setShowVideoModal(true)}
                    className="btn-inkica-primary rounded-full px-5 py-2.5 text-xs font-bold cursor-pointer"
                  >
                    <Play className="w-3.5 h-3.5 shrink-0" fill="currentColor" />
                    <span>Mở rộng Video Hướng Dẫn</span>
                  </button>
                  <a
                    href={META_VIDEO_YOUTUBE_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ql-btn-outline rounded-full px-4 py-2.5 text-xs font-bold"
                  >
                    <span>Xem trên YouTube</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>

              <div className="lg:col-span-7">
                <div className="relative w-full aspect-video rounded-2xl overflow-hidden shadow-[0_20px_50px_-16px_rgba(15,23,42,0.2)] border border-slate-200 bg-slate-950">
                  <iframe
                    width="100%"
                    height="100%"
                    src={`${META_VIDEO_EMBED_URL}?rel=0`}
                    title="Video hướng dẫn hệ thống báo cáo Meta Ads DOMATION"
                    loading="lazy"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                    className="absolute inset-0 w-full h-full border-0"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ====================================================================
            LIVE SCREENSHOTS GALLERY (#live-screenshots)
           ==================================================================== */}
        <section id="live-screenshots" className="scroll-mt-24 py-12 sm:py-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto space-y-6 sm:space-y-8">
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 text-center lg:text-left">
              <div className="max-w-2xl mx-auto lg:mx-0">
                <div className="ql-eyebrow mb-2.5 mx-auto lg:mx-0">
                  <BarChart3 className="w-3.5 h-3.5 text-[#1E40FF] shrink-0" />
                  <span>GIAO DIỆN BÁO CÁO THỰC TẾ</span>
                </div>
                <h2 className="text-xl sm:text-3xl font-bold text-slate-900 leading-[1.25] tracking-tight">
                  Trải Nghiệm Trực Quan Từng Màn Hình{' '}
                  <span className="text-gradient-inkica">Biểu Đồ &amp; Phân Tích Chuyên Sâu</span>
                </h2>
              </div>

              {/* Category Filter Pills */}
              <DomResponsiveSubtabs
                tabs={SHOT_CATEGORIES.map((cat) => ({
                  id: cat.id,
                  label: cat.label,
                }))}
                value={shotCat}
                onChange={(id) => setShotCat(id as MetaShotCat)}
                maxMobile={2}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
              {filteredShots.map((shot) => (
                <div
                  key={shot.id}
                  onClick={() => setZoomShot(shot)}
                  className="group rounded-2xl bg-white/95 border border-slate-200/85 shadow-[0_14px_36px_-22px_rgba(15,23,42,0.14)] hover:border-blue-300 overflow-hidden cursor-zoom-in transition-all flex flex-col"
                >
                  <div className="relative aspect-[16/10] bg-slate-100 overflow-hidden border-b border-slate-100">
                    <img
                      src={shot.src}
                      alt={shot.title}
                      loading="lazy"
                      className="w-full h-full object-cover object-top group-hover:scale-[1.02] transition-transform duration-500"
                    />
                    <div className="absolute top-2.5 left-2.5">
                      <span className="px-2.5 py-0.5 rounded-full bg-white/95 border border-blue-100 text-[#1E40FF] text-[10px] font-bold shadow-xs">
                        {shot.tag}
                      </span>
                    </div>
                    <div className="absolute bottom-2.5 right-2.5 w-7 h-7 rounded-full bg-white/90 backdrop-blur-sm border border-slate-200 flex items-center justify-center text-slate-700 group-hover:text-[#1E40FF] shadow-sm">
                      <Maximize2 className="w-3.5 h-3.5" />
                    </div>
                  </div>
                  <div className="p-4 space-y-1">
                    <h3 className="text-sm font-bold text-slate-900 group-hover:text-[#1E40FF] transition-colors leading-snug">
                      {shot.title}
                    </h3>
                    <p className="text-xs text-slate-600 leading-relaxed">{shot.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ====================================================================
            ANALYTICS MECHANICS (#analytics-engine)
           ==================================================================== */}
        <section
          id="analytics-engine"
          className="scroll-mt-24 py-12 sm:py-20 px-4 sm:px-6 lg:px-8 border-t border-slate-200/70 bg-white/60 sm:bg-white/40 sm:backdrop-blur-sm"
        >
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-3 sm:gap-4 mb-6 sm:mb-10 text-center md:text-left">
              <div className="max-w-2xl mx-auto md:mx-0">
                <div className="ql-eyebrow mb-2.5 mx-auto md:mx-0">
                  <span>GIẢI QUYẾT ĐÚNG NỖI ĐAU CHẠY ADS</span>
                </div>
                <h2 className="text-xl sm:text-3xl font-bold text-slate-900 leading-[1.25] tracking-tight">
                  Loại Bỏ Bẫy Chỉ Số Ảo —{' '}
                  <span className="text-gradient-inkica">Đọc Đúng Hiệu Quả Trong Vài Giây</span>
                </h2>
              </div>
              <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto md:mx-0 leading-relaxed">
                Được thiết kế tinh gọn cho cả Chủ doanh nghiệp cần sự minh bạch lẫn Marketer cần tối ưu ngân sách mỗi ngày.
              </p>
            </div>

            {/* Old vs DOM Meta Comparison */}
            <div className="mb-6 rounded-2xl sm:rounded-[24px] bg-white/95 border border-slate-200/80 shadow-sm grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-200/75 overflow-hidden">
              <div className="p-5 sm:p-6 bg-slate-100/95 space-y-1.5">
                <div className="inline-flex items-center gap-1.5 rounded-full bg-slate-200/85 border border-slate-300 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-600">
                  Cách xem thủ công • Rời rạc &amp; Tốn giờ
                </div>
                <div className="text-sm font-bold text-slate-700">
                  Tải file Excel thủ công, chia sẻ quyền tài khoản rủi ro &amp; mù mờ khung giờ đốt tiền
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Mỗi tuần mất hàng giờ gom số liệu từ nhiều tài khoản quảng cáo, khó biết video nào
                  thực sự giữ chân người xem và không rõ ai vừa tự ý điều chỉnh ngân sách chiến dịch.
                </p>
              </div>
              <div className="p-5 sm:p-6 bg-gradient-to-r from-[#F4F8FF]/90 to-white space-y-1.5">
                <div className="inline-flex items-center gap-1.5 rounded-full bg-[#1E40FF]/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#1E40FF]">
                  DOM Meta Report • Tự động qua Google Sheets
                </div>
                <div className="text-sm font-bold text-slate-900">
                  Đồng bộ Meta Ads → Google Sheets → Dashboard trên một màn hình duy nhất
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Tự động gom nhóm chiến dịch theo thương hiệu, vẽ biểu đồ xu hướng chi tiêu, chỉ rõ
                  khung giờ ra khách tốt nhất và lưu sẵn các mẫu bảng xem nhanh cho từng bộ phận.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 rounded-[28px] bg-white/85 backdrop-blur-xl border border-slate-200/80 shadow-sm divide-y md:divide-y-0 md:divide-x divide-slate-200/75 overflow-hidden">
              {analyticsPillars.map((card, i) => {
                const Icon = card.icon;
                return (
                  <div
                    key={card.title}
                    className={`p-6 sm:p-8 flex flex-col justify-between gap-4 hover:bg-slate-50/60 transition-colors ${
                      i >= 3 ? 'lg:border-t lg:border-slate-200/75' : ''
                    }`}
                  >
                    <div className="space-y-3">
                      <div className="inline-flex items-center gap-2.5">
                        <span className="w-9 h-9 rounded-xl bg-white border border-slate-200/80 text-[#1E40FF] shadow-sm flex items-center justify-center shrink-0">
                          <Icon className="w-4 h-4" />
                        </span>
                        <span className="text-[11px] font-semibold tracking-wider text-slate-400 font-mono">
                          0{i + 1}
                        </span>
                      </div>
                      <h3 className="text-base font-bold text-slate-900 leading-snug">
                        {card.title}
                      </h3>
                      <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                        {card.desc}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ====================================================================
            CLOSED-LOOP FUSION SHOWCASE: CRM AUTO DATA & DOMATION ERP (#crm-erp-fusion)
           ==================================================================== */}
        <section
          id="crm-erp-fusion"
          className="scroll-mt-24 py-12 sm:py-20 px-4 sm:px-6 lg:px-8 border-t border-slate-200/70 bg-white/85"
        >
          <div className="max-w-7xl mx-auto space-y-8 sm:space-y-10">
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 text-center lg:text-left">
              <div className="max-w-3xl mx-auto lg:mx-0 space-y-2.5">
                <div className="ql-eyebrow mx-auto lg:mx-0">
                  <Users className="w-3.5 h-3.5 text-[#1E40FF] shrink-0" />
                  <span>ĐỐI SOÁT KHÉP KÍN TỪ QUẢNG CÁO ĐẾN DOANH THU</span>
                </div>
                <h2 className="text-xl sm:text-3xl font-bold text-slate-900 leading-[1.25] tracking-tight">
                  Biết Rõ Nội Dung Nào Ra Khách —{' '}
                  <span className="text-gradient-inkica">
                    Biết Rõ Khách Nào Từ Nội Dung Nào
                  </span>
                </h2>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  Hợp nhất 2 chiều cùng CRM Auto Data &amp; DOMATION ERP: theo dõi chất lượng gọi và doanh thu từng Sale trên mỗi bài quảng cáo.
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-center lg:justify-end gap-2.5 shrink-0">
                <a
                  href="/data"
                  onClick={(e) => handleSpaLinkClick(e, '/data')}
                  className="btn-inkica-primary rounded-full px-5 py-2.5 text-xs font-bold"
                >
                  <span>Khám phá CRM Auto Data</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </a>
                <a
                  href="/erp"
                  onClick={(e) => handleSpaLinkClick(e, '/erp')}
                  className="ql-btn-outline rounded-full px-5 py-2.5 text-xs font-bold"
                >
                  <span>Khám phá DOMATION ERP</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>

            {/* 3 Core Closed-Loop Value Pillars */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                {
                  badge: 'Minh bạch theo từng bài chạy',
                  title: 'Đo CPQL Thực & Doanh Thu Từng Bài Ads',
                  desc: 'Thấy rõ bài nào ra khách nét, giá thực 1 khách chất lượng và doanh thu chốt đơn.',
                },
                {
                  badge: 'Theo sát đội ngũ Sale',
                  title: 'Xem Khách & Sale Phụ Trách Ngay Trên Bảng',
                  desc: 'Bấm vào số Lead bất kỳ để xem ai đang chăm, thuộc vòng chia nào và kết quả gọi.',
                },
                {
                  badge: 'Kết nối 1 chạm tức thì',
                  title: 'Tự Nhận Kết Nối Có Sẵn Từ CRM / ERP',
                  desc: 'Kích hoạt báo cáo trong 1 chạm mà không cần nhập lại mã kết nối tài khoản.',
                },
              ].map((v) => (
                <div
                  key={v.title}
                  className="rounded-2xl bg-[#F8FAFF] border border-blue-100/90 p-4 sm:p-5 space-y-1.5"
                >
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-white border border-blue-100 px-2.5 py-0.5 text-[10px] font-bold text-[#1E40FF]">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    <span>{v.badge}</span>
                  </span>
                  <h3 className="text-sm font-bold text-slate-900 leading-snug">
                    {v.title}
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed">{v.desc}</p>
                </div>
              ))}
            </div>

            {/* 3 Featured Real Fusion Screenshots in 1 Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
              {[
                {
                  id: 'fusion-shot-campaigns',
                  category: 'creative' as const,
                  tag: 'Bảng Chiến Dịch Hợp Nhất',
                  highlight: 'Lead CRM • CPQL • Doanh thu',
                  title: 'Tỷ Lệ Khách Nét, Doanh Thu & Sale Từng Bài Chạy',
                  desc: 'Phủ thẳng Lead CRM, chi phí khách chất lượng và avatar Sale phụ trách lên bảng chiến dịch.',
                  src: '/imgs/meta-screens/fusion-campaign-crm-leads.webp',
                },
                {
                  id: 'fusion-shot-modal',
                  category: 'creative' as const,
                  tag: 'Phân Bổ Sale Theo Bài',
                  highlight: 'Từng Sale • Kết quả gọi',
                  title: 'Danh Sách Khách & Kết Quả Gọi Từng Nhân Viên',
                  desc: 'Mở bài chạy để xem từng Sale nhận bao nhiêu khách, chốt cọc bao nhiêu và mở hồ sơ ngay.',
                  src: '/imgs/meta-screens/fusion-ad-leads-sale-modal.webp',
                },
                {
                  id: 'fusion-shot-quick-connect',
                  category: 'creative' as const,
                  tag: 'Kết Nối 1 Chạm',
                  highlight: 'Đồng bộ từ CRM',
                  title: 'Bật Báo Cáo Ngay Trong CRM Không Cài Đặt Lại',
                  desc: 'Tự nhận tài khoản Meta sẵn có trong CRM hoặc dán mã kích hoạt đồng bộ cả CAPI.',
                  src: '/imgs/meta-screens/fusion-quick-connect-crm.webp',
                },
              ].map((shot) => (
                <div
                  key={shot.id}
                  onClick={() => setZoomShot(shot)}
                  className="group rounded-2xl bg-white border border-slate-200/90 shadow-[0_14px_36px_-22px_rgba(30,64,255,0.16)] hover:border-[#1E40FF] overflow-hidden cursor-zoom-in transition-all flex flex-col"
                >
                  <div className="relative aspect-[16/10] bg-slate-100 overflow-hidden border-b border-slate-100">
                    <img
                      src={shot.src}
                      alt={shot.title}
                      loading="lazy"
                      className="w-full h-full object-cover object-top group-hover:scale-[1.02] transition-transform duration-500"
                    />
                    <div className="absolute top-2.5 left-2.5">
                      <span className="px-2.5 py-0.5 rounded-full bg-white/95 border border-blue-100 text-[#1E40FF] text-[10px] font-bold shadow-xs">
                        {shot.tag}
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
                    <p className="text-xs text-slate-600 leading-relaxed">{shot.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ====================================================================
            ECOSYSTEM INTEGRATION: STANDALONE OR ERP / AUTO DATA (#ecosystem)
           ==================================================================== */}
        <section
          id="ecosystem"
          className="scroll-mt-24 py-12 sm:py-20 px-4 sm:px-6 lg:px-8 border-t border-slate-200/70 bg-gradient-to-b from-white/75 via-[#F4F8FF]/55 to-white/60"
        >
          <div className="max-w-7xl mx-auto space-y-8">
            <div className="text-center max-w-3xl mx-auto space-y-3">
              <div className="ql-eyebrow mx-auto">
                <Zap className="w-3.5 h-3.5 text-[#1E40FF]" />
                <span>LINH HOẠT SỬ DỤNG ĐỘC LẬP HOẶC ĐỒNG BỘ HỆ SINH THÁI</span>
              </div>
              <h2 className="text-xl sm:text-3xl font-bold text-slate-900 tracking-tight">
                Dùng Độc Lập Miễn Phí 1 Tháng Hoặc{' '}
                <span className="text-gradient-inkica">Mở Ngay Trong ERP &amp; Auto Chia Data</span>
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Khởi tạo không gian báo cáo riêng chỉ trong 3 bước đơn giản; khi doanh nghiệp mở rộng
                sang hệ thống chia Lead hoặc quản trị tổng thể, dữ liệu quảng cáo được liên thông ngay mà không cần cài đặt lại.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
              {[
                {
                  badge: 'Độc lập • Miễn phí 1 tháng',
                  icon: TrendingUp,
                  title: '1. Sử Dụng Độc Lập Cho Đội Quảng Cáo',
                  desc: 'Dành cho Chủ doanh nghiệp, phòng Marketing hoặc Agency cần một không gian báo cáo Meta & Google Ads tinh gọn, dễ đọc để theo dõi hàng ngày và chia sẻ nhanh cho đối tác.',
                  ctaLabel: 'Tạo Workspace Miễn Phí',
                  onClick: () => openStartFlow('register'),
                  primary: true,
                },
                {
                  badge: 'Đồng bộ cùng đội Sale',
                  icon: Database,
                  title: '2. Kết Nối Với Hệ Thống Auto Chia Data',
                  desc: 'Mở ngay bảng báo cáo quảng cáo bên cạnh bộ chia vòng khách hàng tự động dưới 5 giây qua Zalo và Telegram, vừa theo dõi chi phí vừa kiểm soát chất lượng Sale gọi khách.',
                  ctaLabel: 'Khám phá Auto Chia Data',
                  href: '/data',
                },
                {
                  badge: 'Quản trị toàn diện',
                  icon: Cpu,
                  title: '3. Hợp Nhất Trong DOMATION ERP 5.0',
                  desc: 'Nằm trọn trong phân hệ Marketing của nền tảng quản trị doanh nghiệp 5.0 — kết nối xuyên suốt từ ngân sách quảng cáo đến hợp đồng bán hàng, kế toán và dòng tiền.',
                  ctaLabel: 'Khám phá DOMATION ERP',
                  href: '/erp',
                },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <div
                    key={item.title}
                    className={`rounded-3xl bg-white border p-6 sm:p-7 flex flex-col justify-between gap-5 ${
                      item.primary
                        ? 'border-blue-300 shadow-[0_20px_50px_-24px_rgba(30,64,255,0.22)]'
                        : 'border-slate-200/85 shadow-sm'
                    }`}
                  >
                    <div className="space-y-3.5">
                      <div className="flex items-center justify-between gap-2">
                        <div className="w-10 h-10 rounded-2xl bg-[#F4F8FF] border border-blue-100 text-[#1E40FF] flex items-center justify-center">
                          <Icon className="w-5 h-5" />
                        </div>
                        <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 text-[10.5px] font-bold">
                          {item.badge}
                        </span>
                      </div>
                      <h3 className="text-lg font-bold text-slate-900">{item.title}</h3>
                      <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                        {item.desc}
                      </p>
                    </div>

                    {item.href ? (
                      <a
                        href={item.href}
                        onClick={(e) => handleSpaLinkClick(e, item.href!)}
                        className="ql-btn-outline rounded-full px-5 py-2.5 text-xs font-bold justify-center"
                      >
                        <span>{item.ctaLabel}</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </a>
                    ) : (
                      <button
                        type="button"
                        onClick={item.onClick}
                        className="btn-inkica-primary rounded-full px-5 py-2.5 text-xs font-bold justify-center cursor-pointer"
                      >
                        <span>{item.ctaLabel}</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ====================================================================
            OPTIONAL GOOGLE ADS EXPANSION & 5-STEP GUIDE (#google-ads-guide)
           ==================================================================== */}
        <section
          id="google-ads-guide"
          className="scroll-mt-24 py-12 sm:py-20 px-4 sm:px-6 lg:px-8 border-t border-slate-200/70 bg-white/75"
        >
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="text-center space-y-2.5">
              <div className="ql-eyebrow mx-auto">
                <KeyRound className="w-3.5 h-3.5 text-[#1E40FF]" />
                <span>MỞ RỘNG BÁO CÁO ĐA KÊNH</span>
              </div>
              <h2 className="text-xl sm:text-3xl font-bold text-slate-900 tracking-tight">
                Mở Rộng Thêm Báo Cáo Google Ads{' '}
                <span className="text-gradient-inkica">Khi Chạy Đa Kênh</span>
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 max-w-2xl mx-auto leading-relaxed">
                Nếu doanh nghiệp chỉ chạy Meta Ads, hệ thống giữ giao diện tinh gọn tối đa để tập trung
                theo dõi. Khi cần gom thêm số liệu Google Ads vào chung một nơi, hãy bật nút bên dưới để
                xem hướng dẫn 5 bước kết nối qua Google Sheets:
              </p>
            </div>

            <div className="rounded-3xl bg-white border border-slate-200/90 shadow-[0_18px_48px_-24px_rgba(15,23,42,0.1)] p-5 sm:p-7">
              <GoogleAdsSetupGuide value={demoGAdsConfig} onChange={setDemoGAdsConfig} />
            </div>
          </div>
        </section>

        {/* ====================================================================
            TRANSPARENT PRICING SECTION (#pricing) — Free 1 Month + 490k/690k
           ==================================================================== */}
        <section
          id="pricing"
          className="scroll-mt-24 py-12 sm:py-20 px-4 sm:px-6 lg:px-8 border-t border-slate-200/70"
        >
          <div className="max-w-5xl mx-auto space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 text-center sm:text-left">
              <div>
                <div className="ql-eyebrow mb-2.5 mx-auto sm:mx-0">
                  <span>BẢNG GIÁ MINH BẠCH • DÙNG THỬ 0₫</span>
                </div>
                <h2 className="text-xl sm:text-3xl font-bold text-slate-900 tracking-tight">
                  Miễn Phí Trọn Vẹn 1 Tháng Đầu —{' '}
                  <span className="text-gradient-inkica">Chi Phí Duy Trì Tối Ưu</span>
                </h2>
              </div>

              <div className="inline-flex items-center p-1 rounded-full bg-white border border-slate-200 self-center sm:self-end">
                <button
                  type="button"
                  onClick={() => setPricingCycle('annual')}
                  className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                    pricingCycle === 'annual'
                      ? 'bg-[#1E40FF] text-white'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Theo năm • Giảm 29%
                </button>
                <button
                  type="button"
                  onClick={() => setPricingCycle('monthly')}
                  className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                    pricingCycle === 'monthly'
                      ? 'bg-[#1E40FF] text-white'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Theo tháng
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Card 1: Free 1 Month Trial */}
              <div className="rounded-3xl bg-white border border-slate-200/90 p-6 sm:p-8 flex flex-col justify-between gap-6 shadow-sm">
                <div className="space-y-4">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Khởi tạo tức thì • Không cần thẻ</span>
                  </div>
                  <div>
                    <div className="text-sm font-bold uppercase tracking-wider text-slate-500">
                      Trải Nghiệm Đầy Đủ
                    </div>
                    <div className="flex items-baseline gap-1.5 mt-1">
                      <span className="text-4xl font-black text-slate-900">0₫</span>
                      <span className="text-sm font-semibold text-slate-500">/ 30 ngày đầu</span>
                    </div>
                  </div>
                  <ul className="space-y-2.5 text-xs sm:text-sm text-slate-700 pt-2">
                    {[
                      'Kết nối nhiều tài khoản quảng cáo doanh nghiệp và cá nhân',
                      'Đồng bộ tự động Meta Ads → Google Sheets → Dashboard báo cáo',
                      'Trọn bộ bảng tổng quan, khung giờ hiệu quả & thư viện bài chạy',
                      'Đo lường chi tiết tỷ lệ giữ chân video 3 giây & lịch sử chỉnh sửa',
                      'Hỗ trợ mở rộng báo cáo Google Ads và liên thông hệ sinh thái DOMATION',
                    ].map((f) => (
                      <li key={f} className="flex items-start gap-2.5">
                        <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <button
                  type="button"
                  onClick={() => openStartFlow('register')}
                  className="ql-btn-outline w-full rounded-full py-3.5 text-xs sm:text-sm font-bold justify-center cursor-pointer"
                >
                  <span>Bắt đầu 1 tháng miễn phí</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>

              {/* Card 2: Pro Plan */}
              <div className="rounded-3xl bg-gradient-to-br from-[#F4F8FF] via-white to-cyan-50/40 border-2 border-[#1E40FF] p-6 sm:p-8 flex flex-col justify-between gap-6 shadow-[0_24px_60px_-24px_rgba(30,64,255,0.22)] relative">
                <span className="absolute -top-3.5 right-6 px-3.5 py-1 rounded-full bg-gradient-to-r from-[#1E40FF] to-[#06B6D4] text-white text-[11px] font-black uppercase shadow-sm">
                  Phổ Biến Nhất
                </span>
                <div className="space-y-4">
                  <div className="text-sm font-extrabold uppercase tracking-wider text-[#1E40FF]">
                    DOM Meta Pro Workspace
                  </div>
                  <div>
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-4xl font-black text-slate-900 tabular-nums">
                        {pricingCycle === 'annual' ? '490.000₫' : '690.000₫'}
                      </span>
                      <span className="text-sm font-semibold text-slate-500">/ tháng</span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      {pricingCycle === 'annual'
                        ? 'Thanh toán theo năm 5.880.000₫ — tiết kiệm ngay 2.400.000₫'
                        : 'Thanh toán linh hoạt từng tháng sau kỳ dùng thử 30 ngày'}
                    </p>
                  </div>

                  <ul className="space-y-2.5 text-xs sm:text-sm text-slate-700 pt-2">
                    {[
                      'Không giới hạn số lượng chiến dịch & quy mô ngân sách theo dõi',
                      'Lưu trữ không giới hạn mẫu bảng báo cáo & cột chỉ số tự tính',
                      'Chia sẻ đường dẫn xem báo cáo an toàn, không lộ quyền tài khoản gốc',
                      'Theo dõi chi tiết lịch sử chỉnh sửa chiến dịch & cảnh báo biến động',
                      'Đồng bộ xuyên suốt tài khoản cùng Auto Chia Data & DOMATION ERP',
                    ].map((f) => (
                      <li key={f} className="flex items-start gap-2.5">
                        <Check className="w-4 h-4 text-[#1E40FF] shrink-0 mt-0.5" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <button
                  type="button"
                  onClick={() => openStartFlow('register')}
                  className="btn-inkica-primary w-full rounded-full py-3.5 text-xs sm:text-sm font-bold justify-center cursor-pointer"
                >
                  <span>Khởi tạo &amp; Nhận 30 ngày Free trước</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* ====================================================================
            FAQ SECTION
           ==================================================================== */}
        <FaqAccordionSection
          eyebrow="GIẢI ĐÁP THẮC MẮC"
          heading="Câu Hỏi Thường Gặp Về Báo Cáo Meta Ads"
          subtitle="Thông tin chi tiết về gói dùng thử miễn phí 1 tháng, luồng đồng bộ Google Sheets, mở rộng Google Ads và liên thông hệ sinh thái."
          faqs={META_REPORT_FAQS}
        />
      </main>

      {/* ====================================================================
          UNIFIED FOOTER
         ==================================================================== */}
      <footer className="bg-slate-950 text-slate-300 border-t border-slate-800/80 py-12 px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 pb-8 border-b border-slate-800/80">
            <div className="md:col-span-5 space-y-3">
              <div className="flex items-center gap-2.5">
                <DomationLogoMark size={34} />
                <div>
                  <div className="text-base font-black text-white leading-none">DOMATION</div>
                  <div className="text-[10px] font-bold tracking-widest uppercase text-cyan-300 mt-1">
                    META &amp; OMNICHANNEL ANALYTICS
                  </div>
                </div>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed max-w-sm">
                Nền tảng báo cáo hiệu quả quảng cáo Meta &amp; Google Ads tự động qua Google Sheets —
                dùng độc lập miễn phí 1 tháng đầu hoặc đồng bộ trực tiếp trong hệ sinh thái DOMATION.
              </p>
            </div>

            <div className="md:col-span-3 space-y-2.5">
              <div className="text-xs font-semibold uppercase tracking-widest text-cyan-300">
                Hệ Sinh Thái DOMATION
              </div>
              <ul className="space-y-2 text-xs text-slate-300">
                <li>
                  <a
                    href="/data"
                    onClick={(e) => handleSpaLinkClick(e, '/data')}
                    className="hover:text-white transition-colors"
                  >
                    Auto Chia Data Cho Sale
                  </a>
                </li>
                <li>
                  <a
                    href="/erp"
                    onClick={(e) => handleSpaLinkClick(e, '/erp')}
                    className="hover:text-white transition-colors"
                  >
                    Hệ Quản Trị DOMATION ERP 5.0
                  </a>
                </li>
                <li>
                  <a
                    href="/automation"
                    onClick={(e) => handleSpaLinkClick(e, '/automation')}
                    className="hover:text-white transition-colors"
                  >
                    Tự Động Hóa Chăm Sóc Đa Kênh
                  </a>
                </li>
              </ul>
            </div>

            <div className="md:col-span-4 space-y-2.5">
              <div className="text-xs font-semibold uppercase tracking-widest text-cyan-300">
                Pháp Lý &amp; Quyền Riêng Tư
              </div>
              <div className="flex flex-col gap-2 text-xs text-slate-300">
                <button
                  type="button"
                  onClick={() => {
                    setLegalTab('terms');
                    setLegalOpen(true);
                  }}
                  className="inline-flex items-center gap-1.5 hover:text-cyan-300 text-left cursor-pointer"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Điều khoản sử dụng</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setLegalTab('privacy');
                    setLegalOpen(true);
                  }}
                  className="inline-flex items-center gap-1.5 hover:text-cyan-300 text-left cursor-pointer"
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Chính sách bảo mật dữ liệu</span>
                </button>
                <button
                  type="button"
                  onClick={() => setCookieForceCounter((c) => c + 1)}
                  className="inline-flex items-center gap-1.5 hover:text-cyan-300 text-left cursor-pointer"
                >
                  <Cookie className="w-3.5 h-3.5" />
                  <span>Tùy chỉnh Cookie</span>
                </button>
              </div>
            </div>
          </div>

          <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-slate-400">
            <span>© {new Date().getFullYear()} CÔNG TY TNHH DOM MARKETING.</span>
            <span>DOMATION Meta Report • Đồng bộ tự động Meta Ads, Google Sheets, Auto Chia Data &amp; ERP.</span>
          </div>
        </div>
      </footer>

      {/* Video Walkthrough Modal */}
      {showVideoModal && (
        <DomMetaModalPortal>
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Video hướng dẫn hệ thống báo cáo Meta Ads"
            data-testid="meta-video-modal"
            onClick={() => setShowVideoModal(false)}
            style={{ zIndex: 2147483638 }}
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm p-0 sm:p-8 flex items-end sm:items-center justify-center"
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-5xl rounded-t-[26px] sm:rounded-3xl bg-slate-950 p-3 sm:p-0 flex flex-col items-center gap-4 sm:gap-5 max-h-[92dvh]"
            >
              <div className="relative w-full aspect-video rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl bg-slate-950 border border-white/20">
                <button
                  type="button"
                  aria-label="Đóng video hướng dẫn"
                  onClick={() => setShowVideoModal(false)}
                  className="absolute top-3 right-3 sm:top-4 sm:right-4 z-10 w-11 h-11 sm:w-10 sm:h-10 flex items-center justify-center bg-white/95 hover:bg-white text-slate-900 rounded-full transition-colors cursor-pointer shadow"
                >
                  <X className="w-5 h-5" />
                </button>
                <iframe
                  width="100%"
                  height="100%"
                  src={`${META_VIDEO_EMBED_URL}?autoplay=1&rel=0`}
                  title="Video hướng dẫn kích hoạt báo cáo Meta Ads"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                  className="absolute inset-0 w-full h-full border-0"
                />
              </div>
              <a
                href={META_VIDEO_YOUTUBE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-7 py-3 rounded-full bg-white text-[#1E40FF] hover:bg-blue-50 text-sm font-bold transition-all shadow-lg"
              >
                <Play className="w-4 h-4" fill="currentColor" />
                <span>Xem trên YouTube</span>
              </a>
            </div>
          </div>
        </DomMetaModalPortal>
      )}

      {/* Screenshot Lightbox */}
      {zoomShot && (
        <DomMetaModalPortal>
          <div
            role="dialog"
            aria-modal="true"
            onClick={() => setZoomShot(null)}
            style={{ zIndex: 2147483636 }}
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm p-0 sm:p-8 flex items-end sm:items-center justify-center"
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="max-w-6xl w-full bg-white rounded-t-[26px] sm:rounded-3xl max-h-[92dvh] flex flex-col overflow-hidden shadow-2xl"
            >
              <div className="px-4 sm:px-6 py-4 border-b border-slate-200 flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <div className="text-sm font-bold text-slate-900">{zoomShot.title}</div>
                  <div className="text-xs text-slate-500">{zoomShot.desc}</div>
                </div>
                <button
                  type="button"
                  onClick={() => setZoomShot(null)}
                  className="rounded-full border border-slate-200 w-11 h-11 sm:w-9 sm:h-9 flex items-center justify-center text-slate-600 hover:bg-slate-100 cursor-pointer shrink-0"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="bg-slate-100 flex-1 overflow-auto p-2 sm:p-4">
                <img src={zoomShot.src} alt={zoomShot.title} className="w-full h-auto rounded-xl" />
              </div>
            </div>
          </div>
        </DomMetaModalPortal>
      )}

      {/* Legal & Cookie */}
      <AutoDataLegalModal
        open={legalOpen}
        activeTab={legalTab}
        onTabChange={setLegalTab}
        onClose={() => setLegalOpen(false)}
      />
      <AutoDataCookieConsent
        hidden={authModalOpen || workspaceOpen}
        forceOpenCounter={cookieForceCounter}
        onOpenLegal={(t) => {
          setLegalTab(t);
          setLegalOpen(true);
        }}
      />

      {showBackTop && !authModalOpen && (
        <button
          type="button"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 px-4 py-2 rounded-full bg-white/95 backdrop-blur-xl border border-slate-200 shadow-lg text-xs font-semibold text-slate-800 hover:text-[#1E40FF] flex items-center gap-1.5 cursor-pointer"
        >
          <ArrowUp className="w-3.5 h-3.5 text-[#1E40FF]" />
          <span>Đầu trang</span>
        </button>
      )}

      {/* Standalone Onboarding & Login Modal */}
      {renderAuthModal()}
    </div>
  );
};

export default MetaAdReport;
