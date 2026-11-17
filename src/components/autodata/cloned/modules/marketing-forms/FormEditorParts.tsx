import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  ArrowDown,
  ArrowUp,
  CheckCircle2,
  Eye,
  GripVertical,
  Trash2,
} from 'lucide-react';
import { Badge } from '../../components/ui/AutoDataLoadingModal';
import type {
  FormFieldItem,
  FormThankYouConfig,
  FormThemeConfig,
} from './types';

interface SortableFieldRowProps {
  field: FormFieldItem;
  index: number;
  total: number;
  onChange: (patch: Partial<FormFieldItem>) => void;
  onMove: (delta: -1 | 1) => void;
  onRemove: () => void;
}

export const SortableFieldRow: React.FC<SortableFieldRowProps> = ({
  field,
  index,
  total,
  onChange,
  onMove,
  onRemove,
}) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: field.id,
  });

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.65 : 1,
        background: '#FFFFFF',
        border: isDragging ? '1.5px solid #1E40FF' : '1px solid #E2E8F0',
        borderRadius: 14,
        padding: '0.75rem',
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <button
          type="button"
          {...attributes}
          {...listeners}
          title="Kéo thả để sắp xếp thứ tự"
          style={{
            width: 30,
            height: 32,
            borderRadius: 8,
            border: '1px solid #E2E8F0',
            background: '#F8F9FA',
            color: '#64748B',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'grab',
          }}
        >
          <GripVertical size={15} />
        </button>

        <Badge tone={field.type === 'phone' || field.type === 'email' ? 'primary' : 'neutral'}>
          #{index + 1} • {field.type}
        </Badge>

        <input
          className="form-input"
          style={{ flex: 1, minWidth: 150, height: 38, background: '#FFFFFF', border: '1px solid #E2E8F0' }}
          value={field.label}
          placeholder="Nhãn hiển thị..."
          onChange={(e) => onChange({ label: e.target.value })}
        />

        <input
          className="form-input"
          style={{ width: 120, height: 38, background: '#F8F9FA', border: '1px solid #E2E8F0', fontFamily: 'monospace', fontSize: '0.76rem' }}
          value={field.key}
          placeholder="field_key"
          onChange={(e) => onChange({ key: e.target.value.replace(/[^a-zA-Z0-9_]/g, '_').toLowerCase() })}
        />

        <label style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: '0.78rem', fontWeight: 700, color: '#334155', cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={Boolean(field.required)}
            onChange={(e) => onChange({ required: e.target.checked })}
          />
          Bắt buộc
        </label>

        <div style={{ display: 'inline-flex', gap: 4 }}>
          <button
            type="button"
            disabled={index === 0}
            onClick={() => onMove(-1)}
            className="btn secondary sm"
            style={{ height: 32, padding: '0 6px' }}
            title="Chuyển lên"
          >
            <ArrowUp size={13} />
          </button>
          <button
            type="button"
            disabled={index === total - 1}
            onClick={() => onMove(1)}
            className="btn secondary sm"
            style={{ height: 32, padding: '0 6px' }}
            title="Chuyển xuống"
          >
            <ArrowDown size={13} />
          </button>
          <button
            type="button"
            onClick={onRemove}
            className="btn secondary sm"
            style={{ height: 32, padding: '0 8px', color: '#DC2626' }}
            title="Xóa trường"
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: field.type === 'select' ? '1fr 1.3fr' : '1fr', gap: 8, paddingLeft: 38 }}>
        {field.type !== 'checkbox' && (
          <input
            className="form-input"
            style={{ height: 36, fontSize: '0.78rem', background: '#F8F9FA', border: '1px solid #E2E8F0' }}
            value={field.placeholder || ''}
            placeholder="Placeholder gợi ý (VD: 0909 123 456)..."
            onChange={(e) => onChange({ placeholder: e.target.value })}
          />
        )}
        {field.type === 'select' && (
          <input
            className="form-input"
            style={{ height: 36, fontSize: '0.78rem', background: '#FFFFFF', border: '1px solid #DBEAFE' }}
            value={(field.options || []).join(', ')}
            placeholder="Các lựa chọn cách nhau dấu phẩy (VD: Gói Cơ bản, Gói Growth, PROMAX)..."
            onChange={(e) =>
              onChange({
                options: e.target.value
                  .split(',')
                  .map((x) => x.trim())
                  .filter(Boolean),
              })
            }
          />
        )}
      </div>
    </div>
  );
};

interface FormLivePreviewProps {
  name: string;
  description: string;
  fields: FormFieldItem[];
  theme: FormThemeConfig;
  thankYou: FormThankYouConfig;
  requireOtp: boolean;
  otpChannel: 'email' | 'sms';
  previewThankYou: boolean;
  onToggleThankYou: () => void;
  previewValues: Record<string, string | boolean>;
  onChangePreviewValue: (fieldId: string, val: string | boolean) => void;
}

export const FormLivePreviewPanel: React.FC<FormLivePreviewProps> = ({
  name,
  description,
  fields,
  theme,
  thankYou,
  requireOtp,
  otpChannel,
  previewThankYou,
  onToggleThankYou,
  previewValues,
  onChangePreviewValue,
}) => (
  <div style={{ background: '#F8F9FA', border: '1px solid #E2E8F0', borderRadius: 18, padding: '1rem', display: 'flex', flexDirection: 'column', gap: 10 }}>
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#0F172A', display: 'inline-flex', alignItems: 'center', gap: 5 }}>
        <Eye size={14} color="#1E40FF" /> Xem Trước Tương Tác ({theme.layout.toUpperCase()})
      </span>
      <button
        type="button"
        onClick={onToggleThankYou}
        className="btn secondary sm"
        style={{ height: 30, fontSize: '0.72rem' }}
      >
        {previewThankYou ? 'Xem Form nhập' : 'Xem màn Cảm ơn'}
      </button>
    </div>

    <div
      style={{
        background: '#FFFFFF',
        border: theme.layout === 'minimal' ? '1px dashed #CBD5E1' : '1px solid #E2E8F0',
        borderRadius: theme.borderRadius,
        overflow: 'hidden',
        boxShadow: theme.layout === 'minimal' ? 'none' : '0 8px 24px rgba(15,23,42,0.06)',
        display: theme.layout === 'split' && !previewThankYou ? 'grid' : 'block',
        gridTemplateColumns: theme.layout === 'split' && !previewThankYou ? '120px 1fr' : undefined,
      }}
    >
      {theme.layout === 'split' && !previewThankYou && (
        <div style={{ background: `linear-gradient(160deg, ${theme.primaryColor} 0%, #0F172A 100%)`, color: '#FFFFFF', padding: '1rem 0.75rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <span style={{ fontSize: '0.66rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', opacity: 0.9 }}>
            DOMATION
          </span>
          <div style={{ fontSize: '0.75rem', fontWeight: 600, lineHeight: 1.4 }}>
            {theme.accentBadge || 'Tư vấn 1-1'}
          </div>
        </div>
      )}

      <div style={{ padding: '1.15rem' }}>
        {previewThankYou ? (
          <div style={{ textAlign: 'center', padding: '1.5rem 0.5rem' }}>
            <CheckCircle2 size={38} color={theme.primaryColor} style={{ margin: '0 auto 10px' }} />
            <div style={{ fontSize: '1rem', fontWeight: 800, color: '#0F172A' }}>{thankYou.title}</div>
            <p style={{ fontSize: '0.8rem', color: '#64748B', marginTop: 6 }}>{thankYou.message}</p>
          </div>
        ) : (
          <>
            <div style={{ fontSize: '0.98rem', fontWeight: 800, color: '#0F172A' }}>{name}</div>
            {description && <p style={{ fontSize: '0.76rem', color: '#64748B', margin: '4px 0 12px' }}>{description}</p>}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
              {fields.map((fld) => (
                <div key={fld.id}>
                  {fld.type === 'checkbox' ? (
                    <label style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: '0.78rem', fontWeight: 600, color: '#334155', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={Boolean(previewValues[fld.id])}
                        onChange={(e) => onChangePreviewValue(fld.id, e.target.checked)}
                      />
                      <span>
                        {fld.label} {fld.required && <span style={{ color: '#DC2626' }}>*</span>}
                      </span>
                    </label>
                  ) : (
                    <>
                      <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#334155', marginBottom: 4 }}>
                        {fld.label} {fld.required && <span style={{ color: '#DC2626' }}>*</span>}
                      </label>
                      {fld.type === 'select' ? (
                        <select
                          value={String(previewValues[fld.id] || '')}
                          onChange={(e) => onChangePreviewValue(fld.id, e.target.value)}
                          style={{ width: '100%', height: 40, borderRadius: Math.min(12, theme.borderRadius), border: '1px solid #E2E8F0', padding: '0 10px', fontSize: '0.8rem', background: '#FFFFFF' }}
                        >
                          <option value="">{fld.placeholder || '— Chọn —'}</option>
                          {(fld.options || []).map((opt) => (
                            <option key={opt} value={opt}>{opt}</option>
                          ))}
                        </select>
                      ) : fld.type === 'textarea' ? (
                        <textarea
                          rows={2}
                          value={String(previewValues[fld.id] || '')}
                          onChange={(e) => onChangePreviewValue(fld.id, e.target.value)}
                          placeholder={fld.placeholder || ''}
                          style={{ width: '100%', borderRadius: Math.min(12, theme.borderRadius), border: '1px solid #E2E8F0', padding: '8px 10px', fontSize: '0.8rem', background: '#FFFFFF' }}
                        />
                      ) : (
                        <input
                          type={fld.type === 'number' ? 'number' : fld.type === 'email' ? 'email' : 'text'}
                          value={String(previewValues[fld.id] || '')}
                          onChange={(e) => onChangePreviewValue(fld.id, e.target.value)}
                          placeholder={fld.placeholder || `Nhập ${fld.label.toLowerCase()}...`}
                          style={{ width: '100%', height: 40, borderRadius: Math.min(12, theme.borderRadius), border: '1px solid #E2E8F0', padding: '0 10px', fontSize: '0.8rem', background: '#FFFFFF' }}
                        />
                      )}
                    </>
                  )}
                </div>
              ))}
              {requireOtp && (
                <Badge tone="warning">Kèm bước xác thực OTP ({otpChannel.toUpperCase()})</Badge>
              )}
              <button
                type="button"
                onClick={onToggleThankYou}
                style={{
                  marginTop: 4,
                  height: 44,
                  width: '100%',
                  borderRadius: Math.min(14, theme.borderRadius),
                  border: 'none',
                  background: theme.primaryColor,
                  color: '#FFFFFF',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                {theme.buttonLabel}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  </div>
);
