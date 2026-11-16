import React, { useCallback, useEffect, useState } from 'react';
import { History, RefreshCw, RotateCcw, Shield } from 'lucide-react';
import { apiRequest, formatShortDate, getErrorMessage } from '../autodataApi';

interface AccountUser {
  id: string;
  full_name: string;
  email: string;
  role: string;
}

interface AuditLogRow {
  id: string;
  action: string;
  entity_type: string;
  actor_name?: string;
  is_rolled_back?: boolean;
  created_at: string;
}

interface AccountsViewProps {
  token: string;
  tenantSlug: string;
}

export const AccountsView: React.FC<AccountsViewProps> = ({ token, tenantSlug }) => {
  const [accounts, setAccounts] = useState<AccountUser[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    const [uRes, aRes] = await Promise.all([
      apiRequest<{ items: AccountUser[] }>('/users?limit=100', { token, tenantSlug }),
      apiRequest<{ items: AuditLogRow[] }>('/operations/admin-audit', { token, tenantSlug }),
    ]);
    return { uRes, aRes };
  }, [token, tenantSlug]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { uRes, aRes } = await fetchData();
        if (!cancelled) {
          setAccounts((uRes?.items || []).filter((u) => u.role === 'tenant_admin' || u.role === 'manager'));
          setAuditLogs(aRes?.items || []);
        }
      } catch {
        if (!cancelled) setAuditLogs([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [fetchData]);

  const reload = async () => {
    setLoading(true);
    try {
      const { uRes, aRes } = await fetchData();
      setAccounts((uRes?.items || []).filter((u) => u.role === 'tenant_admin' || u.role === 'manager'));
      setAuditLogs(aRes?.items || []);
    } finally {
      setLoading(false);
    }
  };

  const handleRollback = async (logId: string) => {
    try {
      await apiRequest(`/operations/admin-audit/${logId}/rollback`, {
        method: 'POST',
        token,
        tenantSlug,
      });
      setToast('Đã hoàn tác (Rollback) thao tác thành công.');
      void reload();
    } catch (err: unknown) {
      setToast(getErrorMessage(err, 'Không thể hoàn tác.'));
    }
  };

  return (
    <div className="space-y-6">
      <div className="inkica-glass-card flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-4">
        <div className="flex items-center gap-2.5">
          <Shield className="h-5 w-5 text-[#1E40FF]" />
          <div>
            <h1 className="text-lg font-bold text-slate-900">Tài Khoản Quản Trị & Nhật Ký Hoàn Tác (Rollback)</h1>
            <p className="text-xs text-slate-500">Theo dõi các tài khoản Admin/Manager và lịch sử thay đổi hệ thống</p>
          </div>
        </div>
        <button type="button" onClick={() => void reload()} className="rounded-xl border border-slate-200 p-2">
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {toast && (
        <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-2.5 text-xs font-semibold text-[#1E40FF]">
          {toast}
        </div>
      )}

      <div className="inkica-glass-card rounded-2xl border border-slate-200 bg-white p-5">
        <h2 className="mb-3 text-sm font-bold text-slate-900">Quản Trị Viên & Quản Lý ({accounts.length})</h2>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          {accounts.map((a) => (
            <div key={a.id} className="rounded-xl border border-slate-100 bg-slate-50/70 p-3 text-xs">
              <p className="font-bold text-slate-900">{a.full_name}</p>
              <p className="text-slate-500">{a.email}</p>
              <span className="mt-1.5 inline-block rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-bold uppercase text-[#1E40FF]">
                {a.role}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div data-tour="accounts-audit" className="inkica-glass-card overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <div className="flex items-center gap-2 border-b border-slate-100 px-5 py-3.5">
          <History className="h-4 w-4 text-[#1E40FF]" />
          <h2 className="text-sm font-bold text-slate-900">Nhật Ký Kiểm Toán & Rollback</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">Hành động</th>
                <th className="px-4 py-3">Đối tượng</th>
                <th className="px-4 py-3">Người thực hiện</th>
                <th className="px-4 py-3">Thời gian</th>
                <th className="px-4 py-3 text-right">Hoàn tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {auditLogs.map((lg) => (
                <tr key={lg.id} className="hover:bg-slate-50/70">
                  <td className="px-4 py-3 font-mono font-semibold text-slate-800">{lg.action}</td>
                  <td className="px-4 py-3 text-slate-600">{lg.entity_type}</td>
                  <td className="px-4 py-3 text-slate-700">{lg.actor_name || 'Admin'}</td>
                  <td className="px-4 py-3 text-slate-500">{formatShortDate(lg.created_at)}</td>
                  <td className="px-4 py-3 text-right">
                    {lg.is_rolled_back ? (
                      <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-semibold text-slate-500">
                        Đã hoàn tác
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => void handleRollback(lg.id)}
                        className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1 font-semibold text-slate-700 hover:border-[#1E40FF] hover:text-[#1E40FF]"
                      >
                        <RotateCcw className="h-3.5 w-3.5" /> Rollback
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {!loading && auditLogs.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-slate-400">
                    Chưa có nhật ký thay đổi.
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
