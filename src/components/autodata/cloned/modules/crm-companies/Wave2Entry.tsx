import React, { useCallback, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import {
  Building2,
  GitBranch,
  LayoutGrid,
  List,
  Plus,
  RefreshCw,
  Search,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useEntitlement } from '../../contexts/EntitlementContext';
import { FinancialOpsTabSkeleton, TableSkeleton } from '../../components/ui/Skeleton';
import { CompanyDrawer } from '../../drawers/CompanyDrawer';
import type { CrmCompanyRecord } from '../../drawers/crmTypes';
import { crmGet, formatCurrencyVnd } from '../../drawers/crm360Api';
import {
  CompaniesCardGrid,
  CompaniesHierarchyTree,
  CreateCompanyModal,
} from './CompaniesViews';

interface CompaniesResponse {
  items: CrmCompanyRecord[];
  total: number;
  kpis: {
    total_companies: number;
    enterprise_gold_count: number;
    subsidiaries_total: number;
    linked_contacts_total: number;
    total_won_revenue_vnd: number;
    total_pipeline_vnd: number;
  };
}

export const CrmCompaniesPage: React.FC = () => {
  const { token, tenantSlug } = useAuth();
  const { can } = useEntitlement();
  const creds = useMemo(() => ({ token, tenantSlug }), [token, tenantSlug]);

  const [data, setData] = useState<CompaniesResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [tierFilter, setTierFilter] = useState('');
  const [hierarchyFilter, setHierarchyFilter] = useState('');
  const [viewMode, setViewMode] = useState<'card' | 'list' | 'tree'>('card');

  const [activeCompany, setActiveCompany] = useState<CrmCompanyRecord | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const canCreate = can('companies', 'create') || can('crm_b2b', 'create');

  const loadCompanies = useCallback(async () => {
    setLoading(true);
    try {
      const res = await crmGet<CompaniesResponse>('/companies', creds, {
        search: search.trim() || undefined,
        tier: tierFilter || undefined,
        hierarchy: hierarchyFilter || undefined,
      });
      setData(res);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Không thể tải danh sách doanh nghiệp B2B');
    } finally {
      setLoading(false);
    }
  }, [creds, search, tierFilter, hierarchyFilter]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadCompanies();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [loadCompanies]);

  if (loading && !data) {
    return <FinancialOpsTabSkeleton isCardGrid />;
  }

  const items = data?.items || [];
  const kpis = data?.kpis;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
      {/* Header */}
      <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 16, padding: '1.15rem 1.35rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: '#0F172A', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Building2 size={20} color="#1E40FF" /> Doanh nghiệp B2B, Đối tác & Cấu trúc Tập đoàn
          </h1>
          <p style={{ margin: '4px 0 0', fontSize: '0.82rem', color: '#64748B' }}>
            Quản trị cây Công ty Mẹ / Công ty Con, tra cứu MST pháp nhân, hạng SLA & cộng dồn doanh thu Multi-Deals
          </p>
        </div>

        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <div style={{ display: 'inline-flex', border: '1px solid #E2E8F0', borderRadius: 10, overflow: 'hidden' }}>
            <button type="button" onClick={() => setViewMode('card')} style={{ height: 42, padding: '0 10px', border: 'none', background: viewMode === 'card' ? '#EFF6FF' : '#FFFFFF', color: viewMode === 'card' ? '#1E40FF' : '#64748B', fontWeight: 700, fontSize: '0.78rem', display: 'inline-flex', alignItems: 'center', gap: 4, cursor: 'pointer' }}>
              <LayoutGrid size={14} /> Thẻ
            </button>
            <button type="button" onClick={() => setViewMode('list')} style={{ height: 42, padding: '0 10px', border: 'none', background: viewMode === 'list' ? '#EFF6FF' : '#FFFFFF', color: viewMode === 'list' ? '#1E40FF' : '#64748B', fontWeight: 700, fontSize: '0.78rem', display: 'inline-flex', alignItems: 'center', gap: 4, cursor: 'pointer' }}>
              <List size={14} /> Bảng
            </button>
            <button type="button" onClick={() => setViewMode('tree')} style={{ height: 42, padding: '0 10px', border: 'none', background: viewMode === 'tree' ? '#EFF6FF' : '#FFFFFF', color: viewMode === 'tree' ? '#1E40FF' : '#64748B', fontWeight: 700, fontSize: '0.78rem', display: 'inline-flex', alignItems: 'center', gap: 4, cursor: 'pointer' }}>
              <GitBranch size={14} /> Cây Tập đoàn
            </button>
          </div>

          <button type="button" onClick={() => void loadCompanies()} style={{ height: 44, padding: '0 12px', borderRadius: 10, border: '1px solid #E2E8F0', background: '#FFFFFF', color: '#475569', cursor: 'pointer', display: 'inline-flex', alignItems: 'center' }}>
            <RefreshCw size={15} />
          </button>

          {canCreate && (
            <button type="button" onClick={() => setShowCreateModal(true)} style={{ height: 44, padding: '0 1.2rem', borderRadius: 10, border: 'none', background: '#1E40FF', color: '#FFFFFF', fontWeight: 700, fontSize: '0.83rem', display: 'inline-flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
              <Plus size={16} /> Thêm Doanh nghiệp
            </button>
          )}
        </div>
      </div>

      {/* Rollup KPIs */}
      {kpis && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.9rem' }}>
          {[
            { label: 'Tổng Pháp nhân B2B', value: String(kpis.total_companies), color: '#0F172A' },
            { label: 'Enterprise & Gold SLA', value: String(kpis.enterprise_gold_count), color: '#1E40FF' },
            { label: 'Công ty con trực thuộc', value: String(kpis.subsidiaries_total), color: '#7C3AED' },
            { label: 'Người liên hệ gắn kết', value: String(kpis.linked_contacts_total), color: '#0284C7' },
            { label: 'Doanh thu B2B đã chốt', value: formatCurrencyVnd(kpis.total_won_revenue_vnd), color: '#059669' },
          ].map((k) => (
            <div key={k.label} style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 14, padding: '1rem 1.15rem' }}>
              <div style={{ fontSize: '0.74rem', fontWeight: 700, color: '#64748B' }}>{k.label}</div>
              <div style={{ fontSize: '1.2rem', fontWeight: 800, color: k.color, marginTop: 4 }}>{k.value}</div>
            </div>
          ))}
        </div>
      )}

      {/* Filter Bar */}
      <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 14, padding: '0.75rem 1rem', display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: '1 1 240px' }}>
          <Search size={15} color="#64748B" style={{ position: 'absolute', left: 12, top: 14 }} />
          <input
            placeholder="Tìm theo tên pháp nhân, mã số thuế MST, người đại diện..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: '100%', height: 44, borderRadius: 10, border: '1px solid #E2E8F0', padding: '0 12px 0 36px', fontSize: '0.84rem' }}
          />
        </div>
        <select value={tierFilter} onChange={(e) => setTierFilter(e.target.value)} style={{ height: 44, borderRadius: 10, border: '1px solid #E2E8F0', padding: '0 12px', fontSize: '0.82rem', background: '#FFFFFF' }}>
          <option value="">Tất cả Hạng SLA</option>
          <option value="enterprise">Enterprise VIP</option>
          <option value="gold">Gold Account</option>
          <option value="silver">Silver Partner</option>
          <option value="standard">Standard</option>
        </select>
        <select value={hierarchyFilter} onChange={(e) => setHierarchyFilter(e.target.value)} style={{ height: 44, borderRadius: 10, border: '1px solid #E2E8F0', padding: '0 12px', fontSize: '0.82rem', background: '#FFFFFF' }}>
          <option value="">Mọi cấp Tập đoàn</option>
          <option value="parent_only">Chỉ Công ty Mẹ / Độc lập</option>
          <option value="subsidiaries">Chỉ Công ty Con</option>
        </select>
      </div>

      {/* Views */}
      {loading ? (
        <TableSkeleton rows={5} cols={5} />
      ) : viewMode === 'card' ? (
        <CompaniesCardGrid items={items} onSelect={(c) => setActiveCompany(c)} />
      ) : viewMode === 'tree' ? (
        <CompaniesHierarchyTree items={items} onSelect={(c) => setActiveCompany(c)} />
      ) : (
        <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 16, overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.84rem' }}>
            <thead>
              <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', textAlign: 'left', color: '#475569' }}>
                <th style={{ padding: '12px 14px' }}>Pháp nhân & MST</th>
                <th style={{ padding: '12px 14px' }}>Cấu trúc B2B</th>
                <th style={{ padding: '12px 14px' }}>Hạng SLA</th>
                <th style={{ padding: '12px 14px' }}>Liên hệ & Deals</th>
                <th style={{ padding: '12px 14px' }}>Doanh thu Rollup</th>
              </tr>
            </thead>
            <tbody>
              {items.map((c) => (
                <tr key={c.id} onClick={() => setActiveCompany(c)} style={{ borderBottom: '1px solid #F1F5F9', cursor: 'pointer' }}>
                  <td style={{ padding: '12px 14px' }}>
                    <div style={{ fontWeight: 800, color: '#0F172A' }}>{c.name}</div>
                    <div style={{ fontSize: '0.74rem', color: '#64748B' }}>{c.code} • MST: {c.tax_code || '—'}</div>
                  </td>
                  <td style={{ padding: '12px 14px', color: '#334155' }}>
                    {c.parent_company_name ? `Thuộc: ${c.parent_company_name}` : `Tập đoàn (${c.subsidiaries_count || 0} con)`}
                  </td>
                  <td style={{ padding: '12px 14px' }}>
                    <span style={{ fontSize: '0.72rem', fontWeight: 800, padding: '2px 8px', borderRadius: 999, background: '#EFF6FF', color: '#1E40FF', textTransform: 'uppercase' }}>
                      {c.tier}
                    </span>
                  </td>
                  <td style={{ padding: '12px 14px', color: '#475569' }}>
                    {c.contact_count || 0} contacts • {c.deal_count || 0} deals
                  </td>
                  <td style={{ padding: '12px 14px', fontWeight: 800, color: '#059669' }}>
                    {formatCurrencyVnd(c.won_revenue_vnd || 0)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <CreateCompanyModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        companies={items}
        creds={creds}
        onCreated={(created) => {
          void loadCompanies();
          setActiveCompany(created);
        }}
      />

      {activeCompany && (
        <CompanyDrawer
          isOpen={Boolean(activeCompany)}
          company={activeCompany}
          allCompanies={items}
          onClose={() => setActiveCompany(null)}
          onSaved={() => void loadCompanies()}
        />
      )}
    </div>
  );
};

export default CrmCompaniesPage;
