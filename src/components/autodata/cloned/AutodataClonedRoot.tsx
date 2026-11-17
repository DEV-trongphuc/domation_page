import React, { lazy, Suspense, useEffect, useState } from 'react';
import {
  MemoryRouter,
  Routes,
  Route,
  Navigate,
  Outlet,
  useLocation,
  useNavigate,
} from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { Keyboard } from 'lucide-react';
import './styles/autodataCloned.css';

import { Layout } from './components/Layout/Layout';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { EntitlementProvider, useEntitlement } from './contexts/EntitlementContext';
import { LanguageProvider, useLanguage } from './contexts/LanguageContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import { CustomModal } from './components/ui/CustomModal';
import { AutoDataLoadingModal } from './components/ui/AutoDataLoadingModal';
import { getDefaultDateFilter } from './utils/api';
import { apiRequest } from '../autodataApi';
import { AutoDataSpotlightTour } from '../AutoDataHelpTour';
import { SCREEN_TOUR_DECKS } from '../autoDataScreenTours';
import { BillingView } from '../pages/BillingView';
import { ECOSYSTEM_PLUGIN_ROUTES } from './modules/registryMeta';
import { EcosystemPluginViewport } from './modules/registry';
import type { TenantSessionV2, WorkspaceScreenKey } from '../autodataTypes';

const Dashboard = lazy(() => import('./pages/Dashboard').then((m) => ({ default: m.Dashboard })));
const Consultants = lazy(() =>
  import('./pages/Consultants').then((m) => ({ default: m.Consultants }))
);
const Rounds = lazy(() => import('./pages/Rounds').then((m) => ({ default: m.Rounds })));
const Tickets = lazy(() => import('./pages/Tickets').then((m) => ({ default: m.Tickets })));
const RuleSettings = lazy(() =>
  import('./pages/RuleSettings').then((m) => ({ default: m.RuleSettings }))
);
const Integrations = lazy(() =>
  import('./pages/Integrations').then((m) => ({ default: m.Integrations }))
);
const Settings = lazy(() => import('./pages/Settings').then((m) => ({ default: m.Settings })));
const Gatekeeper = lazy(() =>
  import('./pages/Gatekeeper').then((m) => ({ default: m.Gatekeeper }))
);
const DataList = lazy(() => import('./pages/DataList').then((m) => ({ default: m.DataList })));
const Accounts = lazy(() => import('./pages/Accounts').then((m) => ({ default: m.Accounts })));
const ReportData = lazy(() =>
  import('./pages/ReportData').then((m) => ({ default: m.ReportData }))
);
const SalePortal = lazy(() =>
  import('./pages/SalePortal').then((m) => ({ default: m.SalePortal }))
);
const FairShareAudit = lazy(() =>
  import('./pages/FairShareAudit').then((m) => ({ default: m.FairShareAudit }))
);
const AdsPerformance = lazy(() =>
  import('./pages/AdsPerformance').then((m) => ({ default: m.AdsPerformance }))
);

const PageLoader: React.FC = () => (
  <AutoDataLoadingModal
    inline
    isOpen
    message="Đang tải không gian làm việc..."
    subMessage="DOMATION Bright Royal Sapphire UI"
  />
);

function mapPathToScreenKey(
  pathname: string,
  role?: string,
  isMarketingStandalone?: boolean
): WorkspaceScreenKey | 'sale_portal' {
  if (!isMarketingStandalone && (role === 'sale' || pathname === '/sale-portal')) {
    return 'sale_portal';
  }
  const pluginMatch = ECOSYSTEM_PLUGIN_ROUTES.find((r) => r.path === pathname);
  if (pluginMatch) {
    return pluginMatch.screenKey;
  }
  if (pathname === '/' && isMarketingStandalone) {
    return 'mkt_dashboard';
  }
  switch (pathname) {
    case '/data':
    case '/calendar':
      return 'data_list';
    case '/ads-performance':
      return 'ads_performance';
    case '/tickets':
      return 'tickets';
    case '/gatekeeper':
      return 'gatekeeper';
    case '/rounds':
      return 'rounds';
    case '/fair-share':
      return 'fair_share';
    case '/rules':
      return 'routing_rules';
    case '/integrations':
      return 'integrations';
    case '/consultants':
      return 'consultants';
    case '/accounts':
      return 'accounts';
    case '/settings':
      return 'settings';
    case '/report-data':
      return 'report_data';
    default:
      return 'dashboard';
  }
}

const ProtectedRoute: React.FC = () => {
  const { user, token } = useAuth();
  const { hasModule } = useEntitlement();
  if (!token || !user) return null;
  if (user.role === 'sale' && hasModule('sale_portal')) {
    return <Navigate to="/sale-portal" replace />;
  }
  return (
    <Layout>
      <ErrorBoundary>
        <Suspense fallback={<PageLoader />}>
          <Outlet />
        </Suspense>
      </ErrorBoundary>
    </Layout>
  );
};

const SalePortalGate: React.FC = () => {
  const { hasModule } = useEntitlement();
  if (!hasModule('sale_portal')) {
    return <Navigate to="/" replace />;
  }
  return <SalePortal />;
};

const AppTabs: React.FC = () => {
  const { user } = useAuth();
  const { packageCode, hasModule, can } = useEntitlement();
  const location = useLocation();
  const currentPath = location.pathname;
  const [visitedPaths, setVisitedPaths] = useState<string[]>([currentPath]);

  if (!visitedPaths.includes(currentPath)) {
    setVisitedPaths([...visitedPaths, currentPath]);
  }

  const isMarketingStandalone = packageCode === 'marketing_standalone';

  if (user?.role === 'sale' && hasModule('sale_portal')) {
    return <Navigate to="/sale-portal" replace />;
  }

  // Redirect /integrations -> /marketing-connect when on Marketing Standalone
  if (currentPath === '/integrations' && isMarketingStandalone) {
    return <Navigate to="/marketing-connect" replace />;
  }

  // Check if currentPath matches an Ecosystem Plugin Route (Wave 1 or Wave 2)
  const matchedPlugin = ECOSYSTEM_PLUGIN_ROUTES.find((r) => r.path === currentPath);
  if (matchedPlugin) {
    if (!hasModule(matchedPlugin.moduleKey) || !can(matchedPlugin.moduleKey, 'view')) {
      return <Navigate to="/" replace />;
    }
    return (
      <div className="page-enter-active" style={{ width: '100%', height: '100%' }}>
        <EcosystemPluginViewport path={currentPath} />
      </div>
    );
  }

  // Core AutoData / System routes
  const crmOnlyRoutes: Record<string, string> = {
    '/data': 'leads',
    '/calendar': 'leads',
    '/ads-performance': 'ads_capi',
    '/consultants': 'consultants',
    '/rounds': 'rounds',
    '/tickets': 'tickets_data',
    '/rules': 'routing_rules',
    '/integrations': 'integrations_autodata',
    '/gatekeeper': 'gatekeeper',
    '/fair-share': 'fair_share',
  };

  if (currentPath in crmOnlyRoutes) {
    const reqMod = crmOnlyRoutes[currentPath];
    if (!hasModule(reqMod)) {
      return <Navigate to="/" replace />;
    }
  }

  const adminPaths = [
    '/consultants',
    '/rounds',
    '/tickets',
    '/rules',
    '/integrations',
    '/settings',
    '/accounts',
    '/fair-share',
    '/gatekeeper',
  ];
  const userPaths = ['/', '/data', '/calendar', '/ads-performance'];
  const allLegacyPaths = [...userPaths, ...adminPaths];
  const isAdminPath = adminPaths.includes(currentPath);

  if (!allLegacyPaths.includes(currentPath)) return <Navigate to="/" replace />;
  if (currentPath === '/accounts' && user?.role !== 'superadmin') return <Navigate to="/" replace />;
  if (isAdminPath && user?.role !== 'admin' && user?.role !== 'superadmin') {
    return <Navigate to="/" replace />;
  }

  // Home route '/' on Marketing Standalone renders dedicated Marketing Dashboard!
  if (currentPath === '/' && isMarketingStandalone) {
    return (
      <div className="page-enter-active" style={{ width: '100%', height: '100%' }}>
        <EcosystemPluginViewport path="/marketing-dashboard" />
      </div>
    );
  }

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      {!isMarketingStandalone && (
        <>
          <div
            style={{ display: currentPath === '/' ? 'block' : 'none' }}
            className={currentPath === '/' ? 'page-enter-active' : ''}
          >
            {visitedPaths.includes('/') && (
              <Suspense fallback={<PageLoader />}>
                <Dashboard />
              </Suspense>
            )}
          </div>
          <div
            style={{
              display: currentPath === '/data' || currentPath === '/calendar' ? 'block' : 'none',
            }}
            className={
              currentPath === '/data' || currentPath === '/calendar' ? 'page-enter-active' : ''
            }
          >
            {(visitedPaths.includes('/data') || visitedPaths.includes('/calendar')) && (
              <Suspense fallback={<PageLoader />}>
                <DataList />
              </Suspense>
            )}
          </div>
          <div
            style={{ display: currentPath === '/ads-performance' ? 'block' : 'none' }}
            className={currentPath === '/ads-performance' ? 'page-enter-active' : ''}
          >
            {visitedPaths.includes('/ads-performance') && (
              <Suspense fallback={<PageLoader />}>
                <AdsPerformance />
              </Suspense>
            )}
          </div>
        </>
      )}

      {(user?.role === 'admin' || user?.role === 'superadmin') && (
        <>
          {!isMarketingStandalone && (
            <>
              <div
                style={{ display: currentPath === '/consultants' ? 'block' : 'none' }}
                className={currentPath === '/consultants' ? 'page-enter-active' : ''}
              >
                {visitedPaths.includes('/consultants') && (
                  <Suspense fallback={<PageLoader />}>
                    <Consultants />
                  </Suspense>
                )}
              </div>
              <div
                style={{ display: currentPath === '/rounds' ? 'block' : 'none' }}
                className={currentPath === '/rounds' ? 'page-enter-active' : ''}
              >
                {visitedPaths.includes('/rounds') && (
                  <Suspense fallback={<PageLoader />}>
                    <Rounds />
                  </Suspense>
                )}
              </div>
              <div
                style={{ display: currentPath === '/tickets' ? 'block' : 'none' }}
                className={currentPath === '/tickets' ? 'page-enter-active' : ''}
              >
                {visitedPaths.includes('/tickets') && (
                  <Suspense fallback={<PageLoader />}>
                    <Tickets />
                  </Suspense>
                )}
              </div>
              <div
                style={{ display: currentPath === '/rules' ? 'block' : 'none' }}
                className={currentPath === '/rules' ? 'page-enter-active' : ''}
              >
                {visitedPaths.includes('/rules') && (
                  <Suspense fallback={<PageLoader />}>
                    <RuleSettings />
                  </Suspense>
                )}
              </div>
              <div
                style={{ display: currentPath === '/integrations' ? 'block' : 'none' }}
                className={currentPath === '/integrations' ? 'page-enter-active' : ''}
              >
                {visitedPaths.includes('/integrations') && (
                  <Suspense fallback={<PageLoader />}>
                    <Integrations />
                  </Suspense>
                )}
              </div>
              <div
                style={{ display: currentPath === '/gatekeeper' ? 'block' : 'none' }}
                className={currentPath === '/gatekeeper' ? 'page-enter-active' : ''}
              >
                {visitedPaths.includes('/gatekeeper') && (
                  <Suspense fallback={<PageLoader />}>
                    <Gatekeeper />
                  </Suspense>
                )}
              </div>
              <div
                style={{ display: currentPath === '/fair-share' ? 'block' : 'none' }}
                className={currentPath === '/fair-share' ? 'page-enter-active' : ''}
              >
                {visitedPaths.includes('/fair-share') && (
                  <Suspense fallback={<PageLoader />}>
                    <FairShareAudit />
                  </Suspense>
                )}
              </div>
            </>
          )}

          <div
            style={{ display: currentPath === '/settings' ? 'block' : 'none' }}
            className={currentPath === '/settings' ? 'page-enter-active' : ''}
          >
            {visitedPaths.includes('/settings') && (
              <Suspense fallback={<PageLoader />}>
                <Settings />
              </Suspense>
            )}
          </div>
          <div
            style={{ display: currentPath === '/accounts' ? 'block' : 'none' }}
            className={currentPath === '/accounts' ? 'page-enter-active' : ''}
          >
            {visitedPaths.includes('/accounts') && (
              <Suspense fallback={<PageLoader />}>
                <Accounts />
              </Suspense>
            )}
          </div>
        </>
      )}
    </div>
  );
};

const TourController: React.FC<{
  open: boolean;
  onClose: () => void;
  deckKey?: string | null;
}> = ({ open, onClose, deckKey }) => {
  const { user, v2Session } = useAuth();
  const { packageCode } = useEntitlement();
  const location = useLocation();
  const [stepIdx, setStepIdx] = useState(0);

  const isMktOnly = packageCode === 'marketing_standalone';

  const resolveEffectiveScreenKey = (): WorkspaceScreenKey | 'sale_portal' => {
    if (deckKey && deckKey in SCREEN_TOUR_DECKS) {
      return deckKey as WorkspaceScreenKey | 'sale_portal';
    }
    const baseKey = mapPathToScreenKey(location.pathname, user?.role, isMktOnly);
    if (baseKey === 'ads_performance') {
      const isCapi =
        typeof document !== 'undefined' &&
        Boolean(document.querySelector('[data-tour="capi-account-select"]'));
      if (isCapi && SCREEN_TOUR_DECKS.ads_capi) {
        return 'ads_capi';
      }
    }
    if (baseKey === 'settings') {
      const searchParams = new URLSearchParams(location.search);
      const tabParam = searchParams.get('tab');
      const domSubtab =
        typeof document !== 'undefined'
          ? document.querySelector('[data-settings-subtab]')?.getAttribute('data-settings-subtab')
          : null;
      const subtab = tabParam || domSubtab || 'processing';
      const settingDeckKey = `settings_${subtab}` as WorkspaceScreenKey;
      if (SCREEN_TOUR_DECKS[settingDeckKey]) {
        return settingDeckKey;
      }
    }
    return baseKey;
  };

  const screenKey = resolveEffectiveScreenKey();
  const steps =
    SCREEN_TOUR_DECKS[screenKey] ?? SCREEN_TOUR_DECKS.settings ?? SCREEN_TOUR_DECKS.dashboard ?? [];

  const handleFinish = async () => {
    setStepIdx(0);
    onClose();
    try {
      await apiRequest('/auth/onboarding', {
        method: 'PATCH',
        token: v2Session?.access_token || '',
        tenantSlug: v2Session?.tenant_slug || '',
        body: { screen_tours: { [screenKey]: true }, is_completed: true },
      });
    } catch {
      // ignore non-critical tour persist errors
    }
  };

  return (
    <AutoDataSpotlightTour
      key={`${screenKey}_${open ? 'open' : 'closed'}`}
      open={open}
      steps={steps}
      activeStepIndex={stepIdx}
      onStepChange={setStepIdx}
      onFinish={() => void handleFinish()}
      onClose={() => void handleFinish()}
    />
  );
};

const KeyboardShortcutsController: React.FC = () => {
  const { user, token } = useAuth();
  const { hasModule } = useEntitlement();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [showHelpModal, setShowHelpModal] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement;
      const isInputActive =
        activeEl &&
        (activeEl.tagName === 'INPUT' ||
          activeEl.tagName === 'TEXTAREA' ||
          activeEl.tagName === 'SELECT' ||
          activeEl.hasAttribute('contenteditable'));

      if (e.key === 'Escape') {
        if (isInputActive) (activeEl as HTMLElement).blur();
        else setShowHelpModal(false);
        return;
      }
      if (isInputActive) return;

      if (e.key === '?' || (e.key === '/' && e.shiftKey)) {
        e.preventDefault();
        setShowHelpModal((p) => !p);
        return;
      }

      if (e.altKey && !e.ctrlKey && !e.metaKey) {
        const key = e.key.toLowerCase();
        if (key === 'n' && hasModule('leads')) {
          e.preventDefault();
          window.dispatchEvent(new CustomEvent('open-quick-add-lead'));
          setShowHelpModal(false);
          return;
        }
        if (key === 'h') {
          e.preventDefault();
          window.dispatchEvent(new CustomEvent('open-activity-feed'));
          setShowHelpModal(false);
          return;
        }
        const shortcuts: Record<string, string> = { d: '/' };
        if (hasModule('leads')) shortcuts.l = '/data';
        if (hasModule('audiences')) shortcuts.m = '/audiences';
        if (user?.role === 'admin' || user?.role === 'superadmin') {
          if (hasModule('fair_share')) shortcuts.s = '/fair-share';
          if (hasModule('rounds')) shortcuts.r = '/rounds';
          if (hasModule('consultants')) shortcuts.c = '/consultants';
          if (hasModule('tickets_data')) shortcuts.t = '/tickets';
          if (hasModule('routing_rules')) shortcuts.w = '/rules';
          if (hasModule('integrations_autodata')) shortcuts.i = '/integrations';
          if (hasModule('integrations_marketing')) shortcuts.k = '/marketing-connect';
          shortcuts.o = '/settings';
          if (hasModule('gatekeeper')) shortcuts.g = '/gatekeeper';
          if (user?.role === 'superadmin') shortcuts.a = '/accounts';
        }
        if (shortcuts[key] !== undefined) {
          e.preventDefault();
          navigate(shortcuts[key]);
          setShowHelpModal(false);
        }
      }
    };

    const handleOpenHelp = () => setShowHelpModal(true);
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('open-keyboard-shortcuts', handleOpenHelp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('open-keyboard-shortcuts', handleOpenHelp);
    };
  }, [user, navigate, token, hasModule]);

  if (!token) return null;
  const isSystemAdmin = user?.role === 'admin' || user?.role === 'superadmin';

  return (
    <CustomModal
      isOpen={showHelpModal}
      onClose={() => setShowHelpModal(false)}
      title={t('Bảng phím tắt điều hướng nhanh')}
      width="650px"
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', padding: '0.5rem 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-primary)' }}>
          <Keyboard size={20} />
          <span style={{ fontSize: '0.875rem', fontWeight: 700 }}>
            {t('Mẹo: Nhấn Alt + [Chữ cái] để chuyển hướng nhanh toàn hệ thống')}
          </span>
        </div>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: isSystemAdmin ? '1fr 1fr' : '1fr',
            gap: '1.5rem',
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <div style={{ fontSize: '0.8125rem' }}>
              Dashboard — <strong>Alt + D</strong>
            </div>
            {hasModule('leads') && (
              <div style={{ fontSize: '0.8125rem' }}>
                Quản lý Data — <strong>Alt + L</strong>
              </div>
            )}
            {hasModule('audiences') && (
              <div style={{ fontSize: '0.8125rem' }}>
                Tệp Data & Tệp Logic — <strong>Alt + M</strong>
              </div>
            )}
            <div style={{ fontSize: '0.8125rem' }}>
              Bản tin hoạt động — <strong>Alt + H</strong>
            </div>
          </div>
          {isSystemAdmin && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {hasModule('rounds') && (
                <div style={{ fontSize: '0.8125rem' }}>
                  Vòng phân bổ — <strong>Alt + R</strong>
                </div>
              )}
              {hasModule('routing_rules') && (
                <div style={{ fontSize: '0.8125rem' }}>
                  Logic xử lý — <strong>Alt + W</strong>
                </div>
              )}
              {hasModule('integrations_marketing') && (
                <div style={{ fontSize: '0.8125rem' }}>
                  Kết nối SES / ZNS / SDK — <strong>Alt + K</strong>
                </div>
              )}
              <div style={{ fontSize: '0.8125rem' }}>
                Cài đặt — <strong>Alt + O</strong>
              </div>
            </div>
          )}
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button className="btn primary" onClick={() => setShowHelpModal(false)}>
            {t('Đóng')}
          </button>
        </div>
      </div>
    </CustomModal>
  );
};

export interface AutodataClonedRootProps {
  session: TenantSessionV2;
  initialView?: WorkspaceScreenKey;
  onSessionUpdated: (next: TenantSessionV2) => void;
  onLoggedOut: () => void;
  onNavigateSlug: (slug: string) => void;
  onSwitchWorkspaceRequested: () => void;
}

export const AutodataClonedRoot: React.FC<AutodataClonedRootProps> = ({
  session,
  initialView = 'dashboard',
  onSessionUpdated,
  onLoggedOut,
  onNavigateSlug,
  onSwitchWorkspaceRequested,
}) => {
  const [billingModalOpen, setBillingModalOpen] = useState(initialView === 'billing');
  const [tourOpen, setTourOpen] = useState(false);
  const [activeTourDeck, setActiveTourDeck] = useState<string | null>(null);

  const handleOpenTour = (deckKey?: string) => {
    setActiveTourDeck(deckKey || null);
    setTourOpen(true);
  };

  useEffect(() => {
    const handleCustomOpenTour = (ev: Event) => {
      const custom = ev as CustomEvent<{ screenKey?: string }>;
      handleOpenTour(custom.detail?.screenKey);
    };
    window.addEventListener('autodata-open-tour', handleCustomOpenTour);
    return () => window.removeEventListener('autodata-open-tour', handleCustomOpenTour);
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute('data-autodata-workspace', 'active');
    const localTheme =
      (localStorage.getItem('domation_theme') as 'light' | 'dark' | null) || 'light';
    document.documentElement.setAttribute('data-theme', localTheme);
    localStorage.setItem('domation_global_date', getDefaultDateFilter());

    const onExpired = () => {
      onLoggedOut();
    };
    window.addEventListener('autodata-session-expired', onExpired);

    return () => {
      window.removeEventListener('autodata-session-expired', onExpired);
      document.documentElement.removeAttribute('data-autodata-workspace');
      document.documentElement.removeAttribute('data-theme');
    };
  }, [onLoggedOut]);

  const initialRoute =
    session.role === 'sale' && session.package_code !== 'marketing_standalone'
      ? '/sale-portal'
      : initialView === 'report_data'
      ? '/report-data'
      : initialView === 'integrations'
      ? '/integrations'
      : initialView === 'audiences'
      ? '/audiences'
      : initialView === 'marketing_connect'
      ? '/marketing-connect'
      : initialView === 'growth_attribution'
      ? '/growth-attribution'
      : '/';

  return (
    <div className="autodata-app-root">
      <ErrorBoundary>
        <LanguageProvider>
          <AuthProvider
            session={session}
            onSessionUpdated={onSessionUpdated}
            onLoggedOut={onLoggedOut}
            onNavigateSlug={onNavigateSlug}
            onSwitchWorkspaceRequested={onSwitchWorkspaceRequested}
            onOpenBilling={() => setBillingModalOpen(true)}
            onOpenTour={handleOpenTour}
          >
            <EntitlementProvider>
              <Toaster
                position="top-right"
                toastOptions={{
                  duration: 3500,
                  style: {
                    padding: '12px 16px',
                    borderRadius: '14px',
                    fontSize: '0.875rem',
                    fontWeight: 500,
                    gap: '10px',
                    background: 'var(--color-surface, #ffffff)',
                    color: 'var(--color-text, #0f172a)',
                    border: '1px solid var(--color-border, #e2e8f0)',
                    boxShadow: '0 10px 28px rgba(15, 23, 42, 0.12)',
                  },
                }}
              />
              <MemoryRouter initialEntries={[initialRoute]}>
                <Suspense fallback={<PageLoader />}>
                  <Routes>
                    <Route path="/report-data" element={<ReportData />} />
                    <Route path="/sale-portal" element={<SalePortalGate />} />
                    <Route element={<ProtectedRoute />}>
                      <Route path="/*" element={<AppTabs />} />
                    </Route>
                  </Routes>
                  <KeyboardShortcutsController />
                  <TourController
                    open={tourOpen}
                    deckKey={activeTourDeck}
                    onClose={() => {
                      setTourOpen(false);
                      setActiveTourDeck(null);
                    }}
                  />
                </Suspense>
              </MemoryRouter>

              <CustomModal
                isOpen={billingModalOpen}
                onClose={() => setBillingModalOpen(false)}
                title="Hệ Sinh Thái 4 Gói SaaS, Hạn Mức & Ví Thanh Toán"
                width="1040px"
              >
                <BillingView
                  token={session.access_token}
                  tenantSlug={session.tenant_slug}
                  hideHeaderCard={true}
                />
              </CustomModal>
            </EntitlementProvider>
          </AuthProvider>
        </LanguageProvider>
      </ErrorBoundary>
    </div>
  );
};
