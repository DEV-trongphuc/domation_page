import React, { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Columns, LayoutList, Plus, Power, Trash2 } from 'lucide-react';
import { apiRequest, getErrorMessage } from '../../../autodataApi';
import { useEntitlement } from '../../contexts/EntitlementContext';
import { TableSkeleton } from '../../components/ui/Skeleton';
import type { CustomFieldDef, EntityTabDef, OrgRole } from './saasSettingsTypes';

const ENTITY_OPTIONS = [
  { key: 'lead', label: 'Lead / Khách tiềm năng' },
  { key: 'contact', label: 'Khách hàng 360° (Contact)' },
  { key: 'deal', label: 'Cơ hội Bán hàng (Deal)' },
  { key: 'company', label: 'Doanh nghiệp B2B (Company)' },
  { key: 'employee', label: 'Nhân sự (Employee)' },
  { key: 'project', label: 'Dự án (Project)' },
  { key: 'task', label: 'Công việc (Task)' },
  { key: 'quote', label: 'Báo giá (Quote)' },
  { key: 'invoice', label: 'Hóa đơn (Invoice)' },
  { key: 'asset', label: 'Tài sản (Asset)' },
  { key: 'ticket', label: 'Ticket / Helpdesk' },
];

const FIELD_TYPES: CustomFieldDef['field_type'][] = [
  'text',
  'number',
  'date',
  'select',
  'multiselect',
  'checkbox',
  'url',
  'email',
  'phone',
  'textarea',
];

const TAB_TYPES: EntityTabDef['tab_type'][] = ['fields', 'timeline', 'files', 'checklist', 'embed'];

export const CustomFieldsAndTabsPanel: React.FC<{ roles?: OrgRole[] }> = ({ roles = [] }) => {
  const { can } = useEntitlement();
  const canManage = can('settings', 'manage_config');

  const [subTab, setSubTab] = useState<'fields' | 'tabs'>('fields');
  const [entityFilter, setEntityFilter] = useState<string>('lead');
  const [fields, setFields] = useState<CustomFieldDef[]>([]);
  const [entityTabs, setEntityTabs] = useState<EntityTabDef[]>([]);
  const [loading, setLoading] = useState(true);

  // Field form
  const [fieldLabel, setFieldLabel] = useState('');
  const [fieldKey, setFieldKey] = useState('');
  const [fieldType, setFieldType] = useState<CustomFieldDef['field_type']>('text');
  const [fieldOptionsRaw, setFieldOptionsRaw] = useState('');
  const [fieldRequired, setFieldRequired] = useState(false);
  const [fieldFilterable, setFieldFilterable] = useState(true);
  const [fieldShowTable, setFieldShowTable] = useState(true);
  const [savingField, setSavingField] = useState(false);

  // Entity Tab form
  const [tabLabel, setTabLabel] = useState('');
  const [tabKey, setTabKey] = useState('');
  const [tabType, setTabType] = useState<EntityTabDef['tab_type']>('fields');
  const [tabIcon, setTabIcon] = useState('Layers');
  const [tabRoles, setTabRoles] = useState<string[]>([]);
  const [savingTab, setSavingTab] = useState(false);

  const loadData = useCallback(async (targetEntity: string) => {
    try {
      const [cfRows, etRows] = await Promise.all([
        apiRequest<CustomFieldDef[]>(`/org-rbac/custom-fields?entity_type=${encodeURIComponent(targetEntity)}`),
        apiRequest<EntityTabDef[]>(`/org-rbac/entity-tabs?entity_type=${encodeURIComponent(targetEntity)}`),
      ]);
      setFields(Array.isArray(cfRows) ? cfRows : []);
      setEntityTabs(Array.isArray(etRows) ? etRows : []);
    } catch (err) {
      toast.error(getErrorMessage(err, 'Không thể tải cấu hình Trường tùy chỉnh & Tab thực thể'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    (async () => {
      if (active) await loadData(entityFilter);
    })();
    return () => {
      active = false;
    };
  }, [loadData, entityFilter]);

  const handleCreateField = async () => {
    if (!fieldLabel.trim()) {
      toast.error('Vui lòng nhập Nhãn trường tùy chỉnh');
      return;
    }
    setSavingField(true);
    try {
      const optionsJson = fieldOptionsRaw
        .split(/[\n,;]+/)
        .map((s) => s.trim())
        .filter(Boolean);
      const created = await apiRequest<CustomFieldDef>('/org-rbac/custom-fields', {
        method: 'POST',
        body: {
          entity_type: entityFilter,
          field_label: fieldLabel.trim(),
          field_key: fieldKey.trim() || undefined,
          field_type: fieldType,
          options_json: optionsJson,
          is_required: fieldRequired,
          is_filterable: fieldFilterable,
          show_in_table: fieldShowTable,
          sort_order: fields.length + 1,
        },
      });
      setFields((prev) => [...prev, created]);
      setFieldLabel('');
      setFieldKey('');
      setFieldOptionsRaw('');
      setFieldRequired(false);
      toast.success(`Đã tạo trường tùy chỉnh "${created.field_label}"`);
    } catch (err) {
      toast.error(getErrorMessage(err, 'Không thể tạo trường tùy chỉnh'));
    } finally {
      setSavingField(false);
    }
  };

  const handleToggleFieldActive = async (item: CustomFieldDef) => {
    const prevList = fields;
    setFields((prev) => prev.map((f) => (f.id === item.id ? { ...f, is_active: !item.is_active } : f)));
    try {
      await apiRequest(`/org-rbac/custom-fields/${item.id}`, {
        method: 'PUT',
        body: { is_active: !item.is_active },
      });
      toast.success('Đã cập nhật trạng thái trường tùy chỉnh');
    } catch (err) {
      setFields(prevList);
      toast.error(getErrorMessage(err, 'Không thể cập nhật trạng thái trường'));
    }
  };

  const handleDeleteField = async (id: string) => {
    const prevList = fields;
    setFields((prev) => prev.filter((f) => f.id !== id));
    try {
      await apiRequest(`/org-rbac/custom-fields/${id}`, { method: 'DELETE' });
      toast.success('Đã xóa trường tùy chỉnh');
    } catch (err) {
      setFields(prevList);
      toast.error(getErrorMessage(err, 'Không thể xóa trường tùy chỉnh'));
    }
  };

  const handleCreateTab = async () => {
    if (!tabLabel.trim()) {
      toast.error('Vui lòng nhập Tên Tab thực thể');
      return;
    }
    setSavingTab(true);
    try {
      const created = await apiRequest<EntityTabDef>('/org-rbac/entity-tabs', {
        method: 'POST',
        body: {
          entity_type: entityFilter,
          label: tabLabel.trim(),
          tab_key: tabKey.trim() || undefined,
          icon_name: tabIcon.trim() || 'Layers',
          tab_type: tabType,
          allowed_role_ids: tabRoles,
          sort_order: entityTabs.length + 1,
        },
      });
      setEntityTabs((prev) => [...prev, created]);
      setTabLabel('');
      setTabKey('');
      setTabRoles([]);
      toast.success(`Đã thêm Tab "${created.label}" cho ${entityFilter.toUpperCase()}`);
    } catch (err) {
      toast.error(getErrorMessage(err, 'Không thể tạo Tab thực thể'));
    } finally {
      setSavingTab(false);
    }
  };

  const handleToggleTabActive = async (tab: EntityTabDef) => {
    const prevList = entityTabs;
    setEntityTabs((prev) => prev.map((t) => (t.id === tab.id ? { ...t, is_active: !tab.is_active } : t)));
    try {
      await apiRequest(`/org-rbac/entity-tabs/${tab.id}`, {
        method: 'PUT',
        body: { is_active: !tab.is_active },
      });
      toast.success('Đã cập nhật trạng thái Tab thực thể');
    } catch (err) {
      setEntityTabs(prevList);
      toast.error(getErrorMessage(err, 'Không thể cập nhật Tab thực thể'));
    }
  };

  const handleDeleteTab = async (id: string) => {
    const prevList = entityTabs;
    setEntityTabs((prev) => prev.filter((t) => t.id !== id));
    try {
      await apiRequest(`/org-rbac/entity-tabs/${id}`, { method: 'DELETE' });
      toast.success('Đã xóa Tab thực thể');
    } catch (err) {
      setEntityTabs(prevList);
      toast.error(getErrorMessage(err, 'Không thể xóa Tab thực thể'));
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#1E40FF] flex items-center justify-center">
            <Columns className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Studio Trường Tùy chỉnh Toàn cục & Tab Thực thể Động
            </h3>
            <p className="text-xs text-slate-500">
              Mở rộng schema cho mọi đối tượng CRM & ERP (Lead, Deal, Nhân sự, Dự án, Hóa đơn...) không cần sửa code.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={entityFilter}
            onChange={(e) => setEntityFilter(e.target.value)}
            className="h-11 px-3 rounded-xl border border-slate-200 text-sm font-semibold bg-white focus:border-[#1E40FF] focus:outline-none"
          >
            {ENTITY_OPTIONS.map((ent) => (
              <option key={ent.key} value={ent.key}>
                {ent.label}
              </option>
            ))}
          </select>

          <div className="inline-flex rounded-xl border border-slate-200 bg-slate-50 p-1">
            <button
              type="button"
              onClick={() => setSubTab('fields')}
              className={`px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
                subTab === 'fields' ? 'bg-[#1E40FF] text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Columns className="w-3.5 h-3.5" /> Trường Tùy chỉnh ({fields.length})
            </button>
            <button
              type="button"
              onClick={() => setSubTab('tabs')}
              className={`px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
                subTab === 'tabs' ? 'bg-[#1E40FF] text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <LayoutList className="w-3.5 h-3.5" /> Tab Hồ sơ ({entityTabs.length})
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <TableSkeleton rows={4} cols={5} />
      ) : subTab === 'fields' ? (
        <div className="space-y-5">
          {canManage && (
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <input
                  value={fieldLabel}
                  onChange={(e) => setFieldLabel(e.target.value)}
                  placeholder="Nhãn hiển thị (VD: Ngân sách dự kiến)"
                  className="h-11 px-3 rounded-xl border border-slate-200 bg-white text-sm focus:border-[#1E40FF] focus:outline-none"
                />
                <input
                  value={fieldKey}
                  onChange={(e) => setFieldKey(e.target.value)}
                  placeholder="Key kỹ thuật (tự sinh nếu bỏ trống)"
                  className="h-11 px-3 rounded-xl border border-slate-200 bg-white text-sm font-mono focus:border-[#1E40FF] focus:outline-none"
                />
                <select
                  value={fieldType}
                  onChange={(e) => setFieldType(e.target.value as CustomFieldDef['field_type'])}
                  className="h-11 px-3 rounded-xl border border-slate-200 bg-white text-sm focus:border-[#1E40FF] focus:outline-none"
                >
                  {FIELD_TYPES.map((ft) => (
                    <option key={ft} value={ft}>
                      Kiểu: {ft}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => void handleCreateField()}
                  disabled={savingField}
                  className="h-11 px-4 rounded-xl bg-[#1E40FF] hover:bg-blue-700 text-white text-sm font-semibold inline-flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <Plus className="w-4 h-4" /> {savingField ? 'Đang tạo...' : 'Thêm Trường'}
                </button>
              </div>
              {(fieldType === 'select' || fieldType === 'multiselect') && (
                <input
                  value={fieldOptionsRaw}
                  onChange={(e) => setFieldOptionsRaw(e.target.value)}
                  placeholder="Các lựa chọn phân tách bằng dấu phẩy (VD: Dưới 50tr, 50tr - 200tr, Trên 200tr)"
                  className="w-full h-11 px-3 rounded-xl border border-slate-200 bg-white text-sm focus:border-[#1E40FF] focus:outline-none"
                />
              )}
              <div className="flex flex-wrap items-center gap-5 text-xs text-slate-600">
                <label className="inline-flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={fieldRequired}
                    onChange={(e) => setFieldRequired(e.target.checked)}
                    className="rounded border-slate-300 text-[#1E40FF]"
                  />
                  Bắt buộc nhập (Required)
                </label>
                <label className="inline-flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={fieldFilterable}
                    onChange={(e) => setFieldFilterable(e.target.checked)}
                    className="rounded border-slate-300 text-[#1E40FF]"
                  />
                  Cho phép lọc nâng cao
                </label>
                <label className="inline-flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={fieldShowTable}
                    onChange={(e) => setFieldShowTable(e.target.checked)}
                    className="rounded border-slate-300 text-[#1E40FF]"
                  />
                  Hiển thị cột ngoài bảng DataList
                </label>
              </div>
            </div>
          )}

          {fields.length === 0 ? (
            <div className="text-center py-8 text-sm text-slate-500 border border-dashed border-slate-200 rounded-xl">
              Chưa có trường tùy chỉnh nào cho đối tượng <strong>{entityFilter}</strong>.
            </div>
          ) : (
            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-xs font-bold uppercase text-slate-500 border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Nhãn trường</th>
                    <th className="py-3 px-4">Key kỹ thuật</th>
                    <th className="py-3 px-4">Kiểu</th>
                    <th className="py-3 px-4">Cấu hình</th>
                    <th className="py-3 px-4 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {fields.map((f) => (
                    <tr key={f.id} className="hover:bg-slate-50/70">
                      <td className="py-3 px-4 font-semibold text-slate-900">{f.field_label}</td>
                      <td className="py-3 px-4 font-mono text-xs text-slate-600">{f.field_key}</td>
                      <td className="py-3 px-4">
                        <span className="px-2.5 py-1 rounded-full bg-blue-50 text-[#1E40FF] text-xs font-semibold">
                          {f.field_type}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-xs text-slate-500 space-x-2">
                        {f.is_required && <span className="text-amber-700 font-semibold">• Bắt buộc</span>}
                        {f.show_in_table && <span>• Cột bảng</span>}
                        {f.is_filterable && <span>• Lọc</span>}
                      </td>
                      <td className="py-3 px-4 text-right space-x-1">
                        {canManage && (
                          <>
                            <button
                              type="button"
                              onClick={() => void handleToggleFieldActive(f)}
                              title={f.is_active ? 'Đang bật' : 'Đang tắt'}
                              className={`p-2 rounded-lg border text-xs ${
                                f.is_active
                                  ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                                  : 'border-slate-200 bg-slate-100 text-slate-400'
                              }`}
                            >
                              <Power className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => void handleDeleteField(f.id)}
                              className="p-2 rounded-lg border border-slate-200 hover:border-red-200 hover:bg-red-50 text-slate-500 hover:text-red-600"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-5">
          {canManage && (
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <input
                  value={tabLabel}
                  onChange={(e) => setTabLabel(e.target.value)}
                  placeholder="Tên Tab (VD: Hồ sơ Pháp lý)"
                  className="h-11 px-3 rounded-xl border border-slate-200 bg-white text-sm focus:border-[#1E40FF] focus:outline-none"
                />
                <input
                  value={tabKey}
                  onChange={(e) => setTabKey(e.target.value)}
                  placeholder="Tab Key (tự sinh nếu trống)"
                  className="h-11 px-3 rounded-xl border border-slate-200 bg-white text-sm font-mono focus:border-[#1E40FF] focus:outline-none"
                />
                <select
                  value={tabType}
                  onChange={(e) => setTabType(e.target.value as EntityTabDef['tab_type'])}
                  className="h-11 px-3 rounded-xl border border-slate-200 bg-white text-sm focus:border-[#1E40FF] focus:outline-none"
                >
                  {TAB_TYPES.map((tt) => (
                    <option key={tt} value={tt}>
                      Loại Tab: {tt}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => void handleCreateTab()}
                  disabled={savingTab}
                  className="h-11 px-4 rounded-xl bg-[#1E40FF] hover:bg-blue-700 text-white text-sm font-semibold inline-flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <Plus className="w-4 h-4" /> {savingTab ? 'Đang thêm...' : 'Thêm Tab'}
                </button>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <input
                  value={tabIcon}
                  onChange={(e) => setTabIcon(e.target.value)}
                  placeholder="Icon Lucide (VD: Layers, FileText)"
                  className="h-10 px-3 rounded-xl border border-slate-200 bg-white text-xs w-52"
                />
                {roles.length > 0 && (
                  <div className="flex flex-wrap items-center gap-1.5 text-xs">
                    <span className="text-slate-500 font-semibold">Giới hạn Vai trò xem Tab:</span>
                    {roles.map((r) => {
                      const active = tabRoles.includes(r.id);
                      return (
                        <button
                          key={r.id}
                          type="button"
                          onClick={() =>
                            setTabRoles((prev) =>
                              active ? prev.filter((id) => id !== r.id) : [...prev, r.id]
                            )
                          }
                          className={`px-2.5 py-1 rounded-full border text-xs ${
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
              </div>
            </div>
          )}

          {entityTabs.length === 0 ? (
            <div className="text-center py-8 text-sm text-slate-500 border border-dashed border-slate-200 rounded-xl">
              Chưa có Tab tùy chỉnh nào cho đối tượng <strong>{entityFilter}</strong>.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {entityTabs.map((tab) => (
                <div
                  key={tab.id}
                  className="p-4 rounded-xl border border-slate-200 bg-white flex items-center justify-between gap-3"
                >
                  <div>
                    <div className="font-semibold text-sm text-slate-900">{tab.label}</div>
                    <div className="text-xs text-slate-500 font-mono">
                      {tab.tab_key} • {tab.tab_type} • icon: {tab.icon_name}
                    </div>
                  </div>
                  {canManage && (
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => void handleToggleTabActive(tab)}
                        className={`p-2 rounded-lg border text-xs ${
                          tab.is_active
                            ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                            : 'border-slate-200 bg-slate-100 text-slate-400'
                        }`}
                      >
                        <Power className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleDeleteTab(tab.id)}
                        className="p-2 rounded-lg border border-slate-200 hover:border-red-200 hover:bg-red-50 text-slate-500 hover:text-red-600"
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
      )}
    </div>
  );
};
