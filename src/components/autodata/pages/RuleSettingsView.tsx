import React, { useCallback, useEffect, useState } from 'react';
import { Plus, RefreshCw, Route, Trash2 } from 'lucide-react';
import { apiRequest, getErrorMessage } from '../autodataApi';

interface RoundSummary {
  id: string;
  name: string;
}

interface RoutingRuleRow {
  id: string;
  rule_name: string;
  round_id: string;
  round_name?: string;
  priority: number;
}

interface RuleSettingsViewProps {
  token: string;
  tenantSlug: string;
}

export const RuleSettingsView: React.FC<RuleSettingsViewProps> = ({ token, tenantSlug }) => {
  const [rounds, setRounds] = useState<RoundSummary[]>([]);
  const [rules, setRules] = useState<RoutingRuleRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [ruleName, setRuleName] = useState('');
  const [targetRoundId, setTargetRoundId] = useState('');
  const [branches, setBranches] = useState<Array<Array<{ field: string; op: string; val: string }>>>([
    [{ field: 'source', op: 'contains', val: 'Facebook' }],
  ]);
  const [priority, setPriority] = useState(1);
  const [injectSource, setInjectSource] = useState('');
  const [toast, setToast] = useState<string | null>(null);

  const fetchRules = useCallback(async () => {
    return apiRequest<{ rounds?: RoundSummary[]; routing_rules?: RoutingRuleRow[] }>('/pipelines/rounds/list', {
      token,
      tenantSlug,
    });
  }, [token, tenantSlug]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetchRules();
        if (!cancelled) {
          const rds = res?.rounds || [];
          setRounds(rds);
          setRules(res?.routing_rules || []);
          if (!targetRoundId && rds.length > 0) setTargetRoundId(rds[0].id);
        }
      } catch {
        if (!cancelled) setRules([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [fetchRules, targetRoundId]);

  const reload = async () => {
    setLoading(true);
    try {
      const res = await fetchRules();
      setRounds(res?.rounds || []);
      setRules(res?.routing_rules || []);
    } finally {
      setLoading(false);
    }
  };

  const addOrBranch = () => {
    setBranches((prev) => [...prev, [{ field: 'campaign', op: 'contains', val: '' }]]);
  };

  const addAndCondition = (bIdx: number) => {
    setBranches((prev) =>
      prev.map((br, i) => (i === bIdx ? [...br, { field: 'source', op: 'contains', val: '' }] : br))
    );
  };

  const updateCond = (bIdx: number, cIdx: number, key: 'field' | 'op' | 'val', val: string) => {
    setBranches((prev) =>
      prev.map((br, i) =>
        i === bIdx ? br.map((c, j) => (j === cIdx ? { ...c, [key]: val } : c)) : br
      )
    );
  };

  const handleCreateRule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ruleName.trim() || !targetRoundId) return;
    try {
      await apiRequest('/pipelines/routing-rules', {
        method: 'POST',
        token,
        tenantSlug,
        body: {
          rule_name: ruleName.trim(),
          round_id: targetRoundId,
          priority: Number(priority || 1),
          conditions_json: branches[0] || [],
          condition_branches: branches,
          connection_scopes: ['all'],
          inject_fields: injectSource.trim() ? { source: injectSource.trim() } : {},
        },
      });
      setRuleName('');
      setInjectSource('');
      setToast('Đã tạo Luật điều hướng OR-of-AND mới.');
      void reload();
    } catch (err: unknown) {
      setToast(getErrorMessage(err, 'Không thể tạo luật điều hướng.'));
    }
  };

  const handleDeleteRule = async (ruleId: string) => {
    try {
      await apiRequest(`/pipelines/routing-rules/${ruleId}`, { method: 'DELETE', token, tenantSlug });
      void reload();
    } catch {
      // ignore
    }
  };

  return (
    <div className="space-y-6">
      <div className="inkica-glass-card flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-4">
        <div className="flex items-center gap-2.5">
          <Route className="h-5 w-5 text-[#1E40FF]" />
          <div>
            <h1 className="text-lg font-bold text-slate-900">Luật Điều Hướng Rẽ Nhánh (Routing Rules)</h1>
            <p className="text-xs text-slate-500">Hỗ trợ biểu thức OR-of-AND đa nhánh & tự động gắn nhãn dữ liệu đầu vào</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => void reload()}
          className="rounded-xl border border-slate-200 p-2 text-slate-600"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {toast && (
        <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-2.5 text-xs font-semibold text-[#1E40FF]">
          {toast}
        </div>
      )}

      <form
        onSubmit={handleCreateRule}
        data-tour="rules-builder"
        className="inkica-glass-card space-y-4 rounded-2xl border border-slate-200 bg-white p-5"
      >
        <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
          <input
            type="text"
            required
            value={ruleName}
            onChange={(e) => setRuleName(e.target.value)}
            placeholder="Tên luật (vd: Meta Ads ĐN -> Vòng A)"
            className="rounded-xl border border-slate-200 px-3 py-2 text-xs md:col-span-2"
          />
          <select
            value={targetRoundId}
            onChange={(e) => setTargetRoundId(e.target.value)}
            className="rounded-xl border border-slate-200 px-3 py-2 text-xs"
          >
            {rounds.map((r) => (
              <option key={r.id} value={r.id}>
                → {r.name}
              </option>
            ))}
          </select>
          <input
            type="number"
            min={0}
            value={priority}
            onChange={(e) => setPriority(Number(e.target.value))}
            placeholder="Ưu tiên"
            className="rounded-xl border border-slate-200 px-3 py-2 text-xs"
          />
        </div>

        <div className="space-y-3">
          {branches.map((branch, bIdx) => (
            <div key={bIdx} className="rounded-xl border border-blue-100 bg-blue-50/40 p-3">
              <div className="mb-2 flex items-center justify-between text-[11px] font-bold text-[#1E40FF]">
                <span>{bIdx === 0 ? 'NHÁNH ĐIỀU KIỆN 1' : `HOẶC (OR) — NHÁNH ${bIdx + 1}`}</span>
                <button type="button" onClick={() => addAndCondition(bIdx)} className="underline">
                  + Thêm điều kiện VÀ (AND)
                </button>
              </div>
              <div className="space-y-2">
                {branch.map((cond, cIdx) => (
                  <div key={cIdx} className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                    <select
                      value={cond.field}
                      onChange={(e) => updateCond(bIdx, cIdx, 'field', e.target.value)}
                      className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs"
                    >
                      <option value="source">Nguồn (source)</option>
                      <option value="campaign">Chiến dịch (campaign)</option>
                      <option value="product_interest">Sản phẩm quan tâm</option>
                      <option value="phone">Số điện thoại</option>
                      <option value="utm_source">UTM Source</option>
                    </select>
                    <select
                      value={cond.op}
                      onChange={(e) => updateCond(bIdx, cIdx, 'op', e.target.value)}
                      className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs"
                    >
                      <option value="contains">Chứa (contains)</option>
                      <option value="equals">Bằng chính xác</option>
                      <option value="not_contains">Không chứa</option>
                      <option value="is_not_empty">Không rỗng</option>
                    </select>
                    <input
                      type="text"
                      value={cond.val}
                      onChange={(e) => updateCond(bIdx, cIdx, 'val', e.target.value)}
                      placeholder="Giá trị so khớp..."
                      className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs"
                    />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={addOrBranch}
              className="ql-btn-outline rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700"
            >
              + Thêm nhánh HOẶC (OR)
            </button>
            <input
              type="text"
              value={injectSource}
              onChange={(e) => setInjectSource(e.target.value)}
              placeholder="Gắn nhãn source (tùy chọn)"
              className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs"
            />
          </div>
          <button
            type="submit"
            className="btn-inkica-primary inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-semibold text-white"
          >
            <Plus className="h-4 w-4" /> Lưu Luật Điều Hướng
          </button>
        </div>
      </form>

      <div className="space-y-2.5">
        {rules.map((r) => (
          <div
            key={r.id}
            className="inkica-glass-card flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-4 text-xs"
          >
            <div>
              <p className="font-bold text-slate-900">
                #{r.priority} • {r.rule_name}
              </p>
              <p className="mt-0.5 text-slate-500">
                Đích: <span className="font-semibold text-[#1E40FF]">{r.round_name || r.round_id}</span>
              </p>
            </div>
            <button
              type="button"
              onClick={() => void handleDeleteRule(r.id)}
              className="rounded-lg p-1.5 text-rose-600 hover:bg-rose-50"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
