import React, { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import {
  Briefcase,
  Building2,
  CheckCircle2,
  ExternalLink,
  FileText,
  GitBranch,
  ShieldCheck,
  Users,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useEntitlement } from '../contexts/EntitlementContext';
import { Avatar } from '../components/ui/Avatar';
import { DrawerShell, type DrawerTabDef } from './DrawerShell';
import type {
  CrmCompanyRecord,
  CrmContactRecord,
  CrmDealRecord,
} from './crmTypes';
import {
  crmGet,
  formatCurrencyVnd,
  maskClientPiiFallback,
} from './crm360Api';
import {
  openGlobalCompanyDrawer,
  openGlobalCustomerDrawer,
  openGlobalDealDrawer,
} from './drawerEvents';
import { CompanyInfoEditor } from './CompanyInfoEditor';

export interface CompanyDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  company: { id: string; name?: string } | CrmCompanyRecord | null;
  allCompanies?: CrmCompanyRecord[];
  onSaved?: (saved: CrmCompanyRecord) => void;
  zIndex?: number;
}

interface CompanyDossierResponse {
  company: CrmCompanyRecord;
  subsidiaries: CrmCompanyRecord[];
  contacts: CrmContactRecord[];
  deals: CrmDealRecord[];
  quotes: Array<{ id: string; quote_code: string; title: string; total_vnd: number; status: string }>;
  sales_orders: Array<{ id: string; order_code: string; total_vnd: number; paid_vnd: number; status: string }>;
  invoices: Array<{ id: string; invoice_code: string; total_vnd: number; status: string }>;
  rollup: {
    contacts_count: number;
    subsidiaries_count: number;
    deals_count: number;
    won_deals_vnd: number;
    sales_orders_paid_vnd: number;
    total_revenue_rollup_vnd: number;
  };
}

export const CompanyDrawer: React.FC<CompanyDrawerProps> = ({
  isOpen,
  onClose,
  company,
  allCompanies = [],
  onSaved,
  zIndex = 1230,
}) => {
  const { token, tenantSlug } = useAuth();
  const { can } = useEntitlement();
  const [activeTab, setActiveTab] = useState('info');
  const [dossier, setDossier] = useState<CompanyDossierResponse | null>(null);
  const [loading, setLoading] = useState(false);

  const compId = company?.id ? String(company.id) : '';
  const canEdit = can('companies', 'edit') || can('crm_b2b', 'edit');
  const canUnmask = can('leads', 'unmask_phone');

  const loadDossier = useCallback(async () => {
    if (!isOpen || !compId) return;
    setLoading(true);
    try {
      const res = await crmGet<CompanyDossierResponse>(`/companies/${compId}`, { token, tenantSlug });
      setDossier(res);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Không thể tải hồ sơ doanh nghiệp');
    } finally {
      setLoading(false);
    }
  }, [isOpen, compId, token, tenantSlug]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadDossier();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [loadDossier]);

  const comp = dossier?.company;
  const tabs: DrawerTabDef[] = [
    { id: 'info', label: 'Pháp nhân & MST', icon: <Building2 size={15} /> },
    { id: 'hierarchy', label: 'Cấu trúc Tập đoàn', icon: <GitBranch size={15} />, badge: dossier?.rollup.subsidiaries_count },
    { id: 'contacts', label: 'Người liên hệ (Contacts)', icon: <Users size={15} />, badge: dossier?.rollup.contacts_count },
    { id: 'deals', label: 'Multi-Deals & Doanh thu', icon: <Briefcase size={15} />, badge: dossier?.rollup.deals_count },
    { id: 'commercial', label: 'Báo giá, SO & Hóa đơn', icon: <FileText size={15} />, badge: (dossier?.quotes.length || 0) + (dossier?.sales_orders.length || 0) },
  ];

  return (
    <DrawerShell
      isOpen={isOpen}
      onClose={onClose}
      zIndex={zIndex}
      loading={loading || !comp}
      avatarNode={<Avatar name={comp?.name || company?.name || 'B2B'} size="lg" />}
      title={
        <>
          <span>{comp?.name || company?.name || 'Doanh nghiệp B2B'}</span>
          {comp?.tier && (
            <span style={{ fontSize: '0.72rem', fontWeight: 800, padding: '2px 10px', borderRadius: 999, background: '#EFF6FF', color: '#1E40FF', textTransform: 'uppercase' }}>
              <ShieldCheck size={12} style={{ verticalAlign: 'middle', marginRight: 4 }} />
              SLA: {comp.tier}
            </span>
          )}
        </>
      }
      subtitle={
        comp ? (
          <span>
            Mã: <strong>{comp.code}</strong> • MST: <strong>{comp.tax_code || 'Chưa cập nhật'}</strong> • Doanh thu Rollup:{' '}
            <strong style={{ color: '#059669' }}>{formatCurrencyVnd(dossier?.rollup.total_revenue_rollup_vnd || 0)}</strong>
          </span>
        ) : undefined
      }
      tabs={tabs}
      activeTab={activeTab}
      onTabChange={setActiveTab}
    >
      {comp && dossier && (
        <>
          {activeTab === 'info' && (
            <CompanyInfoEditor
              key={`${comp.id}-${comp.updated_at || ''}`}
              company={comp}
              allCompanies={allCompanies}
              canEdit={canEdit}
              token={token}
              tenantSlug={tenantSlug}
              onSaved={(s) => {
                onSaved?.(s);
                void loadDossier();
              }}
            />
          )}

          {activeTab === 'hierarchy' && (
            <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 16, padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: 12 }}>
              {comp.parent_company_id && (
                <div style={{ padding: '0.85rem 1rem', borderRadius: 12, background: '#EFF6FF', border: '1px solid #DBEAFE', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.84rem', fontWeight: 700, color: '#1E3A8A' }}>
                    Trực thuộc Công ty Mẹ: {comp.parent_company_name || comp.parent_company_id}
                  </span>
                  <button
                    type="button"
                    onClick={() => openGlobalCompanyDrawer(String(comp.parent_company_id))}
                    style={{ border: 'none', background: '#1E40FF', color: '#FFFFFF', borderRadius: 8, padding: '6px 12px', fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer' }}
                  >
                    Mở Công ty mẹ
                  </button>
                </div>
              )}

              <strong style={{ fontSize: '0.9rem', color: '#0F172A' }}>
                Công ty con / Chi nhánh trực thuộc ({dossier.subsidiaries.length})
              </strong>
              {dossier.subsidiaries.length === 0 ? (
                <div style={{ fontSize: '0.83rem', color: '#64748B' }}>Chưa có pháp nhân con trực thuộc.</div>
              ) : (
                dossier.subsidiaries.map((sub) => (
                  <div key={sub.id} style={{ padding: '10px 12px', borderRadius: 10, border: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <strong style={{ fontSize: '0.85rem', color: '#0F172A' }}>{sub.name}</strong>
                      <div style={{ fontSize: '0.75rem', color: '#64748B' }}>
                        Mã: {sub.code} • MST: {sub.tax_code || '—'} • SLA: {sub.tier}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => openGlobalCompanyDrawer(sub)}
                      style={{ border: '1px solid #E2E8F0', background: '#FFFFFF', color: '#1E40FF', borderRadius: 8, padding: '6px 10px', fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                    >
                      Chi tiết <ExternalLink size={12} />
                    </button>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'contacts' && (
            <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 16, padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: 10 }}>
              <strong style={{ fontSize: '0.9rem', color: '#0F172A' }}>
                Đầu mối Liên hệ tại Doanh nghiệp ({dossier.contacts.length})
              </strong>
              {dossier.contacts.length === 0 ? (
                <div style={{ fontSize: '0.83rem', color: '#64748B' }}>Chưa có người liên hệ nào gắn với công ty này.</div>
              ) : (
                dossier.contacts.map((ct) => (
                  <div key={ct.id} style={{ padding: '10px 12px', borderRadius: 10, border: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <button
                        type="button"
                        onClick={() => openGlobalCustomerDrawer(ct)}
                        style={{ border: 'none', background: 'transparent', padding: 0, color: '#1E40FF', fontWeight: 800, fontSize: '0.85rem', cursor: 'pointer' }}
                      >
                        {ct.name}
                      </button>
                      <div style={{ fontSize: '0.76rem', color: '#64748B' }}>
                        {ct.job_title || 'Đại diện'} • {maskClientPiiFallback(ct.phone, canUnmask, 'phone')} •{' '}
                        {maskClientPiiFallback(ct.email, canUnmask, 'email')}
                      </div>
                    </div>
                    <span style={{ fontSize: '0.74rem', fontWeight: 700, color: '#059669' }}>
                      {formatCurrencyVnd(ct.total_revenue_vnd)}
                    </span>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'deals' && (
            <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 16, padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: 10 }}>
              <strong style={{ fontSize: '0.9rem', color: '#0F172A' }}>
                Cơ hội Kinh doanh B2B ({dossier.deals.length})
              </strong>
              {dossier.deals.length === 0 ? (
                <div style={{ fontSize: '0.83rem', color: '#64748B' }}>Chưa phát sinh cơ hội B2B.</div>
              ) : (
                dossier.deals.map((d) => (
                  <div key={d.id} style={{ padding: '10px 12px', borderRadius: 10, border: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <button
                        type="button"
                        onClick={() => openGlobalDealDrawer(d)}
                        style={{ border: 'none', background: 'transparent', padding: 0, color: '#1E40FF', fontWeight: 800, fontSize: '0.85rem', cursor: 'pointer' }}
                      >
                        {d.title}
                      </button>
                      <div style={{ fontSize: '0.75rem', color: '#64748B' }}>
                        {d.deal_code} • Xác suất: {d.probability}% • Phụ trách: {d.owner_name || '—'}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <strong style={{ fontSize: '0.85rem', color: '#0F172A' }}>{formatCurrencyVnd(d.amount_vnd)}</strong>
                      <div style={{ fontSize: '0.72rem', color: d.stage === 'won' ? '#059669' : '#1E40FF', fontWeight: 700 }}>
                        <CheckCircle2 size={11} style={{ verticalAlign: 'middle' }} /> {d.stage}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'commercial' && (
            <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 16, padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: 12 }}>
              <strong style={{ fontSize: '0.9rem', color: '#0F172A' }}>
                Tổng hợp Báo giá ({dossier.quotes.length}) • Đơn bán SO ({dossier.sales_orders.length}) • Hóa đơn ({dossier.invoices.length})
              </strong>
              {dossier.sales_orders.map((so) => (
                <div key={so.id} style={{ padding: '8px 12px', borderRadius: 10, background: '#F8FAFC', display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem' }}>
                  <span><strong>{so.order_code}</strong> • {so.status}</span>
                  <strong style={{ color: '#1E40FF' }}>{formatCurrencyVnd(so.total_vnd)}</strong>
                </div>
              ))}
              {dossier.quotes.map((q) => (
                <div key={q.id} style={{ padding: '8px 12px', borderRadius: 10, background: '#F8FAFC', display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem' }}>
                  <span><strong>{q.quote_code}</strong> • {q.title}</span>
                  <strong style={{ color: '#0F172A' }}>{formatCurrencyVnd(q.total_vnd)}</strong>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </DrawerShell>
  );
};

export default CompanyDrawer;
