import React, { useCallback, useEffect, useState } from 'react';
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Download,
  EyeOff,
  MessageSquarePlus,
  RefreshCw,
  Search,
  Send,
  UserCheck,
  X,
} from 'lucide-react';
import { apiRequest, formatShortDate, getErrorMessage } from '../autodataApi';

interface LeadRow {
  id: string;
  name: string;
  phone: string;
  email?: string | null;
  source: string;
  campaign?: string | null;
  pii_masked?: boolean;
  is_accepted?: boolean;
  assigned_sale?: { id: string; name: string } | null;
  stage?: { id: string; stage_name: string } | null;
  created_at: string;
}

interface TimelineEvent {
  id: string;
  title?: string;
  event_type: string;
  content?: string;
  created_at: string;
}

interface DataListViewProps {
  token: string;
  tenantSlug: string;
  stages: Array<{ id: string; stage_name: string; color_hex: string }>;
  consultants: Array<{ id: string; full_name: string; email: string }>;
  initialSearch?: string;
}

export const DataListView: React.FC<DataListViewProps> = ({
  token,
  tenantSlug,
  stages,
  consultants,
  initialSearch = '',
}) => {
  const [items, setItems] = useState<LeadRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const limit = 25;

  const [search, setSearch] = useState(initialSearch);
  const [statusFilter, setStatusFilter] = useState('');
  const [stageFilter, setStageFilter] = useState('');
  const [consultantFilter, setConsultantFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<string | null>(null);

  const [selectedLead, setSelectedLead] = useState<LeadRow | null>(null);
  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);
  const [noteText, setNoteText] = useState('');
  const [reassignTarget, setReassignTarget] = useState('');

  const fetchLeads = useCallback(async () => {
    const qs = new URLSearchParams({
      limit: String(limit),
      page: String(page + 1),
    });
    if (search.trim()) qs.set('search', search.trim());
    if (statusFilter) qs.set('status', statusFilter);
    if (stageFilter) qs.set('stage_id', stageFilter);
    if (consultantFilter) qs.set('assigned_to', consultantFilter);

    return apiRequest<{ items: LeadRow[]; total?: number; pagination?: { total: number } }>(`/leads?${qs.toString()}`, {
      token,
      tenantSlug,
    });
  }, [token, tenantSlug, page, search, statusFilter, stageFilter, consultantFilter]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetchLeads();
        if (!cancelled) {
          setItems(res.items || []);
          setTotal(res.pagination?.total ?? res.total ?? 0);
        }
      } catch {
        if (!cancelled) setItems([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [fetchLeads]);

  const reload = async () => {
    setLoading(true);
    try {
      const res = await fetchLeads();
      setItems(res.items || []);
      setTotal(res.pagination?.total ?? res.total ?? 0);
    } finally {
      setLoading(false);
    }
  };

  const openDrawer = async (lead: LeadRow) => {
    setSelectedLead(lead);
    setReassignTarget(lead.assigned_sale?.id || '');
    try {
      const ev = await apiRequest<TimelineEvent[]>(`/leads/${lead.id}/timeline`, { token, tenantSlug });
      setTimeline(Array.isArray(ev) ? ev : []);
    } catch {
      setTimeline([]);
    }
  };

  const handleAccept = async (leadId: string) => {
    try {
      await apiRequest(`/leads/${leadId}/accept`, { method: 'POST', token, tenantSlug });
      setToast('Đã xác nhận tiếp nhận Lead.');
      void reload();
    } catch (err: unknown) {
      setToast(getErrorMessage(err, 'Không thể tiếp nhận.'));
    }
  };

  const handleStageChange = async (leadId: string, stageId: string) => {
    try {
      await apiRequest(`/leads/${leadId}/stage`, {
        method: 'PATCH',
        token,
        tenantSlug,
        body: { stage_id: stageId },
      });
      setToast('Đã cập nhật giai đoạn & đồng bộ tín hiệu CAPI.');
      void reload();
    } catch (err: unknown) {
      setToast(getErrorMessage(err, 'Không thể cập nhật giai đoạn.'));
    }
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLead || !noteText.trim()) return;
    try {
      await apiRequest(`/leads/${selectedLead.id}/timeline/notes`, {
        method: 'POST',
        token,
        tenantSlug,
        body: { title: 'Ghi chú chăm sóc', content: noteText.trim(), note_type: 'NOTE' },
      });
      setNoteText('');
      const ev = await apiRequest<TimelineEvent[]>(`/leads/${selectedLead.id}/timeline`, { token, tenantSlug });
      setTimeline(Array.isArray(ev) ? ev : []);
    } catch (err: unknown) {
      setToast(getErrorMessage(err, 'Lỗi lưu ghi chú.'));
    }
  };

  const handleReassign = async () => {
    if (!selectedLead || !reassignTarget) return;
    try {
      await apiRequest(`/leads/${selectedLead.id}/reassign`, {
        method: 'POST',
        token,
        tenantSlug,
        body: { target_user_id: reassignTarget },
      });
      setToast('Đã điều chuyển Lead thành công.');
      setSelectedLead(null);
      void reload();
    } catch (err: unknown) {
      setToast(getErrorMessage(err, 'Không thể điều chuyển.'));
    }
  };

  const handleExportCsv = async () => {
    try {
      const csv = await apiRequest<string>('/leads/export', { token, tenantSlug, isCsv: true });
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `autodata-${tenantSlug}-leads.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err: unknown) {
      setToast(getErrorMessage(err, 'Bạn không có quyền xuất CSV.'));
    }
  };

  const totalPages = Math.max(1, Math.ceil(total / limit));

  return (
    <div className="space-y-4">
      {toast && (
        <div className="flex items-center justify-between rounded-2xl border border-blue-200 bg-blue-50 px-4 py-2.5 text-xs font-semibold text-[#1E40FF]">
          <span>{toast}</span>
          <button type="button" onClick={() => setToast(null)}>
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      <div
        data-tour="datalist-filters"
        className="inkica-glass-card flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4"
      >
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(0); }}
              placeholder="Tìm tên, SĐT, email..."
              className="w-56 rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-xs outline-none focus:border-[#1E40FF]"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(0); }}
            className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-700"
          >
            <option value="">Tất cả trạng thái</option>
            <option value="assigned">Đã chia vòng</option>
            <option value="unassigned_pending">Chờ chia</option>
            <option value="recalled">Đã thu hồi / Ticket</option>
            <option value="archived">Lưu trữ (Silent/Dup)</option>
          </select>

          <select
            value={stageFilter}
            onChange={(e) => { setStageFilter(e.target.value); setPage(0); }}
            className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-700"
          >
            <option value="">Tất cả giai đoạn</option>
            {stages.map((s) => (
              <option key={s.id} value={s.id}>
                {s.stage_name}
              </option>
            ))}
          </select>

          <select
            value={consultantFilter}
            onChange={(e) => { setConsultantFilter(e.target.value); setPage(0); }}
            className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-700"
          >
            <option value="">Tất cả Sale / F1</option>
            {consultants.map((c) => (
              <option key={c.id} value={c.id}>
                {c.full_name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => void handleExportCsv()}
            className="ql-btn-outline inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
          >
            <Download className="h-3.5 w-3.5" /> Xuất CSV
          </button>
          <button
            type="button"
            onClick={() => void reload()}
            className="ql-btn-outline inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      <div
        data-tour="datalist-table"
        className="inkica-glass-card overflow-hidden rounded-2xl border border-slate-200 bg-white"
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-bold uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">Khách hàng</th>
                <th className="px-4 py-3">Số điện thoại</th>
                <th className="px-4 py-3">Nguồn / Chiến dịch</th>
                <th className="px-4 py-3">Sale / Đại lý F1</th>
                <th className="px-4 py-3">Giai đoạn</th>
                <th className="px-4 py-3">Tiếp nhận</th>
                <th className="px-4 py-3">Thời gian</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {items.map((lead) => (
                <tr
                  key={lead.id}
                  onClick={() => void openDrawer(lead)}
                  className="cursor-pointer transition hover:bg-blue-50/30"
                >
                  <td className="px-4 py-3">
                    <p className="font-semibold text-slate-900">{lead.name}</p>
                    {lead.email && <p className="text-[11px] text-slate-400">{lead.email}</p>}
                  </td>
                  <td className="px-4 py-3 font-mono font-semibold text-slate-800">
                    <span className="inline-flex items-center gap-1">
                      {lead.phone}
                      {lead.pii_masked && <EyeOff className="h-3 w-3 text-amber-500" />}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="rounded-md bg-slate-100 px-2 py-0.5 font-medium text-slate-700">
                      {lead.source}
                    </span>
                    {lead.campaign && <p className="mt-0.5 max-w-[180px] truncate text-[11px] text-slate-400">{lead.campaign}</p>}
                  </td>
                  <td className="px-4 py-3 font-medium text-slate-700">
                    {lead.assigned_sale?.name || <span className="text-slate-400">Chưa gán</span>}
                  </td>
                  <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                    <select
                      value={lead.stage?.id || ''}
                      onChange={(e) => void handleStageChange(lead.id, e.target.value)}
                      className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-[11px] font-semibold text-slate-700"
                    >
                      {stages.map((st) => (
                        <option key={st.id} value={st.id}>
                          {st.stage_name}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                    {lead.is_accepted ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700">
                        <CheckCircle2 className="h-3 w-3" /> Đã nhận
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => void handleAccept(lead.id)}
                        className="rounded-lg bg-[#1E40FF] px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-blue-700"
                      >
                        Nhận Lead
                      </button>
                    )}
                  </td>
                  <td className="px-4 py-3 text-slate-500">{formatShortDate(lead.created_at)}</td>
                </tr>
              ))}
              {!loading && items.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-slate-400">
                    Không tìm thấy Lead nào khớp bộ lọc.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3 text-xs text-slate-600">
          <span>
            Tổng <strong>{total}</strong> Lead • Trang {page + 1}/{totalPages}
          </span>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              disabled={page === 0}
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              className="rounded-lg border border-slate-200 p-1.5 disabled:opacity-40"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              disabled={page + 1 >= totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="rounded-lg border border-slate-200 p-1.5 disabled:opacity-40"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {selectedLead && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/40 backdrop-blur-xs">
          <div className="flex h-full w-full max-w-md flex-col bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between border-b border-slate-100 pb-4">
              <div>
                <p className="text-xs font-bold uppercase text-[#0284C7]">Hồ sơ & Lịch sử Lead</p>
                <h3 className="text-lg font-bold text-slate-900">{selectedLead.name}</h3>
                <p className="font-mono text-sm font-semibold text-[#1E40FF]">{selectedLead.phone}</p>
              </div>
              <button type="button" onClick={() => setSelectedLead(null)} className="rounded-lg p-1.5 hover:bg-slate-100">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="my-4 rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs">
              <label className="mb-1.5 flex items-center gap-1 font-semibold text-slate-700">
                <UserCheck className="h-3.5 w-3.5 text-[#1E40FF]" /> Điều chuyển Sale / Đại lý F1
              </label>
              <div className="flex gap-2">
                <select
                  value={reassignTarget}
                  onChange={(e) => setReassignTarget(e.target.value)}
                  className="flex-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5"
                >
                  <option value="">-- Chọn nhân sự --</option>
                  {consultants.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.full_name}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => void handleReassign()}
                  className="rounded-lg bg-[#1E40FF] px-3 py-1.5 font-semibold text-white"
                >
                  Chuyển
                </button>
              </div>
            </div>

            <div className="flex-1 space-y-2.5 overflow-y-auto pr-1">
              {timeline.map((ev) => (
                <div key={ev.id} className="rounded-xl border border-slate-100 bg-slate-50/70 p-3 text-xs">
                  <div className="flex justify-between font-semibold text-slate-800">
                    <span>{ev.title || ev.event_type}</span>
                    <span className="text-[10px] text-slate-400">{formatShortDate(ev.created_at)}</span>
                  </div>
                  {ev.content && <p className="mt-1 text-slate-600">{ev.content}</p>}
                </div>
              ))}
              {timeline.length === 0 && <p className="text-xs text-slate-400">Chưa có ghi nhận lịch sử.</p>}
            </div>

            <form onSubmit={handleAddNote} className="mt-4 flex gap-2 border-t border-slate-100 pt-4">
              <div className="relative flex-1">
                <MessageSquarePlus className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  placeholder="Thêm ghi chú chăm sóc..."
                  className="w-full rounded-xl border border-slate-200 py-2 pl-9 pr-3 text-xs outline-none focus:border-[#1E40FF]"
                />
              </div>
              <button
                type="submit"
                className="inline-flex items-center gap-1 rounded-xl bg-[#1E40FF] px-3.5 py-2 text-xs font-semibold text-white"
              >
                <Send className="h-3.5 w-3.5" /> Lưu
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
