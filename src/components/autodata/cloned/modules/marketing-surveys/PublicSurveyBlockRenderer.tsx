import React from 'react';
import { ArrowDown, ArrowUp, Star, Upload } from 'lucide-react';
import toast from 'react-hot-toast';
import type { SurveyBlockDto } from './surveyTypes';

interface BlockRendererProps {
  block: SurveyBlockDto;
  primaryColor: string;
  value: unknown;
  errorMessage?: string;
  onChange: (nextVal: unknown) => void;
}

export const PublicSurveyBlockRenderer: React.FC<BlockRendererProps> = ({
  block,
  primaryColor,
  value,
  errorMessage,
  onChange,
}) => {
  if (block.type === 'divider') {
    return <hr style={{ border: 0, borderTop: '1.5px solid #E2E8F0', margin: '6px 0' }} />;
  }

  if (block.type === 'section_header') {
    return (
      <div style={{ paddingTop: 6 }}>
        <h3 style={{ margin: 0, fontSize: '1.08rem', fontWeight: 800, color: '#0F172A' }}>{block.label}</h3>
        {block.description && <p style={{ margin: '4px 0 0', fontSize: '0.82rem', color: '#64748B' }}>{block.description}</p>}
      </div>
    );
  }

  if (block.type === 'image_block') {
    return block.imageUrl ? (
      <div style={{ textAlign: 'center' }}>
        <img
          src={block.imageUrl}
          alt={block.label}
          style={{ width: block.imageWidth || '100%', maxHeight: 260, objectFit: 'cover', borderRadius: 14 }}
        />
      </div>
    ) : null;
  }

  if (block.type === 'banner_block') {
    return (
      <div
        style={{
          borderRadius: 16,
          padding: '1.15rem 1.25rem',
          background: block.bannerImageUrl
            ? `linear-gradient(rgba(15,23,42,0.55), rgba(15,23,42,0.55)), url(${block.bannerImageUrl}) center/cover`
            : `linear-gradient(135deg, ${primaryColor} 0%, #0284C7 100%)`,
          color: '#FFFFFF',
        }}
      >
        <div style={{ fontSize: '1rem', fontWeight: 800 }}>{block.label}</div>
        {block.description && <div style={{ fontSize: '0.8rem', opacity: 0.92, marginTop: 4 }}>{block.description}</div>}
      </div>
    );
  }

  const options = block.options || [];

  return (
    <div
      id={`pub-block-${block.id}`}
      style={{
        background: '#FFFFFF',
        border: errorMessage ? '1.5px solid #DC2626' : '1px solid #E2E8F0',
        borderRadius: 16,
        padding: '1.05rem 1.15rem',
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
      }}
    >
      <div>
        <label style={{ display: 'block', fontSize: '0.92rem', fontWeight: 700, color: '#0F172A' }}>
          {block.label} {block.required && <span style={{ color: '#DC2626' }}>*</span>}
        </label>
        {block.description && (
          <div style={{ fontSize: '0.78rem', color: '#64748B', marginTop: 3 }}>{block.description}</div>
        )}
      </div>

      {['short_text', 'email', 'phone', 'number', 'date'].includes(block.type) && (
        <input
          type={block.type === 'number' ? 'number' : block.type === 'date' ? 'date' : block.type === 'email' ? 'email' : 'text'}
          value={value !== undefined && value !== null ? String(value) : ''}
          onChange={(e) => onChange(block.type === 'number' && e.target.value !== '' ? Number(e.target.value) : e.target.value)}
          placeholder={block.placeholder || 'Nhập câu trả lời của bạn...'}
          style={{ width: '100%', height: 44, borderRadius: 12, border: '1px solid #CBD5E1', padding: '0 12px', fontSize: '0.86rem', background: '#FFFFFF' }}
        />
      )}

      {block.type === 'long_text' && (
        <textarea
          rows={3}
          value={value !== undefined && value !== null ? String(value) : ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder={block.placeholder || 'Chia sẻ chi tiết...'}
          style={{ width: '100%', borderRadius: 12, border: '1px solid #CBD5E1', padding: '10px 12px', fontSize: '0.86rem', background: '#FFFFFF' }}
        />
      )}

      {['single_choice', 'yes_no', 'quiz_scored', 'branch_jump'].includes(block.type) && (
        <div style={{ display: 'flex', flexDirection: block.type === 'yes_no' ? 'row' : 'column', gap: 8 }}>
          {options.map((opt) => {
            const active = String(value ?? '') === opt.value;
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => onChange(opt.value)}
                style={{
                  flex: block.type === 'yes_no' ? 1 : undefined,
                  minHeight: 44,
                  padding: '0.6rem 0.9rem',
                  borderRadius: 12,
                  border: active ? `2px solid ${primaryColor}` : '1px solid #CBD5E1',
                  background: active ? 'rgba(30, 64, 255, 0.06)' : '#F8F9FA',
                  color: active ? primaryColor : '#0F172A',
                  fontWeight: active ? 700 : 600,
                  fontSize: '0.85rem',
                  textAlign: block.type === 'yes_no' ? 'center' : 'left',
                  cursor: 'pointer',
                }}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      )}

      {block.type === 'multi_choice' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {options.map((opt) => {
            const currentArr = Array.isArray(value) ? (value as string[]) : [];
            const checked = currentArr.includes(opt.value);
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => onChange(checked ? currentArr.filter((x) => x !== opt.value) : [...currentArr, opt.value])}
                style={{
                  minHeight: 44,
                  padding: '0.6rem 0.9rem',
                  borderRadius: 12,
                  border: checked ? `2px solid ${primaryColor}` : '1px solid #CBD5E1',
                  background: checked ? 'rgba(30, 64, 255, 0.06)' : '#F8F9FA',
                  color: checked ? primaryColor : '#0F172A',
                  fontWeight: checked ? 700 : 600,
                  fontSize: '0.85rem',
                  textAlign: 'left',
                  cursor: 'pointer',
                }}
              >
                {checked ? '☑ ' : '☐ '} {opt.label}
              </button>
            );
          })}
        </div>
      )}

      {block.type === 'dropdown' && (
        <select
          value={String(value ?? '')}
          onChange={(e) => onChange(e.target.value)}
          style={{ width: '100%', height: 44, borderRadius: 12, border: '1px solid #CBD5E1', padding: '0 12px', fontSize: '0.86rem', background: '#FFFFFF' }}
        >
          <option value="">— Chọn một đáp án —</option>
          {options.map((opt) => (
            <option key={opt.id} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      )}

      {block.type === 'nps' && (
        <div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {Array.from({ length: 11 }).map((_, num) => {
              const active = value === num;
              return (
                <button
                  key={num}
                  type="button"
                  onClick={() => onChange(num)}
                  style={{
                    width: 42,
                    height: 42,
                    borderRadius: 10,
                    border: active ? `2px solid ${primaryColor}` : '1px solid #CBD5E1',
                    background: active ? primaryColor : '#FFFFFF',
                    color: active ? '#FFFFFF' : '#0F172A',
                    fontWeight: 800,
                    cursor: 'pointer',
                  }}
                >
                  {num}
                </button>
              );
            })}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.74rem', color: '#64748B', marginTop: 6 }}>
            <span>{block.minLabel || 'Rất không hài lòng'}</span>
            <span>{block.maxLabel || 'Chắc chắn giới thiệu'}</span>
          </div>
        </div>
      )}

      {block.type === 'csat_stars' && (
        <div style={{ display: 'flex', gap: 10 }}>
          {Array.from({ length: block.maxValue || 5 }).map((_, idx) => {
            const starVal = idx + 1;
            const filled = Number(value || 0) >= starVal;
            return (
              <button
                key={starVal}
                type="button"
                onClick={() => onChange(starVal)}
                style={{ border: 'none', background: 'transparent', cursor: 'pointer', padding: 2 }}
              >
                <Star size={30} color={filled ? '#F59E0B' : '#CBD5E1'} fill={filled ? '#F59E0B' : 'none'} />
              </button>
            );
          })}
        </div>
      )}

      {block.type === 'emoji_rating' && (
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          {(block.emojis || ['😠', '😕', '😐', '🙂', '🤩']).map((em, idx) => {
            const emVal = idx + 1;
            const selected = value === emVal;
            return (
              <button
                key={emVal}
                type="button"
                onClick={() => onChange(emVal)}
                style={{
                  width: 50,
                  height: 50,
                  borderRadius: 14,
                  border: selected ? `2px solid ${primaryColor}` : '1px solid #E2E8F0',
                  background: selected ? '#EEF2FF' : '#FFFFFF',
                  fontSize: '1.5rem',
                  cursor: 'pointer',
                }}
              >
                {em}
              </button>
            );
          })}
        </div>
      )}

      {block.type === 'slider' && (
        <div>
          <input
            type="range"
            min={block.minValue ?? 0}
            max={block.maxValue ?? 100}
            step={block.step ?? 1}
            value={typeof value === 'number' ? value : block.minValue ?? 0}
            onChange={(e) => onChange(Number(e.target.value))}
            style={{ width: '100%', accentColor: primaryColor }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', fontWeight: 700, color: '#475569' }}>
            <span>{block.minLabel ?? block.minValue ?? 0}</span>
            <span style={{ color: primaryColor }}>{value !== undefined ? String(value) : 'Kéo để chọn'}</span>
            <span>{block.maxLabel ?? block.maxValue ?? 100}</span>
          </div>
        </div>
      )}

      {block.type === 'ranking' && (() => {
        const defaultOrder = options.map((o) => o.value);
        const rankArr = Array.isArray(value) && value.length === defaultOrder.length ? (value as string[]) : defaultOrder;
        const swap = (i: number, j: number) => {
          const next = [...rankArr];
          const tmp = next[i];
          next[i] = next[j];
          next[j] = tmp;
          onChange(next);
        };
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {rankArr.map((valKey, idx) => {
              const opt = options.find((o) => o.value === valKey);
              return (
                <div key={valKey} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.55rem 0.75rem', borderRadius: 10, background: '#F8F9FA', border: '1px solid #E2E8F0' }}>
                  <span style={{ fontSize: '0.84rem', fontWeight: 600 }}>
                    <strong style={{ color: primaryColor }}>#{idx + 1}</strong> — {opt?.label || valKey}
                  </span>
                  <div style={{ display: 'inline-flex', gap: 4 }}>
                    <button type="button" disabled={idx === 0} onClick={() => swap(idx, idx - 1)} className="btn secondary sm" style={{ height: 28, padding: '0 6px' }}>
                      <ArrowUp size={12} />
                    </button>
                    <button type="button" disabled={idx === rankArr.length - 1} onClick={() => swap(idx, idx + 1)} className="btn secondary sm" style={{ height: 28, padding: '0 6px' }}>
                      <ArrowDown size={12} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        );
      })()}

      {(block.type === 'likert_matrix' || block.type === 'matrix_multi') && (() => {
        const currentMap = (value && typeof value === 'object' ? value : {}) as Record<string, string[]>;
        const rows = block.matrixRows || [];
        const cols = block.matrixCols || [];
        const toggleCell = (rowId: string, colId: string) => {
          const prevRow = currentMap[rowId] || [];
          const nextRow =
            block.type === 'likert_matrix'
              ? [colId]
              : prevRow.includes(colId)
                ? prevRow.filter((x) => x !== colId)
                : [...prevRow, colId];
          onChange({ ...currentMap, [rowId]: nextRow });
        };
        return (
          <div style={{ overflowX: 'auto', borderRadius: 12, border: '1px solid #E2E8F0' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
              <thead>
                <tr style={{ background: '#F8F9FA' }}>
                  <th style={{ padding: '8px 10px', textAlign: 'left' }}>Tiêu chí</th>
                  {cols.map((c) => (
                    <th key={c.id} style={{ padding: '8px 10px', textAlign: 'center' }}>{c.label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} style={{ borderTop: '1px solid #F1F5F9' }}>
                    <td style={{ padding: '8px 10px', fontWeight: 600 }}>{r.label}</td>
                    {cols.map((c) => {
                      const active = (currentMap[r.id] || []).includes(c.id);
                      return (
                        <td key={c.id} style={{ padding: '8px 10px', textAlign: 'center' }}>
                          <input
                            type={block.type === 'likert_matrix' ? 'radio' : 'checkbox'}
                            checked={active}
                            onChange={() => toggleCell(r.id, c.id)}
                            style={{ accentColor: primaryColor, width: 16, height: 16, cursor: 'pointer' }}
                          />
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      })()}

      {block.type === 'file_upload' && (
        <label style={{ padding: '1rem', borderRadius: 12, border: '1.5px dashed #93C5FD', background: '#F8FAFF', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, cursor: 'pointer', fontSize: '0.82rem', fontWeight: 700, color: primaryColor }}>
          <Upload size={16} />
          <span>{typeof value === 'string' && value ? `Đã chọn: ${value}` : 'Nhấn để chọn tệp đính kèm'}</span>
          <input
            type="file"
            style={{ display: 'none' }}
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (!f) return;
              const maxMb = block.maxFileSizeMB || 5;
              if (f.size > maxMb * 1024 * 1024) {
                toast.error(`Tệp vượt quá giới hạn ${maxMb}MB.`);
                return;
              }
              onChange(f.name);
            }}
          />
        </label>
      )}

      {errorMessage && (
        <div style={{ fontSize: '0.76rem', color: '#DC2626', fontWeight: 700 }}>{errorMessage}</div>
      )}
    </div>
  );
};
