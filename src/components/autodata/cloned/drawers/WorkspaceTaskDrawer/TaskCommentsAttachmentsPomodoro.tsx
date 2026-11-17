import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import {
  Clock,
  ExternalLink,
  MessageSquare,
  Paperclip,
  Pause,
  Play,
  Plus,
  RotateCcw,
  Trash2,
} from 'lucide-react';
import { Avatar } from '../../components/ui/Avatar';
import type {
  CrmStaffMember,
  PomodoroSessionRecord,
  TaskAttachmentItem,
  TaskCommentItem,
} from '../crmTypes';
import { crmMutate, formatDateTimeVi, type CrmAuthCreds } from '../crm360Api';
import { FormattedMentionText, MentionNoteComposer } from '../MentionNoteComposer';

export interface TaskCommentsAttachmentsPomodoroProps {
  taskId: string;
  loggedMinutes: number;
  comments: TaskCommentItem[];
  attachments: TaskAttachmentItem[];
  pomodoroSessions: PomodoroSessionRecord[];
  staff: CrmStaffMember[];
  canEdit: boolean;
  creds: CrmAuthCreds;
  onReload: () => Promise<void> | void;
}

export const TaskCommentsAttachmentsPomodoro: React.FC<
  TaskCommentsAttachmentsPomodoroProps
> = ({
  taskId,
  loggedMinutes,
  comments,
  attachments,
  pomodoroSessions,
  staff,
  canEdit,
  creds,
  onReload,
}) => {
  const [secondsLeft, setSecondsLeft] = useState(25 * 60);
  const [running, setRunning] = useState(false);
  const [pomoNote, setPomoNote] = useState('');

  const [fileName, setFileName] = useState('');
  const [fileUrl, setFileUrl] = useState('');

  useEffect(() => {
    if (!running) return;
    const timer = window.setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          setRunning(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, [running]);

  const handleLogPomodoro = async (minutes: number) => {
    try {
      await crmMutate('/workspace/pomodoro', 'POST', creds, {
        task_id: taskId,
        duration_minutes: minutes,
        mode: 'focus',
        note: pomoNote.trim() || 'Phiên Tập trung sâu (Focus Pomodoro)',
      });
      toast.success(`Đã ghi nhận +${minutes} phút Focus Pomodoro!`);
      setPomoNote('');
      setSecondsLeft(25 * 60);
      setRunning(false);
      await onReload();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Không thể lưu phiên Pomodoro');
    }
  };

  const handleAddComment = async (payload: { content: string; mentions: string[] }) => {
    try {
      await crmMutate(`/workspace/tasks/${taskId}/comments`, 'POST', creds, {
        content: payload.content,
        mentions: payload.mentions,
      });
      toast.success('Đã gửi bình luận công việc');
      await onReload();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Không thể gửi bình luận');
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    try {
      await crmMutate(`/workspace/tasks/${taskId}/comments/${commentId}`, 'DELETE', creds);
      await onReload();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Không thể xóa bình luận');
    }
  };

  const handleAddAttachment = async () => {
    if (!fileName.trim() || !fileUrl.trim()) {
      toast.error('Vui lòng nhập tên tệp và đường dẫn đính kèm');
      return;
    }
    try {
      await crmMutate(`/workspace/tasks/${taskId}/attachments`, 'POST', creds, {
        file_name: fileName.trim(),
        file_url: fileUrl.trim(),
      });
      toast.success('Đã đính kèm tài liệu vào công việc');
      setFileName('');
      setFileUrl('');
      await onReload();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Không thể đính kèm tệp');
    }
  };

  const handleDeleteAttachment = async (attId: string) => {
    try {
      await crmMutate(`/workspace/tasks/${taskId}/attachments/${attId}`, 'DELETE', creds);
      await onReload();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Không thể gỡ tệp đính kèm');
    }
  };

  const mm = String(Math.floor(secondsLeft / 60)).padStart(2, '0');
  const ss = String(secondsLeft % 60).padStart(2, '0');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
      {/* Focus Pomodoro Session Logger */}
      <div
        style={{
          background: 'linear-gradient(135deg, #FFFFFF 0%, #EFF6FF 100%)',
          border: '1px solid #DBEAFE',
          borderRadius: 16,
          padding: '1.2rem',
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Clock size={18} color="#1E40FF" />
            <div>
              <strong style={{ fontSize: '0.9rem', color: '#0F172A' }}>
                Đồng hồ Tập trung Focus Pomodoro (Đã tích lũy: {loggedMinutes} phút)
              </strong>
              <div style={{ fontSize: '0.75rem', color: '#64748B' }}>
                Tự động cộng thời gian làm việc thực tế vào báo cáo năng suất cá nhân
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span
              style={{
                fontFamily: 'monospace',
                fontSize: '1.35rem',
                fontWeight: 800,
                color: '#1E40FF',
                padding: '4px 12px',
                borderRadius: 10,
                background: '#FFFFFF',
                border: '1px solid #DBEAFE',
              }}
            >
              {mm}:{ss}
            </span>
            <button
              type="button"
              onClick={() => setRunning((r) => !r)}
              style={{ height: 40, padding: '0 12px', borderRadius: 10, border: 'none', background: '#1E40FF', color: '#FFFFFF', fontWeight: 700, fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: 5, cursor: 'pointer' }}
            >
              {running ? <Pause size={14} /> : <Play size={14} />} {running ? 'Tạm dừng' : 'Bắt đầu'}
            </button>
            <button
              type="button"
              onClick={() => {
                setRunning(false);
                setSecondsLeft(25 * 60);
              }}
              style={{ height: 40, width: 40, borderRadius: 10, border: '1px solid #E2E8F0', background: '#FFFFFF', color: '#475569', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
            >
              <RotateCcw size={14} />
            </button>
          </div>
        </div>

        {canEdit && (
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <input
              placeholder="Ghi chú kết quả phiên tập trung..."
              value={pomoNote}
              onChange={(e) => setPomoNote(e.target.value)}
              style={{ flex: 1, minWidth: 200, height: 42, borderRadius: 10, border: '1px solid #E2E8F0', padding: '0 12px', fontSize: '0.83rem', background: '#FFFFFF' }}
            />
            <button
              type="button"
              onClick={() => void handleLogPomodoro(25)}
              style={{ height: 42, padding: '0 14px', borderRadius: 10, border: '1px solid #1E40FF', background: '#FFFFFF', color: '#1E40FF', fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer' }}
            >
              + Ghi nhận 25m Focus
            </button>
          </div>
        )}

        {pomodoroSessions.length > 0 && (
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {pomodoroSessions.slice(0, 4).map((ps) => (
              <span key={ps.id} style={{ fontSize: '0.73rem', padding: '3px 9px', borderRadius: 999, background: '#FFFFFF', border: '1px solid #E2E8F0', color: '#334155' }}>
                +{ps.duration_minutes}m ({formatDateTimeVi(ps.completed_at)})
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Attachments (`tenant_task_attachments`) */}
      <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 16, padding: '1.2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
          <Paperclip size={16} color="#1E40FF" />
          <strong style={{ fontSize: '0.9rem', color: '#0F172A' }}>
            Tài liệu Đính kèm (`tenant_task_attachments`) ({attachments.length})
          </strong>
        </div>

        {canEdit && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.4fr auto', gap: 8, marginBottom: 10 }}>
            <input
              placeholder="Tên tài liệu..."
              value={fileName}
              onChange={(e) => setFileName(e.target.value)}
              style={{ height: 42, borderRadius: 10, border: '1px solid #E2E8F0', padding: '0 12px', fontSize: '0.83rem' }}
            />
            <input
              placeholder="URL tệp đính kèm..."
              value={fileUrl}
              onChange={(e) => setFileUrl(e.target.value)}
              style={{ height: 42, borderRadius: 10, border: '1px solid #E2E8F0', padding: '0 12px', fontSize: '0.83rem' }}
            />
            <button
              type="button"
              onClick={() => void handleAddAttachment()}
              style={{ height: 42, padding: '0 14px', borderRadius: 10, border: 'none', background: '#1E40FF', color: '#FFFFFF', fontWeight: 700, fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: 4, cursor: 'pointer' }}
            >
              <Plus size={14} /> Đính kèm
            </button>
          </div>
        )}

        {attachments.map((att) => (
          <div key={att.id} style={{ padding: '8px 10px', borderRadius: 10, background: '#F8FAFC', border: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <a href={att.file_url} target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.83rem', fontWeight: 700, color: '#1E40FF', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 5 }}>
              {att.file_name} <ExternalLink size={12} />
            </a>
            {canEdit && (
              <button type="button" onClick={() => void handleDeleteAttachment(att.id)} style={{ border: 'none', background: 'transparent', color: '#94A3B8', cursor: 'pointer' }}>
                <Trash2 size={14} />
              </button>
            )}
          </div>
        ))}
      </div>

      {/* @mention Comments (`tenant_task_comments`) */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <MessageSquare size={16} color="#1E40FF" />
          <strong style={{ fontSize: '0.9rem', color: '#0F172A' }}>
            Thảo luận & @Mention ({comments.length})
          </strong>
        </div>

        {canEdit && (
          <MentionNoteComposer
            staff={staff}
            submitLabel="Gửi bình luận"
            placeholder="Thảo luận tiến độ, @mention đồng nghiệp..."
            onSubmit={handleAddComment}
          />
        )}

        {comments.map((cm) => (
          <div key={cm.id} style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 12, padding: '0.85rem 1rem', display: 'flex', gap: 10 }}>
            <Avatar name={cm.author_name} size="sm" />
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <strong style={{ fontSize: '0.83rem', color: '#0F172A' }}>{cm.author_name}</strong>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: '0.73rem', color: '#94A3B8' }}>{formatDateTimeVi(cm.created_at)}</span>
                  {canEdit && (
                    <button type="button" onClick={() => void handleDeleteComment(cm.id)} style={{ border: 'none', background: 'transparent', color: '#94A3B8', cursor: 'pointer' }}>
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>
              </div>
              <div style={{ marginTop: 4, fontSize: '0.84rem', color: '#334155' }}>
                <FormattedMentionText text={cm.content} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
