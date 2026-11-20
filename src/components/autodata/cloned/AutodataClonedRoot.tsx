import React, { lazy, Suspense, useEffect, useState } from 'react';
import { MemoryRouter, Routes, Route, Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { Keyboard } from 'lucide-react';
import './styles/autodataCloned.css';

import { Layout } from './components/Layout/Layout';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { LanguageProvider, useLanguage } from './contexts/LanguageContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import { CustomModal } from './components/ui/CustomModal';
import {
  UNIFIED_DATE_STORAGE_KEY,
  readStoredUnifiedDateFilter,
  useUnifiedDateFilter,
  writeStoredUnifiedDateFilter,
} from '../../common/unifiedDateFilter';
import { apiRequest } from '../autodataApi';
import { AutoDataSpotlightTour } from '../AutoDataHelpTour';
import { SCREEN_TOUR_DECKS } from '../autoDataScreenTours';
import { BillingView } from '../pages/BillingView';
import { DomationProgressLoader } from '../../DomationProgressLoader';
import { useWorkspaceIpProtection } from '../../../utils/workspaceIpGuard';
import type { TenantSessionV2, WorkspaceScreenKey } from '../autodataTypes';

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
const FairShareAudit = lazy(() => import('./pages/FairShareAudit').then((m) => ({ default: m.FairShareAudit })));
const AdsCapiPanel = lazy(() =>
  import('./components/AdsCapiPanel').then((m) => ({ default: m.AdsCapiPanel }))
);
const DomMetaReportWorkspace = lazy(() =>
  import('../../dom-meta/DomMetaReportWorkspace').then((m) => ({ default: m.DomMetaReportWorkspace }))
);

const PageLoader = () => (
  <DomationProgressLoader
    embedded
    title="DOMATION AutoData"
    subtitle="Đang tải phân hệ vận hành..."
  />
);

function mapPathToScreenKey(pathname: string, role?: string): WorkspaceScreenKey | 'sale_portal' {
  if (role === 'sale' || pathname === '/sale-portal') return 'sale_portal';
  switch (pathname) {
    case '/data':
    case '/calendar':
      return 'data_list';
    case '/ads-performance':
      return 'ads_performance';
    case '/meta-report':
      return 'dom_meta_report';
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
  const location = useLocation();
  if (!token || !user) return null;
  if (user.role === 'sale') return <Navigate to="/sale-portal" replace />;
  return (
    <Layout>
      <ErrorBoundary resetKey={location.pathname + location.search}>
        <Suspense fallback={<PageLoader />}>
          <Outlet />
        </Suspense>
      </ErrorBoundary>
    </Layout>
  );
};

const AppTabs: React.FC = () => {
  const { user, token, tenantSlug, companyName } = useAuth();
  const [, , unifiedDateHelpers] = useUnifiedDateFilter({ allowAllTime: true });
  const location = useLocation();
  const navigate = useNavigate();
  const currentPath = location.pathname;
  const [visitedPaths, setVisitedPaths] = useState<string[]>([currentPath]);
  if (!visitedPaths.includes(currentPath)) {
    setVisitedPaths((prev) => (prev.includes(currentPath) ? prev : [...prev, currentPath]));
  }

  const adminPaths = ['/consultants', '/rounds', '/tickets', '/rules', '/integrations', '/settings', '/accounts', '/fair-share', '/gatekeeper'];
  const userPaths = ['/', '/data', '/calendar', '/ads-performance', '/meta-report'];
  const allPaths = [...userPaths, ...adminPaths];
  const isAdminPath = adminPaths.includes(currentPath);

  if (user?.role === 'sale') return <Navigate to="/sale-portal" replace />;
  if (currentPath === '/ads-performance') {
    const sp = new URLSearchParams(location.search);
    if (!sp.get('view')) sp.set('view', 'lead_attribution');
    return <Navigate to={`/meta-report?${sp.toString()}`} replace />;
  }
  if (!allPaths.includes(currentPath)) return <Navigate to="/" replace />;
  if (currentPath === '/accounts' && user?.role !== 'superadmin') return <Navigate to="/" replace />;
  if (isAdminPath && user?.role !== 'admin' && user?.role !== 'superadmin') return <Navigate to="/" replace />;

  const searchParams = new URLSearchParams(location.search);
  const focusAdId = searchParams.get('focusAdId') || searchParams.get('ad_id') || undefined;
  const focusCampaignId =
    searchParams.get('focusCampaignId') || searchParams.get('campaign_id') || undefined;

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <div style={{ display: currentPath === '/' ? 'block' : 'none' }} className={currentPath === '/' ? 'page-enter-active' : ''}>
        {visitedPaths.includes('/') && (
          <Suspense fallback={<PageLoader />}>
            <Dashboard />
          </Suspense>
        )}
      </div>
      <div style={{ display: (currentPath === '/data' || currentPath === '/calendar') ? 'block' : 'none' }} className={(currentPath === '/data' || currentPath === '/calendar') ? 'page-enter-active' : ''}>
        {(visitedPaths.includes('/data') || visitedPaths.includes('/calendar')) && (
          <Suspense fallback={<PageLoader />}>
            <DataList />
          </Suspense>
        )}
      </div>
      <div style={{ display: currentPath === '/meta-report' ? 'block' : 'none' }} className={currentPath === '/meta-report' ? 'page-enter-active' : ''}>
        {visitedPaths.includes('/meta-report') && (
          <Suspense fallback={<PageLoader />}>
            <DomMetaReportWorkspace
              mode="embedded"
              externalSidebarNav={true}
              authContext={{ accessToken: token || undefined, tenantSlug: tenantSlug || undefined }}
              workspaceName={companyName || 'AutoData Workspace'}
              userDisplayName={user?.name || 'Admin'}
              userAvatarUrl={user?.avatar || undefined}
              userRoleLabel={user?.role || 'admin'}
              canManageConfig={user?.role === 'admin' || user?.role === 'superadmin'}
              enableCrmAttribution={true}
              focusAdId={focusAdId}
              focusCampaignId={focusCampaignId}
              capiPanel={
                <Suspense fallback={<PageLoader />}>
                  <AdsCapiPanel dateFilter={unifiedDateHelpers.legacyDate} />
                </Suspense>
              }
              onOpenLead={(lead) =>
                navigate(`/data?highlightLeadId=${encodeURIComponent(lead.id)}`)
              }
              onFilterCampaignLeads={(cid, cname) => {
                const q = new URLSearchParams();
                if (cid) q.set('campaign_id', cid);
                if (cname) q.set('search', cname);
                navigate(`/data?${q.toString()}`);
              }}
            />
          </Suspense>
        )}
      </div>

      {(user?.role === 'admin' || user?.role === 'superadmin') && (
        <>
          <div style={{ display: currentPath === '/consultants' ? 'block' : 'none' }} className={currentPath === '/consultants' ? 'page-enter-active' : ''}>
            {visitedPaths.includes('/consultants') && (
              <Suspense fallback={<PageLoader />}>
                <Consultants />
              </Suspense>
            )}
          </div>
          <div style={{ display: currentPath === '/rounds' ? 'block' : 'none' }} className={currentPath === '/rounds' ? 'page-enter-active' : ''}>
            {visitedPaths.includes('/rounds') && (
              <Suspense fallback={<PageLoader />}>
                <Rounds />
              </Suspense>
            )}
          </div>
          <div style={{ display: currentPath === '/tickets' ? 'block' : 'none' }} className={currentPath === '/tickets' ? 'page-enter-active' : ''}>
            {visitedPaths.includes('/tickets') && (
              <Suspense fallback={<PageLoader />}>
                <Tickets />
              </Suspense>
            )}
          </div>
          <div style={{ display: currentPath === '/rules' ? 'block' : 'none' }} className={currentPath === '/rules' ? 'page-enter-active' : ''}>
            {visitedPaths.includes('/rules') && (
              <Suspense fallback={<PageLoader />}>
                <RuleSettings />
              </Suspense>
            )}
          </div>
          <div style={{ display: currentPath === '/integrations' ? 'block' : 'none' }} className={currentPath === '/integrations' ? 'page-enter-active' : ''}>
            {visitedPaths.includes('/integrations') && (
              <Suspense fallback={<PageLoader />}>
                <Integrations />
              </Suspense>
            )}
          </div>
          <div style={{ display: currentPath === '/settings' ? 'block' : 'none' }} className={currentPath === '/settings' ? 'page-enter-active' : ''}>
            {visitedPaths.includes('/settings') && (
              <Suspense fallback={<PageLoader />}>
                <Settings />
              </Suspense>
            )}
          </div>
          <div style={{ display: currentPath === '/accounts' ? 'block' : 'none' }} className={currentPath === '/accounts' ? 'page-enter-active' : ''}>
            {visitedPaths.includes('/accounts') && (
              <Suspense fallback={<PageLoader />}>
                <Accounts />
              </Suspense>
            )}
          </div>
          <div style={{ display: currentPath === '/gatekeeper' ? 'block' : 'none' }} className={currentPath === '/gatekeeper' ? 'page-enter-active' : ''}>
            {visitedPaths.includes('/gatekeeper') && (
              <Suspense fallback={<PageLoader />}>
                <Gatekeeper />
              </Suspense>
            )}
          </div>
          <div style={{ display: currentPath === '/fair-share' ? 'block' : 'none' }} className={currentPath === '/fair-share' ? 'page-enter-active' : ''}>
            {visitedPaths.includes('/fair-share') && (
              <Suspense fallback={<PageLoader />}>
                <FairShareAudit />
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
}> = ({ open, onClose }) => {
  const { user, v2Session } = useAuth();
  const location = useLocation();
  const activeTourKey = `${location.pathname}|${location.search}|${String(open)}`;
  const [stepState, setStepState] = useState<{ key: string; idx: number }>({
    key: activeTourKey,
    idx: 0,
  });
  const stepIdx = stepState.key === activeTourKey ? stepState.idx : 0;

  const resolveEffectiveScreenKey = (): WorkspaceScreenKey | 'sale_portal' => {
    const baseKey = mapPathToScreenKey(location.pathname, user?.role);
    if (baseKey === 'settings') {
      const searchParams = new URLSearchParams(location.search);
      const tabParam = searchParams.get('tab');
      const domSubtab =
        typeof document !== 'undefined'
          ? document.querySelector('[data-settings-subtab]')?.getAttribute('data-settings-subtab')
          : null;
      const subtab = tabParam || domSubtab || 'processing';
      const deckKey = `settings_${subtab}` as WorkspaceScreenKey;
      if (SCREEN_TOUR_DECKS[deckKey]) {
        return deckKey;
      }
    }
    return baseKey;
  };

  const screenKey = resolveEffectiveScreenKey();
  const steps = SCREEN_TOUR_DECKS[screenKey] || SCREEN_TOUR_DECKS.settings || SCREEN_TOUR_DECKS.dashboard;

  const handleFinish = async () => {
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
      open={open}
      steps={steps}
      activeStepIndex={stepIdx}
      onStepChange={(idx) => setStepState({ key: activeTourKey, idx })}
      onFinish={() => void handleFinish()}
      onClose={() => void handleFinish()}
    />
  );
};

const KeyboardShortcutsController: React.FC = () => {
  const { user, token } = useAuth();
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
        if (key === 'n') {
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
        const shortcuts: Record<string, string> = { d: '/', l: '/data' };
        if (user?.role === 'admin' || user?.role === 'superadmin') {
          shortcuts.s = '/fair-share';
          shortcuts.r = '/rounds';
          shortcuts.c = '/consultants';
          shortcuts.t = '/tickets';
          shortcuts.w = '/rules';
          shortcuts.i = '/integrations';
          shortcuts.o = '/settings';
          shortcuts.g = '/gatekeeper';
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
  }, [user, navigate, token]);

  if (!token) return null;
  const isSystemAdmin = user?.role === 'admin' || user?.role === 'superadmin';

  return (
    <CustomModal isOpen={showHelpModal} onClose={() => setShowHelpModal(false)} title={t('Bảng phím tắt điều hướng nhanh')} width="650px">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', padding: '0.5rem 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-primary)' }}>
          <Keyboard size={20} />
          <span style={{ fontSize: '0.875rem', fontWeight: 700 }}>{t('Mẹo: Nhấn Alt + [Chữ cái] để chuyển hướng nhanh toàn hệ thống')}</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: isSystemAdmin ? '1fr 1fr' : '1fr', gap: '1.5rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <div style={{ fontSize: '0.8125rem' }}>Dashboard — <strong>Alt + D</strong></div>
            <div style={{ fontSize: '0.8125rem' }}>Quản lý Data — <strong>Alt + L</strong></div>
            <div style={{ fontSize: '0.8125rem' }}>Thêm Data nhanh — <strong>Alt + N</strong></div>
            <div style={{ fontSize: '0.8125rem' }}>Bản tin hoạt động — <strong>Alt + H</strong></div>
          </div>
          {isSystemAdmin && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <div style={{ fontSize: '0.8125rem' }}>Vòng phân bổ — <strong>Alt + R</strong></div>
              <div style={{ fontSize: '0.8125rem' }}>Logic xử lý — <strong>Alt + W</strong></div>
              <div style={{ fontSize: '0.8125rem' }}>Đại lý — <strong>Alt + C</strong></div>
              <div style={{ fontSize: '0.8125rem' }}>Tickets — <strong>Alt + T</strong></div>
              <div style={{ fontSize: '0.8125rem' }}>Cài đặt — <strong>Alt + O</strong></div>
            </div>
          )}
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button className="btn primary" onClick={() => setShowHelpModal(false)}>{t('Đóng')}</button>
        </div>
      </div>
    </CustomModal>
  );
};

const WorkspaceIpGuardController: React.FC<{ tenantSlug?: string | null; billingOpen: boolean }> = ({
  tenantSlug,
  billingOpen,
}) => {
  const { user } = useAuth();
  const location = useLocation();
  const screenKey = billingOpen ? 'billing' : mapPathToScreenKey(location.pathname, user?.role);
  useWorkspaceIpProtection({
    app: 'autodata_workspace',
    module: screenKey,
    tenantSlug,
  });
  return null;
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

  useEffect(() => {
    document.documentElement.setAttribute('data-autodata-workspace', 'active');
    const localTheme = (localStorage.getItem('domation_theme') as 'light' | 'dark') || 'light';
    document.documentElement.setAttribute('data-theme', localTheme);
    if (!localStorage.getItem(UNIFIED_DATE_STORAGE_KEY)) {
      writeStoredUnifiedDateFilter(readStoredUnifiedDateFilter());
    }

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
    session.role === 'sale'
      ? '/sale-portal'
      : initialView === 'report_data'
        ? '/report-data'
        : initialView === 'integrations'
          ? '/integrations'
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
            onOpenTour={() => setTourOpen(true)}
          >
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
                  <Route path="/sale-portal" element={<SalePortal />} />
                  <Route element={<ProtectedRoute />}>
                    <Route path="/*" element={<AppTabs />} />
                  </Route>
                </Routes>
                <KeyboardShortcutsController />
                <TourController open={tourOpen} onClose={() => setTourOpen(false)} />
                <WorkspaceIpGuardController tenantSlug={session.tenant_slug} billingOpen={billingModalOpen} />
              </Suspense>
            </MemoryRouter>

            <CustomModal
              isOpen={billingModalOpen}
              onClose={() => setBillingModalOpen(false)}
              title="Gói Cước, Hạn Mức & Ví Thanh Toán SaaS"
              width="920px"
            >
              <BillingView token={session.access_token} tenantSlug={session.tenant_slug} hideHeaderCard={true} />
            </CustomModal>
          </AuthProvider>
        </LanguageProvider>
      </ErrorBoundary>
    </div>
  );
};
