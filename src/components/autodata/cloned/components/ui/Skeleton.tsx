import React, { useEffect, useState } from 'react';

// ─── Responsive hook for adaptive per-screen skeletons ─────────────────────────
const useResponsive = () => {
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth <= 768 : false
  );
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  return isMobile;
};

// ─── Skeleton primitive (Bright Royal Sapphire shimmer) ───────────────────────
interface SkeletonProps {
  width?: string | number;
  height?: string | number;
  borderRadius?: string | number;
  style?: React.CSSProperties;
  className?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  width = '100%',
  height = 16,
  borderRadius = 8,
  style,
  className = '',
}) => (
  <div
    aria-hidden="true"
    className={`skeleton ${className}`.trim()}
    style={{
      width,
      height,
      borderRadius,
      background:
        'linear-gradient(90deg, var(--skeleton-base, #E2E8F0) 25%, var(--skeleton-shine, #F1F5F9) 50%, var(--skeleton-base, #E2E8F0) 75%)',
      backgroundSize: '200% 100%',
      animation: 'skeletonShimmer 1.5s ease-in-out infinite',
      flexShrink: 0,
      ...style,
    }}
  />
);

const CARD_SURFACE_STYLE: React.CSSProperties = {
  background: '#FFFFFF',
  border: '1px solid #E2E8F0',
  borderRadius: 18,
  boxShadow: '0 2px 8px rgba(15, 23, 42, 0.04)',
};

// ─── KPI card skeleton ────────────────────────────────────────────────────────
export const KpiCardSkeleton: React.FC = () => (
  <div
    className="stat-card skeleton-card"
    style={{
      ...CARD_SURFACE_STYLE,
      minHeight: 136,
      padding: '1.15rem 1.25rem',
      display: 'flex',
      flexDirection: 'column',
      gap: 10,
    }}
  >
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <Skeleton width="58%" height={11} borderRadius={4} />
      <Skeleton width={34} height={34} borderRadius={10} style={{ backgroundColor: '#CBD5E1' }} />
    </div>
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <Skeleton width="48%" height={28} borderRadius={6} />
      <Skeleton width="28%" height={20} borderRadius={6} />
    </div>
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5, marginTop: 'auto' }}>
      <Skeleton width="78%" height={10} borderRadius={4} />
      <Skeleton width="64%" height={10} borderRadius={4} />
    </div>
  </div>
);

// ─── Table row skeleton ───────────────────────────────────────────────────────
export const TableRowSkeleton: React.FC<{ cols?: number }> = ({ cols = 4 }) => (
  <tr style={{ borderBottom: '1px solid #F1F5F9' }}>
    {Array.from({ length: cols }).map((_, i) => (
      <td key={i} style={{ padding: '1rem 1.25rem' }}>
        <Skeleton width={i === 0 ? 130 : i === cols - 1 ? 72 : 92} height={13} />
        {i === 0 && <Skeleton width={76} height={9} style={{ marginTop: 6 }} />}
      </td>
    ))}
  </tr>
);

// ─── Table skeleton (full) ────────────────────────────────────────────────────
export const TableSkeleton: React.FC<{ rows?: number; cols?: number }> = ({
  rows = 5,
  cols = 4,
}) => {
  const isMobile = useResponsive();
  const activeCols = isMobile ? Math.min(cols, 2) : cols;

  return (
    <div className="card skeleton-card" style={{ ...CARD_SURFACE_STYLE, padding: 0, overflow: 'hidden' }}>
      <div
        style={{
          padding: '0.95rem 1.25rem',
          borderBottom: '1px solid #E2E8F0',
          background: '#F8FAFF',
          display: 'flex',
          gap: 16,
        }}
      >
        {Array.from({ length: activeCols }).map((_, i) => (
          <Skeleton key={i} width={i === 0 ? 110 : 76} height={11} />
        ))}
      </div>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <tbody>
          {Array.from({ length: rows }).map((_, i) => (
            <TableRowSkeleton key={i} cols={activeCols} />
          ))}
        </tbody>
      </table>
    </div>
  );
};

// ─── Card skeleton (general) ──────────────────────────────────────────────────
export const CardSkeleton: React.FC<{ height?: number }> = ({ height = 120 }) => (
  <div
    className="card skeleton-card"
    style={{ ...CARD_SURFACE_STYLE, padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: 14 }}
  >
    <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
      <Skeleton width={40} height={40} borderRadius="50%" />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
        <Skeleton width="55%" height={13} />
        <Skeleton width="35%" height={11} />
      </div>
    </div>
    <Skeleton width="100%" height={Math.max(40, height - 75)} borderRadius={10} />
  </div>
);

// ─── Page header skeleton ─────────────────────────────────────────────────────
export const PageHeaderSkeleton: React.FC = () => {
  const isMobile = useResponsive();
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: isMobile ? 'column' : 'row',
        alignItems: isMobile ? 'flex-start' : 'center',
        justifyContent: 'space-between',
        gap: 12,
        marginBottom: '1.25rem',
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, width: '100%' }}>
        <Skeleton width={isMobile ? '60%' : 220} height={22} borderRadius={8} />
        <Skeleton width={isMobile ? '82%' : 310} height={12} borderRadius={6} />
      </div>
      {!isMobile && (
        <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
          <Skeleton width={110} height={40} borderRadius={12} />
          <Skeleton width={136} height={40} borderRadius={12} />
        </div>
      )}
    </div>
  );
};

// ─── Stat row skeleton ────────────────────────────────────────────────────────
export const StatRowSkeleton: React.FC = () => (
  <div
    style={{
      display: 'flex',
      gap: 12,
      alignItems: 'center',
      padding: '10px 0',
      borderBottom: '1px solid #F1F5F9',
    }}
  >
    <Skeleton width={34} height={34} borderRadius="50%" />
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
      <Skeleton width="52%" height={12} />
      <Skeleton width="32%" height={10} />
    </div>
    <Skeleton width={48} height={20} borderRadius={10} />
  </div>
);

// ─── Round card & grid skeletons ──────────────────────────────────────────────
export const RoundCardSkeleton: React.FC = () => (
  <div
    className="card skeleton-card"
    style={{ ...CARD_SURFACE_STYLE, padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: 14 }}
  >
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <Skeleton width={150} height={16} />
        <Skeleton width={76} height={20} borderRadius={16} />
      </div>
      <Skeleton width={28} height={28} borderRadius={8} />
    </div>
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {Array.from({ length: 3 }).map((_, i) => (
        <StatRowSkeleton key={i} />
      ))}
    </div>
    <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
      <Skeleton width={80} height={34} borderRadius={10} />
      <Skeleton width={96} height={34} borderRadius={10} />
    </div>
  </div>
);

export const RoundGridSkeleton: React.FC = () => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', width: '100%' }}>
    <PageHeaderSkeleton />
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.25rem' }}>
      <RoundCardSkeleton />
      <RoundCardSkeleton />
      <RoundCardSkeleton />
    </div>
  </div>
);

// ─── Calendar skeleton ────────────────────────────────────────────────────────
export const CalendarSkeleton: React.FC = () => {
  const isMobile = useResponsive();
  const totalCells = isMobile ? 7 : 28;

  return (
    <div
      className="skeleton-card"
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(7, 1fr)',
        gridAutoRows: isMobile ? 'minmax(65px, 1fr)' : 'minmax(110px, 1fr)',
        width: '100%',
      }}
    >
      {Array.from({ length: totalCells }).map((_, i) => (
        <div
          key={i}
          style={{
            borderRight: '1px solid #F1F5F9',
            borderBottom: '1px solid #F1F5F9',
            padding: isMobile ? '0.375rem' : '0.75rem',
            display: 'flex',
            flexDirection: 'column',
            gap: isMobile ? 4 : 8,
            background: i % 7 === 5 || i % 7 === 6 ? '#F8FAFC' : '#FFFFFF',
          }}
        >
          <Skeleton width={16} height={10} />
          {!isMobile && (
            <>
              <Skeleton width="80%" height={9} style={{ marginTop: 4 }} />
              <Skeleton width="55%" height={9} />
            </>
          )}
        </div>
      ))}
    </div>
  );
};

// ─── Chart skeleton ───────────────────────────────────────────────────────────
export const ChartSkeleton: React.FC<{ height?: number }> = ({ height = 300 }) => {
  const isMobile = useResponsive();
  const barsCount = isMobile ? 6 : 10;

  return (
    <div
      className="card skeleton-card"
      style={{
        ...CARD_SURFACE_STYLE,
        padding: '1.35rem',
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: 1 }}>
          <Skeleton width={isMobile ? '68%' : 210} height={17} borderRadius={6} />
          <Skeleton width={isMobile ? '85%' : 280} height={11} borderRadius={5} />
        </div>
        <Skeleton width={88} height={26} borderRadius={8} />
      </div>
      <div
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'flex-end',
          gap: isMobile ? 8 : 14,
          height: height - 65,
          padding: '12px 4px 0',
        }}
      >
        {Array.from({ length: barsCount }).map((_, i) => (
          <div
            key={i}
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 6,
              height: '100%',
              justifyContent: 'flex-end',
            }}
          >
            <Skeleton width="65%" height={10} borderRadius={3} />
            <Skeleton
              width="100%"
              height={`${Math.max(18, Math.round(Math.sin(i * 1.1) * 32 + 52))}%`}
              borderRadius="6px 6px 2px 2px"
            />
            <Skeleton width="75%" height={9} borderRadius={3} />
          </div>
        ))}
      </div>
    </div>
  );
};

// ─── Archetype 1 Skeleton: Ranked List (Left) + Donut (Right) ──────────────────
export const DonutAndRankedListSkeleton: React.FC<{ rows?: number }> = ({ rows = 5 }) => {
  const isMobile = useResponsive();
  return (
    <div
      className="card skeleton-card"
      style={{ ...CARD_SURFACE_STYLE, padding: '1.35rem', display: 'flex', flexDirection: 'column', gap: 16 }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: 1 }}>
          <Skeleton width={isMobile ? '70%' : 220} height={17} borderRadius={6} />
          <Skeleton width={isMobile ? '88%' : 270} height={11} borderRadius={5} />
        </div>
        <Skeleton width={76} height={26} borderRadius={8} />
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : '1.15fr 0.85fr',
          gap: '1.1rem',
          alignItems: 'center',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {Array.from({ length: rows }).map((_, i) => (
            <div
              key={i}
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 6,
                padding: '6px 8px',
                borderRadius: 8,
                border: '1px solid #F1F5F9',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1 }}>
                  <Skeleton width={18} height={13} borderRadius={4} />
                  <Skeleton width={22} height={22} borderRadius={6} />
                  <Skeleton width={`${62 - (i % 3) * 10}%`} height={13} borderRadius={4} />
                </div>
                <Skeleton width={52} height={14} borderRadius={4} />
              </div>
              <div style={{ marginLeft: 26 }}>
                <Skeleton width={`${Math.max(25, 92 - i * 14)}%`} height={6} borderRadius={4} />
              </div>
            </div>
          ))}
        </div>

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            paddingLeft: isMobile ? 0 : 12,
            paddingTop: isMobile ? 12 : 0,
            borderLeft: isMobile ? 'none' : '1px solid #F1F5F9',
            borderTop: isMobile ? '1px solid #F1F5F9' : 'none',
          }}
        >
          <div style={{ position: 'relative', width: 156, height: 156, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Skeleton width={156} height={156} borderRadius="50%" />
            <div
              style={{
                position: 'absolute',
                width: 108,
                height: 108,
                borderRadius: '50%',
                background: '#FFFFFF',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
              }}
            >
              <Skeleton width={46} height={18} borderRadius={5} />
              <Skeleton width={64} height={10} borderRadius={4} />
            </div>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 8, marginTop: 12 }}>
            <Skeleton width={68} height={14} borderRadius={4} />
            <Skeleton width={68} height={14} borderRadius={4} />
            <Skeleton width={68} height={14} borderRadius={4} />
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Archetype 2 Skeleton: Donut (Left) + BarChart (Right) ────────────────────
export const DonutAndBarChartSkeleton: React.FC = () => {
  const isMobile = useResponsive();
  return (
    <div
      className="card skeleton-card"
      style={{ ...CARD_SURFACE_STYLE, padding: '1.35rem', display: 'flex', flexDirection: 'column', gap: 16 }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: 1 }}>
          <Skeleton width={isMobile ? '68%' : 210} height={17} borderRadius={6} />
          <Skeleton width={isMobile ? '85%' : 265} height={11} borderRadius={5} />
        </div>
        <Skeleton width={74} height={26} borderRadius={8} />
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : '0.88fr 1.12fr',
          gap: '1.1rem',
          alignItems: 'center',
          flex: 1,
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            paddingRight: isMobile ? 0 : 10,
            paddingBottom: isMobile ? 12 : 0,
            borderRight: isMobile ? 'none' : '1px solid #F1F5F9',
            borderBottom: isMobile ? '1px solid #F1F5F9' : 'none',
          }}
        >
          <div style={{ position: 'relative', width: 146, height: 146, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Skeleton width={146} height={146} borderRadius="50%" />
            <div
              style={{
                position: 'absolute',
                width: 100,
                height: 100,
                borderRadius: '50%',
                background: '#FFFFFF',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 5,
              }}
            >
              <Skeleton width={44} height={16} borderRadius={4} />
              <Skeleton width={58} height={10} borderRadius={4} />
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, width: '100%', maxWidth: 195, marginTop: 10 }}>
            <Skeleton width="100%" height={26} borderRadius={7} />
            <Skeleton width="100%" height={26} borderRadius={7} />
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, height: 215, justifyContent: 'flex-end' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Skeleton width={110} height={13} borderRadius={4} />
            <Skeleton width={65} height={11} borderRadius={4} />
          </div>
          <div style={{ flex: 1, display: 'flex', alignItems: 'flex-end', gap: 10, paddingTop: 10 }}>
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                style={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 6,
                  height: '100%',
                  justifyContent: 'flex-end',
                }}
              >
                <Skeleton width="70%" height={9} borderRadius={3} />
                <Skeleton width="100%" height={`${Math.max(22, 35 + ((i * 23) % 58))}%`} borderRadius="6px 6px 2px 2px" />
                <Skeleton width="80%" height={9} borderRadius={3} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Interaction 6-Box Grid Skeleton ──────────────────────────────────────────
export const InteractionGridSkeleton: React.FC = () => {
  const isMobile = useResponsive();
  return (
    <div
      className="card skeleton-card"
      style={{ ...CARD_SURFACE_STYLE, padding: '1.35rem', display: 'flex', flexDirection: 'column', gap: 16 }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: 1 }}>
          <Skeleton width={isMobile ? '75%' : 240} height={17} borderRadius={6} />
          <Skeleton width={isMobile ? '90%' : 290} height={11} borderRadius={5} />
        </div>
        <Skeleton width={120} height={26} borderRadius={8} />
      </div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? 'repeat(2, minmax(0, 1fr))' : 'repeat(3, minmax(0, 1fr))',
          gap: 12,
        }}
      >
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            style={{
              padding: 14,
              borderRadius: 12,
              border: '1px solid #E2E8F0',
              background: '#F8FAFC',
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Skeleton width="58%" height={12} borderRadius={4} />
              <Skeleton width={26} height={26} borderRadius={7} />
            </div>
            <Skeleton width="72%" height={22} borderRadius={6} />
            <Skeleton width="85%" height={10} borderRadius={4} />
          </div>
        ))}
      </div>
    </div>
  );
};

// ─── Leaderboard Card Skeleton ────────────────────────────────────────────────
export const LeaderboardCardSkeleton: React.FC<{ rows?: number }> = ({ rows = 5 }) => {
  const isMobile = useResponsive();
  return (
    <div
      className="card skeleton-card"
      style={{ ...CARD_SURFACE_STYLE, padding: '1.35rem', display: 'flex', flexDirection: 'column', gap: 14 }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: 1 }}>
          <Skeleton width={isMobile ? '72%' : 220} height={17} borderRadius={6} />
          <Skeleton width={isMobile ? '88%' : 280} height={11} borderRadius={5} />
        </div>
        <Skeleton width={isMobile ? 90 : 150} height={30} borderRadius={8} />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {Array.from({ length: rows }).map((_, i) => (
          <div
            key={i}
            style={{
              padding: '10px 12px',
              borderRadius: 10,
              border: '1px solid #E2E8F0',
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1 }}>
                <Skeleton width={20} height={16} borderRadius={4} />
                <Skeleton width={28} height={28} borderRadius="50%" />
                <Skeleton width={isMobile ? '55%' : 140} height={14} borderRadius={4} />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Skeleton width={48} height={15} borderRadius={4} />
                <Skeleton width={38} height={20} borderRadius={6} />
              </div>
            </div>
            <div style={{ marginLeft: 30 }}>
              <Skeleton width={`${Math.max(30, 92 - i * 14)}%`} height={5} borderRadius={4} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ─── Completeness / SLA Health Grid Skeleton ──────────────────────────────────
export const CompletenessGridSkeleton: React.FC<{ items?: number }> = ({ items = 6 }) => {
  const isMobile = useResponsive();
  return (
    <div
      className="card skeleton-card"
      style={{ ...CARD_SURFACE_STYLE, padding: '1.35rem', display: 'flex', flexDirection: 'column', gap: 14 }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: 1 }}>
          <Skeleton width={isMobile ? '70%' : 210} height={17} borderRadius={6} />
          <Skeleton width={isMobile ? '85%' : 260} height={11} borderRadius={5} />
        </div>
        <Skeleton width={86} height={26} borderRadius={8} />
      </div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, minmax(0, 1fr))',
          gap: 10,
        }}
      >
        {Array.from({ length: items }).map((_, i) => (
          <div
            key={i}
            style={{
              padding: '10px 12px',
              borderRadius: 10,
              border: '1px solid #F1F5F9',
              background: '#F8FAFC',
              display: 'flex',
              flexDirection: 'column',
              gap: 7,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Skeleton width="56%" height={13} borderRadius={4} />
              <Skeleton width={42} height={18} borderRadius={999} />
            </div>
            <Skeleton width="100%" height={6} borderRadius={999} />
            <Skeleton width="42%" height={10} borderRadius={4} />
          </div>
        ))}
      </div>
    </div>
  );
};

// ─── Pipeline 4-Card + Spectrum Bar Skeleton ──────────────────────────────────
export const PipelineCardsAndSpectrumSkeleton: React.FC = () => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <Skeleton width={210} height={17} borderRadius={6} />
        <Skeleton width={310} height={11} borderRadius={5} />
      </div>
      <Skeleton width={110} height={26} borderRadius={8} />
    </div>
    <div className="dashboard-kpi-grid" style={{ marginBottom: 0 }}>
      <KpiCardSkeleton />
      <KpiCardSkeleton />
      <KpiCardSkeleton />
      <KpiCardSkeleton />
    </div>
    <div
      className="card skeleton-card"
      style={{
        ...CARD_SURFACE_STYLE,
        padding: '12px 14px',
        borderRadius: 12,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 14,
        flexWrap: 'wrap',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <Skeleton width={130} height={14} borderRadius={4} />
        <Skeleton width={85} height={20} borderRadius={6} />
        <Skeleton width={95} height={20} borderRadius={6} />
        <Skeleton width={95} height={20} borderRadius={6} />
      </div>
      <Skeleton width={280} height={8} borderRadius={999} />
    </div>
  </div>
);

// ─── Drawer skeleton (for all 14 CRM/ERP Drawers) ────────────────────────────
export const DrawerSkeleton: React.FC = () => (
  <div
    style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      padding: '20px',
      gap: '20px',
      background: '#FFFFFF',
    }}
  >
    {/* Drawer Header */}
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: '1px solid #E2E8F0',
        paddingBottom: '16px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        <Skeleton width={46} height={46} borderRadius="50%" />
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <Skeleton width={185} height={18} />
          <Skeleton width={120} height={12} />
        </div>
      </div>
      <Skeleton width={76} height={32} borderRadius={10} />
    </div>

    {/* Navigation Tabs */}
    <div
      style={{
        display: 'flex',
        gap: '10px',
        borderBottom: '1px solid #F1F5F9',
        paddingBottom: '10px',
        overflowX: 'auto',
      }}
    >
      <Skeleton width={84} height={28} borderRadius={8} />
      <Skeleton width={94} height={28} borderRadius={8} />
      <Skeleton width={78} height={28} borderRadius={8} />
      <Skeleton width={102} height={28} borderRadius={8} />
    </div>

    {/* Form / Content Grid */}
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
      {Array.from({ length: 4 }).map((_, idx) => (
        <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <Skeleton width={92 + (idx % 2) * 18} height={12} />
          <Skeleton width="100%" height={40} borderRadius={10} />
        </div>
      ))}
    </div>

    {/* Large description / notes area */}
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
      <Skeleton width={130} height={14} />
      <Skeleton width="100%" height={120} borderRadius={12} />
    </div>

    {/* Timeline / Activity Feed */}
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '6px' }}>
      {Array.from({ length: 2 }).map((_, i) => (
        <div key={i} style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <Skeleton width={32} height={32} borderRadius="50%" />
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <Skeleton width={`${62 - i * 10}%`} height={12} />
            <Skeleton width={`${42 - i * 8}%`} height={10} />
          </div>
        </div>
      ))}
    </div>
  </div>
);

// ─── Modal body skeleton (for Builder / Settings / Form Modals) ───────────────
export const ModalBodySkeleton: React.FC<{ rows?: number }> = ({ rows = 4 }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 16, padding: '8px 4px', background: '#FFFFFF' }}>
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px 14px',
        borderRadius: 12,
        background: '#F8FAFF',
        border: '1px solid #E2E8F0',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <Skeleton width={34} height={34} borderRadius={10} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <Skeleton width={170} height={14} />
          <Skeleton width={230} height={11} />
        </div>
      </div>
      <Skeleton width={84} height={30} borderRadius={999} />
    </div>
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 14 }}>
      {Array.from({ length: rows }).map((_, idx) => (
        <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <Skeleton width={96} height={11} />
          <Skeleton width="100%" height={42} borderRadius={10} />
        </div>
      ))}
    </div>
    <Skeleton width="100%" height={110} borderRadius={12} />
    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, paddingTop: 8, borderTop: '1px solid #F1F5F9' }}>
      <Skeleton width={92} height={40} borderRadius={10} />
      <Skeleton width={132} height={40} borderRadius={10} />
    </div>
  </div>
);

// ─── Timeline skeleton ────────────────────────────────────────────────────────
export const TimelineSkeleton: React.FC<{ count?: number }> = ({ count = 4 }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', padding: '8px 0' }}>
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
        <Skeleton width={34} height={34} borderRadius="50%" />
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            background: '#F8FAFC',
            border: '1px solid #E2E8F0',
            padding: '12px',
            borderRadius: '12px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Skeleton width={135} height={14} />
            <Skeleton width={70} height={10} />
          </div>
          <Skeleton width="90%" height={12} />
          <Skeleton width="65%" height={12} />
        </div>
      </div>
    ))}
  </div>
);

// ─── Specialized Per-Tab Skeletons ────────────────────────────────────────────
export const DashboardTabSkeleton: React.FC = () => {
  const isMobile = useResponsive();
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', width: '100%' }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <Skeleton width={isMobile ? 180 : 250} height={24} borderRadius={8} />
          <Skeleton width={isMobile ? 220 : 330} height={13} borderRadius={6} />
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <Skeleton width={150} height={40} borderRadius={10} />
          {!isMobile && <Skeleton width={118} height={40} borderRadius={10} />}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)', gap: '1rem' }}>
        {Array.from({ length: 4 }).map((_, i) => (
          <KpiCardSkeleton key={i} />
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1.4fr 1fr', gap: '1.25rem' }}>
        <ChartSkeleton height={280} />
        <ChartSkeleton height={280} />
      </div>

      <TableSkeleton rows={5} cols={5} />
    </div>
  );
};

export const WorkspaceTabSkeleton: React.FC = () => {
  const isMobile = useResponsive();
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', width: '100%' }}>
      <div
        className="card skeleton-card"
        style={{
          ...CARD_SURFACE_STYLE,
          padding: '1.25rem 1.5rem',
          display: 'flex',
          flexDirection: isMobile ? 'column' : 'row',
          justifyContent: 'space-between',
          alignItems: isMobile ? 'flex-start' : 'center',
          gap: '16px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <Skeleton width={48} height={48} borderRadius="50%" />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <Skeleton width={220} height={20} borderRadius={6} />
            <Skeleton width={280} height={12} borderRadius={6} />
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} width={96} height={32} borderRadius={20} />
          ))}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1.35fr 1fr', gap: '1.25rem' }}>
        <div className="card skeleton-card" style={{ ...CARD_SURFACE_STYLE, padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Skeleton width={180} height={18} />
            <div style={{ display: 'flex', gap: '6px' }}>
              <Skeleton width={70} height={26} borderRadius={14} />
              <Skeleton width={70} height={26} borderRadius={14} />
            </div>
          </div>
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px',
                borderRadius: '10px',
                border: '1px solid #F1F5F9',
              }}
            >
              <Skeleton width={20} height={20} borderRadius={6} />
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <Skeleton width="70%" height={13} />
                <Skeleton width="45%" height={10} />
              </div>
              <Skeleton width={68} height={22} borderRadius={12} />
            </div>
          ))}
        </div>

        <div className="card skeleton-card" style={{ ...CARD_SURFACE_STYLE, padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Skeleton width={160} height={18} />
            <Skeleton width={60} height={22} borderRadius={10} />
          </div>
          <TimelineSkeleton count={4} />
        </div>
      </div>
    </div>
  );
};

export const CalendarTabSkeleton: React.FC = () => {
  const isMobile = useResponsive();
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', width: '100%' }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <Skeleton width={200} height={22} />
          <Skeleton width={260} height={12} />
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <Skeleton width={120} height={38} borderRadius={10} />
          <div
            style={{
              display: 'flex',
              gap: '4px',
              padding: '4px',
              background: '#FFFFFF',
              borderRadius: 10,
              border: '1px solid #E2E8F0',
            }}
          >
            <Skeleton width={64} height={28} borderRadius={6} />
            <Skeleton width={64} height={28} borderRadius={6} />
            {!isMobile && <Skeleton width={64} height={28} borderRadius={6} />}
          </div>
        </div>
      </div>

      <div className="card skeleton-card" style={{ ...CARD_SURFACE_STYLE, padding: 0, overflow: 'hidden' }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(7, 1fr)',
            borderBottom: '1px solid #E2E8F0',
            padding: '10px 0',
            background: '#F8FAFF',
          }}
        >
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'center' }}>
              <Skeleton width={isMobile ? 24 : 48} height={12} borderRadius={4} />
            </div>
          ))}
        </div>
        <CalendarSkeleton />
      </div>
    </div>
  );
};

export const FeedTabSkeleton: React.FC = () => {
  const isMobile = useResponsive();
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr' : '260px minmax(0, 1fr) 280px',
        gap: '1.25rem',
        width: '100%',
        alignItems: 'start',
      }}
    >
      {!isMobile && (
        <div className="card skeleton-card" style={{ ...CARD_SURFACE_STYLE, padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Skeleton width={44} height={44} borderRadius="50%" />
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <Skeleton width="80%" height={14} />
              <Skeleton width="55%" height={11} />
            </div>
          </div>
          <div style={{ height: 1, background: '#F1F5F9' }} />
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Skeleton width={28} height={28} borderRadius={8} />
              <Skeleton width="70%" height={12} />
            </div>
          ))}
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div className="card skeleton-card" style={{ ...CARD_SURFACE_STYLE, padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <Skeleton width={40} height={40} borderRadius="50%" />
            <Skeleton width="100%" height={40} borderRadius={20} style={{ flex: 1 }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '8px', borderTop: '1px solid #F1F5F9' }}>
            <div style={{ display: 'flex', gap: '8px' }}>
              <Skeleton width={85} height={28} borderRadius={8} />
              <Skeleton width={85} height={28} borderRadius={8} />
            </div>
            <Skeleton width={90} height={34} borderRadius={10} />
          </div>
        </div>

        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="card skeleton-card" style={{ ...CARD_SURFACE_STYLE, padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Skeleton width={42} height={42} borderRadius="50%" />
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <Skeleton width={160} height={14} />
                <Skeleton width={100} height={11} />
              </div>
              <Skeleton width={28} height={28} borderRadius={6} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <Skeleton width="95%" height={12} />
              <Skeleton width="82%" height={12} />
              <Skeleton width="60%" height={12} />
            </div>
            <Skeleton width="100%" height={180} borderRadius={12} />
          </div>
        ))}
      </div>

      {!isMobile && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="card skeleton-card" style={{ ...CARD_SURFACE_STYLE, padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <Skeleton width={140} height={15} />
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: '6px', padding: '10px', borderRadius: 8, background: '#F8FAFC' }}>
                <Skeleton width="85%" height={12} />
                <Skeleton width="50%" height={10} />
              </div>
            ))}
          </div>
          <div className="card skeleton-card" style={{ ...CARD_SURFACE_STYLE, padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <Skeleton width={130} height={15} />
            <StatRowSkeleton />
            <StatRowSkeleton />
          </div>
        </div>
      )}
    </div>
  );
};

export const ApprovalsTabSkeleton: React.FC = () => {
  const isMobile = useResponsive();
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem', width: '100%' }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <Skeleton width={220} height={24} borderRadius={8} />
          <Skeleton width={300} height={13} borderRadius={6} />
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <Skeleton width={104} height={40} borderRadius={12} />
          <Skeleton width={138} height={40} borderRadius={12} />
        </div>
      </div>

      <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '6px', borderBottom: '1px solid #E2E8F0' }}>
        {[124, 134, 128, 96].map((w, i) => (
          <Skeleton key={i} width={w} height={36} borderRadius={10} />
        ))}
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '10px' }}>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {[125, 165, 160].map((w, i) => (
            <Skeleton key={i} width={w} height={30} borderRadius={20} />
          ))}
        </div>
        {!isMobile && <Skeleton width={240} height={38} borderRadius={10} />}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="card skeleton-card"
            style={{
              ...CARD_SURFACE_STYLE,
              padding: '1rem 1.25rem',
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '14px',
              borderRadius: 16,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: '1 1 280px' }}>
              <Skeleton width={40} height={40} borderRadius={10} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Skeleton width={52} height={18} borderRadius={5} />
                  <Skeleton width="55%" height={15} />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Skeleton width={20} height={20} borderRadius="50%" />
                  <Skeleton width={110} height={11} />
                  <Skeleton width={80} height={11} />
                </div>
              </div>
            </div>
            {!isMobile && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Skeleton width={26} height={26} borderRadius="50%" />
                <Skeleton width={14} height={4} />
                <Skeleton width={26} height={26} borderRadius="50%" />
                <Skeleton width={14} height={4} />
                <Skeleton width={26} height={26} borderRadius="50%" />
              </div>
            )}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Skeleton width={90} height={30} borderRadius={8} />
              <Skeleton width={78} height={34} borderRadius={8} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export const CrmContactsTabSkeleton: React.FC = () => {
  const isMobile = useResponsive();
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', width: '100%' }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <Skeleton width={210} height={24} />
          <Skeleton width={270} height={12} />
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          {!isMobile && <Skeleton width={108} height={40} borderRadius={12} />}
          <Skeleton width={136} height={40} borderRadius={12} />
        </div>
      </div>

      <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
        {Array.from({ length: 7 }).map((_, i) => (
          <Skeleton key={i} width={108} height={32} borderRadius={18} />
        ))}
      </div>

      <div
        className="card skeleton-card"
        style={{ ...CARD_SURFACE_STYLE, padding: '0.85rem 1rem', display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center' }}
      >
        <Skeleton width={isMobile ? '100%' : 280} height={40} borderRadius={10} style={{ flex: isMobile ? '1 1 100%' : 1 }} />
        {!isMobile && (
          <>
            <Skeleton width={150} height={40} borderRadius={10} />
            <Skeleton width={150} height={40} borderRadius={10} />
            <Skeleton width={130} height={40} borderRadius={10} />
          </>
        )}
      </div>

      <div className="card skeleton-card" style={{ ...CARD_SURFACE_STYLE, padding: 0, overflow: 'hidden' }}>
        <div
          style={{
            padding: '0.9rem 1.25rem',
            background: '#F8FAFF',
            borderBottom: '1px solid #E2E8F0',
            display: 'grid',
            gridTemplateColumns: isMobile ? '1.5fr 1fr' : '1.6fr 1.1fr 1fr 1.2fr 0.9fr 0.9fr 0.6fr',
            gap: '12px',
          }}
        >
          {Array.from({ length: isMobile ? 2 : 7 }).map((_, i) => (
            <Skeleton key={i} width="75%" height={11} />
          ))}
        </div>
        {Array.from({ length: 7 }).map((_, rowIdx) => (
          <div
            key={rowIdx}
            style={{
              padding: '0.85rem 1.25rem',
              borderBottom: '1px solid #F1F5F9',
              display: 'grid',
              gridTemplateColumns: isMobile ? '1.5fr 1fr' : '1.6fr 1.1fr 1fr 1.2fr 0.9fr 0.9fr 0.6fr',
              gap: '12px',
              alignItems: 'center',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Skeleton width={36} height={36} borderRadius="50%" />
              <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', flex: 1 }}>
                <Skeleton width="80%" height={13} />
                <Skeleton width="50%" height={10} />
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
              <Skeleton width="85%" height={12} />
              <Skeleton width="60%" height={10} />
            </div>
            {!isMobile && (
              <>
                <div style={{ display: 'flex', gap: '4px' }}>
                  <Skeleton width={52} height={20} borderRadius={10} />
                  <Skeleton width={44} height={20} borderRadius={10} />
                </div>
                <Skeleton width="90%" height={12} />
                <Skeleton width={78} height={22} borderRadius={12} />
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Skeleton width={26} height={26} borderRadius="50%" />
                  <Skeleton width="65%" height={12} />
                </div>
                <Skeleton width={60} height={26} borderRadius={6} />
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export const DealsKanbanTabSkeleton: React.FC = () => {
  const isMobile = useResponsive();
  const cols = isMobile ? 1 : 4;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', width: '100%' }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <Skeleton width={220} height={24} />
          <Skeleton width={280} height={12} />
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <Skeleton width={160} height={40} borderRadius={12} />
          <Skeleton width={128} height={40} borderRadius={12} />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, minmax(260px, 1fr))`, gap: '1rem', alignItems: 'start' }}>
        {Array.from({ length: cols }).map((_, colIdx) => (
          <div
            key={colIdx}
            className="card skeleton-card"
            style={{
              ...CARD_SURFACE_STYLE,
              padding: '0.875rem',
              borderTop: '3px solid #CBD5E1',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.75rem',
              background: '#F8FAFF',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Skeleton width={120} height={15} />
              <Skeleton width={28} height={20} borderRadius={10} />
            </div>
            <Skeleton width={100} height={11} />

            {Array.from({ length: 3 }).map((__, cardIdx) => (
              <div
                key={cardIdx}
                className="kanban-skeleton-card"
                style={{
                  background: '#FFFFFF',
                  border: '1px solid #E2E8F0',
                  borderRadius: '14px',
                  padding: '0.875rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Skeleton width={34} height={34} borderRadius="50%" />
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '5px' }}>
                    <Skeleton width="75%" height={13} />
                    <Skeleton width="55%" height={10} />
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <Skeleton width={68} height={20} borderRadius={10} />
                  <Skeleton width={54} height={20} borderRadius={10} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '6px', borderTop: '1px solid #F1F5F9' }}>
                  <Skeleton width={80} height={12} />
                  <Skeleton width={22} height={22} borderRadius="50%" />
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

export const ProjectsTabSkeleton: React.FC = () => {
  const isMobile = useResponsive();
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', width: '100%' }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <Skeleton width={240} height={24} />
          <Skeleton width={310} height={12} />
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <Skeleton width={132} height={40} borderRadius={12} />
          <Skeleton width={132} height={40} borderRadius={12} />
          {!isMobile && <Skeleton width={96} height={40} borderRadius={12} />}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)', gap: '1rem' }}>
        {Array.from({ length: 3 }).map((_, i) => (
          <KpiCardSkeleton key={i} />
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)', gap: '1.25rem' }}>
        {Array.from({ length: 6 }).map((_, i) => (
          <CardSkeleton key={i} height={175} />
        ))}
      </div>
    </div>
  );
};

export const KanbanProjectsSkeleton: React.FC = () => <DealsKanbanTabSkeleton />;

export const FinancialOpsTabSkeleton: React.FC<{ isCardGrid?: boolean }> = ({
  isCardGrid = false,
}) => {
  const isMobile = useResponsive();
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', width: '100%' }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <Skeleton width={220} height={24} />
          <Skeleton width={290} height={12} />
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <Skeleton width={120} height={40} borderRadius={12} />
          <Skeleton width={140} height={40} borderRadius={12} />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)', gap: '1rem' }}>
        {Array.from({ length: 4 }).map((_, i) => (
          <KpiCardSkeleton key={i} />
        ))}
      </div>

      <div
        className="card skeleton-card"
        style={{ ...CARD_SURFACE_STYLE, padding: '0.85rem 1.25rem', display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center' }}
      >
        <Skeleton width={isMobile ? '100%' : 260} height={40} borderRadius={10} style={{ flex: 1 }} />
        {!isMobile && (
          <>
            <Skeleton width={160} height={40} borderRadius={10} />
            <Skeleton width={160} height={40} borderRadius={10} />
          </>
        )}
      </div>

      {isCardGrid ? (
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)', gap: '1.25rem' }}>
          {Array.from({ length: 6 }).map((_, i) => (
            <CardSkeleton key={i} height={180} />
          ))}
        </div>
      ) : (
        <TableSkeleton rows={6} cols={6} />
      )}
    </div>
  );
};

// ─── HRM & Attendance Timesheet Skeleton ──────────────────────────────────────
export const HrmTimesheetSkeleton: React.FC = () => {
  const isMobile = useResponsive();
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', width: '100%' }}>
      <PageHeaderSkeleton />
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)', gap: '1rem' }}>
        {Array.from({ length: 4 }).map((_, i) => (
          <KpiCardSkeleton key={i} />
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '340px minmax(0, 1fr)', gap: '1.25rem' }}>
        <div className="card skeleton-card" style={{ ...CARD_SURFACE_STYLE, padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Skeleton width={140} height={16} />
            <Skeleton width={90} height={24} borderRadius={999} />
          </div>
          <Skeleton width="100%" height={160} borderRadius={14} />
          <Skeleton width="100%" height={44} borderRadius={12} />
          <StatRowSkeleton />
          <StatRowSkeleton />
        </div>
        <TableSkeleton rows={6} cols={5} />
      </div>
    </div>
  );
};

// ─── Marketing Visual Studio / Builder Skeleton ───────────────────────────────
export const StudioBuilderSkeleton: React.FC = () => {
  const isMobile = useResponsive();
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', width: '100%' }}>
      <PageHeaderSkeleton />
      <div style={{ display: 'flex', gap: 8, overflowX: 'auto' }}>
        {[120, 136, 118, 128].map((w, i) => (
          <Skeleton key={i} width={w} height={36} borderRadius={999} />
        ))}
      </div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : '260px minmax(0, 1fr)',
          gap: '1.25rem',
        }}
      >
        {!isMobile && (
          <div className="card skeleton-card" style={{ ...CARD_SURFACE_STYLE, padding: '1rem', display: 'flex', flexDirection: 'column', gap: 10 }}>
            <Skeleton width="65%" height={14} />
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} width="100%" height={42} borderRadius={10} />
            ))}
          </div>
        )}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)', gap: '1rem' }}>
            <CardSkeleton height={145} />
            <CardSkeleton height={145} />
            <CardSkeleton height={145} />
          </div>
          <TableSkeleton rows={5} cols={5} />
        </div>
      </div>
    </div>
  );
};

// ─── Split Chat Panel Skeleton (WorkChat / DOM Agent / Social Bot) ───────────
export const SplitChatPanelSkeleton: React.FC = () => {
  const isMobile = useResponsive();
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', width: '100%' }}>
      <PageHeaderSkeleton />
      <div
        className="card skeleton-card"
        style={{
          ...CARD_SURFACE_STYLE,
          padding: 0,
          overflow: 'hidden',
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : '290px minmax(0, 1fr)',
          minHeight: 520,
        }}
      >
        {!isMobile && (
          <div style={{ borderRight: '1px solid #E2E8F0', padding: '1rem', display: 'flex', flexDirection: 'column', gap: 12, background: '#F8FAFF' }}>
            <Skeleton width="100%" height={40} borderRadius={10} />
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px', borderRadius: 10, background: '#FFFFFF', border: '1px solid #E2E8F0' }}>
                <Skeleton width={36} height={36} borderRadius="50%" />
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <Skeleton width="72%" height={12} />
                  <Skeleton width="48%" height={10} />
                </div>
              </div>
            ))}
          </div>
        )}
        <div style={{ display: 'flex', flexDirection: 'column', padding: '1.25rem', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 12, borderBottom: '1px solid #F1F5F9' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Skeleton width={38} height={38} borderRadius="50%" />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <Skeleton width={160} height={14} />
                <Skeleton width={100} height={10} />
              </div>
            </div>
            <Skeleton width={96} height={34} borderRadius={10} />
          </div>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 14, padding: '8px 0' }}>
            <div style={{ display: 'flex', gap: 10, maxWidth: '72%' }}>
              <Skeleton width={32} height={32} borderRadius="50%" />
              <Skeleton width={260} height={54} borderRadius={14} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Skeleton width={240} height={46} borderRadius={14} />
            </div>
            <div style={{ display: 'flex', gap: 10, maxWidth: '78%' }}>
              <Skeleton width={32} height={32} borderRadius="50%" />
              <Skeleton width={310} height={74} borderRadius={14} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10, paddingTop: 12, borderTop: '1px solid #F1F5F9' }}>
            <Skeleton width="100%" height={44} borderRadius={12} style={{ flex: 1 }} />
            <Skeleton width={96} height={44} borderRadius={12} />
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Settings Two-Column Skeleton ─────────────────────────────────────────────
export const SettingsTwoColumnSkeleton: React.FC = () => {
  const isMobile = useResponsive();
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', width: '100%' }}>
      <PageHeaderSkeleton />
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : '270px minmax(0, 1fr)',
          gap: '1.25rem',
          alignItems: 'start',
        }}
      >
        <div className="card skeleton-card" style={{ ...CARD_SURFACE_STYLE, padding: '0.85rem', display: 'flex', flexDirection: 'column', gap: 8 }}>
          {Array.from({ length: 10 }).map((_, i) => (
            <Skeleton key={i} width="100%" height={38} borderRadius={10} />
          ))}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="card skeleton-card" style={{ ...CARD_SURFACE_STYLE, padding: '1.35rem', display: 'flex', flexDirection: 'column', gap: 14 }}>
            <Skeleton width={220} height={18} />
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)', gap: 14 }}>
              {Array.from({ length: 4 }).map((_, idx) => (
                <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <Skeleton width={110} height={11} />
                  <Skeleton width="100%" height={42} borderRadius={10} />
                </div>
              ))}
            </div>
            <Skeleton width="100%" height={84} borderRadius={12} />
          </div>
          <TableSkeleton rows={4} cols={4} />
        </div>
      </div>
    </div>
  );
};

// ─── Public Route Centered Skeleton ───────────────────────────────────────────
export const PublicRouteSkeleton: React.FC = () => (
  <div style={{ maxWidth: 720, margin: '2rem auto', padding: '0 1rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
    <div className="card skeleton-card" style={{ ...CARD_SURFACE_STYLE, padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <Skeleton width={48} height={48} borderRadius={14} />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
          <Skeleton width="55%" height={18} />
          <Skeleton width="78%" height={12} />
        </div>
      </div>
      <Skeleton width="100%" height={120} borderRadius={12} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
        <Skeleton width="100%" height={44} borderRadius={10} />
        <Skeleton width="100%" height={44} borderRadius={10} />
      </div>
      <Skeleton width="100%" height={44} borderRadius={12} />
    </div>
  </div>
);

// ─── Route-Aware Per-Tab Skeleton Dispatcher ──────────────────────────────────
export const RouteTabSkeleton: React.FC<{ path?: string }> = ({ path }) => {
  const currentPath = (path || (typeof window !== 'undefined' ? window.location.pathname : '/')).split('?')[0];

  if (
    currentPath === '/' ||
    currentPath === '/marketing-dashboard' ||
    currentPath === '/growth-attribution' ||
    currentPath === '/ads-performance' ||
    currentPath === '/financial-dashboard' ||
    currentPath === '/reports-crm' ||
    currentPath === '/fair-share' ||
    currentPath === '/cash-flow'
  ) {
    return <DashboardTabSkeleton />;
  }

  if (currentPath === '/workspace') {
    return <WorkspaceTabSkeleton />;
  }

  if (
    currentPath === '/calendar' ||
    currentPath === '/personal-calendar' ||
    currentPath === '/schedules' ||
    currentPath === '/account'
  ) {
    return <CalendarTabSkeleton />;
  }

  if (currentPath === '/feed') {
    return <FeedTabSkeleton />;
  }

  if (currentPath === '/erp/approvals' || currentPath === '/approvals') {
    return <ApprovalsTabSkeleton />;
  }

  if (
    currentPath === '/contacts' ||
    currentPath === '/students' ||
    currentPath === '/data' ||
    currentPath === '/gatekeeper' ||
    currentPath === '/tickets' ||
    currentPath === '/support-tickets' ||
    currentPath === '/activities'
  ) {
    return <CrmContactsTabSkeleton />;
  }

  if (currentPath === '/deals') {
    return <DealsKanbanTabSkeleton />;
  }

  if (currentPath === '/erp/projects' || currentPath === '/projects' || currentPath === '/erp/education') {
    return <ProjectsTabSkeleton />;
  }

  if (currentPath === '/rounds' || currentPath === '/rules') {
    return <RoundGridSkeleton />;
  }

  if (
    currentPath === '/erp/hrm' ||
    currentPath === '/erp/attendance' ||
    currentPath === '/erp/payroll' ||
    currentPath === '/hrm' ||
    currentPath === '/attendance' ||
    currentPath === '/my-payslips' ||
    currentPath === '/consultants' ||
    currentPath === '/accounts'
  ) {
    return <HrmTimesheetSkeleton />;
  }

  if (
    currentPath === '/erp/workchat' ||
    currentPath === '/workchat' ||
    currentPath === '/dom-agent' ||
    currentPath === '/marketing/social-bot'
  ) {
    return <SplitChatPanelSkeleton />;
  }

  if (
    currentPath.startsWith('/marketing/') ||
    currentPath === '/marketing-connect' ||
    currentPath === '/audiences'
  ) {
    return <StudioBuilderSkeleton />;
  }

  if (currentPath === '/settings') {
    return <SettingsTwoColumnSkeleton />;
  }

  if (
    currentPath.startsWith('/booking/') ||
    currentPath.startsWith('/public-booking/') ||
    currentPath.startsWith('/s/') ||
    currentPath.startsWith('/claim/') ||
    currentPath.startsWith('/schedule/') ||
    currentPath.startsWith('/public-schedule/') ||
    currentPath === '/docs/api-v1'
  ) {
    return <PublicRouteSkeleton />;
  }

  if (
    currentPath === '/companies' ||
    currentPath === '/suppliers' ||
    currentPath === '/erp/cloud-files' ||
    currentPath === '/files' ||
    currentPath === '/integrations'
  ) {
    return <FinancialOpsTabSkeleton isCardGrid={true} />;
  }

  // /erp/finance, /deposits, /expenses, /quotes, /invoices, /products, /inventory, /accounting-az, /cooperation-slips, /sale-portal
  return <FinancialOpsTabSkeleton isCardGrid={false} />;
};
