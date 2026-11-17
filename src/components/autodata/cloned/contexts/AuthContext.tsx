/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, useCallback, useMemo, useEffect } from 'react';
import {
  clearAutodataSessionV2,
  loadAutodataSessionV2,
  saveAutodataSessionV2,
  apiRequest,
} from '../../autodataApi';
import type {
  TenantSessionV2,
  WorkspaceSummaryItem,
  ClientSubscriptionSnapshot,
  SaasPackageCode,
} from '../../autodataTypes';
import type { TenantSettingsDto } from '../utils/pipelineConfig';

export type ClonedUserRole = 'superadmin' | 'admin' | 'assistant' | 'viewer' | 'sale';

export interface ClonedUser {
  id?: string;
  username: string;
  name: string;
  role: ClonedUserRole;
  role_id?: string | null;
  role_name?: string | null;
  email?: string;
  consultant_id?: string | number;
  avatar?: string;
  is_tenant_owner?: boolean;
  screen_access?: Record<string, boolean>;
  quick_actions?: Record<string, boolean>;
  default_route?: string | null;
  tenant?: {
    slug?: string;
    name?: string;
    [key: string]: unknown;
  };
}

export interface ExtendedTenantSession extends TenantSessionV2 {
  role_id?: string | null;
  role_name?: string | null;
  screen_access?: Record<string, boolean>;
  quick_actions?: Record<string, boolean>;
  default_route?: string | null;
}

export interface BootstrapPipelineStage {
  id: string;
  pipeline_id: string;
  stage_key: string;
  stage_name: string;
  stage_order: number;
  color_hex: string;
  badge_style?: string;
  is_won_stage?: boolean;
  is_lost_stage?: boolean;
  sla_timeout_minutes?: number;
  capi_event_mapping?: string;
  funnel_category?: string;
  score_delta?: number;
  required_fields?: string[];
}

export interface BootstrapCustomField {
  id: string;
  pipeline_id: string;
  field_key: string;
  field_label: string;
  field_type: string;
  is_required?: boolean;
  options_json?: unknown;
}

export interface BootstrapPipelineItem {
  id: string;
  name: string;
  description?: string;
  is_default?: boolean;
  stages: BootstrapPipelineStage[];
  custom_fields: BootstrapCustomField[];
}

export interface BootstrapRoundItem {
  id: string;
  pipeline_id?: string;
  name: string;
  description?: string;
  priority?: number;
  is_active?: boolean;
}

export interface EffectiveModulePermission {
  data_scope?: string;
  scope?: string;
  actions?: Record<string, boolean>;
}

export interface WorkspaceBootstrapPayload {
  tenant?: {
    id?: string;
    slug?: string;
    name?: string;
    industry?: string;
    industry_key?: string;
    package_code?: SaasPackageCode;
    plan_tier?: TenantSessionV2['plan_tier'];
    enabled_modules?: string[];
    entitlements?: Record<string, unknown>;
    terminology?: Record<string, string>;
    subscription?: ClientSubscriptionSnapshot;
    settings?: TenantSettingsDto;
  };
  user?: {
    id?: string;
    email?: string;
    full_name?: string;
    role?: string;
    role_id?: string | null;
    role_name?: string | null;
    is_tenant_owner?: boolean;
    avatar_url?: string;
    effective_permissions?: Record<string, EffectiveModulePermission>;
    screen_access?: Record<string, boolean>;
    quick_actions?: Record<string, boolean>;
    default_route?: string | null;
  } | null;
  rbac?: {
    is_tenant_owner?: boolean;
    effective_permissions?: Record<string, EffectiveModulePermission>;
    screen_access?: Record<string, boolean>;
    quick_actions?: Record<string, boolean>;
    default_route?: string | null;
  };
  effective_permissions?: Record<string, EffectiveModulePermission>;
  screen_access?: Record<string, boolean>;
  quick_actions?: Record<string, boolean>;
  default_route?: string | null;
  packages_catalog?: Array<Record<string, unknown>>;
  industry_presets?: Record<string, Record<string, string>>;
  onboarding?: {
    current_step?: number;
    completed_steps?: string[];
    screen_tours?: Record<string, boolean>;
    is_completed?: boolean;
  };
  badges?: {
    pending_tickets?: number;
    held_leads?: number;
    unassigned_leads?: number;
  };
  pipelines?: BootstrapPipelineItem[];
  rounds?: BootstrapRoundItem[];
  workspaces?: WorkspaceSummaryItem[];
}

function mapRole(role?: string | null): ClonedUserRole {
  if (role === 'tenant_admin' || role === 'superadmin') return 'superadmin';
  if (role === 'manager' || role === 'admin') return 'admin';
  if (role === 'assistant' || role === 'viewer') return role;
  return 'sale';
}

function sessionToUser(sess: ExtendedTenantSession | null): ClonedUser | null {
  if (!sess || !sess.access_token) return null;
  const role = mapRole(sess.role);
  return {
    id: sess.user_id,
    username: sess.admin_email,
    name: sess.user_name || sess.company_name || sess.admin_email,
    role,
    role_id: sess.role_id ?? null,
    role_name: sess.role_name ?? null,
    email: sess.admin_email,
    consultant_id: role === 'sale' ? sess.user_id : undefined,
    is_tenant_owner: sess.is_tenant_owner ?? role === 'superadmin',
    screen_access: sess.screen_access,
    quick_actions: sess.quick_actions,
    default_route: sess.default_route ?? null,
    tenant: {
      slug: sess.tenant_slug,
      name: sess.company_name || sess.tenant_slug,
    },
  };
}

export interface AuthContextType {
  user: ClonedUser | null;
  token: string | null;
  tenantSlug: string;
  companyName: string;
  subscription?: ClientSubscriptionSnapshot;
  workspaces: WorkspaceSummaryItem[];
  tenantSettings: TenantSettingsDto;
  bootstrapData: WorkspaceBootstrapPayload | null;
  refreshTenantSettings: () => Promise<TenantSettingsDto | null>;
  updateTenantSettingsLocal: (patch: Partial<TenantSettingsDto>) => void;
  updateSessionLocal: (patch: Partial<ExtendedTenantSession>) => void;
  v2Session: ExtendedTenantSession;
  login: (newToken: string, newUser: ClonedUser) => void;
  logout: () => void;
  switchWorkspace: (slug: string) => Promise<void>;
  openBilling: () => void;
  openTour: (deckKey?: string) => void;
  openSwitchWorkspaceModal: () => void;
}

const GLOBAL_AUTH_CTX_KEY = '__DOMATION_AUTODATA_AUTH_CONTEXT__';
const globalStore = globalThis as unknown as Record<string, React.Context<AuthContextType | undefined> | undefined>;
const AuthContext: React.Context<AuthContextType | undefined> =
  globalStore[GLOBAL_AUTH_CTX_KEY] ||
  (globalStore[GLOBAL_AUTH_CTX_KEY] = createContext<AuthContextType | undefined>(undefined));

export const AuthProvider: React.FC<{
  session: TenantSessionV2;
  onSessionUpdated: (next: TenantSessionV2) => void;
  onLoggedOut: () => void;
  onNavigateSlug: (slug: string) => void;
  onSwitchWorkspaceRequested: () => void;
  onOpenBilling: () => void;
  onOpenTour: (deckKey?: string) => void;
  children: React.ReactNode;
}> = ({
  session,
  onSessionUpdated,
  onLoggedOut,
  onNavigateSlug,
  onSwitchWorkspaceRequested,
  onOpenBilling,
  onOpenTour,
  children,
}) => {
  const [authOverride, setAuthOverride] = useState<{
    forSlug: string;
    user: ClonedUser | null;
    token: string | null;
  } | null>(null);
  const [bootstrapData, setBootstrapData] = useState<WorkspaceBootstrapPayload | null>(null);
  const [settingsPatch, setSettingsPatch] = useState<Partial<TenantSettingsDto>>({});

  const user = useMemo(() => {
    if (authOverride && authOverride.forSlug === session.tenant_slug) {
      return authOverride.user;
    }
    return sessionToUser(session);
  }, [authOverride, session]);

  const token = useMemo(() => {
    if (authOverride && authOverride.forSlug === session.tenant_slug) {
      return authOverride.token;
    }
    return session.access_token || null;
  }, [authOverride, session.access_token, session.tenant_slug]);

  const workspaces = useMemo(
    () => bootstrapData?.workspaces || session.workspaces || [],
    [bootstrapData?.workspaces, session.workspaces]
  );

  const companyName = useMemo(
    () => bootstrapData?.tenant?.name || session.company_name || session.tenant_slug,
    [bootstrapData?.tenant?.name, session.company_name, session.tenant_slug]
  );

  const subscription = useMemo(
    () => bootstrapData?.tenant?.subscription || session.subscription,
    [bootstrapData?.tenant?.subscription, session.subscription]
  );

  const tenantSettings = useMemo<TenantSettingsDto>(() => {
    const baseSessionSettings = (session.settings || {}) as TenantSettingsDto;
    const bootSettings = bootstrapData?.tenant?.settings || {};
    return {
      ...baseSessionSettings,
      ...bootSettings,
      ...settingsPatch,
    };
  }, [bootstrapData?.tenant?.settings, session.settings, settingsPatch]);

  const updateTenantSettingsLocal = useCallback((patch: Partial<TenantSettingsDto>) => {
    setSettingsPatch((prev) => ({ ...prev, ...patch }));
  }, []);

  const updateSessionLocal = useCallback(
    (patch: Partial<ExtendedTenantSession>) => {
      const next: ExtendedTenantSession = {
        ...(session as ExtendedTenantSession),
        ...patch,
      };
      saveAutodataSessionV2(next);
      onSessionUpdated(next);
    },
    [session, onSessionUpdated]
  );

  const hydrateBootstrapState = useCallback(
    async (boot: WorkspaceBootstrapPayload): Promise<WorkspaceBootstrapPayload> => {
      let mergedBoot = boot;
      const hasScreenAccess =
        boot.screen_access || boot.rbac?.screen_access || boot.user?.screen_access;
      if (!hasScreenAccess) {
        try {
          const meRes = await apiRequest<{
            user?: WorkspaceBootstrapPayload['user'];
            rbac?: WorkspaceBootstrapPayload['rbac'];
            screen_access?: Record<string, boolean>;
            quick_actions?: Record<string, boolean>;
            default_route?: string | null;
          }>('/auth/me', {
            token: session.access_token,
            tenantSlug: session.tenant_slug,
          });
          if (meRes) {
            mergedBoot = {
              ...boot,
              screen_access: meRes.screen_access ?? meRes.rbac?.screen_access ?? meRes.user?.screen_access,
              quick_actions: meRes.quick_actions ?? meRes.rbac?.quick_actions ?? meRes.user?.quick_actions,
              default_route: meRes.default_route ?? meRes.rbac?.default_route ?? meRes.user?.default_route,
              user: boot.user
                ? {
                    ...boot.user,
                    role_id: boot.user.role_id ?? meRes.user?.role_id,
                    role_name: boot.user.role_name ?? meRes.user?.role_name,
                    screen_access:
                      boot.user.screen_access ?? meRes.user?.screen_access ?? meRes.screen_access,
                    quick_actions:
                      boot.user.quick_actions ?? meRes.user?.quick_actions ?? meRes.quick_actions,
                    default_route:
                      boot.user.default_route ?? meRes.user?.default_route ?? meRes.default_route,
                  }
                : meRes.user ?? boot.user,
            };
          }
        } catch {
          // /auth/me fallback is optional
        }
      }
      return mergedBoot;
    },
    [session.access_token, session.tenant_slug]
  );

  const refreshTenantSettings = useCallback(async (): Promise<TenantSettingsDto | null> => {
    try {
      const rawBoot = await apiRequest<WorkspaceBootstrapPayload>('/workspace/bootstrap', {
        token: session.access_token,
        tenantSlug: session.tenant_slug,
      });
      if (rawBoot) {
        const boot = await hydrateBootstrapState(rawBoot);
        setBootstrapData(boot);
        if (boot?.tenant?.settings) {
          setSettingsPatch({});
          return boot.tenant.settings;
        }
      }
      return null;
    } catch {
      return null;
    }
  }, [session.access_token, session.tenant_slug, hydrateBootstrapState]);

  useEffect(() => {
    let cancelled = false;
    apiRequest<WorkspaceBootstrapPayload>('/workspace/bootstrap', {
      token: session.access_token,
      tenantSlug: session.tenant_slug,
    })
      .then(async (rawBoot) => {
        if (cancelled || !rawBoot) return;
        const boot = await hydrateBootstrapState(rawBoot);
        if (cancelled) return;
        setBootstrapData(boot);
        const curSession = session as ExtendedTenantSession;
        const effPerms =
          boot.effective_permissions ||
          boot.rbac?.effective_permissions ||
          boot.user?.effective_permissions ||
          curSession.effective_permissions;
        const screenAccess =
          boot.user?.screen_access ||
          boot.rbac?.screen_access ||
          boot.screen_access ||
          curSession.screen_access;
        const quickActions =
          boot.user?.quick_actions ||
          boot.rbac?.quick_actions ||
          boot.quick_actions ||
          curSession.quick_actions;
        const defaultRoute =
          boot.user?.default_route ??
          boot.rbac?.default_route ??
          boot.default_route ??
          curSession.default_route;
        const updated: ExtendedTenantSession = {
          ...curSession,
          company_name: boot.tenant?.name || curSession.company_name,
          industry: boot.tenant?.industry || curSession.industry,
          industry_key: boot.tenant?.industry_key || curSession.industry_key,
          package_code: boot.tenant?.package_code || curSession.package_code,
          plan_tier: boot.tenant?.plan_tier || curSession.plan_tier,
          enabled_modules: boot.tenant?.enabled_modules || curSession.enabled_modules,
          entitlements: boot.tenant?.entitlements || curSession.entitlements,
          terminology: boot.tenant?.terminology || curSession.terminology,
          effective_permissions: effPerms,
          is_tenant_owner:
            boot.user?.is_tenant_owner ??
            boot.rbac?.is_tenant_owner ??
            curSession.is_tenant_owner,
          settings:
            (boot.tenant?.settings as Record<string, unknown> | undefined) || curSession.settings,
          role: boot.user?.role || curSession.role,
          role_id: boot.user?.role_id ?? curSession.role_id,
          role_name: boot.user?.role_name ?? curSession.role_name,
          screen_access: screenAccess,
          quick_actions: quickActions,
          default_route: defaultRoute,
          user_id: boot.user?.id || curSession.user_id,
          user_name: boot.user?.full_name || curSession.user_name,
          subscription: boot.tenant?.subscription || curSession.subscription,
          workspaces: boot.workspaces || curSession.workspaces || [],
          screen_tours: boot.onboarding?.screen_tours || curSession.screen_tours || {},
        };
        saveAutodataSessionV2(updated);
        onSessionUpdated(updated);
      })
      .catch(() => {
        // ignore silent bootstrap refresh fail so offline/demo mode never crashes
      });
    return () => {
      cancelled = true;
    };
  }, [session.access_token, session.tenant_slug]); // eslint-disable-line react-hooks/exhaustive-deps

  const login = useCallback(
    (newToken: string, newUser: ClonedUser) => {
      setAuthOverride({
        forSlug: session.tenant_slug,
        token: newToken,
        user: newUser,
      });
      const cur = loadAutodataSessionV2() || session;
      const next: TenantSessionV2 = {
        ...cur,
        access_token: newToken,
        user_name: newUser.name || cur.user_name,
        admin_email: newUser.email || cur.admin_email,
      };
      saveAutodataSessionV2(next);
      onSessionUpdated(next);
    },
    [session, onSessionUpdated]
  );

  const logout = useCallback(() => {
    setAuthOverride({
      forSlug: session.tenant_slug,
      token: null,
      user: null,
    });
    clearAutodataSessionV2();
    localStorage.removeItem('domation_token');
    localStorage.removeItem('domation_user');
    onLoggedOut();
  }, [onLoggedOut, session.tenant_slug]);

  const switchWorkspace = useCallback(
    async (slug: string) => {
      if (slug === session.tenant_slug) return;
      if (!session.account_token) {
        onSwitchWorkspaceRequested();
        return;
      }
      try {
        const res = await apiRequest<{
          access_token: string;
          refresh_token?: string;
          tenant: { slug: string; name: string };
          user?: { id?: string; full_name?: string; role?: string };
        }>('/auth/switch-workspace', {
          method: 'POST',
          token: session.account_token,
          body: { tenant_slug: slug },
        });
        const next: TenantSessionV2 = {
          ...session,
          access_token: res.access_token,
          refresh_token: res.refresh_token,
          tenant_slug: res.tenant.slug,
          company_name: res.tenant.name,
          role: res.user?.role || session.role,
          user_id: res.user?.id,
          user_name: res.user?.full_name,
        };
        saveAutodataSessionV2(next);
        onSessionUpdated(next);
        onNavigateSlug(res.tenant.slug);
      } catch {
        onSwitchWorkspaceRequested();
      }
    },
    [session, onSessionUpdated, onNavigateSlug, onSwitchWorkspaceRequested]
  );

  const value = useMemo<AuthContextType>(
    () => ({
      user,
      token,
      tenantSlug: session.tenant_slug,
      companyName,
      subscription,
      workspaces,
      tenantSettings,
      bootstrapData,
      refreshTenantSettings,
      updateTenantSettingsLocal,
      updateSessionLocal,
      v2Session: session,
      login,
      logout,
      switchWorkspace,
      openBilling: onOpenBilling,
      openTour: onOpenTour,
      openSwitchWorkspaceModal: onSwitchWorkspaceRequested,
    }),
    [
      user,
      token,
      session,
      companyName,
      subscription,
      workspaces,
      tenantSettings,
      bootstrapData,
      refreshTenantSettings,
      updateTenantSettingsLocal,
      updateSessionLocal,
      login,
      logout,
      switchWorkspace,
      onOpenBilling,
      onOpenTour,
      onSwitchWorkspaceRequested,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useOptionalAuth = (): AuthContextType | undefined => {
  return useContext(AuthContext);
};

export const useAuth = (): AuthContextType => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
