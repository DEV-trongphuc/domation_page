import React, { useState } from 'react';
import { ChevronDown, ChevronRight, Lock, Unlock } from 'lucide-react';
import { SAPPHIRE_COLOR_SWATCHES } from './editorUtils';
import type { EmailBlockBorder, EmailBlockSpacing } from './templateTypes';

export interface PropertyAccordionProps {
  title: string;
  badge?: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}

export const PropertyAccordion: React.FC<PropertyAccordionProps> = ({
  title,
  badge,
  defaultOpen = false,
  children,
}) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div
      style={{
        border: '1px solid #E2E8F0',
        borderRadius: 14,
        background: '#FFFFFF',
        overflow: 'hidden',
      }}
    >
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        style={{
          width: '100%',
          height: 44,
          padding: '0 12px',
          border: 'none',
          background: open ? '#F8FAFF' : '#FFFFFF',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          cursor: 'pointer',
          color: '#0F172A',
          fontSize: '0.8rem',
          fontWeight: 700,
        }}
      >
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          {open ? <ChevronDown size={15} color="#1E40FF" /> : <ChevronRight size={15} color="#64748B" />}
          {title}
        </span>
        {badge && (
          <span
            style={{
              padding: '2px 8px',
              borderRadius: 999,
              background: '#EFF6FF',
              color: '#1E40FF',
              fontSize: '0.68rem',
              fontWeight: 700,
            }}
          >
            {badge}
          </span>
        )}
      </button>
      {open && (
        <div style={{ padding: '12px', borderTop: '1px solid #F1F5F9', display: 'flex', flexDirection: 'column', gap: 10 }}>
          {children}
        </div>
      )}
    </div>
  );
};

export interface ColorSwatchInputProps {
  label: string;
  value: string;
  onChange: (hex: string) => void;
}

export const ColorSwatchInput: React.FC<ColorSwatchInputProps> = ({ label, value, onChange }) => {
  const safeColor = /^#[0-9a-fA-F]{6}$/.test(value) ? value : '#1E40FF';
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      <label style={{ fontSize: '0.74rem', fontWeight: 700, color: '#334155' }}>{label}</label>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <input
          type="color"
          value={safeColor}
          onChange={(e) => onChange(e.target.value)}
          style={{
            width: 44,
            height: 44,
            padding: 3,
            borderRadius: 10,
            border: '1px solid #E2E8F0',
            background: '#FFFFFF',
            cursor: 'pointer',
          }}
        />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="#1E40FF"
          style={{
            flex: 1,
            height: 44,
            padding: '0 10px',
            borderRadius: 10,
            border: '1px solid #E2E8F0',
            background: '#FFFFFF',
            fontFamily: 'monospace',
            fontSize: '0.8rem',
            color: '#0F172A',
          }}
        />
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
        {SAPPHIRE_COLOR_SWATCHES.map((sw) => (
          <button
            key={sw}
            type="button"
            title={sw}
            onClick={() => onChange(sw)}
            style={{
              width: 22,
              height: 22,
              borderRadius: 6,
              background: sw,
              border: value.toUpperCase() === sw ? '2px solid #1E40FF' : '1px solid #CBD5E1',
              cursor: 'pointer',
            }}
          />
        ))}
      </div>
    </div>
  );
};

export interface FourSideSpacingControlProps {
  spacing: EmailBlockSpacing;
  onChange: (next: EmailBlockSpacing) => void;
}

export const FourSideSpacingControl: React.FC<FourSideSpacingControlProps> = ({ spacing, onChange }) => {
  const [locked, setLocked] = useState(false);

  const handleSide = (side: keyof EmailBlockSpacing, raw: string) => {
    const val = Math.max(0, Math.min(96, Number.parseInt(raw || '0', 10) || 0));
    if (locked) {
      onChange({ top: val, right: val, bottom: val, left: val });
    } else {
      onChange({ ...spacing, [side]: val });
    }
  };

  const sideItems: ReadonlyArray<{ key: keyof EmailBlockSpacing; label: string }> = [
    { key: 'top', label: 'Trên (px)' },
    { key: 'right', label: 'Phải (px)' },
    { key: 'bottom', label: 'Dưới (px)' },
    { key: 'left', label: 'Trái (px)' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: '0.74rem', fontWeight: 700, color: '#334155' }}>Padding 4 cạnh</span>
        <button
          type="button"
          onClick={() => setLocked((prev) => !prev)}
          style={{
            height: 28,
            padding: '0 8px',
            borderRadius: 8,
            border: '1px solid #DBEAFE',
            background: locked ? '#EFF6FF' : '#FFFFFF',
            color: '#1E40FF',
            fontSize: '0.7rem',
            fontWeight: 700,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            cursor: 'pointer',
          }}
        >
          {locked ? <Lock size={12} /> : <Unlock size={12} />}
          {locked ? 'Đồng bộ 4 cạnh' : 'Độc lập'}
        </button>
      </div>
      <div
        style={{
          padding: 10,
          borderRadius: 12,
          background: '#F8FAFF',
          border: '1px dashed #BFDBFE',
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 8,
        }}
      >
        {sideItems.map((item) => (
          <div key={item.key}>
            <label style={{ fontSize: '0.68rem', fontWeight: 600, color: '#64748B' }}>{item.label}</label>
            <input
              type="number"
              min={0}
              max={96}
              value={spacing[item.key]}
              onChange={(e) => handleSide(item.key, e.target.value)}
              style={{
                width: '100%',
                height: 40,
                padding: '0 10px',
                borderRadius: 8,
                border: '1px solid #E2E8F0',
                background: '#FFFFFF',
                fontSize: '0.8rem',
                fontWeight: 700,
              }}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export interface BorderRadiusControlProps {
  border: EmailBlockBorder;
  onChange: (next: EmailBlockBorder) => void;
}

export const BorderRadiusControl: React.FC<BorderRadiusControlProps> = ({ border, onChange }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
      <div>
        <label style={{ fontSize: '0.72rem', fontWeight: 700, color: '#334155' }}>Kiểu viền</label>
        <select
          value={border.style}
          onChange={(e) =>
            onChange({ ...border, style: e.target.value as EmailBlockBorder['style'] })
          }
          style={{
            width: '100%',
            height: 44,
            padding: '0 8px',
            borderRadius: 10,
            border: '1px solid #E2E8F0',
            background: '#FFFFFF',
            fontSize: '0.8rem',
          }}
        >
          <option value="none">Không viền</option>
          <option value="solid">Nét liền (Solid)</option>
          <option value="dashed">Nét đứt (Dashed)</option>
          <option value="dotted">Chấm tròn (Dotted)</option>
        </select>
      </div>
      <div>
        <label style={{ fontSize: '0.72rem', fontWeight: 700, color: '#334155' }}>Độ dày viền (px)</label>
        <input
          type="number"
          min={0}
          max={12}
          value={border.width}
          onChange={(e) =>
            onChange({ ...border, width: Math.max(0, Math.min(12, Number(e.target.value) || 0)) })
          }
          style={{
            width: '100%',
            height: 44,
            padding: '0 10px',
            borderRadius: 10,
            border: '1px solid #E2E8F0',
            background: '#FFFFFF',
            fontSize: '0.8rem',
          }}
        />
      </div>
    </div>

    <div>
      <label style={{ fontSize: '0.72rem', fontWeight: 700, color: '#334155' }}>
        Bo góc (Radius: {border.radius}px)
      </label>
      <input
        type="range"
        min={0}
        max={36}
        value={border.radius}
        onChange={(e) => onChange({ ...border, radius: Number(e.target.value) || 0 })}
        style={{ width: '100%', accentColor: '#1E40FF' }}
      />
    </div>

    {border.style !== 'none' && (
      <ColorSwatchInput
        label="Màu đường viền"
        value={border.color}
        onChange={(hex) => onChange({ ...border, color: hex })}
      />
    )}
  </div>
);
