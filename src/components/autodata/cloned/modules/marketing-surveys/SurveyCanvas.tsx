import React from 'react';
import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { Award, Clock, Sparkles } from 'lucide-react';
import { Badge, EmptyState } from '../../components/ui/AutoDataLoadingModal';
import { SurveyCanvasBlock } from './SurveyCanvasBlock';
import {
  LAYOUT_BLOCK_TYPES,
  type SurveyBlockDto,
  type SurveySettingsDto,
  type SurveyThemeDto,
} from './surveyTypes';

interface SurveyCanvasProps {
  title: string;
  description: string;
  blocks: SurveyBlockDto[];
  theme: SurveyThemeDto;
  settings: SurveySettingsDto;
  viewport: 'desktop' | 'mobile';
  selectedBlockId: string | null;
  onSelectBlock: (id: string | null) => void;
  onMoveBlockByIndex: (fromIdx: number, toIdx: number) => void;
  onDuplicateBlock: (id: string) => void;
  onDeleteBlock: (id: string) => void;
}

export const SurveyCanvas: React.FC<SurveyCanvasProps> = ({
  title,
  description,
  blocks,
  theme,
  settings,
  viewport,
  selectedBlockId,
  onSelectBlock,
  onMoveBlockByIndex,
  onDuplicateBlock,
  onDeleteBlock,
}) => {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIdx = blocks.findIndex((b) => b.id === active.id);
    const newIdx = blocks.findIndex((b) => b.id === over.id);
    if (oldIdx >= 0 && newIdx >= 0) {
      onMoveBlockByIndex(oldIdx, newIdx);
    }
  };

  const questionNums = blocks.map((blk, idx) =>
    LAYOUT_BLOCK_TYPES.has(blk.type)
      ? null
      : blocks.slice(0, idx + 1).filter((b) => !LAYOUT_BLOCK_TYPES.has(b.type)).length
  );

  return (
    <div
      onClick={() => onSelectBlock(null)}
      style={{
        background: '#F8F9FA',
        border: '1px solid #E2E8F0',
        borderRadius: 18,
        padding: '1.15rem',
        minHeight: 'calc(100vh - 170px)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}
    >
      <div
        style={{
          width: viewport === 'mobile' ? 390 : '100%',
          maxWidth: 700,
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
          transition: 'width 0.22s ease',
        }}
      >
        {/* Survey Cover Card */}
        <div
          onClick={(e) => {
            e.stopPropagation();
            onSelectBlock(null);
          }}
          style={{
            borderRadius: 18,
            overflow: 'hidden',
            border: selectedBlockId === null ? `2px solid ${theme.primaryColor}` : '1px solid #DBEAFE',
            background:
              theme.coverStyle === 'image' && theme.coverImageUrl
                ? `linear-gradient(rgba(15,23,42,0.6), rgba(15,23,42,0.6)), url(${theme.coverImageUrl}) center/cover`
                : theme.coverStyle === 'gradient'
                  ? `linear-gradient(135deg, ${theme.primaryColor} 0%, #0284C7 100%)`
                  : '#FFFFFF',
            color: theme.coverStyle === 'minimal' ? '#0F172A' : '#FFFFFF',
            padding: '1.35rem 1.4rem',
            cursor: 'pointer',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
            <span
              style={{
                fontSize: '0.68rem',
                fontWeight: 800,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                padding: '3px 10px',
                borderRadius: 999,
                background: theme.coverStyle === 'minimal' ? '#EEF2FF' : 'rgba(255,255,255,0.2)',
                color: theme.coverStyle === 'minimal' ? '#1E40FF' : '#FFFFFF',
              }}
            >
              {theme.coverBadge || 'DOMATION SURVEY'}
            </span>
            {theme.coverCountdown && (
              <span
                style={{
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 5,
                  padding: '3px 10px',
                  borderRadius: 999,
                  background: 'rgba(15,23,42,0.35)',
                  color: '#FFFFFF',
                }}
              >
                <Clock size={12} /> Đếm ngược tới: {theme.coverCountdown.replace('T', ' ')}
              </span>
            )}
          </div>
          <h2 style={{ margin: 0, fontSize: '1.22rem', fontWeight: 800 }}>{title}</h2>
          {description && (
            <p style={{ margin: '6px 0 0', fontSize: '0.82rem', opacity: 0.9 }}>{description}</p>
          )}
        </div>

        {/* Sortable Canvas Blocks */}
        {blocks.length === 0 ? (
          <EmptyState
            icon={<Sparkles size={22} />}
            title="Canvas khảo sát đang trống"
            description="Nhấn vào bất kỳ khối nào trong Thư Viện 25 Khối bên trái để thêm vào bài khảo sát."
          />
        ) : (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={blocks.map((b) => b.id)} strategy={verticalListSortingStrategy}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {blocks.map((blk, idx) => {
                  const qNum = questionNums[idx];
                  return (
                    <SurveyCanvasBlock
                      key={blk.id}
                      block={blk}
                      index={idx}
                      totalBlocks={blocks.length}
                      questionNumber={qNum}
                      allBlocks={blocks}
                      primaryColor={theme.primaryColor}
                      selected={selectedBlockId === blk.id}
                      onSelect={() => onSelectBlock(blk.id)}
                      onMove={(delta) => {
                        const target = idx + delta;
                        if (target >= 0 && target < blocks.length) {
                          onMoveBlockByIndex(idx, target);
                        }
                      }}
                      onDuplicate={() => onDuplicateBlock(blk.id)}
                      onDelete={() => onDeleteBlock(blk.id)}
                    />
                  );
                })}
              </div>
            </SortableContext>
          </DndContext>
        )}

        {/* Score Redirect & Voucher Summary Footer */}
        <div
          onClick={(e) => {
            e.stopPropagation();
            onSelectBlock(null);
          }}
          style={{
            background: '#FFFFFF',
            border: '1px solid #E2E8F0',
            borderRadius: 14,
            padding: '0.85rem 1rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 8,
            cursor: 'pointer',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.78rem', fontWeight: 700, color: '#334155' }}>
            <Award size={16} color="#1E40FF" />
            Màn hình Kết thúc: {settings.thank_you_title || 'Cảm ơn bạn đã hoàn thành khảo sát!'}
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <Badge tone="primary">+{settings.base_lead_score ?? 10} Base Score</Badge>
            {(settings.redirect_rules || []).length > 0 && (
              <Badge tone="success">{(settings.redirect_rules || []).length} Luật Điểm & Voucher</Badge>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SurveyCanvas;
