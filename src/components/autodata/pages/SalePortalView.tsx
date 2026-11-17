import React, { useCallback, useEffect, useState } from 'react';
import {
  AlertCircle,
  Calendar,
  CheckCircle2,
  Clock,
  Download,
  FileSpreadsheet,
  LayoutDashboard,
  Plus,
  RefreshCw,
  Scale,
  Trash2,
  Upload,
  UserCheck,
  Users,
} from 'lucide-react';
import { apiRequest, formatShortDate, getErrorMessage } from '../autodataApi';
import { useOptionalAuth } from '../cloned/contexts/AuthContext';
import {
  buildPersonalLeadsCsvContent,
  parsePersonalLeadsCsvContent,
  type SalePortalTabKey,
} from '../autodataTypes';

interface SaleLeadItem {
  id: string;
  name: string;
  phone: string;
  source: string;
  is_accepted?: boolean;
  stage?: { id?: string; key?: string; name?: string; stage_name?: string; capi_event?: string; capi_event_mapping?: string } | null;
  created_at: string;
}

interface PersonalLeadRow {
  id: string;
  name: string;
  phone: string;
  product_interest?: string;
  note?: string;
  sheet_sync_status?: string;
  created_at: string;
}

interface SaleTicketRow {
  id: string;
  lead_name?: string;
  lead_phone?: string;
  reason: string;
  status: string;
}

interface SaleFairShareData {
  fairness_score_pct?: number;
  consultants?: Array<{
    id: string;
    name: string;
    assigned_count: number;
    expected_count: number;
    compensation_count: number;
  }>;
}

interface CoManagerRow {
  id: string;
  name: string;
  email: string;
  phone?: string;
}

interface AuthMeResponse {
  user?: {
    is_available?: boolean;
    vacation_mode?: boolean;
    zalo_chat_id?: string | null;
  };
}

interface SalePortalViewProps {
  token: string;
  tenantSlug: string;
  userId: string;
  userName: string;
  userEmail: string;
  stages: Array<{ id: string; stage_name: string }>;
}

const SALE_TABS: Array<{ key: SalePortalTabKey; label: string; icon: React.ReactNode }> = [
  { key: 'dashboard', label: '1. Tổng quan', icon: <LayoutDashboard className="h-3.5 w-3.5" /> },
  { key: 'data', label: '2. Data Được Giao', icon: <Users className="h-3.5 w-3.5" /> },
  { key: 'personal', label: '3. Khách Cá Nhân (0 Quota)', icon: <FileSpreadsheet className="h-3.5 w-3.5" /> },
  { key: 'calendar', label: '4. Lịch Hẹn', icon: <Calendar className="h-3.5 w-3.5" /> },
  { key: 'fair-share', label: '5. Đối Soát Công Bằng', icon: <Scale className="h-3.5 w-3.5" /> },
  { key: 'tickets', label: '6. Ticket Báo Lỗi', icon: <AlertCircle className="h-3.5 w-3.5" /> },
  { key: 'managers', label: '7. Đồng Quản Lý', icon: <UserCheck className="h-3.5 w-3.5" /> },
  { key: 'schedule', label: '8. Trạng Thái & Ca Trực', icon: <Clock className="h-3.5 w-3.5" /> },
];

export const SalePortalView: React.FC<SalePortalViewProps> = ({
  token,
  tenantSlug,
  userId,
  userName,
  userEmail,
  stages,
}) => {
  const optionalAuth = useOptionalAuth();
  const maxCoManagers = Math.max(
    0,
    Number(optionalAuth?.tenantSettings?.max_co_managers_per_consultant ?? 3)
  );
  const [tab, setTab] = useState<SalePortalTabKey>('dashboard');
  const [leads, setLeads] = useState<SaleLeadItem[]>([]);
  const [personalLeads, setPersonalLeads] = useState<PersonalLeadRow[]>([]);
  const [tickets, setTickets] = useState<SaleTicketRow[]>([]);
  const [fairData, setFairData] = useState<SaleFairShareData | null>(null);
  const [coManagers, setCoManagers] = useState<CoManagerRow[]>([]);
  const [isAvailable, setIsAvailable] = useState(true);
  const [vacationMode, setVacationMode] = useState(false);
  const [zaloChatId, setZaloChatId] = useState('');
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<string | null>(null);

  const [pName, setPName] = useState('');
  const [pPhone, setPPhone] = useState('');
  const [pProduct, setPProduct] = useState('');
  const [pNote, setPNote] = useState('');

  const [cmName, setCmName] = useState('');
  const [cmEmail, setCmEmail] = useState('');
  const [cmPhone, setCmPhone] = useState('');

  const fetchAll = useCallback(async () => {
    const [lRes, pRes, tRes, fRes, mRes, meRes] = await Promise.all([
      apiRequest<{ items: SaleLeadItem[] }>('/leads?limit=100', { token, tenantSlug }),
      apiRequest<{ items: PersonalLeadRow[] }>('/operations/personal-leads', { token, tenantSlug }),
      apiRequest<{ items?: SaleTicketRow[] } | SaleTicketRow[]>('/leads/tickets/list', { token, tenantSlug }),
      apiRequest<SaleFairShareData>('/analytics/fair-share', { token, tenantSlug }).catch(() => null),
      userId
        ? apiRequest<{ items: CoManagerRow[] }>(`/operations/co-managers/${userId}`, { token, tenantSlug }).catch(() => ({ items: [] }))
        : Promise.resolve({ items: [] }),
      apiRequest<AuthMeResponse>('/auth/me', { token, tenantSlug }).catch(() => null),
    ]);
    return { lRes, pRes, tRes, fRes, mRes, meRes };
  }, [token, tenantSlug, userId]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { lRes, pRes, tRes, fRes, mRes, meRes } = await fetchAll();
        if (!cancelled) {
          setLeads(lRes?.items || []);
          setPersonalLeads(pRes?.items || []);
          setTickets(Array.isArray(tRes) ? tRes : tRes?.items || []);
          setFairData(fRes);
          setCoManagers(mRes?.items || []);
          if (meRes?.user) {
            setIsAvailable(meRes.user.is_available !== false);
            setVacationMode(Boolean(meRes.user.vacation_mode));
            setZaloChatId(meRes.user.zalo_chat_id || '');
          }
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
      const { lRes, pRes, tRes, fRes, mRes, meRes } = await fetchAll();
      setLeads(lRes?.items || []);
      setPersonalLeads(pRes?.items || []);
      setTickets(Array.isArray(tRes) ? tRes : tRes?.items || []);
      setFairData(fRes);
      setCoManagers(mRes?.items || []);
      if (meRes?.user) {
        setIsAvailable(meRes.user.is_available !== false);
        setVacationMode(Boolean(meRes.user.vacation_mode));
        setZaloChatId(meRes.user.zalo_chat_id || '');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (leadId: string) => {
    try {
      await apiRequest(`/leads/${leadId}/accept`, { method: 'POST', token, tenantSlug });
      setToast('Đã tiếp nhận Lead thành công.');
      void reload();
    } catch (err: unknown) {
      setToast(getErrorMessage(err, 'Lỗi tiếp nhận.'));
    }
  };

  const handleReportError = async (leadId: string) => {
    try {
      await apiRequest(`/leads/${leadId}/tickets`, {
        method: 'POST',
        token,
        tenantSlug,
        body: { reason: 'Số sai định dạng / không liên lạc được', description: 'Báo lỗi từ Cổng Sale' },
      });
      setToast('Đã gửi Ticket báo lỗi để Admin xét duyệt bù lượt.');
      void reload();
    } catch (err: unknown) {
      setToast(getErrorMessage(err, 'Không thể gửi Ticket.'));
    }
  };

  const handleCreatePersonal = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiRequest('/operations/personal-leads', {
        method: 'POST',
        token,
        tenantSlug,
        body: {
          name: pName.trim(),
          phone: pPhone.trim(),
          product_interest: pProduct.trim() || undefined,
          note: pNote.trim() || undefined,
        },
      });
      setPName('');
      setPPhone('');
      setPProduct('');
      setPNote('');
      setToast('Đã lưu Khách Cá Nhân (0 trừ quota vòng chia, miễn thu hồi SLA).');
      void reload();
    } catch (err: unknown) {
      setToast(getErrorMessage(err, 'Không thể lưu Khách Cá Nhân.'));
    }
  };

  const handleDeletePersonal = async (id: string) => {
    try {
      await apiRequest(`/operations/personal-leads/${id}`, { method: 'DELETE', token, tenantSlug });
      void reload();
    } catch {
      // ignore
    }
  };

  const handlePersonalCsvUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const txt = await file.text();
    const drafts = parsePersonalLeadsCsvContent(txt, userName);
    let added = 0;
    for (const d of drafts.slice(0, 50)) {
      try {
        await apiRequest('/operations/personal-leads', {
          method: 'POST',
          token,
          tenantSlug,
          body: d,
        });
        added++;
      } catch {
        // skip invalid
      }
    }
    setToast(`Đã import ${added} khách cá nhân từ CSV.`);
    void reload();
  };

  const handleExportPersonal = () => {
    const csv = buildPersonalLeadsCsvContent(
      personalLeads.map((p) => ({
        id: p.id,
        name: p.name,
        phone: p.phone,
        sale_owner_name: userName,
        product_interest: p.product_interest || '',
        note: p.note || '',
        sheet_sync_status: p.sheet_sync_status || 'Lưu nội bộ trên Cổng Sale Cá Nhân',
        bypass_round_robin: true,
        quota_impact: 0,
        sla_recall_exempt: true,
        created_at: p.created_at || '',
      }))
    );
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `khach-ca-nhan-${tenantSlug}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleAddManager = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;
    try {
      await apiRequest(`/operations/co-managers/${userId}`, {
        method: 'POST',
        token,
        tenantSlug,
        body: { name: cmName.trim(), email: cmEmail.trim(), phone: cmPhone.trim() || undefined },
      });
      setCmName('');
      setCmEmail('');
      setCmPhone('');
      setToast('Đã thêm Người đồng quản lý.');
      void reload();
    } catch (err: unknown) {
      setToast(getErrorMessage(err, 'Đã đạt giới hạn tối đa 3 người đồng quản lý.'));
    }
  };

  const handleDeleteManager = async (id: string) => {
    try {
      await apiRequest(`/operations/co-managers/${id}`, { method: 'DELETE', token, tenantSlug });
      void reload();
    } catch {
      // ignore
    }
  };

  const handleSaveAvailability = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiRequest('/users/me/availability', {
        method: 'PATCH',
        token,
        tenantSlug,
        body: { is_available: isAvailable, vacation_mode: vacationMode, zalo_chat_id: zaloChatId.trim() || undefined },
      });
      setToast('Đã cập nhật trạng thái trực ca & Zalo Chat ID.');
    } catch (err: unknown) {
      setToast(getErrorMessage(err, 'Không thể cập nhật ca trực.'));
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
      setToast('Đã cập nhật giai đoạn chăm sóc khách hàng.');
      void reload();
    } catch (err: unknown) {
      setToast(getErrorMessage(err, 'Không thể đổi giai đoạn.'));
    }
  };

  const acceptedCount = leads.filter((l) => l.is_accepted).length;
  const bookedLeads = leads.filter((l) => {
    const stageName = String(l.stage?.name || l.stage?.stage_name || '').toLowerCase();
    const capiEvt = l.stage?.capi_event || l.stage?.capi_event_mapping || '';
    return stageName.includes('hẹn') || capiEvt === 'Schedule';
  });

  return (
    <div className="space-y-6">
      <div className="inkica-glass-card flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4">
        <div>
          <p className="text-xs font-bold uppercase text-[#0284C7]">Cổng Tác Nghiệp Sale / Đại Lý F1</p>
          <h1 className="text-lg font-bold text-slate-900">
            Xin chào, {userName} ({userEmail})
          </h1>
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

      <div data-tour="saleportal-tabs" className="flex flex-wrap gap-1.5 rounded-2xl bg-slate-100 p-1.5 text-xs font-semibold">
        {SALE_TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-2 transition ${
              tab === t.key ? 'bg-white text-[#1E40FF] shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {t.icon}
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'dashboard' && (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <div className="inkica-glass-card rounded-2xl border border-slate-200 bg-white p-5">
            <p className="text-xs font-semibold text-slate-500">Data Được Chia</p>
            <p className="mt-2 text-3xl font-extrabold text-[#1E40FF]">{leads.length}</p>
          </div>
          <div className="inkica-glass-card rounded-2xl border border-slate-200 bg-white p-5">
            <p className="text-xs font-semibold text-slate-500">Đã Tiếp Nhận</p>
            <p className="mt-2 text-3xl font-extrabold text-emerald-600">{acceptedCount}</p>
          </div>
          <div className="inkica-glass-card rounded-2xl border border-slate-200 bg-white p-5">
            <p className="text-xs font-semibold text-slate-500">Khách Cá Nhân (0 Quota)</p>
            <p className="mt-2 text-3xl font-extrabold text-[#0284C7]">{personalLeads.length}</p>
          </div>
          <div className="inkica-glass-card rounded-2xl border border-slate-200 bg-white p-5">
            <p className="text-xs font-semibold text-slate-500">Ticket Đã Gửi</p>
            <p className="mt-2 text-3xl font-extrabold text-amber-600">{tickets.length}</p>
          </div>
        </div>
      )}

      {tab === 'data' && (
        <div className="inkica-glass-card overflow-hidden rounded-2xl border border-slate-200 bg-white">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-3">Khách hàng</th>
                  <th className="px-4 py-3">SĐT</th>
                  <th className="px-4 py-3">Nguồn</th>
                  <th className="px-4 py-3">Giai đoạn</th>
                  <th className="px-4 py-3 text-right">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {leads.map((l) => (
                  <tr key={l.id}>
                    <td className="px-4 py-3 font-semibold text-slate-900">{l.name}</td>
                    <td className="px-4 py-3 font-mono font-semibold text-[#1E40FF]">{l.phone}</td>
                    <td className="px-4 py-3 text-slate-600">{l.source}</td>
                    <td className="px-4 py-3">
                      <select
                        value={l.stage?.id || stages[0]?.id || ''}
                        onChange={(e) => void handleStageChange(l.id, e.target.value)}
                        className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-[11px] font-semibold text-slate-700"
                      >
                        {stages.map((st) => (
                          <option key={st.id} value={st.id}>
                            {st.stage_name}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="inline-flex gap-1.5">
                        {!l.is_accepted ? (
                          <button
                            type="button"
                            onClick={() => void handleAccept(l.id)}
                            className="rounded-lg bg-[#1E40FF] px-2.5 py-1 font-semibold text-white"
                          >
                            Nhận số
                          </button>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 font-semibold text-emerald-700">
                            <CheckCircle2 className="h-3 w-3" /> Đã nhận
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={() => void handleReportError(l.id)}
                          className="rounded-lg bg-amber-50 px-2.5 py-1 font-semibold text-amber-700 hover:bg-amber-100"
                        >
                          Báo lỗi
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'personal' && (
        <div className="space-y-4">
          <div className="inkica-glass-card rounded-2xl border border-slate-200 bg-white p-5 text-xs">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 className="text-sm font-bold text-slate-900">Kho Khách Cá Nhân Tự Khai Thác</h2>
                <p className="text-slate-500">Không trừ hạn mức vòng chia (0 quota) • Miễn tự động thu hồi SLA • Lưu độc lập</p>
              </div>
              <div className="flex gap-2">
                <label className="ql-btn-outline inline-flex cursor-pointer items-center gap-1 rounded-xl border border-slate-200 px-3 py-1.5 font-semibold text-slate-700">
                  <Upload className="h-3.5 w-3.5" /> Import CSV
                  <input type="file" accept=".csv,.txt" className="hidden" onChange={handlePersonalCsvUpload} />
                </label>
                <button
                  type="button"
                  onClick={handleExportPersonal}
                  className="ql-btn-outline inline-flex items-center gap-1 rounded-xl border border-slate-200 px-3 py-1.5 font-semibold text-slate-700"
                >
                  <Download className="h-3.5 w-3.5" /> Xuất CSV
                </button>
              </div>
            </div>

            <form onSubmit={handleCreatePersonal} className="grid grid-cols-1 gap-2.5 md:grid-cols-5">
              <input type="text" required value={pName} onChange={(e) => setPName(e.target.value)} placeholder="Tên khách hàng" className="rounded-xl border border-slate-200 px-3 py-2" />
              <input type="tel" required value={pPhone} onChange={(e) => setPPhone(e.target.value)} placeholder="Số điện thoại" className="rounded-xl border border-slate-200 px-3 py-2" />
              <input type="text" value={pProduct} onChange={(e) => setPProduct(e.target.value)} placeholder="Sản phẩm quan tâm" className="rounded-xl border border-slate-200 px-3 py-2" />
              <input type="text" value={pNote} onChange={(e) => setPNote(e.target.value)} placeholder="Ghi chú riêng" className="rounded-xl border border-slate-200 px-3 py-2" />
              <button type="submit" className="btn-inkica-primary inline-flex items-center justify-center gap-1 rounded-xl px-4 py-2 font-semibold text-white">
                <Plus className="h-4 w-4" /> Thêm Khách
              </button>
            </form>
          </div>

          <div className="space-y-2">
            {personalLeads.map((p) => (
              <div key={p.id} className="inkica-glass-card flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-4 text-xs">
                <div>
                  <p className="font-bold text-slate-900">
                    {p.name} • <span className="font-mono text-[#1E40FF]">{p.phone}</span>
                  </p>
                  <p className="text-slate-500">
                    {p.product_interest || 'Chưa ghi sản phẩm'} {p.note ? `• ${p.note}` : ''}
                  </p>
                </div>
                <button type="button" onClick={() => void handleDeletePersonal(p.id)} className="rounded-lg p-1.5 text-rose-600 hover:bg-rose-50">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'calendar' && (
        <div className="inkica-glass-card rounded-2xl border border-slate-200 bg-white p-5 text-xs">
          <h2 className="mb-3 text-sm font-bold text-slate-900">Lịch Hẹn Khách Hàng ({bookedLeads.length})</h2>
          <div className="space-y-2">
            {bookedLeads.map((b) => (
              <div key={b.id} className="flex items-center justify-between rounded-xl bg-slate-50 p-3">
                <div>
                  <p className="font-bold text-slate-900">{b.name} — {b.phone}</p>
                  <p className="text-slate-500">{b.stage?.name || b.stage?.stage_name}</p>
                </div>
                <span className="text-slate-400">{formatShortDate(b.created_at)}</span>
              </div>
            ))}
            {bookedLeads.length === 0 && <p className="text-slate-400">Chưa có lịch hẹn xem nhà / tư vấn nào.</p>}
          </div>
        </div>
      )}

      {tab === 'fair-share' && (
        <div className="inkica-glass-card rounded-2xl border border-slate-200 bg-white p-5 text-xs">
          <h2 className="mb-3 text-sm font-bold text-slate-900">
            Minh Bạch Phân Bổ (Fairness Score: {fairData?.fairness_score_pct ?? 100}%)
          </h2>
          <div className="space-y-2">
            {(fairData?.consultants || []).map((c) => (
              <div key={c.id} className="flex items-center justify-between rounded-xl bg-slate-50 p-3">
                <span className="font-semibold text-slate-800">{c.name}</span>
                <span>
                  Thực nhận: <strong>{c.assigned_count}</strong> • Kỳ vọng: {c.expected_count} • Bù: +{c.compensation_count}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'tickets' && (
        <div className="inkica-glass-card rounded-2xl border border-slate-200 bg-white p-5 text-xs">
          <h2 className="mb-3 text-sm font-bold text-slate-900">Lịch Sử Ticket Báo Lỗi ({tickets.length})</h2>
          <div className="space-y-2">
            {tickets.map((t) => (
              <div key={t.id} className="flex items-center justify-between rounded-xl bg-slate-50 p-3">
                <div>
                  <p className="font-bold text-slate-900">{t.lead_name} ({t.lead_phone})</p>
                  <p className="text-slate-500">{t.reason}</p>
                </div>
                <span className="rounded-full bg-blue-50 px-2.5 py-0.5 font-semibold text-[#1E40FF]">{t.status}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'managers' && (
        <div className="inkica-glass-card space-y-4 rounded-2xl border border-slate-200 bg-white p-5 text-xs">
          <h2 className="text-sm font-bold text-slate-900">Người Đồng Quản Lý Nhận Thông Báo ({coManagers.length}/{maxCoManagers})</h2>
          <form onSubmit={handleAddManager} className="grid grid-cols-1 gap-2.5 md:grid-cols-4">
            <input type="text" required value={cmName} onChange={(e) => setCmName(e.target.value)} placeholder="Họ tên" className="rounded-xl border border-slate-200 px-3 py-2" />
            <input type="email" required value={cmEmail} onChange={(e) => setCmEmail(e.target.value)} placeholder="Email CC" className="rounded-xl border border-slate-200 px-3 py-2" />
            <input type="tel" value={cmPhone} onChange={(e) => setCmPhone(e.target.value)} placeholder="Số Zalo" className="rounded-xl border border-slate-200 px-3 py-2" />
            <button type="submit" disabled={maxCoManagers <= 0 || coManagers.length >= maxCoManagers} className="btn-inkica-primary rounded-xl px-4 py-2 font-semibold text-white disabled:opacity-50">
              + Thêm ({coManagers.length}/{maxCoManagers})
            </button>
          </form>
          <div className="space-y-2">
            {coManagers.map((cm) => (
              <div key={cm.id} className="flex items-center justify-between rounded-xl bg-slate-50 p-3">
                <div>
                  <p className="font-bold text-slate-900">{cm.name}</p>
                  <p className="text-slate-500">{cm.email} {cm.phone ? `• ${cm.phone}` : ''}</p>
                </div>
                <button type="button" onClick={() => void handleDeleteManager(cm.id)} className="rounded-lg p-1 text-rose-600">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'schedule' && (
        <form onSubmit={handleSaveAvailability} className="inkica-glass-card max-w-lg space-y-4 rounded-2xl border border-slate-200 bg-white p-5 text-xs">
          <h2 className="text-sm font-bold text-slate-900">Trạng Thái Nhận Số & Zalo Chat ID</h2>
          <label className="flex items-center gap-2 font-semibold text-slate-800">
            <input type="checkbox" checked={isAvailable} onChange={(e) => setIsAvailable(e.target.checked)} className="h-4 w-4 accent-[#1E40FF]" />
            Đang trực ca (Sẵn sàng nhận Lead tự động)
          </label>
          <label className="flex items-center gap-2 font-semibold text-slate-800">
            <input type="checkbox" checked={vacationMode} onChange={(e) => setVacationMode(e.target.checked)} className="h-4 w-4 accent-[#1E40FF]" />
            Chế độ nghỉ phép (Vacation Mode — tạm ngưng chia số)
          </label>
          <div>
            <label className="mb-1 block font-semibold text-slate-700">Zalo Bot Chat ID cá nhân</label>
            <input type="text" value={zaloChatId} onChange={(e) => setZaloChatId(e.target.value)} placeholder="Chat ID từ Zalo Bot" className="w-full rounded-xl border border-slate-200 px-3 py-2" />
          </div>
          <button type="submit" className="btn-inkica-primary rounded-xl px-5 py-2 font-semibold text-white">
            Lưu Cài Đặt Ca Trực
          </button>
        </form>
      )}
    </div>
  );
};
