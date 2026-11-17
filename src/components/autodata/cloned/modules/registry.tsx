import React, { Suspense, lazy } from 'react';
import { MemoryRouter, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { Sparkles, Layers, ArrowRight, Lock, CheckCircle2, ExternalLink } from 'lucide-react';
import { useEntitlement } from '../contexts/EntitlementContext';
import { PublicRouteSkeleton, RouteTabSkeleton } from '../components/ui/Skeleton';
import {
  ECOSYSTEM_PLUGIN_ROUTES,
  REGISTERED_WAVE2_MODULES,
  matchEcosystemRoute,
  type EcosystemRouteDescriptor,
} from './registryMeta';

const LazyPublicSurveyPage = lazy(() => import('../pages/marketing/PublicSurveyPage'));
const LazyPublicVoucherClaimPage = lazy(() => import('../pages/marketing/PublicVoucherClaimPage'));
const LazyPublicBooking1on1Page = lazy(() =>
  import('../pages/PublicBooking1on1Page').then((m) => ({
    default: (m as any).default || (m as any).PublicBooking1on1Page,
  }))
);
const LazyPublicSchedulePage = lazy(() =>
  import('../pages/PublicSchedulePage').then((m) => ({
    default: (m as any).default || (m as any).PublicSchedulePage,
  }))
);
const LazyApiV1DocumentationPage = lazy(() =>
  import('../pages/ApiV1DocumentationPage').then((m) => ({
    default: (m as any).default || (m as any).ApiV1DocumentationPage,
  }))
);

type LazyComponentImport = () => Promise<Record<string, unknown>>;

const prebuiltSettingsGlobs = import.meta.glob('./settings-saas/*.tsx') as Record<
  string,
  LazyComponentImport
>;

const PUBLIC_COMPONENTS_BY_PATH: Array<{ match: (p: string) => boolean; Component: React.ComponentType }> = [
  { match: (p) => p.startsWith('/booking/') || p.startsWith('/public-booking/'), Component: LazyPublicBooking1on1Page },
  { match: (p) => p.startsWith('/s/'), Component: LazyPublicSurveyPage },
  { match: (p) => p.startsWith('/claim/'), Component: LazyPublicVoucherClaimPage },
  { match: (p) => p.startsWith('/schedule') || p.startsWith('/public-schedule'), Component: LazyPublicSchedulePage },
  { match: (p) => p === '/docs/api-v1', Component: LazyApiV1DocumentationPage },
];

export const Wave2Slot: React.FC<{
  descriptor: EcosystemRouteDescriptor;
}> = ({ descriptor }) => {
  const navigate = useNavigate();
  const { hasModule, packageMeta, educationAddon, switchPackage } = useEntitlement();

  const isAddonLocked = descriptor.moduleKey === 'education_addon' && !educationAddon;
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
    <div style={{ padding: '28px', maxWidth: '960px', margin: '0 auto' }}>
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
            <h2 style={{ margin: '6px 0 4px', fontSize: '1.35rem', fontWeight: 700, color: '#0F172A' }}>
              {descriptor.title}
            </h2>
            <p style={{ margin: 0, fontSize: '0.9rem', color: '#475569', lineHeight: 1.5 }}>{descriptor.subtitle}</p>
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
  const pubMatch = PUBLIC_COMPONENTS_BY_PATH.find((entry) => entry.match(path));
  if (pubMatch) {
    const PubComp = pubMatch.Component;
    return (
      <Suspense fallback={<PublicRouteSkeleton />}>
        <PubComp />
      </Suspense>
    );
  }

  const descriptor =
    matchEcosystemRoute(path) || ECOSYSTEM_PLUGIN_ROUTES.find((r) => r.path === path);

  if (!descriptor) {
    return <RouteTabSkeleton path={path} />;
  }

  const Registered = REGISTERED_WAVE2_MODULES[descriptor.path];
  if (Registered) {
    return (
      <Suspense fallback={<RouteTabSkeleton path={path} />}>
        <Registered />
      </Suspense>
    );
  }

  if (descriptor.subViewGlobs?.length) {
    for (const candidate of descriptor.subViewGlobs) {
      const key = `./${candidate}.tsx`;
      const loader = prebuiltSettingsGlobs[key];
      if (loader) {
        const DynamicComp = lazy(async () => {
          const mod = await loader();
          const Comp = (mod.default || Object.values(mod).find((v) => typeof v === 'function') || (() => null)) as React.ComponentType;
          return { default: Comp };
        });
        return (
          <Suspense fallback={<RouteTabSkeleton path={path} />}>
            <DynamicComp />
          </Suspense>
        );
      }
    }
  }

  return <Wave2Slot descriptor={descriptor} />;
};

const PublicMatchedViewport: React.FC = () => {
  const loc = useLocation();
  return <EcosystemPluginViewport path={loc.pathname} />;
};

export const PublicStandaloneGateway: React.FC<{ initialPath?: string }> = ({ initialPath = '/' }) => (
  <MemoryRouter key={initialPath} initialEntries={[initialPath || '/']}>
    <Toaster position="top-right" />
    <div className="min-h-screen bg-[#F8F9FA] text-slate-900">
      <Suspense fallback={<PublicRouteSkeleton />}>
        <Routes>
          <Route path="/booking/:bookingCode" element={<LazyPublicBooking1on1Page />} />
          <Route path="/public-booking/1on1/:bookingCode" element={<LazyPublicBooking1on1Page />} />
          <Route path="/s/:slug" element={<LazyPublicSurveyPage />} />
          <Route path="/s/:tenant/:slug" element={<LazyPublicSurveyPage />} />
          <Route path="/claim/:id" element={<LazyPublicVoucherClaimPage />} />
          <Route path="/schedule/:customerId" element={<LazyPublicSchedulePage />} />
          <Route path="/schedule/campaign/:campaignId" element={<LazyPublicSchedulePage />} />
          <Route path="/schedule/lecturer/:lecturerId" element={<LazyPublicSchedulePage />} />
          <Route path="/public-schedule/:customerId" element={<LazyPublicSchedulePage />} />
          <Route path="/docs/api-v1" element={<LazyApiV1DocumentationPage />} />
          <Route path="*" element={<PublicMatchedViewport />} />
        </Routes>
      </Suspense>
    </div>
  </MemoryRouter>
);

export default EcosystemPluginViewport;
