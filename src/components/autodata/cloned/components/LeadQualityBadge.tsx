import React from 'react';

export interface MarketingPipelineStage {
  id: string;
  label: string;
  shortLabel: string;
  dotColor: string;
  bg: string;
  border: string;
  color: string;
  desc: string;
}

export const MARKETING_PIPELINES: Record<string, MarketingPipelineStage> = {
  Qualified: {
    id: 'Qualified',
    label: 'Thiện Chí (Qualified)',
    shortLabel: 'Thiện Chí',
    dotColor: '#10B981',
    bg: 'rgba(16, 185, 129, 0.12)',
    border: '1px solid rgba(16, 185, 129, 0.35)',
    color: '#059669',
    desc: 'Khách đúng nhu cầu, thiện chí quan tâm & tài chính phù hợp'
  },
  Booked: {
    id: 'Booked',
    label: 'Đã hẹn gặp / Xem mẫu (Booked)',
    shortLabel: 'Đã hẹn gặp',
    dotColor: '#8B5CF6',
    bg: 'rgba(139, 92, 246, 0.12)',
    border: '1px solid rgba(139, 92, 246, 0.35)',
    color: '#7C3AED',
    desc: 'Khách đã chốt lịch hẹn tư vấn hoặc đi xem thực tế dự án'
  },
  Booking: {
    id: 'Booking',
    label: 'Booking (Giữ chỗ)',
    shortLabel: 'Booking',
    dotColor: '#EC4899',
    bg: 'rgba(236, 72, 153, 0.14)',
    border: '1px solid rgba(236, 72, 153, 0.4)',
    color: '#DB2777',
    desc: 'Khách đã vào tiền Booking giữ chỗ thiện chí'
  },
  Deposited: {
    id: 'Deposited',
    label: 'Đặt cọc (Cọc)',
    shortLabel: 'Cọc',
    dotColor: '#F59E0B',
    bg: 'rgba(245, 158, 11, 0.15)',
    border: '1px solid rgba(245, 158, 11, 0.45)',
    color: '#D97706',
    desc: 'Khách đã xuống tiền đặt cọc giữ chỗ / căn hộ'
  },
  Closed: {
    id: 'Closed',
    label: 'Chốt thành công (Chốt)',
    shortLabel: 'Chốt',
    dotColor: '#059669',
    bg: 'rgba(5, 150, 105, 0.18)',
    border: '1px solid rgba(5, 150, 105, 0.45)',
    color: '#047857',
    desc: 'Giao dịch thành công, đã ký hợp đồng mua bán'
  },
  Badtiming: {
    id: 'Badtiming',
    label: 'Hẹn liên hệ lại (Bad Timing)',
    shortLabel: 'Hẹn gọi lại',
    dotColor: '#EAB308',
    bg: 'rgba(234, 179, 8, 0.12)',
    border: '1px solid rgba(234, 179, 8, 0.35)',
    color: '#CA8A04',
    desc: 'Quan tâm nhưng bận/hẹn sau, nuôi dưỡng tiếp'
  },
  NoAnswer: {
    id: 'NoAnswer',
    label: 'Không liên lạc được (No Answer)',
    shortLabel: 'Ko liên lạc được',
    dotColor: '#3B82F6',
    bg: 'rgba(59, 130, 246, 0.12)',
    border: '1px solid rgba(59, 130, 246, 0.35)',
    color: '#2563EB',
    desc: 'Đã gọi nhiều lần nhưng thuê bao / máy bận / không nhấc máy'
  },
  Notlead: {
    id: 'Notlead',
    label: 'Không đúng đối tượng (Not Lead)',
    shortLabel: 'Notlead',
    dotColor: '#EF4444',
    bg: 'rgba(239, 68, 68, 0.12)',
    border: '1px solid rgba(239, 68, 68, 0.35)',
    color: '#DC2626',
    desc: 'Sai số, nhầm dự án, môi giới khác, data ảo / spam'
  }
};

export const UNRATED_PIPELINE: MarketingPipelineStage = {
  id: 'unrated',
  label: 'Chưa đánh giá',
  shortLabel: 'Chưa đánh giá',
  dotColor: '#94A3B8',
  bg: 'var(--color-bg)',
  border: '1px dashed var(--color-border)',
  color: 'var(--color-text-muted)',
  desc: 'Chưa có đánh giá chất lượng từ Đại lý'
};

export interface LeadQualityBadgeProps {
  status?: string | null;
  note?: string | null;
  showNote?: boolean;
  onClick?: (e?: React.MouseEvent) => void;
  size?: 'sm' | 'md' | 'lg';
  fullLabel?: boolean;
}

export const LeadQualityBadge: React.FC<LeadQualityBadgeProps> = ({
  status,
  note,
  showNote = false,
  onClick,
  size = 'md',
  fullLabel = false
}) => {
  const config = (status && MARKETING_PIPELINES[status]) || UNRATED_PIPELINE;

  const fontSizes = {
    sm: '0.6875rem',
    md: '0.72rem',
    lg: '0.8125rem'
  };

  const paddings = {
    sm: '2px 8px',
    md: '4px 10px',
    lg: '6px 14px'
  };

  return (
    <div
      onClick={onClick}
      style={{
        display: 'inline-flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        gap: '3px',
        cursor: onClick ? 'pointer' : 'default'
      }}
      title={`${config.label}: ${config.desc}`}
    >
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          padding: paddings[size],
          borderRadius: '9999px',
          fontSize: fontSizes[size],
          fontWeight: 700,
          background: config.bg,
          border: config.border,
          color: config.color,
          transition: 'all 0.15s ease',
          whiteSpace: 'nowrap'
        }}
      >
        <span
          style={{
            width: size === 'lg' ? 8 : 6,
            height: size === 'lg' ? 8 : 6,
            borderRadius: '50%',
            background: config.dotColor,
            flexShrink: 0
          }}
        />
        {fullLabel ? config.label : config.shortLabel}
      </span>
      {showNote && note && (
        <span
          style={{
            fontSize: '0.7rem',
            color: 'var(--color-text-muted)',
            fontStyle: 'italic',
            maxWidth: '100%',
            lineHeight: 1.35,
            wordBreak: 'break-word',
            overflowWrap: 'anywhere',
            whiteSpace: 'normal',
            paddingLeft: '4px'
          }}
          title={note}
        >
          {note}
        </span>
      )}
    </div>
  );
};

export default LeadQualityBadge;
