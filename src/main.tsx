import { StrictMode, Suspense, lazy } from 'react';
import { createRoot } from 'react-dom/client';
import { MotionConfig } from 'framer-motion';
import { DomationHome } from './DomationHome';
import { AiDomationChatbot } from './components/AiDomationChatbot';
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

const PageLoader = () => (
  <div className="min-h-screen flex flex-col items-center justify-center bg-[#F8F9FA] text-slate-700">
    <div className="w-10 h-10 rounded-full border-2 border-blue-200 border-t-[#1E40FF] animate-spin mb-3" />
    <span className="text-xs font-bold tracking-widest uppercase text-slate-500">
      Đang tải DOMATION Suite...
    </span>
  </div>
);

const Main = () => {
  if (typeof window !== 'undefined' && window.location.search.includes('page=meta-ad-report')) {
    window.location.replace('/meta-report');
    return null;
  }

  const path = typeof window !== 'undefined' ? window.location.pathname.replace(/\/$/, '') || '/' : '/';
  const isWebDesign = path === '/web-design' || (typeof window !== 'undefined' && window.location.search.includes('page=web-design'));
  const isMagnific = typeof window !== 'undefined' && window.location.search.includes('page=magnific-downloader');

  const isHome = path === '' || path === '/';
  const isAutomation = path === '/automation';
  const isMetaReport = path === '/meta-report';
  const isCrm = path === '/crm';
  const isData = path === '/data' || (typeof window !== 'undefined' && window.location.search.includes('page=data'));
  const isIdeas = path === '/ideas' || (typeof window !== 'undefined' && window.location.search.includes('page=ideas'));
  const isErp = path === '/erp' || path === '/ideas-erp' || (typeof window !== 'undefined' && (window.location.search.includes('page=erp') || window.location.search.includes('page=ideas-erp')));

  if (isHome) return <DomationHome />;

  return (
    <Suspense fallback={<PageLoader />}>
      {isErp && <ErpLanding />}
      {!isErp && isWebDesign && <WebDesignPricing />}
      {!isErp && !isWebDesign && isMagnific && <MagnificDownloader />}
      {!isErp && !isWebDesign && !isMagnific && isMetaReport && <MetaAdReport />}
      {!isErp && !isWebDesign && !isMagnific && !isMetaReport && isCrm && <CrmLanding />}
      {!isErp && !isWebDesign && !isMagnific && !isMetaReport && !isCrm && isData && <DomationDataLanding />}
      {!isErp && !isWebDesign && !isMagnific && !isMetaReport && !isCrm && !isData && isAutomation && <App />}
      {!isErp && !isWebDesign && !isMagnific && !isMetaReport && !isCrm && !isData && !isAutomation && isIdeas && <IdeasLanding />}
      {!isErp && !isWebDesign && !isMagnific && !isMetaReport && !isCrm && !isData && !isAutomation && !isIdeas && <DomationHome />}
    </Suspense>
  );
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <MotionConfig reducedMotion="user">
      <Main />
      <AiDomationChatbot />
    </MotionConfig>
  </StrictMode>
);
