import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { clearApiCache } from '../api/axios';

export interface AuthUser {
  id: number | string;
  email: string;
  full_name: string;
  name?: string;
  role: string;
  role_id?: string | null;
  role_name?: string | null;
  avatar_url: string | null;
  signature_url?: string | null;
  bio?: string | null;
  tenant_id: number | string;
  tenant_name: string;
  tenant_slug: string;
  manager_behavior_mode?: string | null;
  two_factor_enabled?: number;
  two_factor_type?: string;
  team_id?: number | string | null;
  is_tenant_owner?: boolean;
  screen_access?: Record<string, boolean>;
  quick_actions?: Record<string, boolean>;
  effective_permissions?: Record<string, { data_scope?: string; scope?: string; actions?: Record<string, boolean> }>;
  default_route?: string | null;
  permissions?: any;
  permissions_json?: any;
  job_title?: string;
  team_name?: string;
}

interface AuthStore {
  user: AuthUser | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  setAuth: (user: AuthUser, access: string, refresh: string) => void;
  setUser: (user: AuthUser) => void;
  clearAuth: () => void;
}

const normalizeUser = (u: AuthUser | null): AuthUser | null => {
  if (!u) return null;
  let role = u.role || 'sale';
  if (role === 'sales') role = 'sale';
  if (role === 'super_admin' || role === 'tenant_admin') role = 'superadmin';
  return {
    ...u,
    full_name: u.full_name || u.name || u.email || 'Người dùng',
    role,
  };
};

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      setAuth: (user, accessToken, refreshToken) => {
        if (typeof window !== 'undefined') {
          if (accessToken) {
            localStorage.setItem('access_token', accessToken);
            localStorage.setItem('Ideas_token', accessToken);
          }
          if (refreshToken) {
            localStorage.setItem('refresh_token', refreshToken);
          }
        }
        const normalized = normalizeUser(user);
        set({ user: normalized, accessToken, refreshToken, isAuthenticated: true });
      },
      setUser: (user) => {
        const normalized = normalizeUser(user);
        set({ user: normalized });
      },
      clearAuth: () => {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          localStorage.removeItem('Ideas_token');
          localStorage.removeItem('Ideas_user');
        }
        clearApiCache();
        try {
          import('./chatStore').then((m) => m.useChatStore.getState().resetChatState()).catch(() => {});
        } catch {}
        set({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false });
      },
    }),
    {
      name: 'minth-auth',
      partialize: (s) => ({
        user: s.user,
        accessToken: s.accessToken,
        refreshToken: s.refreshToken,
        isAuthenticated: s.isAuthenticated,
      }),
    }
  )
);

export const getModulePermissionScope = (
  user: any,
  module: string,
  action: 'read' | 'write' | 'delete'
): 'none' | 'own' | 'team' | 'all' => {
  if (!user) return 'none';

  // Priority 1: Zero-hardcode dynamic SaaS RBAC effective_permissions hydrated from DB
  const effPerm = user.effective_permissions?.[module];
  if (effPerm) {
    const acts = effPerm.actions || {};
    if (action === 'read' && acts.read === false) return 'none';
    if (action === 'write' && acts.write === false && acts.edit === false && acts.create === false) return 'none';
    if (action === 'delete' && acts.delete === false) return 'none';
    const ds = effPerm.data_scope || effPerm.scope;
    if (ds === 'all' || ds === 'team' || ds === 'own' || ds === 'none') {
      return ds;
    }
  }

  if (user.is_tenant_owner || user.role === 'superadmin') return 'all';

  let permissions: any = {};
  if (user.permissions_json) {
    try {
      permissions =
        typeof user.permissions_json === 'string'
          ? JSON.parse(user.permissions_json)
          : user.permissions_json;
    } catch {
      permissions = {};
    }
  } else if (user.permissions) {
    permissions = user.permissions;
  }

  const val = permissions[module]?.[action];
  if (val === 'all' || val === 'team' || val === 'own' || val === 'none') {
    return val;
  }

  const role = user.role;
  if (role === 'admin' || role === 'director') return module === 'settings' && role === 'director' ? 'none' : 'all';
  if (role === 'manager') return action === 'delete' ? 'none' : 'team';
  if (role === 'assistant') return action === 'delete' ? 'none' : 'all';
  if (role === 'sale' || role === 'sales') {
    if (module === 'projects') return action === 'read' ? 'all' : 'none';
    return action === 'delete' ? 'none' : 'own';
  }
  if (role === 'viewer') return action === 'read' ? 'all' : 'none';

  return 'own';
};

export const hasPermission = (
  user: any,
  module: string,
  action: 'read' | 'write' | 'delete'
): boolean => {
  const scope = getModulePermissionScope(user, module, action);
  return scope !== 'none';
};
