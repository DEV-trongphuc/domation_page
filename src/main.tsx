import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { WebDesignPricing } from './WebDesignPricing.tsx'
import { MetaAdReport } from './MetaAdReport.tsx'
import { MagnificDownloader } from './MagnificDownloader.tsx'
import { CrmLanding } from './CrmLanding.tsx'
import { DomationHome } from './DomationHome.tsx'

const Main = () => {
  if (typeof window !== 'undefined' && window.location.search.includes('page=meta-ad-report')) {
    window.location.replace('/meta-report');
    return null;
  }

  const path = typeof window !== 'undefined' ? window.location.pathname.replace(/\/$/, '') || '/' : '/';
  const isWebDesign = typeof window !== 'undefined' && window.location.search.includes('page=web-design');
  const isMagnific = typeof window !== 'undefined' && window.location.search.includes('page=magnific-downloader');

  const isHome = path === '' || path === '/';
  const isAutomation = path === '/automation';
  const isMetaReport = path === '/meta-report';
  const isCrm = path === '/crm';

  if (isWebDesign) return <WebDesignPricing />;
  if (isMagnific) return <MagnificDownloader />;
  if (isMetaReport) return <MetaAdReport />;
  if (isCrm) return <CrmLanding />;
  if (isAutomation) return <App />;
  if (isHome) return <DomationHome />;
  return <DomationHome />;
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Main />
  </StrictMode>,
)
