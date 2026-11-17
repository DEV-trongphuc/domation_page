import React from 'react';
import { GitBranch, Plus, Trash2 } from 'lucide-react';
import { Badge } from '../../components/ui/AutoDataLoadingModal';
import {
  BRANCHING_CAPABLE_TYPES,
  CHOICE_CAPABLE_TYPES,
  END_SURVEY_TARGET,
  LAYOUT_BLOCK_TYPES,
  type SurveyBlockDto,
  type SurveyOptionItem,
} from './surveyTypes';

interface BlockTabProps {
  block: SurveyBlockDto;
  allBlocks: ReadonlyArray<SurveyBlockDto>;
  onUpdate: (patch: Partial<SurveyBlockDto>) => void;
}

export const SurveyPropertiesBlockTab: React.FC<BlockTabProps> = ({
  block,
  allBlocks,
  onUpdate,
}) => {
  const isLayout = LAYOUT_BLOCK_TYPES.has(block.type);
  const hasChoices = CHOICE_CAPABLE_TYPES.has(block.type);
  const supportsBranching = BRANCHING_CAPABLE_TYPES.has(block.type);

  const jumpDestinations = allBlocks.filter(
    (b) => b.id !== block.id && b.type !== 'page_break' && b.type !== 'divider'
  );

  const updateOption = (optId: string, patch: Partial<SurveyOptionItem>) => {
    const next = (block.options || []).map((o) => (o.id === optId ? { ...o, ...patch } : o));
    onUpdate({ options: next });
  };

  const addOption = () => {
    const idx = (block.options || []).length + 1;
    const next: SurveyOptionItem = {
      id: crypto.randomUUID(),
      label: `Phương án ${idx}`,
      value: `opt_${idx}`,
      points: 5,
    };
    onUpdate({ options: [...(block.options || []), next] });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Badge tone="primary">Khối: {block.type}</Badge>
        {!isLayout && (
          <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: '0.78rem', fontWeight: 700, color: '#0F172A', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={Boolean(block.required)}
              onChange={(e) => onUpdate({ required: e.target.checked })}
            />
            Bắt buộc trả lời
          </label>
        )}
      </div>

      {block.type !== 'divider' && block.type !== 'page_break' && (
        <div>
          <label className="form-label" style={{ fontWeight: 700, fontSize: '0.76rem' }}>
            Nội dung câu hỏi / Tiêu đề khối
          </label>
          <textarea
            rows={2}
            className="form-input"
            style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', fontSize: '0.8rem' }}
            value={block.label}
            onChange={(e) => onUpdate({ label: e.target.value })}
          />
        </div>
      )}

      {!['divider', 'page_break', 'image_block'].includes(block.type) && (
        <div>
          <label className="form-label" style={{ fontWeight: 700, fontSize: '0.76rem' }}>
            Mô tả hướng dẫn phụ (Tùy chọn)
          </label>
          <input
            className="form-input"
            style={{ height: 38, background: '#FFFFFF', border: '1px solid #E2E8F0', fontSize: '0.78rem' }}
            value={block.description || ''}
            placeholder="Gợi ý thêm cho người trả lời..."
            onChange={(e) => onUpdate({ description: e.target.value })}
          />
        </div>
      )}

      {['short_text', 'long_text', 'email', 'phone', 'number'].includes(block.type) && (
        <div>
          <label className="form-label" style={{ fontWeight: 700, fontSize: '0.76rem' }}>Placeholder</label>
          <input
            className="form-input"
            style={{ height: 38, background: '#FFFFFF', border: '1px solid #E2E8F0', fontSize: '0.78rem' }}
            value={block.placeholder || ''}
            onChange={(e) => onUpdate({ placeholder: e.target.value })}
          />
        </div>
      )}

      {!isLayout && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <div>
            <label className="form-label" style={{ fontWeight: 700, fontSize: '0.74rem' }}>Gắn Tag khi trả lời</label>
            <input
              className="form-input"
              style={{ height: 38, background: '#FFFFFF', border: '1px solid #E2E8F0', fontSize: '0.76rem' }}
              placeholder="VD: Quan tâm VIP"
              value={block.tagOnAnswer || ''}
              onChange={(e) => onUpdate({ tagOnAnswer: e.target.value })}
            />
          </div>
          <div>
            <label className="form-label" style={{ fontWeight: 700, fontSize: '0.74rem' }}>Điểm thưởng khối</label>
            <input
              type="number"
              className="form-input"
              style={{ height: 38, background: '#FFFFFF', border: '1px solid #E2E8F0', fontSize: '0.76rem' }}
              value={block.points ?? 0}
              onChange={(e) => onUpdate({ points: Number(e.target.value) })}
            />
          </div>
        </div>
      )}

      {block.type === 'quiz_scored' && (
        <div>
          <label className="form-label" style={{ fontWeight: 700, fontSize: '0.76rem', color: '#1E40FF' }}>
            Đáp án chuẩn (Correct Value)
          </label>
          <select
            className="form-input"
            style={{ height: 38, background: '#F8FAFF', border: '1px solid #DBEAFE', fontSize: '0.78rem' }}
            value={block.correctValue || ''}
            onChange={(e) => onUpdate({ correctValue: e.target.value })}
          >
            <option value="">— Tính theo điểm từng phương án —</option>
            {(block.options || []).map((o) => (
              <option key={o.id} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
      )}

      {/* Choice Options + Conditional Branching Skip-Logic */}
      {hasChoices && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#0F172A' }}>
              Các Phương Án & Rẽ Nhánh
            </span>
            <button
              type="button"
              onClick={addOption}
              className="btn secondary sm"
              style={{ height: 30, color: '#1E40FF', display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: '0.73rem' }}
            >
              <Plus size={12} /> Thêm đáp án
            </button>
          </div>

          {(block.options || []).map((opt) => (
            <div
              key={opt.id}
              style={{
                padding: '0.6rem',
                borderRadius: 12,
                background: '#F8F9FA',
                border: opt.jumpToBlockId ? '1px solid #F59E0B' : '1px solid #E2E8F0',
                display: 'flex',
                flexDirection: 'column',
                gap: 6,
              }}
            >
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 68px 30px', gap: 6, alignItems: 'center' }}>
                <input
                  className="form-input"
                  style={{ height: 34, background: '#FFFFFF', fontSize: '0.77rem' }}
                  value={opt.label}
                  onChange={(e) =>
                    updateOption(opt.id, {
                      label: e.target.value,
                      value: e.target.value.trim().toLowerCase().replace(/\s+/g, '_') || opt.id,
                    })
                  }
                />
                <input
                  type="number"
                  className="form-input"
                  style={{ height: 34, background: '#FFFFFF', fontSize: '0.75rem', textAlign: 'center' }}
                  title="Điểm cộng Lead Score khi chọn đáp án này"
                  value={opt.points ?? 0}
                  onChange={(e) => updateOption(opt.id, { points: Number(e.target.value) })}
                />
                <button
                  type="button"
                  onClick={() => onUpdate({ options: (block.options || []).filter((o) => o.id !== opt.id) })}
                  className="btn secondary sm"
                  style={{ height: 34, padding: 0, color: '#DC2626', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  <Trash2 size={12} />
                </button>
              </div>

              {supportsBranching && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <GitBranch size={12} color="#D97706" style={{ flexShrink: 0 }} />
                  <select
                    className="form-input"
                    style={{ height: 32, fontSize: '0.72rem', background: '#FFFFFF', border: '1px solid #E2E8F0' }}
                    value={opt.jumpToBlockId || ''}
                    onChange={(e) => updateOption(opt.id, { jumpToBlockId: e.target.value || undefined })}
                  >
                    <option value="">Nếu chọn đáp án này → Sang câu kế tiếp</option>
                    <option value={END_SURVEY_TARGET}>Nếu chọn đáp án này → Kết thúc khảo sát ngay</option>
                    {jumpDestinations.map((dest) => {
                      const pos = allBlocks.findIndex((x) => x.id === dest.id) + 1;
                      return (
                        <option key={dest.id} value={dest.id}>
                          Nhảy tới khối #{pos}: {dest.label.slice(0, 32)}
                        </option>
                      );
                    })}
                  </select>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* NPS / Slider / CSAT Bounds */}
      {['nps', 'slider', 'csat_stars'].includes(block.type) && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <div>
            <label className="form-label" style={{ fontWeight: 700, fontSize: '0.74rem' }}>Giá trị Min</label>
            <input
              type="number"
              className="form-input"
              style={{ height: 36, background: '#FFFFFF' }}
              value={block.minValue ?? 0}
              onChange={(e) => onUpdate({ minValue: Number(e.target.value) })}
            />
          </div>
          <div>
            <label className="form-label" style={{ fontWeight: 700, fontSize: '0.74rem' }}>Giá trị Max</label>
            <input
              type="number"
              className="form-input"
              style={{ height: 36, background: '#FFFFFF' }}
              value={block.maxValue ?? (block.type === 'nps' ? 10 : block.type === 'csat_stars' ? 5 : 100)}
              onChange={(e) => onUpdate({ maxValue: Number(e.target.value) })}
            />
          </div>
          {block.type !== 'csat_stars' && (
            <>
              <input
                className="form-input"
                style={{ height: 36, background: '#FFFFFF', fontSize: '0.75rem' }}
                placeholder="Nhãn đầu trái (Min)..."
                value={block.minLabel || ''}
                onChange={(e) => onUpdate({ minLabel: e.target.value })}
              />
              <input
                className="form-input"
                style={{ height: 36, background: '#FFFFFF', fontSize: '0.75rem' }}
                placeholder="Nhãn đầu phải (Max)..."
                value={block.maxLabel || ''}
                onChange={(e) => onUpdate({ maxLabel: e.target.value })}
              />
            </>
          )}
        </div>
      )}

      {/* Matrix Rows & Columns */}
      {(block.type === 'likert_matrix' || block.type === 'matrix_multi') && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div>
            <label className="form-label" style={{ fontWeight: 700, fontSize: '0.74rem' }}>
              Các Hàng Tiêu Chí (cách nhau dấu phẩy)
            </label>
            <input
              className="form-input"
              style={{ height: 38, background: '#FFFFFF', fontSize: '0.76rem' }}
              value={(block.matrixRows || []).map((r) => r.label).join(', ')}
              onChange={(e) =>
                onUpdate({
                  matrixRows: e.target.value
                    .split(',')
                    .map((s) => s.trim())
                    .filter(Boolean)
                    .map((label, i) => ({ id: block.matrixRows?.[i]?.id || `row_${i + 1}`, label })),
                })
              }
            />
          </div>
          <div>
            <label className="form-label" style={{ fontWeight: 700, fontSize: '0.74rem' }}>
              Các Cột Mức Đánh Giá (cách nhau dấu phẩy)
            </label>
            <input
              className="form-input"
              style={{ height: 38, background: '#FFFFFF', fontSize: '0.76rem' }}
              value={(block.matrixCols || []).map((c) => c.label).join(', ')}
              onChange={(e) =>
                onUpdate({
                  matrixCols: e.target.value
                    .split(',')
                    .map((s) => s.trim())
                    .filter(Boolean)
                    .map((label, i) => ({ id: block.matrixCols?.[i]?.id || `col_${i + 1}`, label })),
                })
              }
            />
          </div>
        </div>
      )}

      {/* Image / Banner URL */}
      {(block.type === 'image_block' || block.type === 'banner_block') && (
        <div>
          <label className="form-label" style={{ fontWeight: 700, fontSize: '0.75rem' }}>
            URL Hình Ảnh (`https://...`)
          </label>
          <input
            className="form-input"
            style={{ height: 38, background: '#FFFFFF', fontSize: '0.76rem' }}
            placeholder="https://..."
            value={block.type === 'image_block' ? block.imageUrl || '' : block.bannerImageUrl || ''}
            onChange={(e) =>
              onUpdate(
                block.type === 'image_block'
                  ? { imageUrl: e.target.value }
                  : { bannerImageUrl: e.target.value }
              )
            }
          />
        </div>
      )}
    </div>
  );
};

export default SurveyPropertiesBlockTab;
