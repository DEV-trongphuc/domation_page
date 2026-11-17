import React, { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { CreditCard, FileText, Plus, Receipt, ShoppingCart } from 'lucide-react';
import { TableSkeleton } from '../../components/ui/Skeleton';
import {
  crmGet,
  crmMutate,
  formatCurrencyVnd,
  formatDateTimeVi,
  vndToVietnameseWords,
  type CrmAuthCreds,
} from '../crm360Api';

export interface CommercialFinanceTabProps {
  contactId: string;
  companyId?: string | null;
  canEdit: boolean;
  creds: CrmAuthCreds;
}

interface QuoteItem {
  id: string;
  quote_code: string;
  title: string;
  status: string;
  total_vnd: number;
  valid_until?: string | null;
  created_at: string;
}

interface OrderItem {
  id: string;
  order_code: string;
  status: string;
  payment_status: string;
  total_vnd: number;
  paid_vnd: number;
  created_at: string;
}

interface DepositItem {
  id: string;
  deposit_code: string;
  amount_vnd: number;
  payment_method: string;
  status: string;
  notes?: string | null;
  created_at: string;
}

interface InvoiceItem {
  id: string;
  invoice_code: string;
  status: string;
  total_vnd: number;
  paid_vnd: number;
  created_at: string;
}

export const CommercialFinanceTab: React.FC<CommercialFinanceTabProps> = ({
  contactId,
  companyId,
  canEdit,
  creds,
}) => {
  const [quotes, setQuotes] = useState<QuoteItem[]>([]);
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [deposits, setDeposits] = useState<DepositItem[]>([]);
  const [invoices, setInvoices] = useState<InvoiceItem[]>([]);
  const [loading, setLoading] = useState(true);

  const [quoteTitle, setQuoteTitle] = useState('');
  const [quoteAmount, setQuoteAmount] = useState(15000000);
  const [depositAmount, setDepositAmount] = useState(5000000);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await crmGet<{
        quotes: QuoteItem[];
        sales_orders: OrderItem[];
        deposits: DepositItem[];
        invoices: InvoiceItem[];
      }>(`/contacts/${contactId}/commercial`, creds);
      setQuotes(res.quotes || []);
      setOrders(res.sales_orders || []);
      setDeposits(res.deposits || []);
      setInvoices(res.invoices || []);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Không thể tải dữ liệu tài chính');
    } finally {
      setLoading(false);
    }
  }, [contactId, creds]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadData();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [loadData]);

  const handleQuickQuote = async () => {
    if (!quoteTitle.trim()) {
      toast.error('Vui lòng nhập tiêu đề báo giá');
      return;
    }
    try {
      await crmMutate(`/contacts/${contactId}/quick-quote`, 'POST', creds, {
        title: quoteTitle.trim(),
        total_vnd: quoteAmount,
        company_id: companyId || null,
      });
      toast.success('Đã tạo và phát hành Báo giá nhanh');
      setQuoteTitle('');
      await loadData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Không thể tạo báo giá');
    }
  };

  const handleQuickDeposit = async () => {
    if (depositAmount <= 0) return;
    try {
      await crmMutate(`/contacts/${contactId}/quick-deposit`, 'POST', creds, {
        amount_vnd: depositAmount,
        company_id: companyId || null,
        payment_method: 'bank_transfer',
      });
      toast.success('Đã ghi nhận khoản Đặt cọc mới');
      await loadData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Không thể ghi nhận đặt cọc');
    }
  };

  if (loading) {
    return <TableSkeleton rows={4} cols={4} />;
  }

  const totalQuoted = quotes.reduce((s, q) => s + Number(q.total_vnd || 0), 0);
  const totalDeposits = deposits.reduce((s, d) => s + Number(d.amount_vnd || 0), 0);
  const totalOrders = orders.reduce((s, o) => s + Number(o.total_vnd || 0), 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
      {/* Financial Rollup KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
        <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 14, padding: '1rem' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748B' }}>TỔNG BÁO GIÁ ({quotes.length})</div>
          <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#1E40FF', marginTop: 4 }}>
            {formatCurrencyVnd(totalQuoted)}
          </div>
        </div>
        <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 14, padding: '1rem' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748B' }}>ĐƠN BÁN SO ({orders.length})</div>
          <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0F172A', marginTop: 4 }}>
            {formatCurrencyVnd(totalOrders)}
          </div>
        </div>
        <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 14, padding: '1rem' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748B' }}>ĐÃ ĐẶT CỌC ({deposits.length})</div>
          <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#059669', marginTop: 4 }}>
            {formatCurrencyVnd(totalDeposits)}
          </div>
        </div>
      </div>

      {canEdit && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(290px, 1fr))',
            gap: 12,
          }}
        >
          <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 14, padding: '1rem', display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ fontSize: '0.84rem', fontWeight: 800, color: '#0F172A', display: 'flex', alignItems: 'center', gap: 6 }}>
              <FileText size={15} color="#1E40FF" /> Tạo Báo giá nhanh
            </div>
            <input
              placeholder="Tiêu đề gói báo giá..."
              value={quoteTitle}
              onChange={(e) => setQuoteTitle(e.target.value)}
              style={{ height: 44, borderRadius: 10, border: '1px solid #E2E8F0', padding: '0 12px', fontSize: '0.83rem' }}
            />
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                type="number"
                value={quoteAmount}
                onChange={(e) => setQuoteAmount(Number(e.target.value || 0))}
                style={{ flex: 1, height: 44, borderRadius: 10, border: '1px solid #E2E8F0', padding: '0 12px', fontSize: '0.83rem' }}
              />
              <button
                type="button"
                onClick={() => void handleQuickQuote()}
                style={{
                  height: 44,
                  padding: '0 14px',
                  borderRadius: 10,
                  border: 'none',
                  background: '#1E40FF',
                  color: '#FFFFFF',
                  fontWeight: 700,
                  fontSize: '0.8rem',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 5,
                  cursor: 'pointer',
                }}
              >
                <Plus size={14} /> Tạo BG
              </button>
            </div>
            <span style={{ fontSize: '0.73rem', color: '#64748B', fontStyle: 'italic' }}>
              {vndToVietnameseWords(quoteAmount)}
            </span>
          </div>

          <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 14, padding: '1rem', display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ fontSize: '0.84rem', fontWeight: 800, color: '#0F172A', display: 'flex', alignItems: 'center', gap: 6 }}>
              <CreditCard size={15} color="#059669" /> Ghi nhận Đặt cọc (VietQR / UNC)
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 'auto' }}>
              <input
                type="number"
                value={depositAmount}
                onChange={(e) => setDepositAmount(Number(e.target.value || 0))}
                style={{ flex: 1, height: 44, borderRadius: 10, border: '1px solid #E2E8F0', padding: '0 12px', fontSize: '0.83rem' }}
              />
              <button
                type="button"
                onClick={() => void handleQuickDeposit()}
                style={{
                  height: 44,
                  padding: '0 14px',
                  borderRadius: 10,
                  border: 'none',
                  background: '#059669',
                  color: '#FFFFFF',
                  fontWeight: 700,
                  fontSize: '0.8rem',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 5,
                  cursor: 'pointer',
                }}
              >
                <Plus size={14} /> Thu cọc
              </button>
            </div>
            <span style={{ fontSize: '0.73rem', color: '#64748B', fontStyle: 'italic' }}>
              {vndToVietnameseWords(depositAmount)}
            </span>
          </div>
        </div>
      )}

      {/* Quotes & Orders & Deposits & Invoices Lists */}
      {[
        {
          title: `Báo giá (${quotes.length})`,
          icon: <FileText size={16} color="#1E40FF" />,
          rows: quotes.map((q) => ({
            id: q.id,
            code: q.quote_code,
            name: q.title,
            amount: q.total_vnd,
            status: q.status,
            date: q.created_at,
          })),
        },
        {
          title: `Đơn bán hàng SO (${orders.length})`,
          icon: <ShoppingCart size={16} color="#1E40FF" />,
          rows: orders.map((o) => ({
            id: o.id,
            code: o.order_code,
            name: `Thanh toán: ${o.payment_status}`,
            amount: o.total_vnd,
            status: o.status,
            date: o.created_at,
          })),
        },
        {
          title: `Phiếu Đặt cọc (${deposits.length})`,
          icon: <CreditCard size={16} color="#059669" />,
          rows: deposits.map((d) => ({
            id: d.id,
            code: d.deposit_code,
            name: d.payment_method,
            amount: d.amount_vnd,
            status: d.status,
            date: d.created_at,
          })),
        },
        {
          title: `Hóa đơn VAT (${invoices.length})`,
          icon: <Receipt size={16} color="#7C3AED" />,
          rows: invoices.map((inv) => ({
            id: inv.id,
            code: inv.invoice_code,
            name: `Đã thu: ${formatCurrencyVnd(inv.paid_vnd)}`,
            amount: inv.total_vnd,
            status: inv.status,
            date: inv.created_at,
          })),
        },
      ].map((sec) => (
        <div
          key={sec.title}
          style={{
            background: '#FFFFFF',
            border: '1px solid #E2E8F0',
            borderRadius: 14,
            padding: '1rem 1.2rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            {sec.icon}
            <strong style={{ fontSize: '0.88rem', color: '#0F172A' }}>{sec.title}</strong>
          </div>
          {sec.rows.length === 0 ? (
            <div style={{ fontSize: '0.8rem', color: '#94A3B8' }}>Chưa phát sinh chứng từ.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {sec.rows.map((r) => (
                <div
                  key={r.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 10px',
                    borderRadius: 10,
                    background: '#F8FAFC',
                    fontSize: '0.82rem',
                  }}
                >
                  <div>
                    <strong style={{ color: '#0F172A' }}>{r.code}</strong> •{' '}
                    <span style={{ color: '#475569' }}>{r.name}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <strong style={{ color: '#1E40FF' }}>{formatCurrencyVnd(r.amount)}</strong>
                    <span
                      style={{
                        fontSize: '0.7rem',
                        fontWeight: 700,
                        padding: '2px 8px',
                        borderRadius: 999,
                        background: '#EFF6FF',
                        color: '#1E40FF',
                      }}
                    >
                      {r.status}
                    </span>
                    <span style={{ fontSize: '0.73rem', color: '#94A3B8' }}>{formatDateTimeVi(r.date)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default CommercialFinanceTab;
