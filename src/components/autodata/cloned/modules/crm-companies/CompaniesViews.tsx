import React, { useState } from 'react';
import toast from 'react-hot-toast';
import {
  Briefcase,
  Building2,
  GitBranch,
  Search,
  ShieldCheck,
  Users,
} from 'lucide-react';
import { Avatar } from '../../components/ui/Avatar';
import { CustomModal } from '../../components/ui/CustomModal';
import type { CrmCompanyRecord } from '../../drawers/crmTypes';
import {
  crmGet,
  crmMutate,
  formatCurrencyVnd,
  type CrmAuthCreds,
} from '../../drawers/crm360Api';

export const CompaniesCardGrid: React.FC<{
  items: CrmCompanyRecord[];
  onSelect: (c: CrmCompanyRecord) => void;
}> = ({ items, onSelect }) => (
  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
    {items.map((c) => (
      <div
        key={c.id}
        onClick={() => onSelect(c)}
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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
            <Avatar name={c.name} size="md" />
            <div style={{ minWidth: 0 }}>
              <div style={{ fontWeight: 800, fontSize: '0.9rem', color: '#0F172A', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {c.name}
              </div>
              <div style={{ fontSize: '0.74rem', color: '#64748B' }}>
                {c.code} {c.tax_code ? `• MST: ${c.tax_code}` : ''}
              </div>
            </div>
          </div>
          <span style={{ fontSize: '0.7rem', fontWeight: 800, padding: '2px 8px', borderRadius: 999, background: '#EFF6FF', color: '#1E40FF', textTransform: 'uppercase' }}>
            {c.tier}
          </span>
        </div>

        {c.parent_company_name && (
          <div style={{ fontSize: '0.75rem', color: '#1E40FF', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 5 }}>
            <GitBranch size={13} /> Công ty mẹ: {c.parent_company_name}
          </div>
        )}

        <div style={{ display: 'flex', gap: 12, fontSize: '0.78rem', color: '#475569' }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
            <Users size={13} color="#1E40FF" /> {c.contact_count || 0} Liên hệ
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
            <Briefcase size={13} color="#1E40FF" /> {c.deal_count || 0} Deals
          </span>
          {Boolean(c.subsidiaries_count) && (
            <span>• {c.subsidiaries_count} Công ty con</span>
          )}
        </div>

        <div style={{ marginTop: 'auto', paddingTop: 8, borderTop: '1px solid #F1F5F9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.78rem' }}>
          <span style={{ color: '#64748B' }}>{c.industry || 'Doanh nghiệp B2B'}</span>
          <strong style={{ color: '#059669' }}>{formatCurrencyVnd(c.won_revenue_vnd || 0)}</strong>
        </div>
      </div>
    ))}
  </div>
);

export const CompaniesHierarchyTree: React.FC<{
  items: CrmCompanyRecord[];
  onSelect: (c: CrmCompanyRecord) => void;
}> = ({ items, onSelect }) => {
  const roots = items.filter((c) => !c.parent_company_id);
  const childrenMap = new Map<string, CrmCompanyRecord[]>();
  for (const c of items) {
    if (c.parent_company_id) {
      const arr = childrenMap.get(c.parent_company_id) || [];
      arr.push(c);
      childrenMap.set(c.parent_company_id, arr);
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {roots.map((root) => {
        const subs = childrenMap.get(root.id) || [];
        return (
          <div key={root.id} style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 16, padding: '1rem 1.25rem' }}>
            <div
              onClick={() => onSelect(root)}
              style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Building2 size={18} color="#1E40FF" />
                <div>
                  <strong style={{ fontSize: '0.92rem', color: '#0F172A' }}>{root.name}</strong>
                  <div style={{ fontSize: '0.75rem', color: '#64748B' }}>
                    MST: {root.tax_code || '—'} • SLA: {root.tier.toUpperCase()} • {subs.length} pháp nhân trực thuộc
                  </div>
                </div>
              </div>
              <strong style={{ color: '#059669', fontSize: '0.86rem' }}>
                {formatCurrencyVnd(root.won_revenue_vnd || 0)}
              </strong>
            </div>

            {subs.length > 0 && (
              <div style={{ marginTop: 10, marginLeft: 20, paddingLeft: 14, borderLeft: '2px solid #DBEAFE', display: 'flex', flexDirection: 'column', gap: 8 }}>
                {subs.map((sub) => (
                  <div
                    key={sub.id}
                    onClick={() => onSelect(sub)}
                    style={{ padding: '8px 12px', borderRadius: 10, background: '#F8FAFC', border: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
                  >
                    <div>
                      <strong style={{ fontSize: '0.84rem', color: '#1E40FF' }}>{sub.name}</strong>
                      <span style={{ fontSize: '0.74rem', color: '#64748B', marginLeft: 8 }}>
                        MST: {sub.tax_code || '—'}
                      </span>
                    </div>
                    <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#0F172A' }}>
                      <ShieldCheck size={12} color="#1E40FF" style={{ verticalAlign: 'middle' }} /> {sub.tier}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export const CreateCompanyModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  companies: CrmCompanyRecord[];
  creds: CrmAuthCreds;
  onCreated: (c: CrmCompanyRecord) => void;
}> = ({ isOpen, onClose, companies, creds, onCreated }) => {
  const [name, setName] = useState('');
  const [taxCode, setTaxCode] = useState('');
  const [mstMsg, setMstMsg] = useState<string | null>(null);
  const [parentId, setParentId] = useState('');
  const [tier, setTier] = useState('standard');
  const [industry, setIndustry] = useState('');
  const [repName, setRepName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [saving, setSaving] = useState(false);

  const handleCheckMst = async () => {
    if (!taxCode.trim()) return;
    try {
      const r = await crmGet<{
        is_valid_mst_format: boolean;
        existing_company: { name: string } | null;
      }>('/companies/mst-lookup', creds, { tax_code: taxCode.trim() });
      if (r.existing_company) {
        setMstMsg(`MST đã tồn tại: ${r.existing_company.name}`);
      } else if (r.is_valid_mst_format) {
        setMstMsg('Định dạng MST hợp lệ, chưa trùng lặp');
      } else {
        setMstMsg('MST cần 10 chữ số (hoặc 10-3 chi nhánh)');
      }
    } catch {
      setMstMsg(null);
    }
  };

  const handleSubmit = async () => {
    if (!name.trim()) {
      toast.error('Vui lòng nhập tên doanh nghiệp B2B');
      return;
    }
    setSaving(true);
    try {
      const created = await crmMutate<CrmCompanyRecord>('/companies', 'POST', creds, {
        name: name.trim(),
        tax_code: taxCode.trim() || null,
        parent_company_id: parentId || null,
        tier,
        industry: industry.trim() || null,
        representative_name: repName.trim() || null,
        phone: phone.trim() || null,
        email: email.trim() || null,
      });
      toast.success('Đã tạo Pháp nhân B2B mới');
      setName('');
      setTaxCode('');
      setMstMsg(null);
      onCreated(created);
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Không thể tạo doanh nghiệp');
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
    <CustomModal isOpen={isOpen} onClose={onClose} title="Thêm Pháp nhân / Đối tác B2B">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <input placeholder="Tên công ty / pháp nhân *" value={name} onChange={(e) => setName(e.target.value)} style={inp} />
        <div style={{ display: 'flex', gap: 8 }}>
          <input placeholder="Mã số thuế (MST)" value={taxCode} onChange={(e) => setTaxCode(e.target.value)} style={inp} />
          <button type="button" onClick={() => void handleCheckMst()} style={{ height: 44, padding: '0 14px', borderRadius: 10, border: '1px solid #DBEAFE', background: '#EFF6FF', color: '#1E40FF', fontWeight: 700, fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: 4, cursor: 'pointer', flexShrink: 0 }}>
            <Search size={14} /> Kiểm tra MST
          </button>
        </div>
        {mstMsg && <span style={{ fontSize: '0.75rem', color: '#1E40FF', fontWeight: 600 }}>{mstMsg}</span>}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <select value={parentId} onChange={(e) => setParentId(e.target.value)} style={inp}>
            <option value="">— Pháp nhân độc lập —</option>
            {companies.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          <select value={tier} onChange={(e) => setTier(e.target.value)} style={inp}>
            <option value="standard">Standard SLA</option>
            <option value="silver">Silver Partner</option>
            <option value="gold">Gold Account</option>
            <option value="enterprise">Enterprise VIP SLA</option>
          </select>
          <input placeholder="Ngành nghề" value={industry} onChange={(e) => setIndustry(e.target.value)} style={inp} />
          <input placeholder="Người đại diện" value={repName} onChange={(e) => setRepName(e.target.value)} style={inp} />
          <input placeholder="Điện thoại" value={phone} onChange={(e) => setPhone(e.target.value)} style={inp} />
          <input placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} style={inp} />
        </div>

        <button
          type="button"
          disabled={saving}
          onClick={() => void handleSubmit()}
          style={{ height: 44, borderRadius: 10, border: 'none', background: '#1E40FF', color: '#FFFFFF', fontWeight: 700, cursor: 'pointer' }}
        >
          {saving ? 'Đang lưu...' : 'Tạo Pháp nhân & Mở CompanyDrawer'}
        </button>
      </div>
    </CustomModal>
  );
};
