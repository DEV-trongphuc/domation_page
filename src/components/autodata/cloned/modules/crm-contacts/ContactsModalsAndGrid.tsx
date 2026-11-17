import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { Building2, Flame, Layers, Lock, Mail, Phone } from 'lucide-react';
import { Avatar } from '../../components/ui/Avatar';
import { CustomModal } from '../../components/ui/CustomModal';
import type {
  CrmCompanyRecord,
  CrmContactRecord,
  CrmStaffMember,
} from '../../drawers/crmTypes';
import {
  crmMutate,
  formatCurrencyVnd,
  getHeatTier,
  maskClientPiiFallback,
  type CrmAuthCreds,
} from '../../drawers/crm360Api';

export const ContactsPersonaGrid: React.FC<{
  items: CrmContactRecord[];
  canUnmaskPhone: boolean;
  onOpenContact: (c: CrmContactRecord) => void;
}> = ({ items, canUnmaskPhone, onOpenContact }) => {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))', gap: '1rem' }}>
      {items.map((c) => {
        const heat = getHeatTier(c.lead_score);
        return (
          <div
            key={c.id}
            onClick={() => onOpenContact(c)}
            style={{
              background: '#FFFFFF',
              border: '1px solid #E2E8F0',
              borderRadius: 16,
              padding: '1.15rem',
              display: 'flex',
              flexDirection: 'column',
              gap: 10,
              cursor: 'pointer',
              boxShadow: '0 2px 10px rgba(15, 23, 42, 0.03)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                <Avatar name={c.name} size="md" />
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#0F172A', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {c.name}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#64748B' }}>
                    {c.job_title || c.lifecycle_stage || 'Lead'}
                  </div>
                </div>
              </div>
              <span style={{ fontSize: '0.72rem', fontWeight: 800, padding: '3px 8px', borderRadius: 999, background: heat.bg, color: heat.color, display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                <Flame size={11} /> {c.lead_score}
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: '0.8rem', color: '#334155' }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <Phone size={13} color="#1E40FF" />
                {maskClientPiiFallback(c.phone, canUnmaskPhone, 'phone')}
                {!canUnmaskPhone && <Lock size={11} color="#64748B" />}
              </span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <Mail size={13} color="#1E40FF" />
                {maskClientPiiFallback(c.email, canUnmaskPhone, 'email')}
              </span>
              {c.company_name && (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: '#475569' }}>
                  <Building2 size={13} color="#1E40FF" /> {c.company_name}
                </span>
              )}
            </div>

            {c.tags && c.tags.length > 0 && (
              <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                {c.tags.slice(0, 3).map((tg) => (
                  <span key={tg.id} style={{ fontSize: '0.7rem', fontWeight: 700, padding: '2px 8px', borderRadius: 999, background: '#EFF6FF', color: '#1E40FF' }}>
                    #{tg.name}
                  </span>
                ))}
              </div>
            )}

            <div style={{ marginTop: 'auto', paddingTop: 8, borderTop: '1px solid #F1F5F9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.76rem' }}>
              <span style={{ color: '#64748B' }}>{c.stage_name || c.source || 'Master Contact'}</span>
              <strong style={{ color: '#059669' }}>{formatCurrencyVnd(c.total_revenue_vnd)}</strong>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export const CreateContactModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  companies: CrmCompanyRecord[];
  staff: CrmStaffMember[];
  creds: CrmAuthCreds;
  onCreated: (c: CrmContactRecord) => void;
}> = ({ isOpen, onClose, companies, staff, creds, onCreated }) => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [companyId, setCompanyId] = useState('');
  const [assignedTo, setAssignedTo] = useState('');
  const [lifecycleStage, setLifecycleStage] = useState('lead');
  const [productInterest, setProductInterest] = useState('');
  const [tagsStr, setTagsStr] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!name.trim()) {
      toast.error('Vui lòng nhập họ tên khách hàng');
      return;
    }
    if (!phone.trim() && !email.trim()) {
      toast.error('Cần nhập ít nhất SĐT hoặc Email');
      return;
    }
    setSubmitting(true);
    try {
      const created = await crmMutate<CrmContactRecord>('/contacts', 'POST', creds, {
        name: name.trim(),
        phone: phone.trim() || null,
        email: email.trim() || null,
        company_id: companyId || null,
        assigned_to: assignedTo || null,
        lifecycle_stage: lifecycleStage,
        product_interest: productInterest.trim() || null,
        tags: tagsStr
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
      });
      toast.success('Đã thêm Khách hàng 360° mới');
      setName('');
      setPhone('');
      setEmail('');
      setProductInterest('');
      setTagsStr('');
      onCreated(created);
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Không thể tạo khách hàng');
    } finally {
      setSubmitting(false);
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
    <CustomModal isOpen={isOpen} onClose={onClose} title="Thêm mới Hồ sơ Khách hàng 360°">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <input placeholder="Họ và tên *" value={name} onChange={(e) => setName(e.target.value)} style={{ ...inp, gridColumn: '1 / -1' }} />
          <input placeholder="Số điện thoại" value={phone} onChange={(e) => setPhone(e.target.value)} style={inp} />
          <input placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} style={inp} />
          <select value={lifecycleStage} onChange={(e) => setLifecycleStage(e.target.value)} style={inp}>
            <option value="lead">Lead mới</option>
            <option value="mql">MQL (Marketing Qualified)</option>
            <option value="sql">SQL (Sales Qualified)</option>
            <option value="opportunity">Cơ hội đàm phán</option>
            <option value="customer">Khách hàng chính thức</option>
          </select>
          <select value={companyId} onChange={(e) => setCompanyId(e.target.value)} style={inp}>
            <option value="">— Chọn Pháp nhân B2B (nếu có) —</option>
            {companies.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <select value={assignedTo} onChange={(e) => setAssignedTo(e.target.value)} style={inp}>
            <option value="">— Giao cho chuyên viên —</option>
            {staff.map((s) => (
              <option key={s.id} value={s.id}>
                {s.full_name}
              </option>
            ))}
          </select>
          <input placeholder="Sản phẩm / Dịch vụ quan tâm" value={productInterest} onChange={(e) => setProductInterest(e.target.value)} style={inp} />
          <input placeholder="Tags (ngăn cách dấu phẩy: VIP, B2B)" value={tagsStr} onChange={(e) => setTagsStr(e.target.value)} style={{ ...inp, gridColumn: '1 / -1' }} />
        </div>
        <button
          type="button"
          disabled={submitting}
          onClick={() => void handleSubmit()}
          style={{ height: 44, borderRadius: 10, border: 'none', background: '#1E40FF', color: '#FFFFFF', fontWeight: 700, cursor: 'pointer' }}
        >
          {submitting ? 'Đang tạo...' : 'Lưu & Mở Hồ sơ 360°'}
        </button>
      </div>
    </CustomModal>
  );
};

export const SaveAudienceModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  selectedIds: string[];
  creds: CrmAuthCreds;
  onDone: () => void;
}> = ({ isOpen, onClose, selectedIds, creds, onDone }) => {
  const [audName, setAudName] = useState('');
  const [desc, setDesc] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!audName.trim()) {
      toast.error('Vui lòng nhập tên Tệp Data');
      return;
    }
    setSaving(true);
    try {
      const res = await crmMutate<{ affected: number }>('/contacts/bulk', 'POST', creds, {
        action: 'save_to_audience',
        contact_ids: selectedIds,
        audience_name: audName.trim(),
        description: desc.trim() || undefined,
      });
      toast.success(`Đã đóng gói ${res.affected} khách hàng vào Tệp Data tĩnh!`);
      setAudName('');
      setDesc('');
      onDone();
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Không thể tạo Tệp Data');
    } finally {
      setSaving(false);
    }
  };

  return (
    <CustomModal isOpen={isOpen} onClose={onClose} title={`Đóng gói ${selectedIds.length} Khách hàng thành Tệp Data`}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <input
          placeholder="Tên Tệp Data (VD: Khách hàng VIP Q4)..."
          value={audName}
          onChange={(e) => setAudName(e.target.value)}
          style={{ height: 44, borderRadius: 10, border: '1px solid #E2E8F0', padding: '0 12px' }}
        />
        <textarea
          rows={3}
          placeholder="Mô tả mục đích chiến dịch Email / Zalo ZNS..."
          value={desc}
          onChange={(e) => setDesc(e.target.value)}
          style={{ borderRadius: 10, border: '1px solid #E2E8F0', padding: '10px 12px' }}
        />
        <button
          type="button"
          disabled={saving}
          onClick={() => void handleSave()}
          style={{ height: 44, borderRadius: 10, border: 'none', background: '#1E40FF', color: '#FFFFFF', fontWeight: 700, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6, cursor: 'pointer' }}
        >
          <Layers size={15} /> {saving ? 'Đang lưu Tệp...' : 'Tạo Tệp Data Marketing'}
        </button>
      </div>
    </CustomModal>
  );
};
