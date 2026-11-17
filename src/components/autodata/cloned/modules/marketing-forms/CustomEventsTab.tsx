import React, { useMemo, useState } from 'react';
import { Code2, Plus, Trash2, Zap } from 'lucide-react';
import toast from 'react-hot-toast';
import { Badge, Card, Table, type TableColumn } from '../../components/ui/AutoDataLoadingModal';
import { ConfirmModal } from '../../components/ui/ConfirmModal';
import { apiRequest, formatShortDate, getErrorMessage } from '../../../autodataApi';
import { useAuth } from '../../contexts/AuthContext';
import { useEntitlement } from '../../contexts/EntitlementContext';
import { CustomEventDetailModal } from './CustomEventDetailModal';
import type { CustomEventDto } from './types';

interface CustomEventsTabProps {
  events: CustomEventDto[];
  onReload: () => Promise<void>;
}

export const CustomEventsTab: React.FC<CustomEventsTabProps> = ({ events, onReload }) => {
  const { token, tenantSlug } = useAuth();
  const { can } = useEntitlement();
  const canCreate = can('forms_triggers', 'create');
  const canDelete = can('forms_triggers', 'delete');

  const [eventName, setEventName] = useState('');
  const [eventKey, setEventKey] = useState('');
  const [description, setDescription] = useState('');
  const [creating, setCreating] = useState(false);

  const [selectedEvent, setSelectedEvent] = useState<CustomEventDto | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<CustomEventDto | null>(null);

  const customEvents = useMemo(
    () => events.filter((e) => e.event_category !== 'purchase'),
    [events]
  );

  const handleCreate = async () => {
    if (!eventName.trim()) {
      toast.error('Vui lòng nhập tên Custom Event.');
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
          event_category: 'custom',
          description: description.trim() || undefined,
          schema_json: {
            phone: 'string (optional if email provided)',
            email: 'string (optional if phone provided)',
            payload: 'object',
          },
        },
      });
      setEventName('');
      setEventKey('');
      setDescription('');
      toast.success('Đã tạo định nghĩa Custom Event mới!');
      await onReload();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Không thể tạo Custom Event.'));
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
      toast.success('Đã xóa Custom Event.');
      setDeleteTarget(null);
      await onReload();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Không thể xóa Custom Event.'));
    }
  };

  const columns: Array<TableColumn<CustomEventDto>> = [
    {
      key: 'name',
      header: 'Tên Sự Kiện Hành Vi & Mã API',
      render: (r) => (
        <div>
          <div style={{ fontWeight: 700, color: '#0F172A' }}>{r.event_name}</div>
          <code style={{ fontSize: '0.74rem', color: '#1E40FF' }}>{r.event_key}</code>
          {r.description && (
            <div style={{ fontSize: '0.73rem', color: '#64748B', marginTop: 2 }}>{r.description}</div>
          )}
        </div>
      ),
    },
    {
      key: 'type',
      header: 'Cơ Chế Kích Hoạt',
      render: () => <Badge tone="primary">Webhook + Automation Flow</Badge>,
    },
    {
      key: 'count',
      header: 'Lượt Kích Hoạt',
      numeric: true,
      render: (r) => (
        <span style={{ fontWeight: 800, color: '#0F172A' }}>
          {r.trigger_count.toLocaleString('vi-VN')}
        </span>
      ),
    },
    {
      key: 'created',
      header: 'Ngày Tạo',
      render: (r) => <span style={{ fontSize: '0.76rem', color: '#64748B' }}>{formatShortDate(r.created_at)}</span>,
    },
    {
      key: 'actions',
      header: 'Webhook & Kiểm Thử',
      align: 'right',
      render: (r) => (
        <div style={{ display: 'inline-flex', gap: 6 }}>
          <button
            type="button"
            onClick={() => setSelectedEvent(r)}
            className="btn secondary sm"
            style={{ height: 36, color: '#1E40FF', display: 'inline-flex', alignItems: 'center', gap: 5 }}
          >
            <Code2 size={13} /> Webhook, Secret & Test
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
      {canCreate && (
        <Card
          title="Định Nghĩa Sự Kiện Hành Vi Tùy Chỉnh (Custom Behavioral Events)"
          subtitle="Bắn sự kiện từ App Mobile, SaaS Backend hoặc Website để cộng Lead Score (+10) & kích hoạt Automation Flow"
        >
          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.9fr 1.2fr auto', gap: 10 }}>
            <input
              className="form-input"
              style={{ height: 44, background: '#FFFFFF', border: '1px solid #E2E8F0' }}
              placeholder="Tên sự kiện (VD: Xem Demo Bảng Giá, Đăng ký Dùng thử)..."
              value={eventName}
              onChange={(e) => setEventName(e.target.value)}
            />
            <input
              className="form-input"
              style={{ height: 44, background: '#F8F9FA', border: '1px solid #E2E8F0', fontFamily: 'monospace' }}
              placeholder="event_key (Tùy chọn)..."
              value={eventKey}
              onChange={(e) => setEventKey(e.target.value.replace(/[^a-zA-Z0-9_]/g, '_').toLowerCase())}
            />
            <input
              className="form-input"
              style={{ height: 44, background: '#FFFFFF', border: '1px solid #E2E8F0' }}
              placeholder="Mô tả ngữ cảnh kích hoạt..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
            <button
              type="button"
              disabled={creating}
              onClick={() => void handleCreate()}
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
                whiteSpace: 'nowrap',
              }}
            >
              <Plus size={15} /> {creating ? 'Đang tạo...' : 'Tạo Custom Event'}
            </button>
          </div>
        </Card>
      )}

      <Table
        columns={columns}
        rows={customEvents}
        rowKey={(r) => r.id}
        onRowClick={(r) => setSelectedEvent(r)}
        emptyTitle="Chưa có Custom Event nào"
        emptyDescription="Tạo sự kiện hành vi tùy chỉnh để nhận tín hiệu Webhook bảo mật với X-Domation-Webhook-Secret."
        emptyAction={
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: '0.8rem', color: '#1E40FF', fontWeight: 700 }}>
            <Zap size={15} /> Điền tên sự kiện ở khung phía trên để khởi tạo ngay
          </div>
        }
      />

      <CustomEventDetailModal
        event={selectedEvent}
        onClose={() => setSelectedEvent(null)}
        onUpdated={onReload}
      />

      <ConfirmModal
        isOpen={Boolean(deleteTarget)}
        title="Xóa Custom Event?"
        message={`Xóa sự kiện "${deleteTarget?.event_name || ''}" sẽ ngắt kết nối các Webhook đang bắn về khóa "${deleteTarget?.event_key || ''}".`}
        confirmText="Xóa Sự Kiện"
        onConfirm={() => void handleDeleteConfirm()}
        onClose={() => setDeleteTarget(null)}
      />
    </div>
  );
};

export default CustomEventsTab;
