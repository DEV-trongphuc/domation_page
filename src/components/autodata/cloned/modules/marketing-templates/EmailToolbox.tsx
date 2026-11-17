import React, { useMemo, useState } from 'react';
import {
  Bookmark,
  GripVertical,
  Layers,
  LayoutGrid,
  Plus,
  Search,
  Sparkles,
  Trash2,
} from 'lucide-react';
import { Badge, Card } from '../../components/ui/AutoDataLoadingModal';
import { STARTER_TEMPLATE_PRESETS, type StarterPresetDefinition } from './editorUtils';
import { EMAIL_15_BLOCK_PALETTE } from './htmlCompiler';
import type {
  EmailBlockItem,
  EmailBlockType15,
  MergeTagDefinition,
  SavedReusableBlock,
} from './templateTypes';

export interface EmailToolboxProps {
  blocks: EmailBlockItem[];
  selectedBlockId: string | null;
  savedBlocks: SavedReusableBlock[];
  mergeTags: MergeTagDefinition[];
  onAddBlock: (type: EmailBlockType15) => void;
  onSelectBlock: (id: string) => void;
  onInsertSavedBlock: (saved: SavedReusableBlock) => void;
  onDeleteSavedBlock: (savedId: string) => void;
  onApplyPreset: (preset: StarterPresetDefinition) => void;
  onInsertMergeTag: (tagKey: string) => void;
}

export const EmailToolbox: React.FC<EmailToolboxProps> = ({
  blocks,
  selectedBlockId,
  savedBlocks,
  mergeTags,
  onAddBlock,
  onSelectBlock,
  onInsertSavedBlock,
  onDeleteSavedBlock,
  onApplyPreset,
  onInsertMergeTag,
}) => {
  const [tab, setTab] = useState<'blocks' | 'saved' | 'layers'>('blocks');
  const [query, setQuery] = useState('');

  const filteredPalette = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return EMAIL_15_BLOCK_PALETTE;
    return EMAIL_15_BLOCK_PALETTE.filter(
      (item) => item.label.toLowerCase().includes(q) || item.desc.toLowerCase().includes(q)
    );
  }, [query]);

  const categories: ReadonlyArray<{ key: 'layout' | 'content' | 'commerce'; title: string }> = [
    { key: 'layout', title: 'Bố Cục & Cột Đa Năng' },
    { key: 'content', title: 'Nội Dung & Tương Tác' },
    { key: 'commerce', title: 'Thương Mại & Ưu Đãi' },
  ];

  const tabBtnStyle = (active: boolean): React.CSSProperties => ({
    flex: 1,
    height: 36,
    borderRadius: 10,
    border: active ? '1px solid #DBEAFE' : '1px solid transparent',
    background: active ? '#EFF6FF' : 'transparent',
    color: active ? '#1E40FF' : '#64748B',
    fontSize: '0.74rem',
    fontWeight: 700,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    cursor: 'pointer',
  });

  return (
    <Card padding="1rem">
      <div
        style={{
          display: 'flex',
          gap: 4,
          padding: 4,
          borderRadius: 12,
          background: '#F8F9FA',
          border: '1px solid #E2E8F0',
          marginBottom: 12,
        }}
      >
        <button type="button" style={tabBtnStyle(tab === 'blocks')} onClick={() => setTab('blocks')}>
          <LayoutGrid size={13} /> 15 Khối
        </button>
        <button type="button" style={tabBtnStyle(tab === 'saved')} onClick={() => setTab('saved')}>
          <Bookmark size={13} /> Đã lưu ({savedBlocks.length})
        </button>
        <button type="button" style={tabBtnStyle(tab === 'layers')} onClick={() => setTab('layers')}>
          <Layers size={13} /> Lớp ({blocks.length})
        </button>
      </div>

      {tab === 'blocks' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ position: 'relative' }}>
            <Search
              size={14}
              color="#94A3B8"
              style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }}
            />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Tìm trong 15 khối thiết kế..."
              style={{
                width: '100%',
                height: 40,
                padding: '0 10px 0 34px',
                borderRadius: 10,
                border: '1px solid #E2E8F0',
                background: '#FFFFFF',
                fontSize: '0.78rem',
              }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxHeight: 470, overflowY: 'auto', paddingRight: 2 }}>
            {categories.map((cat) => {
              const items = filteredPalette.filter((i) => i.category === cat.key);
              if (items.length === 0) return null;
              return (
                <div key={cat.key} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <div
                    style={{
                      fontSize: '0.68rem',
                      fontWeight: 800,
                      textTransform: 'uppercase',
                      letterSpacing: '0.06em',
                      color: '#64748B',
                    }}
                  >
                    {cat.title}
                  </div>
                  {items.map((item) => (
                    <div
                      key={item.type}
                      draggable
                      onDragStart={(e) => {
                        e.dataTransfer.setData('application/x-dom-email-block', item.type);
                        e.dataTransfer.effectAllowed = 'copy';
                      }}
                      onClick={() => onAddBlock(item.type)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 8,
                        padding: '9px 11px',
                        borderRadius: 12,
                        border: '1px solid #E2E8F0',
                        background: '#FFFFFF',
                        cursor: 'grab',
                      }}
                    >
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#0F172A' }}>
                          {item.label}
                        </div>
                        <div style={{ fontSize: '0.7rem', color: '#64748B', marginTop: 1 }}>
                          {item.desc}
                        </div>
                      </div>
                      <span
                        style={{
                          width: 26,
                          height: 26,
                          borderRadius: 8,
                          background: '#EFF6FF',
                          color: '#1E40FF',
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                        }}
                      >
                        <Plus size={14} />
                      </span>
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {tab === 'saved' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 500, overflowY: 'auto' }}>
          {savedBlocks.length === 0 ? (
            <div
              style={{
                padding: '24px 12px',
                borderRadius: 12,
                background: '#F8FAFF',
                border: '1px dashed #DBEAFE',
                textAlign: 'center',
                fontSize: '0.76rem',
                color: '#64748B',
              }}
            >
              Chưa có khối tái sử dụng nào. Nhấn biểu tượng <strong>Lưu khối</strong> trên bất kỳ khối nào ở Canvas để lưu vào thư viện.
            </div>
          ) : (
            savedBlocks.map((saved) => (
              <div
                key={saved.id}
                draggable
                onDragStart={(e) => {
                  e.dataTransfer.setData('application/x-dom-saved-block', saved.id);
                  e.dataTransfer.effectAllowed = 'copy';
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 8,
                  padding: '10px 12px',
                  borderRadius: 12,
                  border: '1px solid #DBEAFE',
                  background: '#F8FAFF',
                  cursor: 'grab',
                }}
              >
                <div
                  onClick={() => onInsertSavedBlock(saved)}
                  style={{ flex: 1, minWidth: 0, cursor: 'pointer' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <GripVertical size={13} color="#1E40FF" />
                    <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#0F172A' }}>
                      {saved.name}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.68rem', color: '#64748B', marginTop: 2 }}>
                    Loại: {saved.block.type} • Nhấn hoặc kéo vào Canvas
                  </div>
                </div>
                <button
                  type="button"
                  title="Xóa khối đã lưu"
                  onClick={() => onDeleteSavedBlock(saved.id)}
                  style={{
                    width: 30,
                    height: 30,
                    borderRadius: 8,
                    border: '1px solid #FECACA',
                    background: '#FFFFFF',
                    color: '#DC2626',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                  }}
                >
                  <Trash2 size={13} />
                </button>
              </div>
            ))
          )}
        </div>
      )}

      {tab === 'layers' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxHeight: 500, overflowY: 'auto' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div style={{ fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', color: '#64748B' }}>
              Cây Cấu Trúc Canvas ({blocks.length} khối)
            </div>
            {blocks.map((b, idx) => (
              <button
                key={b.id}
                type="button"
                onClick={() => onSelectBlock(b.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '8px 10px',
                  borderRadius: 10,
                  border: b.id === selectedBlockId ? '1.5px solid #1E40FF' : '1px solid #E2E8F0',
                  background: b.id === selectedBlockId ? '#EFF6FF' : '#FFFFFF',
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
              >
                <span style={{ fontSize: '0.76rem', fontWeight: 700, color: '#0F172A', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  #{idx + 1} • {b.title || b.buttonLabel || b.type}
                </span>
                <Badge tone="primary">{b.type}</Badge>
              </button>
            ))}
          </div>

          <div style={{ borderTop: '1px solid #E2E8F0', paddingTop: 10, display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div style={{ fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', color: '#64748B', display: 'flex', alignItems: 'center', gap: 4 }}>
              <Sparkles size={12} color="#1E40FF" /> Bố cục Mẫu Nhanh
            </div>
            {STARTER_TEMPLATE_PRESETS.map((preset) => (
              <button
                key={preset.id}
                type="button"
                onClick={() => onApplyPreset(preset)}
                style={{
                  textAlign: 'left',
                  padding: '9px 11px',
                  borderRadius: 10,
                  border: '1px solid #DBEAFE',
                  background: '#F8FAFF',
                  cursor: 'pointer',
                }}
              >
                <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#1E40FF' }}>{preset.name}</div>
                <div style={{ fontSize: '0.68rem', color: '#64748B', marginTop: 2 }}>{preset.desc}</div>
              </button>
            ))}
          </div>
        </div>
      )}

      <div style={{ marginTop: 14, paddingTop: 12, borderTop: '1px solid #E2E8F0' }}>
        <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#0F172A', marginBottom: 6 }}>
          Biến Trộn Cá Nhân Hóa (Merge Tags)
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
          {mergeTags.map((tag) => (
            <button
              key={tag.key}
              type="button"
              onClick={() => onInsertMergeTag(tag.key)}
              title={`${tag.label} (Mẫu: ${tag.sample})`}
              style={{
                padding: '4px 8px',
                borderRadius: 8,
                border: '1px solid #DBEAFE',
                background: '#EFF6FF',
                color: '#1E40FF',
                fontSize: '0.69rem',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              {tag.key}
            </button>
          ))}
        </div>
      </div>
    </Card>
  );
};

export default EmailToolbox;
