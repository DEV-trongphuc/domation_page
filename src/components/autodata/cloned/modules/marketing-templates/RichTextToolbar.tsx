import React, { useState } from 'react';
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Bold,
  Braces,
  Eraser,
  Italic,
  Link2,
  Underline,
} from 'lucide-react';
import type { MergeTagDefinition } from './templateTypes';

export interface RichTextToolbarProps {
  align?: 'left' | 'center' | 'right';
  mergeTags: MergeTagDefinition[];
  onWrapSelection: (prefix: string, suffix: string) => void;
  onInsertLink: (url: string, label?: string) => void;
  onInsertMergeTag: (tagKey: string) => void;
  onChangeAlign: (align: 'left' | 'center' | 'right') => void;
  onClearFormatting: () => void;
}

export const RichTextToolbar: React.FC<RichTextToolbarProps> = ({
  align = 'left',
  mergeTags,
  onWrapSelection,
  onInsertLink,
  onInsertMergeTag,
  onChangeAlign,
  onClearFormatting,
}) => {
  const [linkPopoverOpen, setLinkPopoverOpen] = useState(false);
  const [tagsPopoverOpen, setTagsPopoverOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState('https://domation.net');
  const [linkLabel, setLinkLabel] = useState('');

  const btnStyle = (active = false): React.CSSProperties => ({
    height: 32,
    minWidth: 32,
    padding: '0 8px',
    borderRadius: 8,
    border: active ? '1px solid #1E40FF' : '1px solid #E2E8F0',
    background: active ? '#EFF6FF' : '#FFFFFF',
    color: active ? '#1E40FF' : '#334155',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    fontSize: '0.73rem',
    fontWeight: 700,
    cursor: 'pointer',
  });

  return (
    <div
      onClick={(e) => e.stopPropagation()}
      style={{
        position: 'relative',
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        gap: 4,
        padding: '6px 8px',
        marginBottom: 8,
        borderRadius: 12,
        background: '#F8FAFF',
        border: '1px solid #DBEAFE',
      }}
    >
      <button
        type="button"
        title="In đậm (Bold)"
        style={btnStyle()}
        onMouseDown={(e) => {
          e.preventDefault();
          onWrapSelection('<strong>', '</strong>');
        }}
      >
        <Bold size={14} />
      </button>
      <button
        type="button"
        title="In nghiêng (Italic)"
        style={btnStyle()}
        onMouseDown={(e) => {
          e.preventDefault();
          onWrapSelection('<em>', '</em>');
        }}
      >
        <Italic size={14} />
      </button>
      <button
        type="button"
        title="Gạch chân (Underline)"
        style={btnStyle()}
        onMouseDown={(e) => {
          e.preventDefault();
          onWrapSelection('<u>', '</u>');
        }}
      >
        <Underline size={14} />
      </button>

      <div style={{ width: 1, height: 18, background: '#E2E8F0', margin: '0 2px' }} />

      <button
        type="button"
        title="Căn trái"
        style={btnStyle(align === 'left')}
        onClick={() => onChangeAlign('left')}
      >
        <AlignLeft size={14} />
      </button>
      <button
        type="button"
        title="Căn giữa"
        style={btnStyle(align === 'center')}
        onClick={() => onChangeAlign('center')}
      >
        <AlignCenter size={14} />
      </button>
      <button
        type="button"
        title="Căn phải"
        style={btnStyle(align === 'right')}
        onClick={() => onChangeAlign('right')}
      >
        <AlignRight size={14} />
      </button>

      <div style={{ width: 1, height: 18, background: '#E2E8F0', margin: '0 2px' }} />

      <button
        type="button"
        title="Chèn liên kết"
        style={btnStyle(linkPopoverOpen)}
        onClick={() => {
          setTagsPopoverOpen(false);
          setLinkPopoverOpen((prev) => !prev);
        }}
      >
        <Link2 size={14} /> Link
      </button>

      <button
        type="button"
        title="Chèn Biến trộn cá nhân hóa"
        style={btnStyle(tagsPopoverOpen)}
        onClick={() => {
          setLinkPopoverOpen(false);
          setTagsPopoverOpen((prev) => !prev);
        }}
      >
        <Braces size={14} /> Biến trộn
      </button>

      <button
        type="button"
        title="Xóa thẻ định dạng"
        style={btnStyle()}
        onClick={onClearFormatting}
      >
        <Eraser size={14} />
      </button>

      {linkPopoverOpen && (
        <div
          style={{
            width: '100%',
            marginTop: 6,
            padding: 8,
            borderRadius: 10,
            background: '#FFFFFF',
            border: '1px solid #DBEAFE',
            display: 'flex',
            flexWrap: 'wrap',
            gap: 6,
            alignItems: 'center',
          }}
        >
          <input
            type="text"
            placeholder="Nhãn hiển thị (tùy chọn)"
            value={linkLabel}
            onChange={(e) => setLinkLabel(e.target.value)}
            style={{
              height: 36,
              flex: '1 1 130px',
              padding: '0 10px',
              borderRadius: 8,
              border: '1px solid #E2E8F0',
              fontSize: '0.78rem',
            }}
          />
          <input
            type="url"
            placeholder="https://domation.net"
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            style={{
              height: 36,
              flex: '2 1 180px',
              padding: '0 10px',
              borderRadius: 8,
              border: '1px solid #E2E8F0',
              fontSize: '0.78rem',
            }}
          />
          <button
            type="button"
            onClick={() => {
              if (linkUrl.trim()) {
                onInsertLink(linkUrl.trim(), linkLabel.trim() || undefined);
                setLinkPopoverOpen(false);
                setLinkLabel('');
              }
            }}
            style={{
              height: 36,
              padding: '0 12px',
              borderRadius: 8,
              border: 'none',
              background: '#1E40FF',
              color: '#FFFFFF',
              fontSize: '0.75rem',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            Chèn URL
          </button>
        </div>
      )}

      {tagsPopoverOpen && (
        <div
          style={{
            width: '100%',
            marginTop: 6,
            padding: 8,
            borderRadius: 10,
            background: '#FFFFFF',
            border: '1px solid #DBEAFE',
            display: 'flex',
            flexWrap: 'wrap',
            gap: 5,
          }}
        >
          {mergeTags.map((tag) => (
            <button
              key={tag.key}
              type="button"
              onClick={() => {
                onInsertMergeTag(tag.key);
                setTagsPopoverOpen(false);
              }}
              title={`${tag.label} (VD: ${tag.sample})`}
              style={{
                padding: '4px 9px',
                borderRadius: 8,
                border: '1px solid #DBEAFE',
                background: '#EFF6FF',
                color: '#1E40FF',
                fontSize: '0.72rem',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              {tag.key}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default RichTextToolbar;
