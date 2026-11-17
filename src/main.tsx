/* eslint-disable react-refresh/only-export-components */
import { Component, StrictMode, Suspense, lazy, useEffect, useState, type ErrorInfo, type ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import { MotionConfig } from 'framer-motion';
import { DomationHome } from './DomationHome';
import { AiDomationChatbot } from './components/AiDomationChatbot';
import { DOMATION_NAV_EVENT } from './utils/navigation';
import './index.css';

declare global {
  interface Window {
    __DOMATION_APP_MOUNTED__?: boolean;
    __domationRecoverStaleAssets?: () => boolean;
  }
}

if (typeof window !== 'undefined') {
  window.addEventListener('vite:preloadError', (event) => {
    event.preventDefault();
    if (window.__domationRecoverStaleAssets) {
      window.__domationRecoverStaleAssets();
    } else {
      window.location.reload();
    }
  });
}

class DomationErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false };

  static getDerivedStateFromError(): { hasError: boolean } {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[DOMATION] Render recovery caught:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-[#F8F9FA] text-slate-900 px-6 text-center gap-4">
          <h1 className="text-xl font-bold">Đang làm mới phiên bản DOMATION mới nhất</h1>
          <p className="text-sm text-slate-600 max-w-md">
            Trình duyệt vừa cập nhật bản dựng mới. Bấm nút bên dưới để tải lại giao diện sạch.
          </p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="btn-inkica-primary px-5 py-2.5 text-sm cursor-pointer"
          >
            Tải Lại Trang
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

const App = lazy(() => import('./App'));
const ErpLanding = lazy(() =>
  import('./ErpLanding').then((m) => ({ default: m.ErpLanding }))
);
const CrmLanding = lazy(() =>
  import('./CrmLanding').then((m) => ({ default: m.CrmLanding }))
);
const DomationDataLanding = lazy(() =>
  import('./DomationDataLanding').then((m) => ({ default: m.DomationDataLanding }))
);
const MetaAdReport = lazy(() =>
  import('./MetaAdReport').then((m) => ({ default: m.MetaAdReport }))
);
const WebDesignPricing = lazy(() =>
  import('./WebDesignPricing').then((m) => ({ default: m.WebDesignPricing }))
);
const IdeasLanding = lazy(() =>
  import('./IdeasLanding').then((m) => ({ default: m.IdeasLanding }))
);
const MagnificDownloader = lazy(() =>
  import('./MagnificDownloader').then((m) => ({ default: m.MagnificDownloader }))
);
const BoostHubPage = lazy(() =>
  import('./BoostHubPage').then((m) => ({ default: m.BoostHubPage }))
);
const SinglePostPage = lazy(() =>
  import('./SinglePostPage').then((m) => ({ default: m.SinglePostPage }))
);
const PortfolioPage = lazy(() =>
  import('./PortfolioPage').then((m) => ({ default: m.PortfolioPage }))
);
const PublicStandaloneGateway = lazy(() =>
  import('./components/autodata/cloned/modules/registry').then((m) => ({
    default: m.PublicStandaloneGateway,
  }))
);
const NotFoundPage = lazy(() =>
  import('./NotFoundPage').then((m) => ({ default: m.NotFoundPage }))
);

function isPublicEcosystemPath(path: string): boolean {
  return (
    path === '/docs/api-v1' ||
    /^\/booking\/[^/]+$/.test(path) ||
    /^\/public-booking\/1on1\/[^/]+$/.test(path) ||
    /^\/s\/[^/]+$/.test(path) ||
    /^\/s\/[^/]+\/[^/]+$/.test(path) ||
    /^\/claim\/[^/]+$/.test(path) ||
    /^\/schedule\/[^/]+$/.test(path) ||
    /^\/public-schedule\/[^/]+$/.test(path)
  );
}

const PageLoader = () => (
  <div className="min-h-screen flex flex-col items-center justify-center bg-[#F8F9FA] text-slate-700">
    <div className="w-10 h-10 rounded-full border-2 border-blue-200 border-t-[#1E40FF] animate-spin mb-3" />
    <span className="text-xs font-bold tracking-widest uppercase text-slate-500">
      Đang tải DOMATION Suite...
    </span>
  </div>
);

const Main = () => {
  const [locationKey, setLocationKey] = useState(() =>
    typeof window !== 'undefined' ? `${window.location.pathname}${window.location.search}` : '/'
  );

  useEffect(() => {
    const sync = () => {
      setLocationKey(`${window.location.pathname}${window.location.search}`);
    };
    window.addEventListener('popstate', sync);
    window.addEventListener(DOMATION_NAV_EVENT, sync);
    return () => {
      window.removeEventListener('popstate', sync);
      window.removeEventListener(DOMATION_NAV_EVENT, sync);
    };
  }, []);

  if (typeof window !== 'undefined' && window.location.search.includes('page=meta-ad-report')) {
    window.location.replace('/meta-report');
    return null;
  }

  const rawPath = locationKey.split('?')[0];
  const path = rawPath.replace(/\/$/, '') || '/';
  const search = locationKey.includes('?') ? locationKey.slice(locationKey.indexOf('?')) : '';

  const isWebDesign = path === '/web-design' || search.includes('page=web-design');
  const isMagnific = search.includes('page=magnific-downloader');
  const isPublicEcosystemRoute = isPublicEcosystemPath(path);

  const isDataSubdomain =
    typeof window !== 'undefined' && /^data\./i.test(window.location.hostname);
  const isHome = !isDataSubdomain && !isPublicEcosystemRoute && (path === '' || path === '/');
  const isPortfolio = !isPublicEcosystemRoute && (path === '/portfolio' || search.includes('page=portfolio'));
  const isBoostHub = !isPublicEcosystemRoute && (path === '/boost' || path === '/bai-viet' || path === '/blog');

  const singlePostMatch = isPublicEcosystemRoute
    ? null
    : path.match(/^\/(?:boost|bai-viet|blog)\/([^/]+)$/);
  const singlePostSlug = singlePostMatch
    ? (() => {
        try {
          return decodeURIComponent(singlePostMatch[1]);
        } catch {
          return singlePostMatch[1];
        }
      })()
    : null;

  const isAutomation = !isPublicEcosystemRoute && path === '/automation';
  const isMetaReport = !isPublicEcosystemRoute && path === '/meta-report';
  const isCrm = !isPublicEcosystemRoute && path === '/crm';
  const isData =
    !isPublicEcosystemRoute &&
    (path === '/data' ||
      path.startsWith('/data/') ||
      search.includes('page=data') ||
      (isDataSubdomain && !isPortfolio && !isBoostHub && !singlePostSlug));
  const isIdeas = !isPublicEcosystemRoute && (path === '/ideas' || search.includes('page=ideas'));
  const isErp =
    !isPublicEcosystemRoute &&
    (path === '/erp' ||
      path === '/ideas-erp' ||
      search.includes('page=erp') ||
      search.includes('page=ideas-erp'));

  if (isHome) return <DomationHome />;

  return (
    <Suspense fallback={<PageLoader />}>
      {isPublicEcosystemRoute && <PublicStandaloneGateway initialPath={locationKey} />}
      {!isPublicEcosystemRoute && singlePostSlug && (
        <SinglePostPage key={singlePostSlug} slug={singlePostSlug} />
      )}
      {!isPublicEcosystemRoute && !singlePostSlug && isBoostHub && <BoostHubPage />}
      {!isPublicEcosystemRoute && !singlePostSlug && !isBoostHub && isPortfolio && <PortfolioPage />}
      {!isPublicEcosystemRoute && !singlePostSlug && !isBoostHub && !isPortfolio && isErp && <ErpLanding />}
      {!isPublicEcosystemRoute && !singlePostSlug && !isBoostHub && !isPortfolio && !isErp && isWebDesign && (
        <WebDesignPricing />
      )}
      {!isPublicEcosystemRoute &&
        !singlePostSlug &&
        !isBoostHub &&
        !isPortfolio &&
        !isErp &&
        !isWebDesign &&
        isMagnific && <MagnificDownloader />}
      {!isPublicEcosystemRoute &&
        !singlePostSlug &&
        !isBoostHub &&
        !isPortfolio &&
        !isErp &&
        !isWebDesign &&
        !isMagnific &&
        isMetaReport && <MetaAdReport />}
      {!isPublicEcosystemRoute &&
        !singlePostSlug &&
        !isBoostHub &&
        !isPortfolio &&
        !isErp &&
        !isWebDesign &&
        !isMagnific &&
        !isMetaReport &&
        isCrm && <CrmLanding />}
      {!isPublicEcosystemRoute &&
        !singlePostSlug &&
        !isBoostHub &&
        !isPortfolio &&
        !isErp &&
        !isWebDesign &&
        !isMagnific &&
        !isMetaReport &&
        !isCrm &&
        isData && <DomationDataLanding />}
      {!isPublicEcosystemRoute &&
        !singlePostSlug &&
        !isBoostHub &&
        !isPortfolio &&
        !isErp &&
        !isWebDesign &&
        !isMagnific &&
        !isMetaReport &&
        !isCrm &&
        !isData &&
        isAutomation && <App />}
      {!isPublicEcosystemRoute &&
        !singlePostSlug &&
        !isBoostHub &&
        !isPortfolio &&
        !isErp &&
        !isWebDesign &&
        !isMagnific &&
        !isMetaReport &&
        !isCrm &&
        !isData &&
        !isAutomation &&
        isIdeas && <IdeasLanding />}
      {!isPublicEcosystemRoute &&
        !singlePostSlug &&
        !isBoostHub &&
        !isPortfolio &&
        !isErp &&
        !isWebDesign &&
        !isMagnific &&
        !isMetaReport &&
        !isCrm &&
        !isData &&
        !isAutomation &&
        !isIdeas && <NotFoundPage path={path} />}
    </Suspense>
  );
};

const ConditionalAiChatbot = () => {
  const [hidden, setHidden] = useState(() => {
    if (typeof document === 'undefined') return false;
    const isWorkspace =
      document.documentElement.getAttribute('data-autodata-workspace') === 'active';
    const curPath = typeof window !== 'undefined' ? window.location.pathname.replace(/\/$/, '') || '/' : '/';
    return isWorkspace || isPublicEcosystemPath(curPath);
  });

  useEffect(() => {
    const sync = () => {
      const isWorkspace =
        document.documentElement.getAttribute('data-autodata-workspace') === 'active';
      const curPath = window.location.pathname.replace(/\/$/, '') || '/';
      setHidden(isWorkspace || isPublicEcosystemPath(curPath));
    };
    const observer = new MutationObserver(sync);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-autodata-workspace'],
    });
    window.addEventListener('popstate', sync);
    window.addEventListener(DOMATION_NAV_EVENT, sync);
    return () => {
      observer.disconnect();
      window.removeEventListener('popstate', sync);
      window.removeEventListener(DOMATION_NAV_EVENT, sync);
    };
  }, []);

  if (hidden) return null;
  return <AiDomationChatbot />;
};

if (typeof window !== 'undefined') {
  window.__DOMATION_APP_MOUNTED__ = true;
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <DomationErrorBoundary>
      <MotionConfig reducedMotion="user">
        <Main />
        <ConditionalAiChatbot />
      </MotionConfig>
    </DomationErrorBoundary>
  </StrictMode>
);
