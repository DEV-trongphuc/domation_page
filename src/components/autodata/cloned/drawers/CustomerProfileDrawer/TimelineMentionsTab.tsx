import React, { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Calendar, Check, Edit3, MessageSquare, Phone, RefreshCw, X } from 'lucide-react';
import { TimelineSkeleton } from '../../components/ui/Skeleton';
import { Avatar } from '../../components/ui/Avatar';
import type { CrmStaffMember, CrmTimelineItem } from '../crmTypes';
import { crmGet, crmMutate, formatDateTimeVi, type CrmAuthCreds } from '../crm360Api';
import {
  EditHistoryBadge,
  FormattedMentionText,
  MentionNoteComposer,
} from '../MentionNoteComposer';

export interface TimelineMentionsTabProps {
  contactId: string;
  canEdit: boolean;
  staff: CrmStaffMember[];
  creds: CrmAuthCreds;
}

const CATEGORIES = [
  { key: '', label: 'Tất cả sự kiện' },
  { key: 'note', label: 'Ghi chú @mention' },
  { key: 'communication', label: 'Cuộc gọi / Zalo / Email' },
  { key: 'pipeline', label: 'Chuyển bước phễu' },
  { key: 'system', label: 'Hệ thống' },
];

export const TimelineMentionsTab: React.FC<TimelineMentionsTabProps> = ({
  contactId,
  canEdit,
  staff,
  creds,
}) => {
  const [items, setItems] = useState<CrmTimelineItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('');
  const [noteType, setNoteType] = useState<'note' | 'call' | 'zalo_connect' | 'meeting'>('note');
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');

  const loadTimeline = useCallback(async () => {
    setLoading(true);
    try {
      const res = await crmGet<{ items: CrmTimelineItem[] }>(
        `/contacts/${contactId}/timeline`,
        creds,
        { category: category || undefined }
      );
      setItems(res.items || []);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Không thể tải dòng thời gian 360°');
    } finally {
      setLoading(false);
    }
  }, [contactId, category, creds]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadTimeline();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [loadTimeline]);

  const handleAddNote = async (payload: { content: string; mentions: string[] }) => {
    setSubmitting(true);
    try {
      const typeTitles: Record<string, string> = {
        note: 'Ghi chú tư vấn 360°',
        call: 'Nhật ký cuộc gọi khách hàng',
        zalo_connect: 'Tương tác qua Zalo',
        meeting: 'Biên bản gặp gỡ / Demo',
      };
      await crmMutate(`/contacts/${contactId}/timeline`, 'POST', creds, {
        activity_type: noteType,
        subject: typeTitles[noteType] || 'Ghi chú tư vấn',
        content: payload.content,
        mentions: payload.mentions,
      });
      toast.success('Đã ghi nhận vào Dòng thời gian 360°');
      await loadTimeline();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Không thể lưu ghi chú');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveEdit = async (eventId: string) => {
    if (!editingText.trim()) return;
    try {
      await crmMutate(`/contacts/${contactId}/timeline/${eventId}`, 'PUT', creds, {
        content: editingText.trim(),
      });
      toast.success('Đã cập nhật ghi chú (lưu lịch sử chỉnh sửa)');
      setEditingId(null);
      setEditingText('');
      await loadTimeline();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Không thể cập nhật ghi chú');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
      {canEdit && (
        <MentionNoteComposer
          staff={staff}
          submitting={submitting}
          onSubmit={handleAddNote}
          extraControls={
            <div style={{ display: 'inline-flex', gap: 6, flexWrap: 'wrap' }}>
              {(
                [
                  { id: 'note', label: 'Ghi chú', icon: <MessageSquare size={13} /> },
                  { id: 'call', label: 'Cuộc gọi', icon: <Phone size={13} /> },
                  { id: 'meeting', label: 'Gặp gỡ', icon: <Calendar size={13} /> },
                ] as const
              ).map((tp) => (
                <button
                  key={tp.id}
                  type="button"
                  onClick={() => setNoteType(tp.id)}
                  style={{
                    height: 36,
                    padding: '0 10px',
                    borderRadius: 8,
                    border: noteType === tp.id ? '1px solid #1E40FF' : '1px solid #E2E8F0',
                    background: noteType === tp.id ? '#EFF6FF' : '#FFFFFF',
                    color: noteType === tp.id ? '#1E40FF' : '#475569',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 5,
                    cursor: 'pointer',
                  }}
                >
                  {tp.icon} {tp.label}
                </button>
              ))}
            </div>
          }
        />
      )}

      {/* Filter Bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 10,
          flexWrap: 'wrap',
        }}
      >
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {CATEGORIES.map((c) => (
            <button
              key={c.key}
              type="button"
              onClick={() => setCategory(c.key)}
              style={{
                height: 36,
                padding: '0 12px',
                borderRadius: 999,
                border: category === c.key ? '1px solid #1E40FF' : '1px solid #E2E8F0',
                background: category === c.key ? '#1E40FF' : '#FFFFFF',
                color: category === c.key ? '#FFFFFF' : '#475569',
                fontSize: '0.78rem',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              {c.label}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={() => void loadTimeline()}
          style={{
            height: 36,
            padding: '0 12px',
            borderRadius: 8,
            border: '1px solid #E2E8F0',
            background: '#FFFFFF',
            color: '#475569',
            fontSize: '0.78rem',
            fontWeight: 600,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            cursor: 'pointer',
          }}
        >
          <RefreshCw size={13} /> Làm mới
        </button>
      </div>

      {loading ? (
        <TimelineSkeleton count={4} />
      ) : items.length === 0 ? (
        <div
          style={{
            background: '#FFFFFF',
            border: '1px solid #E2E8F0',
            borderRadius: 16,
            padding: '2.5rem',
            textAlign: 'center',
            color: '#64748B',
            fontSize: '0.86rem',
          }}
        >
          Chưa có sự kiện nào trong dòng thời gian 360° của khách hàng này.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {items.map((item) => {
            const isEditing = editingId === item.id;
            return (
              <div
                key={`${item.source_table}-${item.id}`}
                style={{
                  background: '#FFFFFF',
                  border: '1px solid #E2E8F0',
                  borderRadius: 14,
                  padding: '1rem 1.15rem',
                  display: 'flex',
                  gap: 12,
                  alignItems: 'flex-start',
                }}
              >
                <Avatar name={item.actor_name} size="md" />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 8,
                      flexWrap: 'wrap',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      <strong style={{ fontSize: '0.85rem', color: '#0F172A' }}>
                        {item.title}
                      </strong>
                      <span
                        style={{
                          fontSize: '0.7rem',
                          fontWeight: 700,
                          padding: '2px 8px',
                          borderRadius: 999,
                          background: '#EFF6FF',
                          color: '#1E40FF',
                        }}
                      >
                        {item.event_type}
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: '0.74rem', color: '#94A3B8' }}>
                        {item.actor_name} • {formatDateTimeVi(item.created_at)}
                      </span>
                      {canEdit && !isEditing && (
                        <button
                          type="button"
                          onClick={() => {
                            setEditingId(item.id);
                            setEditingText(item.content || '');
                          }}
                          style={{
                            border: 'none',
                            background: 'transparent',
                            color: '#64748B',
                            cursor: 'pointer',
                            padding: 4,
                          }}
                          title="Chỉnh sửa ghi chú"
                        >
                          <Edit3 size={14} />
                        </button>
                      )}
                    </div>
                  </div>

                  {isEditing ? (
                    <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 8 }}>
                      <textarea
                        rows={3}
                        value={editingText}
                        onChange={(e) => setEditingText(e.target.value)}
                        style={{
                          width: '100%',
                          borderRadius: 10,
                          border: '1px solid #1E40FF',
                          padding: '0.6rem 0.8rem',
                          fontSize: '0.84rem',
                        }}
                      />
                      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                        <button
                          type="button"
                          onClick={() => setEditingId(null)}
                          style={{
                            height: 36,
                            padding: '0 12px',
                            borderRadius: 8,
                            border: '1px solid #E2E8F0',
                            background: '#FFFFFF',
                            color: '#475569',
                            fontSize: '0.78rem',
                            fontWeight: 600,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 4,
                            cursor: 'pointer',
                          }}
                        >
                          <X size={13} /> Hủy
                        </button>
                        <button
                          type="button"
                          onClick={() => void handleSaveEdit(item.id)}
                          style={{
                            height: 36,
                            padding: '0 12px',
                            borderRadius: 8,
                            border: 'none',
                            background: '#1E40FF',
                            color: '#FFFFFF',
                            fontSize: '0.78rem',
                            fontWeight: 700,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 4,
                            cursor: 'pointer',
                          }}
                        >
                          <Check size={13} /> Lưu chỉnh sửa
                        </button>
                      </div>
                    </div>
                  ) : (
                    item.content && (
                      <div style={{ marginTop: 6, fontSize: '0.84rem', color: '#334155' }}>
                        <FormattedMentionText text={item.content} />
                      </div>
                    )
                  )}

                  {item.edit_history && item.edit_history.length > 0 && (
                    <div style={{ marginTop: 6 }}>
                      <EditHistoryBadge history={item.edit_history} />
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default TimelineMentionsTab;
