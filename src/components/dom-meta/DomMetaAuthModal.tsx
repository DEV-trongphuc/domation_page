import React, { useEffect, useRef, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  Check,
  CheckCircle2,
  HelpCircle,
  KeyRound,
  Loader2,
  PlusCircle,
  Search,
  Sparkles,
  X,
} from 'lucide-react';
import { DomationLogoMark } from '../DomationLogoMark';
import {
  AutodataApiError,
  apiRequest,
  getErrorMessage,
  saveAutodataSessionV2,
} from '../autodata/autodataApi';
import type {
  ClientSubscriptionSnapshot,
  TenantSessionV2,
  WorkspaceSummaryItem,
} from '../autodata/autodataTypes';
import {
  connectBatchMetaAccounts,
  discoverMetaAccountsFromToken,
  updateDomMetaWorkspaceConfig,
} from './domMetaApi';
import { DomMetaModalPortal } from './DomMetaModals';
import type { DomMetaGoogleAdsConfig } from './domMetaTypes';
import { GoogleAdsSetupGuide } from './GoogleAdsSetupGuide';

export type DomMetaAuthMode = 'login' | 'register' | 'select_workspace' | 'create_workspace';

export interface DomMetaAuthModalProps {
  isOpen: boolean;
  initialMode?: DomMetaAuthMode;
  googleClientId?: string | null;
  existingAccountToken?: string | null;
  existingWorkspaces?: WorkspaceSummaryItem[];
  existingUserEmail?: string;
  existingUserName?: string;
  requestedSlug?: string | null;
  onClose: () => void;
  onAuthenticated: (session: TenantSessionV2) => void;
}

interface AuthApiPayload {
  action?: 'enter_workspace' | 'select_workspace' | 'create_workspace';
  access_token?: string;
  refresh_token?: string;
  account_token?: string;
  google_provision_token?: string;
  account?: {
    id?: string;
    email?: string;
    full_name?: string;
    avatar_url?: string | null;
    auth_provider?: 'password' | 'google';
  };
  tenant?: { id?: string; slug?: string; name?: string; industry?: string };
  workspace?: { id?: string; slug?: string; company_name?: string; industry?: string };
  user?: {
    id?: string;
    email?: string;
    full_name?: string;
    avatar_url?: string | null;
    role?: string;
  };
  subscription?: ClientSubscriptionSnapshot;
  workspaces?: WorkspaceSummaryItem[];
}

interface GooglePromptNotification {
  isDisplayed?: () => boolean;
  isNotDisplayed: () => boolean;
  isSkippedMoment: () => boolean;
  isDismissedMoment?: () => boolean;
}

interface GoogleIdentityWindow extends Window {
  google?: {
    accounts?: {
      id?: {
        initialize: (cfg: {
          client_id: string;
          callback: (resp: { credential?: string }) => void;
          auto_select?: boolean;
          use_fedcm_for_prompt?: boolean;
        }) => void;
        renderButton: (
          parent: HTMLElement,
          options: {
            type?: 'standard' | 'icon';
            theme?: 'outline' | 'filled_blue' | 'filled_black';
            size?: 'large' | 'medium' | 'small';
            text?: 'signin_with' | 'signup_with' | 'continue_with' | 'signin';
            shape?: 'rectangular' | 'pill' | 'circle' | 'square';
            width?: number | string;
            locale?: string;
          }
        ) => void;
        prompt: (callback?: (notification: GooglePromptNotification) => void) => void;
      };
    };
  };
}

interface GisOfficialButtonProps {
  clientId: string;
  label: string;
  disabled?: boolean;
  loading?: boolean;
  onCredential: (credential: string) => void;
  onFallbackClick: () => void;
}

const GisOfficialButton: React.FC<GisOfficialButtonProps> = ({
  clientId,
  label,
  disabled,
  loading,
  onCredential,
  onFallbackClick,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const onCredentialRef = useRef(onCredential);
  const [rendered, setRendered] = useState(false);

  useEffect(() => {
    onCredentialRef.current = onCredential;
  }, [onCredential]);

  useEffect(() => {
    let cancelled = false;
    let attempts = 0;

    const tryMount = () => {
      if (cancelled || !containerRef.current) return false;
      const g = (window as GoogleIdentityWindow).google?.accounts?.id;
      if (!g || typeof g.renderButton !== 'function') return false;
      try {
        g.initialize({
          client_id: clientId,
          auto_select: false,
          use_fedcm_for_prompt: false,
          callback: (resp: { credential?: string }) => {
            if (resp?.credential) {
              onCredentialRef.current(resp.credential);
            }
          },
        });
        containerRef.current.innerHTML = '';
        const widthPx = Math.max(260, Math.min(400, containerRef.current.clientWidth || 360));
        g.renderButton(containerRef.current, {
          type: 'standard',
          theme: 'outline',
          size: 'large',
          text: 'continue_with',
          shape: 'pill',
          width: widthPx,
          locale: 'vi',
        });
        setRendered(true);
        return true;
      } catch {
        return false;
      }
    };

    if (!tryMount()) {
      const timer = window.setInterval(() => {
        attempts += 1;
        if (tryMount() || attempts >= 16) {
          window.clearInterval(timer);
        }
      }, 250);
      return () => {
        cancelled = true;
        window.clearInterval(timer);
      };
    }

    return () => {
      cancelled = true;
    };
  }, [clientId]);

  return (
    <div className="w-full space-y-2">
      <div
        ref={containerRef}
        data-testid={rendered ? 'dom-meta-google-btn' : undefined}
        className={`w-full flex justify-center overflow-hidden rounded-full ${
          rendered ? 'min-h-[42px]' : 'hidden'
        } ${disabled ? 'pointer-events-none opacity-60' : ''}`}
      />
      {!rendered && (
        <button
          type="button"
          data-testid="dom-meta-google-btn"
          disabled={disabled}
          onClick={onFallbackClick}
          className="w-full py-2.5 rounded-2xl bg-white hover:bg-slate-50 border border-slate-300 text-slate-800 text-xs sm:text-sm font-semibold flex items-center justify-center gap-2.5 cursor-pointer shadow-sm transition-colors"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin text-[#1E40FF]" />
          ) : (
            <GoogleLogoMark className="w-4 h-4" />
          )}
          <span>{label}</span>
        </button>
      )}
    </div>
  );
};

interface RecentGoogleAccountItem {
  email: string;
  full_name: string;
  updated_at: string;
}

const RECENT_GOOGLE_ACCOUNTS_KEY = 'domation_recent_google_accounts_v1';

function loadRecentGoogleAccounts(): RecentGoogleAccountItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(RECENT_GOOGLE_ACCOUNTS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(
        (it): it is RecentGoogleAccountItem =>
          Boolean(
            it &&
              typeof it === 'object' &&
              typeof (it as RecentGoogleAccountItem).email === 'string'
          )
      )
      .slice(0, 6);
  } catch {
    return [];
  }
}

function rememberRecentGoogleAccount(email: string, fullName: string): RecentGoogleAccountItem[] {
  const cleanEmail = email.trim().toLowerCase();
  if (!cleanEmail || !cleanEmail.includes('@') || typeof window === 'undefined') {
    return loadRecentGoogleAccounts();
  }
  const cleanName = fullName.trim() || cleanEmail.split('@')[0] || 'Quản trị viên';
  const nextList: RecentGoogleAccountItem[] = [
    { email: cleanEmail, full_name: cleanName, updated_at: new Date().toISOString() },
    ...loadRecentGoogleAccounts().filter((item) => item.email !== cleanEmail),
  ].slice(0, 6);
  try {
    window.localStorage.setItem(RECENT_GOOGLE_ACCOUNTS_KEY, JSON.stringify(nextList));
  } catch {
    // ignore storage quota
  }
  return nextList;
}

function slugifyName(raw: string): string {
  return raw
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/gi, 'd')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 32);
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

const DomMetaAuthModalBody: React.FC<Omit<DomMetaAuthModalProps, 'isOpen'>> = ({
  initialMode = 'register',
  googleClientId,
  existingAccountToken = null,
  existingWorkspaces = [],
  existingUserEmail = '',
  existingUserName = '',
  requestedSlug = null,
  onClose,
  onAuthenticated,
}) => {
  const [mode, setMode] = useState<DomMetaAuthMode>(() => {
    if (initialMode === 'select_workspace' && existingAccountToken) return 'select_workspace';
    if (initialMode === 'create_workspace' && existingAccountToken) return 'create_workspace';
    return initialMode === 'login' || initialMode === 'select_workspace' ? 'login' : 'register';
  });
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Login & Workspace Discovery fields
  const [loginEmail, setLoginEmail] = useState(existingUserEmail);
  const [loginPassword, setLoginPassword] = useState('');
  const [loginSlug, setLoginSlug] = useState(requestedSlug || '');
  const [accountToken, setAccountToken] = useState<string | null>(existingAccountToken);
  const [authProvider, setAuthProvider] = useState<'password' | 'google'>(
    existingAccountToken ? 'google' : 'password'
  );
  const [workspaces, setWorkspaces] = useState<WorkspaceSummaryItem[]>(existingWorkspaces);

  // Google OAuth fallback modal state
  const [googlePromptOpen, setGooglePromptOpen] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [googleInputEmail, setGoogleInputEmail] = useState(existingUserEmail);
  const [googleInputName, setGoogleInputName] = useState(existingUserName);
  const [recentGoogleAccounts, setRecentGoogleAccounts] = useState<RecentGoogleAccountItem[]>(() =>
    loadRecentGoogleAccounts()
  );

  // Register / Create Workspace Step 1 fields
  const [autoSlugSalt, setAutoSlugSalt] = useState<string>(() =>
    Math.random().toString(36).replace(/[^a-z0-9]/g, '').slice(0, 4) || 'm9k2'
  );
  const [companyName, setCompanyName] = useState('');
  const [tenantSlug, setTenantSlug] = useState('');
  const [slugTouched, setSlugTouched] = useState(false);
  const [adminName, setAdminName] = useState(existingUserName);
  const [workEmail, setWorkEmail] = useState(existingUserEmail);
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');

  // Step 2: Meta Token & Ad Account picker
  const [metaToken, setMetaToken] = useState('');
  const [showTokenHelp, setShowTokenHelp] = useState(false);
  const [discovering, setDiscovering] = useState(false);
  const [discoveredAccounts, setDiscoveredAccounts] = useState<
    Array<{ ad_account_id: string; name: string; currency: string; business_name?: string | null }>
  >([]);
  const [selectedAccountIds, setSelectedAccountIds] = useState<Record<string, boolean>>({});

  // Step 3: Optional Google Ads Toggle (DEFAULT OFF!)
  const [googleAds, setGoogleAds] = useState<DomMetaGoogleAdsConfig>({
    enabled: false, // STRICTLY OFF BY DEFAULT
    customer_id: '',
    apps_script_url: '',
    developer_token: '',
  });

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Ensure Google Identity Services (GIS) client script is loaded
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const g = (window as GoogleIdentityWindow).google?.accounts?.id;
    if (!g && !document.querySelector('script[src*="accounts.google.com/gsi/client"]')) {
      const s = document.createElement('script');
      s.src = 'https://accounts.google.com/gsi/client';
      s.async = true;
      s.defer = true;
      document.head.appendChild(s);
    }
  }, []);

  // Refresh workspace list asynchronously when opening select_workspace with an active token
  useEffect(() => {
    if (mode !== 'select_workspace' || !accountToken) return;
    let cancelled = false;
    void (async () => {
      try {
        const res = await apiRequest<{ workspaces?: WorkspaceSummaryItem[] }>('/auth/workspaces', {
          token: accountToken,
        });
        if (!cancelled && Array.isArray(res.workspaces) && res.workspaces.length > 0) {
          setWorkspaces(res.workspaces);
        }
      } catch {
        // Keep existingWorkspaces fallback
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [mode, accountToken]);

  // Background check-slug uniqueness & auto re-roll salt on 409/taken when !slugTouched
  useEffect(() => {
    if ((mode !== 'register' && mode !== 'create_workspace') || step !== 1) return;
    const clean = tenantSlug.trim();
    if (clean.length < 3 || slugTouched) return;
    let cancelled = false;
    const timer = window.setTimeout(async () => {
      try {
        const res = await apiRequest<{ is_available?: boolean; available?: boolean }>(
          `/api/autodata?action=check-slug&slug=${encodeURIComponent(clean)}`
        );
        const ok =
          res.is_available !== undefined ? Boolean(res.is_available) : Boolean(res.available);
        if (!cancelled && !ok) {
          const nextSalt =
            Math.random().toString(36).replace(/[^a-z0-9]/g, '').slice(0, 5) || 'x8k2';
          setAutoSlugSalt(nextSalt);
          const base = slugifyName(companyName) || 'ws';
          setTenantSlug(`${base.slice(0, 26)}-${nextSalt}`);
        }
      } catch (err: unknown) {
        if (!cancelled && err instanceof AutodataApiError && err.status === 409) {
          const nextSalt =
            Math.random().toString(36).replace(/[^a-z0-9]/g, '').slice(0, 5) || 'x8k2';
          setAutoSlugSalt(nextSalt);
          const base = slugifyName(companyName) || 'ws';
          setTenantSlug(`${base.slice(0, 26)}-${nextSalt}`);
        }
      }
    }, 350);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [mode, step, tenantSlug, companyName, slugTouched]);

  const handleCompanyNameInput = (val: string) => {
    setCompanyName(val);
    if (!slugTouched) {
      const trimmed = val.trim();
      if (!trimmed) {
        setTenantSlug('');
      } else {
        const base = slugifyName(trimmed) || 'ws';
        setTenantSlug(base.length >= 3 ? base : `${base}-${autoSlugSalt}`);
      }
    }
  };

  const buildAndEmitSession = (
    d: AuthApiPayload,
    provider: 'password' | 'google',
    fallbackEmail?: string,
    fallbackSlug?: string,
    fallbackCompany?: string
  ) => {
    const resolvedSlug = d.tenant?.slug || d.workspace?.slug || fallbackSlug || '';
    const resolvedCompany =
      d.tenant?.name || d.workspace?.company_name || fallbackCompany || resolvedSlug || 'DOM Workspace';
    const resolvedEmail =
      d.user?.email || d.account?.email || fallbackEmail || loginEmail.trim() || workEmail.trim();
    const resolvedName =
      d.user?.full_name ||
      d.account?.full_name ||
      adminName.trim() ||
      resolvedEmail.split('@')[0] ||
      'Admin';

    if (provider === 'google' && resolvedEmail) {
      setRecentGoogleAccounts(rememberRecentGoogleAccount(resolvedEmail, resolvedName));
    }

    const session: TenantSessionV2 = {
      access_token: String(d.access_token || ''),
      refresh_token: d.refresh_token,
      account_token: d.account_token || accountToken || undefined,
      tenant_slug: resolvedSlug,
      company_name: resolvedCompany,
      industry: d.tenant?.industry || d.workspace?.industry || 'general',
      admin_email: resolvedEmail,
      user_id: d.user?.id,
      user_name: resolvedName,
      role: (d.user?.role as TenantSessionV2['role']) || 'tenant_admin',
      auth_provider: provider,
      subscription: d.subscription,
      workspaces: d.workspaces || workspaces,
    };
    saveAutodataSessionV2(session);
    onAuthenticated(session);
  };

  const handleEnterWorkspaceBySlug = async (
    targetSlug: string,
    tok: string,
    provider: 'password' | 'google',
    fallbackEmail?: string,
    discoveredList?: WorkspaceSummaryItem[]
  ) => {
    const switched = await apiRequest<AuthApiPayload>('/api/autodata?action=switch-workspace', {
      method: 'POST',
      token: tok,
      body: { tenant_slug: targetSlug, account_token: tok },
    });
    const matchedWs = (discoveredList || workspaces).find((w) => w.slug === targetSlug);
    buildAndEmitSession(
      {
        ...switched,
        account_token: switched.account_token || tok,
        workspaces: switched.workspaces || discoveredList || workspaces,
      },
      provider,
      fallbackEmail,
      targetSlug,
      matchedWs?.company_name
    );
  };

  const processAuthPayload = async (
    d: AuthApiPayload,
    provider: 'password' | 'google',
    fallbackEmail?: string
  ) => {
    const resolvedToken = d.account_token || d.google_provision_token || d.access_token || null;
    const discovered = Array.isArray(d.workspaces) ? d.workspaces : [];
    const userEmail = d.user?.email || d.account?.email || fallbackEmail || '';
    const userFullName =
      d.user?.full_name || d.account?.full_name || (userEmail ? userEmail.split('@')[0] : '');

    if (provider === 'google' && userEmail) {
      setRecentGoogleAccounts(rememberRecentGoogleAccount(userEmail, userFullName));
    }

    // 0 Workspaces -> transition directly into Create Workspace wizard (no password required!)
    if (d.action === 'create_workspace' || (discovered.length === 0 && !d.access_token)) {
      setAccountToken(resolvedToken);
      setAuthProvider(provider);
      setWorkEmail(userEmail);
      setAdminName(userFullName);
      setWorkspaces([]);
      setMode('create_workspace');
      setStep(1);
      return;
    }

    // If URL requested a specific slug and it's in user's workspaces, switch right into it
    if (
      requestedSlug &&
      resolvedToken &&
      discovered.some((w) => w.slug.toLowerCase() === requestedSlug.toLowerCase())
    ) {
      if (d.access_token && d.tenant?.slug?.toLowerCase() === requestedSlug.toLowerCase()) {
        buildAndEmitSession(d, provider, userEmail);
        return;
      }
      await handleEnterWorkspaceBySlug(
        requestedSlug.toLowerCase(),
        resolvedToken,
        provider,
        userEmail,
        discovered
      );
      return;
    }

    // Direct entry (1 workspace or explicit slug login)
    if (
      (d.action === 'enter_workspace' || discovered.length === 1 || !d.action) &&
      d.access_token
    ) {
      buildAndEmitSession(d, provider, userEmail, loginSlug.trim().toLowerCase());
      return;
    }

    // Multiple workspaces -> show Workspace Picker
    if (discovered.length > 0 && resolvedToken) {
      setAccountToken(resolvedToken);
      setAuthProvider(provider);
      setWorkspaces(discovered);
      if (userEmail) {
        setWorkEmail(userEmail);
        setLoginEmail(userEmail);
      }
      if (userFullName) setAdminName(userFullName);
      setMode('select_workspace');
      return;
    }

    throw new Error('Không nhận được phiên đăng nhập hợp lệ.');
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const payload = await apiRequest<AuthApiPayload>('/api/autodata?action=login', {
        method: 'POST',
        body: {
          email: loginEmail.trim(),
          password: loginPassword,
          ...(loginSlug.trim() ? { tenant_slug: loginSlug.trim().toLowerCase() } : {}),
        },
      });
      await processAuthPayload(payload, 'password', loginEmail.trim());
    } catch (err: unknown) {
      setError(
        getErrorMessage(
          err,
          'Đăng nhập không thành công. Vui lòng kiểm tra lại email hoặc mật khẩu.'
        )
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
    setError(null);
    try {
      const bodyPayload = {
        ...payload,
        id_token: payload.id_token || payload.credential,
        credential: payload.credential || payload.id_token,
      };
      let res: AuthApiPayload;
      try {
        res = await apiRequest<AuthApiPayload>('/api/autodata?action=google', {
          method: 'POST',
          body: bodyPayload,
        });
      } catch (primaryErr: unknown) {
        if (!(primaryErr instanceof AutodataApiError && primaryErr.status === 404)) {
          throw primaryErr;
        }
        res = await apiRequest<AuthApiPayload>('/api/autodata?action=google-login', {
          method: 'POST',
          body: bodyPayload,
        });
      }
      setGooglePromptOpen(false);
      await processAuthPayload(res, 'google', payload.email);
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'Đăng nhập bằng Google không thành công.'));
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleGoogleSignInClick = () => {
    setError(null);
    const activeClientId = (
      googleClientId ||
      (import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined) ||
      '641158233158-nsg8a8tdsj3fdgb34dc9tugm8god7tho.apps.googleusercontent.com'
    ).trim();

    const openFallbackGoogleDialog = () => {
      setGoogleInputEmail((prev) => prev || loginEmail.trim() || workEmail.trim());
      setGoogleInputName((prev) => prev || adminName.trim());
      setGooglePromptOpen(true);
    };

    const g = (window as GoogleIdentityWindow).google?.accounts?.id;
    if (!g) {
      openFallbackGoogleDialog();
      return;
    }

    let promptSettled = false;
    const fallbackTimer = window.setTimeout(() => {
      if (!promptSettled) {
        promptSettled = true;
        openFallbackGoogleDialog();
      }
    }, 1200);

    g.initialize({
      client_id: activeClientId,
      auto_select: false,
      use_fedcm_for_prompt: false,
      callback: (resp: { credential?: string }) => {
        promptSettled = true;
        window.clearTimeout(fallbackTimer);
        if (!resp?.credential) {
          setError('Bạn đã hủy hoặc chưa cấp quyền Google.');
          return;
        }
        void executeGoogleLogin({ credential: resp.credential, id_token: resp.credential });
      },
    });

    g.prompt((notification) => {
      if (notification.isDisplayed?.()) {
        promptSettled = true;
        window.clearTimeout(fallbackTimer);
        return;
      }
      if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
        promptSettled = true;
        window.clearTimeout(fallbackTimer);
        openFallbackGoogleDialog();
      }
    });
  };

  const handleEnterWorkspaceFromList = async (ws: WorkspaceSummaryItem) => {
    if (!accountToken) return;
    setError(null);
    setSubmitting(true);
    try {
      await handleEnterWorkspaceBySlug(
        ws.slug,
        accountToken,
        authProvider,
        workEmail || loginEmail,
        workspaces
      );
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'Không thể chuyển vào Workspace đã chọn.'));
    } finally {
      setSubmitting(false);
    }
  };

  const isAuthenticatedWorkspaceCreation = Boolean(
    accountToken && (mode === 'create_workspace' || password.length === 0)
  );

  const handleNextFromStep1 = async () => {
    setError(null);
    const cleanSlug = tenantSlug.trim().toLowerCase();
    if (!companyName.trim() || cleanSlug.length < 2) {
      setError('Vui lòng nhập Tên Doanh Nghiệp và đường dẫn Workspace (tối thiểu 2 ký tự).');
      return;
    }

    if (!accountToken) {
      if (!workEmail.trim() || !workEmail.includes('@')) {
        setError('Vui lòng nhập địa chỉ Email hợp lệ.');
        return;
      }
      if (!phone.trim() || phone.replace(/\D/g, '').length < 9) {
        setError('Vui lòng nhập Số điện thoại liên hệ hợp lệ.');
        return;
      }
      if (!password || password.length < 8) {
        setError('Mật khẩu cần tối thiểu 8 ký tự.');
        return;
      }
    }

    setSubmitting(true);
    try {
      const slugCheck = await apiRequest<{ is_available?: boolean; available?: boolean }>(
        `/api/autodata?action=check-slug&slug=${encodeURIComponent(cleanSlug)}`
      );
      const isAvail =
        slugCheck.is_available !== undefined
          ? Boolean(slugCheck.is_available)
          : slugCheck.available !== undefined
            ? Boolean(slugCheck.available)
            : true;
      if (!isAvail) {
        setError('Đường dẫn Workspace (Slug) đã có người sử dụng. Hãy chọn tên khác.');
        return;
      }
      setStep(2);
    } catch (err: unknown) {
      setError(
        getErrorMessage(err, 'Đường dẫn Workspace (Slug) đã có người sử dụng. Hãy chọn tên khác.')
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleDiscoverMeta = async () => {
    setError(null);
    if (!metaToken.trim()) {
      setError('Vui lòng dán Meta Access Token (EAA...) trước khi tải danh sách tài khoản.');
      return;
    }
    setDiscovering(true);
    try {
      const list = await discoverMetaAccountsFromToken({}, metaToken.trim());
      setDiscoveredAccounts(list);
      const checked: Record<string, boolean> = {};
      list.slice(0, 5).forEach((a) => {
        checked[a.ad_account_id] = true;
      });
      setSelectedAccountIds(checked);
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'Token không hợp lệ hoặc chưa bật quyền ads_read.'));
    } finally {
      setDiscovering(false);
    }
  };

  const handleFinishRegistration = async () => {
    setError(null);
    if (googleAds.enabled && (!googleAds.customer_id.trim() || !googleAds.apps_script_url.trim())) {
      setError(
        'Bạn đang bật công tắc Google Ads — vui lòng nhập đủ Google Ads Customer ID và Apps Script URL (hoặc tắt công tắc nếu chưa dùng).'
      );
      return;
    }

    setSubmitting(true);
    try {
      const cleanSlug = tenantSlug.trim().toLowerCase();
      let d: AuthApiPayload;

      if (accountToken) {
        const wsCreateBody = {
          company_name: companyName.trim(),
          tenant_slug: cleanSlug,
          admin_name: adminName.trim() || companyName.trim(),
          phone: phone.trim() || '0900000000',
          industry: 'general',
          seed_demo_leads: false,
        };
        try {
          d = await apiRequest<AuthApiPayload>('/api/autodata?action=google-create-workspace', {
            method: 'POST',
            token: accountToken,
            body: wsCreateBody,
          });
        } catch (primaryErr: unknown) {
          if (!(primaryErr instanceof AutodataApiError && primaryErr.status === 404)) {
            throw primaryErr;
          }
          d = await apiRequest<AuthApiPayload>('/api/autodata?action=create-workspace', {
            method: 'POST',
            token: accountToken,
            body: wsCreateBody,
          });
        }
      } else {
        d = await apiRequest<AuthApiPayload>('/api/autodata?action=register', {
          method: 'POST',
          body: {
            company_name: companyName.trim(),
            tenant_slug: cleanSlug,
            admin_name: adminName.trim() || companyName.trim(),
            work_email: workEmail.trim().toLowerCase(),
            phone: phone.trim(),
            password,
            industry: 'general',
            seed_demo_leads: false,
          },
        });
      }

      const token = String(d.access_token || '');
      const createdSlug = String(d.tenant?.slug || d.workspace?.slug || cleanSlug);

      const chosenMetaAccounts = discoveredAccounts
        .filter((a) => selectedAccountIds[a.ad_account_id])
        .map((a) => ({ ad_account_id: a.ad_account_id, name: a.name }));

      if (token && metaToken.trim() && chosenMetaAccounts.length > 0) {
        await connectBatchMetaAccounts(
          { accessToken: token, tenantSlug: createdSlug },
          {
            access_token: metaToken.trim(),
            accounts: chosenMetaAccounts,
            primary_ad_account_id: chosenMetaAccounts[0].ad_account_id,
          }
        ).catch(() => null);
      }

      if (token) {
        await updateDomMetaWorkspaceConfig(
          { accessToken: token, tenantSlug: createdSlug },
          {
            google_ads: {
              enabled: googleAds.enabled,
              customer_id: googleAds.customer_id.trim(),
              apps_script_url: googleAds.apps_script_url.trim(),
              developer_token: googleAds.developer_token?.trim() || '',
            },
          }
        ).catch(() => null);
      }

      buildAndEmitSession(
        d,
        accountToken ? authProvider : 'password',
        workEmail.trim().toLowerCase(),
        createdSlug,
        companyName.trim()
      );
    } catch (err: unknown) {
      setError(
        getErrorMessage(err, 'Không thể khởi tạo Workspace. Vui lòng kiểm tra lại thông tin.')
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      data-testid="dom-meta-auth-modal"
      style={{ zIndex: 2147483640 }}
      className="fixed inset-0 bg-slate-950/65 backdrop-blur-md p-0 sm:p-6 flex items-end sm:items-center justify-center overflow-hidden text-slate-800 dom-ios-backdrop"
    >
      <div className="w-full max-w-2xl max-h-[93dvh] sm:max-h-[90vh] bg-white rounded-t-[26px] sm:rounded-3xl shadow-2xl border border-slate-200/90 overflow-hidden flex flex-col dom-ios-modal-responsive">
        <div className="sm:hidden dom-sheet-grabber" />
        {/* Header */}
        <div className="px-4 sm:px-6 py-3.5 sm:py-4 bg-slate-50/80 border-b border-slate-200/80 flex items-center justify-between gap-2.5 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <DomationLogoMark size={32} />
            <div className="min-w-0">
              <div className="text-xs sm:text-sm font-bold text-slate-900 leading-none truncate">
                DOMATION <span className="text-[#1E40FF]">/ META REPORT</span>
              </div>
              <div className="text-[10.5px] sm:text-[11px] font-medium text-slate-500 mt-1 truncate">
                Miễn phí 1 tháng đầu · Đồng bộ CRM AutoData
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {mode !== 'select_workspace' && mode !== 'create_workspace' && (
              <button
                type="button"
                onClick={() => {
                  setError(null);
                  setMode(mode === 'register' ? 'login' : 'register');
                }}
                className="px-2.5 sm:px-3 py-1.5 rounded-full bg-white border border-slate-200 text-[11px] sm:text-xs font-semibold text-[#1E40FF] hover:bg-blue-50 cursor-pointer"
              >
                <span className="sm:hidden">
                  {mode === 'register' ? 'Đăng nhập' : 'Tạo mới'}
                </span>
                <span className="hidden sm:inline">
                  {mode === 'register' ? 'Đã có tài khoản? Đăng nhập' : 'Tạo Workspace Free 1 tháng'}
                </span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-100 cursor-pointer shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 p-4 sm:p-7 pb-[calc(1.25rem+env(safe-area-inset-bottom,0px))] sm:pb-7 overflow-y-auto overflow-x-hidden overscroll-contain space-y-5">
          {requestedSlug && mode === 'login' && (
            <div className="rounded-2xl bg-[#F4F8FF] border border-blue-200 px-4 py-3 text-xs font-medium text-slate-700">
              Bạn đang truy cập Workspace{' '}
              <code className="font-mono font-semibold text-[#1E40FF]">
                /meta-report/{requestedSlug}
              </code>
              . Vui lòng đăng nhập tài khoản có quyền truy cập Workspace này.
            </div>
          )}

          {error && (
            <div className="rounded-2xl bg-rose-50 border border-rose-200 px-4 py-3 text-xs font-semibold text-rose-700">
              {error}
            </div>
          )}

          {/* MODE: LOGIN */}
          {mode === 'login' && (
            <div className="space-y-4">
              <div>
                <h2 className="text-xl font-semibold text-slate-800">
                  Đăng Nhập DOM Meta Workspace
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Sử dụng chung tài khoản Google hoặc Email với hệ thống Auto Chia Data &amp;
                  DOMATION ERP.
                </p>
              </div>

              <GisOfficialButton
                clientId={(
                  googleClientId ||
                  (import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined) ||
                  '641158233158-nsg8a8tdsj3fdgb34dc9tugm8god7tho.apps.googleusercontent.com'
                ).trim()}
                label="Tiếp tục nhanh với Google"
                disabled={googleLoading || submitting}
                loading={googleLoading}
                onCredential={(cred) =>
                  void executeGoogleLogin({ credential: cred, id_token: cred })
                }
                onFallbackClick={handleGoogleSignInClick}
              />

              <div className="relative flex items-center py-0.5">
                <div className="flex-grow border-t border-slate-200" />
                <span className="shrink-0 px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  Hoặc Email &amp; Mật khẩu
                </span>
                <div className="flex-grow border-t border-slate-200" />
              </div>

              <form onSubmit={(e) => void handleLogin(e)} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Email quản trị
                  </label>
                  <input
                    type="email"
                    required
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="ceo@doanhnghiep.vn"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-[#1E40FF] px-3.5 py-2.5 text-sm outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Mật khẩu</label>
                  <input
                    type="password"
                    required
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-[#1E40FF] px-3.5 py-2.5 text-sm outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Đường dẫn Workspace{' '}
                    <span className="font-normal text-slate-400">
                      (Tùy chọn — để trống để tự liệt kê tất cả Workspace của bạn)
                    </span>
                  </label>
                  <input
                    type="text"
                    value={loginSlug}
                    onChange={(e) => setLoginSlug(e.target.value)}
                    placeholder="VD: ecolifesignature"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-[#1E40FF] px-3.5 py-2.5 text-xs font-mono outline-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3.5 rounded-full bg-gradient-to-r from-[#1E40FF] to-[#0284C7] text-white text-sm font-semibold flex items-center justify-center gap-2 cursor-pointer shadow-md"
                >
                  {submitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <ArrowRight className="w-4 h-4" />
                  )}
                  <span>Vào Báo Cáo Meta Ads</span>
                </button>
              </form>
            </div>
          )}

          {/* MODE: SELECT WORKSPACE */}
          {mode === 'select_workspace' && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h3 className="text-lg font-semibold text-slate-800">
                    Chọn Workspace Để Xem Báo Cáo ({workspaces.length})
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Chuyển đổi tức thì hoặc khởi tạo thêm không gian báo cáo mới trên cùng tài khoản.
                  </p>
                </div>
                <button
                  type="button"
                  data-testid="dom-meta-start-create-workspace"
                  onClick={() => {
                    setError(null);
                    setMode('create_workspace');
                    setStep(1);
                  }}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-[#F4F8FF] hover:bg-blue-100 border border-blue-200 text-xs font-semibold text-[#1E40FF] cursor-pointer"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>Tạo Workspace mới</span>
                </button>
              </div>

              <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                {workspaces.map((ws) => (
                  <button
                    key={ws.slug}
                    type="button"
                    disabled={submitting}
                    data-testid={`select-ws-${ws.slug}`}
                    onClick={() => void handleEnterWorkspaceFromList(ws)}
                    className="w-full rounded-2xl border border-slate-200 hover:border-[#1E40FF] p-4 flex items-center justify-between text-left hover:bg-blue-50/40 transition-all cursor-pointer"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-xl bg-blue-50 text-[#1E40FF] flex items-center justify-center shrink-0">
                        <Building2 className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-semibold text-slate-800 truncate">
                          {ws.company_name}
                        </div>
                        <div className="text-xs font-mono text-slate-500 truncate">
                          /meta-report/{ws.slug}
                          {ws.days_remaining !== undefined ? ` · Còn ${ws.days_remaining} ngày` : ''}
                        </div>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-[#1E40FF] shrink-0" />
                  </button>
                ))}
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <span>Đang đăng nhập: {workEmail || loginEmail || 'Tài khoản DOMATION'}</span>
                <button
                  type="button"
                  data-testid="dom-meta-switch-account"
                  onClick={() => {
                    setError(null);
                    setMode('login');
                  }}
                  className="font-semibold text-[#1E40FF] hover:underline cursor-pointer"
                >
                  Đăng nhập tài khoản khác
                </button>
              </div>
            </div>
          )}

          {/* MODE: REGISTER / CREATE WORKSPACE (3 SIMPLE STEPS) */}
          {(mode === 'register' || mode === 'create_workspace') && (
            <div className="space-y-5">
              {/* Step Indicator */}
              <div className="grid grid-cols-3 gap-2">
                {[
                  { n: 1 as const, label: '1. Tạo Workspace' },
                  { n: 2 as const, label: '2. Kết nối Meta Ads' },
                  { n: 3 as const, label: '3. Mở rộng Google Ads' },
                ].map((s) => {
                  const done = step > s.n;
                  const active = step === s.n;
                  return (
                    <div
                      key={s.n}
                      className={`rounded-xl px-3 py-2 border text-xs font-semibold flex items-center gap-1.5 ${
                        active
                          ? 'bg-[#F4F8FF] border-[#1E40FF] text-[#1E40FF]'
                          : done
                            ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                            : 'bg-slate-50 border-slate-200 text-slate-400'
                      }`}
                    >
                      {done && <Check className="w-3.5 h-3.5 shrink-0" />}
                      <span className="truncate">{s.label}</span>
                    </div>
                  );
                })}
              </div>

              {/* STEP 1 */}
              {step === 1 && (
                <div className="space-y-3.5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-[11px] font-semibold text-emerald-700">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Tặng ngay 30 ngày dùng thử miễn phí full tính năng</span>
                    </div>

                    {mode === 'create_workspace' && workspaces.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setMode('select_workspace')}
                        className="text-xs font-semibold text-[#1E40FF] hover:underline cursor-pointer"
                      >
                        ← Chọn từ {workspaces.length} Workspace sẵn có
                      </button>
                    )}
                  </div>

                  {!accountToken && (
                    <>
                      <GisOfficialButton
                        clientId={(
                          googleClientId ||
                          (import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined) ||
                          '641158233158-nsg8a8tdsj3fdgb34dc9tugm8god7tho.apps.googleusercontent.com'
                        ).trim()}
                        label="Khởi tạo nhanh 1 chạm với Google"
                        disabled={googleLoading || submitting}
                        loading={googleLoading}
                        onCredential={(cred) =>
                          void executeGoogleLogin({ credential: cred, id_token: cred })
                        }
                        onFallbackClick={handleGoogleSignInClick}
                      />

                      <div className="relative flex items-center py-0.5">
                        <div className="flex-grow border-t border-slate-200" />
                        <span className="shrink-0 px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                          Hoặc điền thông tin bên dưới
                        </span>
                        <div className="flex-grow border-t border-slate-200" />
                      </div>
                    </>
                  )}

                  {accountToken && workEmail && (
                    <div className="rounded-xl bg-[#F4F8FF] border border-blue-200 px-3.5 py-2.5 text-xs text-slate-700">
                      Đang tạo Workspace mới dưới tài khoản{' '}
                      <strong className="font-semibold text-[#1E40FF]">{workEmail}</strong> — không cần nhập lại
                      mật khẩu.
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Tên Doanh Nghiệp / Team *
                      </label>
                      <input
                        type="text"
                        data-testid="dom-meta-company-input"
                        value={companyName}
                        onChange={(e) => handleCompanyNameInput(e.target.value)}
                        placeholder="VD: EcoLife Signature"
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-[#1E40FF] px-3.5 py-2.5 text-xs font-medium outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Đường dẫn Workspace (Slug) *
                      </label>
                      <input
                        type="text"
                        data-testid="dom-meta-slug-input"
                        value={tenantSlug}
                        onChange={(e) => {
                          setSlugTouched(true);
                          setTenantSlug(slugifyName(e.target.value));
                        }}
                        placeholder="ecolife-signature"
                        className="w-full rounded-xl border border-blue-200 bg-[#F4F8FF] px-3.5 py-2.5 text-xs font-mono font-semibold text-[#1E40FF] outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Họ tên người quản trị {isAuthenticatedWorkspaceCreation ? '' : '*'}
                      </label>
                      <input
                        type="text"
                        value={adminName}
                        onChange={(e) => setAdminName(e.target.value)}
                        placeholder="Nguyễn Văn A"
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-[#1E40FF] px-3.5 py-2.5 text-xs outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Số điện thoại Zalo {isAuthenticatedWorkspaceCreation ? '(Tùy chọn)' : '*'}
                      </label>
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="0909888777"
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-[#1E40FF] px-3.5 py-2.5 text-xs outline-none"
                      />
                    </div>
                  </div>

                  {!accountToken && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Email đăng nhập *
                        </label>
                        <input
                          type="email"
                          value={workEmail}
                          onChange={(e) => setWorkEmail(e.target.value)}
                          placeholder="admin@congty.vn"
                          className="w-full rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-[#1E40FF] px-3.5 py-2.5 text-xs outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Mật khẩu bảo mật (từ 8 ký tự) *
                        </label>
                        <input
                          type="password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="••••••••"
                          className="w-full rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-[#1E40FF] px-3.5 py-2.5 text-xs outline-none"
                        />
                      </div>
                    </div>
                  )}

                  <button
                    type="button"
                    data-testid="dom-meta-step1-next"
                    disabled={submitting}
                    onClick={() => void handleNextFromStep1()}
                    className="w-full py-3.5 rounded-full bg-gradient-to-r from-[#1E40FF] to-[#0284C7] text-white text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 cursor-pointer shadow-md"
                  >
                    {submitting ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <span>Tiếp tục Bước 2: Kết nối Meta Ads</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              )}

              {/* STEP 2 */}
              {step === 2 && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                      <KeyRound className="w-4 h-4 text-[#1E40FF]" />
                      <span>Kết Nối Meta Access Token</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowTokenHelp((v) => !v)}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-[#1E40FF] cursor-pointer"
                    >
                      <HelpCircle className="w-3.5 h-3.5" />
                      <span>{showTokenHelp ? 'Ẩn hướng dẫn' : 'Hướng dẫn lấy Token'}</span>
                    </button>
                  </div>

                  {showTokenHelp && (
                    <div className="rounded-2xl bg-[#F4F8FF] border border-blue-200/80 p-4 text-xs text-slate-700 space-y-1.5">
                      <div>
                        <strong>Bước 1:</strong> Truy cập{' '}
                        <a
                          href="https://developers.facebook.com/tools/explorer/"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[#1E40FF] font-semibold underline"
                        >
                          Meta Graph API Explorer
                        </a>
                        .
                      </div>
                      <div>
                        <strong>Bước 2:</strong> Cấp quyền{' '}
                        <code className="font-mono font-semibold text-[#1E40FF]">
                          ads_read, ads_management, business_management
                        </code>
                        .
                      </div>
                      <div>
                        <strong>Bước 3:</strong> Bấm Generate Access Token và dán mã{' '}
                        <code>EAA...</code> vào ô bên dưới.
                      </div>
                    </div>
                  )}

                  <textarea
                    rows={3}
                    value={metaToken}
                    onChange={(e) => setMetaToken(e.target.value)}
                    placeholder="Dán Meta Access Token (EAA...) hoặc bấm Bỏ qua để kết nối sau trong Workspace"
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-[#1E40FF] p-3.5 text-xs font-mono outline-none"
                  />

                  <button
                    type="button"
                    disabled={discovering || !metaToken.trim()}
                    onClick={() => void handleDiscoverMeta()}
                    className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {discovering ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Search className="w-4 h-4" />
                    )}
                    <span>Tải Danh Sách Ad Accounts Từ Token</span>
                  </button>

                  {discoveredAccounts.length > 0 && (
                    <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                      {discoveredAccounts.map((acc) => (
                        <label
                          key={acc.ad_account_id}
                          className="rounded-xl border border-slate-200 px-3.5 py-2.5 flex items-center justify-between gap-2 cursor-pointer hover:bg-slate-50"
                        >
                          <div>
                            <div className="text-xs font-semibold text-slate-800">{acc.name}</div>
                            <div className="text-[11px] font-mono text-slate-500">
                              ID: {acc.ad_account_id} · {acc.currency}
                            </div>
                          </div>
                          <input
                            type="checkbox"
                            checked={Boolean(selectedAccountIds[acc.ad_account_id])}
                            onChange={(e) =>
                              setSelectedAccountIds((prev) => ({
                                ...prev,
                                [acc.ad_account_id]: e.target.checked,
                              }))
                            }
                            className="w-4 h-4 accent-[#1E40FF]"
                          />
                        </label>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center justify-between gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-full border border-slate-200 text-xs font-semibold text-slate-600 cursor-pointer"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      <span>Quay lại</span>
                    </button>

                    <button
                      type="button"
                      data-testid="dom-meta-step2-next"
                      onClick={() => setStep(3)}
                      className="inline-flex items-center gap-1.5 px-6 py-2.5 rounded-full bg-gradient-to-r from-[#1E40FF] to-[#0284C7] text-white text-xs font-semibold cursor-pointer shadow-sm"
                    >
                      <span>
                        {discoveredAccounts.length > 0
                          ? 'Tiếp tục Bước 3'
                          : 'Bỏ qua, gắn Token sau →'}
                      </span>
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 3: GOOGLE ADS OPTIONAL TOGGLE (DEFAULT OFF!) */}
              {step === 3 && (
                <div className="space-y-4">
                  <GoogleAdsSetupGuide value={googleAds} onChange={setGoogleAds} compact />

                  <div className="flex items-center justify-between gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setStep(2)}
                      className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-full border border-slate-200 text-xs font-semibold text-slate-600 cursor-pointer"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      <span>Quay lại</span>
                    </button>

                    <button
                      type="button"
                      data-testid="finish-dom-meta-register"
                      disabled={submitting}
                      onClick={() => void handleFinishRegistration()}
                      className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-[#1E40FF] to-[#0284C7] text-white text-xs sm:text-sm font-semibold cursor-pointer shadow-md"
                    >
                      {submitting ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <CheckCircle2 className="w-4 h-4" />
                      )}
                      <span>Hoàn Tất &amp; Vào Workspace Free 1 Tháng</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Google Quick Account Picker Fallback Dialog */}
      {googlePromptOpen && (
        <div
          role="dialog"
          aria-modal="true"
          data-testid="dom-meta-google-fallback-modal"
          onClick={() => setGooglePromptOpen(false)}
          style={{ zIndex: 2147483642 }}
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm p-4 flex items-center justify-center"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-3xl bg-white border border-slate-200 shadow-2xl p-6 space-y-4"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <GoogleLogoMark className="w-5 h-5" />
                <h3 className="text-base font-semibold text-slate-800">Đăng nhập bằng Google</h3>
              </div>
              <button
                type="button"
                onClick={() => setGooglePromptOpen(false)}
                className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {recentGoogleAccounts.length > 0 && (
              <div className="space-y-1.5">
                <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  Tài khoản gần đây
                </div>
                {recentGoogleAccounts.map((acc) => (
                  <button
                    key={acc.email}
                    type="button"
                    disabled={googleLoading}
                    onClick={() =>
                      void executeGoogleLogin({ email: acc.email, full_name: acc.full_name })
                    }
                    className="w-full rounded-xl border border-slate-200 hover:border-[#1E40FF] px-3.5 py-2.5 text-left flex items-center justify-between cursor-pointer"
                  >
                    <div>
                      <div className="text-xs font-semibold text-slate-800">{acc.full_name}</div>
                      <div className="text-[11px] text-slate-500">{acc.email}</div>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-[#1E40FF]" />
                  </button>
                ))}
              </div>
            )}

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!googleInputEmail.trim()) return;
                void executeGoogleLogin({
                  email: googleInputEmail.trim().toLowerCase(),
                  full_name: googleInputName.trim() || googleInputEmail.split('@')[0],
                });
              }}
              className="space-y-3"
            >
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Địa chỉ Gmail *
                </label>
                <input
                  type="email"
                  required
                  data-testid="google-fallback-email"
                  value={googleInputEmail}
                  onChange={(e) => setGoogleInputEmail(e.target.value)}
                  placeholder="tenban@gmail.com"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-[#1E40FF] px-3.5 py-2.5 text-xs outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Tên hiển thị
                </label>
                <input
                  type="text"
                  data-testid="google-fallback-name"
                  value={googleInputName}
                  onChange={(e) => setGoogleInputName(e.target.value)}
                  placeholder="Họ và tên"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-[#1E40FF] px-3.5 py-2.5 text-xs outline-none"
                />
              </div>
              <button
                type="submit"
                data-testid="google-fallback-submit"
                disabled={googleLoading}
                className="w-full py-3 rounded-full bg-[#1E40FF] text-white text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer"
              >
                {googleLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                <span>Tiếp tục với tài khoản Google</span>
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export const DomMetaAuthModal: React.FC<DomMetaAuthModalProps> = ({ isOpen, ...rest }) => {
  if (!isOpen) return null;
  return (
    <DomMetaModalPortal>
      <DomMetaAuthModalBody {...rest} />
    </DomMetaModalPortal>
  );
};
