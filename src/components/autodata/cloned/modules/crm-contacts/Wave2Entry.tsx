import React, { useCallback, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { Download, Layers, LayoutGrid, List, Lock, Plus, RefreshCw, Search, Tag, Users } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useEntitlement } from '../../contexts/EntitlementContext';
import { CrmContactsTabSkeleton, TableSkeleton } from '../../components/ui/Skeleton';
import { CustomerProfileDrawer } from '../../drawers/CustomerProfileDrawer';
import type { CrmCompanyRecord, CrmContactRecord, CrmPipelineStage, CrmStaffMember, CrmTagItem } from '../../drawers/crmTypes';
import { crmGet, crmMutate, formatCurrencyVnd, maskClientPiiFallback } from '../../drawers/crm360Api';
import { ContactsPersonaGrid, CreateContactModal, SaveAudienceModal } from './ContactsModalsAndGrid';
import { ContactsListViewTable } from './ContactsListViewTable';

interface ContactsDirectoryResponse {
  items: CrmContactRecord[];
  total: number;
  page: number;
  limit: number;
  can_unmask_phone: boolean;
  kpis: {
    total_contacts: number;
    hot_mql_sql: number;
    customers_count: number;
    uncontacted_count: number;
    total_revenue_vnd: number;
  };
  stages: CrmPipelineStage[];
  tags: CrmTagItem[];
  staff: CrmStaffMember[];
  companies: CrmCompanyRecord[];
}

export const CrmContactsPage: React.FC = () => {
  const { token, tenantSlug } = useAuth();
  const { can, terminology } = useEntitlement();
  const creds = useMemo(() => ({ token, tenantSlug }), [token, tenantSlug]);

  const [data, setData] = useState<ContactsDirectoryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [lifecycleFilter, setLifecycleFilter] = useState('');
  const [heatFilter, setHeatFilter] = useState('');
  const [tagFilter, setTagFilter] = useState('');
  const [ownerFilter, setOwnerFilter] = useState('');
  const [uncontactedOnly, setUncontactedOnly] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [activeContact, setActiveContact] = useState<CrmContactRecord | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAudienceModal, setShowAudienceModal] = useState(false);

  const canCreate = can('leads', 'create');
  const canEdit = can('leads', 'edit');
  const canExport = can('leads', 'export');
  const rbacUnmask = can('leads', 'unmask_phone');

  const loadContacts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await crmGet<ContactsDirectoryResponse>('/contacts', creds, {
        page,
        limit: 20,
        search: search.trim() || undefined,
        lifecycle_stage: lifecycleFilter || undefined,
        heat_tier: heatFilter || undefined,
        tag: tagFilter || undefined,
        owner_id: ownerFilter || undefined,
        uncontacted_only: uncontactedOnly ? 1 : undefined,
      });
      setData(res);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Không thể tải danh bạ khách hàng 360°');
    } finally {
      setLoading(false);
    }
  }, [
    creds,
    page,
    search,
    lifecycleFilter,
    heatFilter,
    tagFilter,
    ownerFilter,
    uncontactedOnly,
  ]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadContacts();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [loadContacts]);

  const effectiveUnmask = Boolean(rbacUnmask && (data?.can_unmask_phone ?? true));

  const handleBulkTag = async () => {
    const tag = window.prompt('Nhập tên Tag muốn gắn hàng loạt:');
    if (!tag || !tag.trim()) return;
    try {
      await crmMutate('/contacts/bulk', 'POST', creds, {
        action: 'add_tag',
        contact_ids: selectedIds,
        tag_name: tag.trim(),
      });
      toast.success(`Đã gắn Tag #${tag.trim()} cho ${selectedIds.length} hồ sơ`);
      setSelectedIds([]);
      await loadContacts();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Không thể gắn Tag hàng loạt');
    }
  };

  const handleExportCsv = () => {
    if (!data?.items.length) return;
    const header = ['Họ tên', 'SĐT', 'Email', 'Lifecycle', 'Điểm', 'Công ty', 'Doanh thu VND'];
    const rows = data.items.map((c) => [
      `"${(c.name || '').replace(/"/g, '""')}"`,
      `"${maskClientPiiFallback(c.phone, effectiveUnmask, 'phone')}"`,
      `"${maskClientPiiFallback(c.email, effectiveUnmask, 'email')}"`,
      c.lifecycle_stage || 'lead',
      String(c.lead_score || 0),
      `"${(c.company_name || '').replace(/"/g, '""')}"`,
      String(c.total_revenue_vnd || 0),
    ]);
    const csv = '\uFEFF' + [header.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `contacts-360-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading && !data) {
    return <CrmContactsTabSkeleton />;
  }

  const items = data?.items || [];
  const kpis = data?.kpis;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
      {/* Header & Primary Actions */}
      <div
        style={{
          background: '#FFFFFF',
          border: '1px solid #E2E8F0',
          borderRadius: 16,
          padding: '1.15rem 1.35rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          flexWrap: 'wrap',
        }}
      >
        <div>
          <h1 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: '#0F172A', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Users size={20} color="#1E40FF" /> Danh bạ {terminology.customerLabel || 'Khách hàng'} 360°
            {!effectiveUnmask && (
              <span style={{ fontSize: '0.72rem', padding: '2px 9px', borderRadius: 999, background: '#EFF6FF', color: '#1E40FF', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                <Lock size={11} /> Bảo vệ PII đang bật
              </span>
            )}
          </h1>
          <p style={{ margin: '4px 0 0', fontSize: '0.82rem', color: '#64748B' }}>
            Hợp nhất Master Contact 360° xuyên suốt Phễu Sale, Tệp Logic Marketing, Multi-Deals & Tài chính
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() => void loadContacts()}
            style={{ height: 44, padding: '0 12px', borderRadius: 10, border: '1px solid #E2E8F0', background: '#FFFFFF', color: '#475569', fontWeight: 700, fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}
          >
            <RefreshCw size={15} /> Làm mới
          </button>
          {canExport && (
            <button
              type="button"
              onClick={handleExportCsv}
              style={{ height: 44, padding: '0 14px', borderRadius: 10, border: '1px solid #E2E8F0', background: '#FFFFFF', color: '#0F172A', fontWeight: 700, fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}
            >
              <Download size={15} /> Xuất CSV
            </button>
          )}
          {canCreate && (
            <button
              type="button"
              onClick={() => setShowCreateModal(true)}
              style={{ height: 44, padding: '0 1.2rem', borderRadius: 10, border: 'none', background: '#1E40FF', color: '#FFFFFF', fontWeight: 700, fontSize: '0.83rem', display: 'inline-flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}
            >
              <Plus size={16} /> Thêm {terminology.customerLabel || 'Khách hàng'}
            </button>
          )}
        </div>
      </div>

      {/* Persona Overview KPI Deck */}
      {kpis && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.9rem' }}>
          {[
            { label: 'Tổng Hồ sơ 360°', value: kpis.total_contacts.toLocaleString('vi-VN'), color: '#0F172A' },
            { label: 'MQL / SQL Nóng', value: kpis.hot_mql_sql.toLocaleString('vi-VN'), color: '#1E40FF' },
            { label: 'Khách hàng Đã mua', value: kpis.customers_count.toLocaleString('vi-VN'), color: '#059669' },
            { label: 'Chưa tương tác (Cần gọi)', value: kpis.uncontacted_count.toLocaleString('vi-VN'), color: '#D97706' },
            { label: 'Doanh thu Lũy kế', value: formatCurrencyVnd(kpis.total_revenue_vnd), color: '#1E40FF' },
          ].map((k) => (
            <div key={k.label} style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 14, padding: '1rem 1.15rem' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748B' }}>{k.label}</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: k.color, marginTop: 4 }}>{k.value}</div>
            </div>
          ))}
        </div>
      )}

      {/* Multi-Filter Bar */}
      <div
        style={{
          background: '#FFFFFF',
          border: '1px solid #E2E8F0',
          borderRadius: 14,
          padding: '0.85rem 1rem',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          flexWrap: 'wrap',
        }}
      >
        <div style={{ position: 'relative', flex: '1 1 240px' }}>
          <Search size={15} color="#64748B" style={{ position: 'absolute', left: 12, top: 14 }} />
          <input
            placeholder="Tìm theo tên, SĐT, email, sản phẩm, công ty..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            style={{ width: '100%', height: 44, borderRadius: 10, border: '1px solid #E2E8F0', padding: '0 12px 0 36px', fontSize: '0.84rem' }}
          />
        </div>

        <select value={lifecycleFilter} onChange={(e) => { setLifecycleFilter(e.target.value); setPage(1); }} style={{ height: 44, borderRadius: 10, border: '1px solid #E2E8F0', padding: '0 10px', fontSize: '0.82rem', background: '#FFFFFF' }}>
          <option value="">Tất cả Vòng đời</option>
          <option value="lead">Lead mới</option>
          <option value="mql">MQL</option>
          <option value="sql">SQL</option>
          <option value="opportunity">Cơ hội</option>
          <option value="customer">Khách hàng</option>
        </select>

        <select value={heatFilter} onChange={(e) => { setHeatFilter(e.target.value); setPage(1); }} style={{ height: 44, borderRadius: 10, border: '1px solid #E2E8F0', padding: '0 10px', fontSize: '0.82rem', background: '#FFFFFF' }}>
          <option value="">Mọi độ nóng</option>
          <option value="hot">Nóng (&gt;=75đ)</option>
          <option value="warm">Ấm (45-74đ)</option>
          <option value="cold">Tiềm năng (&lt;45đ)</option>
        </select>

        <select value={tagFilter} onChange={(e) => { setTagFilter(e.target.value); setPage(1); }} style={{ height: 44, borderRadius: 10, border: '1px solid #E2E8F0', padding: '0 10px', fontSize: '0.82rem', background: '#FFFFFF' }}>
          <option value="">Tất cả Tags</option>
          {(data?.tags || []).map((t) => (
            <option key={t.id} value={t.name}>
              #{t.name}
            </option>
          ))}
        </select>

        <select value={ownerFilter} onChange={(e) => { setOwnerFilter(e.target.value); setPage(1); }} style={{ height: 44, borderRadius: 10, border: '1px solid #E2E8F0', padding: '0 10px', fontSize: '0.82rem', background: '#FFFFFF' }}>
          <option value="">Mọi Phụ trách</option>
          {(data?.staff || []).map((s) => (
            <option key={s.id} value={s.id}>
              {s.full_name}
            </option>
          ))}
        </select>

        <button
          type="button"
          onClick={() => { setUncontactedOnly((v) => !v); setPage(1); }}
          style={{
            height: 44,
            padding: '0 12px',
            borderRadius: 10,
            border: uncontactedOnly ? '1px solid #1E40FF' : '1px solid #E2E8F0',
            background: uncontactedOnly ? '#EFF6FF' : '#FFFFFF',
            color: uncontactedOnly ? '#1E40FF' : '#475569',
            fontWeight: 700,
            fontSize: '0.8rem',
            cursor: 'pointer',
          }}
        >
          Chưa liên hệ
        </button>

        <div style={{ display: 'inline-flex', border: '1px solid #E2E8F0', borderRadius: 10, overflow: 'hidden' }}>
          <button
            type="button"
            onClick={() => setViewMode('list')}
            style={{ width: 42, height: 42, border: 'none', background: viewMode === 'list' ? '#EFF6FF' : '#FFFFFF', color: viewMode === 'list' ? '#1E40FF' : '#64748B', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <List size={16} />
          </button>
          <button
            type="button"
            onClick={() => setViewMode('grid')}
            style={{ width: 42, height: 42, border: 'none', background: viewMode === 'grid' ? '#EFF6FF' : '#FFFFFF', color: viewMode === 'grid' ? '#1E40FF' : '#64748B', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <LayoutGrid size={16} />
          </button>
        </div>
      </div>

      {/* Bulk Toolbar */}
      {selectedIds.length > 0 && canEdit && (
        <div
          style={{
            background: '#EFF6FF',
            border: '1px solid #DBEAFE',
            borderRadius: 12,
            padding: '0.7rem 1rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 10,
            flexWrap: 'wrap',
          }}
        >
          <strong style={{ fontSize: '0.84rem', color: '#1E3A8A' }}>
            Đang chọn {selectedIds.length} khách hàng
          </strong>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              type="button"
              onClick={() => void handleBulkTag()}
              style={{ height: 38, padding: '0 12px', borderRadius: 8, border: '1px solid #DBEAFE', background: '#FFFFFF', color: '#1E40FF', fontWeight: 700, fontSize: '0.79rem', display: 'inline-flex', alignItems: 'center', gap: 5, cursor: 'pointer' }}
            >
              <Tag size={14} /> Gắn Tag hàng loạt
            </button>
            <button
              type="button"
              onClick={() => setShowAudienceModal(true)}
              style={{ height: 38, padding: '0 12px', borderRadius: 8, border: 'none', background: '#1E40FF', color: '#FFFFFF', fontWeight: 700, fontSize: '0.79rem', display: 'inline-flex', alignItems: 'center', gap: 5, cursor: 'pointer' }}
            >
              <Layers size={14} /> Đóng gói vào Tệp Data
            </button>
          </div>
        </div>
      )}

      {/* Main Content */}
      {loading ? (
        <TableSkeleton rows={6} cols={6} />
      ) : viewMode === 'grid' ? (
        <ContactsPersonaGrid
          items={items}
          canUnmaskPhone={effectiveUnmask}
          onOpenContact={(c) => setActiveContact(c)}
        />
      ) : (
        <ContactsListViewTable
          items={items}
          selectedIds={selectedIds}
          onChangeSelectedIds={setSelectedIds}
          effectiveUnmask={effectiveUnmask}
          onSelectContact={(c) => setActiveContact(c)}
        />
      )}

      <CreateContactModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        companies={data?.companies || []}
        staff={data?.staff || []}
        creds={creds}
        onCreated={(created) => {
          void loadContacts();
          setActiveContact(created);
        }}
      />

      <SaveAudienceModal
        isOpen={showAudienceModal}
        onClose={() => setShowAudienceModal(false)}
        selectedIds={selectedIds}
        creds={creds}
        onDone={() => setSelectedIds([])}
      />

      {activeContact && (
        <CustomerProfileDrawer
          isOpen={Boolean(activeContact)}
          contact={activeContact}
          onClose={() => setActiveContact(null)}
          onUpdate={() => void loadContacts()}
        />
      )}
    </div>
  );
};

export default CrmContactsPage;
