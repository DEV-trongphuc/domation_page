export const DOMATION_NAV_EVENT = 'domation:navigate';

function scrollToHashElement(hash: string): void {
  if (typeof document === 'undefined' || !hash) return;
  const targetId = hash.replace(/^#/, '');
  if (!targetId) return;

  let attempts = 0;
  const maxAttempts = 30;
  const tryScroll = () => {
    const el = document.getElementById(targetId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }
    attempts += 1;
    if (attempts < maxAttempts) {
      window.setTimeout(tryScroll, 40);
    }
  };
  window.requestAnimationFrame(tryScroll);
}

export function navigateTo(path: string): void {
  if (typeof window === 'undefined') return;
  if (/^https?:\/\//i.test(path)) {
    window.open(path, '_blank', 'noopener,noreferrer');
    return;
  }

  const normalized = path.startsWith('/') ? path : `/${path}`;
  const hashIdx = normalized.indexOf('#');
  const pathAndQuery = hashIdx >= 0 ? normalized.slice(0, hashIdx) || '/' : normalized;
  const hash = hashIdx >= 0 ? normalized.slice(hashIdx + 1) : '';
  const currentPathAndQuery = window.location.pathname + window.location.search;

  if (currentPathAndQuery === pathAndQuery) {
    if (hash) {
      if (window.location.hash !== `#${hash}`) {
        window.history.pushState({}, '', normalized);
      }
      scrollToHashElement(hash);
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    return;
  }

  window.history.pushState({}, '', normalized);
  window.dispatchEvent(new CustomEvent(DOMATION_NAV_EVENT));
  if (hash) {
    scrollToHashElement(hash);
  } else {
    window.scrollTo({ top: 0, behavior: 'auto' });
  }
}

export function handleSpaLinkClick(
  e: React.MouseEvent<HTMLAnchorElement>,
  href: string
): void {
  if (
    e.defaultPrevented ||
    e.metaKey ||
    e.ctrlKey ||
    e.shiftKey ||
    e.altKey ||
    e.button !== 0 ||
    /^https?:\/\//i.test(href) ||
    href.startsWith('mailto:') ||
    href.startsWith('tel:') ||
    href.startsWith('#')
  ) {
    return;
  }
  e.preventDefault();
  navigateTo(href);
}
