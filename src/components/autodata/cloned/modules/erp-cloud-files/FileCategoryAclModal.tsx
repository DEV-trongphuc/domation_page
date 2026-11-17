import React, { useState } from 'react';
import { Edit2, FolderLock, Plus, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { CustomModal } from '../../components/ui/CustomModal';
import { Badge, EmptyState } from '../../components/ui/AutoDataLoadingModal';
import { apiRequest, getErrorMessage } from '../../../autodataApi';
import { useAuth } from '../../contexts/AuthContext';
import {
  CATEGORY_ICON_OPTIONS,
  ROLE_OPTIONS,
  type CloudFileCategoryItem,
  type DepartmentLookupItem,
} from './cloudFilesTypes';

export interface FileCategoryAclModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: CloudFileCategoryItem[];
  departments: DepartmentLookupItem[];
  canEdit: boolean;
  onChanged: () => Promise<void> | void;
}

export const FileCategoryAclModal: React.FC<FileCategoryAclModalProps> = ({
  isOpen,
  onClose,
  categories,
  departments,
  canEdit,
  onChanged,
}) => {
  const { token, tenantSlug } = useAuth();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [label, setLabel] = useState('');
  const [categoryKey, setCategoryKey] = useState('');
  const [iconType, setIconType] = useState('folder');
  const [visibility, setVisibility] = useState<'company' | 'departments' | 'private'>('company');
  const [allowedDepts, setAllowedDepts] = useState<string[]>([]);
  const [allowedRoles, setAllowedRoles] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  const resetForm = () => {
    setEditingId(null);
    setLabel('');
    setCategoryKey('');
    setIconType('folder');
    setVisibility('company');
    setAllowedDepts([]);
    setAllowedRoles([]);
  };

  const toggleItem = (list: string[], setter: React.Dispatch<React.SetStateAction<string[]>>, val: string) => {
    setter(list.includes(val) ? list.filter((i) => i !== val) : [...list, val]);
  };

  const startEdit = (cat: CloudFileCategoryItem) => {
    setEditingId(cat.id);
    setLabel(cat.label);
    setCategoryKey(cat.category_key);
    setIconType(cat.icon_type || 'folder');
    setVisibility(cat.visibility || 'company');
    setAllowedDepts(cat.allowed_department_ids || []);
    setAllowedRoles(cat.allowed_role_ids || []);
  };

  const handleSaveCategory = async () => {
    if (!label.trim()) {
      toast.error('Vui lòng nhập tên danh mục tài liệu');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        label: label.trim(),
        category_key: categoryKey.trim() || undefined,
        icon_type: iconType,
        visibility,
        allowed_department_ids: visibility === 'departments' ? allowedDepts : [],
        allowed_role_ids: allowedRoles,
      };

      if (editingId) {
        await apiRequest(`/erp-ops/drive/categories/${editingId}`, {
          method: 'PATCH',
          token,
          tenantSlug,
          body: payload,
        });
        toast.success('Đã cập nhật danh mục & quyền ACL');
      } else {
        await apiRequest('/erp-ops/drive/categories', {
          method: 'POST',
          token,
          tenantSlug,
          body: payload,
        });
        toast.success('Đã tạo danh mục phân loại tài liệu kèm ACL');
      }
      resetForm();
      await onChanged();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Không thể lưu danh mục tài liệu'));
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCategory = async (cat: CloudFileCategoryItem) => {
    try {
      await apiRequest(`/erp-ops/drive/categories/${cat.id}`, {
        method: 'DELETE',
        token,
        tenantSlug,
      });
      toast.success(`Đã xóa danh mục ${cat.label}`);
      if (editingId === cat.id) resetForm();
      await onChanged();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Không thể xóa danh mục'));
    }
  };

  return (
    <CustomModal
      isOpen={isOpen}
      onClose={onClose}
      title="Quản Lý Danh Mục Phân Loại Tệp & Phân Quyền Phòng Ban (Category ACL)"
      width={680}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {canEdit && (
          <div style={{ padding: 14, borderRadius: 16, background: '#F8FAFF', border: '1px solid #DBEAFE', display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ fontSize: '0.84rem', fontWeight: 800, color: '#0F172A', display: 'flex', alignItems: 'center', gap: 6 }}>
              <FolderLock size={16} color="#1E40FF" />
              {editingId ? 'Chỉnh sửa Danh mục & ACL' : 'Tạo Danh mục Tài liệu Mới'}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.9fr 1fr', gap: 10 }}>
              <input
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder="Tên danh mục (VD: Hợp đồng Mật)..."
                style={{ height: 44, borderRadius: 12, border: '1px solid #E2E8F0', padding: '0 12px', background: '#FFFFFF' }}
              />
              <input
                value={categoryKey}
                onChange={(e) => setCategoryKey(e.target.value)}
                placeholder="Mã key (tự sinh)..."
                style={{ height: 44, borderRadius: 12, border: '1px solid #E2E8F0', padding: '0 12px', background: '#FFFFFF' }}
              />
              <select
                value={iconType}
                onChange={(e) => setIconType(e.target.value)}
                style={{ height: 44, borderRadius: 12, border: '1px solid #E2E8F0', padding: '0 12px', background: '#FFFFFF' }}
              >
                {CATEGORY_ICON_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <select
                value={visibility}
                onChange={(e) => setVisibility(e.target.value as 'company' | 'departments' | 'private')}
                style={{ height: 44, borderRadius: 12, border: '1px solid #E2E8F0', padding: '0 12px', background: '#FFFFFF' }}
              >
                <option value="company">Toàn công ty (Company-wide)</option>
                <option value="departments">Giới hạn theo Phòng ban (Department ACL)</option>
                <option value="private">Riêng tư (Chỉ người tạo & Admin)</option>
              </select>

              <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8 }}>
                {ROLE_OPTIONS.map((r) => (
                  <label key={r.value} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: '0.75rem', color: '#334155', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={allowedRoles.includes(r.value)}
                      onChange={() => toggleItem(allowedRoles, setAllowedRoles, r.value)}
                    />
                    {r.value}
                  </label>
                ))}
              </div>
            </div>

            {visibility === 'departments' && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, padding: 10, borderRadius: 12, background: '#FFFFFF', border: '1px solid #E2E8F0' }}>
                {departments.length === 0 ? (
                  <span style={{ fontSize: '0.78rem', color: '#64748B' }}>Chưa có phòng ban nào được khai báo.</span>
                ) : (
                  departments.map((d) => (
                    <label key={d.id} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: '0.8rem', color: '#0F172A', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={allowedDepts.includes(d.id)}
                        onChange={() => toggleItem(allowedDepts, setAllowedDepts, d.id)}
                      />
                      {d.name} ({d.code})
                    </label>
                  ))
                )}
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              {editingId && (
                <button type="button" onClick={resetForm} className="btn secondary" style={{ height: 40 }}>
                  Hủy sửa
                </button>
              )}
              <button
                type="button"
                disabled={saving}
                onClick={() => void handleSaveCategory()}
                style={{ height: 40, padding: '0 16px', borderRadius: 10, border: 'none', background: '#1E40FF', color: '#FFFFFF', fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}
              >
                <Plus size={15} /> {saving ? 'Đang lưu...' : editingId ? 'Cập nhật danh mục' : 'Thêm danh mục'}
              </button>
            </div>
          </div>
        )}

        {categories.length === 0 ? (
          <EmptyState
            icon={<FolderLock size={22} />}
            title="Chưa có danh mục tùy chỉnh nào"
            description="Tạo danh mục như Hợp đồng, Hồ sơ KYC, Báo cáo Tài chính để lọc nhanh và khóa quyền phòng ban."
          />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {categories.map((cat) => (
              <div
                key={cat.id}
                style={{ padding: '10px 14px', borderRadius: 14, border: '1px solid #E2E8F0', background: '#FFFFFF', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <strong style={{ fontSize: '0.86rem', color: '#0F172A' }}>{cat.label}</strong>
                    <Badge tone="neutral">{cat.category_key}</Badge>
                    <Badge tone={cat.visibility === 'departments' ? 'warning' : cat.visibility === 'private' ? 'danger' : 'success'}>
                      {cat.visibility === 'departments'
                        ? `${cat.allowed_department_ids.length} Phòng ban`
                        : cat.visibility === 'private'
                          ? 'Riêng tư'
                          : 'Toàn công ty'}
                    </Badge>
                  </div>
                </div>
                {canEdit && (
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button type="button" onClick={() => startEdit(cat)} style={{ border: 'none', background: 'transparent', color: '#1E40FF', cursor: 'pointer' }}>
                      <Edit2 size={15} />
                    </button>
                    <button type="button" onClick={() => void handleDeleteCategory(cat)} style={{ border: 'none', background: 'transparent', color: '#DC2626', cursor: 'pointer' }}>
                      <Trash2 size={15} />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </CustomModal>
  );
};
