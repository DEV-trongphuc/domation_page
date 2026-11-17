import React from 'react';
import {
  BarChart3,
  Clock,
  DollarSign,
  Edit2,
  Mail,
  Search,
  Send,
  Trash2,
} from 'lucide-react';
import {
  Badge,
  Card,
  PillTabs,
  Table,
  type TableColumn,
} from '../../components/ui/AutoDataLoadingModal';
import { formatVnd } from '../../../autodataApi';
import type { CampaignChannel, CampaignRowDto } from './campaignTypes';

export type CampaignStatusTabFilter = 'all' | 'completed' | 'scheduled' | 'draft';

export interface CampaignListSectionProps {
  campaigns: CampaignRowDto[];
  filteredCampaigns: CampaignRowDto[];
  summary: { sent: number; opened: number; clicked: number; revenue_vnd: number; cost_vnd: number };
  suppressionCount: number;
  customerLabel: string;
  statusFilter: CampaignStatusTabFilter;
  channelFilter: 'all' | CampaignChannel;
  searchQuery: string;
  onChangeStatus: (st: CampaignStatusTabFilter) => void;
  onChangeChannel: (ch: 'all' | CampaignChannel) => void;
  onChangeSearch: (q: string) => void;
  onOpenDetail: (c: CampaignRowDto) => void;
  onOpenEdit: (c: CampaignRowDto) => void;
  onDispatch: (id: string) => void;
  onRunReminder: (id: string) => void;
  onSyncRevenue: (id: string) => void;
  onRequestDelete: (c: CampaignRowDto) => void;
}

export const CampaignListSection: React.FC<CampaignListSectionProps> = ({
  campaigns,
  filteredCampaigns,
  summary,
  suppressionCount,
  customerLabel,
  statusFilter,
  channelFilter,
  searchQuery,
  onChangeStatus,
  onChangeChannel,
  onChangeSearch,
  onOpenDetail,
  onOpenEdit,
  onDispatch,
  onRunReminder,
  onSyncRevenue,
  onRequestDelete,
}) => {
  const columns: Array<TableColumn<CampaignRowDto>> = [
    {
      key: 'name',
      header: 'Chiến Dịch & Tệp Khách Hàng Đích',
      render: (r) => (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontWeight: 800, color: '#0F172A' }}>{r.name}</span>
            <Badge tone={r.status === 'completed' ? 'success' : r.status === 'scheduled' ? 'warning' : 'neutral'}>
              {r.status.toUpperCase()}
            </Badge>
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: 3 }}>
            Tệp: {r.audience_name || `Toàn bộ ${customerLabel}`} • Subject A: {r.subject_a}
            {r.subject_b ? ` • A/B ${r.ab_split_ratio}/${100 - r.ab_split_ratio}` : ''}
          </div>
        </div>
      ),
    },
    {
      key: 'channel',
      header: 'Kênh Vault',
      render: (r) => (
        <Badge tone={r.channel === 'zns' ? 'info' : r.channel === 'multi' ? 'purple' : 'primary'}>
          {r.channel.toUpperCase()}
        </Badge>
      ),
    },
    {
      key: 'metrics',
      header: 'Phễu Gửi / Mở / Click',
      numeric: true,
      render: (r) => (
        <div>
          <div style={{ fontWeight: 700, color: '#0F172A' }}>
            {r.sent_count.toLocaleString('vi-VN')} gửi • {r.opened_count.toLocaleString('vi-VN')} mở ({r.open_rate_pct}%)
          </div>
          <div style={{ fontSize: '0.74rem', color: '#1E40FF', fontWeight: 700 }}>
            {r.clicked_count.toLocaleString('vi-VN')} click ({r.click_rate_pct}%)
          </div>
        </div>
      ),
    },
    {
      key: 'roi',
      header: 'Doanh Thu Quy Đổi & ROI',
      numeric: true,
      render: (r) => (
        <div>
          <div style={{ fontWeight: 800, color: '#059669' }}>{formatVnd(r.attributed_revenue_vnd)}</div>
          <div style={{ fontSize: '0.72rem', color: '#64748B' }}>
            Chi phí: {formatVnd(r.cost_vnd)} ({r.roi_multiple}x)
          </div>
        </div>
      ),
    },
    {
      key: 'actions',
      header: 'Thao Tác',
      align: 'right',
      render: (r) => (
        <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }} onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            onClick={() => onOpenDetail(r)}
            className="btn secondary sm"
            style={{ height: 36, color: '#1E40FF', display: 'inline-flex', alignItems: 'center', gap: 4, fontWeight: 700 }}
          >
            <BarChart3 size={13} /> Chi tiết
          </button>
          <button
            type="button"
            onClick={() => onOpenEdit(r)}
            className="btn secondary sm"
            style={{ height: 36 }}
            title="Chỉnh sửa 5 bước"
          >
            <Edit2 size={13} />
          </button>
          <button
            type="button"
            onClick={() => onDispatch(r.id)}
            className="btn secondary sm"
            style={{ height: 36, color: '#1E40FF' }}
            title="Phát hành Atomic"
          >
            <Send size={13} />
          </button>
          <button
            type="button"
            onClick={() => onRunReminder(r.id)}
            className="btn secondary sm"
            style={{ height: 36 }}
            title="Gửi nhắc tự động"
          >
            <Clock size={13} />
          </button>
          <button
            type="button"
            onClick={() => onSyncRevenue(r.id)}
            className="btn secondary sm"
            style={{ height: 36, color: '#059669' }}
            title="Đồng bộ Doanh thu"
          >
            <DollarSign size={13} />
          </button>
          <button
            type="button"
            onClick={() => onRequestDelete(r)}
            className="btn secondary sm"
            style={{ height: 36, color: '#DC2626' }}
          >
            <Trash2 size={13} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '1rem' }}>
        <Card padding="1.05rem 1.25rem">
          <div style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 600 }}>Tổng Lượt Phát Thành Công</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#1E40FF', marginTop: 4 }}>
            {summary.sent.toLocaleString('vi-VN')}
          </div>
        </Card>
        <Card padding="1.05rem 1.25rem">
          <div style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 600 }}>Lượt Mở / Click Tương Tác</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0284C7', marginTop: 4 }}>
            {summary.opened.toLocaleString('vi-VN')} / {summary.clicked.toLocaleString('vi-VN')}
          </div>
        </Card>
        <Card padding="1.05rem 1.25rem">
          <div style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 600 }}>Doanh Thu Quy Đổi Chiến Dịch</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#059669', marginTop: 4 }}>
            {formatVnd(summary.revenue_vnd)}
          </div>
        </Card>
        <Card padding="1.05rem 1.25rem">
          <div style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 600 }}>Danh Sách Chặn (Suppression)</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0F172A', marginTop: 4 }}>
            {suppressionCount.toLocaleString('vi-VN')}
          </div>
        </Card>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
        <PillTabs
          tabs={[
            { key: 'all', label: 'Tất cả', icon: <Mail size={14} />, count: campaigns.length },
            { key: 'completed', label: 'Đã phát hành', count: campaigns.filter((c) => c.status === 'completed').length },
            { key: 'scheduled', label: 'Hẹn lịch', count: campaigns.filter((c) => c.status === 'scheduled').length },
            { key: 'draft', label: 'Bản nháp', count: campaigns.filter((c) => c.status === 'draft').length },
          ]}
          activeKey={statusFilter}
          onChange={onChangeStatus}
        />

        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <select
            className="form-input"
            style={{ height: 40, width: 165 }}
            value={channelFilter}
            onChange={(e) => onChangeChannel(e.target.value as 'all' | CampaignChannel)}
          >
            <option value="all">Tất cả kênh gửi</option>
            <option value="email">Email (SES/SMTP)</option>
            <option value="zns">Zalo ZNS</option>
            <option value="multi">Đa kênh (Multi)</option>
          </select>

          <div style={{ position: 'relative', width: 250 }}>
            <Search size={14} style={{ position: 'absolute', left: 12, top: 13, color: '#94A3B8' }} />
            <input
              className="form-input"
              style={{ height: 40, paddingLeft: 34 }}
              placeholder="Tìm tên chiến dịch, tiêu đề..."
              value={searchQuery}
              onChange={(e) => onChangeSearch(e.target.value)}
            />
          </div>
        </div>
      </div>

      <Table
        columns={columns}
        rows={filteredCampaigns}
        rowKey={(r) => r.id}
        onRowClick={onOpenDetail}
        emptyTitle="Chưa có Chiến dịch Email / Zalo ZNS nào"
        emptyDescription="Khởi tạo chiến dịch 5 bước với A/B Split, Biến dự phòng và Khóa nguyên tử chống gửi đúp."
      />
    </>
  );
};
