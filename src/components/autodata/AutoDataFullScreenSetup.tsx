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
  Copy,
  CreditCard,
  EyeOff,
  FileEdit,
  Gauge,
  GraduationCap,
  Hand,
  HeartPulse,
  KeyRound,
  Layers,
  Loader2,
  LogOut,
  Mail,
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
  Wallet,
  Webhook,
  X,
} from 'lucide-react';
import type {
  ClientBillingCatalog,
  ClientBillingPlan,
  ClientBillingTransaction,
  ClientSessionState,
  SetupModalIntent,
} from './autodataTypes';

interface AutoDataFullScreenSetupProps {
  open: boolean;
  initialIntent: SetupModalIntent;
  catalog: ClientBillingCatalog;
  session: ClientSessionState | null;
  onSessionChange: (nextSession: ClientSessionState | null) => void;
  onClose: () => void;
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
  displayed_phone?: string;
  masked_phone: string;
  is_duplicate: boolean;
  distribution_mode: string;
  latency_ms: number;
  capi_status: string;
  zalobot_status: string;
}

const BUSINESS_DOMAINS: BusinessDomainOption[] = [
  {
    key: 'general',
    label: 'Đa Ngành / Tùy Chỉnh Tự Do',
    subtitle: 'Cấu hình mở cho mọi mô hình doanh nghiệp & đội kinh doanh',
    icon: SlidersHorizontal,
    pipelineName: 'Phễu Kinh Doanh Tiêu Chuẩn Doanh Nghiệp',
  },
  {
    key: 'real_estate',
    label: 'Bất Động Sản & Sàn Liên Kết F1',
    subtitle: 'Chia giỏ dự án, chống trùng 90 ngày & bảo mật SĐT đại lý',
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
    desc: 'Tự động cân bằng tỷ lệ nhận khách theo năng lực/KPI từng nhân sự (VD: Senior x3, Junior x1).',
    icon: Scale,
  },
  {
    key: 'strict_round_robin',
    title: 'Xoay Vòng Tuần Tự 1:1 (Strict Round-Robin)',
    desc: 'Chia đều tuyệt đối lần lượt từ nhân sự thứ 1 đến người thứ N đang bật trạng thái Online.',
    icon: RefreshCw,
  },
  {
    key: 'least_loaded',
    title: 'Ưu Tiên Người Ít Việc Nhất (Least-Loaded)',
    desc: 'Phân tích tải thực tế và đẩy khách mới cho nhân sự đang có ít hồ sơ chờ xử lý nhất.',
    icon: Gauge,
  },
  {
    key: 'manual_only',
    title: 'Giỏ Chờ Duyệt Tay (Manual Queue)',
    desc: 'Tập trung Lead về giỏ chung để Giám đốc kinh doanh hoặc Admin chỉ định thủ công.',
    icon: Hand,
  },
];

const DEDUP_POLICIES: DedupPolicyOption[] = [
  {
    key: 'route_to_existing_owner',
    title: 'Trả Về Nhân Sự Cũ Đang Chăm',
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

function RepeatIconFallback({ className }: { className?: string }) {
  return <RefreshCw className={className} />;
}

const CHANNEL_OPTIONS: ChannelOption[] = [
  {
    key: 'webhook',
    title: 'Inbound Webhook Đa Nền Tảng',
    desc: 'Nhận Lead tức thì từ Website, LadiPage, WordPress, Webflow, Typeform.',
    icon: Webhook,
  },
  {
    key: 'meta_capi',
    title: 'Facebook Lead Ads & Meta CAPI v21.0',
    desc: 'Đồng bộ ngược sự kiện khách chất lượng giúp tối ưu máy học quảng cáo.',
    icon: Share2,
  },
  {
    key: 'zalobot',
    title: 'ZaloBot Báo Số Cá Nhân & Nhóm',
    desc: 'Nhận thông báo khách mới < 4s, bấm tiếp nhận hoặc báo số rác 1-đổi-1 trên Zalo.',
    icon: Bot,
  },
  {
    key: 'sheets_tiktok',
    title: 'TikTok Lead Gen & Google Sheets',
    desc: 'Kết nối luồng dữ liệu tự động không cần xuất/nhập file Excel thủ công.',
    icon: Table2,
  },
  {
    key: 'smtp_sla',
    title: 'Email Cảnh Báo SLA & Báo Cáo Gini',
    desc: 'Gửi báo cáo đối soát công bằng chia số và cảnh báo trễ SLA cho Ban giám đốc.',
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
}: AutoDataFullScreenSetupProps) {
  // Determine view mode from session + initialIntent
  const [authMode, setAuthMode] = useState<'register' | 'login'>(
    initialIntent === 'login' ? 'login' : 'register'
  );
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [workspaceTab, setWorkspaceTab] = useState<'router' | 'billing' | 'crm_erp'>(() => {
    if (initialIntent === 'workspace_billing') return 'billing';
    if (initialIntent === 'workspace_crm_erp') return 'crm_erp';
    return 'router';
  });

  // Registration Step 1 state
  const [companyName, setCompanyName] = useState('');
  const [tenantSlug, setTenantSlug] = useState('');
  const [slugTouched, setSlugTouched] = useState(false);
  const [slugStatus, setSlugStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle');
  const [domainKey, setDomainKey] = useState<string>('general');
  const [adminName, setAdminName] = useState('');
  const [workEmail, setWorkEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');

  // Registration Step 2 state (Auto Data Router Engine)
  const [routerMode, setRouterMode] = useState<RouterModeOption['key']>('weighted_round_robin');
  const [dedupPolicy, setDedupPolicy] = useState<DedupPolicyOption['key']>('route_to_existing_owner');
  const [dedupDays, setDedupDays] = useState<number>(90);
  const [maskPiiExternal, setMaskPiiExternal] = useState<boolean>(true);
  const [slaAutoRecall, setSlaAutoRecall] = useState<boolean>(true);

  // Registration Step 3 state (Channels)
  const [selectedChannels, setSelectedChannels] = useState<string[]>(['webhook', 'meta_capi', 'zalobot']);

  // Login state
  const [loginSlug, setLoginSlug] = useState('');
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Async action feedback
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successBanner, setSuccessBanner] = useState<string | null>(null);
  const [copiedWebhook, setCopiedWebhook] = useState(false);

  // Live Workspace data
  const [transactions, setTransactions] = useState<ClientBillingTransaction[]>([]);
  const [recentLeads, setRecentLeads] = useState<RoutedLeadPreview[]>([]);
  const [testLeadName, setTestLeadName] = useState('Nguyễn Hoàng Minh');
  const [testLeadPhone, setTestLeadPhone] = useState('0912888678');
  const [testLeadSource, setTestLeadSource] = useState('facebook_lead_ads');
  const [testLeadInterest, setTestLeadInterest] = useState('Tư vấn giải pháp gói Doanh Nghiệp');
  const [lastWebhookResult, setLastWebhookResult] = useState<LiveWebhookResult | null>(null);

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
  const [upgradeSuite, setUpgradeSuite] = useState<'crm' | 'erp' | 'crm_erp_bundle'>('crm_erp_bundle');
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
            webhook_url?: string;
            webhook_token?: string;
          };
        };
        if (!active || !json.success || !json.data) return;
        setTransactions(Array.isArray(json.data.transactions) ? json.data.transactions : []);
        setRecentLeads(Array.isArray(json.data.leads) ? json.data.leads : []);
        if (json.data.subscription) {
          onSessionChange({
            ...session,
            bridge_mode: json.bridge_mode || session.bridge_mode,
            upstream_app_url: json.upstream_app_url ?? session.upstream_app_url,
            webhook_url: json.data.webhook_url || session.webhook_url,
            webhook_token: json.data.webhook_token || session.webhook_token,
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
    setSelectedChannels((prev) =>
      prev.includes(key) ? (prev.length > 1 ? prev.filter((item) => item !== key) : prev) : [...prev, key]
    );
  };

  const validateStep1 = (): boolean => {
    if (!companyName.trim() || tenantSlug.trim().length < 2) {
      setErrorMsg('Vui lòng nhập Tên doanh nghiệp và Mã định danh tổ chức (tối thiểu 2 ký tự).');
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

  const handleRegisterSubmit = async () => {
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
            duplicate_threshold_days: dedupDays,
            mask_pii_for_external: maskPiiExternal,
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
        setErrorMsg(json.error?.message || 'Không thể khởi tạo hệ thống. Vui lòng kiểm tra lại thông tin.');
        return;
      }

      const nextSession: ClientSessionState = {
        access_token: json.data.access_token,
        tenant_slug: json.data.tenant.slug,
        company_name: json.data.tenant.name,
        admin_email: json.data.user.email,
        webhook_url: json.data.webhook_url,
        webhook_token: json.data.webhook_token,
        bridge_mode: json.bridge_mode || 'vercel_serverless_engine',
        upstream_app_url: json.upstream_app_url || null,
        subscription: json.data.tenant.subscription,
      };
      onSessionChange(nextSession);
      setWorkspaceTab('router');
      setSuccessBanner(
        `Đã khởi tạo thành công không gian "${nextSession.company_name}" — Kích hoạt ${catalog.trial_duration_months} tháng (${catalog.trial_duration_days} ngày) miễn phí!`
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
          };
          user: { email: string };
          webhook_url: string;
          webhook_token: string;
        };
        error?: { message?: string };
      };
      if (!res.ok || !json.success || !json.data) {
        setErrorMsg(json.error?.message || 'Đăng nhập thất bại. Vui lòng kiểm tra Slug, Email và Mật khẩu.');
        return;
      }

      const nextSession: ClientSessionState = {
        access_token: json.data.access_token,
        tenant_slug: json.data.tenant.slug,
        company_name: json.data.tenant.name,
        admin_email: json.data.user.email,
        webhook_url: json.data.webhook_url,
        webhook_token: json.data.webhook_token,
        bridge_mode: json.bridge_mode || 'vercel_serverless_engine',
        upstream_app_url: json.upstream_app_url || null,
        subscription: json.data.tenant.subscription,
      };
      onSessionChange(nextSession);
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

      setLastWebhookResult(json.data);
      setRecentLeads((prev) => [
        {
          id: json.data!.lead_id,
          name: testLeadName,
          phone: testLeadPhone,
          masked_phone: json.data!.displayed_phone || json.data!.masked_phone,
          utm_source: testLeadSource,
          assigned_to_name: json.data!.assigned_to_name,
          is_duplicate: json.data!.is_duplicate,
          created_at: new Date().toISOString(),
        },
        ...prev.slice(0, 9),
      ]);
      // Generate fresh phone suffix hint so user can either test new lead or duplicate
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Lỗi kết nối cổng Webhook.');
    } finally {
      setSubmitting(false);
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
        setErrorMsg(json.error?.message || 'Không thể gửi yêu cầu nâng cấp CRM / ERP.');
        return;
      }
      setTransactions((prev) => [json.data!.transaction, ...prev]);
      setSuccessBanner(
        'Đã ghi nhận yêu cầu nâng cấp lên Hệ sinh thái DOMATION CRM 360° / ERP 5.0 (Giữ nguyên 100% dữ liệu Auto Data hiện có)!'
      );
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Lỗi kết nối máy chủ.');
    } finally {
      setSubmitting(false);
    }
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

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Không gian khởi tạo và kết nối Auto Data"
      className="fixed inset-0 z-[120] w-screen h-screen bg-[#FAFAFA] text-slate-900 flex flex-col overflow-hidden"
    >
      {/* Top Full-Screen Minimal App Bar (Google / Claude Start App aesthetic) */}
      <header className="shrink-0 h-16 px-4 sm:px-8 border-b border-slate-200/80 bg-white flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-slate-900 text-white flex items-center justify-center font-black text-sm tracking-tight shrink-0">
            AD
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm sm:text-base tracking-tight text-slate-900 truncate">
                DOMATION AUTO DATA
              </span>
              <span className="hidden sm:inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Live Connect
              </span>
            </div>
            <p className="text-[11px] text-slate-500 truncate">
              {session
                ? `Tổ chức: ${session.company_name} (${session.tenant_slug})`
                : `Miễn phí ${catalog.trial_duration_months} tháng đầu • Gia hạn từ ${(catalog.base_monthly_price_vnd / 1000).toFixed(0)}k/tháng (-${catalog.annual_discount_pct}%/năm)`}
            </p>
          </div>
        </div>

        {/* Center Progress Steps or Workspace Tabs */}
        {!session ? (
          <div className="hidden md:flex items-center gap-2 bg-slate-100 p-1 rounded-full">
            <button
              type="button"
              onClick={() => {
                setAuthMode('register');
                setErrorMsg(null);
              }}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
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
              className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                authMode === 'login'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Đăng nhập Workspace
            </button>
          </div>
        ) : (
          <div className="hidden lg:flex items-center gap-1.5 bg-slate-100 p-1 rounded-full">
            {[
              { id: 'router' as const, label: '1. Cổng Webhook & Chia Vòng Thật' },
              { id: 'billing' as const, label: '2. Quản Lý Gói & Topup Gia Hạn' },
              { id: 'crm_erp' as const, label: '3. Nâng Cấp CRM 360° / ERP 5.0' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  setWorkspaceTab(tab.id);
                  setErrorMsg(null);
                }}
                className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
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

        <div className="flex items-center gap-2">
          {session && (
            <button
              type="button"
              onClick={() => {
                onSessionChange(null);
                setSuccessBanner(null);
                setTransferOrderInfo(null);
              }}
              className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-rose-600 hover:border-rose-200 transition-colors cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Đăng xuất</span>
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng cửa sổ thiết lập"
            className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
            <span>Đóng</span>
          </button>
        </div>
      </header>

      {/* Mobile Switcher when under md/lg */}
      {!session ? (
        <div className="md:hidden shrink-0 px-4 py-2 bg-white border-b border-slate-200 flex gap-2">
          <button
            type="button"
            onClick={() => setAuthMode('register')}
            className={`flex-1 py-1.5 rounded-lg text-xs font-semibold ${
              authMode === 'register' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600'
            }`}
          >
            Tạo mới ({catalog.trial_duration_months} tháng 0đ)
          </button>
          <button
            type="button"
            onClick={() => setAuthMode('login')}
            className={`flex-1 py-1.5 rounded-lg text-xs font-semibold ${
              authMode === 'login' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600'
            }`}
          >
            Đăng nhập
          </button>
        </div>
      ) : (
        <div className="lg:hidden shrink-0 px-4 py-2 bg-white border-b border-slate-200 flex gap-1.5 overflow-x-auto">
          {[
            { id: 'router' as const, label: 'Webhook & Router' },
            { id: 'billing' as const, label: 'Gói & Topup' },
            { id: 'crm_erp' as const, label: 'Nâng Cấp CRM/ERP' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setWorkspaceTab(tab.id)}
              className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold ${
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
        <div className="max-w-5xl mx-auto px-4 sm:px-8 py-8 sm:py-10 space-y-6">
          {errorMsg && (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800 flex items-center justify-between gap-3">
              <span>{errorMsg}</span>
              <button
                type="button"
                onClick={() => setErrorMsg(null)}
                className="text-xs font-bold text-rose-600 hover:underline shrink-0"
              >
                Ẩn
              </button>
            </div>
          )}

          {successBanner && (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="font-medium">{successBanner}</span>
              </div>
              <button
                type="button"
                onClick={() => setSuccessBanner(null)}
                className="text-xs font-bold text-emerald-700 hover:underline shrink-0"
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
              {/* Stepper Indicator */}
              <div className="flex items-center justify-between max-w-2xl mx-auto">
                {[
                  { n: 1 as const, label: 'Tổ chức & Lĩnh vực' },
                  { n: 2 as const, label: 'Cấu hình Vòng Chia Số' },
                  { n: 3 as const, label: 'Kênh Kết Nối & Kích Hoạt' },
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
                        className="flex items-center gap-2.5 text-left cursor-pointer group"
                      >
                        <span
                          className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                            done
                              ? 'bg-emerald-600 text-white'
                              : active
                                ? 'bg-blue-600 text-white ring-4 ring-blue-100'
                                : 'bg-slate-200 text-slate-600'
                          }`}
                        >
                          {done ? <Check className="w-4 h-4" /> : s.n}
                        </span>
                        <span
                          className={`text-xs sm:text-sm font-semibold ${
                            active ? 'text-slate-900' : 'text-slate-500 group-hover:text-slate-800'
                          }`}
                        >
                          {s.label}
                        </span>
                      </button>
                      {idx < 2 && <div className="flex-1 h-px bg-slate-200 mx-3 hidden sm:block" />}
                    </React.Fragment>
                  );
                })}
              </div>

              {/* STEP 1: Organization & Universal Domain Picker with Specialized Icons */}
              {step === 1 && (
                <div className="space-y-8">
                  <div className="text-center max-w-2xl mx-auto space-y-2">
                    <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
                      Khởi tạo không gian Auto Data riêng cho doanh nghiệp
                    </h2>
                    <p className="text-sm sm:text-base text-slate-600">
                      Dùng thử miễn phí trọn vẹn tính năng trong{' '}
                      <strong className="text-slate-900">{catalog.trial_duration_months} tháng đầu ({catalog.trial_duration_days} ngày)</strong>. Không yêu cầu thẻ tín dụng.
                    </p>
                  </div>

                  <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 sm:p-8 space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-700">
                          Tên doanh nghiệp / Đội kinh doanh *
                        </label>
                        <input
                          type="text"
                          value={companyName}
                          onChange={(e) => handleCompanyNameChange(e.target.value)}
                          placeholder="VD: Công ty Cổ phần Giải pháp Á Châu"
                          className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-semibold text-slate-700">
                            Mã định danh Workspace (Slug) *
                          </label>
                          {slugStatus === 'checking' && (
                            <span className="text-[11px] text-slate-500">Đang kiểm tra...</span>
                          )}
                          {slugStatus === 'available' && (
                            <span className="text-[11px] font-semibold text-emerald-600">✓ Khả dụng</span>
                          )}
                          {slugStatus === 'taken' && (
                            <span className="text-[11px] font-semibold text-rose-600">✕ Đã tồn tại</span>
                          )}
                        </div>
                        <div className="flex items-center rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 focus-within:border-blue-600 focus-within:bg-white focus-within:ring-2 focus-within:ring-blue-100">
                          <span className="text-xs text-slate-400 select-none mr-1">domation.net/t/</span>
                          <input
                            type="text"
                            value={tenantSlug}
                            onChange={(e) => handleSlugInput(e.target.value)}
                            placeholder="giai-phap-a-chau"
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

                    {/* Optional Business Preset Picker (Universal First — No Forced Industry) */}
                    <div className="pt-2 space-y-3">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-semibold text-slate-700">
                          Chọn mẫu phễu gợi ý (Hoặc giữ "Đa ngành / Tùy chỉnh tự do")
                        </label>
                        <span className="text-[11px] text-slate-500">Có thể sửa tự do bất kỳ lúc nào</span>
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
                                <div className="text-xs text-slate-500 mt-1 leading-relaxed">{item.subtitle}</div>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 2: Auto Data Router Configuration with Specialized Icons */}
              {step === 2 && (
                <div className="space-y-8">
                  <div className="text-center max-w-2xl mx-auto space-y-2">
                    <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
                      Thiết lập quy tắc Vòng Chia Số (Auto Data Router)
                    </h2>
                    <p className="text-sm sm:text-base text-slate-600">
                      Mọi thông số định tuyến, chống trùng và bảo mật SĐT đều hoạt động tự động dưới 4 giây.
                    </p>
                  </div>

                  <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 sm:p-8 space-y-8">
                    <div className="space-y-3">
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                        1. Thuật toán phân bổ khách hàng mới
                      </label>
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
                                    <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-bold text-blue-700">
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
                        <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                          2. Chính sách xử lý trùng Số Điện Thoại
                        </label>
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

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2">
                      <button
                        type="button"
                        onClick={() => setMaskPiiExternal((v) => !v)}
                        className={`rounded-2xl border p-4 text-left flex items-start gap-3.5 cursor-pointer transition-all ${
                          maskPiiExternal ? 'border-slate-900 bg-slate-50' : 'border-slate-200 bg-white'
                        }`}
                      >
                        <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center shrink-0">
                          <EyeOff className="w-5 h-5" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-semibold text-slate-900">
                              Che SĐT Cộng tác viên / Đại lý F1
                            </span>
                            <span
                              className={`text-xs font-bold ${
                                maskPiiExternal ? 'text-emerald-600' : 'text-slate-400'
                              }`}
                            >
                              {maskPiiExternal ? 'ĐANG BẬT' : 'TẮT'}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 mt-1">
                            Hiển thị dạng <code className="font-mono text-slate-800">0912***678</code> chống rò rỉ dữ liệu ra ngoài.
                          </p>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => setSlaAutoRecall((v) => !v)}
                        className={`rounded-2xl border p-4 text-left flex items-start gap-3.5 cursor-pointer transition-all ${
                          slaAutoRecall ? 'border-slate-900 bg-slate-50' : 'border-slate-200 bg-white'
                        }`}
                      >
                        <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0">
                          <Clock className="w-5 h-5" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-semibold text-slate-900">
                              Tự động thu hồi SLA quá hạn (15p)
                            </span>
                            <span
                              className={`text-xs font-bold ${
                                slaAutoRecall ? 'text-emerald-600' : 'text-slate-400'
                              }`}
                            >
                              {slaAutoRecall ? 'ĐANG BẬT' : 'TẮT'}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 mt-1">
                            Quá 15 phút chưa nhận khách, Router tự thu hồi chuyển ngay cho nhân sự kế tiếp.
                          </p>
                        </div>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 3: Channels & 3-Month Free Trial Activation */}
              {step === 3 && (
                <div className="space-y-8">
                  <div className="text-center max-w-2xl mx-auto space-y-2">
                    <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
                      Chọn kênh kết nối & Kích hoạt {catalog.trial_duration_months} tháng miễn phí
                    </h2>
                    <p className="text-sm sm:text-base text-slate-600">
                      Hệ thống sẽ cấp ngay cổng Webhook thật để bạn bắn thử Lead trực tiếp vào Vòng Chia Số.
                    </p>
                  </div>

                  <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 sm:p-8 space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      {CHANNEL_OPTIONS.map((ch) => {
                        const Icon = ch.icon;
                        const active = selectedChannels.includes(ch.key);
                        return (
                          <button
                            key={ch.key}
                            type="button"
                            onClick={() => toggleChannel(ch.key)}
                            className={`rounded-2xl border p-4 text-left transition-all cursor-pointer flex items-start gap-3.5 ${
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
                            <div className="flex-1">
                              <div className="flex items-center justify-between gap-2">
                                <span className="text-sm font-semibold text-slate-900">{ch.title}</span>
                                {active && <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />}
                              </div>
                              <p className="text-xs text-slate-500 mt-1 leading-relaxed">{ch.desc}</p>
                            </div>
                          </button>
                        );
                      })}
                    </div>

                    {/* Transparent Trial & Post-Trial Step Policy Card */}
                    <div className="rounded-2xl border border-blue-200 bg-blue-50/60 p-5 space-y-2.5">
                      <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
                        <ShieldCheck className="w-5 h-5 text-blue-600" />
                        <span>Chính sách Dùng Thử & Gia Hạn Minh Bạch DOMATION</span>
                      </div>
                      <ul className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-slate-700 pt-1">
                        <li className="rounded-xl bg-white p-3 border border-blue-100">
                          <div className="font-bold text-slate-900">
                            01. Miễn phí {catalog.trial_duration_months} tháng đầu
                          </div>
                          <div className="text-slate-500 mt-0.5">
                            Trọn vẹn {catalog.trial_duration_days} ngày sử dụng Auto Data Router không giới hạn tính năng.
                          </div>
                        </li>
                        <li className="rounded-xl bg-white p-3 border border-blue-100">
                          <div className="font-bold text-slate-900">
                            02. Hết {catalog.trial_duration_months} tháng gia hạn linh hoạt
                          </div>
                          <div className="text-slate-500 mt-0.5">
                            Mặc định {catalog.base_monthly_price_vnd.toLocaleString('vi-VN')}₫/tháng hoặc mua năm tiết kiệm {catalog.annual_discount_pct}% ({catalog.plans[0]?.annual_monthly_equivalent_vnd.toLocaleString('vi-VN')}₫/tháng).
                          </div>
                        </li>
                        <li className="rounded-xl bg-white p-3 border border-blue-100">
                          <div className="font-bold text-slate-900">03. Sẵn sàng lên CRM / ERP</div>
                          <div className="text-slate-500 mt-0.5">
                            Nâng cấp 1-click lên DOMATION CRM 360° hoặc ERP 5.0 giữ nguyên 100% lịch sử dữ liệu.
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
                <p className="text-xs text-slate-500">
                  Kết nối trực tiếp để kiểm tra Webhook, thời hạn dùng thử, nạp Topup hoặc nâng cấp gói.
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
                className="w-full rounded-xl bg-slate-900 text-white py-3 text-sm font-semibold hover:bg-blue-600 transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
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
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
                    <span>TRẠNG THÁI GÓI HIỆN TẠI</span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
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
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
                    <span>SỐ DƯ VÍ TOPUP</span>
                    <Wallet className="w-4 h-4 text-blue-600" />
                  </div>
                  <div className="text-xl font-bold text-blue-600 font-mono">
                    {session.subscription.wallet_balance_vnd.toLocaleString('vi-VN')} ₫
                  </div>
                  <div className="text-xs text-slate-500">
                    Gia hạn tự động 1-click ({catalog.base_monthly_price_vnd.toLocaleString('vi-VN')}₫/tháng hoặc -{catalog.annual_discount_pct}%/năm)
                  </div>
                </div>

                <div className="rounded-2xl bg-white border border-slate-200 p-5 space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
                    <span>HẠ TẦNG KẾT NỐI BACKEND</span>
                    <Layers className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div className="text-sm font-bold text-slate-900">
                    {session.bridge_mode === 'upstream_rls_postgres'
                      ? 'PostgreSQL RLS Kernel Cluster'
                      : 'DOMATION Cloud Serverless Engine'}
                  </div>
                  {session.upstream_app_url ? (
                    <a
                      href={`${session.upstream_app_url}/workspace`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:underline"
                    >
                      Mở toàn màn hình Kanban App <ArrowUpRight className="w-3.5 h-3.5" />
                    </a>
                  ) : (
                    <div className="text-xs text-slate-500">Đã cấp phát cổng Webhook & Router thực tế</div>
                  )}
                </div>
              </div>

              {/* TAB 1: REAL WEBHOOK & LIVE ROUTER TEST */}
              {workspaceTab === 'router' && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  <div className="lg:col-span-6 bg-white rounded-3xl border border-slate-200 p-6 space-y-5">
                    <div className="space-y-1">
                      <h3 className="text-lg font-bold text-slate-900">
                        Cổng Inbound Webhook thực tế của bạn
                      </h3>
                      <p className="text-xs text-slate-500">
                        Gắn URL này vào LadiPage, WordPress, Zapier hoặc Facebook Lead Ads để đổ số thẳng vào vòng chia.
                      </p>
                    </div>

                    <div className="rounded-2xl bg-slate-900 text-slate-100 p-4 space-y-2">
                      <div className="flex items-center justify-between text-[11px] text-slate-400">
                        <span>POST • JSON / FORM-URLENCODED</span>
                        <button
                          type="button"
                          onClick={() => void copyWebhookUrl()}
                          className="inline-flex items-center gap-1 text-emerald-400 hover:text-emerald-300 font-semibold cursor-pointer"
                        >
                          <Copy className="w-3.5 h-3.5" />
                          <span>{copiedWebhook ? 'Đã sao chép!' : 'Sao chép URL'}</span>
                        </button>
                      </div>
                      <div className="font-mono text-xs break-all text-blue-300">{session.webhook_url}</div>
                    </div>

                    <form onSubmit={handleFireRealWebhookTest} className="space-y-3.5 pt-2 border-t border-slate-100">
                      <div className="text-xs font-bold uppercase tracking-wider text-slate-500">
                        Bắn thử Lead thật qua Auto Data Router ngay lập tức
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
                        className="w-full rounded-xl bg-blue-600 text-white py-2.5 px-4 text-sm font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                      >
                        {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                        <span>Bắn Lead Thật Vào Vòng Chia Số</span>
                      </button>
                    </form>
                  </div>

                  <div className="lg:col-span-6 bg-white rounded-3xl border border-slate-200 p-6 space-y-5">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-bold text-slate-900">Kết quả định tuyến thời gian thực</h3>
                        <p className="text-xs text-slate-500">
                          Bấm bắn nhiều lần liên tiếp với SĐT mới hoặc SĐT trùng để kiểm chứng vòng chia.
                        </p>
                      </div>
                      {lastWebhookResult && (
                        <span className="rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-1 text-xs font-mono font-bold text-emerald-700">
                          {lastWebhookResult.latency_ms} ms
                        </span>
                      )}
                    </div>

                    {lastWebhookResult ? (
                      <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-4 space-y-2 text-xs">
                        <div className="flex items-center justify-between font-bold text-slate-900">
                          <span>Nhân sự nhận số: {lastWebhookResult.assigned_to_name}</span>
                          {lastWebhookResult.is_duplicate && (
                            <span className="rounded bg-amber-100 px-2 py-0.5 text-[10px] text-amber-800">
                              Phát hiện Trùng SĐT → Giữ chủ sở hữu
                            </span>
                          )}
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-600 pt-1">
                          <div>
                            Hiển thị bảo mật F1:{' '}
                            <strong className="font-mono text-slate-900">{lastWebhookResult.masked_phone}</strong>
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
                      <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center text-xs text-slate-500">
                        Chưa có lượt bắn thử trong phiên này. Nhấn nút <strong>"Bắn Lead Thật Vào Vòng Chia Số"</strong> bên trái để kiểm tra kết nối backend!
                      </div>
                    )}

                    <div className="space-y-2">
                      <div className="text-xs font-bold uppercase tracking-wider text-slate-500">
                        Nhật ký phân bổ gần nhất ({recentLeads.length})
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

              {/* TAB 2: STEP RENEWAL PLANS & WALLET TOPUP */}
              {workspaceTab === 'billing' && (
                <div className="space-y-6">
                  {transferOrderInfo && (
                    <div className="rounded-2xl border-2 border-blue-200 bg-blue-50/70 p-5 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="text-sm font-bold text-slate-900">{transferOrderInfo.title}</div>
                        <button
                          type="button"
                          onClick={() => setTransferOrderInfo(null)}
                          className="text-xs font-semibold text-slate-500 hover:text-slate-900"
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
                        <h3 className="text-lg font-bold text-slate-900">
                          Các gói gia hạn sau {catalog.trial_duration_months} tháng miễn phí
                        </h3>
                        <p className="text-xs text-slate-500">
                          Gia hạn sớm được cộng dồn trực tiếp vào số ngày dùng thử còn lại — không mất ngày nào.
                        </p>
                      </div>
                      <div className="inline-flex items-center bg-slate-100 p-1 rounded-full self-start">
                        <button
                          type="button"
                          onClick={() => setBillingCycle('monthly')}
                          className={`px-3.5 py-1.5 rounded-full text-xs font-semibold cursor-pointer ${
                            billingCycle === 'monthly' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'
                          }`}
                        >
                          Theo tháng ({(catalog.base_monthly_price_vnd / 1000).toFixed(0)}k)
                        </button>
                        <button
                          type="button"
                          onClick={() => setBillingCycle('annual')}
                          className={`px-3.5 py-1.5 rounded-full text-xs font-semibold cursor-pointer ${
                            billingCycle === 'annual' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600'
                          }`}
                        >
                          Theo năm (Tiết kiệm {catalog.annual_discount_pct}%)
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
                                <span className="text-[11px] font-bold uppercase tracking-wider opacity-70">
                                  Step 0{plan.step_order}
                                </span>
                                {plan.badge && (
                                  <span
                                    className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
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
                                    <span className="opacity-90">{f}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>

                            <button
                              type="button"
                              disabled={submitting}
                              onClick={() => void handleSubscribePlan(plan)}
                              className={`mt-5 w-full rounded-xl py-2.5 px-3 text-xs font-bold transition-colors cursor-pointer ${
                                plan.is_enterprise_upgrade
                                  ? 'bg-white text-slate-900 hover:bg-blue-50'
                                  : 'bg-slate-900 text-white hover:bg-blue-600'
                              }`}
                            >
                              {session.subscription.wallet_balance_vnd >= totalPayable
                                ? `Gia hạn tức thì bằng Ví (${totalPayable.toLocaleString('vi-VN')}₫)`
                                : `Chọn gói này (${totalPayable.toLocaleString('vi-VN')}₫)`}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Wallet Topup Section */}
                  <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-4">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-2.5">
                        <CreditCard className="w-5 h-5 text-blue-600" />
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
                        className="rounded-xl bg-blue-600 text-white px-4 py-2.5 text-xs font-bold hover:bg-blue-700 transition-colors cursor-pointer"
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
                              className="flex items-center justify-between text-xs bg-slate-50 rounded-xl px-3.5 py-2"
                            >
                              <div>
                                <span className="font-mono font-bold text-slate-800 mr-2">{tx.reference_code}</span>
                                <span className="text-slate-600">{tx.note}</span>
                              </div>
                              <div className="flex items-center gap-3">
                                <span className="font-mono font-bold text-slate-900">
                                  {tx.amount_vnd.toLocaleString('vi-VN')}₫
                                </span>
                                <span
                                  className={`rounded px-2 py-0.5 text-[10px] font-bold ${
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

              {/* TAB 3: UPGRADE TO DOMATION CRM 360 / ERP 5.0 */}
              {workspaceTab === 'crm_erp' && (
                <form
                  onSubmit={handleRequestCrmErpUpgrade}
                  className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 space-y-6"
                >
                  <div className="flex items-start justify-between flex-wrap gap-4">
                    <div className="space-y-1 max-w-xl">
                      <div className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600">
                        <Sparkles className="w-4 h-4" />
                        <span>LỘ TRÌNH MỞ RỘNG HỆ SINH THÁI DOMATION</span>
                      </div>
                      <h3 className="text-xl font-bold text-slate-900">
                        Nâng cấp liền mạch từ Auto Data lên CRM 360° hoặc Enterprise ERP 5.0
                      </h3>
                      <p className="text-xs sm:text-sm text-slate-600">
                        Giữ nguyên 100% cơ sở dữ liệu khách hàng, lịch sử tương tác, cấu trúc nhân sự và cổng Webhook đang chạy.
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <a
                        href="/crm"
                        target="_blank"
                        rel="noreferrer"
                        className="rounded-xl border border-slate-200 px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 inline-flex items-center gap-1"
                      >
                        Tìm hiểu CRM 360° <ArrowUpRight className="w-3.5 h-3.5" />
                      </a>
                      <a
                        href="/erp"
                        target="_blank"
                        rel="noreferrer"
                        className="rounded-xl border border-slate-200 px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 inline-flex items-center gap-1"
                      >
                        Tìm hiểu ERP 5.0 <ArrowUpRight className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                    {[
                      {
                        id: 'crm' as const,
                        title: 'DOMATION CRM 360°',
                        desc: 'Quản trị phễu bán hàng chuyên sâu, kịch bản CSKH đa điểm chạm, báo giá & hợp đồng.',
                      },
                      {
                        id: 'erp' as const,
                        title: 'DOMATION Enterprise ERP 5.0',
                        desc: '12 phân hệ quản trị tổng thể: HRM chấm công, KPI lương thưởng, Tài chính kế toán & Kho.',
                      },
                      {
                        id: 'crm_erp_bundle' as const,
                        title: 'Trọn Bộ Hợp Nhất CRM + ERP',
                        desc: 'Đồng bộ xuyên suốt từ lúc Lead đổ về Quảng cáo tới Doanh thu thực thu & Hoa hồng.',
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
                        Số điện thoại Giám đốc / Trưởng dự án nhận tư vấn chuyển đổi
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
                        placeholder="VD: Đồng bộ 45 nhân sự kinh doanh + kế toán nội bộ"
                        className="mt-1 w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="rounded-xl bg-slate-900 text-white px-6 py-3 text-sm font-semibold hover:bg-blue-600 transition-colors inline-flex items-center gap-2 cursor-pointer"
                  >
                    {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                    <span>Gửi Yêu Cầu Khởi Tạo Nâng Cấp CRM / ERP</span>
                  </button>
                </form>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Sticky Bottom Action Bar for 3-Step Registration Wizard */}
      {!session && authMode === 'register' && (
        <footer className="shrink-0 border-t border-slate-200 bg-white px-4 sm:px-8 py-4">
          <div className="max-w-5xl mx-auto flex items-center justify-between gap-4">
            <div>
              {step > 1 ? (
                <button
                  type="button"
                  onClick={() => setStep((s) => (s === 3 ? 2 : 1))}
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-xs sm:text-sm font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Quay lại bước trước</span>
                </button>
              ) : (
                <span className="text-xs text-slate-500 hidden sm:inline">
                  Bước 1/3 • Không ép buộc ngành nghề cố định
                </span>
              )}
            </div>

            <div className="flex items-center gap-3">
              {step < 3 ? (
                <button
                  type="button"
                  onClick={() => {
                    if (step === 1 && !validateStep1()) return;
                    setErrorMsg(null);
                    setStep((s) => (s === 1 ? 2 : 3));
                  }}
                  className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-6 py-2.5 text-xs sm:text-sm font-semibold text-white hover:bg-blue-600 transition-colors cursor-pointer"
                >
                  <span>Tiếp theo</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => void handleRegisterSubmit()}
                  className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-2.5 text-xs sm:text-sm font-semibold text-white hover:bg-blue-700 transition-colors cursor-pointer disabled:opacity-60"
                >
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                  <span>Kích Hoạt Hệ Thống & Nhận {catalog.trial_duration_months} Tháng Miễn Phí</span>
                </button>
              )}
            </div>
          </div>
        </footer>
      )}
    </div>
  );
}
