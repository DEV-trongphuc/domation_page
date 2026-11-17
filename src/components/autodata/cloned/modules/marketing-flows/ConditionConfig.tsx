import React from 'react';
import { GitBranch, Layers } from 'lucide-react';
import { AdvancedConditionConfig } from './AdvancedConditionConfig';
import {
  CONDITION_FIELDS,
  CONDITION_OPERATORS,
  type ConditionRuleGroup,
} from './flowConstants';

export interface ConditionConfigProps {
  config: Record<string, unknown>;
  onChange: (nextConfig: Record<string, unknown>) => void;
}

export const ConditionConfig: React.FC<ConditionConfigProps> = ({ config, onChange }) => {
  const mode = String(config.condition_mode || (Array.isArray(config.groups) ? 'advanced' : 'simple')) as
    | 'simple'
    | 'advanced';

  const field = String(config.field || 'lead_score');
  const operator = String(config.operator || 'gte');
  const value = String(config.value ?? '30');
  const rootLogic = (config.root_logic === 'OR' ? 'OR' : 'AND') as 'AND' | 'OR';
  const groups = (Array.isArray(config.groups) ? config.groups : []) as ConditionRuleGroup[];

  const patchSimple = (patch: Record<string, unknown>) => {
    onChange({
      ...config,
      condition_mode: 'simple',
      groups: undefined,
      ...patch,
    });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
        <button
          type="button"
          onClick={() => patchSimple({})}
          style={{
            height: 36,
            borderRadius: 10,
            border: mode === 'simple' ? '1.5px solid #1E40FF' : '1px solid #E2E8F0',
            background: mode === 'simple' ? '#EEF2FF' : '#FFFFFF',
            color: mode === 'simple' ? '#1E40FF' : '#475569',
            fontWeight: 700,
            fontSize: '0.76rem',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 5,
            cursor: 'pointer',
          }}
        >
          <GitBranch size={13} /> Điều Kiện Đơn
        </button>

        <button
          type="button"
          onClick={() =>
            onChange({
              ...config,
              condition_mode: 'advanced',
              root_logic: rootLogic,
              groups:
                groups.length > 0
                  ? groups
                  : [
                      {
                        id: crypto.randomUUID(),
                        logic: 'AND',
                        rules: [{ id: crypto.randomUUID(), field, operator, value }],
                      },
                    ],
            })
          }
          style={{
            height: 36,
            borderRadius: 10,
            border: mode === 'advanced' ? '1.5px solid #1E40FF' : '1px solid #E2E8F0',
            background: mode === 'advanced' ? '#EEF2FF' : '#FFFFFF',
            color: mode === 'advanced' ? '#1E40FF' : '#475569',
            fontWeight: 700,
            fontSize: '0.76rem',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 5,
            cursor: 'pointer',
          }}
        >
          <Layers size={13} /> Đa Nhóm AND / OR
        </button>
      </div>

      {mode === 'simple' ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div>
            <label className="form-label" style={{ fontWeight: 700 }}>Trường dữ liệu / Hành vi kiểm tra</label>
            <select
              className="form-input"
              style={{ height: 42 }}
              value={field}
              onChange={(e) => patchSimple({ field: e.target.value })}
            >
              {CONDITION_FIELDS.map((f) => (
                <option key={f.value} value={f.value}>{f.label}</option>
              ))}
            </select>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <div>
              <label className="form-label" style={{ fontWeight: 700 }}>Toán tử</label>
              <select
                className="form-input"
                style={{ height: 42 }}
                value={operator}
                onChange={(e) => patchSimple({ operator: e.target.value })}
              >
                {CONDITION_OPERATORS.map((op) => (
                  <option key={op.value} value={op.value}>{op.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="form-label" style={{ fontWeight: 700 }}>Giá trị so sánh</label>
              <input
                className="form-input"
                style={{ height: 42 }}
                disabled={operator === 'is_set'}
                value={value}
                onChange={(e) => patchSimple({ value: e.target.value })}
              />
            </div>
          </div>
        </div>
      ) : (
        <AdvancedConditionConfig
          rootLogic={rootLogic}
          groups={groups}
          onChange={(nextLogic, nextGroups) => {
            const firstRule = nextGroups[0]?.rules[0];
            onChange({
              ...config,
              condition_mode: 'advanced',
              root_logic: nextLogic,
              groups: nextGroups,
              field: firstRule?.field || field,
              operator: firstRule?.operator || operator,
              value: firstRule?.value ?? value,
            });
          }}
        />
      )}
    </div>
  );
};

export default ConditionConfig;
