import React from 'react';
import { Play } from 'lucide-react';
import { CountdownTimer } from './CountdownTimer';
import { TableBlockCanvas } from './TableBlockCanvas';
import type { EmailBlockItem } from './templateTypes';

export interface CanvasCommerceBlocksProps {
  block: EmailBlockItem;
  isSelected: boolean;
  viewport: 'desktop' | 'mobile';
  accent: string;
  radius: number;
  align: 'left' | 'center' | 'right';
  borderCss?: string;
  onChange: (patch: Partial<EmailBlockItem>) => void;
}

export const CanvasCommerceBlocks: React.FC<CanvasCommerceBlocksProps> = ({
  block,
  isSelected,
  viewport,
  accent,
  radius,
  align,
  borderCss,
  onChange,
}) => {
  switch (block.type) {
    case 'product_card':
      return (
        <div
          style={{
            display: 'flex',
            flexDirection: viewport === 'mobile' ? 'column' : 'row',
            gap: 16,
            alignItems: 'center',
            padding: 16,
            borderRadius: radius,
            border: borderCss || '1px solid #E2E8F0',
            background: '#FFFFFF',
          }}
        >
          <img
            src={block.imageUrl || 'https://placehold.co/220x160/EFF6FF/1E40FF?text=Product'}
            alt={block.altText || block.title || 'Product'}
            style={{
              width: viewport === 'mobile' ? '100%' : 168,
              height: 'auto',
              borderRadius: 10,
              objectFit: 'cover',
            }}
          />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 16, fontWeight: 800, color: '#0F172A' }}>{block.title}</div>
            <div style={{ fontSize: 13, color: '#64748B', margin: '6px 0 10px' }}>{block.content}</div>
            <div style={{ marginBottom: 10 }}>
              <span style={{ fontSize: 18, fontWeight: 800, color: accent }}>{block.priceText}</span>
              {block.originalPriceText && (
                <span style={{ fontSize: 12, color: '#94A3B8', textDecoration: 'line-through', marginLeft: 8 }}>
                  {block.originalPriceText}
                </span>
              )}
            </div>
            <span
              style={{
                display: 'inline-block',
                padding: '9px 18px',
                borderRadius: 10,
                background: accent,
                color: '#FFFFFF',
                fontSize: 13,
                fontWeight: 700,
              }}
            >
              {block.buttonLabel || 'Chọn mua'}
            </span>
          </div>
        </div>
      );

    case 'voucher_box':
      return (
        <div
          style={{
            border: `2px dashed ${accent}`,
            background: '#EFF6FF',
            borderRadius: radius,
            padding: 18,
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', color: accent }}>
            {block.title}
          </div>
          <div
            style={{
              margin: '10px auto',
              display: 'inline-block',
              padding: '10px 22px',
              background: '#FFFFFF',
              border: '1px solid #BFDBFE',
              borderRadius: 10,
              fontFamily: 'monospace',
              fontSize: 19,
              fontWeight: 800,
              letterSpacing: '0.08em',
              color: '#0F172A',
            }}
          >
            {block.voucherCode || '{{lead.voucher_code}}'}
          </div>
          <div style={{ fontSize: 13, color: '#475569' }}>{block.content}</div>
          {block.voucherExpiry && (
            <div style={{ fontSize: 11, color: '#64748B', marginTop: 4 }}>{block.voucherExpiry}</div>
          )}
        </div>
      );

    case 'countdown_timer':
      return (
        <CountdownTimer
          countdownIso={block.countdownIso}
          accentColor={accent}
          title={block.title || 'Ưu đãi kết thúc sau'}
        />
      );

    case 'social_links':
      return (
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: align === 'left' ? 'flex-start' : align === 'right' ? 'flex-end' : 'center',
            gap: 8,
          }}
        >
          {(block.socialLinks || []).map((s, idx) => (
            <span
              key={idx}
              style={{
                padding: '7px 14px',
                borderRadius: 999,
                background: '#F1F5F9',
                border: '1px solid #E2E8F0',
                color: accent,
                fontSize: 12,
                fontWeight: 700,
              }}
            >
              {s.network}
            </span>
          ))}
        </div>
      );

    case 'testimonial':
      return (
        <div
          style={{
            background: '#F8FAFC',
            borderLeft: `4px solid ${accent}`,
            borderRadius: `0 ${radius}px ${radius}px 0`,
            padding: '16px 20px',
          }}
        >
          <div style={{ fontSize: 14, fontStyle: 'italic', color: '#1E293B', lineHeight: 1.6 }}>
            “{(block.content || '').replace(/<[^>]+>/g, '')}”
          </div>
          <div style={{ marginTop: 8, fontSize: 13, fontWeight: 700, color: '#0F172A' }}>
            — {block.title}
          </div>
        </div>
      );

    case 'video_thumbnail':
      return (
        <div
          style={{
            borderRadius: radius,
            border: '1px solid #DBEAFE',
            background: '#EFF6FF',
            padding: '22px 18px',
            textAlign: 'center',
          }}
        >
          <div
            style={{
              width: 48,
              height: 48,
              margin: '0 auto 8px',
              borderRadius: 999,
              background: accent,
              color: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Play size={20} fill="#FFFFFF" />
          </div>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#0F172A' }}>{block.title}</div>
          <div style={{ fontSize: 12, color: '#64748B', marginTop: 4 }}>{block.content}</div>
        </div>
      );

    case 'pricing_card':
      return (
        <div
          style={{
            border: `1.5px solid ${accent}`,
            borderRadius: radius,
            padding: 20,
            textAlign: 'center',
            background: '#FFFFFF',
          }}
        >
          <div style={{ fontSize: 11, fontWeight: 800, color: accent, textTransform: 'uppercase' }}>
            {block.subtitle || 'Gói Đề Xuất'}
          </div>
          <div style={{ fontSize: 18, fontWeight: 800, color: '#0F172A', margin: '5px 0' }}>{block.title}</div>
          <div style={{ fontSize: 24, fontWeight: 800, color: accent, margin: '6px 0' }}>{block.priceText}</div>
          <div style={{ fontSize: 13, color: '#475569', lineHeight: 1.6, whiteSpace: 'pre-line', marginBottom: 14 }}>
            {block.content}
          </div>
          <span
            style={{
              display: 'inline-block',
              padding: '10px 22px',
              borderRadius: 10,
              background: accent,
              color: '#FFFFFF',
              fontSize: 13.5,
              fontWeight: 700,
            }}
          >
            {block.buttonLabel || 'Đăng ký'}
          </span>
        </div>
      );

    case 'table':
      return <TableBlockCanvas block={block} isSelected={isSelected} onChange={onChange} />;

    default:
      return (
        <div
          style={{ borderRadius: 10, border: '1px dashed #CBD5E1', padding: 10, background: '#F8FAFC' }}
          dangerouslySetInnerHTML={{
            __html: (block.content || '').replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, ''),
          }}
        />
      );
  }
};

export default CanvasCommerceBlocks;
