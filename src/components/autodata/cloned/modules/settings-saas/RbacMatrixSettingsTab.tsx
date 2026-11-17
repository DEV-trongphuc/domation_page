import React, { useMemo, useState } from 'react';
import {
  EyeOff,
  Lock,
  Network,
  Plus,
  Save,
  ShieldCheck,
  Trash2,
  UserCog,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { Badge, Card, PillTabs } from '../../components/ui/AutoDataLoadingModal';
import { apiRequest, getErrorMessage } from '../../../autodataApi';
import { useAuth } from '../../contexts/AuthContext';
import {
  DATA_SCOPES_CATALOG,
  RBAC_ACTIONS_CATALOG,
  RBAC_MODULES_CATALOG,
  toBackendModuleKey,
  type DataScopeKey,
  type RbacActionKey,
} from '../../contexts/entitlementConstants';
import {
  makeDefaultActionsMap,
  type OrgDepartment,
  type OrgRole,
  type PermissionMatrixEntry,
  type UserPermissionOverride,
} from './saasSettingsTypes';
import { RoleScreenQuickActionPanel } from './RoleScreenQuickActionPanel';

interface RbacMatrixSettingsTabProps {
  roles: OrgRole[];
  setRoles: React.Dispatch<React.SetStateAction<OrgRole[]>>;
  departments: OrgDepartment[];
  rolePermissionsMap: Record<string, PermissionMatrixEntry[]>;
  setRolePermissionsMap: React.Dispatch<React.SetStateAction<Record<string, PermissionMatrixEntry[]>>>;
  deptPermissionsMap: Record<string, PermissionMatrixEntry[]>;
  setDeptPermissionsMap: React.Dispatch<React.SetStateAction<Record<string, PermissionMatrixEntry[]>>>;
  userOverrides: UserPermissionOverride[];
  setUserOverrides: React.Dispatch<React.SetStateAction<UserPermissionOverride[]>>;
}

type MatrixMode = 'roles' | 'departments' | 'overrides';

function ensureMatrixRows(existing?: PermissionMatrixEntry[]): PermissionMatrixEntry[] {
  const byMod = new Map((existing || []).map((r) => [r.module_key, r]));
  return RBAC_MODULES_CATALOG.map((mod) => {
    const found = byMod.get(mod.key) || byMod.get(toBackendModuleKey(mod.key));
    if (found) {
      return {
        module_key: mod.key,
        data_scope: found.data_scope || 'none',
        actions: { ...makeDefaultActionsMap(false), ...(found.actions || {}) },
      };
    }
    return {
      module_key: mod.key,
      data_scope: 'own',
      actions: makeDefaultActionsMap(false),
    };
  });
}

export const RbacMatrixSettingsTab: React.FC<RbacMatrixSettingsTabProps> = ({
  roles,
  setRoles,
  departments,
  rolePermissionsMap,
  setRolePermissionsMap,
  deptPermissionsMap,
  setDeptPermissionsMap,
  userOverrides,
  setUserOverrides,
}) => {
  const { token, tenantSlug } = useAuth();
  const [mode, setMode] = useState<MatrixMode>('roles');
  const [selectedRoleId, setSelectedRoleId] = useState<string>(() => roles[0]?.id || '');
  const [selectedDeptId, setSelectedDeptId] = useState<string>(() => departments[0]?.id || '');
  const [savingMatrix, setSavingMatrix] = useState(false);

  // Create Role Form
  const [newRoleName, setNewRoleName] = useState('');
  const [newRoleDesc, setNewRoleDesc] = useState('');
  const [newRoleScope, setNewRoleScope] = useState<DataScopeKey>('own');

  // Create User Override Form
  const [ovUserId, setOvUserId] = useState('');
  const [ovModule, setOvModule] = useState(RBAC_MODULES_CATALOG[0]?.key || 'leads');
  const [ovEffect, setOvEffect] = useState<'grant' | 'deny'>('deny');
  const [ovAction, setOvAction] = useState<RbacActionKey>('unmask_phone');
  const [ovScope, setOvScope] = useState<DataScopeKey>('own');

  const activeTargetId =
    mode === 'roles' ? selectedRoleId || roles[0]?.id || '' : selectedDeptId || departments[0]?.id || '';

  const currentMatrixRows = useMemo<PermissionMatrixEntry[]>(() => {
    if (!activeTargetId) return ensureMatrixRows([]);
    if (mode === 'roles') {
      return ensureMatrixRows(rolePermissionsMap[activeTargetId]);
    }
    return ensureMatrixRows(deptPermissionsMap[activeTargetId]);
  }, [activeTargetId, mode, rolePermissionsMap, deptPermissionsMap]);

  const updateCurrentRow = (
    moduleKey: string,
    updater: (prev: PermissionMatrixEntry) => PermissionMatrixEntry
  ) => {
    if (!activeTargetId) return;
    const nextList = currentMatrixRows.map((row) =>
      row.module_key === moduleKey ? updater(row) : row
    );
    if (mode === 'roles') {
      setRolePermissionsMap((prev) => ({ ...prev, [activeTargetId]: nextList }));
    } else {
      setDeptPermissionsMap((prev) => ({ ...prev, [activeTargetId]: nextList }));
    }
  };

  const handleSaveMatrix = async () => {
    if (!activeTargetId) return;
    setSavingMatrix(true);
    try {
      const endpoint =
        mode === 'roles'
          ? `/org-rbac/roles/${activeTargetId}/permissions`
          : `/org-rbac/departments/${activeTargetId}/permissions`;
      await apiRequest(endpoint, {
        method: 'PUT',
        token,
        tenantSlug,
        body: { permissions: currentMatrixRows },
      });
      toast.success('Đã lưu Ma trận Phân quyền 7 Scopes × 11 Actions thành công!');
    } catch (err) {
      toast.error(getErrorMessage(err, 'Không thể lưu Ma trận Phân quyền.'));
    } finally {
      setSavingMatrix(false);
    }
  };

  const handleCreateRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoleName.trim()) return;
    const roleKey = newRoleName
      .trim()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '_');

    const payload = {
      name: newRoleName.trim(),
      role_key: roleKey || `role_${Date.now()}`,
      description: newRoleDesc.trim(),
      default_data_scope: newRoleScope,
    };

    try {
      const created = await apiRequest<OrgRole>('/org-rbac/roles', {
        method: 'POST',
        token,
        tenantSlug,
        body: payload,
      });
      setRoles((prev) => [...prev, created]);
      setSelectedRoleId(created.id);
      toast.success(`Đã tạo vai trò tùy chỉnh "${created.name}"!`);
      setNewRoleName('');
      setNewRoleDesc('');
    } catch (err) {
      toast.error(getErrorMessage(err, 'Không thể tạo vai trò tùy chỉnh.'));
    }
  };

  const handleDeleteRole = async (roleId: string) => {
    const prevRoles = roles;
    setRoles((prev) => prev.filter((r) => r.id !== roleId));
    try {
      await apiRequest(`/org-rbac/roles/${roleId}`, { method: 'DELETE', token, tenantSlug });
      toast.success('Đã xóa vai trò.');
    } catch (err) {
      setRoles(prevRoles);
      toast.error(getErrorMessage(err, 'Không thể xóa vai trò.'));
    }
  };

  const handleCreateOverride = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ovUserId.trim()) return;
    const body = {
      user_id: ovUserId.trim(),
      module_key: ovModule,
      effect: ovEffect,
      data_scope: ovScope,
      actions: { [ovAction]: true },
    };

    try {
      const created = await apiRequest<UserPermissionOverride>('/org-rbac/user-overrides', {
        method: 'POST',
        token,
        tenantSlug,
        body,
      });
      setUserOverrides((prev) => [created, ...prev]);
      toast.success('Đã thiết lập quyền ngoại lệ cá nhân (Zero Short-Circuit)!');
      setOvUserId('');
    } catch (err) {
      toast.error(getErrorMessage(err, 'Không thể thiết lập quyền ngoại lệ cá nhân.'));
    }
  };

  const handleDeleteOverride = async (id: string) => {
    const prevOv = userOverrides;
    setUserOverrides((prev) => prev.filter((o) => o.id !== id));
    try {
      await apiRequest(`/org-rbac/user-overrides/${id}`, { method: 'DELETE', token, tenantSlug });
      toast.success('Đã gỡ quyền ngoại lệ cá nhân.');
    } catch (err) {
      setUserOverrides(prevOv);
      toast.error(getErrorMessage(err, 'Không thể gỡ quyền ngoại lệ cá nhân.'));
    }
  };

  return (
    <div data-tour="settings-rbac-root" style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
      {/* Zero Short-Circuit Rule Banner */}
      <Card
        padding="1rem 1.25rem"
        style={{ background: '#F8FAFF', borderColor: '#BFDBFE' }}
      >
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <ShieldCheck size={22} color="#1E40FF" />
            <div>
              <div style={{ fontSize: '0.88rem', fontWeight: 800, color: '#0F172A' }}>
                Thứ tự Giải quyết Quyền Bất Biến (Zero Short-Circuit RBAC Engine)
              </div>
              <div style={{ fontSize: '0.77rem', color: '#475569', marginTop: 2 }}>
                <code>1. Gói cước Entitlement</code> → <code>2. Chủ sở hữu Workspace</code> → <code>3. Ngoại lệ Deny/Grant cá nhân</code> → <code>4. Hợp nhất (Vai trò ∪ Phòng ban)</code>. Khi tắt <strong>Mở che SĐT</strong>, Backend tự động băm che thành <code>090****567</code> ngay từ JSON & Excel!
              </div>
            </div>
          </div>
          <Badge tone="primary" icon={<EyeOff size={12} />}>
            Server-Side PII Masking
          </Badge>
        </div>
      </Card>

      <PillTabs
        tabs={[
          { key: 'roles', label: 'Ma trận theo Vai trò Tùy chỉnh', icon: <Lock size={15} />, count: roles.length },
          { key: 'departments', label: 'Ma trận theo Phòng ban', icon: <Network size={15} />, count: departments.length },
          { key: 'overrides', label: 'Ngoại lệ trên từng Cá nhân (Grant / Deny)', icon: <UserCog size={15} />, count: userOverrides.length },
        ]}
        activeKey={mode}
        onChange={(nextKey) => setMode(nextKey as MatrixMode)}
      />

      {mode === 'roles' && (
        <Card
          title="Khởi tạo Không Giới Hạn Vai Trò Doanh Nghiệp (Custom Roles)"
          subtitle="Tự định nghĩa Giám đốc Sàn, Trưởng nhóm Telesale, Kế toán Công nợ, Content Marketing, Cộng tác viên F1..."
        >
          <form onSubmit={handleCreateRole} style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.6fr 1fr auto', gap: 10, alignItems: 'end' }}>
            <div className="form-group">
              <label className="form-label">Tên Vai trò mới *</label>
              <input
                type="text"
                required
                className="form-input"
                placeholder="VD: Trưởng nhóm Telesale"
                value={newRoleName}
                onChange={(e) => setNewRoleName(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Mô tả nhiệm vụ</label>
              <input
                type="text"
                className="form-input"
                placeholder="Xem dữ liệu trong nhóm, duyệt chia lại số..."
                value={newRoleDesc}
                onChange={(e) => setNewRoleDesc(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Data Scope mặc định</label>
              <select
                className="form-input"
                value={newRoleScope}
                onChange={(e) => setNewRoleScope(e.target.value as DataScopeKey)}
              >
                {DATA_SCOPES_CATALOG.map((sc) => (
                  <option key={sc.key} value={sc.key}>
                    {sc.label}
                  </option>
                ))}
              </select>
            </div>
            <button
              type="submit"
              className="btn-inkica-primary"
              style={{ height: 44, padding: '0 1.2rem', borderRadius: 14, border: 'none', color: '#FFFFFF', fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}
            >
              <Plus size={15} /> Tạo Vai Trò
            </button>
          </form>
        </Card>
      )}

      {(mode === 'roles' || mode === 'departments') && (
        <Card
          title={
            mode === 'roles'
              ? 'Bảng Ma Trận Chi Tiết: 7 Cấp Data Scope × 11 Hành Động Tinh Chi Tiết'
              : 'Khung Quyền Mặc Định Theo Phòng Ban'
          }
          actions={
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              {mode === 'roles' ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <select
                    className="form-input"
                    style={{ height: 38, minWidth: 230, fontSize: '0.82rem', fontWeight: 700 }}
                    value={activeTargetId}
                    onChange={(e) => setSelectedRoleId(e.target.value)}
                  >
                    {roles.map((r) => (
                      <option key={r.id} value={r.id}>
                        Vai trò: {r.name}
                      </option>
                    ))}
                  </select>
                  {activeTargetId && !roles.find((r) => r.id === activeTargetId)?.is_system && (
                    <button
                      type="button"
                      onClick={() => void handleDeleteRole(activeTargetId)}
                      className="btn secondary sm"
                      style={{ height: 38, color: '#1E40FF' }}
                      title="Xóa vai trò này"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              ) : (
                <select
                  className="form-input"
                  style={{ height: 38, minWidth: 230, fontSize: '0.82rem', fontWeight: 700 }}
                  value={activeTargetId}
                  onChange={(e) => setSelectedDeptId(e.target.value)}
                >
                  {departments.length === 0 && <option value="">Chưa tạo Phòng ban</option>}
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>
                      Phòng ban: {d.name}
                    </option>
                  ))}
                </select>
              )}

              <button
                type="button"
                disabled={!activeTargetId || savingMatrix}
                onClick={() => void handleSaveMatrix()}
                className="btn-inkica-primary"
                style={{
                  height: 38,
                  padding: '0 1.15rem',
                  borderRadius: 12,
                  border: 'none',
                  color: '#FFFFFF',
                  fontWeight: 700,
                  fontSize: '0.82rem',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  cursor: 'pointer',
                }}
              >
                <Save size={14} /> {savingMatrix ? 'Đang lưu...' : 'Lưu Ma Trận Quyền'}
              </button>
            </div>
          }
          padding="1.15rem 1.25rem"
        >
          <div style={{ overflowX: 'auto', border: '1px solid #E2E8F0', borderRadius: 16 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem' }}>
              <thead>
                <tr style={{ background: '#F8F9FA', borderBottom: '1px solid #E2E8F0' }}>
                  <th style={{ padding: '10px 12px', textAlign: 'left', minWidth: 195 }}>Phân hệ (Module)</th>
                  <th style={{ padding: '10px 12px', textAlign: 'left', minWidth: 185 }}>Phạm vi Dữ liệu (7 Scopes)</th>
                  {RBAC_ACTIONS_CATALOG.map((act) => (
                    <th
                      key={act.key}
                      style={{
                        padding: '10px 8px',
                        textAlign: 'center',
                        color: act.key === 'unmask_phone' ? '#1E40FF' : '#64748B',
                        whiteSpace: 'nowrap',
                      }}
                      title={act.label}
                    >
                      {act.shortLabel}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {currentMatrixRows.map((row) => {
                  const modMeta = RBAC_MODULES_CATALOG.find((m) => m.key === row.module_key);
                  const isLocked = row.data_scope === 'none';
                  return (
                    <tr key={row.module_key} style={{ borderBottom: '1px solid #F1F5F9', opacity: isLocked ? 0.65 : 1 }}>
                      <td style={{ padding: '10px 12px', fontWeight: 700, color: '#0F172A' }}>
                        {modMeta?.label || row.module_key}
                      </td>
                      <td style={{ padding: '8px 12px' }}>
                        <select
                          className="form-input"
                          style={{ height: 34, fontSize: '0.76rem', padding: '0 8px' }}
                          value={row.data_scope}
                          onChange={(e) => {
                            const nextScope = e.target.value as DataScopeKey;
                            updateCurrentRow(row.module_key, (prev) => ({
                              ...prev,
                              data_scope: nextScope,
                              actions: {
                                ...prev.actions,
                                view: nextScope !== 'none',
                              },
                            }));
                          }}
                        >
                          {DATA_SCOPES_CATALOG.map((sc) => (
                            <option key={sc.key} value={sc.key}>
                              {sc.shortLabel} — {sc.label}
                            </option>
                          ))}
                        </select>
                      </td>
                      {RBAC_ACTIONS_CATALOG.map((act) => (
                        <td key={act.key} style={{ padding: '8px', textAlign: 'center' }}>
                          <input
                            type="checkbox"
                            disabled={isLocked}
                            checked={!isLocked && Boolean(row.actions[act.key])}
                            onChange={(e) =>
                              updateCurrentRow(row.module_key, (prev) => ({
                                ...prev,
                                actions: { ...prev.actions, [act.key]: e.target.checked },
                              }))
                            }
                            style={{
                              width: 16,
                              height: 16,
                              accentColor: act.key === 'unmask_phone' ? '#059669' : '#1E40FF',
                              cursor: isLocked ? 'not-allowed' : 'pointer',
                            }}
                          />
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {mode === 'roles' && roles.length > 0 && (
        <RoleScreenQuickActionPanel
          roles={roles}
          selectedRoleId={selectedRoleId || roles[0]?.id || ''}
          onSelectRole={setSelectedRoleId}
          onRoleSaved={(updated) => {
            setRoles((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
          }}
          canManage={true}
        />
      )}

      {mode === 'overrides' && (
        <Card
          title="Ngoại Lệ Phân Quyền Cá Nhân (Grant / Deny Override)"
          subtitle="Cấp thêm (Grant) hoặc Khóa cứng (Deny) một quyền cụ thể cho 1 nhân sự đặc biệt mà không phải tạo Role mới"
        >
          <form
            onSubmit={handleCreateOverride}
            style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 10, alignItems: 'end', marginBottom: '1.15rem' }}
          >
            <div className="form-group">
              <label className="form-label">Email / ID Nhân sự *</label>
              <input
                type="text"
                required
                className="form-input"
                placeholder="sale01@company.vn"
                value={ovUserId}
                onChange={(e) => setOvUserId(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Phân hệ áp dụng</label>
              <select className="form-input" value={ovModule} onChange={(e) => setOvModule(e.target.value)}>
                {RBAC_MODULES_CATALOG.map((m) => (
                  <option key={m.key} value={m.key}>
                    {m.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Loại ngoại lệ</label>
              <select
                className="form-input"
                value={ovEffect}
                onChange={(e) => setOvEffect(e.target.value as 'grant' | 'deny')}
              >
                <option value="deny">DENY (Khóa quyền ưu tiên cao nhất)</option>
                <option value="grant">GRANT (Cấp thêm quyền đặc cách)</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Quyền thao tác</label>
              <select
                className="form-input"
                value={ovAction}
                onChange={(e) => setOvAction(e.target.value as RbacActionKey)}
              >
                {RBAC_ACTIONS_CATALOG.map((a) => (
                  <option key={a.key} value={a.key}>
                    {a.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Phạm vi Scope</label>
              <select
                className="form-input"
                value={ovScope}
                onChange={(e) => setOvScope(e.target.value as DataScopeKey)}
              >
                {DATA_SCOPES_CATALOG.map((s) => (
                  <option key={s.key} value={s.key}>
                    {s.shortLabel}
                  </option>
                ))}
              </select>
            </div>
            <button
              type="submit"
              className="btn-inkica-primary"
              style={{ height: 44, padding: '0 1.2rem', borderRadius: 14, border: 'none', color: '#FFFFFF', fontWeight: 700, cursor: 'pointer' }}
            >
              + Thêm Ngoại Lệ
            </button>
          </form>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {userOverrides.map((ov) => (
              <div
                key={ov.id}
                style={{
                  padding: '10px 14px',
                  borderRadius: 14,
                  border: '1px solid #E2E8F0',
                  background: '#FFFFFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 10,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', fontSize: '0.83rem' }}>
                  <Badge tone={ov.effect === 'deny' ? 'danger' : 'success'}>
                    {ov.effect === 'deny' ? 'DENY' : 'GRANT'}
                  </Badge>
                  <strong>{ov.user_name || ov.user_email || ov.user_label || ov.user_id}</strong>
                  <span style={{ color: '#64748B' }}>→ Phân hệ: <strong>{ov.module_key}</strong></span>
                  <span style={{ color: '#64748B' }}>
                    ({Object.entries(ov.actions || {}).filter(([, enabled]) => Boolean(enabled)).map(([k]) => k).join(', ') || Object.keys(ov.actions || {}).join(', ')})
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => void handleDeleteOverride(ov.id)}
                  style={{ border: 'none', background: 'transparent', color: '#1E40FF', cursor: 'pointer' }}
                >
                  <Trash2 size={15} />
                </button>
              </div>
            ))}
            {userOverrides.length === 0 && (
              <div style={{ fontSize: '0.82rem', color: '#64748B' }}>
                Chưa có ngoại lệ cá nhân nào. Mọi nhân sự đang tuân theo Ma trận Vai trò ∪ Phòng ban.
              </div>
            )}
          </div>
        </Card>
      )}
    </div>
  );
};
