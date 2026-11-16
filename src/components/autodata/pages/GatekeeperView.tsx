import React, { useCallback, useEffect, useState } from 'react';
import { Ban, Check, Plus, RefreshCw, ShieldCheck, Trash2, X } from 'lucide-react';
import { apiRequest, formatShortDate, getErrorMessage } from '../autodataApi';

interface ManualGatekeeperRule {
  field: string;
  op: string;
  val: string;
  reason: string;
}

interface GatekeeperConfig {
  is_enabled: boolean;
  mode: string;
  model_name: string;
  prompt_rules: string;
  manual_action: string;
  manual_rules?: ManualGatekeeperRule[];
}

interface HeldLeadItem {
  id: string;
  name: string;
  phone: string;
  source: string;
  hold_reason?: string;
  ai_evaluation?: string;
  status: string;
  created_at: string;
}

interface BlacklistEntry {
  id: string;
  entry_type: string;
  value: string;
  reason?: string;
}

interface GatekeeperViewProps {
  token: string;
  tenantSlug: string;
}

export const GatekeeperView: React.FC<GatekeeperViewProps> = ({ token, tenantSlug }) => {
  const [config, setConfig] = useState<GatekeeperConfig>({
    is_enabled: true,
    mode: 'hybrid',
    model_name: 'gemini-2.5-flash',
    prompt_rules: '',
    manual_action: 'hold',
    manual_rules: [],
  });
  const [newRuleField, setNewRuleField] = useState('name');
  const [newRuleOp, setNewRuleOp] = useState('contains');
  const [newRuleVal, setNewRuleVal] = useState('');
  const [newRuleReason, setNewRuleReason] = useState('Lead chứa từ khóa rác/test');
  const [heldLeads, setHeldLeads] = useState<HeldLeadItem[]>([]);
  const [heldStatus, setHeldStatus] = useState<'held' | 'blacklisted' | 'approved' | 'rejected'>('held');
  const [blacklist, setBlacklist] = useState<BlacklistEntry[]>([]);
  const [newBlType, setNewBlType] = useState<'phone' | 'email' | 'keyword'>('phone');
  const [newBlVal, setNewBlVal] = useState('');
  const [newBlReason, setNewBlReason] = useState('');
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    const [cfgRes, heldRes, blRes] = await Promise.all([
      apiRequest<Partial<GatekeeperConfig>>('/operations/gatekeeper/config', { token, tenantSlug }),
      apiRequest<{ items: HeldLeadItem[] }>(`/operations/gatekeeper/held-leads?status=${heldStatus}`, { token, tenantSlug }),
      apiRequest<{ items: BlacklistEntry[] }>('/operations/gatekeeper/blacklist', { token, tenantSlug }),
    ]);
    return { cfgRes, heldRes, blRes };
  }, [token, tenantSlug, heldStatus]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { cfgRes, heldRes, blRes } = await fetchAll();
        if (!cancelled) {
          if (cfgRes) setConfig((prev) => ({ ...prev, ...cfgRes }));
          setHeldLeads(heldRes?.items || []);
          setBlacklist(blRes?.items || []);
        }
      } catch {
        // ignore cleanly
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [fetchAll]);

  const reload = async () => {
    setLoading(true);
    try {
      const { cfgRes, heldRes, blRes } = await fetchAll();
      if (cfgRes) setConfig((prev) => ({ ...prev, ...cfgRes }));
      setHeldLeads(heldRes?.items || []);
      setBlacklist(blRes?.items || []);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiRequest('/operations/gatekeeper/config', {
        method: 'PUT',
        token,
        tenantSlug,
        body: config,
      });
      setToast('Đã lưu cấu hình AI / Manual Gatekeeper.');
    } catch (err: unknown) {
      setToast(getErrorMessage(err, 'Lỗi lưu cấu hình.'));
    }
  };

  const handleResolveHeld = async (id: string, action: 'approve' | 'reject' | 'blacklist') => {
    try {
      await apiRequest(`/operations/gatekeeper/held-leads/${id}/resolve`, {
        method: 'POST',
        token,
        tenantSlug,
        body: { action },
      });
      setToast(
        action === 'approve'
          ? 'Đã duyệt Lead đi tiếp vào vòng chia.'
          : action === 'blacklist'
            ? 'Đã đưa vào Blacklist.'
            : 'Đã từ chối Lead dưới chuẩn.'
      );
      void reload();
    } catch (err: unknown) {
      setToast(getErrorMessage(err, 'Thao tác thất bại.'));
    }
  };

  const handleAddBlacklist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBlVal.trim()) return;
    try {
      await apiRequest('/operations/gatekeeper/blacklist', {
        method: 'POST',
        token,
        tenantSlug,
        body: { entry_type: newBlType, value: newBlVal.trim(), reason: newBlReason.trim() || 'Chặn thủ công' },
      });
      setNewBlVal('');
      setNewBlReason('');
      setToast('Đã thêm mục vào Danh sách đen.');
      void reload();
    } catch (err: unknown) {
      setToast(getErrorMessage(err, 'Không thể thêm vào Blacklist.'));
    }
  };

  const handleDeleteBlacklist = async (id: string) => {
    try {
      await apiRequest(`/operations/gatekeeper/blacklist/${id}`, { method: 'DELETE', token, tenantSlug });
      void reload();
    } catch {
      // ignore
    }
  };

  return (
    <div className="space-y-6">
      {toast && (
        <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-2.5 text-xs font-semibold text-[#1E40FF]">
          {toast}
        </div>
      )}

      <form
        onSubmit={handleSaveConfig}
        data-tour="gatekeeper-rules"
        className="inkica-glass-card space-y-4 rounded-2xl border border-slate-200 bg-white p-5"
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="h-5 w-5 text-[#1E40FF]" />
            <div>
              <h1 className="text-lg font-bold text-slate-900">Gatekeeper Sàng Lọc Đầu Vào (AI & Thủ Công)</h1>
              <p className="text-xs text-slate-500">Ngăn chặn số rác, spam, tên vô nghĩa trước khi chia về Sale / Đại lý F1</p>
            </div>
          </div>
          <label className="inline-flex cursor-pointer items-center gap-2 text-xs font-semibold text-slate-700">
            <input
              type="checkbox"
              checked={Boolean(config.is_enabled)}
              onChange={(e) => setConfig({ ...config, is_enabled: e.target.checked })}
              className="h-4 w-4 accent-[#1E40FF]"
            />
            Kích hoạt Gatekeeper
          </label>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-700">Chế độ sàng lọc</label>
            <select
              value={config.mode || 'hybrid'}
              onChange={(e) => setConfig({ ...config, mode: e.target.value })}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs"
            >
              <option value="ai">AI Gemini (Tự động chấm điểm)</option>
              <option value="manual">Manual Rule (Từ khóa & SĐT)</option>
              <option value="hybrid">Hybrid (Kết hợp AI + Rule cứng)</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-700">Hành động khi nghi ngờ</label>
            <select
              value={config.manual_action || 'hold'}
              onChange={(e) => setConfig({ ...config, manual_action: e.target.value })}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs"
            >
              <option value="hold">Giữ lại hàng đợi (Held Leads)</option>
              <option value="reject">Từ chối ngay</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-700">AI Model</label>
            <input
              type="text"
              value={config.model_name || 'gemini-2.5-flash'}
              onChange={(e) => setConfig({ ...config, model_name: e.target.value })}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs"
            />
          </div>
        </div>

        <div>
          <label className="mb-1 block text-xs font-semibold text-slate-700">Tiêu chí Prompt AI sàng lọc</label>
          <textarea
            rows={2}
            value={config.prompt_rules || ''}
            onChange={(e) => setConfig({ ...config, prompt_rules: e.target.value })}
            placeholder="Ví dụ: Giữ lại các lead nhập tên test, sai định dạng SĐT hoặc không thuộc khu vực phân phối."
            className="w-full rounded-xl border border-slate-200 p-3 text-xs outline-none focus:border-[#1E40FF]"
          />
        </div>

        <div className="space-y-2 rounded-xl border border-slate-100 bg-slate-50/70 p-3.5 text-xs">
          <div className="font-semibold text-slate-800">Quy tắc chặn Thủ công (Manual Rules)</div>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-5">
            <select value={newRuleField} onChange={(e) => setNewRuleField(e.target.value)} className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5">
              <option value="name">Tên khách</option>
              <option value="phone">SĐT</option>
              <option value="source">Nguồn</option>
              <option value="note">Ghi chú</option>
            </select>
            <select value={newRuleOp} onChange={(e) => setNewRuleOp(e.target.value)} className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5">
              <option value="contains">Chứa</option>
              <option value="equals">Bằng</option>
              <option value="starts_with">Bắt đầu bằng</option>
            </select>
            <input type="text" value={newRuleVal} onChange={(e) => setNewRuleVal(e.target.value)} placeholder="Từ khóa..." className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5" />
            <input type="text" value={newRuleReason} onChange={(e) => setNewRuleReason(e.target.value)} placeholder="Lý do giữ..." className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5" />
            <button
              type="button"
              onClick={() => {
                if (!newRuleVal.trim()) return;
                setConfig((prev) => ({
                  ...prev,
                  manual_rules: [...(prev.manual_rules || []), { field: newRuleField, op: newRuleOp, val: newRuleVal.trim(), reason: newRuleReason.trim() || 'Manual rule match' }],
                }));
                setNewRuleVal('');
              }}
              className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 font-semibold text-[#1E40FF]"
            >
              + Thêm Rule
            </button>
          </div>
          {(config.manual_rules || []).length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {(config.manual_rules || []).map((mr, idx) => (
                <span key={idx} className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px]">
                  <strong>{mr.field}</strong> {mr.op} &quot;{mr.val}&quot;
                  <button
                    type="button"
                    onClick={() => setConfig((prev) => ({ ...prev, manual_rules: (prev.manual_rules || []).filter((_, i) => i !== idx) }))}
                    className="text-rose-500 hover:text-rose-700"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-end">
          <button type="submit" className="btn-inkica-primary rounded-xl px-5 py-2 text-xs font-semibold text-white">
            Lưu Quy Tắc Gatekeeper
          </button>
        </div>
      </form>

      <div data-tour="gatekeeper-held" className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="inkica-glass-card rounded-2xl border border-slate-200 bg-white p-5 lg:col-span-2">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-sm font-bold text-slate-900">Hàng Đợi Lead Bị Giữ Lại (Held Leads)</h2>
            <div className="flex items-center gap-1.5">
              {(['held', 'blacklisted', 'approved', 'rejected'] as const).map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setHeldStatus(st)}
                  className={`rounded-lg px-2.5 py-1 text-[11px] font-semibold ${
                    heldStatus === st ? 'bg-[#1E40FF] text-white' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {st === 'held' ? 'Đang giữ' : st === 'blacklisted' ? 'Blacklist' : st === 'approved' ? 'Đã duyệt' : 'Từ chối'}
                </button>
              ))}
              <button type="button" onClick={() => void reload()} className="rounded-lg border border-slate-200 p-1.5">
                <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          <div className="space-y-2.5">
            {heldLeads.map((hl) => (
              <div
                key={hl.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50/70 p-3 text-xs"
              >
                <div>
                  <p className="font-semibold text-slate-900">
                    {hl.name} • <span className="font-mono text-[#1E40FF]">{hl.phone}</span>
                  </p>
                  <p className="text-slate-600">{hl.hold_reason || hl.ai_evaluation || 'Dưới chuẩn'}</p>
                  <p className="text-[10px] text-slate-400">
                    {hl.source} • {formatShortDate(hl.created_at)}
                  </p>
                </div>
                {hl.status === 'held' && (
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => void handleResolveHeld(hl.id, 'approve')}
                      className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-2.5 py-1.5 font-semibold text-white"
                    >
                      <Check className="h-3.5 w-3.5" /> Duyệt
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleResolveHeld(hl.id, 'reject')}
                      className="inline-flex items-center gap-1 rounded-lg bg-slate-200 px-2.5 py-1.5 font-semibold text-slate-700"
                    >
                      <X className="h-3.5 w-3.5" /> Bỏ
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleResolveHeld(hl.id, 'blacklist')}
                      className="inline-flex items-center gap-1 rounded-lg bg-rose-600 px-2.5 py-1.5 font-semibold text-white"
                    >
                      <Ban className="h-3.5 w-3.5" /> Chặn
                    </button>
                  </div>
                )}
              </div>
            ))}
            {!loading && heldLeads.length === 0 && (
              <p className="py-8 text-center text-xs text-slate-400">Không có Lead nào trong danh sách này.</p>
            )}
          </div>
        </div>

        <div className="inkica-glass-card rounded-2xl border border-slate-200 bg-white p-5">
          <h2 className="mb-3 flex items-center gap-2 text-sm font-bold text-slate-900">
            <Ban className="h-4 w-4 text-rose-600" /> Danh Sách Đen (Blacklist)
          </h2>
          <form onSubmit={handleAddBlacklist} className="mb-4 space-y-2">
            <div className="flex gap-2">
              <select
                value={newBlType}
                onChange={(e) => setNewBlType(e.target.value as 'phone' | 'email' | 'keyword')}
                className="rounded-xl border border-slate-200 px-2.5 py-2 text-xs"
              >
                <option value="phone">SĐT</option>
                <option value="email">Email</option>
                <option value="keyword">Từ khóa</option>
              </select>
              <input
                type="text"
                required
                value={newBlVal}
                onChange={(e) => setNewBlVal(e.target.value)}
                placeholder="Giá trị chặn..."
                className="flex-1 rounded-xl border border-slate-200 px-3 py-2 text-xs"
              />
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={newBlReason}
                onChange={(e) => setNewBlReason(e.target.value)}
                placeholder="Lý do (tùy chọn)"
                className="flex-1 rounded-xl border border-slate-200 px-3 py-2 text-xs"
              />
              <button
                type="submit"
                className="inline-flex items-center gap-1 rounded-xl bg-rose-600 px-3 py-2 text-xs font-semibold text-white"
              >
                <Plus className="h-3.5 w-3.5" /> Chặn
              </button>
            </div>
          </form>

          <div className="space-y-2">
            {blacklist.map((b) => (
              <div
                key={b.id}
                className="flex items-center justify-between rounded-xl border border-rose-100 bg-rose-50/40 px-3 py-2 text-xs"
              >
                <div className="min-w-0">
                  <p className="truncate font-mono font-bold text-slate-900">
                    [{b.entry_type}] {b.value}
                  </p>
                  <p className="truncate text-[11px] text-slate-500">{b.reason}</p>
                </div>
                <button
                  type="button"
                  onClick={() => void handleDeleteBlacklist(b.id)}
                  className="rounded-lg p-1 text-rose-600 hover:bg-rose-100"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
