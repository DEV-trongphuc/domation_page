import React, { useEffect, useRef, useState } from 'react';
import { Film } from 'lucide-react';
import { MOTION_VIDEO_BY_ID, type MotionVideoId } from '../data/motionVideos';

export type MotionVideoLayout = 'cinema-center' | 'split-right';

interface MotionVideoShowcaseProps {
  videoId: MotionVideoId;
  variant?: 'spotlight' | 'hub';
  layout?: MotionVideoLayout;
  className?: string;
  sectionTitle?: React.ReactNode;
  eyebrowText?: string;
}

const DEFAULT_LAYOUT_BY_VIDEO: Record<MotionVideoId, MotionVideoLayout> = {
  ecosystem: 'cinema-center',
  'dom-ai': 'cinema-center',
  erp: 'cinema-center',
  web3d: 'cinema-center',
  autodata: 'split-right',
  crm: 'split-right',
  automation: 'split-right',
  'meta-report': 'split-right',
};

export const MotionVideoShowcase: React.FC<MotionVideoShowcaseProps> = ({
  videoId,
  variant,
  layout,
  className = '',
  sectionTitle,
  eyebrowText,
}) => {
  const activeVideo = MOTION_VIDEO_BY_ID[videoId];
  const resolvedLayout: MotionVideoLayout =
    layout || (variant === 'hub' ? 'cinema-center' : DEFAULT_LAYOUT_BY_VIDEO[videoId]);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [currentTime, setCurrentTime] = useState<number>(activeVideo.initialTime ?? 0);
  const [duration, setDuration] = useState<number>(activeVideo.durationSec || 44);

  useEffect(() => {
    const vid = videoRef.current;
    const targetTime = activeVideo.initialTime ?? 0;
    setCurrentTime(targetTime);
    setDuration(activeVideo.durationSec || 44);
    if (!vid) return;
    if (vid.readyState >= 1) {
      vid.currentTime = targetTime;
    }
    const playPromise = vid.play();
    if (playPromise && typeof playPromise.catch === 'function') {
      playPromise.catch(() => {});
    }
  }, [activeVideo.id, activeVideo.initialTime, activeVideo.durationSec]);

  useEffect(() => {
    const target = containerRef.current;
    const vid = videoRef.current;
    if (!target || !vid || typeof IntersectionObserver === 'undefined') return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const p = vid.play();
            if (p && typeof p.catch === 'function') p.catch(() => {});
          } else {
            vid.pause();
          }
        }
      },
      { threshold: 0.25 }
    );
    observer.observe(target);
    return () => observer.disconnect();
  }, []);

  const handleSeek = (nextSec: number) => {
    const vid = videoRef.current;
    setCurrentTime(nextSec);
    if (vid) {
      vid.currentTime = nextSec;
      if (vid.paused) {
        vid.play().catch(() => {});
      }
    }
  };

  const progressPct = duration > 0 ? Math.min(100, Math.max(0, (currentTime / duration) * 100)) : 0;

  const renderHeaderCopy = (centered: boolean) => (
    <div className={centered ? 'max-w-2xl mx-auto text-center space-y-3' : 'space-y-3.5 text-left'}>
      <div
        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200/80 text-[#1E40FF] text-[10.5px] font-bold uppercase tracking-wider ${
          centered ? 'mx-auto' : ''
        }`}
      >
        <Film className="w-3.5 h-3.5 shrink-0" />
        <span>{eyebrowText || activeVideo.badge}</span>
      </div>

      <h2
        className={`font-bold text-slate-900 tracking-tight leading-[1.22] ${
          centered ? 'text-[20px] sm:text-2xl lg:text-[32px]' : 'text-[20px] sm:text-2xl lg:text-[26px]'
        }`}
      >
        {sectionTitle || (
          <>
            <span>{activeVideo.title}</span>
            {activeVideo.titleAccent && (
              <>
                {' '}
                <span className="text-gradient-inkica">{activeVideo.titleAccent}</span>
              </>
            )}
          </>
        )}
      </h2>

      <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
        {activeVideo.subtitle}
      </p>
    </div>
  );

  const renderVideoFrame = (wide: boolean) => (
    <div
      className={`group relative rounded-[22px] p-1.5 sm:p-2.5 bg-gradient-to-br from-blue-100/80 via-white to-cyan-100/70 border border-slate-200/90 shadow-[0_24px_60px_-22px_rgba(30,64,255,0.20)] ${
        wide ? 'max-w-5xl mx-auto' : 'w-full'
      }`}
    >
      <div className="relative rounded-[16px] overflow-hidden bg-slate-950 aspect-video w-full">
        <video
          ref={videoRef}
          src={activeVideo.videoSrc}
          poster={activeVideo.posterSrc}
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          onLoadedMetadata={(e) => {
            if (Number.isFinite(e.currentTarget.duration) && e.currentTarget.duration > 0) {
              setDuration(e.currentTarget.duration);
            }
            const target = activeVideo.initialTime ?? 0;
            if (target > 0 && Math.abs(e.currentTarget.currentTime - target) > 0.3) {
              e.currentTarget.currentTime = target;
            }
          }}
          onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
          className="w-full h-full object-cover pointer-events-none select-none"
        />

        {/* Minimalist Drag-Seekable Timeline Scrubber (Zero Buttons) */}
        <div className="absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-slate-950/60 via-slate-950/20 to-transparent flex items-end px-3 pb-2.5">
          <div className="relative w-full h-3 flex items-center cursor-pointer">
            <div className="w-full h-1 group-hover:h-1.5 transition-all rounded-full bg-white/30 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[#1E40FF] to-[#06B6D4] rounded-full"
                style={{ width: `${progressPct}%` }}
              />
            </div>
            <div
              aria-hidden="true"
              className="pointer-events-none absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-white border-2 border-[#1E40FF] shadow-md transition-transform group-hover:scale-110"
              style={{ left: `${progressPct}%` }}
            />
            <input
              type="range"
              min={0}
              max={duration}
              step={0.1}
              value={Math.min(duration, currentTime)}
              onChange={(e) => handleSeek(parseFloat(e.target.value))}
              aria-label="Kéo tua thời gian video"
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
          </div>
        </div>
      </div>
    </div>
  );

  if (resolvedLayout === 'cinema-center') {
    return (
      <div ref={containerRef} className={`w-full ${className}`}>
        <div className="space-y-6 sm:space-y-8">
          {renderHeaderCopy(true)}
          {renderVideoFrame(true)}
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className={`w-full ${className}`}>
      <div className="rounded-[28px] bg-white/90 backdrop-blur-xl border border-slate-200/85 shadow-[0_20px_54px_-24px_rgba(15,23,42,0.10)] p-5 sm:p-8 lg:p-9">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-9 items-center">
          {/* Video LEFT (7 cols) for clean alternating visual rhythm */}
          <div className="lg:col-span-7 order-2 lg:order-1">
            {renderVideoFrame(false)}
          </div>
          {/* Executive Copy RIGHT (5 cols) */}
          <div className="lg:col-span-5 order-1 lg:order-2">
            {renderHeaderCopy(false)}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MotionVideoShowcase;
