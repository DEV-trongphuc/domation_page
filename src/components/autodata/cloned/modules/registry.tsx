import React, { Suspense, lazy } from 'react';
import { MemoryRouter, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import {
  Sparkles,
  Layers,
  ArrowRight,
  Lock,
  CheckCircle2,
  ExternalLink,
} from 'lucide-react';
import { useEntitlement } from '../contexts/EntitlementContext';
import { PublicRouteSkeleton, RouteTabSkeleton } from '../components/ui/Skeleton';
import {
  ECOSYSTEM_PLUGIN_ROUTES,
  REGISTERED_WAVE2_MODULES,
  matchEcosystemRoute,
  type EcosystemRouteDescriptor,
} from './registryMeta';

type LazyComponentImport = () => Promise<Record<string, unknown>>;

const prebuiltWave2LazyMap = import.meta.glob('./*/Wave2Entry.tsx') as Record<
  string,
  LazyComponentImport
>;

const prebuiltSubViewLazyMap = import.meta.glob([
  './erp-finance/*.tsx',
  './erp-payroll/*.tsx',
  './erp-workchat/*.tsx',
  './erp-projects/*.tsx',
  './settings-saas/*.tsx',
  './dashboards/*.tsx',
]) as Record<string, LazyComponentImport>;

const prebuiltPublicPagesMap = import.meta.glob('../public-pages/*.tsx') as Record<
  string,
  LazyComponentImport
>;

const lazyCache = new Map<string, React.LazyExoticComponent<React.ComponentType>>();

function toLazyComponent(
  cacheKey: string,
  loader: LazyComponentImport,
  preferredExportNames: string[] = []
): React.LazyExoticComponent<React.ComponentType> {
  const cached = lazyCache.get(cacheKey);
  if (cached) return cached;

  const Wrapped = lazy(async () => {
    const mod = await loader();
    let Resolved = mod.default as React.ComponentType | undefined;

    if (!Resolved) {
      for (const name of preferredExportNames) {
        if (typeof mod[name] === 'function') {
          Resolved = mod[name] as React.ComponentType;
          break;
        }
      }
    }

    if (!Resolved) {
      const firstComponent = Object.entries(mod).find(
        ([key, value]) => /^[A-Z]/.test(key) && typeof value === 'function'
      );
      if (firstComponent) {
        Resolved = firstComponent[1] as React.ComponentType;
      }
    }

    if (!Resolved) {
      const EmptyFallback: React.FC = () => null;
      return { default: EmptyFallback };
    }

    return { default: Resolved };
  });

  lazyCache.set(cacheKey, Wrapped);
  return Wrapped;
}

const LazyAudiencesPage = toLazyComponent(
  'audiences:AudiencesPage',
  () => import('./audiences/AudiencesPage'),
  ['AudiencesPage']
);

const LazyMarketingConnectHub = toLazyComponent(
  'connect:MarketingConnectHub',
  () => import('./connect/MarketingConnectHub'),
  ['MarketingConnectHub']
);

const LazyMarketingDashboardOverview = toLazyComponent(
  'dashboards:MarketingDashboardOverview',
  () => import('./dashboards/MarketingDashboardOverview'),
  ['MarketingDashboardOverview']
);

const LazyGrowthAttributionPage = toLazyComponent(
  'dashboards:GrowthAttributionPage',
  () => import('./dashboards/GrowthAttributionPage'),
  ['GrowthAttributionPage']
);

function resolveDynamicComponent(
  descriptor: EcosystemRouteDescriptor
): React.ComponentType | undefined {
  const explicit = REGISTERED_WAVE2_MODULES[descriptor.path];
  if (explicit) return explicit;

  if (descriptor.path === '/audiences') {
    return LazyAudiencesPage;
  }
  if (descriptor.path === '/marketing-connect') {
    return LazyMarketingConnectHub;
  }
  if (descriptor.path === '/marketing-dashboard') {
    return LazyMarketingDashboardOverview;
  }
  if (descriptor.path === '/growth-attribution') {
    return LazyGrowthAttributionPage;
  }

  if (descriptor.entrySlug) {
    const wave2Key = `./${descriptor.entrySlug}/Wave2Entry.tsx`;
    if (prebuiltWave2LazyMap[wave2Key]) {
      return toLazyComponent(`wave2:${wave2Key}`, prebuiltWave2LazyMap[wave2Key], [
        'Wave2Entry',
      ]);
    }
  }

  if (descriptor.subViewGlobs?.length) {
    for (const candidate of descriptor.subViewGlobs) {
      const key = `./${candidate}.tsx`;
      if (prebuiltSubViewLazyMap[key]) {
        const exportHint = candidate.split('/').pop() || '';
        return toLazyComponent(`subview:${key}`, prebuiltSubViewLazyMap[key], [exportHint]);
      }
    }
  }

  if (descriptor.publicPageGlobs?.length) {
    for (const candidate of descriptor.publicPageGlobs) {
      const key = `../public-pages/${candidate}.tsx`;
      if (prebuiltPublicPagesMap[key]) {
        return toLazyComponent(`public:${key}`, prebuiltPublicPagesMap[key], [candidate]);
      }
    }
  }

  return undefined;
}

const PREBUILT_ROUTE_COMPONENTS: Record<string, React.ComponentType> = {};
for (const descriptor of ECOSYSTEM_PLUGIN_ROUTES) {
  const resolved = resolveDynamicComponent(descriptor);
  if (resolved) {
    PREBUILT_ROUTE_COMPONENTS[descriptor.path] = resolved;
  }
}

export const Wave2Slot: React.FC<{
  descriptor: EcosystemRouteDescriptor;
}> = ({ descriptor }) => {
  const navigate = useNavigate();
  const { hasModule, packageMeta, educationAddon, switchPackage } = useEntitlement();

  const isAddonLocked =
    descriptor.moduleKey === 'education_addon' && !educationAddon;
  const isUnlocked = !isAddonLocked && hasModule(descriptor.moduleKey);

  const recommendedPackage =
    descriptor.group === 'erp' || descriptor.moduleKey.startsWith('erp_')
      ? ('domation_promax' as const)
      : descriptor.group === 'growth'
        ? ('growth_combo' as const)
        : ('marketing_standalone' as const);

  const targetUpgradeName =
    recommendedPackage === 'domation_promax'
      ? 'DOMATION PROMAX'
      : recommendedPackage === 'growth_combo'
        ? 'Growth Suite (CRM + Marketing)'
        : 'Marketing Automation Độc lập';

  return (
    <div
      style={{
        padding: '28px',
        maxWidth: '960px',
        margin: '0 auto',
      }}
    >
      <div
        style={{
          backgroundColor: '#FFFFFF',
          border: '1px solid #E2E8F0',
          borderRadius: '20px',
          padding: '28px',
          boxShadow: '0 8px 24px -10px rgba(15, 23, 42, 0.08)',
          display: 'flex',
          flexDirection: 'column',
          gap: '20px',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '16px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div
              style={{
                width: '52px',
                height: '52px',
                borderRadius: '14px',
                background: 'linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 100%)',
                border: '1px solid #BFDBFE',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#1E40FF',
                flexShrink: 0,
              }}
            >
              {isUnlocked ? <Layers size={26} /> : <Lock size={24} />}
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <span
                  style={{
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                    padding: '3px 10px',
                    borderRadius: '999px',
                    backgroundColor: isUnlocked ? '#EFF6FF' : '#FEF3C7',
                    color: isUnlocked ? '#1E40FF' : '#B45309',
                    border: isUnlocked ? '1px solid #BFDBFE' : '1px solid #FDE68A',
                  }}
                >
                  {isUnlocked ? 'Module Ready' : 'Yêu cầu nâng cấp gói'}
                </span>
                <span style={{ fontSize: '0.78rem', color: '#64748B', fontWeight: 500 }}>
                  Gói hiện tại: {packageMeta.name}
                </span>
              </div>
              <h2
                style={{
                  margin: '6px 0 4px',
                  fontSize: '1.35rem',
                  fontWeight: 700,
                  color: '#0F172A',
                }}
              >
                {descriptor.title}
              </h2>
              <p style={{ margin: 0, fontSize: '0.9rem', color: '#475569', lineHeight: 1.5 }}>
                {descriptor.subtitle}
              </p>
            </div>
          </div>
        </div>

        {descriptor.highlights && descriptor.highlights.length > 0 && (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: '12px',
            }}
          >
            {descriptor.highlights.map((item) => (
              <div
                key={item}
                style={{
                  padding: '12px 14px',
                  borderRadius: '12px',
                  backgroundColor: '#F8FAFF',
                  border: '1px solid #E2E8F0',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  fontSize: '0.86rem',
                  fontWeight: 600,
                  color: '#1E293B',
                }}
              >
                <CheckCircle2 size={16} color="#1E40FF" style={{ flexShrink: 0 }} />
                <span>{item}</span>
              </div>
            ))}
          </div>
        )}

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px',
            paddingTop: '12px',
            borderTop: '1px solid #F1F5F9',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#64748B', fontSize: '0.82rem' }}>
            <Sparkles size={15} color="#1E40FF" />
            <span>
              {isUnlocked
                ? 'Không gian module đã mở khóa quyền truy cập trên tài khoản của bạn.'
                : `Nâng cấp lên ${targetUpgradeName} để sử dụng phân hệ này không giới hạn.`}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            {descriptor.fallbackPath && isUnlocked && (
              <button
                type="button"
                onClick={() => navigate(descriptor.fallbackPath!)}
                style={{
                  height: '44px',
                  minHeight: '44px',
                  padding: '0 18px',
                  borderRadius: '10px',
                  border: 'none',
                  backgroundColor: '#1E40FF',
                  color: '#FFFFFF',
                  fontWeight: 600,
                  fontSize: '0.88rem',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(30, 64, 255, 0.22)',
                }}
              >
                <span>Mở không gian tổng hợp</span>
                <ExternalLink size={16} />
              </button>
            )}

            {!isUnlocked && (
              <button
                type="button"
                onClick={() => {
                  if (descriptor.moduleKey === 'education_addon') {
                    void switchPackage(packageMeta.code, { educationAddon: true });
                  } else {
                    void switchPackage(recommendedPackage);
                  }
                }}
                style={{
                  height: '44px',
                  minHeight: '44px',
                  padding: '0 18px',
                  borderRadius: '10px',
                  border: 'none',
                  backgroundColor: '#1E40FF',
                  color: '#FFFFFF',
                  fontWeight: 600,
                  fontSize: '0.88rem',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(30, 64, 255, 0.22)',
                }}
              >
                <span>
                  {descriptor.moduleKey === 'education_addon'
                    ? 'Kích hoạt Education Add-on'
                    : `Mở khóa ${targetUpgradeName}`}
                </span>
                <ArrowRight size={16} />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export const EcosystemPluginViewport: React.FC<{ path: string }> = ({ path }) => {
  const descriptor =
    matchEcosystemRoute(path) || ECOSYSTEM_PLUGIN_ROUTES.find((r) => r.path === path);

  if (!descriptor) {
    return <RouteTabSkeleton path={path} />;
  }

  const ResolvedModule =
    REGISTERED_WAVE2_MODULES[descriptor.path] || PREBUILT_ROUTE_COMPONENTS[descriptor.path];
  const fallback = <RouteTabSkeleton path={path} />;

  if (ResolvedModule) {
    return (
      <Suspense fallback={fallback}>
        <ResolvedModule />
      </Suspense>
    );
  }

  return <Wave2Slot descriptor={descriptor} />;
};

const PublicMatchedViewport: React.FC = () => {
  const loc = useLocation();
  return <EcosystemPluginViewport path={loc.pathname} />;
};

export const PublicStandaloneGateway: React.FC<{ initialPath: string }> = ({ initialPath }) => (
  <MemoryRouter key={initialPath} initialEntries={[initialPath || '/']}>
    <Toaster position="top-right" />
    <div className="min-h-screen bg-[#F8F9FA] text-slate-900">
      <Suspense fallback={<PublicRouteSkeleton />}>
        <Routes>
          <Route path="/booking/:slug" element={<PublicMatchedViewport />} />
          <Route path="/public-booking/1on1/:slug" element={<PublicMatchedViewport />} />
          <Route path="/s/:slug" element={<PublicMatchedViewport />} />
          <Route path="/s/:tenant/:slug" element={<PublicMatchedViewport />} />
          <Route path="/claim/:id" element={<PublicMatchedViewport />} />
          <Route path="/schedule/:slug" element={<PublicMatchedViewport />} />
          <Route path="/public-schedule/:slug" element={<PublicMatchedViewport />} />
          <Route path="/docs/api-v1" element={<PublicMatchedViewport />} />
        </Routes>
      </Suspense>
    </div>
  </MemoryRouter>
);

export default EcosystemPluginViewport;
