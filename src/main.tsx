import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { WebDesignPricing } from './WebDesignPricing.tsx'
import { MetaAdReport } from './MetaAdReport.tsx'
import { MagnificDownloader } from './MagnificDownloader.tsx'
const Main = () => {
  const isWebDesign = typeof window !== 'undefined' && window.location.search.includes('page=web-design');
  const isMetaAdReport = typeof window !== 'undefined' && window.location.search.includes('page=meta-ad-report');
  const isMagnific = typeof window !== 'undefined' && window.location.search.includes('page=magnific-downloader');
  
  if (isWebDesign) return <WebDesignPricing />;
  if (isMetaAdReport) return <MetaAdReport />;
  if (isMagnific) return <MagnificDownloader />;
  return <App />;
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Main />
  </StrictMode>,
)
