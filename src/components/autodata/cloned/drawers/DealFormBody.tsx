import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { Building2, Save, User } from 'lucide-react';
import type { CrmDealRecord } from './crmTypes';
import {
  crmMutate,
  formatCurrencyVnd,
  vndToVietnameseWords,
} from './crm360Api';
import { openGlobalCompanyDrawer, openGlobalCustomerDrawer } from './drawerEvents';

export interface DealFormBodyProps {
  deal: CrmDealRecord;
  canEdit: boolean;
  token?: string | null;
  tenantSlug?: string | null;
  onSaved: () => void;
}

export const DealFormBody: React.FC<DealFormBodyProps> = ({
  deal,
  canEdit,
  token,
  tenantSlug,
  onSaved,
}) => {
  const [title, setTitle] = useState(deal.title || '');
  const [amountVnd, setAmountVnd] = useState(Number(deal.amount_vnd || 0));
  const [probability, setProbability] = useState(Number(deal.probability ?? 30));
  const [expectedCloseDate, setExpectedCloseDate] = useState(
    deal.expected_close_date ? String(deal.expected_close_date).slice(0, 10) : ''
  );
  const [lostReason, setLostReason] = useState(deal.lost_reason || '');
  const [notes, setNotes] = useState(deal.notes || '');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!canEdit || saving) return;
    setSaving(true);
    try {
      await crmMutate(`/deals/${deal.id}`, 'PUT', { token, tenantSlug }, {
        title: title.trim(),
        amount_vnd: amountVnd,
        probability,
        expected_close_date: expectedCloseDate || null,
        lost_reason: lostReason.trim() || null,
        notes: notes.trim() || null,
      });
      toast.success('Đã cập nhật Cơ hội Kinh doanh');
      onSaved();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Không thể lưu cơ hội');
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
    background: canEdit ? '#FFFFFF' : '#F8FAFC',
    color: '#0F172A',
  };

  const weighted = Math.round((amountVnd * probability) / 100);

  return (
    <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 16, padding: '1.35rem', display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        {deal.lead_id && (
          <button
            type="button"
            onClick={() => openGlobalCustomerDrawer(String(deal.lead_id))}
            style={{ height: 36, padding: '0 12px', borderRadius: 8, border: '1px solid #DBEAFE', background: '#EFF6FF', color: '#1E40FF', fontWeight: 700, fontSize: '0.78rem', display: 'inline-flex', alignItems: 'center', gap: 5, cursor: 'pointer' }}
          >
            <User size={14} /> Khách hàng: {deal.contact_name || 'Mở Hồ sơ 360°'}
          </button>
        )}
        {deal.company_id && (
          <button
            type="button"
            onClick={() => openGlobalCompanyDrawer(String(deal.company_id))}
            style={{ height: 36, padding: '0 12px', borderRadius: 8, border: '1px solid #E2E8F0', background: '#F8FAFC', color: '#0F172A', fontWeight: 700, fontSize: '0.78rem', display: 'inline-flex', alignItems: 'center', gap: 5, cursor: 'pointer' }}
          >
            <Building2 size={14} color="#1E40FF" /> Pháp nhân: {deal.company_name || 'Doanh nghiệp'}
          </button>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
          <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#334155' }}>Tên Cơ hội Kinh doanh *</span>
          <input value={title} disabled={!canEdit} onChange={(e) => setTitle(e.target.value)} style={inp} />
        </label>

        <label style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
          <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#334155' }}>Giá trị Hợp đồng dự kiến (VNĐ)</span>
          <input
            type="number"
            value={amountVnd}
            disabled={!canEdit}
            onChange={(e) => setAmountVnd(Number(e.target.value || 0))}
            style={inp}
          />
          <span style={{ fontSize: '0.72rem', color: '#64748B', fontStyle: 'italic' }}>
            {vndToVietnameseWords(amountVnd)}
          </span>
        </label>

        <label style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
          <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#334155' }}>
            Xác suất chốt: {probability}% (Dự báo: {formatCurrencyVnd(weighted)})
          </span>
          <input
            type="range"
            min={0}
            max={100}
            step={5}
            disabled={!canEdit}
            value={probability}
            onChange={(e) => setProbability(Number(e.target.value))}
            style={{ height: 44, accentColor: '#1E40FF' }}
          />
        </label>

        <label style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
          <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#334155' }}>Ngày dự kiến chốt (Expected Close)</span>
          <input
            type="date"
            value={expectedCloseDate}
            disabled={!canEdit}
            onChange={(e) => setExpectedCloseDate(e.target.value)}
            style={inp}
          />
        </label>
      </div>

      {deal.stage === 'lost' && (
        <label style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
          <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#334155' }}>Lý do thất bại / Tạm hoãn</span>
          <input value={lostReason} disabled={!canEdit} onChange={(e) => setLostReason(e.target.value)} style={inp} />
        </label>
      )}

      <label style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
        <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#334155' }}>Ghi chú đàm phán & Điều khoản</span>
        <textarea
          rows={3}
          disabled={!canEdit}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          style={{ borderRadius: 10, border: '1px solid #E2E8F0', padding: '10px 12px', fontSize: '0.84rem' }}
        />
      </label>

      {canEdit && (
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button
            type="button"
            disabled={saving}
            onClick={() => void handleSave()}
            style={{ height: 44, padding: '0 1.4rem', borderRadius: 10, border: 'none', background: '#1E40FF', color: '#FFFFFF', fontWeight: 700, fontSize: '0.84rem', display: 'inline-flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}
          >
            <Save size={15} /> {saving ? 'Đang lưu...' : 'Lưu Cơ hội'}
          </button>
        </div>
      )}
    </div>
  );
};
