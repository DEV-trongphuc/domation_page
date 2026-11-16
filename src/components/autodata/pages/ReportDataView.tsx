import React, { useEffect, useState } from 'react';
import { AlertTriangle, CheckCircle2, Send } from 'lucide-react';
import { apiRequest, getErrorMessage } from '../autodataApi';

interface RecentLeadOption {
  id: string;
  name: string;
  phone: string;
  source: string;
}

interface ReportDataViewProps {
  token: string;
  tenantSlug: string;
  customReasons?: string[];
}

const DEFAULT_REASONS = [
  'Số sai định dạng / không tồn tại',
  'Thuê bao không liên lạc được nhiều lần',
  'Khách báo nhầm số, không đăng ký',
  'Trùng khách hàng đã chăm sóc trước đó',
  'Spam / Test / Đối thủ phá form',
];

export const ReportDataView: React.FC<ReportDataViewProps> = ({ token, tenantSlug, customReasons }) => {
  const reasonOptions = customReasons && customReasons.length > 0 ? customReasons : DEFAULT_REASONS;
  const [leads, setLeads] = useState<RecentLeadOption[]>([]);
  const [selectedLeadId, setSelectedLeadId] = useState('');
  const [reason, setReason] = useState(reasonOptions[0]);
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [doneMsg, setDoneMsg] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await apiRequest<{ items: RecentLeadOption[] }>('/leads?limit=50', { token, tenantSlug });
        if (!cancelled) {
          const items = res.items || [];
          setLeads(items);
          if (items.length > 0) setSelectedLeadId(items[0].id);
        }
      } catch {
        if (!cancelled) setLeads([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token, tenantSlug]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLeadId) return;
    setSubmitting(true);
    setDoneMsg(null);
    try {
      await apiRequest(`/leads/${selectedLeadId}/tickets`, {
        method: 'POST',
        token,
        tenantSlug,
        body: { reason, description: note.trim() || 'Báo lỗi từ cổng Report Data' },
      });
      setNote('');
      setDoneMsg('Đã gửi Ticket báo lỗi thành công! Admin sẽ đối soát và bù lượt.');
    } catch (err: unknown) {
      setDoneMsg(getErrorMessage(err, 'Không thể gửi Ticket báo lỗi.'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="inkica-glass-card rounded-2xl border border-slate-200 bg-white p-6">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-600">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900">Cổng Báo Lỗi Data & Yêu Cầu Bù Lượt</h1>
            <p className="text-xs text-slate-500">Dành cho Sale & Đại lý F1 phản hồi số lỗi để được cấp bù 1-đổi-1</p>
          </div>
        </div>

        {doneMsg && (
          <div className="mb-4 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-semibold text-emerald-700">
            <CheckCircle2 className="h-4 w-4" /> {doneMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} data-tour="reportdata-form" className="space-y-4 text-xs">
          <div>
            <label className="mb-1 block font-semibold text-slate-700">Chọn Lead cần báo lỗi</label>
            <select
              required
              value={selectedLeadId}
              onChange={(e) => setSelectedLeadId(e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-3 py-2.5"
            >
              {leads.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name} — {l.phone} ({l.source})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block font-semibold text-slate-700">Lý do lỗi chuẩn hóa</label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-3 py-2.5"
            >
              {reasonOptions.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block font-semibold text-slate-700">Ghi chú bằng chứng đối soát</label>
            <textarea
              rows={3}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Ghi rõ khung giờ đã gọi / kết quả cuộc gọi..."
              className="w-full rounded-xl border border-slate-200 p-3 outline-none focus:border-[#1E40FF]"
            />
          </div>

          <button
            type="submit"
            disabled={submitting || !selectedLeadId}
            className="btn-inkica-primary inline-flex items-center gap-1.5 rounded-xl px-5 py-2.5 font-semibold text-white disabled:opacity-50"
          >
            <Send className="h-4 w-4" /> {submitting ? 'Đang gửi...' : 'Gửi Ticket Báo Lỗi'}
          </button>
        </form>
      </div>
    </div>
  );
};
