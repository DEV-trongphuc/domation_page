import React, { lazy, Suspense } from 'react';
import {
  ArrowRight,
  Bot,
  CheckCircle2,
  Layers,
  Lock,
  Settings,
  ShieldCheck,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
  AutoDataLoadingModal,
  Badge,
  Card,
  FormCard,
} from '../components/ui/AutoDataLoadingModal';
import { ScreenHelpButton } from '../components/ui/ScreenHelpButton';
import { useEntitlement } from '../contexts/EntitlementContext';
import {
  ECOSYSTEM_PLUGIN_ROUTES,
  getRegisteredWave2Module,
  type EcosystemRouteDescriptor,
} from './registryMeta';

const AudiencesPage = lazy(() =>
  import('./audiences/AudiencesPage').then((m) => ({ default: m.AudiencesPage }))
);
const MarketingDashboardOverview = lazy(() =>
  import('./dashboards/MarketingDashboardOverview').then((m) => ({
    default: m.MarketingDashboardOverview,
  }))
);
const GrowthAttributionPage = lazy(() =>
  import('./dashboards/GrowthAttributionPage').then((m) => ({
    default: m.GrowthAttributionPage,
  }))
);
const MarketingConnectHub = lazy(() =>
  import('./connect/MarketingConnectHub').then((m) => ({
    default: m.MarketingConnectHub,
  }))
);

// Auto-discover Wave 2 parallel worker entries dropped into ./<entrySlug>/Wave2Entry.tsx at module init
const discoveredWave2Modules = import.meta.glob<{ default: React.ComponentType }>(
  './*/Wave2Entry.tsx'
);

const prebuiltWave2LazyMap: Record<string, React.LazyExoticComponent<React.ComponentType>> = {};
for (const [globKey, loader] of Object.entries(discoveredWave2Modules)) {
  prebuiltWave2LazyMap[globKey] = lazy(loader);
}

const Wave2SlotLaunchpad: React.FC<{ descriptor: EcosystemRouteDescriptor }> = ({
  descriptor,
}) => {
  const { scope, packageMeta, terminology } = useEntitlement();
  const navigate = useNavigate();
  const activeScope = scope(descriptor.moduleKey);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <Card
        padding="1.35rem 1.5rem"
        style={{ background: 'linear-gradient(135deg, #FFFFFF 0%, #F8FAFF 100%)' }}
      >
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: 16,
                background: '#FFFFFF',
                border: '1px solid #DBEAFE',
                boxShadow: '0 6px 18px rgba(30, 64, 255, 0.12)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 6,
              }}
            >
              <img
                src="/imgs/autodata/ICON.png"
                alt="DOMATION Module"
                style={{ width: '100%', height: '100%', objectFit: 'contain' }}
              />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <h1 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0F172A', margin: 0 }}>
                  {descriptor.title}
                </h1>
                <Badge tone="primary">{packageMeta.shortName}</Badge>
                <Badge tone="success" icon={<Lock size={11} />}>
                  RBAC Scope: {activeScope}
                </Badge>
              </div>
              <p style={{ fontSize: '0.82rem', color: '#64748B', marginTop: 4 }}>
                {descriptor.subtitle}
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <ScreenHelpButton screenKey={descriptor.screenKey} />
          </div>
        </div>
      </Card>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem' }}>
        {(descriptor.highlights || []).map((hl) => (
          <FormCard
            key={hl}
            icon={<CheckCircle2 size={18} />}
            title={hl}
            description={`Đã kết nối sẵn sàng với lõi ${terminology.customerLabel} 360°, Sơ đồ Tổ chức & Ma trận Phân quyền RBAC.`}
            badge={<Badge tone="info">Multi-Tenant RLS</Badge>}
          />
        ))}
      </div>

      <Card
        title="Liên Thông Trực Tiếp Với Các Động Cơ Nền Tảng Đang Hoạt Động"
        subtitle="Phân hệ này đọc/ghi trực tiếp trên Master Contact Core & cấu hình Zero-Hardcode của doanh nghiệp"
      >
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
          <button
            type="button"
            onClick={() => navigate('/audiences')}
            className="btn secondary"
            style={{ height: 40, color: '#1E40FF', display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: '0.82rem' }}
          >
            <Layers size={15} /> Mở Tệp Data & Tệp Logic ({terminology.customerLabel}) <ArrowRight size={14} />
          </button>
          <button
            type="button"
            onClick={() => navigate('/marketing-connect')}
            className="btn secondary"
            style={{ height: 40, display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: '0.82rem' }}
          >
            <ShieldCheck size={15} color="#0284C7" /> Cấu hình Kênh gửi Vault (SES/ZNS/SDK)
          </button>
          <button
            type="button"
            onClick={() => navigate('/settings?tab=org_structure')}
            className="btn secondary"
            style={{ height: 40, display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: '0.82rem' }}
          >
            <Settings size={15} /> Thiết lập Sơ đồ Tổ chức & Phân quyền
          </button>
          {descriptor.moduleKey === 'dom_agent' && (
            <button
              type="button"
              onClick={() => navigate('/settings?tab=policy_docs')}
              className="btn-inkica-primary"
              style={{
                height: 40,
                padding: '0 1.15rem',
                borderRadius: 12,
                border: 'none',
                color: '#FFFFFF',
                fontWeight: 700,
                fontSize: '0.82rem',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                cursor: 'pointer',
              }}
            >
              <Bot size={15} /> Đồng bộ Nội quy RAG cho DOM Agent
            </button>
          )}
        </div>
      </Card>
    </div>
  );
};

export const EcosystemPluginViewport: React.FC<{ path: string }> = ({ path }) => {
  const descriptor = ECOSYSTEM_PLUGIN_ROUTES.find((r) => r.path === path);
  const explicit = getRegisteredWave2Module(path);
  const globLazy = descriptor?.entrySlug
    ? prebuiltWave2LazyMap[`./${descriptor.entrySlug}/Wave2Entry.tsx`]
    : undefined;
  const ResolvedWave2 = explicit || globLazy;

  const fallback = (
    <AutoDataLoadingModal
      inline
      isOpen
      message={`Đang mở phân hệ ${descriptor?.title || ''}...`}
      subMessage=""
    />
  );

  if (path === '/audiences') {
    return (
      <Suspense fallback={fallback}>
        <AudiencesPage />
      </Suspense>
    );
  }
  if (path === '/marketing-dashboard') {
    return (
      <Suspense fallback={fallback}>
        <MarketingDashboardOverview />
      </Suspense>
    );
  }
  if (path === '/growth-attribution') {
    return (
      <Suspense fallback={fallback}>
        <GrowthAttributionPage />
      </Suspense>
    );
  }
  if (path === '/marketing-connect') {
    return (
      <Suspense fallback={fallback}>
        <MarketingConnectHub />
      </Suspense>
    );
  }

  if (ResolvedWave2) {
    return (
      <Suspense fallback={fallback}>
        {React.createElement(ResolvedWave2)}
      </Suspense>
    );
  }

  if (!descriptor) return null;
  return <Wave2SlotLaunchpad descriptor={descriptor} />;
};
