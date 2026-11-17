import React, { useCallback, useEffect, useState } from 'react';
import { ShieldCheck, Trash2, UserPlus, Users } from 'lucide-react';
import toast from 'react-hot-toast';
import { CustomModal } from '../../components/ui/CustomModal';
import { Badge, EmptyState } from '../../components/ui/AutoDataLoadingModal';
import { ModalBodySkeleton } from '../../components/ui/Skeleton';
import { apiRequest, getErrorMessage } from '../../../autodataApi';
import { useAuth } from '../../contexts/AuthContext';
import {
  PROJECT_ROLE_OPTIONS,
  type ProjectRosterRow,
  type ProjectRow,
  type StaffMemberLookup,
} from './projectsTypes';

export interface ProjectRosterModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: ProjectRow | null;
  staff: StaffMemberLookup[];
  canEdit: boolean;
  onChanged?: () => Promise<void> | void;
}

export const ProjectRosterModal: React.FC<ProjectRosterModalProps> = ({
  isOpen,
  onClose,
  project,
  staff,
  canEdit,
  onChanged,
}) => {
  const { token, tenantSlug } = useAuth();
  const [roster, setRoster] = useState<ProjectRosterRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [roleInProject, setRoleInProject] = useState('member');
  const [allocationPct, setAllocationPct] = useState('100');
  const [canEditTasks, setCanEditTasks] = useState(true);
  const [canEditWhiteboard, setCanEditWhiteboard] = useState(true);
  const [canManageRoster, setCanManageRoster] = useState(false);
  const [saving, setSaving] = useState(false);

  const loadRoster = useCallback(
    async (projectId: string) => {
      const res = await apiRequest<{ items: ProjectRosterRow[] }>(`/projects/${projectId}/roster`, {
        token,
        tenantSlug,
      });
      return res.items || [];
    },
    [token, tenantSlug]
  );

  useEffect(() => {
    if (!isOpen || !project?.id) return undefined;
    let cancelled = false;
    (async () => {
      try {
        const items = await loadRoster(project.id);
        if (!cancelled) setRoster(items);
      } catch (err) {
        if (!cancelled) toast.error(getErrorMessage(err, 'Không thể tải danh sách thành viên dự án'));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isOpen, project?.id, loadRoster]);

  const handleAddOrUpsertMember = async () => {
    if (!project) return;
    if (!selectedUserId) {
      toast.error('Vui lòng chọn nhân sự cần thêm vào dự án');
      return;
    }
    const staffInfo = staff.find((s) => s.id === selectedUserId);
    setSaving(true);
    try {
      const saved = await apiRequest<ProjectRosterRow>(`/projects/${project.id}/roster`, {
        method: 'POST',
        token,
        tenantSlug,
        body: {
          user_id: selectedUserId,
          user_name: staffInfo?.full_name || undefined,
          role_in_project: roleInProject,
          allocation_pct: Number(allocationPct || 100),
          can_edit_tasks: canEditTasks,
          can_edit_whiteboard: canEditWhiteboard,
          can_manage_roster: canManageRoster,
        },
      });
      setRoster((prev) => {
        const exists = prev.some((m) => m.id === saved.id || m.user_id === saved.user_id);
        return exists
          ? prev.map((m) => (m.id === saved.id || m.user_id === saved.user_id ? saved : m))
          : [...prev, saved];
      });
      setSelectedUserId('');
      toast.success('Đã cập nhật quyền thành viên dự án (Roster ACL)');
      await onChanged?.();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Không thể lưu phân quyền thành viên'));
    } finally {
      setSaving(false);
    }
  };

  const handleToggleAclFlag = async (
    member: ProjectRosterRow,
    field: 'can_edit_tasks' | 'can_edit_whiteboard' | 'can_manage_roster'
  ) => {
    if (!project || !canEdit) return;
    const nextValue = !member[field];
    try {
      const updated = await apiRequest<ProjectRosterRow>(`/projects/${project.id}/roster`, {
        method: 'POST',
        token,
        tenantSlug,
        body: {
          user_id: member.user_id,
          user_name: member.user_name,
          role_in_project: member.role_in_project,
          allocation_pct: member.allocation_pct,
          can_edit_tasks: field === 'can_edit_tasks' ? nextValue : member.can_edit_tasks,
          can_edit_whiteboard: field === 'can_edit_whiteboard' ? nextValue : member.can_edit_whiteboard,
          can_manage_roster: field === 'can_manage_roster' ? nextValue : member.can_manage_roster,
        },
      });
      setRoster((prev) => prev.map((m) => (m.id === member.id ? updated : m)));
      toast.success(`Đã cập nhật quyền cho ${member.user_name}`);
    } catch (err) {
      toast.error(getErrorMessage(err, 'Không thể đổi quyền ACL'));
    }
  };

  const handleRemoveMember = async (member: ProjectRosterRow) => {
    if (!project || !canEdit) return;
    try {
      await apiRequest(`/projects/${project.id}/roster/${member.id}`, {
        method: 'DELETE',
        token,
        tenantSlug,
      });
      setRoster((prev) => prev.filter((m) => m.id !== member.id));
      toast.success(`Đã gỡ ${member.user_name} khỏi Roster dự án`);
      await onChanged?.();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Không thể gỡ thành viên'));
    }
  };

  return (
    <CustomModal
      isOpen={isOpen}
      onClose={onClose}
      title={`Phân Quyền Thành Viên Dự Án (Roster ACL) — ${project?.name || ''}`}
      width={680}
    >
      {loading ? (
        <ModalBodySkeleton rows={4} />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {canEdit && (
            <div
              style={{
                padding: 14,
                borderRadius: 16,
                background: '#F8FAFF',
                border: '1px solid #DBEAFE',
                display: 'flex',
                flexDirection: 'column',
                gap: 10,
              }}
            >
              <div style={{ fontSize: '0.84rem', fontWeight: 700, color: '#0F172A', display: 'flex', alignItems: 'center', gap: 6 }}>
                <UserPlus size={16} color="#1E40FF" /> Thêm hoặc Cập nhật Nhân sự Tham gia Dự án
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr 0.65fr', gap: 10 }}>
                <select
                  value={selectedUserId}
                  onChange={(e) => setSelectedUserId(e.target.value)}
                  style={{ height: 44, borderRadius: 12, border: '1px solid #E2E8F0', padding: '0 12px', background: '#FFFFFF' }}
                >
                  <option value="">-- Chọn nhân sự --</option>
                  {staff.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.full_name} ({u.email})
                    </option>
                  ))}
                </select>
                <select
                  value={roleInProject}
                  onChange={(e) => setRoleInProject(e.target.value)}
                  style={{ height: 44, borderRadius: 12, border: '1px solid #E2E8F0', padding: '0 12px', background: '#FFFFFF' }}
                >
                  {PROJECT_ROLE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                <input
                  type="number"
                  min={10}
                  max={200}
                  value={allocationPct}
                  onChange={(e) => setAllocationPct(e.target.value)}
                  placeholder="% Phân bổ"
                  title="Tỷ lệ phân bổ nguồn lực (%)"
                  style={{ height: 44, borderRadius: 12, border: '1px solid #E2E8F0', padding: '0 12px', background: '#FFFFFF' }}
                />
              </div>

              <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, fontSize: '0.8rem', color: '#334155' }}>
                  <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                    <input type="checkbox" checked={canEditTasks} onChange={(e) => setCanEditTasks(e.target.checked)} />
                    Sửa công việc
                  </label>
                  <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                    <input type="checkbox" checked={canEditWhiteboard} onChange={(e) => setCanEditWhiteboard(e.target.checked)} />
                    Sửa Bảng trắng
                  </label>
                  <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                    <input type="checkbox" checked={canManageRoster} onChange={(e) => setCanManageRoster(e.target.checked)} />
                    Quản lý Roster
                  </label>
                </div>

                <button
                  type="button"
                  disabled={saving}
                  onClick={() => void handleAddOrUpsertMember()}
                  style={{
                    height: 40,
                    padding: '0 16px',
                    borderRadius: 12,
                    border: 'none',
                    background: '#1E40FF',
                    color: '#FFFFFF',
                    fontWeight: 700,
                    fontSize: '0.82rem',
                    cursor: 'pointer',
                  }}
                >
                  {saving ? 'Đang lưu...' : 'Gán vào dự án'}
                </button>
              </div>
            </div>
          )}

          {roster.length === 0 ? (
            <EmptyState
              icon={<Users size={24} />}
              title="Chưa có thành viên nào trong Roster dự án"
              description="Thêm nhân sự để kiểm soát quyền chỉnh sửa công việc, Bảng trắng và tỷ lệ phân bổ nguồn lực."
            />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {roster.map((m) => (
                <div
                  key={m.id}
                  style={{
                    padding: '12px 14px',
                    borderRadius: 14,
                    border: '1px solid #E2E8F0',
                    background: '#FFFFFF',
                    display: 'flex',
                    flexWrap: 'wrap',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 10,
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <strong style={{ fontSize: '0.88rem', color: '#0F172A' }}>{m.user_name}</strong>
                      <Badge tone="primary" icon={<ShieldCheck size={11} />}>
                        {m.role_in_project}
                      </Badge>
                      <Badge tone="info">Phân bổ {m.allocation_pct}%</Badge>
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: 2 }}>
                      {m.user_email || 'Thành viên nội bộ'} {m.department_name ? `• ${m.department_name}` : ''}
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      disabled={!canEdit}
                      onClick={() => void handleToggleAclFlag(m, 'can_edit_tasks')}
                      style={{
                        height: 30,
                        padding: '0 10px',
                        borderRadius: 999,
                        border: m.can_edit_tasks ? '1px solid #BFDBFE' : '1px solid #E2E8F0',
                        background: m.can_edit_tasks ? '#EFF6FF' : '#F8F9FA',
                        color: m.can_edit_tasks ? '#1E40FF' : '#64748B',
                        fontSize: '0.73rem',
                        fontWeight: 700,
                        cursor: canEdit ? 'pointer' : 'default',
                      }}
                    >
                      Tasks: {m.can_edit_tasks ? 'Cho phép' : 'Chỉ xem'}
                    </button>
                    <button
                      type="button"
                      disabled={!canEdit}
                      onClick={() => void handleToggleAclFlag(m, 'can_edit_whiteboard')}
                      style={{
                        height: 30,
                        padding: '0 10px',
                        borderRadius: 999,
                        border: m.can_edit_whiteboard ? '1px solid #A7F3D0' : '1px solid #E2E8F0',
                        background: m.can_edit_whiteboard ? '#ECFDF5' : '#F8F9FA',
                        color: m.can_edit_whiteboard ? '#059669' : '#64748B',
                        fontSize: '0.73rem',
                        fontWeight: 700,
                        cursor: canEdit ? 'pointer' : 'default',
                      }}
                    >
                      Whiteboard: {m.can_edit_whiteboard ? 'Bật' : 'Tắt'}
                    </button>
                    <button
                      type="button"
                      disabled={!canEdit}
                      onClick={() => void handleToggleAclFlag(m, 'can_manage_roster')}
                      style={{
                        height: 30,
                        padding: '0 10px',
                        borderRadius: 999,
                        border: m.can_manage_roster ? '1px solid #FDE68A' : '1px solid #E2E8F0',
                        background: m.can_manage_roster ? '#FFFBEB' : '#F8F9FA',
                        color: m.can_manage_roster ? '#D97706' : '#64748B',
                        fontSize: '0.73rem',
                        fontWeight: 700,
                        cursor: canEdit ? 'pointer' : 'default',
                      }}
                    >
                      Roster Admin: {m.can_manage_roster ? 'Có' : 'Không'}
                    </button>
                    {canEdit && (
                      <button
                        type="button"
                        onClick={() => void handleRemoveMember(m)}
                        title="Xóa khỏi dự án"
                        style={{ border: 'none', background: 'transparent', color: '#DC2626', cursor: 'pointer' }}
                      >
                        <Trash2 size={15} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </CustomModal>
  );
};
