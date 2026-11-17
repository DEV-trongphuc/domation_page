import React from 'react';
import { Image as ImageIcon, Plus, Trash2 } from 'lucide-react';
import {
  applyColumnPresetToBlock,
  COLUMN_PRESET_OPTIONS,
  SOCIAL_NETWORK_OPTIONS,
} from './editorUtils';
import { PropertyAccordion } from './InspectorWidgets';
import type { ColumnLayoutPreset, EmailBlockItem } from './templateTypes';

export interface BlockContentFieldsProps {
  block: EmailBlockItem;
  onUpdateBlock: (patch: Partial<EmailBlockItem>) => void;
  onOpenImageLibrary: () => void;
}

export const BlockContentFields: React.FC<BlockContentFieldsProps> = ({
  block,
  onUpdateBlock,
  onOpenImageLibrary,
}) => {
  const inputStyle: React.CSSProperties = {
    width: '100%',
    height: 44,
    padding: '0 11px',
    borderRadius: 10,
    border: '1px solid #E2E8F0',
    background: '#FFFFFF',
    fontSize: '0.8rem',
    color: '#0F172A',
  };

  return (
    <>
      <PropertyAccordion title="Nội dung & Hành động" defaultOpen>
        {block.type === 'pricing_card' && (
          <div>
            <label style={{ fontSize: '0.72rem', fontWeight: 700 }}>Nhãn phụ (Subtitle)</label>
            <input value={block.subtitle || ''} onChange={(e) => onUpdateBlock({ subtitle: e.target.value })} style={inputStyle} />
          </div>
        )}
        {!['divider', 'social_links', 'columns', 'table'].includes(block.type) && (
          <div>
            <label style={{ fontSize: '0.72rem', fontWeight: 700 }}>Tiêu đề khối</label>
            <input value={block.title || ''} onChange={(e) => onUpdateBlock({ title: e.target.value })} style={inputStyle} />
          </div>
        )}
        {['text', 'hero_banner', 'product_card', 'voucher_box', 'testimonial', 'video_thumbnail', 'pricing_card', 'custom_html'].includes(block.type) && (
          <div>
            <label style={{ fontSize: '0.72rem', fontWeight: 700 }}>
              {block.type === 'custom_html' ? 'Mã HTML Inline' : 'Nội dung / Mô tả'}
            </label>
            <textarea
              rows={4}
              value={block.content || ''}
              onChange={(e) => onUpdateBlock({ content: e.target.value })}
              style={{ ...inputStyle, height: 'auto', padding: 10, fontFamily: block.type === 'custom_html' ? 'monospace' : 'inherit' }}
            />
          </div>
        )}
        {['button', 'hero_banner', 'product_card', 'pricing_card'].includes(block.type) && (
          <div>
            <label style={{ fontSize: '0.72rem', fontWeight: 700 }}>Nhãn Nút bấm (CTA)</label>
            <input value={block.buttonLabel || ''} onChange={(e) => onUpdateBlock({ buttonLabel: e.target.value })} style={inputStyle} />
          </div>
        )}
        {['button', 'hero_banner', 'image', 'product_card', 'video_thumbnail', 'pricing_card'].includes(block.type) && (
          <>
            <div>
              <label style={{ fontSize: '0.72rem', fontWeight: 700 }}>Đường dẫn đích (URL)</label>
              <input value={block.url || ''} onChange={(e) => onUpdateBlock({ url: e.target.value })} placeholder="https://domation.net" style={inputStyle} />
            </div>
            {/\{\{.+\}\}/.test(block.url || '') && (
              <div>
                <label style={{ fontSize: '0.72rem', fontWeight: 700 }}>Fallback URL (dự phòng biến trống)</label>
                <input value={block.fallbackUrl || ''} onChange={(e) => onUpdateBlock({ fallbackUrl: e.target.value })} placeholder="https://domation.net" style={inputStyle} />
              </div>
            )}
          </>
        )}
        {['image', 'product_card'].includes(block.type) && (
          <>
            <div>
              <label style={{ fontSize: '0.72rem', fontWeight: 700 }}>URL Hình ảnh</label>
              <div style={{ display: 'flex', gap: 6 }}>
                <input value={block.imageUrl || ''} onChange={(e) => onUpdateBlock({ imageUrl: e.target.value })} style={{ ...inputStyle, flex: 1 }} />
                <button
                  type="button"
                  onClick={onOpenImageLibrary}
                  style={{ height: 44, padding: '0 12px', borderRadius: 10, border: '1px solid #DBEAFE', background: '#EFF6FF', color: '#1E40FF', fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 5 }}
                >
                  <ImageIcon size={15} /> Media
                </button>
              </div>
            </div>
            <div>
              <label style={{ fontSize: '0.72rem', fontWeight: 700 }}>Mô tả thay thế (ALT Text chống Spam)</label>
              <input value={block.altText || ''} onChange={(e) => onUpdateBlock({ altText: e.target.value })} placeholder="Mô tả nội dung ảnh..." style={inputStyle} />
            </div>
            {block.type === 'image' && (
              <div>
                <label style={{ fontSize: '0.72rem', fontWeight: 700 }}>Độ rộng ảnh ({block.imageWidthPct ?? 100}%)</label>
                <input
                  type="range"
                  min={25}
                  max={100}
                  step={5}
                  value={block.imageWidthPct ?? 100}
                  onChange={(e) => onUpdateBlock({ imageWidthPct: Number(e.target.value) || 100 })}
                  style={{ width: '100%', accentColor: '#1E40FF' }}
                />
              </div>
            )}
          </>
        )}
        {block.type === 'voucher_box' && (
          <>
            <div>
              <label style={{ fontSize: '0.72rem', fontWeight: 700 }}>Mã Voucher / Biến trộn</label>
              <input value={block.voucherCode || ''} onChange={(e) => onUpdateBlock({ voucherCode: e.target.value })} style={inputStyle} />
            </div>
            <div>
              <label style={{ fontSize: '0.72rem', fontWeight: 700 }}>Ghi chú thời hạn Voucher</label>
              <input value={block.voucherExpiry || ''} onChange={(e) => onUpdateBlock({ voucherExpiry: e.target.value })} style={inputStyle} />
            </div>
          </>
        )}
        {['product_card', 'pricing_card'].includes(block.type) && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <div>
              <label style={{ fontSize: '0.72rem', fontWeight: 700 }}>Giá ưu đãi</label>
              <input value={block.priceText || ''} onChange={(e) => onUpdateBlock({ priceText: e.target.value })} style={inputStyle} />
            </div>
            {block.type === 'product_card' && (
              <div>
                <label style={{ fontSize: '0.72rem', fontWeight: 700 }}>Giá gốc gạch ngang</label>
                <input value={block.originalPriceText || ''} onChange={(e) => onUpdateBlock({ originalPriceText: e.target.value })} style={inputStyle} />
              </div>
            )}
          </div>
        )}
        {block.type === 'countdown_timer' && (
          <div>
            <label style={{ fontSize: '0.72rem', fontWeight: 700 }}>Thời điểm kết thúc (ISO 8601)</label>
            <input value={block.countdownIso || ''} onChange={(e) => onUpdateBlock({ countdownIso: e.target.value })} placeholder="2026-12-31T23:59:59.000Z" style={inputStyle} />
          </div>
        )}
        {block.type === 'social_links' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {(block.socialLinks || []).map((item, idx) => (
              <div key={idx} style={{ display: 'flex', gap: 6 }}>
                <select
                  value={item.network}
                  onChange={(e) => {
                    const next = [...(block.socialLinks || [])];
                    next[idx] = { ...next[idx], network: e.target.value };
                    onUpdateBlock({ socialLinks: next });
                  }}
                  style={{ ...inputStyle, width: 112 }}
                >
                  {SOCIAL_NETWORK_OPTIONS.map((net) => (
                    <option key={net} value={net}>{net}</option>
                  ))}
                </select>
                <input
                  value={item.url}
                  onChange={(e) => {
                    const next = [...(block.socialLinks || [])];
                    next[idx] = { ...next[idx], url: e.target.value };
                    onUpdateBlock({ socialLinks: next });
                  }}
                  style={{ ...inputStyle, flex: 1 }}
                />
                <button
                  type="button"
                  onClick={() => onUpdateBlock({ socialLinks: (block.socialLinks || []).filter((_, i) => i !== idx) })}
                  style={{ height: 44, width: 38, borderRadius: 10, border: '1px solid #FECACA', background: '#FFFFFF', color: '#DC2626', cursor: 'pointer' }}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => onUpdateBlock({ socialLinks: [...(block.socialLinks || []), { network: 'Website', url: 'https://domation.net' }] })}
              style={{ height: 38, borderRadius: 10, border: '1px dashed #1E40FF', background: '#EFF6FF', color: '#1E40FF', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer' }}
            >
              <Plus size={13} style={{ verticalAlign: 'middle' }} /> Thêm mạng xã hội
            </button>
          </div>
        )}
      </PropertyAccordion>

      {block.type === 'columns' && (
        <PropertyAccordion title="Cấu trúc Cột (1–4 Cột & Tỷ lệ)" defaultOpen>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
            {COLUMN_PRESET_OPTIONS.map((preset) => (
              <button
                key={preset.key}
                type="button"
                onClick={() => onUpdateBlock(applyColumnPresetToBlock(block, preset.key as ColumnLayoutPreset))}
                style={{
                  height: 38,
                  borderRadius: 9,
                  border: block.columnLayout === preset.key ? '1.5px solid #1E40FF' : '1px solid #E2E8F0',
                  background: block.columnLayout === preset.key ? '#EFF6FF' : '#FFFFFF',
                  color: block.columnLayout === preset.key ? '#1E40FF' : '#334155',
                  fontSize: '0.73rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                {preset.label}
              </button>
            ))}
          </div>
          <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: '0.74rem', fontWeight: 600, color: '#334155', cursor: 'pointer' }}>
            <input type="checkbox" checked={block.stackOnMobile !== false} onChange={(e) => onUpdateBlock({ stackOnMobile: e.target.checked })} />
            Tự động xếp chồng cột trên Mobile (375px)
          </label>
          {(block.columns || []).map((col, idx) => (
            <div key={idx} style={{ padding: 10, borderRadius: 10, background: '#F8FAFF', border: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#1E40FF' }}>Cột #{idx + 1} ({col.widthPct || 50}%)</div>
              <input
                placeholder="Tiêu đề cột"
                value={col.heading || ''}
                onChange={(e) => {
                  const next = [...(block.columns || [])];
                  next[idx] = { ...next[idx], heading: e.target.value };
                  onUpdateBlock({ columns: next });
                }}
                style={{ ...inputStyle, height: 38 }}
              />
              <textarea
                rows={2}
                placeholder="Nội dung cột"
                value={col.body || ''}
                onChange={(e) => {
                  const next = [...(block.columns || [])];
                  next[idx] = { ...next[idx], body: e.target.value };
                  onUpdateBlock({ columns: next });
                }}
                style={{ ...inputStyle, height: 'auto', padding: 8 }}
              />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                <input
                  placeholder="Nhãn CTA"
                  value={col.ctaLabel || ''}
                  onChange={(e) => {
                    const next = [...(block.columns || [])];
                    next[idx] = { ...next[idx], ctaLabel: e.target.value };
                    onUpdateBlock({ columns: next });
                  }}
                  style={{ ...inputStyle, height: 36 }}
                />
                <input
                  placeholder="URL CTA"
                  value={col.ctaUrl || ''}
                  onChange={(e) => {
                    const next = [...(block.columns || [])];
                    next[idx] = { ...next[idx], ctaUrl: e.target.value };
                    onUpdateBlock({ columns: next });
                  }}
                  style={{ ...inputStyle, height: 36 }}
                />
              </div>
            </div>
          ))}
        </PropertyAccordion>
      )}
    </>
  );
};

export default BlockContentFields;
