import React, { useEffect, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Bot,
  Briefcase,
  Building2,
  Car,
  Check,
  CheckCircle2,
  Clock,
  EyeOff,
  FileEdit,
  Gauge,
  GraduationCap,
  Hand,
  HeartPulse,
  KeyRound,
  Layers,
  Loader2,
  Mail,
  PlusCircle,
  RefreshCw,
  Scale,
  Share2,
  ShieldBan,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Table2,
  UserCheck,
  Users,
  Webhook,
  X,
} from 'lucide-react';
import { LuxuryGoldBackdrop } from '../../LuxuryGoldBackdrop';
import { DomationLogoMark } from '../DomationLogoMark';
import { AutodataApiError, apiRequest, getErrorMessage, saveAutodataSessionV2 } from './autodataApi';
import {
  AutoDataHelpTrigger,
  AutoDataSpotlightTour,
  type SpotlightTourStep,
} from './AutoDataHelpTour';
import { AutoDataZaloBotGuide } from './AutoDataZaloBotGuide';
import {
  DEFAULT_CLIENT_CATALOG,
  type ClientBillingCatalog,
  type HelpTopicKey,
  type LegalDocTab,
  type TenantSessionV2,
  type WorkspaceSummaryItem,
  type ZaloBotSavedState,
} from './autodataTypes';

interface AutoDataAuthModalProps {
  isOpen: boolean;
  initialMode?: 'login' | 'register' | 'select_workspace' | 'create_workspace';
  catalog?: ClientBillingCatalog;
  googleClientId?: string | null;
  existingAccountToken?: string | null;
  existingWorkspaces?: WorkspaceSummaryItem[];
  onOpenLegal?: (tab: LegalDocTab) => void;
  onClose: () => void;
  onAuthenticated: (session: TenantSessionV2) => void;
}

interface AuthResponsePayload {
  action?: 'enter_workspace' | 'select_workspace' | 'create_workspace';
  access_token?: string;
  refresh_token?: string;
  account_token?: string;
  account?: {
    id?: string;
    email?: string;
    full_name?: string;
    avatar_url?: string | null;
    auth_provider?: 'password' | 'google';
  };
  tenant?: { id?: string; slug: string; name?: string; industry?: string };
  workspace?: { id?: string; slug: string; company_name?: string; industry?: string };
  user?: {
    id?: string;
    email?: string;
    full_name?: string;
    avatar_url?: string | null;
    role?: string;
    is_external_agency?: boolean;
  };
  onboarding?: { screen_tours?: Record<string, boolean> };
  workspaces?: WorkspaceSummaryItem[];
}

interface GooglePromptNotification {
  isNotDisplayed: () => boolean;
  isSkippedMoment: () => boolean;
  getNotDisplayedReason?: () => string;
  getSkippedReason?: () => string;
}

interface GoogleIdentityWindow extends Window {
  google?: {
    accounts?: {
      id?: {
        initialize: (cfg: {
          client_id: string;
          callback: (resp: { credential?: string }) => void;
          auto_select?: boolean;
        }) => void;
        prompt: (callback?: (notification: GooglePromptNotification) => void) => void;
      };
    };
  };
}

interface BusinessDomainOption {
  key: string;
  label: string;
  subtitle: string;
  icon: React.ComponentType<{ className?: string }>;
  pipelineName: string;
}

interface RouterModeOption {
  key: 'weighted_round_robin' | 'strict_round_robin' | 'least_loaded' | 'manual_only';
  title: string;
  badge?: string;
  desc: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface DedupPolicyOption {
  key: 'route_to_existing_owner' | 'update_existing' | 'create_new_round_robin' | 'reject_duplicate';
  title: string;
  desc: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface ChannelOption {
  key: string;
  title: string;
  desc: string;
  required?: boolean;
  helpTopic?: HelpTopicKey;
  icon: React.ComponentType<{ className?: string }>;
}

interface WizardTourStep extends SpotlightTourStep {
  stepNumber: 1 | 2 | 3;
}

const BUSINESS_DOMAINS: BusinessDomainOption[] = [
  {
    key: 'general',
    label: 'Đa Ngành / Đội Sale Nội Bộ',
    subtitle: 'Cấu hình chuẩn mặc định cho mọi đội Sale & doanh nghiệp',
    icon: SlidersHorizontal,
    pipelineName: 'Phễu Kinh Doanh Tiêu Chuẩn Doanh Nghiệp',
  },
  {
    key: 'real_estate',
    label: 'Bất Động Sản & Sàn Kinh Doanh',
    subtitle: 'Chia giỏ dự án cho Sale nội bộ, tùy chọn bật thêm CTV F1',
    icon: Building2,
    pipelineName: 'Phễu Tư Vấn & Giữ Chỗ Dự Án',
  },
  {
    key: 'spa_clinic',
    label: 'Nha Khoa, Thẩm Mỹ & Phòng Khám',
    subtitle: 'Đặt lịch tư vấn bác sĩ, phân tuyến theo chi nhánh cơ sở',
    icon: HeartPulse,
    pipelineName: 'Phễu Đặt Hẹn & Thăm Khám Chuyên Khoa',
  },
  {
    key: 'education',
    label: 'Giáo Dục, Học Viện & Du Học',
    subtitle: 'Phân bổ tuyển sinh theo khóa học, test đầu vào & cơ sở',
    icon: GraduationCap,
    pipelineName: 'Phễu Tuyển Sinh & Tư Vấn Lộ Trình Học',
  },
  {
    key: 'b2b',
    label: 'Dịch Vụ B2B, Phần Mềm & Agency',
    subtitle: 'Định tuyến khách doanh nghiệp theo quy mô & chuyên viên',
    icon: Briefcase,
    pipelineName: 'Phễu Tư Vấn Giải Pháp & Ký Hợp Đồng B2B',
  },
  {
    key: 'ecommerce',
    label: 'Bán Lẻ / Showroom & Tài Chính',
    subtitle: 'Phân bổ đăng ký tư vấn, đặt lịch hẹn & đơn hàng đa kênh',
    icon: Car,
    pipelineName: 'Phễu Tư Vấn & Chuyển Đổi Khách Hàng',
  },
];

const ROUTER_MODES: RouterModeOption[] = [
  {
    key: 'weighted_round_robin',
    title: 'Chia Trọng Số Công Bằng (Weighted Fair-Share)',
    badge: 'Khuyên dùng',
    desc: 'Tự động cân bằng tỷ lệ nhận khách theo năng lực/KPI từng Sale (VD: Senior x3, Junior x1).',
    icon: Scale,
  },
  {
    key: 'strict_round_robin',
    title: 'Xoay Vòng Tuần Tự 1:1 (Strict Round-Robin)',
    desc: 'Chia đều tuyệt đối lần lượt từ Sale thứ 1 đến người thứ N đang bật trạng thái Online.',
    icon: RefreshCw,
  },
  {
    key: 'least_loaded',
    title: 'Ưu Tiên Người Ít Việc Nhất (Least-Loaded)',
    desc: 'Phân tích tải thực tế và đẩy khách mới cho Sale đang có ít hồ sơ chờ xử lý nhất.',
    icon: Gauge,
  },
  {
    key: 'manual_only',
    title: 'Giỏ Chờ Duyệt Tay (Manual Queue)',
    desc: 'Tập trung Lead về giỏ chung để Trưởng phòng Sale hoặc Admin chỉ định thủ công.',
    icon: Hand,
  },
];

function RepeatIconFallback({ className }: { className?: string }) {
  return <RefreshCw className={className} />;
}

const DEDUP_POLICIES: DedupPolicyOption[] = [
  {
    key: 'route_to_existing_owner',
    title: 'Trả Về Đúng Sale Cũ Đang Chăm',
    desc: 'Bảo vệ quyền lợi Sale khai thác ban đầu và gắn cảnh báo khách quay lại trong 180 ngày (6 tháng).',
    icon: UserCheck,
  },
  {
    key: 'update_existing',
    title: 'Cập Nhật Vào Hồ Sơ Sẵn Có',
    desc: 'Ghi nối nguồn chiến dịch mới vào thẻ khách hàng hiện hữu, không sinh thẻ rác.',
    icon: FileEdit,
  },
  {
    key: 'create_new_round_robin',
    title: 'Tạo Hồ Sơ Mới & Chia Vòng Mới',
    desc: 'Áp dụng khi doanh nghiệp chạy nhiều dòng sản phẩm/chi nhánh độc lập nhau.',
    icon: RepeatIconFallback,
  },
  {
    key: 'reject_duplicate',
    title: 'Chặn Tuyệt Đối SĐT Trùng',
    desc: 'Từ chối ngay tại cổng Webhook nếu số điện thoại đã phát sinh trong chu kỳ chống trùng.',
    icon: ShieldBan,
  },
];

const CHANNEL_OPTIONS: ChannelOption[] = [
  {
    key: 'webhook',
    title: 'Inbound Webhook Đa Nền Tảng',
    desc: 'Tự động cấp sẵn ngay khi tạo tài khoản — nhận Lead tức thì từ LadiPage, Web, Form.',
    required: true,
    helpTopic: 'apps_script',
    icon: Webhook,
  },
  {
    key: 'zalobot',
    title: 'ZaloBot & Telegram Bot Báo Số Sale',
    desc: 'Nhận thông báo khách mới qua Zalo hoặc Telegram cá nhân/nhóm dưới 4 giây (Có thể cài sau).',
    required: false,
    helpTopic: 'zalobot_chatid',
    icon: Bot,
  },
  {
    key: 'sheets_tiktok',
    title: 'Google Sheets 2 Chiều & TikTok Lead',
    desc: 'Đồng bộ 2 chiều với Google Sheet riêng của từng Sale bằng Apps Script mẫu.',
    required: false,
    helpTopic: 'apps_script',
    icon: Table2,
  },
  {
    key: 'meta_capi',
    title: 'Facebook Lead Ads & Meta CAPI v21.0',
    desc: 'Đồng bộ ngược sự kiện khách chất lượng băm SHA-256 về Facebook Dataset.',
    required: false,
    helpTopic: 'meta_capi',
    icon: Share2,
  },
  {
    key: 'smtp_sla',
    title: 'Email Cảnh Báo SLA & Báo Cáo Gini',
    desc: 'Gửi báo cáo đối soát công bằng chia số và cảnh báo trễ SLA cuối ngày.',
    required: false,
    helpTopic: 'sla_recall',
    icon: Mail,
  },
];

const WIZARD_TOUR_STEPS: WizardTourStep[] = [
  {
    id: 'wiz_stepper',
    target: 'setup-stepper',
    stepNumber: 1,
    eyebrow: 'BẮT BUỘC VS TÙY CHỌN',
    title: '3 bước rõ ràng — Cài nhanh trong 60 giây',
    description:
      'Chỉ Bước 1 là bắt buộc để khởi tạo không gian đội Sale. Bước 2 và Bước 3 đã cài sẵn cấu hình tối ưu, bạn có thể giữ nguyên hoặc bấm bỏ qua bất cứ lúc nào.',
    chips: ['Bước 1: Bắt buộc (30 giây)', 'Bước 2–3: Tùy chọn', 'Miễn phí 1 tháng đầu'],
    topics: ['billing_1m_trial'],
  },
  {
    id: 'wiz_org_form',
    target: 'setup-org-form',
    stepNumber: 1,
    eyebrow: 'KHỞI TẠO KHÔNG GIAN',
    title: 'Thông tin Doanh nghiệp & Tài khoản Quản trị',
    description:
      'Điền Tên đội Sale, người phụ trách, Email và Mật khẩu. Hệ thống tự tạo địa chỉ không gian làm việc riêng (/data/slug) và kích hoạt gói dùng thử miễn phí.',
    chips: ['Standard: 20 Sale & 5 Quản lý', 'Growth: 85 Sale & 15 Quản lý', 'Tự sinh cổng tiếp nhận riêng'],
  },
  {
    id: 'wiz_router_internal',
    target: 'setup-router-internal',
    stepNumber: 2,
    eyebrow: 'SALE NỘI BỘ MẶC ĐỊNH',
    title: 'Chia thẳng cho từng Sale nội bộ (hiển thị đủ SĐT)',
    description:
      'Mặc định hệ thống giao khách trực tiếp cho từng chuyên viên Sale trong công ty để gọi ngay tức thì. Khi có CTV / Đại lý ngoài, bạn chỉ cần gạt nút bật chế độ che số.',
    chips: ['Sale nội bộ: Thấy đủ SĐT', 'Tùy chọn bật Đại lý F1 (che số)'],
    topics: ['internal_sale_default'],
  },
  {
    id: 'wiz_router_algo',
    target: 'setup-router-algo',
    stepNumber: 2,
    eyebrow: 'LUẬT CHIA & CHỐNG TRÙNG',
    title: 'Chia thẳng vòng theo năng lực & Lọc trùng 180 ngày (6 tháng)',
    description:
      'Mặc định chia thẳng về Bot cho Sale đang bật Online ngay khi có khách. Khách cũ quay lại trong 180 ngày (6 tháng) tự trả về đúng Sale phụ trách.',
    chips: ['Chia thẳng hoặc Bật SLA', 'Nhận thông báo tức thì', 'Lọc trùng 180 ngày (6 tháng)'],
    topics: ['round_robin_formula', 'dedupe_180d', 'sla_recall'],
  },
  {
    id: 'wiz_channels',
    target: 'setup-channels',
    stepNumber: 3,
    eyebrow: 'KẾT NỐI ĐA KÊNH',
    title: 'Cổng nhận khách cấp sẵn — Kênh ngoài tùy chọn',
    description:
      'Cổng nhận dữ liệu trung tâm đã bật sẵn. Bạn có thể chọn thêm đồng bộ Google Sheets 2 chiều cho từng Sale hoặc phản hồi hiệu quả về Meta Ads ngay tại đây.',
    chips: ['Đồng bộ Google Sheets 2 chiều', 'Tối ưu Meta Ads', 'Không chặn kích hoạt'],
    topics: ['apps_script', 'meta_capi'],
  },
  {
    id: 'wiz_zalo',
    target: 'setup-zalo-guide',
    stepNumber: 3,
    eyebrow: 'THÔNG BÁO BOT A–Z',
    title: 'Kết nối Bot báo số tức thì — Có thể bỏ qua ngay',
    description:
      'Nếu đã có Bot Token & Chat ID, bạn bấm Kiểm tra để xác thực ngay. Chưa kịp chuẩn bị? Bấm "Bỏ qua & vào ngay" để đi thẳng vào giao diện điều phối.',
    chips: ['4 bước lấy Token & /chatid', 'Hỗ trợ Telegram & Zalo Bot', 'Bỏ qua không mất dữ liệu'],
    topics: ['zalobot_chatid'],
    actionLabel: 'Bắt đầu thiết lập',
  },
];

const INDUSTRY_LABELS: Record<string, string> = {
  general: 'Đa Ngành / Tổng Hợp',
  real_estate: 'Bất Động Sản',
  spa_clinic: 'Thẩm Mỹ & Y Tế',
  healthcare: 'Thẩm Mỹ & Y Tế',
  education: 'Giáo Dục & Đào Tạo',
  b2b: 'Dịch Vụ B2B & SaaS',
  ecommerce: 'Bán Lẻ & Thương Mại',
};

const RECENT_GOOGLE_ACCOUNTS_KEY = 'domation_recent_google_accounts_v1';

interface RecentGoogleAccountItem {
  email: string;
  full_name: string;
  updated_at: string;
}

function slugifyVietnamese(input: string): string {
  return input
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 36);
}

function loadRecentGoogleAccounts(): RecentGoogleAccountItem[] {
  try {
    const raw = window.localStorage.getItem(RECENT_GOOGLE_ACCOUNTS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(
        (it): it is RecentGoogleAccountItem =>
          Boolean(it && typeof it === 'object' && typeof (it as RecentGoogleAccountItem).email === 'string')
      )
      .slice(0, 6);
  } catch {
    return [];
  }
}

function rememberRecentGoogleAccount(email: string, fullName: string): RecentGoogleAccountItem[] {
  const cleanEmail = email.trim().toLowerCase();
  if (!cleanEmail || !cleanEmail.includes('@')) return loadRecentGoogleAccounts();
  const cleanName = fullName.trim() || cleanEmail.split('@')[0] || 'Quản trị viên';
  const nextList: RecentGoogleAccountItem[] = [
    { email: cleanEmail, full_name: cleanName, updated_at: new Date().toISOString() },
    ...loadRecentGoogleAccounts().filter((item) => item.email !== cleanEmail),
  ].slice(0, 6);
  try {
    window.localStorage.setItem(RECENT_GOOGLE_ACCOUNTS_KEY, JSON.stringify(nextList));
  } catch {
    // Ignore storage issues
  }
  return nextList;
}

function GoogleLogoMark({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.29v3.09C3.26 21.3 7.31 24 12 24z"
      />
      <path
        fill="#FBBC05"
        d="M5.27 14.29c-.25-.72-.38-1.49-.38-2.29s.14-1.57.38-2.29V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.98-3.09z"
      />
      <path
        fill="#EA4335"
        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.98 3.09c.95-2.85 3.6-4.96 6.73-4.96z"
      />
    </svg>
  );
}

export const AutoDataAuthModal: React.FC<AutoDataAuthModalProps> = ({
  isOpen,
  initialMode = 'register',
  catalog = DEFAULT_CLIENT_CATALOG,
  googleClientId,
  existingAccountToken = null,
  existingWorkspaces = [],
  onOpenLegal,
  onClose,
  onAuthenticated,
}) => {
  const [authMode, setAuthMode] = useState<'register' | 'login'>(
    initialMode === 'login' || initialMode === 'select_workspace' ? 'login' : 'register'
  );
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [tourOpen, setTourOpen] = useState(false);
  const [tourStepIdx, setTourStepIdx] = useState(0);

  // Registration Step 1 state (Required core fields)
  const [autoSlugSalt, setAutoSlugSalt] = useState<string>(() => {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID().replace(/-/g, '').slice(0, 6);
    }
    return Math.random().toString(36).replace(/[^a-z0-9]/g, '').slice(0, 6) || 'kx9vm2';
  });
  const [companyName, setCompanyName] = useState('');
  const [tenantSlug, setTenantSlug] = useState('');
  const [domainKey, setDomainKey] = useState<string>('general');
  const [adminName, setAdminName] = useState('');
  const [workEmail, setWorkEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(true);

  // Registration Step 2 state — Individual Internal Sale is strictly DEFAULT (is_external_agency = false)
  const [routerMode, setRouterMode] = useState<RouterModeOption['key']>('weighted_round_robin');
  const [dedupPolicy, setDedupPolicy] = useState<DedupPolicyOption['key']>('route_to_existing_owner');
  const [dedupDays, setDedupDays] = useState<number>(180);
  const [isExternalAgency, setIsExternalAgency] = useState<boolean>(false);
  const [slaAutoRecall, setSlaAutoRecall] = useState<boolean>(false);

  // Registration Step 3 state
  const [selectedChannels, setSelectedChannels] = useState<string[]>([
    'webhook',
    'zalobot',
    'sheets_tiktok',
  ]);
  const [pendingZaloBot, setPendingZaloBot] = useState<ZaloBotSavedState | null>(null);

  // Login & Multi-Workspace Discovery state (No Slug required!)
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [authDiscovery, setAuthDiscovery] = useState<{
    user: {
      email: string;
      full_name: string;
      avatar_url?: string | null;
      auth_provider: 'password' | 'google';
    };
    accessToken: string;
    workspaces: WorkspaceSummaryItem[];
  } | null>(() =>
    initialMode === 'select_workspace' && existingAccountToken
      ? {
          user: {
            email: '',
            full_name: 'Tài khoản DOMATION',
            auth_provider: 'password',
          },
          accessToken: existingAccountToken,
          workspaces: existingWorkspaces,
        }
      : null
  );
  const [accountTokenForWizard, setAccountTokenForWizard] = useState<string | null>(
    initialMode === 'create_workspace' ? existingAccountToken : null
  );
  const [googleModalOpen, setGoogleModalOpen] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [googleInputEmail, setGoogleInputEmail] = useState('');
  const [googleInputName, setGoogleInputName] = useState('');
  const [recentGoogleAccounts, setRecentGoogleAccounts] = useState<RecentGoogleAccountItem[]>(() =>
    loadRecentGoogleAccounts()
  );
  const [quickWorkspaceCompany, setQuickWorkspaceCompany] = useState('');
  const [quickWorkspacePhone, setQuickWorkspacePhone] = useState('');
  const [quickWorkspaceIndustry, setQuickWorkspaceIndustry] = useState('general');
  const [switchingSlug, setSwitchingSlug] = useState<string | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Lock body scroll & Escape handler
  useEffect(() => {
    if (!isOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !tourOpen && !googleModalOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [isOpen, tourOpen, googleModalOpen, onClose]);

  // Ensure Google Identity Services (GIS) client script is ready
  useEffect(() => {
    if (!isOpen || typeof window === 'undefined') return;
    const g = (window as GoogleIdentityWindow).google?.accounts?.id;
    if (!g && !document.querySelector('script[src*="accounts.google.com/gsi/client"]')) {
      const s = document.createElement('script');
      s.src = 'https://accounts.google.com/gsi/client';
      s.async = true;
      s.defer = true;
      document.head.appendChild(s);
    }
  }, [isOpen]);

  // Background check-slug uniqueness & auto re-roll salt on 409/taken
  useEffect(() => {
    if (!isOpen || authMode !== 'register') return;
    const clean = tenantSlug.trim();
    if (clean.length < 3) return;
    let cancelled = false;
    const timer = window.setTimeout(async () => {
      try {
        const res = await apiRequest<{ is_available?: boolean; available?: boolean }>(
          `/auth/check-slug?slug=${encodeURIComponent(clean)}`
        );
        const ok = res.is_available !== undefined ? Boolean(res.is_available) : Boolean(res.available);
        if (!cancelled && !ok) {
          const nextSalt =
            Math.random().toString(36).replace(/[^a-z0-9]/g, '').slice(0, 6) ||
            Date.now().toString(36).slice(-6);
          setAutoSlugSalt(nextSalt);
          const base = slugifyVietnamese(companyName) || 'ws';
          setTenantSlug(`${base.slice(0, 27)}-${nextSalt}`);
        }
      } catch (err: unknown) {
        if (!cancelled && err instanceof AutodataApiError && err.status === 409) {
          const nextSalt =
            Math.random().toString(36).replace(/[^a-z0-9]/g, '').slice(0, 6) ||
            Date.now().toString(36).slice(-6);
          setAutoSlugSalt(nextSalt);
          const base = slugifyVietnamese(companyName) || 'ws';
          setTenantSlug(`${base.slice(0, 27)}-${nextSalt}`);
        }
      }
    }, 350);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [isOpen, authMode, tenantSlug, companyName]);

  if (!isOpen) return null;

  const syncUiToTourStep = (nextIdx: number) => {
    const targetStep = WIZARD_TOUR_STEPS[nextIdx];
    if (!targetStep) return;
    setAuthDiscovery(null);
    setAuthMode('register');
    setStep(targetStep.stepNumber);
  };

  const openInAppTour = (topic?: HelpTopicKey) => {
    let nextIdx = 0;
    if (topic) {
      const foundIdx = WIZARD_TOUR_STEPS.findIndex((s) => s.topics?.includes(topic));
      if (foundIdx >= 0) nextIdx = foundIdx;
    } else {
      const currentWizardIdx = WIZARD_TOUR_STEPS.findIndex((s) => s.stepNumber === step);
      if (currentWizardIdx >= 0) nextIdx = currentWizardIdx;
    }
    syncUiToTourStep(nextIdx);
    setTourStepIdx(nextIdx);
    setTourOpen(true);
  };

  const handleTourStepChange = (nextIdx: number) => {
    const bounded = Math.max(0, Math.min(WIZARD_TOUR_STEPS.length - 1, nextIdx));
    syncUiToTourStep(bounded);
    setTourStepIdx(bounded);
  };

  const handleCompanyNameChange = (val: string) => {
    setCompanyName(val);
    const trimmed = val.trim();
    if (!trimmed) {
      setTenantSlug('');
      return;
    }
    const base = slugifyVietnamese(trimmed) || 'ws';
    setTenantSlug(`${base.slice(0, 27)}-${autoSlugSalt}`);
  };

  const toggleChannel = (key: string) => {
    if (key === 'webhook') return;
    setSelectedChannels((prev) =>
      prev.includes(key) ? prev.filter((item) => item !== key) : [...prev, key]
    );
  };

  const finishWorkspaceEntry = (
    payload: AuthResponsePayload,
    provider: 'password' | 'google' = 'password',
    fallbackEmail?: string
  ) => {
    const slug = payload.tenant?.slug || payload.workspace?.slug || '';
    const company = payload.tenant?.name || payload.workspace?.company_name || slug;
    const resolvedEmail = payload.user?.email || payload.account?.email || fallbackEmail || '';
    const resolvedName =
      payload.user?.full_name || payload.account?.full_name || resolvedEmail;
    setRecentGoogleAccounts(rememberRecentGoogleAccount(resolvedEmail, resolvedName));

    const session: TenantSessionV2 = {
      access_token: payload.access_token || '',
      refresh_token: payload.refresh_token,
      account_token: payload.account_token || accountTokenForWizard || undefined,
      tenant_slug: slug,
      company_name: company,
      industry: payload.tenant?.industry || payload.workspace?.industry,
      admin_email: resolvedEmail,
      user_id: payload.user?.id,
      user_name: resolvedName,
      role: payload.user?.role,
      is_external_agency: Boolean(payload.user?.is_external_agency ?? isExternalAgency),
      auth_provider: provider,
      workspaces: payload.workspaces || authDiscovery?.workspaces || existingWorkspaces,
      screen_tours: payload.onboarding?.screen_tours || {},
    };
    saveAutodataSessionV2(session);
    onAuthenticated(session);
  };

  const handleAuthDiscoveryResponse = (
    payload: AuthResponsePayload,
    provider: 'password' | 'google',
    fallbackEmail?: string
  ) => {
    const userEmail = payload.user?.email || payload.account?.email || fallbackEmail || '';
    const userFullName =
      payload.user?.full_name || payload.account?.full_name || userEmail;
    setRecentGoogleAccounts(rememberRecentGoogleAccount(userEmail, userFullName));

    const discovered = Array.isArray(payload.workspaces) ? payload.workspaces : [];
    if (
      (payload.action === 'enter_workspace' || discovered.length === 1) &&
      payload.access_token &&
      payload.tenant?.slug
    ) {
      finishWorkspaceEntry(payload, provider, fallbackEmail);
      return;
    }

    setAuthDiscovery({
      user: {
        email: userEmail,
        full_name: userFullName,
        avatar_url: payload.user?.avatar_url || payload.account?.avatar_url || null,
        auth_provider: provider,
      },
      accessToken: payload.account_token || payload.access_token || '',
      workspaces: discovered,
    });
  };

  const validateStep1 = (): boolean => {
    if (!companyName.trim() || companyName.trim().length < 2) {
      setErrorMsg('Vui lòng nhập Tên doanh nghiệp / Đội Sale (tối thiểu 2 ký tự).');
      return false;
    }
    if (tenantSlug.trim().length < 2) {
      const base = slugifyVietnamese(companyName.trim()) || 'ws';
      setTenantSlug(`${base.slice(0, 27)}-${autoSlugSalt}`);
    }
    if (!adminName.trim() || !workEmail.includes('@') || phone.replace(/\D/g, '').length < 9) {
      setErrorMsg('Vui lòng điền Họ tên quản trị viên, Email công việc và Số điện thoại hợp lệ.');
      return false;
    }
    const skipPassword = Boolean(
      accountTokenForWizard && password.length === 0 && confirmPassword.length === 0
    );
    if (!skipPassword) {
      if (password.length < 8) {
        setErrorMsg('Mật khẩu quản trị cần tối thiểu 8 ký tự để bảo mật không gian dữ liệu.');
        return false;
      }
      if (password !== confirmPassword) {
        setErrorMsg('Mật khẩu xác nhận chưa khớp. Vui lòng nhập lại chính xác.');
        return false;
      }
    }
    if (!agreeTerms) {
      setErrorMsg('Vui lòng bật đồng ý Điều khoản sử dụng và Chính sách bảo mật dữ liệu của DOMATION.');
      return false;
    }
    setErrorMsg(null);
    return true;
  };

  const handleRegisterSubmit = async () => {
    if (!validateStep1()) {
      setStep(1);
      return;
    }
    setSubmitting(true);
    setErrorMsg(null);
    try {
      const selectedDomain = BUSINESS_DOMAINS.find((d) => d.key === domainKey) || BUSINESS_DOMAINS[0];
      const finalSlug =
        tenantSlug.trim() || `${slugifyVietnamese(companyName.trim()) || 'ws'}-${autoSlugSalt}`;
      const customSettings = {
        distribution_mode: routerMode,
        duplicate_action:
          dedupPolicy === 'create_new_round_robin'
            ? 'round_robin'
            : dedupPolicy === 'route_to_existing_owner'
              ? 'route_to_previous_sale'
              : dedupPolicy,
        duplicate_threshold_days: dedupDays,
        is_external_agency: isExternalAgency,
        pii_masking_enabled: isExternalAgency,
        pii_mask_before_accept: isExternalAgency,
        sla_auto_recall_enabled: slaAutoRecall,
        selected_channels: selectedChannels,
      };

      if (accountTokenForWizard) {
        const res = await apiRequest<AuthResponsePayload>('/auth/create-workspace', {
          method: 'POST',
          token: accountTokenForWizard,
          body: {
            company_name: companyName.trim(),
            tenant_slug: finalSlug,
            admin_name: adminName.trim(),
            phone: phone.trim(),
            industry: domainKey,
            seed_demo_leads: false,
            custom_pipeline_name: selectedDomain.pipelineName,
            custom_settings: customSettings,
          },
        });
        finishWorkspaceEntry(res, 'google', workEmail.trim());
      } else {
        const res = await apiRequest<AuthResponsePayload>('/auth/register', {
          method: 'POST',
          body: {
            company_name: companyName.trim(),
            tenant_slug: finalSlug,
            admin_name: adminName.trim(),
            work_email: workEmail.trim(),
            phone: phone.trim(),
            password,
            industry: domainKey,
            seed_demo_leads: false,
            custom_pipeline_name: selectedDomain.pipelineName,
            custom_settings: customSettings,
            zalo_config: pendingZaloBot
              ? { bot_name: pendingZaloBot.bot_name, chat_id: pendingZaloBot.chat_id }
              : undefined,
          },
        });
        finishWorkspaceEntry(res, 'password', workEmail.trim());
      }
    } catch (err: unknown) {
      setErrorMsg(
        getErrorMessage(err, 'Không thể khởi tạo hệ thống. Vui lòng kiểm tra lại thông tin.')
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg(null);
    try {
      const res = await apiRequest<AuthResponsePayload>('/auth/login', {
        method: 'POST',
        body: {
          email: loginEmail.trim(),
          password: loginPassword,
        },
      });
      handleAuthDiscoveryResponse(res, 'password', loginEmail.trim());
    } catch (err: unknown) {
      setErrorMsg(
        getErrorMessage(err, 'Đăng nhập thất bại. Vui lòng kiểm tra Email và Mật khẩu.')
      );
    } finally {
      setSubmitting(false);
    }
  };

  const executeGoogleLogin = async (payload: {
    credential?: string;
    id_token?: string;
    email?: string;
    full_name?: string;
  }) => {
    setGoogleLoading(true);
    setErrorMsg(null);
    try {
      const bodyPayload = {
        ...payload,
        id_token: payload.id_token || payload.credential,
        credential: payload.credential || payload.id_token,
      };
      let res: AuthResponsePayload;
      try {
        res = await apiRequest<AuthResponsePayload>('/auth/google', {
          method: 'POST',
          body: bodyPayload,
        });
      } catch {
        // Fallback to /auth/google-login for older router alias compatibility
        res = await apiRequest<AuthResponsePayload>('/auth/google-login', {
          method: 'POST',
          body: bodyPayload,
        });
      }
      setGoogleModalOpen(false);
      handleAuthDiscoveryResponse(res, 'google', payload.email);
    } catch (err: unknown) {
      setErrorMsg(getErrorMessage(err, 'Đăng nhập bằng Google thất bại.'));
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleGoogleButtonClick = () => {
    setErrorMsg(null);
    const activeClientId = (
      googleClientId ||
      (import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined) ||
      '641158233158-nsg8a8tdsj3fdgb34dc9tugm8god7tho.apps.googleusercontent.com'
    ).trim();

    const g = (window as GoogleIdentityWindow).google?.accounts?.id;
    if (!g) {
      setGoogleInputEmail((prev) => prev || loginEmail.trim() || workEmail.trim());
      setGoogleInputName((prev) => prev || adminName.trim());
      setGoogleModalOpen(true);
      return;
    }

    g.initialize({
      client_id: activeClientId,
      auto_select: false,
      callback: (resp: { credential?: string }) => {
        if (!resp?.credential) {
          setErrorMsg('Bạn đã hủy hoặc chưa cấp quyền Google.');
          return;
        }
        void executeGoogleLogin({ credential: resp.credential, id_token: resp.credential });
      },
    });
    g.prompt((notification) => {
      if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
        setGoogleInputEmail((prev) => prev || loginEmail.trim() || workEmail.trim());
        setGoogleInputName((prev) => prev || adminName.trim());
        setGoogleModalOpen(true);
      }
    });
  };

  const handleSelectDiscoveredWorkspace = async (slug: string) => {
    if (!authDiscovery) return;
    setSwitchingSlug(slug);
    setErrorMsg(null);
    try {
      const res = await apiRequest<AuthResponsePayload>('/auth/switch-workspace', {
        method: 'POST',
        token: authDiscovery.accessToken,
        body: { tenant_slug: slug },
      });
      finishWorkspaceEntry(res, authDiscovery.user.auth_provider, authDiscovery.user.email);
    } catch (err: unknown) {
      setErrorMsg(getErrorMessage(err, 'Không thể mở Workspace đã chọn.'));
    } finally {
      setSwitchingSlug(null);
    }
  };

  const handleQuickCreateFirstWorkspace = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authDiscovery) return;
    if (!quickWorkspaceCompany.trim() || quickWorkspaceCompany.trim().length < 2) {
      setErrorMsg('Vui lòng nhập Tên doanh nghiệp hoặc Đội Sale.');
      return;
    }
    setSubmitting(true);
    setErrorMsg(null);
    try {
      const selectedDomain =
        BUSINESS_DOMAINS.find((d) => d.key === quickWorkspaceIndustry) || BUSINESS_DOMAINS[0];
      const autoSlug = `${slugifyVietnamese(quickWorkspaceCompany.trim()) || 'ws'}-${autoSlugSalt}`;
      const res = await apiRequest<AuthResponsePayload>('/auth/create-workspace', {
        method: 'POST',
        token: authDiscovery.accessToken,
        body: {
          company_name: quickWorkspaceCompany.trim(),
          tenant_slug: autoSlug,
          admin_name: authDiscovery.user.full_name,
          phone: quickWorkspacePhone.trim() || '0900000000',
          industry: quickWorkspaceIndustry,
          seed_demo_leads: false,
          custom_pipeline_name: selectedDomain.pipelineName,
        },
      });
      finishWorkspaceEntry(res, authDiscovery.user.auth_provider, authDiscovery.user.email);
    } catch (err: unknown) {
      setErrorMsg(getErrorMessage(err, 'Không thể khởi tạo Workspace mới.'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleStartCustom3StepFromDiscovery = () => {
    if (!authDiscovery) return;
    setAccountTokenForWizard(authDiscovery.accessToken);
    setAdminName(authDiscovery.user.full_name);
    setWorkEmail(authDiscovery.user.email);
    setPhone(quickWorkspacePhone || '');
    setCompanyName(quickWorkspaceCompany || '');
    if (quickWorkspaceCompany.trim()) {
      const base = slugifyVietnamese(quickWorkspaceCompany.trim()) || 'ws';
      setTenantSlug(`${base.slice(0, 27)}-${autoSlugSalt}`);
    }
    setAuthDiscovery(null);
    setAuthMode('register');
    setStep(1);
    setErrorMsg(null);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Không gian khởi tạo và kết nối Auto Data"
      className="fixed inset-0 z-[120] w-full h-[100dvh] bg-[#F8F9FA] text-slate-900 flex flex-col overflow-hidden"
    >
      <LuxuryGoldBackdrop />

      {/* Top Full-Screen Header Bar — Unified DOMATION Swiss Glass Style */}
      <header className="relative z-20 shrink-0 h-16 px-4 sm:px-8 border-b border-slate-200/80 bg-white/85 backdrop-blur-xl flex items-center justify-between md:grid md:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] gap-3">
        <div className="flex items-center gap-3 min-w-0 relative md:justify-self-start">
          <DomationLogoMark className="w-9 h-9 rounded-xl shadow-sm shrink-0" />
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm sm:text-base text-slate-900 tracking-tight truncate">
                DOMATION<span className="text-[#1E40FF]">.NET</span>
              </span>
              <span className="hidden lg:inline-flex items-center gap-1 rounded-full bg-blue-50 border border-blue-200 px-2.5 py-0.5 text-[11px] font-semibold text-[#1E40FF] whitespace-nowrap">
                Auto Data
              </span>
            </div>
            <p className="text-[11px] text-slate-500 truncate">
              {`Miễn phí ${catalog.trial_duration_months} tháng đầu • Gia hạn từ ${(catalog.base_monthly_price_vnd / 1000).toFixed(0)}k/tháng (-${catalog.annual_discount_pct}%/năm)`}
            </p>
          </div>
        </div>

        {/* Center Mode Switcher */}
        <div className="hidden md:flex items-center gap-1.5 bg-slate-100/80 border border-slate-200/70 p-1 rounded-full shrink-0 md:justify-self-center">
          <button
            type="button"
            onClick={() => {
              setAuthDiscovery(null);
              setAccountTokenForWizard(null);
              setAuthMode('register');
              setErrorMsg(null);
            }}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
              authMode === 'register' && !authDiscovery
                ? 'ql-pill-tab-active'
                : 'text-slate-600 hover:text-[#1E40FF]'
            }`}
          >
            Khởi tạo mới ({catalog.trial_duration_months} tháng 0đ)
          </button>
          <button
            type="button"
            onClick={() => {
              setAuthDiscovery(null);
              setAccountTokenForWizard(null);
              setAuthMode('login');
              setErrorMsg(null);
            }}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
              authMode === 'login' || Boolean(authDiscovery)
                ? 'ql-pill-tab-active'
                : 'text-slate-600 hover:text-[#1E40FF]'
            }`}
          >
            Đăng nhập Workspace
          </button>
        </div>

        <div className="flex items-center gap-2 shrink-0 md:justify-self-end">
          <button
            type="button"
            onClick={() => openInAppTour()}
            className="inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50/90 px-3 py-1.5 text-xs font-semibold text-[#1E40FF] hover:bg-blue-100 transition-colors cursor-pointer whitespace-nowrap"
          >
            <Sparkles className="w-3.5 h-3.5 shrink-0" />
            <span className="hidden sm:inline">Tour hướng dẫn</span>
            <span className="sm:hidden">?</span>
          </button>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng cửa sổ thiết lập"
            className="ql-btn-outline rounded-full px-3.5 py-1.5 text-xs cursor-pointer whitespace-nowrap"
          >
            <X className="w-4 h-4 shrink-0" />
            <span>Đóng</span>
          </button>
        </div>
      </header>

      {/* Mobile Mode Sub-bar */}
      <div className="relative z-10 md:hidden shrink-0 px-4 py-2 bg-white/85 backdrop-blur-md border-b border-slate-200 flex gap-2">
        <button
          type="button"
          onClick={() => {
            setAuthDiscovery(null);
            setAccountTokenForWizard(null);
            setAuthMode('register');
          }}
          className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold whitespace-nowrap ${
            authMode === 'register' && !authDiscovery
              ? 'ql-pill-tab-active rounded-xl'
              : 'bg-slate-100 text-slate-600'
          }`}
        >
          Tạo mới ({catalog.trial_duration_months} tháng 0đ)
        </button>
        <button
          type="button"
          onClick={() => {
            setAuthDiscovery(null);
            setAccountTokenForWizard(null);
            setAuthMode('login');
          }}
          className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold whitespace-nowrap ${
            authMode === 'login' || Boolean(authDiscovery)
              ? 'ql-pill-tab-active rounded-xl'
              : 'bg-slate-100 text-slate-600'
          }`}
        >
          Đăng nhập
        </button>
      </div>

      {/* Main Scrollable Canvas */}
      <div className="relative z-10 flex-1 overflow-y-auto flex flex-col">
        <div className="max-w-5xl w-full flex-1 flex flex-col mx-auto px-4 sm:px-8 py-7 sm:py-10 gap-6">
          {errorMsg && (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800 flex items-center justify-between gap-3">
              <span>{errorMsg}</span>
              <button
                type="button"
                onClick={() => setErrorMsg(null)}
                className="text-xs font-bold text-rose-600 hover:underline shrink-0 whitespace-nowrap"
              >
                Ẩn
              </button>
            </div>
          )}

          {/* MODE 1: 3-STEP ONBOARDING WIZARD */}
          {authMode === 'register' && !authDiscovery && (
            <div className="space-y-8">
              {/* Stepper Indicator */}
              <div
                data-tour="setup-stepper"
                className="flex items-center justify-between gap-3 max-w-3xl mx-auto overflow-x-auto rounded-2xl bg-white/85 backdrop-blur-xl border border-slate-200/80 shadow-xs px-4 sm:px-6 py-3.5"
              >
                {[
                  {
                    n: 1 as const,
                    label: 'Tài khoản & Tổ chức',
                    reqLabel: 'Bắt buộc',
                    dotTone: 'bg-rose-500',
                    reqTone: 'bg-rose-50/55 border border-rose-200/60 text-rose-700',
                  },
                  {
                    n: 2 as const,
                    label: 'Quy tắc Chia Vòng',
                    reqLabel: 'Tùy chọn',
                    dotTone: 'bg-amber-500',
                    reqTone: 'bg-amber-50/55 border border-amber-200/60 text-amber-800',
                  },
                  {
                    n: 3 as const,
                    label: 'Zalo Bot & Kênh ngoài',
                    reqLabel: 'Tùy chọn',
                    dotTone: 'bg-emerald-500',
                    reqTone: 'bg-emerald-50/60 border border-emerald-200/65 text-emerald-700',
                  },
                ].map((s, idx) => {
                  const active = step === s.n;
                  const done = step > s.n;
                  return (
                    <React.Fragment key={s.n}>
                      <button
                        type="button"
                        onClick={() => {
                          if (s.n === 1 || validateStep1()) setStep(s.n);
                        }}
                        className="flex items-center gap-3 text-left cursor-pointer group shrink-0"
                      >
                        <span
                          className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold transition-all shrink-0 ${
                            done
                              ? 'bg-emerald-600 text-white shadow-2xs'
                              : active
                                ? 'bg-[#1E40FF] text-white ring-4 ring-blue-100/80 shadow-sm'
                                : 'bg-slate-100 text-slate-500 border border-slate-200/70'
                          }`}
                        >
                          {done ? <Check className="w-4 h-4" /> : s.n}
                        </span>
                        <div className="flex flex-col">
                          <span
                            className={`text-xs sm:text-sm font-semibold whitespace-nowrap ${
                              active ? 'text-slate-900' : 'text-slate-500 group-hover:text-slate-800'
                            }`}
                          >
                            {s.label}
                          </span>
                          <span
                            className={`self-start inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold whitespace-nowrap mt-0.5 ${s.reqTone}`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${s.dotTone} shrink-0`} />
                            <span>{s.reqLabel}</span>
                          </span>
                        </div>
                      </button>
                      {idx < 2 && (
                        <div className="flex-1 min-w-6 h-px bg-slate-200/80 mx-2 hidden sm:block" />
                      )}
                    </React.Fragment>
                  );
                })}
              </div>

              {/* STEP 1: Required Org & Admin Info + Optional Domain Preset */}
              {step === 1 && (
                <div className="space-y-6">
                  <div
                    data-tour="setup-org-form"
                    className="inkica-glass-card rounded-[28px] p-5 sm:p-8 space-y-6"
                  >
                    <div className="flex items-center justify-between gap-2 pb-3 border-b border-slate-200/75">
                      <span className="text-xs font-semibold uppercase tracking-wider text-slate-700">
                        Thông tin khởi tạo tài khoản Quản trị
                      </span>
                      <div className="flex items-center gap-2 shrink-0">
                        <AutoDataHelpTrigger topic="billing_1m_trial" onOpenTour={openInAppTour} />
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-50/55 border border-rose-200/60 px-2.5 py-0.5 text-[10px] font-semibold text-rose-700 whitespace-nowrap">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
                          <span>Bắt buộc (*)</span>
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-5 gap-y-4">
                      <div className="flex flex-col justify-between gap-1.5">
                        <div className="flex items-center justify-between gap-2 min-h-[18px]">
                          <label className="text-xs font-semibold leading-4 text-slate-700">
                            Tên doanh nghiệp / Đội Sale *
                          </label>
                        </div>
                        <input
                          type="text"
                          value={companyName}
                          onChange={(e) => handleCompanyNameChange(e.target.value)}
                          placeholder="Nhập tên doanh nghiệp hoặc tên đội Sale của bạn"
                          className="w-full h-11 rounded-xl border border-slate-200 bg-white px-3.5 text-sm leading-5 focus:border-[#1E40FF] focus:outline-none focus:ring-2 focus:ring-blue-100"
                        />
                      </div>

                      <div className="flex flex-col justify-between gap-1.5">
                        <div className="flex items-center justify-between gap-2 min-h-[18px]">
                          <label className="text-xs font-semibold leading-4 text-slate-700">
                            Họ tên Quản trị viên *
                          </label>
                        </div>
                        <input
                          type="text"
                          value={adminName}
                          onChange={(e) => setAdminName(e.target.value)}
                          placeholder="Nhập họ và tên người phụ trách quản trị"
                          className="w-full h-11 rounded-xl border border-slate-200 bg-white px-3.5 text-sm leading-5 focus:border-[#1E40FF] focus:outline-none focus:ring-2 focus:ring-blue-100"
                        />
                      </div>

                      <div className="flex flex-col justify-between gap-1.5">
                        <div className="flex items-center justify-between gap-2 min-h-[18px]">
                          <label className="text-xs font-semibold leading-4 text-slate-700">
                            Số điện thoại liên hệ / Zalo *
                          </label>
                        </div>
                        <input
                          type="tel"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          placeholder="Nhập số điện thoại hoặc Zalo đang sử dụng"
                          className="w-full h-11 rounded-xl border border-slate-200 bg-white px-3.5 text-sm leading-5 focus:border-[#1E40FF] focus:outline-none focus:ring-2 focus:ring-blue-100"
                        />
                      </div>

                      <div className="flex flex-col justify-between gap-1.5">
                        <div className="flex items-center justify-between gap-2 min-h-[18px]">
                          <label className="text-xs font-semibold leading-4 text-slate-700">
                            Email quản trị *
                          </label>
                        </div>
                        <input
                          type="email"
                          value={workEmail}
                          onChange={(e) => setWorkEmail(e.target.value)}
                          placeholder="Nhập email nhận thông tin tài khoản và cảnh báo"
                          className="w-full h-11 rounded-xl border border-slate-200 bg-white px-3.5 text-sm leading-5 focus:border-[#1E40FF] focus:outline-none focus:ring-2 focus:ring-blue-100"
                        />
                      </div>

                      <div className="flex flex-col justify-between gap-1.5">
                        <div className="flex items-center justify-between gap-2 min-h-[18px]">
                          <label className="text-xs font-semibold leading-4 text-slate-700">
                            {accountTokenForWizard
                              ? 'Mật khẩu dự phòng (tùy chọn — đã xác thực Google)'
                              : 'Mật khẩu khởi tạo (tối thiểu 8 ký tự) *'}
                          </label>
                        </div>
                        <input
                          type="password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder={
                            accountTokenForWizard
                              ? 'Có thể để trống hoặc đặt thêm mật khẩu riêng'
                              : 'Nhập mật khẩu đăng nhập (ít nhất 8 ký tự)'
                          }
                          className="w-full h-11 rounded-xl border border-slate-200 bg-white px-3.5 text-sm leading-5 focus:border-[#1E40FF] focus:outline-none focus:ring-2 focus:ring-blue-100"
                        />
                      </div>

                      <div className="flex flex-col justify-between gap-1.5">
                        <div className="flex items-center justify-between gap-2 min-h-[18px]">
                          <label className="text-xs font-semibold leading-4 text-slate-700">
                            {accountTokenForWizard
                              ? 'Xác nhận mật khẩu dự phòng (tùy chọn)'
                              : 'Xác nhận mật khẩu khởi tạo *'}
                          </label>
                          {confirmPassword.length > 0 && (
                            <span
                              className={`text-[11px] font-semibold leading-4 whitespace-nowrap ${
                                password === confirmPassword ? 'text-emerald-600' : 'text-rose-600'
                              }`}
                            >
                              {password === confirmPassword ? '✓ Khớp' : '✕ Chưa khớp'}
                            </span>
                          )}
                        </div>
                        <input
                          type="password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder={
                            accountTokenForWizard
                              ? 'Nhập lại nếu bạn đặt mật khẩu dự phòng'
                              : 'Nhập lại mật khẩu khởi tạo để xác nhận'
                          }
                          className="w-full h-11 rounded-xl border border-slate-200 bg-white px-3.5 text-sm leading-5 focus:border-[#1E40FF] focus:outline-none focus:ring-2 focus:ring-blue-100"
                        />
                      </div>
                    </div>

                    {/* Optional Business Preset Picker */}
                    <div className="pt-4 border-t border-slate-200/75 space-y-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <label className="text-xs font-semibold text-slate-700">
                          Mẫu phễu gợi ý ban đầu (Mặc định: Đa ngành / Đội Sale Nội Bộ)
                        </label>
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50/55 border border-amber-200/60 px-2.5 py-0.5 text-[10px] font-semibold text-amber-800 whitespace-nowrap">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                          <span>Tùy chọn • Đổi tự do sau</span>
                        </span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {BUSINESS_DOMAINS.map((item) => {
                          const Icon = item.icon;
                          const selected = domainKey === item.key;
                          return (
                            <button
                              key={item.key}
                              type="button"
                              onClick={() => setDomainKey(item.key)}
                              className={`rounded-2xl border p-4 text-left transition-all cursor-pointer flex items-start gap-3.5 ${
                                selected
                                  ? 'border-[#1E40FF] bg-[#F4F8FF]/90 ring-2 ring-blue-100/80 shadow-2xs'
                                  : 'border-slate-200/80 bg-white/95 hover:border-slate-300'
                              }`}
                            >
                              <div
                                className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                                  selected
                                    ? 'bg-[#1E40FF] text-white shadow-2xs'
                                    : 'bg-slate-50 border border-slate-200/75 text-slate-700'
                                }`}
                              >
                                <Icon className="w-4 h-4" />
                              </div>
                              <div className="min-w-0">
                                <div className="text-sm font-semibold text-slate-900 leading-snug">
                                  {item.label}
                                </div>
                                <div className="text-xs text-slate-500 mt-1 leading-relaxed">
                                  {item.subtitle}
                                </div>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-200/75">
                      <div className="flex items-center gap-3 pt-2">
                        <button
                          type="button"
                          role="switch"
                          aria-checked={agreeTerms}
                          aria-label="Đồng ý với Điều khoản sử dụng và Chính sách bảo mật dữ liệu của DOMATION"
                          onClick={() => setAgreeTerms((prev) => !prev)}
                          className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 ${
                            agreeTerms ? 'bg-[#1E40FF]' : 'bg-slate-300'
                          }`}
                        >
                          <span
                            aria-hidden="true"
                            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ${
                              agreeTerms ? 'translate-x-5' : 'translate-x-0'
                            }`}
                          />
                        </button>
                        <p className="text-xs text-slate-600 leading-relaxed">
                          Bằng việc khởi tạo không gian làm việc, bạn đồng ý với{' '}
                          {onOpenLegal ? (
                            <>
                              <button
                                type="button"
                                onClick={() => onOpenLegal('terms')}
                                className="font-semibold text-blue-600 hover:underline cursor-pointer"
                              >
                                Điều khoản sử dụng
                              </button>{' '}
                              và{' '}
                              <button
                                type="button"
                                onClick={() => onOpenLegal('privacy')}
                                className="font-semibold text-blue-600 hover:underline cursor-pointer"
                              >
                                Chính sách bảo mật dữ liệu
                              </button>
                            </>
                          ) : (
                            <>
                              <span className="font-semibold text-blue-600">Điều khoản sử dụng</span>{' '}
                              và{' '}
                              <span className="font-semibold text-blue-600">
                                Chính sách bảo mật dữ liệu
                              </span>
                            </>
                          )}{' '}
                          của DOMATION.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 2: Optional Router Rules & Agency Masking */}
              {step === 2 && (
                <div className="space-y-7">
                  <div className="text-center max-w-2xl mx-auto space-y-2.5">
                    <div className="inline-flex flex-wrap items-center justify-center gap-2">
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50/55 border border-amber-200/60 px-3 py-1 text-[11px] font-semibold text-amber-800 whitespace-nowrap">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                        <span>BƯỚC 2: TÙY CHỌN • ĐÃ CÀI SẴN MẶC ĐỊNH TỐI ƯU</span>
                      </span>
                      <AutoDataHelpTrigger topic="round_robin_formula" onOpenTour={openInAppTour} />
                    </div>
                    <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 leading-snug">
                      Quy tắc Vòng Chia Số — Mặc định cho từng Sale nội bộ
                    </h2>
                    <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
                      Hệ thống mặc định chia thẳng cho từng nhân viên Sale trong công ty. Bạn có thể giữ nguyên hoặc bấm bỏ qua để vào Workspace ngay.
                    </p>
                  </div>

                  <div className="inkica-glass-card rounded-[28px] p-5 sm:p-8 space-y-8">
                    <div
                      data-tour="setup-router-internal"
                      className="rounded-2xl border border-blue-200/80 bg-[#F4F8FF]/75 p-5 space-y-4"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-xl bg-[#1E40FF] text-white flex items-center justify-center shrink-0">
                            <Users className="w-5 h-5" />
                          </div>
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-sm font-bold text-slate-950">
                                Đối tượng nhận Lead mặc định: Từng Chuyên Viên Sale Nội Bộ
                              </span>
                              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50/75 border border-emerald-200/70 px-2.5 py-0.5 text-[10px] font-semibold text-emerald-700 whitespace-nowrap">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                                <span>Mặc định tối ưu</span>
                              </span>
                              <AutoDataHelpTrigger
                                topic="internal_sale_default"
                                onOpenTour={openInAppTour}
                              />
                            </div>
                            <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                              Sale nội bộ nhận trực tiếp khách hàng kèm đầy đủ Số Điện Thoại để gọi tư vấn ngay tức thì.
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="pt-3 border-t border-blue-200/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-start gap-2.5">
                          <EyeOff className="w-4 h-4 text-slate-600 shrink-0 mt-0.5" />
                          <div className="text-xs text-slate-700 leading-relaxed">
                            <strong>Tùy chọn mở rộng:</strong> Có chia thêm giỏ hàng cho Đại lý liên kết / Cộng tác viên F1 bên ngoài công ty (Tự động che SĐT dạng{' '}
                            <code className="font-mono">0912***678</code>)?
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setIsExternalAgency((v) => !v)}
                          className={`self-start sm:self-center rounded-full px-4 py-2 text-xs font-bold transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                            isExternalAgency ? 'ql-pill-tab-active rounded-full' : 'ql-btn-outline rounded-full'
                          }`}
                        >
                          {isExternalAgency
                            ? 'Đại lý F1: ĐANG BẬT (Che SĐT)'
                            : 'Đại lý F1: TẮT (Chỉ Sale nội bộ)'}
                        </button>
                      </div>
                    </div>

                    <div data-tour="setup-router-algo" className="space-y-3 rounded-2xl p-1">
                      <div className="flex items-center gap-2">
                        <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                          1. Thuật toán phân bổ khách hàng mới
                        </label>
                        <AutoDataHelpTrigger topic="round_robin_formula" onOpenTour={openInAppTour} />
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                        {ROUTER_MODES.map((m) => {
                          const Icon = m.icon;
                          const selected = routerMode === m.key;
                          return (
                            <button
                              key={m.key}
                              type="button"
                              onClick={() => setRouterMode(m.key)}
                              className={`rounded-2xl border p-4 text-left transition-all cursor-pointer flex items-start gap-3.5 ${
                                selected
                                  ? 'border-blue-600 bg-blue-50/50 ring-2 ring-blue-100'
                                  : 'border-slate-200 bg-white hover:border-slate-300'
                              }`}
                            >
                              <div
                                className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                                  selected ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-700'
                                }`}
                              >
                                <Icon className="w-5 h-5" />
                              </div>
                              <div className="space-y-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="text-sm font-semibold text-slate-900">{m.title}</span>
                                  {m.badge && (
                                    <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-bold text-blue-700 whitespace-nowrap">
                                      {m.badge}
                                    </span>
                                  )}
                                </div>
                                <p className="text-xs text-slate-500 leading-relaxed">{m.desc}</p>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="space-y-3 rounded-2xl p-1">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <div className="flex items-center gap-2">
                          <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                            2. Chính sách xử lý trùng Số Điện Thoại
                          </label>
                          <AutoDataHelpTrigger topic="dedupe_180d" onOpenTour={openInAppTour} />
                        </div>
                        <div className="flex items-center gap-2 text-xs">
                          <span className="text-slate-600">Chu kỳ quét trùng:</span>
                          <input
                            type="number"
                            min={0}
                            max={365}
                            value={dedupDays}
                            onChange={(e) => setDedupDays(Math.max(0, Number(e.target.value) || 0))}
                            className="w-20 rounded-lg border border-slate-300 px-2.5 py-1 text-center font-semibold text-slate-900"
                          />
                          <span className="text-slate-600">ngày</span>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                        {DEDUP_POLICIES.map((d) => {
                          const Icon = d.icon;
                          const selected = dedupPolicy === d.key;
                          return (
                            <button
                              key={d.key}
                              type="button"
                              onClick={() => setDedupPolicy(d.key)}
                              className={`rounded-2xl border p-4 text-left transition-all cursor-pointer flex items-start gap-3.5 ${
                                selected
                                  ? 'border-blue-600 bg-blue-50/50 ring-2 ring-blue-100'
                                  : 'border-slate-200 bg-white hover:border-slate-300'
                              }`}
                            >
                              <div
                                className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                                  selected ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-700'
                                }`}
                              >
                                <Icon className="w-5 h-5" />
                              </div>
                              <div className="space-y-1">
                                <div className="text-sm font-semibold text-slate-900">{d.title}</div>
                                <p className="text-xs text-slate-500 leading-relaxed">{d.desc}</p>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="pt-1">
                      <button
                        type="button"
                        onClick={() => setSlaAutoRecall((v) => !v)}
                        className={`w-full rounded-2xl border p-4 text-left flex items-start gap-3.5 cursor-pointer transition-all ${
                          slaAutoRecall
                            ? 'border-[#1E40FF] bg-blue-50/50 ring-2 ring-blue-100'
                            : 'border-slate-200 bg-white'
                        }`}
                      >
                        <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0">
                          <Clock className="w-5 h-5" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-semibold text-slate-900">
                                Tùy chọn thu hồi SLA nếu Sale bỏ sót (Mặc định Tắt — Chia thẳng)
                              </span>
                              <AutoDataHelpTrigger topic="sla_recall" onOpenTour={openInAppTour} />
                            </div>
                            <span
                              className={`text-xs font-bold whitespace-nowrap ${
                                slaAutoRecall ? 'text-emerald-600' : 'text-slate-500'
                              }`}
                            >
                              {slaAutoRecall ? 'ĐANG BẬT' : 'TẮT (CHIA THẲNG)'}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                            Mặc định chia là giao thẳng qua Bot cho Sale tới lượt, không thu hồi. Chỉ bật tùy chọn này nếu đội ngũ cần kiểm soát thu hồi tự động khi Sale không phản hồi.
                          </p>
                        </div>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 3: Channels & Zalo/Telegram Bot Verification + Trial Transparency */}
              {step === 3 && (
                <div className="space-y-7">
                  <div className="text-center max-w-2xl mx-auto space-y-2.5">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50/60 border border-emerald-200/65 px-3 py-1 text-[11px] font-semibold text-emerald-700 whitespace-nowrap">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                      <span>BƯỚC 3: TÙY CHỌN • KẾT NỐI KÊNH NGOÀI &amp; ZALO BOT</span>
                    </span>
                    <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 leading-snug">
                      Kênh kết nối &amp; Xác thực Bot báo số
                    </h2>
                    <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
                      Cổng Webhook trung tâm được cấp tự động. Các kênh Bot, Meta CAPI và Google Sheets là tùy chọn — bạn có thể kiểm tra ngay bên dưới hoặc bỏ qua vào hệ thống!
                    </p>
                  </div>

                  <div className="inkica-glass-card rounded-[28px] p-5 sm:p-8 space-y-6">
                    <div
                      data-tour="setup-channels"
                      className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 rounded-2xl p-1"
                    >
                      {CHANNEL_OPTIONS.map((ch) => {
                        const Icon = ch.icon;
                        const active = selectedChannels.includes(ch.key);
                        return (
                          <div
                            key={ch.key}
                            onClick={() => toggleChannel(ch.key)}
                            className={`rounded-2xl border p-4 text-left transition-all flex items-start gap-3.5 ${
                              ch.required ? 'cursor-default' : 'cursor-pointer'
                            } ${
                              active
                                ? 'border-[#1E40FF] bg-[#F4F8FF]/90 ring-2 ring-blue-100/80'
                                : 'border-slate-200/80 bg-white/95 hover:border-slate-300'
                            }`}
                          >
                            <div
                              className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                                active
                                  ? 'bg-[#1E40FF] text-white shadow-2xs'
                                  : 'bg-slate-50 border border-slate-200/75 text-slate-700'
                              }`}
                            >
                              <Icon className="w-4 h-4" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-2 flex-wrap">
                                <span className="text-sm font-semibold text-slate-900">{ch.title}</span>
                                <div className="flex items-center gap-1.5">
                                  <span
                                    className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold whitespace-nowrap border ${
                                      ch.required
                                        ? 'bg-rose-50/55 border-rose-200/60 text-rose-700'
                                        : 'bg-amber-50/55 border-amber-200/60 text-amber-800'
                                    }`}
                                  >
                                    <span
                                      className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                                        ch.required ? 'bg-rose-500' : 'bg-amber-500'
                                      }`}
                                    />
                                    <span>{ch.required ? 'Bắt buộc • Cấp sẵn' : 'Tùy chọn'}</span>
                                  </span>
                                  {ch.helpTopic && (
                                    <AutoDataHelpTrigger topic={ch.helpTopic} onOpenTour={openInAppTour} />
                                  )}
                                </div>
                              </div>
                              <p className="text-xs text-slate-500 mt-1 leading-relaxed">{ch.desc}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <div data-tour="setup-zalo-guide">
                      <AutoDataZaloBotGuide
                        compact
                        savedZaloBot={pendingZaloBot}
                        onVerified={(saved) => setPendingZaloBot(saved)}
                        onFastSkip={() => void handleRegisterSubmit()}
                        fastSkipLabel="Tùy chọn — Tạm bỏ qua & vào Workspace ngay"
                        onOpenTour={openInAppTour}
                      />
                    </div>

                    <div className="rounded-2xl border border-blue-200 bg-blue-50/60 p-5 space-y-2.5">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
                          <ShieldCheck className="w-5 h-5 text-blue-600 shrink-0" />
                          <span>Chính sách Dùng Thử &amp; Gia Hạn Minh Bạch DOMATION</span>
                        </div>
                        <AutoDataHelpTrigger topic="billing_1m_trial" onOpenTour={openInAppTour} />
                      </div>
                      <ul className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-slate-700 pt-1">
                        <li className="rounded-xl bg-white p-3.5 border border-blue-100">
                          <div className="font-bold text-slate-900">
                            01. Miễn phí {catalog.trial_duration_months} tháng đầu
                          </div>
                          <div className="text-slate-500 mt-1 leading-relaxed">
                            Trọn vẹn {catalog.trial_duration_days} ngày trải nghiệm đầy đủ tính năng Auto Data.
                          </div>
                        </li>
                        <li className="rounded-xl bg-white p-3.5 border border-blue-100">
                          <div className="font-bold text-slate-900">
                            02. Gia hạn từ {(catalog.base_monthly_price_vnd / 1000).toFixed(0)}k/tháng
                          </div>
                          <div className="text-slate-500 mt-1 leading-relaxed">
                            Mua năm tiết kiệm {catalog.annual_discount_pct}% (chỉ{' '}
                            {catalog.plans[0]?.annual_monthly_equivalent_vnd.toLocaleString('vi-VN')}₫/tháng).
                          </div>
                        </li>
                        <li className="rounded-xl bg-white p-3.5 border border-blue-100">
                          <div className="font-bold text-slate-900">03. Lộ trình nâng cấp mở</div>
                          <div className="text-slate-500 mt-1 leading-relaxed">
                            Từ Standard (20 Sale &amp; 5 Quản lý) nâng 1-click lên Growth (85 Sale &amp; 15 Quản lý), CRM 360° hoặc ERP 5.0 giữ 100% dữ liệu.
                          </div>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* MODE 2: MULTI-WORKSPACE DISCOVERY OR FIRST-WORKSPACE QUICK CREATE */}
          {authDiscovery && (
            <div className="max-w-3xl w-full mx-auto space-y-6 my-auto">
              <div className="inkica-glass-card rounded-2xl p-4 sm:px-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  {authDiscovery.user.avatar_url ? (
                    <img
                      src={authDiscovery.user.avatar_url}
                      alt={authDiscovery.user.full_name}
                      className="w-10 h-10 rounded-full object-cover border border-slate-200 shrink-0"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#1E40FF] to-[#0284C7] text-white text-sm font-bold flex items-center justify-center shrink-0">
                      {(authDiscovery.user.full_name || authDiscovery.user.email || 'D')
                        .slice(0, 1)
                        .toUpperCase()}
                    </div>
                  )}
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-bold text-slate-900 truncate">
                        {authDiscovery.user.full_name}
                      </span>
                      <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 border border-slate-200 px-2.5 py-0.5 text-[10px] font-semibold text-slate-700 whitespace-nowrap">
                        {authDiscovery.user.auth_provider === 'google' ? (
                          <>
                            <GoogleLogoMark className="w-3 h-3" />
                            <span>Google Account</span>
                          </>
                        ) : (
                          <>
                            <Mail className="w-3 h-3 text-[#1E40FF]" />
                            <span>Email Workspace</span>
                          </>
                        )}
                      </span>
                    </div>
                    {authDiscovery.user.email && (
                      <p className="text-xs text-slate-500 truncate">{authDiscovery.user.email}</p>
                    )}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setAuthDiscovery(null);
                    setAuthMode('login');
                    setErrorMsg(null);
                  }}
                  className="ql-btn-outline rounded-full px-3.5 py-1.5 text-xs cursor-pointer whitespace-nowrap self-start sm:self-center"
                >
                  Đổi tài khoản khác
                </button>
              </div>

              {authDiscovery.workspaces.length > 0 ? (
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
                        Các Workspace của bạn ({authDiscovery.workspaces.length})
                      </h2>
                      <p className="text-xs sm:text-sm text-slate-500">
                        Chọn không gian làm việc muốn truy cập — không cần nhập mã Slug.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleStartCustom3StepFromDiscovery}
                      className="ql-btn-outline rounded-full px-4 py-2 text-xs cursor-pointer whitespace-nowrap self-start sm:self-center"
                    >
                      <PlusCircle className="w-3.5 h-3.5 text-[#1E40FF]" />
                      <span>Tạo Workspace mới</span>
                    </button>
                  </div>

                  <div
                    className={
                      authDiscovery.workspaces.length === 1
                        ? 'grid grid-cols-1 max-w-xl mx-auto gap-4'
                        : 'grid grid-cols-1 md:grid-cols-2 gap-4'
                    }
                  >
                    {authDiscovery.workspaces.map((ws) => {
                      const isOpening = switchingSlug === ws.slug;
                      const industryLabel = INDUSTRY_LABELS[ws.industry] || 'Đa Ngành / Tổng Hợp';
                      return (
                        <div
                          key={ws.slug}
                          className="inkica-glass-card rounded-3xl p-5 sm:p-6 flex flex-col justify-between gap-5 transition-all hover:border-[#1E40FF]/45"
                        >
                          <div className="space-y-3">
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex items-center gap-3 min-w-0">
                                <div className="w-11 h-11 rounded-2xl bg-blue-50 border border-blue-200/80 text-[#1E40FF] flex items-center justify-center shrink-0">
                                  <Building2 className="w-5 h-5" />
                                </div>
                                <div className="min-w-0">
                                  <h3 className="text-base font-bold text-slate-900 truncate">
                                    {ws.company_name}
                                  </h3>
                                  <p className="text-xs text-slate-500 truncate">{industryLabel}</p>
                                </div>
                              </div>

                              <span
                                className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[10px] font-semibold whitespace-nowrap shrink-0 ${
                                  ws.is_expired
                                    ? 'bg-rose-50/60 border-rose-200/70 text-rose-700'
                                    : ws.is_in_trial
                                      ? 'bg-blue-50/60 border-blue-200/70 text-[#1E40FF]'
                                      : 'bg-emerald-50/60 border-emerald-200/70 text-emerald-700'
                                }`}
                              >
                                <span
                                  className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                                    ws.is_expired
                                      ? 'bg-rose-500'
                                      : ws.is_in_trial
                                        ? 'bg-[#1E40FF]'
                                        : 'bg-emerald-500'
                                  }`}
                                />
                                <span>
                                  {ws.is_expired ? 'Hết hạn' : `Còn ${ws.days_remaining} ngày`}
                                </span>
                              </span>
                            </div>

                            <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-600">
                              <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 font-medium">
                                <Layers className="w-3 h-3 text-slate-500" />
                                <span>{ws.plan_name}</span>
                              </span>
                              <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 font-medium">
                                <UserCheck className="w-3 h-3 text-slate-500" />
                                <span>{ws.role === 'sale' ? 'Sale / Đại lý' : 'Quản trị viên'}</span>
                              </span>
                            </div>
                          </div>

                          <div className="pt-3 border-t border-slate-200/70 flex items-center justify-between gap-3">
                            <span className="text-[11px] font-mono text-slate-400 truncate">
                              /data/{ws.slug}
                            </span>
                            <button
                              type="button"
                              disabled={Boolean(switchingSlug)}
                              onClick={() => void handleSelectDiscoveredWorkspace(ws.slug)}
                              className="btn-inkica-primary rounded-full px-4 py-2 text-xs cursor-pointer disabled:opacity-60 whitespace-nowrap shrink-0"
                            >
                              {isOpening ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <ArrowRight className="w-3.5 h-3.5" />
                              )}
                              <span>Vào Workspace</span>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <form
                  onSubmit={handleQuickCreateFirstWorkspace}
                  className="max-w-lg w-full mx-auto inkica-glass-card rounded-3xl p-6 sm:p-8 space-y-5"
                >
                  <div className="space-y-1.5 text-center">
                    <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-200 text-[#1E40FF] flex items-center justify-center mx-auto mb-2">
                      <Sparkles className="w-6 h-6" />
                    </div>
                    <h2 className="text-xl font-bold text-slate-900">
                      Tạo Workspace đầu tiên trong 10 giây
                    </h2>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      Tài khoản <strong>{authDiscovery.user.email}</strong> chưa có Workspace nào. Nhập tên doanh nghiệp để kích hoạt miễn phí {catalog.trial_duration_months} tháng ngay.
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700">
                      Tên doanh nghiệp / Đội Sale *
                    </label>
                    <input
                      type="text"
                      required
                      value={quickWorkspaceCompany}
                      onChange={(e) => setQuickWorkspaceCompany(e.target.value)}
                      placeholder="Nhập tên doanh nghiệp hoặc đội nhóm của bạn"
                      className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm focus:border-[#1E40FF] focus:outline-none focus:ring-2 focus:ring-blue-100"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-700">Số điện thoại / Zalo</label>
                      <input
                        type="tel"
                        value={quickWorkspacePhone}
                        onChange={(e) => setQuickWorkspacePhone(e.target.value)}
                        placeholder="090x xxx xxx (tùy chọn)"
                        className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm focus:border-[#1E40FF] focus:outline-none focus:ring-2 focus:ring-blue-100"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-700">Ngành nghề</label>
                      <select
                        value={quickWorkspaceIndustry}
                        onChange={(e) => setQuickWorkspaceIndustry(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm focus:border-[#1E40FF] focus:outline-none focus:ring-2 focus:ring-blue-100"
                      >
                        {BUSINESS_DOMAINS.map((d) => (
                          <option key={d.key} value={d.key}>
                            {d.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="btn-inkica-primary w-full py-3 px-5 text-sm cursor-pointer disabled:opacity-60 whitespace-nowrap"
                  >
                    {submitting ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <ArrowRight className="w-4 h-4" />
                    )}
                    <span>Tạo Workspace &amp; Vào Ngay</span>
                  </button>

                  <div className="text-center pt-1">
                    <button
                      type="button"
                      onClick={handleStartCustom3StepFromDiscovery}
                      className="text-xs font-semibold text-[#1E40FF] hover:underline cursor-pointer"
                    >
                      Hoặc tùy chỉnh chi tiết 3 bước (Chia vòng, Zalo Bot) →
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* MODE 3: CENTERED FULL-SCREEN LOGIN — NO SLUG INPUT */}
          {authMode === 'login' && !authDiscovery && (
            <div className="max-w-md w-full mx-auto inkica-glass-card rounded-3xl p-6 sm:p-8 space-y-5 my-auto">
              <div className="space-y-1.5 text-center">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#1E40FF] to-[#0284C7] text-white shadow-[0_8px_20px_-4px_rgba(30,64,255,0.3)] flex items-center justify-center mx-auto mb-3">
                  <KeyRound className="w-6 h-6" />
                </div>
                <h2 className="text-xl font-bold text-slate-900">Đăng nhập không gian Auto Data</h2>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Chỉ cần Email hoặc Google — hệ thống tự hiển thị toàn bộ Workspace của bạn (không cần nhập Slug).
                </p>
              </div>

              <button
                type="button"
                disabled={googleLoading || submitting}
                onClick={handleGoogleButtonClick}
                className="w-full rounded-full border border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300 text-slate-800 font-semibold text-sm py-2.5 px-5 shadow-2xs flex items-center justify-center gap-2.5 transition-all cursor-pointer disabled:opacity-60 whitespace-nowrap"
              >
                {googleLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin text-[#1E40FF]" />
                ) : (
                  <GoogleLogoMark className="w-4 h-4 shrink-0" />
                )}
                <span>Tiếp tục với Google</span>
              </button>

              <div className="flex items-center gap-3">
                <div className="h-px flex-1 bg-slate-200/80" />
                <span className="text-[11px] font-medium text-slate-400 whitespace-nowrap">
                  Hoặc đăng nhập bằng Email
                </span>
                <div className="h-px flex-1 bg-slate-200/80" />
              </div>

              <form onSubmit={handleLoginSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">Email quản trị</label>
                  <input
                    type="email"
                    required
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="Nhập địa chỉ email đã đăng ký Workspace"
                    className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm focus:border-[#1E40FF] focus:outline-none focus:ring-2 focus:ring-blue-100"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">Mật khẩu</label>
                  <input
                    type="password"
                    required
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="Nhập mật khẩu đăng nhập"
                    className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm focus:border-[#1E40FF] focus:outline-none focus:ring-2 focus:ring-blue-100"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting || googleLoading}
                  className="btn-inkica-primary w-full py-3 px-5 text-sm cursor-pointer disabled:opacity-60 whitespace-nowrap"
                >
                  {submitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <ArrowRight className="w-4 h-4" />
                  )}
                  <span>Đăng nhập &amp; Hiện Workspace</span>
                </button>
              </form>
            </div>
          )}
        </div>
      </div>

      {/* Sticky Bottom Action Bar for 3-Step Registration Wizard */}
      {authMode === 'register' && !authDiscovery && (
        <footer className="relative z-10 shrink-0 border-t border-slate-200/80 bg-white/95 backdrop-blur-md px-4 sm:px-8 py-3">
          <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 sm:gap-3">
            <div className="hidden sm:flex items-center gap-3">
              {step > 1 ? (
                <button
                  type="button"
                  onClick={() => setStep((s) => (s === 3 ? 2 : 1))}
                  className="ql-btn-outline min-h-[44px] px-4 py-2 text-sm cursor-pointer whitespace-nowrap"
                >
                  <ArrowLeft className="w-4 h-4 shrink-0" />
                  <span>Quay lại</span>
                </button>
              ) : (
                <span className="text-xs font-medium text-slate-500 hidden xl:inline whitespace-nowrap">
                  Bước 1/3
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 sm:flex items-center sm:justify-end gap-2 sm:gap-2.5">
              {step > 1 ? (
                <button
                  type="button"
                  onClick={() => setStep((s) => (s === 3 ? 2 : 1))}
                  className="sm:hidden ql-btn-outline min-h-[44px] px-3 py-2 text-xs cursor-pointer whitespace-nowrap justify-center"
                >
                  <ArrowLeft className="w-4 h-4 shrink-0" />
                  <span>Quay lại</span>
                </button>
              ) : (
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => void handleRegisterSubmit()}
                  className="sm:hidden ql-btn-outline min-h-[44px] px-3 py-2 text-xs transition-colors cursor-pointer whitespace-nowrap disabled:opacity-60 justify-center"
                >
                  <span>Bỏ qua &amp; vào ngay</span>
                </button>
              )}

              <button
                type="button"
                disabled={submitting}
                onClick={() => void handleRegisterSubmit()}
                className="hidden sm:inline-flex ql-btn-outline min-h-[44px] px-4 py-2.5 text-sm transition-colors cursor-pointer whitespace-nowrap disabled:opacity-60"
              >
                <span>Bỏ qua &amp; vào ngay</span>
              </button>

              {step < 3 ? (
                <button
                  type="button"
                  onClick={() => {
                    if (step === 1 && !validateStep1()) return;
                    setErrorMsg(null);
                    setStep((s) => (s === 1 ? 2 : 3));
                  }}
                  className="btn-inkica-primary min-h-[44px] px-4 sm:px-5 py-2.5 text-xs sm:text-sm cursor-pointer whitespace-nowrap justify-center"
                >
                  <span>Tiếp theo</span>
                  <ArrowRight className="w-4 h-4 shrink-0" />
                </button>
              ) : (
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => void handleRegisterSubmit()}
                  className="btn-inkica-primary min-h-[44px] px-4 sm:px-5 py-2.5 text-xs sm:text-sm cursor-pointer disabled:opacity-60 whitespace-nowrap justify-center"
                >
                  {submitting ? (
                    <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                  )}
                  <span>Kích hoạt ngay</span>
                </button>
              )}
            </div>
            {step > 1 && (
              <button
                type="button"
                disabled={submitting}
                onClick={() => void handleRegisterSubmit()}
                className="sm:hidden w-full min-h-[44px] rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700"
              >
                Bỏ qua &amp; vào ngay
              </button>
            )}
          </div>
        </footer>
      )}

      {/* GOOGLE ACCOUNT CHOOSER OVERLAY (WHEN GOOGLE CLIENT ID NOT CONFIGURED) */}
      {googleModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Chọn tài khoản Google"
          className="fixed inset-0 z-[135] bg-slate-900/45 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4"
        >
          <div className="w-full max-w-md rounded-t-[26px] sm:rounded-3xl bg-white border border-slate-200 shadow-2xl p-5 sm:p-7 space-y-5 max-h-[92dvh] overflow-y-auto">
            <div className="sm:hidden flex justify-center -mt-1">
              <span className="w-10 h-1 rounded-full bg-slate-300" />
            </div>
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center shrink-0">
                  <GoogleLogoMark className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Đăng nhập bằng Google</h3>
                  <p className="text-xs text-slate-500">
                    Chọn tài khoản để tự động mở các Workspace của bạn
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setGoogleModalOpen(false)}
                aria-label="Đóng chọn tài khoản Google"
                className="w-11 h-11 sm:w-9 sm:h-9 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {recentGoogleAccounts.length > 0 && (
              <div className="space-y-2">
                <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  Tài khoản gần đây trên trình duyệt
                </div>
                <div className="space-y-1.5 max-h-44 overflow-y-auto">
                  {recentGoogleAccounts.map((acc) => (
                    <button
                      key={acc.email}
                      type="button"
                      disabled={googleLoading}
                      onClick={() =>
                        void executeGoogleLogin({
                          email: acc.email,
                          full_name: acc.full_name,
                        })
                      }
                      className="w-full rounded-2xl border border-slate-200 hover:border-[#1E40FF] hover:bg-blue-50/50 px-3.5 py-2.5 flex items-center justify-between gap-3 transition-all cursor-pointer text-left disabled:opacity-60"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#1E40FF] to-[#0284C7] text-white text-xs font-bold flex items-center justify-center shrink-0">
                          {acc.full_name.slice(0, 1).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-slate-900 truncate">
                            {acc.full_name}
                          </div>
                          <div className="text-[11px] text-slate-500 truncate">{acc.email}</div>
                        </div>
                      </div>
                      <ArrowRight className="w-4 h-4 text-slate-400 shrink-0" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            <form
              onSubmit={(e) => {
                e.preventDefault();
                void executeGoogleLogin({
                  email: googleInputEmail.trim(),
                  full_name: googleInputName.trim() || undefined,
                });
              }}
              className="space-y-3 pt-2 border-t border-slate-100"
            >
              <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                {recentGoogleAccounts.length > 0
                  ? 'Hoặc dùng tài khoản Google khác'
                  : 'Nhập tài khoản Google / Gmail công việc'}
              </div>
              <input
                type="email"
                required
                value={googleInputEmail}
                onChange={(e) => setGoogleInputEmail(e.target.value)}
                placeholder="tenban@gmail.com hoặc email Google Workspace"
                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm focus:border-[#1E40FF] focus:outline-none focus:ring-2 focus:ring-blue-100"
              />
              <input
                type="text"
                value={googleInputName}
                onChange={(e) => setGoogleInputName(e.target.value)}
                placeholder="Họ và tên hiển thị (tùy chọn)"
                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm focus:border-[#1E40FF] focus:outline-none focus:ring-2 focus:ring-blue-100"
              />
              <button
                type="submit"
                disabled={googleLoading}
                className="btn-inkica-primary w-full py-2.5 px-4 text-sm cursor-pointer disabled:opacity-60 whitespace-nowrap"
              >
                {googleLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <GoogleLogoMark className="w-4 h-4" />
                )}
                <span>Tiếp tục với Google</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* IN-APP SPOTLIGHT TOUR FOR 3-STEP SETUP */}
      <AutoDataSpotlightTour
        open={isOpen && tourOpen}
        steps={WIZARD_TOUR_STEPS}
        activeStepIndex={tourStepIdx}
        onStepChange={handleTourStepChange}
        onClose={() => setTourOpen(false)}
        onFinish={() => setTourOpen(false)}
      />
    </div>
  );
};
