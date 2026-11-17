import React, { useRef, useState } from 'react';
import { Eraser, PenTool } from 'lucide-react';
import { KpiCardSkeleton, Skeleton, TableSkeleton } from '../../components/ui/Skeleton';

export const HrmTimesheetSkeleton: React.FC = () => (
  <div
    style={{
      background: '#F8F9FA',
      display: 'flex',
      flexDirection: 'column',
      gap: '1.25rem',
      width: '100%',
    }}
  >
    <div
      style={{
        background: '#FFFFFF',
        border: '1px solid #E2E8F0',
        borderRadius: 20,
        padding: '1.25rem 1.5rem',
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 14,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <Skeleton width={48} height={48} borderRadius={14} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <Skeleton width={260} height={20} borderRadius={6} />
          <Skeleton width={340} height={12} borderRadius={6} />
        </div>
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <Skeleton width={132} height={44} borderRadius={12} />
        <Skeleton width={164} height={44} borderRadius={12} />
      </div>
    </div>

    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
        gap: '1rem',
      }}
    >
      <KpiCardSkeleton />
      <KpiCardSkeleton />
      <KpiCardSkeleton />
      <KpiCardSkeleton />
    </div>

    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
      <Skeleton width={156} height={38} borderRadius={12} />
      <Skeleton width={148} height={38} borderRadius={12} />
      <Skeleton width={168} height={38} borderRadius={12} />
      <Skeleton width={152} height={38} borderRadius={12} />
    </div>

    <TableSkeleton rows={6} cols={6} />
  </div>
);

export interface SignatureCanvasPadProps {
  label?: string;
  height?: number;
  disabled?: boolean;
  onSignatureChange: (dataUrl: string | null) => void;
}

export const SignatureCanvasPad: React.FC<SignatureCanvasPadProps> = ({
  label = 'Vẽ chữ ký điện tử trực tiếp vào khung bên dưới',
  height = 140,
  disabled = false,
  onSignatureChange,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const drawingRef = useRef(false);
  const [hasInk, setHasInk] = useState(false);

  const getCoords = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>
  ): { x: number; y: number } => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    let clientX = 0;
    let clientY = 0;
    if ('touches' in e) {
      if (e.touches.length === 0) return { x: 0, y: 0 };
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }
    const scaleX = canvas.width / (rect.width || 1);
    const scaleY = canvas.height / (rect.height || 1);
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
    };
  };

  const handleStart = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>
  ) => {
    if (disabled) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    ctx.strokeStyle = '#1E40FF';
    ctx.lineWidth = 2.8;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    const { x, y } = getCoords(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
    drawingRef.current = true;
  };

  const handleMove = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>
  ) => {
    if (disabled || !drawingRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    const { x, y } = getCoords(e);
    ctx.lineTo(x, y);
    ctx.stroke();
    if (!hasInk) setHasInk(true);
  };

  const handleEnd = () => {
    if (!drawingRef.current) return;
    drawingRef.current = false;
    const canvas = canvasRef.current;
    if (!canvas) return;
    onSignatureChange(canvas.toDataURL('image/png'));
  };

  const handleClear = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (canvas && ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
    setHasInk(false);
    onSignatureChange(null);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 8,
        }}
      >
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            fontSize: '0.8rem',
            fontWeight: 700,
            color: '#0F172A',
          }}
        >
          <PenTool size={14} color="#1E40FF" />
          <span>{label}</span>
        </div>
        {hasInk && (
          <button
            type="button"
            disabled={disabled}
            onClick={handleClear}
            style={{
              height: 30,
              padding: '0 10px',
              borderRadius: 8,
              border: '1px solid #CBD5E1',
              background: '#FFFFFF',
              color: '#475569',
              fontSize: '0.75rem',
              fontWeight: 700,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
              cursor: 'pointer',
            }}
          >
            <Eraser size={13} /> Ký lại
          </button>
        )}
      </div>

      <div
        style={{
          border: '1.5px dashed #93C5FD',
          borderRadius: 14,
          background: '#FFFFFF',
          overflow: 'hidden',
          position: 'relative',
          height,
        }}
      >
        <canvas
          ref={canvasRef}
          width={640}
          height={height}
          onMouseDown={handleStart}
          onMouseMove={handleMove}
          onMouseUp={handleEnd}
          onMouseLeave={handleEnd}
          onTouchStart={handleStart}
          onTouchMove={handleMove}
          onTouchEnd={handleEnd}
          style={{
            width: '100%',
            height: '100%',
            display: 'block',
            touchAction: 'none',
            cursor: disabled ? 'not-allowed' : 'crosshair',
            backgroundImage: 'radial-gradient(#DBEAFE 1.25px, transparent 1.25px)',
            backgroundSize: '18px 18px',
          }}
        />
        {!hasInk && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              pointerEvents: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#94A3B8',
              fontSize: '0.8rem',
              fontWeight: 600,
            }}
          >
            Giữ chuột hoặc chạm màn hình để ký xác nhận chữ ký số
          </div>
        )}
      </div>
    </div>
  );
};
