import React, { useMemo, useState } from 'react';
import { Code2, Plus, ShoppingBag, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { Badge, Card, Table, type TableColumn } from '../../components/ui/AutoDataLoadingModal';
import { ConfirmModal } from '../../components/ui/ConfirmModal';
import { apiRequest, formatShortDate, formatVnd, getErrorMessage } from '../../../autodataApi';
import { useAuth } from '../../contexts/AuthContext';
import { useEntitlement } from '../../contexts/EntitlementContext';
import { PurchaseEventDetailModal } from './PurchaseEventDetailModal';
import type { CustomEventDto } from './types';

interface PurchasesTabProps {
  events: CustomEventDto[];
  onReload: () => Promise<void>;
}

export const PurchasesTab: React.FC<PurchasesTabProps> = ({ events, onReload }) => {
  const { token, tenantSlug } = useAuth();
  const { can } = useEntitlement();
  const canCreate = can('forms_triggers', 'create');
  const canDelete = can('forms_triggers', 'delete');

  const [eventName, setEventName] = useState('');
  const [eventKey, setEventKey] = useState('');
  const [creating, setCreating] = useState(false);

  const [selectedEvent, setSelectedEvent] = useState<CustomEventDto | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<CustomEventDto | null>(null);

  const purchaseEvents = useMemo(
    () => events.filter((e) => e.event_category === 'purchase'),
    [events]
  );

  const totals = useMemo(() => {
    const orders = purchaseEvents.reduce((acc, e) => acc + e.trigger_count, 0);
    const revenue = purchaseEvents.reduce((acc, e) => acc + e.total_revenue_vnd, 0);
    return {
      orders,
      revenue,
      aov: orders > 0 ? Math.round(revenue / orders) : 0,
    };
  }, [purchaseEvents]);

  const handleCreate = async () => {
    if (!eventName.trim()) {
      toast.error('Vui lòng nhập tên Sự kiện Mua hàng.');
      return;
    }
    setCreating(true);
    try {
      await apiRequest('/marketing/forms/events', {
        method: 'POST',
        token,
        tenantSlug,
        body: {
          event_name: eventName.trim(),
          event_key: eventKey.trim() || undefined,
          event_category: 'purchase',
          schema_json: {
            phone: 'string (or email)',
            amount_vnd: 'number',
            order_id: 'string',
            items: 'array',
          },
        },
      });
      setEventName('');
      setEventKey('');
      toast.success('Đã tạo Sự kiện Mua hàng mới!');
      await onReload();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Không thể tạo Purchase Event.'));
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    try {
      await apiRequest(`/marketing/forms/events/${deleteTarget.id}`, {
        method: 'DELETE',
        token,
        tenantSlug,
      });
      toast.success('Đã xóa Purchase Event.');
      setDeleteTarget(null);
      await onReload();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Không thể xóa Purchase Event.'));
    }
  };

  const columns: Array<TableColumn<CustomEventDto>> = [
    {
      key: 'name',
      header: 'Sự Kiện Mua Hàng & Mã Webhook',
      render: (r) => (
        <div>
          <div style={{ fontWeight: 700, color: '#0F172A' }}>{r.event_name}</div>
          <code style={{ fontSize: '0.74rem', color: '#1E40FF' }}>{r.event_key}</code>
        </div>
      ),
    },
    {
      key: 'cat',
      header: 'Đối Soát Doanh Thu',
      render: () => <Badge tone="success">Cộng LTV + Deal Won</Badge>,
    },
    {
      key: 'cnt',
      header: 'Số Đơn Ghi Nhận',
      numeric: true,
      render: (r) => r.trigger_count.toLocaleString('vi-VN'),
    },
    {
      key: 'rev',
      header: 'Tổng Doanh Thu (VNĐ)',
      numeric: true,
      render: (r) => <strong style={{ color: '#059669' }}>{formatVnd(r.total_revenue_vnd)}</strong>,
    },
    {
      key: 'created',
      header: 'Cập Nhật',
      render: (r) => <span style={{ fontSize: '0.76rem', color: '#64748B' }}>{formatShortDate(r.updated_at || r.created_at)}</span>,
    },
    {
      key: 'act',
      header: 'Thao Tác',
      align: 'right',
      render: (r) => (
        <div style={{ display: 'inline-flex', gap: 6 }}>
          <button
            type="button"
            onClick={() => setSelectedEvent(r)}
            className="btn secondary sm"
            style={{ height: 36, color: '#1E40FF', display: 'inline-flex', alignItems: 'center', gap: 5 }}
          >
            <Code2 size={13} /> Doanh thu, Secret & Test
          </button>
          {canDelete && (
            <button
              type="button"
              onClick={() => setDeleteTarget(r)}
              className="btn secondary sm"
              style={{ height: 36, color: '#DC2626' }}
              title="Xóa sự kiện"
            >
              <Trash2 size={13} />
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {/* Revenue KPI Strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.85rem' }}>
        <Card padding="1rem 1.2rem">
          <div style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 700 }}>Tổng Điểm Chạm Mua Hàng</div>
          <div style={{ fontSize: '1.45rem', fontWeight: 800, color: '#1E40FF', marginTop: 4 }}>
            {purchaseEvents.length} cổng
          </div>
        </Card>
        <Card padding="1rem 1.2rem">
          <div style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 700 }}>Tổng Đơn Hàng Đã Đối Soát</div>
          <div style={{ fontSize: '1.45rem', fontWeight: 800, color: '#0F172A', marginTop: 4 }}>
            {totals.orders.toLocaleString('vi-VN')} đơn
          </div>
        </Card>
        <Card padding="1rem 1.2rem">
          <div style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 700 }}>Tổng Doanh Thu Ghi Nhận</div>
          <div style={{ fontSize: '1.45rem', fontWeight: 800, color: '#059669', marginTop: 4 }}>
            {formatVnd(totals.revenue)}
          </div>
        </Card>
        <Card padding="1rem 1.2rem">
          <div style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 700 }}>Giá Trị Trung Bình Đơn (AOV)</div>
          <div style={{ fontSize: '1.45rem', fontWeight: 800, color: '#0F172A', marginTop: 4 }}>
            {formatVnd(totals.aov)}
          </div>
        </Card>
      </div>

      {canCreate && (
        <Card
          title="Tạo Sự Kiện Mua Hàng & Đối Soát Doanh Thu (Purchase Webhook)"
          subtitle="Tự động đồng bộ doanh thu Website / POS / Cổng thanh toán vào Hồ sơ Khách hàng 360° & Growth Attribution"
        >
          <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr auto', gap: 10 }}>
            <input
              className="form-input"
              style={{ height: 44, background: '#FFFFFF', border: '1px solid #E2E8F0' }}
              placeholder="Tên sự kiện mua hàng (VD: Thanh toán Đơn hàng Website, Gia hạn Gói Năm)..."
              value={eventName}
              onChange={(e) => setEventName(e.target.value)}
            />
            <input
              className="form-input"
              style={{ height: 44, background: '#F8F9FA', border: '1px solid #E2E8F0', fontFamily: 'monospace' }}
              placeholder="purchase_key (Tùy chọn)..."
              value={eventKey}
              onChange={(e) => setEventKey(e.target.value.replace(/[^a-zA-Z0-9_]/g, '_').toLowerCase())}
            />
            <button
              type="button"
              disabled={creating}
              onClick={() => void handleCreate()}
              style={{
                height: 44,
                padding: '0 1.25rem',
                borderRadius: 12,
                border: 'none',
                background: '#1E40FF',
                color: '#FFFFFF',
                fontWeight: 700,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
              }}
            >
              <Plus size={15} /> {creating ? 'Đang tạo...' : 'Tạo Purchase Event'}
            </button>
          </div>
        </Card>
      )}

      <Table
        columns={columns}
        rows={purchaseEvents}
        rowKey={(r) => r.id}
        onRowClick={(r) => setSelectedEvent(r)}
        emptyTitle="Chưa có Sự kiện Mua hàng nào"
        emptyDescription="Tạo Purchase Event để ghi nhận giá trị đơn hàng VNĐ thực tế và đồng bộ vào Meta/Google Offline CAPI."
        emptyAction={
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: '0.8rem', color: '#059669', fontWeight: 700 }}>
            <ShoppingBag size={15} /> Khởi tạo Purchase Event ở thanh phía trên
          </div>
        }
      />

      <PurchaseEventDetailModal
        event={selectedEvent}
        onClose={() => setSelectedEvent(null)}
        onUpdated={onReload}
      />

      <ConfirmModal
        isOpen={Boolean(deleteTarget)}
        title="Xóa Sự kiện Mua hàng?"
        message={`Bạn có chắc muốn xóa "${deleteTarget?.event_name || ''}"? Dữ liệu lịch sử doanh thu trên Hồ sơ 360° vẫn được giữ nguyên.`}
        confirmText="Xóa Purchase Event"
        onConfirm={() => void handleDeleteConfirm()}
        onClose={() => setDeleteTarget(null)}
      />
    </div>
  );
};

export default PurchasesTab;
