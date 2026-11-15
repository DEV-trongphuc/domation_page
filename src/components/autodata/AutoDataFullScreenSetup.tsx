import React, { useEffect, useState } from 'react';
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
  ShoppingBag,
  SlidersHorizontal,
  Sparkles,
  Table2,
  UserCheck,
  Users,
  Wallet,
  Webhook,
  X,
} from 'lucide-react';
import { AutoDataHelpTrigger } from './AutoDataHelpTour';
import { AutoDataZaloBotGuide } from './AutoDataZaloBotGuide';
import {
  buildGoogleAppsScriptSnippet,
  buildPersonalLeadsCsvContent,
  type ClientBillingCatalog,
  type ClientBillingPlan,
  type ClientBillingTransaction,
  type ClientSessionState,
  type HelpTopicKey,
  type LegalDocTab,
  type PersonalSaleLeadItem,
  type SetupModalIntent,
  type ZaloBotSavedState,
} from './autodataTypes';

interface AutoDataFullScreenSetupProps {
  open: boolean;
  initialIntent: SetupModalIntent;
  catalog: ClientBillingCatalog;
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
    key: 'ecommerce',
    label: 'Thương Mại & Chuỗi Bán Lẻ',
    subtitle: 'Chia đơn chốt sale đa kênh Landing Page, TikTok, Facebook',
    icon: ShoppingBag,
    pipelineName: 'Phễu Chốt Đơn & Chăm Sóc Khách Hàng VIP',
  },
  {
    key: 'automotive',
    label: 'Showroom Ô Tô & Tài Chính Bảo Hiểm',
    subtitle: 'Phân bổ đăng ký lái thử, thẩm định hồ sơ vay nhanh < 4s',
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
    title: 'ZaloBot Báo Số Từng Sale (< 4s)',
    desc: 'Nhận thông báo khách mới qua Zalo cá nhân/nhóm bằng mã /chatid (Có thể cài sau).',
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

export default function AutoDataFullScreenSetup({
  open,
  initialIntent,
  catalog,
  session,
  onSessionChange,
  onClose,
  onOpenLegal,
  onOpenTour,
}: AutoDataFullScreenSetupProps) {
  const [authMode, setAuthMode] = useState<'register' | 'login'>(
    initialIntent === 'login' ? 'login' : 'register'
  );
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [workspaceTab, setWorkspaceTab] = useState<WorkspaceTabKey>(() => {
    if (initialIntent === 'workspace_crm_erp') return 'crm_erp';
    if (initialIntent === 'workspace_sale_port') return 'sale_port';
    if (initialIntent === 'workspace_zalo') return 'zalo_connect';
    if (initialIntent === 'workspace_billing' || session?.subscription?.is_expired) return 'billing';
    return 'router';
  });

  // Registration Step 1 state (Required core fields)
  const [companyName, setCompanyName] = useState('');
  const [tenantSlug, setTenantSlug] = useState('');
  const [slugTouched, setSlugTouched] = useState(false);
  const [slugStatus, setSlugStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle');
  const [domainKey, setDomainKey] = useState<string>('general');
  const [adminName, setAdminName] = useState('');
  const [workEmail, setWorkEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');

  // Registration Step 2 state — Individual Internal Sale is strictly DEFAULT (is_external_agency = false)
  const [routerMode, setRouterMode] = useState<RouterModeOption['key']>('weighted_round_robin');
  const [dedupPolicy, setDedupPolicy] = useState<DedupPolicyOption['key']>('route_to_existing_owner');
  const [dedupDays, setDedupDays] = useState<number>(90);
  const [isExternalAgency, setIsExternalAgency] = useState<boolean>(false);
  const [slaAutoRecall, setSlaAutoRecall] = useState<boolean>(true);

  // Registration Step 3 state (Channels + Optional Zalo Bot preview)
  const [selectedChannels, setSelectedChannels] = useState<string[]>([
    'webhook',
    'zalobot',
    'sheets_tiktok',
  ]);
  const [pendingZaloBot, setPendingZaloBot] = useState<ZaloBotSavedState | null>(null);

  // Login state
  const [loginSlug, setLoginSlug] = useState('');
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

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
  const [pLeadNote, setPLeadNote] = useState('Đi thẳng vào giỏ riêng, miễn thu hồi SLA');
  const [pSheetSync, setPSheetSync] = useState(true);

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

  // Real-time HTTP check-slug debounce
  useEffect(() => {
    if (!open || session || authMode !== 'register') return;
    const clean = tenantSlug.trim();
    if (clean.length < 2) return;
    let cancelled = false;
    const timer = window.setTimeout(async () => {
      try {
        const res = await fetch(`/api/autodata?action=check-slug&slug=${encodeURIComponent(clean)}`);
        const json = (await res.json()) as { data?: { available?: boolean } };
        if (!cancelled) {
          setSlugStatus(json.data?.available ? 'available' : 'taken');
        }
      } catch {
        if (!cancelled) setSlugStatus('idle');
      }
    }, 320);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [open, session, authMode, tenantSlug]);

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
    if (!slugTouched) {
      const generated = slugifyVietnamese(val);
      setTenantSlug(generated);
      setSlugStatus(generated.length >= 2 ? 'checking' : 'idle');
    }
  };

  const handleSlugInput = (val: string) => {
    setSlugTouched(true);
    const normalized = slugifyVietnamese(val);
    setTenantSlug(normalized);
    setSlugStatus(normalized.length >= 2 ? 'checking' : 'idle');
  };

  const toggleChannel = (key: string) => {
    if (key === 'webhook') return; // Core inbound webhook is always active
    setSelectedChannels((prev) =>
      prev.includes(key) ? prev.filter((item) => item !== key) : [...prev, key]
    );
  };

  const validateStep1 = (): boolean => {
    if (!companyName.trim() || tenantSlug.trim().length < 2) {
      setErrorMsg('Vui lòng nhập Tên doanh nghiệp/đội Sale và Mã định danh (tối thiểu 2 ký tự).');
      return false;
    }
    if (slugStatus === 'taken') {
      setErrorMsg('Mã định danh tổ chức này đã tồn tại. Vui lòng chọn tên định danh khác.');
      return false;
    }
    if (!adminName.trim() || !workEmail.includes('@') || phone.replace(/\D/g, '').length < 9) {
      setErrorMsg('Vui lòng điền Họ tên quản trị viên, Email công việc và Số điện thoại hợp lệ.');
      return false;
    }
    if (password.length < 8) {
      setErrorMsg('Mật khẩu quản trị cần tối thiểu 8 ký tự để bảo mật không gian dữ liệu.');
      return false;
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
      const res = await fetch('/api/autodata?action=register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          company_name: companyName.trim(),
          tenant_slug: tenantSlug.trim(),
          admin_name: adminName.trim(),
          work_email: workEmail.trim(),
          phone: phone.trim(),
          password,
          industry: domainKey,
          seed_demo_leads: false,
          custom_pipeline_name: selectedDomain.pipelineName,
          selected_channels: selectedChannels,
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
      const json = (await res.json()) as {
        success?: boolean;
        bridge_mode?: 'upstream_rls_postgres' | 'vercel_serverless_engine';
        upstream_app_url?: string | null;
        data?: {
          access_token: string;
          tenant: {
            slug: string;
            name: string;
            subscription: ClientSessionState['subscription'];
          };
          user: { email: string };
          webhook_url: string;
          webhook_token: string;
        };
        error?: { message?: string };
      };

      if (!res.ok || !json.success || !json.data) {
        setErrorMsg(
          json.error?.message || 'Không thể khởi tạo hệ thống. Vui lòng kiểm tra lại thông tin.'
        );
        return;
      }

      const nextSession: ClientSessionState = {
        access_token: json.data.access_token,
        tenant_slug: json.data.tenant.slug,
        company_name: json.data.tenant.name,
        admin_email: json.data.user.email,
        webhook_url: json.data.webhook_url,
        webhook_token: json.data.webhook_token,
        is_external_agency: isExternalAgency,
        zalo_bot: pendingZaloBot,
        bridge_mode: json.bridge_mode || 'vercel_serverless_engine',
        upstream_app_url: json.upstream_app_url || null,
        subscription: json.data.tenant.subscription,
      };
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

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg(null);
    try {
      const res = await fetch('/api/autodata?action=login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenant_slug: loginSlug.trim(),
          email: loginEmail.trim(),
          password: loginPassword,
        }),
      });
      const json = (await res.json()) as {
        success?: boolean;
        bridge_mode?: 'upstream_rls_postgres' | 'vercel_serverless_engine';
        upstream_app_url?: string | null;
        data?: {
          access_token: string;
          tenant: {
            slug: string;
            name: string;
            subscription: ClientSessionState['subscription'];
            settings?: { is_external_agency?: boolean };
          };
          user: { email: string };
          webhook_url: string;
          webhook_token: string;
        };
        error?: { message?: string };
      };
      if (!res.ok || !json.success || !json.data) {
        setErrorMsg(
          json.error?.message || 'Đăng nhập thất bại. Vui lòng kiểm tra Slug, Email và Mật khẩu.'
        );
        return;
      }

      const nextSession: ClientSessionState = {
        access_token: json.data.access_token,
        tenant_slug: json.data.tenant.slug,
        company_name: json.data.tenant.name,
        admin_email: json.data.user.email,
        webhook_url: json.data.webhook_url,
        webhook_token: json.data.webhook_token,
        is_external_agency: Boolean(json.data.tenant.settings?.is_external_agency ?? false),
        bridge_mode: json.bridge_mode || 'vercel_serverless_engine',
        upstream_app_url: json.upstream_app_url || null,
        subscription: json.data.tenant.subscription,
      };
      onSessionChange(nextSession);
      if (nextSession.subscription.is_expired) {
        setWorkspaceTab('billing');
      }
      setSuccessBanner(`Chào mừng quay trở lại không gian "${nextSession.company_name}".`);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Không thể kết nối tới máy chủ xác thực.');
    } finally {
      setSubmitting(false);
    }
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
        'Đã ghi nhận yêu cầu nâng cấp từ Bản Lite lên Hệ sinh thái DOMATION (Giữ nguyên 100% dữ liệu Lead & Sale hiện có)!'
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
      className="fixed inset-0 z-[120] w-screen h-screen bg-[#FAFAFA] text-slate-900 flex flex-col overflow-hidden"
    >
      {/* Top Full-Screen Minimal App Bar */}
      <header className="shrink-0 h-16 px-4 sm:px-8 border-b border-slate-200/80 bg-white flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-slate-900 text-white flex items-center justify-center font-black text-sm tracking-normal shrink-0">
            AD
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm sm:text-base text-slate-900 truncate">
                DOMATION AUTO DATA
              </span>
              <span className="hidden sm:inline-flex items-center gap-1 rounded-full bg-blue-50 border border-blue-200 px-2.5 py-0.5 text-[11px] font-semibold text-blue-700 whitespace-nowrap">
                Bản Lite • Sale &amp; Chia Data
              </span>
            </div>
            <p className="text-[11px] text-slate-500 truncate">
              {session
                ? `Tổ chức: ${session.company_name} (${session.tenant_slug})`
                : `Miễn phí ${catalog.trial_duration_months} tháng đầu • Gia hạn từ ${(catalog.base_monthly_price_vnd / 1000).toFixed(0)}k/tháng (-${catalog.annual_discount_pct}%/năm)`}
            </p>
          </div>
        </div>

        {/* Center Mode Switcher or Workspace Tabs */}
        {!session ? (
          <div className="hidden md:flex items-center gap-1.5 bg-slate-100 p-1 rounded-full shrink-0">
            <button
              type="button"
              onClick={() => {
                setAuthMode('register');
                setErrorMsg(null);
              }}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                authMode === 'register'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Khởi tạo mới ({catalog.trial_duration_months} tháng 0đ)
            </button>
            <button
              type="button"
              onClick={() => {
                setAuthMode('login');
                setErrorMsg(null);
              }}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                authMode === 'login'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Đăng nhập Workspace
            </button>
          </div>
        ) : (
          <div className="hidden xl:flex items-center gap-1.5 bg-slate-100 p-1 rounded-full shrink-0">
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
                  setErrorMsg(null);
                }}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                  workspaceTab === tab.id
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        )}

        <div className="flex items-center gap-2 shrink-0">
          {onOpenTour && (
            <button
              type="button"
              onClick={onOpenTour}
              className="inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-100 transition-colors cursor-pointer whitespace-nowrap"
            >
              <Compass className="w-3.5 h-3.5 shrink-0" />
              <span className="hidden sm:inline">Tour A–Z</span>
              <span className="sm:hidden">?</span>
            </button>
          )}
          {session && (
            <button
              type="button"
              onClick={() => {
                onSessionChange(null);
                setSuccessBanner(null);
                setTransferOrderInfo(null);
              }}
              className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-rose-600 hover:border-rose-200 transition-colors cursor-pointer whitespace-nowrap"
            >
              <LogOut className="w-3.5 h-3.5 shrink-0" />
              <span className="hidden sm:inline">Đăng xuất</span>
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng cửa sổ thiết lập"
            className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer whitespace-nowrap"
          >
            <X className="w-4 h-4 shrink-0" />
            <span>Đóng</span>
          </button>
        </div>
      </header>

      {/* Sub-bar Switcher on Mobile / Tablet */}
      {!session ? (
        <div className="md:hidden shrink-0 px-4 py-2 bg-white border-b border-slate-200 flex gap-2">
          <button
            type="button"
            onClick={() => setAuthMode('register')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold whitespace-nowrap ${
              authMode === 'register' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600'
            }`}
          >
            Tạo mới ({catalog.trial_duration_months} tháng 0đ)
          </button>
          <button
            type="button"
            onClick={() => setAuthMode('login')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold whitespace-nowrap ${
              authMode === 'login' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600'
            }`}
          >
            Đăng nhập
          </button>
        </div>
      ) : (
        <div className="xl:hidden shrink-0 px-4 py-2 bg-white border-b border-slate-200 flex gap-2 overflow-x-auto">
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
                workspaceTab === tab.id ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      )}

      {/* Main Scrollable Canvas */}
      <div className="flex-1 overflow-y-auto">
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
          {!session && authMode === 'register' && (
            <div className="space-y-8">
              {/* Stepper Indicator with explicit Bắt buộc vs Tùy chọn badges */}
              <div className="flex items-center justify-between gap-2 max-w-3xl mx-auto overflow-x-auto py-1">
                {[
                  { n: 1 as const, label: 'Tài khoản & Tổ chức', reqLabel: 'Bắt buộc', reqTone: 'bg-rose-100 text-rose-800' },
                  { n: 2 as const, label: 'Quy tắc Chia Vòng', reqLabel: 'Tùy chọn', reqTone: 'bg-amber-100 text-amber-800' },
                  { n: 3 as const, label: 'Zalo Bot & Kênh ngoài', reqLabel: 'Tùy chọn', reqTone: 'bg-amber-100 text-amber-800' },
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
                        className="flex items-center gap-2.5 text-left cursor-pointer group shrink-0"
                      >
                        <span
                          className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors shrink-0 ${
                            done
                              ? 'bg-emerald-600 text-white'
                              : active
                                ? 'bg-blue-600 text-white ring-4 ring-blue-100'
                                : 'bg-slate-200 text-slate-600'
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
                            className={`self-start rounded-full px-2 py-0.5 text-[10px] font-bold whitespace-nowrap mt-0.5 ${s.reqTone}`}
                          >
                            {s.reqLabel}
                          </span>
                        </div>
                      </button>
                      {idx < 2 && <div className="flex-1 min-w-6 h-px bg-slate-200 mx-2 hidden sm:block" />}
                    </React.Fragment>
                  );
                })}
              </div>

              {/* STEP 1: Required Organization & Admin Info + Optional Domain Preset */}
              {step === 1 && (
                <div className="space-y-7">
                  <div className="text-center max-w-2xl mx-auto space-y-2.5">
                    <div className="inline-flex items-center gap-2">
                      <span className="rounded-full bg-rose-50 border border-rose-200 px-3 py-1 text-[11px] font-bold text-rose-700 whitespace-nowrap">
                        BƯỚC 1: BẮT BUỘC • TẠO KHÔNG GIAN RIÊNG
                      </span>
                      <AutoDataHelpTrigger topic="billing_3m_900k" onOpenTour={onOpenTour} />
                    </div>
                    <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 leading-snug">
                      Khởi tạo không gian Auto Data riêng cho đội Sale
                    </h2>
                    <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
                      Dùng thử miễn phí trọn vẹn tính năng trong{' '}
                      <strong className="text-slate-900">
                        {catalog.trial_duration_months} tháng đầu ({catalog.trial_duration_days} ngày)
                      </strong>
                      . Điền xong bước này bạn có thể vào setup ngay lập tức!
                    </p>
                  </div>

                  <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 sm:p-8 space-y-6">
                    <div className="flex items-center justify-between gap-2 pb-2 border-b border-slate-100">
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                        Thông tin khởi tạo tài khoản Quản trị
                      </span>
                      <span className="rounded-full bg-rose-50 border border-rose-200 px-2.5 py-0.5 text-[11px] font-bold text-rose-700 whitespace-nowrap">
                        Bắt buộc (*)
                      </span>
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
                          placeholder="VD: Phòng Kinh Doanh Á Châu"
                          className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between gap-2">
                          <label className="text-xs font-semibold text-slate-700">
                            Mã định danh Workspace (Slug) *
                          </label>
                          {slugStatus === 'checking' && (
                            <span className="text-[11px] text-slate-500 whitespace-nowrap">Đang kiểm tra...</span>
                          )}
                          {slugStatus === 'available' && (
                            <span className="text-[11px] font-semibold text-emerald-600 whitespace-nowrap">
                              ✓ Khả dụng
                            </span>
                          )}
                          {slugStatus === 'taken' && (
                            <span className="text-[11px] font-semibold text-rose-600 whitespace-nowrap">
                              ✕ Đã tồn tại
                            </span>
                          )}
                        </div>
                        <div className="flex items-center rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 focus-within:border-blue-600 focus-within:bg-white focus-within:ring-2 focus-within:ring-blue-100">
                          <span className="text-xs text-slate-400 select-none mr-1 whitespace-nowrap">
                            domation.net/t/
                          </span>
                          <input
                            type="text"
                            value={tenantSlug}
                            onChange={(e) => handleSlugInput(e.target.value)}
                            placeholder="phong-sale-a-chau"
                            className="w-full bg-transparent text-sm font-mono text-slate-900 focus:outline-none"
                          />
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-700">Họ tên Quản trị viên *</label>
                        <input
                          type="text"
                          value={adminName}
                          onChange={(e) => setAdminName(e.target.value)}
                          placeholder="Nguyễn Minh Quân"
                          className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-700">Số điện thoại liên hệ / Zalo *</label>
                        <input
                          type="tel"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          placeholder="0912345678"
                          className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-700">Email quản trị *</label>
                        <input
                          type="email"
                          value={workEmail}
                          onChange={(e) => setWorkEmail(e.target.value)}
                          placeholder="admin@doanhnghiep.vn"
                          className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-700">
                          Mật khẩu khởi tạo (tối thiểu 8 ký tự) *
                        </label>
                        <input
                          type="password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="••••••••••••"
                          className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100"
                        />
                      </div>
                    </div>

                    {/* Optional Business Preset Picker */}
                    <div className="pt-3 border-t border-slate-100 space-y-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <label className="text-xs font-semibold text-slate-700">
                          Mẫu phễu gợi ý ban đầu (Mặc định: Đa ngành / Đội Sale Nội Bộ)
                        </label>
                        <span className="rounded-full bg-amber-50 border border-amber-200 px-2.5 py-0.5 text-[11px] font-bold text-amber-800 whitespace-nowrap">
                          Tùy chọn • Đổi tự do sau
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
                      <span className="rounded-full bg-amber-50 border border-amber-200 px-3 py-1 text-[11px] font-bold text-amber-800 whitespace-nowrap">
                        BƯỚC 2: TÙY CHỌN • ĐÃ CÀI SẴN MẶC ĐỊNH TỐI ƯU
                      </span>
                      <AutoDataHelpTrigger topic="round_robin_formula" onOpenTour={onOpenTour} />
                    </div>
                    <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 leading-snug">
                      Quy tắc Vòng Chia Số — Mặc định cho từng Sale nội bộ
                    </h2>
                    <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
                      Hệ thống mặc định chia cho từng nhân viên Sale cá nhân trong công ty. Bạn có thể giữ nguyên hoặc bấm bỏ qua để vào Workspace ngay.
                    </p>
                  </div>

                  <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 sm:p-8 space-y-8">
                    {/* Default Individual Internal Sale vs Optional External Agency F1 */}
                    <div className="rounded-2xl border-2 border-blue-100 bg-blue-50/40 p-5 space-y-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0">
                            <Users className="w-5 h-5" />
                          </div>
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-sm font-bold text-slate-950">
                                Đối tượng nhận Lead mặc định: Từng Chuyên Viên Sale Nội Bộ
                              </span>
                              <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-bold text-emerald-800 whitespace-nowrap">
                                Mặc định (is_external_agency = false)
                              </span>
                              <AutoDataHelpTrigger topic="internal_sale_default" onOpenTour={onOpenTour} />
                            </div>
                            <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                              Sale nội bộ nhận trực tiếp khách hàng kèm đầy đủ Số Điện Thoại (VD: 0912 888 678) để gọi tư vấn ngay dưới 4 giây.
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
                              ? 'bg-slate-900 text-white'
                              : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          {isExternalAgency
                            ? 'Đại lý F1: ĐANG BẬT (Che SĐT)'
                            : 'Đại lý F1: TẮT (Chỉ Sale nội bộ)'}
                        </button>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                          1. Thuật toán phân bổ khách hàng mới
                        </label>
                        <AutoDataHelpTrigger topic="round_robin_formula" onOpenTour={onOpenTour} />
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

                    <div className="space-y-3">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <div className="flex items-center gap-2">
                          <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                            2. Chính sách xử lý trùng Số Điện Thoại
                          </label>
                          <AutoDataHelpTrigger topic="dedupe_90d" onOpenTour={onOpenTour} />
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
                          slaAutoRecall ? 'border-slate-900 bg-slate-50' : 'border-slate-200 bg-white'
                        }`}
                      >
                        <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0">
                          <Clock className="w-5 h-5" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-semibold text-slate-900">
                                Tự động thu hồi SLA quá hạn (15 phút) đối với Lead Ads công ty
                              </span>
                              <AutoDataHelpTrigger topic="sla_recall" onOpenTour={onOpenTour} />
                            </div>
                            <span
                              className={`text-xs font-bold whitespace-nowrap ${
                                slaAutoRecall ? 'text-emerald-600' : 'text-slate-400'
                              }`}
                            >
                              {slaAutoRecall ? 'ĐANG BẬT' : 'TẮT'}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                            Quá 15 phút Sale chưa tiếp nhận, Router tự thu hồi chuyển Sale kế tiếp (Lưu ý: Lead cá nhân tự nhập tại Cổng Sale được miễn thu hồi 100%).
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
                    <span className="inline-block rounded-full bg-amber-50 border border-amber-200 px-3 py-1 text-[11px] font-bold text-amber-800 whitespace-nowrap">
                      BƯỚC 3: TÙY CHỌN • KẾT NỐI KÊNH NGOÀI &amp; ZALO BOT
                    </span>
                    <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 leading-snug">
                      Kênh kết nối (Bắt buộc vs Tùy chọn) &amp; Xác thực Zalo Bot
                    </h2>
                    <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
                      Cổng Webhook trung tâm được cấp tự động. Các kênh Zalo Bot, Meta CAPI và Google Sheets là tùy chọn — bạn có thể test ngay bên dưới hoặc tạm bỏ qua để vào hệ thống!
                    </p>
                  </div>

                  <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 sm:p-8 space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
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
                                ? 'border-blue-600 bg-blue-50/50 ring-2 ring-blue-100'
                                : 'border-slate-200 bg-white hover:border-slate-300'
                            }`}
                          >
                            <div
                              className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                                active ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-700'
                              }`}
                            >
                              <Icon className="w-5 h-5" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-2 flex-wrap">
                                <span className="text-sm font-semibold text-slate-900">{ch.title}</span>
                                <div className="flex items-center gap-1.5">
                                  <span
                                    className={`rounded-full px-2 py-0.5 text-[10px] font-bold whitespace-nowrap ${
                                      ch.required
                                        ? 'bg-rose-100 text-rose-800'
                                        : 'bg-amber-100 text-amber-800'
                                    }`}
                                  >
                                    {ch.required ? 'Bắt buộc • Cấp sẵn' : 'Tùy chọn'}
                                  </span>
                                  {ch.helpTopic && (
                                    <AutoDataHelpTrigger topic={ch.helpTopic} onOpenTour={onOpenTour} />
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
                    <AutoDataZaloBotGuide
                      compact
                      savedZaloBot={pendingZaloBot}
                      onVerified={(saved) => setPendingZaloBot(saved)}
                      onFastSkip={() => void handleRegisterSubmit(true)}
                      fastSkipLabel="Tùy chọn — Tạm bỏ qua & vào setup ngay"
                      onOpenTour={onOpenTour}
                    />

                    {/* Transparent Trial & Post-Trial Step Policy Card */}
                    <div className="rounded-2xl border border-blue-200 bg-blue-50/60 p-5 space-y-2.5">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
                          <ShieldCheck className="w-5 h-5 text-blue-600 shrink-0" />
                          <span>Chính sách Dùng Thử &amp; Gia Hạn Minh Bạch DOMATION</span>
                        </div>
                        <AutoDataHelpTrigger topic="billing_3m_900k" onOpenTour={onOpenTour} />
                      </div>
                      <ul className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-slate-700 pt-1">
                        <li className="rounded-xl bg-white p-3.5 border border-blue-100">
                          <div className="font-bold text-slate-900">
                            01. Miễn phí {catalog.trial_duration_months} tháng đầu
                          </div>
                          <div className="text-slate-500 mt-1 leading-relaxed">
                            Trọn vẹn {catalog.trial_duration_days} ngày sử dụng Bản Lite không giới hạn tính năng.
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

          {/* LOGIN EXISTING WORKSPACE */}
          {!session && authMode === 'login' && (
            <form
              onSubmit={handleLoginSubmit}
              className="max-w-md mx-auto bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-5 mt-6"
            >
              <div className="space-y-1.5 text-center">
                <div className="w-12 h-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center mx-auto mb-3">
                  <KeyRound className="w-6 h-6" />
                </div>
                <h2 className="text-xl font-bold text-slate-900">Đăng nhập không gian Auto Data</h2>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Kết nối trực tiếp để mở Cổng Sale Cá Nhân, kiểm tra Webhook, Zalo Bot, nạp Topup hoặc nâng cấp gói.
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">Mã định danh tổ chức (Slug)</label>
                <input
                  type="text"
                  required
                  value={loginSlug}
                  onChange={(e) => setLoginSlug(slugifyVietnamese(e.target.value))}
                  placeholder="vd: nha-khoa-flora"
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm font-mono focus:border-blue-600 focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">Email quản trị</label>
                <input
                  type="email"
                  required
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  placeholder="admin@doanhnghiep.vn"
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm focus:border-blue-600 focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">Mật khẩu</label>
                <input
                  type="password"
                  required
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm focus:border-blue-600 focus:outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full rounded-xl bg-slate-900 text-white py-3 px-5 text-sm font-semibold hover:bg-blue-600 transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 whitespace-nowrap"
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
                <span>Kết nối vào Workspace</span>
              </button>
            </form>
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
                    <span>TRẠNG THÁI GÓI LITE</span>
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold whitespace-nowrap ${
                        session.subscription.is_expired
                          ? 'bg-rose-100 text-rose-700'
                          : session.subscription.is_in_trial
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-emerald-100 text-emerald-700'
                      }`}
                    >
                      {session.subscription.is_expired
                        ? 'Hết hạn'
                        : session.subscription.is_in_trial
                          ? `Dùng thử ${catalog.trial_duration_months} tháng`
                          : 'Đang hoạt động'}
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
                      Gia hạn gói Lite từ <strong>{catalog.base_monthly_price_vnd.toLocaleString('vi-VN')}₫/tháng</strong>{' '}
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
                  <div className="lg:col-span-6 bg-white rounded-3xl border border-slate-200 p-6 space-y-5">
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
                            onOpenTour={onOpenTour}
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

                    <div className="rounded-2xl bg-slate-900 text-slate-100 p-4 space-y-2.5">
                      <div className="flex items-center justify-between gap-2 text-[11px] text-slate-400">
                        <span className="whitespace-nowrap">POST • JSON / FORM</span>
                        <div className="flex items-center gap-2">
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

                    <form onSubmit={handleFireRealWebhookTest} className="space-y-3.5 pt-2 border-t border-slate-100">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                          Bắn thử Lead thật qua Auto Data Router
                        </span>
                        <AutoDataHelpTrigger topic="round_robin_formula" onOpenTour={onOpenTour} />
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
                    <div className="lg:col-span-5 bg-white rounded-3xl border border-slate-200 p-6 space-y-5">
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2">
                          <span className="rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-[11px] font-bold text-emerald-800 whitespace-nowrap">
                            Bypass Vòng Chia • 0 Quota • Miễn SLA Recall
                          </span>
                          <AutoDataHelpTrigger topic="sale_port_personal" onOpenTour={onOpenTour} />
                        </div>
                        <h3 className="text-lg font-bold text-slate-900">
                          Cổng Sale Cá Nhân — Tự nhập / Import Data riêng
                        </h3>
                        <p className="text-xs text-slate-500 leading-relaxed">
                          Khách hàng do chính Sale tự tìm kiếm sẽ đi thẳng vào giỏ riêng của Sale đó: không qua vòng chia chung, không tính vào quota nhận số Ads và không bị thu hồi SLA 15 phút.
                        </p>
                      </div>

                      <form onSubmit={handleAddPersonalLead} className="space-y-3.5">
                        <div>
                          <label className="text-xs font-semibold text-slate-700">Họ tên khách hàng cá nhân *</label>
                          <input
                            type="text"
                            required
                            value={pLeadName}
                            onChange={(e) => setPLeadName(e.target.value)}
                            placeholder="VD: Chị Lan Anh (Khách tự giới thiệu)"
                            className="mt-1 w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm"
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
                              placeholder="0909123456"
                              className="mt-1 w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm font-mono"
                            />
                          </div>
                          <div>
                            <label className="text-xs font-semibold text-slate-700">Sale sở hữu trực tiếp</label>
                            <input
                              type="text"
                              value={pLeadOwner}
                              onChange={(e) => setPLeadOwner(e.target.value)}
                              className="mt-1 w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm"
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
                              className="mt-1 w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm"
                            />
                          </div>
                          <div>
                            <label className="text-xs font-semibold text-slate-700">Ghi chú chăm sóc riêng</label>
                            <input
                              type="text"
                              value={pLeadNote}
                              onChange={(e) => setPLeadNote(e.target.value)}
                              className="mt-1 w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm"
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
                        <button
                          type="submit"
                          disabled={submitting}
                          className="w-full rounded-xl bg-slate-900 hover:bg-blue-600 text-white py-3 px-5 text-xs sm:text-sm font-semibold transition-colors inline-flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap"
                        >
                          {submitting ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <PlusCircle className="w-4 h-4" />
                          )}
                          <span>Lưu Vào Giỏ Cá Nhân (Không Qua Vòng Chia)</span>
                        </button>
                      </form>
                    </div>

                    <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-200 p-6 space-y-5">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div>
                          <h3 className="text-lg font-bold text-slate-900">
                            Danh sách Lead Cá Nhân &amp; Đồng bộ Google Sheets 2 Chiều
                          </h3>
                          <p className="text-xs text-slate-500">
                            Xuất file CSV chuẩn tiếng Việt hoặc sao chép mã Apps Script đồng bộ Sheet riêng cho từng Sale.
                          </p>
                        </div>
                        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
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
                                0 Quota • Miễn SLA Recall
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
                          onOpenTour={onOpenTour}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: OPTIONAL ZALO BOT A-Z GUIDE & LIVE CONNECTION VERIFICATION */}
              {workspaceTab === 'zalo_connect' && (
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
                  onOpenTour={onOpenTour}
                />
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

                  <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-lg font-bold text-slate-900">
                            Các gói gia hạn sau {catalog.trial_duration_months} tháng miễn phí
                          </h3>
                          <AutoDataHelpTrigger topic="billing_3m_900k" onOpenTour={onOpenTour} />
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
                                ? 'bg-slate-900 text-white border-slate-900'
                                : 'bg-white text-slate-900 border-slate-200'
                            }`}
                          >
                            <div className="space-y-3">
                              <div className="flex items-center justify-between gap-2">
                                <span className="text-[11px] font-bold uppercase tracking-wider opacity-70 whitespace-nowrap">
                                  Step 0{plan.step_order}
                                </span>
                                {plan.badge && (
                                  <span
                                    className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold whitespace-nowrap ${
                                      plan.is_enterprise_upgrade
                                        ? 'bg-white/15 text-white'
                                        : 'bg-blue-50 text-blue-700'
                                    }`}
                                  >
                                    {plan.badge}
                                  </span>
                                )}
                              </div>
                              <div className="text-base font-bold">{plan.name}</div>
                              <div>
                                <span className="text-2xl font-extrabold font-mono">
                                  {perMonth.toLocaleString('vi-VN')}₫
                                </span>
                                <span className="text-xs opacity-70"> / tháng</span>
                                {billingCycle === 'annual' && (
                                  <div
                                    className={`text-[11px] font-semibold mt-0.5 ${
                                      plan.is_enterprise_upgrade ? 'text-emerald-300' : 'text-emerald-700'
                                    }`}
                                  >
                                    Cả năm: {plan.annual_total_vnd.toLocaleString('vi-VN')}₫ (Tiết kiệm{' '}
                                    {plan.annual_saved_vnd.toLocaleString('vi-VN')}₫)
                                  </div>
                                )}
                              </div>
                              <ul className="space-y-1.5 pt-2 border-t border-slate-200/20 text-xs">
                                {plan.features.slice(0, 4).map((f, i) => (
                                  <li key={i} className="flex items-start gap-2">
                                    <Check className="w-3.5 h-3.5 shrink-0 mt-0.5 text-blue-500" />
                                    <span className="opacity-90 leading-relaxed">{f}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>

                            <button
                              type="button"
                              disabled={submitting}
                              onClick={() => void handleSubscribePlan(plan)}
                              className={`mt-5 w-full rounded-xl py-2.5 px-4 text-xs font-bold transition-colors cursor-pointer whitespace-nowrap ${
                                plan.is_enterprise_upgrade
                                  ? 'bg-white text-slate-900 hover:bg-blue-50'
                                  : 'bg-slate-900 text-white hover:bg-blue-600'
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

              {/* TAB 5: UPGRADE FROM LITE TO AUTOMATION / FULL CRM 360 / ENTERPRISE ERP 5.0 */}
              {workspaceTab === 'crm_erp' && (
                <form
                  onSubmit={handleRequestCrmErpUpgrade}
                  className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 space-y-6"
                >
                  <div className="flex items-start justify-between flex-wrap gap-4">
                    <div className="space-y-1.5 max-w-xl">
                      <div className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600">
                        <Sparkles className="w-4 h-4 shrink-0" />
                        <span>LỘ TRÌNH NÂNG CẤP TỪ BẢN LITE (/DATA)</span>
                      </div>
                      <h3 className="text-xl font-bold text-slate-900 leading-snug">
                        Mở rộng từ Bản Lite Chia Data lên Marketing Automation, Full CRM 360° &amp; ERP 5.0
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
                        desc: 'Quản trị phễu Kanban 8 nấc chuyên sâu, CSKH đa điểm chạm, Báo giá, Hợp đồng & Hóa đơn MISA.',
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
                        placeholder="0912345678"
                        className="mt-1 w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-700">Ghi chú quy mô nhân sự / nhu cầu</label>
                      <input
                        type="text"
                        value={upgradeNote}
                        onChange={(e) => setUpgradeNote(e.target.value)}
                        placeholder="VD: Đồng bộ 35 nhân sự Sale + Automation CSKH"
                        className="mt-1 w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="rounded-xl bg-slate-900 text-white px-6 py-3 text-sm font-semibold hover:bg-blue-600 transition-colors inline-flex items-center gap-2 cursor-pointer whitespace-nowrap"
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
      {!session && authMode === 'register' && (
        <footer className="shrink-0 border-t border-slate-200 bg-white px-4 sm:px-8 py-3.5">
          <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="flex items-center justify-between sm:justify-start gap-3">
              {step > 1 ? (
                <button
                  type="button"
                  onClick={() => setStep((s) => (s === 3 ? 2 : 1))}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-xs sm:text-sm font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer whitespace-nowrap"
                >
                  <ArrowLeft className="w-4 h-4 shrink-0" />
                  <span>Quay lại</span>
                </button>
              ) : (
                <span className="text-xs text-slate-500 hidden md:inline whitespace-nowrap">
                  Bước 1/3 (Bắt buộc) • Mặc định chia cho từng Sale nội bộ
                </span>
              )}
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
              {/* Fast-Skip Optional Steps CTA */}
              <button
                type="button"
                disabled={submitting}
                onClick={() => void handleRegisterSubmit(true)}
                className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-300 bg-slate-50 hover:bg-slate-100 px-4 py-2.5 text-xs font-semibold text-slate-800 transition-colors cursor-pointer whitespace-nowrap disabled:opacity-60"
              >
                <span>Tùy chọn — Tạm bỏ qua &amp; vào setup ngay</span>
              </button>

              {step < 3 ? (
                <button
                  type="button"
                  onClick={() => {
                    if (step === 1 && !validateStep1()) return;
                    setErrorMsg(null);
                    setStep((s) => (s === 1 ? 2 : 3));
                  }}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-6 py-2.5 text-xs sm:text-sm font-semibold text-white hover:bg-blue-600 transition-colors cursor-pointer whitespace-nowrap"
                >
                  <span>Tiếp theo ({step === 1 ? 'Tùy chọn Chia Vòng' : 'Tùy chọn Kênh'})</span>
                  <ArrowRight className="w-4 h-4 shrink-0" />
                </button>
              ) : (
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => void handleRegisterSubmit(false)}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-2.5 text-xs sm:text-sm font-semibold text-white hover:bg-blue-700 transition-colors cursor-pointer disabled:opacity-60 whitespace-nowrap"
                >
                  {submitting ? (
                    <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                  )}
                  <span>Kích Hoạt ({catalog.trial_duration_months} Tháng Miễn Phí)</span>
                </button>
              )}
            </div>
          </div>
        </footer>
      )}
    </div>
  );
}
