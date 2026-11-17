import React, { useMemo, useState } from 'react';
import {
  ArrowRight,
  GitBranch,
  Layers,
  Plus,
  Save,
  Sliders,
  Trash2,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { Badge, Card, EmptyState, PillTabs } from '../../components/ui/AutoDataLoadingModal';
import { ToggleSwitch } from '../../components/ui/ToggleSwitch';
import { apiRequest, getErrorMessage } from '../../../autodataApi';
import { useAuth } from '../../contexts/AuthContext';
import { DEFAULT_PIPELINE_CAPI_STAGES } from '../../utils/pipelineConfig';
import {
  FUNNEL_CATEGORIES,
  type FunnelCategoryKey,
  type OrgRole,
  type PipelineQuickTab,
  type StageTransitionRule,
} from './saasSettingsTypes';

interface PipelineRulesSettingsTabProps {
  stageRules: StageTransitionRule[];
  setStageRules: React.Dispatch<React.SetStateAction<StageTransitionRule[]>>;
  pipelineTabs: PipelineQuickTab[];
  setPipelineTabs: React.Dispatch<React.SetStateAction<PipelineQuickTab[]>>;
  roles: OrgRole[];
}

interface EditableStageMeta {
  id: string;
  name: string;
  funnel_category: FunnelCategoryKey;
  score_delta: number;
}

export const PipelineRulesSettingsTab: React.FC<PipelineRulesSettingsTabProps> = ({
  stageRules,
  setStageRules,
  pipelineTabs,
  setPipelineTabs,
  roles,
}) => {
  const { token, tenantSlug, bootstrapData } = useAuth();
  const [subTab, setSubTab] = useState<'stages' | 'transitions' | 'tabs'>('stages');

  const rawStages = useMemo(() => {
    const bootStages = (bootstrapData?.pipelines || []).flatMap((p) =>
      (p.stages || []).map((s) => ({ ...s, resolved_pipeline_id: s.pipeline_id || p.id }))
    );
    if (bootStages.length > 0) {
      return bootStages.map((s) => ({
        id: s.id,
        pipeline_id: s.resolved_pipeline_id,
        name: s.stage_name,
        funnel_category: (s.funnel_category as FunnelCategoryKey) ||
          (s.is_won_stage
            ? 'closed_won'
            : s.is_lost_stage
            ? 'closed_lost'
            : 'engaged_qualified'),
        score_delta:
          typeof s.score_delta === 'number'
            ? s.score_delta
            : s.is_won_stage
            ? 100
            : s.is_lost_stage
            ? -20
            : 20,
      }));
    }
    return DEFAULT_PIPELINE_CAPI_STAGES.map((st) => ({
      id: st.key,
      pipeline_id: bootstrapData?.pipelines?.[0]?.id || 'default',
      name: st.label,
      funnel_category: (st.key === 'Closed'
        ? 'closed_won'
        : st.group === 'negative'
        ? 'closed_lost'
        : st.is_qualified
        ? 'engaged_qualified'
        : 'nurturing') as FunnelCategoryKey,
      score_delta: st.key === 'Closed' ? 100 : st.is_qualified ? 30 : 0,
    }));
  }, [bootstrapData?.pipelines]);

  const [stageEdits, setStageEdits] = useState<Record<string, Partial<EditableStageMeta>>>({});

  // Transition Rule Form
  const [fromStageId, setFromStageId] = useState('');
  const [toStageId, setToStageId] = useState(() => rawStages[0]?.id || '');
  const [requiredFieldsText, setRequiredFieldsText] = useState('phone, product_interest');
  const [allowedRoleId, setAllowedRoleId] = useState('');
  const [maxSlaHours, setMaxSlaHours] = useState('24');
  const [autoTaskTitle, setAutoTaskTitle] = useState('Gọi xác nhận nhu cầu & gửi báo giá');
  const [requireNote, setRequireNote] = useState(true);

  // New Tab Form
  const [newTabLabel, setNewTabLabel] = useState('');
  const [newTabFilter, setNewTabFilter] = useState<PipelineQuickTab['filter_type']>('qualified');

  const resolvedStages: EditableStageMeta[] = rawStages.map((st) => ({
    ...st,
    ...(stageEdits[st.id] || {}),
  }));

  const handleSaveStageMeta = async (st: EditableStageMeta) => {
    try {
      await apiRequest(`/org-rbac/stages/${st.id}/meta`, {
        method: 'PATCH',
        token,
        tenantSlug,
        body: {
          funnel_category: st.funnel_category,
          score_delta: st.score_delta,
        },
      });
      toast.success(`Đã lưu nhóm phễu & điểm cộng (${st.score_delta >= 0 ? `+${st.score_delta}` : st.score_delta}) cho "${st.name}"!`);
    } catch (err) {
      toast.error(getErrorMessage(err, `Không thể lưu cấu hình bước "${st.name}".`));
    }
  };

  const handleCreateRule = async (e: React.FormEvent) => {
    e.preventDefault();
    const targetTo = toStageId || rawStages[0]?.id || '';
    if (!targetTo) return;
    const reqFields = requiredFieldsText
      .split(',')
      .map((f) => f.trim())
      .filter(Boolean);

    const matchedToStage = rawStages.find((s) => s.id === targetTo);
    const resolvedPipelineId =
      matchedToStage?.pipeline_id || bootstrapData?.pipelines?.[0]?.id || 'default';

    const payload = {
      pipeline_id: resolvedPipelineId,
      from_stage_id: fromStageId || null,
      to_stage_id: targetTo,
      required_fields: reqFields,
      allowed_role_ids: allowedRoleId ? [allowedRoleId] : [],
      require_note: requireNote,
      max_sla_hours: maxSlaHours ? Number(maxSlaHours) : null,
      auto_task_templates: autoTaskTitle.trim() ? [autoTaskTitle.trim()] : [],
    };

    try {
      const created = await apiRequest<StageTransitionRule>('/org-rbac/stage-rules', {
        method: 'POST',
        token,
        tenantSlug,
        body: payload,
      });
      setStageRules((prev) => [created, ...prev]);
      toast.success('Đã tạo Luật chuyển bước Pipeline động!');
    } catch (err) {
      toast.error(getErrorMessage(err, 'Không thể tạo Luật chuyển bước Pipeline.'));
    }
  };

  const handleDeleteRule = async (id: string) => {
    const prevRules = stageRules;
    setStageRules((prev) => prev.filter((r) => r.id !== id));
    try {
      await apiRequest(`/org-rbac/stage-rules/${id}`, { method: 'DELETE', token, tenantSlug });
      toast.success('Đã xóa Luật chuyển bước.');
    } catch (err) {
      setStageRules(prevRules);
      toast.error(getErrorMessage(err, 'Không thể xóa Luật chuyển bước.'));
    }
  };

  const handleAddQuickTab = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTabLabel.trim()) return;
    const prevTabs = pipelineTabs;
    const nextTab: PipelineQuickTab = {
      id: `ptab_${Date.now()}`,
      key: newTabLabel.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_'),
      label: newTabLabel.trim(),
      filter_type: newTabFilter,
      enabled: true,
    };
    const updated = [...pipelineTabs, nextTab];
    setPipelineTabs(updated);
    try {
      await apiRequest('/org-rbac/terminology', {
        method: 'PUT',
        token,
        tenantSlug,
        body: { pipeline_tabs: updated },
      });
      setNewTabLabel('');
      toast.success('Đã thêm Tab lọc nhanh tùy biến!');
    } catch (err) {
      setPipelineTabs(prevTabs);
      toast.error(getErrorMessage(err, 'Không thể lưu Tab lọc nhanh mới.'));
    }
  };

  const handleToggleQuickTab = async (id: string, enabled: boolean) => {
    const prevTabs = pipelineTabs;
    const updated = pipelineTabs.map((t) => (t.id === id ? { ...t, enabled } : t));
    setPipelineTabs(updated);
    try {
      await apiRequest('/org-rbac/terminology', {
        method: 'PUT',
        token,
        tenantSlug,
        body: { pipeline_tabs: updated },
      });
    } catch (err) {
      setPipelineTabs(prevTabs);
      toast.error(getErrorMessage(err, 'Không thể cập nhật trạng thái Tab lọc nhanh.'));
    }
  };

  return (
    <div data-tour="settings-pipeline-rules-root" style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
      <PillTabs
        tabs={[
          { key: 'stages', label: 'Nhóm Phễu Báo cáo & Điểm Lead Score (Stages)', icon: <Sliders size={15} />, count: resolvedStages.length },
          { key: 'transitions', label: 'Luật Chuyển Bước Động & Tự Sinh Công Việc', icon: <GitBranch size={15} />, count: stageRules.length },
          { key: 'tabs', label: 'Tabs Lọc Nhanh Tùy Biến', icon: <Layers size={15} />, count: pipelineTabs.length },
        ]}
        activeKey={subTab}
        onChange={(nextKey) => setSubTab(nextKey as typeof subTab)}
      />

      {subTab === 'stages' && (
        <Card
          title="Ánh Xạ Bước Phễu Sang Nhóm Báo Cáo Động (funnel_category) & Điểm Cộng (score_delta)"
          subtitle="Xóa bỏ hoàn toàn lỗi hardcode stage_id = 31..44: doanh nghiệp tạo 4 bước hay 20 bước thì biểu đồ Phễu & Lead Score vẫn chính xác 100%"
        >
          <div style={{ overflowX: 'auto', border: '1px solid #E2E8F0', borderRadius: 16 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
              <thead>
                <tr style={{ background: '#F8F9FA', borderBottom: '1px solid #E2E8F0' }}>
                  <th style={{ padding: '10px 14px', textAlign: 'left' }}>Bước Pipeline hiện tại</th>
                  <th style={{ padding: '10px 14px', textAlign: 'left' }}>Nhóm Phễu Báo cáo (Funnel Category)</th>
                  <th style={{ padding: '10px 14px', textAlign: 'right', width: 160 }}>Điểm cộng (Score Delta)</th>
                  <th style={{ padding: '10px 14px', textAlign: 'right', width: 120 }}>Lưu</th>
                </tr>
              </thead>
              <tbody>
                {resolvedStages.map((st) => (
                  <tr key={st.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                    <td style={{ padding: '10px 14px', fontWeight: 700, color: '#0F172A' }}>{st.name}</td>
                    <td style={{ padding: '10px 14px' }}>
                      <select
                        className="form-input"
                        style={{ height: 36, fontSize: '0.8rem' }}
                        value={st.funnel_category}
                        onChange={(e) => {
                          const cat = e.target.value as FunnelCategoryKey;
                          const defScore = FUNNEL_CATEGORIES.find((c) => c.key === cat)?.defaultScore ?? st.score_delta;
                          setStageEdits((prev) => ({
                            ...prev,
                            [st.id]: { ...prev[st.id], funnel_category: cat, score_delta: defScore },
                          }));
                        }}
                      >
                        {FUNNEL_CATEGORIES.map((fc) => (
                          <option key={fc.key} value={fc.key}>
                            {fc.label}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td style={{ padding: '10px 14px', textAlign: 'right' }}>
                      <input
                        type="number"
                        min={-100}
                        max={200}
                        className="form-input autodata-tabular-nums"
                        style={{ height: 36, textAlign: 'right', fontWeight: 700, color: st.score_delta >= 0 ? '#059669' : '#1E40FF' }}
                        value={st.score_delta}
                        onChange={(e) =>
                          setStageEdits((prev) => ({
                            ...prev,
                            [st.id]: { ...prev[st.id], score_delta: Number(e.target.value) },
                          }))
                        }
                      />
                    </td>
                    <td style={{ padding: '10px 14px', textAlign: 'right' }}>
                      <button
                        type="button"
                        onClick={() => void handleSaveStageMeta(st)}
                        className="btn secondary sm"
                        style={{ height: 34, fontSize: '0.76rem', color: '#1E40FF', display: 'inline-flex', alignItems: 'center', gap: 5 }}
                      >
                        <Save size={13} /> Lưu
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {subTab === 'transitions' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <Card
            title="Thiết Lập Luật Chuyển Bước Động (Stage Transition Rules)"
            subtitle="Kiểm soát trường bắt buộc điền, Vai trò được phép kéo thẻ, hạn SLA tối đa và tự động sinh Task mẫu cho Sale"
          >
            <form onSubmit={handleCreateRule} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '0.8rem' }}>
                <div className="form-group">
                  <label className="form-label">Từ Bước (Bỏ trống = Mọi bước)</label>
                  <select className="form-input" value={fromStageId} onChange={(e) => setFromStageId(e.target.value)}>
                    <option value="">Bất kỳ bước nào</option>
                    {resolvedStages.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Chuyển sang Bước Đích *</label>
                  <select className="form-input" value={toStageId} onChange={(e) => setToStageId(e.target.value)}>
                    {resolvedStages.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Giới hạn Vai trò được phép chuyển</label>
                  <select className="form-input" value={allowedRoleId} onChange={(e) => setAllowedRoleId(e.target.value)}>
                    <option value="">Tất cả nhân sự phụ trách</option>
                    {roles.map((r) => (
                      <option key={r.id} value={r.id}>
                        Chỉ vai trò: {r.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '0.8rem', alignItems: 'end' }}>
                <div className="form-group">
                  <label className="form-label">Trường bắt buộc điền trước (cách dấu phẩy)</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="phone, email, product_interest"
                    value={requiredFieldsText}
                    onChange={(e) => setRequiredFieldsText(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">SLA tối đa ở bước này (Giờ)</label>
                  <input
                    type="number"
                    min={1}
                    className="form-input"
                    value={maxSlaHours}
                    onChange={(e) => setMaxSlaHours(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Tự động sinh Công việc mẫu (Task)</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Gửi hợp đồng nháp & đặt lịch hẹn..."
                    value={autoTaskTitle}
                    onChange={(e) => setAutoTaskTitle(e.target.value)}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
                <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: '0.82rem', fontWeight: 600 }}>
                  <input
                    type="checkbox"
                    checked={requireNote}
                    onChange={(e) => setRequireNote(e.target.checked)}
                  />
                  Bắt buộc nhập ghi chú kết quả trao đổi khi chuyển vào bước này
                </label>

                <button
                  type="submit"
                  className="btn-inkica-primary"
                  style={{ height: 42, padding: '0 1.25rem', borderRadius: 14, border: 'none', color: '#FFFFFF', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}
                >
                  <Plus size={15} /> Thêm Luật Chuyển Bước
                </button>
              </div>
            </form>
          </Card>

          {stageRules.length === 0 ? (
            <EmptyState
              icon={<GitBranch size={24} />}
              title="Chưa cấu hình luật ràng buộc chuyển bước nào"
              description="Các bước phễu hiện cho phép kéo-thả tự do. Thêm luật ở trên để kiểm soát chặt chất lượng dữ liệu."
            />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {stageRules.map((rule) => {
                const fromName = resolvedStages.find((s) => s.id === rule.from_stage_id)?.name || 'Mọi bước';
                const toName = resolvedStages.find((s) => s.id === rule.to_stage_id)?.name || rule.to_stage_id;
                return (
                  <Card key={rule.id} padding="0.95rem 1.2rem">
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', fontSize: '0.84rem' }}>
                        <Badge tone="neutral">{fromName}</Badge>
                        <ArrowRight size={15} color="#1E40FF" />
                        <Badge tone="primary">{toName}</Badge>
                        {rule.required_fields?.length > 0 && (
                          <span style={{ color: '#475569' }}>
                            • Bắt buộc: <strong>{rule.required_fields.join(', ')}</strong>
                          </span>
                        )}
                        {rule.max_sla_hours && (
                          <Badge tone="warning">SLA {rule.max_sla_hours}h</Badge>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => void handleDeleteRule(rule.id)}
                        style={{ border: 'none', background: 'transparent', color: '#1E40FF', cursor: 'pointer' }}
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}

      {subTab === 'tabs' && (
        <Card
          title="Tùy Biến Các Tab Lọc Nhanh Trên Bảng Khách Hàng & Giao Dịch"
          subtitle="Thay thế hoàn toàn các sub-tab học thuật cứng — mỗi doanh nghiệp tự tạo bộ tab vận hành theo quy trình riêng"
        >
          <form onSubmit={handleAddQuickTab} style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: '1.1rem' }}>
            <input
              type="text"
              required
              className="form-input"
              style={{ maxWidth: 280 }}
              placeholder="Tên Tab mới (VD: Đang chờ đặt cọc)"
              value={newTabLabel}
              onChange={(e) => setNewTabLabel(e.target.value)}
            />
            <select
              className="form-input"
              style={{ maxWidth: 240 }}
              value={newTabFilter}
              onChange={(e) => setNewTabFilter(e.target.value as PipelineQuickTab['filter_type'])}
            >
              <option value="all">Tất cả bản ghi</option>
              <option value="uncontacted">Nhóm Chưa liên hệ</option>
              <option value="qualified">Nhóm Đạt chuẩn (Qualified)</option>
              <option value="negotiation">Nhóm Đàm phán / Báo giá</option>
              <option value="won">Nhóm Đã chốt thành công</option>
              <option value="nurturing">Nhóm Nuôi dưỡng lại</option>
            </select>
            <button
              type="submit"
              className="btn-inkica-primary"
              style={{ height: 44, padding: '0 1.2rem', borderRadius: 14, border: 'none', color: '#FFFFFF', fontWeight: 700, cursor: 'pointer' }}
            >
              + Thêm Tab
            </button>
          </form>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 10 }}>
            {pipelineTabs.map((pt) => (
              <div
                key={pt.id}
                style={{
                  padding: '10px 14px',
                  borderRadius: 14,
                  border: '1px solid #E2E8F0',
                  background: '#F8FAFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 700 }}>{pt.label}</div>
                  <div style={{ fontSize: '0.72rem', color: '#64748B' }}>Bộ lọc: {pt.filter_type}</div>
                </div>
                <ToggleSwitch
                  checked={pt.enabled}
                  onChange={(val) => void handleToggleQuickTab(pt.id, val)}
                />
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
};
