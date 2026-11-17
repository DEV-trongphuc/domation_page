import React, { useState } from 'react';
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  BookmarkPlus,
  Copy,
  Sliders,
  Trash2,
  X,
} from 'lucide-react';
import { Badge, Card } from '../../components/ui/AutoDataLoadingModal';
import { BlockContentFields } from './BlockContentFields';
import {
  DEFAULT_EMAIL_BODY_STYLE,
  EMAIL_FONT_OPTIONS,
  formatSpacingToPadding,
  parseSpacing,
} from './editorUtils';
import {
  BorderRadiusControl,
  ColorSwatchInput,
  FourSideSpacingControl,
  PropertyAccordion,
} from './InspectorWidgets';
import type { EmailBlockBorder, EmailBlockItem, EmailBodyStyle } from './templateTypes';

export interface EmailPropertiesProps {
  selectedBlock: EmailBlockItem | null;
  bodyStyle: EmailBodyStyle;
  onUpdateBlock: (patch: Partial<EmailBlockItem>) => void;
  onUpdateBodyStyle: (patch: Partial<EmailBodyStyle>) => void;
  onDuplicateBlock: () => void;
  onSaveReusableBlock: () => void;
  onDeleteBlock: () => void;
  onDeselectBlock: () => void;
  onOpenImageLibrary: () => void;
}

export const EmailProperties: React.FC<EmailPropertiesProps> = ({
  selectedBlock,
  bodyStyle,
  onUpdateBlock,
  onUpdateBodyStyle,
  onDuplicateBlock,
  onSaveReusableBlock,
  onDeleteBlock,
  onDeselectBlock,
  onOpenImageLibrary,
}) => {
  const [inspectorMode, setInspectorMode] = useState<'block' | 'body'>('block');
  const effectiveMode = selectedBlock && inspectorMode === 'block' ? 'block' : 'body';

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

  const mergedBody = { ...DEFAULT_EMAIL_BODY_STYLE, ...bodyStyle };

  if (effectiveMode === 'body' || !selectedBlock) {
    return (
      <Card padding="1rem">
        <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
          <button
            type="button"
            disabled={!selectedBlock}
            onClick={() => setInspectorMode('block')}
            style={{
              flex: 1,
              height: 38,
              borderRadius: 10,
              border: '1px solid #E2E8F0',
              background: '#FFFFFF',
              color: selectedBlock ? '#334155' : '#94A3B8',
              fontSize: '0.75rem',
              fontWeight: 700,
              cursor: selectedBlock ? 'pointer' : 'not-allowed',
            }}
          >
            Khối đang chọn
          </button>
          <button
            type="button"
            onClick={() => setInspectorMode('body')}
            style={{
              flex: 1,
              height: 38,
              borderRadius: 10,
              border: '1.5px solid #1E40FF',
              background: '#EFF6FF',
              color: '#1E40FF',
              fontSize: '0.75rem',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            Toàn cục (Body)
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <PropertyAccordion title="Bố cục & Phông chữ Toàn cục" defaultOpen>
            <div>
              <label style={{ fontSize: '0.73rem', fontWeight: 700, color: '#334155' }}>
                Chiều rộng tối đa Email ({mergedBody.maxWidth}px)
              </label>
              <input
                type="range"
                min={480}
                max={760}
                step={10}
                value={mergedBody.maxWidth}
                onChange={(e) => onUpdateBodyStyle({ maxWidth: Number(e.target.value) || 600 })}
                style={{ width: '100%', accentColor: '#1E40FF', marginTop: 4 }}
              />
            </div>
            <div>
              <label style={{ fontSize: '0.73rem', fontWeight: 700, color: '#334155' }}>Font chữ mặc định</label>
              <select
                value={mergedBody.fontFamily}
                onChange={(e) => onUpdateBodyStyle({ fontFamily: e.target.value })}
                style={{ ...inputStyle, marginTop: 4 }}
              >
                {EMAIL_FONT_OPTIONS.map((f) => (
                  <option key={f.value} value={f.value}>{f.label}</option>
                ))}
              </select>
            </div>
          </PropertyAccordion>

          <PropertyAccordion title="Bảng màu Chủ đạo (Royal Sapphire)" defaultOpen>
            <ColorSwatchInput label="Màu nền vùng Canvas (canvasColor)" value={mergedBody.canvasColor} onChange={(hex) => onUpdateBodyStyle({ canvasColor: hex })} />
            <ColorSwatchInput label="Màu nền khung Email (cardColor)" value={mergedBody.cardColor} onChange={(hex) => onUpdateBodyStyle({ cardColor: hex })} />
            <ColorSwatchInput label="Màu điểm nhấn thương hiệu (primaryColor)" value={mergedBody.primaryColor} onChange={(hex) => onUpdateBodyStyle({ primaryColor: hex })} />
            <ColorSwatchInput label="Màu chữ mặc định (textColor)" value={mergedBody.textColor} onChange={(hex) => onUpdateBodyStyle({ textColor: hex })} />
          </PropertyAccordion>
        </div>
      </Card>
    );
  }

  const spacing = parseSpacing(selectedBlock.padding, selectedBlock.spacing);
  const currentBorder: EmailBlockBorder = selectedBlock.border || {
    width: 0,
    style: 'none',
    color: '#E2E8F0',
    radius: selectedBlock.borderRadius ?? 12,
  };

  return (
    <Card padding="1rem">
      <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
        <button
          type="button"
          onClick={() => setInspectorMode('block')}
          style={{
            flex: 1,
            height: 38,
            borderRadius: 10,
            border: '1.5px solid #1E40FF',
            background: '#EFF6FF',
            color: '#1E40FF',
            fontSize: '0.75rem',
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          <Sliders size={13} style={{ verticalAlign: 'middle', marginRight: 4 }} />
          Khối đang chọn
        </button>
        <button
          type="button"
          onClick={() => setInspectorMode('body')}
          style={{
            flex: 1,
            height: 38,
            borderRadius: 10,
            border: '1px solid #E2E8F0',
            background: '#FFFFFF',
            color: '#334155',
            fontSize: '0.75rem',
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          Toàn cục (Body)
        </button>
      </div>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '8px 10px',
          marginBottom: 10,
          borderRadius: 12,
          background: '#F8FAFF',
          border: '1px solid #DBEAFE',
        }}
      >
        <Badge tone="primary">{selectedBlock.type}</Badge>
        <div style={{ display: 'flex', gap: 5 }}>
          <button type="button" title="Nhân bản" onClick={onDuplicateBlock} style={{ height: 30, width: 30, borderRadius: 8, border: '1px solid #DBEAFE', background: '#FFFFFF', color: '#1E40FF', cursor: 'pointer' }}><Copy size={13} /></button>
          <button type="button" title="Lưu khối tái sử dụng" onClick={onSaveReusableBlock} style={{ height: 30, width: 30, borderRadius: 8, border: '1px solid #DBEAFE', background: '#FFFFFF', color: '#1E40FF', cursor: 'pointer' }}><BookmarkPlus size={13} /></button>
          <button type="button" title="Xóa khối" onClick={onDeleteBlock} style={{ height: 30, width: 30, borderRadius: 8, border: '1px solid #FECACA', background: '#FFFFFF', color: '#DC2626', cursor: 'pointer' }}><Trash2 size={13} /></button>
          <button type="button" title="Bỏ chọn" onClick={onDeselectBlock} style={{ height: 30, width: 30, borderRadius: 8, border: '1px solid #E2E8F0', background: '#FFFFFF', color: '#64748B', cursor: 'pointer' }}><X size={13} /></button>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 640, overflowY: 'auto', paddingRight: 2 }}>
        <BlockContentFields
          block={selectedBlock}
          onUpdateBlock={onUpdateBlock}
          onOpenImageLibrary={onOpenImageLibrary}
        />

        <PropertyAccordion title="Kiểu chữ & Căn lề (Typography)">
          <div>
            <label style={{ fontSize: '0.72rem', fontWeight: 700 }}>Căn lề ngang</label>
            <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
              {(['left', 'center', 'right'] as const).map((al) => (
                <button
                  key={al}
                  type="button"
                  onClick={() => onUpdateBlock({ align: al })}
                  style={{
                    flex: 1,
                    height: 38,
                    borderRadius: 9,
                    border: (selectedBlock.align || 'left') === al ? '1.5px solid #1E40FF' : '1px solid #E2E8F0',
                    background: (selectedBlock.align || 'left') === al ? '#EFF6FF' : '#FFFFFF',
                    color: (selectedBlock.align || 'left') === al ? '#1E40FF' : '#475569',
                    cursor: 'pointer',
                  }}
                >
                  {al === 'left' ? <AlignLeft size={14} /> : al === 'center' ? <AlignCenter size={14} /> : <AlignRight size={14} />}
                </button>
              ))}
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <div>
              <label style={{ fontSize: '0.72rem', fontWeight: 700 }}>Cỡ chữ (px)</label>
              <input
                type="number"
                min={11}
                max={42}
                value={selectedBlock.typography?.fontSize || 15}
                onChange={(e) => onUpdateBlock({ typography: { ...selectedBlock.typography, fontSize: Number(e.target.value) || 15 } })}
                style={inputStyle}
              />
            </div>
            <div>
              <label style={{ fontSize: '0.72rem', fontWeight: 700 }}>Độ đậm</label>
              <select
                value={selectedBlock.typography?.fontWeight || 'normal'}
                onChange={(e) =>
                  onUpdateBlock({
                    typography: {
                      ...selectedBlock.typography,
                      fontWeight: e.target.value as 'normal' | '600' | '700' | '800',
                    },
                  })
                }
                style={inputStyle}
              >
                <option value="normal">Thường (400)</option>
                <option value="600">Bán đậm (600)</option>
                <option value="700">Đậm (700)</option>
                <option value="800">Rất đậm (800)</option>
              </select>
            </div>
          </div>
        </PropertyAccordion>

        <PropertyAccordion title="Màu sắc Khối & Nút bấm">
          <ColorSwatchInput label="Màu điểm nhấn / Nút CTA (accentColor)" value={selectedBlock.accentColor || mergedBody.primaryColor} onChange={(hex) => onUpdateBlock({ accentColor: hex })} />
          <ColorSwatchInput label="Màu chữ khối (textColor)" value={selectedBlock.textColor || mergedBody.textColor} onChange={(hex) => onUpdateBlock({ textColor: hex })} />
          <ColorSwatchInput label="Màu nền khối (backgroundColor)" value={selectedBlock.backgroundColor || '#FFFFFF'} onChange={(hex) => onUpdateBlock({ backgroundColor: hex })} />
        </PropertyAccordion>

        <PropertyAccordion title="Khoảng cách 4 cạnh (Padding)">
          <FourSideSpacingControl
            spacing={spacing}
            onChange={(nextSpacing) =>
              onUpdateBlock({
                spacing: nextSpacing,
                padding: formatSpacingToPadding(nextSpacing),
              })
            }
          />
        </PropertyAccordion>

        <PropertyAccordion title="Đường viền & Bo góc (Border)">
          <BorderRadiusControl
            border={currentBorder}
            onChange={(nextBorder) =>
              onUpdateBlock({
                border: nextBorder,
                borderRadius: nextBorder.radius,
              })
            }
          />
        </PropertyAccordion>
      </div>
    </Card>
  );
};

export default EmailProperties;
