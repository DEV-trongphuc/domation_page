import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { AlertTriangle, Clock, FolderKanban, LifeBuoy, Plus, RefreshCw, Search } from 'lucide-react';
import toast from 'react-hot-toast';
import { CustomModal } from '../../components/ui/CustomModal';
import { ScreenHelpButton } from '../../components/ui/ScreenHelpButton';
import { Badge, Card, FormCard, Table, type TableColumn } from '../../components/ui/AutoDataLoadingModal';
import { TableSkeleton } from '../../components/ui/Skeleton';
import { apiRequest, formatShortDate, getErrorMessage } from '../../../autodataApi';
import { useAuth } from '../../contexts/AuthContext';
import { useEntitlement } from '../../contexts/EntitlementContext';
import {
  formatRemainingCountdown,
  PRIORITY_BADGE_MAP,
  TICKET_STATUS_OPTIONS,
  type HelpdeskCommentRow,
  type HelpdeskTicketRow,
} from './projectsTypes';
import { TicketReplyDrawer } from './TicketReplyDrawer';

export interface SupportTicketsViewProps {
  tickets?: HelpdeskTicketRow[];
  standalone?: boolean;
  onRefresh?: () => Promise<void> | void;
}

export const SupportTicketsView: React.FC<SupportTicketsViewProps> = ({
  tickets: externalTickets,
  standalone = false,
  onRefresh,
}) => {
  const { token, tenantSlug } = useAuth();
  const { terminology, can } = useEntitlement();
  const navigate = useNavigate();
  const location = useLocation();
  const isStandalonePage = standalone || location.pathname === '/support-tickets';
  const canCreate = can('erp_projects_tasks', 'create');
  const canEdit = can('erp_projects_tasks', 'edit');

  const [internalTickets, setInternalTickets] = useState<HelpdeskTicketRow[]>([]);
  const [loading, setLoading] = useState(!externalTickets);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');

  const [createOpen, setCreateOpen] = useState(false);
  const [subject, setSubject] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerContact, setCustomerContact] = useState('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high' | 'urgent'>('high');
  const [respHours, setRespHours] = useState('2');
  const [resHours, setResHours] = useState('12');
  const [description, setDescription] = useState('');

  const [activeTicket, setActiveTicket] = useState<HelpdeskTicketRow | null>(null);
  const [comments, setComments] = useState<HelpdeskCommentRow[]>([]);
  const [loadingDrawer, setLoadingDrawer] = useState(false);

  const loadStandaloneTickets = useCallback(async () => {
    const res = await apiRequest<{ items: HelpdeskTicketRow[] }>('/projects/tickets/list', { token, tenantSlug });
    return res.items || [];
  }, [token, tenantSlug]);

  useEffect(() => {
    if (externalTickets) return undefined;
    let cancelled = false;
    (async () => {
      try {
        const items = await loadStandaloneTickets();
        if (!cancelled) setInternalTickets(items);
      } catch (err) {
        if (!cancelled) toast.error(getErrorMessage(err, 'Không thể tải danh sách Ticket CSKH SLA'));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [externalTickets, loadStandaloneTickets]);

  const tickets = externalTickets || internalTickets;

  const triggerReload = async () => {
    if (onRefresh) {
      await onRefresh();
      return;
    }
    setLoading(true);
    try {
      setInternalTickets(await loadStandaloneTickets());
    } catch (err) {
      toast.error(getErrorMessage(err, 'Không thể làm mới Ticket CSKH'));
    } finally {
      setLoading(false);
    }
  };

  const filteredTickets = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return tickets.filter((tk) => {
      if (statusFilter !== 'all' && tk.status !== statusFilter) return false;
      if (priorityFilter !== 'all' && tk.priority !== priorityFilter) return false;
      if (q && !`${tk.ticket_code} ${tk.subject} ${tk.customer_name || ''} ${tk.lead_name || ''}`.toLowerCase().includes(q)) {
        return false;
      }
      return true;
    });
  }, [tickets, statusFilter, priorityFilter, searchQuery]);

  const stats = useMemo(() => {
    const total = tickets.length;
    const open = tickets.filter((t) => !['resolved', 'closed'].includes(t.status)).length;
    const breached = tickets.filter((t) => t.sla_breached).length;
    const onTimePct = total > 0 ? Math.round(((total - breached) / total) * 100) : 100;
    return { total, open, breached, onTimePct };
  }, [tickets]);

  const handleCreateTicket = async () => {
    if (!subject.trim()) {
      toast.error('Vui lòng nhập tiêu đề yêu cầu hỗ trợ');
      return;
    }
    try {
      await apiRequest('/projects/tickets', {
        method: 'POST',
        token,
        tenantSlug,
        body: {
          subject: subject.trim(),
          customer_name: customerName.trim() || undefined,
          customer_contact: customerContact.trim() || undefined,
          priority,
          sla_response_hours: Number(respHours || 2),
          sla_resolution_hours: Number(resHours || 12),
          description: description.trim() || undefined,
        },
      });
      toast.success('Đã tạo Ticket CSKH kèm đồng hồ cam kết SLA');
      setSubject('');
      setDescription('');
      setCreateOpen(false);
      await triggerReload();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Không thể tạo Ticket CSKH'));
    }
  };

  const openTicketDrawer = async (ticket: HelpdeskTicketRow) => {
    setActiveTicket(ticket);
    setLoadingDrawer(true);
    try {
      const res = await apiRequest<{ items: HelpdeskCommentRow[] }>(`/projects/tickets/${ticket.id}/comments`, {
        token,
        tenantSlug,
      });
      setComments(res.items || []);
    } catch (err) {
      toast.error(getErrorMessage(err, 'Không thể tải lịch sử phản hồi Ticket'));
    } finally {
      setLoadingDrawer(false);
    }
  };

  const columns: ReadonlyArray<TableColumn<HelpdeskTicketRow>> = [
    {
      key: 'subject',
      header: 'Mã Ticket & Yêu cầu CSKH',
      render: (r) => (
        <div>
          <div style={{ fontWeight: 700, color: '#0F172A' }}>{r.subject}</div>
          <div style={{ fontSize: '0.75rem', color: '#64748B' }}>{r.ticket_code} • {r.customer_name || r.lead_name || terminology.customerLabel}</div>
        </div>
      ),
    },
    {
      key: 'priority',
      header: 'Ưu tiên',
      render: (r) => {
        const meta = PRIORITY_BADGE_MAP[r.priority] || PRIORITY_BADGE_MAP.medium;
        return <Badge tone={meta.tone}>{meta.label}</Badge>;
      },
    },
    {
      key: 'sla',
      header: 'Cam kết SLA & Đếm ngược',
      render: (r) => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <Badge tone={r.sla_breached ? 'danger' : r.status === 'resolved' ? 'success' : 'primary'} icon={r.sla_breached ? <AlertTriangle size={12} /> : <Clock size={12} />}>
            {formatRemainingCountdown(r.resolution_remaining_minutes, r.status)}
          </Badge>
          <span style={{ fontSize: '0.72rem', color: '#64748B' }}>Phản hồi {r.sla_response_hours}h • Xử lý {r.sla_resolution_hours}h</span>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Trạng thái',
      render: (r) => {
        const st = TICKET_STATUS_OPTIONS.find((o) => o.value === r.status);
        return <Badge tone={st?.tone || 'info'}>{st?.label || r.status}</Badge>;
      },
    },
    { key: 'date', header: 'Ngày mở', render: (r) => formatShortDate(r.created_at) },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {isStandalonePage && (
        <Card padding="1.2rem 1.4rem" style={{ background: 'linear-gradient(135deg, #FFFFFF 0%, #F8FAFF 100%)' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 46, height: 46, borderRadius: 14, background: '#EEF2FF', border: '1px solid #DBEAFE', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#1E40FF' }}>
                <LifeBuoy size={23} />
              </div>
              <div>
                <h1 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0F172A', margin: 0 }}>
                  Helpdesk CSKH & Khiếu Nại Hậu Mãi Theo Cam Kết SLA
                </h1>
                <p style={{ fontSize: '0.8rem', color: '#64748B', margin: '3px 0 0' }}>
                  Tách biệt hoàn toàn với Ticket bù số Sale • Ghi nhận phản hồi công khai & ghi chú nội bộ
                </p>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <button type="button" onClick={() => navigate('/erp/projects')} className="btn secondary" style={{ height: 44, color: '#1E40FF', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <FolderKanban size={15} /> Mở Dự án Kanban & Gantt
              </button>
              <button type="button" onClick={() => void triggerReload()} className="btn secondary" style={{ height: 44 }}>
                <RefreshCw size={15} />
              </button>
              <ScreenHelpButton screenKey="support_tickets" />
            </div>
          </div>
        </Card>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '0.9rem' }}>
        <FormCard title={`${stats.total} Ticket CSKH`} description="Tổng yêu cầu hậu mãi ghi nhận" badge={<Badge tone="primary">SLA Desk</Badge>} />
        <FormCard title={`${stats.open} Đang mở`} description="Cần chuyên viên CSKH phản hồi" badge={<Badge tone="info">Active</Badge>} />
        <FormCard title={`${stats.breached} Vi phạm SLA`} description="Quá hạn phản hồi hoặc xử lý" badge={<Badge tone={stats.breached > 0 ? 'danger' : 'success'}>{stats.onTimePct}% đúng hạn</Badge>} />
      </div>

      <Card padding="0.9rem 1.15rem">
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, flex: '1 1 420px', alignItems: 'center' }}>
            <div style={{ position: 'relative', flex: '1 1 220px' }}>
              <Search size={15} color="#64748B" style={{ position: 'absolute', left: 12, top: 14 }} />
              <input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Tìm theo mã CSKH, tiêu đề, tên khách..." style={{ width: '100%', height: 44, borderRadius: 12, border: '1px solid #E2E8F0', padding: '0 12px 0 36px' }} />
            </div>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={{ height: 44, borderRadius: 12, border: '1px solid #E2E8F0', padding: '0 12px', background: '#FFFFFF' }}>
              <option value="all">Tất cả trạng thái</option>
              {TICKET_STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            <select value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)} style={{ height: 44, borderRadius: 12, border: '1px solid #E2E8F0', padding: '0 12px', background: '#FFFFFF' }}>
              <option value="all">Mọi mức ưu tiên</option>
              <option value="urgent">Khẩn cấp</option><option value="high">Cao</option><option value="medium">Trung bình</option><option value="low">Thấp</option>
            </select>
          </div>
          {canCreate && (
            <button type="button" onClick={() => setCreateOpen(true)} style={{ height: 44, padding: '0 16px', borderRadius: 12, border: 'none', background: '#1E40FF', color: '#FFFFFF', fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <Plus size={16} /> Mở Ticket CSKH Mới
            </button>
          )}
        </div>
      </Card>

      {loading && !externalTickets ? (
        <TableSkeleton rows={5} cols={5} />
      ) : (
        <Table columns={columns} rows={filteredTickets} rowKey={(r) => r.id} onRowClick={(r) => void openTicketDrawer(r)} emptyTitle="Chưa có Ticket hỗ trợ CSKH nào" emptyDescription="Mọi yêu cầu bảo hành, hỗ trợ kỹ thuật và hậu mãi khách hàng sẽ được theo dõi SLA tại đây." />
      )}

      <TicketReplyDrawer
        ticket={activeTicket}
        comments={comments}
        loading={loadingDrawer}
        canEdit={canEdit}
        onClose={() => setActiveTicket(null)}
        onTicketUpdated={setActiveTicket}
        onCommentAdded={(c) => setComments((prev) => [...prev, c])}
        onRefreshList={triggerReload}
      />

      <CustomModal isOpen={createOpen} onClose={() => setCreateOpen(false)} title="Mở Ticket Hỗ Trợ CSKH & Cam Kết SLA" width={540}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Tiêu đề yêu cầu hỗ trợ..." style={{ height: 44, borderRadius: 12, border: '1px solid #E2E8F0', padding: '0 12px' }} />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <input value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="Tên khách hàng / Doanh nghiệp" style={{ height: 44, borderRadius: 12, border: '1px solid #E2E8F0', padding: '0 12px' }} />
            <input value={customerContact} onChange={(e) => setCustomerContact(e.target.value)} placeholder="SĐT / Email liên hệ" style={{ height: 44, borderRadius: 12, border: '1px solid #E2E8F0', padding: '0 12px' }} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
            <select value={priority} onChange={(e) => setPriority(e.target.value as 'low' | 'medium' | 'high' | 'urgent')} style={{ height: 44, borderRadius: 12, border: '1px solid #E2E8F0', padding: '0 12px' }}>
              <option value="urgent">Khẩn cấp</option><option value="high">Cao</option><option value="medium">Trung bình</option><option value="low">Thấp</option>
            </select>
            <input type="number" value={respHours} onChange={(e) => setRespHours(e.target.value)} placeholder="SLA phản hồi (giờ)" style={{ height: 44, borderRadius: 12, border: '1px solid #E2E8F0', padding: '0 12px' }} />
            <input type="number" value={resHours} onChange={(e) => setResHours(e.target.value)} placeholder="SLA xử lý (giờ)" style={{ height: 44, borderRadius: 12, border: '1px solid #E2E8F0', padding: '0 12px' }} />
          </div>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} placeholder="Mô tả chi tiết tình trạng khách hàng gặp phải..." style={{ borderRadius: 12, border: '1px solid #E2E8F0', padding: '10px 12px' }} />
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <button type="button" onClick={() => setCreateOpen(false)} className="btn secondary" style={{ height: 44 }}>Hủy</button>
            <button type="button" onClick={() => void handleCreateTicket()} style={{ height: 44, padding: '0 18px', borderRadius: 12, border: 'none', background: '#1E40FF', color: '#FFFFFF', fontWeight: 700, cursor: 'pointer' }}>Tạo Ticket SLA</button>
          </div>
        </div>
      </CustomModal>
    </div>
  );
};

export default SupportTicketsView;
