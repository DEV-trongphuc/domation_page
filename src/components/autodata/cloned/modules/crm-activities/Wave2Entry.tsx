import React, { useCallback, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  Calendar,
  CheckCircle2,
  List,
  Phone,
  Plus,
  RefreshCw,
  Search,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useEntitlement } from '../../contexts/EntitlementContext';
import { CrmContactsTabSkeleton, TableSkeleton } from '../../components/ui/Skeleton';
import type {
  CrmActivityRecord,
  CrmCompanyRecord,
  CrmContactRecord,
  CrmDealRecord,
  CrmStaffMember,
} from '../../drawers/crmTypes';
import { crmGet, crmMutate, formatDateTimeVi } from '../../drawers/crm360Api';
import {
  openGlobalCustomerDrawer,
  openGlobalDealDrawer,
  openGlobalTaskDrawer,
} from '../../drawers/drawerEvents';
import { FormattedMentionText } from '../../drawers/MentionNoteComposer';
import {
  ActivitiesMonthCalendar,
  CreateActivityModal,
} from './ActivitiesCalendarAndModal';

interface ActivitiesResponse {
  items: CrmActivityRecord[];
  total: number;
  summary: {
    total: number;
    done_count: number;
    overdue_count: number;
    by_type: Array<{ activity_type: string; count: number }>;
  };
  staff: CrmStaffMember[];
  contacts: CrmContactRecord[];
  deals: CrmDealRecord[];
  companies: CrmCompanyRecord[];
}

const TYPE_OPTIONS = [
  { key: '', label: 'Tất cả kênh' },
  { key: 'call', label: 'Cuộc gọi' },
  { key: 'zalo_connect', label: 'Zalo' },
  { key: 'email', label: 'Email' },
  { key: 'meeting', label: 'Gặp gỡ' },
  { key: 'task', label: 'Task' },
  { key: 'note', label: 'Ghi chú' },
];

export const CrmActivitiesPage: React.FC = () => {
  const { token, tenantSlug } = useAuth();
  const { can } = useEntitlement();
  const creds = useMemo(() => ({ token, tenantSlug }), [token, tenantSlug]);

  const [data, setData] = useState<ActivitiesResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
  const [showCreateModal, setShowCreateModal] = useState(false);

  const canEdit = can('leads', 'edit');

  const loadActivities = useCallback(async () => {
    setLoading(true);
    try {
      const res = await crmGet<ActivitiesResponse>('/activities', creds, {
        activity_type: typeFilter || undefined,
        status: statusFilter || undefined,
        search: search.trim() || undefined,
      });
      setData(res);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Không thể tải danh sách hoạt động CRM');
    } finally {
      setLoading(false);
    }
  }, [creds, typeFilter, statusFilter, search]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadActivities();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [loadActivities]);

  const handleToggleDone = async (act: CrmActivityRecord) => {
    if (!canEdit) return;
    try {
      await crmMutate(`/activities/${act.id}/toggle-done`, 'PATCH', creds);
      toast.success(act.status === 'done' ? 'Đã mở lại hoạt động' : 'Đã hoàn thành hoạt động!');
      await loadActivities();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Không thể đổi trạng thái hoạt động');
    }
  };

  if (loading && !data) {
    return <CrmContactsTabSkeleton />;
  }

  const items = data?.items || [];
  const summary = data?.summary;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
      {/* Header */}
      <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 16, padding: '1.15rem 1.35rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: '#0F172A', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Phone size={20} color="#1E40FF" /> Nhật ký Hoạt động Đa kênh, Cuộc gọi & Lịch hẹn CRM
          </h1>
          <p style={{ margin: '4px 0 0', fontSize: '0.82rem', color: '#64748B' }}>
            Đồng bộ thời gian thực mọi cuộc gọi, Zalo, Email, cuộc họp & công việc với Hồ sơ Khách hàng 360°
          </p>
        </div>

        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <div style={{ display: 'inline-flex', border: '1px solid #E2E8F0', borderRadius: 10, overflow: 'hidden' }}>
            <button type="button" onClick={() => setViewMode('list')} style={{ height: 42, padding: '0 12px', border: 'none', background: viewMode === 'list' ? '#EFF6FF' : '#FFFFFF', color: viewMode === 'list' ? '#1E40FF' : '#64748B', fontWeight: 700, fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: 5, cursor: 'pointer' }}>
              <List size={15} /> Dòng sự kiện
            </button>
            <button type="button" onClick={() => setViewMode('calendar')} style={{ height: 42, padding: '0 12px', border: 'none', background: viewMode === 'calendar' ? '#EFF6FF' : '#FFFFFF', color: viewMode === 'calendar' ? '#1E40FF' : '#64748B', fontWeight: 700, fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: 5, cursor: 'pointer' }}>
              <Calendar size={15} /> Lịch tháng
            </button>
          </div>

          <button type="button" onClick={() => void loadActivities()} style={{ height: 44, padding: '0 12px', borderRadius: 10, border: '1px solid #E2E8F0', background: '#FFFFFF', color: '#475569', cursor: 'pointer', display: 'inline-flex', alignItems: 'center' }}>
            <RefreshCw size={15} />
          </button>

          {canEdit && (
            <button type="button" onClick={() => setShowCreateModal(true)} style={{ height: 44, padding: '0 1.2rem', borderRadius: 10, border: 'none', background: '#1E40FF', color: '#FFFFFF', fontWeight: 700, fontSize: '0.83rem', display: 'inline-flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
              <Plus size={16} /> Ghi nhận Hoạt động
            </button>
          )}
        </div>
      </div>

      {/* Analytics Row */}
      {summary && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
            <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 14, padding: '1rem' }}>
              <div style={{ fontSize: '0.73rem', fontWeight: 700, color: '#64748B' }}>TỔNG HOẠT ĐỘNG</div>
              <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#0F172A', marginTop: 4 }}>{summary.total}</div>
            </div>
            <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 14, padding: '1rem' }}>
              <div style={{ fontSize: '0.73rem', fontWeight: 700, color: '#64748B' }}>HOÀN TẤT</div>
              <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#059669', marginTop: 4 }}>{summary.done_count}</div>
            </div>
            <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 14, padding: '1rem' }}>
              <div style={{ fontSize: '0.73rem', fontWeight: 700, color: '#64748B' }}>QUÁ HẠN SLA</div>
              <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#D97706', marginTop: 4 }}>{summary.overdue_count}</div>
            </div>
          </div>

          <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 14, padding: '0.85rem 1rem', height: 120 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={summary.by_type}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                <XAxis dataKey="activity_type" fontSize={11} stroke="#64748B" />
                <YAxis fontSize={11} stroke="#64748B" />
                <Tooltip />
                <Bar dataKey="count" fill="#1E40FF" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Filter Bar */}
      <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 14, padding: '0.75rem 1rem', display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
        {TYPE_OPTIONS.map((tp) => (
          <button
            key={tp.key}
            type="button"
            onClick={() => setTypeFilter(tp.key)}
            style={{
              height: 38,
              padding: '0 12px',
              borderRadius: 999,
              border: typeFilter === tp.key ? '1px solid #1E40FF' : '1px solid #E2E8F0',
              background: typeFilter === tp.key ? '#1E40FF' : '#FFFFFF',
              color: typeFilter === tp.key ? '#FFFFFF' : '#475569',
              fontSize: '0.79rem',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            {tp.label}
          </button>
        ))}

        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={{ height: 40, borderRadius: 10, border: '1px solid #E2E8F0', padding: '0 10px', fontSize: '0.8rem', background: '#FFFFFF', marginLeft: 'auto' }}>
          <option value="">Mọi trạng thái</option>
          <option value="planned">Kế hoạch</option>
          <option value="done">Hoàn tất</option>
          <option value="overdue">Quá hạn</option>
        </select>

        <div style={{ position: 'relative', minWidth: 220 }}>
          <Search size={14} color="#64748B" style={{ position: 'absolute', left: 10, top: 13 }} />
          <input placeholder="Tìm tiêu đề, nội dung..." value={search} onChange={(e) => setSearch(e.target.value)} style={{ height: 40, borderRadius: 10, border: '1px solid #E2E8F0', padding: '0 10px 0 32px', fontSize: '0.82rem' }} />
        </div>
      </div>

      {/* List or Calendar */}
      {loading ? (
        <TableSkeleton rows={5} cols={4} />
      ) : viewMode === 'calendar' ? (
        <ActivitiesMonthCalendar
          items={items}
          onSelectActivity={(a) => {
            if (a.task_id) openGlobalTaskDrawer(String(a.task_id));
            else if (a.lead_id) openGlobalCustomerDrawer(String(a.lead_id));
          }}
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {items.length === 0 ? (
            <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 16, padding: '2.5rem', textAlign: 'center', color: '#64748B' }}>
              Chưa có hoạt động nào phù hợp với bộ lọc hiện tại.
            </div>
          ) : (
            items.map((a) => (
              <div
                key={a.id}
                style={{
                  background: '#FFFFFF',
                  border: '1px solid #E2E8F0',
                  borderRadius: 14,
                  padding: '1rem 1.15rem',
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: 'space-between',
                  gap: 12,
                  flexWrap: 'wrap',
                }}
              >
                <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', flex: 1 }}>
                  <button
                    type="button"
                    onClick={() => void handleToggleDone(a)}
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: '50%',
                      border: a.status === 'done' ? 'none' : '1.5px solid #CBD5E1',
                      background: a.status === 'done' ? '#059669' : '#FFFFFF',
                      color: '#FFFFFF',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: canEdit ? 'pointer' : 'default',
                      marginTop: 2,
                    }}
                  >
                    {a.status === 'done' && <CheckCircle2 size={15} />}
                  </button>

                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      <strong
                        style={{
                          fontSize: '0.88rem',
                          color: a.status === 'done' ? '#94A3B8' : '#0F172A',
                          textDecoration: a.status === 'done' ? 'line-through' : 'none',
                        }}
                      >
                        {a.subject}
                      </strong>
                      <span style={{ fontSize: '0.7rem', fontWeight: 800, padding: '2px 8px', borderRadius: 999, background: '#EFF6FF', color: '#1E40FF' }}>
                        {a.activity_type}
                      </span>
                    </div>

                    {a.body && (
                      <div style={{ marginTop: 4, fontSize: '0.83rem', color: '#334155' }}>
                        <FormattedMentionText text={a.body} />
                      </div>
                    )}

                    <div style={{ marginTop: 6, display: 'flex', gap: 10, flexWrap: 'wrap', fontSize: '0.76rem' }}>
                      {a.lead_id && (
                        <button type="button" onClick={() => openGlobalCustomerDrawer(String(a.lead_id))} style={{ border: 'none', background: 'transparent', padding: 0, color: '#1E40FF', fontWeight: 700, cursor: 'pointer' }}>
                          KH: {a.contact_name || 'Mở Hồ sơ 360°'}
                        </button>
                      )}
                      {a.deal_id && (
                        <button type="button" onClick={() => openGlobalDealDrawer(String(a.deal_id))} style={{ border: 'none', background: 'transparent', padding: 0, color: '#1E40FF', fontWeight: 700, cursor: 'pointer' }}>
                          Deal: {a.deal_title}
                        </button>
                      )}
                      {a.task_id && (
                        <button type="button" onClick={() => openGlobalTaskDrawer(String(a.task_id))} style={{ border: 'none', background: 'transparent', padding: 0, color: '#1E40FF', fontWeight: 700, cursor: 'pointer' }}>
                          Mở Task chi tiết
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                <div style={{ textAlign: 'right', fontSize: '0.75rem', color: '#64748B' }}>
                  <div>{a.owner_name || 'Thành viên'}</div>
                  <div>{formatDateTimeVi(a.due_date || a.created_at)}</div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      <CreateActivityModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        contacts={data?.contacts || []}
        deals={data?.deals || []}
        companies={data?.companies || []}
        staff={data?.staff || []}
        creds={creds}
        onCreated={() => void loadActivities()}
      />
    </div>
  );
};

export default CrmActivitiesPage;
