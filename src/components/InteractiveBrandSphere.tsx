import React, { useEffect, useMemo, useRef } from 'react';
import { DomationLogoMark } from './DomationLogoMark';
import {
  ECOSYSTEM_PARTNERS,
  F1_AGENCY_PARTNERS,
  FLAGSHIP_PARTNERS,
} from '../data/enterpriseData';

interface SphereNode {
  id: string;
  name: string;
  logo: string;
  url?: string;
  tier: 'flagship' | 'f1' | 'ecosystem';
}

interface InteractiveBrandSphereProps {
  onSelectBrand?: (brand: SphereNode) => void;
}

export const InteractiveBrandSphere: React.FC<InteractiveBrandSphereProps> = ({
  onSelectBrand,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const nodeRefs = useRef<(HTMLAnchorElement | null)[]>([]);

  const nodes: SphereNode[] = useMemo(() => {
    const list: SphereNode[] = [];
    const seenLogos = new Set<string>();

    const pushUnique = (item: SphereNode) => {
      const normalized = item.logo.trim();
      if (!normalized || seenLogos.has(normalized)) return;
      seenLogos.add(normalized);
      list.push(item);
    };

    FLAGSHIP_PARTNERS.forEach((p) => {
      pushUnique({
        id: p.id,
        name: p.name,
        logo: p.logo,
        url: p.url,
        tier: 'flagship',
      });
    });

    F1_AGENCY_PARTNERS.forEach((p) => {
      pushUnique({
        id: p.id,
        name: p.name,
        logo: p.logo,
        tier: 'f1',
      });
    });

    ECOSYSTEM_PARTNERS.forEach((p, idx) => {
      pushUnique({
        id: `eco-${idx}`,
        name: p.name,
        logo: p.image,
        url: p.website && p.website !== '#' ? p.website : undefined,
        tier: 'ecosystem',
      });
    });

    return list;
  }, []);

  // Precompute Fibonacci unit sphere points
  const basePoints = useMemo(() => {
    const n = nodes.length;
    const goldenAngle = Math.PI * (3 - Math.sqrt(5));
    return nodes.map((_, i) => {
      const y = 1 - (i / Math.max(1, n - 1)) * 2;
      const rAtY = Math.sqrt(Math.max(0, 1 - y * y));
      const theta = goldenAngle * i;
      return {
        x: Math.cos(theta) * rAtY,
        y: y * 0.92,
        z: Math.sin(theta) * rAtY,
      };
    });
  }, [nodes]);

  const rotationRef = useRef({
    rx: 0.16,
    ry: 0.4,
    vx: 0.0005,
    vy: 0.0034,
    isDragging: false,
    isHovered: false,
    lastX: 0,
    lastY: 0,
  });

  useEffect(() => {
    let rafId = 0;
    let isVisible = true;
    const boxEl = containerRef.current;

    let io: IntersectionObserver | null = null;
    if (typeof IntersectionObserver !== 'undefined' && boxEl) {
      io = new IntersectionObserver(
        (entries) => {
          isVisible = Boolean(entries[0]?.isIntersecting);
        },
        { threshold: 0.02 }
      );
      io.observe(boxEl);
    }

    const renderFrame = () => {
      const state = rotationRef.current;
      const box = containerRef.current;
      if (box && isVisible) {
        if (!state.isDragging) {
          if (state.isHovered) {
            state.vx *= 0.88;
            state.vy *= 0.88;
          } else {
            state.vx = state.vx * 0.95 + 0.0003 * 0.05;
            state.vy = state.vy * 0.95 + 0.0032 * 0.05;
          }
          state.rx += state.vx;
          state.ry += state.vy;
          // Gently clamp vertical pitch
          if (state.rx > 0.55) state.rx = 0.55;
          if (state.rx < -0.55) state.rx = -0.55;
        }

        const w = box.clientWidth || 380;
        const radius = Math.min(w * 0.45, 250);
        const cosY = Math.cos(state.ry);
        const sinY = Math.sin(state.ry);
        const cosX = Math.cos(state.rx);
        const sinX = Math.sin(state.rx);

        for (let i = 0; i < basePoints.length; i++) {
          const el = nodeRefs.current[i];
          if (!el) continue;
          const p = basePoints[i];

          // Rotate Y
          const x1 = p.x * cosY - p.z * sinY;
          const z1 = p.z * cosY + p.x * sinY;
          // Rotate X
          const y2 = p.y * cosX - z1 * sinX;
          const z2 = z1 * cosX + p.y * sinX;

          const depth = (z2 + 1) / 2; // 0 (back) -> 1 (front)
          const scale = 0.64 + depth * 0.44;
          const tx = x1 * radius;
          const ty = y2 * radius;
          const opacity = 0.42 + depth * 0.58;

          el.style.transform = `translate3d(${tx.toFixed(1)}px, ${ty.toFixed(1)}px, 0) translate(-50%, -50%) scale(${scale.toFixed(3)})`;
          el.style.opacity = opacity.toFixed(3);
          el.style.zIndex = String(Math.round(depth * 40) + 5);
        }
      }

      rafId = requestAnimationFrame(renderFrame);
    };

    rafId = requestAnimationFrame(renderFrame);
    return () => {
      cancelAnimationFrame(rafId);
      io?.disconnect();
    };
  }, [basePoints]);

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    const s = rotationRef.current;
    s.isDragging = true;
    s.lastX = e.clientX;
    s.lastY = e.clientY;
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const s = rotationRef.current;
    if (!s.isDragging) return;
    const dx = e.clientX - s.lastX;
    const dy = e.clientY - s.lastY;
    s.lastX = e.clientX;
    s.lastY = e.clientY;
    s.vy = dx * 0.0045;
    s.vx = -dy * 0.0035;
    s.ry += s.vy;
    s.rx += s.vx;
  };

  const handlePointerUp = () => {
    rotationRef.current.isDragging = false;
  };

  return (
    <div
      ref={containerRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onMouseEnter={() => {
        rotationRef.current.isHovered = true;
      }}
      onMouseLeave={() => {
        rotationRef.current.isHovered = false;
        rotationRef.current.isDragging = false;
      }}
      className="relative w-full h-[390px] sm:h-[490px] lg:h-[550px] select-none touch-pan-y cursor-grab active:cursor-grabbing flex items-center justify-center overflow-visible"
    >
      {/* Orbital rings (neutral soft hairlines, zero loud colored borders) */}
      <div className="pointer-events-none absolute w-[300px] h-[300px] sm:w-[400px] sm:h-[400px] lg:w-[450px] lg:h-[450px] rounded-full border border-dashed border-slate-300/60" />
      <div className="pointer-events-none absolute w-[350px] h-[350px] sm:w-[470px] sm:h-[470px] lg:w-[530px] lg:h-[530px] rounded-full border border-slate-200/70" />

      {/* Radial soft glow behind DOMATION core (desktop only for mobile 60fps scroll) */}
      <div className="hidden lg:block pointer-events-none absolute w-72 h-72 rounded-full bg-gradient-to-br from-[#1E40FF]/14 via-sky-400/12 to-cyan-300/16 blur-2xl" />

      {/* Center DOMATION Core Hub */}
      <div className="relative z-20 w-20 h-20 sm:w-24 sm:h-24 lg:w-28 lg:h-28 rounded-3xl bg-white/95 backdrop-blur-xl border border-slate-200/80 shadow-[0_20px_50px_-10px_rgba(30,64,255,0.22)] flex flex-col items-center justify-center p-2 pointer-events-none">
        <DomationLogoMark className="w-11 h-11 sm:w-12 sm:h-12" />
        <span className="text-[9px] font-semibold uppercase tracking-[0.16em] text-[#1E40FF] mt-1">
          DOMATION
        </span>
      </div>

      {/* Orbiting Brand Nodes */}
      {nodes.map((node, idx) => (
        <a
          key={node.id}
          ref={(el) => {
            nodeRefs.current[idx] = el;
          }}
          href={node.url || '#partners'}
          target={node.url ? '_blank' : undefined}
          rel={node.url ? 'noopener noreferrer' : undefined}
          onClick={(e) => {
            if (!node.url) {
              e.preventDefault();
              onSelectBrand?.(node);
            }
          }}
          style={{ left: '50%', top: '50%' }}
          className={`absolute rounded-2xl bg-white/95 border border-slate-200/85 shadow-sm flex items-center justify-center p-1.5 transition-shadow duration-200 hover:shadow-[0_10px_28px_rgba(30,64,255,0.2)] ${
            node.tier === 'flagship'
              ? 'w-12 h-12 sm:w-16 sm:h-16 shadow-md'
              : node.tier === 'f1'
              ? 'w-11 h-11 sm:w-14 sm:h-14'
              : 'w-10 h-10 sm:w-12 sm:h-12'
          }`}
          title={node.name}
          aria-label={node.name}
        >
          <img
            src={node.logo}
            alt={node.name}
            loading="lazy"
            className="max-w-full max-h-full object-contain pointer-events-none"
          />
        </a>
      ))}
    </div>
  );
};
