import React from 'react';
import { Edit2, Play, Search, Trash2, Workflow } from 'lucide-react';
import {
  Badge,
  Card,
  EmptyState,
  FormCard,
  PillTabs,
} from '../../components/ui/AutoDataLoadingModal';
import { formatShortDate, formatVnd } from '../../../autodataApi';
import type { FlowDefinitionDto } from './flowConstants';

export type FlowStatusFilter = 'all' | 'active' | 'draft';

export interface FlowListSectionProps {
  flows: FlowDefinitionDto[];
  filteredFlows: FlowDefinitionDto[];
  statusFilter: FlowStatusFilter;
  searchQuery: string;
  onChangeStatus: (st: FlowStatusFilter) => void;
  onChangeSearch: (q: string) => void;
  onCreateNew: () => void;
  onOpenStudio: (f: FlowDefinitionDto) => void;
  onOpenManualTrigger: (f: FlowDefinitionDto) => void;
  onRequestDelete: (f: FlowDefinitionDto) => void;
}

export const FlowListSection: React.FC<FlowListSectionProps> = ({
  flows,
  filteredFlows,
  statusFilter,
  searchQuery,
  onChangeStatus,
  onChangeSearch,
  onCreateNew,
  onOpenStudio,
  onOpenManualTrigger,
  onRequestDelete,
}) => {
  const totalEnrolled = flows.reduce((acc, f) => acc + Number(f.enrolled_count || 0), 0);
  const totalSaleHandoffs = flows.reduce((acc, f) => acc + Number(f.pushed_to_sale_count || 0), 0);
  const totalRevenue = flows.reduce((acc, f) => acc + Number(f.attributed_revenue_vnd || 0), 0);
  const activeCount = flows.filter((f) => f.status === 'active').length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(205px, 1fr))', gap: '1rem' }}>
        <Card padding="1rem 1.2rem">
          <div style={{ fontSize: '0.74rem', color: '#64748B', fontWeight: 600 }}>Kịch Bản Đang Chạy Real-time</div>
          <div style={{ fontSize: '1.55rem', fontWeight: 800, color: '#1E40FF', marginTop: 4 }}>
            {activeCount} / {flows.length}
          </div>
        </Card>
        <Card padding="1rem 1.2rem">
          <div style={{ fontSize: '0.74rem', color: '#64748B', fontWeight: 600 }}>Tổng Lượt Đi Vào Luồng</div>
          <div style={{ fontSize: '1.55rem', fontWeight: 800, color: '#0284C7', marginTop: 4 }}>
            {totalEnrolled.toLocaleString('vi-VN')}
          </div>
        </Card>
        <Card padding="1rem 1.2rem">
          <div style={{ fontSize: '0.74rem', color: '#64748B', fontWeight: 600 }}>Bàn Giao Vòng Chia Sale</div>
          <div style={{ fontSize: '1.55rem', fontWeight: 800, color: '#059669', marginTop: 4 }}>
            {totalSaleHandoffs.toLocaleString('vi-VN')} MQL
          </div>
        </Card>
        <Card padding="1rem 1.2rem">
          <div style={{ fontSize: '0.74rem', color: '#64748B', fontWeight: 600 }}>Doanh Thu Quy Đổi Automation</div>
          <div style={{ fontSize: '1.55rem', fontWeight: 800, color: '#0F172A', marginTop: 4 }}>
            {formatVnd(totalRevenue)}
          </div>
        </Card>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
        <PillTabs
          tabs={[
            { key: 'all', label: 'Tất cả kịch bản', count: flows.length },
            { key: 'active', label: 'Đang chạy Real-time', count: activeCount },
            { key: 'draft', label: 'Bản nháp', count: flows.length - activeCount },
          ]}
          activeKey={statusFilter}
          onChange={onChangeStatus}
        />

        <div style={{ position: 'relative', width: 260 }}>
          <Search size={14} style={{ position: 'absolute', left: 12, top: 13, color: '#94A3B8' }} />
          <input
            className="form-input"
            style={{ height: 40, paddingLeft: 34 }}
            placeholder="Tìm tên kịch bản hoặc Trigger..."
            value={searchQuery}
            onChange={(e) => onChangeSearch(e.target.value)}
          />
        </div>
      </div>

      {filteredFlows.length === 0 ? (
        <EmptyState
          icon={<Workflow size={24} />}
          title="Chưa có Kịch bản Tự động hóa nào khớp bộ lọc"
          description="Thiết kế luồng chăm sóc tự động 24/7 kết nối trực tiếp từ Form/Survey/Email sang Vòng chia Sale Fair-Share."
          action={
            <button
              type="button"
              onClick={onCreateNew}
              style={{
                height: 44,
                padding: '0 1.25rem',
                borderRadius: 12,
                border: 'none',
                background: '#1E40FF',
                color: '#FFFFFF',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Mở Visual Flow Studio
            </button>
          }
        />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '1rem' }}>
          {filteredFlows.map((f) => (
            <FormCard
              key={f.id}
              icon={<Workflow size={18} />}
              title={f.name}
              description={`Trigger: ${f.trigger_type} • Phiên bản v${f.version}`}
              badge={
                <Badge tone={f.status === 'active' ? 'success' : 'neutral'}>
                  {f.status === 'active' ? 'Active Real-time' : 'Draft'}
                </Badge>
              }
              footer={
                <>
                  <span style={{ fontSize: '0.74rem', color: '#475569', fontWeight: 600 }}>
                    {f.enrolled_count} chạy • {f.pushed_to_sale_count} chuyển Sale • {formatShortDate(f.updated_at)}
                  </span>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button
                      type="button"
                      onClick={() => onOpenManualTrigger(f)}
                      className="btn secondary sm"
                      style={{ height: 34 }}
                      title="Kích hoạt thủ công"
                    >
                      <Play size={13} />
                    </button>
                    <button
                      type="button"
                      onClick={() => onOpenStudio(f)}
                      className="btn secondary sm"
                      style={{ height: 34, color: '#1E40FF', display: 'inline-flex', alignItems: 'center', gap: 4, fontWeight: 700 }}
                    >
                      <Edit2 size={13} /> Mở Studio
                    </button>
                    <button
                      type="button"
                      onClick={() => onRequestDelete(f)}
                      className="btn secondary sm"
                      style={{ height: 34, color: '#DC2626' }}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </>
              }
            >
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                <Badge tone="primary">{f.steps?.length || 0} Nodes</Badge>
                {f.steps?.some((s) => s.type === 'push_to_autodata_sale_round') && (
                  <Badge tone="success">Đẩy Vòng Chia Sale</Badge>
                )}
                {f.attributed_revenue_vnd > 0 && (
                  <Badge tone="info">{formatVnd(f.attributed_revenue_vnd)}</Badge>
                )}
              </div>
            </FormCard>
          ))}
        </div>
      )}
    </div>
  );
};
