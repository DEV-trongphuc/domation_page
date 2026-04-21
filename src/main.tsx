import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { WebDesignPricing } from './WebDesignPricing.tsx'

const Main = () => {
  const isWebDesign = typeof window !== 'undefined' && window.location.search.includes('page=web-design');
  return isWebDesign ? <WebDesignPricing /> : <App />;
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Main />
  </StrictMode>,
)
