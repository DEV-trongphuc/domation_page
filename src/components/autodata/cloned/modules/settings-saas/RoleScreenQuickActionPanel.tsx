import React, { useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { CheckSquare, Compass, Lock, Save, Zap } from 'lucide-react';
import { apiRequest, getErrorMessage } from '../../../autodataApi';
import {
  QUICK_ACTIONS_CATALOG,
  SCREEN_ACCESS_CATALOG,
  type ScreenAccessDescriptor,
} from '../../contexts/entitlementConstants';
import { useEntitlement } from '../../contexts/EntitlementContext';
import type { OrgRole } from './saasSettingsTypes';

interface RoleScreenQuickActionPanelProps {
  roles: OrgRole[];
  selectedRoleId: string;
  onSelectRole: (roleId: string) => void;
  onRoleSaved: (updated: OrgRole) => void;
  canManage: boolean;
}

const GROUP_LABELS: Record<ScreenAccessDescriptor['group'], string> = {
  crm: 'CRM & Bán hàng',
  marketing: 'Marketing Automation',
  growth: 'Growth & ROAS',
  erp: 'ERP Nội bộ & Vận hành',
  core: 'Hệ thống & Tài khoản',
};

const RoleScreenQuickActionForm: React.FC<{
  activeRole: OrgRole;
  roles: OrgRole[];
  onSelectRole: (roleId: string) => void;
  onRoleSaved: (updated: OrgRole) => void;
  canManage: boolean;
}> = ({ activeRole, roles, onSelectRole, onRoleSaved, canManage }) => {
  const { hasModule, refreshEntitlements } = useEntitlement();

  const [defaultRoute, setDefaultRoute] = useState<string>(() => activeRole.default_route || '/');
  const [screenAccess, setScreenAccess] = useState<Record<string, boolean>>(() => ({
    ...(activeRole.screen_access || {}),
  }));
  const [quickActions, setQuickActions] = useState<Record<string, boolean>>(() => ({
    ...(activeRole.quick_actions || {}),
  }));
  const [saving, setSaving] = useState(false);

  const groupedScreens = useMemo(() => {
    const groups: Record<ScreenAccessDescriptor['group'], ScreenAccessDescriptor[]> = {
      crm: [],
      marketing: [],
      growth: [],
      erp: [],
      core: [],
    };
    for (const s of SCREEN_ACCESS_CATALOG) {
      if (hasModule(s.moduleKey) || s.group === 'core') {
        groups[s.group].push(s);
      }
    }
    return groups;
  }, [hasModule]);

  const availableQuickActions = useMemo(
    () => QUICK_ACTIONS_CATALOG.filter((qa) => hasModule(qa.moduleKey)),
    [hasModule]
  );

  const handleEnableAllInPackage = () => {
    const nextScreens: Record<string, boolean> = { ...screenAccess };
    for (const list of Object.values(groupedScreens)) {
      for (const s of list) nextScreens[s.screenKey] = true;
    }
    const nextQuick: Record<string, boolean> = { ...quickActions };
    for (const qa of availableQuickActions) {
      nextQuick[qa.key] = true;
    }
    setScreenAccess(nextScreens);
    setQuickActions(nextQuick);
  };

  const handleSaveRoleConfig = async () => {
    setSaving(true);
    try {
      const updated = await apiRequest<OrgRole>(`/org-rbac/roles/${activeRole.id}`, {
        method: 'PUT',
        body: {
          default_route: defaultRoute || '/',
          screen_access: screenAccess,
          quick_actions: quickActions,
        },
      });
      onRoleSaved(updated);
      toast.success(`Đã lưu Điều hướng, Màn hình & Tác vụ nhanh cho vai trò "${activeRole.name}"`);
      await refreshEntitlements().catch(() => undefined);
    } catch (err) {
      toast.error(getErrorMessage(err, 'Không thể lưu cấu hình Màn hình & Tác vụ nhanh'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#1E40FF] flex items-center justify-center">
            <Compass className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Ma trận Màn hình (Screen Access), Tác vụ nhanh & Đường dẫn mặc định
            </h3>
            <p className="text-xs text-slate-500">
              Kiểm soát từng màn hình được phép hiển thị trên Sidebar và nút thao tác nhanh cho mỗi Vai trò.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={activeRole.id}
            onChange={(e) => onSelectRole(e.target.value)}
            className="h-11 px-3 rounded-xl border border-slate-200 text-sm font-semibold bg-white focus:border-[#1E40FF] focus:outline-none"
          >
            {roles.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name} ({r.role_key})
              </option>
            ))}
          </select>
          <button
            type="button"
            disabled={!canManage}
            onClick={handleEnableAllInPackage}
            className="h-11 px-3.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-xs font-semibold text-slate-700 disabled:opacity-50"
          >
            Bật tất cả theo gói
          </button>
          <button
            type="button"
            disabled={!canManage || saving}
            onClick={() => void handleSaveRoleConfig()}
            className="h-11 px-4 rounded-xl bg-[#1E40FF] hover:bg-blue-700 text-white text-sm font-semibold inline-flex items-center gap-2 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Đang lưu...' : 'Lưu Màn hình Vai trò'}
          </button>
        </div>
      </div>

      {/* Default Route & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
            <Compass className="w-3.5 h-3.5 text-[#1E40FF]" /> Đường dẫn mặc định sau đăng nhập
          </label>
          <select
            disabled={!canManage}
            value={defaultRoute}
            onChange={(e) => setDefaultRoute(e.target.value)}
            className="w-full h-11 px-3 rounded-xl border border-slate-200 text-sm bg-white focus:border-[#1E40FF] focus:outline-none"
          >
            <option value="/">/ (Dashboard Tổng quan)</option>
            {SCREEN_ACCESS_CATALOG.map((s) => (
              <option key={s.screenKey} value={s.path}>
                {s.label} ({s.path})
              </option>
            ))}
          </select>
          <p className="text-xs text-slate-500">
            Khi nhân sự thuộc vai trò <strong>{activeRole.name}</strong> đăng nhập, hệ thống tự động điều hướng về đây.
          </p>
        </div>

        <div className="lg:col-span-2 p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-[#1E40FF]" /> Quick Actions (Nút thao tác nhanh toàn hệ thống)
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
            {availableQuickActions.map((qa) => {
              const isEnabled = quickActions[qa.key] !== false;
              return (
                <label
                  key={qa.key}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-medium cursor-pointer transition ${
                    isEnabled
                      ? 'bg-blue-50/70 border-blue-200 text-[#1E40FF]'
                      : 'bg-white border-slate-200 text-slate-600'
                  }`}
                >
                  <input
                    type="checkbox"
                    disabled={!canManage}
                    checked={isEnabled}
                    onChange={(e) =>
                      setQuickActions((prev) => ({
                        ...prev,
                        [qa.key]: e.target.checked,
                      }))
                    }
                    className="rounded border-slate-300 text-[#1E40FF] focus:ring-[#1E40FF]"
                  />
                  <span className="truncate">{qa.label}</span>
                </label>
              );
            })}
          </div>
        </div>
      </div>

      {/* Screen Visibility Matrix */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
            <CheckSquare className="w-3.5 h-3.5 text-[#1E40FF]" /> Ma trận Hiển thị Màn hình theo Phân hệ
          </div>
          {!canManage && (
            <span className="inline-flex items-center gap-1 text-xs text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full">
              <Lock className="w-3 h-3" /> Chỉ đọc
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {(Object.keys(groupedScreens) as Array<ScreenAccessDescriptor['group']>).map((groupKey) => {
            const items = groupedScreens[groupKey];
            if (!items || items.length === 0) return null;
            return (
              <div key={groupKey} className="border border-slate-200 rounded-xl p-4 space-y-2.5 bg-white">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <span className="text-xs font-bold text-slate-800">{GROUP_LABELS[groupKey]}</span>
                  <span className="text-[11px] font-semibold text-slate-400">{items.length} màn hình</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                  {items.map((scr) => {
                    const isChecked = screenAccess[scr.screenKey] !== false;
                    return (
                      <label
                        key={scr.screenKey}
                        className="flex items-center gap-2 py-1.5 px-2 rounded-lg hover:bg-slate-50 cursor-pointer text-xs"
                      >
                        <input
                          type="checkbox"
                          disabled={!canManage}
                          checked={isChecked}
                          onChange={(e) =>
                            setScreenAccess((prev) => ({
                              ...prev,
                              [scr.screenKey]: e.target.checked,
                            }))
                          }
                          className="rounded border-slate-300 text-[#1E40FF] focus:ring-[#1E40FF]"
                        />
                        <span className={isChecked ? 'text-slate-800 font-medium' : 'text-slate-400 line-through'}>
                          {scr.label}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export const RoleScreenQuickActionPanel: React.FC<RoleScreenQuickActionPanelProps> = ({
  roles,
  selectedRoleId,
  onSelectRole,
  onRoleSaved,
  canManage,
}) => {
  const activeRole = useMemo(
    () => roles.find((r) => r.id === selectedRoleId) || roles[0] || null,
    [roles, selectedRoleId]
  );

  if (!activeRole) return null;

  return (
    <RoleScreenQuickActionForm
      key={activeRole.id}
      activeRole={activeRole}
      roles={roles}
      onSelectRole={onSelectRole}
      onRoleSaved={onRoleSaved}
      canManage={canManage}
    />
  );
};
