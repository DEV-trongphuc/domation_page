/* eslint-disable react-refresh/only-export-components */
import { StrictMode, Suspense, lazy, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { MotionConfig } from 'framer-motion';
import { DomationHome } from './DomationHome';
import { AiDomationChatbot } from './components/AiDomationChatbot';
import { DOMATION_NAV_EVENT } from './utils/navigation';
import './index.css';

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
const NotFoundPage = lazy(() =>
  import('./NotFoundPage').then((m) => ({ default: m.NotFoundPage }))
);

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

  const isDataSubdomain =
    typeof window !== 'undefined' && /^data\./i.test(window.location.hostname);
  const isHome = !isDataSubdomain && (path === '' || path === '/');
  const isPortfolio = path === '/portfolio' || search.includes('page=portfolio');
  const isBoostHub = path === '/boost' || path === '/bai-viet' || path === '/blog';

  const singlePostMatch = path.match(/^\/(?:boost|bai-viet|blog)\/([^/]+)$/);
  const singlePostSlug = singlePostMatch
    ? (() => {
        try {
          return decodeURIComponent(singlePostMatch[1]);
        } catch {
          return singlePostMatch[1];
        }
      })()
    : null;

  const isAutomation = path === '/automation';
  const isMetaReport = path === '/meta-report';
  const isCrm = path === '/crm';
  const isData =
    path === '/data' ||
    path.startsWith('/data/') ||
    search.includes('page=data') ||
    (isDataSubdomain && !isPortfolio && !isBoostHub && !singlePostSlug);
  const isIdeas = path === '/ideas' || search.includes('page=ideas');
  const isErp =
    path === '/erp' ||
    path === '/ideas-erp' ||
    search.includes('page=erp') ||
    search.includes('page=ideas-erp');

  if (isHome) return <DomationHome />;

  return (
    <Suspense fallback={<PageLoader />}>
      {singlePostSlug && <SinglePostPage key={singlePostSlug} slug={singlePostSlug} />}
      {!singlePostSlug && isBoostHub && <BoostHubPage />}
      {!singlePostSlug && !isBoostHub && isPortfolio && <PortfolioPage />}
      {!singlePostSlug && !isBoostHub && !isPortfolio && isErp && <ErpLanding />}
      {!singlePostSlug && !isBoostHub && !isPortfolio && !isErp && isWebDesign && <WebDesignPricing />}
      {!singlePostSlug && !isBoostHub && !isPortfolio && !isErp && !isWebDesign && isMagnific && (
        <MagnificDownloader />
      )}
      {!singlePostSlug &&
        !isBoostHub &&
        !isPortfolio &&
        !isErp &&
        !isWebDesign &&
        !isMagnific &&
        isMetaReport && <MetaAdReport />}
      {!singlePostSlug &&
        !isBoostHub &&
        !isPortfolio &&
        !isErp &&
        !isWebDesign &&
        !isMagnific &&
        !isMetaReport &&
        isCrm && <CrmLanding />}
      {!singlePostSlug &&
        !isBoostHub &&
        !isPortfolio &&
        !isErp &&
        !isWebDesign &&
        !isMagnific &&
        !isMetaReport &&
        !isCrm &&
        isData && <DomationDataLanding />}
      {!singlePostSlug &&
        !isBoostHub &&
        !isPortfolio &&
        !isErp &&
        !isWebDesign &&
        !isMagnific &&
        !isMetaReport &&
        !isCrm &&
        !isData &&
        isAutomation && <App />}
      {!singlePostSlug &&
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
      {!singlePostSlug &&
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
  const [hidden, setHidden] = useState(() =>
    typeof document !== 'undefined' &&
    document.documentElement.getAttribute('data-autodata-workspace') === 'active'
  );

  useEffect(() => {
    const sync = () => {
      setHidden(document.documentElement.getAttribute('data-autodata-workspace') === 'active');
    };
    const observer = new MutationObserver(sync);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-autodata-workspace'],
    });
    return () => observer.disconnect();
  }, []);

  if (hidden) return null;
  return <AiDomationChatbot />;
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <MotionConfig reducedMotion="user">
      <Main />
      <ConditionalAiChatbot />
    </MotionConfig>
  </StrictMode>
);
