import React, { useCallback, useEffect, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  BarChart3,
  CheckCircle2,
  Flame,
  Layers,
  Maximize2,
  RefreshCw,
  ShieldAlert,
  Users,
  X,
} from 'lucide-react';
import { apiRequest, formatShortDate } from '../autodataApi';
import type { WorkspaceScreenKey } from '../autodataTypes';

interface DashboardData {
  kpis?: {
    total_received?: number;
    total_leads?: number;
    assigned_leads?: number;
    duplicate_leads?: number;
    held_leads?: number;
    blacklisted_leads?: number;
    error_tickets?: number;
    acceptance_rate_pct?: number;
    sla_compliance_pct?: number;
    capi_200_count?: number;
    won_leads?: number;
    zalo_sent_count?: number;
  };
  chart_series?: Array<{ label: string; total: number; assigned: number; dup?: number }>;
  heatmap_matrix?: Array<{ wday: number; hour: number; count: number }>;
  by_source?: Array<{ label: string; count: number }>;
  by_consultant?: Array<{
    id: string;
    full_name: string;
    email: string;
    is_external_agency?: boolean;
    is_available?: boolean;
    lead_count: number;
    accepted_count: number;
  }>;
  recent_logs?: Array<{
    id: string;
    name: string;
    phone: string;
    source: string;
    assigned_sale_name?: string | null;
    created_at: string;
  }>;
}

interface DashboardViewProps {
  token: string;
  tenantSlug: string;
  companyName: string;
  onNavigateTab: (tab: WorkspaceScreenKey) => void;
}

const DATE_PRESETS = [
  { value: 'today', label: 'Hôm nay' },
  { value: 'yesterday', label: 'Hôm qua' },
  { value: 'this_week', label: 'Tuần này' },
  { value: '7_days', label: '7 ngày qua' },
  { value: '30_days', label: '30 ngày qua' },
  { value: 'this_month', label: 'Tháng này' },
  { value: 'last_month', label: 'Tháng trước' },
  { value: 'all', label: 'Toàn bộ lịch sử' },
];

const WEEKDAYS = [
  { label: 'T2', isodow: 1 },
  { label: 'T3', isodow: 2 },
  { label: 'T4', isodow: 3 },
  { label: 'T5', isodow: 4 },
  { label: 'T6', isodow: 5 },
  { label: 'T7', isodow: 6 },
  { label: 'CN', isodow: 7 },
];

export const DashboardView: React.FC<DashboardViewProps> = ({
  token,
  tenantSlug,
  companyName,
  onNavigateTab,
}) => {
  const [datePreset, setDatePreset] = useState('all');
  const [chartMode, setChartMode] = useState<'day' | 'hour' | 'heatmap'>('day');
  const [sourceMode, setSourceMode] = useState<'lead' | 'connection'>('lead');
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [warRoomOpen, setWarRoomOpen] = useState(false);

  const fetchDashboard = useCallback(async () => {
    const res = await apiRequest<DashboardData>(
      `/analytics/dashboard?date_preset=${datePreset}&chart_mode=${chartMode}&source_mode=${sourceMode}`,
      { token, tenantSlug }
    );
    return res;
  }, [token, tenantSlug, datePreset, chartMode, sourceMode]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetchDashboard();
        if (!cancelled) setData(res);
      } catch {
        // ignore cleanly
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [fetchDashboard]);

  const handleRefresh = async () => {
    setLoading(true);
    try {
      setData(await fetchDashboard());
    } finally {
      setLoading(false);
    }
  };

  const kpis = data?.kpis || {};
  const chartSeries = data?.chart_series || [];
  const heatmapMatrix = data?.heatmap_matrix || [];
  const maxBar = Math.max(1, ...chartSeries.map((c) => Number(c.total || 0)));
  const maxHeat = Math.max(1, ...heatmapMatrix.map((h) => Number(h.count || 0)));

  const heatLookup = new Map<string, number>();
  for (const h of heatmapMatrix) {
    heatLookup.set(`${h.wday}-${h.hour}`, Number(h.count || 0));
  }

  return (
    <div className="space-y-6">
      <div
        data-tour="dash-date-filter"
        className="inkica-glass-card flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4"
      >
        <div>
          <h1 className="text-xl font-bold text-slate-900">Bảng Điều Khiển Vận Hành • {companyName}</h1>
          <p className="text-xs text-slate-500">Tổng hợp luồng tiếp nhận, phân bổ vòng quay & SLA theo thời gian thực</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={datePreset}
            onChange={(e) => setDatePreset(e.target.value)}
            className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 outline-none focus:border-[#1E40FF]"
          >
            {DATE_PRESETS.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={() => setWarRoomOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-3.5 py-2 text-xs font-semibold text-white transition hover:bg-[#1E40FF]"
          >
            <Maximize2 className="h-3.5 w-3.5" />
            WarRoom Trực Chiến
          </button>

          <button
            type="button"
            onClick={() => void handleRefresh()}
            className="ql-btn-outline inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            Làm mới
          </button>
        </div>
      </div>

      <div data-tour="dash-kpis" className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="inkica-glass-card rounded-2xl border border-slate-200 bg-white p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Tổng Data Tiếp Nhận</span>
            <Layers className="h-4 w-4 text-[#1E40FF]" />
          </div>
          <p className="mt-2 text-3xl font-extrabold text-slate-900">{kpis.total_received ?? kpis.total_leads ?? 0}</p>
          <p className="mt-1 text-xs text-slate-500">
            Trong đó {kpis.total_leads ?? 0} đã vào CRM • {kpis.duplicate_leads ?? 0} trùng lặp
          </p>
        </div>

        <div
          onClick={() => onNavigateTab('data_list')}
          className="inkica-glass-card cursor-pointer rounded-2xl border border-slate-200 bg-white p-5 transition hover:border-[#1E40FF]"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Đã Chia Vòng Thành Công</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          </div>
          <p className="mt-2 text-3xl font-extrabold text-emerald-600">{kpis.assigned_leads ?? 0}</p>
          <p className="mt-1 text-xs text-slate-500">
            Tiếp nhận: {kpis.acceptance_rate_pct ?? 0}% • SLA đạt: {kpis.sla_compliance_pct ?? 100}%
          </p>
        </div>

        <div
          onClick={() => onNavigateTab('tickets')}
          className="inkica-glass-card cursor-pointer rounded-2xl border border-slate-200 bg-white p-5 transition hover:border-amber-400"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Ticket & Data Lỗi / Giữ Lại</span>
            <AlertTriangle className="h-4 w-4 text-amber-500" />
          </div>
          <p className="mt-2 text-3xl font-extrabold text-amber-600">
            {(kpis.error_tickets ?? 0) + (kpis.held_leads ?? 0) + (kpis.blacklisted_leads ?? 0)}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            {kpis.error_tickets ?? 0} ticket • {kpis.held_leads ?? 0} giữ lại • {kpis.blacklisted_leads ?? 0} blacklist
          </p>
        </div>

        <div
          onClick={() => onNavigateTab('integrations')}
          className="inkica-glass-card cursor-pointer rounded-2xl border border-slate-200 bg-white p-5 transition hover:border-[#0284C7]"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Meta CAPI & Tín Hiệu</span>
            <Activity className="h-4 w-4 text-[#0284C7]" />
          </div>
          <p className="mt-2 text-3xl font-extrabold text-[#0284C7]">{kpis.capi_200_count ?? 0}</p>
          <p className="mt-1 text-xs text-slate-500">
            Đã chốt / Won: {kpis.won_leads ?? 0} • Zalo gửi: {kpis.zalo_sent_count ?? 0}
          </p>
        </div>
      </div>

      <div data-tour="dash-charts" className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="inkica-glass-card rounded-2xl border border-slate-200 bg-white p-5 lg:col-span-2">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-[#1E40FF]" />
              <h2 className="text-sm font-bold text-slate-900">Phân Bổ Lưu Lượng Lead</h2>
            </div>
            <div className="flex rounded-xl bg-slate-100 p-0.5 text-xs font-semibold">
              {(['day', 'hour', 'heatmap'] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setChartMode(m)}
                  className={`rounded-lg px-3 py-1 transition ${
                    chartMode === m ? 'bg-white text-[#1E40FF] shadow-sm' : 'text-slate-600'
                  }`}
                >
                  {m === 'day' ? 'Theo Ngày' : m === 'hour' ? 'Theo Giờ' : 'Heatmap 7×24'}
                </button>
              ))}
            </div>
          </div>

          {chartMode !== 'heatmap' ? (
            <div className="flex h-64 items-end gap-2 overflow-x-auto pb-2 pt-4">
              {chartSeries.length === 0 ? (
                <div className="flex h-full w-full items-center justify-center text-sm text-slate-400">
                  Chưa có dữ liệu biểu đồ trong khoảng thời gian đã chọn.
                </div>
              ) : (
                chartSeries.map((pt, idx) => {
                  const pct = Math.max(6, Math.round((Number(pt.total || 0) / maxBar) * 100));
                  return (
                    <div key={`${pt.label}-${idx}`} className="flex min-w-[28px] flex-1 flex-col items-center gap-1.5">
                      <span className="text-[10px] font-semibold text-slate-600">{pt.total}</span>
                      <div className="flex h-44 w-full items-end justify-center rounded-t-lg bg-slate-50 px-1">
                        <div
                          style={{ height: `${pct}%` }}
                          className="w-full max-w-[28px] rounded-t-lg bg-gradient-to-t from-[#1E40FF] to-[#0284C7] transition-all"
                          title={`${pt.label}: ${pt.total} tổng / ${pt.assigned} đã chia`}
                        />
                      </div>
                      <span className="truncate text-[10px] text-slate-500">{pt.label}</span>
                    </div>
                  );
                })
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <div className="min-w-[640px] space-y-1">
                <div className="grid grid-cols-[36px_repeat(24,minmax(0,1fr))] gap-1 text-center text-[10px] text-slate-400">
                  <span />
                  {Array.from({ length: 24 }, (_, hr) => (
                    <span key={hr}>{hr}</span>
                  ))}
                </div>
                {WEEKDAYS.map((day) => (
                  <div key={day.label} className="grid grid-cols-[36px_repeat(24,minmax(0,1fr))] items-center gap-1">
                    <span className="text-[11px] font-semibold text-slate-600">{day.label}</span>
                    {Array.from({ length: 24 }, (_, hr) => {
                      const cnt = heatLookup.get(`${day.isodow}-${hr}`) || 0;
                      const intensity = cnt === 0 ? 0 : Math.min(4, Math.ceil((cnt / maxHeat) * 4));
                      const bgClass =
                        intensity === 0
                          ? 'bg-slate-100'
                          : intensity === 1
                            ? 'bg-blue-200'
                            : intensity === 2
                              ? 'bg-blue-400'
                              : intensity === 3
                                ? 'bg-[#2563EB]'
                                : 'bg-[#1E40FF]';
                      return (
                        <div
                          key={hr}
                          title={`${day.label} ${hr}:00 — ${cnt} leads`}
                          className={`h-5 rounded ${bgClass} transition`}
                        />
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="inkica-glass-card rounded-2xl border border-slate-200 bg-white p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900">Phân Bổ Theo Nguồn</h2>
            <div className="flex rounded-lg bg-slate-100 p-0.5 text-[11px] font-semibold">
              <button
                type="button"
                onClick={() => setSourceMode('lead')}
                className={`rounded-md px-2.5 py-1 ${sourceMode === 'lead' ? 'bg-white text-[#1E40FF]' : 'text-slate-500'}`}
              >
                Nguồn Lead
              </button>
              <button
                type="button"
                onClick={() => setSourceMode('connection')}
                className={`rounded-md px-2.5 py-1 ${
                  sourceMode === 'connection' ? 'bg-white text-[#1E40FF]' : 'text-slate-500'
                }`}
              >
                Kết nối
              </button>
            </div>
          </div>

          <div className="space-y-3">
            {(data?.by_source || []).map((src, i) => {
              const total = Math.max(1, kpis.total_leads || 1);
              const pct = Math.min(100, Math.round((Number(src.count || 0) / total) * 100));
              return (
                <div key={`${src.label}-${i}`}>
                  <div className="mb-1 flex justify-between text-xs">
                    <span className="truncate font-medium text-slate-700">{src.label}</span>
                    <span className="font-bold text-slate-900">{src.count}</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                    <div style={{ width: `${pct}%` }} className="h-full rounded-full bg-[#1E40FF]" />
                  </div>
                </div>
              );
            })}
            {(data?.by_source || []).length === 0 && (
              <p className="text-xs text-slate-400">Chưa ghi nhận nguồn tiếp nhận.</p>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="inkica-glass-card rounded-2xl border border-slate-200 bg-white p-5">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-[#1E40FF]" />
              <h2 className="text-sm font-bold text-slate-900">Phân Bổ Sale & Đại Lý F1</h2>
            </div>
            <button
              type="button"
              onClick={() => onNavigateTab('consultants')}
              className="text-xs font-semibold text-[#1E40FF] hover:underline"
            >
              Quản lý nhân sự →
            </button>
          </div>
          <div className="space-y-2.5">
            {(data?.by_consultant || []).map((c) => (
              <div
                key={c.id}
                className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/70 px-3.5 py-2.5"
              >
                <div>
                  <p className="text-sm font-semibold text-slate-900">
                    {c.full_name}{' '}
                    {c.is_external_agency && (
                      <span className="ml-1 rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-semibold text-[#1E40FF]">
                        Đại lý F1
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-slate-500">{c.email}</p>
                </div>
                <div className="text-right">
                  <p className="text-base font-extrabold text-slate-900">{c.lead_count} lead</p>
                  <p className="text-[11px] text-emerald-600">Đã nhận: {c.accepted_count}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="inkica-glass-card rounded-2xl border border-slate-200 bg-white p-5">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Flame className="h-4 w-4 text-[#0284C7]" />
              <h2 className="text-sm font-bold text-slate-900">Lead Đổ Về Gần Nhất</h2>
            </div>
            <button
              type="button"
              onClick={() => onNavigateTab('data_list')}
              className="text-xs font-semibold text-[#1E40FF] hover:underline"
            >
              Xem tất cả →
            </button>
          </div>
          <div className="space-y-2">
            {(data?.recent_logs || []).slice(0, 7).map((row) => (
              <div
                key={row.id}
                className="flex items-center justify-between rounded-xl border border-slate-100 px-3 py-2 text-xs"
              >
                <div className="min-w-0">
                  <p className="truncate font-semibold text-slate-900">{row.name}</p>
                  <p className="text-slate-500">
                    {row.phone} • {row.source}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <span className="inline-block rounded-full bg-blue-50 px-2.5 py-0.5 text-[11px] font-semibold text-[#1E40FF]">
                    {row.assigned_sale_name || 'Chờ chia'}
                  </span>
                  <p className="mt-0.5 text-[10px] text-slate-400">{formatShortDate(row.created_at)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {warRoomOpen && (
        <div className="fixed inset-0 z-50 flex flex-col bg-slate-950 p-6 text-white">
          <div className="mb-6 flex items-center justify-between border-b border-slate-800 pb-4">
            <div className="flex items-center gap-3">
              <span className="h-3 w-3 animate-pulse rounded-full bg-emerald-400" />
              <h2 className="text-xl font-extrabold tracking-tight">
                WAR ROOM FLIGHT DECK • {companyName.toUpperCase()}
              </h2>
            </div>
            <button
              type="button"
              onClick={() => setWarRoomOpen(false)}
              className="inline-flex items-center gap-1.5 rounded-xl bg-slate-800 px-4 py-2 text-xs font-semibold hover:bg-slate-700"
            >
              <X className="h-4 w-4" /> Thoát WarRoom
            </button>
          </div>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
              <p className="text-xs text-slate-400">TỔNG DATA TIẾP NHẬN</p>
              <p className="mt-2 text-4xl font-black text-blue-400">{kpis.total_received ?? 0}</p>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
              <p className="text-xs text-slate-400">ĐÃ CHIA VÒNG</p>
              <p className="mt-2 text-4xl font-black text-emerald-400">{kpis.assigned_leads ?? 0}</p>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
              <p className="text-xs text-slate-400">TRÙNG LẶP / GIỮ LẠI</p>
              <p className="mt-2 text-4xl font-black text-amber-400">
                {(kpis.duplicate_leads ?? 0) + (kpis.held_leads ?? 0)}
              </p>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
              <p className="text-xs text-slate-400">TUÂN THỦ SLA</p>
              <p className="mt-2 text-4xl font-black text-cyan-400">{kpis.sla_compliance_pct ?? 100}%</p>
            </div>
          </div>
          <div className="mt-6 grid flex-1 grid-cols-1 gap-6 overflow-hidden lg:grid-cols-2">
            <div className="overflow-y-auto rounded-2xl border border-slate-800 bg-slate-900 p-5">
              <h3 className="mb-4 flex items-center gap-2 text-sm font-bold text-slate-300">
                <ShieldAlert className="h-4 w-4 text-blue-400" /> BẢNG XẾP HẠNG PHÂN BỔ REAL-TIME
              </h3>
              <div className="space-y-3">
                {(data?.by_consultant || []).map((c) => (
                  <div key={c.id} className="flex items-center justify-between rounded-xl bg-slate-800/80 p-3.5">
                    <div>
                      <p className="font-bold text-white">{c.full_name}</p>
                      <p className="text-xs text-slate-400">{c.is_available ? 'Đang trực ca' : 'Tạm ngưng'}</p>
                    </div>
                    <p className="text-2xl font-black text-emerald-400">{c.lead_count}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="overflow-y-auto rounded-2xl border border-slate-800 bg-slate-900 p-5">
              <h3 className="mb-4 text-sm font-bold text-slate-300">LIVE INTAKE STREAM</h3>
              <div className="space-y-2.5">
                {(data?.recent_logs || []).map((row) => (
                  <div key={row.id} className="flex items-center justify-between rounded-xl bg-slate-800/70 px-4 py-2.5 text-sm">
                    <span>
                      <strong className="text-white">{row.name}</strong>{' '}
                      <span className="text-slate-400">({row.source})</span>
                    </span>
                    <span className="text-xs font-semibold text-cyan-300">{row.assigned_sale_name || 'Chờ chia'}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
