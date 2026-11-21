/**
 * LIFO Overlay Stack & Reference-Counted Scroll Lock for DOMATION Web/Meta/Boost Suite.
 * Shared via window.__DOMATION_OVERLAY_BRIDGE__ so all modals, drawers, lightboxes & tours
 * close cleanly in reverse order on ESC or Mobile/Tablet Swipe-Back.
 */

type OverlayCloseHandler = () => void | boolean;

interface OverlayEntry {
  id: string;
  close: OverlayCloseHandler;
  priority: number;
}

const overlayStack: OverlayEntry[] = [];
const stackListeners = new Set<() => void>();

let bodyScrollLockCount = 0;
let savedBodyOverflow = '';
let isPoppingOverlay = false;

export function lockBodyScroll(): void {
  if (typeof document === 'undefined') return;
  if (bodyScrollLockCount === 0) {
    savedBodyOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
  }
  bodyScrollLockCount += 1;
}

export function unlockBodyScroll(): void {
  if (typeof document === 'undefined') return;
  bodyScrollLockCount = Math.max(0, bodyScrollLockCount - 1);
  if (bodyScrollLockCount === 0) {
    document.body.style.overflow = savedBodyOverflow || '';
  }
}

function notifyStackListeners(): void {
  stackListeners.forEach((listener) => {
    try {
      listener();
    } catch {
      // Ignore listener errors
    }
  });
}

export function pushOverlay(
  id: string,
  close: OverlayCloseHandler,
  priority = 100
): () => void {
  const existingIdx = overlayStack.findIndex((item) => item.id === id);
  if (existingIdx !== -1) {
    overlayStack.splice(existingIdx, 1);
  }
  overlayStack.push({ id, close, priority });
  overlayStack.sort((a, b) => a.priority - b.priority);
  notifyStackListeners();

  return () => {
    removeOverlay(id);
  };
}

export function removeOverlay(id: string): void {
  const idx = overlayStack.findIndex((item) => item.id === id);
  if (idx !== -1) {
    overlayStack.splice(idx, 1);
    notifyStackListeners();
  }
}

export function popAndCloseTopOverlay(): boolean {
  if (overlayStack.length === 0 || isPoppingOverlay) return false;
  const top = overlayStack[overlayStack.length - 1];
  if (top && typeof top.close === 'function') {
    isPoppingOverlay = true;
    try {
      const res = top.close();
      return res !== false;
    } catch {
      return false;
    } finally {
      isPoppingOverlay = false;
    }
  }
  return false;
}

export function hasOpenOverlays(): boolean {
  return overlayStack.length > 0;
}

export function getOverlayCount(): number {
  return overlayStack.length;
}

export function getTopOverlayId(): string | null {
  if (overlayStack.length === 0) return null;
  return overlayStack[overlayStack.length - 1]?.id || null;
}

export function subscribeOverlayStack(listener: () => void): () => void {
  stackListeners.add(listener);
  return () => {
    stackListeners.delete(listener);
  };
}

interface DomationOverlayBridge {
  pushOverlay: typeof pushOverlay;
  removeOverlay: typeof removeOverlay;
  popAndCloseTopOverlay: typeof popAndCloseTopOverlay;
  hasOpenOverlays: typeof hasOpenOverlays;
  getOverlayCount: typeof getOverlayCount;
  getTopOverlayId: typeof getTopOverlayId;
  lockBodyScroll: typeof lockBodyScroll;
  unlockBodyScroll: typeof unlockBodyScroll;
}

type WindowWithOverlayBridge = Window & {
  __DOMATION_OVERLAY_BRIDGE__?: DomationOverlayBridge;
  __DOMATION_LANDING_ESC_BOUND__?: boolean;
};

type SyntheticEscKeyboardEvent = KeyboardEvent & {
  __domOverlaySyntheticEsc?: boolean;
};

// Install global ESC listener for topmost registered overlay & bridge for synced modules
if (typeof window !== 'undefined') {
  const win = window as WindowWithOverlayBridge;
  win.__DOMATION_OVERLAY_BRIDGE__ = {
    pushOverlay,
    removeOverlay,
    popAndCloseTopOverlay,
    hasOpenOverlays,
    getOverlayCount,
    getTopOverlayId,
    lockBodyScroll,
    unlockBodyScroll,
  };

  if (!win.__DOMATION_LANDING_ESC_BOUND__) {
    win.__DOMATION_LANDING_ESC_BOUND__ = true;
    window.addEventListener('keydown', (e: KeyboardEvent) => {
      if ((e as SyntheticEscKeyboardEvent).__domOverlaySyntheticEsc) return;
      if (e.key === 'Escape' && !e.isComposing && hasOpenOverlays()) {
        e.preventDefault();
        e.stopPropagation();
        popAndCloseTopOverlay();
      }
    });
  }
}
