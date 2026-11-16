import React, { useCallback, useEffect, useState } from 'react';
import { Award, PlusCircle, RefreshCw, Scale } from 'lucide-react';
import { apiRequest, formatShortDate, getErrorMessage } from '../autodataApi';

interface FairConsultantRow {
  id: string;
  name: string;
  email: string;
  receive_ratio: number;
  assigned_count: number;
  expected_count: number;
  deviation_pct: number;
  ticket_count: number;
  compensation_count: number;
}

interface CompensationLogRow {
  id: string;
  consultant_name?: string;
  reason?: string;
  amount: number;
  created_at: string;
}

interface FairShareData {
  selected_round_id?: string;
  fairness_score_pct?: number;
  gini_coefficient?: number;
  totalLeads?: number;
  rounds?: Array<{ id: string; name: string }>;
  consultants?: FairConsultantRow[];
  compensation_logs?: CompensationLogRow[];
}

interface FairShareAuditViewProps {
  token: string;
  tenantSlug: string;
}

export const FairShareAuditView: React.FC<FairShareAuditViewProps> = ({ token, tenantSlug }) => {
  const [roundId, setRoundId] = useState<string>('');
  const [data, setData] = useState<FairShareData | null>(null);
  const [loading, setLoading] = useState(true);
  const [compTarget, setCompTarget] = useState<string>('');
  const [compAmount, setCompAmount] = useState<number>(1);
  const [compReason, setCompReason] = useState('Bù lượt chủ động từ Admin');
  const [toast, setToast] = useState<string | null>(null);

  const fetchFairShare = useCallback(async () => {
    const qs = roundId ? `?round_id=${encodeURIComponent(roundId)}` : '';
    return apiRequest<FairShareData>(`/analytics/fair-share${qs}`, { token, tenantSlug });
  }, [token, tenantSlug, roundId]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetchFairShare();
        if (!cancelled) {
          setData(res);
          if (!roundId && res?.selected_round_id) {
            setRoundId(res.selected_round_id);
          }
        }
      } catch {
        if (!cancelled) setData(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [fetchFairShare, roundId]);

  const reload = async () => {
    setLoading(true);
    try {
      setData(await fetchFairShare());
    } finally {
      setLoading(false);
    }
  };

  const handleCompensate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!compTarget) return;
    try {
      await apiRequest('/analytics/fair-share/compensate', {
        method: 'POST',
        token,
        tenantSlug,
        body: {
          round_id: roundId || data?.selected_round_id,
          consultant_user_id: compTarget,
          amount: Number(compAmount || 1),
          reason: compReason.trim(),
        },
      });
      setToast('Đã cấp bù lượt vào vòng chia và ghi nhật ký đối soát.');
      void reload();
    } catch (err: unknown) {
      setToast(getErrorMessage(err, 'Không thể cấp bù lượt.'));
    }
  };

  const consultants = data?.consultants || [];
  const rounds = data?.rounds || [];
  const logs = data?.compensation_logs || [];

  return (
    <div className="space-y-6">
      <div className="inkica-glass-card flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4">
        <div className="flex items-center gap-2.5">
          <Scale className="h-5 w-5 text-[#1E40FF]" />
          <div>
            <h1 className="text-lg font-bold text-slate-900">Kiểm Toán Công Bằng & Đền Bù Lượt (Fair-Share Gini)</h1>
            <p className="text-xs text-slate-500">So sánh số lượng kỳ vọng theo trọng số vs thực tế nhận của từng Sale / Đại lý F1</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={roundId}
            onChange={(e) => setRoundId(e.target.value)}
            className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700"
          >
            {rounds.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>
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

      <div data-tour="fairshare-gini" className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="inkica-glass-card rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-xs font-semibold uppercase text-slate-500">Điểm Công Bằng (Fairness Score)</p>
          <p className="mt-2 flex items-center gap-2 text-3xl font-extrabold text-emerald-600">
            <Award className="h-6 w-6" /> {data?.fairness_score_pct ?? 100}%
          </p>
          <p className="mt-1 text-xs text-slate-500">Hệ số Gini: {data?.gini_coefficient ?? 0}</p>
        </div>
        <div className="inkica-glass-card rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-xs font-semibold uppercase text-slate-500">Tổng Lead Trong Vòng</p>
          <p className="mt-2 text-3xl font-extrabold text-[#1E40FF]">{data?.totalLeads ?? 0}</p>
          <p className="mt-1 text-xs text-slate-500">{consultants.length} nhân sự / F1 tham gia vòng</p>
        </div>
        <div className="inkica-glass-card rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-xs font-semibold uppercase text-slate-500">Tổng Lượt Đang Bù</p>
          <p className="mt-2 text-3xl font-extrabold text-[#0284C7]">
            {consultants.reduce((s, c) => s + Number(c.compensation_count || 0), 0)}
          </p>
          <p className="mt-1 text-xs text-slate-500">Ưu tiên phân bổ ngay khi có Lead mới</p>
        </div>
      </div>

      <div className="inkica-glass-card overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">Sale / Đại lý F1</th>
                <th className="px-4 py-3">Trọng Số</th>
                <th className="px-4 py-3">Thực Nhận</th>
                <th className="px-4 py-3">Kỳ Vọng</th>
                <th className="px-4 py-3">Độ Lệch</th>
                <th className="px-4 py-3">Ticket Duyệt</th>
                <th className="px-4 py-3">Lượt Bù Còn</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {consultants.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50/70">
                  <td className="px-4 py-3">
                    <p className="font-semibold text-slate-900">{c.name}</p>
                    <p className="text-[11px] text-slate-400">{c.email}</p>
                  </td>
                  <td className="px-4 py-3 font-bold text-slate-800">{c.receive_ratio}x</td>
                  <td className="px-4 py-3 font-bold text-[#1E40FF]">{c.assigned_count}</td>
                  <td className="px-4 py-3 text-slate-600">{c.expected_count}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 font-semibold ${
                        Math.abs(c.deviation_pct) <= 10
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-amber-50 text-amber-700'
                      }`}
                    >
                      {c.deviation_pct > 0 ? `+${c.deviation_pct}%` : `${c.deviation_pct}%`}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-700">{c.ticket_count}</td>
                  <td className="px-4 py-3 font-extrabold text-[#0284C7]">+{c.compensation_count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div data-tour="fairshare-compensate" className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <form onSubmit={handleCompensate} className="inkica-glass-card space-y-3 rounded-2xl border border-slate-200 bg-white p-5">
          <h2 className="flex items-center gap-2 text-sm font-bold text-slate-900">
            <PlusCircle className="h-4 w-4 text-[#1E40FF]" /> Cấp Bù Lượt Chủ Động (Manual Credit)
          </h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <select
              required
              value={compTarget}
              onChange={(e) => setCompTarget(e.target.value)}
              className="rounded-xl border border-slate-200 px-3 py-2 text-xs sm:col-span-2"
            >
              <option value="">-- Chọn Sale / Đại lý F1 --</option>
              {consultants.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            <input
              type="number"
              min={1}
              max={20}
              value={compAmount}
              onChange={(e) => setCompAmount(Number(e.target.value))}
              className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold"
            />
          </div>
          <input
            type="text"
            value={compReason}
            onChange={(e) => setCompReason(e.target.value)}
            placeholder="Lý do cấp bù lượt..."
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs"
          />
          <button type="submit" className="btn-inkica-primary rounded-xl px-4 py-2 text-xs font-semibold text-white">
            Xác nhận Cấp Bù
          </button>
        </form>

        <div className="inkica-glass-card rounded-2xl border border-slate-200 bg-white p-5">
          <h2 className="mb-3 text-sm font-bold text-slate-900">Nhật Ký Đền Bù Lượt</h2>
          <div className="max-h-52 space-y-2 overflow-y-auto">
            {logs.map((lg) => (
              <div key={lg.id} className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2 text-xs">
                <div>
                  <p className="font-semibold text-slate-800">{lg.consultant_name || 'Sale'}</p>
                  <p className="text-[11px] text-slate-500">{lg.reason}</p>
                </div>
                <div className="text-right">
                  <span className="font-bold text-emerald-600">+{lg.amount} lượt</span>
                  <p className="text-[10px] text-slate-400">{formatShortDate(lg.created_at)}</p>
                </div>
              </div>
            ))}
            {logs.length === 0 && <p className="text-xs text-slate-400">Chưa có lịch sử đền bù chủ động.</p>}
          </div>
        </div>
      </div>
    </div>
  );
};
