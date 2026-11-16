import React, { useCallback, useEffect, useState } from 'react';
import { GitMerge, Plus, RefreshCw, Save, Trash2 } from 'lucide-react';
import { apiRequest, getErrorMessage } from '../autodataApi';

interface RoundConsultantWeight {
  user_id: string;
  full_name?: string;
  email?: string;
  receive_ratio?: number;
  data_per_turn?: number;
  leads_received_in_round?: number;
  compensation_count?: number;
  is_active?: boolean;
}

interface RoundRecord {
  id: string;
  name: string;
  description?: string | null;
  is_active: boolean;
  consultants?: RoundConsultantWeight[];
}

interface RoundsViewProps {
  token: string;
  tenantSlug: string;
  pipelineId?: string;
  consultants: Array<{ id: string; full_name: string; email: string }>;
}

export const RoundsView: React.FC<RoundsViewProps> = ({
  token,
  tenantSlug,
  pipelineId,
  consultants,
}) => {
  const [rounds, setRounds] = useState<RoundRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [toast, setToast] = useState<string | null>(null);

  const fetchRounds = useCallback(async () => {
    const res = await apiRequest<{ rounds?: RoundRecord[] } | RoundRecord[]>('/pipelines/rounds/list', {
      token,
      tenantSlug,
    });
    return Array.isArray(res) ? res : res?.rounds || [];
  }, [token, tenantSlug]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const list = await fetchRounds();
        if (!cancelled) setRounds(list);
      } catch {
        if (!cancelled) setRounds([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [fetchRounds]);

  const reload = async () => {
    setLoading(true);
    try {
      setRounds(await fetchRounds());
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRound = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    try {
      await apiRequest('/pipelines/rounds', {
        method: 'POST',
        token,
        tenantSlug,
        body: {
          name: newName.trim(),
          description: newDesc.trim() || undefined,
          pipeline_id: pipelineId,
          consultants: consultants.map((c) => ({ user_id: c.id, receive_ratio: 1, data_per_turn: 1 })),
        },
      });
      setNewName('');
      setNewDesc('');
      setToast('Đã tạo Vòng chia data mới.');
      void reload();
    } catch (err: unknown) {
      setToast(getErrorMessage(err, 'Không thể tạo vòng chia.'));
    }
  };

  const handleToggleRound = async (r: RoundRecord) => {
    try {
      await apiRequest(`/pipelines/rounds/${r.id}`, {
        method: 'PATCH',
        token,
        tenantSlug,
        body: { is_active: !r.is_active },
      });
      void reload();
    } catch (err: unknown) {
      setToast(getErrorMessage(err, 'Không thể cập nhật trạng thái vòng.'));
    }
  };

  const handleSaveConsultants = async (round: RoundRecord) => {
    try {
      await apiRequest(`/pipelines/rounds/${round.id}/consultants`, {
        method: 'PUT',
        token,
        tenantSlug,
        body: {
          consultants: (round.consultants || []).map((c) => ({
            user_id: c.user_id,
            receive_ratio: Number(c.receive_ratio || 1),
            data_per_turn: Number(c.data_per_turn || 1),
            is_active: c.is_active !== false,
          })),
        },
      });
      setToast(`Đã lưu tỷ lệ nhận số cho vòng "${round.name}".`);
      void reload();
    } catch (err: unknown) {
      setToast(getErrorMessage(err, 'Không thể lưu cấu hình nhân sự vòng.'));
    }
  };

  const updateLocalWeight = (
    roundId: string,
    userId: string,
    field: 'receive_ratio' | 'is_active',
    value: number | boolean
  ) => {
    setRounds((prev) =>
      prev.map((r) => {
        if (r.id !== roundId) return r;
        return {
          ...r,
          consultants: (r.consultants || []).map((c) =>
            c.user_id === userId ? { ...c, [field]: value } : c
          ),
        };
      })
    );
  };

  const handleDeleteRound = async (roundId: string) => {
    try {
      await apiRequest(`/pipelines/rounds/${roundId}`, { method: 'DELETE', token, tenantSlug });
      setToast('Đã xóa vòng chia.');
      void reload();
    } catch (err: unknown) {
      setToast(getErrorMessage(err, 'Không thể xóa vòng chia.'));
    }
  };

  return (
    <div className="space-y-6">
      <div className="inkica-glass-card flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4">
        <div className="flex items-center gap-2.5">
          <GitMerge className="h-5 w-5 text-[#1E40FF]" />
          <div>
            <h1 className="text-lg font-bold text-slate-900">Vòng Chia Data & Trọng Số Phân Bổ</h1>
            <p className="text-xs text-slate-500">Quản lý các vòng chia Round-Robin theo chiến dịch và tỷ lệ nhận số từng Sale/F1</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => void reload()}
          className="ql-btn-outline inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} /> Làm mới
        </button>
      </div>

      {toast && (
        <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-2.5 text-xs font-semibold text-[#1E40FF]">
          {toast}
        </div>
      )}

      <form
        onSubmit={handleCreateRound}
        className="inkica-glass-card flex flex-wrap items-end gap-3 rounded-2xl border border-slate-200 bg-white p-4"
      >
        <div className="min-w-[200px] flex-1">
          <label className="mb-1 block text-xs font-semibold text-slate-700">Tên Vòng Chia Mới</label>
          <input
            type="text"
            required
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="vd: Dự án Shophouse Meta Q3"
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs outline-none focus:border-[#1E40FF]"
          />
        </div>
        <div className="min-w-[220px] flex-1">
          <label className="mb-1 block text-xs font-semibold text-slate-700">Mô tả</label>
          <input
            type="text"
            value={newDesc}
            onChange={(e) => setNewDesc(e.target.value)}
            placeholder="Ghi chú phạm vi chiến dịch..."
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs outline-none focus:border-[#1E40FF]"
          />
        </div>
        <button
          type="submit"
          className="btn-inkica-primary inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-semibold text-white"
        >
          <Plus className="h-4 w-4" /> Tạo Vòng Chia
        </button>
      </form>

      <div data-tour="rounds-list" className="space-y-4">
        {rounds.map((r) => (
          <div key={r.id} className="inkica-glass-card rounded-2xl border border-slate-200 bg-white p-5">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold text-slate-900">{r.name}</h2>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                      r.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {r.is_active ? 'Đang chạy' : 'Tạm dừng'}
                  </span>
                </div>
                {r.description && <p className="mt-0.5 text-xs text-slate-500">{r.description}</p>}
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => void handleToggleRound(r)}
                  className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  {r.is_active ? 'Tạm dừng' : 'Kích hoạt'}
                </button>
                <button
                  type="button"
                  onClick={() => void handleSaveConsultants(r)}
                  className="inline-flex items-center gap-1 rounded-xl bg-[#1E40FF] px-3 py-1.5 text-xs font-semibold text-white"
                >
                  <Save className="h-3.5 w-3.5" /> Lưu Tỷ Lệ
                </button>
                <button
                  type="button"
                  onClick={() => void handleDeleteRound(r.id)}
                  className="rounded-xl p-1.5 text-rose-600 hover:bg-rose-50"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-2.5 md:grid-cols-2 lg:grid-cols-3">
              {(r.consultants || []).map((c) => (
                <div
                  key={c.user_id}
                  className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/70 p-3 text-xs"
                >
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-slate-900">{c.full_name || c.email}</p>
                    <p className="text-[11px] text-slate-500">
                      Đã nhận: {c.leads_received_in_round || 0} • Bù: {c.compensation_count || 0}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="text-[10px] text-slate-500">
                      Tỷ lệ
                      <input
                        type="number"
                        min={1}
                        max={20}
                        value={c.receive_ratio || 1}
                        onChange={(e) => updateLocalWeight(r.id, c.user_id, 'receive_ratio', Number(e.target.value))}
                        className="ml-1 w-12 rounded-lg border border-slate-200 bg-white px-1.5 py-1 text-center font-bold"
                      />
                    </label>
                    <input
                      type="checkbox"
                      checked={c.is_active !== false}
                      onChange={(e) => updateLocalWeight(r.id, c.user_id, 'is_active', e.target.checked)}
                      className="h-4 w-4 accent-[#1E40FF]"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
