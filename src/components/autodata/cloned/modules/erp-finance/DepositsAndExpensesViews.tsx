import React, { useMemo, useState } from 'react';
import { Eye, Landmark, Plus, Receipt, Search, Wallet } from 'lucide-react';
import {
  Badge,
  Card,
  EmptyState,
  Table,
  type TableColumn,
} from '../../components/ui/AutoDataLoadingModal';
import { formatShortDate, formatVnd } from '../../../autodataApi';
import {
  EXPENSE_CATEGORIES,
  type DepositRecord,
  type ExpenseRecord,
} from './financeTypes';

interface DepositsViewProps {
  deposits: DepositRecord[];
  canCreate: boolean;
  onOpenCreateDrawer: () => void;
  onSelectDeposit: (dep: DepositRecord) => void;
}

export const DepositsView: React.FC<DepositsViewProps> = ({
  deposits,
  canCreate,
  onOpenCreateDrawer,
  onSelectDeposit,
}) => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return deposits.filter((d) => {
      if (statusFilter !== 'all' && d.status !== statusFilter) return false;
      if (!q) return true;
      return (
        d.deposit_code.toLowerCase().includes(q) ||
        d.customer_name.toLowerCase().includes(q) ||
        (d.unit_code && d.unit_code.toLowerCase().includes(q))
      );
    });
  }, [deposits, search, statusFilter]);

  const stats = useMemo(() => {
    const totalHeld = deposits
      .filter((d) => d.status === 'received' || d.status === 'applied')
      .reduce((s, d) => s + d.amount_vnd, 0);
    const pendingSum = deposits
      .filter((d) => d.status === 'pending')
      .reduce((s, d) => s + d.amount_vnd, 0);
    const refundedSum = deposits
      .filter((d) => d.status === 'refunded')
      .reduce((s, d) => s + (d.refunded_amount_vnd || d.amount_vnd), 0);
    return { totalHeld, pendingSum, refundedSum };
  }, [deposits]);

  const columns: Array<TableColumn<DepositRecord>> = [
    {
      key: 'code',
      header: 'Mã Phiếu Cọc',
      render: (d) => (
        <div>
          <strong style={{ color: '#1E40FF' }}>{d.deposit_code}</strong>
          <div style={{ fontSize: '0.73rem', color: '#64748B' }}>
            {d.unit_code ? `Mã căn/lô: ${d.unit_code}` : formatShortDate(d.created_at)}
          </div>
        </div>
      ),
    },
    {
      key: 'customer',
      header: 'Khách hàng / Đối tác',
      render: (d) => (
        <div>
          <div style={{ fontWeight: 700, color: '#0F172A' }}>{d.customer_name}</div>
          <div style={{ fontSize: '0.74rem', color: '#64748B' }}>
            {d.company_name || d.project_name || 'Khách hàng trực tiếp'}
          </div>
        </div>
      ),
    },
    {
      key: 'milestones',
      header: 'Tiến độ Đợt thanh toán',
      render: (d) => {
        const msCount = d.milestones?.length || 1;
        const confCount = (d.milestones || []).filter((m) => m.status === 'confirmed').length;
        return (
          <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#334155' }}>
            {confCount}/{msCount} đợt xác nhận UNC
          </span>
        );
      },
    },
    {
      key: 'amount',
      header: 'Số tiền đặt cọc',
      align: 'right',
      render: (d) => (
        <div>
          <strong style={{ color: '#0F172A' }}>{formatVnd(d.amount_vnd)}</strong>
          {d.expected_commission_vnd > 0 && (
            <div style={{ fontSize: '0.72rem', color: '#059669' }}>
              HH: {formatVnd(d.expected_commission_vnd)}
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Trạng thái',
      render: (d) => (
        <Badge
          tone={
            d.status === 'received'
              ? 'success'
              : d.status === 'refunded'
                ? 'danger'
                : 'warning'
          }
        >
          {d.status}
        </Badge>
      ),
    },
    {
      key: 'actions',
      header: 'Chi tiết 360°',
      align: 'right',
      render: (d) => (
        <button
          type="button"
          className="btn secondary"
          onClick={() => onSelectDeposit(d)}
          style={{ height: 34, color: '#1E40FF', display: 'inline-flex', alignItems: 'center', gap: 5 }}
        >
          <Eye size={14} /> Đối soát UNC
        </button>
      ),
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.9rem' }}>
        <Card padding="1rem 1.15rem">
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748B' }}>Đặt Cọc Đã Xác Nhận UNC</div>
          <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#059669', marginTop: 4 }}>
            {formatVnd(stats.totalHeld)}
          </div>
        </Card>
        <Card padding="1rem 1.15rem">
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748B' }}>Chờ Kế Toán Kiểm Duyệt</div>
          <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#D97706', marginTop: 4 }}>
            {formatVnd(stats.pendingSum)}
          </div>
        </Card>
        <Card padding="1rem 1.15rem">
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748B' }}>Đã Hoàn Cọc / Thanh Lý</div>
          <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#DC2626', marginTop: 4 }}>
            {formatVnd(stats.refundedSum)}
          </div>
        </Card>
      </div>

      <Card
        title="Quản Lý Đặt Cọc, Tạm Ứng Khách Hàng & Đối Soát UNC Đa Đợt"
        subtitle="Theo dõi từng đợt đặt cọc (Milestones), chứng từ UNC ngân hàng, chia hoa hồng và hoàn cọc"
        actions={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <div style={{ position: 'relative' }}>
              <Search size={14} color="#64748B" style={{ position: 'absolute', left: 10, top: 12 }} />
              <input
                className="form-input"
                style={{ height: 38, paddingLeft: 32, width: 220 }}
                placeholder="Tìm mã cọc, khách, mã căn..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <select
              className="form-input"
              style={{ height: 38, width: 150 }}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="pending">Chờ duyệt UNC</option>
              <option value="received">Đã thu cọc</option>
              <option value="refunded">Đã hoàn cọc</option>
            </select>
            {canCreate && (
              <button
                type="button"
                className="btn primary"
                onClick={onOpenCreateDrawer}
                style={{ height: 40, background: '#1E40FF', display: 'inline-flex', alignItems: 'center', gap: 6 }}
              >
                <Landmark size={15} /> + Tạo Phiếu Đặt Cọc
              </button>
            )}
          </div>
        }
      >
        {filtered.length === 0 ? (
          <EmptyState
            title="Chưa có phiếu đặt cọc nào"
            description="Khởi tạo phiếu đặt cọc đa đợt và tải chứng từ UNC ngân hàng để Kế toán xác nhận tự động."
          />
        ) : (
          <Table columns={columns} rows={filtered} rowKey={(d) => d.id} />
        )}
      </Card>
    </div>
  );
};

interface ExpensesViewProps {
  expenses: ExpenseRecord[];
  canCreate: boolean;
  onOpenCreateDrawer: () => void;
  onSelectExpense: (exp: ExpenseRecord) => void;
}

export const ExpensesView: React.FC<ExpensesViewProps> = ({
  expenses,
  canCreate,
  onOpenCreateDrawer,
  onSelectExpense,
}) => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [vatOnly, setVatOnly] = useState(false);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return expenses.filter((e) => {
      if (statusFilter !== 'all' && e.approval_status !== statusFilter) return false;
      if (vatOnly && !e.has_vat_invoice) return false;
      if (!q) return true;
      return (
        e.expense_code.toLowerCase().includes(q) ||
        e.title.toLowerCase().includes(q) ||
        (e.vendor_name && e.vendor_name.toLowerCase().includes(q))
      );
    });
  }, [expenses, search, statusFilter, vatOnly]);

  const summary = useMemo(() => {
    const pending = expenses
      .filter((e) => e.approval_status === 'pending_approval')
      .reduce((s, e) => s + e.total_amount_vnd, 0);
    const paid = expenses
      .filter((e) => e.approval_status === 'paid')
      .reduce((s, e) => s + e.total_amount_vnd, 0);
    const vatTotal = expenses.reduce((s, e) => s + (e.vat_amount_vnd || 0), 0);
    return { pending, paid, vatTotal };
  }, [expenses]);

  const columns: Array<TableColumn<ExpenseRecord>> = [
    {
      key: 'code',
      header: 'Mã Đề Nghị',
      render: (e) => (
        <div>
          <strong style={{ color: '#1E40FF' }}>{e.expense_code}</strong>
          <div style={{ fontSize: '0.72rem', color: '#64748B' }}>{formatShortDate(e.expense_date)}</div>
        </div>
      ),
    },
    {
      key: 'title',
      header: 'Nội dung & Đơn vị thụ hưởng',
      render: (e) => {
        const catObj = EXPENSE_CATEGORIES.find((c) => c.value === e.category);
        return (
          <div>
            <div style={{ fontWeight: 700, color: '#0F172A' }}>{e.title}</div>
            <div style={{ fontSize: '0.74rem', color: '#64748B' }}>
              {catObj?.label || e.category} • Thụ hưởng: {e.vendor_name || e.requester_name || '—'}
            </div>
          </div>
        );
      },
    },
    {
      key: 'vat',
      header: 'Hóa đơn VAT',
      render: (e) =>
        e.has_vat_invoice ? (
          <Badge tone="info" icon={<Receipt size={11} />}>
            {e.vat_invoice_no || `VAT ${formatVnd(e.vat_amount_vnd)}`}
          </Badge>
        ) : (
          <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>Không HĐ VAT</span>
        ),
    },
    {
      key: 'amount',
      header: 'Tổng tiền chi',
      align: 'right',
      render: (e) => <strong style={{ color: '#0F172A' }}>{formatVnd(e.total_amount_vnd)}</strong>,
    },
    {
      key: 'status',
      header: 'Phê duyệt / Giải ngân',
      render: (e) => (
        <Badge
          tone={
            e.approval_status === 'paid' || e.approval_status === 'approved'
              ? 'success'
              : e.approval_status === 'rejected'
                ? 'danger'
                : 'warning'
          }
        >
          {e.approval_status}
        </Badge>
      ),
    },
    {
      key: 'actions',
      header: 'Thao tác',
      align: 'right',
      render: (e) => (
        <button
          type="button"
          className="btn secondary"
          onClick={() => onSelectExpense(e)}
          style={{ height: 34, color: '#1E40FF', display: 'inline-flex', alignItems: 'center', gap: 5 }}
        >
          <Eye size={14} /> Xem & Duyệt
        </button>
      ),
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.9rem' }}>
        <Card padding="1rem 1.15rem">
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748B' }}>Đang Chờ Phê Duyệt</div>
          <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#D97706', marginTop: 4 }}>
            {formatVnd(summary.pending)}
          </div>
        </Card>
        <Card padding="1rem 1.15rem">
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748B' }}>Đã Giải Ngân Thực Chi</div>
          <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#1E40FF', marginTop: 4 }}>
            {formatVnd(summary.paid)}
          </div>
        </Card>
        <Card padding="1rem 1.15rem">
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748B' }}>Thuế GTGT Đầu Vào Khấu Trừ</div>
          <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#059669', marginTop: 4 }}>
            {formatVnd(summary.vatTotal)}
          </div>
        </Card>
      </div>

      <Card
        title="Sổ Đề Nghị Thanh Toán, Tạm Ứng & Quản Lý Hóa Đơn VAT Đầu Vào"
        subtitle="Quản lý phiếu chi đa hạng mục, mã QR giải ngân nhà cung cấp, phê duyệt đa cấp và theo dõi hoàn ứng"
        actions={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <input
              className="form-input"
              style={{ height: 38, width: 200 }}
              placeholder="Tìm mã EXP, nội dung, NCC..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <select
              className="form-input"
              style={{ height: 38, width: 155 }}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">Mọi trạng thái</option>
              <option value="pending_approval">Chờ phê duyệt</option>
              <option value="approved">Đã duyệt (Chờ chi)</option>
              <option value="paid">Đã giải ngân</option>
              <option value="refunded">Đã hoàn ứng</option>
            </select>
            <label style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer' }}>
              <input type="checkbox" checked={vatOnly} onChange={(e) => setVatOnly(e.target.checked)} />
              Chỉ HĐ VAT
            </label>
            {canCreate && (
              <button
                type="button"
                className="btn primary"
                onClick={onOpenCreateDrawer}
                style={{ height: 40, background: '#1E40FF', display: 'inline-flex', alignItems: 'center', gap: 6 }}
              >
                <Wallet size={15} /> <Plus size={14} /> Lập Đề Nghị Chi
              </button>
            )}
          </div>
        }
      >
        {filtered.length === 0 ? (
          <EmptyState
            title="Chưa có phiếu đề nghị chi phí nào"
            description="Nhấn Lập Đề Nghị Chi để kê khai hạng mục chi phí, hóa đơn VAT và trình duyệt tự động."
          />
        ) : (
          <Table columns={columns} rows={filtered} rowKey={(e) => e.id} />
        )}
      </Card>
    </div>
  );
};
