import React, { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { CheckSquare, ExternalLink, LifeBuoy, Plus } from 'lucide-react';
import { TableSkeleton } from '../../components/ui/Skeleton';
import type {
  CrmActivityRecord,
  HelpdeskTicketRecord,
  WorkspaceTaskRecord,
} from '../crmTypes';
import { crmGet, crmMutate, formatDateTimeVi, type CrmAuthCreds } from '../crm360Api';
import { openGlobalTaskDrawer, openGlobalTicketDrawer } from '../drawerEvents';

export interface TasksTicketsTabProps {
  contactId: string;
  contactName: string;
  canEdit: boolean;
  creds: CrmAuthCreds;
}

export const TasksTicketsTab: React.FC<TasksTicketsTabProps> = ({
  contactId,
  contactName,
  canEdit,
  creds,
}) => {
  const [tasks, setTasks] = useState<WorkspaceTaskRecord[]>([]);
  const [activities, setActivities] = useState<CrmActivityRecord[]>([]);
  const [tickets, setTickets] = useState<HelpdeskTicketRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTicketSubject, setNewTicketSubject] = useState('');

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await crmGet<{
        tasks: WorkspaceTaskRecord[];
        activities: CrmActivityRecord[];
        tickets: HelpdeskTicketRecord[];
      }>(`/contacts/${contactId}/tasks-tickets`, creds);
      setTasks(res.tasks || []);
      setActivities(res.activities || []);
      setTickets(res.tickets || []);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Không thể tải Công việc & Hỗ trợ');
    } finally {
      setLoading(false);
    }
  }, [contactId, creds]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadData();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [loadData]);

  const handleQuickTask = async () => {
    if (!newTaskTitle.trim()) return;
    try {
      await crmMutate('/workspace/tasks', 'POST', creds, {
        title: newTaskTitle.trim(),
        lead_id: contactId,
        category: 'customer',
        priority: 'high',
      });
      toast.success('Đã tạo Công việc gắn với khách hàng');
      setNewTaskTitle('');
      await loadData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Không thể tạo công việc');
    }
  };

  const handleQuickTicket = async () => {
    if (!newTicketSubject.trim()) return;
    try {
      await crmMutate('/tickets', 'POST', creds, {
        subject: newTicketSubject.trim(),
        lead_id: contactId,
        customer_name: contactName,
        priority: 'medium',
      });
      toast.success('Đã mở Phiếu Hỗ trợ SLA mới');
      setNewTicketSubject('');
      await loadData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Không thể mở ticket');
    }
  };

  if (loading) {
    return <TableSkeleton rows={4} cols={3} />;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
      {canEdit && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 12 }}>
          <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 14, padding: '1rem', display: 'flex', gap: 8 }}>
            <input
              placeholder="Giao việc chăm sóc khách hàng..."
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              style={{ flex: 1, height: 44, borderRadius: 10, border: '1px solid #E2E8F0', padding: '0 12px', fontSize: '0.83rem' }}
            />
            <button
              type="button"
              onClick={() => void handleQuickTask()}
              style={{
                height: 44,
                padding: '0 14px',
                borderRadius: 10,
                border: 'none',
                background: '#1E40FF',
                color: '#FFFFFF',
                fontWeight: 700,
                fontSize: '0.8rem',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                cursor: 'pointer',
              }}
            >
              <Plus size={14} /> Tạo Task
            </button>
          </div>

          <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 14, padding: '1rem', display: 'flex', gap: 8 }}>
            <input
              placeholder="Mở phiếu Helpdesk / CSKH SLA..."
              value={newTicketSubject}
              onChange={(e) => setNewTicketSubject(e.target.value)}
              style={{ flex: 1, height: 44, borderRadius: 10, border: '1px solid #E2E8F0', padding: '0 12px', fontSize: '0.83rem' }}
            />
            <button
              type="button"
              onClick={() => void handleQuickTicket()}
              style={{
                height: 44,
                padding: '0 14px',
                borderRadius: 10,
                border: '1px solid #DBEAFE',
                background: '#EFF6FF',
                color: '#1E40FF',
                fontWeight: 700,
                fontSize: '0.8rem',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                cursor: 'pointer',
              }}
            >
              <Plus size={14} /> Mở Ticket
            </button>
          </div>
        </div>
      )}

      {/* Workspace Tasks */}
      <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 16, padding: '1.2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
          <CheckSquare size={17} color="#1E40FF" />
          <strong style={{ fontSize: '0.9rem', color: '#0F172A' }}>
            Công việc & Hoạt động ({tasks.length + activities.length})
          </strong>
        </div>
        {tasks.length === 0 ? (
          <div style={{ fontSize: '0.82rem', color: '#64748B' }}>Chưa có công việc nào gắn với khách hàng.</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {tasks.map((t) => (
              <div
                key={t.id}
                style={{
                  padding: '10px 12px',
                  borderRadius: 10,
                  border: '1px solid #E2E8F0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 10,
                }}
              >
                <div>
                  <button
                    type="button"
                    onClick={() => openGlobalTaskDrawer(t)}
                    style={{
                      border: 'none',
                      background: 'transparent',
                      padding: 0,
                      color: '#1E40FF',
                      fontWeight: 700,
                      fontSize: '0.85rem',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 5,
                    }}
                  >
                    {t.title} <ExternalLink size={13} />
                  </button>
                  <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: 2 }}>
                    Phụ trách: {t.assignee_name || '—'} • Tiến độ: {t.progress_pct}%
                  </div>
                </div>
                <span
                  style={{
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: 999,
                    background: t.status_key === 'done' ? '#ECFDF5' : '#EFF6FF',
                    color: t.status_key === 'done' ? '#059669' : '#1E40FF',
                  }}
                >
                  {t.status_key}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Helpdesk Support Tickets */}
      <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 16, padding: '1.2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
          <LifeBuoy size={17} color="#1E40FF" />
          <strong style={{ fontSize: '0.9rem', color: '#0F172A' }}>
            Phiếu Hỗ trợ & Khiếu nại SLA ({tickets.length})
          </strong>
        </div>
        {tickets.length === 0 ? (
          <div style={{ fontSize: '0.82rem', color: '#64748B' }}>Chưa phát sinh phiếu hỗ trợ CSKH.</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {tickets.map((tk) => (
              <div
                key={tk.id}
                style={{
                  padding: '10px 12px',
                  borderRadius: 10,
                  border: '1px solid #E2E8F0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 10,
                }}
              >
                <div>
                  <button
                    type="button"
                    onClick={() => openGlobalTicketDrawer(tk)}
                    style={{
                      border: 'none',
                      background: 'transparent',
                      padding: 0,
                      color: '#1E40FF',
                      fontWeight: 700,
                      fontSize: '0.85rem',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 5,
                    }}
                  >
                    [{tk.ticket_code}] {tk.subject} <ExternalLink size={13} />
                  </button>
                  <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: 2 }}>
                    Hạn SLA xử lý: {formatDateTimeVi(tk.resolution_due_at)}
                  </div>
                </div>
                <span
                  style={{
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: 999,
                    background: '#EFF6FF',
                    color: '#1E40FF',
                  }}
                >
                  {tk.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default TasksTicketsTab;
