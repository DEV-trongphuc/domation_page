import React, { useState } from 'react';
import {
  AlertTriangle,
  CalendarCheck,
  CheckCircle2,
  ClipboardCheck,
  MessageSquareWarning,
  Plus,
  Users,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { Badge, Card, EmptyState, Table, type TableColumn } from '../../components/ui/AutoDataLoadingModal';
import { CustomModal } from '../../components/ui/CustomModal';
import { apiRequest, formatShortDate, getErrorMessage } from '../../../autodataApi';
import type {
  AttendanceBulkRequestDto,
  AttendanceConfirmationBatchDto,
  AttendanceConfirmationItemDto,
} from './attendanceTypes';

interface AttendanceConfirmationsPanelProps {
  token: string | null;
  tenantSlug: string;
  canApprove: boolean;
  canManageConfig: boolean;
  myPendingConfirmation: AttendanceConfirmationItemDto | null;
  batches: AttendanceConfirmationBatchDto[];
  bulkRequests: AttendanceBulkRequestDto[];
  selectedMonth: string;
  onReload: () => Promise<void>;
}

const INPUT_STYLE: React.CSSProperties = {
  width: '100%',
  height: 44,
  padding: '0 0.85rem',
  borderRadius: 12,
  border: '1px solid #CBD5E1',
  background: '#FFFFFF',
  color: '#0F172A',
  fontSize: '0.85rem',
  outline: 'none',
};

const LABEL_STYLE: React.CSSProperties = {
  display: 'block',
  fontSize: '0.77rem',
  fontWeight: 700,
  color: '#334155',
  marginBottom: 6,
};

export const AttendanceConfirmationsPanel: React.FC<AttendanceConfirmationsPanelProps> = ({
  token,
  tenantSlug,
  canApprove,
  canManageConfig,
  myPendingConfirmation,
  batches,
  bulkRequests,
  selectedMonth,
  onReload,
}) => {
  const [submittingConfirm, setSubmittingConfirm] = useState(false);
  const [disputeModalOpen, setDisputeModalOpen] = useState(false);
  const [disputeReason, setDisputeReason] = useState('');

  // Create Batch Modal
  const [batchModalOpen, setBatchModalOpen] = useState(false);
  const [batchTitle, setBatchTitle] = useState(`Bảng đối soát công tháng ${selectedMonth}`);
  const [periodFrom, setPeriodFrom] = useState(`${selectedMonth}-01`);
  const [periodTo, setPeriodTo] = useState(`${selectedMonth}-28`);
  const [standardDays, setStandardDays] = useState('22');
  const [deadlineAt, setDeadlineAt] = useState(() => {
    const d = new Date(Date.now() + 48 * 3600_000);
    return d.toISOString().slice(0, 16);
  });
  const [creatingBatch, setCreatingBatch] = useState(false);

  // Batch Detail Inspection
  const [activeBatch, setActiveBatch] = useState<AttendanceConfirmationBatchDto | null>(null);

  // Bulk Request Modal
  const [bulkModalOpen, setBulkModalOpen] = useState(false);
  const [bulkTitle, setBulkTitle] = useState('');
  const [bulkDate, setBulkDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [bulkType, setBulkType] = useState<AttendanceBulkRequestDto['request_type']>('company_event');
  const [bulkUnits, setBulkUnits] = useState('1');
  const [bulkNote, setBulkNote] = useState('');
  const [creatingBulk, setCreatingBulk] = useState(false);

  const handleConfirmMyAttendance = async () => {
    if (!myPendingConfirmation) return;
    setSubmittingConfirm(true);
    try {
      await apiRequest(`/attendance/confirmations/${myPendingConfirmation.id}/confirm`, {
        method: 'POST',
        token,
        tenantSlug,
        body: {
          batch_id: myPendingConfirmation.batch_id,
        },
      });
      toast.success('Đã xác nhận Bảng công kỳ này thành công!');
      await onReload();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Không thể xác nhận bảng công.'));
    } finally {
      setSubmittingConfirm(false);
    }
  };

  const handleSubmitDispute = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!myPendingConfirmation || !disputeReason.trim()) {
      toast.error('Vui lòng nhập lý do khiếu nại sai lệch công.');
      return;
    }
    setSubmittingConfirm(true);
    try {
      await apiRequest(`/attendance/confirmations/${myPendingConfirmation.id}/dispute`, {
        method: 'POST',
        token,
        tenantSlug,
        body: {
          batch_id: myPendingConfirmation.batch_id,
          dispute_reason: disputeReason.trim(),
        },
      });
      toast.success('Đã gửi khiếu nại sai lệch công tới Bộ phận Nhân sự!');
      setDisputeReason('');
      setDisputeModalOpen(false);
      await onReload();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Không thể gửi khiếu nại sai lệch công.'));
    } finally {
      setSubmittingConfirm(false);
    }
  };

  const handleCreateBatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!batchTitle.trim()) {
      toast.error('Vui lòng nhập tiêu đề đợt đối soát.');
      return;
    }
    setCreatingBatch(true);
    try {
      await apiRequest('/attendance/confirmations/batches', {
        method: 'POST',
        token,
        tenantSlug,
        body: {
          title: batchTitle.trim(),
          period_month: periodFrom.slice(0, 7),
          from_date: periodFrom,
          to_date: periodTo,
          standard_days: Number(standardDays || 22),
          deadline_at: new Date(deadlineAt).toISOString(),
        },
      });
      toast.success('Đã phát hành Đợt Đối soát & Xác nhận Bảng công!');
      setBatchModalOpen(false);
      await onReload();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Không thể tạo đợt đối soát công.'));
    } finally {
      setCreatingBatch(false);
    }
  };

  const handleCreateBulkRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bulkTitle.trim()) {
      toast.error('Vui lòng nhập tiêu đề ghi nhận công hàng loạt.');
      return;
    }
    setCreatingBulk(true);
    try {
      await apiRequest('/attendance/bulk-requests', {
        method: 'POST',
        token,
        tenantSlug,
        body: {
          month_period: bulkDate.slice(0, 7),
          admin_note: `${bulkTitle.trim()}${bulkNote.trim() ? ` — ${bulkNote.trim()}` : ''}`,
          items: [
            {
              date: bulkDate,
              request_type: bulkType,
              work_units: Number(bulkUnits || 1),
              note: bulkNote.trim() || bulkTitle.trim(),
            },
          ],
        },
      });
      toast.success('Đã tạo yêu cầu ghi nhận công hàng loạt!');
      setBulkTitle('');
      setBulkNote('');
      setBulkModalOpen(false);
      await onReload();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Không thể tạo yêu cầu chấm công hàng loạt.'));
    } finally {
      setCreatingBulk(false);
    }
  };

  const batchColumns: ReadonlyArray<TableColumn<AttendanceConfirmationBatchDto>> = [
    {
      key: 'title',
      header: 'Đợt đối soát công',
      render: (b) => (
        <div>
          <div style={{ fontWeight: 700, color: '#0F172A' }}>{b.title}</div>
          <div style={{ fontSize: '0.74rem', color: '#64748B' }}>
            Kỳ: {b.period_from} → {b.period_to} • Công chuẩn: {b.standard_days}
          </div>
        </div>
      ),
    },
    {
      key: 'stats',
      header: 'Tiến độ xác nhận',
      render: (b) => (
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <Badge tone="success">Đã chốt: {b.confirmed_count ?? 0}</Badge>
          <Badge tone="warning">Chờ: {b.pending_count ?? 0}</Badge>
          {(b.disputed_count ?? 0) > 0 && <Badge tone="danger">Khiếu nại: {b.disputed_count}</Badge>}
        </div>
      ),
    },
    {
      key: 'deadline',
      header: 'Hạn xác nhận',
      render: (b) => <span style={{ fontSize: '0.78rem', color: '#475569' }}>{formatShortDate(b.deadline_at)}</span>,
    },
    {
      key: 'act',
      header: 'Chi tiết',
      align: 'right',
      render: (b) => (
        <button
          type="button"
          onClick={() => setActiveBatch(b)}
          className="btn secondary sm"
          style={{ height: 32, fontSize: '0.76rem', color: '#1E40FF' }}
        >
          Xem khiếu nại & chi tiết
        </button>
      ),
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
      {/* Employee Pending Confirmation / Dispute Card */}
      {myPendingConfirmation ? (
        <Card
          padding="1.15rem 1.35rem"
          style={{
            background:
              myPendingConfirmation.status === 'disputed'
                ? '#FEF2F2'
                : myPendingConfirmation.status === 'confirmed'
                  ? '#ECFDF5'
                  : 'linear-gradient(135deg, #EFF6FF 0%, #FFFFFF 100%)',
            borderColor:
              myPendingConfirmation.status === 'disputed'
                ? '#FECACA'
                : myPendingConfirmation.status === 'confirmed'
                  ? '#A7F3D0'
                  : '#93C5FD',
          }}
        >
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <ClipboardCheck size={18} color="#1E40FF" />
                <strong style={{ fontSize: '0.96rem', color: '#0F172A' }}>
                  {myPendingConfirmation.batch_title || `Phiếu Đối soát Bảng công (${selectedMonth})`}
                </strong>
                <Badge
                  tone={
                    myPendingConfirmation.status === 'confirmed'
                      ? 'success'
                      : myPendingConfirmation.status === 'disputed'
                        ? 'danger'
                        : 'warning'
                  }
                >
                  {myPendingConfirmation.status === 'confirmed'
                    ? 'Đã xác nhận đủ công'
                    : myPendingConfirmation.status === 'disputed'
                      ? 'Đang khiếu nại sai lệch'
                      : 'Chờ bạn xác nhận'}
                </Badge>
              </div>
              <div style={{ fontSize: '0.82rem', color: '#334155', marginTop: 6, display: 'flex', gap: 14, flexWrap: 'wrap' }}>
                <span>
                  Thực công: <strong style={{ color: '#1E40FF' }}>{myPendingConfirmation.actual_work_units}</strong> /{' '}
                  {myPendingConfirmation.standard_days} công chuẩn
                </span>
                <span>Đi trễ: <strong>{myPendingConfirmation.late_count}</strong> lần</span>
                <span>OT: <strong>{myPendingConfirmation.overtime_hours}h</strong></span>
                <span>Nghỉ phép: <strong>{myPendingConfirmation.leave_days}</strong> ngày</span>
              </div>
              {myPendingConfirmation.dispute_reason && (
                <div style={{ fontSize: '0.78rem', color: '#DC2626', marginTop: 6 }}>
                  Lý do khiếu nại: <strong>{myPendingConfirmation.dispute_reason}</strong>
                </div>
              )}
            </div>

            {myPendingConfirmation.status === 'pending' && (
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <button
                  type="button"
                  disabled={submittingConfirm}
                  onClick={() => setDisputeModalOpen(true)}
                  className="btn secondary"
                  style={{ height: 40, color: '#DC2626', borderColor: '#FCA5A5', display: 'inline-flex', alignItems: 'center', gap: 6 }}
                >
                  <MessageSquareWarning size={15} /> Khiếu nại sai lệch
                </button>
                <button
                  type="button"
                  disabled={submittingConfirm}
                  onClick={() => void handleConfirmMyAttendance()}
                  style={{
                    height: 40,
                    padding: '0 1.15rem',
                    borderRadius: 12,
                    border: 'none',
                    background: '#1E40FF',
                    color: '#FFFFFF',
                    fontWeight: 700,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    cursor: 'pointer',
                  }}
                >
                  <CheckCircle2 size={15} /> Xác nhận Đủ công
                </button>
              </div>
            )}
          </div>
        </Card>
      ) : (
        <Card padding="1rem 1.25rem">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
            <div style={{ fontSize: '0.84rem', color: '#475569' }}>
              Hiện bạn không có phiếu đối soát bảng công nào đang chờ xác nhận trong kỳ {selectedMonth}.
            </div>
          </div>
        </Card>
      )}

      {/* Admin / HR Batch Confirmation & Bulk Requests Controls */}
      {(canApprove || canManageConfig) && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
          <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0F172A' }}>
            Quản lý Đợt Đối Soát Bảng Công & Ghi Nhận Công Hàng Loạt
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => setBulkModalOpen(true)}
              className="btn secondary"
              style={{ height: 42, color: '#1E40FF', display: 'inline-flex', alignItems: 'center', gap: 6 }}
            >
              <Users size={15} /> Ghi nhận công hàng loạt
            </button>
            <button
              type="button"
              onClick={() => setBatchModalOpen(true)}
              style={{
                height: 42,
                padding: '0 1.15rem',
                borderRadius: 12,
                border: 'none',
                background: '#1E40FF',
                color: '#FFFFFF',
                fontWeight: 700,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                cursor: 'pointer',
              }}
            >
              <Plus size={15} /> Tạo đợt Đối soát Công
            </button>
          </div>
        </div>
      )}

      {/* Confirmation Batches Table */}
      <Table<AttendanceConfirmationBatchDto>
        columns={batchColumns}
        rows={batches}
        rowKey={(b) => b.id}
        emptyTitle="Chưa có đợt đối soát bảng công nào"
        emptyDescription="HR/Admin có thể phát hành đợt đối soát công cuối tháng để toàn bộ nhân sự xác nhận hoặc gửi khiếu nại trước khi chốt lương."
      />

      {/* Bulk Requests Summary */}
      {bulkRequests.length > 0 && (
        <Card title="Lịch sử Ghi nhận Công Hàng Loạt (Sự kiện / WFH / Nghỉ lễ)">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {bulkRequests.map((req) => (
              <div
                key={req.id}
                style={{
                  padding: '0.75rem 1rem',
                  borderRadius: 12,
                  border: '1px solid #E2E8F0',
                  background: '#F8F9FA',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: 10,
                  flexWrap: 'wrap',
                }}
              >
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.84rem', color: '#0F172A' }}>{req.title}</div>
                  <div style={{ fontSize: '0.75rem', color: '#64748B' }}>
                    Ngày: {String(req.work_date).slice(0, 10)} • Công cộng: +{req.work_units} •{' '}
                    {req.target_department_name || 'Toàn doanh nghiệp'}
                  </div>
                </div>
                <Badge tone={req.status === 'applied' ? 'success' : req.status === 'rejected' ? 'danger' : 'warning'}>
                  {req.status === 'applied' ? 'Đã áp dụng' : req.status === 'rejected' ? 'Từ chối' : 'Đang xử lý'}
                </Badge>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Dispute Modal */}
      <CustomModal isOpen={disputeModalOpen} onClose={() => setDisputeModalOpen(false)} title="Khiếu nại Sai lệch Bảng công" width={520}>
        <form onSubmit={handleSubmitDispute} style={{ display: 'flex', flexDirection: 'column', gap: '0.95rem' }}>
          <div style={{ padding: '0.75rem 1rem', borderRadius: 12, background: '#FEF2F2', border: '1px solid #FECACA', fontSize: '0.8rem', color: '#991B1B', display: 'flex', gap: 8, alignItems: 'center' }}>
            <AlertTriangle size={16} />
            Vui lòng nêu rõ ngày công, giờ check-in/out hoặc đơn nghỉ phép chưa được tính đúng để HR đối chiếu.
          </div>
          <div>
            <label style={LABEL_STYLE}>Nội dung khiếu nại chi tiết *</label>
            <textarea
              rows={4}
              required
              value={disputeReason}
              onChange={(e) => setDisputeReason(e.target.value)}
              placeholder="VD: Ngày 15/11 có đi gặp khách hàng ngoài văn phòng (đã gửi giải trình #GT-102) nhưng bảng công ghi thiếu 0.5 công..."
              style={{ ...INPUT_STYLE, height: 'auto', padding: '0.75rem 0.85rem' }}
            />
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
            <button type="button" className="btn secondary" onClick={() => setDisputeModalOpen(false)}>
              Hủy
            </button>
            <button
              type="submit"
              disabled={submittingConfirm}
              style={{ height: 42, padding: '0 1.25rem', borderRadius: 12, border: 'none', background: '#DC2626', color: '#FFFFFF', fontWeight: 700, cursor: 'pointer' }}
            >
              {submittingConfirm ? 'Đang gửi...' : 'Gửi khiếu nại cho HR'}
            </button>
          </div>
        </form>
      </CustomModal>

      {/* Create Batch Modal */}
      <CustomModal isOpen={batchModalOpen} onClose={() => setBatchModalOpen(false)} title="Tạo Đợt Đối Soát & Xác Nhận Bảng Công" width={560}>
        <form onSubmit={handleCreateBatch} style={{ display: 'flex', flexDirection: 'column', gap: '0.95rem' }}>
          <div>
            <label style={LABEL_STYLE}>Tiêu đề đợt đối soát *</label>
            <input type="text" required value={batchTitle} onChange={(e) => setBatchTitle(e.target.value)} style={INPUT_STYLE} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
            <div>
              <label style={LABEL_STYLE}>Từ ngày</label>
              <input type="date" value={periodFrom} onChange={(e) => setPeriodFrom(e.target.value)} style={INPUT_STYLE} />
            </div>
            <div>
              <label style={LABEL_STYLE}>Đến ngày</label>
              <input type="date" value={periodTo} onChange={(e) => setPeriodTo(e.target.value)} style={INPUT_STYLE} />
            </div>
            <div>
              <label style={LABEL_STYLE}>Số ngày công chuẩn kỳ</label>
              <input type="number" step="0.5" min={1} value={standardDays} onChange={(e) => setStandardDays(e.target.value)} style={INPUT_STYLE} />
            </div>
            <div>
              <label style={LABEL_STYLE}>Hạn chót nhân sự xác nhận</label>
              <input type="datetime-local" value={deadlineAt} onChange={(e) => setDeadlineAt(e.target.value)} style={INPUT_STYLE} />
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
            <button type="button" className="btn secondary" onClick={() => setBatchModalOpen(false)}>
              Hủy
            </button>
            <button
              type="submit"
              disabled={creatingBatch}
              style={{ height: 42, padding: '0 1.25rem', borderRadius: 12, border: 'none', background: '#1E40FF', color: '#FFFFFF', fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}
            >
              <CalendarCheck size={15} /> {creatingBatch ? 'Đang phát hành...' : 'Phát hành Đợt Đối Soát'}
            </button>
          </div>
        </form>
      </CustomModal>

      {/* Bulk Request Modal */}
      <CustomModal isOpen={bulkModalOpen} onClose={() => setBulkModalOpen(false)} title="Ghi Nhận Công Hàng Loạt (Sự Kiện / WFH)" width={540}>
        <form onSubmit={handleCreateBulkRequest} style={{ display: 'flex', flexDirection: 'column', gap: '0.95rem' }}>
          <div>
            <label style={LABEL_STYLE}>Tên sự kiện / lý do cộng công *</label>
            <input
              type="text"
              required
              placeholder="VD: Ngày hội Đào tạo Toàn Công ty / WFH Khẩn cấp"
              value={bulkTitle}
              onChange={(e) => setBulkTitle(e.target.value)}
              style={INPUT_STYLE}
            />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem' }}>
            <div>
              <label style={LABEL_STYLE}>Ngày áp dụng</label>
              <input type="date" value={bulkDate} onChange={(e) => setBulkDate(e.target.value)} style={INPUT_STYLE} />
            </div>
            <div>
              <label style={LABEL_STYLE}>Phân loại</label>
              <select
                value={bulkType}
                onChange={(e) => setBulkType(e.target.value as AttendanceBulkRequestDto['request_type'])}
                style={INPUT_STYLE}
              >
                <option value="company_event">Sự kiện công ty</option>
                <option value="wfh_all">WFH toàn bộ</option>
                <option value="system_outage_credit">Sự cố thiết bị</option>
                <option value="holiday_duty">Trực lễ</option>
              </select>
            </div>
            <div>
              <label style={LABEL_STYLE}>Số công ghi nhận</label>
              <select value={bulkUnits} onChange={(e) => setBulkUnits(e.target.value)} style={INPUT_STYLE}>
                <option value="1">1.0 công</option>
                <option value="0.5">0.5 công</option>
              </select>
            </div>
          </div>
          <div>
            <label style={LABEL_STYLE}>Ghi chú</label>
            <textarea
              rows={2}
              value={bulkNote}
              onChange={(e) => setBulkNote(e.target.value)}
              style={{ ...INPUT_STYLE, height: 'auto', padding: '0.75rem 0.85rem' }}
            />
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
            <button type="button" className="btn secondary" onClick={() => setBulkModalOpen(false)}>
              Hủy
            </button>
            <button
              type="submit"
              disabled={creatingBulk}
              style={{ height: 42, padding: '0 1.25rem', borderRadius: 12, border: 'none', background: '#1E40FF', color: '#FFFFFF', fontWeight: 700, cursor: 'pointer' }}
            >
              {creatingBulk ? 'Đang áp dụng...' : 'Áp dụng cho nhân sự'}
            </button>
          </div>
        </form>
      </CustomModal>

      {/* Batch Detail Modal */}
      <CustomModal
        isOpen={Boolean(activeBatch)}
        onClose={() => setActiveBatch(null)}
        title={`Chi tiết Đợt đối soát: ${activeBatch?.title || ''}`}
        width={780}
      >
        {activeBatch && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {!activeBatch.items || activeBatch.items.length === 0 ? (
              <EmptyState
                icon={<ClipboardCheck size={22} />}
                title="Chưa có dữ liệu nhân sự trong đợt này"
                description="Danh sách nhân sự đối soát sẽ hiển thị ngay khi dữ liệu bảng công được đồng bộ."
              />
            ) : (
              <div style={{ maxHeight: 400, overflowY: 'auto', border: '1px solid #E2E8F0', borderRadius: 14 }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
                  <thead>
                    <tr style={{ background: '#F8F9FA', borderBottom: '1px solid #E2E8F0' }}>
                      <th style={{ padding: '10px 12px', textAlign: 'left' }}>Nhân sự</th>
                      <th style={{ padding: '10px 12px', textAlign: 'right' }}>Thực công / Chuẩn</th>
                      <th style={{ padding: '10px 12px', textAlign: 'left' }}>Trạng thái</th>
                      <th style={{ padding: '10px 12px', textAlign: 'left' }}>Phản hồi / Khiếu nại</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activeBatch.items.map((item) => (
                      <tr key={item.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                        <td style={{ padding: '10px 12px', fontWeight: 700 }}>{item.user_name || item.user_id}</td>
                        <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 700, color: '#1E40FF' }}>
                          {item.actual_work_units} / {item.standard_days}
                        </td>
                        <td style={{ padding: '10px 12px' }}>
                          <Badge
                            tone={
                              item.status === 'confirmed' || item.status === 'auto_confirmed'
                                ? 'success'
                                : item.status === 'disputed'
                                  ? 'danger'
                                  : 'warning'
                            }
                          >
                            {item.status === 'confirmed'
                              ? 'Đã xác nhận'
                              : item.status === 'auto_confirmed'
                                ? 'Tự động chốt'
                                : item.status === 'disputed'
                                  ? 'Khiếu nại'
                                  : 'Chờ xác nhận'}
                          </Badge>
                        </td>
                        <td style={{ padding: '10px 12px', color: item.dispute_reason ? '#DC2626' : '#64748B' }}>
                          {item.dispute_reason || '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </CustomModal>
    </div>
  );
};
