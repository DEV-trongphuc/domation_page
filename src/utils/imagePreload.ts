export const loadedImageCache = new Set<string>();

export function preloadAppImages(urls: string[]): void {
  if (typeof window === 'undefined') return;
  urls.forEach((url) => {
    if (!url || loadedImageCache.has(url)) return;
    const img = new window.Image();
    img.decoding = 'async';
    img.onload = () => {
      loadedImageCache.add(url);
    };
    img.src = url;
    if (img.complete && img.naturalWidth > 0) {
      loadedImageCache.add(url);
    } else if (typeof img.decode === 'function') {
      img.decode()
        .then(() => {
          loadedImageCache.add(url);
        })
        .catch(() => {});
    }
  });
}
