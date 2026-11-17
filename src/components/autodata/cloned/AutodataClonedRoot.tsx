import React, { lazy, Suspense, useEffect, useMemo, useState } from 'react';
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
import { Keyboard, ShieldAlert } from 'lucide-react';
import './styles/autodataCloned.css';

import { Layout } from './components/Layout/Layout';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { EntitlementProvider, useEntitlement } from './contexts/EntitlementContext';
import { LanguageProvider, useLanguage } from './contexts/LanguageContext';
import { TenantConfigProvider } from './contexts/TenantConfigContext';
import { UploadProgressProvider } from './contexts/UploadProgressContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import { CustomModal } from './components/ui/CustomModal';
import { RouteTabSkeleton, PublicRouteSkeleton } from './components/ui/Skeleton';
import { GlobalConfirmModal } from './components/ui/GlobalConfirmModal';
import { NetworkStatusIndicator } from './components/ui/NetworkStatusIndicator';
import { NotificationSettingsModal } from './components/ui/NotificationSettingsModal';
import { preloadWorkspaceWallpapers } from './components/ui/WorkspaceCustomizerModal';
import { getDefaultDateFilter } from './utils/api';
import { popAndCloseTopOverlay, hasOpenOverlays } from './utils/overlayStack';
import {
  canAccessRoutePath,
  canAccessRouteRule,
  normalizeRoutePathname,
  resolveRouteAccessRule,
  type RouteAccessRule,
  type RouteGateApi,
} from './config/routeAccess';
import { apiRequest } from '../autodataApi';
import { AutoDataSpotlightTour } from '../AutoDataHelpTour';
import { SCREEN_TOUR_DECKS } from '../autoDataScreenTours';
import { BillingView } from '../pages/BillingView';
import { matchEcosystemRoute } from './modules/registryMeta';
import { EcosystemPluginViewport } from './modules/registry';
import type { TenantSessionV2, WorkspaceScreenKey } from '../autodataTypes';

// ============================ Global overlays (lazy, MYERP parity) ============================
const GlobalEntityDrawers = lazy(() =>
  import('./components/ui/GlobalEntityDrawers').then((m) => ({ default: m.GlobalEntityDrawers }))
);
const ChatFloatingLauncher = lazy(() =>
  import('./components/chat/ChatFloatingLauncher').then((m) => ({ default: m.ChatFloatingLauncher }))
);
const QRCodeCallModal = lazy(() =>
  import('./components/ui/QRCodeCallModal').then((m) => ({ default: m.QRCodeCallModal }))
);
const ProfileModal = lazy(() =>
  import('./components/ProfileModal').then((m) => ({ default: m.ProfileModal }))
);
const CommandPalette = lazy(() =>
  import('./components/ui/CommandPalette').then((m) => ({ default: m.CommandPalette }))
);

// ============================ Real MYERP pages (code-split) ============================
const Dashboard = lazy(() => import('./pages/Dashboard').then((m) => ({ default: m.Dashboard })));
const Consultants = lazy(() => import('./pages/Consultants').then((m) => ({ default: m.Consultants })));
const Rounds = lazy(() => import('./pages/Rounds').then((m) => ({ default: m.Rounds })));
const Tickets = lazy(() => import('./pages/Tickets').then((m) => ({ default: m.Tickets })));
const RuleSettings = lazy(() => import('./pages/RuleSettings').then((m) => ({ default: m.RuleSettings })));
const Integrations = lazy(() => import('./pages/Integrations').then((m) => ({ default: m.Integrations })));
const Settings = lazy(() => import('./pages/Settings').then((m) => ({ default: m.Settings })));
const Gatekeeper = lazy(() => import('./pages/Gatekeeper').then((m) => ({ default: m.Gatekeeper })));
const DataList = lazy(() => import('./pages/DataList').then((m) => ({ default: m.DataList })));
const Accounts = lazy(() => import('./pages/Accounts').then((m) => ({ default: m.Accounts })));
const ReportData = lazy(() => import('./pages/ReportData').then((m) => ({ default: m.ReportData })));
const SalePortal = lazy(() => import('./pages/SalePortal').then((m) => ({ default: m.SalePortal })));
const FairShareAudit = lazy(() =>
  import('./pages/FairShareAudit').then((m) => ({ default: m.FairShareAudit }))
);
const AdsPerformance = lazy(() =>
  import('./pages/AdsPerformance').then((m) => ({ default: m.AdsPerformance }))
);
const FinancialDashboard = lazy(() =>
  import('./pages/FinancialDashboard').then((m) => ({ default: m.FinancialDashboard }))
);
const ContactsPage = lazy(() => import('./pages/ContactsPage').then((m) => ({ default: m.ContactsPage })));
const CompaniesPage = lazy(() =>
  import('./pages/CompaniesPage').then((m) => ({ default: m.CompaniesPage }))
);
const DealsPage = lazy(() => import('./pages/DealsPage').then((m) => ({ default: m.DealsPage })));
const QuotesPage = lazy(() => import('./pages/QuotesPage').then((m) => ({ default: m.QuotesPage })));
const ActivitiesPage = lazy(() =>
  import('./pages/ActivitiesPage').then((m) => ({ default: m.ActivitiesPage }))
);
const ProductsPage = lazy(() => import('./pages/ProductsPage').then((m) => ({ default: m.ProductsPage })));
const ExpensesPage = lazy(() => import('./pages/ExpensesPage').then((m) => ({ default: m.ExpensesPage })));
const ReportsPage = lazy(() => import('./pages/ReportsPage').then((m) => ({ default: m.ReportsPage })));
const SuppliersPage = lazy(() =>
  import('./pages/SuppliersPage').then((m) => ({ default: m.SuppliersPage }))
);
const FilesPage = lazy(() => import('./pages/FilesPage').then((m) => ({ default: m.FilesPage })));
const InvoicesPage = lazy(() => import('./pages/InvoicesPage').then((m) => ({ default: m.InvoicesPage })));
const InventoryPage = lazy(() => import('./pages/InventoryPage'));
const ProjectsPage = lazy(() => import('./pages/ProjectsPage'));
const DepositsPage = lazy(() => import('./pages/DepositsPage'));
const CooperationSlipsPage = lazy(() => import('./pages/CooperationSlipsPage'));
const AttendancePage = lazy(() =>
  import('./pages/AttendancePage').then((m) => ({ default: m.AttendancePage }))
);
const TicketsPage = lazy(() => import('./pages/TicketsPage').then((m) => ({ default: m.TicketsPage })));
const AITrainingPage = lazy(() =>
  import('./pages/AITrainingPage').then((m) => ({ default: m.AITrainingPage }))
);
const QwenAgentLabPage = lazy(() =>
  import('./pages/QwenAgentLabPage').then((m) => ({ default: m.QwenAgentLabPage }))
);
const HRM = lazy(() => import('./pages/HRM'));
const HrmAccountingAzWorkspace = lazy(() =>
  import('./components/HRM/HrmAccountingAzWorkspace').then((m) => ({
    default: m.HrmAccountingAzWorkspace,
  }))
);
const MyPayslips = lazy(() => import('./pages/MyPayslips'));
const Approvals = lazy(() => import('./pages/Approvals'));
const EnterpriseFeed = lazy(() =>
  import('./pages/EnterpriseFeed').then((m) => ({ default: m.EnterpriseFeed }))
);
const InternalSchedulePage = lazy(() =>
  import('./pages/InternalSchedulePage').then((m) => ({ default: m.InternalSchedulePage }))
);
const AboutErpPage = lazy(() => import('./pages/AboutErpPage'));
const DocumentationPage = lazy(() => import('./pages/DocumentationPage'));
const ApiV1DocumentationPage = lazy(() => import('./pages/ApiV1DocumentationPage'));
const PublicSchedulePage = lazy(() =>
  import('./pages/PublicSchedulePage').then((m) => ({ default: m.PublicSchedulePage }))
);
const PublicBooking1on1Page = lazy(() =>
  import('./pages/PublicBooking1on1Page').then((m) => ({ default: m.PublicBooking1on1Page }))
);
const MarketingDashboardPage = lazy(() => import('./pages/marketing/MarketingDashboardPage'));
const AutomationFlowsPage = lazy(() => import('./pages/marketing/AutomationFlowsPage'));
const EmailCampaignsPage = lazy(() => import('./pages/marketing/EmailCampaignsPage'));
const EmailTemplatesPage = lazy(() => import('./pages/marketing/EmailTemplatesPage'));
const AudienceSegmentsPage = lazy(() => import('./pages/marketing/AudienceSegmentsPage'));
const SurveysQuizPage = lazy(() => import('./pages/marketing/SurveysQuizPage'));
const PublicSurveyPage = lazy(() => import('./pages/marketing/PublicSurveyPage'));
const VouchersQrPage = lazy(() => import('./pages/marketing/VouchersQrPage'));
const PublicVoucherClaimPage = lazy(() => import('./pages/marketing/PublicVoucherClaimPage'));
const WebTrackingOmnichannelPage = lazy(() => import('./pages/marketing/WebTrackingOmnichannelPage'));
const SocialBotPage = lazy(() => import('./pages/marketing/SocialBotPage'));
const AITrainingMarketingPage = lazy(() => import('./pages/marketing/AITrainingPage'));
const ApiTriggersPage = lazy(() => import('./pages/marketing/ApiTriggersPage'));
const CapiPage = lazy(() => import('./pages/CapiPage'));

// ============================ Helpers ============================
const AccessDeniedView: React.FC = () => (
  <div
    style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '60vh',
      gap: '14px',
      color: 'var(--color-text-muted, #64748B)',
    }}
  >
    <ShieldAlert size={52} style={{ color: 'var(--color-warning, #f59e0b)' }} />
    <h3 style={{ margin: 0, color: 'var(--color-text, #0F172A)', fontSize: '1.25rem', fontWeight: 800 }}>
      Không có quyền truy cập
    </h3>
    <p style={{ margin: 0, fontSize: '0.875rem' }}>
      Bạn không có quyền truy cập vào mục này. Vui lòng liên hệ ban quản trị nếu cần phân quyền.
    </p>
  </div>
);

const MarketingScope: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="mkt-scope">{children}</div>
);

const useRouteGateApi = (): RouteGateApi => {
  const { hasModule, can, canScreen, isTenantOwner, educationAddon } = useEntitlement();
  return useMemo(
    () => ({ hasModule, can, canScreen, isTenantOwner, educationAddon }),
    [hasModule, can, canScreen, isTenantOwner, educationAddon]
  );
};

/** Effective rule for a path; Marketing Standalone home `/` maps to the Marketing dashboard. */
function resolveEffectiveRule(path: string, isMarketingStandalone: boolean): RouteAccessRule | undefined {
  if (path === '/' && isMarketingStandalone) return resolveRouteAccessRule('/marketing');
  return resolveRouteAccessRule(path);
}

function mapPathToScreenKey(
  pathname: string,
  isMarketingStandalone?: boolean
): WorkspaceScreenKey | 'sale_portal' {
  if (pathname === '/sale-portal') return 'sale_portal';
  if (pathname === '/' && isMarketingStandalone) return 'mkt_dashboard';
  const rule = resolveRouteAccessRule(pathname);
  if (rule && rule.screenKey in SCREEN_TOUR_DECKS) {
    return rule.screenKey as WorkspaceScreenKey;
  }
  const pluginMatch = matchEcosystemRoute(pathname);
  if (pluginMatch && pluginMatch.screenKey in SCREEN_TOUR_DECKS) {
    return pluginMatch.screenKey as WorkspaceScreenKey;
  }
  if (rule?.screenKey === 'calendar') return 'data_list';
  return (rule?.screenKey as WorkspaceScreenKey) || 'dashboard';
}

// ============================ Shell floating widgets ============================
const ShellFloatingWidgets: React.FC = () => {
  const { token, user } = useAuth();
  const { packageCode, hasModule, can } = useEntitlement();
  if (!token || !user) return null;
  // WorkChat launcher is an ERP module: never on Package 1 (autodata_crm)
  const allowWorkchat =
    packageCode !== 'autodata_crm' && hasModule('erp_workchat') && can('erp_workchat', 'view');

  return (
    <>
      <GlobalConfirmModal />
      <NetworkStatusIndicator />
      <NotificationSettingsModal />
      <Suspense fallback={null}>
        <QRCodeCallModal />
      </Suspense>
      <Suspense fallback={null}>
        <ProfileModal />
      </Suspense>
      <Suspense fallback={null}>
        <CommandPalette />
      </Suspense>
      <Suspense fallback={null}>
        <GlobalEntityDrawers />
      </Suspense>
      {allowWorkchat && (
        <Suspense fallback={null}>
          <ChatFloatingLauncher />
        </Suspense>
      )}
    </>
  );
};

// ============================ Routes ============================
const PublicViewportRoute: React.FC = () => {
  const location = useLocation();
  return (
    <ErrorBoundary resetKey={location.pathname}>
      <Suspense fallback={<RouteTabSkeleton path={location.pathname} />}>
        <EcosystemPluginViewport path={location.pathname} />
      </Suspense>
    </ErrorBoundary>
  );
};

const PublicPage: React.FC<{ children: React.ReactNode; marketing?: boolean }> = ({
  children,
  marketing,
}) => (
  <ErrorBoundary>
    <Suspense fallback={<PublicRouteSkeleton />}>
      {marketing ? <MarketingScope>{children}</MarketingScope> : children}
    </Suspense>
  </ErrorBoundary>
);

const ProtectedRoute: React.FC = () => {
  const { user, token } = useAuth();
  const { packageCode, canScreen, getDefaultRoute } = useEntitlement();
  const location = useLocation();

  if (!token || !user) return null;

  // Users without the Dashboard screen land on their RBAC default route (e.g. Sale Portal / Workspace)
  if (location.pathname === '/' && packageCode !== 'marketing_standalone' && !canScreen('dashboard')) {
    const target = getDefaultRoute();
    if (target && target !== '/') {
      return <Navigate to={target} replace />;
    }
  }

  return (
    <Layout>
      <ErrorBoundary resetKey={location.pathname}>
        <Suspense fallback={<RouteTabSkeleton path={location.pathname} />}>
          <Outlet />
        </Suspense>
      </ErrorBoundary>
    </Layout>
  );
};

const SalePortalGate: React.FC = () => {
  const gate = useRouteGateApi();
  const { getDefaultRoute } = useEntitlement();
  if (!canAccessRoutePath('/sale-portal', gate)) {
    const fallback = getDefaultRoute();
    return <Navigate to={fallback !== '/sale-portal' ? fallback : '/'} replace />;
  }
  return (
    <Suspense fallback={<RouteTabSkeleton path="/sale-portal" />}>
      <SalePortal />
    </Suspense>
  );
};

/** Maps every cached tab path onto its real MYERP page component. */
function renderPageComponent(path: string, isMarketingStandalone: boolean): React.ReactNode {
  switch (path) {
    case '/':
      if (isMarketingStandalone) {
        return (
          <MarketingScope key="marketing-home">
            <MarketingDashboardPage />
          </MarketingScope>
        );
      }
      return <Dashboard key="dashboard" />;
    case '/workspace':
      return <SalePortal embedMode={true} activeTabProp="workspace" key="workspace" />;
    case '/account':
      return <SalePortal embedMode={true} activeTabProp="schedule" key="schedule" />;
    case '/data':
    case '/leads':
      return <DataList key="data" />;
    case '/calendar':
      return <SalePortal embedMode={true} activeTabProp="calendar" key="calendar" />;
    case '/personal-calendar':
      return <SalePortal embedMode={true} activeTabProp="calendar" key="personal-calendar" />;
    case '/contacts':
      return <ContactsPage key="contacts" defaultSegment="tiem_nang" />;
    case '/students':
      return <ContactsPage key="students" defaultSegment="customer" />;
    case '/companies':
      return <CompaniesPage key="companies" />;
    case '/deals':
      return <DealsPage key="deals" />;
    case '/quotes':
      return <QuotesPage key="quotes" />;
    case '/activities':
      return <ActivitiesPage key="activities" />;
    case '/feed':
    case '/erp/workchat':
      return <EnterpriseFeed key={path} />;
    case '/products':
      return <ProductsPage key="products" />;
    case '/expenses':
      return <ExpensesPage key="expenses" />;
    case '/reports-crm':
      return <ReportsPage key="reports-crm" />;
    case '/suppliers':
      return <SuppliersPage key="suppliers" />;
    case '/files':
    case '/erp/cloud-files':
      return <FilesPage key={path} />;
    case '/invoices':
      return <InvoicesPage key="invoices" />;
    case '/inventory':
    case '/purchase-orders':
      return <InventoryPage key={path} />;
    case '/sales-orders':
      return <DepositsPage key="sales-orders" defaultTab="list" />;
    case '/ads-performance':
      return <AdsPerformance key="ads-performance" />;
    case '/tickets':
      return <Tickets key="tickets" />;
    case '/support-tickets':
      return <TicketsPage key="support-tickets" />;
    case '/schedules':
    case '/erp/education':
      return <InternalSchedulePage key={path} />;
    case '/consultants':
      return <Consultants key="consultants" />;
    case '/rounds':
      return <Rounds key="rounds" />;
    case '/rules':
    case '/rule-settings':
      return <RuleSettings key="rules" />;
    case '/integrations':
      return <Integrations key="integrations" />;
    case '/settings':
      return <Settings key="settings" />;
    case '/accounts':
      return <Accounts key="accounts" />;
    case '/gatekeeper':
      return <Gatekeeper key="gatekeeper" />;
    case '/fair-share':
      return <FairShareAudit key="fair-share" />;
    case '/ai-training':
      return <AITrainingPage key="ai-training" />;
    case '/qwen-agent-lab':
    case '/dom-agent':
      return <QwenAgentLabPage key={path} />;
    case '/attendance':
    case '/erp/attendance':
      return <AttendancePage key={path} />;
    case '/projects':
    case '/erp/projects':
      return <ProjectsPage key={path} />;
    case '/deposits':
      return <DepositsPage key="deposits" defaultTab="list" />;
    case '/cooperation-slips':
    case '/cooperations':
      return <CooperationSlipsPage key="cooperation-slips" />;
    case '/cash-flow':
      return <DepositsPage key="cash-flow" defaultTab="stats" />;
    case '/hrm':
    case '/erp/hrm':
    case '/erp/payroll':
      return <HRM key={path} />;
    case '/accounting-az':
      return (
        <div key="accounting-az" style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <HrmAccountingAzWorkspace embedMode={false} />
        </div>
      );
    case '/my-payslips':
      return <MyPayslips key="my-payslips" />;
    case '/approvals':
    case '/erp/approvals':
      return <Approvals key={path} />;
    case '/financial-dashboard':
    case '/erp/finance':
      return <FinancialDashboard key={path} />;
    case '/marketing':
    case '/marketing-dashboard':
      return (
        <MarketingScope key={path}>
          <MarketingDashboardPage />
        </MarketingScope>
      );
    case '/marketing/flows':
      return (
        <MarketingScope key="marketing-flows">
          <AutomationFlowsPage />
        </MarketingScope>
      );
    case '/marketing/campaigns':
      return (
        <MarketingScope key="marketing-campaigns">
          <EmailCampaignsPage />
        </MarketingScope>
      );
    case '/marketing/templates':
      return (
        <MarketingScope key="marketing-templates">
          <EmailTemplatesPage />
        </MarketingScope>
      );
    case '/marketing/audience':
    case '/audiences':
      return (
        <MarketingScope key={path}>
          <AudienceSegmentsPage />
        </MarketingScope>
      );
    case '/marketing/surveys':
    case '/marketing/forms':
      return (
        <MarketingScope key={path}>
          <SurveysQuizPage />
        </MarketingScope>
      );
    case '/marketing/vouchers':
      return (
        <MarketingScope key="marketing-vouchers">
          <VouchersQrPage />
        </MarketingScope>
      );
    case '/marketing/social-bot':
      return (
        <MarketingScope key="marketing-social-bot">
          <SocialBotPage />
        </MarketingScope>
      );
    case '/marketing/ai-training':
      return (
        <MarketingScope key="marketing-ai-training">
          <AITrainingMarketingPage />
        </MarketingScope>
      );
    case '/marketing/web-tracking':
      return (
        <MarketingScope key="marketing-web-tracking">
          <WebTrackingOmnichannelPage />
        </MarketingScope>
      );
    case '/marketing/api-triggers':
    case '/marketing-connect':
      return (
        <MarketingScope key={path}>
          <ApiTriggersPage />
        </MarketingScope>
      );
    case '/capi':
    case '/marketing/capi':
      return <CapiPage key="capi-page" />;
    case '/about-erp':
      return <AboutErpPage key="about-erp" />;
    default:
      if (path.startsWith('/marketing/surveys/')) {
        return (
          <MarketingScope key={path}>
            <SurveysQuizPage />
          </MarketingScope>
        );
      }
      if (path.startsWith('/ai-space/') || path.startsWith('/chat/') || path.startsWith('/marketing/ai-space/')) {
        return (
          <MarketingScope key={path}>
            <AITrainingMarketingPage />
          </MarketingScope>
        );
      }
      return <AccessDeniedView key={`denied-${path}`} />;
  }
}

/**
 * AppTabs — keeps every visited page DOM alive (visitedPaths tab cache, MYERP parity) so switching
 * tabs never unmounts/remounts pages. Each tab suspends with its own per-route skeleton.
 */
const AppTabs: React.FC = () => {
  const { user } = useAuth();
  const { packageCode, getDefaultRoute, isTenantOwner, hasModule, can, canScreen, educationAddon } =
    useEntitlement();
  const gate = useRouteGateApi();
  const location = useLocation();
  const currentPath = normalizeRoutePathname(location.pathname);
  const isMarketingStandalone = packageCode === 'marketing_standalone';

  const [visitedPaths, setVisitedPaths] = useState<string[]>(() => [currentPath]);
  const [refreshKeys, setRefreshKeys] = useState<Record<string, number>>({});

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

  useEffect(() => {
    const handleRefresh = (e: Event) => {
      const p = (e as CustomEvent<{ path?: string }>).detail?.path;
      if (p) {
        setRefreshKeys((prev) => ({ ...prev, [p]: (prev[p] || 0) + 1 }));
      }
    };
    window.addEventListener('refresh-page', handleRefresh);
    return () => window.removeEventListener('refresh-page', handleRefresh);
  }, []);

  // `/erp/workchat` deep-link opens the WorkChat modal over the internal Feed tab
  useEffect(() => {
    if (currentPath === '/erp/workchat') {
      window.dispatchEvent(new CustomEvent('myerp:open-chat-conversation', { detail: {} }));
    }
  }, [currentPath]);

  if (!user) {
    return <RouteTabSkeleton path={currentPath} />;
  }

  // Marketing Standalone uses the Marketing Connect hub instead of the AutoData integrations screen
  if (currentPath === '/integrations' && isMarketingStandalone) {
    return <Navigate to="/marketing-connect" replace />;
  }

  const currentRule = resolveEffectiveRule(currentPath, isMarketingStandalone);

  // Ecosystem-only descriptors without a real MYERP page (e.g. /growth-attribution)
  if (!currentRule) {
    const matchedPlugin = matchEcosystemRoute(currentPath);
    if (matchedPlugin && !matchedPlugin.publicRoute) {
      const isAddonLocked = matchedPlugin.moduleKey === 'education_addon' && !educationAddon;
      const allowed =
        !isAddonLocked &&
        hasModule(matchedPlugin.moduleKey) &&
        can(matchedPlugin.moduleKey, 'view') &&
        canScreen(matchedPlugin.screenKey);
      if (!allowed) {
        const fallback = getDefaultRoute();
        return <Navigate to={fallback && fallback !== currentPath ? fallback : '/'} replace />;
      }
      return (
        <div className="page-enter-active" style={{ width: '100%', height: '100%' }}>
          <ErrorBoundary resetKey={currentPath}>
            <Suspense fallback={<RouteTabSkeleton path={currentPath} />}>
              <EcosystemPluginViewport path={currentPath} />
            </Suspense>
          </ErrorBoundary>
        </div>
      );
    }
    const fallback = getDefaultRoute();
    if (fallback && fallback !== currentPath) {
      return <Navigate to={fallback} replace />;
    }
    return <AccessDeniedView />;
  }

  if (!canAccessRouteRule(currentRule, gate)) {
    const fallback = getDefaultRoute();
    if (fallback && fallback !== currentPath && canAccessRoutePath(fallback, gate)) {
      return <Navigate to={fallback} replace />;
    }
    if (isTenantOwner && currentPath !== '/settings') {
      return <Navigate to="/settings" replace />;
    }
    return <AccessDeniedView />;
  }

  const effectiveVisitedPaths = (
    visitedPaths.includes(currentPath) ? visitedPaths : [...visitedPaths, currentPath]
  ).filter((p) => p === currentPath || canAccessRouteRule(resolveEffectiveRule(p, isMarketingStandalone), gate));

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      {effectiveVisitedPaths.map((path) => {
        const isActive = path === currentPath;
        const rKey = refreshKeys[path] || 0;
        return (
          <div
            key={`${path}_${rKey}`}
            className={isActive ? 'page-enter-active' : undefined}
            style={{
              display: isActive ? 'block' : 'none',
              width: '100%',
              height: '100%',
              position: 'relative',
              contain: isActive ? 'none' : 'strict',
              contentVisibility: isActive ? 'visible' : 'hidden',
            }}
          >
            <ErrorBoundary
              resetKey={`${path}_${rKey}`}
              onReset={() => setRefreshKeys((prev) => ({ ...prev, [path]: (prev[path] || 0) + 1 }))}
            >
              <Suspense fallback={<RouteTabSkeleton path={path} />}>
                {renderPageComponent(path, isMarketingStandalone)}
              </Suspense>
            </ErrorBoundary>
          </div>
        );
      })}
    </div>
  );
};

// ============================ Tour ============================
const TourController: React.FC<{
  open: boolean;
  onClose: () => void;
  deckKey?: string | null;
}> = ({ open, onClose, deckKey }) => {
  const { v2Session } = useAuth();
  const { packageCode } = useEntitlement();
  const location = useLocation();
  const [stepIdx, setStepIdx] = useState(0);

  const isMktOnly = packageCode === 'marketing_standalone';

  const resolveEffectiveScreenKey = (): WorkspaceScreenKey | 'sale_portal' => {
    if (deckKey && deckKey in SCREEN_TOUR_DECKS) {
      return deckKey as WorkspaceScreenKey | 'sale_portal';
    }
    const baseKey = mapPathToScreenKey(location.pathname, isMktOnly);
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

// ============================ Keyboard shortcuts (MYERP ergonomics + RBAC filtered) ============================
interface ShortcutDef {
  key: string;
  path: string;
  label: string;
}

const ALT_SHORTCUTS: ReadonlyArray<ShortcutDef> = [
  { key: 'd', path: '/', label: 'Trang chủ Dashboard' },
  { key: 'l', path: '/data', label: 'Quản lý Data (Lead)' },
  { key: 'm', path: '/audiences', label: 'Tệp Data & Tệp Logic' },
  { key: 's', path: '/fair-share', label: 'Đối soát Công bằng (Fair Share)' },
  { key: 'r', path: '/rounds', label: 'Vòng phân bổ (Rounds)' },
  { key: 'c', path: '/consultants', label: 'Chuyên viên Kinh doanh' },
  { key: 't', path: '/tickets', label: 'Ticket Lỗi Data' },
  { key: 'w', path: '/rules', label: 'Logic xử lý (Rules)' },
  { key: 'i', path: '/integrations', label: 'Tích hợp Data' },
  { key: 'k', path: '/marketing-connect', label: 'Kết nối SES / ZNS / SDK' },
  { key: 'g', path: '/gatekeeper', label: 'AI Pre-screener' },
  { key: 'o', path: '/settings', label: 'Cài đặt hệ thống' },
  { key: 'a', path: '/accounts', label: 'Quản lý tài khoản' },
];

const KeyboardShortcutsController: React.FC = () => {
  const { token } = useAuth();
  const { hasModule, can } = useEntitlement();
  const gate = useRouteGateApi();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [showHelpModal, setShowHelpModal] = useState(false);

  const availableShortcuts = useMemo(
    () => ALT_SHORTCUTS.filter((s) => canAccessRoutePath(s.path, gate)),
    [gate]
  );
  const canQuickAddLead = hasModule('leads') && can('leads', 'create');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Vietnamese IME protection (Telex/VNI composition)
      if (e.isComposing || e.keyCode === 229) return;

      const activeEl = document.activeElement;
      const isInputActive =
        activeEl &&
        (activeEl.tagName === 'INPUT' ||
          activeEl.tagName === 'TEXTAREA' ||
          activeEl.tagName === 'SELECT' ||
          activeEl.hasAttribute('contenteditable'));

      // ESC: LIFO overlay stack first
      if (e.key === 'Escape') {
        if (popAndCloseTopOverlay()) {
          e.preventDefault();
          e.stopPropagation();
          return;
        }
        if (isInputActive) {
          (activeEl as HTMLElement).blur();
          return;
        }
        setShowHelpModal(false);
        return;
      }

      // Ctrl/Cmd + S: save active form
      if ((e.ctrlKey || e.metaKey) && (e.key === 's' || e.key === 'S')) {
        e.preventDefault();
        e.stopPropagation();
        window.dispatchEvent(new CustomEvent('erp-save-active-form'));
        const activeModal = document.querySelector(
          '.custom-modal-overlay, [class*="modal"], [class*="drawer"]'
        );
        if (activeModal) {
          const submitBtn = activeModal.querySelector<HTMLButtonElement>(
            'button[type="submit"], button.btn.primary, button[class*="primary"]'
          );
          if (submitBtn && !submitBtn.disabled) submitBtn.click();
        }
        return;
      }

      if (isInputActive) return;

      // J / K or ArrowDown / ArrowUp table row navigation
      const isDown = e.key === 'j' || e.key === 'J' || (e.key === 'ArrowDown' && !e.altKey && !e.ctrlKey && !e.metaKey);
      const isUp = e.key === 'k' || e.key === 'K' || (e.key === 'ArrowUp' && !e.altKey && !e.ctrlKey && !e.metaKey);
      if ((isDown || isUp) && !e.altKey) {
        if (!hasOpenOverlays()) {
          const focusedRow = document.querySelector<HTMLElement>('tr.erp-row-focused, tr[data-focused="true"]');
          const allRows = Array.from(
            document.querySelectorAll<HTMLElement>('.autodata-app-root table tbody tr:not(.empty-row)')
          ).filter((row) => row.offsetParent !== null);
          if (allRows.length > 0) {
            e.preventDefault();
            let nextIdx = isDown ? 0 : allRows.length - 1;
            if (focusedRow) {
              focusedRow.classList.remove('erp-row-focused');
              focusedRow.removeAttribute('data-focused');
              const currentIdx = allRows.indexOf(focusedRow);
              if (currentIdx >= 0) {
                nextIdx = isDown
                  ? Math.min(allRows.length - 1, currentIdx + 1)
                  : Math.max(0, currentIdx - 1);
              }
            }
            const nextRow = allRows[nextIdx];
            if (nextRow) {
              nextRow.classList.add('erp-row-focused');
              nextRow.setAttribute('data-focused', 'true');
              nextRow.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
            }
          }
        }
        return;
      }

      // Enter opens the focused row
      if (e.key === 'Enter' && !hasOpenOverlays()) {
        const focusedRow = document.querySelector<HTMLElement>('tr.erp-row-focused, tr[data-focused="true"]');
        if (focusedRow) {
          e.preventDefault();
          const clickable =
            focusedRow.querySelector<HTMLElement>('button, a, [role="button"]') || focusedRow;
          clickable.click();
          return;
        }
      }

      if (e.key === '?' || (e.key === '/' && e.shiftKey)) {
        e.preventDefault();
        setShowHelpModal((p) => !p);
        return;
      }

      if (e.altKey && !e.ctrlKey && !e.metaKey) {
        const key = e.key.toLowerCase();
        if (key === 'n' && canQuickAddLead) {
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
        const match = availableShortcuts.find((s) => s.key === key);
        if (match) {
          e.preventDefault();
          navigate(match.path);
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
  }, [navigate, token, availableShortcuts, canQuickAddLead]);

  if (!token) return null;

  const kbdStyle: React.CSSProperties = {
    background: 'var(--color-surface, #FFFFFF)',
    border: '1px solid var(--color-border, #E2E8F0)',
    borderBottomWidth: '2px',
    borderRadius: '6px',
    padding: '3px 8px',
    fontSize: '0.75rem',
    fontFamily: 'monospace',
    fontWeight: 800,
    color: '#1E40FF',
    userSelect: 'none',
    whiteSpace: 'nowrap',
  };
  const rowStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '12px',
    fontSize: '0.8125rem',
  };
  const headingStyle: React.CSSProperties = {
    fontSize: '0.8125rem',
    fontWeight: 800,
    color: '#1E40FF',
    textTransform: 'uppercase',
    margin: '0 0 8px',
    borderBottom: '1px solid var(--color-border-light, #F1F5F9)',
    paddingBottom: '4px',
  };

  const ergonomics: Array<[string, string]> = [
    ['Spotlight Search & Tác vụ', 'Ctrl + K'],
    ['Lưu nhanh biểu mẫu (Save Form)', 'Ctrl + S'],
    ['Đóng Modal / Drawer (LIFO)', 'ESC'],
    ['Xuống / Lên dòng bảng dữ liệu', 'J / K'],
    ['Mở chi tiết dòng đang chọn', 'Enter'],
    ['Bản tin hoạt động hệ thống', 'Alt + H'],
    ['Xem bảng trợ giúp này', '?'],
  ];
  if (canQuickAddLead) ergonomics.splice(5, 0, ['Thêm Data (Lead) nhanh', 'Alt + N']);

  return (
    <CustomModal
      isOpen={showHelpModal}
      onClose={() => setShowHelpModal(false)}
      title={t('Bảng phím tắt công thái học & điều hướng nhanh')}
      width="720px"
    >
      {showHelpModal && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', padding: '0.5rem 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#1E40FF' }}>
            <Keyboard size={20} />
            <span style={{ fontSize: '0.875rem', fontWeight: 700 }}>
              {t('Mẹo: Nhấn Alt + [Chữ cái] để chuyển trang; Ctrl + S để lưu; J / K để duyệt bảng')}
            </span>
          </div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: availableShortcuts.length > 0 ? '1fr 1fr' : '1fr',
              gap: '1.5rem',
            }}
          >
            <div>
              <h4 style={headingStyle}>{t('Công thái học Nhập liệu')}</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {ergonomics.map(([label, combo]) => (
                  <div key={label} style={rowStyle}>
                    <span style={{ color: 'var(--color-text, #0F172A)', fontWeight: 600 }}>{t(label)}</span>
                    <kbd style={kbdStyle}>{combo}</kbd>
                  </div>
                ))}
              </div>
            </div>
            {availableShortcuts.length > 0 && (
              <div>
                <h4 style={headingStyle}>{t('Điều hướng nhanh')}</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {availableShortcuts.map((s) => (
                    <div key={s.key} style={rowStyle}>
                      <span style={{ color: 'var(--color-text, #0F172A)' }}>{t(s.label)}</span>
                      <kbd style={kbdStyle}>Alt + {s.key.toUpperCase()}</kbd>
                    </div>
                  ))}
                </div>
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
      )}
    </CustomModal>
  );
};

// ============================ Root ============================
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
    preloadWorkspaceWallpapers();

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
              <TenantConfigProvider>
                <UploadProgressProvider>
                  <Toaster
                    position="top-right"
                    containerStyle={{ zIndex: 2147483647, top: 20 }}
                    toastOptions={{
                      className: 'custom-toast',
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
                    <Suspense fallback={<RouteTabSkeleton path={initialRoute} />}>
                      <Routes>
                        <Route
                          path="/report-data"
                          element={
                            <Suspense fallback={<RouteTabSkeleton path="/report-data" />}>
                              <ReportData />
                            </Suspense>
                          }
                        />
                        <Route path="/sale-portal" element={<SalePortalGate />} />

                        {/* Public pages (MYERP parity, correct route params) */}
                        <Route path="/booking/:bookingCode" element={<PublicPage><PublicBooking1on1Page /></PublicPage>} />
                        <Route path="/public-booking/1on1/:bookingCode" element={<PublicPage><PublicBooking1on1Page /></PublicPage>} />
                        <Route path="/public-schedule/1on1/:bookingCode" element={<PublicPage><PublicBooking1on1Page /></PublicPage>} />
                        <Route path="/public-schedule/course/:campaignId" element={<PublicPage><PublicSchedulePage /></PublicPage>} />
                        <Route path="/public-schedule/lecturer/:lecturerId" element={<PublicPage><PublicSchedulePage /></PublicPage>} />
                        <Route path="/public-schedule/:customerId" element={<PublicPage><PublicSchedulePage /></PublicPage>} />
                        <Route path="/schedule/:customerId" element={<PublicPage><PublicSchedulePage /></PublicPage>} />
                        <Route path="/s/:slug" element={<PublicPage marketing><PublicSurveyPage /></PublicPage>} />
                        <Route path="/s/:tenant/:slug" element={<PublicPage marketing><PublicSurveyPage /></PublicPage>} />
                        <Route path="/claim/:id" element={<PublicPage marketing><PublicVoucherClaimPage /></PublicPage>} />
                        <Route path="/docs" element={<PublicPage><DocumentationPage /></PublicPage>} />
                        <Route path="/documentation" element={<PublicPage><DocumentationPage /></PublicPage>} />
                        <Route path="/api-docs" element={<PublicPage><ApiV1DocumentationPage /></PublicPage>} />
                        <Route path="/api-v1-docs" element={<PublicPage><ApiV1DocumentationPage /></PublicPage>} />
                        <Route path="/docs/api-v1" element={<PublicViewportRoute />} />

                        {/* All authenticated screens share a single persistent AppTabs instance */}
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
                </UploadProgressProvider>
              </TenantConfigProvider>
            </EntitlementProvider>
          </AuthProvider>
        </LanguageProvider>
      </ErrorBoundary>
    </div>
  );
};
