import React, { useCallback, useEffect, useState } from 'react';
import { Building2, Globe, Lock, Plus, ShieldCheck, Trash2, Users } from 'lucide-react';
import toast from 'react-hot-toast';
import { Badge } from '../../components/ui/AutoDataLoadingModal';
import { CustomModal } from '../../components/ui/CustomModal';
import { ModalBodySkeleton } from '../../components/ui/Skeleton';
import { apiRequest, getErrorMessage } from '../../../autodataApi';
import type {
  EmailTemplateDto,
  TemplateAclEntry,
  TemplateVisibility,
} from './templateTypes';

export interface TemplateAccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  template: EmailTemplateDto | null;
  token?: string | null;
  tenantSlug?: string | null;
  onSaved: () => void;
}

interface AclApiResponse {
  visibility?: TemplateVisibility;
  entries?: TemplateAclEntry[];
  acl?: TemplateAclEntry[];
}

const VISIBILITY_OPTIONS: ReadonlyArray<{
  key: TemplateVisibility;
  label: string;
  desc: string;
  icon: React.ReactNode;
}> = [
  { key: 'private', label: 'Riêng tư (Private)', desc: 'Chỉ người tạo & Quản trị viên được xem', icon: <Lock size={15} /> },
  { key: 'team', label: 'Đội nhóm (Team)', desc: 'Chia sẻ trong các đội nhóm được chỉ định', icon: <Users size={15} /> },
  { key: 'department', label: 'Phòng ban (Department)', desc: 'Chia sẻ cho phòng Marketing / Sale', icon: <Building2 size={15} /> },
  { key: 'company', label: 'Toàn Doanh nghiệp (Company)', desc: 'Mọi nhân sự trong Workspace được sử dụng', icon: <Globe size={15} /> },
];

const TemplateAccessBody: React.FC<{
  template: EmailTemplateDto;
  token?: string | null;
  tenantSlug?: string | null;
  onClose: () => void;
  onSaved: () => void;
}> = ({ template, token, tenantSlug, onClose, onSaved }) => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [visibility, setVisibility] = useState<TemplateVisibility>(
    template.visibility || 'company'
  );
  const [entries, setEntries] = useState<TemplateAclEntry[]>([]);
  const [targetType, setTargetType] = useState<TemplateAclEntry['target_type']>('team');
  const [targetId, setTargetId] = useState('');
  const [targetLabel, setTargetLabel] = useState('');
  const [permission, setPermission] = useState<TemplateAclEntry['permission']>('use');

  const fetchAcl = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiRequest<AclApiResponse>(
        `/marketing/templates/${template.id}/acl`,
        { token, tenantSlug }
      );
      if (res.visibility) setVisibility(res.visibility);
      setEntries(res.entries || res.acl || []);
    } catch {
      setVisibility(template.visibility || 'company');
      setEntries([]);
    } finally {
      setLoading(false);
    }
  }, [template.id, template.visibility, token, tenantSlug]);

  useEffect(() => {
    let active = true;
    (async () => {
      await Promise.resolve();
      if (active) await fetchAcl();
    })();
    return () => {
      active = false;
    };
  }, [fetchAcl]);

  const addEntry = () => {
    const cleanId = targetId.trim();
    if (!cleanId) {
      toast.error('Vui lòng nhập Mã / Email đối tượng được chia sẻ.');
      return;
    }
    if (entries.some((e) => e.target_type === targetType && e.target_id === cleanId)) {
      toast.error('Đối tượng này đã có trong danh sách phân quyền.');
      return;
    }
    setEntries((prev) => [
      ...prev,
      {
        target_type: targetType,
        target_id: cleanId,
        target_label: targetLabel.trim() || cleanId,
        permission,
      },
    ]);
    setTargetId('');
    setTargetLabel('');
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await apiRequest(`/marketing/templates/${template.id}/acl`, {
        method: 'PUT',
        token,
        tenantSlug,
        body: {
          visibility,
          entries,
          acl: entries,
          team_ids: entries.filter((e) => e.target_type === 'team').map((e) => e.target_id),
          department_ids: entries.filter((e) => e.target_type === 'department').map((e) => e.target_id),
          role_ids: entries.filter((e) => e.target_type === 'role').map((e) => e.target_id),
          user_ids: entries.filter((e) => e.target_type === 'user').map((e) => e.target_id),
        },
      });
      toast.success('Đã cập nhật phân quyền chia sẻ ACL cho mẫu Email!');
      onSaved();
      onClose();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Không thể lưu cấu hình phân quyền ACL.'));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <ModalBodySkeleton rows={4} />;
  }

  const inputStyle: React.CSSProperties = {
    height: 44,
    padding: '0 10px',
    borderRadius: 10,
    border: '1px solid #E2E8F0',
    background: '#FFFFFF',
    fontSize: '0.8rem',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div>
        <div style={{ fontSize: '0.76rem', fontWeight: 700, color: '#334155', marginBottom: 8 }}>
          Phạm vi Hiển thị Mẫu "{template.name}"
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          {VISIBILITY_OPTIONS.map((opt) => {
            const active = visibility === opt.key;
            return (
              <button
                key={opt.key}
                type="button"
                onClick={() => setVisibility(opt.key)}
                style={{
                  padding: '10px 12px',
                  borderRadius: 12,
                  border: active ? '1.5px solid #1E40FF' : '1px solid #E2E8F0',
                  background: active ? '#EFF6FF' : '#FFFFFF',
                  textAlign: 'left',
                  cursor: 'pointer',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: active ? '#1E40FF' : '#0F172A', fontSize: '0.8rem', fontWeight: 700 }}>
                  {opt.icon} {opt.label}
                </div>
                <div style={{ fontSize: '0.7rem', color: '#64748B', marginTop: 3 }}>{opt.desc}</div>
              </button>
            );
          })}
        </div>
      </div>

      <div
        style={{
          padding: 12,
          borderRadius: 14,
          background: '#F8FAFF',
          border: '1px solid #DBEAFE',
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
        }}
      >
        <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#1E40FF' }}>
          Thêm Quyền Truy Cập Chi Tiết (Team / Department / Role / User)
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '130px 1fr 1fr 115px auto', gap: 6 }}>
          <select
            value={targetType}
            onChange={(e) => setTargetType(e.target.value as TemplateAclEntry['target_type'])}
            style={inputStyle}
          >
            <option value="team">Đội nhóm (Team)</option>
            <option value="department">Phòng ban</option>
            <option value="role">Vai trò (Role)</option>
            <option value="user">Nhân sự (User)</option>
          </select>
          <input
            placeholder="Mã ID / Email..."
            value={targetId}
            onChange={(e) => setTargetId(e.target.value)}
            style={inputStyle}
          />
          <input
            placeholder="Tên hiển thị..."
            value={targetLabel}
            onChange={(e) => setTargetLabel(e.target.value)}
            style={inputStyle}
          />
          <select
            value={permission}
            onChange={(e) => setPermission(e.target.value as TemplateAclEntry['permission'])}
            style={inputStyle}
          >
            <option value="view">Chỉ xem</option>
            <option value="use">Sử dụng</option>
            <option value="edit">Chỉnh sửa</option>
          </select>
          <button
            type="button"
            onClick={addEntry}
            style={{
              height: 44,
              padding: '0 12px',
              borderRadius: 10,
              border: 'none',
              background: '#1E40FF',
              color: '#FFFFFF',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            <Plus size={16} />
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 200, overflowY: 'auto' }}>
        {entries.length === 0 ? (
          <div style={{ padding: 14, borderRadius: 12, border: '1px dashed #E2E8F0', textAlign: 'center', fontSize: '0.76rem', color: '#64748B' }}>
            Chưa có quy tắc ACL riêng lẻ. Áp dụng theo chế độ hiển thị <strong>{visibility.toUpperCase()}</strong>.
          </div>
        ) : (
          entries.map((entry, idx) => (
            <div
              key={`${entry.target_type}-${entry.target_id}-${idx}`}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '8px 12px',
                borderRadius: 10,
                border: '1px solid #E2E8F0',
                background: '#FFFFFF',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Badge tone="primary">{entry.target_type.toUpperCase()}</Badge>
                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#0F172A' }}>
                  {entry.target_label || entry.target_id}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Badge tone={entry.permission === 'edit' ? 'warning' : 'success'}>
                  Quyền: {entry.permission}
                </Badge>
                <button
                  type="button"
                  onClick={() => setEntries((prev) => prev.filter((_, i) => i !== idx))}
                  style={{ border: 'none', background: 'transparent', color: '#DC2626', cursor: 'pointer' }}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, paddingTop: 8, borderTop: '1px solid #F1F5F9' }}>
        <button type="button" onClick={onClose} className="btn secondary" style={{ height: 44 }}>
          Hủy
        </button>
        <button
          type="button"
          disabled={saving}
          onClick={() => void handleSave()}
          style={{
            height: 44,
            padding: '0 18px',
            borderRadius: 12,
            border: 'none',
            background: '#1E40FF',
            color: '#FFFFFF',
            fontWeight: 700,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            cursor: 'pointer',
          }}
        >
          <ShieldCheck size={15} /> {saving ? 'Đang lưu...' : 'Lưu Phân Quyền ACL'}
        </button>
      </div>
    </div>
  );
};

export const TemplateAccessModal: React.FC<TemplateAccessModalProps> = (props) => (
  <CustomModal
    isOpen={props.isOpen && Boolean(props.template)}
    onClose={props.onClose}
    title="Phân Quyền Truy Cập & Chia Sẻ Mẫu Email (ACL)"
    width={660}
  >
    {props.isOpen && props.template && (
      <TemplateAccessBody
        template={props.template}
        token={props.token}
        tenantSlug={props.tenantSlug}
        onClose={props.onClose}
        onSaved={props.onSaved}
      />
    )}
  </CustomModal>
);

export default TemplateAccessModal;
