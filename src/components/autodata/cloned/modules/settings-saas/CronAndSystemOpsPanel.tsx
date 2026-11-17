import React, { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import {
  Activity,
  Database,
  History,
  Layers,
  Play,
  RotateCcw,
  Save,
} from 'lucide-react';
import { apiRequest, getErrorMessage } from '../../../autodataApi';
import { PACKAGE_CATALOG, type SaasPackageCode } from '../../contexts/entitlementConstants';
import { useEntitlement } from '../../contexts/EntitlementContext';
import { TableSkeleton } from '../../components/ui/Skeleton';

interface CronSubroutineMeta {
  key: string;
  name: string;
  schedule: string;
}

interface CronRunLog {
  id: string;
  subroutine_key: string;
  status: string;
  items_processed: number;
  duration_ms: number;
  error_message?: string | null;
  triggered_by?: string;
  started_at: string;
}

interface AuditLogEntry {
  id: string;
  actor_name?: string;
  action: string;
  entity_type?: string;
  entity_id?: string;
  created_at: string;
}

export const CronAndSystemOpsPanel: React.FC = () => {
  const { packageCode, educationAddon, can, switchPackage, refreshEntitlements } = useEntitlement();
  const canManage = can('settings', 'manage_config');

  const [loading, setLoading] = useState(true);
  const [switchingPkg, setSwitchingPkg] = useState(false);
  const [subroutines, setSubroutines] = useState<CronSubroutineMeta[]>([]);
  const [cronRuns, setCronRuns] = useState<CronRunLog[]>([]);
  const [runningCron, setRunningCron] = useState(false);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);

  const [retentionDays, setRetentionDays] = useState('365');
  const [maxExportRows, setMaxExportRows] = useState('5000');
  const [tablePageSize, setTablePageSize] = useState('50');
  const [savingRetention, setSavingRetention] = useState(false);
  const [eduAddonOverride, setEduAddonOverride] = useState<boolean | null>(null);
  const eduAddonLocal = eduAddonOverride ?? educationAddon;

  const loadAll = useCallback(async () => {
    try {
      const [cronRes, auditRes] = await Promise.all([
        apiRequest<{ subroutines?: CronSubroutineMeta[]; runs?: CronRunLog[] }>('/org-rbac/cron-status').catch(
          () => ({ subroutines: [], runs: [] })
        ),
        apiRequest<AuditLogEntry[]>('/operations/admin-audit').catch(() => []),
      ]);
      setSubroutines(Array.isArray(cronRes?.subroutines) ? cronRes.subroutines : []);
      setCronRuns(Array.isArray(cronRes?.runs) ? cronRes.runs : []);
      setAuditLogs(Array.isArray(auditRes) ? auditRes.slice(0, 20) : []);
    } catch (err) {
      toast.error(getErrorMessage(err, 'Không thể tải trạng thái Cron & Audit Log'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    (async () => {
      if (active) await loadAll();
    })();
    return () => {
      active = false;
    };
  }, [loadAll]);

  const handleSwitchPackage = async (pkg: SaasPackageCode) => {
    setSwitchingPkg(true);
    try {
      await switchPackage(pkg);
      toast.success(`Đã chuyển sang gói dịch vụ ${PACKAGE_CATALOG[pkg]?.name || pkg}`);
    } catch (err) {
      toast.error(getErrorMessage(err, 'Không thể chuyển gói dịch vụ'));
    } finally {
      setSwitchingPkg(false);
    }
  };

  const handleToggleEducationAddon = async (nextVal: boolean) => {
    const prev = eduAddonOverride;
    setEduAddonOverride(nextVal);
    try {
      await apiRequest('/org-rbac/terminology', {
        method: 'PUT',
        body: {
          education_addon: nextVal,
          enable_ideas_mascot: false,
        },
      });
      await refreshEntitlements().catch(() => undefined);
      toast.success(nextVal ? 'Đã kích hoạt Add-on Đào tạo & Học vụ' : 'Đã tắt Add-on Đào tạo');
    } catch (err) {
      setEduAddonOverride(prev);
      toast.error(getErrorMessage(err, 'Không thể cập nhật Add-on Đào tạo'));
    }
  };

  const handleRunCron = async (key?: string) => {
    setRunningCron(true);
    try {
      const payload = key ? { subroutine_key: key } : { subroutines: ['sla', 'drain', 'webhook', 'capi'] };
      const res = await apiRequest<{ run_log?: CronRunLog }>('/org-rbac/cron-status/run', {
        method: 'POST',
        body: payload,
      });
      if (res?.run_log) {
        setCronRuns((prev) => [res.run_log!, ...prev]);
      }
      toast.success(`Đã kích hoạt Cron "${key || 'tổng hợp'}" thành công`);
    } catch (err) {
      toast.error(getErrorMessage(err, 'Không thể chạy tiến trình Cron'));
    } finally {
      setRunningCron(false);
    }
  };

  const handleSaveRetention = async () => {
    setSavingRetention(true);
    try {
      await apiRequest('/auth/tenant-settings', {
        method: 'PATCH',
        body: {
          settings: {
            max_export_rows: Number(maxExportRows) || 5000,
            default_table_page_size: Number(tablePageSize) || 50,
            duplicate_threshold_days: Number(retentionDays) || 365,
            enable_ideas_mascot: false,
          },
        },
      });
      toast.success('Đã lưu cấu hình Lưu trữ, Retention & Hạn mức Xuất');
    } catch (err) {
      toast.error(getErrorMessage(err, 'Không thể lưu cấu hình Retention'));
    } finally {
      setSavingRetention(false);
    }
  };

  const handleRollbackAudit = async (auditId: string) => {
    try {
      await apiRequest(`/operations/admin-audit/${auditId}/rollback`, { method: 'POST' });
      toast.success('Đã khôi phục (Rollback) thay đổi từ nhật ký kiểm toán');
      await loadAll();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Không thể rollback nhật ký này'));
    }
  };

  if (loading) return <TableSkeleton rows={5} cols={4} />;

  return (
    <div className="space-y-6">
      {/* 1. 4 SaaS Packages + Add-ons */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#1E40FF] flex items-center justify-center">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                4 Gói Dịch vụ Modular SaaS & Tùy chọn Bổ sung
              </h3>
              <p className="text-xs text-slate-500">
                Chọn đúng gói tính năng doanh nghiệp cần; mọi menu và ma trận phân quyền tự động mở khóa theo gói.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <label className="inline-flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer px-3 py-2 rounded-xl border border-slate-200 bg-slate-50">
              <input
                type="checkbox"
                disabled={!canManage}
                checked={eduAddonLocal}
                onChange={(e) => void handleToggleEducationAddon(e.target.checked)}
                className="rounded border-slate-300 text-[#1E40FF]"
              />
              Add-on Đào tạo & Học vụ (Education)
            </label>
            <span className="px-3 py-2 rounded-xl bg-slate-100 text-xs font-medium text-slate-500">
              Mascot nội bộ: Tắt mặc định (Chuẩn thương mại B2B)
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {(Object.keys(PACKAGE_CATALOG) as SaasPackageCode[]).map((code) => {
            const meta = PACKAGE_CATALOG[code];
            const active = packageCode === code;
            return (
              <div
                key={code}
                className={`p-4 rounded-xl border flex flex-col justify-between gap-3 ${
                  active ? 'border-[#1E40FF] bg-blue-50/70 ring-1 ring-[#1E40FF]' : 'border-slate-200 bg-white'
                }`}
              >
                <div>
                  <div className="text-sm font-bold text-slate-900">{meta.name}</div>
                  <div className="text-xs font-semibold text-[#1E40FF] mt-0.5 tabular-nums">
                    {meta.priceLabel}
                  </div>
                  <div className="text-xs text-slate-500 mt-1.5">{meta.tagline}</div>
                </div>
                <button
                  type="button"
                  disabled={active || switchingPkg || !canManage}
                  onClick={() => void handleSwitchPackage(code)}
                  className={`h-9 w-full rounded-xl text-xs font-semibold transition ${
                    active
                      ? 'bg-emerald-600 text-white cursor-default'
                      : 'bg-slate-900 hover:bg-[#1E40FF] text-white disabled:opacity-50'
                  }`}
                >
                  {active ? 'Gói đang kích hoạt' : switchingPkg ? 'Đang chuyển...' : 'Kích hoạt gói này'}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. Cron Monitor & Retention Health */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-[#1E40FF]" />
              <h4 className="text-sm font-bold text-slate-900">Trạng thái Tiến trình Tự động (Master Cron)</h4>
            </div>
            {canManage && (
              <button
                type="button"
                disabled={runningCron}
                onClick={() => void handleRunCron()}
                className="h-9 px-3.5 rounded-xl bg-[#1E40FF] hover:bg-blue-700 text-white text-xs font-semibold inline-flex items-center gap-1.5 disabled:opacity-50"
              >
                <Play className="w-3.5 h-3.5" /> {runningCron ? 'Đang chạy...' : 'Chạy tất cả ngay'}
              </button>
            )}
          </div>

          <div className="space-y-2">
            {subroutines.map((sub) => (
              <div
                key={sub.key}
                className="p-3 rounded-xl border border-slate-200 flex items-center justify-between gap-2"
              >
                <div>
                  <div className="text-xs font-bold text-slate-900">{sub.name}</div>
                  <div className="text-[11px] font-mono text-slate-500">
                    {sub.key} • lịch: {sub.schedule}
                  </div>
                </div>
                {canManage && (
                  <button
                    type="button"
                    disabled={runningCron}
                    onClick={() => void handleRunCron(sub.key)}
                    className="h-8 px-2.5 rounded-lg border border-slate-200 hover:border-[#1E40FF] text-xs font-semibold text-[#1E40FF]"
                  >
                    Trigger
                  </button>
                )}
              </div>
            ))}
          </div>

          {cronRuns.length > 0 && (
            <div className="space-y-1.5 pt-2">
              <div className="text-xs font-bold text-slate-600 uppercase">Lần chạy gần nhất</div>
              {cronRuns.slice(0, 5).map((run) => (
                <div
                  key={run.id}
                  className="text-xs flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-100"
                >
                  <span className="font-mono text-slate-700">{run.subroutine_key}</span>
                  <span
                    className={`font-semibold ${
                      run.status === 'success' ? 'text-emerald-700' : 'text-amber-700'
                    }`}
                  >
                    {run.status} • {run.items_processed} mục • {run.duration_ms}ms
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-6">
          {/* Retention & Storage Health */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <Database className="w-5 h-5 text-[#1E40FF]" />
              <h4 className="text-sm font-bold text-slate-900">Hạn mức Dữ liệu, Xuất Excel & Lưu trữ</h4>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Cửa sổ lọc trùng (ngày)
                </label>
                <input
                  type="number"
                  min={1}
                  value={retentionDays}
                  onChange={(e) => setRetentionDays(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl border border-slate-200 text-sm tabular-nums"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Số dòng Export tối đa
                </label>
                <input
                  type="number"
                  min={100}
                  value={maxExportRows}
                  onChange={(e) => setMaxExportRows(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl border border-slate-200 text-sm tabular-nums"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Phân trang mặc định
                </label>
                <input
                  type="number"
                  min={10}
                  value={tablePageSize}
                  onChange={(e) => setTablePageSize(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl border border-slate-200 text-sm tabular-nums"
                />
              </div>
            </div>
            {canManage && (
              <button
                type="button"
                disabled={savingRetention}
                onClick={() => void handleSaveRetention()}
                className="h-10 px-4 rounded-xl bg-[#1E40FF] hover:bg-blue-700 text-white text-xs font-semibold inline-flex items-center gap-1.5"
              >
                <Save className="w-3.5 h-3.5" /> {savingRetention ? 'Đang lưu...' : 'Lưu Tham số Lưu trữ'}
              </button>
            )}
          </div>

          {/* Audit Rollback Log */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-3">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <History className="w-5 h-5 text-[#1E40FF]" />
              <h4 className="text-sm font-bold text-slate-900">Nhật ký Kiểm toán & Khôi phục (Audit Rollback)</h4>
            </div>
            {auditLogs.length === 0 ? (
              <div className="text-xs text-slate-500 py-4 text-center">Chưa ghi nhận nhật ký kiểm toán nào.</div>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {auditLogs.map((log) => (
                  <div
                    key={log.id}
                    className="p-3 rounded-xl border border-slate-200 flex items-center justify-between gap-2 text-xs"
                  >
                    <div>
                      <div className="font-bold text-slate-900">
                        {log.action} {log.entity_type ? `• ${log.entity_type}` : ''}
                      </div>
                      <div className="text-slate-500">
                        {log.actor_name || 'Admin'} • {new Date(log.created_at).toLocaleString('vi-VN')}
                      </div>
                    </div>
                    {canManage && (
                      <button
                        type="button"
                        onClick={() => void handleRollbackAudit(log.id)}
                        className="h-8 px-2.5 rounded-lg border border-slate-200 hover:border-[#1E40FF] text-[#1E40FF] font-semibold inline-flex items-center gap-1"
                      >
                        <RotateCcw className="w-3 h-3" /> Rollback
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
