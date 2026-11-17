import React, { useState } from 'react';
import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  Code2,
  Copy,
  Eye,
  Image as ImageIcon,
  Monitor,
  Redo2,
  ShieldCheck,
  Smartphone,
  Undo2,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { Badge, Card } from '../../components/ui/AutoDataLoadingModal';
import { CanvasBlock } from './CanvasBlock';
import type {
  EmailBlockItem,
  EmailBlockType15,
  EmailBodyStyle,
  MergeTagDefinition,
  SavedReusableBlock,
  TemplateGroupDto,
} from './templateTypes';

export interface EmailCanvasProps {
  tplName: string;
  tplSubject: string;
  tplPreheader: string;
  tplGroupId: string;
  groups: TemplateGroupDto[];
  blocks: EmailBlockItem[];
  selectedBlockId: string | null;
  bodyStyle: EmailBodyStyle;
  compiledHtml: string;
  previewHtml: string;
  mergeTags: MergeTagDefinition[];
  savedBlocks: SavedReusableBlock[];
  canUndo: boolean;
  canRedo: boolean;
  spamScore: number;
  onChangeMeta: (patch: { name?: string; subject?: string; preheader?: string; groupId?: string }) => void;
  onSelectBlock: (id: string | null) => void;
  onReplaceBlocks: (nextBlocks: EmailBlockItem[]) => void;
  onUpdateBlock: (id: string, patch: Partial<EmailBlockItem>) => void;
  onInsertBlockAt: (type: EmailBlockType15, index: number) => void;
  onInsertSavedAt: (saved: SavedReusableBlock, index: number) => void;
  onDuplicateBlock: (block: EmailBlockItem, index: number) => void;
  onSaveReusableBlock: (block: EmailBlockItem) => void;
  onDeleteBlock: (id: string) => void;
  onUndo: () => void;
  onRedo: () => void;
  onOpenValidation: () => void;
  onOpenImageLibrary: () => void;
}

export const EmailCanvas: React.FC<EmailCanvasProps> = ({
  tplName,
  tplSubject,
  tplPreheader,
  tplGroupId,
  groups,
  blocks,
  selectedBlockId,
  bodyStyle,
  compiledHtml,
  previewHtml,
  mergeTags,
  savedBlocks,
  canUndo,
  canRedo,
  spamScore,
  onChangeMeta,
  onSelectBlock,
  onReplaceBlocks,
  onUpdateBlock,
  onInsertBlockAt,
  onInsertSavedAt,
  onDuplicateBlock,
  onSaveReusableBlock,
  onDeleteBlock,
  onUndo,
  onRedo,
  onOpenValidation,
  onOpenImageLibrary,
}) => {
  const [canvasView, setCanvasView] = useState<'desktop' | 'mobile' | 'html'>('desktop');
  const [livePreviewModal, setLivePreviewModal] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = blocks.findIndex((b) => b.id === String(active.id));
    const newIndex = blocks.findIndex((b) => b.id === String(over.id));
    if (oldIndex !== -1 && newIndex !== -1) {
      onReplaceBlocks(arrayMove(blocks, oldIndex, newIndex));
    }
  };

  const handleDropFromToolbox = (e: React.DragEvent<HTMLDivElement>, insertIndex: number) => {
    const blockType = e.dataTransfer.getData('application/x-dom-email-block') as EmailBlockType15;
    const savedId = e.dataTransfer.getData('application/x-dom-saved-block');
    if (blockType) {
      e.preventDefault();
      e.stopPropagation();
      onInsertBlockAt(blockType, insertIndex);
      return;
    }
    if (savedId) {
      e.preventDefault();
      e.stopPropagation();
      const found = savedBlocks.find((s) => s.id === savedId);
      if (found) onInsertSavedAt(found, insertIndex);
    }
  };

  const moveBlock = (index: number, delta: -1 | 1) => {
    const target = index + delta;
    if (target < 0 || target >= blocks.length) return;
    onReplaceBlocks(arrayMove(blocks, index, target));
  };

  const modeBtn = (active: boolean): React.CSSProperties => ({
    height: 38,
    padding: '0 12px',
    borderRadius: 10,
    border: active ? '1.5px solid #1E40FF' : '1px solid #E2E8F0',
    background: active ? '#EFF6FF' : '#FFFFFF',
    color: active ? '#1E40FF' : '#475569',
    fontSize: '0.76rem',
    fontWeight: 700,
    display: 'inline-flex',
    alignItems: 'center',
    gap: 5,
    cursor: 'pointer',
  });

  const inputStyle: React.CSSProperties = {
    width: '100%',
    height: 44,
    marginTop: 4,
    padding: '0 12px',
    borderRadius: 10,
    border: '1px solid #E2E8F0',
    background: '#FFFFFF',
    fontSize: '0.82rem',
  };

  const canvasBg = bodyStyle.canvasColor || '#F8F9FA';
  const cardBg = bodyStyle.cardColor || '#FFFFFF';
  const shellMaxWidth = canvasView === 'mobile' ? 375 : bodyStyle.maxWidth || 600;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <Card padding="1rem 1.2rem">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 10 }}>
          <div>
            <label style={{ fontSize: '0.73rem', fontWeight: 700, color: '#334155' }}>Tên mẫu quản lý nội bộ</label>
            <input value={tplName} onChange={(e) => onChangeMeta({ name: e.target.value })} style={inputStyle} />
          </div>
          <div>
            <label style={{ fontSize: '0.73rem', fontWeight: 700, color: '#334155' }}>Thư mục nhóm</label>
            <select value={tplGroupId} onChange={(e) => onChangeMeta({ groupId: e.target.value })} style={inputStyle}>
              <option value="">— Chưa phân nhóm —</option>
              {groups.map((g) => (
                <option key={g.id} value={g.id}>{g.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label style={{ fontSize: '0.73rem', fontWeight: 700, color: '#334155' }}>Tiêu đề Email (Subject)</label>
            <input value={tplSubject} onChange={(e) => onChangeMeta({ subject: e.target.value })} style={inputStyle} />
          </div>
          <div>
            <label style={{ fontSize: '0.73rem', fontWeight: 700, color: '#334155' }}>Tóm tắt hộp thư (Preheader)</label>
            <input value={tplPreheader} onChange={(e) => onChangeMeta({ preheader: e.target.value })} style={inputStyle} />
          </div>
        </div>
      </Card>

      <Card padding="1rem">
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 8, paddingBottom: 12, marginBottom: 12, borderBottom: '1px solid #E2E8F0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            <button type="button" title="Hoàn tác (Ctrl+Z)" disabled={!canUndo} onClick={onUndo} style={{ ...modeBtn(false), opacity: canUndo ? 1 : 0.45 }}>
              <Undo2 size={14} /> Undo
            </button>
            <button type="button" title="Làm lại (Ctrl+Y)" disabled={!canRedo} onClick={onRedo} style={{ ...modeBtn(false), opacity: canRedo ? 1 : 0.45 }}>
              <Redo2 size={14} /> Redo
            </button>
            <button type="button" onClick={onOpenImageLibrary} style={modeBtn(false)}>
              <ImageIcon size={14} /> Media
            </button>
            <button type="button" onClick={onOpenValidation} style={modeBtn(false)}>
              <ShieldCheck size={14} color="#1E40FF" /> Inbox Score: {Math.max(0, 100 - spamScore)}/100
            </button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            <button type="button" style={modeBtn(canvasView === 'desktop')} onClick={() => { setLivePreviewModal(false); setCanvasView('desktop'); }}>
              <Monitor size={14} /> Desktop (600px)
            </button>
            <button type="button" style={modeBtn(canvasView === 'mobile')} onClick={() => { setLivePreviewModal(false); setCanvasView('mobile'); }}>
              <Smartphone size={14} /> Mobile (375px)
            </button>
            <button type="button" style={modeBtn(canvasView === 'html')} onClick={() => setCanvasView('html')}>
              <Code2 size={14} /> HTML Source
            </button>
            <button type="button" style={modeBtn(livePreviewModal)} onClick={() => setLivePreviewModal((prev) => !prev)}>
              <Eye size={14} /> {livePreviewModal ? 'Chế độ Sửa' : 'Xem Render'}
            </button>
          </div>
        </div>

        {canvasView === 'html' ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Badge tone="primary">Responsive Table HTML • Inline CSS</Badge>
              <button
                type="button"
                onClick={() => {
                  void navigator.clipboard?.writeText(compiledHtml);
                  toast.success('Đã sao chép mã nguồn HTML đã biên dịch!');
                }}
                style={modeBtn(false)}
              >
                <Copy size={14} /> Sao chép HTML
              </button>
            </div>
            <textarea
              readOnly
              value={compiledHtml}
              rows={20}
              style={{ width: '100%', padding: 14, borderRadius: 14, border: '1px solid #E2E8F0', background: '#F8FAFF', color: '#0F172A', fontFamily: 'monospace', fontSize: '0.76rem', lineHeight: 1.55 }}
            />
          </div>
        ) : livePreviewModal ? (
          <div style={{ background: canvasBg, padding: '1.25rem', borderRadius: 16, border: '1px solid #E2E8F0', display: 'flex', justifyContent: 'center' }}>
            <iframe
              title="Rendered Email Preview"
              sandbox=""
              srcDoc={previewHtml}
              style={{ width: canvasView === 'mobile' ? 375 : '100%', maxWidth: shellMaxWidth + 24, height: 620, border: '1px solid #E2E8F0', borderRadius: 18, background: '#FFFFFF' }}
            />
          </div>
        ) : (
          <div
            onClick={() => onSelectBlock(null)}
            onDragOver={(e) => {
              if (e.dataTransfer.types.includes('application/x-dom-email-block') || e.dataTransfer.types.includes('application/x-dom-saved-block')) {
                e.preventDefault();
              }
            }}
            onDrop={(e) => handleDropFromToolbox(e, blocks.length)}
            style={{ background: canvasBg, padding: '1.25rem 0.75rem', borderRadius: 16, border: '1px solid #E2E8F0', minHeight: 560, display: 'flex', justifyContent: 'center' }}
          >
            <div style={{ width: '100%', maxWidth: shellMaxWidth, background: cardBg, borderRadius: 20, border: '1px solid #E2E8F0', boxShadow: '0 8px 28px rgba(15, 23, 42, 0.06)', overflow: 'hidden', transition: 'max-width 0.22s ease' }}>
              {blocks.length === 0 ? (
                <div style={{ padding: '64px 24px', textAlign: 'center', color: '#64748B', fontSize: '0.84rem' }}>
                  Kéo thả bất kỳ khối nào từ bảng <strong>15 Khối</strong> bên trái vào đây để bắt đầu thiết kế!
                </div>
              ) : (
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                  <SortableContext items={blocks.map((b) => b.id)} strategy={verticalListSortingStrategy}>
                    {blocks.map((block, idx) => (
                      <CanvasBlock
                        key={block.id}
                        block={block}
                        index={idx}
                        totalBlocks={blocks.length}
                        isSelected={block.id === selectedBlockId}
                        viewport={canvasView}
                        bodyStyle={bodyStyle}
                        mergeTags={mergeTags}
                        onSelect={() => onSelectBlock(block.id)}
                        onChange={(patch) => onUpdateBlock(block.id, patch)}
                        onMove={(delta) => moveBlock(idx, delta)}
                        onDuplicate={() => onDuplicateBlock(block, idx)}
                        onSaveReusable={() => onSaveReusableBlock(block)}
                        onDelete={() => onDeleteBlock(block.id)}
                        onOpenImageLibrary={onOpenImageLibrary}
                        onDropToolboxAtIndex={handleDropFromToolbox}
                      />
                    ))}
                  </SortableContext>
                </DndContext>
              )}

              <div style={{ padding: '14px 20px', background: '#F8FAFC', borderTop: '1px solid #E2E8F0', textAlign: 'center', fontSize: '0.73rem', color: '#64748B' }}>
                Gửi từ <strong>{'{{tenant.name}}'}</strong> •{' '}
                <span style={{ color: bodyStyle.primaryColor || '#1E40FF', textDecoration: 'underline' }}>
                  Hủy đăng ký nhận tin ({'{{unsubscribe_url}}'})
                </span>
              </div>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};

export default EmailCanvas;
