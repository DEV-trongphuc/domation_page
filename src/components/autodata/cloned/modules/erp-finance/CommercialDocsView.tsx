import React, { useState } from 'react';
import {
  ArrowRight,
  CheckCircle2,
  CreditCard,
  FileText,
  PackageCheck,
  Plus,
  Printer,
  ShoppingBag,
  Truck,
} from 'lucide-react';
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
import type { PrintableCommercialDoc } from './PrintableDocModal';
import type { CommercialEditorMode } from './QuoteEditorModal';
import type {
  InvoiceRecord,
  PurchaseOrderRecord,
  QuoteRecord,
  SalesOrderRecord,
  WarehouseRecord,
} from './financeTypes';

interface CommercialDocsViewProps {
  activeDocTab: 'quotes' | 'sales_orders' | 'invoices' | 'purchase_orders';
  quotes: QuoteRecord[];
  salesOrders: SalesOrderRecord[];
  invoices: InvoiceRecord[];
  purchaseOrders: PurchaseOrderRecord[];
  warehouses: WarehouseRecord[];
  canCreate: boolean;
  canEdit: boolean;
  onOpenEditor: (mode: CommercialEditorMode) => void;
  onOpenPrintPreview: (doc: PrintableCommercialDoc) => void;
  onRefresh: () => void;
}

interface ThreeWayLineDraft {
  product_id: string;
  name: string;
  ordered_qty: number;
  received_qty: number;
  invoiced_qty: number;
  actual_unit_cost_vnd: number;
}

export const CommercialDocsView: React.FC<CommercialDocsViewProps> = ({
  activeDocTab,
  quotes,
  salesOrders,
  invoices,
  purchaseOrders,
  warehouses,
  canCreate,
  canEdit,
  onOpenEditor,
  onOpenPrintPreview,
  onRefresh,
}) => {
  const { token, tenantSlug } = useAuth();

  // 3-Way Match PO Receiving Modal
  const [receivingPo, setReceivingPo] = useState<PurchaseOrderRecord | null>(null);
  const [matchLines, setMatchLines] = useState<ThreeWayLineDraft[]>([]);
  const [supplierInvoiceNo, setSupplierInvoiceNo] = useState('');
  const [receiveWhId, setReceiveWhId] = useState('');
  const [submittingReceive, setSubmittingReceive] = useState(false);

  const handleConvertQuote = async (q: QuoteRecord) => {
    try {
      const res = await apiRequest<{ sales_order: { order_code: string } }>(
        `/finance/quotes/${q.id}/convert-to-order`,
        { method: 'POST', token, tenantSlug, body: {} }
      );
      toast.success(`Đã chuyển Báo giá ${q.quote_code} → Đơn bán ${res.sales_order.order_code}!`);
      onRefresh();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Không thể chuyển Báo giá thành Đơn bán.'));
    }
  };

  const handlePayCompleteSo = async (so: SalesOrderRecord) => {
    try {
      await apiRequest(`/finance/sales-orders/${so.id}/pay-complete`, {
        method: 'POST',
        token,
        tenantSlug,
        body: { payment_method: 'bank_transfer', issue_invoice: true },
      });
      toast.success(
        `Đã hoàn tất thanh toán, xuất kho FIFO & xuất Hóa đơn cho ${so.order_code}!`
      );
      onRefresh();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Không thể hoàn tất thanh toán Đơn bán.'));
    }
  };

  const handleRecordInvoicePayment = async (inv: InvoiceRecord) => {
    try {
      await apiRequest(`/finance/invoices/${inv.id}/record-payment`, {
        method: 'POST',
        token,
        tenantSlug,
        body: { payment_method: 'bank_transfer' },
      });
      toast.success(`Đã gạch nợ thanh toán Hóa đơn ${inv.invoice_code}!`);
      onRefresh();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Không thể gạch nợ Hóa đơn.'));
    }
  };

  const openThreeWayMatchModal = (po: PurchaseOrderRecord) => {
    setReceivingPo(po);
    setSupplierInvoiceNo('');
    setReceiveWhId(po.warehouse_id || '');
    setMatchLines(
      (po.items || [])
        .filter((li) => Boolean(li.product_id))
        .map((li) => {
          const ordered = Number(li.ordered_qty ?? li.qty ?? 1);
          return {
            product_id: String(li.product_id),
            name: li.name,
            ordered_qty: ordered,
            received_qty: ordered,
            invoiced_qty: ordered,
            actual_unit_cost_vnd: li.unit_price_vnd,
          };
        })
    );
  };

  const handleConfirmThreeWayReceive = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!receivingPo) return;
    setSubmittingReceive(true);
    try {
      const res = await apiRequest<{
        created_batches: unknown[];
        three_way_match?: { status: string };
      }>(`/finance/purchase-orders/${receivingPo.id}/receive`, {
        method: 'POST',
        token,
        tenantSlug,
        body: {
          warehouse_id: receiveWhId || null,
          supplier_invoice_no: supplierInvoiceNo.trim() || null,
          received_lines: matchLines,
        },
      });
      toast.success(
        `Nhập kho 3-Way Match ${receivingPo.po_code}: ${res.created_batches.length} lô FIFO (${res.three_way_match?.status || 'matched'})!`
      );
      setReceivingPo(null);
      onRefresh();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Không thể nhập kho Đơn mua hàng.'));
    } finally {
      setSubmittingReceive(false);
    }
  };

  const quoteCols: Array<TableColumn<QuoteRecord>> = [
    {
      key: 'code',
      header: 'Mã Báo Giá',
      render: (q) => (
        <div>
          <strong style={{ color: '#1E40FF' }}>{q.quote_code}</strong>
          <div style={{ fontSize: '0.73rem', color: '#64748B' }}>{formatShortDate(q.created_at)}</div>
        </div>
      ),
    },
    {
      key: 'title',
      header: 'Tiêu đề & Khách hàng',
      render: (q) => (
        <div>
          <div style={{ fontWeight: 700, color: '#0F172A' }}>{q.title}</div>
          <div style={{ fontSize: '0.74rem', color: '#64748B' }}>
            {q.company_name || q.lead_name || q.customer_name || 'Khách hàng'} • {q.items?.length || 0} dòng SKU
          </div>
        </div>
      ),
    },
    {
      key: 'total',
      header: 'Tổng giá trị',
      align: 'right',
      render: (q) => <strong>{formatVnd(q.total_vnd)}</strong>,
    },
    {
      key: 'status',
      header: 'Trạng thái',
      render: (q) => (
        <Badge tone={q.status === 'converted' ? 'success' : 'info'}>{q.status}</Badge>
      ),
    },
    {
      key: 'actions',
      header: 'Thao tác',
      align: 'right',
      render: (q) => (
        <div style={{ display: 'inline-flex', gap: 6 }}>
          <button
            type="button"
            className="btn secondary"
            style={{ height: 34 }}
            onClick={() =>
              onOpenPrintPreview({
                docTypeLabel: 'Bảng Báo Giá Thương Mại',
                code: q.quote_code,
                title: q.title,
                counterpartyLabel: 'Kính gửi Khách hàng',
                counterpartyName: q.company_name || q.lead_name || q.customer_name || 'Quý Khách hàng',
                issueDate: q.created_at,
                dueDate: q.valid_until,
                items: q.items || [],
                subtotalVnd: q.subtotal_vnd,
                discountVnd: q.discount_vnd,
                taxVnd: q.tax_vnd,
                shippingFeeVnd: q.shipping_fee_vnd || 0,
                totalVnd: q.total_vnd,
                termsText: q.terms_text,
              })
            }
          >
            <Printer size={14} />
          </button>
          {canCreate && q.status !== 'converted' && (
            <button
              type="button"
              className="btn primary"
              onClick={() => void handleConvertQuote(q)}
              style={{ height: 34, background: '#1E40FF', fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: 4 }}
            >
              Chuyển SO <ArrowRight size={13} />
            </button>
          )}
        </div>
      ),
    },
  ];

  const soCols: Array<TableColumn<SalesOrderRecord>> = [
    {
      key: 'code',
      header: 'Mã Đơn Bán (SO)',
      render: (so) => (
        <div>
          <strong style={{ color: '#1E40FF' }}>{so.order_code}</strong>
          <div style={{ fontSize: '0.73rem', color: '#64748B' }}>{formatShortDate(so.created_at)}</div>
        </div>
      ),
    },
    {
      key: 'customer',
      header: 'Khách hàng',
      render: (so) => (
        <div>
          <div style={{ fontWeight: 700, color: '#0F172A' }}>{so.customer_name}</div>
          <div style={{ fontSize: '0.73rem', color: '#64748B' }}>
            Kho xuất: {so.fulfillment_status} • Giá vốn FIFO: {formatVnd(so.cogs_vnd)}
          </div>
        </div>
      ),
    },
    {
      key: 'total',
      header: 'Doanh thu / Đã thu',
      align: 'right',
      render: (so) => (
        <div>
          <strong>{formatVnd(so.total_vnd)}</strong>
          <div style={{ fontSize: '0.73rem', color: '#059669' }}>Đã thu: {formatVnd(so.paid_vnd)}</div>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Thanh toán',
      render: (so) => (
        <Badge tone={so.payment_status === 'paid' ? 'success' : 'warning'}>{so.payment_status}</Badge>
      ),
    },
    {
      key: 'actions',
      header: 'Thao tác',
      align: 'right',
      render: (so) => (
        <div style={{ display: 'inline-flex', gap: 6 }}>
          <button
            type="button"
            className="btn secondary"
            style={{ height: 34 }}
            onClick={() =>
              onOpenPrintPreview({
                docTypeLabel: 'Đơn Đặt Hàng Bán (Sales Order)',
                code: so.order_code,
                title: so.notes || `Đơn bán hàng ${so.order_code}`,
                counterpartyLabel: 'Khách hàng',
                counterpartyName: so.customer_name,
                issueDate: so.created_at,
                items: so.items || [],
                subtotalVnd: so.subtotal_vnd,
                discountVnd: so.discount_vnd || 0,
                taxVnd: so.tax_vnd || 0,
                shippingFeeVnd: so.shipping_fee_vnd || 0,
                totalVnd: so.total_vnd,
              })
            }
          >
            <Printer size={14} />
          </button>
          {canEdit && so.payment_status !== 'paid' && (
            <button
              type="button"
              className="btn primary"
              onClick={() => void handlePayCompleteSo(so)}
              style={{ height: 34, background: '#059669', fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: 4 }}
            >
              <CheckCircle2 size={13} /> Thu tiền & Xuất FIFO
            </button>
          )}
        </div>
      ),
    },
  ];

  const invCols: Array<TableColumn<InvoiceRecord>> = [
    {
      key: 'code',
      header: 'Số Hóa Đơn',
      render: (inv) => (
        <div>
          <strong style={{ color: '#1E40FF' }}>{inv.invoice_code}</strong>
          <div style={{ fontSize: '0.72rem', color: '#64748B' }}>
            {inv.vat_invoice_no ? `HĐ Đỏ: ${inv.vat_invoice_no}` : formatShortDate(inv.issue_date)}
          </div>
        </div>
      ),
    },
    {
      key: 'customer',
      header: 'Người mua / Pháp nhân',
      render: (inv) => (
        <div>
          <div style={{ fontWeight: 700, color: '#0F172A' }}>{inv.customer_name}</div>
          <div style={{ fontSize: '0.73rem', color: '#64748B' }}>
            MST: {inv.customer_tax_code || '—'} • Hạn: {formatShortDate(inv.due_date)}
          </div>
        </div>
      ),
    },
    {
      key: 'amount',
      header: 'Tổng thanh toán',
      align: 'right',
      render: (inv) => (
        <div>
          <strong>{formatVnd(inv.total_vnd)}</strong>
          <div style={{ fontSize: '0.72rem', color: '#059669' }}>Đã trả: {formatVnd(inv.paid_vnd)}</div>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Trạng thái',
      render: (inv) => (
        <Badge tone={inv.status === 'paid' ? 'success' : inv.status === 'overdue' ? 'danger' : 'warning'}>
          {inv.status}
        </Badge>
      ),
    },
    {
      key: 'actions',
      header: 'In / Gạch nợ',
      align: 'right',
      render: (inv) => (
        <div style={{ display: 'inline-flex', gap: 6 }}>
          <button
            type="button"
            className="btn secondary"
            style={{ height: 34 }}
            onClick={() =>
              onOpenPrintPreview({
                docTypeLabel: 'Hóa Đơn Giá Trị Gia Tăng / Thương Mại',
                code: inv.invoice_code,
                title: inv.notes || `Hóa đơn ${inv.invoice_code}`,
                counterpartyLabel: 'Đơn vị mua hàng',
                counterpartyName: inv.customer_name,
                counterpartyTaxCode: inv.customer_tax_code,
                counterpartyAddress: inv.customer_address,
                issueDate: inv.issue_date,
                dueDate: inv.due_date,
                items: inv.items || [],
                subtotalVnd: inv.subtotal_vnd,
                discountVnd: inv.discount_vnd,
                taxVnd: inv.tax_vnd,
                shippingFeeVnd: inv.shipping_fee_vnd,
                totalVnd: inv.total_vnd,
              })
            }
          >
            <Printer size={14} />
          </button>
          {canEdit && inv.status !== 'paid' && (
            <button
              type="button"
              className="btn primary"
              onClick={() => void handleRecordInvoicePayment(inv)}
              style={{ height: 34, background: '#1E40FF', fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: 4 }}
            >
              <CreditCard size={13} /> Thu đủ
            </button>
          )}
        </div>
      ),
    },
  ];

  const poCols: Array<TableColumn<PurchaseOrderRecord>> = [
    {
      key: 'code',
      header: 'Mã Đơn Mua (PO)',
      render: (po) => (
        <div>
          <strong style={{ color: '#1E40FF' }}>{po.po_code}</strong>
          <div style={{ fontSize: '0.73rem', color: '#64748B' }}>{formatShortDate(po.created_at)}</div>
        </div>
      ),
    },
    {
      key: 'supplier',
      header: 'Nhà cung cấp',
      render: (po) => (
        <div>
          <div style={{ fontWeight: 700, color: '#0F172A' }}>{po.supplier_name}</div>
          <div style={{ fontSize: '0.73rem', color: '#64748B' }}>
            {po.items?.length || 0} dòng hàng • 3-Way Match: {po.three_way_match_status || 'pending'}
          </div>
        </div>
      ),
    },
    {
      key: 'total',
      header: 'Giá trị PO',
      align: 'right',
      render: (po) => <strong>{formatVnd(po.total_vnd)}</strong>,
    },
    {
      key: 'status',
      header: 'Trạng thái',
      render: (po) => (
        <Badge tone={po.status === 'received' ? 'success' : 'info'}>{po.status}</Badge>
      ),
    },
    {
      key: 'actions',
      header: 'Nhập kho FIFO (3-Way Match)',
      align: 'right',
      render: (po) => (
        <div style={{ display: 'inline-flex', gap: 6 }}>
          <button
            type="button"
            className="btn secondary"
            style={{ height: 34 }}
            onClick={() =>
              onOpenPrintPreview({
                docTypeLabel: 'Đơn Đặt Mua Hàng (Purchase Order)',
                code: po.po_code,
                title: po.notes || `Đơn mua hàng ${po.po_code}`,
                counterpartyLabel: 'Nhà cung cấp',
                counterpartyName: po.supplier_name,
                issueDate: po.created_at,
                dueDate: po.expected_date,
                items: po.items || [],
                subtotalVnd: po.subtotal_vnd || po.total_vnd,
                discountVnd: po.discount_vnd || 0,
                taxVnd: po.tax_vnd || 0,
                shippingFeeVnd: po.shipping_fee_vnd || 0,
                totalVnd: po.total_vnd,
              })
            }
          >
            <Printer size={14} />
          </button>
          {canEdit && po.status !== 'received' && (
            <button
              type="button"
              className="btn primary"
              onClick={() => openThreeWayMatchModal(po)}
              style={{ height: 34, background: '#1E40FF', fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: 4 }}
            >
              <PackageCheck size={14} /> Đối chiếu & Nhập Lô FIFO
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {activeDocTab === 'quotes' && (
        <Card
          title="Quản Lý Báo Giá Đa Dòng SKU (Quotes) & Chuyển Đổi 1 Chạm Sang Đơn Bán"
          subtitle="Hỗ trợ chiết khấu %, thuế suất 0/5/8/10%, phí vận chuyển và xuất bản in PDF/HTML chuẩn thương mại"
          actions={
            canCreate && (
              <button
                type="button"
                className="btn primary"
                onClick={() => onOpenEditor('quote')}
                style={{ height: 40, background: '#1E40FF', display: 'inline-flex', alignItems: 'center', gap: 6 }}
              >
                <FileText size={15} /> <Plus size={14} /> Lập Báo Giá Đa Dòng
              </button>
            )
          }
        >
          {quotes.length === 0 ? (
            <EmptyState
              title="Chưa có Báo giá nào"
              description="Nhấn Lập Báo Giá Đa Dòng để chọn SKU từ kho và gửi báo giá chuyên nghiệp cho khách hàng."
            />
          ) : (
            <Table columns={quoteCols} rows={quotes} rowKey={(q) => q.id} />
          )}
        </Card>
      )}

      {activeDocTab === 'sales_orders' && (
        <Card
          title="Đơn Đặt Hàng Bán (Sales Orders — SO), Xuất Kho FIFO & Ghi Nhận Doanh Thu"
          subtitle="Tự động trừ lô hàng cũ nhất (FIFO), tính Giá vốn hàng bán (COGS) và đẩy doanh thu về Hồ sơ 360°"
          actions={
            canCreate && (
              <button
                type="button"
                className="btn primary"
                onClick={() => onOpenEditor('sales_order')}
                style={{ height: 40, background: '#1E40FF', display: 'inline-flex', alignItems: 'center', gap: 6 }}
              >
                <ShoppingBag size={15} /> <Plus size={14} /> Tạo Đơn Bán (SO)
              </button>
            )
          }
        >
          {salesOrders.length === 0 ? (
            <EmptyState
              title="Chưa có Đơn bán hàng (SO) nào"
              description="Chuyển đổi 1 chạm từ Báo giá hoặc tạo trực tiếp Đơn bán hàng mới."
            />
          ) : (
            <Table columns={soCols} rows={salesOrders} rowKey={(s) => s.id} />
          )}
        </Card>
      )}

      {activeDocTab === 'invoices' && (
        <Card
          title="Hóa Đơn Thương Mại / GTGT Đầu Ra (Invoices) & Theo Dõi Công Nợ"
          subtitle="Quản lý phát hành hóa đơn, đối chiếu hạn thanh toán, in ấn chứng từ và gạch nợ tự động"
          actions={
            canCreate && (
              <button
                type="button"
                className="btn primary"
                onClick={() => onOpenEditor('invoice')}
                style={{ height: 40, background: '#1E40FF', display: 'inline-flex', alignItems: 'center', gap: 6 }}
              >
                <FileText size={15} /> <Plus size={14} /> Phát Hành Hóa Đơn
              </button>
            )
          }
        >
          {invoices.length === 0 ? (
            <EmptyState
              title="Chưa có Hóa đơn nào được phát hành"
              description="Tạo hóa đơn trực tiếp hoặc tự động phát hành khi hoàn tất Đơn bán hàng (SO)."
            />
          ) : (
            <Table columns={invCols} rows={invoices} rowKey={(i) => i.id} />
          )}
        </Card>
      )}

      {activeDocTab === 'purchase_orders' && (
        <Card
          title="Đơn Mua Hàng Nhà Cung Cấp (Purchase Orders — PO) & Kiểm Định 3-Way Match"
          subtitle="Đối chiếu 3 chiều (Số lượng PO ↔ Thực nhận nhập kho ↔ Hóa đơn NCC) và tự sinh lô hàng FIFO"
          actions={
            canCreate && (
              <button
                type="button"
                className="btn primary"
                onClick={() => onOpenEditor('purchase_order')}
                style={{ height: 40, background: '#1E40FF', display: 'inline-flex', alignItems: 'center', gap: 6 }}
              >
                <Truck size={15} /> <Plus size={14} /> Lập Đơn Mua (PO)
              </button>
            )
          }
        >
          {purchaseOrders.length === 0 ? (
            <EmptyState
              title="Chưa có Đơn mua hàng (PO) nào"
              description="Lập PO gửi Nhà cung cấp để kiểm soát giá nhập và tự động sinh lô tồn kho FIFO khi hàng về."
            />
          ) : (
            <Table columns={poCols} rows={purchaseOrders} rowKey={(p) => p.id} />
          )}
        </Card>
      )}

      {/* 3-Way Match PO Receiving Modal */}
      <CustomModal
        isOpen={Boolean(receivingPo)}
        onClose={() => setReceivingPo(null)}
        title={`Kiểm Định Nhập Kho 3-Way Match • ${receivingPo?.po_code || ''}`}
        width="820px"
      >
        <form onSubmit={handleConfirmThreeWayReceive} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <label className="form-label">Kho nhận lô hàng FIFO</label>
              <select
                className="form-input"
                style={{ height: 42 }}
                value={receiveWhId}
                onChange={(e) => setReceiveWhId(e.target.value)}
              >
                <option value="">Kho mặc định</option>
                {warehouses.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="form-label">Số Hóa đơn Nhà cung cấp (Đối chiếu 3-Way)</label>
              <input
                className="form-input"
                style={{ height: 42 }}
                value={supplierInvoiceNo}
                onChange={(e) => setSupplierInvoiceNo(e.target.value)}
                placeholder="VD: INV-NCC-2026-009"
              />
            </div>
          </div>

          {matchLines.length === 0 ? (
            <div style={{ padding: 14, borderRadius: 12, background: '#F8FAFF', fontSize: '0.82rem', color: '#475569' }}>
              Đơn PO tổng hợp không tách dòng SKU vật lý — Nhấn xác nhận để hoàn tất nhận hàng và ghi nhận chi phí mua hàng.
            </div>
          ) : (
            <div style={{ border: '1px solid #E2E8F0', borderRadius: 12, overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
                <thead>
                  <tr style={{ background: '#EFF6FF', color: '#1E40FF' }}>
                    <th style={{ padding: 8, textAlign: 'left' }}>Sản phẩm</th>
                    <th style={{ padding: 8, textAlign: 'center' }}>SL Đặt (PO)</th>
                    <th style={{ padding: 8, textAlign: 'center' }}>SL Thực Nhận</th>
                    <th style={{ padding: 8, textAlign: 'center' }}>SL Trên HĐ NCC</th>
                    <th style={{ padding: 8, textAlign: 'right' }}>Giá vốn Thực nhập</th>
                  </tr>
                </thead>
                <tbody>
                  {matchLines.map((ln, idx) => (
                    <tr key={ln.product_id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                      <td style={{ padding: 8, fontWeight: 700 }}>{ln.name}</td>
                      <td style={{ padding: 8, textAlign: 'center', fontWeight: 700 }}>{ln.ordered_qty}</td>
                      <td style={{ padding: 6 }}>
                        <input
                          type="number"
                          min={0}
                          className="form-input"
                          style={{ height: 36, textAlign: 'center' }}
                          value={ln.received_qty}
                          onChange={(e) =>
                            setMatchLines((prev) =>
                              prev.map((x, i) =>
                                i === idx ? { ...x, received_qty: Number(e.target.value) } : x
                              )
                            )
                          }
                        />
                      </td>
                      <td style={{ padding: 6 }}>
                        <input
                          type="number"
                          min={0}
                          className="form-input"
                          style={{ height: 36, textAlign: 'center' }}
                          value={ln.invoiced_qty}
                          onChange={(e) =>
                            setMatchLines((prev) =>
                              prev.map((x, i) =>
                                i === idx ? { ...x, invoiced_qty: Number(e.target.value) } : x
                              )
                            )
                          }
                        />
                      </td>
                      <td style={{ padding: 6 }}>
                        <input
                          type="number"
                          min={0}
                          className="form-input"
                          style={{ height: 36, textAlign: 'right' }}
                          value={ln.actual_unit_cost_vnd}
                          onChange={(e) =>
                            setMatchLines((prev) =>
                              prev.map((x, i) =>
                                i === idx ? { ...x, actual_unit_cost_vnd: Number(e.target.value) } : x
                              )
                            )
                          }
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <button type="button" className="btn secondary" style={{ height: 44 }} onClick={() => setReceivingPo(null)}>
              Hủy
            </button>
            <button
              type="submit"
              disabled={submittingReceive}
              className="btn primary"
              style={{ height: 44, background: '#1E40FF', fontWeight: 800 }}
            >
              {submittingReceive ? 'Đang tạo lô FIFO...' : 'Xác nhận Nhập kho 3-Way Match'}
            </button>
          </div>
        </form>
      </CustomModal>
    </div>
  );
};
