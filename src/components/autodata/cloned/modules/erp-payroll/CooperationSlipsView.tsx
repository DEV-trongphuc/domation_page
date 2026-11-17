import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Edit3,
  Handshake,
  PenTool,
  Plus,
  Search,
  ShieldCheck,
  Users,
} from 'lucide-react';
import { Badge, Card, EmptyState, PillTabs } from '../../components/ui/AutoDataLoadingModal';
import { apiRequest, formatShortDate, formatVnd } from '../../../autodataApi';
import { useAuth } from '../../contexts/AuthContext';
import { useEntitlement } from '../../contexts/EntitlementContext';
import {
  CooperationSignAndActionModals,
  CreateCooperationSlipModal,
  UpdateSharesModal,
} from './CooperationSlipModals';
import { HrmTimesheetSkeleton } from './PayrollSkeleton';
import {
  PAYROLL_SHARED_INPUT_STYLE,
  extractCoopSalesAccounts,
  normalizeCooperationSlipsList,
  percentageToVietnameseWords,
  type CooperationSlipDto,
  type CooperationSlipStatus,
  type TenantDirectoryMemberDto,
} from './payrollTypes';

type StatusFilterKey = 'all' | CooperationSlipStatus;

export interface CooperationSlipsViewProps {
  embedded?: boolean;
}

const STATUS_BADGE_MAP: Record<
  CooperationSlipStatus,
  { label: string; tone: 'warning' | 'info' | 'success' | 'danger' }
> = {
  pending_signatures: { label: 'Chờ cổ đông ký số', tone: 'warning' },
  pending_manager_approval: { label: 'Chờ Quản lý duyệt', tone: 'info' },
  approved: { label: 'Đã phê duyệt chốt chia', tone: 'success' },
  disputed: { label: 'Đang khiếu nại / Điều chỉnh', tone: 'danger' },
  rejected: { label: 'Đã từ chối', tone: 'danger' },
};

export const CooperationSlipsView: React.FC<CooperationSlipsViewProps> = ({
  embedded = false,
}) => {
  const { token, tenantSlug, user } = useAuth();
  const { can } = useEntitlement();

  const canCreate = can('erp_payroll', 'create') || Boolean(user);
  const canApprove =
    can('erp_payroll', 'approve') ||
    user?.role === 'superadmin' ||
    user?.role === 'admin' ||
    Boolean(user?.is_tenant_owner);

  const [loading, setLoading] = useState(true);
  const [slips, setSlips] = useState<CooperationSlipDto[]>([]);
  const [directory, setDirectory] = useState<TenantDirectoryMemberDto[]>([]);
  const [statusFilter, setStatusFilter] = useState<StatusFilterKey>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const [createOpen, setCreateOpen] = useState(false);
  const [editingSharesSlip, setEditingSharesSlip] = useState<CooperationSlipDto | null>(null);
  const [signingSlip, setSigningSlip] = useState<CooperationSlipDto | null>(null);
  const [decidingSlip, setDecidingSlip] = useState<CooperationSlipDto | null>(null);
  const [disputingSlip, setDisputingSlip] = useState<CooperationSlipDto | null>(null);

  const loadCooperationWorkspace = useCallback(async () => {
    try {
      const qs = new URLSearchParams();
      if (statusFilter !== 'all') qs.set('status', statusFilter);
      if (searchQuery.trim()) qs.set('q', searchQuery.trim());
      const suffix = qs.toString() ? `?${qs.toString()}` : '';

      const [slipsRaw, overviewRaw] = await Promise.all([
        apiRequest<unknown>(`/payroll/cooperation-slips${suffix}`, {
          token,
          tenantSlug,
        }).catch(() => []),
        apiRequest<{ directory?: { users?: Array<Record<string, unknown>> } }>(
          '/approvals/overview',
          { token, tenantSlug }
        ).catch(() => null),
      ]);

      const normalizedSlips = normalizeCooperationSlipsList(slipsRaw);
      setSlips(normalizedSlips);

      const dirMap = new Map<string, TenantDirectoryMemberDto>();
      if (user?.id) {
        dirMap.set(String(user.id), {
          id: String(user.id),
          full_name: user.name || user.username,
          email: user.email || '',
          role: user.role,
        });
      }
      for (const sa of extractCoopSalesAccounts(slipsRaw)) {
        if (sa.id) dirMap.set(sa.id, sa);
      }
      const rawUsers = overviewRaw?.directory?.users;
      if (Array.isArray(rawUsers)) {
        for (const u of rawUsers) {
          const uid = String(u.id || '');
          if (!uid) continue;
          dirMap.set(uid, {
            id: uid,
            full_name: String(u.full_name || u.email || uid),
            email: String(u.email || ''),
            role: u.role ? String(u.role) : undefined,
          });
        }
      }
      for (const sl of normalizedSlips) {
        for (const sh of sl.shareholders) {
          if (sh.user_id && !dirMap.has(sh.user_id)) {
            dirMap.set(sh.user_id, {
              id: sh.user_id,
              full_name: sh.user_name || sh.user_id,
              email: sh.email || '',
            });
          }
        }
      }
      setDirectory(Array.from(dirMap.values()));
    } finally {
      setLoading(false);
    }
  }, [token, tenantSlug, statusFilter, searchQuery, user]);

  useEffect(() => {
    void loadCooperationWorkspace();
  }, [loadCooperationWorkspace]);

  const filteredSlips = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return slips.filter((sl) => {
      if (statusFilter !== 'all' && sl.status !== statusFilter) return false;
      if (!q) return true;
      const hay = [
        sl.code,
        sl.customer_name,
        sl.customer_phone,
        sl.deal_code,
        sl.project_name,
        ...sl.shareholders.map((s) => `${s.user_name} ${s.email}`),
      ]
        .join(' ')
        .toLowerCase();
      return hay.includes(q);
    });
  }, [slips, statusFilter, searchQuery]);

  const metrics = useMemo(() => {
    let pendingSig = 0;
    let pendingMgr = 0;
    let approvedCnt = 0;
    let disputedCnt = 0;
    let totalCommission = 0;

    for (const s of slips) {
      totalCommission += s.expected_commission_vnd;
      if (s.status === 'pending_signatures') pendingSig++;
      else if (s.status === 'pending_manager_approval') pendingMgr++;
      else if (s.status === 'approved') approvedCnt++;
      else if (s.status === 'disputed') disputedCnt++;
    }
    return { pendingSig, pendingMgr, approvedCnt, disputedCnt, totalCommission };
  }, [slips]);

  if (loading) {
    return <HrmTimesheetSkeleton />;
  }

  return (
    <div style={{ background: '#F8F9FA', display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
      {!embedded && (
        <Card
          padding="1.25rem 1.5rem"
          style={{ background: 'linear-gradient(135deg, #FFFFFF 0%, #F8FAFF 100%)' }}
        >
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 12,
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <h1 style={{ margin: 0, fontSize: '1.18rem', fontWeight: 800, color: '#0F172A' }}>
                  Phiếu Hợp Tác Kinh Doanh & Chia Sẻ Hoa Hồng Đa Sale
                </h1>
                <Badge tone="primary">Đồng thuận chữ ký số 100%</Badge>
              </div>
              <p style={{ margin: '4px 0 0', fontSize: '0.82rem', color: '#64748B' }}>
                Minh bạch tỷ lệ phần trăm đóng góp bằng số & bằng chữ, lưu vết chữ ký điện tử từng cổ đông và phê duyệt tự động vào bảng lương.
              </p>
            </div>

            {canCreate && (
              <button
                type="button"
                onClick={() => setCreateOpen(true)}
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
                  boxShadow: '0 6px 18px rgba(30, 64, 255, 0.22)',
                }}
              >
                <Plus size={16} /> Lập Phiếu Hợp Tác Mới
              </button>
            )}
          </div>
        </Card>
      )}

      {/* KPI Summary */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '1rem',
        }}
      >
        <Card padding="1rem 1.2rem">
          <div style={{ fontSize: '0.73rem', fontWeight: 800, color: '#64748B' }}>
            TỔNG QUỸ HOA HỒNG HỢP TÁC
          </div>
          <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#1E40FF', marginTop: 4 }}>
            {formatVnd(metrics.totalCommission)}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: 2 }}>
            Trên tổng số {slips.length} phiếu hợp tác
          </div>
        </Card>

        <Card padding="1rem 1.2rem">
          <div style={{ fontSize: '0.73rem', fontWeight: 800, color: '#64748B' }}>
            CHỜ KÝ SỐ ĐỒNG THUẬN
          </div>
          <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#D97706', marginTop: 4 }}>
            {metrics.pendingSig} phiếu
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: 2 }}>
            Cần đủ 100% chữ ký các thành viên
          </div>
        </Card>

        <Card padding="1rem 1.2rem">
          <div style={{ fontSize: '0.73rem', fontWeight: 800, color: '#64748B' }}>
            CHỜ QUẢN LÝ PHÊ DUYỆT
          </div>
          <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0284C7', marginTop: 4 }}>
            {metrics.pendingMgr} phiếu
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: 2 }}>
            Đã hoàn tất chữ ký các bên
          </div>
        </Card>

        <Card padding="1rem 1.2rem">
          <div style={{ fontSize: '0.73rem', fontWeight: 800, color: '#64748B' }}>
            ĐÃ CHỐT DUYỆT CHI TRẢ
          </div>
          <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#059669', marginTop: 4 }}>
            {metrics.approvedCnt} phiếu
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: 2 }}>
            Đang khiếu nại: {metrics.disputedCnt} phiếu
          </div>
        </Card>
      </div>

      {/* Filter Bar */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 10,
        }}
      >
        <PillTabs<StatusFilterKey>
          activeKey={statusFilter}
          onChange={setStatusFilter}
          tabs={[
            { key: 'all', label: 'Tất cả', count: slips.length },
            { key: 'pending_signatures', label: 'Chờ ký số', count: metrics.pendingSig },
            { key: 'pending_manager_approval', label: 'Chờ QL duyệt', count: metrics.pendingMgr },
            { key: 'approved', label: 'Đã duyệt', count: metrics.approvedCnt },
            { key: 'disputed', label: 'Đang khiếu nại', count: metrics.disputedCnt },
            { key: 'rejected', label: 'Từ chối' },
          ]}
        />

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', minWidth: 260 }}>
            <Search
              size={15}
              style={{
                position: 'absolute',
                left: 12,
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#64748B',
              }}
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm khách hàng, mã Deal/Căn, dự án, Sale..."
              style={{ ...PAYROLL_SHARED_INPUT_STYLE, paddingLeft: 36 }}
            />
          </div>

          {embedded && canCreate && (
            <button
              type="button"
              onClick={() => setCreateOpen(true)}
              style={{
                height: 44,
                padding: '0 1.15rem',
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
              <Plus size={15} /> Lập Phiếu Hợp Tác
            </button>
          )}
        </div>
      </div>

      {/* Cooperation Slips Cards */}
      {filteredSlips.length === 0 ? (
        <EmptyState
          icon={<Handshake size={24} />}
          title="Chưa có phiếu hợp tác chia hoa hồng nào khớp bộ lọc"
          description="Bấm 'Lập Phiếu Hợp Tác Mới' để thiết lập tỷ lệ đồng hưởng hoa hồng 100% giữa các chuyên viên tư vấn và gửi ký số xác nhận."
          action={
            canCreate ? (
              <button
                type="button"
                onClick={() => setCreateOpen(true)}
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
                + Tạo phiếu hợp tác đầu tiên
              </button>
            ) : undefined
          }
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {filteredSlips.map((slip) => {
            const badgeMeta = STATUS_BADGE_MAP[slip.status];
            const signedCount = slip.shareholders.filter((s) => s.signed).length;
            const currentUid = String(user?.id || '');
            const myShare = slip.shareholders.find((s) => s.user_id === currentUid);
            const canSignNow =
              slip.status !== 'approved' &&
              slip.status !== 'rejected' &&
              (!myShare || !myShare.signed);

            return (
              <Card key={slip.id} padding="1.25rem 1.4rem">
                <div
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    alignItems: 'flex-start',
                    justifyContent: 'space-between',
                    gap: 12,
                    paddingBottom: '0.9rem',
                    borderBottom: '1px solid #F1F5F9',
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '0.96rem', fontWeight: 800, color: '#0F172A' }}>
                        {slip.customer_name}
                      </span>
                      <Badge tone="primary">{slip.code}</Badge>
                      {slip.deal_code && <Badge tone="neutral">Mã: {slip.deal_code}</Badge>}
                      <Badge tone={badgeMeta.tone}>{badgeMeta.label}</Badge>
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#64748B', marginTop: 4 }}>
                      Dự án / Gói: <strong style={{ color: '#334155' }}>{slip.project_name || '—'}</strong>
                      {slip.customer_phone ? ` • SĐT: ${slip.customer_phone}` : ''}
                      {slip.created_at ? ` • Lập lúc ${formatShortDate(slip.created_at)}` : ''}
                    </div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.73rem', fontWeight: 700, color: '#64748B' }}>
                      DOANH THU {formatVnd(slip.expected_revenue_vnd)} → HOA HỒNG CHIA
                    </div>
                    <div style={{ fontSize: '1.22rem', fontWeight: 900, color: '#1E40FF' }}>
                      {formatVnd(slip.expected_commission_vnd)}
                    </div>
                  </div>
                </div>

                {/* Shareholder Split Table */}
                <div style={{ marginTop: '0.9rem', overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.81rem' }}>
                    <thead>
                      <tr style={{ background: '#F8F9FA', borderBottom: '1px solid #E2E8F0' }}>
                        <th style={{ padding: '8px 10px', textAlign: 'left', color: '#64748B' }}>
                          Thành viên đồng hưởng ({signedCount}/{slip.shareholders.length} đã ký)
                        </th>
                        <th style={{ padding: '8px 10px', textAlign: 'right', color: '#64748B' }}>
                          Tỷ lệ %
                        </th>
                        <th style={{ padding: '8px 10px', textAlign: 'left', color: '#64748B' }}>
                          Tỷ lệ bằng chữ
                        </th>
                        <th style={{ padding: '8px 10px', textAlign: 'right', color: '#64748B' }}>
                          Hoa hồng nhận
                        </th>
                        <th style={{ padding: '8px 10px', textAlign: 'center', color: '#64748B' }}>
                          Xác thực Chữ ký số & IP
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {slip.shareholders.map((sh) => (
                        <tr key={sh.user_id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                          <td style={{ padding: '9px 10px' }}>
                            <div style={{ fontWeight: 700, color: '#0F172A' }}>{sh.user_name}</div>
                            {sh.email && (
                              <div style={{ fontSize: '0.73rem', color: '#64748B' }}>{sh.email}</div>
                            )}
                          </td>
                          <td
                            style={{
                              padding: '9px 10px',
                              textAlign: 'right',
                              fontWeight: 800,
                              color: '#1E40FF',
                            }}
                          >
                            {sh.percentage}%
                          </td>
                          <td style={{ padding: '9px 10px', fontStyle: 'italic', color: '#475569' }}>
                            {percentageToVietnameseWords(sh.percentage)}
                          </td>
                          <td
                            style={{
                              padding: '9px 10px',
                              textAlign: 'right',
                              fontWeight: 800,
                              color: '#059669',
                            }}
                          >
                            {formatVnd(sh.amount_vnd)}
                          </td>
                          <td style={{ padding: '9px 10px', textAlign: 'center' }}>
                            {sh.signed ? (
                              <div
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: 8,
                                }}
                              >
                                {sh.signature_data_url && (
                                  <img
                                    src={sh.signature_data_url}
                                    alt="Chữ ký"
                                    style={{
                                      height: 26,
                                      width: 58,
                                      objectFit: 'contain',
                                      border: '1px solid #E2E8F0',
                                      borderRadius: 6,
                                      background: '#FFFFFF',
                                    }}
                                  />
                                )}
                                <Badge tone="success">
                                  Đã ký {sh.signed_at ? formatShortDate(sh.signed_at) : ''}
                                </Badge>
                              </div>
                            ) : (
                              <Badge tone="warning">Chờ ký</Badge>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {slip.dispute_reason && (
                  <div
                    style={{
                      marginTop: '0.8rem',
                      padding: '0.65rem 0.9rem',
                      borderRadius: 10,
                      background: '#FEF2F2',
                      border: '1px solid #FECACA',
                      color: '#B91C1C',
                      fontSize: '0.8rem',
                    }}
                  >
                    <strong>Khiếu nại / Đề nghị điều chỉnh:</strong> {slip.dispute_reason}
                  </div>
                )}

                {/* Action Footer */}
                <div
                  style={{
                    marginTop: '0.95rem',
                    paddingTop: '0.85rem',
                    borderTop: '1px solid #F1F5F9',
                    display: 'flex',
                    flexWrap: 'wrap',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 10,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.77rem', color: '#64748B' }}>
                    <Users size={14} color="#1E40FF" />
                    <span>
                      Tổng tỷ lệ: <strong>{slip.total_percentage}%</strong> (
                      {percentageToVietnameseWords(slip.total_percentage)})
                    </span>
                  </div>

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {slip.status !== 'approved' && (
                      <button
                        type="button"
                        onClick={() => setEditingSharesSlip(slip)}
                        style={{
                          height: 38,
                          padding: '0 0.9rem',
                          borderRadius: 10,
                          border: '1px solid #CBD5E1',
                          background: '#FFFFFF',
                          color: '#334155',
                          fontWeight: 700,
                          fontSize: '0.78rem',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 5,
                          cursor: 'pointer',
                        }}
                      >
                        <Edit3 size={14} /> Sửa tỷ lệ chia
                      </button>
                    )}

                    {slip.status !== 'approved' && (
                      <button
                        type="button"
                        onClick={() => setDisputingSlip(slip)}
                        style={{
                          height: 38,
                          padding: '0 0.9rem',
                          borderRadius: 10,
                          border: '1px solid #FDE68A',
                          background: '#FFFBEB',
                          color: '#B45309',
                          fontWeight: 700,
                          fontSize: '0.78rem',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 5,
                          cursor: 'pointer',
                        }}
                      >
                        <AlertTriangle size={14} /> Khiếu nại tỷ lệ
                      </button>
                    )}

                    {canSignNow && (
                      <button
                        type="button"
                        onClick={() => setSigningSlip(slip)}
                        style={{
                          height: 38,
                          padding: '0 1rem',
                          borderRadius: 10,
                          border: 'none',
                          background: '#1E40FF',
                          color: '#FFFFFF',
                          fontWeight: 700,
                          fontSize: '0.79rem',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 6,
                          cursor: 'pointer',
                        }}
                      >
                        <PenTool size={14} /> Ký số xác nhận
                      </button>
                    )}

                    {canApprove &&
                      (slip.status === 'pending_manager_approval' ||
                        slip.status === 'pending_signatures' ||
                        slip.status === 'disputed') && (
                        <button
                          type="button"
                          onClick={() => setDecidingSlip(slip)}
                          style={{
                            height: 38,
                            padding: '0 1rem',
                            borderRadius: 10,
                            border: 'none',
                            background: '#059669',
                            color: '#FFFFFF',
                            fontWeight: 700,
                            fontSize: '0.79rem',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 6,
                            cursor: 'pointer',
                          }}
                        >
                          <ShieldCheck size={14} /> Quản lý Duyệt / Từ chối
                        </button>
                      )}

                    {slip.status === 'approved' && (
                      <Badge tone="success" icon={<CheckCircle2 size={13} />}>
                        Đã duyệt bởi {slip.approved_by_name || 'Ban Giám đốc'}
                      </Badge>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <CreateCooperationSlipModal
        isOpen={createOpen}
        onClose={() => setCreateOpen(false)}
        directory={directory}
        defaultUserId={String(user?.id || directory[0]?.id || '')}
        token={token}
        tenantSlug={tenantSlug}
        onCreated={loadCooperationWorkspace}
      />

      <UpdateSharesModal
        key={editingSharesSlip?.id || 'none'}
        slip={editingSharesSlip}
        onClose={() => setEditingSharesSlip(null)}
        directory={directory}
        token={token}
        tenantSlug={tenantSlug}
        onSaved={loadCooperationWorkspace}
      />

      <CooperationSignAndActionModals
        signingSlip={signingSlip}
        onCloseSign={() => setSigningSlip(null)}
        decidingSlip={decidingSlip}
        onCloseDecide={() => setDecidingSlip(null)}
        disputingSlip={disputingSlip}
        onCloseDispute={() => setDisputingSlip(null)}
        currentUserId={String(user?.id || '')}
        token={token}
        tenantSlug={tenantSlug}
        onRefresh={loadCooperationWorkspace}
      />
    </div>
  );
};

export default CooperationSlipsView;
