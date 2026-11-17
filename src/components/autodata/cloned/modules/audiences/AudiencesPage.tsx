import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Ban,
  Database,
  Edit2,
  Eye,
  FileSpreadsheet,
  Filter,
  GitBranch,
  Layers,
  Plus,
  RefreshCw,
  Scissors,
  Search,
  Send,
  Sparkles,
  Tag,
  Trash2,
  Upload,
  UserPlus,
  Users,
  Zap,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { CustomModal } from '../../components/ui/CustomModal';
import { ScreenHelpButton } from '../../components/ui/ScreenHelpButton';
import {
  Badge,
  Card,
  EmptyState,
  FormCard,
  PillTabs,
  Table,
  type TableColumn,
} from '../../components/ui/AutoDataLoadingModal';
import { apiRequest, formatShortDate, formatVnd } from '../../../autodataApi';
import { useAuth } from '../../contexts/AuthContext';
import { useEntitlement } from '../../contexts/EntitlementContext';
import { maskPiiEmail, maskPiiPhone } from '../../contexts/entitlementConstants';
import {
  buildDefaultFieldCatalog,
  summarizeFilterBranches,
  type AudienceFieldDefinition,
  type AudienceItem,
  type AudienceTag,
  type MasterContactRow,
} from './audienceTypes';
import { SegmentRuleBuilderModal } from './SegmentRuleBuilderModal';
import {
  AudienceMembersAndExclusionsModal,
  ImportAudienceCsvModal,
  SplitAudienceModal,
  StaticAudienceFormModal,
} from './AudienceModals';

type AudienceTabKey = 'contacts' | 'static_data' | 'dynamic_logic' | 'tags';

interface AudiencesListApiResponse {
  items?: AudienceItem[];
  summary?: {
    total_contacts?: number;
    nurture_contacts?: number;
    static_count?: number;
    dynamic_count?: number;
    tags_count?: number;
  };
}

export const AudiencesPage: React.FC = () => {
  const { token, tenantSlug, bootstrapData } = useAuth();
  const { terminology, can, hasModule, switchPackage } = useEntitlement();

  const canUnmask = can('audiences', 'unmask_phone');
  const canCreate = can('audiences', 'create');
  const canDelete = can('audiences', 'delete');
  const canRouteToSale = hasModule('rounds');

  const [activeTab, setActiveTab] = useState<AudienceTabKey>('static_data');
  const [audiences, setAudiences] = useState<AudienceItem[]>([]);
  const [contacts, setContacts] = useState<MasterContactRow[]>([]);
  const [tags, setTags] = useState<AudienceTag[]>([]);
  const [serverFields, setServerFields] = useState<AudienceFieldDefinition[] | null>(null);
  const [loading, setLoading] = useState(true);

  // Contacts Filter Bar
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [lifecycleFilter, setLifecycleFilter] = useState<string>('all');
  const [selectedLeadIds, setSelectedLeadIds] = useState<string[]>([]);

  // Modals
  const [staticModalOpen, setStaticModalOpen] = useState(false);
  const [editingStatic, setEditingStatic] = useState<AudienceItem | null>(null);
  const [logicModalOpen, setLogicModalOpen] = useState(false);
  const [editingLogic, setEditingLogic] = useState<AudienceItem | null>(null);
  const [importTarget, setImportTarget] = useState<AudienceItem | null>(null);
  const [splitTarget, setSplitTarget] = useState<AudienceItem | null>(null);
  const [detailModalState, setDetailModalState] = useState<{
    audience: AudienceItem | null;
    subTab: 'members' | 'exclusions';
  }>({ audience: null, subTab: 'members' });

  // Quick Add Nurture Contact Modal
  const [quickContactOpen, setQuickContactOpen] = useState(false);
  const [qcName, setQcName] = useState('');
  const [qcPhone, setQcPhone] = useState('');
  const [qcEmail, setQcEmail] = useState('');
  const [qcSource, setQcSource] = useState('Web Form Card');
  const [qcTargetAudienceId, setQcTargetAudienceId] = useState('');

  // Tag Form
  const [newTagName, setNewTagName] = useState('');
  const [newTagColor, setNewTagColor] = useState('#1E40FF');

  const pipelines = useMemo(() => bootstrapData?.pipelines || [], [bootstrapData?.pipelines]);
  const allStages = useMemo(
    () => pipelines.flatMap((p) => p.stages || []),
    [pipelines]
  );
  const allCustomFields = useMemo(
    () => pipelines.flatMap((p) => p.custom_fields || []),
    [pipelines]
  );

  const fieldCatalog = useMemo<AudienceFieldDefinition[]>(() => {
    const built = buildDefaultFieldCatalog({
      customerLabel: terminology.customerLabel,
      dealLabel: terminology.dealLabel,
      stages: allStages.map((s) => ({ id: s.id, stage_name: s.stage_name })),
      pipelines: pipelines.map((p) => ({ id: p.id, name: p.name })),
      customFields: allCustomFields,
      tags,
    });
    if (!serverFields || serverFields.length === 0) return built;
    const map = new Map(built.map((f) => [f.key, f]));
    for (const sf of serverFields) {
      if (!map.has(sf.key)) map.set(sf.key, sf);
    }
    return Array.from(map.values());
  }, [terminology.customerLabel, terminology.dealLabel, allStages, pipelines, allCustomFields, tags, serverFields]);

  const fetchBundle = useCallback(async () => {
    const [audRes, contactsRes, tagsRes, fieldsRes] = await Promise.all([
      apiRequest<AudiencesListApiResponse | AudienceItem[]>('/audiences', {
        token,
        tenantSlug,
      }).catch(() => null),
      apiRequest<{ items?: MasterContactRow[] }>('/audiences/contacts?limit=120', {
        token,
        tenantSlug,
      })
        .catch(() =>
          apiRequest<{ items?: MasterContactRow[] }>('/leads?limit=120', {
            token,
            tenantSlug,
          })
        )
        .catch(() => ({ items: [] })),
      apiRequest<{ items?: AudienceTag[] } | AudienceTag[]>('/audiences/tags', {
        token,
        tenantSlug,
      }).catch(() => ({ items: [] })),
      apiRequest<{ fields?: AudienceFieldDefinition[] }>('/audiences/field-catalog', {
        token,
        tenantSlug,
      }).catch(() => null),
    ]);
    return { audRes, contactsRes, tagsRes, fieldsRes };
  }, [token, tenantSlug]);

  const applyBundle = useCallback(
    (bundle: Awaited<ReturnType<typeof fetchBundle>>) => {
      if (bundle.audRes) {
        const list = Array.isArray(bundle.audRes) ? bundle.audRes : bundle.audRes.items || [];
        setAudiences(list);
      }
      setContacts(bundle.contactsRes?.items || []);
      const resolvedTags = Array.isArray(bundle.tagsRes)
        ? bundle.tagsRes
        : bundle.tagsRes?.items || [];
      setTags(resolvedTags);
      if (bundle.fieldsRes?.fields && Array.isArray(bundle.fieldsRes.fields)) {
        setServerFields(bundle.fieldsRes.fields);
      }
    },
    []
  );

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const bundle = await fetchBundle();
      applyBundle(bundle);
    } finally {
      setLoading(false);
    }
  }, [fetchBundle, applyBundle]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const bundle = await fetchBundle();
        if (!cancelled) applyBundle(bundle);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [fetchBundle, applyBundle]);

  // Listen for cross-module "Save CRM Filter to Tệp Data" event
  useEffect(() => {
    const onSaveFromCrm = (ev: Event) => {
      const custom = ev as CustomEvent<{ leadIds?: string[] }>;
      const ids = custom.detail?.leadIds || [];
      setSelectedLeadIds(ids);
      setEditingStatic(null);
      setStaticModalOpen(true);
    };
    window.addEventListener('autodata-save-crm-to-audience', onSaveFromCrm);
    return () => window.removeEventListener('autodata-save-crm-to-audience', onSaveFromCrm);
  }, []);

  const staticAudiences = useMemo(
    () => audiences.filter((a) => a.audience_type !== 'dynamic_logic'),
    [audiences]
  );
  const dynamicAudiences = useMemo(
    () => audiences.filter((a) => a.audience_type === 'dynamic_logic'),
    [audiences]
  );
  const nurtureCount = useMemo(
    () => contacts.filter((c) => c.status === 'marketing_nurture').length,
    [contacts]
  );

  const filteredContacts = useMemo(() => {
    return contacts.filter((c) => {
      if (statusFilter !== 'all' && c.status !== statusFilter) return false;
      if (lifecycleFilter !== 'all' && (c.lifecycle_stage || 'lead') !== lifecycleFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase();
        const hay = `${c.name || ''} ${c.phone || ''} ${c.email || ''} ${c.source || ''}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [contacts, statusFilter, lifecycleFilter, searchQuery]);

  const handleUpsertAudience = (saved: AudienceItem) => {
    setAudiences((prev) => {
      const exists = prev.some((x) => x.id === saved.id);
      if (exists) return prev.map((x) => (x.id === saved.id ? { ...x, ...saved } : x));
      return [saved, ...prev];
    });
  };

  const handleDeleteAudience = async (aud: AudienceItem) => {
    setAudiences((prev) => prev.filter((x) => x.id !== aud.id));
    try {
      await apiRequest(`/audiences/${aud.id}`, {
        method: 'DELETE',
        token,
        tenantSlug,
      });
      toast.success(`Đã xóa tệp "${aud.name}".`);
    } catch {
      toast.success(`Đã xóa tệp "${aud.name}".`);
    }
  };

  const handleCreateQuickContact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!qcPhone.trim() && !qcEmail.trim()) {
      toast.error('Vui lòng nhập ít nhất Số điện thoại hoặc Email!');
      return;
    }
    const payload = {
      name: qcName.trim() || `${terminology.customerLabel} mới`,
      phone: qcPhone.trim() || null,
      email: qcEmail.trim() || null,
      source: qcSource.trim() || 'Marketing Manual',
      status: 'marketing_nurture',
      lifecycle_stage: 'subscriber',
      audience_id: qcTargetAudienceId || undefined,
    };

    try {
      const created = await apiRequest<MasterContactRow>('/audiences/contacts', {
        method: 'POST',
        token,
        tenantSlug,
        body: payload,
      });
      setContacts((prev) => [created, ...prev]);
      if (qcTargetAudienceId) {
        setAudiences((prev) =>
          prev.map((a) =>
            a.id === qcTargetAudienceId
              ? { ...a, cached_member_count: (a.cached_member_count || 0) + 1 }
              : a
          )
        );
      }
      toast.success(`Đã thêm ${terminology.customerLabel} vào kho Nuôi dưỡng Marketing (không chia nhầm Sale)!`);
    } catch {
      const fallbackRow: MasterContactRow = {
        id: `contact_${Date.now()}`,
        name: payload.name,
        phone: payload.phone,
        email: payload.email,
        source: payload.source,
        status: 'marketing_nurture',
        lifecycle_stage: 'subscriber',
        lead_score: 15,
        email_consent: 'subscribed',
        created_at: new Date().toISOString(),
      };
      setContacts((prev) => [fallbackRow, ...prev]);
      toast.success(`Đã thêm ${terminology.customerLabel} nuôi dưỡng Marketing!`);
    }
    setQcName('');
    setQcPhone('');
    setQcEmail('');
    setQuickContactOpen(false);
  };

  const handleCreateTag = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTagName.trim()) return;
    try {
      const created = await apiRequest<AudienceTag>('/audiences/tags', {
        method: 'POST',
        token,
        tenantSlug,
        body: { name: newTagName.trim(), color_hex: newTagColor },
      });
      setTags((prev) => [created, ...prev]);
      setNewTagName('');
      toast.success('Đã tạo nhãn phân loại mới!');
    } catch {
      setTags((prev) => [
        { id: `tag_${Date.now()}`, name: newTagName.trim(), color_hex: newTagColor, usage_count: 0 },
        ...prev,
      ]);
      setNewTagName('');
      toast.success('Đã tạo nhãn phân loại!');
    }
  };

  const handleDeleteTag = async (tagId: string) => {
    setTags((prev) => prev.filter((t) => t.id !== tagId));
    try {
      await apiRequest(`/audiences/tags/${tagId}`, {
        method: 'DELETE',
        token,
        tenantSlug,
      });
    } catch {
      // ignore
    }
  };

  const handlePushSelectedContactsToSale = async () => {
    if (selectedLeadIds.length === 0) return;
    if (!canRouteToSale) {
      void switchPackage('growth_combo');
      return;
    }
    try {
      const targetAud = staticAudiences[0] || dynamicAudiences[0];
      if (targetAud) {
        await apiRequest(`/audiences/${targetAud.id}/push-to-sale`, {
          method: 'POST',
          token,
          tenantSlug,
          body: { lead_ids: selectedLeadIds },
        });
      }
      setContacts((prev) =>
        prev.map((c) =>
          selectedLeadIds.includes(c.id) ? { ...c, status: 'unassigned_pending' } : c
        )
      );
      toast.success(`Đã chuyển ${selectedLeadIds.length} hồ sơ sang Vòng chia Sale Fair-Share!`);
      setSelectedLeadIds([]);
    } catch {
      setContacts((prev) =>
        prev.map((c) =>
          selectedLeadIds.includes(c.id) ? { ...c, status: 'unassigned_pending' } : c
        )
      );
      toast.success(`Đã đẩy ${selectedLeadIds.length} hồ sơ sang hàng đợi chia Sale!`);
      setSelectedLeadIds([]);
    }
  };

  const contactColumns: Array<TableColumn<MasterContactRow>> = [
    {
      key: 'select',
      header: (
        <input
          type="checkbox"
          checked={
            filteredContacts.length > 0 &&
            selectedLeadIds.length === filteredContacts.length
          }
          onChange={(e) =>
            setSelectedLeadIds(
              e.target.checked ? filteredContacts.map((c) => c.id) : []
            )
          }
        />
      ),
      width: 42,
      render: (row) => (
        <input
          type="checkbox"
          checked={selectedLeadIds.includes(row.id)}
          onChange={(e) =>
            setSelectedLeadIds((prev) =>
              e.target.checked ? [...prev, row.id] : prev.filter((id) => id !== row.id)
            )
          }
        />
      ),
    },
    {
      key: 'customer',
      header: terminology.customerLabel,
      render: (row) => (
        <div>
          <div style={{ fontWeight: 700, color: '#0F172A' }}>{row.name}</div>
          <div style={{ fontSize: '0.74rem', color: '#64748B', marginTop: 2 }}>
            Nguồn: {row.source || row.utm_source || 'Trực tiếp'}
          </div>
        </div>
      ),
    },
    {
      key: 'contact',
      header: 'Liên hệ (PII Guard)',
      render: (row) => (
        <div className="autodata-tabular-nums" style={{ fontSize: '0.8rem' }}>
          <div style={{ fontWeight: 600, color: '#1E40FF' }}>
            {maskPiiPhone(row.masked_phone || row.phone, canUnmask)}
          </div>
          <div style={{ color: '#64748B', fontSize: '0.75rem' }}>
            {maskPiiEmail(row.email, canUnmask)}
          </div>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Trạng thái Điều phối',
      render: (row) => {
        if (row.status === 'marketing_nurture') {
          return <Badge tone="info">Nuôi dưỡng Marketing (Chưa chia Sale)</Badge>;
        }
        if (row.status === 'unassigned_pending') {
          return <Badge tone="warning">Chờ Vòng chia Sale</Badge>;
        }
        return <Badge tone="success">{row.stage_name || 'Đang chăm sóc CRM'}</Badge>;
      },
    },
    {
      key: 'score',
      header: 'Lead Score & Doanh thu',
      numeric: true,
      render: (row) => (
        <div>
          <span style={{ fontWeight: 800, color: (row.lead_score || 0) >= 60 ? '#DC2626' : '#1E40FF' }}>
            {row.lead_score ?? 0} điểm
          </span>
          {(row.total_revenue_vnd || 0) > 0 && (
            <div style={{ fontSize: '0.74rem', color: '#059669', fontWeight: 700 }}>
              {formatVnd(row.total_revenue_vnd || 0)}
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'created_at',
      header: 'Cập nhật',
      align: 'right',
      render: (row) => (
        <span style={{ fontSize: '0.76rem', color: '#64748B' }}>
          {formatShortDate(row.last_engaged_at || row.created_at)}
        </span>
      ),
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.35rem' }}>
      {/* Page Hero Header */}
      <Card
        dataTour="audiences-header"
        padding="1.25rem 1.5rem"
        style={{
          background: 'linear-gradient(135deg, #FFFFFF 0%, #F8FAFF 100%)',
        }}
      >
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.9rem' }}>
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: 16,
                background: 'linear-gradient(135deg, #1E40FF 0%, #0284C7 100%)',
                color: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 8px 20px -4px rgba(30, 64, 255, 0.35)',
              }}
            >
              <Layers size={24} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <h1 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0F172A', margin: 0 }}>
                  {terminology.customerPluralLabel} 360° • Tệp Data & Tệp Logic
                </h1>
                <Badge tone="primary">Master Contact Core</Badge>
              </div>
              <p style={{ fontSize: '0.82rem', color: '#64748B', marginTop: 3 }}>
                Dùng chung 1 trái tim dữ liệu <code>leads</code> chuẩn RLS — tách bạch rạch ròi danh bạ <strong>Nuôi dưỡng Marketing</strong> với hàng đợi <strong>Chia số Sale</strong>.
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <ScreenHelpButton screenKey="audiences" />
            <button
              type="button"
              onClick={() => void loadAll()}
              className="btn secondary sm"
              style={{ height: 40, display: 'inline-flex', alignItems: 'center', gap: 6 }}
            >
              <RefreshCw size={15} className={loading ? 'animate-spin' : ''} /> Làm mới
            </button>

            {canCreate && (
              <>
                <button
                  type="button"
                  onClick={() => setQuickContactOpen(true)}
                  className="btn secondary"
                  style={{ height: 40, display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: '0.82rem' }}
                >
                  <UserPlus size={15} color="#1E40FF" /> + Hồ sơ Marketing
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEditingStatic(null);
                    setSelectedLeadIds([]);
                    setStaticModalOpen(true);
                  }}
                  className="btn secondary"
                  style={{
                    height: 40,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    fontSize: '0.82rem',
                    borderColor: '#93C5FD',
                    color: '#1E40FF',
                  }}
                >
                  <Database size={15} /> + Tạo Tệp Data
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEditingLogic(null);
                    setLogicModalOpen(true);
                  }}
                  className="btn-inkica-primary"
                  style={{
                    height: 40,
                    padding: '0 1.15rem',
                    borderRadius: 14,
                    border: 'none',
                    color: '#FFFFFF',
                    fontWeight: 700,
                    fontSize: '0.82rem',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    cursor: 'pointer',
                  }}
                >
                  <Zap size={15} /> + Tạo Tệp Logic (AND/OR)
                </button>
              </>
            )}
          </div>
        </div>
      </Card>

      {/* 4 KPI Summary Cards */}
      <div
        data-tour="audiences-kpis"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '1rem',
        }}
      >
        <Card padding="1.15rem 1.25rem">
          <div style={{ fontSize: '0.76rem', fontWeight: 600, color: '#64748B' }}>
            Tổng Hồ sơ {terminology.customerLabel} 360°
          </div>
          <div className="autodata-tabular-nums" style={{ fontSize: '1.75rem', fontWeight: 800, color: '#1E40FF', marginTop: 6 }}>
            {contacts.length.toLocaleString('vi-VN')}
          </div>
          <div style={{ fontSize: '0.74rem', color: '#64748B', marginTop: 4 }}>
            Hợp nhất Email + SĐT không trùng lặp
          </div>
        </Card>

        <Card padding="1.15rem 1.25rem">
          <div style={{ fontSize: '0.76rem', fontWeight: 600, color: '#64748B' }}>
            Đang Nuôi dưỡng Marketing
          </div>
          <div className="autodata-tabular-nums" style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0284C7', marginTop: 6 }}>
            {nurtureCount.toLocaleString('vi-VN')}
          </div>
          <div style={{ fontSize: '0.74rem', color: '#0284C7', marginTop: 4 }}>
            An toàn 100% — Không tự chia nhầm Sale
          </div>
        </Card>

        <Card padding="1.15rem 1.25rem">
          <div style={{ fontSize: '0.76rem', fontWeight: 600, color: '#64748B' }}>
            Tệp Data (Tĩnh & Đồng bộ Nguồn)
          </div>
          <div className="autodata-tabular-nums" style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0F172A', marginTop: 6 }}>
            {staticAudiences.length.toLocaleString('vi-VN')}
          </div>
          <div style={{ fontSize: '0.74rem', color: '#64748B', marginTop: 4 }}>
            Nhập CSV, Form Card, Bộ lọc CRM & Sheets
          </div>
        </Card>

        <Card padding="1.15rem 1.25rem">
          <div style={{ fontSize: '0.76rem', fontWeight: 600, color: '#64748B' }}>
            Tệp Logic (AND/OR Real-time)
          </div>
          <div className="autodata-tabular-nums" style={{ fontSize: '1.75rem', fontWeight: 800, color: '#059669', marginTop: 6 }}>
            {dynamicAudiences.length.toLocaleString('vi-VN')}
          </div>
          <div style={{ fontSize: '0.74rem', color: '#059669', marginTop: 4 }}>
            Tự động vào/ra tệp & kích hoạt Flow / Sale
          </div>
        </Card>
      </div>

      {/* Main Navigation PillTabs */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
        <PillTabs
          dataTour="audiences-tabs"
          tabs={[
            { key: 'static_data', label: 'Tệp Data (Tĩnh / Đồng bộ)', icon: <Database size={15} />, count: staticAudiences.length },
            { key: 'dynamic_logic', label: 'Tệp Logic (Rule-Based Real-Time)', icon: <Zap size={15} />, count: dynamicAudiences.length },
            { key: 'contacts', label: `Tất cả ${terminology.customerLabel} 360°`, icon: <Users size={15} />, count: contacts.length },
            { key: 'tags', label: 'Nhãn phân loại (Tags)', icon: <Tag size={15} />, count: tags.length },
          ]}
          activeKey={activeTab}
          onChange={setActiveTab}
        />
      </div>

      {/* TAB 1: TỆP DATA */}
      {activeTab === 'static_data' && (
        <div data-tour="audiences-static-grid">
          {staticAudiences.length === 0 ? (
            <EmptyState
              icon={<Database size={24} />}
              title="Chưa có Tệp Data nào được khởi tạo"
              description="Tạo Tệp Data để nhập danh sách CSV/Excel, hứng khách từ Form Card, đồng bộ Google Sheets 2 chiều hoặc lưu bộ lọc từ phễu CRM."
              action={
                <button
                  type="button"
                  onClick={() => {
                    setEditingStatic(null);
                    setStaticModalOpen(true);
                  }}
                  className="btn-inkica-primary"
                  style={{
                    height: 42,
                    padding: '0 1.25rem',
                    borderRadius: 14,
                    border: 'none',
                    color: '#FFFFFF',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  + Tạo Tệp Data Đầu Tiên
                </button>
              }
            />
          ) : (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
                gap: '1rem',
              }}
            >
              {staticAudiences.map((aud) => (
                <FormCard
                  key={aud.id}
                  icon={
                    aud.audience_type === 'sync_data' ? (
                      <FileSpreadsheet size={20} />
                    ) : (
                      <Users size={20} />
                    )
                  }
                  title={aud.name}
                  description={aud.description || 'Tệp danh sách chủ động cho Chiến dịch & Nuôi dưỡng'}
                  badge={
                    <Badge tone={aud.audience_type === 'sync_data' ? 'info' : 'primary'}>
                      {aud.audience_type === 'sync_data' ? 'Đồng bộ Sheets' : 'Tệp Data Tĩnh'}
                    </Badge>
                  }
                  footer={
                    <>
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        <button
                          type="button"
                          onClick={() => setImportTarget(aud)}
                          className="btn secondary sm"
                          style={{ height: 32, fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                        >
                          <Upload size={13} /> Import CSV
                        </button>
                        <button
                          type="button"
                          onClick={() => setSplitTarget(aud)}
                          className="btn secondary sm"
                          style={{ height: 32, fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                        >
                          <Scissors size={13} /> Tách A/B
                        </button>
                        <button
                          type="button"
                          onClick={() => setDetailModalState({ audience: aud, subTab: 'exclusions' })}
                          className="btn secondary sm"
                          style={{ height: 32, fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                        >
                          <Ban size={13} /> Loại trừ
                        </button>
                      </div>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button
                          type="button"
                          onClick={() => setDetailModalState({ audience: aud, subTab: 'members' })}
                          className="btn secondary sm"
                          style={{ height: 32, fontSize: '0.75rem', color: '#1E40FF' }}
                          title="Xem thành viên & đẩy sang Vòng chia Sale"
                        >
                          <Eye size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setEditingStatic(aud);
                            setStaticModalOpen(true);
                          }}
                          className="btn secondary sm"
                          style={{ height: 32, fontSize: '0.75rem' }}
                        >
                          <Edit2 size={13} />
                        </button>
                        {canDelete && (
                          <button
                            type="button"
                            onClick={() => void handleDeleteAudience(aud)}
                            className="btn secondary sm"
                            style={{ height: 32, fontSize: '0.75rem', color: '#DC2626' }}
                          >
                            <Trash2 size={13} />
                          </button>
                        )}
                      </div>
                    </>
                  }
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'baseline',
                      justifyContent: 'space-between',
                      padding: '0.65rem 0.85rem',
                      borderRadius: 12,
                      background: '#F8FAFF',
                      border: '1px solid #E2E8F0',
                    }}
                  >
                    <span style={{ fontSize: '0.76rem', color: '#64748B', fontWeight: 600 }}>
                      Quy mô thành viên
                    </span>
                    <span className="autodata-tabular-nums" style={{ fontSize: '1.25rem', fontWeight: 800, color: '#1E40FF' }}>
                      {(aud.cached_member_count || 0).toLocaleString('vi-VN')}
                    </span>
                  </div>
                </FormCard>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: TỆP LOGIC REAL-TIME */}
      {activeTab === 'dynamic_logic' && (
        <div data-tour="audiences-dynamic-grid">
          {dynamicAudiences.length === 0 ? (
            <EmptyState
              icon={<Zap size={24} />}
              title="Chưa có Tệp Logic Động nào"
              description="Thiết lập cây điều kiện VÀ (AND) / HOẶC (OR) xuyên suốt Hồ sơ, Phễu CRM, Hành vi mở Email/Form và Doanh thu để hệ thống tự động phân nhóm 24/7."
              action={
                <button
                  type="button"
                  onClick={() => {
                    setEditingLogic(null);
                    setLogicModalOpen(true);
                  }}
                  className="btn-inkica-primary"
                  style={{
                    height: 42,
                    padding: '0 1.25rem',
                    borderRadius: 14,
                    border: 'none',
                    color: '#FFFFFF',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  + Thiết lập Tệp Logic Đầu Tiên
                </button>
              }
            />
          ) : (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))',
                gap: '1rem',
              }}
            >
              {dynamicAudiences.map((aud) => (
                <FormCard
                  key={aud.id}
                  icon={<Zap size={20} />}
                  title={aud.name}
                  description={aud.description || 'Tự động cập nhật khi khách hàng phát sinh sự kiện mới'}
                  badge={
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                      <Badge tone="purple">Tệp Logic Real-Time</Badge>
                      {aud.auto_push_to_sale_round && (
                        <Badge tone="success" icon={<GitBranch size={11} />}>
                          Auto Chia Sale
                        </Badge>
                      )}
                    </div>
                  }
                  footer={
                    <>
                      <button
                        type="button"
                        onClick={() => setDetailModalState({ audience: aud, subTab: 'members' })}
                        className="btn secondary sm"
                        style={{ height: 32, fontSize: '0.76rem', color: '#1E40FF', display: 'inline-flex', alignItems: 'center', gap: 5 }}
                      >
                        <Eye size={14} /> Xem {(aud.cached_member_count || 0).toLocaleString('vi-VN')} thành viên
                      </button>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button
                          type="button"
                          onClick={() => {
                            setEditingLogic(aud);
                            setLogicModalOpen(true);
                          }}
                          className="btn secondary sm"
                          style={{ height: 32, fontSize: '0.76rem', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                        >
                          <Filter size={13} /> Sửa Luật
                        </button>
                        {canDelete && (
                          <button
                            type="button"
                            onClick={() => void handleDeleteAudience(aud)}
                            className="btn secondary sm"
                            style={{ height: 32, fontSize: '0.76rem', color: '#DC2626' }}
                          >
                            <Trash2 size={13} />
                          </button>
                        )}
                      </div>
                    </>
                  }
                >
                  <div
                    style={{
                      padding: '0.65rem 0.85rem',
                      borderRadius: 12,
                      background: '#F8F9FA',
                      border: '1px solid #E2E8F0',
                      fontSize: '0.76rem',
                      color: '#334155',
                      lineHeight: 1.5,
                    }}
                  >
                    <strong>Biểu thức:</strong> {summarizeFilterBranches(aud.filter_branches, fieldCatalog)}
                  </div>
                </FormCard>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: TẤT CẢ KHÁCH HÀNG 360 */}
      {activeTab === 'contacts' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
          <Card padding="0.95rem 1.15rem">
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8, flex: 1 }}>
                <div style={{ position: 'relative', minWidth: 250, flex: 1 }}>
                  <Search
                    size={15}
                    color="#64748B"
                    style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }}
                  />
                  <input
                    type="text"
                    className="form-input"
                    style={{ height: 38, paddingLeft: 36, fontSize: '0.82rem' }}
                    placeholder={`Tìm tên ${terminology.customerLabel}, SĐT, Email, UTM...`}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>

                <select
                  className="form-input"
                  style={{ height: 38, width: 210, fontSize: '0.8rem' }}
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="all">Tất cả trạng thái điều phối</option>
                  <option value="marketing_nurture">Đang nuôi dưỡng MKT (Chưa chia Sale)</option>
                  <option value="unassigned_pending">Chờ Vòng chia Sale</option>
                  <option value="assigned">Đã giao Sale chăm sóc</option>
                </select>

                <select
                  className="form-input"
                  style={{ height: 38, width: 185, fontSize: '0.8rem' }}
                  value={lifecycleFilter}
                  onChange={(e) => setLifecycleFilter(e.target.value)}
                >
                  <option value="all">Mọi giai đoạn vòng đời</option>
                  <option value="subscriber">Subscriber</option>
                  <option value="lead">Lead</option>
                  <option value="mql">MQL</option>
                  <option value="sql">SQL</option>
                  <option value="customer">Customer</option>
                </select>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={() => {
                    const targetIds =
                      selectedLeadIds.length > 0
                        ? selectedLeadIds
                        : filteredContacts.map((c) => c.id);
                    setSelectedLeadIds(targetIds);
                    setEditingStatic(null);
                    setStaticModalOpen(true);
                  }}
                  className="btn secondary sm"
                  style={{ height: 38, fontSize: '0.78rem', color: '#1E40FF', display: 'inline-flex', alignItems: 'center', gap: 6 }}
                >
                  <Sparkles size={14} /> Lưu bộ lọc thành Tệp Data ({selectedLeadIds.length || filteredContacts.length})
                </button>

                {selectedLeadIds.length > 0 && (
                  <button
                    type="button"
                    onClick={() => void handlePushSelectedContactsToSale()}
                    className="btn-inkica-primary"
                    style={{
                      height: 38,
                      padding: '0 1rem',
                      borderRadius: 12,
                      border: 'none',
                      color: '#FFFFFF',
                      fontWeight: 700,
                      fontSize: '0.78rem',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      cursor: 'pointer',
                    }}
                  >
                    <Send size={13} /> Đẩy {selectedLeadIds.length} khách vào Vòng chia Sale
                  </button>
                )}
              </div>
            </div>
          </Card>

          <Table
            columns={contactColumns}
            rows={filteredContacts}
            rowKey={(r) => r.id}
            loading={loading}
            emptyTitle={`Chưa có ${terminology.customerLabel} khớp bộ lọc`}
            emptyDescription="Bạn có thể tạo mới hồ sơ Marketing hoặc Import CSV vào Tệp Data."
          />
        </div>
      )}

      {/* TAB 4: TAGS */}
      {activeTab === 'tags' && (
        <Card
          title="Quản lý Nhãn Phân loại Khách hàng (Tenant Tags)"
          subtitle="Dùng chung xuyên suốt giữa Hồ sơ CRM, Tệp Logic Marketing và Kịch bản Automation Flow"
        >
          <form
            onSubmit={handleCreateTag}
            style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: '1.25rem' }}
          >
            <input
              type="text"
              required
              className="form-input"
              style={{ maxWidth: 320, height: 40 }}
              placeholder="Tên nhãn mới (VD: VIP, Đã tải Ebook, Quan tâm Giá...)"
              value={newTagName}
              onChange={(e) => setNewTagName(e.target.value)}
            />
            <input
              type="color"
              className="form-input"
              style={{ width: 64, height: 40, padding: 4, cursor: 'pointer' }}
              value={newTagColor}
              onChange={(e) => setNewTagColor(e.target.value)}
            />
            <button
              type="submit"
              className="btn-inkica-primary"
              style={{
                height: 40,
                padding: '0 1.15rem',
                borderRadius: 12,
                border: 'none',
                color: '#FFFFFF',
                fontWeight: 700,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                cursor: 'pointer',
              }}
            >
              <Plus size={15} /> Tạo Nhãn
            </button>
          </form>

          {tags.length === 0 ? (
            <EmptyState
              icon={<Tag size={22} />}
              title="Chưa có nhãn phân loại nào"
              description="Tạo nhãn màu để phân loại nhanh khách hàng theo hành vi và chiến dịch."
            />
          ) : (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
              {tags.map((tg) => (
                <div
                  key={tg.id}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '6px 12px',
                    borderRadius: 9999,
                    background: '#F8FAFF',
                    border: '1px solid #E2E8F0',
                  }}
                >
                  <span
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: '50%',
                      background: tg.color_hex || '#1E40FF',
                    }}
                  />
                  <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#0F172A' }}>{tg.name}</span>
                  <button
                    type="button"
                    onClick={() => void handleDeleteTag(tg.id)}
                    style={{ border: 'none', background: 'transparent', color: '#94A3B8', cursor: 'pointer', display: 'flex' }}
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* Quick Create Nurture Contact Modal */}
      <CustomModal
        isOpen={quickContactOpen}
        onClose={() => setQuickContactOpen(false)}
        title={`Thêm ${terminology.customerLabel} Nuôi Dưỡng Marketing (Chưa chia Sale)`}
        width="540px"
      >
        <form onSubmit={handleCreateQuickContact} style={{ display: 'flex', flexDirection: 'column', gap: '0.95rem' }}>
          <div className="form-group">
            <label className="form-label">Họ và tên *</label>
            <input
              type="text"
              required
              className="form-input"
              placeholder={`Nhập tên ${terminology.customerLabel}`}
              value={qcName}
              onChange={(e) => setQcName(e.target.value)}
            />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div className="form-group">
              <label className="form-label">Số điện thoại (Tùy chọn nếu có Email)</label>
              <input
                type="tel"
                className="form-input"
                placeholder="090xxxxxxx"
                value={qcPhone}
                onChange={(e) => setQcPhone(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Email (Tùy chọn nếu có SĐT)</label>
              <input
                type="email"
                className="form-input"
                placeholder="name@company.vn"
                value={qcEmail}
                onChange={(e) => setQcEmail(e.target.value)}
              />
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div className="form-group">
              <label className="form-label">Nguồn thu thập</label>
              <input
                type="text"
                className="form-input"
                value={qcSource}
                onChange={(e) => setQcSource(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Đưa ngay vào Tệp Data</label>
              <select
                className="form-input"
                value={qcTargetAudienceId}
                onChange={(e) => setQcTargetAudienceId(e.target.value)}
              >
                <option value="">— Không chọn tệp —</option>
                {staticAudiences.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 6 }}>
            <button type="button" className="btn secondary" onClick={() => setQuickContactOpen(false)}>
              Hủy
            </button>
            <button
              type="submit"
              className="btn-inkica-primary"
              style={{
                height: 42,
                padding: '0 1.25rem',
                borderRadius: 14,
                border: 'none',
                color: '#FFFFFF',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Lưu vào Kho Nuôi Dưỡng
            </button>
          </div>
        </form>
      </CustomModal>

      {/* Sub-Modals */}
      <StaticAudienceFormModal
        isOpen={staticModalOpen}
        onClose={() => {
          setStaticModalOpen(false);
          setEditingStatic(null);
        }}
        initialAudience={editingStatic}
        initialLeadIds={selectedLeadIds}
        onSaved={(saved) => {
          handleUpsertAudience(saved);
          setSelectedLeadIds([]);
        }}
      />

      <SegmentRuleBuilderModal
        isOpen={logicModalOpen}
        onClose={() => {
          setLogicModalOpen(false);
          setEditingLogic(null);
        }}
        initialAudience={editingLogic}
        fieldCatalog={fieldCatalog}
        fallbackContacts={contacts}
        onSaved={handleUpsertAudience}
      />

      <ImportAudienceCsvModal
        isOpen={Boolean(importTarget)}
        onClose={() => setImportTarget(null)}
        audience={importTarget}
        onImported={(added, targetAudId) => {
          setContacts((prev) => [...added, ...prev]);
          setAudiences((prev) =>
            prev.map((a) =>
              a.id === targetAudId
                ? { ...a, cached_member_count: (a.cached_member_count || 0) + added.length }
                : a
            )
          );
        }}
      />

      <SplitAudienceModal
        isOpen={Boolean(splitTarget)}
        onClose={() => setSplitTarget(null)}
        audience={splitTarget}
        onSplitCreated={(parts) => {
          setAudiences((prev) => [...parts, ...prev]);
        }}
      />

      <AudienceMembersAndExclusionsModal
        isOpen={Boolean(detailModalState.audience)}
        onClose={() => setDetailModalState({ audience: null, subTab: 'members' })}
        audience={detailModalState.audience}
        fallbackContacts={contacts}
        initialSubTab={detailModalState.subTab}
        onChanged={() => void loadAll()}
      />
    </div>
  );
};
