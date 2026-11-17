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
import { RouteTabSkeleton } from './components/ui/Skeleton';
import { CommandPalette } from './components/ui/CommandPalette';
import { QRCodeCallModal } from './components/ui/QRCodeCallModal';
import { NotificationSettingsModal } from './components/ui/NotificationSettingsModal';
import { getDefaultDateFilter } from './utils/api';
import { apiRequest } from '../autodataApi';
import { AutoDataSpotlightTour } from '../AutoDataHelpTour';
import { SCREEN_TOUR_DECKS } from '../autoDataScreenTours';
import { BillingView } from '../pages/BillingView';
import { matchEcosystemRoute } from './modules/registryMeta';
import { EcosystemPluginViewport } from './modules/registry';
import type { TenantSessionV2, WorkspaceScreenKey } from '../autodataTypes';

type OptionalComponentLoader = () => Promise<{
  default?: React.ComponentType;
  GlobalEntityDrawers?: React.ComponentType;
  ChatFloatingLauncher?: React.ComponentType;
}>;

const optionalDrawersGlob = import.meta.glob('./drawers/GlobalEntityDrawers.tsx') as Record<
  string,
  OptionalComponentLoader
>;
const optionalChatGlob = import.meta.glob('./chat/ChatFloatingLauncher.tsx') as Record<
  string,
  OptionalComponentLoader
>;

const LazyGlobalEntityDrawers = lazy(async () => {
  const loader = optionalDrawersGlob['./drawers/GlobalEntityDrawers.tsx'];
  if (!loader) {
    const Empty: React.FC = () => null;
    return { default: Empty };
  }
  const mod = await loader();
  const Comp = mod.default || mod.GlobalEntityDrawers || (() => null);
  return { default: Comp };
});

const LazyChatFloatingLauncher = lazy(async () => {
  const loader = optionalChatGlob['./chat/ChatFloatingLauncher.tsx'];
  if (!loader) {
    const Empty: React.FC = () => null;
    return { default: Empty };
  }
  const mod = await loader();
  const Comp = mod.default || mod.ChatFloatingLauncher || (() => null);
  return { default: Comp };
});

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

function mapPathToScreenKey(
  pathname: string,
  _role?: string,
  isMarketingStandalone?: boolean
): WorkspaceScreenKey | 'sale_portal' {
  if (pathname === '/sale-portal') {
    return 'sale_portal';
  }
  const pluginMatch = matchEcosystemRoute(pathname);
  if (pluginMatch) {
    return pluginMatch.screenKey as WorkspaceScreenKey;
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

const ShellFloatingWidgets: React.FC = () => {
  const { token } = useAuth();
  const { hasModule, can } = useEntitlement();
  if (!token) return null;
  const allowWorkchat = hasModule('erp_workchat') && can('erp_workchat', 'view');

  return (
    <Suspense fallback={null}>
      <LazyGlobalEntityDrawers />
      {allowWorkchat && <LazyChatFloatingLauncher />}
      <CommandPalette />
      <QRCodeCallModal />
      <NotificationSettingsModal />
    </Suspense>
  );
};

const PublicViewportRoute: React.FC = () => {
  const location = useLocation();
  return (
    <ErrorBoundary>
      <Suspense fallback={<RouteTabSkeleton path={location.pathname} />}>
        <EcosystemPluginViewport path={location.pathname} />
      </Suspense>
    </ErrorBoundary>
  );
};

const ProtectedRoute: React.FC = () => {
  const { user, token } = useAuth();
  const { packageCode, hasModule, canScreen, getDefaultRoute } = useEntitlement();
  const location = useLocation();

  if (!token || !user) return null;

  if (
    location.pathname === '/' &&
    packageCode !== 'marketing_standalone' &&
    hasModule('sale_portal') &&
    !canScreen('dashboard')
  ) {
    const target = getDefaultRoute();
    if (target && target !== '/') {
      return <Navigate to={target} replace />;
    }
  }

  return (
    <Layout>
      <ErrorBoundary>
        <Suspense fallback={<RouteTabSkeleton path={location.pathname} />}>
          <Outlet />
        </Suspense>
      </ErrorBoundary>
    </Layout>
  );
};

const SalePortalGate: React.FC = () => {
  const { hasModule, canScreen, getDefaultRoute } = useEntitlement();
  if (!hasModule('sale_portal') && !canScreen('sale_portal')) {
    const fallback = getDefaultRoute();
    return <Navigate to={fallback !== '/sale-portal' ? fallback : '/'} replace />;
  }
  return <SalePortal />;
};

interface LegacyRouteGuard {
  moduleKey?: string;
  screenKey: string;
  ownerRecovery?: boolean;
}

const LEGACY_ROUTE_GUARDS: Record<string, LegacyRouteGuard> = {
  '/': { moduleKey: 'crm_dashboard', screenKey: 'dashboard' },
  '/data': { moduleKey: 'leads', screenKey: 'data_list' },
  '/calendar': { moduleKey: 'leads', screenKey: 'calendar' },
  '/ads-performance': { moduleKey: 'ads_capi', screenKey: 'ads_performance' },
  '/consultants': { moduleKey: 'consultants', screenKey: 'consultants' },
  '/rounds': { moduleKey: 'rounds', screenKey: 'rounds' },
  '/tickets': { moduleKey: 'tickets_data', screenKey: 'tickets' },
  '/rules': { moduleKey: 'routing_rules', screenKey: 'routing_rules' },
  '/integrations': { moduleKey: 'integrations_autodata', screenKey: 'integrations' },
  '/gatekeeper': { moduleKey: 'gatekeeper', screenKey: 'gatekeeper' },
  '/fair-share': { moduleKey: 'fair_share', screenKey: 'fair_share' },
  '/settings': { moduleKey: 'settings', screenKey: 'settings', ownerRecovery: true },
  '/accounts': { moduleKey: 'users', screenKey: 'accounts', ownerRecovery: true },
};

const AppTabs: React.FC = () => {
  const {
    packageCode,
    educationAddon,
    hasModule,
    can,
    canScreen,
    getDefaultRoute,
    isTenantOwner,
  } = useEntitlement();
  const location = useLocation();
  const currentPath = location.pathname;
  const [visitedPaths, setVisitedPaths] = useState<string[]>([currentPath]);

  useEffect(() => {
    let active = true;
    queueMicrotask(() => {
      if (active) {
        setVisitedPaths((prev) => (prev.includes(currentPath) ? prev : [...prev, currentPath]));
      }
    });
    return () => {
      active = false;
    };
  }, [currentPath]);

  const isPathRendered = (path: string) => currentPath === path || visitedPaths.includes(path);
  const isMarketingStandalone = packageCode === 'marketing_standalone';

  // Redirect /integrations -> /marketing-connect when on Marketing Standalone
  if (currentPath === '/integrations' && isMarketingStandalone) {
    return <Navigate to="/marketing-connect" replace />;
  }

  // Home route '/' on Marketing Standalone renders dedicated Marketing Dashboard
  if (currentPath === '/' && isMarketingStandalone) {
    return (
      <div className="page-enter-active" style={{ width: '100%', height: '100%' }}>
        <EcosystemPluginViewport path="/marketing-dashboard" />
      </div>
    );
  }

  // Check if currentPath matches an Ecosystem Plugin / Full-Clone Route
  const matchedPlugin = matchEcosystemRoute(currentPath);
  if (matchedPlugin) {
    if (!matchedPlugin.publicRoute) {
      const isAddonLocked =
        matchedPlugin.moduleKey === 'education_addon' && !educationAddon;
      const hasRouteAccess =
        !isAddonLocked &&
        ((matchedPlugin.screenKey === 'account' && canScreen('account')) ||
          (hasModule(matchedPlugin.moduleKey) &&
            can(matchedPlugin.moduleKey, 'view') &&
            canScreen(matchedPlugin.screenKey)));

      if (!hasRouteAccess) {
        const fallback = getDefaultRoute();
        return <Navigate to={fallback && fallback !== currentPath ? fallback : '/'} replace />;
      }
    }

    return (
      <div className="page-enter-active" style={{ width: '100%', height: '100%' }}>
        <EcosystemPluginViewport path={currentPath} />
      </div>
    );
  }

  const guard = LEGACY_ROUTE_GUARDS[currentPath];
  if (!guard) {
    const fallback = getDefaultRoute();
    return <Navigate to={fallback && fallback !== currentPath ? fallback : '/'} replace />;
  }

  const canLegacy = (pathKey: string): boolean => {
    const g = LEGACY_ROUTE_GUARDS[pathKey];
    if (!g) return false;
    if (g.ownerRecovery && isTenantOwner) return true;
    const modOk = !g.moduleKey || (hasModule(g.moduleKey) && can(g.moduleKey, 'view'));
    return modOk && canScreen(g.screenKey);
  };

  if (!canLegacy(currentPath)) {
    const fallback = getDefaultRoute();
    if (fallback && fallback !== currentPath) {
      return <Navigate to={fallback} replace />;
    }
    if (isTenantOwner && currentPath !== '/settings') {
      return <Navigate to="/settings" replace />;
    }
  }

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      {!isMarketingStandalone && (
        <>
          {canLegacy('/') && (
            <div
              style={{ display: currentPath === '/' ? 'block' : 'none' }}
              className={currentPath === '/' ? 'page-enter-active' : ''}
            >
              {isPathRendered('/') && (
                <Suspense fallback={<RouteTabSkeleton path="/" />}>
                  <Dashboard />
                </Suspense>
              )}
            </div>
          )}

          {(canLegacy('/data') || canLegacy('/calendar')) && (
            <div
              style={{
                display: currentPath === '/data' || currentPath === '/calendar' ? 'block' : 'none',
              }}
              className={
                currentPath === '/data' || currentPath === '/calendar' ? 'page-enter-active' : ''
              }
            >
              {(isPathRendered('/data') || isPathRendered('/calendar')) && (
                <Suspense fallback={<RouteTabSkeleton path={currentPath} />}>
                  <DataList />
                </Suspense>
              )}
            </div>
          )}

          {canLegacy('/ads-performance') && (
            <div
              style={{ display: currentPath === '/ads-performance' ? 'block' : 'none' }}
              className={currentPath === '/ads-performance' ? 'page-enter-active' : ''}
            >
              {isPathRendered('/ads-performance') && (
                <Suspense fallback={<RouteTabSkeleton path="/ads-performance" />}>
                  <AdsPerformance />
                </Suspense>
              )}
            </div>
          )}

          {canLegacy('/consultants') && (
            <div
              style={{ display: currentPath === '/consultants' ? 'block' : 'none' }}
              className={currentPath === '/consultants' ? 'page-enter-active' : ''}
            >
              {isPathRendered('/consultants') && (
                <Suspense fallback={<RouteTabSkeleton path="/consultants" />}>
                  <Consultants />
                </Suspense>
              )}
            </div>
          )}

          {canLegacy('/rounds') && (
            <div
              style={{ display: currentPath === '/rounds' ? 'block' : 'none' }}
              className={currentPath === '/rounds' ? 'page-enter-active' : ''}
            >
              {isPathRendered('/rounds') && (
                <Suspense fallback={<RouteTabSkeleton path="/rounds" />}>
                  <Rounds />
                </Suspense>
              )}
            </div>
          )}

          {canLegacy('/tickets') && (
            <div
              style={{ display: currentPath === '/tickets' ? 'block' : 'none' }}
              className={currentPath === '/tickets' ? 'page-enter-active' : ''}
            >
              {isPathRendered('/tickets') && (
                <Suspense fallback={<RouteTabSkeleton path="/tickets" />}>
                  <Tickets />
                </Suspense>
              )}
            </div>
          )}

          {canLegacy('/rules') && (
            <div
              style={{ display: currentPath === '/rules' ? 'block' : 'none' }}
              className={currentPath === '/rules' ? 'page-enter-active' : ''}
            >
              {isPathRendered('/rules') && (
                <Suspense fallback={<RouteTabSkeleton path="/rules" />}>
                  <RuleSettings />
                </Suspense>
              )}
            </div>
          )}

          {canLegacy('/integrations') && (
            <div
              style={{ display: currentPath === '/integrations' ? 'block' : 'none' }}
              className={currentPath === '/integrations' ? 'page-enter-active' : ''}
            >
              {isPathRendered('/integrations') && (
                <Suspense fallback={<RouteTabSkeleton path="/integrations" />}>
                  <Integrations />
                </Suspense>
              )}
            </div>
          )}

          {canLegacy('/gatekeeper') && (
            <div
              style={{ display: currentPath === '/gatekeeper' ? 'block' : 'none' }}
              className={currentPath === '/gatekeeper' ? 'page-enter-active' : ''}
            >
              {isPathRendered('/gatekeeper') && (
                <Suspense fallback={<RouteTabSkeleton path="/gatekeeper" />}>
                  <Gatekeeper />
                </Suspense>
              )}
            </div>
          )}

          {canLegacy('/fair-share') && (
            <div
              style={{ display: currentPath === '/fair-share' ? 'block' : 'none' }}
              className={currentPath === '/fair-share' ? 'page-enter-active' : ''}
            >
              {isPathRendered('/fair-share') && (
                <Suspense fallback={<RouteTabSkeleton path="/fair-share" />}>
                  <FairShareAudit />
                </Suspense>
              )}
            </div>
          )}
        </>
      )}

      {canLegacy('/settings') && (
        <div
          style={{ display: currentPath === '/settings' ? 'block' : 'none' }}
          className={currentPath === '/settings' ? 'page-enter-active' : ''}
        >
          {isPathRendered('/settings') && (
            <Suspense fallback={<RouteTabSkeleton path="/settings" />}>
              <Settings />
            </Suspense>
          )}
        </div>
      )}

      {canLegacy('/accounts') && (
        <div
          style={{ display: currentPath === '/accounts' ? 'block' : 'none' }}
          className={currentPath === '/accounts' ? 'page-enter-active' : ''}
        >
          {isPathRendered('/accounts') && (
            <Suspense fallback={<RouteTabSkeleton path="/accounts" />}>
              <Accounts />
            </Suspense>
          )}
        </div>
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
  const { token } = useAuth();
  const { hasModule, can, canScreen, isTenantOwner } = useEntitlement();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [showHelpModal, setShowHelpModal] = useState(false);

  const canOpenSettings = isTenantOwner || canScreen('settings');
  const canOpenAccounts = isTenantOwner || (hasModule('users') && canScreen('accounts'));

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
        if (key === 'n' && hasModule('leads') && can('leads', 'create')) {
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
        const shortcuts: Record<string, string> = {};
        if (canScreen('dashboard')) shortcuts.d = '/';
        if (hasModule('leads') && canScreen('data_list')) shortcuts.l = '/data';
        if (hasModule('audiences') && canScreen('audiences')) shortcuts.m = '/audiences';
        if (hasModule('fair_share') && canScreen('fair_share')) shortcuts.s = '/fair-share';
        if (hasModule('rounds') && canScreen('rounds')) shortcuts.r = '/rounds';
        if (hasModule('consultants') && canScreen('consultants')) shortcuts.c = '/consultants';
        if (hasModule('tickets_data') && canScreen('tickets')) shortcuts.t = '/tickets';
        if (hasModule('routing_rules') && canScreen('routing_rules')) shortcuts.w = '/rules';
        if (hasModule('integrations_autodata') && canScreen('integrations')) shortcuts.i = '/integrations';
        if (hasModule('integrations_marketing') && canScreen('marketing_connect')) {
          shortcuts.k = '/marketing-connect';
        }
        if (canOpenSettings) shortcuts.o = '/settings';
        if (hasModule('gatekeeper') && canScreen('gatekeeper')) shortcuts.g = '/gatekeeper';
        if (canOpenAccounts) shortcuts.a = '/accounts';

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
  }, [navigate, token, hasModule, can, canScreen, canOpenSettings, canOpenAccounts]);

  if (!token) return null;
  const hasSecondaryShortcuts =
    (hasModule('rounds') && canScreen('rounds')) ||
    (hasModule('routing_rules') && canScreen('routing_rules')) ||
    (hasModule('integrations_marketing') && canScreen('marketing_connect')) ||
    canOpenSettings;

  return (
    <CustomModal
      isOpen={showHelpModal}
      onClose={() => setShowHelpModal(false)}
      title={t('Bảng phím tắt điều hướng nhanh')}
      width="650px"
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', padding: '0.5rem 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#1E40FF' }}>
          <Keyboard size={20} />
          <span style={{ fontSize: '0.875rem', fontWeight: 700 }}>
            {t('Mẹo: Nhấn Ctrl/Cmd + K để mở Command Palette hoặc Alt + [Phím] để điều hướng')}
          </span>
        </div>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: hasSecondaryShortcuts ? '1fr 1fr' : '1fr',
            gap: '1.5rem',
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <div style={{ fontSize: '0.8125rem' }}>
              Command Palette — <strong>Ctrl / Cmd + K</strong>
            </div>
            {canScreen('dashboard') && (
              <div style={{ fontSize: '0.8125rem' }}>
                Dashboard — <strong>Alt + D</strong>
              </div>
            )}
            {hasModule('leads') && canScreen('data_list') && (
              <div style={{ fontSize: '0.8125rem' }}>
                Quản lý Data — <strong>Alt + L</strong>
              </div>
            )}
            {hasModule('audiences') && canScreen('audiences') && (
              <div style={{ fontSize: '0.8125rem' }}>
                Tệp Data &amp; Tệp Logic — <strong>Alt + M</strong>
              </div>
            )}
            <div style={{ fontSize: '0.8125rem' }}>
              Bản tin hoạt động — <strong>Alt + H</strong>
            </div>
          </div>
          {hasSecondaryShortcuts && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {hasModule('rounds') && canScreen('rounds') && (
                <div style={{ fontSize: '0.8125rem' }}>
                  Vòng phân bổ — <strong>Alt + R</strong>
                </div>
              )}
              {hasModule('routing_rules') && canScreen('routing_rules') && (
                <div style={{ fontSize: '0.8125rem' }}>
                  Logic xử lý — <strong>Alt + W</strong>
                </div>
              )}
              {hasModule('integrations_marketing') && canScreen('marketing_connect') && (
                <div style={{ fontSize: '0.8125rem' }}>
                  Kết nối SES / ZNS / SDK — <strong>Alt + K</strong>
                </div>
              )}
              {canOpenSettings && (
                <div style={{ fontSize: '0.8125rem' }}>
                  Cài đặt — <strong>Alt + O</strong>
                </div>
              )}
            </div>
          )}
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button
            className="btn primary"
            style={{ minHeight: '44px', padding: '0 20px' }}
            onClick={() => setShowHelpModal(false)}
          >
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

  const sessionDefaultRoute = (session as TenantSessionV2 & { default_route?: string }).default_route;
  const initialRoute =
    initialView === 'report_data'
      ? '/report-data'
      : initialView === 'integrations'
      ? '/integrations'
      : initialView === 'audiences'
      ? '/audiences'
      : initialView === 'marketing_connect'
      ? '/marketing-connect'
      : initialView === 'growth_attribution'
      ? '/growth-attribution'
      : sessionDefaultRoute && sessionDefaultRoute.startsWith('/')
      ? sessionDefaultRoute
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
                <Suspense fallback={<RouteTabSkeleton />}>
                  <Routes>
                    <Route path="/report-data" element={<ReportData />} />
                    <Route path="/sale-portal" element={<SalePortalGate />} />
                    <Route path="/booking/:slug" element={<PublicViewportRoute />} />
                    <Route path="/public-booking/1on1/:slug" element={<PublicViewportRoute />} />
                    <Route path="/s/:slug" element={<PublicViewportRoute />} />
                    <Route path="/s/:tenant/:slug" element={<PublicViewportRoute />} />
                    <Route path="/claim/:id" element={<PublicViewportRoute />} />
                    <Route path="/schedule/:slug" element={<PublicViewportRoute />} />
                    <Route path="/public-schedule/:slug" element={<PublicViewportRoute />} />
                    <Route path="/docs/api-v1" element={<PublicViewportRoute />} />
                    <Route element={<ProtectedRoute />}>
                      <Route path="/*" element={<AppTabs />} />
                    </Route>
                  </Routes>
                  <KeyboardShortcutsController />
                  <ShellFloatingWidgets />
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
