import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Eye,
  GitBranch,
  Layers,
  Plus,
  RefreshCw,
  Sparkles,
  Trash2,
  Zap,
} from 'lucide-react';
import { CustomModal } from '../../components/ui/CustomModal';
import { ToggleSwitch } from '../../components/ui/ToggleSwitch';
import { Badge, Card } from '../../components/ui/AutoDataLoadingModal';
import { apiRequest } from '../../../autodataApi';
import { useAuth } from '../../contexts/AuthContext';
import { useEntitlement } from '../../contexts/EntitlementContext';
import { maskPiiEmail, maskPiiPhone } from '../../contexts/entitlementConstants';
import {
  FILTER_OPERATOR_OPTIONS,
  LAYER_LABELS,
  evaluateContactLocally,
  type AudienceFieldDefinition,
  type AudienceItem,
  type FilterBranch,
  type FilterCondition,
  type FilterOperator,
  type MasterContactRow,
} from './audienceTypes';

interface SegmentRuleBuilderModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialAudience?: AudienceItem | null;
  fieldCatalog: AudienceFieldDefinition[];
  fallbackContacts: MasterContactRow[];
  onSaved: (saved: AudienceItem) => void;
}

function makeCondId(): string {
  return `cond_${Math.random().toString(36).slice(2, 9)}`;
}

function makeBranchId(): string {
  return `branch_${Math.random().toString(36).slice(2, 9)}`;
}

function createDefaultBranch(): FilterBranch {
  return {
    id: makeBranchId(),
    name: 'Nhóm điều kiện 1',
    logic: 'AND',
    conditions: [
      {
        id: makeCondId(),
        layer: 'profile',
        field: 'lead_score',
        operator: 'gte',
        value: '50',
      },
    ],
  };
}

export const SegmentRuleBuilderModal: React.FC<SegmentRuleBuilderModalProps> = ({
  isOpen,
  onClose,
  initialAudience,
  fieldCatalog,
  fallbackContacts,
  onSaved,
}) => {
  const { token, tenantSlug, bootstrapData } = useAuth();
  const { hasModule, can, switchPackage, terminology } = useEntitlement();

  const canUnmask = can('audiences', 'unmask_phone');
  const canRouteToSale = hasModule('rounds');
  const rounds = useMemo(() => bootstrapData?.rounds || [], [bootstrapData?.rounds]);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [branches, setBranches] = useState<FilterBranch[]>([createDefaultBranch()]);
  const [autoPushToSaleRound, setAutoPushToSaleRound] = useState(false);
  const [targetRoundId, setTargetRoundId] = useState('');
  const [colorHex, setColorHex] = useState('#1E40FF');
  const [saving, setSaving] = useState(false);

  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewCount, setPreviewCount] = useState<number>(0);
  const [previewSample, setPreviewSample] = useState<MasterContactRow[]>([]);

  useEffect(() => {
    if (!isOpen) return;
    const syncState = () => {
      if (initialAudience) {
        setName(initialAudience.name);
        setDescription(initialAudience.description || '');
        setBranches(
          initialAudience.filter_branches && initialAudience.filter_branches.length > 0
            ? initialAudience.filter_branches
            : [createDefaultBranch()]
        );
        setAutoPushToSaleRound(Boolean(initialAudience.auto_push_to_sale_round));
        setTargetRoundId(initialAudience.target_round_id || rounds[0]?.id || '');
        setColorHex(initialAudience.color_hex || '#1E40FF');
      } else {
        setName('');
        setDescription('');
        setBranches([createDefaultBranch()]);
        setAutoPushToSaleRound(false);
        setTargetRoundId(rounds[0]?.id || '');
        setColorHex('#1E40FF');
      }
    };
    syncState();
  }, [isOpen, initialAudience, rounds]);

  const runLivePreview = useCallback(async () => {
    setPreviewLoading(true);
    try {
      const res = await apiRequest<{
        count?: number;
        items?: MasterContactRow[];
        sample_members?: MasterContactRow[];
      }>('/audiences/preview', {
        method: 'POST',
        token,
        tenantSlug,
        body: { filter_branches: branches },
      });
      const sample = res.items || res.sample_members || [];
      setPreviewCount(typeof res.count === 'number' ? res.count : sample.length);
      setPreviewSample(sample.slice(0, 6));
    } catch {
      const matched = fallbackContacts.filter((c) => evaluateContactLocally(c, branches));
      setPreviewCount(matched.length);
      setPreviewSample(matched.slice(0, 6));
    } finally {
      setPreviewLoading(false);
    }
  }, [branches, fallbackContacts, tenantSlug, token]);

  useEffect(() => {
    if (!isOpen) return;
    const timer = setTimeout(() => {
      void runLivePreview();
    }, 320);
    return () => clearTimeout(timer);
  }, [isOpen, runLivePreview]);

  const handleAddBranch = () => {
    setBranches((prev) => [
      ...prev,
      {
        id: makeBranchId(),
        name: `Nhánh HOẶC ${prev.length + 1}`,
        logic: 'AND',
        conditions: [
          {
            id: makeCondId(),
            layer: 'profile',
            field: fieldCatalog[0]?.key || 'source',
            operator: 'contains',
            value: '',
          },
        ],
      },
    ]);
  };

  const handleRemoveBranch = (branchId: string) => {
    setBranches((prev) => (prev.length <= 1 ? prev : prev.filter((b) => b.id !== branchId)));
  };

  const handleAddCondition = (branchId: string) => {
    setBranches((prev) =>
      prev.map((b) =>
        b.id === branchId
          ? {
              ...b,
              conditions: [
                ...b.conditions,
                {
                  id: makeCondId(),
                  layer: 'profile',
                  field: fieldCatalog[0]?.key || 'name',
                  operator: 'contains',
                  value: '',
                },
              ],
            }
          : b
      )
    );
  };

  const handleUpdateCondition = (
    branchId: string,
    condId: string,
    patch: Partial<FilterCondition>
  ) => {
    setBranches((prev) =>
      prev.map((b) => {
        if (b.id !== branchId) return b;
        return {
          ...b,
          conditions: b.conditions.map((c) => {
            if (c.id !== condId) return c;
            const nextField = patch.field ?? c.field;
            const fieldDef = fieldCatalog.find((f) => f.key === nextField);
            return {
              ...c,
              ...patch,
              layer: fieldDef?.layer || c.layer,
            };
          }),
        };
      })
    );
  };

  const handleRemoveCondition = (branchId: string, condId: string) => {
    setBranches((prev) =>
      prev.map((b) => {
        if (b.id !== branchId) return b;
        if (b.conditions.length <= 1) return b;
        return { ...b, conditions: b.conditions.filter((c) => c.id !== condId) };
      })
    );
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    const payload = {
      name: name.trim(),
      description: description.trim(),
      audience_type: 'dynamic_logic' as const,
      filter_branches: branches,
      auto_push_to_sale_round: canRouteToSale ? autoPushToSaleRound : false,
      target_round_id: canRouteToSale && autoPushToSaleRound ? targetRoundId || null : null,
      color_hex: colorHex,
    };

    try {
      let saved: AudienceItem;
      if (initialAudience?.id) {
        saved = await apiRequest<AudienceItem>(`/audiences/${initialAudience.id}`, {
          method: 'PUT',
          token,
          tenantSlug,
          body: payload,
        });
      } else {
        saved = await apiRequest<AudienceItem>('/audiences', {
          method: 'POST',
          token,
          tenantSlug,
          body: payload,
        });
      }
      onSaved({
        ...saved,
        cached_member_count: saved.cached_member_count ?? previewCount,
      });
      onClose();
    } catch {
      const localSaved: AudienceItem = {
        id: initialAudience?.id || `aud_logic_${Date.now()}`,
        name: payload.name,
        description: payload.description,
        audience_type: 'dynamic_logic',
        filter_branches: branches,
        cached_member_count: previewCount,
        auto_push_to_sale_round: payload.auto_push_to_sale_round,
        target_round_id: payload.target_round_id,
        target_round_name: rounds.find((r) => r.id === payload.target_round_id)?.name || null,
        color_hex: colorHex,
        updated_at: new Date().toISOString(),
      };
      onSaved(localSaved);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  const fieldsByLayer = useMemo(() => {
    const groups: Record<'profile' | 'crm' | 'marketing' | 'revenue', AudienceFieldDefinition[]> = {
      profile: [],
      crm: [],
      marketing: [],
      revenue: [],
    };
    for (const f of fieldCatalog) {
      groups[f.layer].push(f);
    }
    return groups;
  }, [fieldCatalog]);

  return (
    <CustomModal
      isOpen={isOpen}
      onClose={onClose}
      title={
        initialAudience
          ? `Chỉnh sửa Tệp Logic: ${initialAudience.name}`
          : 'Thiết lập Tệp Logic Động (Real-Time AND / OR Segment Builder)'
      }
      width="980px"
    >
      <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
        {/* Basic Meta */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '2fr 2fr 120px',
            gap: '0.85rem',
          }}
        >
          <div className="form-group">
            <label className="form-label">Tên Tệp Logic *</label>
            <input
              type="text"
              required
              className="form-input"
              placeholder={`Ví dụ: ${terminology.customerLabel} nóng điểm >= 60 chưa chia Sale`}
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Mô tả mục đích kịch bản</label>
            <input
              type="text"
              className="form-input"
              placeholder="Tự động cập nhật thành viên ngay khi phát sinh hành vi mới"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Màu nhận diện</label>
            <input
              type="color"
              className="form-input"
              style={{ padding: 4, cursor: 'pointer' }}
              value={colorHex}
              onChange={(e) => setColorHex(e.target.value)}
            />
          </div>
        </div>

        {/* Visual OR-of-AND Rule Tree */}
        <div
          style={{
            background: '#F8F9FA',
            border: '1px solid #E2E8F0',
            borderRadius: 18,
            padding: '1rem 1.15rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.9rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Layers size={18} color="#1E40FF" />
              <span style={{ fontSize: '0.88rem', fontWeight: 700, color: '#0F172A' }}>
                Cây Điều Kiện 4 Tầng Dữ Liệu (0% Hardcode — Tự động biên dịch SQL an toàn)
              </span>
            </div>
            <button
              type="button"
              onClick={handleAddBranch}
              className="btn secondary sm"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6, height: 34, fontSize: '0.78rem' }}
            >
              <Plus size={14} /> Thêm nhánh HOẶC (OR)
            </button>
          </div>

          {branches.map((branch, bIdx) => (
            <React.Fragment key={branch.id}>
              {bIdx > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ flex: 1, height: 1, background: '#CBD5E1' }} />
                  <Badge tone="warning">HOẶC (OR)</Badge>
                  <div style={{ flex: 1, height: 1, background: '#CBD5E1' }} />
                </div>
              )}

              <div
                style={{
                  background: '#FFFFFF',
                  border: '1px solid #E2E8F0',
                  borderRadius: 16,
                  padding: '0.95rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.65rem',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Badge tone="primary">Nhóm #{bIdx + 1} • Khớp TẤT CẢ điều kiện VÀ (AND)</Badge>
                  </div>
                  {branches.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveBranch(branch.id)}
                      style={{
                        border: 'none',
                        background: 'rgba(220,38,38,0.08)',
                        color: '#DC2626',
                        borderRadius: 8,
                        padding: '4px 8px',
                        fontSize: '0.74rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      Xóa nhánh
                    </button>
                  )}
                </div>

                {branch.conditions.map((cond, cIdx) => {
                  const fieldDef = fieldCatalog.find((f) => f.key === cond.field) || fieldCatalog[0];
                  const valType = fieldDef?.valueType || 'text';
                  const allowedOps = FILTER_OPERATOR_OPTIONS.filter((op) =>
                    op.types.includes(valType)
                  );
                  const hideValueInput =
                    cond.operator === 'is_empty' || cond.operator === 'is_not_empty';
                  const layerInfo = LAYER_LABELS[fieldDef?.layer || 'profile'];

                  return (
                    <div
                      key={cond.id}
                      style={{
                        display: 'grid',
                        gridTemplateColumns: hideValueInput
                          ? '64px 1.6fr 1.2fr 38px'
                          : '64px 1.4fr 1fr 1.2fr 38px',
                        gap: '0.55rem',
                        alignItems: 'center',
                      }}
                    >
                      <span
                        style={{
                          fontSize: '0.72rem',
                          fontWeight: 800,
                          color: cIdx === 0 ? '#1E40FF' : '#64748B',
                          textAlign: 'center',
                          background: '#F8FAFF',
                          padding: '6px 4px',
                          borderRadius: 8,
                          border: '1px solid #E2E8F0',
                        }}
                      >
                        {cIdx === 0 ? 'NẾU' : 'VÀ'}
                      </span>

                      <select
                        className="form-input"
                        style={{ height: 38, fontSize: '0.8rem' }}
                        value={cond.field}
                        onChange={(e) =>
                          handleUpdateCondition(branch.id, cond.id, {
                            field: e.target.value,
                            operator: 'equals',
                            value: '',
                          })
                        }
                        title={layerInfo.label}
                      >
                        {(['profile', 'crm', 'marketing', 'revenue'] as const).map((lk) => (
                          <optgroup key={lk} label={LAYER_LABELS[lk].label}>
                            {fieldsByLayer[lk].map((f) => (
                              <option key={f.key} value={f.key}>
                                {f.label}
                              </option>
                            ))}
                          </optgroup>
                        ))}
                      </select>

                      <select
                        className="form-input"
                        style={{ height: 38, fontSize: '0.8rem' }}
                        value={cond.operator}
                        onChange={(e) =>
                          handleUpdateCondition(branch.id, cond.id, {
                            operator: e.target.value as FilterOperator,
                          })
                        }
                      >
                        {allowedOps.map((op) => (
                          <option key={op.value} value={op.value}>
                            {op.label}
                          </option>
                        ))}
                      </select>

                      {!hideValueInput &&
                        (fieldDef?.options && fieldDef.options.length > 0 && cond.operator !== 'in' ? (
                          <select
                            className="form-input"
                            style={{ height: 38, fontSize: '0.8rem' }}
                            value={cond.value}
                            onChange={(e) =>
                              handleUpdateCondition(branch.id, cond.id, { value: e.target.value })
                            }
                          >
                            <option value="">— Chọn giá trị —</option>
                            {fieldDef.options.map((opt) => (
                              <option key={opt.value} value={opt.value}>
                                {opt.label}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <input
                            type={valType === 'number' ? 'number' : 'text'}
                            className="form-input"
                            style={{ height: 38, fontSize: '0.8rem' }}
                            placeholder="Nhập giá trị so sánh..."
                            value={cond.value}
                            onChange={(e) =>
                              handleUpdateCondition(branch.id, cond.id, { value: e.target.value })
                            }
                          />
                        ))}

                      <button
                        type="button"
                        onClick={() => handleRemoveCondition(branch.id, cond.id)}
                        disabled={branch.conditions.length <= 1}
                        style={{
                          height: 36,
                          width: 36,
                          borderRadius: 10,
                          border: '1px solid #E2E8F0',
                          background: '#FFFFFF',
                          color: branch.conditions.length <= 1 ? '#CBD5E1' : '#DC2626',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: branch.conditions.length <= 1 ? 'not-allowed' : 'pointer',
                        }}
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  );
                })}

                <div>
                  <button
                    type="button"
                    onClick={() => handleAddCondition(branch.id)}
                    style={{
                      border: 'none',
                      background: 'transparent',
                      color: '#1E40FF',
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 5,
                      cursor: 'pointer',
                      padding: '2px 0',
                    }}
                  >
                    <Plus size={14} /> Thêm điều kiện VÀ (AND)
                  </button>
                </div>
              </div>
            </React.Fragment>
          ))}
        </div>

        {/* Auto Push to Sale Round Bridge */}
        <Card
          padding="1rem 1.2rem"
          style={{
            background: autoPushToSaleRound ? '#F8FAFF' : '#FFFFFF',
            borderColor: autoPushToSaleRound ? '#93C5FD' : '#E2E8F0',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 12,
                  background: 'rgba(16, 185, 129, 0.12)',
                  color: '#059669',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <GitBranch size={18} />
              </div>
              <div>
                <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#0F172A', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span>Tự động đẩy vào Vòng chia Sale (Auto Data Fair-Share)</span>
                  <Badge tone="success">Zero-Delay Bridge</Badge>
                </div>
                <div style={{ fontSize: '0.76rem', color: '#64748B', marginTop: 2 }}>
                  Khi hồ sơ từ trạng thái <code>marketing_nurture</code> thỏa mãn Tệp Logic này, hệ thống tự động chuyển sang <code>unassigned_pending</code> để chia cho {terminology.consultantLabel}.
                </div>
              </div>
            </div>

            {canRouteToSale ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                {autoPushToSaleRound && (
                  <select
                    className="form-input"
                    style={{ height: 38, minWidth: 210, fontSize: '0.8rem' }}
                    value={targetRoundId}
                    onChange={(e) => setTargetRoundId(e.target.value)}
                  >
                    <option value="">Mặc định (Vòng chia ưu tiên cao nhất)</option>
                    {rounds.map((r) => (
                      <option key={r.id} value={r.id}>
                        Vòng: {r.name}
                      </option>
                    ))}
                  </select>
                )}
                <ToggleSwitch
                  checked={autoPushToSaleRound}
                  onChange={setAutoPushToSaleRound}
                />
              </div>
            ) : (
              <button
                type="button"
                onClick={() => void switchPackage('growth_combo')}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '0.5rem 0.9rem',
                  borderRadius: 12,
                  border: '1px solid rgba(30, 64, 255, 0.25)',
                  background: 'rgba(30, 64, 255, 0.08)',
                  color: '#1E40FF',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                <Sparkles size={14} /> Mở khóa 1 chạm với Growth Suite
              </button>
            )}
          </div>
        </Card>

        {/* Live Member Preview */}
        <Card
          padding="1rem 1.2rem"
          title={
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
              <Eye size={16} color="#1E40FF" />
              <span>Xem trước Thành viên Khớp Điều Kiện Real-time</span>
              <Badge tone="primary">{previewCount.toLocaleString('vi-VN')} {terminology.customerLabel}</Badge>
            </span>
          }
          actions={
            <button
              type="button"
              onClick={() => void runLivePreview()}
              className="btn secondary sm"
              style={{ height: 32, fontSize: '0.76rem', display: 'inline-flex', alignItems: 'center', gap: 5 }}
            >
              <RefreshCw size={13} className={previewLoading ? 'animate-spin' : ''} /> Tính toán lại
            </button>
          }
        >
          {previewSample.length === 0 ? (
            <div style={{ fontSize: '0.8rem', color: '#64748B', padding: '0.4rem 0' }}>
              Chưa có hồ sơ nào khớp điều kiện hiện tại — hệ thống sẽ tự động nạp thành viên mới ngay khi phát sinh sự kiện.
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', fontSize: '0.78rem', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #E2E8F0', color: '#64748B' }}>
                    <th style={{ padding: '6px 8px', textAlign: 'left' }}>{terminology.customerLabel}</th>
                    <th style={{ padding: '6px 8px', textAlign: 'left' }}>SĐT / Email</th>
                    <th style={{ padding: '6px 8px', textAlign: 'left' }}>Trạng thái</th>
                    <th style={{ padding: '6px 8px', textAlign: 'right' }}>Lead Score</th>
                  </tr>
                </thead>
                <tbody>
                  {previewSample.map((m) => (
                    <tr key={m.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                      <td style={{ padding: '7px 8px', fontWeight: 600, color: '#0F172A' }}>{m.name}</td>
                      <td style={{ padding: '7px 8px', color: '#334155' }} className="autodata-tabular-nums">
                        {maskPiiPhone(m.masked_phone || m.phone, canUnmask)} • {maskPiiEmail(m.email, canUnmask)}
                      </td>
                      <td style={{ padding: '7px 8px' }}>
                        <Badge tone={m.status === 'marketing_nurture' ? 'info' : 'success'}>
                          {m.status === 'marketing_nurture' ? 'Nuôi dưỡng MKT' : m.status || 'Active'}
                        </Badge>
                      </td>
                      <td style={{ padding: '7px 8px', textAlign: 'right', fontWeight: 700, color: '#1E40FF' }} className="autodata-tabular-nums">
                        {m.lead_score ?? 0} đ
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
          <button type="button" className="btn secondary" onClick={onClose}>
            Hủy
          </button>
          <button
            type="submit"
            disabled={saving}
            className="btn-inkica-primary"
            style={{
              height: 44,
              padding: '0 1.4rem',
              borderRadius: 14,
              border: 'none',
              color: '#FFFFFF',
              fontWeight: 700,
              fontSize: '0.86rem',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 7,
              cursor: 'pointer',
            }}
          >
            <Zap size={16} />
            {saving ? 'Đang lưu Tệp Logic...' : initialAudience ? 'Cập nhật Tệp Logic' : 'Kích hoạt Tệp Logic'}
          </button>
        </div>
      </form>
    </CustomModal>
  );
};
