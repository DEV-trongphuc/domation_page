import React, { useCallback, useState } from 'react';
import { loadedImageCache } from '../utils/imagePreload';

interface SmoothAppImageProps {
  src: string;
  alt: string;
  aspectClass?: string;
  fit?: 'contain' | 'cover';
  eager?: boolean;
  hoverZoom?: boolean;
  className?: string;
  bgClass?: string;
}

export const SmoothAppImage: React.FC<SmoothAppImageProps> = ({
  src,
  alt,
  aspectClass = 'aspect-[16/10]',
  fit = 'contain',
  eager = false,
  hoverZoom = true,
  className = '',
  bgClass = 'bg-white',
}) => {
  const [loadedSrc, setLoadedSrc] = useState<string>(() =>
    loadedImageCache.has(src) ? src : ''
  );

  const isCurrentLoaded = loadedImageCache.has(src) || loadedSrc === src;

  const markLoaded = useCallback((url: string) => {
    loadedImageCache.add(url);
    setLoadedSrc(url);
  }, []);

  const setImgRef = useCallback(
    (el: HTMLImageElement | null) => {
      if (el && el.complete && el.naturalWidth > 0 && !loadedImageCache.has(src)) {
        queueMicrotask(() => markLoaded(src));
      }
    },
    [src, markLoaded]
  );

  const fitClass =
    fit === 'contain' ? 'object-contain object-center' : 'object-cover object-top';
  const zoomClass = hoverZoom
    ? 'transition-transform duration-500 group-hover:scale-[1.015]'
    : '';

  return (
    <div className={`relative w-full ${aspectClass} ${bgClass} overflow-hidden ${className}`}>
      {/* Layout-matched Skeleton while image downloads/decodes */}
      {!isCurrentLoaded && (
        <div
          aria-hidden="true"
          className="absolute inset-0 z-10 p-4 flex flex-col gap-3 bg-slate-50 animate-pulse"
        >
          <div className="h-5 w-1/3 rounded-md bg-slate-200/80" />
          <div className="grid grid-cols-3 gap-2.5">
            <div className="h-12 rounded-lg bg-slate-200/70" />
            <div className="h-12 rounded-lg bg-slate-200/70" />
            <div className="h-12 rounded-lg bg-slate-200/70" />
          </div>
          <div className="flex-1 rounded-xl bg-slate-200/60" />
        </div>
      )}

      <img
        key={src}
        ref={setImgRef}
        src={src}
        alt={alt}
        loading={eager ? 'eager' : 'lazy'}
        decoding="async"
        onLoad={() => markLoaded(src)}
        onError={() => markLoaded(src)}
        className={`w-full h-full ${fitClass} ${zoomClass} ${
          isCurrentLoaded
            ? 'opacity-100 animate-[smoothImgIn_0.22s_cubic-bezier(0.22,1,0.36,1)]'
            : 'opacity-0'
        }`}
      />
    </div>
  );
};
