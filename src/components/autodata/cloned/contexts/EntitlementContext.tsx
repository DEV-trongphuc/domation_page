/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { apiRequest } from '../../autodataApi';
import type { SaasPackageCode, ClientSubscriptionSnapshot } from '../../autodataTypes';
import { useAuth, type EffectiveModulePermission } from './AuthContext';
import { AutoDataLoadingModal } from '../components/ui/AutoDataLoadingModal';
import {
  SAAS_PACKAGES_CATALOG,
  INDUSTRY_PRESETS,
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
}

interface SwitchPackageResponse {
  package_code?: SaasPackageCode;
  plan_tier?: SaasPackageCode;
  enabled_modules?: string[];
  entitlements?: Record<string, unknown>;
  terminology?: Record<string, string>;
  effective_permissions?: Record<string, EffectiveModulePermission>;
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
  can: (moduleKey: string, action?: RbacActionKey) => boolean;
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
      : typeof v2Session.is_tenant_owner === 'boolean'
      ? v2Session.is_tenant_owner
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

  const hasModule = useCallback(
    (moduleKey: string): boolean => {
      if (moduleKey === 'settings' || moduleKey === 'billing' || moduleKey === 'org_rbac') {
        return true;
      }
      if (moduleKey === 'audiences' && packageCode === 'autodata_crm') {
        return false;
      }
      if (moduleKey === 'education_addon' || moduleKey === 'education') {
        return packageCode === 'domation_promax' && educationAddon;
      }
      return enabledModules.has(moduleKey) || enabledModules.has(toBackendModuleKey(moduleKey));
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
      // Safe fallback before custom matrix loads
      if (user?.role === 'admin') {
        if (action === 'unmask_phone') {
          return tenantSettings.pii_masking_enabled === false;
        }
        return true;
      }
      if (user?.role === 'sale') {
        if (action === 'unmask_phone') {
          return !tenantSettings.pii_masking_enabled && !tenantSettings.pii_mask_all_sales;
        }
        return action === 'view' || action === 'create' || action === 'edit';
      }
      return action === 'view';
    },
    [hasModule, isTenantOwner, resolveEffectivePermission, user?.role, tenantSettings.pii_masking_enabled, tenantSettings.pii_mask_all_sales]
  );

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
      can,
      scope,
      switchingPackage,
      switchPackage,
      applyTerminologyLocal,
      setGlobalLoadingModal,
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
      can,
      scope,
      switchingPackage,
      switchPackage,
      applyTerminologyLocal,
      setGlobalLoadingModal,
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
      can: () => true,
      scope: () => 'company',
      switchingPackage: false,
      switchPackage: async () => {},
      applyTerminologyLocal: () => {},
      setGlobalLoadingModal: () => {},
    };
  }
  return ctx;
};
