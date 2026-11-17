import React, { useMemo, useState } from 'react';
import { Award, BarChart3, CheckCircle2, Clock } from 'lucide-react';
import { CustomModal } from '../../components/ui/CustomModal';
import { Avatar } from '../../components/ui/Avatar';
import type { CrmStaffMember, WorkspaceTaskRecord } from '../../drawers/crmTypes';

export interface WorkspaceTaskStatsModalProps {
  isOpen: boolean;
  onClose: () => void;
  tasks: WorkspaceTaskRecord[];
  staff: CrmStaffMember[];
  onSelectTask: (task: WorkspaceTaskRecord) => void;
}

export const WorkspaceTaskStatsModal: React.FC<WorkspaceTaskStatsModalProps> = ({
  isOpen,
  onClose,
  tasks,
  staff,
  onSelectTask,
}) => {
  const [preset, setPreset] = useState<'all' | 'this_week' | 'this_month'>('this_month');
  const [category, setCategory] = useState<'all' | 'personal' | 'customer' | 'project'>('all');
  const [mountNow] = useState(() => Date.now());

  const filtered = useMemo(() => {
    const now = new Date(mountNow);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
    const startOfWeek = mountNow - 7 * 86400_000;

    return tasks.filter((t) => {
      if (category !== 'all' && t.category !== category) return false;
      if (preset === 'all') return true;
      const ts = t.created_at ? new Date(t.created_at).getTime() : mountNow;
      if (preset === 'this_week') return ts >= startOfWeek;
      return ts >= startOfMonth;
    });
  }, [tasks, preset, category, mountNow]);

  const doneCount = filtered.filter((t) => t.status_key === 'done').length;
  const overdueCount = filtered.filter(
    (t) =>
      t.status_key !== 'done' &&
      t.due_date &&
      new Date(t.due_date).getTime() < mountNow
  ).length;
  const totalLoggedMins = filtered.reduce((s, t) => s + Number(t.logged_minutes || 0), 0);
  const completionPct = filtered.length > 0 ? Math.round((doneCount / filtered.length) * 100) : 0;

  const leaderboard = useMemo(() => {
    const map = new Map<string, { name: string; total: number; done: number; mins: number }>();
    for (const t of filtered) {
      const uid = t.assignee_user_id || 'unassigned';
      const stf = staff.find((s) => s.id === uid);
      const name = t.assignee_name || stf?.full_name || 'Chưa phân công';
      const cur = map.get(uid) || { name, total: 0, done: 0, mins: 0 };
      cur.total += 1;
      if (t.status_key === 'done') cur.done += 1;
      cur.mins += Number(t.logged_minutes || 0);
      map.set(uid, cur);
    }
    return Array.from(map.values()).sort((a, b) => b.done - a.done || b.mins - a.mins);
  }, [filtered, staff]);

  return (
    <CustomModal isOpen={isOpen} onClose={onClose} title="Báo cáo Hiệu suất Công việc & Pomodoro">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', gap: 6 }}>
            {(
              [
                { id: 'this_week', label: '7 ngày qua' },
                { id: 'this_month', label: 'Tháng này' },
                { id: 'all', label: 'Toàn thời gian' },
              ] as const
            ).map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setPreset(p.id)}
                style={{
                  height: 36,
                  padding: '0 12px',
                  borderRadius: 8,
                  border: preset === p.id ? '1px solid #1E40FF' : '1px solid #E2E8F0',
                  background: preset === p.id ? '#1E40FF' : '#FFFFFF',
                  color: preset === p.id ? '#FFFFFF' : '#475569',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                {p.label}
              </button>
            ))}
          </div>

          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as 'all' | 'personal' | 'customer' | 'project')}
            style={{ height: 36, borderRadius: 8, border: '1px solid #E2E8F0', padding: '0 10px', fontSize: '0.78rem' }}
          >
            <option value="all">Mọi phân loại</option>
            <option value="personal">Cá nhân</option>
            <option value="customer">Khách hàng CRM</option>
            <option value="project">Dự án</option>
          </select>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
          <div style={{ padding: '10px', borderRadius: 12, background: '#F8FAFC', border: '1px solid #E2E8F0' }}>
            <div style={{ fontSize: '0.7rem', color: '#64748B', fontWeight: 700 }}>TỔNG VIỆC</div>
            <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0F172A' }}>{filtered.length}</div>
          </div>
          <div style={{ padding: '10px', borderRadius: 12, background: '#ECFDF5', border: '1px solid #BBF7D0' }}>
            <div style={{ fontSize: '0.7rem', color: '#059669', fontWeight: 700 }}>HOÀN THÀNH</div>
            <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#059669' }}>
              {doneCount} ({completionPct}%)
            </div>
          </div>
          <div style={{ padding: '10px', borderRadius: 12, background: '#FFFBEB', border: '1px solid #FDE68A' }}>
            <div style={{ fontSize: '0.7rem', color: '#D97706', fontWeight: 700 }}>QUÁ HẠN</div>
            <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#D97706' }}>{overdueCount}</div>
          </div>
          <div style={{ padding: '10px', borderRadius: 12, background: '#EFF6FF', border: '1px solid #DBEAFE' }}>
            <div style={{ fontSize: '0.7rem', color: '#1E40FF', fontWeight: 700 }}>FOCUS POMODORO</div>
            <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#1E40FF' }}>{totalLoggedMins}p</div>
          </div>
        </div>

        {/* Leaderboard */}
        <div>
          <div style={{ fontSize: '0.82rem', fontWeight: 800, color: '#0F172A', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
            <Award size={15} color="#1E40FF" /> Bảng xếp hạng hoàn thành công việc
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 180, overflowY: 'auto' }}>
            {leaderboard.map((row) => (
              <div key={row.name} style={{ padding: '8px 10px', borderRadius: 10, border: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.82rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Avatar name={row.name} size="sm" />
                  <strong style={{ color: '#0F172A' }}>{row.name}</strong>
                </div>
                <div style={{ display: 'flex', gap: 12, color: '#475569' }}>
                  <span><CheckCircle2 size={13} color="#059669" style={{ verticalAlign: 'middle' }} /> {row.done}/{row.total}</span>
                  <span><Clock size={13} color="#1E40FF" style={{ verticalAlign: 'middle' }} /> {row.mins}p</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick task drilldown */}
        {filtered.length > 0 && (
          <div>
            <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#475569', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 5 }}>
              <BarChart3 size={14} color="#1E40FF" /> Bấm vào việc để mở ngăn chi tiết:
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5, maxHeight: 140, overflowY: 'auto' }}>
              {filtered.slice(0, 6).map((tk) => (
                <button
                  key={tk.id}
                  type="button"
                  onClick={() => {
                    onClose();
                    onSelectTask(tk);
                  }}
                  style={{ padding: '7px 10px', borderRadius: 8, border: '1px solid #F1F5F9', background: '#F8FAFC', textAlign: 'left', fontSize: '0.8rem', fontWeight: 600, color: '#1E40FF', cursor: 'pointer' }}
                >
                  {tk.title} ({tk.progress_pct}%)
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </CustomModal>
  );
};
