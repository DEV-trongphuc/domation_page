import React, { useRef } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  ArrowDown,
  ArrowUp,
  BookmarkPlus,
  Copy,
  GripVertical,
  Image as ImageIcon,
  Trash2,
} from 'lucide-react';
import { CanvasCommerceBlocks } from './CanvasCommerceBlocks';
import { parseSpacing } from './editorUtils';
import { RichTextToolbar } from './RichTextToolbar';
import type { EmailBlockItem, EmailBodyStyle, MergeTagDefinition } from './templateTypes';

export interface CanvasBlockProps {
  block: EmailBlockItem;
  index: number;
  totalBlocks: number;
  isSelected: boolean;
  viewport: 'desktop' | 'mobile';
  bodyStyle: EmailBodyStyle;
  mergeTags: MergeTagDefinition[];
  onSelect: () => void;
  onChange: (patch: Partial<EmailBlockItem>) => void;
  onMove: (delta: -1 | 1) => void;
  onDuplicate: () => void;
  onSaveReusable: () => void;
  onDelete: () => void;
  onOpenImageLibrary: () => void;
  onDropToolboxAtIndex: (e: React.DragEvent<HTMLDivElement>, insertIndex: number) => void;
}

export const CanvasBlock: React.FC<CanvasBlockProps> = ({
  block,
  index,
  totalBlocks,
  isSelected,
  viewport,
  bodyStyle,
  mergeTags,
  onSelect,
  onChange,
  onMove,
  onDuplicate,
  onSaveReusable,
  onDelete,
  onOpenImageLibrary,
  onDropToolboxAtIndex,
}) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: block.id,
  });
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const spacing = parseSpacing(block.padding, block.spacing);
  const accent = block.accentColor || bodyStyle.primaryColor || '#1E40FF';
  const textCol = block.textColor || bodyStyle.textColor || '#0F172A';
  const fontFam = block.typography?.fontFamily || bodyStyle.fontFamily || 'Inter, sans-serif';
  const fontSize = block.typography?.fontSize || 15;
  const lineHeight = block.typography?.lineHeight || 1.6;
  const radius = block.border?.radius ?? block.borderRadius ?? 12;
  const align = block.align || 'left';
  const borderCss =
    block.border && block.border.style !== 'none' && block.border.width > 0
      ? `${block.border.width}px ${block.border.style} ${block.border.color || '#E2E8F0'}`
      : undefined;

  const wrapSelection = (prefix: string, suffix: string) => {
    const el = textareaRef.current;
    const current = block.content || '';
    if (!el) {
      onChange({ content: `${prefix}${current}${suffix}` });
      return;
    }
    const start = el.selectionStart ?? current.length;
    const end = el.selectionEnd ?? current.length;
    const selected = current.slice(start, end) || 'văn bản';
    onChange({ content: `${current.slice(0, start)}${prefix}${selected}${suffix}${current.slice(end)}` });
  };

  const insertAtCursor = (snippet: string) => {
    const el = textareaRef.current;
    const current = block.content || '';
    if (!el) {
      onChange({ content: `${current} ${snippet}`.trim() });
      return;
    }
    const pos = el.selectionStart ?? current.length;
    onChange({ content: `${current.slice(0, pos)}${snippet}${current.slice(pos)}` });
  };

  const actionBtnStyle: React.CSSProperties = {
    width: 28,
    height: 28,
    borderRadius: 7,
    border: '1px solid #DBEAFE',
    background: '#FFFFFF',
    color: '#1E40FF',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    padding: 0,
  };

  const renderBlockBody = () => {
    switch (block.type) {
      case 'hero_banner':
        return (
          <div style={{ background: `linear-gradient(135deg, ${accent} 0%, #0284C7 100%)`, borderRadius: radius, padding: '28px 24px', textAlign: align, color: '#FFFFFF', border: borderCss }}>
            {isSelected && (
              <RichTextToolbar
                align={align}
                mergeTags={mergeTags}
                onWrapSelection={wrapSelection}
                onInsertLink={(url, label) => insertAtCursor(`<a href="${url}">${label || url}</a>`)}
                onInsertMergeTag={insertAtCursor}
                onChangeAlign={(nextAlign) => onChange({ align: nextAlign })}
                onClearFormatting={() => onChange({ content: (block.content || '').replace(/<[^>]+>/g, '') })}
              />
            )}
            <div style={{ fontSize: 22, fontWeight: 800, lineHeight: 1.3, marginBottom: 10 }}>{block.title || 'Tiêu đề Hero Banner'}</div>
            {isSelected ? (
              <textarea ref={textareaRef} rows={2} value={block.content || ''} onChange={(e) => onChange({ content: e.target.value })} style={{ width: '100%', borderRadius: 10, border: '1px solid rgba(255,255,255,0.45)', background: 'rgba(255,255,255,0.14)', color: '#FFFFFF', padding: '8px 10px', fontSize: 14, marginBottom: 14 }} />
            ) : (
              <div style={{ fontSize: 14, opacity: 0.94, lineHeight: 1.6, marginBottom: 16 }}>{(block.content || '').replace(/<[^>]+>/g, '')}</div>
            )}
            {block.buttonLabel && (
              <span style={{ display: 'inline-block', padding: '11px 22px', borderRadius: 10, background: '#FFFFFF', color: accent, fontWeight: 700, fontSize: 14 }}>
                {block.buttonLabel}
              </span>
            )}
          </div>
        );

      case 'text':
        return (
          <div style={{ textAlign: align, color: textCol, fontFamily: fontFam, fontSize, lineHeight, border: borderCss, borderRadius: borderCss ? radius : undefined, padding: borderCss ? 12 : 0 }}>
            {isSelected && (
              <RichTextToolbar
                align={align}
                mergeTags={mergeTags}
                onWrapSelection={wrapSelection}
                onInsertLink={(url, label) => insertAtCursor(`<a href="${url}">${label || url}</a>`)}
                onInsertMergeTag={insertAtCursor}
                onChangeAlign={(nextAlign) => onChange({ align: nextAlign })}
                onClearFormatting={() => onChange({ content: (block.content || '').replace(/<[^>]+>/g, '') })}
              />
            )}
            {block.title && <div style={{ fontSize: fontSize + 3, fontWeight: 700, marginBottom: 6, color: textCol }}>{block.title}</div>}
            {isSelected ? (
              <textarea ref={textareaRef} rows={3} value={block.content || ''} onChange={(e) => onChange({ content: e.target.value })} style={{ width: '100%', padding: '8px 10px', borderRadius: 10, border: '1px solid #DBEAFE', background: '#F8FAFF', color: textCol, fontFamily: fontFam, fontSize, lineHeight }} />
            ) : (
              <div style={{ whiteSpace: 'pre-line' }} dangerouslySetInnerHTML={{ __html: (block.content || '').replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') }} />
            )}
          </div>
        );

      case 'image':
        return (
          <div style={{ textAlign: align }}>
            <img src={block.imageUrl || 'https://placehold.co/600x240/EFF6FF/1E40FF?text=Image'} alt={block.altText || block.title || 'Email Image'} style={{ width: block.imageWidthPct ? `${block.imageWidthPct}%` : '100%', maxWidth: '100%', height: 'auto', borderRadius: radius, border: borderCss || '1px solid #E2E8F0' }} />
            {isSelected && (
              <div style={{ marginTop: 8, display: 'flex', justifyContent: 'center' }}>
                <button type="button" onClick={(e) => { e.stopPropagation(); onOpenImageLibrary(); }} style={{ height: 34, padding: '0 12px', borderRadius: 8, border: '1px solid #DBEAFE', background: '#EFF6FF', color: '#1E40FF', fontSize: '0.75rem', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                  <ImageIcon size={14} /> Đổi ảnh từ Thư viện Media
                </button>
              </div>
            )}
          </div>
        );

      case 'button':
        return (
          <div style={{ textAlign: align }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', minHeight: 44, padding: '0 26px', borderRadius: radius, background: accent, color: block.textColor || '#FFFFFF', fontWeight: 700, fontSize: block.typography?.fontSize || 14, border: borderCss }}>
              {block.buttonLabel || 'Khám phá chi tiết'}
            </span>
          </div>
        );

      case 'divider':
        return (
          <hr style={{ border: 'none', borderTop: `${block.border?.width || 1}px ${block.border?.style && block.border.style !== 'none' ? block.border.style : 'solid'} ${block.border?.color || '#E2E8F0'}`, margin: 0 }} />
        );

      case 'columns': {
        const cols = block.columns && block.columns.length > 0 ? block.columns : [{ heading: 'Cột 1', body: '' }, { heading: 'Cột 2', body: '' }];
        const stacked = viewport === 'mobile' && block.stackOnMobile !== false;
        return (
          <div style={{ display: 'flex', flexDirection: stacked ? 'column' : 'row', gap: block.columnGap ?? 12 }}>
            {cols.map((col, cIdx) => (
              <div key={cIdx} style={{ flex: stacked ? '1 1 100%' : `0 0 calc(${col.widthPct || Math.floor(100 / cols.length)}% - ${((block.columnGap ?? 12) * (cols.length - 1)) / cols.length}px)`, background: '#F8FAFF', border: '1px solid #E2E8F0', borderRadius: radius, padding: 14 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#0F172A', marginBottom: 5 }}>{col.heading || `Cột #${cIdx + 1}`}</div>
                <div style={{ fontSize: 13, color: '#475569', lineHeight: 1.5 }}>{col.body || ''}</div>
                {col.ctaLabel && <div style={{ marginTop: 8, fontSize: 12.5, fontWeight: 700, color: accent }}>{col.ctaLabel} →</div>}
              </div>
            ))}
          </div>
        );
      }

      default:
        return (
          <CanvasCommerceBlocks
            block={block}
            isSelected={isSelected}
            viewport={viewport}
            accent={accent}
            radius={radius}
            align={align}
            borderCss={borderCss}
            onChange={onChange}
          />
        );
    }
  };

  return (
    <div
      ref={setNodeRef}
      id={`canvas-block-${block.id}`}
      onClick={(e) => { e.stopPropagation(); onSelect(); }}
      onDragOver={(e) => {
        if (e.dataTransfer.types.includes('application/x-dom-email-block') || e.dataTransfer.types.includes('application/x-dom-saved-block')) {
          e.preventDefault();
          e.stopPropagation();
        }
      }}
      onDrop={(e) => onDropToolboxAtIndex(e, index + 1)}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.55 : 1,
        position: 'relative',
        background: block.backgroundColor || 'transparent',
        padding: `${spacing.top}px ${spacing.right}px ${spacing.bottom}px ${spacing.left}px`,
        outline: isSelected ? '2px solid #1E40FF' : '1px solid transparent',
        outlineOffset: -2,
        borderRadius: 8,
        cursor: 'pointer',
      }}
    >
      {isSelected && (
        <div onClick={(e) => e.stopPropagation()} style={{ position: 'absolute', top: 6, right: 8, zIndex: 20, display: 'flex', alignItems: 'center', gap: 4, padding: '4px 6px', borderRadius: 10, background: '#FFFFFF', border: '1px solid #BFDBFE', boxShadow: '0 4px 14px rgba(30, 64, 255, 0.14)' }}>
          <span style={{ fontSize: '0.66rem', fontWeight: 800, color: '#1E40FF', textTransform: 'uppercase', padding: '0 4px' }}>{block.type}</span>
          <button type="button" title="Kéo sắp xếp" style={{ ...actionBtnStyle, cursor: 'grab' }} {...attributes} {...listeners}><GripVertical size={13} /></button>
          <button type="button" title="Di chuyển lên" disabled={index === 0} onClick={() => onMove(-1)} style={{ ...actionBtnStyle, opacity: index === 0 ? 0.4 : 1 }}><ArrowUp size={13} /></button>
          <button type="button" title="Di chuyển xuống" disabled={index === totalBlocks - 1} onClick={() => onMove(1)} style={{ ...actionBtnStyle, opacity: index === totalBlocks - 1 ? 0.4 : 1 }}><ArrowDown size={13} /></button>
          <button type="button" title="Nhân bản" onClick={onDuplicate} style={actionBtnStyle}><Copy size={13} /></button>
          <button type="button" title="Lưu khối tái sử dụng" onClick={onSaveReusable} style={actionBtnStyle}><BookmarkPlus size={13} /></button>
          <button type="button" title="Xóa khối" onClick={onDelete} style={{ ...actionBtnStyle, color: '#DC2626', borderColor: '#FECACA' }}><Trash2 size={13} /></button>
        </div>
      )}
      {renderBlockBody()}
    </div>
  );
};

export default CanvasBlock;
