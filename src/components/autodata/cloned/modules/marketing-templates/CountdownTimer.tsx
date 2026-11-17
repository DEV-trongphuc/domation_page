import React, { useEffect, useState } from 'react';
import { AlertTriangle, Clock } from 'lucide-react';

export interface CountdownTimerProps {
  countdownIso?: string;
  accentColor?: string;
  title?: string;
}

interface CountdownDigits {
  days: string;
  hours: string;
  minutes: string;
  seconds: string;
  expired: boolean;
}

function computeCountdownFromEpoch(targetIso: string | undefined, nowMs: number): CountdownDigits {
  if (!targetIso) {
    return { days: '02', hours: '14', minutes: '38', seconds: '25', expired: false };
  }
  const targetMs = new Date(targetIso).getTime();
  if (!Number.isFinite(targetMs)) {
    return { days: '02', hours: '14', minutes: '38', seconds: '25', expired: false };
  }
  const diffSec = Math.floor((targetMs - nowMs) / 1000);
  if (diffSec <= 0) {
    return { days: '00', hours: '00', minutes: '00', seconds: '00', expired: true };
  }
  const days = String(Math.min(99, Math.floor(diffSec / 86400))).padStart(2, '0');
  const hours = String(Math.floor((diffSec % 86400) / 3600)).padStart(2, '0');
  const minutes = String(Math.floor((diffSec % 3600) / 60)).padStart(2, '0');
  const seconds = String(diffSec % 60).padStart(2, '0');
  return { days, hours, minutes, seconds, expired: false };
}

export const CountdownTimer: React.FC<CountdownTimerProps> = ({
  countdownIso,
  accentColor = '#1E40FF',
  title = 'Ưu đãi kết thúc sau',
}) => {
  const safeAccent = /^#[0-9a-fA-F]{6}$/.test(accentColor) ? accentColor : '#1E40FF';
  const [digits, setDigits] = useState<CountdownDigits>({
    days: '02',
    hours: '14',
    minutes: '38',
    seconds: '25',
    expired: false,
  });

  useEffect(() => {
    const tick = () => {
      setDigits(computeCountdownFromEpoch(countdownIso, Date.now()));
    };
    const immediate = window.setTimeout(tick, 0);
    const interval = window.setInterval(tick, 1000);
    return () => {
      window.clearTimeout(immediate);
      window.clearInterval(interval);
    };
  }, [countdownIso]);

  const cells: ReadonlyArray<{ val: string; unit: string; x: number }> = [
    { val: digits.days, unit: 'NGÀY', x: 24 },
    { val: digits.hours, unit: 'GIỜ', x: 120 },
    { val: digits.minutes, unit: 'PHÚT', x: 216 },
    { val: digits.seconds, unit: 'GIÂY', x: 312 },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, width: '100%' }}>
      {!countdownIso && (
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '4px 10px',
            borderRadius: 999,
            background: '#FFFBEB',
            border: '1px solid #FDE68A',
            color: '#B45309',
            fontSize: '0.72rem',
            fontWeight: 700,
          }}
        >
          <AlertTriangle size={12} /> Chưa đặt thời điểm kết thúc (ISO)
        </div>
      )}
      {digits.expired && Boolean(countdownIso) && (
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '4px 10px',
            borderRadius: 999,
            background: '#FEF2F2',
            border: '1px solid #FECACA',
            color: '#DC2626',
            fontSize: '0.72rem',
            fontWeight: 700,
          }}
        >
          <Clock size={12} /> Thời hạn đếm ngược đã kết thúc
        </div>
      )}

      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="100%"
        viewBox="0 0 416 116"
        style={{ maxWidth: 420, height: 'auto', display: 'block' }}
        role="img"
        aria-label={title}
      >
        <rect width="416" height="116" rx="16" fill="#F8FAFF" stroke="#DBEAFE" strokeWidth="1.2" />
        <text
          x="208"
          y="24"
          textAnchor="middle"
          fontFamily="Inter, Arial, sans-serif"
          fontSize="11.5"
          fontWeight="700"
          fill="#334155"
        >
          {title}
        </text>
        {cells.map((cell) => (
          <g key={cell.unit} transform={`translate(${cell.x}, 36)`}>
            <rect width="80" height="66" rx="12" fill="#FFFFFF" stroke="#BFDBFE" strokeWidth="1.5" />
            <text
              x="40"
              y="36"
              textAnchor="middle"
              fontFamily="Inter, Arial, sans-serif"
              fontSize="24"
              fontWeight="800"
              fill={safeAccent}
            >
              {cell.val}
            </text>
            <text
              x="40"
              y="54"
              textAnchor="middle"
              fontFamily="Inter, Arial, sans-serif"
              fontSize="9"
              fontWeight="700"
              fill="#64748B"
            >
              {cell.unit}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
};

export default CountdownTimer;
