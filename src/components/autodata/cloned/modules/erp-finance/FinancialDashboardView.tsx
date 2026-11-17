import React, { useState } from 'react';
import {
  ArrowDownRight,
  ArrowUpRight,
  Landmark,
  Plus,
  QrCode,
  TrendingUp,
} from 'lucide-react';
import {
  Area,
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import toast from 'react-hot-toast';
import {
  Badge,
  Card,
  EmptyState,
  Table,
  type TableColumn,
} from '../../components/ui/AutoDataLoadingModal';
import { CustomModal } from '../../components/ui/CustomModal';
import { apiRequest, formatShortDate, formatVnd, getErrorMessage } from '../../../autodataApi';
import { useAuth } from '../../contexts/AuthContext';
import {
  EXPENSE_CATEGORIES,
  type FinanceDashboardResponse,
  type FinanceTransactionRecord,
  type VietQrResponse,
} from './financeTypes';

interface FinancialDashboardViewProps {
  dashboard: FinanceDashboardResponse | null;
  vietQr: VietQrResponse | null;
  transactions: FinanceTransactionRecord[];
  canCreate: boolean;
  onRefresh: () => void;
  onGenerateQr: (amountVnd: number, refCode: string) => void;
}

export const FinancialDashboardView: React.FC<FinancialDashboardViewProps> = ({
  dashboard,
  vietQr,
  transactions,
  canCreate,
  onRefresh,
  onGenerateQr,
}) => {
  const { token, tenantSlug } = useAuth();
  const [qrAmount, setQrAmount] = useState('15000000');
  const [qrRef, setQrRef] = useState('SO2026');
  const [txFilter, setTxFilter] = useState<'all' | 'income' | 'expense'>('all');

  // New Cashbook Transaction Modal
  const [txModalOpen, setTxModalOpen] = useState(false);
  const [txType, setTxType] = useState<'income' | 'expense'>('income');
  const [txCategory, setTxCategory] = useState('sales_revenue');
  const [txAmount, setTxAmount] = useState('');
  const [txCounterparty, setTxCounterparty] = useState('');
  const [txDesc, setTxDesc] = useState('');

  const summary = dashboard?.summary;
  const legal = dashboard?.legal_entity;
  const chartSeries = dashboard?.monthly_cashflow || [];
  const expenseCats = dashboard?.expense_breakdown || [];

  const filteredTx =
    txFilter === 'all' ? transactions : transactions.filter((t) => t.tx_type === txFilter);

  const txColumns: Array<TableColumn<FinanceTransactionRecord>> = [
    {
      key: 'code',
      header: 'Mã Phiếu',
      render: (t) => (
        <div>
          <strong style={{ color: '#0F172A' }}>{t.tx_code}</strong>
          <div style={{ fontSize: '0.73rem', color: '#64748B' }}>{formatShortDate(t.tx_date)}</div>
        </div>
      ),
    },
    {
      key: 'type',
      header: 'Loại',
      render: (t) => (
        <Badge tone={t.tx_type === 'income' ? 'success' : 'danger'}>
          {t.tx_type === 'income' ? 'Phiếu Thu (PT)' : 'Phiếu Chi (PC)'}
        </Badge>
      ),
    },
    {
      key: 'counterparty',
      header: 'Đối tượng & Nội dung',
      render: (t) => (
        <div>
          <div style={{ fontWeight: 600, color: '#0F172A' }}>{t.counterparty_name || '—'}</div>
          <div style={{ fontSize: '0.75rem', color: '#64748B' }}>
            {t.description || t.category}
          </div>
        </div>
      ),
    },
    {
      key: 'method',
      header: 'Phương thức',
      render: (t) => <span style={{ fontSize: '0.8rem', color: '#475569' }}>{t.payment_method}</span>,
    },
    {
      key: 'amount',
      header: 'Số tiền',
      align: 'right',
      render: (t) => (
        <strong style={{ color: t.tx_type === 'income' ? '#059669' : '#DC2626', fontSize: '0.88rem' }}>
          {t.tx_type === 'income' ? '+' : '-'}
          {formatVnd(t.amount_vnd)}
        </strong>
      ),
    },
  ];

  const handleCreateTx = async (e: React.FormEvent) => {
    e.preventDefault();
    if (Number(txAmount || 0) <= 0) {
      toast.error('Số tiền bút toán phải lớn hơn 0.');
      return;
    }
    try {
      await apiRequest('/finance/transactions', {
        method: 'POST',
        token,
        tenantSlug,
        body: {
          tx_type: txType,
          category: txCategory,
          amount_vnd: Number(txAmount),
          counterparty_name: txCounterparty || null,
          description: txDesc || null,
        },
      });
      toast.success('Đã ghi nhận bút toán vào Sổ quỹ Thu - Chi!');
      setTxModalOpen(false);
      setTxAmount('');
      setTxCounterparty('');
      setTxDesc('');
      onRefresh();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Không thể ghi nhận bút toán Sổ quỹ.'));
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
      {/* 6 KPI Summary Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '0.9rem',
        }}
      >
        {[
          {
            label: 'Tổng Thu Thực Tế',
            val: formatVnd(summary?.total_income_vnd || 0),
            sub: `${summary?.paid_orders_count || 0} đơn hoàn tất`,
            color: '#059669',
            icon: <ArrowUpRight size={17} color="#059669" />,
          },
          {
            label: 'Tổng Chi Thực Tế',
            val: formatVnd(summary?.total_expense_vnd || 0),
            sub: `Giá vốn FIFO: ${formatVnd(summary?.total_cogs_vnd || 0)}`,
            color: '#DC2626',
            icon: <ArrowDownRight size={17} color="#DC2626" />,
          },
          {
            label: 'Dòng Tiền Ròng (Net Cashflow)',
            val: formatVnd(summary?.net_cashflow_vnd || 0),
            sub: `Lợi nhuận gộp: ${formatVnd(summary?.gross_profit_vnd || 0)}`,
            color: '#1E40FF',
            icon: <TrendingUp size={17} color="#1E40FF" />,
          },
          {
            label: 'Tiền Cọc Đang Giữ',
            val: formatVnd(summary?.deposits_held_vnd || 0),
            sub: `${summary?.deposits_count || 0} phiếu đặt cọc`,
            color: '#0284C7',
            icon: <Landmark size={17} color="#0284C7" />,
          },
          {
            label: 'Công Nợ Phải Thu (AR)',
            val: formatVnd(summary?.receivables_vnd || 0),
            sub: `Pipeline mở: ${formatVnd(summary?.open_pipeline_vnd || 0)}`,
            color: '#D97706',
            icon: <ArrowUpRight size={17} color="#D97706" />,
          },
          {
            label: 'Công Nợ Phải Trả (AP)',
            val: formatVnd(summary?.payables_vnd || 0),
            sub: `Chờ duyệt chi: ${formatVnd(summary?.pending_expenses_vnd || 0)}`,
            color: '#7C3AED',
            icon: <ArrowDownRight size={17} color="#7C3AED" />,
          },
        ].map((k) => (
          <Card key={k.label} padding="1rem 1.15rem">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748B' }}>{k.label}</span>
              {k.icon}
            </div>
            <div style={{ fontSize: '1.2rem', fontWeight: 900, color: k.color, marginTop: 6 }}>
              {k.val}
            </div>
            <div style={{ fontSize: '0.73rem', color: '#64748B', marginTop: 4 }}>{k.sub}</div>
          </Card>
        ))}
      </div>

      {/* Charts Row: 6-Month Cashflow Forecast + Dynamic Legal Entity VietQR */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1rem' }}>
        <Card
          title="Biểu Đồ Dòng Tiền Thu - Chi & Dự Báo P&L 6 Tháng"
          subtitle="Kết hợp dòng tiền thực tế trên Sổ quỹ với dự báo Pipeline B2B & Đề nghị chi chờ duyệt"
        >
          <div style={{ width: '100%', height: 270 }}>
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartSeries}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#64748B' }} />
                <YAxis
                  tick={{ fontSize: 11, fill: '#64748B' }}
                  tickFormatter={(v: number) =>
                    Math.abs(v) >= 1_000_000 ? `${Math.round(v / 1_000_000)}Tr` : String(v)
                  }
                />
                <Tooltip formatter={(val) => formatVnd(Number(val || 0))} />
                <Bar dataKey="income_vnd" name="Tổng Thu" fill="#1E40FF" radius={[6, 6, 0, 0]} />
                <Bar dataKey="expense_vnd" name="Tổng Chi" fill="#94A3B8" radius={[6, 6, 0, 0]} />
                <Area
                  type="monotone"
                  dataKey="forecast_net_vnd"
                  name="Dự báo Dòng tiền Ròng"
                  fill="rgba(16, 185, 129, 0.14)"
                  stroke="#059669"
                />
                <Line
                  type="monotone"
                  dataKey="net_cashflow_vnd"
                  name="Dòng tiền Ròng Thực tế"
                  stroke="#0284C7"
                  strokeWidth={2}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          {expenseCats.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 10 }}>
              {expenseCats.slice(0, 5).map((ec) => {
                const catLabel =
                  EXPENSE_CATEGORIES.find((c) => c.value === ec.category)?.label || ec.category;
                return (
                  <Badge key={ec.category} tone="neutral">
                    {catLabel}: {formatVnd(ec.amount_vnd)} ({ec.count})
                  </Badge>
                );
              })}
            </div>
          )}
        </Card>

        {/* Dynamic Branch Legal Entity & VietQR Generator */}
        <Card
          title="Pháp Nhân Chi Nhánh & Mã Thanh Toán VietQR Động"
          subtitle="Đọc trực tiếp từ cấu hình Sơ đồ Tổ chức & Tài khoản ngân hàng Pháp nhân (Zero-Hardcode)"
        >
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, alignItems: 'center' }}>
            <div style={{ flex: 1, minWidth: 210, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div
                style={{
                  padding: '0.75rem 0.9rem',
                  borderRadius: 12,
                  background: '#F8FAFF',
                  border: '1px solid #DBEAFE',
                  fontSize: '0.8rem',
                }}
              >
                <div style={{ fontWeight: 800, color: '#1E40FF' }}>
                  {legal?.legal_entity_name || 'Chưa cấu hình Pháp nhân'}
                </div>
                <div style={{ color: '#475569', marginTop: 3 }}>
                  MST: <strong>{legal?.tax_code || '—'}</strong> • Đại diện: {legal?.representative_name || '—'}
                </div>
                <div style={{ color: '#64748B', marginTop: 2 }}>
                  NH: <strong>{legal?.bank_name}</strong> — STK: <strong>{legal?.bank_account_no || '—'}</strong>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: 8 }}>
                <input
                  type="number"
                  className="form-input"
                  style={{ height: 40 }}
                  value={qrAmount}
                  onChange={(e) => setQrAmount(e.target.value)}
                  placeholder="Số tiền"
                />
                <input
                  className="form-input"
                  style={{ height: 40 }}
                  value={qrRef}
                  onChange={(e) => setQrRef(e.target.value)}
                  placeholder="Mã đơn"
                />
                <button
                  type="button"
                  className="btn primary"
                  onClick={() => onGenerateQr(Number(qrAmount || 0), qrRef)}
                  style={{ height: 40, background: '#1E40FF', display: 'inline-flex', alignItems: 'center', gap: 5 }}
                >
                  <QrCode size={15} /> Tạo QR
                </button>
              </div>
            </div>

            {vietQr?.qr_image_url && (
              <div
                style={{
                  padding: 8,
                  borderRadius: 14,
                  border: '1px solid #DBEAFE',
                  background: '#FFFFFF',
                  textAlign: 'center',
                }}
              >
                <img
                  src={vietQr.qr_image_url}
                  alt="Dynamic Branch VietQR"
                  style={{ width: 138, height: 138, objectFit: 'contain' }}
                />
                <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#1E40FF' }}>
                  {formatVnd(vietQr.amount_vnd)}
                </div>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Cashbook Ledger Table */}
      <Card
        title="Sổ Quỹ Tiền Mặt & Tiền Gửi Ngân Hàng (PT / PC)"
        subtitle="Tự động đồng bộ từ Đơn bán SO, Quầy POS, Đặt cọc xác nhận UNC, Nhập kho PO & Phiếu Chi phí"
        actions={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            {(['all', 'income', 'expense'] as const).map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setTxFilter(f)}
                style={{
                  height: 36,
                  padding: '0 12px',
                  borderRadius: 999,
                  border: txFilter === f ? '1.5px solid #1E40FF' : '1px solid #E2E8F0',
                  background: txFilter === f ? '#EFF6FF' : '#FFFFFF',
                  color: txFilter === f ? '#1E40FF' : '#475569',
                  fontSize: '0.76rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                {f === 'all' ? 'Tất cả bút toán' : f === 'income' ? 'Chỉ Phiếu Thu' : 'Chỉ Phiếu Chi'}
              </button>
            ))}
            {canCreate && (
              <button
                type="button"
                className="btn primary"
                onClick={() => setTxModalOpen(true)}
                style={{ height: 38, background: '#1E40FF', display: 'inline-flex', alignItems: 'center', gap: 5 }}
              >
                <Plus size={15} /> Lập Phiếu Thu / Chi
              </button>
            )}
          </div>
        }
      >
        {filteredTx.length === 0 ? (
          <EmptyState
            title="Chưa có bút toán Thu / Chi nào"
            description="Hoàn tất đơn bán SO, xác nhận UNC đặt cọc hoặc lập bút toán trực tiếp để ghi nhận dòng tiền."
          />
        ) : (
          <Table columns={txColumns} rows={filteredTx} rowKey={(t) => t.id} />
        )}
      </Card>

      <CustomModal
        isOpen={txModalOpen}
        onClose={() => setTxModalOpen(false)}
        title="Lập Bút Toán Sổ Quỹ Trực Tiếp (Phiếu Thu / Phiếu Chi)"
        width="520px"
      >
        <form onSubmit={handleCreateTx} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <label className="form-label">Loại chứng từ</label>
              <select
                className="form-input"
                style={{ height: 44 }}
                value={txType}
                onChange={(e) => setTxType(e.target.value as 'income' | 'expense')}
              >
                <option value="income">Phiếu Thu (PT)</option>
                <option value="expense">Phiếu Chi (PC)</option>
              </select>
            </div>
            <div>
              <label className="form-label">Số tiền (VNĐ) *</label>
              <input
                type="number"
                min={1}
                className="form-input"
                style={{ height: 44 }}
                value={txAmount}
                onChange={(e) => setTxAmount(e.target.value)}
                required
              />
            </div>
          </div>
          <div>
            <label className="form-label">Khoản mục hạch toán</label>
            <input
              className="form-input"
              style={{ height: 44 }}
              value={txCategory}
              onChange={(e) => setTxCategory(e.target.value)}
            />
          </div>
          <div>
            <label className="form-label">Người nộp / Người nhận tiền</label>
            <input
              className="form-input"
              style={{ height: 44 }}
              value={txCounterparty}
              onChange={(e) => setTxCounterparty(e.target.value)}
              placeholder="Tên khách hàng, nhà cung cấp hoặc nhân sự..."
            />
          </div>
          <div>
            <label className="form-label">Diễn giải nội dung</label>
            <textarea
              className="form-input"
              rows={2}
              value={txDesc}
              onChange={(e) => setTxDesc(e.target.value)}
            />
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <button type="button" className="btn secondary" style={{ height: 44 }} onClick={() => setTxModalOpen(false)}>
              Hủy
            </button>
            <button type="submit" className="btn primary" style={{ height: 44, background: '#1E40FF' }}>
              Ghi Sổ quỹ
            </button>
          </div>
        </form>
      </CustomModal>
    </div>
  );
};
