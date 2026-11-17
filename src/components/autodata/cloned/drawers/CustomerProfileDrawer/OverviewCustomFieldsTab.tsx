import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { Building2, Lock, Save, ShieldCheck } from 'lucide-react';
import type {
  CrmCompanyRecord,
  CrmContactRecord,
  CrmCustomFieldDef,
  CrmDynamicEntityTab,
  CrmStaffMember,
} from '../crmTypes';
import { crmMutate, maskClientPiiFallback, type CrmAuthCreds } from '../crm360Api';
import { openGlobalCompanyDrawer } from '../drawerEvents';
import {
  CustomFieldsStudioSection,
  DynamicEntityTabFieldsPanel,
} from './CustomFieldsStudioSection';

export interface OverviewCustomFieldsTabProps {
  contact: CrmContactRecord;
  canUnmaskPhone: boolean;
  canEdit: boolean;
  customFieldDefs: CrmCustomFieldDef[];
  dynamicTabs: CrmDynamicEntityTab[];
  activeDynamicTabKey?: string | null;
  staff: CrmStaffMember[];
  companies: CrmCompanyRecord[];
  creds: CrmAuthCreds;
  onUpdated: (updated: CrmContactRecord) => void;
}

const LIFECYCLE_OPTIONS = [
  { value: 'subscriber', label: 'Subscriber (Đăng ký nhận tin)' },
  { value: 'lead', label: 'Lead mới' },
  { value: 'mql', label: 'MQL (Marketing Qualified)' },
  { value: 'sql', label: 'SQL (Sales Qualified)' },
  { value: 'opportunity', label: 'Cơ hội đàm phán' },
  { value: 'customer', label: 'Khách hàng chính thức' },
  { value: 'evangelist', label: 'Khách hàng thân thiết / Giới thiệu' },
  { value: 'disqualified', label: 'Không phù hợp' },
];

export const OverviewCustomFieldsTab: React.FC<OverviewCustomFieldsTabProps> = ({
  contact,
  canUnmaskPhone,
  canEdit,
  customFieldDefs,
  dynamicTabs,
  activeDynamicTabKey,
  staff,
  companies,
  creds,
  onUpdated,
}) => {
  const [name, setName] = useState(contact.name || '');
  const [phone, setPhone] = useState(
    maskClientPiiFallback(contact.phone, canUnmaskPhone, 'phone')
  );
  const [email, setEmail] = useState(
    maskClientPiiFallback(contact.email, canUnmaskPhone, 'email')
  );
  const [lifecycleStage, setLifecycleStage] = useState(contact.lifecycle_stage || 'lead');
  const [leadScore, setLeadScore] = useState(Number(contact.lead_score || 0));
  const [emailConsent, setEmailConsent] = useState(contact.email_consent || 'subscribed');
  const [znsConsent, setZnsConsent] = useState(contact.zns_consent || 'opted_in');
  const [source, setSource] = useState(contact.source || 'Direct');
  const [campaign, setCampaign] = useState(contact.campaign || '');
  const [productInterest, setProductInterest] = useState(contact.product_interest || '');
  const [budgetRange, setBudgetRange] = useState(contact.budget_range || '');
  const [companyId, setCompanyId] = useState(contact.company_id || '');
  const [assignedTo, setAssignedTo] = useState(contact.assigned_to || '');
  const [jobTitle, setJobTitle] = useState(contact.job_title || '');
  const [address, setAddress] = useState(contact.address || '');
  const [customValues, setCustomValues] = useState<Record<string, unknown>>({
    ...(contact.custom_fields || {}),
  });
  const [saving, setSaving] = useState(false);

  const selectedDynTab = activeDynamicTabKey
    ? dynamicTabs.find((t) => t.tab_key === activeDynamicTabKey)
    : null;

  const handleSave = async () => {
    if (!canEdit || saving) return;
    setSaving(true);
    try {
      const payload: Record<string, unknown> = {
        name: name.trim(),
        lifecycle_stage: lifecycleStage,
        lead_score: leadScore,
        email_consent: emailConsent,
        zns_consent: znsConsent,
        source,
        campaign: campaign || null,
        product_interest: productInterest || null,
        budget_range: budgetRange || null,
        company_id: companyId || null,
        assigned_to: assignedTo || null,
        job_title: jobTitle || null,
        address: address || null,
        custom_fields: customValues,
      };
      if (canUnmaskPhone) {
        payload.phone = phone === '—' ? null : phone.trim();
        payload.email = email === '—' ? null : email.trim();
      }
      const updated = await crmMutate<CrmContactRecord>(
        `/contacts/${contact.id}`,
        'PUT',
        creds,
        payload
      );
      toast.success('Đã lưu hồ sơ Khách hàng 360°');
      onUpdated(updated);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Không thể lưu hồ sơ khách hàng');
    } finally {
      setSaving(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    height: 44,
    width: '100%',
    padding: '0 0.85rem',
    borderRadius: 10,
    border: '1px solid #E2E8F0',
    background: canEdit ? '#FFFFFF' : '#F8FAFC',
    color: '#0F172A',
    fontSize: '0.84rem',
  };

  if (selectedDynTab) {
    return (
      <DynamicEntityTabFieldsPanel
        tab={selectedDynTab}
        canEdit={canEdit}
        saving={saving}
        customValues={customValues}
        onChangeCustomValue={(k, v) => setCustomValues((prev) => ({ ...prev, [k]: v }))}
        onSave={() => void handleSave()}
        inputStyle={inputStyle}
      />
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
      {!canUnmaskPhone && (
        <div
          style={{
            background: '#EFF6FF',
            border: '1px solid #DBEAFE',
            borderRadius: 12,
            padding: '0.75rem 1rem',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            fontSize: '0.8rem',
            color: '#1E3A8A',
          }}
        >
          <Lock size={16} color="#1E40FF" />
          <span>
            Chế độ bảo vệ dữ liệu cá nhân (PII Masking) đang bật theo quyền{' '}
            <strong>leads.unmask_phone = false</strong>. SĐT & Email gốc được ẩn an toàn từ máy chủ.
          </span>
        </div>
      )}

      {/* Core Identity Card */}
      <div
        style={{
          background: '#FFFFFF',
          border: '1px solid #E2E8F0',
          borderRadius: 16,
          padding: '1.35rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <ShieldCheck size={18} color="#1E40FF" />
            <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800, color: '#0F172A' }}>
              Thông tin Định danh & Liên hệ Master Contact 360°
            </h3>
          </div>
          {contact.company_id && (
            <button
              type="button"
              onClick={() => openGlobalCompanyDrawer(String(contact.company_id))}
              style={{
                height: 36,
                padding: '0 12px',
                borderRadius: 8,
                border: '1px solid #DBEAFE',
                background: '#EFF6FF',
                color: '#1E40FF',
                fontWeight: 700,
                fontSize: '0.78rem',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                cursor: 'pointer',
              }}
            >
              <Building2 size={14} /> Mở Pháp nhân B2B: {contact.company_name || 'Công ty'}
            </button>
          )}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: 14 }}>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#334155' }}>Họ và tên khách hàng *</span>
            <input value={name} disabled={!canEdit} onChange={(e) => setName(e.target.value)} style={inputStyle} />
          </label>

          <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#334155' }}>
              Số điện thoại {!canUnmaskPhone && '(Đã che PII)'}
            </span>
            <input
              value={phone}
              disabled={!canEdit || !canUnmaskPhone}
              onChange={(e) => setPhone(e.target.value)}
              style={{ ...inputStyle, background: canEdit && canUnmaskPhone ? '#FFFFFF' : '#F1F5F9' }}
            />
          </label>

          <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#334155' }}>
              Email {!canUnmaskPhone && '(Đã che PII)'}
            </span>
            <input
              value={email}
              disabled={!canEdit || !canUnmaskPhone}
              onChange={(e) => setEmail(e.target.value)}
              style={{ ...inputStyle, background: canEdit && canUnmaskPhone ? '#FFFFFF' : '#F1F5F9' }}
            />
          </label>

          <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#334155' }}>Chức vụ / Vai trò</span>
            <input value={jobTitle} disabled={!canEdit} onChange={(e) => setJobTitle(e.target.value)} style={inputStyle} />
          </label>

          <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#334155' }}>Vòng đời (Lifecycle Stage)</span>
            <select value={lifecycleStage} disabled={!canEdit} onChange={(e) => setLifecycleStage(e.target.value)} style={inputStyle}>
              {LIFECYCLE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>

          <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#334155' }}>Điểm Lead Score (0 - 100)</span>
            <input
              type="number"
              min={0}
              max={100}
              disabled={!canEdit}
              value={leadScore}
              onChange={(e) => setLeadScore(Number(e.target.value || 0))}
              style={inputStyle}
            />
          </label>

          <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#334155' }}>Doanh nghiệp B2B liên kết</span>
            <select value={companyId} disabled={!canEdit} onChange={(e) => setCompanyId(e.target.value)} style={inputStyle}>
              <option value="">— Cá nhân độc lập —</option>
              {companies.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.code})
                </option>
              ))}
            </select>
          </label>

          <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#334155' }}>Chuyên viên phụ trách</span>
            <select value={assignedTo} disabled={!canEdit} onChange={(e) => setAssignedTo(e.target.value)} style={inputStyle}>
              <option value="">— Chưa phân công —</option>
              {staff.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.full_name}
                </option>
              ))}
            </select>
          </label>

          <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#334155' }}>Sản phẩm / Dịch vụ quan tâm</span>
            <input value={productInterest} disabled={!canEdit} onChange={(e) => setProductInterest(e.target.value)} style={inputStyle} />
          </label>

          <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#334155' }}>Ngân sách dự kiến</span>
            <input value={budgetRange} disabled={!canEdit} onChange={(e) => setBudgetRange(e.target.value)} style={inputStyle} />
          </label>

          <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#334155' }}>Nguồn & Chiến dịch</span>
            <input
              value={campaign ? `${source} • ${campaign}` : source}
              disabled={!canEdit}
              onChange={(e) => {
                const [src, ...rest] = e.target.value.split('•');
                setSource((src || '').trim());
                setCampaign(rest.join('•').trim());
              }}
              style={inputStyle}
            />
          </label>

          <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#334155' }}>Đồng thuận Email & Zalo ZNS</span>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <select value={emailConsent} disabled={!canEdit} onChange={(e) => setEmailConsent(e.target.value)} style={inputStyle}>
                <option value="subscribed">Email: Đã đăng ký</option>
                <option value="unsubscribed">Email: Từ chối</option>
                <option value="bounced">Email: Bounce</option>
              </select>
              <select value={znsConsent} disabled={!canEdit} onChange={(e) => setZnsConsent(e.target.value)} style={inputStyle}>
                <option value="opted_in">ZNS: Cho phép</option>
                <option value="opted_out">ZNS: Từ chối</option>
              </select>
            </div>
          </label>
        </div>

        <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#334155' }}>Địa chỉ liên hệ</span>
          <input value={address} disabled={!canEdit} onChange={(e) => setAddress(e.target.value)} style={inputStyle} />
        </label>
      </div>

      <CustomFieldsStudioSection
        customFieldDefs={customFieldDefs}
        canEdit={canEdit}
        customValues={customValues}
        onChangeCustomValue={(k, v) => setCustomValues((prev) => ({ ...prev, [k]: v }))}
        inputStyle={inputStyle}
      />

      {canEdit && (
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button
            type="button"
            onClick={() => void handleSave()}
            disabled={saving}
            style={{
              height: 44,
              padding: '0 1.4rem',
              borderRadius: 10,
              border: 'none',
              background: '#1E40FF',
              color: '#FFFFFF',
              fontWeight: 700,
              fontSize: '0.85rem',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              cursor: 'pointer',
            }}
          >
            <Save size={16} /> {saving ? 'Đang lưu cập nhật...' : 'Lưu thông tin Hồ sơ 360°'}
          </button>
        </div>
      )}
    </div>
  );
};

export default OverviewCustomFieldsTab;
