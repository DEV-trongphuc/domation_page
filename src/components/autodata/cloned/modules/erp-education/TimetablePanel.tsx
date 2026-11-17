import React, { useState } from 'react';
import { AlertTriangle, CheckCircle2, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { Card, EmptyState } from '../../components/ui/AutoDataLoadingModal';
import { apiRequest, getErrorMessage } from '../../../autodataApi';
import { useAuth } from '../../contexts/AuthContext';
import type {
  ClassRow,
  EduInstructorItem,
  ScheduleRow,
} from './educationTypes';
import { DAY_LABELS } from './educationTypes';

export interface TimetablePanelProps {
  classes: ReadonlyArray<ClassRow>;
  instructors: ReadonlyArray<EduInstructorItem>;
  schedules: ReadonlyArray<ScheduleRow>;
  canCreate: boolean;
  canDelete: boolean;
  onReload: () => Promise<void>;
}

export const TimetablePanel: React.FC<TimetablePanelProps> = ({
  classes,
  instructors,
  schedules,
  canCreate,
  canDelete,
  onReload,
}) => {
  const { token, tenantSlug } = useAuth();
  const [classIdOverride, setClassIdOverride] = useState<string>('');
  const schClassId = classIdOverride || classes[0]?.id || '';

  const [schDay, setSchDay] = useState<string>('1');
  const [schStart, setSchStart] = useState<string>('18:30');
  const [schEnd, setSchEnd] = useState<string>('20:30');
  const [schRoom, setSchRoom] = useState<string>('Phòng 201');
  const [schInstructorId, setSchInstructorId] = useState<string>('');
  const [schTopic, setSchTopic] = useState<string>('');
  const [conflictPreview, setConflictPreview] = useState<{
    has_conflict: boolean;
    messages: string[];
  } | null>(null);

  const handleCheckConflict = async () => {
    try {
      const res = await apiRequest<{
        has_conflict: boolean;
        conflicts: Array<{ detail: string }>;
      }>('/education/schedules/check-conflict', {
        method: 'POST',
        token,
        tenantSlug,
        body: {
          day_of_week: Number(schDay),
          start_time: schStart,
          end_time: schEnd,
          room_name: schRoom.trim(),
          instructor_user_id: schInstructorId || null,
        },
      });
      setConflictPreview({
        has_conflict: res.has_conflict,
        messages: res.conflicts.map((c) => c.detail),
      });
    } catch (err) {
      toast.error(getErrorMessage(err, 'Không thể kiểm tra lịch trùng'));
    }
  };

  const handleCreateSchedule = async () => {
    if (!schClassId || !schRoom.trim()) {
      toast.error('Vui lòng chọn Lớp học và Phòng học');
      return;
    }
    try {
      await apiRequest('/education/schedules', {
        method: 'POST',
        token,
        tenantSlug,
        body: {
          class_id: schClassId,
          day_of_week: Number(schDay),
          start_time: schStart,
          end_time: schEnd,
          room_name: schRoom.trim(),
          instructor_user_id: schInstructorId || null,
          topic: schTopic.trim() || undefined,
        },
      });
      toast.success('Đã xếp ca học vào Thời khóa biểu tuần!');
      setConflictPreview(null);
      setSchTopic('');
      await onReload();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Phát hiện trùng phòng học hoặc trùng lịch giảng viên!'));
    }
  };

  const handleDeleteSchedule = async (id: string) => {
    try {
      await apiRequest(`/education/schedules/${id}`, {
        method: 'DELETE',
        token,
        tenantSlug,
      });
      toast.success('Đã xóa ca học');
      await onReload();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Không thể xóa ca học'));
    }
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1rem' }}>
      <Card
        title="Xếp Lịch Giảng Dạy & Chống Trùng Phòng / Giảng Viên"
        subtitle="Tự động kiểm tra và chặn trùng khung giờ phòng học hoặc lịch dạy của cùng 1 giảng viên"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <select
            value={schClassId}
            onChange={(e) => setClassIdOverride(e.target.value)}
            style={{ height: 42, borderRadius: 12, border: '1px solid #E2E8F0', padding: '0 12px', background: '#FFFFFF' }}
          >
            <option value="">-- Chọn Lớp học --</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>{c.code} — {c.name}</option>
            ))}
          </select>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
            <select
              value={schDay}
              onChange={(e) => setSchDay(e.target.value)}
              style={{ height: 42, borderRadius: 12, border: '1px solid #E2E8F0', padding: '0 10px', background: '#FFFFFF' }}
            >
              {DAY_LABELS.map((lbl, idx) => (
                <option key={lbl} value={idx}>{lbl}</option>
              ))}
            </select>
            <input
              type="time"
              value={schStart}
              onChange={(e) => setSchStart(e.target.value)}
              style={{ height: 42, borderRadius: 12, border: '1px solid #E2E8F0', padding: '0 10px' }}
            />
            <input
              type="time"
              value={schEnd}
              onChange={(e) => setSchEnd(e.target.value)}
              style={{ height: 42, borderRadius: 12, border: '1px solid #E2E8F0', padding: '0 10px' }}
            />
          </div>

          <input
            value={schRoom}
            onChange={(e) => setSchRoom(e.target.value)}
            placeholder="Tên Phòng học (VD: Phòng Lab 301)..."
            style={{ height: 42, borderRadius: 12, border: '1px solid #E2E8F0', padding: '0 12px' }}
          />

          <select
            value={schInstructorId}
            onChange={(e) => setSchInstructorId(e.target.value)}
            style={{ height: 42, borderRadius: 12, border: '1px solid #E2E8F0', padding: '0 12px', background: '#FFFFFF' }}
          >
            <option value="">-- Giảng viên phụ trách ca (Tùy chọn) --</option>
            {instructors.map((inst) => (
              <option key={inst.id} value={inst.id}>{inst.full_name}</option>
            ))}
          </select>

          <input
            value={schTopic}
            onChange={(e) => setSchTopic(e.target.value)}
            placeholder="Chủ đề / Chuyên đề buổi học (Tùy chọn)..."
            style={{ height: 42, borderRadius: 12, border: '1px solid #E2E8F0', padding: '0 12px' }}
          />

          {conflictPreview && (
            <div
              style={{
                padding: '0.75rem 1rem',
                borderRadius: 12,
                background: conflictPreview.has_conflict ? '#FEF2F2' : '#F0FDF4',
                border: `1px solid ${conflictPreview.has_conflict ? '#FECACA' : '#BBF7D0'}`,
                fontSize: '0.82rem',
                color: conflictPreview.has_conflict ? '#DC2626' : '#15803D',
              }}
            >
              {conflictPreview.has_conflict ? (
                <>
                  <AlertTriangle size={14} style={{ display: 'inline', marginRight: 5 }} />
                  <strong>Phát hiện xung đột lịch:</strong> {conflictPreview.messages.join(' | ')}
                </>
              ) : (
                <>
                  <CheckCircle2 size={14} style={{ display: 'inline', marginRight: 5 }} />
                  Khung giờ & Phòng học hoàn toàn trống, sẵn sàng xếp lịch!
                </>
              )}
            </div>
          )}

          <div style={{ display: 'flex', gap: 8 }}>
            <button
              type="button"
              onClick={handleCheckConflict}
              className="btn secondary"
              style={{ height: 42, color: '#1E40FF' }}
            >
              Kiểm tra trùng lịch
            </button>
            {canCreate && (
              <button
                type="button"
                onClick={handleCreateSchedule}
                className="btn-inkica-primary"
                style={{ flex: 1, height: 42, borderRadius: 12, border: 'none', color: '#FFFFFF', fontWeight: 700, cursor: 'pointer' }}
              >
                + Lưu vào Thời khóa biểu
              </button>
            )}
          </div>
        </div>
      </Card>

      <Card title="Thời Khóa Biểu Tuần Đang Áp Dụng" subtitle={`${schedules.length} ca học đã xếp`}>
        {schedules.length === 0 ? (
          <EmptyState title="Chưa có lịch học trong tuần" />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {schedules.map((sc) => (
              <div
                key={sc.id}
                style={{
                  padding: '0.8rem 1rem',
                  borderRadius: 14,
                  border: '1px solid #E2E8F0',
                  background: '#FFFFFF',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.86rem', color: '#0F172A' }}>
                    {DAY_LABELS[sc.day_of_week]} ({sc.start_time} - {sc.end_time}) • {sc.room_name}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#64748B' }}>
                    {sc.class_code} — {sc.class_name} {sc.instructor_name ? `• GV: ${sc.instructor_name}` : ''}
                    {sc.topic ? ` • ${sc.topic}` : ''}
                  </div>
                </div>
                {canDelete && (
                  <button
                    type="button"
                    onClick={() => void handleDeleteSchedule(sc.id)}
                    style={{ border: 'none', background: 'transparent', color: '#DC2626', cursor: 'pointer' }}
                  >
                    <Trash2 size={15} />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
};
