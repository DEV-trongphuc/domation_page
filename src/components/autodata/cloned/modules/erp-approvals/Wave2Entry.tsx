import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  CheckCircle2,
  CheckSquare,
  Clock,
  Edit2,
  Eye,
  FileCheck2,
  GitBranch,
  Inbox,
  Lock,
  PenTool,
  Plus,
  RefreshCw,
  Search,
  Send,
  Settings,
  Trash2,
  UserCheck,
  XCircle,
} from 'lucide-react';
import toast from 'react-hot-toast';
import {
  Badge,
  Card,
  EmptyState,
  FormCard,
  PillTabs,
  Table,
  type TableColumn,
} from '../../components/ui/AutoDataLoadingModal';
import { ApprovalsTabSkeleton } from '../../components/ui/Skeleton';
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
  DelegationCreateModal,
  NewApprovalRequestModal,
  RequestSlaInlineBadge,
  StepTimelineInlineBadge,
} from './ApprovalModals';
import { ApprovalDetailDrawer } from './ApprovalDetailDrawer';
import { ApprovalRuleBuilderModal } from './ApprovalRuleBuilderModal';

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
  const [nowMs, setNowMs] = useState<number>(() => new Date().getTime());

  const [overview, setOverview] = useState<ApprovalsOverviewDto | null>(null);
  const [workflows, setWorkflows] = useState<ApprovalWorkflowDto[]>([]);
  const [inboxRequests, setInboxRequests] = useState<ApprovalRequestDto[]>([]);
  const [myRequests, setMyRequests] = useState<ApprovalRequestDto[]>([]);
  const [allRequests, setAllRequests] = useState<ApprovalRequestDto[]>([]);
  const [delegations, setDelegations] = useState<ApprovalDelegationDto[]>([]);

  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  // Batch Multi-Select State on Pending Inbox
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [batchComment, setBatchComment] = useState('');
  const [batchBusy, setBatchBusy] = useState(false);

  // Slide-over Drawer & Studio Modals
  const [newReqOpen, setNewReqOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<ApprovalRequestDto | null>(null);
  const [wfBuilderOpen, setWfBuilderOpen] = useState(false);
  const [editingWorkflow, setEditingWorkflow] = useState<ApprovalWorkflowDto | null>(null);
  const [delegationModalOpen, setDelegationModalOpen] = useState(false);

  useEffect(() => {
    const timer = window.setInterval(() => setNowMs(new Date().getTime()), 30_000);
    return () => window.clearInterval(timer);
  }, []);

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
      const nextInbox = Array.isArray(inbRes) ? inbRes : [];
      setInboxRequests(nextInbox);
      setMyRequests(Array.isArray(mineRes) ? mineRes : []);
      setAllRequests(Array.isArray(allRes) ? allRes : []);
      setDelegations(Array.isArray(delRes) ? delRes : []);
      setSelectedIds((prev) => prev.filter((id) => nextInbox.some((r) => r.id === id && r.status === 'pending')));
    } finally {
      setLoading(false);
    }
  }, [token, tenantSlug]);

  useEffect(() => {
    void loadAllData();
  }, [loadAllData]);

  const handleQuickDecide = useCallback(
    async (reqItem: ApprovalRequestDto, decision: 'approve' | 'reject') => {
      try {
        await apiRequest(`/approvals/requests/${reqItem.id}/decide`, {
          method: 'POST',
          token,
          tenantSlug,
          body: {
            decision,
            comment: decision === 'approve' ? 'Phê duyệt nhanh tại Hộp thư chờ duyệt' : 'Từ chối nhanh',
          },
        });
        toast.success(
          decision === 'approve' ? `Đã phê duyệt ${reqItem.request_code}!` : `Đã từ chối ${reqItem.request_code}.`
        );
        await loadAllData();
      } catch (err) {
        toast.error(getErrorMessage(err, 'Không thể xử lý phê duyệt nhanh.'));
      }
    },
    [token, tenantSlug, loadAllData]
  );

  const handleBatchDecide = async (decision: 'approve' | 'reject') => {
    if (selectedIds.length === 0) return;
    setBatchBusy(true);
    try {
      const res = await apiRequest<{ processed_count?: number }>('/approvals/requests/batch-decide', {
        method: 'POST',
        token,
        tenantSlug,
        body: {
          request_ids: selectedIds,
          decision,
          comment:
            batchComment.trim() ||
            (decision === 'approve' ? 'Phê duyệt hàng loạt (Batch Approve)' : 'Từ chối hàng loạt (Batch Reject)'),
        },
      });
      const count = res?.processed_count ?? selectedIds.length;
      toast.success(
        decision === 'approve'
          ? `Đã phê duyệt hàng loạt ${count} tờ trình thành công!`
          : `Đã từ chối hàng loạt ${count} tờ trình!`
      );
      setSelectedIds([]);
      setBatchComment('');
      await loadAllData();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Không thể xử lý phê duyệt hàng loạt.'));
    } finally {
      setBatchBusy(false);
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

  const handleToggleDelegation = useCallback(
    async (del: ApprovalDelegationDto) => {
      try {
        await apiRequest(`/approvals/delegations/${del.id}`, {
          method: 'PATCH',
          token,
          tenantSlug,
          body: { is_active: !del.is_active },
        });
        toast.success(del.is_active ? 'Đã tạm tắt lịch ủy quyền.' : 'Đã bật lại lịch ủy quyền.');
        await loadAllData();
      } catch (err) {
        toast.error(getErrorMessage(err, 'Không thể cập nhật trạng thái ủy quyền.'));
      }
    },
    [token, tenantSlug, loadAllData]
  );

  const handleDeleteDelegation = useCallback(
    async (id: string) => {
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
    },
    [token, tenantSlug, loadAllData]
  );

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

  const actionableInboxIds = useMemo(
    () =>
      displayedRequests
        .filter((r) => activeTab === 'inbox' && r.status === 'pending' && r.can_current_user_act)
        .map((r) => r.id),
    [displayedRequests, activeTab]
  );

  const allActionableSelected =
    actionableInboxIds.length > 0 && actionableInboxIds.every((id) => selectedIds.includes(id));

  const toggleSelectRow = useCallback((id: string) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }, []);

  const toggleSelectAll = useCallback(() => {
    if (allActionableSelected) {
      setSelectedIds([]);
    } else {
      setSelectedIds(actionableInboxIds);
    }
  }, [allActionableSelected, actionableInboxIds]);

  const selectedTotalVnd = useMemo(
    () =>
      inboxRequests
        .filter((r) => selectedIds.includes(r.id))
        .reduce((sum, r) => sum + Number(r.amount_vnd || 0), 0),
    [inboxRequests, selectedIds]
  );

  const requestColumns = useMemo<ReadonlyArray<TableColumn<ApprovalRequestDto>>>(() => {
    const cols: TableColumn<ApprovalRequestDto>[] = [];

    if (activeTab === 'inbox' && canApprove) {
      cols.push({
        key: 'select',
        width: 46,
        align: 'center',
        header: (
          <input
            type="checkbox"
            checked={allActionableSelected}
            onChange={toggleSelectAll}
            title="Chọn tất cả tờ trình chờ duyệt"
            style={{ width: 16, height: 16, cursor: 'pointer', accentColor: '#1E40FF' }}
          />
        ),
        render: (row) => {
          const disabled = !(row.status === 'pending' && row.can_current_user_act);
          return (
            <div onClick={(e) => e.stopPropagation()}>
              <input
                type="checkbox"
                disabled={disabled}
                checked={selectedIds.includes(row.id)}
                onChange={() => toggleSelectRow(row.id)}
                style={{ width: 16, height: 16, cursor: disabled ? 'not-allowed' : 'pointer', accentColor: '#1E40FF' }}
              />
            </div>
          );
        },
      });
    }

    cols.push(
      {
        key: 'code',
        header: 'Mã & Tờ trình Chứng từ Gốc',
        render: (row) => (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
              <span style={{ fontWeight: 800, color: '#0F172A' }}>{row.title}</span>
              <RequestSlaInlineBadge req={row} nowMs={nowMs} />
            </div>
            <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: 3 }}>
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
        header: 'Lộ trình N Bước & OOO',
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
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }} onClick={(e) => e.stopPropagation()}>
            {canApprove && row.status === 'pending' && row.can_current_user_act && (
              <>
                <button
                  type="button"
                  onClick={() => void handleQuickDecide(row, 'approve')}
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
                  onClick={() => void handleQuickDecide(row, 'reject')}
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
              <Eye size={13} color="#1E40FF" /> Chi tiết 360°
            </button>
          </div>
        ),
      }
    );

    return cols;
  }, [
    activeTab,
    canApprove,
    allActionableSelected,
    toggleSelectAll,
    selectedIds,
    toggleSelectRow,
    nowMs,
    handleQuickDecide,
  ]);

  const delegationColumns = useMemo<ReadonlyArray<TableColumn<ApprovalDelegationDto>>>(
    () => [
      {
        key: 'delegator',
        header: 'Người ủy quyền',
        render: (d) => <span style={{ fontWeight: 700 }}>{d.delegator_name || d.delegator_email}</span>,
      },
      {
        key: 'delegate',
        header: 'Người duyệt thay (OOO)',
        render: (d) => <Badge tone="primary">{d.delegate_name || d.delegate_email}</Badge>,
      },
      {
        key: 'scope',
        header: 'Phạm vi áp dụng',
        render: (d) =>
          !d.categories || d.categories.length === 0 ? (
            <Badge tone="info">Toàn bộ phân loại</Badge>
          ) : (
            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
              {d.categories.map((c) => (
                <Badge key={c} tone="neutral">
                  {CATEGORY_LABELS[c as ApprovalCategory] || c}
                </Badge>
              ))}
            </div>
          ),
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
        key: 'st',
        header: 'Trạng thái',
        render: (d) => (
          <Badge tone={d.is_active ? 'success' : 'neutral'}>
            {d.is_active ? 'Đang kích hoạt' : 'Tạm ngưng'}
          </Badge>
        ),
      },
      {
        key: 'act',
        header: '',
        align: 'right',
        render: (d) => (
          <div style={{ display: 'inline-flex', gap: 6 }}>
            <button
              type="button"
              onClick={() => void handleToggleDelegation(d)}
              className="btn secondary"
              style={{ height: 34, padding: '0 10px', fontSize: '0.76rem' }}
            >
              {d.is_active ? 'Tạm tắt' : 'Bật lại'}
            </button>
            <button
              type="button"
              onClick={() => void handleDeleteDelegation(d.id)}
              className="btn secondary"
              style={{ height: 34, padding: '0 10px', color: '#DC2626' }}
            >
              <Trash2 size={14} />
            </button>
          </div>
        ),
      },
    ],
    [handleToggleDelegation, handleDeleteDelegation]
  );

  if (loading) {
    return <ApprovalsTabSkeleton />;
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
              <img src="/imgs/autodata/ICON.png" alt="DOMATION" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <h1 style={{ fontSize: '1.18rem', fontWeight: 800, color: '#0F172A', margin: 0 }}>
                  Trung Tâm Phê Duyệt Đa Cấp Động, Liên Kết Chứng Từ Gốc & SLA
                </h1>
                <Badge tone="primary">{packageMeta.shortName}</Badge>
                <Badge tone="success" icon={<Lock size={11} />}>
                  Scope: {activeScope}
                </Badge>
              </div>
              <p style={{ fontSize: '0.82rem', color: '#64748B', margin: '4px 0 0' }}>
                Xem trước Đặt cọc VietQR, Chi phí VAT, Quỹ phép năm, PO/SO ngay trên ngăn kéo phê duyệt • Duyệt hàng loạt & Nhánh điều kiện động
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
          <div style={{ fontSize: '0.76rem', color: '#64748B', marginTop: 2 }}>Hỗ trợ chọn nhiều đơn duyệt hàng loạt</div>
        </Card>
        <Card padding="1.05rem 1.25rem">
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748B' }}>TỜ TRÌNH TÔI GỬI ĐANG CHỜ</div>
          <div style={{ fontSize: '1.65rem', fontWeight: 800, color: '#0F172A', marginTop: 4 }}>
            {overview?.summary.my_pending_requests ?? 0}
          </div>
          <div style={{ fontSize: '0.76rem', color: '#64748B', marginTop: 2 }}>Giám sát cảnh báo SLA từng bước</div>
        </Card>
        <Card padding="1.05rem 1.25rem">
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748B' }}>ĐÃ PHÊ DUYỆT HOÀN TẤT</div>
          <div style={{ fontSize: '1.65rem', fontWeight: 800, color: '#059669', marginTop: 4 }}>
            {overview?.summary.approved_requests ?? 0}
          </div>
          <div style={{ fontSize: '0.76rem', color: '#64748B', marginTop: 2 }}>Đồng bộ tự động sang HR, Công & Quỹ</div>
        </Card>
        <Card padding="1.05rem 1.25rem">
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748B' }}>LUỒNG ĐỘNG & ỦY QUYỀN OOO</div>
          <div style={{ fontSize: '1.65rem', fontWeight: 800, color: '#0284C7', marginTop: 4 }}>
            {workflows.filter((w) => w.is_active).length} / {delegations.filter((d) => d.is_active).length}
          </div>
          <div style={{ fontSize: '0.76rem', color: '#64748B', marginTop: 2 }}>Quy trình nhánh điều kiện / Ủy quyền bật</div>
        </Card>
      </div>

      {/* Navigation Tabs & Filters */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <PillTabs<ApprovalsTabKey>
          activeKey={activeTab}
          onChange={(k) => {
            setActiveTab(k);
            setSelectedIds([]);
          }}
          tabs={[
            { key: 'inbox', label: 'Hộp thư cần tôi duyệt', icon: <Inbox size={15} />, count: inboxRequests.length },
            { key: 'mine', label: 'Tờ trình của tôi', icon: <Send size={15} />, count: myRequests.length },
            { key: 'all', label: 'Toàn bộ tờ trình', icon: <FileCheck2 size={15} />, count: allRequests.length },
            { key: 'workflows', label: 'Thiết kế Nhánh Điều kiện', icon: <GitBranch size={15} />, count: workflows.length },
            { key: 'delegations', label: 'Ủy quyền Vắng mặt (OOO)', icon: <UserCheck size={15} />, count: delegations.length },
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

      {/* Sticky Batch Approve / Reject Action Bar */}
      {activeTab === 'inbox' && selectedIds.length > 0 && (
        <div
          style={{
            position: 'sticky',
            top: 8,
            zIndex: 30,
            padding: '0.85rem 1.25rem',
            borderRadius: 16,
            background: '#FFFFFF',
            border: '1.5px solid #1E40FF',
            boxShadow: '0 12px 28px rgba(30, 64, 255, 0.18)',
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <Badge tone="primary" icon={<CheckSquare size={12} />}>
              Đã chọn {selectedIds.length} tờ trình
            </Badge>
            {selectedTotalVnd > 0 && (
              <span style={{ fontSize: '0.84rem', fontWeight: 800, color: '#0F172A' }}>
                Tổng ngân sách: <span style={{ color: '#1E40FF' }}>{formatVnd(selectedTotalVnd)}</span>
              </span>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', flex: '1 1 360px', justifyContent: 'flex-end' }}>
            <input
              type="text"
              value={batchComment}
              onChange={(e) => setBatchComment(e.target.value)}
              placeholder="Ghi chú phê duyệt / từ chối hàng loạt..."
              style={{
                height: 40,
                padding: '0 0.85rem',
                borderRadius: 10,
                border: '1px solid #CBD5E1',
                background: '#F8F9FA',
                fontSize: '0.82rem',
                minWidth: 210,
                flex: '1 1 210px',
                maxWidth: 320,
              }}
            />
            <button
              type="button"
              disabled={batchBusy}
              onClick={() => void handleBatchDecide('reject')}
              style={{
                height: 40,
                padding: '0 1rem',
                borderRadius: 10,
                border: '1px solid rgba(220, 38, 38, 0.3)',
                background: 'rgba(220, 38, 38, 0.08)',
                color: '#DC2626',
                fontWeight: 700,
                fontSize: '0.82rem',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                cursor: 'pointer',
              }}
            >
              <XCircle size={15} /> Từ chối hàng loạt ({selectedIds.length})
            </button>
            <button
              type="button"
              disabled={batchBusy}
              onClick={() => void handleBatchDecide('approve')}
              style={{
                height: 40,
                padding: '0 1.2rem',
                borderRadius: 10,
                border: 'none',
                background: '#1E40FF',
                color: '#FFFFFF',
                fontWeight: 700,
                fontSize: '0.82rem',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                cursor: 'pointer',
              }}
            >
              <CheckCircle2 size={15} /> {batchBusy ? 'Đang xử lý...' : `Duyệt hàng loạt (${selectedIds.length})`}
            </button>
          </div>
        </div>
      )}

      {/* Request Table Tabs */}
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
          emptyDescription="Khởi tạo tờ trình mới để hệ thống tự động định tuyến đến cấp quản lý theo Sơ đồ Tổ chức & Nhánh hạn mức."
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

      {/* Condition-Branch Workflow Studio Tab */}
      {activeTab === 'workflows' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
            <div style={{ fontSize: '0.85rem', color: '#475569' }}>
              Thiết lập chuỗi N bước duyệt với điều kiện rẽ nhánh `≥ hạn mức tối thiểu` / `≤ hạn mức trần`, thời gian SLA và bắt buộc ký số.
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
                <Settings size={15} /> Thiết kế quy trình điều kiện mới
              </button>
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(330px, 1fr))', gap: '1rem' }}>
            {workflows.map((wf) => (
              <FormCard
                key={wf.id}
                icon={<GitBranch size={19} />}
                title={wf.name}
                description={wf.description || CATEGORY_LABELS[wf.category]}
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
                          onClick={() => void handleToggleWorkflow(wf)}
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
                          <Edit2 size={13} /> Nhánh điều kiện
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
                        padding: '0.5rem 0.75rem',
                        borderRadius: 10,
                        background: '#F8F9FA',
                        fontSize: '0.77rem',
                        display: 'flex',
                        flexWrap: 'wrap',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        gap: 6,
                      }}
                    >
                      <span>
                        <strong>B{s.step_order}:</strong> {s.step_name} (
                        {APPROVER_TYPE_LABELS[s.approver_type] || s.approver_type})
                      </span>
                      <div style={{ display: 'inline-flex', gap: 4, alignItems: 'center' }}>
                        {s.require_signature && <PenTool size={12} color="#7E22CE" />}
                        <Badge tone="neutral">{s.sla_hours}h SLA</Badge>
                        {s.min_amount_threshold > 0 || (s.max_amount_threshold && s.max_amount_threshold > 0) ? (
                          <Badge tone="warning">
                            ≥ {formatVnd(s.min_amount_threshold)}
                            {s.max_amount_threshold ? ` ≤ ${formatVnd(s.max_amount_threshold)}` : ''}
                          </Badge>
                        ) : (
                          <Badge tone="info">Mọi hạn mức</Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </FormCard>
            ))}
          </div>
        </div>
      )}

      {/* Out-of-Office Delegation Tab */}
      {activeTab === 'delegations' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
            <div style={{ fontSize: '0.85rem', color: '#475569' }}>
              Khi lãnh đạo / trưởng bộ phận đi công tác hoặc nghỉ phép, hệ thống tự động chuyển quyền duyệt sang người nhận ủy quyền trong thời hạn hiệu lực.
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
                <Clock size={15} /> Thiết lập ủy quyền OOO mới
              </button>
            )}
          </div>

          {delegations.length === 0 ? (
            <EmptyState
              icon={<CheckCircle2 size={24} />}
              title="Chưa có lịch ủy quyền vắng mặt (Out-of-Office) nào"
              description="Thiết lập ủy quyền có thời hạn để không làm gián đoạn SLA phê duyệt khi đi công tác."
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

      {/* Drawers & Modals */}
      <NewApprovalRequestModal
        isOpen={newReqOpen}
        onClose={() => setNewReqOpen(false)}
        workflows={workflows}
        token={token}
        tenantSlug={tenantSlug}
        onCreated={() => void loadAllData()}
      />

      <ApprovalDetailDrawer
        request={selectedRequest}
        workflows={workflows}
        onClose={() => setSelectedRequest(null)}
        canApprove={canApprove}
        token={token}
        tenantSlug={tenantSlug}
        onDecided={() => void loadAllData()}
      />

      {wfBuilderOpen && (
        <ApprovalRuleBuilderModal
          key={editingWorkflow?.id || 'new-rule-wf'}
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

export const Wave2Entry = ErpApprovalsWave2Entry;
export default ErpApprovalsWave2Entry;
