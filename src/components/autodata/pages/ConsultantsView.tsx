import React, { useCallback, useEffect, useState } from 'react';
import { Building2, Plus, RefreshCw, Trash2, UserCheck, UserPlus, Users, X } from 'lucide-react';
import { apiRequest, getErrorMessage } from '../autodataApi';
import { useAuth } from '../cloned/contexts/AuthContext';

interface ConsultantRow {
  id: string;
  full_name: string;
  email: string;
  role: string;
  is_external_agency?: boolean;
  total_assigned_leads?: number;
  co_managers_count?: number;
  profile?: {
    is_available?: boolean;
    vacation_mode?: boolean;
    is_silent?: boolean;
  };
}

interface CoManagerRow {
  id: string;
  name: string;
  email: string;
  phone?: string;
}

interface ConsultantsViewProps {
  token: string;
  tenantSlug: string;
}

export const ConsultantsView: React.FC<ConsultantsViewProps> = ({ token, tenantSlug }) => {
  let maxCoManagers = 3;
  try {
    maxCoManagers = Math.max(0, Number(useAuth().tenantSettings?.max_co_managers_per_consultant ?? 3));
  } catch {
    maxCoManagers = 3;
  }
  const [users, setUsers] = useState<ConsultantRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<string | null>(null);

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password] = useState('123456');
  const [role, setRole] = useState<'sale' | 'manager'>('sale');
  const [isAgency, setIsAgency] = useState(false);

  const [cmUser, setCmUser] = useState<ConsultantRow | null>(null);
  const [coManagers, setCoManagers] = useState<CoManagerRow[]>([]);
  const [cmName, setCmName] = useState('');
  const [cmEmail, setCmEmail] = useState('');
  const [cmPhone, setCmPhone] = useState('');

  const fetchUsers = useCallback(async () => {
    const res = await apiRequest<{ items: ConsultantRow[] }>('/users?limit=100', { token, tenantSlug });
    return res.items || [];
  }, [token, tenantSlug]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const list = await fetchUsers();
        if (!cancelled) setUsers(list);
      } catch {
        if (!cancelled) setUsers([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [fetchUsers]);

  const reload = async () => {
    setLoading(true);
    try {
      setUsers(await fetchUsers());
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiRequest('/users', {
        method: 'POST',
        token,
        tenantSlug,
        body: {
          full_name: fullName.trim(),
          email: email.trim(),
          phone: phone.trim() || undefined,
          password,
          role,
          is_external_agency: isAgency,
        },
      });
      setFullName('');
      setEmail('');
      setPhone('');
      setToast('Đã thêm Sale / Đại lý F1 mới.');
      void reload();
    } catch (err: unknown) {
      setToast(getErrorMessage(err, 'Không thể thêm nhân sự.'));
    }
  };

  const handleToggleProfile = async (u: ConsultantRow, field: 'is_available' | 'vacation_mode' | 'is_silent') => {
    try {
      await apiRequest(`/users/${u.id}`, {
        method: 'PATCH',
        token,
        tenantSlug,
        body: { [field]: !u.profile?.[field] },
      });
      void reload();
    } catch (err: unknown) {
      setToast(getErrorMessage(err, 'Không thể cập nhật trạng thái.'));
    }
  };

  const openCoManagers = async (u: ConsultantRow) => {
    setCmUser(u);
    try {
      const res = await apiRequest<{ items: CoManagerRow[] }>(`/operations/co-managers/${u.id}`, { token, tenantSlug });
      setCoManagers(res.items || []);
    } catch {
      setCoManagers([]);
    }
  };

  const handleAddCoManager = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cmUser) return;
    try {
      await apiRequest(`/operations/co-managers/${cmUser.id}`, {
        method: 'POST',
        token,
        tenantSlug,
        body: { name: cmName.trim(), email: cmEmail.trim(), phone: cmPhone.trim() || undefined },
      });
      setCmName('');
      setCmEmail('');
      setCmPhone('');
      await openCoManagers(cmUser);
      void reload();
    } catch (err: unknown) {
      setToast(getErrorMessage(err, 'Tối đa 3 Người đồng quản lý.'));
    }
  };

  const handleDeleteCoManager = async (cmId: string) => {
    if (!cmUser) return;
    try {
      await apiRequest(`/operations/co-managers/${cmId}`, { method: 'DELETE', token, tenantSlug });
      await openCoManagers(cmUser);
      void reload();
    } catch {
      // ignore
    }
  };

  return (
    <div className="space-y-6">
      <div className="inkica-glass-card flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-4">
        <div className="flex items-center gap-2.5">
          <Users className="h-5 w-5 text-[#1E40FF]" />
          <div>
            <h1 className="text-lg font-bold text-slate-900">Đội Ngũ Sale Nội Bộ & Đại Lý F1</h1>
            <p className="text-xs text-slate-500">Quản lý trạng thái trực ca, nghỉ phép, chế độ im lặng & tối đa 3 người đồng quản lý</p>
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

      <form onSubmit={handleCreateUser} className="inkica-glass-card grid grid-cols-1 gap-3 rounded-2xl border border-slate-200 bg-white p-4 md:grid-cols-6">
        <input type="text" required value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Tên Sale / Sàn F1" className="rounded-xl border border-slate-200 px-3 py-2 text-xs" />
        <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email đăng nhập" className="rounded-xl border border-slate-200 px-3 py-2 text-xs" />
        <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Số điện thoại" className="rounded-xl border border-slate-200 px-3 py-2 text-xs" />
        <select value={role} onChange={(e) => setRole(e.target.value as 'sale' | 'manager')} className="rounded-xl border border-slate-200 px-3 py-2 text-xs">
          <option value="sale">Sale / Đại lý</option>
          <option value="manager">Quản lý (Manager)</option>
        </select>
        <label className="flex items-center gap-2 px-2 text-xs font-semibold text-slate-700">
          <input type="checkbox" checked={isAgency} onChange={(e) => setIsAgency(e.target.checked)} className="h-4 w-4 accent-[#1E40FF]" />
          Đại lý F1 ngoài
        </label>
        <button type="submit" className="btn-inkica-primary inline-flex items-center justify-center gap-1 rounded-xl px-4 py-2 text-xs font-semibold text-white">
          <UserPlus className="h-4 w-4" /> Thêm nhân sự
        </button>
      </form>

      <div data-tour="consultants-list" className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {users.map((u) => (
          <div key={u.id} className="inkica-glass-card flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-4 text-xs">
            <div>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-bold text-slate-900">{u.full_name}</p>
                  <p className="text-[11px] text-slate-500">{u.email}</p>
                </div>
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${u.is_external_agency ? 'bg-blue-100 text-[#1E40FF]' : 'bg-slate-100 text-slate-700'}`}>
                  {u.is_external_agency ? 'F1 Agency' : u.role}
                </span>
              </div>

              <div className="mt-3 flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() => void handleToggleProfile(u, 'is_available')}
                  className={`rounded-lg px-2.5 py-1 font-semibold ${
                    u.profile?.is_available ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  {u.profile?.is_available ? '● Đang Trực' : '○ Nghỉ Trực'}
                </button>
                <button
                  type="button"
                  onClick={() => void handleToggleProfile(u, 'vacation_mode')}
                  className={`rounded-lg px-2.5 py-1 font-semibold ${
                    u.profile?.vacation_mode ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  {u.profile?.vacation_mode ? 'Nghỉ phép' : 'Bình thường'}
                </button>
                <button
                  type="button"
                  onClick={() => void handleToggleProfile(u, 'is_silent')}
                  className={`rounded-lg px-2.5 py-1 font-semibold ${
                    u.profile?.is_silent ? 'bg-purple-100 text-purple-700' : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  {u.profile?.is_silent ? 'Silent' : 'Notify On'}
                </button>
              </div>
            </div>

            <div data-tour="consultants-comanagers" className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
              <span className="font-semibold text-slate-700">
                Tổng Lead: <strong className="text-[#1E40FF]">{u.total_assigned_leads || 0}</strong>
              </span>
              <button
                type="button"
                onClick={() => void openCoManagers(u)}
                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1 font-semibold text-slate-700 hover:border-[#1E40FF] hover:text-[#1E40FF]"
              >
                <Building2 className="h-3.5 w-3.5" /> Đồng quản lý ({u.co_managers_count || 0}/3)
              </button>
            </div>
          </div>
        ))}
      </div>

      {cmUser && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/40 backdrop-blur-xs">
          <div className="flex h-full w-full max-w-md flex-col bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between border-b border-slate-100 pb-4">
              <div>
                <p className="text-xs font-bold uppercase text-[#0284C7]">Người Đồng Quản Lý (Tối đa {maxCoManagers})</p>
                <h3 className="text-lg font-bold text-slate-900">{cmUser.full_name}</h3>
              </div>
              <button type="button" onClick={() => setCmUser(null)} className="rounded-lg p-1 hover:bg-slate-100">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleAddCoManager} className="my-4 space-y-2.5 rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs">
              <input type="text" required value={cmName} onChange={(e) => setCmName(e.target.value)} placeholder="Tên quản lý phụ" className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2" />
              <input type="email" required value={cmEmail} onChange={(e) => setCmEmail(e.target.value)} placeholder="Email nhận CC" className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2" />
              <input type="tel" value={cmPhone} onChange={(e) => setCmPhone(e.target.value)} placeholder="SĐT Zalo" className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2" />
              <button
                type="submit"
                disabled={maxCoManagers <= 0 || coManagers.length >= maxCoManagers}
                className="btn-inkica-primary flex w-full items-center justify-center gap-1 rounded-xl py-2 font-semibold text-white disabled:opacity-50"
              >
                <Plus className="h-4 w-4" /> Thêm Người Đồng Quản Lý ({coManagers.length}/{maxCoManagers})
              </button>
            </form>

            <div className="flex-1 space-y-2 overflow-y-auto">
              {coManagers.map((cm) => (
                <div key={cm.id} className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/70 p-3 text-xs">
                  <div>
                    <p className="font-bold text-slate-900 flex items-center gap-1">
                      <UserCheck className="h-3.5 w-3.5 text-emerald-600" /> {cm.name}
                    </p>
                    <p className="text-slate-500">{cm.email} {cm.phone ? `• ${cm.phone}` : ''}</p>
                  </div>
                  <button type="button" onClick={() => void handleDeleteCoManager(cm.id)} className="rounded-lg p-1 text-rose-600 hover:bg-rose-50">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
              {coManagers.length === 0 && <p className="text-xs text-slate-400">Chưa có người đồng quản lý nào.</p>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
