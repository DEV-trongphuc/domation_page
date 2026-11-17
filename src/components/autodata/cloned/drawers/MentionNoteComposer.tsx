import React, { useMemo, useState } from 'react';
import { AtSign, Clock, Send } from 'lucide-react';
import { Avatar } from '../components/ui/Avatar';
import type { CrmEditHistoryEntry, CrmStaffMember } from './crmTypes';
import { formatDateTimeVi } from './crm360Api';

export const EditHistoryBadge: React.FC<{ history?: CrmEditHistoryEntry[] }> = ({ history }) => {
  const [open, setOpen] = useState(false);
  if (!history || history.length === 0) return null;
  const latest = history[0];

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        style={{
          fontSize: '0.72rem',
          color: '#64748B',
          background: 'transparent',
          border: 'none',
          padding: 0,
          cursor: 'pointer',
          textDecoration: 'underline dotted',
          display: 'inline-flex',
          alignItems: 'center',
          gap: 4,
        }}
      >
        <Clock size={11} /> Đã chỉnh sửa ({history.length} lần • gần nhất bởi {latest.edited_by_name})
      </button>
      {open && (
        <div
          style={{
            position: 'absolute',
            bottom: '100%',
            left: 0,
            marginBottom: 6,
            width: 290,
            background: '#FFFFFF',
            border: '1px solid #E2E8F0',
            borderRadius: 12,
            padding: '10px 12px',
            boxShadow: '0 10px 25px rgba(15, 23, 42, 0.12)',
            zIndex: 50,
          }}
        >
          <div
            style={{
              fontSize: '0.75rem',
              fontWeight: 700,
              color: '#0F172A',
              paddingBottom: 6,
              marginBottom: 6,
              borderBottom: '1px solid #F1F5F9',
            }}
          >
            Lịch sử chỉnh sửa (tối đa 3 phiên bản)
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {history.map((item, idx) => (
              <div key={idx} style={{ fontSize: '0.72rem', color: '#334155' }}>
                <div style={{ fontWeight: 700 }}>
                  {item.edited_by_name}{' '}
                  <span style={{ fontWeight: 400, color: '#94A3B8' }}>
                    • {formatDateTimeVi(item.edited_at)}
                  </span>
                </div>
                <div
                  style={{
                    color: '#64748B',
                    fontStyle: 'italic',
                    marginTop: 2,
                    wordBreak: 'break-word',
                  }}
                >
                  Nội dung cũ: {item.old_body || item.old_subject || '—'}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export const FormattedMentionText: React.FC<{ text?: string | null }> = ({ text }) => {
  if (!text) return null;
  const parts = text.split(/(https?:\/\/[^\s]+|@[\p{L}\p{N}_.-]+)/gu);
  return (
    <span style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', lineHeight: 1.55 }}>
      {parts.map((part, idx) => {
        if (part.startsWith('http://') || part.startsWith('https://')) {
          return (
            <a
              key={idx}
              href={part}
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: '#1E40FF', textDecoration: 'underline' }}
            >
              {part}
            </a>
          );
        }
        if (part.startsWith('@') && part.length > 1) {
          return (
            <span
              key={idx}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                padding: '1px 8px',
                margin: '0 2px',
                borderRadius: 999,
                background: '#EFF6FF',
                border: '1px solid #DBEAFE',
                color: '#1E40FF',
                fontWeight: 700,
                fontSize: '0.78rem',
              }}
            >
              {part.replace(/_/g, ' ')}
            </span>
          );
        }
        return <React.Fragment key={idx}>{part}</React.Fragment>;
      })}
    </span>
  );
};

export interface MentionNoteComposerProps {
  staff?: CrmStaffMember[];
  placeholder?: string;
  submitLabel?: string;
  submitting?: boolean;
  extraControls?: React.ReactNode;
  onSubmit: (payload: { content: string; mentions: string[] }) => Promise<void> | void;
}

export const MentionNoteComposer: React.FC<MentionNoteComposerProps> = ({
  staff = [],
  placeholder = 'Nhập ghi chú tư vấn... Gõ @ để nhắc tên đồng nghiệp',
  submitLabel = 'Gửi ghi chú',
  submitting = false,
  extraControls,
  onSubmit,
}) => {
  const [content, setContent] = useState('');
  const [selectedMentions, setSelectedMentions] = useState<string[]>([]);
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);

  const matchingStaff = useMemo(() => {
    if (mentionQuery === null) return [];
    const q = mentionQuery.toLowerCase();
    return staff
      .filter(
        (u) =>
          u.full_name.toLowerCase().includes(q) ||
          (u.email && u.email.toLowerCase().includes(q))
      )
      .slice(0, 6);
  }, [mentionQuery, staff]);

  const handleTextChange = (val: string) => {
    setContent(val);
    const m = val.match(/@([\p{L}\p{N}_]*)$/u);
    if (m) {
      setMentionQuery(m[1]);
    } else {
      setMentionQuery(null);
    }
  };

  const insertMention = (member: CrmStaffMember) => {
    const token = `@${member.full_name.trim().replace(/\s+/g, '_')} `;
    const next = content.replace(/@([\p{L}\p{N}_]*)$/u, token);
    setContent(next === content ? `${content}${content.endsWith(' ') || !content ? '' : ' '}${token}` : next);
    setSelectedMentions((prev) => (prev.includes(member.id) ? prev : [...prev, member.id]));
    setMentionQuery(null);
  };

  const handleSend = async () => {
    const trimmed = content.trim();
    if (!trimmed || submitting) return;
    await onSubmit({ content: trimmed, mentions: selectedMentions });
    setContent('');
    setSelectedMentions([]);
    setMentionQuery(null);
  };

  return (
    <div
      style={{
        background: '#FFFFFF',
        border: '1px solid #E2E8F0',
        borderRadius: 14,
        padding: '0.875rem',
        position: 'relative',
      }}
    >
      <textarea
        rows={3}
        value={content}
        onChange={(e) => handleTextChange(e.target.value)}
        placeholder={placeholder}
        style={{
          width: '100%',
          border: '1px solid #E2E8F0',
          borderRadius: 10,
          padding: '0.65rem 0.85rem',
          fontSize: '0.85rem',
          color: '#0F172A',
          background: '#F8FAFC',
          resize: 'vertical',
          outline: 'none',
        }}
      />

      {matchingStaff.length > 0 && (
        <div
          style={{
            position: 'absolute',
            left: 14,
            right: 14,
            bottom: 58,
            background: '#FFFFFF',
            border: '1px solid #DBEAFE',
            borderRadius: 12,
            boxShadow: '0 10px 28px rgba(30, 64, 255, 0.12)',
            padding: 6,
            zIndex: 40,
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
          }}
        >
          {matchingStaff.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => insertMention(m)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '6px 10px',
                borderRadius: 8,
                border: 'none',
                background: 'transparent',
                cursor: 'pointer',
                textAlign: 'left',
              }}
            >
              <Avatar name={m.full_name} size="sm" />
              <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#0F172A' }}>
                {m.full_name}
              </span>
              {m.role && (
                <span style={{ fontSize: '0.72rem', color: '#64748B' }}>({m.role})</span>
              )}
            </button>
          ))}
        </div>
      )}

      <div
        style={{
          marginTop: 10,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 10,
          flexWrap: 'wrap',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          {staff.length > 0 && (
            <button
              type="button"
              onClick={() => {
                setContent((c) => `${c}${c.endsWith(' ') || !c ? '' : ' '}@`);
                setMentionQuery('');
              }}
              style={{
                height: 36,
                padding: '0 10px',
                borderRadius: 8,
                border: '1px solid #E2E8F0',
                background: '#FFFFFF',
                color: '#475569',
                fontSize: '0.78rem',
                fontWeight: 600,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                cursor: 'pointer',
              }}
            >
              <AtSign size={14} color="#1E40FF" /> Nhắc tên (@mention)
            </button>
          )}
          {extraControls}
        </div>

        <button
          type="button"
          disabled={!content.trim() || submitting}
          onClick={() => void handleSend()}
          style={{
            height: 44,
            padding: '0 1.15rem',
            borderRadius: 10,
            border: 'none',
            background: content.trim() ? '#1E40FF' : '#94A3B8',
            color: '#FFFFFF',
            fontWeight: 700,
            fontSize: '0.83rem',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            cursor: content.trim() && !submitting ? 'pointer' : 'not-allowed',
          }}
        >
          <Send size={15} /> {submitting ? 'Đang lưu...' : submitLabel}
        </button>
      </div>
    </div>
  );
};
