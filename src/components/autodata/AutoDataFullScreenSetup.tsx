import React, { useEffect, useRef, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  Bot,
  Briefcase,
  Building2,
  Car,
  Check,
  CheckCircle2,
  ChevronDown,
  Clock,
  Compass,
  Copy,
  CreditCard,
  Download,
  EyeOff,
  FileEdit,
  FolderKanban,
  Gauge,
  GraduationCap,
  Hand,
  HeartPulse,
  KeyRound,
  Layers,
  Loader2,
  LogOut,
  Mail,
  PlusCircle,
  RefreshCw,
  Scale,
  Send,
  Share2,
  ShieldBan,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Table2,
  Upload,
  UserCheck,
  Users,
  Wallet,
  Webhook,
  X,
} from 'lucide-react';
import {
  AutoDataHelpTrigger,
  AutoDataSpotlightTour,
  type SpotlightTourStep,
} from './AutoDataHelpTour';
import { AutoDataZaloBotGuide } from './AutoDataZaloBotGuide';
import { DomationLogoMark } from '../DomationLogoMark';
import { LuxuryGoldBackdrop } from '../../LuxuryGoldBackdrop';
import {
  buildGoogleAppsScriptSnippet,
  buildPersonalLeadsCsvContent,
  parsePersonalLeadsCsvContent,
  type AuthenticatedAccountUser,
  type ClientBillingCatalog,
  type ClientBillingPlan,
  type ClientBillingTransaction,
  type ClientSessionState,
  type HelpTopicKey,
  type LegalDocTab,
  type PersonalSaleLeadItem,
  type SetupModalIntent,
  type WorkspaceSummaryItem,
  type ZaloBotSavedState,
} from './autodataTypes';

interface AutoDataFullScreenSetupProps {
  open: boolean;
  initialIntent: SetupModalIntent;
  catalog: ClientBillingCatalog;
  googleClientId?: string | null;
  session: ClientSessionState | null;
  onSessionChange: (nextSession: ClientSessionState | null) => void;
  onClose: () => void;
  onOpenLegal?: (tab: LegalDocTab) => void;
  onOpenTour?: () => void;
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

interface RoutedLeadPreview {
  id: string;
  name: string;
  phone: string;
  masked_phone?: string;
  utm_source?: string;
  assigned_to_name?: string;
  is_duplicate?: boolean;
  created_at?: string;
}

interface LiveWebhookResult {
  lead_id: string;
  assigned_to_name: string;
  is_external_f1?: boolean;
  displayed_phone?: string;
  masked_phone: string;
  is_duplicate: boolean;
  distribution_mode: string;
  latency_ms: number;
  capi_status: string;
  zalobot_status: string;
}

type WorkspaceTabKey = 'router' | 'sale_port' | 'zalo_connect' | 'billing' | 'crm_erp';

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
    key: 'healthcare',
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
    key: 'automotive',
    label: 'Showroom Ô Tô & Tài Chính Bảo Hiểm',
    subtitle: 'Phân bổ đăng ký lái thử, thẩm định hồ sơ vay tức thì',
    icon: Car,
    pipelineName: 'Phễu Đăng Ký Lái Thử & Bàn Giao Xe',
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
    desc: 'Bảo vệ quyền lợi Sale khai thác ban đầu và gắn cảnh báo khách quay lại trong 90 ngày.',
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

interface WizardTourStep extends SpotlightTourStep {
  stepNumber: 1 | 2 | 3;
}

interface WorkspaceTourStep extends SpotlightTourStep {
  tabKey: WorkspaceTabKey;
}

const WIZARD_TOUR_STEPS: WizardTourStep[] = [
  {
    id: 'wiz_stepper',
    target: 'setup-stepper',
    stepNumber: 1,
    eyebrow: 'BẮT BUỘC VS TÙY CHỌN',
    title: '3 bước rõ ràng — Cài nhanh trong 60 giây',
    description:
      'Chỉ Bước 1 là bắt buộc để khởi tạo không gian đội Sale. Bước 2 và Bước 3 đã cài sẵn cấu hình tối ưu, bạn có thể giữ nguyên hoặc bỏ qua bất cứ lúc nào.',
    chips: ['Bước 1: Bắt buộc (30 giây)', 'Bước 2–3: Tùy chọn', 'Miễn phí 1 tháng đầu'],
    topics: ['billing_3m_900k'],
  },
  {
    id: 'wiz_org_form',
    target: 'setup-org-form',
    stepNumber: 1,
    eyebrow: 'KHỞI TẠO KHÔNG GIAN',
    title: 'Thông tin Doanh nghiệp & Tài khoản Quản trị',
    description:
      'Điền Tên đội Sale, người phụ trách, Email và Mật khẩu. Hệ thống tự tạo địa chỉ không gian làm việc riêng và kích hoạt gói dùng thử 1 tháng miễn phí.',
    chips: ['Gói Standard: 5 Sale & 3 Quản lý', 'Tự sinh cổng tiếp nhận riêng'],
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
    title: 'Chia thẳng vòng theo năng lực & Lọc trùng 90 ngày',
    description:
      'Mặc định chia thẳng về Zalo cho Sale đang bật Online ngay khi có khách, không thu hồi phức tạp. Khách cũ quay lại trong 90 ngày tự trả về đúng Sale phụ trách.',
    chips: ['Chia thẳng không thu hồi', 'Nhận Zalo tức thì', 'Lọc trùng 90 ngày'],
    topics: ['round_robin_formula', 'dedupe_90d', 'sla_recall'],
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
    eyebrow: 'THÔNG BÁO ZALO A–Z',
    title: 'Kết nối Zalo Bot báo số tức thì — Có thể bỏ qua ngay',
    description:
      'Nếu đã có Bot Token & Chat ID, bạn bấm Kiểm tra để nhận tin thử về Zalo ngay. Chưa kịp chuẩn bị? Bấm "Tùy chọn — Tạm bỏ qua & vào setup ngay" để bắt đầu làm việc trước.',
    chips: ['4 bước lấy Token & /chatid', 'Test bắn tin thật ngay', 'Bỏ qua không mất dữ liệu'],
    topics: ['zalobot_chatid'],
    actionLabel: 'Bắt đầu thiết lập',
  },
];

const WORKSPACE_TOUR_STEPS: WorkspaceTourStep[] = [
  {
    id: 'ws_webhook',
    target: 'ws-webhook-panel',
    tabKey: 'router',
    eyebrow: 'CỔNG TIẾP NHẬN KHÁCH',
    title: 'Địa chỉ tiếp nhận tự động & Đồng bộ Google Sheets',
    description:
      'Sao chép đường dẫn riêng của công ty để gắn vào LadiPage, Website, Facebook Lead Ads hoặc Google Sheets của từng nhân viên Sale.',
    chips: ['Hoạt động 24/7', 'Nhận dữ liệu tức thì'],
    topics: ['apps_script'],
  },
  {
    id: 'ws_test',
    target: 'ws-test-lead',
    tabKey: 'router',
    eyebrow: 'KIỂM TRA THỰC TẾ',
    title: 'Gửi thử một khách hàng để xem vòng chia chạy thật',
    description:
      'Nhập tên và số điện thoại thử rồi bấm Gửi để quan sát hệ thống chọn đúng Sale theo tỷ lệ, lọc trùng SĐT và bắn thông báo Zalo ngay lập tức.',
    chips: ['Kiểm tra Sale nhận số', 'Thử lại cùng SĐT để test chống trùng'],
    topics: ['round_robin_formula', 'internal_sale_default', 'dedupe_90d', 'sla_recall'],
  },
  {
    id: 'ws_sale_port',
    target: 'ws-sale-port',
    tabKey: 'sale_port',
    eyebrow: 'CỔNG SALE CÁ NHÂN',
    title: 'Tự nhập / Import danh sách khách riêng không tốn lượt',
    description:
      'Khách hàng do chính Sale khai thác sẽ đi thẳng vào giỏ riêng, không qua vòng chia chung, không trừ định mức quảng cáo và xuất CSV có dấu tiếng Việt.',
    chips: ['0 Quota quảng cáo', 'Sở hữu giỏ khách riêng', 'Xuất CSV chuẩn Excel'],
    topics: ['sale_port_personal'],
  },
  {
    id: 'ws_zalo',
    target: 'ws-zalo-guide',
    tabKey: 'zalo_connect',
    eyebrow: 'KẾT NỐI ZALO BOT',
    title: 'Cài đặt & Xác thực Zalo Bot báo khách tức thì',
    description:
      'Làm theo 4 bước ngắn từ tạo Bot, lấy mã nhận tin cá nhân (/chatid) đến bấm Kiểm tra để đảm bảo mỗi Sale nhận số ngay trên điện thoại.',
    chips: ['Tùy chọn bật/tắt', 'Bắn tin kiểm chứng trực tiếp'],
    topics: ['zalobot_chatid'],
  },
  {
    id: 'ws_billing',
    target: 'ws-billing-plans',
    tabKey: 'billing',
    eyebrow: 'GÓI DỊCH VỤ & VÍ TOPUP',
    title: 'Gói Standard (5 Sale • 3 Quản lý), Gói Pro (25 Sale • 10 Quản lý)',
    description:
      'Dùng thử trọn vẹn 1 tháng 0đ. Khi gia hạn sớm hoặc nạp Ví Topup, hệ thống cộng dồn 100% số ngày còn lại — nâng cấp lên CRM/ERP giữ nguyên toàn bộ dữ liệu.',
    chips: ['Standard: 5 Sale & 3 Quản lý', 'Pro: 25 Sale & 10 Quản lý', 'Mua năm giảm 15%'],
    topics: ['billing_3m_900k', 'meta_capi'],
    actionLabel: 'Hoàn tất Tour',
  },
];

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

const RECENT_GOOGLE_ACCOUNTS_KEY = 'domation_recent_google_accounts_v1';

interface RecentGoogleAccountItem {
  email: string;
  full_name: string;
  updated_at: string;
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
    // Ignore storage quota issues
  }
  return nextList;
}

const INDUSTRY_LABELS: Record<string, string> = {
  general: 'Đa Ngành / Tổng Hợp',
  real_estate: 'Bất Động Sản',
  healthcare: 'Thẩm Mỹ & Y Tế',
  education: 'Giáo Dục & Đào Tạo',
  b2b: 'Dịch Vụ B2B & SaaS',
  automotive: 'Ô Tô & Tài Chính',
};

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

interface BridgeAuthApiResponse {
  success?: boolean;
  bridge_mode?: 'upstream_rls_postgres' | 'vercel_serverless_engine';
  upstream_app_url?: string | null;
  data?: {
    has_workspace?: boolean;
    auth_provider?: 'password' | 'google';
    access_token: string;
    tenant?: {
      slug: string;
      name: string;
      subscription: ClientSessionState['subscription'];
      settings?: { is_external_agency?: boolean };
    };
    user: {
      full_name?: string;
      email: string;
      avatar_url?: string | null;
    };
    webhook_url?: string;
    webhook_token?: string;
    workspaces?: WorkspaceSummaryItem[];
  };
  error?: { message?: string };
}

function mapBridgeAuthToSession(
  json: BridgeAuthApiResponse,
  fallbacks?: { isExternalAgency?: boolean; zaloBot?: ZaloBotSavedState | null }
): ClientSessionState | null {
  const data = json.data;
  if (!data?.tenant) return null;
  return {
    access_token: data.access_token,
    tenant_slug: data.tenant.slug,
    company_name: data.tenant.name,
    admin_email: data.user.email,
    user_name: data.user.full_name || data.user.email,
    auth_provider: data.auth_provider || 'password',
    webhook_url: data.webhook_url || '',
    webhook_token: data.webhook_token || '',
    is_external_agency: Boolean(
      data.tenant.settings?.is_external_agency ?? fallbacks?.isExternalAgency ?? false
    ),
    zalo_bot: fallbacks?.zaloBot ?? null,
    bridge_mode: json.bridge_mode || 'vercel_serverless_engine',
    upstream_app_url: json.upstream_app_url || null,
    subscription: data.tenant.subscription,
    workspaces: Array.isArray(data.workspaces) ? data.workspaces : [],
  };
}

interface GoogleOauthTokenResponse {
  access_token?: string;
  error?: string;
}

interface GoogleIdentityWindow extends Window {
  google?: {
    accounts?: {
      oauth2?: {
        initTokenClient: (config: {
          client_id: string;
          scope: string;
          callback: (resp: GoogleOauthTokenResponse) => void;
          error_callback?: () => void;
        }) => { requestAccessToken: () => void };
      };
    };
  };
}

async function ensureGoogleGsiScript(): Promise<void> {
  const gWin = window as GoogleIdentityWindow;
  if (gWin.google?.accounts?.oauth2) return;
  await new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>('script[data-domation-gsi="true"]');
    if (existing) {
      existing.addEventListener('load', () => resolve(), { once: true });
      existing.addEventListener('error', () => reject(new Error('Không thể tải Google Identity.')), { once: true });
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.dataset.domationGsi = 'true';
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Không thể kết nối Google Sign-In SDK.'));
    document.head.appendChild(script);
  });
}

export default function AutoDataFullScreenSetup({
  open,
  initialIntent,
  catalog,
  googleClientId,
  session,
  onSessionChange,
  onClose,
  onOpenLegal,
}: AutoDataFullScreenSetupProps) {
  const [authMode, setAuthMode] = useState<'register' | 'login'>(
    initialIntent === 'login' ? 'login' : 'register'
  );
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [tourOpen, setTourOpen] = useState(false);
  const [tourStepIdx, setTourStepIdx] = useState(0);
  const [workspaceTab, setWorkspaceTab] = useState<WorkspaceTabKey>(() => {
    if (initialIntent === 'workspace_crm_erp') return 'crm_erp';
    if (initialIntent === 'workspace_sale_port') return 'sale_port';
    if (initialIntent === 'workspace_zalo') return 'zalo_connect';
    if (initialIntent === 'workspace_billing' || session?.subscription?.is_expired) return 'billing';
    return 'router';
  });

  const activeTourSteps = session ? WORKSPACE_TOUR_STEPS : WIZARD_TOUR_STEPS;

  const syncUiToTourStep = (nextIdx: number, stepsList: Array<WizardTourStep | WorkspaceTourStep>) => {
    const targetStep = stepsList[nextIdx];
    if (!targetStep) return;
    if ('stepNumber' in targetStep) {
      setAuthMode('register');
      setStep(targetStep.stepNumber);
    } else if ('tabKey' in targetStep) {
      setWorkspaceTab(targetStep.tabKey);
    }
  };

  const openInAppTour = (topic?: HelpTopicKey) => {
    const list = session ? WORKSPACE_TOUR_STEPS : WIZARD_TOUR_STEPS;
    let nextIdx = 0;
    if (topic) {
      const foundIdx = list.findIndex((s) => s.topics?.includes(topic));
      if (foundIdx >= 0) nextIdx = foundIdx;
    } else if (!session) {
      const currentWizardIdx = list.findIndex(
        (s) => 'stepNumber' in s && s.stepNumber === step
      );
      if (currentWizardIdx >= 0) nextIdx = currentWizardIdx;
    } else {
      const currentWsIdx = list.findIndex(
        (s) => 'tabKey' in s && s.tabKey === workspaceTab
      );
      if (currentWsIdx >= 0) nextIdx = currentWsIdx;
    }
    syncUiToTourStep(nextIdx, list);
    setTourStepIdx(nextIdx);
    setTourOpen(true);
  };

  const handleTourStepChange = (nextIdx: number) => {
    const bounded = Math.max(0, Math.min(activeTourSteps.length - 1, nextIdx));
    syncUiToTourStep(bounded, activeTourSteps);
    setTourStepIdx(bounded);
  };

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

  // Registration Step 2 state — Individual Internal Sale is strictly DEFAULT (is_external_agency = false)
  const [routerMode, setRouterMode] = useState<RouterModeOption['key']>('weighted_round_robin');
  const [dedupPolicy, setDedupPolicy] = useState<DedupPolicyOption['key']>('route_to_existing_owner');
  const [dedupDays, setDedupDays] = useState<number>(90);
  const [isExternalAgency, setIsExternalAgency] = useState<boolean>(false);
  const [slaAutoRecall, setSlaAutoRecall] = useState<boolean>(false);

  // Registration Step 3 state (Channels + Optional Zalo Bot preview)
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
    user: AuthenticatedAccountUser;
    accessToken: string;
    workspaces: WorkspaceSummaryItem[];
    candidateSession?: ClientSessionState;
  } | null>(null);
  const [googleModalOpen, setGoogleModalOpen] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [googleInputEmail, setGoogleInputEmail] = useState('');
  const [googleInputName, setGoogleInputName] = useState('');
  const [recentGoogleAccounts, setRecentGoogleAccounts] = useState<RecentGoogleAccountItem[]>(() =>
    loadRecentGoogleAccounts()
  );
  const [googleProvisionToken, setGoogleProvisionToken] = useState<string | null>(null);
  const [quickWorkspaceCompany, setQuickWorkspaceCompany] = useState('');
  const [quickWorkspacePhone, setQuickWorkspacePhone] = useState('');
  const [quickWorkspaceIndustry, setQuickWorkspaceIndustry] = useState('general');
  const [workspaceMenuOpen, setWorkspaceMenuOpen] = useState(false);
  const [switchingSlug, setSwitchingSlug] = useState<string | null>(null);

  // Async action feedback
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successBanner, setSuccessBanner] = useState<string | null>(null);
  const [copiedWebhook, setCopiedWebhook] = useState(false);
  const [copiedAppsScript, setCopiedAppsScript] = useState(false);

  // Live Workspace data
  const [transactions, setTransactions] = useState<ClientBillingTransaction[]>([]);
  const [recentLeads, setRecentLeads] = useState<RoutedLeadPreview[]>([]);
  const [testLeadName, setTestLeadName] = useState('Nguyễn Hoàng Minh');
  const [testLeadPhone, setTestLeadPhone] = useState('0912888678');
  const [testLeadSource, setTestLeadSource] = useState('facebook_lead_ads');
  const [testLeadInterest, setTestLeadInterest] = useState('Tư vấn giải pháp gói Doanh Nghiệp');
  const [lastWebhookResult, setLastWebhookResult] = useState<LiveWebhookResult | null>(null);

  // Sale Port Personal Leads & 2-Way Google Sheets Sync state
  const [personalLeads, setPersonalLeads] = useState<PersonalSaleLeadItem[]>([
    {
      id: 'plead_demo01',
      name: 'Trần Quốc Bảo (Khách quen tự khai thác)',
      phone: '0908666888',
      sale_owner_name: 'Chuyên viên Sale Nội Bộ #01',
      product_interest: 'Gói dịch vụ VIP giới thiệu trực tiếp',
      note: 'Khách hẹn gọi lại 14h chiều — Không qua vòng chia',
      sheet_sync_status: 'Đồng bộ 2 chiều ↔ Google Sheet riêng (Sale #01)',
      bypass_round_robin: true,
      quota_impact: 0,
      sla_recall_exempt: true,
      created_at: new Date().toISOString(),
    },
  ]);
  const [pLeadName, setPLeadName] = useState('');
  const [pLeadPhone, setPLeadPhone] = useState('');
  const [pLeadOwner, setPLeadOwner] = useState('Chuyên viên Sale Nội Bộ #01');
  const [pLeadInterest, setPLeadInterest] = useState('Khách cá nhân tự tìm kiếm');
  const [pLeadNote, setPLeadNote] = useState('Đi thẳng vào giỏ riêng của Sale, không qua vòng chia');
  const [pSheetSync, setPSheetSync] = useState(true);
  const csvFileInputRef = useRef<HTMLInputElement | null>(null);

  // Billing & Upgrade UI state inside Connected Workspace
  const [billingCycle, setBillingCycle] = useState<'annual' | 'monthly'>('annual');
  const [selectedTopupId, setSelectedTopupId] = useState<string>(
    catalog.topup_packages.find((p) => p.highlight)?.id || catalog.topup_packages[0]?.id || 'topup_12m'
  );
  const [transferOrderInfo, setTransferOrderInfo] = useState<{
    title: string;
    reference_code: string;
    amount_vnd: number;
  } | null>(null);
  const [upgradeSuite, setUpgradeSuite] = useState<
    'automation' | 'crm' | 'erp' | 'crm_erp_bundle'
  >('crm_erp_bundle');
  const [upgradePhone, setUpgradePhone] = useState('');
  const [upgradeNote, setUpgradeNote] = useState('');

  // Lock body scroll when full-screen modal is open & support Escape close
  useEffect(() => {
    if (!open) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [open, onClose]);

  // Real-time HTTP check-slug debounce — auto re-roll salt if collision occurs
  useEffect(() => {
    if (!open || session || authMode !== 'register') return;
    const clean = tenantSlug.trim();
    if (clean.length < 2) return;
    let cancelled = false;
    const timer = window.setTimeout(async () => {
      try {
        const res = await fetch(`/api/autodata?action=check-slug&slug=${encodeURIComponent(clean)}`);
        const json = (await res.json()) as { data?: { available?: boolean } };
        if (!cancelled && json.data?.available === false) {
          const nextSalt = Math.random().toString(36).replace(/[^a-z0-9]/g, '').slice(0, 6) || Date.now().toString(36).slice(-6);
          setAutoSlugSalt(nextSalt);
          const base = slugifyVietnamese(companyName) || 'ws';
          setTenantSlug(`${base.slice(0, 27)}-${nextSalt}`);
        }
      } catch {
        // Ignore network errors during background uniqueness check
      }
    }, 320);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [open, session, authMode, tenantSlug, companyName]);

  // Fetch live tenant overview when authenticated
  useEffect(() => {
    if (!open || !session) return;
    let active = true;
    const fetchOverview = async () => {
      try {
        const res = await fetch(
          `/api/autodata?action=overview&slug=${encodeURIComponent(session.tenant_slug)}`,
          {
            headers: {
              Authorization: `Bearer ${session.access_token}`,
              'X-Tenant-Slug': session.tenant_slug,
            },
          }
        );
        const json = (await res.json()) as {
          success?: boolean;
          bridge_mode?: 'upstream_rls_postgres' | 'vercel_serverless_engine';
          upstream_app_url?: string | null;
          data?: {
            subscription?: ClientSessionState['subscription'];
            transactions?: ClientBillingTransaction[];
            leads?: RoutedLeadPreview[];
            personal_leads?: PersonalSaleLeadItem[];
            zalo_bot?: ZaloBotSavedState | null;
            is_external_agency?: boolean;
            webhook_url?: string;
            webhook_token?: string;
            workspaces?: WorkspaceSummaryItem[];
          };
        };
        if (!active || !json.success || !json.data) return;
        setTransactions(Array.isArray(json.data.transactions) ? json.data.transactions : []);
        setRecentLeads(Array.isArray(json.data.leads) ? json.data.leads : []);
        if (Array.isArray(json.data.personal_leads) && json.data.personal_leads.length > 0) {
          setPersonalLeads(json.data.personal_leads);
        }
        if (json.data.subscription) {
          if (
            json.data.subscription.is_expired &&
            initialIntent !== 'workspace_crm_erp' &&
            initialIntent !== 'workspace_sale_port' &&
            initialIntent !== 'workspace_zalo'
          ) {
            setWorkspaceTab('billing');
          }
          onSessionChange({
            ...session,
            bridge_mode: json.bridge_mode || session.bridge_mode,
            upstream_app_url: json.upstream_app_url ?? session.upstream_app_url,
            webhook_url: json.data.webhook_url || session.webhook_url,
            webhook_token: json.data.webhook_token || session.webhook_token,
            is_external_agency: json.data.is_external_agency ?? session.is_external_agency ?? false,
            zalo_bot: json.data.zalo_bot ?? session.zalo_bot ?? null,
            subscription: json.data.subscription,
            workspaces: Array.isArray(json.data.workspaces) ? json.data.workspaces : session.workspaces,
          });
        }
      } catch {
        // Keep cached session snapshot if offline
      }
    };
    void fetchOverview();
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, session?.access_token, session?.tenant_slug]);

  if (!open) return null;

  const handleCompanyNameChange = (val: string) => {
    setCompanyName(val);
    const trimmed = val.trim();
    if (!trimmed) {
      setTenantSlug('');
      return;
    }
    const base = slugifyVietnamese(trimmed) || 'ws';
    const generated = `${base.slice(0, 27)}-${autoSlugSalt}`;
    setTenantSlug(generated);
  };

  const toggleChannel = (key: string) => {
    if (key === 'webhook') return; // Core inbound webhook is always active
    setSelectedChannels((prev) =>
      prev.includes(key) ? prev.filter((item) => item !== key) : [...prev, key]
    );
  };

  const validateStep1 = (): boolean => {
    if (!companyName.trim()) {
      setErrorMsg('Vui lòng nhập Tên doanh nghiệp / Đội Sale.');
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
    const skipPasswordForGoogle = Boolean(googleProvisionToken && password.length === 0 && confirmPassword.length === 0);
    if (!skipPasswordForGoogle) {
      if (password.length < 8) {
        setErrorMsg('Mật khẩu quản trị cần tối thiểu 8 ký tự để bảo mật không gian dữ liệu.');
        return false;
      }
      if (password !== confirmPassword) {
        setErrorMsg('Mật khẩu xác nhận chưa khớp. Vui lòng nhập lại chính xác.');
        return false;
      }
    }
    setErrorMsg(null);
    return true;
  };

  const handleRegisterSubmit = async (fastSkippedOptional = false) => {
    if (!validateStep1()) {
      setStep(1);
      return;
    }
    setSubmitting(true);
    setErrorMsg(null);
    try {
      const selectedDomain = BUSINESS_DOMAINS.find((d) => d.key === domainKey) || BUSINESS_DOMAINS[0];
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (googleProvisionToken) {
        headers.Authorization = `Bearer ${googleProvisionToken}`;
      }
      const res = await fetch('/api/autodata?action=register', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          company_name: companyName.trim(),
          tenant_slug: tenantSlug.trim(),
          admin_name: adminName.trim(),
          work_email: workEmail.trim(),
          phone: phone.trim(),
          password,
          google_account_token: googleProvisionToken || undefined,
          industry: domainKey,
          seed_demo_leads: false,
          custom_pipeline_name: selectedDomain.pipelineName,
          selected_channels: selectedChannels,
          zalo_bot: pendingZaloBot,
          custom_settings: {
            distribution_mode: routerMode,
            duplicate_lead_action: dedupPolicy,
            duplicate_action:
              dedupPolicy === 'create_new_round_robin'
                ? 'round_robin'
                : dedupPolicy === 'route_to_existing_owner'
                  ? 'route_to_previous_sale'
                  : dedupPolicy,
            duplicate_threshold_days: dedupDays,
            is_external_agency: isExternalAgency,
            mask_pii_for_external: isExternalAgency,
            pii_masking_enabled: isExternalAgency,
            sla_auto_recall_enabled: slaAutoRecall,
          },
        }),
      });
      const json = (await res.json()) as BridgeAuthApiResponse;

      if (!res.ok || !json.success || !json.data) {
        setErrorMsg(
          json.error?.message || 'Không thể khởi tạo hệ thống. Vui lòng kiểm tra lại thông tin.'
        );
        return;
      }

      const nextSession = mapBridgeAuthToSession(json, {
        isExternalAgency,
        zaloBot: pendingZaloBot,
      });
      if (!nextSession) {
        setErrorMsg('Phản hồi khởi tạo Workspace chưa đầy đủ. Vui lòng thử lại.');
        return;
      }

      setRecentGoogleAccounts(rememberRecentGoogleAccount(nextSession.admin_email, nextSession.user_name || adminName));
      setGoogleProvisionToken(null);
      setAuthDiscovery(null);
      onSessionChange(nextSession);
      setWorkspaceTab('router');
      setSuccessBanner(
        fastSkippedOptional
          ? `Đã tạo nhanh "${nextSession.company_name}" (Mặc định chia cho từng Sale nội bộ) — Bạn có thể bắn thử Lead ngay hoặc cài Zalo Bot tùy chọn bất cứ lúc nào!`
          : `Đã khởi tạo thành công không gian "${nextSession.company_name}" — Kích hoạt ${catalog.trial_duration_months} tháng (${catalog.trial_duration_days} ngày) miễn phí!`
      );
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Lỗi kết nối máy chủ khi khởi tạo.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAuthDiscoveryResponse = (
    json: BridgeAuthApiResponse,
    provider: 'password' | 'google'
  ): boolean => {
    if (!json.success || !json.data) return false;
    const email = json.data.user.email;
    const fullName = json.data.user.full_name || email;
    setRecentGoogleAccounts(rememberRecentGoogleAccount(email, fullName));

    const workspaces = Array.isArray(json.data.workspaces) ? json.data.workspaces : [];
    const candidateSession = mapBridgeAuthToSession(json) || undefined;

    setAuthDiscovery({
      user: {
        email,
        full_name: fullName,
        avatar_url: json.data.user.avatar_url || null,
        auth_provider: provider,
      },
      accessToken: json.data.access_token,
      workspaces,
      candidateSession,
    });
    return true;
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg(null);
    try {
      const res = await fetch('/api/autodata?action=login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: loginEmail.trim(),
          password: loginPassword,
        }),
      });
      const json = (await res.json()) as BridgeAuthApiResponse;
      if (!res.ok || !handleAuthDiscoveryResponse(json, 'password')) {
        setErrorMsg(
          json.error?.message || 'Đăng nhập thất bại. Vui lòng kiểm tra Email và Mật khẩu.'
        );
        return;
      }
      setSuccessBanner(null);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Không thể kết nối tới máy chủ xác thực.');
    } finally {
      setSubmitting(false);
    }
  };

  const executeGoogleLogin = async (payload: {
    access_token?: string;
    id_token?: string;
    dev_google_email?: string;
    dev_google_name?: string;
  }) => {
    setGoogleLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch('/api/autodata?action=google-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const json = (await res.json()) as BridgeAuthApiResponse;
      if (!res.ok || !handleAuthDiscoveryResponse(json, 'google')) {
        setErrorMsg(json.error?.message || 'Đăng nhập bằng Google thất bại.');
        return;
      }
      setGoogleModalOpen(false);
      setSuccessBanner(null);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Lỗi kết nối xác thực Google.');
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleGoogleButtonClick = async () => {
    setErrorMsg(null);
    const activeClientId = (
      googleClientId ||
      (import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined) ||
      ''
    ).trim();

    if (!activeClientId) {
      setGoogleInputEmail((prev) => prev || loginEmail.trim() || workEmail.trim());
      setGoogleInputName((prev) => prev || adminName.trim());
      setGoogleModalOpen(true);
      return;
    }

    setGoogleLoading(true);
    try {
      await ensureGoogleGsiScript();
      const gWin = window as GoogleIdentityWindow;
      const oauth2 = gWin.google?.accounts?.oauth2;
      if (!oauth2) {
        setGoogleLoading(false);
        setGoogleModalOpen(true);
        return;
      }
      const tokenClient = oauth2.initTokenClient({
        client_id: activeClientId,
        scope: 'openid email profile',
        callback: (resp) => {
          if (resp.error || !resp.access_token) {
            setGoogleLoading(false);
            setErrorMsg('Bạn đã hủy hoặc chưa cấp quyền Google OAuth.');
            return;
          }
          void executeGoogleLogin({ access_token: resp.access_token });
        },
        error_callback: () => {
          setGoogleLoading(false);
          setErrorMsg('Trình duyệt đã chặn cửa sổ bật lên Google. Vui lòng cho phép popup.');
        },
      });
      tokenClient.requestAccessToken();
    } catch (err: unknown) {
      setGoogleLoading(false);
      setErrorMsg(err instanceof Error ? err.message : 'Không thể khởi chạy Google Sign-In.');
    }
  };

  const handleSelectDiscoveredWorkspace = async (slug: string) => {
    if (!authDiscovery) return;
    setErrorMsg(null);
    if (authDiscovery.candidateSession && authDiscovery.candidateSession.tenant_slug === slug) {
      const chosen = authDiscovery.candidateSession;
      setAuthDiscovery(null);
      onSessionChange(chosen);
      if (chosen.subscription.is_expired) {
        setWorkspaceTab('billing');
      } else {
        setWorkspaceTab('router');
      }
      setSuccessBanner(`Chào mừng quay trở lại không gian "${chosen.company_name}".`);
      return;
    }

    setSwitchingSlug(slug);
    try {
      const res = await fetch('/api/autodata?action=switch-workspace', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authDiscovery.accessToken}`,
        },
        body: JSON.stringify({ tenant_slug: slug }),
      });
      const json = (await res.json()) as BridgeAuthApiResponse;
      const nextSession = mapBridgeAuthToSession(json);
      if (!res.ok || !nextSession) {
        setErrorMsg(json.error?.message || 'Không thể mở Workspace đã chọn.');
        return;
      }
      setAuthDiscovery(null);
      onSessionChange(nextSession);
      setWorkspaceTab(nextSession.subscription.is_expired ? 'billing' : 'router');
      setSuccessBanner(`Đã truy cập không gian "${nextSession.company_name}".`);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Lỗi kết nối khi mở Workspace.');
    } finally {
      setSwitchingSlug(null);
    }
  };

  const handleSwitchWorkspaceFromConsole = async (slug: string) => {
    if (!session || slug === session.tenant_slug) {
      setWorkspaceMenuOpen(false);
      return;
    }
    setSwitchingSlug(slug);
    setErrorMsg(null);
    try {
      const res = await fetch('/api/autodata?action=switch-workspace', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ tenant_slug: slug }),
      });
      const json = (await res.json()) as BridgeAuthApiResponse;
      const nextSession = mapBridgeAuthToSession(json);
      if (!res.ok || !nextSession) {
        setErrorMsg(json.error?.message || 'Không thể chuyển Workspace.');
        return;
      }
      setWorkspaceMenuOpen(false);
      onSessionChange(nextSession);
      setWorkspaceTab(nextSession.subscription.is_expired ? 'billing' : 'router');
      setSuccessBanner(`Đã chuyển sang Workspace "${nextSession.company_name}".`);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Lỗi kết nối khi chuyển Workspace.');
    } finally {
      setSwitchingSlug(null);
    }
  };

  const handleQuickCreateFirstWorkspace = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authDiscovery) return;
    if (!quickWorkspaceCompany.trim()) {
      setErrorMsg('Vui lòng nhập Tên doanh nghiệp hoặc Đội Sale để khởi tạo Workspace.');
      return;
    }
    setSubmitting(true);
    setErrorMsg(null);
    try {
      const selectedDomain =
        BUSINESS_DOMAINS.find((d) => d.key === quickWorkspaceIndustry) || BUSINESS_DOMAINS[0];
      const autoSlug = `${slugifyVietnamese(quickWorkspaceCompany.trim()) || 'ws'}-${autoSlugSalt}`;
      const res = await fetch('/api/autodata?action=register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authDiscovery.accessToken}`,
        },
        body: JSON.stringify({
          company_name: quickWorkspaceCompany.trim(),
          tenant_slug: autoSlug,
          admin_name: authDiscovery.user.full_name,
          work_email: authDiscovery.user.email,
          phone: quickWorkspacePhone.trim() || '0900000000',
          password: '',
          google_account_token: authDiscovery.accessToken,
          industry: quickWorkspaceIndustry,
          seed_demo_leads: false,
          custom_pipeline_name: selectedDomain.pipelineName,
          selected_channels: selectedChannels,
          custom_settings: {
            distribution_mode: 'weighted_round_robin',
            duplicate_lead_action: 'route_to_existing_owner',
            duplicate_action: 'route_to_previous_sale',
            duplicate_threshold_days: 90,
            is_external_agency: false,
            mask_pii_for_external: false,
            pii_masking_enabled: false,
            sla_auto_recall_enabled: true,
          },
        }),
      });
      const json = (await res.json()) as BridgeAuthApiResponse;
      const nextSession = mapBridgeAuthToSession(json);
      if (!res.ok || !nextSession) {
        setErrorMsg(json.error?.message || 'Không thể khởi tạo Workspace mới.');
        return;
      }
      setAuthDiscovery(null);
      setQuickWorkspaceCompany('');
      setQuickWorkspacePhone('');
      onSessionChange(nextSession);
      setWorkspaceTab('router');
      setSuccessBanner(
        `Đã khởi tạo Workspace "${nextSession.company_name}" liên kết với ${authDiscovery.user.email}!`
      );
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Lỗi kết nối khi khởi tạo Workspace.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleStartCreateWorkspaceFromUser = (
    user: { email: string; full_name: string; auth_provider?: 'password' | 'google' },
    token?: string
  ) => {
    setAuthDiscovery(null);
    setWorkspaceMenuOpen(false);
    setAdminName(user.full_name || '');
    setWorkEmail(user.email || '');
    setCompanyName('');
    setTenantSlug('');
    setPassword('');
    setConfirmPassword('');
    setGoogleProvisionToken(user.auth_provider === 'google' && token ? token : null);
    setAuthMode('register');
    setStep(1);
    onSessionChange(null);
  };

  const handleFireRealWebhookTest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session) return;
    setSubmitting(true);
    setErrorMsg(null);
    try {
      const res = await fetch('/api/autodata?action=webhook-test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
          'X-Tenant-Slug': session.tenant_slug,
        },
        body: JSON.stringify({
          tenant_slug: session.tenant_slug,
          webhook_token: session.webhook_token,
          name: testLeadName,
          phone: testLeadPhone,
          utm_source: testLeadSource,
          product_interest: testLeadInterest,
        }),
      });
      const json = (await res.json()) as {
        success?: boolean;
        data?: LiveWebhookResult;
        error?: { message?: string };
      };
      if (!res.ok || !json.success || !json.data) {
        setErrorMsg(json.error?.message || 'Không thể định tuyến Lead kiểm thử.');
        return;
      }

      const nextLeadId = json.data.lead_id || `lead-${Date.now()}`;
      setLastWebhookResult(json.data);
      setRecentLeads((prev) => [
        {
          id: nextLeadId,
          name: testLeadName,
          phone: testLeadPhone,
          masked_phone: json.data!.displayed_phone || testLeadPhone,
          utm_source: testLeadSource,
          assigned_to_name: json.data!.assigned_to_name,
          is_duplicate: json.data!.is_duplicate,
          created_at: new Date().toISOString(),
        },
        ...prev.filter((item) => item.id !== nextLeadId).slice(0, 9),
      ]);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Lỗi kết nối cổng Webhook.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddPersonalLead = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session) return;
    setSubmitting(true);
    setErrorMsg(null);
    try {
      const res = await fetch(
        `/api/autodata?action=personal-lead&slug=${encodeURIComponent(session.tenant_slug)}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`,
            'X-Tenant-Slug': session.tenant_slug,
          },
          body: JSON.stringify({
            name: pLeadName.trim(),
            phone: pLeadPhone.trim(),
            sale_owner_name: pLeadOwner.trim() || 'Chuyên viên Sale Nội Bộ #01',
            product_interest: pLeadInterest.trim(),
            note: pLeadNote.trim(),
            sheet_sync_enabled: pSheetSync,
          }),
        }
      );
      const json = (await res.json()) as {
        success?: boolean;
        data?: { item: PersonalSaleLeadItem; policy_summary?: string };
        error?: { message?: string };
      };
      if (!res.ok || !json.success || !json.data?.item) {
        setErrorMsg(json.error?.message || 'Không thể thêm Lead cá nhân.');
        return;
      }
      setPersonalLeads((prev) => [json.data!.item, ...prev]);
      setPLeadName('');
      setPLeadPhone('');
      setSuccessBanner(
        json.data.policy_summary ||
          'Đã thêm Lead vào Cổng Sale Cá Nhân (Bỏ qua vòng chia & Không trừ quota Ads)!'
      );
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Lỗi kết nối Cổng Sale Cá Nhân.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleImportPersonalCsvFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !session) return;

    setSubmitting(true);
    setErrorMsg(null);
    try {
      const rawText = await file.text();
      const drafts = parsePersonalLeadsCsvContent(
        rawText,
        pLeadOwner.trim() || 'Chuyên viên Sale Nội Bộ #01'
      );
      if (drafts.length === 0) {
        setErrorMsg(
          'File CSV chưa có dòng dữ liệu hợp lệ (cần có Họ tên và Số điện thoại tối thiểu 9 chữ số).'
        );
        return;
      }

      const res = await fetch(
        `/api/autodata?action=personal-lead&slug=${encodeURIComponent(session.tenant_slug)}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`,
            'X-Tenant-Slug': session.tenant_slug,
          },
          body: JSON.stringify({
            items: drafts,
            sale_owner_name: pLeadOwner.trim() || 'Chuyên viên Sale Nội Bộ #01',
            sheet_sync_enabled: pSheetSync,
          }),
        }
      );
      const json = (await res.json()) as {
        success?: boolean;
        data?: {
          item?: PersonalSaleLeadItem;
          items?: PersonalSaleLeadItem[];
          imported_count?: number;
          policy_summary?: string;
        };
        error?: { message?: string };
      };
      if (!res.ok || !json.success || !json.data) {
        setErrorMsg(json.error?.message || 'Không thể import danh sách CSV cá nhân.');
        return;
      }
      const imported = Array.isArray(json.data.items)
        ? json.data.items
        : json.data.item
          ? [json.data.item]
          : [];
      if (imported.length > 0) {
        setPersonalLeads((prev) => [...imported, ...prev]);
      }
      setSuccessBanner(
        json.data.policy_summary ||
          `Đã import ${imported.length} khách hàng riêng từ file "${file.name}" (0 Quota • Giỏ riêng độc lập)!`
      );
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Không thể đọc file CSV đã chọn.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDownloadPersonalCsv = () => {
    const csv = buildPersonalLeadsCsvContent(personalLeads);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `domation-sale-personal-leads-${session?.tenant_slug || 'demo'}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const copyWebhookUrl = async () => {
    if (!session?.webhook_url) return;
    try {
      await navigator.clipboard.writeText(session.webhook_url);
      setCopiedWebhook(true);
      window.setTimeout(() => setCopiedWebhook(false), 1800);
    } catch {
      // Ignore clipboard failure
    }
  };

  const copyAppsScriptCode = async () => {
    const code = buildGoogleAppsScriptSnippet(session?.webhook_url, session?.admin_email);
    try {
      await navigator.clipboard.writeText(code);
      setCopiedAppsScript(true);
      window.setTimeout(() => setCopiedAppsScript(false), 1800);
    } catch {
      // Ignore clipboard failure
    }
  };

  const handleCreateTopupOrder = async () => {
    if (!session) return;
    setSubmitting(true);
    setErrorMsg(null);
    try {
      const res = await fetch('/api/autodata?action=topup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
          'X-Tenant-Slug': session.tenant_slug,
        },
        body: JSON.stringify({ package_id: selectedTopupId }),
      });
      const json = (await res.json()) as {
        success?: boolean;
        data?: { transaction: ClientBillingTransaction };
        error?: { message?: string };
      };
      if (!res.ok || !json.success || !json.data) {
        setErrorMsg(json.error?.message || 'Không thể khởi tạo lệnh nạp Topup.');
        return;
      }
      const tx = json.data.transaction;
      setTransactions((prev) => [tx, ...prev]);
      setTransferOrderInfo({
        title: `Lệnh Nạp Ví Topup (${tx.note})`,
        reference_code: tx.reference_code,
        amount_vnd: tx.amount_vnd,
      });
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Lỗi kết nối Billing Engine.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubscribePlan = async (plan: ClientBillingPlan) => {
    if (!session) return;
    setSubmitting(true);
    setErrorMsg(null);
    const totalPayable =
      billingCycle === 'annual' ? plan.annual_total_vnd : plan.monthly_price_vnd;
    const payByWallet = session.subscription.wallet_balance_vnd >= totalPayable;

    try {
      const res = await fetch('/api/autodata?action=subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
          'X-Tenant-Slug': session.tenant_slug,
        },
        body: JSON.stringify({
          plan_code: plan.code,
          billing_cycle: billingCycle,
          months: 1,
          payment_method: payByWallet ? 'wallet' : 'bank_transfer',
        }),
      });
      const json = (await res.json()) as {
        success?: boolean;
        data?: {
          transaction: ClientBillingTransaction;
          subscription?: ClientSessionState['subscription'];
        };
        error?: { message?: string };
      };
      if (!res.ok || !json.success || !json.data) {
        setErrorMsg(json.error?.message || 'Không thể xử lý yêu cầu đăng ký gói.');
        return;
      }
      const tx = json.data.transaction;
      setTransactions((prev) => [tx, ...prev]);
      if (json.data.subscription) {
        onSessionChange({
          ...session,
          subscription: json.data.subscription,
        });
        setSuccessBanner(`Đã gia hạn tức thì gói "${plan.name}" bằng Ví Topup!`);
      } else {
        setTransferOrderInfo({
          title: `Đăng Ký / Gia Hạn ${plan.name} (${billingCycle === 'annual' ? `1 Năm -${plan.annual_discount_pct}%` : '1 Tháng'})`,
          reference_code: tx.reference_code,
          amount_vnd: tx.amount_vnd,
        });
      }
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Lỗi kết nối khi đăng ký gói.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRequestCrmErpUpgrade = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session) return;
    setSubmitting(true);
    setErrorMsg(null);
    try {
      const res = await fetch('/api/autodata?action=upgrade-crm-erp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
          'X-Tenant-Slug': session.tenant_slug,
        },
        body: JSON.stringify({
          target_suite: upgradeSuite,
          billing_cycle: billingCycle,
          contact_phone: upgradePhone,
          note: upgradeNote,
          keep_existing_data: true,
        }),
      });
      const json = (await res.json()) as {
        success?: boolean;
        data?: { transaction: ClientBillingTransaction };
        error?: { message?: string };
      };
      if (!res.ok || !json.success || !json.data) {
        setErrorMsg(json.error?.message || 'Không thể gửi yêu cầu nâng cấp hệ sinh thái.');
        return;
      }
      setTransactions((prev) => [json.data!.transaction, ...prev]);
      setSuccessBanner(
        'Đã ghi nhận yêu cầu mở rộng lên Hệ sinh thái DOMATION (Giữ nguyên 100% dữ liệu Lead & Sale hiện có)!'
      );
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Lỗi kết nối máy chủ.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Không gian khởi tạo và kết nối Auto Data"
      className="fixed inset-0 z-[120] w-screen h-screen bg-[#F8F9FA] text-slate-900 flex flex-col overflow-hidden"
    >
      <LuxuryGoldBackdrop />

      {/* Top Full-Screen Minimal App Bar — Aligned 100% with DOMATION Brand */}
      <header className="relative z-20 shrink-0 h-16 px-4 sm:px-8 border-b border-slate-200/80 bg-white/85 backdrop-blur-xl flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0 relative">
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
            {session ? (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setWorkspaceMenuOpen((prev) => !prev)}
                  className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-slate-700 hover:text-[#1E40FF] transition-colors cursor-pointer max-w-[230px] sm:max-w-[300px]"
                >
                  <Building2 className="w-3 h-3 text-[#1E40FF] shrink-0" />
                  <span className="truncate">{session.company_name}</span>
                  {(session.workspaces?.length ?? 0) > 1 && (
                    <span className="rounded-full bg-slate-100 border border-slate-200 px-1.5 py-0.2 text-[10px] font-bold text-slate-600 shrink-0">
                      {session.workspaces?.length}
                    </span>
                  )}
                  <ChevronDown className="w-3 h-3 text-slate-400 shrink-0" />
                </button>

                {workspaceMenuOpen && (
                  <div className="absolute left-0 top-full mt-2 w-80 max-w-[88vw] rounded-2xl bg-white/95 backdrop-blur-xl border border-slate-200 shadow-xl p-2 z-50 space-y-1.5">
                    <div className="px-3 py-2 border-b border-slate-100 flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                          Các Workspace của bạn
                        </div>
                        <div className="text-xs font-medium text-slate-700 truncate">
                          {session.admin_email}
                        </div>
                      </div>
                      {session.auth_provider === 'google' && (
                        <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] font-semibold text-slate-700 shrink-0">
                          <GoogleLogoMark className="w-3 h-3" />
                          <span>Google</span>
                        </span>
                      )}
                    </div>

                    <div className="max-h-56 overflow-y-auto space-y-1">
                      {(session.workspaces && session.workspaces.length > 0
                        ? session.workspaces
                        : [
                            {
                              slug: session.tenant_slug,
                              company_name: session.company_name,
                              industry: 'general',
                              plan_tier: session.subscription.plan_tier,
                              plan_name: session.subscription.plan_name,
                              role: 'tenant_admin',
                              days_remaining: session.subscription.days_remaining,
                              is_in_trial: session.subscription.is_in_trial,
                              is_expired: session.subscription.is_expired,
                            },
                          ]
                      ).map((ws) => {
                        const isCurrent = ws.slug === session.tenant_slug;
                        return (
                          <button
                            key={ws.slug}
                            type="button"
                            disabled={switchingSlug === ws.slug}
                            onClick={() => void handleSwitchWorkspaceFromConsole(ws.slug)}
                            className={`w-full text-left rounded-xl px-3 py-2 flex items-center justify-between gap-2 transition-colors cursor-pointer ${
                              isCurrent
                                ? 'bg-blue-50/90 border border-blue-200 text-slate-900'
                                : 'hover:bg-slate-50 border border-transparent text-slate-700'
                            }`}
                          >
                            <div className="min-w-0">
                              <div className="text-xs font-bold truncate">{ws.company_name}</div>
                              <div className="text-[10px] text-slate-500 truncate">
                                {ws.plan_name} • Còn {ws.days_remaining} ngày
                              </div>
                            </div>
                            {switchingSlug === ws.slug ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin text-[#1E40FF] shrink-0" />
                            ) : isCurrent ? (
                              <Check className="w-3.5 h-3.5 text-[#1E40FF] shrink-0" />
                            ) : (
                              <ArrowRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            )}
                          </button>
                        );
                      })}
                    </div>

                    <div className="pt-1 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={() =>
                          handleStartCreateWorkspaceFromUser(
                            {
                              email: session.admin_email,
                              full_name: session.user_name || session.admin_email,
                              auth_provider: session.auth_provider,
                            },
                            session.access_token
                          )
                        }
                        className="w-full rounded-xl px-3 py-2 text-xs font-semibold text-[#1E40FF] hover:bg-blue-50/70 flex items-center gap-2 transition-colors cursor-pointer"
                      >
                        <PlusCircle className="w-3.5 h-3.5 shrink-0" />
                        <span>Tạo thêm Workspace mới</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-[11px] text-slate-500 truncate">
                {`Miễn phí ${catalog.trial_duration_months} tháng đầu • Gia hạn từ ${(catalog.base_monthly_price_vnd / 1000).toFixed(0)}k/tháng (-${catalog.annual_discount_pct}%/năm)`}
              </p>
            )}
          </div>
        </div>

        {/* Center Mode Switcher or Workspace Tabs */}
        {!session ? (
          <div className="hidden md:flex items-center gap-1.5 bg-slate-100/80 border border-slate-200/70 p-1 rounded-full shrink-0">
            <button
              type="button"
              onClick={() => {
                setAuthDiscovery(null);
                setGoogleProvisionToken(null);
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
                setGoogleProvisionToken(null);
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
        ) : (
          <div className="hidden xl:flex items-center gap-1.5 bg-slate-100/80 border border-slate-200/70 p-1 rounded-full shrink-0">
            {[
              { id: 'router' as const, label: '1. Webhook & Chia Vòng' },
              { id: 'sale_port' as const, label: '2. Cổng Sale & Sheets 2 Chiều' },
              { id: 'zalo_connect' as const, label: '3. Zalo Bot A–Z (Tùy chọn)' },
              { id: 'billing' as const, label: '4. Gói & Ví Topup' },
              { id: 'crm_erp' as const, label: '5. Nâng Cấp Suite' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  setWorkspaceTab(tab.id);
                  setWorkspaceMenuOpen(false);
                  setErrorMsg(null);
                }}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                  workspaceTab === tab.id
                    ? 'ql-pill-tab-active'
                    : 'text-slate-600 hover:text-[#1E40FF]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        )}

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => openInAppTour()}
            className="inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50/90 px-3 py-1.5 text-xs font-semibold text-[#1E40FF] hover:bg-blue-100 transition-colors cursor-pointer whitespace-nowrap"
          >
            <Compass className="w-3.5 h-3.5 shrink-0" />
            <span className="hidden sm:inline">Tour hướng dẫn</span>
            <span className="sm:hidden">?</span>
          </button>
          {session && (
            <button
              type="button"
              onClick={() => {
                setWorkspaceMenuOpen(false);
                setAuthDiscovery(null);
                setGoogleProvisionToken(null);
                onSessionChange(null);
                setSuccessBanner(null);
                setTransferOrderInfo(null);
              }}
              className="ql-btn-outline rounded-full px-3 py-1.5 text-xs hover:text-rose-600 hover:border-rose-200 cursor-pointer whitespace-nowrap"
            >
              <LogOut className="w-3.5 h-3.5 shrink-0" />
              <span className="hidden sm:inline">Đăng xuất</span>
            </button>
          )}
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

      {/* Sub-bar Switcher on Mobile / Tablet */}
      {!session ? (
        <div className="relative z-10 md:hidden shrink-0 px-4 py-2 bg-white/85 backdrop-blur-md border-b border-slate-200 flex gap-2">
          <button
            type="button"
            onClick={() => {
              setAuthDiscovery(null);
              setGoogleProvisionToken(null);
              setAuthMode('register');
            }}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold whitespace-nowrap ${
              authMode === 'register' && !authDiscovery ? 'ql-pill-tab-active rounded-xl' : 'bg-slate-100 text-slate-600'
            }`}
          >
            Tạo mới ({catalog.trial_duration_months} tháng 0đ)
          </button>
          <button
            type="button"
            onClick={() => {
              setAuthDiscovery(null);
              setGoogleProvisionToken(null);
              setAuthMode('login');
            }}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold whitespace-nowrap ${
              authMode === 'login' || Boolean(authDiscovery) ? 'ql-pill-tab-active rounded-xl' : 'bg-slate-100 text-slate-600'
            }`}
          >
            Đăng nhập
          </button>
        </div>
      ) : (
        <div className="relative z-10 xl:hidden shrink-0 px-4 py-2 bg-white/85 backdrop-blur-md border-b border-slate-200 flex gap-2 overflow-x-auto">
          {[
            { id: 'router' as const, label: '1. Webhook & Chia Vòng' },
            { id: 'sale_port' as const, label: '2. Cổng Sale & Sheets' },
            { id: 'zalo_connect' as const, label: '3. Zalo Bot (Tùy chọn)' },
            { id: 'billing' as const, label: '4. Gói & Topup' },
            { id: 'crm_erp' as const, label: '5. Nâng Cấp Suite' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setWorkspaceTab(tab.id)}
              className={`shrink-0 px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap cursor-pointer ${
                workspaceTab === tab.id ? 'ql-pill-tab-active rounded-xl' : 'bg-slate-100 text-slate-600'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      )}

      {/* Main Scrollable Canvas */}
      <div className="relative z-10 flex-1 overflow-y-auto">
        <div className="max-w-5xl mx-auto px-4 sm:px-8 py-7 sm:py-10 space-y-6">
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

          {successBanner && (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="font-medium leading-relaxed">{successBanner}</span>
              </div>
              <button
                type="button"
                onClick={() => setSuccessBanner(null)}
                className="text-xs font-bold text-emerald-700 hover:underline shrink-0 whitespace-nowrap"
              >
                Ẩn
              </button>
            </div>
          )}

          {/* ================================================================
              MODE A: UNAUTHENTICATED -> REGISTER WIZARD OR LOGIN
             ================================================================ */}
          {!session && authMode === 'register' && !authDiscovery && (
            <div className="space-y-8">
              {/* Stepper Indicator — Unified DOMATION Swiss Glass Bar with Subtle Dot Badges */}
              <div
                data-tour="setup-stepper"
                className="flex items-center justify-between gap-3 max-w-3xl mx-auto overflow-x-auto rounded-2xl bg-white/85 backdrop-blur-xl border border-slate-200/80 shadow-xs px-4 sm:px-6 py-3.5"
              >
                {[
                  { n: 1 as const, label: 'Tài khoản & Tổ chức', reqLabel: 'Bắt buộc', dotTone: 'bg-rose-500', reqTone: 'bg-rose-50/55 border border-rose-200/60 text-rose-700' },
                  { n: 2 as const, label: 'Quy tắc Chia Vòng', reqLabel: 'Tùy chọn', dotTone: 'bg-amber-500', reqTone: 'bg-amber-50/55 border border-amber-200/60 text-amber-800' },
                  { n: 3 as const, label: 'Zalo Bot & Kênh ngoài', reqLabel: 'Tùy chọn', dotTone: 'bg-emerald-500', reqTone: 'bg-emerald-50/60 border border-emerald-200/65 text-emerald-700' },
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
                      {idx < 2 && <div className="flex-1 min-w-6 h-px bg-slate-200/80 mx-2 hidden sm:block" />}
                    </React.Fragment>
                  );
                })}
              </div>

              {/* STEP 1: Required Organization & Admin Info + Optional Domain Preset */}
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
                        <AutoDataHelpTrigger topic="billing_3m_900k" onOpenTour={openInAppTour} />
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-50/55 border border-rose-200/60 px-2.5 py-0.5 text-[10px] font-semibold text-rose-700 whitespace-nowrap">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
                          <span>Bắt buộc (*)</span>
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-700">
                          Tên doanh nghiệp / Đội Sale *
                        </label>
                        <input
                          type="text"
                          value={companyName}
                          onChange={(e) => handleCompanyNameChange(e.target.value)}
                          placeholder="Nhập tên doanh nghiệp hoặc tên đội Sale của bạn"
                          className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm focus:border-[#1E40FF] focus:outline-none focus:ring-2 focus:ring-blue-100"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-700">Họ tên Quản trị viên *</label>
                        <input
                          type="text"
                          value={adminName}
                          onChange={(e) => setAdminName(e.target.value)}
                          placeholder="Nhập họ và tên người phụ trách quản trị"
                          className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm focus:border-[#1E40FF] focus:outline-none focus:ring-2 focus:ring-blue-100"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-700">Số điện thoại liên hệ / Zalo *</label>
                        <input
                          type="tel"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          placeholder="Nhập số điện thoại hoặc Zalo đang sử dụng"
                          className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm focus:border-[#1E40FF] focus:outline-none focus:ring-2 focus:ring-blue-100"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-700">Email quản trị *</label>
                        <input
                          type="email"
                          value={workEmail}
                          onChange={(e) => setWorkEmail(e.target.value)}
                          placeholder="Nhập email nhận thông tin tài khoản và cảnh báo"
                          className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm focus:border-[#1E40FF] focus:outline-none focus:ring-2 focus:ring-blue-100"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-700">
                          {googleProvisionToken
                            ? 'Mật khẩu dự phòng (tùy chọn — đã xác thực Google)'
                            : 'Mật khẩu khởi tạo (tối thiểu 8 ký tự) *'}
                        </label>
                        <input
                          type="password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder={
                            googleProvisionToken
                              ? 'Có thể để trống hoặc đặt thêm mật khẩu riêng'
                              : 'Nhập mật khẩu đăng nhập (ít nhất 8 ký tự)'
                          }
                          className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm focus:border-[#1E40FF] focus:outline-none focus:ring-2 focus:ring-blue-100"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between gap-2">
                          <label className="text-xs font-semibold text-slate-700">
                            {googleProvisionToken
                              ? 'Xác nhận mật khẩu dự phòng (tùy chọn)'
                              : 'Xác nhận mật khẩu khởi tạo *'}
                          </label>
                          {confirmPassword.length > 0 && (
                            <span
                              className={`text-[11px] font-semibold whitespace-nowrap ${
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
                            googleProvisionToken
                              ? 'Nhập lại nếu bạn đặt mật khẩu dự phòng'
                              : 'Nhập lại mật khẩu khởi tạo để xác nhận'
                          }
                          className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm focus:border-[#1E40FF] focus:outline-none focus:ring-2 focus:ring-blue-100"
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

                    {onOpenLegal && (
                      <p className="text-xs text-slate-500 pt-1 leading-relaxed">
                        Bằng việc khởi tạo không gian làm việc, bạn đồng ý với{' '}
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
                        </button>{' '}
                        của DOMATION.
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* STEP 2: Optional Router Configuration (Internal Sale Default!) */}
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
                    {/* Default Individual Internal Sale vs Optional External Agency F1 */}
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
                              <AutoDataHelpTrigger topic="internal_sale_default" onOpenTour={openInAppTour} />
                            </div>
                            <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                              Sale nội bộ nhận trực tiếp khách hàng kèm đầy đủ Số Điện Thoại để gọi tư vấn ngay tức thì qua Zalo.
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Optional External Agency F1 Toggle */}
                      <div className="pt-3 border-t border-blue-200/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-start gap-2.5">
                          <EyeOff className="w-4 h-4 text-slate-600 shrink-0 mt-0.5" />
                          <div className="text-xs text-slate-700 leading-relaxed">
                            <strong>Tùy chọn mở rộng:</strong> Có chia thêm giỏ hàng cho Đại lý liên kết / Cộng tác viên F1 bên ngoài công ty (Tự động che SĐT dạng <code className="font-mono">0912***678</code>)?
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setIsExternalAgency((v) => !v)}
                          className={`self-start sm:self-center rounded-full px-4 py-2 text-xs font-bold transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                            isExternalAgency
                              ? 'ql-pill-tab-active rounded-full'
                              : 'ql-btn-outline rounded-full'
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

                    <div data-tour="setup-router-algo" className="space-y-3 rounded-2xl p-1">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <div className="flex items-center gap-2">
                          <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                            2. Chính sách xử lý trùng Số Điện Thoại
                          </label>
                          <AutoDataHelpTrigger topic="dedupe_90d" onOpenTour={openInAppTour} />
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
                          slaAutoRecall ? 'border-[#1E40FF] bg-blue-50/50 ring-2 ring-blue-100' : 'border-slate-200 bg-white'
                        }`}
                      >
                        <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0">
                          <Clock className="w-5 h-5" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-semibold text-slate-900">
                                Tùy chọn thu hồi SLA nếu Sale bỏ sót (Mặc định Tắt — Chia thẳng qua Zalo)
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
                            Mặc định chia là giao thẳng qua Zalo cho Sale tới lượt, không thu hồi. Chỉ bật tùy chọn này nếu đội ngũ cần kiểm soát thu hồi tự động khi Sale không phản hồi.
                          </p>
                        </div>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 3: Required vs Optional Channels + Inline Zalo Bot A-Z Guide & Live Verification */}
              {step === 3 && (
                <div className="space-y-7">
                  <div className="text-center max-w-2xl mx-auto space-y-2.5">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50/60 border border-emerald-200/65 px-3 py-1 text-[11px] font-semibold text-emerald-700 whitespace-nowrap">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                      <span>BƯỚC 3: TÙY CHỌN • KẾT NỐI KÊNH NGOÀI &amp; ZALO BOT</span>
                    </span>
                    <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 leading-snug">
                      Kênh kết nối &amp; Xác thực Zalo Bot
                    </h2>
                    <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
                      Cổng Webhook trung tâm được cấp tự động. Các kênh Zalo Bot, Meta CAPI, REST API và Google Sheets là tùy chọn — bạn có thể kiểm tra ngay bên dưới hoặc vào thẳng hệ thống!
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
                                active ? 'bg-[#1E40FF] text-white shadow-2xs' : 'bg-slate-50 border border-slate-200/75 text-slate-700'
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

                    {/* A-Z Zalo Bot Step-by-Step Guide & Live Verification Test */}
                    <div data-tour="setup-zalo-guide">
                      <AutoDataZaloBotGuide
                        compact
                        savedZaloBot={pendingZaloBot}
                        onVerified={(saved) => setPendingZaloBot(saved)}
                        onFastSkip={() => void handleRegisterSubmit(true)}
                        fastSkipLabel="Tùy chọn — Tạm bỏ qua & vào setup ngay"
                        onOpenTour={openInAppTour}
                      />
                    </div>

                    {/* Transparent Trial & Post-Trial Step Policy Card */}
                    <div className="rounded-2xl border border-blue-200 bg-blue-50/60 p-5 space-y-2.5">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
                          <ShieldCheck className="w-5 h-5 text-blue-600 shrink-0" />
                          <span>Chính sách Dùng Thử &amp; Gia Hạn Minh Bạch DOMATION</span>
                        </div>
                        <AutoDataHelpTrigger topic="billing_3m_900k" onOpenTour={openInAppTour} />
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
                            Nâng cấp 1-click lên Marketing Automation, CRM 360° hoặc ERP 5.0 giữ 100% dữ liệu.
                          </div>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* MULTI-WORKSPACE DISCOVERY AFTER SIGN-IN (EMAIL OR GOOGLE) */}
          {!session && authDiscovery && (
            <div className="max-w-3xl mx-auto space-y-6 mt-4">
              {/* Authenticated Account Header Strip */}
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
                      {(authDiscovery.user.full_name || authDiscovery.user.email).slice(0, 1).toUpperCase()}
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
                    <p className="text-xs text-slate-500 truncate">{authDiscovery.user.email}</p>
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
                      onClick={() =>
                        handleStartCreateWorkspaceFromUser(authDiscovery.user, authDiscovery.accessToken)
                      }
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
                                <span>Quản trị viên</span>
                              </span>
                              {(ws.selected_channels?.length ?? 0) > 0 && (
                                <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 font-medium">
                                  <span>{ws.selected_channels?.length} kênh kết nối</span>
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="pt-3 border-t border-slate-200/70 flex items-center justify-between gap-3">
                            <span className="text-[11px] font-mono text-slate-400 truncate">
                              {ws.slug}
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
                  className="max-w-lg mx-auto inkica-glass-card rounded-3xl p-6 sm:p-8 space-y-5"
                >
                  <div className="space-y-1.5 text-center">
                    <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-200 text-[#1E40FF] flex items-center justify-center mx-auto mb-2">
                      <Sparkles className="w-6 h-6" />
                    </div>
                    <h2 className="text-xl font-bold text-slate-900">
                      Tạo Workspace đầu tiên trong 10 giây
                    </h2>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      Tài khoản Google <strong>{authDiscovery.user.email}</strong> chưa có Workspace nào. Nhập tên doanh nghiệp để kích hoạt miễn phí {catalog.trial_duration_months} tháng ngay.
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
                      <label className="text-xs font-semibold text-slate-700">
                        Số điện thoại / Zalo
                      </label>
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
                    {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
                    <span>Tạo Workspace &amp; Vào Ngay</span>
                  </button>

                  <div className="text-center pt-1">
                    <button
                      type="button"
                      onClick={() =>
                        handleStartCreateWorkspaceFromUser(authDiscovery.user, authDiscovery.accessToken)
                      }
                      className="text-xs font-semibold text-[#1E40FF] hover:underline cursor-pointer"
                    >
                      Hoặc tùy chỉnh chi tiết 3 bước (Chia vòng, Zalo Bot) →
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* LOGIN EXISTING WORKSPACE — NO SLUG INPUT, GOOGLE + EMAIL AUTO WORKSPACE DISCOVERY */}
          {!session && authMode === 'login' && !authDiscovery && (
            <div className="max-w-md mx-auto inkica-glass-card rounded-3xl p-6 sm:p-8 space-y-5 mt-6">
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
                onClick={() => void handleGoogleButtonClick()}
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
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
                  <span>Đăng nhập &amp; Hiện Workspace</span>
                </button>
              </form>
            </div>
          )}

          {/* ================================================================
              MODE B: AUTHENTICATED LIVE WORKSPACE CONSOLE
             ================================================================ */}
          {session && (
            <div className="space-y-6">
              {/* Top Subscription & Trial Countdown Strip */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="rounded-2xl bg-white border border-slate-200 p-5 space-y-1.5">
                  <div className="flex items-center justify-between gap-2 text-xs font-semibold text-slate-500">
                    <span>TRẠNG THÁI GÓI DỊCH VỤ</span>
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[10px] font-semibold whitespace-nowrap ${
                        session.subscription.is_expired
                          ? 'bg-rose-50/55 border-rose-200/60 text-rose-700'
                          : session.subscription.is_in_trial
                            ? 'bg-blue-50/60 border-blue-200/70 text-[#1E40FF]'
                            : 'bg-emerald-50/60 border-emerald-200/65 text-emerald-700'
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                          session.subscription.is_expired
                            ? 'bg-rose-500'
                            : session.subscription.is_in_trial
                              ? 'bg-[#1E40FF]'
                              : 'bg-emerald-500'
                        }`}
                      />
                      <span>
                        {session.subscription.is_expired
                          ? 'Hết hạn'
                          : session.subscription.is_in_trial
                            ? `Dùng thử ${catalog.trial_duration_months} tháng`
                            : 'Đang hoạt động'}
                      </span>
                    </span>
                  </div>
                  <div className="text-base font-bold text-slate-900">{session.subscription.plan_name}</div>
                  <div className="text-xs text-slate-600">
                    Còn lại <strong className="text-slate-900">{session.subscription.days_remaining} ngày</strong> (Hết hạn:{' '}
                    {new Date(session.subscription.effective_expires_at).toLocaleDateString('vi-VN')})
                  </div>
                </div>

                <div className="rounded-2xl bg-white border border-slate-200 p-5 space-y-1.5">
                  <div className="flex items-center justify-between gap-2 text-xs font-semibold text-slate-500">
                    <span>CHẾ ĐỘ NHẬN SỐ &amp; ZALO BOT</span>
                    <Users className="w-4 h-4 text-blue-600 shrink-0" />
                  </div>
                  <div className="text-sm font-bold text-slate-900">
                    {session.is_external_agency
                      ? 'Sale Nội Bộ + Đại lý F1 (Che SĐT)'
                      : 'Mặc định: Từng Sale Nội Bộ (Đủ SĐT)'}
                  </div>
                  <div className="text-xs text-slate-500 flex items-center justify-between gap-2">
                    <span>
                      Zalo Bot:{' '}
                      <strong className={session.zalo_bot?.verified ? 'text-emerald-600' : 'text-amber-700'}>
                        {session.zalo_bot?.verified ? `Đã kết nối (${session.zalo_bot.chat_id})` : 'Tùy chọn (Chưa gắn)'}
                      </strong>
                    </span>
                    {!session.zalo_bot?.verified && (
                      <button
                        type="button"
                        onClick={() => setWorkspaceTab('zalo_connect')}
                        className="text-blue-600 font-semibold hover:underline cursor-pointer whitespace-nowrap"
                      >
                        Cài Zalo →
                      </button>
                    )}
                  </div>
                </div>

                <div className="rounded-2xl bg-white border border-slate-200 p-5 space-y-1.5">
                  <div className="flex items-center justify-between gap-2 text-xs font-semibold text-slate-500">
                    <span>SỐ DƯ VÍ TOPUP</span>
                    <Wallet className="w-4 h-4 text-emerald-600 shrink-0" />
                  </div>
                  <div className="text-xl font-bold text-blue-600 font-mono">
                    {session.subscription.wallet_balance_vnd.toLocaleString('vi-VN')} ₫
                  </div>
                  <div className="text-xs text-slate-500">
                    Gia hạn {(catalog.base_monthly_price_vnd / 1000).toFixed(0)}k/tháng hoặc -{catalog.annual_discount_pct}%/năm
                  </div>
                </div>
              </div>

              {/* Post-3-Month Expiry / Expiring-Soon Step Renewal Banner */}
              {(session.subscription.is_expired || session.subscription.is_expiring_soon) && (
                <div
                  className={`rounded-2xl border p-4 sm:px-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                    session.subscription.is_expired
                      ? 'bg-rose-50 border-rose-200 text-rose-900'
                      : 'bg-amber-50 border-amber-200 text-amber-900'
                  }`}
                >
                  <div className="space-y-0.5 text-xs sm:text-sm">
                    <div className="font-bold">
                      {session.subscription.is_expired
                        ? `Chu kỳ dùng thử miễn phí ${catalog.trial_duration_months} tháng đã kết thúc — Vui lòng chọn bước tiếp theo:`
                        : `Thời hạn gói hiện tại còn ${session.subscription.days_remaining} ngày — Gia hạn sớm cộng dồn trọn vẹn số ngày còn lại:`}
                    </div>
                    <div className="text-xs opacity-90 leading-relaxed">
                      Gia hạn gói Auto Data từ <strong>{catalog.base_monthly_price_vnd.toLocaleString('vi-VN')}₫/tháng</strong>{' '}
                      (mua năm <strong>tiết kiệm {catalog.annual_discount_pct}%</strong>) hoặc nâng cấp lên{' '}
                      <strong>Automation / CRM 360° / ERP 5.0</strong>.
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                    {workspaceTab !== 'billing' && (
                      <button
                        type="button"
                        onClick={() => setWorkspaceTab('billing')}
                        className="rounded-xl bg-blue-600 text-white px-4 py-2 text-xs font-semibold hover:bg-blue-700 cursor-pointer whitespace-nowrap"
                      >
                        Chọn Gói Gia Hạn / Topup
                      </button>
                    )}
                    {workspaceTab !== 'crm_erp' && (
                      <button
                        type="button"
                        onClick={() => setWorkspaceTab('crm_erp')}
                        className="rounded-xl border border-slate-300 bg-white text-slate-800 px-4 py-2 text-xs font-semibold hover:bg-slate-50 cursor-pointer whitespace-nowrap"
                      >
                        Nâng cấp Suite
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 1: REAL WEBHOOK & LIVE ROUTER TEST */}
              {workspaceTab === 'router' && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  <div
                    data-tour="ws-webhook-panel"
                    className="lg:col-span-6 bg-white rounded-3xl border border-slate-200 p-6 space-y-5"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-bold text-emerald-800 whitespace-nowrap">
                            Bắt buộc • Đã kích hoạt
                          </span>
                          <AutoDataHelpTrigger
                            topic="apps_script"
                            label="Mã Apps Script"
                            webhookUrl={session.webhook_url}
                            saleEmail={session.admin_email}
                            onOpenTour={openInAppTour}
                          />
                        </div>
                        <h3 className="text-lg font-bold text-slate-900">
                          Cổng Inbound Webhook thực tế của bạn
                        </h3>
                        <p className="text-xs text-slate-500 leading-relaxed">
                          Gắn URL này vào LadiPage, WordPress, Google Sheets hoặc Facebook Lead Ads để đổ số thẳng vào vòng chia cho từng Sale nội bộ.
                        </p>
                      </div>
                    </div>

                    <div className="rounded-2xl bg-slate-900 text-slate-100 p-3.5 sm:p-4 space-y-2.5">
                      <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-400">
                        <span className="whitespace-nowrap">POST • JSON / FORM</span>
                        <div className="flex flex-wrap items-center gap-2">
                          <button
                            type="button"
                            onClick={() => void copyAppsScriptCode()}
                            className="inline-flex items-center gap-1 text-blue-300 hover:text-blue-200 font-semibold cursor-pointer whitespace-nowrap"
                          >
                            <Copy className="w-3.5 h-3.5 shrink-0" />
                            <span>{copiedAppsScript ? 'Đã chép Script!' : 'Chép Apps Script'}</span>
                          </button>
                          <span className="text-slate-600">|</span>
                          <button
                            type="button"
                            onClick={() => void copyWebhookUrl()}
                            className="inline-flex items-center gap-1 text-emerald-400 hover:text-emerald-300 font-semibold cursor-pointer whitespace-nowrap"
                          >
                            <Copy className="w-3.5 h-3.5 shrink-0" />
                            <span>{copiedWebhook ? 'Đã chép URL!' : 'Sao chép URL'}</span>
                          </button>
                        </div>
                      </div>
                      <div className="font-mono text-xs break-all text-blue-300">{session.webhook_url}</div>
                    </div>

                    <form
                      data-tour="ws-test-lead"
                      onSubmit={handleFireRealWebhookTest}
                      className="space-y-3.5 pt-2 border-t border-slate-100 rounded-2xl p-1"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                          Bắn thử Lead thật qua Auto Data Router
                        </span>
                        <AutoDataHelpTrigger topic="round_robin_formula" onOpenTour={openInAppTour} />
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="text-[11px] font-semibold text-slate-600">Họ tên khách hàng</label>
                          <input
                            type="text"
                            required
                            value={testLeadName}
                            onChange={(e) => setTestLeadName(e.target.value)}
                            className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                          />
                        </div>
                        <div>
                          <label className="text-[11px] font-semibold text-slate-600">Số điện thoại (thử trùng/mới)</label>
                          <input
                            type="tel"
                            required
                            value={testLeadPhone}
                            onChange={(e) => setTestLeadPhone(e.target.value)}
                            className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm font-mono"
                          />
                        </div>
                        <div>
                          <label className="text-[11px] font-semibold text-slate-600">Nguồn chiến dịch (UTM)</label>
                          <input
                            type="text"
                            value={testLeadSource}
                            onChange={(e) => setTestLeadSource(e.target.value)}
                            className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                          />
                        </div>
                        <div>
                          <label className="text-[11px] font-semibold text-slate-600">Nhu cầu quan tâm</label>
                          <input
                            type="text"
                            value={testLeadInterest}
                            onChange={(e) => setTestLeadInterest(e.target.value)}
                            className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                          />
                        </div>
                      </div>
                      <button
                        type="submit"
                        disabled={submitting}
                        className="w-full rounded-xl bg-blue-600 text-white py-3 px-5 text-sm font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 whitespace-nowrap"
                      >
                        {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                        <span>Bắn Lead Thật Vào Vòng Chia Số</span>
                      </button>
                    </form>
                  </div>

                  <div className="lg:col-span-6 bg-white rounded-3xl border border-slate-200 p-6 space-y-5">
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <h3 className="text-lg font-bold text-slate-900">Kết quả định tuyến thời gian thực</h3>
                        <p className="text-xs text-slate-500">
                          Bấm bắn nhiều lần liên tiếp với SĐT mới hoặc SĐT trùng để kiểm chứng vòng chia.
                        </p>
                      </div>
                      {lastWebhookResult && (
                        <span className="rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-1 text-xs font-mono font-bold text-emerald-700 whitespace-nowrap shrink-0">
                          {lastWebhookResult.latency_ms} ms
                        </span>
                      )}
                    </div>

                    {lastWebhookResult ? (
                      <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-4 space-y-2 text-xs">
                        <div className="flex items-center justify-between gap-2 font-bold text-slate-900 flex-wrap">
                          <span>Sale nhận số: {lastWebhookResult.assigned_to_name}</span>
                          {lastWebhookResult.is_duplicate && (
                            <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-[10px] text-amber-800 whitespace-nowrap">
                              Trùng SĐT 90d → Trả về Sale cũ
                            </span>
                          )}
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-600 pt-1">
                          <div>
                            Hiển thị SĐT:{' '}
                            <strong className="font-mono text-slate-900">
                              {lastWebhookResult.displayed_phone || testLeadPhone}
                            </strong>{' '}
                            <span className="text-[11px] text-slate-500">
                              ({lastWebhookResult.is_external_f1 ? 'F1 Che số' : 'Sale Nội Bộ'})
                            </span>
                          </div>
                          <div>
                            Thuật toán: <strong className="text-slate-900">{lastWebhookResult.distribution_mode}</strong>
                          </div>
                          <div className="sm:col-span-2 text-emerald-800 font-medium">
                            • {lastWebhookResult.zalobot_status}
                          </div>
                          <div className="sm:col-span-2 text-blue-800 font-medium">
                            • {lastWebhookResult.capi_status}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center text-xs text-slate-500 leading-relaxed">
                        Chưa có lượt bắn thử trong phiên này. Nhấn nút <strong>&ldquo;Bắn Lead Thật Vào Vòng Chia Số&rdquo;</strong> bên trái để kiểm tra kết nối backend!
                      </div>
                    )}

                    <div className="space-y-2">
                      <div className="text-xs font-bold uppercase tracking-wider text-slate-500">
                        Nhật ký Vòng Chia Công Ty gần nhất ({recentLeads.length})
                      </div>
                      <div className="divide-y divide-slate-100 border border-slate-100 rounded-2xl overflow-hidden">
                        {recentLeads.length === 0 ? (
                          <div className="p-4 text-xs text-slate-400 text-center">Danh sách đang trống</div>
                        ) : (
                          recentLeads.slice(0, 6).map((item) => (
                            <div key={item.id} className="px-4 py-2.5 flex items-center justify-between gap-2 text-xs">
                              <div className="min-w-0">
                                <div className="font-semibold text-slate-900 truncate">{item.name}</div>
                                <div className="font-mono text-[11px] text-slate-500">
                                  {item.masked_phone || item.phone} • {item.utm_source || 'webhook'}
                                </div>
                              </div>
                              <div className="text-right shrink-0">
                                <div className="font-semibold text-blue-700">
                                  {item.assigned_to_name || 'Đã vào vòng chia'}
                                </div>
                                {item.is_duplicate && (
                                  <span className="text-[10px] text-amber-600 font-semibold">Trùng SĐT</span>
                                )}
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: SALE PORT PERSONAL LEADS, CSV EXPORT & 2-WAY GOOGLE SHEETS SYNC */}
              {workspaceTab === 'sale_port' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    <div
                      data-tour="ws-sale-port"
                      className="lg:col-span-5 bg-white rounded-3xl border border-slate-200 p-4 sm:p-6 space-y-5"
                    >
                      <div className="space-y-1.5">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-[11px] font-bold text-emerald-800 whitespace-nowrap">
                            Giỏ Riêng Độc Lập • 0 Quota
                          </span>
                          <AutoDataHelpTrigger topic="sale_port_personal" onOpenTour={openInAppTour} />
                        </div>
                        <h3 className="text-lg font-bold text-slate-900">
                          Cổng Sale Cá Nhân — Tự nhập / Import Data riêng
                        </h3>
                        <p className="text-xs text-slate-500 leading-relaxed">
                          Khách hàng do chính Sale tự tìm kiếm sẽ đi thẳng vào giỏ riêng của Sale đó: không qua vòng chia chung và không tính vào quota nhận số Ads.
                        </p>
                      </div>

                      <input
                        ref={csvFileInputRef}
                        type="file"
                        accept=".csv,text/csv,.txt"
                        onChange={(e) => void handleImportPersonalCsvFile(e)}
                        data-testid="personal-csv-file-input"
                        className="hidden"
                      />

                      <form onSubmit={handleAddPersonalLead} className="space-y-3.5">
                        <div>
                          <label className="text-xs font-semibold text-slate-700">Họ tên khách hàng cá nhân *</label>
                          <input
                            type="text"
                            required
                            value={pLeadName}
                            onChange={(e) => setPLeadName(e.target.value)}
                            placeholder="Nhập họ tên đầy đủ của khách hàng cá nhân"
                            className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm focus:border-[#1E40FF] focus:outline-none focus:ring-2 focus:ring-blue-100"
                          />
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="text-xs font-semibold text-slate-700">Số điện thoại *</label>
                            <input
                              type="tel"
                              required
                              value={pLeadPhone}
                              onChange={(e) => setPLeadPhone(e.target.value)}
                              placeholder="Nhập số điện thoại liên hệ của khách"
                              className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm font-mono focus:border-[#1E40FF] focus:outline-none focus:ring-2 focus:ring-blue-100"
                            />
                          </div>
                          <div>
                            <label className="text-xs font-semibold text-slate-700">Sale sở hữu trực tiếp</label>
                            <input
                              type="text"
                              value={pLeadOwner}
                              onChange={(e) => setPLeadOwner(e.target.value)}
                              placeholder="Nhập tên Sale giữ khách hàng này"
                              className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm focus:border-[#1E40FF] focus:outline-none focus:ring-2 focus:ring-blue-100"
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="text-xs font-semibold text-slate-700">Sản phẩm / Nhu cầu quan tâm</label>
                            <input
                              type="text"
                              value={pLeadInterest}
                              onChange={(e) => setPLeadInterest(e.target.value)}
                              placeholder="Nhập sản phẩm hoặc dịch vụ khách cần"
                              className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm focus:border-[#1E40FF] focus:outline-none focus:ring-2 focus:ring-blue-100"
                            />
                          </div>
                          <div>
                            <label className="text-xs font-semibold text-slate-700">Ghi chú chăm sóc riêng</label>
                            <input
                              type="text"
                              value={pLeadNote}
                              onChange={(e) => setPLeadNote(e.target.value)}
                              placeholder="Nhập ghi chú lịch sử trao đổi riêng"
                              className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm focus:border-[#1E40FF] focus:outline-none focus:ring-2 focus:ring-blue-100"
                            />
                          </div>
                        </div>
                        <label className="flex items-center gap-2.5 text-xs text-slate-700 cursor-pointer pt-1">
                          <input
                            type="checkbox"
                            checked={pSheetSync}
                            onChange={(e) => setPSheetSync(e.target.checked)}
                            className="rounded border-slate-300 text-blue-600"
                          />
                          <span>Tự động đồng bộ 2 chiều sang Google Sheet cá nhân của Sale</span>
                        </label>
                        <div className="flex flex-col gap-2.5 pt-1">
                          <button
                            type="submit"
                            disabled={submitting}
                            className="btn-inkica-primary w-full py-3 px-3.5 sm:px-5 text-xs sm:text-sm cursor-pointer whitespace-nowrap disabled:opacity-60"
                          >
                            {submitting ? (
                              <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                            ) : (
                              <PlusCircle className="w-4 h-4 shrink-0" />
                            )}
                            <span>Lưu Vào Giỏ Cá Nhân (Bypass Vòng Chia)</span>
                          </button>
                          <button
                            type="button"
                            disabled={submitting}
                            onClick={() => csvFileInputRef.current?.click()}
                            className="w-full rounded-xl border border-blue-200 bg-blue-50/70 hover:bg-blue-100 text-blue-800 py-2.5 px-3.5 sm:px-5 text-xs sm:text-sm font-semibold transition-colors inline-flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap disabled:opacity-60"
                          >
                            <Upload className="w-4 h-4 shrink-0" />
                            <span>Import Hàng Loạt Từ File CSV (.csv)</span>
                          </button>
                        </div>
                      </form>
                    </div>

                    <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-200 p-4 sm:p-6 space-y-5">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div>
                          <h3 className="text-lg font-bold text-slate-900">
                            Danh sách Lead Cá Nhân &amp; Đồng bộ Google Sheets 2 Chiều
                          </h3>
                          <p className="text-xs text-slate-500">
                            Import/Xuất file CSV chuẩn tiếng Việt hoặc sao chép mã Apps Script đồng bộ Sheet riêng cho từng Sale.
                          </p>
                        </div>
                        <div className="flex flex-wrap items-center gap-2 shrink-0">
                          <button
                            type="button"
                            disabled={submitting}
                            onClick={() => csvFileInputRef.current?.click()}
                            className="inline-flex items-center gap-1.5 rounded-xl border border-blue-200 bg-blue-50 hover:bg-blue-100 px-3.5 py-2 text-xs font-semibold text-blue-800 cursor-pointer whitespace-nowrap disabled:opacity-60"
                          >
                            <Upload className="w-3.5 h-3.5 shrink-0" />
                            <span>Import CSV Riêng</span>
                          </button>
                          <button
                            type="button"
                            onClick={handleDownloadPersonalCsv}
                            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 px-3.5 py-2 text-xs font-semibold text-slate-800 cursor-pointer whitespace-nowrap"
                          >
                            <Download className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                            <span>Xuất CSV Cá Nhân ({personalLeads.length})</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => void copyAppsScriptCode()}
                            className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-2 text-xs font-semibold cursor-pointer whitespace-nowrap"
                          >
                            <Copy className="w-3.5 h-3.5 shrink-0" />
                            <span>{copiedAppsScript ? 'Đã chép Script!' : 'Chép Script Sheets 2 Chiều'}</span>
                          </button>
                        </div>
                      </div>

                      <div className="divide-y divide-slate-100 border border-slate-200 rounded-2xl overflow-hidden">
                        {personalLeads.map((item) => (
                          <div key={item.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                            <div className="space-y-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-bold text-slate-900">{item.name}</span>
                                <span className="font-mono font-semibold text-blue-700">{item.phone}</span>
                              </div>
                              <div className="text-slate-600">{item.note}</div>
                              <div className="text-[11px] text-emerald-700 font-medium">
                                ⇄ {item.sheet_sync_status}
                              </div>
                            </div>
                            <div className="flex sm:flex-col items-start sm:items-end gap-1.5 shrink-0">
                              <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-bold text-slate-800 whitespace-nowrap">
                                {item.sale_owner_name}
                              </span>
                              <span className="rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700 whitespace-nowrap">
                                0 Quota • Giỏ Riêng Độc Lập
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 flex items-center justify-between gap-3 text-xs">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <FolderKanban className="w-4 h-4 text-blue-600 shrink-0" />
                          <span className="text-slate-700 leading-relaxed">
                            Cần xem chi tiết mã <strong>Google Apps Script 2 Chiều</strong> (onFormSubmit &amp; onEdit) cho từng Sale?
                          </span>
                        </div>
                        <AutoDataHelpTrigger
                          topic="apps_script"
                          label="Xem mã Script"
                          webhookUrl={session.webhook_url}
                          saleEmail={session.admin_email}
                          onOpenTour={openInAppTour}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: OPTIONAL ZALO BOT A-Z GUIDE & LIVE CONNECTION VERIFICATION */}
              {workspaceTab === 'zalo_connect' && (
                <div data-tour="ws-zalo-guide">
                  <AutoDataZaloBotGuide
                    accessToken={session.access_token}
                    tenantSlug={session.tenant_slug}
                    savedZaloBot={session.zalo_bot}
                    onVerified={(saved) =>
                      onSessionChange({
                        ...session,
                        zalo_bot: saved,
                      })
                    }
                    onFastSkip={() => setWorkspaceTab('router')}
                    fastSkipLabel="Tùy chọn — Tạm bỏ qua & quay lại Webhook"
                    onOpenTour={openInAppTour}
                  />
                </div>
              )}

              {/* TAB 4: STEP RENEWAL PLANS & WALLET TOPUP */}
              {workspaceTab === 'billing' && (
                <div className="space-y-6">
                  {transferOrderInfo && (
                    <div className="rounded-2xl border-2 border-blue-200 bg-blue-50/70 p-5 space-y-3">
                      <div className="flex items-center justify-between gap-2">
                        <div className="text-sm font-bold text-slate-900">{transferOrderInfo.title}</div>
                        <button
                          type="button"
                          onClick={() => setTransferOrderInfo(null)}
                          className="text-xs font-semibold text-slate-500 hover:text-slate-900 whitespace-nowrap cursor-pointer"
                        >
                          Đóng hướng dẫn
                        </button>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
                        <div className="rounded-xl bg-white p-3 border border-blue-100">
                          <div className="text-slate-500">Ngân hàng</div>
                          <div className="font-bold text-slate-900 mt-0.5">{catalog.payment_bank_info.bank_name}</div>
                        </div>
                        <div className="rounded-xl bg-white p-3 border border-blue-100">
                          <div className="text-slate-500">Số tài khoản</div>
                          <div className="font-mono font-bold text-blue-700 mt-0.5">
                            {catalog.payment_bank_info.account_number}
                          </div>
                        </div>
                        <div className="rounded-xl bg-white p-3 border border-blue-100">
                          <div className="text-slate-500">Số tiền</div>
                          <div className="font-mono font-bold text-emerald-700 mt-0.5">
                            {transferOrderInfo.amount_vnd.toLocaleString('vi-VN')} ₫
                          </div>
                        </div>
                        <div className="rounded-xl bg-white p-3 border border-blue-100">
                          <div className="text-slate-500">Nội dung chuyển khoản</div>
                          <div className="font-mono font-bold text-rose-600 mt-0.5">
                            {transferOrderInfo.reference_code}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  <div
                    data-tour="ws-billing-plans"
                    className="bg-white rounded-3xl border border-slate-200 p-6 space-y-6"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-lg font-bold text-slate-900">
                            Các gói gia hạn sau {catalog.trial_duration_months} tháng miễn phí
                          </h3>
                          <AutoDataHelpTrigger topic="billing_3m_900k" onOpenTour={openInAppTour} />
                        </div>
                        <p className="text-xs text-slate-500 mt-1">
                          Gia hạn sớm được cộng dồn trực tiếp vào số ngày dùng thử còn lại — không mất ngày nào.
                        </p>
                      </div>
                      <div className="inline-flex items-center gap-1.5 bg-slate-100 p-1 rounded-full self-start shrink-0">
                        <button
                          type="button"
                          onClick={() => setBillingCycle('monthly')}
                          className={`px-3.5 py-1.5 rounded-full text-xs font-semibold cursor-pointer whitespace-nowrap ${
                            billingCycle === 'monthly' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'
                          }`}
                        >
                          Theo tháng ({(catalog.base_monthly_price_vnd / 1000).toFixed(0)}k)
                        </button>
                        <button
                          type="button"
                          onClick={() => setBillingCycle('annual')}
                          className={`px-3.5 py-1.5 rounded-full text-xs font-semibold cursor-pointer whitespace-nowrap ${
                            billingCycle === 'annual' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600'
                          }`}
                        >
                          Theo năm (-{catalog.annual_discount_pct}%)
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {catalog.plans.map((plan) => {
                        const perMonth =
                          billingCycle === 'annual' ? plan.annual_monthly_equivalent_vnd : plan.monthly_price_vnd;
                        const totalPayable =
                          billingCycle === 'annual' ? plan.annual_total_vnd : plan.monthly_price_vnd;
                        return (
                          <div
                            key={plan.code}
                            className={`rounded-2xl border p-5 flex flex-col justify-between ${
                              plan.is_enterprise_upgrade
                                ? 'bg-gradient-to-br from-blue-50/90 via-white to-cyan-50/70 text-slate-900 border-blue-300 shadow-sm'
                                : 'bg-white text-slate-900 border-slate-200'
                            }`}
                          >
                            <div data-tour="setup-router-algo" className="space-y-3 rounded-2xl p-1">
                              <div className="flex items-center justify-between gap-2">
                                <span className="text-[11px] font-bold uppercase tracking-wider text-[#1E40FF] whitespace-nowrap">
                                  Step 0{plan.step_order}
                                </span>
                                {plan.badge && (
                                  <span
                                    className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold whitespace-nowrap ${
                                      plan.is_enterprise_upgrade
                                        ? 'bg-gradient-to-r from-[#1E40FF] to-[#0284C7] text-white'
                                        : 'bg-blue-50 text-[#1E40FF]'
                                    }`}
                                  >
                                    {plan.badge}
                                  </span>
                                )}
                              </div>
                              <div className="text-base font-bold">{plan.name}</div>
                              <div>
                                <span className="text-2xl font-extrabold font-mono text-slate-900">
                                  {perMonth.toLocaleString('vi-VN')}₫
                                </span>
                                <span className="text-xs text-slate-500"> / tháng</span>
                                {billingCycle === 'annual' && (
                                  <div className="text-[11px] font-semibold mt-0.5 text-emerald-700">
                                    Cả năm: {plan.annual_total_vnd.toLocaleString('vi-VN')}₫ (Tiết kiệm{' '}
                                    {plan.annual_saved_vnd.toLocaleString('vi-VN')}₫)
                                  </div>
                                )}
                              </div>
                              <ul className="space-y-1.5 pt-2 border-t border-slate-200/70 text-xs">
                                {plan.features.slice(0, 4).map((f, i) => (
                                  <li key={i} className="flex items-start gap-2">
                                    <Check className="w-3.5 h-3.5 shrink-0 mt-0.5 text-[#1E40FF]" />
                                    <span className="text-slate-700 leading-relaxed">{f}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>

                            <button
                              type="button"
                              disabled={submitting}
                              onClick={() => void handleSubscribePlan(plan)}
                              className={`mt-5 w-full py-2.5 px-4 text-xs font-bold cursor-pointer whitespace-nowrap ${
                                plan.is_enterprise_upgrade ? 'btn-inkica-primary' : 'ql-btn-outline'
                              }`}
                            >
                              {session.subscription.wallet_balance_vnd >= totalPayable
                                ? `Gia hạn bằng Ví (${totalPayable.toLocaleString('vi-VN')}₫)`
                                : `Chọn gói (${totalPayable.toLocaleString('vi-VN')}₫)`}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Wallet Topup Section */}
                  <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-4">
                    <div className="flex items-center justify-between flex-wrap gap-3">
                      <div className="flex items-center gap-2.5">
                        <CreditCard className="w-5 h-5 text-blue-600 shrink-0" />
                        <div>
                          <h4 className="text-base font-bold text-slate-900">Nạp Ví Topup Gia Hạn Nhanh</h4>
                          <p className="text-xs text-slate-500">
                            Chủ động nạp trước để gia hạn gói tự động không gián đoạn luồng quảng cáo.
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        disabled={submitting}
                        onClick={() => void handleCreateTopupOrder()}
                        className="rounded-xl bg-blue-600 text-white px-4 py-2.5 text-xs font-bold hover:bg-blue-700 transition-colors cursor-pointer whitespace-nowrap"
                      >
                        Tạo Lệnh Nạp Gói Đang Chọn
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                      {catalog.topup_packages.map((pkg) => {
                        const active = selectedTopupId === pkg.id;
                        return (
                          <button
                            key={pkg.id}
                            type="button"
                            onClick={() => setSelectedTopupId(pkg.id)}
                            className={`rounded-2xl border p-4 text-left cursor-pointer transition-all ${
                              active ? 'border-blue-600 bg-blue-50/50 ring-2 ring-blue-100' : 'border-slate-200'
                            }`}
                          >
                            <div className="text-xs font-bold text-slate-800">{pkg.label}</div>
                            <div className="text-lg font-extrabold text-blue-600 font-mono mt-1">
                              {pkg.amount_vnd.toLocaleString('vi-VN')}₫
                            </div>
                            <div className="text-[11px] text-slate-500 mt-1">{pkg.equivalent_months_note}</div>
                          </button>
                        );
                      })}
                    </div>

                    {transactions.length > 0 && (
                      <div className="pt-3 border-t border-slate-100 space-y-2">
                        <div className="text-xs font-bold text-slate-500 uppercase">Lịch sử giao dịch gần đây</div>
                        <div className="space-y-1.5">
                          {transactions.slice(0, 5).map((tx) => (
                            <div
                              key={tx.id}
                              className="flex items-center justify-between gap-2 text-xs bg-slate-50 rounded-xl px-3.5 py-2"
                            >
                              <div className="min-w-0 truncate">
                                <span className="font-mono font-bold text-slate-800 mr-2">{tx.reference_code}</span>
                                <span className="text-slate-600">{tx.note}</span>
                              </div>
                              <div className="flex items-center gap-3 shrink-0">
                                <span className="font-mono font-bold text-slate-900 whitespace-nowrap">
                                  {tx.amount_vnd.toLocaleString('vi-VN')}₫
                                </span>
                                <span
                                  className={`rounded-md px-2 py-0.5 text-[10px] font-bold whitespace-nowrap ${
                                    tx.status === 'approved' || tx.status === 'completed'
                                      ? 'bg-emerald-100 text-emerald-800'
                                      : 'bg-amber-100 text-amber-800'
                                  }`}
                                >
                                  {tx.status}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 5: UPGRADE TO AUTOMATION / FULL CRM 360 / ENTERPRISE ERP 5.0 */}
              {workspaceTab === 'crm_erp' && (
                <form
                  onSubmit={handleRequestCrmErpUpgrade}
                  className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 space-y-6"
                >
                  <div className="flex items-start justify-between flex-wrap gap-4">
                    <div className="space-y-1.5 max-w-xl">
                      <div className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600">
                        <Sparkles className="w-4 h-4 shrink-0" />
                        <span>LỘ TRÌNH MỞ RỘNG HỆ SINH THÁI DOMATION</span>
                      </div>
                      <h3 className="text-xl font-bold text-slate-900 leading-snug">
                        Mở rộng lên Marketing Automation, Full CRM 360° &amp; ERP 5.0
                      </h3>
                      <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                        Giữ nguyên 100% danh sách Lead công ty, dữ liệu Cổng Sale cá nhân, cấu trúc nhân sự và cổng Webhook đang chạy.
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2.5">
                      <a
                        href={catalog.automation_upgrade_url || '/automation'}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded-xl border border-slate-200 px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 inline-flex items-center gap-1 whitespace-nowrap"
                      >
                        <span>Marketing Automation</span>
                        <ArrowUpRight className="w-3.5 h-3.5 shrink-0" />
                      </a>
                      <a
                        href={catalog.crm_upgrade_url || '/crm'}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded-xl border border-slate-200 px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 inline-flex items-center gap-1 whitespace-nowrap"
                      >
                        <span>Full CRM 360°</span>
                        <ArrowUpRight className="w-3.5 h-3.5 shrink-0" />
                      </a>
                      <a
                        href={catalog.erp_upgrade_url || '/erp'}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded-xl border border-slate-200 px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 inline-flex items-center gap-1 whitespace-nowrap"
                      >
                        <span>Enterprise ERP 5.0</span>
                        <ArrowUpRight className="w-3.5 h-3.5 shrink-0" />
                      </a>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                    {[
                      {
                        id: 'automation' as const,
                        title: 'Marketing Automation & AI RAG (/automation)',
                        desc: 'Kịch bản nuôi dưỡng tự động IF/ELSE, Email kéo thả, Zalo ZNS hàng loạt & AI Chatbot trực 24/7.',
                      },
                      {
                        id: 'crm' as const,
                        title: 'Full DOMATION CRM 360° (/crm)',
                        desc: 'Quản trị phễu Kanban 8 nấc chuyên sâu, CSKH đa điểm chạm, Báo giá, Hợp đồng & Hóa đơn điện tử.',
                      },
                      {
                        id: 'erp' as const,
                        title: 'DOMATION Enterprise ERP 5.0 (/erp)',
                        desc: '12 phân hệ quản trị tổng thể: HRM chấm công GPS AI, KPI lương thưởng, Tài chính & Kho vận.',
                      },
                      {
                        id: 'crm_erp_bundle' as const,
                        title: 'Trọn Bộ Hợp Nhất Automation + CRM + ERP',
                        desc: 'Đồng bộ xuyên suốt từ lúc Lead đổ về Quảng cáo tới Chăm sóc tự động, Doanh thu & Hoa hồng.',
                      },
                    ].map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setUpgradeSuite(opt.id)}
                        className={`rounded-2xl border p-4 text-left cursor-pointer transition-all ${
                          upgradeSuite === opt.id
                            ? 'border-blue-600 bg-blue-50/50 ring-2 ring-blue-100'
                            : 'border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <div className="text-sm font-bold text-slate-900">{opt.title}</div>
                        <p className="text-xs text-slate-500 mt-1 leading-relaxed">{opt.desc}</p>
                      </button>
                    ))}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-semibold text-slate-700">
                        Số điện thoại Giám đốc / Trưởng phòng nhận tư vấn chuyển đổi
                      </label>
                      <input
                        type="tel"
                        required
                        value={upgradePhone}
                        onChange={(e) => setUpgradePhone(e.target.value)}
                        placeholder="Nhập số điện thoại người phụ trách nhận tư vấn"
                        className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm focus:border-[#1E40FF] focus:outline-none focus:ring-2 focus:ring-blue-100"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-700">Ghi chú quy mô nhân sự / nhu cầu</label>
                      <input
                        type="text"
                        value={upgradeNote}
                        onChange={(e) => setUpgradeNote(e.target.value)}
                        placeholder="Nhập số lượng nhân sự và phân hệ cần mở rộng"
                        className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm focus:border-[#1E40FF] focus:outline-none focus:ring-2 focus:ring-blue-100"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="btn-inkica-primary px-6 py-3 text-sm cursor-pointer whitespace-nowrap"
                  >
                    {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                    <span>Gửi Yêu Cầu Nâng Cấp Hệ Sinh Thái</span>
                  </button>
                </form>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Sticky Bottom Action Bar for 3-Step Registration Wizard — With Fast-Skip CTA */}
      {!session && authMode === 'register' && !authDiscovery && (
        <footer className="relative z-10 shrink-0 border-t border-slate-200/80 bg-white/90 backdrop-blur-md px-4 sm:px-8 py-3">
          <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-stretch md:items-center justify-between gap-2.5 sm:gap-3">
            <div className="flex items-center justify-between md:justify-start gap-3">
              {step > 1 ? (
                <button
                  type="button"
                  onClick={() => setStep((s) => (s === 3 ? 2 : 1))}
                  className="ql-btn-outline px-3.5 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm cursor-pointer whitespace-nowrap"
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

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center sm:justify-end gap-2 sm:gap-2.5">
              {/* Fast-Skip Optional Steps CTA */}
              <button
                type="button"
                disabled={submitting}
                onClick={() => void handleRegisterSubmit(true)}
                className="ql-btn-outline px-3.5 sm:px-4 py-2.5 text-xs sm:text-sm transition-colors cursor-pointer whitespace-nowrap disabled:opacity-60"
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
                  className="btn-inkica-primary px-4 sm:px-5 py-2.5 text-xs sm:text-sm cursor-pointer whitespace-nowrap"
                >
                  <span>Tiếp theo</span>
                  <ArrowRight className="w-4 h-4 shrink-0" />
                </button>
              ) : (
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => void handleRegisterSubmit(false)}
                  className="btn-inkica-primary px-4 sm:px-5 py-2.5 text-xs sm:text-sm cursor-pointer disabled:opacity-60 whitespace-nowrap"
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
          </div>
        </footer>
      )}

      {/* GOOGLE ACCOUNT CHOOSER OVERLAY (WHEN GOOGLE_CLIENT_ID IS NOT CONFIGURED ON LOCAL/PREVIEW) */}
      {googleModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Chọn tài khoản Google"
          className="fixed inset-0 z-[135] bg-slate-900/45 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <div className="w-full max-w-md rounded-3xl bg-white border border-slate-200 shadow-2xl p-6 sm:p-7 space-y-5">
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
                className="rounded-full p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
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
                          dev_google_email: acc.email,
                          dev_google_name: acc.full_name,
                        })
                      }
                      className="w-full rounded-2xl border border-slate-200 hover:border-[#1E40FF] hover:bg-blue-50/50 px-3.5 py-2.5 flex items-center justify-between gap-3 transition-all cursor-pointer text-left disabled:opacity-60"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#1E40FF] to-[#0284C7] text-white text-xs font-bold flex items-center justify-center shrink-0">
                          {acc.full_name.slice(0, 1).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-slate-900 truncate">{acc.full_name}</div>
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
                  dev_google_email: googleInputEmail.trim(),
                  dev_google_name: googleInputName.trim() || undefined,
                });
              }}
              className="space-y-3 pt-2 border-t border-slate-100"
            >
              <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                {recentGoogleAccounts.length > 0
                  ? 'Hoặc dùng tài khoản Google khác'
                  : 'Nhập tài khoản Google / Gmail công việc'}
              </div>
              <div className="space-y-1.5">
                <input
                  type="email"
                  required
                  value={googleInputEmail}
                  onChange={(e) => setGoogleInputEmail(e.target.value)}
                  placeholder="tenban@gmail.com hoặc email Google Workspace"
                  className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm focus:border-[#1E40FF] focus:outline-none focus:ring-2 focus:ring-blue-100"
                />
              </div>
              <div className="space-y-1.5">
                <input
                  type="text"
                  value={googleInputName}
                  onChange={(e) => setGoogleInputName(e.target.value)}
                  placeholder="Họ và tên hiển thị (tùy chọn)"
                  className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm focus:border-[#1E40FF] focus:outline-none focus:ring-2 focus:ring-blue-100"
                />
              </div>
              <button
                type="submit"
                disabled={googleLoading}
                className="btn-inkica-primary w-full py-2.5 px-4 text-sm cursor-pointer disabled:opacity-60 whitespace-nowrap"
              >
                {googleLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <GoogleLogoMark className="w-4 h-4" />}
                <span>Tiếp tục với Google</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* IN-APP SPOTLIGHT HIGHLIGHT + FLOATING COACHMARK TOUR */}
      <AutoDataSpotlightTour
        open={open && tourOpen}
        steps={activeTourSteps}
        activeStepIndex={tourStepIdx}
        onStepChange={handleTourStepChange}
        onClose={() => setTourOpen(false)}
        onFinish={() => setTourOpen(false)}
      />
    </div>
  );
}
