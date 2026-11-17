import React, { useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { CustomModal } from '../../components/ui/CustomModal';
import type {
  CrmActivityRecord,
  CrmCompanyRecord,
  CrmContactRecord,
  CrmDealRecord,
  CrmStaffMember,
} from '../../drawers/crmTypes';
import { crmMutate, type CrmAuthCreds } from '../../drawers/crm360Api';

export const ActivitiesMonthCalendar: React.FC<{
  items: CrmActivityRecord[];
  onSelectActivity: (a: CrmActivityRecord) => void;
}> = ({ items, onSelectActivity }) => {
  const [cursor, setCursor] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });

  const cells = useMemo(() => {
    const year = cursor.getFullYear();
    const month = cursor.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const offset = firstDay === 0 ? 6 : firstDay - 1;
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const out: Array<{ day: number | null; dateStr: string }> = [];
    for (let i = 0; i < offset; i++) out.push({ day: null, dateStr: `pad-${i}` });
    for (let d = 1; d <= daysInMonth; d++) {
      const mStr = String(month + 1).padStart(2, '0');
      const dStr = String(d).padStart(2, '0');
      out.push({ day: d, dateStr: `${year}-${mStr}-${dStr}` });
    }
    return out;
  }, [cursor]);

  const byDate = useMemo(() => {
    const map = new Map<string, CrmActivityRecord[]>();
    for (const a of items) {
      const dt = String(a.due_date || a.created_at || '').slice(0, 10);
      if (!dt) continue;
      const arr = map.get(dt) || [];
      arr.push(a);
      map.set(dt, arr);
    }
    return map;
  }, [items]);

  return (
    <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 16, padding: '1.15rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <strong style={{ fontSize: '0.95rem', color: '#0F172A' }}>
          Lịch Hoạt động Tháng {cursor.getMonth() + 1}/{cursor.getFullYear()}
        </strong>
        <div style={{ display: 'flex', gap: 6 }}>
          <button
            type="button"
            onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))}
            style={{ width: 36, height: 36, borderRadius: 8, border: '1px solid #E2E8F0', background: '#FFFFFF', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <ChevronLeft size={16} />
          </button>
          <button
            type="button"
            onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))}
            style={{ width: 36, height: 36, borderRadius: 8, border: '1px solid #E2E8F0', background: '#FFFFFF', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 6 }}>
        {['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].map((wd) => (
          <div key={wd} style={{ textAlign: 'center', fontSize: '0.75rem', fontWeight: 700, color: '#64748B', paddingBottom: 4 }}>
            {wd}
          </div>
        ))}
        {cells.map((cell) => {
          const dayItems = cell.day ? byDate.get(cell.dateStr) || [] : [];
          return (
            <div
              key={cell.dateStr}
              style={{
                minHeight: 92,
                borderRadius: 10,
                border: '1px solid #F1F5F9',
                background: cell.day ? '#FFFFFF' : '#F8FAFC',
                padding: 6,
                display: 'flex',
                flexDirection: 'column',
                gap: 4,
              }}
            >
              {cell.day && (
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569' }}>
                  {cell.day}
                </span>
              )}
              {dayItems.slice(0, 3).map((act) => (
                <button
                  key={act.id}
                  type="button"
                  onClick={() => onSelectActivity(act)}
                  style={{
                    border: 'none',
                    borderRadius: 6,
                    padding: '3px 6px',
                    background: act.status === 'done' ? '#ECFDF5' : '#EFF6FF',
                    color: act.status === 'done' ? '#059669' : '#1E40FF',
                    fontSize: '0.68rem',
                    fontWeight: 700,
                    textAlign: 'left',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    cursor: 'pointer',
                  }}
                >
                  {act.subject}
                </button>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export const CreateActivityModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  contacts: CrmContactRecord[];
  deals: CrmDealRecord[];
  companies: CrmCompanyRecord[];
  staff: CrmStaffMember[];
  creds: CrmAuthCreds;
  onCreated: () => void;
}> = ({ isOpen, onClose, contacts, deals, companies, staff, creds, onCreated }) => {
  const [actType, setActType] = useState('call');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [priority, setPriority] = useState('medium');
  const [status, setStatus] = useState('planned');
  const [dueDate, setDueDate] = useState('');
  const [leadId, setLeadId] = useState('');
  const [dealId, setDealId] = useState('');
  const [companyId, setCompanyId] = useState('');
  const [ownerId, setOwnerId] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!subject.trim()) {
      toast.error('Vui lòng nhập tiêu đề hoạt động');
      return;
    }
    setSaving(true);
    try {
      await crmMutate('/activities', 'POST', creds, {
        activity_type: actType,
        subject: subject.trim(),
        body: body.trim() || null,
        priority,
        status,
        due_date: dueDate || null,
        lead_id: leadId || null,
        deal_id: dealId || null,
        company_id: companyId || null,
        owner_user_id: ownerId || null,
      });
      toast.success('Đã lưu Hoạt động CRM mới');
      setSubject('');
      setBody('');
      onCreated();
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Không thể tạo hoạt động');
    } finally {
      setSaving(false);
    }
  };

  const inp: React.CSSProperties = {
    height: 44,
    width: '100%',
    borderRadius: 10,
    border: '1px solid #E2E8F0',
    padding: '0 12px',
    fontSize: '0.84rem',
  };

  return (
    <CustomModal isOpen={isOpen} onClose={onClose} title="Ghi nhận Cuộc gọi, Lịch hẹn & Hoạt động CRM">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <select value={actType} onChange={(e) => setActType(e.target.value)} style={inp}>
            <option value="call">Cuộc gọi tư vấn</option>
            <option value="zalo_connect">Kết nối Zalo</option>
            <option value="email">Gửi Email</option>
            <option value="meeting">Lịch gặp gỡ / Demo</option>
            <option value="task">Công việc (Tự tạo Task)</option>
            <option value="note">Ghi chú nhanh</option>
          </select>
          <select value={status} onChange={(e) => setStatus(e.target.value)} style={inp}>
            <option value="planned">Kế hoạch (Planned)</option>
            <option value="in_progress">Đang thực hiện</option>
            <option value="done">Đã hoàn tất</option>
          </select>
        </div>

        <input placeholder="Tiêu đề hoạt động *" value={subject} onChange={(e) => setSubject(e.target.value)} style={inp} />

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <select value={leadId} onChange={(e) => setLeadId(e.target.value)} style={inp}>
            <option value="">— Gắn Khách hàng 360° —</option>
            {contacts.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          <select value={dealId} onChange={(e) => setDealId(e.target.value)} style={inp}>
            <option value="">— Gắn Cơ hội (Deal) —</option>
            {deals.map((d) => (
              <option key={d.id} value={d.id}>{d.title}</option>
            ))}
          </select>
          <select value={companyId} onChange={(e) => setCompanyId(e.target.value)} style={inp}>
            <option value="">— Gắn Doanh nghiệp B2B —</option>
            {companies.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          <select value={ownerId} onChange={(e) => setOwnerId(e.target.value)} style={inp}>
            <option value="">— Người thực hiện —</option>
            {staff.map((s) => (
              <option key={s.id} value={s.id}>{s.full_name}</option>
            ))}
          </select>
          <input type="datetime-local" value={dueDate} onChange={(e) => setDueDate(e.target.value)} style={inp} />
          <select value={priority} onChange={(e) => setPriority(e.target.value)} style={inp}>
            <option value="low">Ưu tiên: Thấp</option>
            <option value="medium">Ưu tiên: Trung bình</option>
            <option value="high">Ưu tiên: Cao</option>
            <option value="urgent">Ưu tiên: Khẩn cấp</option>
          </select>
        </div>

        <textarea
          rows={3}
          placeholder="Nội dung chi tiết hoặc @mention đồng nghiệp..."
          value={body}
          onChange={(e) => setBody(e.target.value)}
          style={{ borderRadius: 10, border: '1px solid #E2E8F0', padding: '10px 12px', fontSize: '0.84rem' }}
        />

        <button
          type="button"
          disabled={saving}
          onClick={() => void handleSave()}
          style={{ height: 44, borderRadius: 10, border: 'none', background: '#1E40FF', color: '#FFFFFF', fontWeight: 700, cursor: 'pointer' }}
        >
          {saving ? 'Đang lưu...' : 'Lưu Hoạt động'}
        </button>
      </div>
    </CustomModal>
  );
};
