import React from 'react';

export const LuxuryGoldBackdrop: React.FC = () => {
  return (
    <div
      className="fixed inset-0 z-0 pointer-events-none overflow-hidden select-none bg-[#F8F9FA]"
      aria-hidden="true"
    >
      {/* Pure INKICA Fluent Brand Ambient Backdrop (Cyan -> Sky -> Royal Sapphire) */}
      <picture>
        <source srcSet="/imgs/landing/fluent-brand-ambient-bg.webp" type="image/webp" />
        <img
          src="/imgs/landing/fluent-brand-ambient-bg.jpg"
          alt=""
          className="h-full w-full select-none object-cover object-center opacity-35 sm:opacity-45 transition-opacity duration-700"
          fetchPriority="high"
        />
      </picture>

      {/* Luminous Daylight Veil & INKICA Radial Blooms (heavy blurs desktop-only for 60fps mobile scroll) */}
      <div className="absolute inset-0 bg-white/45" />
      <div className="hidden lg:block absolute inset-0 bg-[radial-gradient(ellipse_100%_80%_at_50%_30%,rgba(255,255,255,0.18)_18%,rgba(248,250,252,0.52)_68%,rgba(248,249,250,0.92)_100%)]" />
      <div className="hidden lg:block absolute top-[-10%] left-[4%] h-[460px] w-[460px] rounded-full bg-sky-300/20 blur-[110px]" />
      <div className="hidden lg:block absolute top-[28%] right-[2%] h-[400px] w-[400px] rounded-full bg-cyan-200/25 blur-[110px]" />
      <div className="hidden lg:block absolute bottom-[-8%] left-[30%] h-[340px] w-[460px] rounded-full bg-blue-200/25 blur-[110px]" />
    </div>
  );
};
