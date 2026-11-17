import React, { createContext, useContext, useState, useCallback, useMemo, useEffect } from 'react';
import {
  clearAutodataSessionV2,
  loadAutodataSessionV2,
  saveAutodataSessionV2,
  apiRequest,
} from '../../autodataApi';
import type { TenantSessionV2, WorkspaceSummaryItem, ClientSubscriptionSnapshot } from '../../autodataTypes';

export type ClonedUserRole = 'superadmin' | 'admin' | 'assistant' | 'viewer' | 'sale';

export interface ClonedUser {
  id?: string;
  username: string;
  name: string;
  role: ClonedUserRole;
  email?: string;
  consultant_id?: string | number;
  avatar?: string;
}

function mapRole(role?: string | null): ClonedUserRole {
  if (role === 'tenant_admin' || role === 'superadmin') return 'superadmin';
  if (role === 'manager' || role === 'admin') return 'admin';
  if (role === 'assistant' || role === 'viewer') return role;
  return 'sale';
}

function sessionToUser(sess: TenantSessionV2 | null): ClonedUser | null {
  if (!sess || !sess.access_token) return null;
  const role = mapRole(sess.role);
  return {
    id: sess.user_id,
    username: sess.admin_email,
    name: sess.user_name || sess.company_name || sess.admin_email,
    role,
    email: sess.admin_email,
    consultant_id: role === 'sale' ? sess.user_id : undefined,
  };
}

interface AuthContextType {
  user: ClonedUser | null;
  token: string | null;
  tenantSlug: string;
  companyName: string;
  subscription?: ClientSubscriptionSnapshot;
  workspaces: WorkspaceSummaryItem[];
  v2Session: TenantSessionV2;
  login: (newToken: string, newUser: ClonedUser) => void;
  logout: () => void;
  switchWorkspace: (slug: string) => Promise<void>;
  openBilling: () => void;
  openTour: () => void;
  openSwitchWorkspaceModal: () => void;
}

const GLOBAL_AUTH_CTX_KEY = '__DOMATION_AUTODATA_AUTH_CONTEXT__';
const AuthContext: React.Context<AuthContextType | undefined> =
  ((globalThis as any)[GLOBAL_AUTH_CTX_KEY] as React.Context<AuthContextType | undefined>) ||
  ((globalThis as any)[GLOBAL_AUTH_CTX_KEY] = createContext<AuthContextType | undefined>(undefined));

export const AuthProvider: React.FC<{
  session: TenantSessionV2;
  onSessionUpdated: (next: TenantSessionV2) => void;
  onLoggedOut: () => void;
  onNavigateSlug: (slug: string) => void;
  onSwitchWorkspaceRequested: () => void;
  onOpenBilling: () => void;
  onOpenTour: () => void;
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
  const [user, setUser] = useState<ClonedUser | null>(() => sessionToUser(session));
  const [token, setToken] = useState<string | null>(() => session.access_token || null);
  const [workspaces, setWorkspaces] = useState<WorkspaceSummaryItem[]>(session.workspaces || []);
  const [companyName, setCompanyName] = useState<string>(session.company_name || session.tenant_slug);
  const [subscription, setSubscription] = useState<ClientSubscriptionSnapshot | undefined>(session.subscription);

  useEffect(() => {
    setUser(sessionToUser(session));
    setToken(session.access_token || null);
    setWorkspaces(session.workspaces || []);
    setCompanyName(session.company_name || session.tenant_slug);
    setSubscription(session.subscription);
  }, [session]);

  useEffect(() => {
    let cancelled = false;
    apiRequest<any>('/workspace/bootstrap', {
      token: session.access_token,
      tenantSlug: session.tenant_slug,
    })
      .then((boot) => {
        if (cancelled || !boot) return;
        const updated: TenantSessionV2 = {
          ...session,
          company_name: boot.tenant?.name || session.company_name,
          role: boot.user?.role || session.role,
          user_id: boot.user?.id || session.user_id,
          user_name: boot.user?.full_name || session.user_name,
          subscription: boot.tenant?.subscription || session.subscription,
          workspaces: boot.workspaces || session.workspaces || [],
          screen_tours: boot.onboarding?.screen_tours || session.screen_tours || {},
        };
        saveAutodataSessionV2(updated);
        onSessionUpdated(updated);
      })
      .catch(() => {
        // ignore silent bootstrap refresh fail
      });
    return () => {
      cancelled = true;
    };
  }, [session.access_token, session.tenant_slug]); // eslint-disable-line react-hooks/exhaustive-deps

  const login = useCallback(
    (newToken: string, newUser: ClonedUser) => {
      setToken(newToken);
      setUser(newUser);
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
    setToken(null);
    setUser(null);
    clearAutodataSessionV2();
    localStorage.removeItem('domation_token');
    localStorage.removeItem('domation_user');
    onLoggedOut();
  }, [onLoggedOut]);

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

  const value = useMemo(
    () => ({
      user,
      token,
      tenantSlug: session.tenant_slug,
      companyName,
      subscription,
      workspaces,
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

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
