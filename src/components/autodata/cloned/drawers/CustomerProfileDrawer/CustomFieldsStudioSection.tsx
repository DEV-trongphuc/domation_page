import React from 'react';
import { Layers, Save } from 'lucide-react';
import type { CrmCustomFieldDef, CrmDynamicEntityTab } from '../crmTypes';

export interface DynamicEntityTabFieldsPanelProps {
  tab: CrmDynamicEntityTab;
  canEdit: boolean;
  saving: boolean;
  customValues: Record<string, unknown>;
  onChangeCustomValue: (key: string, val: unknown) => void;
  onSave: () => void;
  inputStyle: React.CSSProperties;
}

export const DynamicEntityTabFieldsPanel: React.FC<DynamicEntityTabFieldsPanelProps> = ({
  tab,
  canEdit,
  saving,
  customValues,
  onChangeCustomValue,
  onSave,
  inputStyle,
}) => (
  <div
    style={{
      background: '#FFFFFF',
      border: '1px solid #E2E8F0',
      borderRadius: 16,
      padding: '1.35rem',
      display: 'flex',
      flexDirection: 'column',
      gap: '1rem',
    }}
  >
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <Layers size={18} color="#1E40FF" />
        <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800, color: '#0F172A' }}>
          Tab mở rộng động: {tab.tab_label}
        </h3>
      </div>
      {canEdit && (
        <button
          type="button"
          onClick={onSave}
          disabled={saving}
          style={{
            height: 44,
            padding: '0 1.15rem',
            borderRadius: 10,
            border: 'none',
            background: '#1E40FF',
            color: '#FFFFFF',
            fontWeight: 700,
            fontSize: '0.82rem',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            cursor: 'pointer',
          }}
        >
          <Save size={15} /> {saving ? 'Đang lưu...' : 'Lưu trường động'}
        </button>
      )}
    </div>

    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 14 }}>
      {tab.fields_json.map((fld) => (
        <label key={fld.key} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#334155' }}>{fld.label}</span>
          <input
            type={
              fld.type === 'number' || fld.type === 'currency'
                ? 'number'
                : fld.type === 'date'
                  ? 'date'
                  : 'text'
            }
            disabled={!canEdit}
            value={String(customValues[fld.key] ?? '')}
            onChange={(e) =>
              onChangeCustomValue(
                fld.key,
                fld.type === 'number' || fld.type === 'currency'
                  ? Number(e.target.value || 0)
                  : e.target.value
              )
            }
            style={inputStyle}
          />
        </label>
      ))}
    </div>
  </div>
);

export interface CustomFieldsStudioSectionProps {
  customFieldDefs: CrmCustomFieldDef[];
  canEdit: boolean;
  customValues: Record<string, unknown>;
  onChangeCustomValue: (key: string, val: unknown) => void;
  inputStyle: React.CSSProperties;
}

export const CustomFieldsStudioSection: React.FC<CustomFieldsStudioSectionProps> = ({
  customFieldDefs,
  canEdit,
  customValues,
  onChangeCustomValue,
  inputStyle,
}) => {
  if (customFieldDefs.length === 0) return null;
  return (
    <div
      style={{
        background: '#FFFFFF',
        border: '1px solid #E2E8F0',
        borderRadius: 16,
        padding: '1.35rem',
        display: 'flex',
        flexDirection: 'column',
        gap: 14,
      }}
    >
      <h4 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 800, color: '#0F172A' }}>
        Trường dữ liệu tùy chỉnh (Custom Fields Studio)
      </h4>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
        {customFieldDefs.map((cf) => (
          <label key={cf.id} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#334155' }}>
              {cf.field_label} {cf.is_required ? '*' : ''}
            </span>
            <input
              disabled={!canEdit}
              value={String(customValues[cf.field_key] ?? '')}
              onChange={(e) => onChangeCustomValue(cf.field_key, e.target.value)}
              style={inputStyle}
            />
          </label>
        ))}
      </div>
    </div>
  );
};
