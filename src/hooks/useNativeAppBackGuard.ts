import { useEffect, useRef } from 'react';
import {
  getOverlayCount,
  hasOpenOverlays,
  popAndCloseTopOverlay,
  subscribeOverlayStack,
} from '../utils/overlayStack';
import { DOMATION_NAV_EVENT } from '../utils/navigation';

function isMobileOrTabletViewport(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    window.innerWidth <= 1280 ||
    Boolean(window.matchMedia?.('(pointer: coarse)')?.matches)
  );
}

function canScrollHorizontallyInDirection(
  target: EventTarget | null,
  deltaX: number
): boolean {
  if (!(target instanceof HTMLElement)) return false;
  let el: HTMLElement | null = target;
  while (el && el !== document.body && el !== document.documentElement) {
    const tag = el.tagName.toLowerCase();
    if (tag === 'input' && (el as HTMLInputElement).type === 'range') return true;
    if (tag === 'canvas') return true;

    const style = window.getComputedStyle(el);
    const overflowX = style.overflowX;
    const isScrollableX =
      (overflowX === 'auto' || overflowX === 'scroll' || overflowX === 'overlay') &&
      el.scrollWidth > el.clientWidth + 2;

    if (isScrollableX) {
      if (deltaX > 0 && el.scrollLeft > 0) return true;
      if (deltaX < 0 && el.scrollLeft + el.clientWidth < el.scrollWidth - 1) return true;
      return true;
    }
    el = el.parentElement;
  }
  return false;
}

function tryCloseVisibleDomModal(): boolean {
  if (typeof document === 'undefined') return false;

  const explicitTriggers = Array.from(
    document.querySelectorAll<HTMLElement>('[data-dom-overlay-close="true"]')
  ).filter((el) => el.offsetParent !== null || window.getComputedStyle(el).display !== 'none');
  if (explicitTriggers.length > 0) {
    explicitTriggers[explicitTriggers.length - 1].click();
    return true;
  }

  // Fallback: close topmost DomMetaModalPortal / modal dialog / drawer backdrop
  const portals = Array.from(
    document.querySelectorAll<HTMLElement>('[data-modal-portal="true"], [role="dialog"][aria-modal="true"]')
  );
  for (let i = portals.length - 1; i >= 0; i--) {
    const container = portals[i];
    const closeBtn = container.querySelector<HTMLElement>(
      'button[aria-label*="Đóng"], button[aria-label*="Close"], button[title*="Đóng"], button[title*="Close"]'
    );
    if (closeBtn && (closeBtn.offsetParent !== null || window.getComputedStyle(closeBtn).display !== 'none')) {
      closeBtn.click();
      return true;
    }
  }

  const backdrops = Array.from(
    document.querySelectorAll<HTMLElement>('.drawer-backdrop, .modal-backdrop, .overlay-backdrop')
  ).filter((el) => el.offsetParent !== null || window.getComputedStyle(el).display !== 'none');
  if (backdrops.length > 0) {
    backdrops[backdrops.length - 1].click();
    return true;
  }

  return false;
}

function pushHistoryGuardSentinel(slot: 1 | 2 = 1, targetUrl?: string): void {
  if (typeof window === 'undefined') return;
  try {
    const currentState =
      window.history.state && typeof window.history.state === 'object'
        ? window.history.state
        : {};
    window.history.pushState(
      { ...currentState, __domLandingAppGuard: true, __domGuardSlot: slot, __domGuardTs: Date.now() },
      '',
      targetUrl || window.location.href
    );
  } catch {
    // Ignore SecurityError
  }
}

function restoreSentinelBuffer(targetUrl?: string): void {
  if (typeof window === 'undefined') return;
  if (!window.history.state?.__domLandingAppGuard) {
    pushHistoryGuardSentinel(1, targetUrl);
    pushHistoryGuardSentinel(2, targetUrl);
  } else {
    pushHistoryGuardSentinel(2, targetUrl);
  }
}

/**
 * 3-Layer Native Mobile/Tablet Back-Swipe & History Protection for DOMATION Suite
 * (Meta Report, /boost, AutoData Workspace & Landing):
 * - Layer 1: CSS overscroll-behavior-x: none
 * - Layer 2: Non-passive edge-swipe blocker + natural inward swipe-back gesture
 * - Layer 3: Double-sentinel History Buffer + LIFO overlay close -> in-app route history (never exits app!)
 */
export function useNativeAppBackGuard(locationKey: string): void {
  const routeStackRef = useRef<string[]>([]);
  const isHandlingBackRef = useRef(false);
  const initializedRef = useRef(false);
  const prevOverlayCountRef = useRef(0);
  const executeBackRef = useRef<() => void>(() => {});

  // Track internal SPA routes & keep 2-slot history guard buffer alive
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const currentRoute = locationKey || `${window.location.pathname}${window.location.search}`;
    const stack = routeStackRef.current;

    if (stack.length === 0 || stack[stack.length - 1] !== currentRoute) {
      stack.push(currentRoute);
      if (stack.length > 50) {
        stack.shift();
      }
    }

    if (!initializedRef.current) {
      initializedRef.current = true;
      if (isMobileOrTabletViewport()) {
        pushHistoryGuardSentinel(1, currentRoute);
        pushHistoryGuardSentinel(2, currentRoute);
      }
    } else if (isMobileOrTabletViewport() && !window.history.state?.__domLandingAppGuard) {
      pushHistoryGuardSentinel(2, currentRoute);
    }
  }, [locationKey]);

  // Push a fresh history guard ONLY when overlay count grows (never on overlay close)
  useEffect(() => {
    prevOverlayCountRef.current = getOverlayCount();
    return subscribeOverlayStack(() => {
      const nextCount = getOverlayCount();
      const grew = nextCount > prevOverlayCountRef.current;
      prevOverlayCountRef.current = nextCount;
      if (grew && !isHandlingBackRef.current) {
        pushHistoryGuardSentinel(2);
      }
    });
  }, []);

  // Layer 2: Edge-swipe blocker + natural step-by-step swipe-back on Mobile & Tablet
  useEffect(() => {
    let startX = 0;
    let startY = 0;
    let lastDeltaX = 0;
    let lastDeltaY = 0;
    let isLeftEdge = false;
    let isRightEdge = false;
    let isTracking = false;
    let blockedBrowserSwipe = false;

    const onTouchStart = (e: TouchEvent) => {
      if (!isMobileOrTabletViewport() || e.touches.length !== 1) {
        isTracking = false;
        return;
      }
      const touch = e.touches[0];
      startX = touch.clientX;
      startY = touch.clientY;
      lastDeltaX = 0;
      lastDeltaY = 0;
      isLeftEdge = startX <= 30;
      isRightEdge = startX >= window.innerWidth - 30;
      blockedBrowserSwipe = false;
      isTracking = true;
    };

    const onTouchMove = (e: TouchEvent) => {
      if (!isTracking || !isMobileOrTabletViewport() || e.touches.length !== 1) return;
      const touch = e.touches[0];
      const deltaX = touch.clientX - startX;
      const deltaY = touch.clientY - startY;
      lastDeltaX = deltaX;
      lastDeltaY = deltaY;
      const absX = Math.abs(deltaX);
      const absY = Math.abs(deltaY);

      if (absX <= 6 || absX <= absY * 1.15) return;

      if (isLeftEdge || isRightEdge) {
        if (e.cancelable) {
          e.preventDefault();
          blockedBrowserSwipe = true;
        }
        return;
      }

      if (hasOpenOverlays() && !canScrollHorizontallyInDirection(e.target, deltaX)) {
        if (e.cancelable) {
          e.preventDefault();
        }
      }
    };

    const onTouchEnd = () => {
      if (
        isTracking &&
        isLeftEdge &&
        blockedBrowserSwipe &&
        lastDeltaX >= 56 &&
        Math.abs(lastDeltaX) > Math.abs(lastDeltaY) * 1.35
      ) {
        executeBackRef.current();
      }
      isTracking = false;
      isLeftEdge = false;
      isRightEdge = false;
      blockedBrowserSwipe = false;
    };

    document.addEventListener('touchstart', onTouchStart, { passive: true });
    document.addEventListener('touchmove', onTouchMove, { passive: false });
    document.addEventListener('touchend', onTouchEnd, { passive: true });
    document.addEventListener('touchcancel', onTouchEnd, { passive: true });

    return () => {
      document.removeEventListener('touchstart', onTouchStart);
      document.removeEventListener('touchmove', onTouchMove);
      document.removeEventListener('touchend', onTouchEnd);
      document.removeEventListener('touchcancel', onTouchEnd);
    };
  }, []);

  // Layer 3: LIFO Back-Stack Interceptor
  useEffect(() => {
    const performInAppBack = (repushSentinel: boolean, popEvent?: PopStateEvent) => {
      if (isHandlingBackRef.current) return;
      isHandlingBackRef.current = true;

      try {
        // 1. Close topmost registered overlay (modal/drawer/lightbox)
        if (hasOpenOverlays() && popAndCloseTopOverlay()) {
          popEvent?.stopImmediatePropagation();
          if (repushSentinel) restoreSentinelBuffer();
          return;
        }

        // 2. Fallback: close topmost visible modal/drawer portal in DOM
        if (tryCloseVisibleDomModal()) {
          popEvent?.stopImmediatePropagation();
          if (repushSentinel) restoreSentinelBuffer();
          return;
        }

        // 3. Step back through internal SPA route history without exiting app
        const stack = routeStackRef.current;
        const currentFullRoute = `${window.location.pathname}${window.location.search || ''}`;
        while (stack.length > 1 && stack[stack.length - 1] === currentFullRoute) {
          stack.pop();
        }

        if (stack.length >= 1 && stack[stack.length - 1] !== currentFullRoute) {
          const prevRoute = stack[stack.length - 1];
          popEvent?.stopImmediatePropagation();
          window.history.replaceState(
            { __domLandingAppGuard: true, __domGuardSlot: 1 },
            '',
            prevRoute
          );
          window.dispatchEvent(new CustomEvent(DOMATION_NAV_EVENT));
          if (repushSentinel) pushHistoryGuardSentinel(2, prevRoute);
          return;
        }

        // 4. At root of mobile/tablet app: never exit! Stay put and keep 2-slot sentinel buffer alive
        if (repushSentinel && isMobileOrTabletViewport()) {
          popEvent?.stopImmediatePropagation();
          restoreSentinelBuffer(currentFullRoute);
        }
      } finally {
        setTimeout(() => {
          isHandlingBackRef.current = false;
        }, 0);
      }
    };

    executeBackRef.current = () => performInAppBack(false);
    const onPopState = (e: PopStateEvent) => {
      // On mobile/tablet OR whenever an overlay is open on desktop, intercept and walk back step-by-step
      if (isMobileOrTabletViewport() || hasOpenOverlays()) {
        performInAppBack(true, e);
      }
    };

    window.addEventListener('popstate', onPopState, true);
    return () => {
      window.removeEventListener('popstate', onPopState, true);
    };
  }, []);
}
