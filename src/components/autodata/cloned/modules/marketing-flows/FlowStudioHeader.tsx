import React from 'react';
import {
  BarChart3,
  CheckCircle2,
  GitBranch,
  Play,
  Plus,
  RefreshCw,
  Save,
  Settings2,
  Sparkles,
  Users,
  Workflow,
} from 'lucide-react';
import { Badge, Card, PillTabs } from '../../components/ui/AutoDataLoadingModal';
import { ScreenHelpButton } from '../../components/ui/ScreenHelpButton';

export type StudioSubTab = 'builder' | 'analytics' | 'settings';

export interface FlowStudioHeaderProps {
  mode: 'list' | 'canvas';
  studioTab: StudioSubTab;
  flowName: string;
  stepsCount: number;
  canCreate: boolean;
  saving: boolean;
  auditing: boolean;
  onChangeFlowName: (val: string) => void;
  onChangeStudioTab: (tab: StudioSubTab) => void;
  onReload: () => void;
  onCreateNew: () => void;
  onBackToList: () => void;
  onOpenManualTrigger: () => void;
  onOpenSimulate: () => void;
  onRunReview: () => void;
  onSaveDraft: () => void;
  onPublishSnapshot: () => void;
}

export const FlowStudioHeader: React.FC<FlowStudioHeaderProps> = ({
  mode,
  studioTab,
  flowName,
  stepsCount,
  canCreate,
  saving,
  auditing,
  onChangeFlowName,
  onChangeStudioTab,
  onReload,
  onCreateNew,
  onBackToList,
  onOpenManualTrigger,
  onOpenSimulate,
  onRunReview,
  onSaveDraft,
  onPublishSnapshot,
}) => (
  <Card padding="1.15rem 1.4rem" style={{ background: 'linear-gradient(135deg, #FFFFFF 0%, #F8FAFF 100%)' }}>
    <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: 14,
            background: '#EEF2FF',
            border: '1px solid #DBEAFE',
            color: '#1E40FF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Workflow size={22} />
        </div>
        {mode === 'canvas' ? (
          <input
            className="form-input"
            style={{ height: 38, fontWeight: 800, fontSize: '0.96rem', minWidth: 320 }}
            value={flowName}
            onChange={(e) => onChangeFlowName(e.target.value)}
          />
        ) : (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <h1 style={{ fontSize: '1.18rem', fontWeight: 800, color: '#0F172A', margin: 0 }}>
                Visual Automation Flow Studio (15 Triggers × 11 Nodes)
              </h1>
              <Badge tone="primary">Event-Bus Real-time</Badge>
              <Badge tone="success">Auto Data Sale Handoff</Badge>
            </div>
            <p style={{ fontSize: '0.79rem', color: '#64748B', marginTop: 2 }}>
              Sơ đồ rẽ nhánh Zoom/Pan, Giả lập vết thực thi, <strong>DOM Agent</strong> kiểm toán &amp; đẩy thẳng sang Vòng chia Sale.
            </p>
          </div>
        )}
      </div>

      <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
        <ScreenHelpButton screenKey="mkt_flows" />
        {mode === 'list' ? (
          <>
            <button type="button" onClick={onReload} className="btn secondary" style={{ height: 44 }}>
              <RefreshCw size={15} />
            </button>
            {canCreate && (
              <button
                type="button"
                onClick={onCreateNew}
                style={{
                  height: 44,
                  padding: '0 1.2rem',
                  borderRadius: 12,
                  border: 'none',
                  background: '#1E40FF',
                  color: '#FFFFFF',
                  fontWeight: 700,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  cursor: 'pointer',
                }}
              >
                <Plus size={16} /> Tạo Kịch Bản Mới
              </button>
            )}
          </>
        ) : (
          <>
            <button type="button" onClick={onBackToList} className="btn secondary" style={{ height: 42 }}>
              Danh sách
            </button>
            <button
              type="button"
              onClick={onOpenManualTrigger}
              className="btn secondary"
              style={{ height: 42, display: 'inline-flex', alignItems: 'center', gap: 5 }}
            >
              <Users size={14} /> Kích hoạt thủ công
            </button>
            <button
              type="button"
              onClick={onOpenSimulate}
              className="btn secondary"
              style={{ height: 42, display: 'inline-flex', alignItems: 'center', gap: 5 }}
            >
              <Play size={14} /> Giả lập
            </button>
            <button
              type="button"
              disabled={auditing}
              onClick={onRunReview}
              className="btn secondary"
              style={{ height: 42, color: '#1E40FF', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 5 }}
            >
              <Sparkles size={14} /> DOM Agent Rà Lỗi
            </button>
            <button
              type="button"
              disabled={saving}
              onClick={onSaveDraft}
              className="btn secondary"
              style={{ height: 42, display: 'inline-flex', alignItems: 'center', gap: 5 }}
            >
              <Save size={14} /> Lưu nháp
            </button>
            <button
              type="button"
              onClick={onPublishSnapshot}
              style={{
                height: 42,
                padding: '0 1.1rem',
                borderRadius: 12,
                border: 'none',
                background: '#1E40FF',
                color: '#FFFFFF',
                fontWeight: 700,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                cursor: 'pointer',
              }}
            >
              <CheckCircle2 size={14} /> Kích Hoạt &amp; Snapshot
            </button>
          </>
        )}
      </div>
    </div>

    {mode === 'canvas' && (
      <div style={{ marginTop: 12, paddingTop: 10, borderTop: '1px solid #F1F5F9' }}>
        <PillTabs
          tabs={[
            { key: 'builder', label: '1. Sơ Đồ Luồng (Visual Builder)', icon: <GitBranch size={14} />, count: stepsCount },
            { key: 'analytics', label: '2. Phễu Chuyển Đổi & ROI', icon: <BarChart3 size={14} /> },
            { key: 'settings', label: '3. Khung Giờ & Thoát Luồng', icon: <Settings2 size={14} /> },
          ]}
          activeKey={studioTab}
          onChange={onChangeStudioTab}
        />
      </div>
    )}
  </Card>
);
