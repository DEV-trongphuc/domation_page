import React from 'react';
import { GitMerge, Plus, Trash2 } from 'lucide-react';
import { Badge } from '../../components/ui/AutoDataLoadingModal';
import {
  CONDITION_FIELDS,
  CONDITION_OPERATORS,
  type ConditionRuleGroup,
  type ConditionRuleItem,
} from './flowConstants';

export interface AdvancedConditionConfigProps {
  rootLogic: 'AND' | 'OR';
  groups: ConditionRuleGroup[];
  onChange: (nextRootLogic: 'AND' | 'OR', nextGroups: ConditionRuleGroup[]) => void;
}

export const AdvancedConditionConfig: React.FC<AdvancedConditionConfigProps> = ({
  rootLogic,
  groups,
  onChange,
}) => {
  const safeGroups: ConditionRuleGroup[] =
    groups.length > 0
      ? groups
      : [
          {
            id: 'grp_default',
            logic: 'AND',
            rules: [{ id: 'rule_default', field: 'lead_score', operator: 'gte', value: '30' }],
          },
        ];

  const handleAddGroup = () => {
    const nextGroup: ConditionRuleGroup = {
      id: crypto.randomUUID(),
      logic: 'AND',
      rules: [{ id: crypto.randomUUID(), field: 'email_consent', operator: 'eq', value: 'subscribed' }],
    };
    onChange(rootLogic, [...safeGroups, nextGroup]);
  };

  const handleRemoveGroup = (groupId: string) => {
    const filtered = safeGroups.filter((g) => g.id !== groupId);
    onChange(rootLogic, filtered);
  };

  const handleGroupLogic = (groupId: string, logic: 'AND' | 'OR') => {
    onChange(
      rootLogic,
      safeGroups.map((g) => (g.id === groupId ? { ...g, logic } : g))
    );
  };

  const handleAddRule = (groupId: string) => {
    onChange(
      rootLogic,
      safeGroups.map((g) =>
        g.id === groupId
          ? {
              ...g,
              rules: [
                ...g.rules,
                { id: crypto.randomUUID(), field: 'tags', operator: 'contains', value: 'VIP' },
              ],
            }
          : g
      )
    );
  };

  const handlePatchRule = (groupId: string, ruleId: string, patch: Partial<ConditionRuleItem>) => {
    onChange(
      rootLogic,
      safeGroups.map((g) =>
        g.id === groupId
          ? {
              ...g,
              rules: g.rules.map((r) => (r.id === ruleId ? { ...r, ...patch } : r)),
            }
          : g
      )
    );
  };

  const handleRemoveRule = (groupId: string, ruleId: string) => {
    onChange(
      rootLogic,
      safeGroups.map((g) =>
        g.id === groupId ? { ...g, rules: g.rules.filter((r) => r.id !== ruleId) } : g
      )
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div
        style={{
          padding: '0.65rem 0.85rem',
          borderRadius: 12,
          background: '#F8FAFF',
          border: '1px solid #DBEAFE',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 8,
        }}
      >
        <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#1E40FF', display: 'inline-flex', alignItems: 'center', gap: 5 }}>
          <GitMerge size={14} /> Kết hợp giữa các Nhóm:
        </span>
        <div style={{ display: 'flex', gap: 4 }}>
          {(['AND', 'OR'] as const).map((lg) => (
            <button
              key={lg}
              type="button"
              onClick={() => onChange(lg, safeGroups)}
              style={{
                padding: '3px 10px',
                borderRadius: 8,
                border: rootLogic === lg ? '1px solid #1E40FF' : '1px solid #CBD5E1',
                background: rootLogic === lg ? '#1E40FF' : '#FFFFFF',
                color: rootLogic === lg ? '#FFFFFF' : '#475569',
                fontSize: '0.72rem',
                fontWeight: 800,
                cursor: 'pointer',
              }}
            >
              {lg}
            </button>
          ))}
        </div>
      </div>

      {safeGroups.map((grp, gIdx) => (
        <div
          key={grp.id}
          style={{
            padding: '0.75rem',
            borderRadius: 12,
            background: '#F8F9FA',
            border: '1px solid #E2E8F0',
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Badge tone="purple">Nhóm #{gIdx + 1}</Badge>
              <select
                className="form-input"
                style={{ height: 28, padding: '0 8px', fontSize: '0.72rem', width: 92, background: '#FFFFFF' }}
                value={grp.logic}
                onChange={(e) => handleGroupLogic(grp.id, e.target.value as 'AND' | 'OR')}
              >
                <option value="AND">Thỏa TẤT CẢ (AND)</option>
                <option value="OR">Thỏa BẤT KỲ (OR)</option>
              </select>
            </div>
            {safeGroups.length > 1 && (
              <button
                type="button"
                onClick={() => handleRemoveGroup(grp.id)}
                style={{ border: 'none', background: 'transparent', color: '#DC2626', cursor: 'pointer' }}
              >
                <Trash2 size={13} />
              </button>
            )}
          </div>

          {grp.rules.map((rule) => (
            <div key={rule.id} style={{ display: 'flex', flexDirection: 'column', gap: 5, padding: '6px', borderRadius: 8, background: '#FFFFFF', border: '1px solid #E2E8F0' }}>
              <div style={{ display: 'flex', gap: 5 }}>
                <select
                  className="form-input"
                  style={{ height: 34, fontSize: '0.74rem' }}
                  value={rule.field}
                  onChange={(e) => handlePatchRule(grp.id, rule.id, { field: e.target.value })}
                >
                  {CONDITION_FIELDS.map((f) => (
                    <option key={f.value} value={f.value}>{f.label}</option>
                  ))}
                </select>
                {grp.rules.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveRule(grp.id, rule.id)}
                    style={{ border: 'none', background: 'transparent', color: '#DC2626', cursor: 'pointer' }}
                  >
                    <Trash2 size={13} />
                  </button>
                )}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 5 }}>
                <select
                  className="form-input"
                  style={{ height: 34, fontSize: '0.74rem' }}
                  value={rule.operator}
                  onChange={(e) => handlePatchRule(grp.id, rule.id, { operator: e.target.value })}
                >
                  {CONDITION_OPERATORS.map((op) => (
                    <option key={op.value} value={op.value}>{op.label}</option>
                  ))}
                </select>
                {rule.operator !== 'is_set' && (
                  <input
                    className="form-input"
                    style={{ height: 34, fontSize: '0.74rem' }}
                    placeholder="Giá trị..."
                    value={rule.value}
                    onChange={(e) => handlePatchRule(grp.id, rule.id, { value: e.target.value })}
                  />
                )}
              </div>
            </div>
          ))}

          <button
            type="button"
            onClick={() => handleAddRule(grp.id)}
            className="btn secondary sm"
            style={{ height: 30, fontSize: '0.72rem', color: '#1E40FF', display: 'inline-flex', alignItems: 'center', gap: 4 }}
          >
            <Plus size={12} /> Thêm điều kiện con
          </button>
        </div>
      ))}

      <button
        type="button"
        onClick={handleAddGroup}
        className="btn secondary sm"
        style={{ height: 36, color: '#1E40FF', fontWeight: 700, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}
      >
        <Plus size={14} /> Thêm Nhóm Điều Kiện ({rootLogic})
      </button>
    </div>
  );
};

export default AdvancedConditionConfig;
