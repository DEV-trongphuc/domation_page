import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  ArrowDown,
  ArrowUp,
  Copy,
  GitBranch,
  GripVertical,
  Star,
  Trash2,
  Upload,
} from 'lucide-react';
import { Badge } from '../../components/ui/AutoDataLoadingModal';
import {
  END_SURVEY_TARGET,
  LAYOUT_BLOCK_TYPES,
  type SurveyBlockDto,
} from './surveyTypes';

interface SurveyCanvasBlockProps {
  block: SurveyBlockDto;
  index: number;
  totalBlocks: number;
  questionNumber: number | null;
  allBlocks: ReadonlyArray<SurveyBlockDto>;
  primaryColor: string;
  selected: boolean;
  onSelect: () => void;
  onMove: (delta: -1 | 1) => void;
  onDuplicate: () => void;
  onDelete: () => void;
}

export const SurveyCanvasBlock: React.FC<SurveyCanvasBlockProps> = ({
  block,
  index,
  totalBlocks,
  questionNumber,
  allBlocks,
  primaryColor,
  selected,
  onSelect,
  onMove,
  onDuplicate,
  onDelete,
}) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: block.id,
  });

  const branchCount =
    (block.options || []).filter((o) => Boolean(o.jumpToBlockId)).length +
    (block.defaultJumpToBlockId ? 1 : 0);

  const resolveJumpLabel = (targetId?: string): string | null => {
    if (!targetId) return null;
    if (targetId === END_SURVEY_TARGET) return 'Kết thúc khảo sát';
    const targetIdx = allBlocks.findIndex((b) => b.id === targetId);
    if (targetIdx < 0) return 'Khối đích';
    const targetBlk = allBlocks[targetIdx];
    const shortTitle = targetBlk.label.length > 24 ? `${targetBlk.label.slice(0, 24)}...` : targetBlk.label;
    return `#${targetIdx + 1}: ${shortTitle}`;
  };

  const isLayout = LAYOUT_BLOCK_TYPES.has(block.type);

  return (
    <div
      ref={setNodeRef}
      onClick={(e) => {
        e.stopPropagation();
        onSelect();
      }}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.6 : 1,
        background: block.type === 'page_break' ? '#F8FAFF' : '#FFFFFF',
        border: selected
          ? `2px solid ${primaryColor}`
          : block.type === 'page_break'
            ? '1.5px dashed #93C5FD'
            : '1px solid #E2E8F0',
        borderRadius: 16,
        padding: '0.95rem 1.1rem',
        boxShadow: selected ? '0 8px 24px rgba(30, 64, 255, 0.12)' : '0 2px 6px rgba(15, 23, 42, 0.03)',
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
      }}
    >
      {/* Top Action Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          <button
            type="button"
            {...attributes}
            {...listeners}
            onClick={(e) => e.stopPropagation()}
            title="Kéo thả để sắp xếp khối"
            style={{
              width: 26,
              height: 26,
              borderRadius: 7,
              border: '1px solid #E2E8F0',
              background: '#F8F9FA',
              color: '#64748B',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'grab',
            }}
          >
            <GripVertical size={13} />
          </button>

          {questionNumber !== null ? (
            <Badge tone="primary">Câu {questionNumber} • {block.type}</Badge>
          ) : (
            <Badge tone="neutral">Bố cục • {block.type}</Badge>
          )}

          {block.required && <Badge tone="danger">Bắt buộc</Badge>}
          {Boolean(block.points && block.points > 0) && (
            <Badge tone="success">+{block.points} điểm Quiz</Badge>
          )}
          {block.tagOnAnswer && <Badge tone="info">Tag: {block.tagOnAnswer}</Badge>}
          {branchCount > 0 && (
            <Badge tone="warning" icon={<GitBranch size={11} />}>
              {branchCount} nhánh Skip-Logic
            </Badge>
          )}
        </div>

        <div style={{ display: 'inline-flex', gap: 4 }} onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            disabled={index === 0}
            onClick={() => onMove(-1)}
            className="btn secondary sm"
            style={{ height: 28, padding: '0 6px' }}
            title="Di chuyển lên"
          >
            <ArrowUp size={12} />
          </button>
          <button
            type="button"
            disabled={index === totalBlocks - 1}
            onClick={() => onMove(1)}
            className="btn secondary sm"
            style={{ height: 28, padding: '0 6px' }}
            title="Di chuyển xuống"
          >
            <ArrowDown size={12} />
          </button>
          <button
            type="button"
            onClick={onDuplicate}
            className="btn secondary sm"
            style={{ height: 28, padding: '0 6px' }}
            title="Nhân bản khối"
          >
            <Copy size={12} />
          </button>
          <button
            type="button"
            onClick={onDelete}
            className="btn secondary sm"
            style={{ height: 28, padding: '0 6px', color: '#DC2626' }}
            title="Xóa khối"
          >
            <Trash2 size={12} />
          </button>
        </div>
      </div>

      {/* Block Body Preview */}
      {block.type === 'page_break' ? (
        <div style={{ textAlign: 'center', fontSize: '0.78rem', fontWeight: 700, color: '#1E40FF', padding: '4px 0' }}>
          ── Ngắt Trang (Multi-Step): Chuyển sang bước khảo sát tiếp theo ──
        </div>
      ) : block.type === 'divider' ? (
        <hr style={{ border: 0, borderTop: '1.5px solid #CBD5E1', margin: '6px 0' }} />
      ) : block.type === 'section_header' ? (
        <div>
          <div style={{ fontSize: '1.02rem', fontWeight: 800, color: '#0F172A' }}>{block.label}</div>
          {block.description && <div style={{ fontSize: '0.78rem', color: '#64748B', marginTop: 2 }}>{block.description}</div>}
        </div>
      ) : block.type === 'banner_block' ? (
        <div
          style={{
            borderRadius: 12,
            padding: '1rem',
            background: block.bannerImageUrl
              ? `linear-gradient(rgba(15,23,42,0.55), rgba(15,23,42,0.55)), url(${block.bannerImageUrl}) center/cover`
              : `linear-gradient(135deg, ${primaryColor} 0%, #0284C7 100%)`,
            color: '#FFFFFF',
          }}
        >
          <div style={{ fontWeight: 800, fontSize: '0.95rem' }}>{block.label}</div>
          {block.description && <div style={{ fontSize: '0.76rem', opacity: 0.9, marginTop: 3 }}>{block.description}</div>}
        </div>
      ) : block.type === 'image_block' ? (
        block.imageUrl ? (
          <img
            src={block.imageUrl}
            alt={block.label}
            style={{ width: block.imageWidth || '100%', maxHeight: 170, objectFit: 'cover', borderRadius: 12 }}
          />
        ) : (
          <div style={{ padding: '1rem', borderRadius: 12, background: '#F8F9FA', border: '1px dashed #CBD5E1', textAlign: 'center', fontSize: '0.76rem', color: '#64748B' }}>
            Chưa gắn URL ảnh minh họa (chọn khối để nhập URL ảnh ở cột bên phải)
          </div>
        )
      ) : (
        <>
          {!isLayout && (
            <div>
              <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#0F172A' }}>
                {block.label} {block.required && <span style={{ color: '#DC2626' }}>*</span>}
              </div>
              {block.description && (
                <div style={{ fontSize: '0.74rem', color: '#64748B', marginTop: 2 }}>{block.description}</div>
              )}
            </div>
          )}

          {block.type === 'nps' && (
            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
              {Array.from({ length: 11 }).map((_, n) => (
                <span
                  key={n}
                  style={{
                    width: 30,
                    height: 30,
                    borderRadius: 8,
                    border: '1px solid #DBEAFE',
                    background: n >= 9 ? '#ECFDF5' : n >= 7 ? '#FFFBEB' : '#F8FAFC',
                    color: '#0F172A',
                    fontSize: '0.74rem',
                    fontWeight: 700,
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {n}
                </span>
              ))}
            </div>
          )}

          {block.type === 'csat_stars' && (
            <div style={{ display: 'flex', gap: 6 }}>
              {Array.from({ length: block.maxValue || 5 }).map((_, i) => (
                <Star key={i} size={20} color="#F59E0B" fill={i < 4 ? '#F59E0B' : 'none'} />
              ))}
            </div>
          )}

          {block.type === 'emoji_rating' && (
            <div style={{ display: 'flex', gap: 12, fontSize: '1.35rem' }}>
              {(block.emojis || ['😠', '😕', '😐', '🙂', '🤩']).map((em, i) => (
                <span key={i}>{em}</span>
              ))}
            </div>
          )}

          {block.type === 'slider' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.74rem', color: '#64748B' }}>
              <span>{block.minLabel || block.minValue || 0}</span>
              <input type="range" disabled style={{ flex: 1, accentColor: primaryColor }} />
              <span>{block.maxLabel || block.maxValue || 100}</span>
            </div>
          )}

          {block.options && block.options.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              {block.options.map((opt) => {
                const jumpText = resolveJumpLabel(opt.jumpToBlockId);
                return (
                  <div
                    key={opt.id}
                    style={{
                      padding: '0.42rem 0.65rem',
                      borderRadius: 10,
                      background: '#F8F9FA',
                      border: '1px solid #E2E8F0',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 8,
                      fontSize: '0.78rem',
                    }}
                  >
                    <span style={{ color: '#1E293B', fontWeight: 600 }}>{opt.label}</span>
                    <div style={{ display: 'flex', gap: 5, alignItems: 'center', flexWrap: 'wrap' }}>
                      {typeof opt.points === 'number' && opt.points !== 0 && (
                        <Badge tone="primary">+{opt.points}đ</Badge>
                      )}
                      {jumpText && (
                        <Badge tone="warning" icon={<GitBranch size={10} />}>
                          ↳ {jumpText}
                        </Badge>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {(block.type === 'likert_matrix' || block.type === 'matrix_multi') && (
            <div style={{ overflowX: 'auto', borderRadius: 10, border: '1px solid #E2E8F0' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.72rem' }}>
                <thead>
                  <tr style={{ background: '#F8F9FA' }}>
                    <th style={{ padding: '6px 8px', textAlign: 'left' }}>Tiêu chí</th>
                    {(block.matrixCols || []).map((c) => (
                      <th key={c.id} style={{ padding: '6px 8px', textAlign: 'center' }}>{c.label}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(block.matrixRows || []).map((r) => (
                    <tr key={r.id} style={{ borderTop: '1px solid #F1F5F9' }}>
                      <td style={{ padding: '6px 8px', fontWeight: 600 }}>{r.label}</td>
                      {(block.matrixCols || []).map((c) => (
                        <td key={c.id} style={{ padding: '6px 8px', textAlign: 'center', color: '#94A3B8' }}>
                          {block.type === 'matrix_multi' ? '☐' : '○'}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {block.type === 'file_upload' && (
            <div style={{ padding: '0.65rem', borderRadius: 10, border: '1px dashed #CBD5E1', background: '#F8F9FA', fontSize: '0.75rem', color: '#64748B', display: 'flex', alignItems: 'center', gap: 6 }}>
              <Upload size={14} color="#1E40FF" /> Kéo thả tệp ({(block.acceptedTypes || ['.pdf', '.png']).join(', ')}, tối đa {block.maxFileSizeMB || 5}MB)
            </div>
          )}

          {['short_text', 'long_text', 'email', 'phone', 'number', 'date'].includes(block.type) && (
            <div
              style={{
                height: block.type === 'long_text' ? 54 : 36,
                borderRadius: 10,
                border: '1px solid #E2E8F0',
                background: '#F8F9FA',
                padding: '8px 10px',
                fontSize: '0.75rem',
                color: '#94A3B8',
              }}
            >
              {block.placeholder || (block.type === 'date' ? 'DD/MM/YYYY' : 'Nhập câu trả lời...')}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default SurveyCanvasBlock;
