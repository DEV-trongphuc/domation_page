import React, { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Bell, Mail, Plus, Power, Trash2 } from 'lucide-react';
import { apiRequest, getErrorMessage } from '../../../autodataApi';
import { useEntitlement } from '../../contexts/EntitlementContext';
import { TableSkeleton } from '../../components/ui/Skeleton';
import type {
  NotificationRuleDef,
  OrgRole,
  SystemEmailTemplateDef,
} from './saasSettingsTypes';

const EVENT_OPTIONS = [
  { key: 'lead_assigned', label: 'Khi Lead mới được chia cho Sale' },
  { key: 'sla_warning', label: 'Cảnh báo sắp quá hạn SLA nhận Lead' },
  { key: 'ticket_created', label: 'Khi phát sinh Ticket báo lỗi Data' },
  { key: 'approval_pending', label: 'Khi có Đề xuất Phê duyệt chờ ký' },
  { key: 'deal_won', label: 'Khi Chốt thành công Deal / Hợp đồng' },
  { key: 'attendance_dispute', label: 'Khi nhân sự Khiếu nại bảng công' },
];

const STRATEGY_OPTIONS: Array<{ key: NotificationRuleDef['recipient_strategy']; label: string }> = [
  { key: 'assigned_and_managers', label: 'Người phụ trách + Quản lý' },
  { key: 'role_based', label: 'Theo Vai trò chỉ định' },
  { key: 'department_based', label: 'Theo Phòng ban liên quan' },
  { key: 'all_admins', label: 'Tất cả Quản trị viên' },
];

const TEMPLATE_VARS = [
  '{{brand_name}}',
  '{{customer_name}}',
  '{{phone}}',
  '{{email}}',
  '{{sale_name}}',
  '{{source}}',
  '{{deadline_time}}',
];

export const NotificationsAndTemplatesPanel: React.FC<{ roles?: OrgRole[] }> = ({ roles = [] }) => {
  const { can } = useEntitlement();
  const canManage = can('settings', 'manage_config');

  const [tab, setTab] = useState<'routing' | 'templates'>('routing');
  const [loading, setLoading] = useState(true);
  const [rules, setRules] = useState<NotificationRuleDef[]>([]);
  const [templates, setTemplates] = useState<SystemEmailTemplateDef[]>([]);

  // Routing form
  const [eventKey, setEventKey] = useState('lead_assigned');
  const [ruleName, setRuleName] = useState('');
  const [strategy, setStrategy] =
    useState<NotificationRuleDef['recipient_strategy']>('assigned_and_managers');
  const [targetRoles, setTargetRoles] = useState<string[]>([]);
  const [chInApp, setChInApp] = useState(true);
  const [chEmail, setChEmail] = useState(true);
  const [chZalo, setChZalo] = useState(true);
  const [chTelegram, setChTelegram] = useState(false);

  // Email template form
  const [tplName, setTplName] = useState('');
  const [tplCategory, setTplCategory] = useState('notification');
  const [tplSubject, setTplSubject] = useState('');
  const [tplBodyHtml, setTplBodyHtml] = useState('');

  const loadAll = useCallback(async () => {
    try {
      const [rRows, tRows] = await Promise.all([
        apiRequest<NotificationRuleDef[]>('/org-rbac/notification-rules').catch(() => []),
        apiRequest<SystemEmailTemplateDef[]>('/org-rbac/email-templates').catch(() => []),
      ]);
      setRules(Array.isArray(rRows) ? rRows : []);
      setTemplates(Array.isArray(tRows) ? tRows : []);
    } catch (err) {
      toast.error(getErrorMessage(err, 'Không thể tải Ma trận Thông báo & Mẫu Email'));
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

  const handleCreateRule = async () => {
    const finalName = ruleName.trim() || EVENT_OPTIONS.find((e) => e.key === eventKey)?.label || eventKey;
    try {
      const created = await apiRequest<NotificationRuleDef>('/org-rbac/notification-rules', {
        method: 'POST',
        body: {
          event_key: eventKey,
          name: finalName,
          recipient_strategy: strategy,
          target_roles_json: targetRoles,
          include_owner: true,
          include_team_leader: true,
          channels_json: {
            in_app: chInApp,
            email: chEmail,
            zalo: chZalo,
            telegram: chTelegram,
          },
        },
      });
      setRules((prev) => [...prev, created]);
      setRuleName('');
      setTargetRoles([]);
      toast.success(`Đã tạo quy tắc nhận thông báo "${created.name}"`);
    } catch (err) {
      toast.error(getErrorMessage(err, 'Không thể tạo quy tắc thông báo'));
    }
  };

  const handleToggleRule = async (r: NotificationRuleDef) => {
    const prev = rules;
    setRules((list) => list.map((x) => (x.id === r.id ? { ...x, is_active: !r.is_active } : x)));
    try {
      await apiRequest(`/org-rbac/notification-rules/${r.id}`, {
        method: 'PUT',
        body: { is_active: !r.is_active },
      });
    } catch (err) {
      setRules(prev);
      toast.error(getErrorMessage(err, 'Không thể cập nhật quy tắc thông báo'));
    }
  };

  const handleDeleteRule = async (id: string) => {
    const prev = rules;
    setRules((list) => list.filter((x) => x.id !== id));
    try {
      await apiRequest(`/org-rbac/notification-rules/${id}`, { method: 'DELETE' });
      toast.success('Đã xóa quy tắc thông báo');
    } catch (err) {
      setRules(prev);
      toast.error(getErrorMessage(err, 'Không thể xóa quy tắc thông báo'));
    }
  };

  const handleCreateTemplate = async () => {
    if (!tplName.trim() || !tplSubject.trim()) {
      toast.error('Vui lòng nhập Tên mẫu và Tiêu đề Email');
      return;
    }
    try {
      const created = await apiRequest<SystemEmailTemplateDef>('/org-rbac/email-templates', {
        method: 'POST',
        body: {
          name: tplName.trim(),
          category: tplCategory,
          subject_template: tplSubject.trim(),
          body_html: tplBodyHtml.trim() || `<p>${tplSubject.trim()}</p>`,
          variables_json: TEMPLATE_VARS,
        },
      });
      setTemplates((prev) => [created, ...prev]);
      setTplName('');
      setTplSubject('');
      setTplBodyHtml('');
      toast.success(`Đã lưu mẫu Email "${created.name}"`);
    } catch (err) {
      toast.error(getErrorMessage(err, 'Không thể lưu mẫu Email hệ thống'));
    }
  };

  const handleToggleTemplate = async (tpl: SystemEmailTemplateDef) => {
    const prev = templates;
    setTemplates((list) =>
      list.map((x) => (x.id === tpl.id ? { ...x, is_active: !tpl.is_active } : x))
    );
    try {
      await apiRequest(`/org-rbac/email-templates/${tpl.id}`, {
        method: 'PUT',
        body: { is_active: !tpl.is_active },
      });
    } catch (err) {
      setTemplates(prev);
      toast.error(getErrorMessage(err, 'Không thể cập nhật trạng thái mẫu Email'));
    }
  };

  const handleDeleteTemplate = async (id: string) => {
    const prev = templates;
    setTemplates((list) => list.filter((x) => x.id !== id));
    try {
      await apiRequest(`/org-rbac/email-templates/${id}`, { method: 'DELETE' });
      toast.success('Đã xóa mẫu Email');
    } catch (err) {
      setTemplates(prev);
      toast.error(getErrorMessage(err, 'Không thể xóa mẫu Email'));
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#1E40FF] flex items-center justify-center">
            <Bell className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Ma trận Định tuyến Thông báo & Kho Mẫu Email Hệ thống
            </h3>
            <p className="text-xs text-slate-500">
              Quy định ai nhận cảnh báo theo từng sự kiện (In-App / Email / Zalo OA / Telegram) và quản trị mẫu Email giao dịch.
            </p>
          </div>
        </div>

        <div className="inline-flex rounded-xl border border-slate-200 bg-slate-50 p-1">
          <button
            type="button"
            onClick={() => setTab('routing')}
            className={`px-3.5 py-2 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 ${
              tab === 'routing' ? 'bg-[#1E40FF] text-white shadow-sm' : 'text-slate-600'
            }`}
          >
            <Bell className="w-3.5 h-3.5" /> Ma trận Thông báo ({rules.length})
          </button>
          <button
            type="button"
            onClick={() => setTab('templates')}
            className={`px-3.5 py-2 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 ${
              tab === 'templates' ? 'bg-[#1E40FF] text-white shadow-sm' : 'text-slate-600'
            }`}
          >
            <Mail className="w-3.5 h-3.5" /> Mẫu Email ({templates.length})
          </button>
        </div>
      </div>

      {loading ? (
        <TableSkeleton rows={4} cols={4} />
      ) : tab === 'routing' ? (
        <div className="space-y-4">
          {canManage && (
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <select
                  value={eventKey}
                  onChange={(e) => setEventKey(e.target.value)}
                  className="h-10 px-3 rounded-xl border border-slate-200 bg-white text-sm"
                >
                  {EVENT_OPTIONS.map((ev) => (
                    <option key={ev.key} value={ev.key}>
                      {ev.label}
                    </option>
                  ))}
                </select>
                <input
                  value={ruleName}
                  onChange={(e) => setRuleName(e.target.value)}
                  placeholder="Mô tả quy tắc (tùy chọn)"
                  className="h-10 px-3 rounded-xl border border-slate-200 bg-white text-sm"
                />
                <select
                  value={strategy}
                  onChange={(e) =>
                    setStrategy(e.target.value as NotificationRuleDef['recipient_strategy'])
                  }
                  className="h-10 px-3 rounded-xl border border-slate-200 bg-white text-sm"
                >
                  {STRATEGY_OPTIONS.map((st) => (
                    <option key={st.key} value={st.key}>
                      {st.label}
                    </option>
                  ))}
                </select>
              </div>

              {roles.length > 0 && strategy === 'role_based' && (
                <div className="flex flex-wrap items-center gap-1.5 text-xs">
                  <span className="text-slate-500 font-semibold">Vai trò nhận:</span>
                  {roles.map((r) => {
                    const active = targetRoles.includes(r.id);
                    return (
                      <button
                        key={r.id}
                        type="button"
                        onClick={() =>
                          setTargetRoles((prev) =>
                            active ? prev.filter((id) => id !== r.id) : [...prev, r.id]
                          )
                        }
                        className={`px-2.5 py-1 rounded-full border ${
                          active
                            ? 'bg-[#1E40FF] text-white border-[#1E40FF]'
                            : 'bg-white text-slate-600 border-slate-200'
                        }`}
                      >
                        {r.name}
                      </button>
                    );
                  })}
                </div>
              )}

              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-slate-700">
                  <label className="inline-flex items-center gap-1.5 cursor-pointer">
                    <input type="checkbox" checked={chInApp} onChange={(e) => setChInApp(e.target.checked)} />
                    In-App Chuông
                  </label>
                  <label className="inline-flex items-center gap-1.5 cursor-pointer">
                    <input type="checkbox" checked={chEmail} onChange={(e) => setChEmail(e.target.checked)} />
                    Email SMTP/SES
                  </label>
                  <label className="inline-flex items-center gap-1.5 cursor-pointer">
                    <input type="checkbox" checked={chZalo} onChange={(e) => setChZalo(e.target.checked)} />
                    Zalo OA / ZNS
                  </label>
                  <label className="inline-flex items-center gap-1.5 cursor-pointer">
                    <input type="checkbox" checked={chTelegram} onChange={(e) => setChTelegram(e.target.checked)} />
                    Telegram Bot
                  </label>
                </div>
                <button
                  type="button"
                  onClick={() => void handleCreateRule()}
                  className="h-10 px-4 rounded-xl bg-[#1E40FF] hover:bg-blue-700 text-white text-xs font-semibold inline-flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" /> Thêm Quy tắc
                </button>
              </div>
            </div>
          )}

          {rules.length === 0 ? (
            <div className="text-center py-6 text-xs text-slate-500 border border-dashed border-slate-200 rounded-xl">
              Chưa có quy tắc định tuyến thông báo tùy chỉnh.
            </div>
          ) : (
            <div className="space-y-2">
              {rules.map((r) => (
                <div
                  key={r.id}
                  className="p-3.5 rounded-xl border border-slate-200 flex items-center justify-between gap-3"
                >
                  <div>
                    <div className="text-sm font-bold text-slate-900">{r.name}</div>
                    <div className="text-xs text-slate-500">
                      <code>{r.event_key}</code> • {r.recipient_strategy} • Kênh:{' '}
                      {[
                        r.channels_json?.in_app && 'In-App',
                        r.channels_json?.email && 'Email',
                        r.channels_json?.zalo && 'Zalo',
                        r.channels_json?.telegram && 'Telegram',
                      ]
                        .filter(Boolean)
                        .join(', ')}
                    </div>
                  </div>
                  {canManage && (
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => void handleToggleRule(r)}
                        className={`p-2 rounded-lg border ${
                          r.is_active
                            ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                            : 'border-slate-200 bg-slate-100 text-slate-400'
                        }`}
                      >
                        <Power className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleDeleteRule(r.id)}
                        className="p-2 rounded-lg border border-slate-200 text-slate-400 hover:text-red-600"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {canManage && (
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <input
                  value={tplName}
                  onChange={(e) => setTplName(e.target.value)}
                  placeholder="Tên mẫu Email (VD: Chào mừng Lead VIP)"
                  className="h-10 px-3 rounded-xl border border-slate-200 bg-white text-sm"
                />
                <select
                  value={tplCategory}
                  onChange={(e) => setTplCategory(e.target.value)}
                  className="h-10 px-3 rounded-xl border border-slate-200 bg-white text-sm"
                >
                  <option value="notification">Thông báo nội bộ</option>
                  <option value="transactional">Giao dịch khách hàng</option>
                  <option value="sla_alert">Cảnh báo SLA</option>
                  <option value="approval">Phê duyệt & Nhân sự</option>
                </select>
                <input
                  value={tplSubject}
                  onChange={(e) => setTplSubject(e.target.value)}
                  placeholder="Tiêu đề Email (hỗ trợ {{customer_name}})"
                  className="h-10 px-3 rounded-xl border border-slate-200 bg-white text-sm"
                />
              </div>
              <textarea
                rows={3}
                value={tplBodyHtml}
                onChange={(e) => setTplBodyHtml(e.target.value)}
                placeholder="Nội dung HTML mẫu Email..."
                className="w-full p-3 rounded-xl border border-slate-200 bg-white text-sm font-mono"
              />
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap gap-1.5">
                  {TEMPLATE_VARS.map((v) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => setTplBodyHtml((prev) => `${prev}${prev ? ' ' : ''}${v}`)}
                      className="px-2 py-1 rounded-lg bg-white border border-slate-200 text-[11px] font-mono text-[#1E40FF] hover:bg-blue-50"
                    >
                      {v}
                    </button>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => void handleCreateTemplate()}
                  className="h-10 px-4 rounded-xl bg-[#1E40FF] hover:bg-blue-700 text-white text-xs font-semibold"
                >
                  + Lưu Mẫu Email
                </button>
              </div>
            </div>
          )}

          {templates.length === 0 ? (
            <div className="text-center py-6 text-xs text-slate-500 border border-dashed border-slate-200 rounded-xl">
              Chưa có mẫu Email hệ thống nào.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {templates.map((tpl) => (
                <div key={tpl.id} className="p-4 rounded-xl border border-slate-200 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="text-sm font-bold text-slate-900">{tpl.name}</div>
                      <div className="text-xs text-slate-500 font-mono">{tpl.template_key} • {tpl.category}</div>
                    </div>
                    {canManage && (
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => void handleToggleTemplate(tpl)}
                          className={`p-1.5 rounded-lg border ${
                            tpl.is_active
                              ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                              : 'border-slate-200 bg-slate-100 text-slate-400'
                          }`}
                        >
                          <Power className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => void handleDeleteTemplate(tpl.id)}
                          className="p-1.5 rounded-lg border border-slate-200 text-slate-400 hover:text-red-600"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                  <div className="text-xs font-semibold text-[#1E40FF]">{tpl.subject_template}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
