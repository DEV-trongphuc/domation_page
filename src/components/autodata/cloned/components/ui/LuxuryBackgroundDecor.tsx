import React from 'react';
import { DomationLogoMark } from '../../../../DomationLogoMark';

interface LuxuryBackgroundDecorProps {
  variant?: 'app' | 'report' | 'login';
}

export const LuxuryBackgroundDecor: React.FC<LuxuryBackgroundDecorProps> = ({ variant = 'app' }) => {
  return (
    <div className={`ql-luxury-decor-layer ql-decor-${variant}`} aria-hidden="true">
      {/* 1. Architectural Hairline Frame with '+' Corner Crosshairs */}
      <div className="ql-brochure-frame-decor">
        <span className="ql-frame-cross bl">+</span>
        <span className="ql-frame-cross br">+</span>
      </div>

      {/* 2. Flowing Silk Wave Line Decor */}
      <svg className="ql-silk-wave-decor" viewBox="0 0 1440 900" preserveAspectRatio="none">
        <g fill="none" stroke="rgba(30, 64, 255, 0.28)">
          <path d="M 0 110 C 260 55, 540 165, 860 95 C 1120 40, 1290 130, 1440 80" strokeWidth="1.15" />
          <path d="M 0 480 C 310 540, 640 420, 960 485 C 1190 530, 1320 450, 1440 495" strokeWidth="1.0" />
          <path d="M 0 760 C 290 810, 610 700, 940 765 C 1180 805, 1310 725, 1440 770" strokeWidth="1.05" />
        </g>
      </svg>

      {/* 3. Ambient Corner Official App Brand Emblem Watermarks (Top-Left & Bottom-Right) */}
      <DomationLogoMark className="ql-sec-decor tl-hero" />
      <DomationLogoMark className="ql-sec-decor br" />
    </div>
  );
};
