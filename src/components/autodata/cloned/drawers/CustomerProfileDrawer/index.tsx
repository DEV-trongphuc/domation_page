import React, { Suspense, lazy, useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import {
  Activity,
  Briefcase,
  CheckSquare,
  CreditCard,
  Flame,
  Folder,
  Globe,
  Layers,
  Lock,
  Mail,
  Phone,
  User,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useEntitlement } from '../../contexts/EntitlementContext';
import { Avatar } from '../../components/ui/Avatar';
import { DrawerSkeleton } from '../../components/ui/Skeleton';
import { DrawerShell, type DrawerTabDef } from '../DrawerShell';
import type {
  CrmCompanyRecord,
  CrmContactRecord,
  CrmCustomFieldDef,
  CrmDynamicEntityTab,
  CrmPipelineStage,
  CrmStaffMember,
} from '../crmTypes';
import {
  crmGet,
  crmMutate,
  formatCurrencyVnd,
  getHeatTier,
  maskClientPiiFallback,
} from '../crm360Api';

const OverviewCustomFieldsTab = lazy(() => import('./OverviewCustomFieldsTab'));
const TimelineMentionsTab = lazy(() => import('./TimelineMentionsTab'));
const OmnichannelJourneyTab = lazy(() => import('./OmnichannelJourneyTab'));
const DealsPipelineHistoryTab = lazy(() => import('./DealsPipelineHistoryTab'));
const CommercialFinanceTab = lazy(() => import('./CommercialFinanceTab'));
const TasksTicketsTab = lazy(() => import('./TasksTicketsTab'));
const CloudFilesTagsTab = lazy(() => import('./CloudFilesTagsTab'));

export interface CustomerProfileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  contact: { id: string; name?: string } | CrmContactRecord | null;
  initialTab?: string;
  onUpdate?: (updated: CrmContactRecord) => void;
  zIndex?: number;
}

interface ContactDossierResponse {
  contact: CrmContactRecord;
  can_unmask_phone: boolean;
  custom_field_defs: CrmCustomFieldDef[];
  dynamic_entity_tabs: CrmDynamicEntityTab[];
  pipeline_stages: CrmPipelineStage[];
  counts: {
    deals: number;
    quotes: number;
    orders: number;
    tasks: number;
    tickets: number;
    files: number;
  };
}

export const CustomerProfileDrawer: React.FC<CustomerProfileDrawerProps> = ({
  isOpen,
  onClose,
  contact,
  initialTab = 'overview',
  onUpdate,
  zIndex = 1220,
}) => {
  const { token, tenantSlug } = useAuth();
  const { can } = useEntitlement();
  const creds = React.useMemo(() => ({ token, tenantSlug }), [token, tenantSlug]);

  const [activeTab, setActiveTab] = useState(
    initialTab === 'info' ? 'overview' : initialTab
  );
  const [dossier, setDossier] = useState<ContactDossierResponse | null>(null);
  const [staff, setStaff] = useState<CrmStaffMember[]>([]);
  const [companies, setCompanies] = useState<CrmCompanyRecord[]>([]);
  const [loading, setLoading] = useState(false);

  const contactId = contact?.id ? String(contact.id) : '';
  const rbacCanUnmask = can('leads', 'unmask_phone');
  const canEdit = can('leads', 'edit');

  const loadDossier = useCallback(async () => {
    if (!isOpen || !contactId) return;
    setLoading(true);
    try {
      const [dos, dir] = await Promise.all([
        crmGet<ContactDossierResponse>(`/contacts/${contactId}`, creds),
        crmGet<{ staff: CrmStaffMember[]; companies: CrmCompanyRecord[] }>(
          '/contacts',
          creds,
          { limit: 1 }
        ),
      ]);
      setDossier(dos);
      setStaff(dir.staff || []);
      setCompanies(dir.companies || []);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Không thể tải Hồ sơ Khách hàng 360°');
    } finally {
      setLoading(false);
    }
  }, [isOpen, contactId, creds]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadDossier();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [loadDossier]);

  const fullContact = dossier?.contact;
  const effectiveUnmask = Boolean(rbacCanUnmask && (dossier?.can_unmask_phone ?? true));
  const displayPhone = maskClientPiiFallback(fullContact?.phone, effectiveUnmask, 'phone');
  const displayEmail = maskClientPiiFallback(fullContact?.email, effectiveUnmask, 'email');
  const heat = getHeatTier(fullContact?.lead_score || 0);

  const handleStageClick = async (stageId: string) => {
    if (!canEdit || !fullContact) return;
    try {
      await crmMutate(`/contacts/${fullContact.id}`, 'PUT', creds, { stage_id: stageId });
      toast.success('Đã chuyển bước Pipeline cho khách hàng');
      await loadDossier();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Không thể chuyển bước Pipeline');
    }
  };

  const tabs: DrawerTabDef[] = [
    { id: 'overview', label: 'Tổng quan & Trường tùy chỉnh', icon: <User size={15} /> },
    { id: 'timeline', label: 'Timeline 360° & @Ghi chú', icon: <Activity size={15} /> },
    { id: 'journey', label: 'Hành trình Đa kênh & AI', icon: <Globe size={15} /> },
    {
      id: 'deals',
      label: 'Multi-Deals & Lịch sử Phễu',
      icon: <Briefcase size={15} />,
      badge: dossier?.counts.deals,
    },
    {
      id: 'commercial',
      label: 'Báo giá, SO, Đặt cọc & HĐ',
      icon: <CreditCard size={15} />,
      badge: (dossier?.counts.quotes || 0) + (dossier?.counts.orders || 0),
    },
    {
      id: 'tasks_tickets',
      label: 'Công việc & Hỗ trợ SLA',
      icon: <CheckSquare size={15} />,
      badge: (dossier?.counts.tasks || 0) + (dossier?.counts.tickets || 0),
    },
    {
      id: 'files_tags',
      label: 'Tài liệu Cloud & Tags',
      icon: <Folder size={15} />,
      badge: dossier?.counts.files,
    },
    ...(dossier?.dynamic_entity_tabs || []).map((dt) => ({
      id: `dyn:${dt.tab_key}`,
      label: dt.tab_label,
      icon: <Layers size={15} />,
    })),
  ];

  const isDynamicTab = activeTab.startsWith('dyn:');
  const activeDynKey = isDynamicTab ? activeTab.slice(4) : null;

  return (
    <DrawerShell
      isOpen={isOpen}
      onClose={onClose}
      zIndex={zIndex}
      loading={loading || !fullContact}
      avatarNode={<Avatar name={fullContact?.name || contact?.name || 'KH'} size="lg" />}
      title={
        <>
          <span>{fullContact?.name || contact?.name || 'Hồ sơ Khách hàng 360°'}</span>
          <span
            style={{
              fontSize: '0.74rem',
              fontWeight: 700,
              padding: '2px 10px',
              borderRadius: 999,
              background: heat.bg,
              color: heat.color,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
            }}
          >
            <Flame size={12} /> Điểm: {fullContact?.lead_score ?? 0} ({heat.label})
          </span>
          {!effectiveUnmask && (
            <span
              style={{
                fontSize: '0.72rem',
                fontWeight: 700,
                padding: '2px 8px',
                borderRadius: 999,
                background: '#EFF6FF',
                color: '#1E40FF',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
              }}
            >
              <Lock size={11} /> PII Masked
            </span>
          )}
        </>
      }
      subtitle={
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
            <Phone size={13} color="#1E40FF" /> {displayPhone}
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
            <Mail size={13} color="#1E40FF" /> {displayEmail}
          </span>
          {fullContact?.total_revenue_vnd ? (
            <span style={{ color: '#059669', fontWeight: 700 }}>
              Doanh thu lũy kế: {formatCurrencyVnd(fullContact.total_revenue_vnd)}
            </span>
          ) : null}
        </div>
      }
      headerSubBar={
        dossier?.pipeline_stages && dossier.pipeline_stages.length > 0 ? (
          <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingTop: 4 }}>
            {dossier.pipeline_stages.map((st) => {
              const isCur = st.id === fullContact?.stage_id;
              return (
                <button
                  key={st.id}
                  type="button"
                  disabled={!canEdit}
                  onClick={() => void handleStageClick(st.id)}
                  style={{
                    height: 32,
                    padding: '0 12px',
                    borderRadius: 999,
                    border: isCur ? '1px solid #1E40FF' : '1px solid #E2E8F0',
                    background: isCur ? '#1E40FF' : '#F8FAFC',
                    color: isCur ? '#FFFFFF' : '#475569',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    whiteSpace: 'nowrap',
                    cursor: canEdit ? 'pointer' : 'default',
                  }}
                >
                  {st.stage_name}
                </button>
              );
            })}
          </div>
        ) : undefined
      }
      tabs={tabs}
      activeTab={activeTab}
      onTabChange={setActiveTab}
    >
      {fullContact && (
        <Suspense fallback={<DrawerSkeleton />}>
          {(activeTab === 'overview' || isDynamicTab) && (
            <OverviewCustomFieldsTab
              key={`${fullContact.id}-${activeDynKey || 'overview'}-${fullContact.updated_at || ''}`}
              contact={fullContact}
              canUnmaskPhone={effectiveUnmask}
              canEdit={canEdit}
              customFieldDefs={dossier?.custom_field_defs || []}
              dynamicTabs={dossier?.dynamic_entity_tabs || []}
              activeDynamicTabKey={activeDynKey}
              staff={staff}
              companies={companies}
              creds={creds}
              onUpdated={(upd) => {
                onUpdate?.(upd);
                void loadDossier();
              }}
            />
          )}

          {activeTab === 'timeline' && (
            <TimelineMentionsTab
              contactId={fullContact.id}
              canEdit={canEdit}
              staff={staff}
              creds={creds}
            />
          )}

          {activeTab === 'journey' && (
            <OmnichannelJourneyTab
              contactId={fullContact.id}
              contactName={fullContact.name}
              canEdit={canEdit}
              creds={creds}
            />
          )}

          {activeTab === 'deals' && (
            <DealsPipelineHistoryTab
              contactId={fullContact.id}
              companyId={fullContact.company_id}
              canEdit={canEdit}
              creds={creds}
            />
          )}

          {activeTab === 'commercial' && (
            <CommercialFinanceTab
              contactId={fullContact.id}
              companyId={fullContact.company_id}
              canEdit={canEdit}
              creds={creds}
            />
          )}

          {activeTab === 'tasks_tickets' && (
            <TasksTicketsTab
              contactId={fullContact.id}
              contactName={fullContact.name}
              canEdit={canEdit}
              creds={creds}
            />
          )}

          {activeTab === 'files_tags' && (
            <CloudFilesTagsTab
              contact={fullContact}
              canEdit={canEdit}
              creds={creds}
              onTagsChanged={() => void loadDossier()}
            />
          )}
        </Suspense>
      )}
    </DrawerShell>
  );
};

export default CustomerProfileDrawer;
