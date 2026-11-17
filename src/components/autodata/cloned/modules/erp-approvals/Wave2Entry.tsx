import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  CheckCircle2,
  Clock,
  Edit2,
  Eye,
  FileCheck2,
  GitBranch,
  Inbox,
  Lock,
  Plus,
  RefreshCw,
  Search,
  Send,
  Settings,
  Trash2,
  UserCheck,
} from 'lucide-react';
import toast from 'react-hot-toast';
import {
  AutoDataLoadingModal,
  Badge,
  Card,
  EmptyState,
  FormCard,
  PillTabs,
  Table,
  type TableColumn,
} from '../../components/ui/AutoDataLoadingModal';
import { ScreenHelpButton } from '../../components/ui/ScreenHelpButton';
import { apiRequest, formatShortDate, formatVnd, getErrorMessage } from '../../../autodataApi';
import { useAuth } from '../../contexts/AuthContext';
import { useEntitlement } from '../../contexts/EntitlementContext';
import {
  APPROVER_TYPE_LABELS,
  CATEGORY_LABELS,
  getStatusBadgeMeta,
  type ApprovalCategory,
  type ApprovalDelegationDto,
  type ApprovalRequestDto,
  type ApprovalsOverviewDto,
  type ApprovalWorkflowDto,
} from './approvalTypes';
import {
  ApprovalRequestDetailModal,
  DelegationCreateModal,
  NewApprovalRequestModal,
  StepTimelineInlineBadge,
  WorkflowBuilderModal,
} from './ApprovalModals';

type ApprovalsTabKey = 'inbox' | 'mine' | 'all' | 'workflows' | 'delegations';

export const ErpApprovalsWave2Entry: React.FC = () => {
  const { token, tenantSlug } = useAuth();
  const { can, scope, packageMeta } = useEntitlement();

  const canCreate = can('erp_approvals', 'create');
  const canApprove = can('erp_approvals', 'approve');
  const canManageConfig = can('erp_approvals', 'manage_config');
  const activeScope = scope('erp_approvals');

  const [activeTab, setActiveTab] = useState<ApprovalsTabKey>('inbox');
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState<ApprovalsOverviewDto | null>(null);
  const [workflows, setWorkflows] = useState<ApprovalWorkflowDto[]>([]);
  const [inboxRequests, setInboxRequests] = useState<ApprovalRequestDto[]>([]);
  const [myRequests, setMyRequests] = useState<ApprovalRequestDto[]>([]);
  const [allRequests, setAllRequests] = useState<ApprovalRequestDto[]>([]);
  const [delegations, setDelegations] = useState<ApprovalDelegationDto[]>([]);

  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  // Modals
  const [newReqOpen, setNewReqOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<ApprovalRequestDto | null>(null);
  const [wfBuilderOpen, setWfBuilderOpen] = useState(false);
  const [editingWorkflow, setEditingWorkflow] = useState<ApprovalWorkflowDto | null>(null);
  const [delegationModalOpen, setDelegationModalOpen] = useState(false);

  const loadAllData = useCallback(async () => {
    try {
      const [ovRes, wfRes, inbRes, mineRes, allRes, delRes] = await Promise.all([
        apiRequest<ApprovalsOverviewDto>('/approvals/overview', { token, tenantSlug }).catch(() => null),
        apiRequest<ApprovalWorkflowDto[]>('/approvals/workflows', { token, tenantSlug }).catch(() => []),
        apiRequest<ApprovalRequestDto[]>('/approvals/requests?view=inbox', { token, tenantSlug }).catch(() => []),
        apiRequest<ApprovalRequestDto[]>('/approvals/requests?view=mine', { token, tenantSlug }).catch(() => []),
        apiRequest<ApprovalRequestDto[]>('/approvals/requests?view=all', { token, tenantSlug }).catch(() => []),
        apiRequest<ApprovalDelegationDto[]>('/approvals/delegations', { token, tenantSlug }).catch(() => []),
      ]);
      if (ovRes) setOverview(ovRes);
      setWorkflows(Array.isArray(wfRes) ? wfRes : []);
      setInboxRequests(Array.isArray(inbRes) ? inbRes : []);
      setMyRequests(Array.isArray(mineRes) ? mineRes : []);
      setAllRequests(Array.isArray(allRes) ? allRes : []);
      setDelegations(Array.isArray(delRes) ? delRes : []);
    } finally {
      setLoading(false);
    }
  }, [token, tenantSlug]);

  useEffect(() => {
    void loadAllData();
  }, [loadAllData]);

  const handleQuickDecide = async (reqItem: ApprovalRequestDto, decision: 'approve' | 'reject') => {
    try {
      await apiRequest(`/approvals/requests/${reqItem.id}/decide`, {
        method: 'POST',
        token,
        tenantSlug,
        body: {
          decision,
          comment: decision === 'approve' ? 'Phê duyệt nhanh trên Hộp thư chờ duyệt' : 'Từ chối nhanh',
        },
      });
      toast.success(decision === 'approve' ? `Đã duyệt ${reqItem.request_code}!` : `Đã từ chối ${reqItem.request_code}`);
      await loadAllData();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Không thể xử lý phê duyệt nhanh.'));
    }
  };

  const handleToggleWorkflow = async (wf: ApprovalWorkflowDto) => {
    try {
      await apiRequest(`/approvals/workflows/${wf.id}`, {
        method: 'PATCH',
        token,
        tenantSlug,
        body: { is_active: !wf.is_active },
      });
      toast.success(wf.is_active ? 'Đã tạm ngưng quy trình.' : 'Đã kích hoạt quy trình.');
      await loadAllData();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Không thể cập nhật trạng thái quy trình.'));
    }
  };

  const handleDeleteDelegation = async (id: string) => {
    try {
      await apiRequest(`/approvals/delegations/${id}`, {
        method: 'DELETE',
        token,
        tenantSlug,
      });
      toast.success('Đã thu hồi ủy quyền phê duyệt.');
      await loadAllData();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Không thể thu hồi ủy quyền.'));
    }
  };

  const displayedRequests = useMemo(() => {
    const source =
      activeTab === 'inbox' ? inboxRequests : activeTab === 'mine' ? myRequests : allRequests;
    return source.filter((item) => {
      if (categoryFilter !== 'all' && item.category !== categoryFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase();
        const hay = `${item.request_code} ${item.title} ${item.requester_name || ''} ${item.workflow_name || ''}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [activeTab, inboxRequests, myRequests, allRequests, categoryFilter, searchQuery]);

  const requestColumns = useMemo<ReadonlyArray<TableColumn<ApprovalRequestDto>>>(
    () => [
      {
        key: 'code',
        header: 'Mã & Tờ trình',
        render: (row) => (
          <div>
            <div style={{ fontWeight: 800, color: '#0F172A' }}>{row.title}</div>
            <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: 2 }}>
              <span style={{ color: '#1E40FF', fontWeight: 700 }}>{row.request_code}</span> •{' '}
              {row.workflow_name || CATEGORY_LABELS[row.category]} • {formatShortDate(row.created_at)}
            </div>
          </div>
        ),
      },
      {
        key: 'requester',
        header: 'Người đề xuất',
        render: (row) => (
          <div>
            <div style={{ fontWeight: 700 }}>{row.requester_name || row.requester_email || '—'}</div>
            {row.requester_department_name && (
              <div style={{ fontSize: '0.75rem', color: '#64748B' }}>{row.requester_department_name}</div>
            )}
          </div>
        ),
      },
      {
        key: 'amount',
        header: 'Ngân sách',
        numeric: true,
        render: (row) =>
          row.amount_vnd > 0 ? (
            <span style={{ fontWeight: 800, color: '#0F172A' }}>{formatVnd(row.amount_vnd)}</span>
          ) : (
            <span style={{ color: '#94A3B8' }}>—</span>
          ),
      },
      {
        key: 'steps',
        header: 'Lộ trình N Bước',
        render: (row) => <StepTimelineInlineBadge req={row} />,
      },
      {
        key: 'status',
        header: 'Trạng thái',
        render: (row) => {
          const m = getStatusBadgeMeta(row.status);
          return (
            <Badge tone={m.tone}>
              {m.label} ({row.current_step_order}/{row.total_steps})
            </Badge>
          );
        },
      },
      {
        key: 'actions',
        header: 'Thao tác',
        align: 'right',
        render: (row) => (
          <div
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
            onClick={(e) => e.stopPropagation()}
          >
            {canApprove && row.status === 'pending' && row.can_current_user_act && (
              <>
                <button
                  type="button"
                  onClick={() => handleQuickDecide(row, 'approve')}
                  style={{
                    height: 34,
                    padding: '0 10px',
                    borderRadius: 10,
                    border: 'none',
                    background: '#1E40FF',
                    color: '#FFFFFF',
                    fontSize: '0.76rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  Duyệt 1 chạm
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickDecide(row, 'reject')}
                  style={{
                    height: 34,
                    padding: '0 10px',
                    borderRadius: 10,
                    border: '1px solid rgba(220, 38, 38, 0.28)',
                    background: '#FFFFFF',
                    color: '#DC2626',
                    fontSize: '0.76rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  Từ chối
                </button>
              </>
            )}
            <button
              type="button"
              onClick={() => setSelectedRequest(row)}
              className="btn secondary"
              style={{ height: 34, padding: '0 10px', fontSize: '0.76rem', display: 'inline-flex', alignItems: 'center', gap: 4 }}
            >
              <Eye size={13} /> Chi tiết
            </button>
          </div>
        ),
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [canApprove, token, tenantSlug]
  );

  const delegationColumns = useMemo<ReadonlyArray<TableColumn<ApprovalDelegationDto>>>(
    () => [
      {
        key: 'delegator',
        header: 'Người ủy quyền',
        render: (d) => <span style={{ fontWeight: 700 }}>{d.delegator_name || d.delegator_email}</span>,
      },
      {
        key: 'delegate',
        header: 'Người duyệt thay',
        render: (d) => <Badge tone="primary">{d.delegate_name || d.delegate_email}</Badge>,
      },
      {
        key: 'period',
        header: 'Thời hạn hiệu lực',
        render: (d) => (
          <span style={{ fontSize: '0.82rem', color: '#334155' }}>
            {formatShortDate(d.valid_from)} → {formatShortDate(d.valid_until)}
          </span>
        ),
      },
      {
        key: 'reason',
        header: 'Lý do',
        render: (d) => <span>{d.reason || '—'}</span>,
      },
      {
        key: 'act',
        header: '',
        align: 'right',
        render: (d) => (
          <button
            type="button"
            onClick={() => handleDeleteDelegation(d.id)}
            className="btn secondary"
            style={{ height: 34, padding: '0 10px', color: '#DC2626' }}
          >
            <Trash2 size={14} />
          </button>
        ),
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [token, tenantSlug]
  );

  if (loading) {
    return (
      <AutoDataLoadingModal
        inline
        isOpen
        message="Đang khởi tạo Trung tâm Phê duyệt Đa cấp Động..."
        subMessage="Đồng bộ Sơ đồ Tổ chức, Ma trận Ngưỡng tiền & Hộp thư Phê duyệt RLS"
      />
    );
  }

  return (
    <div style={{ background: '#F8F9FA', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Header Banner */}
      <Card
        padding="1.3rem 1.5rem"
        style={{ background: 'linear-gradient(135deg, #FFFFFF 0%, #F8FAFF 100%)' }}
      >
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: 16,
                background: '#FFFFFF',
                border: '1px solid #DBEAFE',
                boxShadow: '0 6px 18px rgba(30, 64, 255, 0.12)',
                padding: 6,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <img src="/imgs/autodata/ICON.png" alt="Logo robot" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <h1 style={{ fontSize: '1.18rem', fontWeight: 800, color: '#0F172A', margin: 0 }}>
                  Trung Tâm Phê Duyệt Đa Cấp Động (N Bước)
                </h1>
                <Badge tone="primary">{packageMeta.shortName}</Badge>
                <Badge tone="success" icon={<Lock size={11} />}>
                  Scope: {activeScope}
                </Badge>
              </div>
              <p style={{ fontSize: '0.82rem', color: '#64748B', margin: '4px 0 0' }}>
                Giải quyết người duyệt tự động theo Sơ đồ Tổ chức, ngưỡng ngân sách động & ủy quyền duyệt thay có thời hạn
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <ScreenHelpButton screenKey="erp_approvals" />
            <button
              type="button"
              onClick={() => void loadAllData()}
              className="btn secondary"
              style={{ height: 44, padding: '0 0.95rem', display: 'inline-flex', alignItems: 'center', gap: 6 }}
            >
              <RefreshCw size={15} /> Làm mới
            </button>
            {canCreate && (
              <button
                type="button"
                onClick={() => setNewReqOpen(true)}
                style={{
                  height: 44,
                  padding: '0 1.25rem',
                  borderRadius: 12,
                  border: 'none',
                  background: '#1E40FF',
                  color: '#FFFFFF',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 7,
                  cursor: 'pointer',
                  boxShadow: '0 6px 18px rgba(30, 64, 255, 0.24)',
                }}
              >
                <Plus size={16} /> Tạo tờ trình mới
              </button>
            )}
          </div>
        </div>
      </Card>

      {/* Summary KPI Strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '1rem' }}>
        <Card padding="1.05rem 1.25rem">
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748B' }}>CẦN TÔI PHÊ DUYỆT</div>
          <div style={{ fontSize: '1.65rem', fontWeight: 800, color: '#1E40FF', marginTop: 4 }}>
            {overview?.summary.pending_to_approve ?? inboxRequests.length}
          </div>
          <div style={{ fontSize: '0.76rem', color: '#64748B', marginTop: 2 }}>Tờ trình đang chờ ở bước của bạn</div>
        </Card>
        <Card padding="1.05rem 1.25rem">
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748B' }}>TỜ TRÌNH TÔI GỬI ĐANG CHỜ</div>
          <div style={{ fontSize: '1.65rem', fontWeight: 800, color: '#0F172A', marginTop: 4 }}>
            {overview?.summary.my_pending_requests ?? 0}
          </div>
          <div style={{ fontSize: '0.76rem', color: '#64748B', marginTop: 2 }}>Theo dõi thời gian thực từng bước</div>
        </Card>
        <Card padding="1.05rem 1.25rem">
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748B' }}>ĐÃ PHÊ DUYỆT HOÀN TẤT</div>
          <div style={{ fontSize: '1.65rem', fontWeight: 800, color: '#059669', marginTop: 4 }}>
            {overview?.summary.approved_requests ?? 0}
          </div>
          <div style={{ fontSize: '0.76rem', color: '#64748B', marginTop: 2 }}>Đồng bộ tự động sang HR & Chấm công</div>
        </Card>
        <Card padding="1.05rem 1.25rem">
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748B' }}>LUỒNG ĐỘNG & ỦY QUYỀN</div>
          <div style={{ fontSize: '1.65rem', fontWeight: 800, color: '#0284C7', marginTop: 4 }}>
            {workflows.filter((w) => w.is_active).length} / {delegations.filter((d) => d.is_active).length}
          </div>
          <div style={{ fontSize: '0.76rem', color: '#64748B', marginTop: 2 }}>Quy trình đang bật / Ủy quyền vắng mặt</div>
        </Card>
      </div>

      {/* Navigation Tabs */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <PillTabs<ApprovalsTabKey>
          activeKey={activeTab}
          onChange={setActiveTab}
          tabs={[
            { key: 'inbox', label: 'Hộp thư cần tôi duyệt', icon: <Inbox size={15} />, count: inboxRequests.length },
            { key: 'mine', label: 'Tờ trình của tôi', icon: <Send size={15} />, count: myRequests.length },
            { key: 'all', label: 'Toàn bộ tờ trình', icon: <FileCheck2 size={15} />, count: allRequests.length },
            { key: 'workflows', label: 'Thiết kế Luồng N Bước', icon: <GitBranch size={15} />, count: workflows.length },
            { key: 'delegations', label: 'Ủy quyền Vắng mặt', icon: <UserCheck size={15} />, count: delegations.length },
          ]}
        />

        {(activeTab === 'inbox' || activeTab === 'mine' || activeTab === 'all') && (
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <div style={{ position: 'relative' }}>
              <Search size={15} color="#64748B" style={{ position: 'absolute', left: 12, top: 14 }} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm mã đơn, tiêu đề, người gửi..."
                style={{
                  height: 44,
                  padding: '0 0.85rem 0 2.2rem',
                  borderRadius: 12,
                  border: '1px solid #CBD5E1',
                  background: '#FFFFFF',
                  fontSize: '0.84rem',
                  minWidth: 230,
                }}
              />
            </div>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              style={{
                height: 44,
                padding: '0 0.85rem',
                borderRadius: 12,
                border: '1px solid #CBD5E1',
                background: '#FFFFFF',
                fontSize: '0.84rem',
              }}
            >
              <option value="all">Tất cả phân loại</option>
              {Object.entries(CATEGORY_LABELS).map(([k, lbl]) => (
                <option key={k} value={k}>
                  {lbl}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Tab Content */}
      {(activeTab === 'inbox' || activeTab === 'mine' || activeTab === 'all') && (
        <Table<ApprovalRequestDto>
          columns={requestColumns}
          rows={displayedRequests}
          rowKey={(r) => r.id}
          onRowClick={(r) => setSelectedRequest(r)}
          emptyTitle={
            activeTab === 'inbox'
              ? 'Tuyệt vời! Bạn đã xử lý hết tờ trình chờ duyệt'
              : 'Chưa có tờ trình phê duyệt nào'
          }
          emptyDescription="Khởi tạo tờ trình mới để hệ thống tự động định tuyến đến cấp quản lý theo Sơ đồ Tổ chức."
          emptyAction={
            canCreate ? (
              <button
                type="button"
                onClick={() => setNewReqOpen(true)}
                style={{
                  height: 44,
                  padding: '0 1.25rem',
                  borderRadius: 12,
                  border: 'none',
                  background: '#1E40FF',
                  color: '#FFFFFF',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                + Tạo tờ trình đầu tiên
              </button>
            ) : undefined
          }
        />
      )}

      {activeTab === 'workflows' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
            <div style={{ fontSize: '0.86rem', color: '#475569' }}>
              Mỗi doanh nghiệp có thể cấu hình không giới hạn số bước duyệt, vai trò duyệt và hạn mức kích hoạt riêng biệt.
            </div>
            {canManageConfig && (
              <button
                type="button"
                onClick={() => {
                  setEditingWorkflow(null);
                  setWfBuilderOpen(true);
                }}
                style={{
                  height: 44,
                  padding: '0 1.25rem',
                  borderRadius: 12,
                  border: 'none',
                  background: '#1E40FF',
                  color: '#FFFFFF',
                  fontWeight: 700,
                  fontSize: '0.84rem',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  cursor: 'pointer',
                }}
              >
                <Settings size={15} /> Thiết kế quy trình N bước mới
              </button>
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1rem' }}>
            {workflows.map((wf) => (
              <FormCard
                key={wf.id}
                icon={<GitBranch size={19} />}
                title={wf.name}
                description={wf.description || CATEGORY_LABELS[wf.category as ApprovalCategory]}
                badge={
                  <Badge tone={wf.is_active ? 'success' : 'neutral'}>
                    {wf.is_active ? 'Đang hoạt động' : 'Tạm ngưng'}
                  </Badge>
                }
                footer={
                  <>
                    <span style={{ fontSize: '0.76rem', color: '#64748B', fontWeight: 600 }}>
                      {wf.steps.length} cấp duyệt • {(wf.form_schema || []).length} trường động
                    </span>
                    {canManageConfig && (
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button
                          type="button"
                          onClick={() => handleToggleWorkflow(wf)}
                          className="btn secondary"
                          style={{ height: 34, padding: '0 10px', fontSize: '0.76rem' }}
                        >
                          {wf.is_active ? 'Tạm tắt' : 'Bật lại'}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setEditingWorkflow(wf);
                            setWfBuilderOpen(true);
                          }}
                          className="btn secondary"
                          style={{ height: 34, padding: '0 10px', fontSize: '0.76rem', color: '#1E40FF', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                        >
                          <Edit2 size={13} /> Cấu hình
                        </button>
                      </div>
                    )}
                  </>
                }
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {wf.steps.map((s) => (
                    <div
                      key={`${wf.id}-${s.step_order}`}
                      style={{
                        padding: '0.45rem 0.7rem',
                        borderRadius: 10,
                        background: '#F8F9FA',
                        fontSize: '0.78rem',
                        display: 'flex',
                        justifyContent: 'space-between',
                        gap: 8,
                      }}
                    >
                      <span>
                        <strong>B{s.step_order}:</strong> {s.step_name} (
                        {APPROVER_TYPE_LABELS[s.approver_type] || s.approver_type})
                      </span>
                      {s.min_amount_threshold > 0 ? (
                        <Badge tone="warning">≥ {formatVnd(s.min_amount_threshold)}</Badge>
                      ) : (
                        <Badge tone="info">Mọi hạn mức</Badge>
                      )}
                    </div>
                  ))}
                </div>
              </FormCard>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'delegations' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
            <div style={{ fontSize: '0.85rem', color: '#475569' }}>
              Khi người quản lý vắng mặt / đi công tác, mọi tờ trình trong thời hạn hiệu lực sẽ tự động định tuyến sang người nhận ủy quyền.
            </div>
            {canCreate && (
              <button
                type="button"
                onClick={() => setDelegationModalOpen(true)}
                style={{
                  height: 44,
                  padding: '0 1.25rem',
                  borderRadius: 12,
                  border: 'none',
                  background: '#1E40FF',
                  color: '#FFFFFF',
                  fontWeight: 700,
                  fontSize: '0.84rem',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  cursor: 'pointer',
                }}
              >
                <Clock size={15} /> Thiết lập ủy quyền mới
              </button>
            )}
          </div>

          {delegations.length === 0 ? (
            <EmptyState
              icon={<CheckCircle2 size={24} />}
              title="Chưa có lịch ủy quyền vắng mặt nào đang bật"
              description="Thiết lập ủy quyền có thời hạn để không làm gián đoạn tiến độ phê duyệt nội bộ khi đi công tác."
            />
          ) : (
            <Table<ApprovalDelegationDto>
              columns={delegationColumns}
              rows={delegations}
              rowKey={(d) => d.id}
            />
          )}
        </div>
      )}

      {/* Modals */}
      <NewApprovalRequestModal
        isOpen={newReqOpen}
        onClose={() => setNewReqOpen(false)}
        workflows={workflows}
        token={token}
        tenantSlug={tenantSlug}
        onCreated={() => void loadAllData()}
      />

      <ApprovalRequestDetailModal
        request={selectedRequest}
        onClose={() => setSelectedRequest(null)}
        canApprove={canApprove}
        token={token}
        tenantSlug={tenantSlug}
        onDecided={() => void loadAllData()}
      />

      {wfBuilderOpen && (
        <WorkflowBuilderModal
          key={editingWorkflow?.id || 'new-wf'}
          isOpen={wfBuilderOpen}
          onClose={() => setWfBuilderOpen(false)}
          editingWorkflow={editingWorkflow}
          users={overview?.directory.users || []}
          roles={overview?.directory.roles || []}
          token={token}
          tenantSlug={tenantSlug}
          onSaved={() => void loadAllData()}
        />
      )}

      <DelegationCreateModal
        isOpen={delegationModalOpen}
        onClose={() => setDelegationModalOpen(false)}
        users={overview?.directory.users || []}
        token={token}
        tenantSlug={tenantSlug}
        onSaved={() => void loadAllData()}
      />
    </div>
  );
};

export default ErpApprovalsWave2Entry;
