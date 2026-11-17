import React, { useState } from 'react';
import { Calendar, CheckSquare, Flag, Loader2, User } from 'lucide-react';
import toast from 'react-hot-toast';
import { CustomModal } from '../components/ui/CustomModal';
import { apiRequest, getErrorMessage } from '../../autodataApi';
import type { WorkChatMessageDto, WorkChatStaffDto } from './workchatTypes';

export interface CreateTaskFromChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetMessage: WorkChatMessageDto | null;
  staff: WorkChatStaffDto[];
  defaultAssigneeId?: string;
  token?: string | null;
  tenantSlug?: string | null;
  onTaskCreated?: (taskPayload: Record<string, unknown>) => void;
}

function deriveDefaultDueDate(createdAt?: string): string {
  const base = createdAt ? new Date(createdAt) : new Date('2026-11-20T09:00:00Z');
  const safeBase = Number.isNaN(base.getTime()) ? new Date('2026-11-20T09:00:00Z') : base;
  const due = new Date(safeBase.getTime() + 3 * 24 * 60 * 60 * 1000);
  return due.toISOString().slice(0, 10);
}

interface TaskFormBodyProps {
  message: WorkChatMessageDto;
  staff: WorkChatStaffDto[];
  defaultAssigneeId?: string;
  token?: string | null;
  tenantSlug?: string | null;
  onClose: () => void;
  onTaskCreated?: (taskPayload: Record<string, unknown>) => void;
}

const TaskFormBody: React.FC<TaskFormBodyProps> = ({
  message,
  staff,
  defaultAssigneeId,
  token,
  tenantSlug,
  onClose,
  onTaskCreated,
}) => {
  const [title, setTitle] = useState<string>(() => {
    const firstLine = (message.content || '').split('\n')[0].trim();
    return firstLine ? firstLine.slice(0, 120) : 'Công việc chuyển từ tin nhắn WorkChat';
  });
  const [description, setDescription] = useState<string>(
    () => `[Chuyển từ tin nhắn của ${message.sender_name}]:\n${message.content || ''}`
  );
  const [priority, setPriority] = useState<'low' | 'medium' | 'high' | 'urgent'>('medium');
  const [dueDate, setDueDate] = useState<string>(() => deriveDefaultDueDate(message.created_at));
  const [assigneeUserId, setAssigneeUserId] = useState<string>(
    () => defaultAssigneeId || staff[0]?.id || ''
  );
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error('Vui lòng nhập tiêu đề công việc');
      return;
    }

    setSubmitting(true);
    try {
      const created = await apiRequest<Record<string, unknown>>(
        `/workchat/messages/${message.id}/create-task`,
        {
          method: 'POST',
          token,
          tenantSlug,
          body: {
            title: title.trim(),
            description: description.trim(),
            priority,
            due_date: dueDate || null,
            assignee_user_id: assigneeUserId || null,
          },
        }
      );

      toast.success('Đã khởi tạo Công việc ERP từ tin nhắn WorkChat!');
      if (onTaskCreated) {
        onTaskCreated(created);
      }
      onClose();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Không thể tạo công việc từ tin nhắn'));
    } finally {
      setSubmitting(false);
    }
  };

  const priorities: ReadonlyArray<{
    key: 'low' | 'medium' | 'high' | 'urgent';
    label: string;
    color: string;
  }> = [
    { key: 'low', label: 'Thấp', color: '#64748B' },
    { key: 'medium', label: 'Trung bình', color: '#1E40FF' },
    { key: 'high', label: 'Ưu tiên cao', color: '#D97706' },
    { key: 'urgent', label: 'Khẩn cấp', color: '#DC2626' },
  ];

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* Source Message Banner */}
      <div
        style={{
          padding: '10px 12px',
          borderRadius: 12,
          background: '#F8FAFF',
          borderLeft: '3.5px solid #1E40FF',
          border: '1px solid #DBEAFE',
        }}
      >
        <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#1E40FF', marginBottom: 3 }}>
          Nguồn tin nhắn • {message.sender_name}
        </div>
        <div style={{ fontSize: '0.78rem', color: '#334155', lineHeight: 1.4 }}>
          {message.content.slice(0, 220)}
          {message.content.length > 220 ? '...' : ''}
        </div>
      </div>

      {/* Title */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
        <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#0F172A' }}>
          Tiêu đề công việc *
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Nhập tên công việc cần giao..."
          style={{
            minHeight: 42,
            padding: '0 12px',
            borderRadius: 11,
            border: '1px solid #CBD5E1',
            background: '#FFFFFF',
            fontSize: '0.84rem',
            color: '#0F172A',
          }}
        />
      </div>

      {/* Assignee & Due Date */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
          <label
            style={{
              fontSize: '0.78rem',
              fontWeight: 700,
              color: '#0F172A',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
            }}
          >
            <User size={13} color="#1E40FF" />
            <span>Nhân sự phụ trách</span>
          </label>
          <select
            value={assigneeUserId}
            onChange={(e) => setAssigneeUserId(e.target.value)}
            style={{
              minHeight: 42,
              padding: '0 11px',
              borderRadius: 11,
              border: '1px solid #CBD5E1',
              background: '#FFFFFF',
              fontSize: '0.83rem',
              color: '#0F172A',
            }}
          >
            <option value="">-- Chưa phân công --</option>
            {staff.map((s) => (
              <option key={s.id} value={s.id}>
                {s.full_name} ({s.role})
              </option>
            ))}
          </select>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
          <label
            style={{
              fontSize: '0.78rem',
              fontWeight: 700,
              color: '#0F172A',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
            }}
          >
            <Calendar size={13} color="#1E40FF" />
            <span>Hạn hoàn thành (Deadline)</span>
          </label>
          <input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            style={{
              minHeight: 42,
              padding: '0 11px',
              borderRadius: 11,
              border: '1px solid #CBD5E1',
              background: '#FFFFFF',
              fontSize: '0.83rem',
              color: '#0F172A',
            }}
          />
        </div>
      </div>

      {/* Priority Pills */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <label
          style={{
            fontSize: '0.78rem',
            fontWeight: 700,
            color: '#0F172A',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 5,
          }}
        >
          <Flag size={13} color="#1E40FF" />
          <span>Mức độ ưu tiên</span>
        </label>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {priorities.map((p) => {
            const active = priority === p.key;
            return (
              <button
                key={p.key}
                type="button"
                onClick={() => setPriority(p.key)}
                style={{
                  minHeight: 36,
                  padding: '0 12px',
                  borderRadius: 10,
                  border: active ? `1.5px solid ${p.color}` : '1px solid #E2E8F0',
                  background: active ? '#F8FAFF' : '#FFFFFF',
                  color: active ? p.color : '#475569',
                  fontSize: '0.78rem',
                  fontWeight: active ? 800 : 600,
                  cursor: 'pointer',
                }}
              >
                {p.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Description */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
        <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#0F172A' }}>
          Mô tả chi tiết
        </label>
        <textarea
          rows={3}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          style={{
            padding: '10px 12px',
            borderRadius: 11,
            border: '1px solid #CBD5E1',
            background: '#FFFFFF',
            fontSize: '0.82rem',
            color: '#0F172A',
            resize: 'vertical',
          }}
        />
      </div>

      {/* Footer */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 4 }}>
        <button
          type="button"
          onClick={onClose}
          style={{
            minHeight: 40,
            padding: '0 14px',
            borderRadius: 11,
            border: '1px solid #CBD5E1',
            background: '#FFFFFF',
            color: '#475569',
            fontSize: '0.8rem',
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          Hủy
        </button>
        <button
          type="submit"
          disabled={submitting}
          style={{
            minHeight: 40,
            padding: '0 18px',
            borderRadius: 11,
            border: 'none',
            background: 'linear-gradient(135deg, #1E40FF 0%, #0284C7 100%)',
            color: '#FFFFFF',
            fontSize: '0.82rem',
            fontWeight: 700,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            cursor: submitting ? 'wait' : 'pointer',
            boxShadow: '0 4px 12px rgba(30, 64, 255, 0.24)',
          }}
        >
          {submitting ? (
            <>
              <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />
              <span>Đang tạo Task...</span>
            </>
          ) : (
            <>
              <CheckSquare size={14} />
              <span>Tạo Công Việc ERP</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
};

export const CreateTaskFromChatModal: React.FC<CreateTaskFromChatModalProps> = ({
  isOpen,
  onClose,
  targetMessage,
  staff,
  defaultAssigneeId,
  token,
  tenantSlug,
  onTaskCreated,
}) => {
  return (
    <CustomModal
      isOpen={isOpen && Boolean(targetMessage)}
      onClose={onClose}
      title="Chuyển Tin Nhắn Thành Công Việc ERP (Chat-to-Task)"
      width={560}
    >
      {isOpen && targetMessage && (
        <TaskFormBody
          key={targetMessage.id}
          message={targetMessage}
          staff={staff}
          defaultAssigneeId={defaultAssigneeId}
          token={token}
          tenantSlug={tenantSlug}
          onClose={onClose}
          onTaskCreated={onTaskCreated}
        />
      )}
    </CustomModal>
  );
};

export default CreateTaskFromChatModal;
