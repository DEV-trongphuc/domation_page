import React, { useMemo, useState } from 'react';
import { Calculator, Package, Plus, Search, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { CustomModal } from '../../components/ui/CustomModal';
import { apiRequest, formatVnd, getErrorMessage } from '../../../autodataApi';
import { useAuth } from '../../contexts/AuthContext';
import {
  TAX_RATE_OPTIONS,
  numberToVietnameseWords,
  type B2bCompanyRecord,
  type CommercialLineItem,
  type DealRecord,
  type FinanceLeadRef,
  type ProductRecord,
  type SupplierRecord,
} from './financeTypes';

export type CommercialEditorMode = 'quote' | 'sales_order' | 'invoice' | 'purchase_order';

interface QuoteEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: CommercialEditorMode;
  products: ProductRecord[];
  companies: B2bCompanyRecord[];
  leads: FinanceLeadRef[];
  deals: DealRecord[];
  suppliers: SupplierRecord[];
  onSuccess: () => void;
}

const MODE_LABELS: Record<CommercialEditorMode, { title: string; submitLabel: string }> = {
  quote: { title: 'Trình Biên Tập Báo Giá Đa Dòng (SKU Line-Item Editor)', submitLabel: 'Phát hành Báo giá' },
  sales_order: { title: 'Tạo Đơn Bán Hàng (Sales Order — Multi-SKU)', submitLabel: 'Xác nhận Đơn bán (SO)' },
  invoice: { title: 'Phát Hành Hóa Đơn Thương Mại / GTGT (Invoice)', submitLabel: 'Phát hành Hóa đơn' },
  purchase_order: { title: 'Lập Đơn Mua Hàng Nhà Cung Cấp (Purchase Order)', submitLabel: 'Gửi Đơn mua (PO)' },
};

export const QuoteEditorModal: React.FC<QuoteEditorModalProps> = ({
  isOpen,
  onClose,
  mode,
  products,
  companies,
  leads,
  deals,
  suppliers,
  onSuccess,
}) => {
  const { token, tenantSlug } = useAuth();
  const [saving, setSaving] = useState(false);

  const [title, setTitle] = useState('');
  const [companyId, setCompanyId] = useState('');
  const [leadId, setLeadId] = useState('');
  const [dealId, setDealId] = useState('');
  const [supplierId, setSupplierId] = useState('');
  const [counterpartyName, setCounterpartyName] = useState('');
  const [counterpartyTaxCode, setCounterpartyTaxCode] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [vatInvoiceNo, setVatInvoiceNo] = useState('');
  const [termsText, setTermsText] = useState('Thanh toán chuyển khoản theo mã VietQR pháp nhân trên chứng từ.');
  const [notes, setNotes] = useState('');
  const [orderDiscountVnd, setOrderDiscountVnd] = useState('0');
  const [shippingFeeVnd, setShippingFeeVnd] = useState('0');
  const [skuSearch, setSkuSearch] = useState('');

  const [rows, setRows] = useState<CommercialLineItem[]>([
    {
      product_id: null,
      sku: '',
      name: '',
      unit: 'Cái',
      qty: 1,
      unit_price_vnd: 0,
      discount_pct: 0,
      tax_pct: 8,
      line_total_vnd: 0,
    },
  ]);

  const filteredProducts = useMemo(() => {
    const q = skuSearch.trim().toLowerCase();
    if (!q) return products.slice(0, 8);
    return products
      .filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.sku.toLowerCase().includes(q) ||
          (p.barcode && p.barcode.toLowerCase().includes(q))
      )
      .slice(0, 8);
  }, [products, skuSearch]);

  const totals = useMemo(() => {
    const computedRows = rows.map((r) => {
      const qty = Math.max(0.01, Number(r.qty || 0));
      const price = Math.max(0, Math.round(Number(r.unit_price_vnd || 0)));
      const dPct = Math.min(100, Math.max(0, Number(r.discount_pct || 0)));
      const tPct = Math.min(100, Math.max(0, Number(r.tax_pct || 0)));
      const sub = Math.round(qty * price);
      const disc = Math.round((sub * dPct) / 100);
      const base = Math.max(0, sub - disc);
      const tax = Math.round((base * tPct) / 100);
      return {
        ...r,
        line_subtotal_vnd: sub,
        line_discount_vnd: disc,
        line_tax_vnd: tax,
        line_total_vnd: base + tax,
      };
    });
    const subtotal = computedRows.reduce((acc, item) => acc + (item.line_subtotal_vnd || 0), 0);
    const lineDisc = computedRows.reduce((acc, item) => acc + (item.line_discount_vnd || 0), 0);
    const taxSum = computedRows.reduce((acc, item) => acc + (item.line_tax_vnd || 0), 0);
    const extraDisc = Math.max(0, Math.round(Number(orderDiscountVnd || 0)));
    const ship = Math.max(0, Math.round(Number(shippingFeeVnd || 0)));
    const totalDisc = lineDisc + extraDisc;
    const grandTotal = Math.max(0, subtotal - totalDisc + taxSum + ship);
    return { computedRows, subtotal, totalDisc, taxSum, ship, grandTotal };
  }, [rows, orderDiscountVnd, shippingFeeVnd]);

  const handlePickProduct = (prod: ProductRecord) => {
    const unitPrice = mode === 'purchase_order' ? prod.default_cost_vnd || prod.sale_price_vnd : prod.sale_price_vnd;
    const newRow: CommercialLineItem = {
      product_id: prod.id,
      sku: prod.sku,
      name: prod.name,
      unit: prod.unit || 'Cái',
      qty: 1,
      unit_price_vnd: unitPrice,
      discount_pct: 0,
      tax_pct: TAX_RATE_OPTIONS.includes(prod.tax_rate_pct as 0 | 5 | 8 | 10) ? prod.tax_rate_pct : 8,
      line_total_vnd: unitPrice,
    };

    setRows((prev) => {
      if (prev.length === 1 && !prev[0].name.trim() && !prev[0].product_id) {
        return [newRow];
      }
      const existingIdx = prev.findIndex((x) => x.product_id === prod.id);
      if (existingIdx >= 0) {
        return prev.map((x, i) => (i === existingIdx ? { ...x, qty: x.qty + 1 } : x));
      }
      return [...prev, newRow];
    });
    setSkuSearch('');
  };

  const updateRow = (idx: number, patch: Partial<CommercialLineItem>) => {
    setRows((prev) => prev.map((r, i) => (i === idx ? { ...r, ...patch } : r)));
  };

  const removeRow = (idx: number) => {
    setRows((prev) => (prev.length <= 1 ? prev : prev.filter((_, i) => i !== idx)));
  };

  const addBlankRow = () => {
    setRows((prev) => [
      ...prev,
      {
        product_id: null,
        sku: '',
        name: '',
        unit: 'Cái',
        qty: 1,
        unit_price_vnd: 0,
        discount_pct: 0,
        tax_pct: 8,
        line_total_vnd: 0,
      },
    ]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validItems = totals.computedRows.filter((r) => r.name.trim().length > 0);
    if (validItems.length === 0) {
      toast.error('Vui lòng thêm ít nhất 1 dòng sản phẩm / dịch vụ.');
      return;
    }

    const selectedCompany = companies.find((c) => c.id === companyId);
    const selectedLead = leads.find((l) => l.id === leadId);
    const selectedSupplier = suppliers.find((s) => s.id === supplierId);
    const resolvedCustomerName =
      counterpartyName.trim() ||
      selectedCompany?.name ||
      selectedLead?.name ||
      selectedSupplier?.name ||
      'Khách hàng B2B';

    setSaving(true);
    try {
      if (mode === 'quote') {
        if (!title.trim()) {
          toast.error('Vui lòng nhập tiêu đề Báo giá.');
          setSaving(false);
          return;
        }
        await apiRequest('/finance/quotes', {
          method: 'POST',
          token,
          tenantSlug,
          body: {
            title: title.trim(),
            company_id: companyId || null,
            lead_id: leadId || null,
            deal_id: dealId || null,
            customer_name: resolvedCustomerName,
            valid_until: dueDate || null,
            terms_text: termsText,
            notes,
            discount_vnd: Number(orderDiscountVnd || 0),
            shipping_fee_vnd: Number(shippingFeeVnd || 0),
            items: validItems,
          },
        });
        toast.success('Đã phát hành Báo giá đa dòng SKU!');
      } else if (mode === 'sales_order') {
        await apiRequest('/finance/sales-orders', {
          method: 'POST',
          token,
          tenantSlug,
          body: {
            customer_name: resolvedCustomerName,
            company_id: companyId || null,
            lead_id: leadId || null,
            deal_id: dealId || null,
            discount_vnd: Number(orderDiscountVnd || 0),
            shipping_fee_vnd: Number(shippingFeeVnd || 0),
            notes: notes || title,
            items: validItems,
          },
        });
        toast.success('Đã tạo Đơn bán hàng (SO) thành công!');
      } else if (mode === 'invoice') {
        await apiRequest('/finance/invoices', {
          method: 'POST',
          token,
          tenantSlug,
          body: {
            customer_name: resolvedCustomerName,
            customer_tax_code: counterpartyTaxCode || selectedCompany?.tax_code || null,
            company_id: companyId || null,
            lead_id: leadId || null,
            due_date: dueDate || null,
            vat_invoice_no: vatInvoiceNo || null,
            discount_vnd: Number(orderDiscountVnd || 0),
            shipping_fee_vnd: Number(shippingFeeVnd || 0),
            notes: notes || title,
            items: validItems,
          },
        });
        toast.success('Đã phát hành Hóa đơn GTGT / Thương mại!');
      } else {
        const supName = counterpartyName.trim() || selectedSupplier?.name || '';
        if (!supName) {
          toast.error('Vui lòng chọn hoặc nhập tên Nhà cung cấp cho Đơn mua PO.');
          setSaving(false);
          return;
        }
        await apiRequest('/finance/purchase-orders', {
          method: 'POST',
          token,
          tenantSlug,
          body: {
            supplier_id: supplierId || null,
            supplier_name: supName,
            expected_date: dueDate || null,
            discount_vnd: Number(orderDiscountVnd || 0),
            shipping_fee_vnd: Number(shippingFeeVnd || 0),
            notes: notes || title,
            items: validItems,
          },
        });
        toast.success('Đã lập Đơn mua hàng (PO) gửi Nhà cung cấp!');
      }

      onSuccess();
      onClose();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Không thể lưu chứng từ thương mại.'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <CustomModal isOpen={isOpen} onClose={onClose} title={MODE_LABELS[mode].title} width="980px">
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Header Metadata */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 12 }}>
          <div>
            <label className="form-label">
              {mode === 'quote' ? 'Tiêu đề Báo giá *' : 'Tiêu đề / Diễn giải chứng từ'}
            </label>
            <input
              className="form-input"
              style={{ height: 44 }}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="VD: Báo giá thiết bị & triển khai Quý 4"
              required={mode === 'quote'}
            />
          </div>

          {mode === 'purchase_order' ? (
            <div>
              <label className="form-label">Chọn Nhà cung cấp</label>
              <select
                className="form-input"
                style={{ height: 44 }}
                value={supplierId}
                onChange={(e) => {
                  const id = e.target.value;
                  setSupplierId(id);
                  const found = suppliers.find((s) => s.id === id);
                  if (found) setCounterpartyName(found.name);
                }}
              >
                <option value="">-- Chọn từ Danh bạ NCC --</option>
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.code} — {s.name}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div>
              <label className="form-label">Khách hàng Doanh nghiệp (B2B)</label>
              <select
                className="form-input"
                style={{ height: 44 }}
                value={companyId}
                onChange={(e) => {
                  const id = e.target.value;
                  setCompanyId(id);
                  const found = companies.find((c) => c.id === id);
                  if (found) {
                    setCounterpartyName(found.name);
                    setCounterpartyTaxCode(found.tax_code || '');
                  }
                }}
              >
                <option value="">-- Chọn B2B Account --</option>
                {companies.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} {c.tax_code ? `(${c.tax_code})` : ''}
                  </option>
                ))}
              </select>
            </div>
          )}

          {mode !== 'purchase_order' && (
            <div>
              <label className="form-label">Liên hệ CRM 360°</label>
              <select
                className="form-input"
                style={{ height: 44 }}
                value={leadId}
                onChange={(e) => {
                  const id = e.target.value;
                  setLeadId(id);
                  const found = leads.find((l) => l.id === id);
                  if (found && !counterpartyName) setCounterpartyName(found.name);
                }}
              >
                <option value="">-- Gắn Khách hàng CRM --</option>
                {leads.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="form-label">
              {mode === 'purchase_order' ? 'Tên Nhà cung cấp *' : 'Tên Pháp nhân / Người mua'}
            </label>
            <input
              className="form-input"
              style={{ height: 44 }}
              value={counterpartyName}
              onChange={(e) => setCounterpartyName(e.target.value)}
              placeholder="Tên đơn vị trên chứng từ"
            />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: 12 }}>
          {mode === 'quote' && (
            <div>
              <label className="form-label">Cơ hội B2B (Deal)</label>
              <select
                className="form-input"
                style={{ height: 44 }}
                value={dealId}
                onChange={(e) => setDealId(e.target.value)}
              >
                <option value="">-- Không gắn Deal --</option>
                {deals.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.deal_code} — {d.title}
                  </option>
                ))}
              </select>
            </div>
          )}
          {mode === 'invoice' && (
            <>
              <div>
                <label className="form-label">Mã số thuế Người mua</label>
                <input
                  className="form-input"
                  style={{ height: 44 }}
                  value={counterpartyTaxCode}
                  onChange={(e) => setCounterpartyTaxCode(e.target.value)}
                  placeholder="031xxxxxxx"
                />
              </div>
              <div>
                <label className="form-label">Số Hóa đơn Đỏ / Ký hiệu</label>
                <input
                  className="form-input"
                  style={{ height: 44 }}
                  value={vatInvoiceNo}
                  onChange={(e) => setVatInvoiceNo(e.target.value)}
                  placeholder="VD: 1C26TAA-000128"
                />
              </div>
            </>
          )}
          <div>
            <label className="form-label">
              {mode === 'quote'
                ? 'Hiệu lực đến ngày'
                : mode === 'purchase_order'
                  ? 'Ngày giao dự kiến'
                  : 'Hạn thanh toán'}
            </label>
            <input
              type="date"
              className="form-input"
              style={{ height: 44 }}
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </div>
        </div>

        {/* Fast SKU Picker Bar */}
        <div
          style={{
            padding: '0.85rem 1rem',
            borderRadius: 14,
            background: '#F8FAFF',
            border: '1px solid #DBEAFE',
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 240 }}>
              <Search size={16} color="#1E40FF" />
              <input
                className="form-input"
                style={{ height: 40, background: '#FFFFFF' }}
                value={skuSearch}
                onChange={(e) => setSkuSearch(e.target.value)}
                placeholder="Tìm nhanh theo Mã SKU, Barcode hoặc Tên sản phẩm trong Kho để chèn dòng..."
              />
            </div>
            <button
              type="button"
              className="btn secondary"
              onClick={addBlankRow}
              style={{ height: 40, color: '#1E40FF', display: 'inline-flex', alignItems: 'center', gap: 6 }}
            >
              <Plus size={15} /> Thêm dòng tự nhập
            </button>
          </div>

          {filteredProducts.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {filteredProducts.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => handlePickProduct(p)}
                  style={{
                    padding: '5px 10px',
                    borderRadius: 999,
                    border: '1px solid #BFDBFE',
                    background: '#FFFFFF',
                    color: '#0F172A',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 5,
                  }}
                >
                  <Package size={12} color="#1E40FF" />
                  <span style={{ color: '#1E40FF', fontWeight: 800 }}>{p.sku}</span>
                  <span>{p.name}</span>
                  <span style={{ color: '#64748B' }}>({formatVnd(p.sale_price_vnd)})</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Multi-Row Line-Item Grid */}
        <div style={{ overflowX: 'auto', border: '1px solid #E2E8F0', borderRadius: 14, background: '#FFFFFF' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
            <thead>
              <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', color: '#334155' }}>
                <th style={{ padding: '10px 8px', width: 110, textAlign: 'left' }}>Mã SKU</th>
                <th style={{ padding: '10px 8px', textAlign: 'left' }}>Tên Hàng hóa / Dịch vụ *</th>
                <th style={{ padding: '10px 8px', width: 72 }}>ĐVT</th>
                <th style={{ padding: '10px 8px', width: 78 }}>SL</th>
                <th style={{ padding: '10px 8px', width: 135 }}>Đơn giá (VNĐ)</th>
                <th style={{ padding: '10px 8px', width: 78 }}>CK (%)</th>
                <th style={{ padding: '10px 8px', width: 88 }}>Thuế VAT</th>
                <th style={{ padding: '10px 8px', width: 130, textAlign: 'right' }}>Thành tiền</th>
                <th style={{ padding: '10px 6px', width: 42 }} />
              </tr>
            </thead>
            <tbody>
              {totals.computedRows.map((row, idx) => (
                <tr key={idx} style={{ borderBottom: '1px solid #F1F5F9' }}>
                  <td style={{ padding: 6 }}>
                    <input
                      className="form-input"
                      style={{ height: 38, fontSize: '0.78rem' }}
                      value={row.sku}
                      onChange={(e) => updateRow(idx, { sku: e.target.value })}
                      placeholder="SKU"
                    />
                  </td>
                  <td style={{ padding: 6 }}>
                    <input
                      className="form-input"
                      style={{ height: 38, fontSize: '0.8rem' }}
                      value={row.name}
                      onChange={(e) => updateRow(idx, { name: e.target.value })}
                      placeholder="Nhập tên sản phẩm / hạng mục..."
                    />
                  </td>
                  <td style={{ padding: 6 }}>
                    <input
                      className="form-input"
                      style={{ height: 38, textAlign: 'center', fontSize: '0.78rem' }}
                      value={row.unit || 'Cái'}
                      onChange={(e) => updateRow(idx, { unit: e.target.value })}
                    />
                  </td>
                  <td style={{ padding: 6 }}>
                    <input
                      type="number"
                      min={0.01}
                      step="any"
                      className="form-input"
                      style={{ height: 38, textAlign: 'right' }}
                      value={row.qty}
                      onChange={(e) => updateRow(idx, { qty: Number(e.target.value) })}
                    />
                  </td>
                  <td style={{ padding: 6 }}>
                    <input
                      type="number"
                      min={0}
                      className="form-input"
                      style={{ height: 38, textAlign: 'right' }}
                      value={row.unit_price_vnd}
                      onChange={(e) => updateRow(idx, { unit_price_vnd: Number(e.target.value) })}
                    />
                  </td>
                  <td style={{ padding: 6 }}>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      className="form-input"
                      style={{ height: 38, textAlign: 'center' }}
                      value={row.discount_pct}
                      onChange={(e) => updateRow(idx, { discount_pct: Number(e.target.value) })}
                    />
                  </td>
                  <td style={{ padding: 6 }}>
                    <select
                      className="form-input"
                      style={{ height: 38 }}
                      value={row.tax_pct}
                      onChange={(e) => updateRow(idx, { tax_pct: Number(e.target.value) })}
                    >
                      {TAX_RATE_OPTIONS.map((rate) => (
                        <option key={rate} value={rate}>
                          {rate}%
                        </option>
                      ))}
                    </select>
                  </td>
                  <td style={{ padding: '6px 10px', textAlign: 'right', fontWeight: 800, color: '#0F172A' }}>
                    {formatVnd(row.line_total_vnd)}
                  </td>
                  <td style={{ padding: 6, textAlign: 'center' }}>
                    <button
                      type="button"
                      onClick={() => removeRow(idx)}
                      style={{
                        border: 'none',
                        background: 'transparent',
                        color: '#EF4444',
                        cursor: 'pointer',
                        padding: 4,
                      }}
                      title="Xóa dòng"
                    >
                      <Trash2 size={15} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Bottom Notes & Summary */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div>
              <label className="form-label">Điều khoản & Ghi chú chứng từ</label>
              <textarea
                className="form-input"
                rows={3}
                value={mode === 'quote' ? termsText : notes}
                onChange={(e) => (mode === 'quote' ? setTermsText(e.target.value) : setNotes(e.target.value))}
                placeholder="Điều khoản thanh toán, bảo hành, địa điểm giao hàng..."
              />
            </div>
            <div style={{ fontSize: '0.78rem', color: '#475569', fontStyle: 'italic' }}>
              Bằng chữ: <strong style={{ color: '#1E40FF' }}>{numberToVietnameseWords(totals.grandTotal)}</strong>
            </div>
          </div>

          <div
            style={{
              padding: '1rem 1.15rem',
              borderRadius: 14,
              background: '#F8FAFC',
              border: '1px solid #E2E8F0',
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
              fontSize: '0.83rem',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#64748B' }}>Tạm tính ({rows.length} dòng):</span>
              <strong>{formatVnd(totals.subtotal)}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
              <span style={{ color: '#64748B' }}>Chiết khấu thêm (VNĐ):</span>
              <input
                type="number"
                min={0}
                className="form-input"
                style={{ width: 130, height: 34, textAlign: 'right' }}
                value={orderDiscountVnd}
                onChange={(e) => setOrderDiscountVnd(e.target.value)}
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
              <span style={{ color: '#64748B' }}>Phí vận chuyển (VNĐ):</span>
              <input
                type="number"
                min={0}
                className="form-input"
                style={{ width: 130, height: 34, textAlign: 'right' }}
                value={shippingFeeVnd}
                onChange={(e) => setShippingFeeVnd(e.target.value)}
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#64748B' }}>Tổng thuế GTGT (0/5/8/10%):</span>
              <strong>{formatVnd(totals.taxSum)}</strong>
            </div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                borderTop: '2px solid #CBD5E1',
                paddingTop: 8,
                fontSize: '1rem',
                fontWeight: 900,
                color: '#1E40FF',
              }}
            >
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <Calculator size={16} /> TỔNG CỘNG:
              </span>
              <span>{formatVnd(totals.grandTotal)}</span>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
          <button type="button" className="btn secondary" onClick={onClose} style={{ height: 44 }}>
            Hủy
          </button>
          <button
            type="submit"
            disabled={saving}
            className="btn primary"
            style={{ height: 44, background: '#1E40FF', fontWeight: 700 }}
          >
            {saving ? 'Đang lưu...' : MODE_LABELS[mode].submitLabel}
          </button>
        </div>
      </form>
    </CustomModal>
  );
};
