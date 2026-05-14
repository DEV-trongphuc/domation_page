import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { WebDesignPricing } from './WebDesignPricing.tsx'
import { MetaAdReport } from './MetaAdReport.tsx'
import { MagnificDownloader } from './MagnificDownloader.tsx'
import { CrmLanding } from './CrmLanding.tsx'

const Main = () => {
  if (typeof window !== 'undefined' && window.location.search.includes('page=meta-ad-report')) {
    window.location.replace('/meta-report');
    return null;
  }

  const isWebDesign = typeof window !== 'undefined' && window.location.search.includes('page=web-design');
  const isMetaAdReport = typeof window !== 'undefined' && (window.location.pathname === '/meta-report' || window.location.pathname === '/meta-report/');
  const isMagnific = typeof window !== 'undefined' && window.location.search.includes('page=magnific-downloader');
  const isCrm = typeof window !== 'undefined' && (window.location.pathname === '/crm' || window.location.pathname === '/crm/');
  
  if (isWebDesign) return <WebDesignPricing />;
  if (isMetaAdReport) return <MetaAdReport />;
  if (isMagnific) return <MagnificDownloader />;
  if (isCrm) return <CrmLanding />;
  return <App />;
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Main />
  </StrictMode>,
)
