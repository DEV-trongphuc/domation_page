import React, { useMemo, useState } from 'react';
import { Braces, CheckCircle2, Plus, Sparkles, Wand2 } from 'lucide-react';
import { Badge, Card } from '../../components/ui/AutoDataLoadingModal';
import {
  STANDARD_MERGE_TAGS,
  extractMergeVariables,
} from './campaignTypes';

export interface VariableFallbackConfigProps {
  subjectA: string;
  subjectB: string;
  templateHtml: string;
  fallbacks: Record<string, string>;
  onChange: (nextFallbacks: Record<string, string>) => void;
}

export const VariableFallbackConfig: React.FC<VariableFallbackConfigProps> = ({
  subjectA,
  subjectB,
  templateHtml,
  fallbacks,
  onChange,
}) => {
  const [customKey, setCustomKey] = useState('');

  const detectedKeys = useMemo(() => {
    const raw = extractMergeVariables(subjectA, subjectB, templateHtml);
    const merged = new Set<string>(['lead.name', ...raw, ...Object.keys(fallbacks)]);
    return Array.from(merged);
  }, [subjectA, subjectB, templateHtml, fallbacks]);

  const configuredCount = useMemo(
    () => detectedKeys.filter((k) => Boolean(fallbacks[k]?.trim())).length,
    [detectedKeys, fallbacks]
  );

  const handleSetFallback = (key: string, val: string) => {
    onChange({
      ...fallbacks,
      [key]: val,
    });
  };

  const handleAutoFillDefaults = () => {
    const next = { ...fallbacks };
    for (const k of detectedKeys) {
      if (!next[k]?.trim()) {
        const meta = STANDARD_MERGE_TAGS.find((m) => m.key === k);
        next[k] = meta?.suggestedFallback || 'Quý khách';
      }
    }
    onChange(next);
  };

  const handleAddCustomKey = () => {
    const cleaned = customKey.replace(/[{}]/g, '').trim();
    if (!cleaned) return;
    if (!(cleaned in fallbacks)) {
      onChange({ ...fallbacks, [cleaned]: 'Quý khách' });
    }
    setCustomKey('');
  };

  return (
    <Card
      title={
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7 }}>
          <Braces size={16} color="#1E40FF" /> Giá Trị Dự Phòng Biến Cá Nhân Hóa (`fallback_vars`)
        </span>
      }
      subtitle="Tự động thay thế khi hồ sơ khách hàng chưa có trường dữ liệu tương ứng (VD: {{lead.name}} -> Quý khách)"
      actions={
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Badge tone={configuredCount === detectedKeys.length ? 'success' : 'warning'}>
            Đã phủ {configuredCount}/{detectedKeys.length} biến
          </Badge>
          <button
            type="button"
            onClick={handleAutoFillDefaults}
            className="btn secondary sm"
            style={{ height: 34, color: '#1E40FF', display: 'inline-flex', alignItems: 'center', gap: 5, fontWeight: 700 }}
          >
            <Wand2 size={13} /> Điền gợi ý chuẩn
          </button>
        </div>
      }
      padding="1rem 1.15rem"
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 10 }}>
          {detectedKeys.map((key) => {
            const meta = STANDARD_MERGE_TAGS.find((m) => m.key === key);
            const val = fallbacks[key] ?? '';
            return (
              <div
                key={key}
                style={{
                  padding: '0.7rem 0.85rem',
                  borderRadius: 12,
                  background: '#F8F9FA',
                  border: '1px solid #E2E8F0',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 6,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6 }}>
                  <code
                    style={{
                      fontSize: '0.76rem',
                      fontWeight: 800,
                      color: '#1E40FF',
                      background: '#EEF2FF',
                      padding: '2px 7px',
                      borderRadius: 6,
                    }}
                  >
                    {`{{${key}}}`}
                  </code>
                  {val.trim() ? (
                    <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#059669', display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                      <CheckCircle2 size={12} /> Có fallback
                    </span>
                  ) : (
                    <span style={{ fontSize: '0.7rem', fontWeight: 600, color: '#D97706' }}>Chưa đặt</span>
                  )}
                </div>
                <div style={{ fontSize: '0.72rem', color: '#64748B' }}>
                  {meta?.label || 'Biến dữ liệu tùy chỉnh CRM'}
                </div>
                <input
                  className="form-input"
                  style={{ height: 38, background: '#FFFFFF' }}
                  placeholder={meta?.suggestedFallback ? `VD: ${meta.suggestedFallback}` : 'Nhập giá trị dự phòng...'}
                  value={val}
                  onChange={(e) => handleSetFallback(key, e.target.value)}
                />
              </div>
            );
          })}
        </div>

        {/* Add Custom Variable */}
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', paddingTop: 4 }}>
          <input
            className="form-input"
            style={{ height: 38, maxWidth: 280 }}
            placeholder="Thêm biến khác (VD: lead.city)..."
            value={customKey}
            onChange={(e) => setCustomKey(e.target.value)}
          />
          <button
            type="button"
            onClick={handleAddCustomKey}
            className="btn secondary sm"
            style={{ height: 38, display: 'inline-flex', alignItems: 'center', gap: 4 }}
          >
            <Plus size={14} /> Thêm biến
          </button>
          <span style={{ fontSize: '0.74rem', color: '#64748B', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
            <Sparkles size={13} color="#1E40FF" /> Tránh lỗi trống tên khi gửi hàng loạt
          </span>
        </div>
      </div>
    </Card>
  );
};

export default VariableFallbackConfig;
