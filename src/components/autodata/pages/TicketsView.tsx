import React, { useCallback, useEffect, useState } from 'react';
import { AlertCircle, CheckCircle2, RefreshCw, XCircle } from 'lucide-react';
import { apiRequest, formatShortDate, getErrorMessage } from '../autodataApi';

interface TicketItem {
  id: string;
  lead_name?: string;
  lead_phone?: string;
  reporter_name?: string;
  reporter_email?: string;
  reason: string;
  description?: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
}

interface TicketsViewProps {
  token: string;
  tenantSlug: string;
}

export const TicketsView: React.FC<TicketsViewProps> = ({ token, tenantSlug }) => {
  const [tickets, setTickets] = useState<TicketItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [toast, setToast] = useState<string | null>(null);

  const fetchTickets = useCallback(async () => {
    const res = await apiRequest<{ items?: TicketItem[] } | TicketItem[]>('/leads/tickets/list', { token, tenantSlug });
    return Array.isArray(res) ? res : res?.items || [];
  }, [token, tenantSlug]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const list = await fetchTickets();
        if (!cancelled) setTickets(list);
      } catch {
        if (!cancelled) setTickets([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [fetchTickets]);

  const reload = async () => {
    setLoading(true);
    try {
      setTickets(await fetchTickets());
    } finally {
      setLoading(false);
    }
  };

  const handleResolve = async (ticketId: string, decision: 'approved' | 'rejected') => {
    try {
      await apiRequest(`/leads/tickets/${ticketId}/resolve`, {
        method: 'POST',
        token,
        tenantSlug,
        body: {
          decision,
          resolution_note: decision === 'approved' ? 'Admin đã duyệt bù lượt 1-đổi-1' : 'Không đủ căn cứ lỗi',
        },
      });
      setToast(
        decision === 'approved'
          ? 'Đã duyệt Ticket & tự động cộng lượt bù vào vòng chia cho Sale/F1.'
          : 'Đã từ chối Ticket báo lỗi.'
      );
      void reload();
    } catch (err: unknown) {
      setToast(getErrorMessage(err, 'Không thể xử lý Ticket.'));
    }
  };

  const filtered = tickets.filter((t) => statusFilter === 'all' || t.status === statusFilter);

  return (
    <div className="space-y-5">
      <div
        data-tour="tickets-header"
        className="inkica-glass-card flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4"
      >
        <div className="flex items-center gap-2.5">
          <AlertCircle className="h-5 w-5 text-amber-500" />
          <div>
            <h1 className="text-lg font-bold text-slate-900">Ticket Báo Lỗi Data & Đền Bù Lượt</h1>
            <p className="text-xs text-slate-500">Duyệt ticket hợp lệ sẽ tự động cộng lượt bù vào Fair-Share Round-Robin</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {(['all', 'pending', 'approved', 'rejected'] as const).map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setStatusFilter(st)}
              className={`rounded-xl px-3 py-1.5 text-xs font-semibold ${
                statusFilter === st ? 'bg-[#1E40FF] text-white' : 'bg-slate-100 text-slate-600'
              }`}
            >
              {st === 'all' ? 'Tất cả' : st === 'pending' ? 'Chờ duyệt' : st === 'approved' ? 'Đã duyệt' : 'Từ chối'}
            </button>
          ))}
          <button
            type="button"
            onClick={() => void reload()}
            className="rounded-xl border border-slate-200 p-2 text-slate-600 hover:bg-slate-50"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {toast && (
        <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-2.5 text-xs font-semibold text-[#1E40FF]">
          {toast}
        </div>
      )}

      <div className="inkica-glass-card overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">Lead / SĐT</th>
                <th className="px-4 py-3">Người báo lỗi</th>
                <th className="px-4 py-3">Lý do báo lỗi</th>
                <th className="px-4 py-3">Trạng thái</th>
                <th className="px-4 py-3">Ngày gửi</th>
                <th className="px-4 py-3 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((tk) => (
                <tr key={tk.id} className="hover:bg-slate-50/70">
                  <td className="px-4 py-3">
                    <p className="font-semibold text-slate-900">{tk.lead_name || 'Khách hàng'}</p>
                    <p className="font-mono text-[11px] text-slate-500">{tk.lead_phone || '—'}</p>
                  </td>
                  <td className="px-4 py-3 font-medium text-slate-700">{tk.reporter_name || tk.reporter_email || 'Sale'}</td>
                  <td className="px-4 py-3">
                    <p className="font-semibold text-slate-800">{tk.reason}</p>
                    {tk.description && <p className="max-w-xs truncate text-[11px] text-slate-500">{tk.description}</p>}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                        tk.status === 'approved'
                          ? 'bg-emerald-50 text-emerald-700'
                          : tk.status === 'rejected'
                            ? 'bg-rose-50 text-rose-700'
                            : 'bg-amber-50 text-amber-700'
                      }`}
                    >
                      {tk.status === 'approved' ? 'Đã duyệt (+bù)' : tk.status === 'rejected' ? 'Từ chối' : 'Chờ duyệt'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-500">{formatShortDate(tk.created_at)}</td>
                  <td className="px-4 py-3 text-right">
                    {tk.status === 'pending' ? (
                      <div className="inline-flex gap-1.5">
                        <button
                          type="button"
                          onClick={() => void handleResolve(tk.id, 'approved')}
                          className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-2.5 py-1 font-semibold text-white hover:bg-emerald-700"
                        >
                          <CheckCircle2 className="h-3.5 w-3.5" /> Duyệt + Bù
                        </button>
                        <button
                          type="button"
                          onClick={() => void handleResolve(tk.id, 'rejected')}
                          className="inline-flex items-center gap-1 rounded-lg bg-rose-50 px-2.5 py-1 font-semibold text-rose-700 hover:bg-rose-100"
                        >
                          <XCircle className="h-3.5 w-3.5" /> Từ chối
                        </button>
                      </div>
                    ) : (
                      <span className="text-[11px] text-slate-400">Đã xử lý</span>
                    )}
                  </td>
                </tr>
              ))}
              {!loading && filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-slate-400">
                    Không có Ticket báo lỗi nào.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
