/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { apiRequest } from '../../autodataApi';
import type { SaasPackageCode, ClientSubscriptionSnapshot } from '../../autodataTypes';
import { useAuth, type EffectiveModulePermission, type ExtendedTenantSession } from './AuthContext';
import { AutoDataLoadingModal } from '../components/ui/AutoDataLoadingModal';
import {
  SAAS_PACKAGES_CATALOG,
  INDUSTRY_PRESETS,
  SCREEN_ACCESS_CATALOG,
  QUICK_ACTIONS_CATALOG,
  buildResolvedTerminology,
  expandEnabledModulesForPackage,
  getModuleKeyAliases,
  localPackageOverrideKey,
  normalizeIndustryKey,
  normalizePackageCode,
  toBackendModuleKey,
  type DataScopeKey,
  type IndustryPresetKey,
  type PackageCatalogMeta,
  type RbacActionKey,
  type TerminologyDictionary,
} from './entitlementConstants';

interface LocalEntitlementPatch {
  packageCode?: SaasPackageCode;
  enabledModules?: string[];
  educationAddon?: boolean;
  enableIdeasMascot?: boolean;
  industryKey?: IndustryPresetKey;
  terminology?: Record<string, string>;
  effectivePermissions?: Record<string, EffectiveModulePermission>;
  screenAccess?: Record<string, boolean>;
  quickActions?: Record<string, boolean>;
  defaultRoute?: string | null;
}

interface SwitchPackageResponse {
  package_code?: SaasPackageCode;
  plan_tier?: SaasPackageCode;
  enabled_modules?: string[];
  entitlements?: Record<string, unknown>;
  terminology?: Record<string, string>;
  effective_permissions?: Record<string, EffectiveModulePermission>;
  screen_access?: Record<string, boolean>;
  quick_actions?: Record<string, boolean>;
  default_route?: string | null;
  subscription?: ClientSubscriptionSnapshot;
}

export interface EntitlementContextValue {
  packageCode: SaasPackageCode;
  packageMeta: PackageCatalogMeta;
  packagesCatalog: Record<SaasPackageCode, PackageCatalogMeta>;
  enabledModules: Set<string>;
  hasModule: (moduleKey: string) => boolean;
  educationAddon: boolean;
  enableIdeasMascot: boolean;
  industryKey: IndustryPresetKey;
  terminology: TerminologyDictionary;
  term: (key: keyof TerminologyDictionary | string, fallback?: string) => string;
  isTenantOwner: boolean;
  effectivePermissions: Record<string, EffectiveModulePermission>;
  screenAccess: Record<string, boolean>;
  quickActions: Record<string, boolean>;
  defaultRoute: string;
  can: (moduleKey: string, action?: RbacActionKey) => boolean;
  canScreen: (screenKey: string) => boolean;
  canQuickAction: (actionKey: string) => boolean;
  getDefaultRoute: () => string;
  scope: (moduleKey: string) => DataScopeKey;
  switchingPackage: boolean;
  switchPackage: (
    nextPackage: SaasPackageCode,
    options?: { educationAddon?: boolean; industryKey?: IndustryPresetKey; silent?: boolean }
  ) => Promise<void>;
  applyTerminologyLocal: (patch: {
    industryKey?: IndustryPresetKey;
    terminology?: Record<string, string>;
    educationAddon?: boolean;
    enableIdeasMascot?: boolean;
  }) => void;
  setGlobalLoadingModal: (state: { open: boolean; message?: string; subMessage?: string }) => void;
  refreshEntitlements: () => Promise<void>;
}

const EntitlementContext = createContext<EntitlementContextValue | undefined>(undefined);

function loadLocalPatch(tenantSlug: string): LocalEntitlementPatch {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(localPackageOverrideKey(tenantSlug));
    if (!raw) return {};
    return JSON.parse(raw) as LocalEntitlementPatch;
  } catch {
    return {};
  }
}

function saveLocalPatch(tenantSlug: string, patch: LocalEntitlementPatch): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(localPackageOverrideKey(tenantSlug), JSON.stringify(patch));
  } catch {
    // ignore storage errors
  }
}

export const EntitlementProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const {
    user,
    token,
    tenantSlug,
    subscription,
    tenantSettings,
    bootstrapData,
    v2Session,
    updateSessionLocal,
    updateTenantSettingsLocal,
    refreshTenantSettings,
  } = useAuth();

  const [patchByTenant, setPatchByTenant] = useState<Record<string, LocalEntitlementPatch>>(() => ({
    [tenantSlug]: loadLocalPatch(tenantSlug),
  }));
  const [switchingPackage, setSwitchingPackage] = useState(false);
  const [loadingModal, setLoadingModal] = useState<{
    open: boolean;
    message?: string;
    subMessage?: string;
  }>({ open: false });

  const localPatch = useMemo<LocalEntitlementPatch>(() => {
    return patchByTenant[tenantSlug] || loadLocalPatch(tenantSlug);
  }, [patchByTenant, tenantSlug]);

  const packageCode = useMemo<SaasPackageCode>(() => {
    if (localPatch.packageCode) return localPatch.packageCode;
    return normalizePackageCode(
      bootstrapData?.tenant?.package_code || v2Session.package_code,
      bootstrapData?.tenant?.plan_tier || subscription?.plan_tier || v2Session.plan_tier,
      subscription?.plan_code
    );
  }, [
    localPatch.packageCode,
    bootstrapData?.tenant?.package_code,
    bootstrapData?.tenant?.plan_tier,
    subscription?.plan_tier,
    subscription?.plan_code,
    v2Session.package_code,
    v2Session.plan_tier,
  ]);

  const industryKey = useMemo<IndustryPresetKey>(() => {
    if (localPatch.industryKey) return localPatch.industryKey;
    const rawSettingsIndustry =
      typeof tenantSettings.industry_key === 'string' ? tenantSettings.industry_key : undefined;
    return normalizeIndustryKey(
      bootstrapData?.tenant?.industry_key ||
        v2Session.industry_key ||
        rawSettingsIndustry ||
        bootstrapData?.tenant?.industry ||
        v2Session.industry
    );
  }, [
    localPatch.industryKey,
    bootstrapData?.tenant?.industry_key,
    bootstrapData?.tenant?.industry,
    v2Session.industry_key,
    v2Session.industry,
    tenantSettings.industry_key,
  ]);

  const rawEntitlements = useMemo<Record<string, unknown>>(() => {
    return (
      bootstrapData?.tenant?.entitlements ||
      v2Session.entitlements ||
      (typeof tenantSettings.entitlements === 'object' && tenantSettings.entitlements
        ? (tenantSettings.entitlements as Record<string, unknown>)
        : {})
    );
  }, [bootstrapData?.tenant?.entitlements, v2Session.entitlements, tenantSettings.entitlements]);

  const educationAddon = useMemo<boolean>(() => {
    if (typeof localPatch.educationAddon === 'boolean') return localPatch.educationAddon;
    if (typeof rawEntitlements.education_addon === 'boolean') return rawEntitlements.education_addon;
    if (typeof tenantSettings.education_addon === 'boolean') return Boolean(tenantSettings.education_addon);
    return false;
  }, [localPatch.educationAddon, rawEntitlements.education_addon, tenantSettings.education_addon]);

  const enableIdeasMascot = useMemo<boolean>(() => {
    if (typeof localPatch.enableIdeasMascot === 'boolean') return localPatch.enableIdeasMascot;
    if (typeof rawEntitlements.enable_ideas_mascot === 'boolean') return rawEntitlements.enable_ideas_mascot;
    if (typeof tenantSettings.enable_ideas_mascot === 'boolean') return Boolean(tenantSettings.enable_ideas_mascot);
    return false;
  }, [localPatch.enableIdeasMascot, rawEntitlements.enable_ideas_mascot, tenantSettings.enable_ideas_mascot]);

  const enabledModules = useMemo<Set<string>>(() => {
    const rawServerModules =
      localPatch.enabledModules && localPatch.enabledModules.length > 0
        ? localPatch.enabledModules
        : !localPatch.packageCode
        ? bootstrapData?.tenant?.enabled_modules || v2Session.enabled_modules
        : undefined;
    return new Set(expandEnabledModulesForPackage(packageCode, educationAddon, rawServerModules));
  }, [
    packageCode,
    educationAddon,
    localPatch.enabledModules,
    localPatch.packageCode,
    bootstrapData?.tenant?.enabled_modules,
    v2Session.enabled_modules,
  ]);

  const terminology = useMemo<TerminologyDictionary>(() => {
    const settingsTerm =
      typeof tenantSettings.terminology === 'object' && tenantSettings.terminology
        ? (tenantSettings.terminology as Record<string, unknown>)
        : {};
    const bootTerm = bootstrapData?.tenant?.terminology || v2Session.terminology || {};
    return buildResolvedTerminology(industryKey, {
      ...settingsTerm,
      ...bootTerm,
      ...(localPatch.terminology || {}),
    });
  }, [
    industryKey,
    tenantSettings.terminology,
    bootstrapData?.tenant?.terminology,
    v2Session.terminology,
    localPatch.terminology,
  ]);

  const isTenantOwner: boolean =
    typeof user?.is_tenant_owner === 'boolean'
      ? user.is_tenant_owner
      : typeof (v2Session as ExtendedTenantSession).is_tenant_owner === 'boolean'
      ? Boolean((v2Session as ExtendedTenantSession).is_tenant_owner)
      : user?.role === 'superadmin';

  const effectivePermissions = useMemo<Record<string, EffectiveModulePermission>>(() => {
    return (
      localPatch.effectivePermissions ||
      bootstrapData?.effective_permissions ||
      bootstrapData?.rbac?.effective_permissions ||
      bootstrapData?.user?.effective_permissions ||
      v2Session.effective_permissions ||
      {}
    );
  }, [
    localPatch.effectivePermissions,
    bootstrapData?.effective_permissions,
    bootstrapData?.rbac?.effective_permissions,
    bootstrapData?.user?.effective_permissions,
    v2Session.effective_permissions,
  ]);

  const screenAccess = useMemo<Record<string, boolean>>(() => {
    const extSess = v2Session as ExtendedTenantSession;
    return (
      localPatch.screenAccess ||
      bootstrapData?.user?.screen_access ||
      bootstrapData?.rbac?.screen_access ||
      bootstrapData?.screen_access ||
      extSess.screen_access ||
      {}
    );
  }, [
    localPatch.screenAccess,
    bootstrapData?.user?.screen_access,
    bootstrapData?.rbac?.screen_access,
    bootstrapData?.screen_access,
    v2Session,
  ]);

  const quickActions = useMemo<Record<string, boolean>>(() => {
    const extSess = v2Session as ExtendedTenantSession;
    return (
      localPatch.quickActions ||
      bootstrapData?.user?.quick_actions ||
      bootstrapData?.rbac?.quick_actions ||
      bootstrapData?.quick_actions ||
      extSess.quick_actions ||
      {}
    );
  }, [
    localPatch.quickActions,
    bootstrapData?.user?.quick_actions,
    bootstrapData?.rbac?.quick_actions,
    bootstrapData?.quick_actions,
    v2Session,
  ]);

  const rawDefaultRoute = useMemo<string>(() => {
    const extSess = v2Session as ExtendedTenantSession;
    return String(
      localPatch.defaultRoute ??
        bootstrapData?.user?.default_route ??
        bootstrapData?.rbac?.default_route ??
        bootstrapData?.default_route ??
        extSess.default_route ??
        ''
    ).trim();
  }, [
    localPatch.defaultRoute,
    bootstrapData?.user?.default_route,
    bootstrapData?.rbac?.default_route,
    bootstrapData?.default_route,
    v2Session,
  ]);

  const hasModule = useCallback(
    (moduleKey: string): boolean => {
      if (moduleKey === 'settings' || moduleKey === 'billing' || moduleKey === 'org_rbac' || moduleKey === 'users') {
        return true;
      }
      if (moduleKey === 'audiences' && packageCode === 'autodata_crm') {
        return false;
      }
      if (moduleKey === 'education_addon' || moduleKey === 'education') {
        return packageCode === 'domation_promax' && educationAddon;
      }
      if (enabledModules.has(moduleKey) || enabledModules.has(toBackendModuleKey(moduleKey))) {
        return true;
      }
      for (const alias of getModuleKeyAliases(moduleKey)) {
        if (enabledModules.has(alias)) return true;
      }
      return false;
    },
    [enabledModules, packageCode, educationAddon]
  );

  // Zero-Short-Circuit Resolution Order:
  // 1. Entitlement Gate -> 2. is_tenant_owner -> 3. Effective Permissions (User Deny/Grant -> Role ∪ Dept)
  const resolveEffectivePermission = useCallback(
    (moduleKey: string): EffectiveModulePermission | undefined => {
      const direct =
        effectivePermissions[moduleKey] ?? effectivePermissions[toBackendModuleKey(moduleKey)];
      if (direct) return direct;
      for (const alias of getModuleKeyAliases(moduleKey)) {
        if (effectivePermissions[alias]) return effectivePermissions[alias];
      }
      return undefined;
    },
    [effectivePermissions]
  );

  const scope = useCallback(
    (moduleKey: string): DataScopeKey => {
      if (!hasModule(moduleKey)) return 'none';
      if (isTenantOwner) return 'company';
      const perm = resolveEffectivePermission(moduleKey);
      if (perm) {
        const rawScope = (perm.data_scope || perm.scope || 'none') as DataScopeKey;
        return rawScope;
      }
      // Fallback only when backend bootstrap hasn't returned custom RBAC matrix yet
      if (user?.role === 'admin') return 'branch';
      if (user?.role === 'assistant' || user?.role === 'viewer') return 'department';
      return 'own';
    },
    [hasModule, isTenantOwner, resolveEffectivePermission, user?.role]
  );

  const can = useCallback(
    (moduleKey: string, action: RbacActionKey = 'view'): boolean => {
      if (!hasModule(moduleKey)) return false;
      if (isTenantOwner) return true;
      const perm = resolveEffectivePermission(moduleKey);
      if (perm) {
        const resolvedScope = perm.data_scope || perm.scope || 'none';
        if (resolvedScope === 'none') return false;
        if (perm.actions && action in perm.actions) {
          return Boolean(perm.actions[action]);
        }
        return action === 'view';
      }
      // Safe fallback only when backend custom matrix has not loaded yet
      if (action === 'unmask_phone') {
        return tenantSettings.pii_masking_enabled === false && !tenantSettings.pii_mask_all_sales;
      }
      if (Object.keys(effectivePermissions).length === 0) {
        return action === 'view' || (user?.role === 'admin' && action !== 'delete');
      }
      return action === 'view' && Boolean(screenAccess[moduleKey]);
    },
    [hasModule, isTenantOwner, resolveEffectivePermission, effectivePermissions, screenAccess, user?.role, tenantSettings.pii_masking_enabled, tenantSettings.pii_mask_all_sales]
  );

  const canScreen = useCallback(
    (screenKey: string): boolean => {
      const normalized = String(screenKey || '').trim();
      if (!normalized) return true;
      const descriptor = SCREEN_ACCESS_CATALOG.find(
        (s) => s.screenKey === normalized || s.path === normalized
      );
      const moduleKey = descriptor?.moduleKey;
      if (moduleKey && !hasModule(moduleKey)) return false;

      // Owner recovery safeguard on core workspace + settings/accounts
      if (isTenantOwner) return true;

      // Explicit RBAC screen_access matrix check (supports screenKey, path, or moduleKey keys)
      const candidates = [normalized, descriptor?.screenKey, descriptor?.path, moduleKey].filter(
        (k): k is string => Boolean(k)
      );
      for (const candidate of candidates) {
        if (typeof screenAccess[candidate] === 'boolean') {
          return screenAccess[candidate];
        }
      }

      if (normalized === 'account' || descriptor?.screenKey === 'account') {
        return true;
      }

      if (moduleKey) {
        return can(moduleKey, 'view');
      }
      return true;
    },
    [hasModule, isTenantOwner, screenAccess, can]
  );

  const canQuickAction = useCallback(
    (actionKey: string): boolean => {
      const normalized = String(actionKey || '').trim();
      if (!normalized) return false;
      const meta = QUICK_ACTIONS_CATALOG.find((q) => q.key === normalized);
      if (meta && !hasModule(meta.moduleKey)) return false;
      if (isTenantOwner) return true;
      if (typeof quickActions[normalized] === 'boolean') {
        return quickActions[normalized];
      }
      if (meta) {
        return can(meta.moduleKey, meta.requiredAction);
      }
      return true;
    },
    [hasModule, isTenantOwner, quickActions, can]
  );

  const getDefaultRoute = useCallback((): string => {
    if (rawDefaultRoute && rawDefaultRoute.startsWith('/')) {
      const desc = SCREEN_ACCESS_CATALOG.find((s) => s.path === rawDefaultRoute);
      if (!desc || canScreen(desc.screenKey)) {
        return rawDefaultRoute;
      }
    }
    if (packageCode === 'marketing_standalone') {
      return '/';
    }
    if (canScreen('dashboard')) {
      return '/';
    }
    if (canScreen('sale_portal')) {
      return '/sale-portal';
    }
    const preferredOrder = [
      '/workspace',
      '/data',
      '/contacts',
      '/audiences',
      '/erp/attendance',
      '/erp/projects',
    ];
    for (const p of preferredOrder) {
      const desc = SCREEN_ACCESS_CATALOG.find((s) => s.path === p);
      if (desc && canScreen(desc.screenKey)) return desc.path;
    }
    const firstAllowed = SCREEN_ACCESS_CATALOG.find((s) => canScreen(s.screenKey));
    return firstAllowed?.path || '/';
  }, [rawDefaultRoute, packageCode, canScreen]);

  const defaultRoute = useMemo(() => getDefaultRoute(), [getDefaultRoute]);

  const term = useCallback(
    (key: keyof TerminologyDictionary | string, fallback?: string): string => {
      const val = terminology[key];
      if (val) return val;
      return fallback || String(key);
    },
    [terminology]
  );

  const applyTerminologyLocal = useCallback(
    (patch: {
      industryKey?: IndustryPresetKey;
      terminology?: Record<string, string>;
      educationAddon?: boolean;
      enableIdeasMascot?: boolean;
    }) => {
      setPatchByTenant((prev) => {
        const cur = prev[tenantSlug] || loadLocalPatch(tenantSlug);
        const next: LocalEntitlementPatch = {
          ...cur,
          ...(patch.industryKey ? { industryKey: patch.industryKey } : {}),
          ...(patch.terminology ? { terminology: patch.terminology } : {}),
          ...(typeof patch.educationAddon === 'boolean' ? { educationAddon: patch.educationAddon } : {}),
          ...(typeof patch.enableIdeasMascot === 'boolean' ? { enableIdeasMascot: patch.enableIdeasMascot } : {}),
        };
        saveLocalPatch(tenantSlug, next);
        return { ...prev, [tenantSlug]: next };
      });
      updateTenantSettingsLocal({
        ...(patch.industryKey ? { industry_key: patch.industryKey } : {}),
        ...(patch.terminology ? { terminology: patch.terminology } : {}),
        ...(typeof patch.educationAddon === 'boolean' ? { education_addon: patch.educationAddon } : {}),
        ...(typeof patch.enableIdeasMascot === 'boolean' ? { enable_ideas_mascot: patch.enableIdeasMascot } : {}),
      });
    },
    [tenantSlug, updateTenantSettingsLocal]
  );

  const switchPackage = useCallback(
    async (
      nextPackage: SaasPackageCode,
      options?: { educationAddon?: boolean; industryKey?: IndustryPresetKey; silent?: boolean }
    ) => {
      const nextEdu =
        typeof options?.educationAddon === 'boolean' ? options.educationAddon : educationAddon;
      const nextInd = options?.industryKey || industryKey;
      const pkgMeta = SAAS_PACKAGES_CATALOG[nextPackage];

      setSwitchingPackage(true);
      if (!options?.silent) {
        setLoadingModal({
          open: true,
          message: `Đang mở khóa ${pkgMeta.name}...`,
          subMessage: 'Giữ nguyên 100% dữ liệu Master Contact • 0 giây Migrate',
        });
      }

      try {
        let res: SwitchPackageResponse | null = null;
        try {
          res = await apiRequest<SwitchPackageResponse>('/billing/switch-package', {
            method: 'POST',
            token,
            tenantSlug,
            body: {
              package_code: nextPackage,
              education_addon: nextEdu,
              industry_key: nextInd,
            },
          });
        } catch {
          res = await apiRequest<SwitchPackageResponse>('/workspace/switch-package', {
            method: 'POST',
            token,
            tenantSlug,
            body: {
              package_code: nextPackage,
              education_addon: nextEdu,
              industry_key: nextInd,
            },
          }).catch(() => null);
        }

        const effectivePkg = res?.package_code || nextPackage;
        const effectiveEdu =
          typeof res?.entitlements?.education_addon === 'boolean'
            ? Boolean(res.entitlements.education_addon)
            : nextEdu;
        const resolvedModules = expandEnabledModulesForPackage(
          effectivePkg,
          effectiveEdu,
          res?.enabled_modules
        );

        const nextPatch: LocalEntitlementPatch = {
          packageCode: effectivePkg,
          enabledModules: resolvedModules,
          educationAddon: effectiveEdu,
          industryKey: nextInd,
          ...(res?.terminology ? { terminology: res.terminology } : {}),
          ...(res?.effective_permissions ? { effectivePermissions: res.effective_permissions } : {}),
          ...(res?.screen_access ? { screenAccess: res.screen_access } : {}),
          ...(res?.quick_actions ? { quickActions: res.quick_actions } : {}),
          ...(res?.default_route !== undefined ? { defaultRoute: res.default_route } : {}),
        };

        setPatchByTenant((prev) => {
          saveLocalPatch(tenantSlug, nextPatch);
          return { ...prev, [tenantSlug]: nextPatch };
        });

        updateSessionLocal({
          package_code: nextPatch.packageCode,
          plan_tier: res?.plan_tier || nextPackage,
          enabled_modules: resolvedModules,
          entitlements: res?.entitlements || {
            education_addon: nextPatch.educationAddon,
            enable_ideas_mascot: enableIdeasMascot,
          },
          ...(res?.screen_access ? { screen_access: res.screen_access } : {}),
          ...(res?.quick_actions ? { quick_actions: res.quick_actions } : {}),
          ...(res?.default_route !== undefined ? { default_route: res.default_route } : {}),
          ...(res?.subscription ? { subscription: res.subscription } : {}),
        });

        void refreshTenantSettings();

        if (!options?.silent) {
          toast.success(`Đã chuyển sang ${pkgMeta.shortName} thành công!`);
        }
      } finally {
        setTimeout(() => {
          setSwitchingPackage(false);
          setLoadingModal({ open: false });
        }, 280);
      }
    },
    [
      educationAddon,
      industryKey,
      token,
      tenantSlug,
      enableIdeasMascot,
      updateSessionLocal,
      refreshTenantSettings,
    ]
  );

  const setGlobalLoadingModal = useCallback(
    (state: { open: boolean; message?: string; subMessage?: string }) => {
      setLoadingModal(state);
    },
    []
  );

  const refreshEntitlements = useCallback(async () => {
    await refreshTenantSettings();
  }, [refreshTenantSettings]);

  const value = useMemo<EntitlementContextValue>(
    () => ({
      packageCode,
      packageMeta: SAAS_PACKAGES_CATALOG[packageCode],
      packagesCatalog: SAAS_PACKAGES_CATALOG,
      enabledModules,
      hasModule,
      educationAddon,
      enableIdeasMascot,
      industryKey,
      terminology,
      term,
      isTenantOwner,
      effectivePermissions,
      screenAccess,
      quickActions,
      defaultRoute,
      can,
      canScreen,
      canQuickAction,
      getDefaultRoute,
      scope,
      switchingPackage,
      switchPackage,
      applyTerminologyLocal,
      setGlobalLoadingModal,
      refreshEntitlements,
    }),
    [
      packageCode,
      enabledModules,
      hasModule,
      educationAddon,
      enableIdeasMascot,
      industryKey,
      terminology,
      term,
      isTenantOwner,
      effectivePermissions,
      screenAccess,
      quickActions,
      defaultRoute,
      can,
      canScreen,
      canQuickAction,
      getDefaultRoute,
      scope,
      switchingPackage,
      switchPackage,
      applyTerminologyLocal,
      setGlobalLoadingModal,
      refreshEntitlements,
    ]
  );

  return (
    <EntitlementContext.Provider value={value}>
      {children}
      <AutoDataLoadingModal
        isOpen={loadingModal.open}
        message={loadingModal.message}
        subMessage={loadingModal.subMessage}
      />
    </EntitlementContext.Provider>
  );
};

export const useEntitlement = (): EntitlementContextValue => {
  const ctx = useContext(EntitlementContext);
  if (!ctx) {
    // Graceful fallback when rendered standalone outside AutodataClonedRoot
    const defaultPkg = SAAS_PACKAGES_CATALOG.autodata_crm;
    const defaultDict = INDUSTRY_PRESETS.general.dictionary;
    return {
      packageCode: 'autodata_crm',
      packageMeta: defaultPkg,
      packagesCatalog: SAAS_PACKAGES_CATALOG,
      enabledModules: new Set(defaultPkg.defaultModules),
      hasModule: (m) => defaultPkg.defaultModules.includes(m),
      educationAddon: false,
      enableIdeasMascot: false,
      industryKey: 'general',
      terminology: defaultDict,
      term: (k, fb) => defaultDict[k] || fb || String(k),
      isTenantOwner: false,
      effectivePermissions: {},
      screenAccess: {},
      quickActions: {},
      defaultRoute: '/',
      can: () => true,
      canScreen: () => true,
      canQuickAction: () => true,
      getDefaultRoute: () => '/',
      scope: () => 'company',
      switchingPackage: false,
      switchPackage: async () => {},
      applyTerminologyLocal: () => {},
      setGlobalLoadingModal: () => {},
      refreshEntitlements: async () => {},
    };
  }
  return ctx;
};
