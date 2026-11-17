import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { Save, Search } from 'lucide-react';
import type { CrmCompanyRecord } from './crmTypes';
import { crmGet, crmMutate } from './crm360Api';

export interface CompanyInfoEditorProps {
  company: CrmCompanyRecord;
  allCompanies: CrmCompanyRecord[];
  canEdit: boolean;
  token?: string | null;
  tenantSlug?: string | null;
  onSaved: (c: CrmCompanyRecord) => void;
}

export const CompanyInfoEditor: React.FC<CompanyInfoEditorProps> = ({
  company,
  allCompanies,
  canEdit,
  token,
  tenantSlug,
  onSaved,
}) => {
  const [name, setName] = useState(company.name || '');
  const [taxCode, setTaxCode] = useState(company.tax_code || '');
  const [mstHint, setMstHint] = useState<string | null>(null);
  const [industry, setIndustry] = useState(company.industry || '');
  const [companySize, setCompanySize] = useState(company.company_size || '50-200');
  const [tier, setTier] = useState(company.tier || 'standard');
  const [status, setStatus] = useState(company.status || 'active');
  const [parentId, setParentId] = useState(company.parent_company_id || '');
  const [repName, setRepName] = useState(company.representative_name || '');
  const [phone, setPhone] = useState(company.phone || '');
  const [email, setEmail] = useState(company.email || '');
  const [website, setWebsite] = useState(company.website || '');
  const [address, setAddress] = useState(company.billing_address || '');
  const [notes, setNotes] = useState(company.notes || '');
  const [saving, setSaving] = useState(false);

  const handleLookupMst = async () => {
    if (!taxCode.trim()) return;
    try {
      const res = await crmGet<{
        is_valid_mst_format: boolean;
        is_branch_mst: boolean;
        existing_company: { id: string; name: string } | null;
      }>('/companies/mst-lookup', { token, tenantSlug }, { tax_code: taxCode.trim() });
      if (!res.is_valid_mst_format) {
        setMstHint('Định dạng MST chưa chuẩn (cần 10 số hoặc 10-3 số chi nhánh)');
      } else if (res.existing_company && res.existing_company.id !== company.id) {
        setMstHint(`Cảnh báo trùng MST với: ${res.existing_company.name}`);
      } else {
        setMstHint(
          res.is_branch_mst
            ? 'MST Chi nhánh hợp lệ (13 chữ số)'
            : 'MST Pháp nhân hợp lệ (10 chữ số)'
        );
      }
    } catch {
      setMstHint('Không thể kiểm tra MST lúc này');
    }
  };

  const handleSave = async () => {
    if (!canEdit || saving) return;
    setSaving(true);
    try {
      const saved = await crmMutate<CrmCompanyRecord>(
        `/companies/${company.id}`,
        'PUT',
        { token, tenantSlug },
        {
          name: name.trim(),
          tax_code: taxCode.trim() || null,
          industry: industry.trim() || null,
          company_size: companySize,
          tier,
          status,
          parent_company_id: parentId || null,
          representative_name: repName.trim() || null,
          phone: phone.trim() || null,
          email: email.trim() || null,
          website: website.trim() || null,
          billing_address: address.trim() || null,
          notes: notes.trim() || null,
        }
      );
      toast.success('Đã cập nhật hồ sơ Pháp nhân B2B');
      onSaved(saved);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Không thể lưu doanh nghiệp');
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

  return (
    <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 16, padding: '1.35rem', display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: 14 }}>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
          <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#334155' }}>Tên Pháp nhân / Đối tác *</span>
          <input value={name} disabled={!canEdit} onChange={(e) => setName(e.target.value)} style={inp} />
        </label>

        <label style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
          <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#334155' }}>Mã số thuế (MST)</span>
          <div style={{ display: 'flex', gap: 6 }}>
            <input value={taxCode} disabled={!canEdit} onChange={(e) => setTaxCode(e.target.value)} placeholder="VD: 0316889900" style={inp} />
            <button
              type="button"
              onClick={() => void handleLookupMst()}
              style={{ height: 44, padding: '0 12px', borderRadius: 10, border: '1px solid #DBEAFE', background: '#EFF6FF', color: '#1E40FF', fontWeight: 700, fontSize: '0.78rem', display: 'inline-flex', alignItems: 'center', gap: 4, cursor: 'pointer', flexShrink: 0 }}
            >
              <Search size={14} /> Tra MST
            </button>
          </div>
          {mstHint && <span style={{ fontSize: '0.72rem', color: '#1E40FF', fontWeight: 600 }}>{mstHint}</span>}
        </label>

        <label style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
          <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#334155' }}>Công ty mẹ (B2B Hierarchy)</span>
          <select value={parentId} disabled={!canEdit} onChange={(e) => setParentId(e.target.value)} style={inp}>
            <option value="">— Tập đoàn / Pháp nhân độc lập —</option>
            {allCompanies
              .filter((c) => c.id !== company.id)
              .map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.code})
                </option>
              ))}
          </select>
        </label>

        <label style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
          <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#334155' }}>Hạng cam kết SLA (Tier)</span>
          <select value={tier} disabled={!canEdit} onChange={(e) => setTier(e.target.value)} style={inp}>
            <option value="standard">Standard SLA</option>
            <option value="silver">Silver Partner</option>
            <option value="gold">Gold Account</option>
            <option value="enterprise">Enterprise VIP SLA</option>
          </select>
        </label>

        <label style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
          <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#334155' }}>Trạng thái hợp tác</span>
          <select value={status} disabled={!canEdit} onChange={(e) => setStatus(e.target.value)} style={inp}>
            <option value="active">Đang hoạt động</option>
            <option value="prospect">Tiềm năng đàm phán</option>
            <option value="inactive">Tạm ngưng</option>
          </select>
        </label>

        <label style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
          <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#334155' }}>Người đại diện pháp luật</span>
          <input value={repName} disabled={!canEdit} onChange={(e) => setRepName(e.target.value)} style={inp} />
        </label>

        <label style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
          <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#334155' }}>Ngành nghề & Quy mô</span>
          <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 0.7fr', gap: 6 }}>
            <input value={industry} disabled={!canEdit} onChange={(e) => setIndustry(e.target.value)} placeholder="Ngành..." style={inp} />
            <input value={companySize} disabled={!canEdit} onChange={(e) => setCompanySize(e.target.value)} placeholder="Quy mô" style={inp} />
          </div>
        </label>

        <label style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
          <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#334155' }}>Điện thoại & Email công ty</span>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
            <input value={phone} disabled={!canEdit} onChange={(e) => setPhone(e.target.value)} placeholder="SĐT..." style={inp} />
            <input value={email} disabled={!canEdit} onChange={(e) => setEmail(e.target.value)} placeholder="Email..." style={inp} />
          </div>
        </label>
      </div>

      <label style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
        <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#334155' }}>Địa chỉ xuất hóa đơn VAT & Website</span>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 8 }}>
          <input value={address} disabled={!canEdit} onChange={(e) => setAddress(e.target.value)} placeholder="Địa chỉ pháp lý..." style={inp} />
          <input value={website} disabled={!canEdit} onChange={(e) => setWebsite(e.target.value)} placeholder="https://..." style={inp} />
        </div>
      </label>

      <label style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
        <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#334155' }}>Ghi chú hợp tác chiến lược</span>
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
            <Save size={15} /> {saving ? 'Đang lưu...' : 'Lưu Hồ sơ Pháp nhân'}
          </button>
        </div>
      )}
    </div>
  );
};
