import React, { useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { Plus, Receipt, Trash2, Wallet, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { apiRequest, formatVnd, getErrorMessage } from '../../../autodataApi';
import { useAuth } from '../../contexts/AuthContext';
import {
  EXPENSE_CATEGORIES,
  TAX_RATE_OPTIONS,
  VIETNAM_POPULAR_BANKS,
  numberToVietnameseWords,
  type FinanceStaffRef,
  type SupplierRecord,
} from './financeTypes';

interface ExpenseCreateDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  staff: FinanceStaffRef[];
  suppliers: SupplierRecord[];
  onSaveSuccess: () => void;
}

interface ExpenseLineDraft {
  content: string;
  qty: string;
  unit_price_vnd: string;
  vat_pct: number;
}

export const ExpenseCreateDrawer: React.FC<ExpenseCreateDrawerProps> = ({
  isOpen,
  onClose,
  staff,
  suppliers,
  onSaveSuccess,
}) => {
  const { token, tenantSlug } = useAuth();
  const [saving, setSaving] = useState(false);

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<string>(EXPENSE_CATEGORIES[0].value);
  const [supplierId, setSupplierId] = useState('');
  const [vendorName, setVendorName] = useState('');
  const [vendorTaxCode, setVendorTaxCode] = useState('');
  const [hasVatInvoice, setHasVatInvoice] = useState(true);
  const [vatInvoiceNo, setVatInvoiceNo] = useState('');
  const [approverUserId, setApproverUserId] = useState('');
  const [expenseDate, setExpenseDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [dueDate, setDueDate] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('bank_transfer');
  const [bankBin, setBankBin] = useState('970436');
  const [bankAccountNo, setBankAccountNo] = useState('');
  const [bankAccountHolder, setBankAccountHolder] = useState('');
  const [attachmentUrl, setAttachmentUrl] = useState('');
  const [notes, setNotes] = useState('');

  const [lines, setLines] = useState<ExpenseLineDraft[]>([
    { content: '', qty: '1', unit_price_vnd: '', vat_pct: 8 },
  ]);

  const totals = useMemo(() => {
    const normalized = lines.map((l) => {
      const q = Math.max(1, Number(l.qty || 1));
      const p = Math.max(0, Math.round(Number(l.unit_price_vnd || 0)));
      const vPct = hasVatInvoice ? l.vat_pct : 0;
      const lineSub = q * p;
      const lineVat = Math.round((lineSub * vPct) / 100);
      return {
        content: l.content,
        qty: q,
        unit_price_vnd: p,
        vat_pct: vPct,
        line_sub_vnd: lineSub,
        line_vat_vnd: lineVat,
        line_total_vnd: lineSub + lineVat,
      };
    });
    const sub = normalized.reduce((acc, item) => acc + item.line_sub_vnd, 0);
    const vat = normalized.reduce((acc, item) => acc + item.line_vat_vnd, 0);
    return { normalized, sub, vat, grand: sub + vat };
  }, [lines, hasVatInvoice]);

  if (!isOpen || typeof document === 'undefined') return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error('Vui lòng nhập nội dung đề nghị thanh toán / chi phí.');
      return;
    }
    const validLines = totals.normalized.filter((l) => l.content.trim() && l.unit_price_vnd > 0);
    if (validLines.length === 0) {
      toast.error('Vui lòng nhập ít nhất 1 hạng mục chi phí có đơn giá > 0.');
      return;
    }

    const selectedBank = VIETNAM_POPULAR_BANKS.find((b) => b.bin === bankBin);

    setSaving(true);
    try {
      await apiRequest('/finance/expenses', {
        method: 'POST',
        token,
        tenantSlug,
        body: {
          title: title.trim(),
          category,
          supplier_id: supplierId || null,
          vendor_name: vendorName.trim() || null,
          vendor_tax_code: vendorTaxCode.trim() || null,
          has_vat_invoice: hasVatInvoice,
          vat_invoice_no: hasVatInvoice ? vatInvoiceNo.trim() || null : null,
          approver_user_id: approverUserId || null,
          payment_method: paymentMethod,
          bank_name: selectedBank?.shortName || null,
          bank_bin: bankBin || null,
          bank_account_no: bankAccountNo.trim() || null,
          bank_account_holder: bankAccountHolder.trim().toUpperCase() || null,
          expense_date: expenseDate,
          due_date: dueDate || null,
          line_items: validLines,
          attachments: attachmentUrl.trim() ? [{ name: 'Chứng từ gốc', url: attachmentUrl.trim() }] : [],
          notes,
        },
      });
      toast.success('Đã gửi Đề nghị Thanh toán / Chi phí chờ phê duyệt!');
      onSaveSuccess();
      onClose();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Không thể gửi đề nghị chi phí.'));
    } finally {
      setSaving(false);
    }
  };

  return createPortal(
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1200,
        background: 'rgba(15, 23, 42, 0.42)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        justifyContent: 'flex-end',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 'min(780px, 100vw)',
          height: '100%',
          background: '#FFFFFF',
          boxShadow: '-12px 0 36px rgba(15, 23, 42, 0.16)',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '1.1rem 1.4rem',
            borderBottom: '1px solid #E2E8F0',
            background: 'linear-gradient(135deg, #FFFFFF 0%, #F8FAFF 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 12,
                background: '#EFF6FF',
                color: '#1E40FF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Wallet size={20} />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: '#0F172A' }}>
                Lập Đề Nghị Thanh Toán / Phiếu Chi Phí Đa Hạng Mục
              </h2>
              <div style={{ fontSize: '0.76rem', color: '#64748B' }}>
                Tách dòng hóa đơn VAT đầu vào, liên thông Luồng Phê Duyệt N Bước & Tạo QR Giải ngân
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              border: '1px solid #E2E8F0',
              background: '#FFFFFF',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <X size={18} color="#475569" />
          </button>
        </div>

        {/* Form Body */}
        <form
          onSubmit={handleSubmit}
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '1.25rem 1.4rem',
            display: 'flex',
            flexDirection: 'column',
            gap: 14,
          }}
        >
          {/* Category Pills */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {EXPENSE_CATEGORIES.map((cat) => {
              const active = category === cat.value;
              return (
                <button
                  key={cat.value}
                  type="button"
                  onClick={() => setCategory(cat.value)}
                  style={{
                    padding: '6px 12px',
                    borderRadius: 999,
                    border: active ? `1.5px solid ${cat.color}` : '1px solid #E2E8F0',
                    background: active ? '#EFF6FF' : '#FFFFFF',
                    color: active ? '#1E40FF' : '#475569',
                    fontSize: '0.76rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  {cat.label}
                </button>
              );
            })}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 0.8fr 0.8fr', gap: 10 }}>
            <div>
              <label className="form-label">Nội dung đề nghị thanh toán *</label>
              <input
                className="form-input"
                style={{ height: 44 }}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="VD: Thanh toán chi phí máy chủ & quảng cáo tháng 11"
                required
              />
            </div>
            <div>
              <label className="form-label">Ngày phát sinh</label>
              <input
                type="date"
                className="form-input"
                style={{ height: 44 }}
                value={expenseDate}
                onChange={(e) => setExpenseDate(e.target.value)}
              />
            </div>
            <div>
              <label className="form-label">Hạn thanh toán</label>
              <input
                type="date"
                className="form-input"
                style={{ height: 44 }}
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 0.8fr', gap: 10 }}>
            <div>
              <label className="form-label">Chọn từ Nhà cung cấp</label>
              <select
                className="form-input"
                style={{ height: 44 }}
                value={supplierId}
                onChange={(e) => {
                  const id = e.target.value;
                  setSupplierId(id);
                  const found = suppliers.find((s) => s.id === id);
                  if (found) {
                    setVendorName(found.name);
                    setVendorTaxCode(found.tax_code || '');
                    if (found.bank_account_no) setBankAccountNo(found.bank_account_no);
                    if (found.bank_account_holder) setBankAccountHolder(found.bank_account_holder);
                  }
                }}
              >
                <option value="">-- Nhập tay đơn vị thụ hưởng --</option>
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.code} — {s.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="form-label">Đơn vị cung cấp / Người thụ hưởng</label>
              <input
                className="form-input"
                style={{ height: 44 }}
                value={vendorName}
                onChange={(e) => setVendorName(e.target.value)}
                placeholder="Tên NCC hoặc nhân sự tạm ứng"
              />
            </div>
            <div>
              <label className="form-label">Người phê duyệt trực tiếp</label>
              <select
                className="form-input"
                style={{ height: 44 }}
                value={approverUserId}
                onChange={(e) => setApproverUserId(e.target.value)}
              >
                <option value="">-- Theo quy trình N bước --</option>
                {staff.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.full_name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* VAT Invoice Toggle */}
          <div
            style={{
              padding: '0.85rem 1rem',
              borderRadius: 12,
              background: '#F8FAFF',
              border: '1px solid #DBEAFE',
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 10,
            }}
          >
            <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontWeight: 700, fontSize: '0.83rem', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={hasVatInvoice}
                onChange={(e) => setHasVatInvoice(e.target.checked)}
              />
              <Receipt size={16} color="#1E40FF" /> Có Hóa đơn GTGT (VAT Đầu vào khấu trừ thuế)
            </label>
            {hasVatInvoice && (
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  className="form-input"
                  style={{ height: 36, width: 150, background: '#FFFFFF' }}
                  placeholder="MST Nhà cung cấp"
                  value={vendorTaxCode}
                  onChange={(e) => setVendorTaxCode(e.target.value)}
                />
                <input
                  className="form-input"
                  style={{ height: 36, width: 165, background: '#FFFFFF' }}
                  placeholder="Số Hóa đơn VAT"
                  value={vatInvoiceNo}
                  onChange={(e) => setVatInvoiceNo(e.target.value)}
                />
              </div>
            )}
          </div>

          {/* Multi-Item Expense Voucher Table */}
          <div
            style={{
              border: '1px solid #E2E8F0',
              borderRadius: 14,
              padding: 10,
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.84rem', fontWeight: 800, color: '#0F172A' }}>
                Bảng kê Chi tiết Hạng mục Chi phí
              </span>
              <button
                type="button"
                className="btn secondary"
                onClick={() =>
                  setLines((prev) => [...prev, { content: '', qty: '1', unit_price_vnd: '', vat_pct: 8 }])
                }
                style={{ height: 34, color: '#1E40FF', display: 'inline-flex', alignItems: 'center', gap: 4 }}
              >
                <Plus size={14} /> Thêm dòng
              </button>
            </div>

            {lines.map((line, idx) => (
              <div
                key={idx}
                style={{
                  display: 'grid',
                  gridTemplateColumns: hasVatInvoice
                    ? '1.6fr 0.55fr 1fr 0.65fr auto'
                    : '1.8fr 0.6fr 1.1fr auto',
                  gap: 8,
                  alignItems: 'center',
                }}
              >
                <input
                  className="form-input"
                  style={{ height: 38 }}
                  placeholder="Diễn giải hạng mục chi..."
                  value={line.content}
                  onChange={(e) =>
                    setLines((prev) =>
                      prev.map((x, i) => (i === idx ? { ...x, content: e.target.value } : x))
                    )
                  }
                />
                <input
                  type="number"
                  min={1}
                  className="form-input"
                  style={{ height: 38, textAlign: 'center' }}
                  value={line.qty}
                  onChange={(e) =>
                    setLines((prev) => prev.map((x, i) => (i === idx ? { ...x, qty: e.target.value } : x)))
                  }
                />
                <input
                  type="number"
                  min={0}
                  className="form-input"
                  style={{ height: 38, textAlign: 'right' }}
                  placeholder="Đơn giá (VNĐ)"
                  value={line.unit_price_vnd}
                  onChange={(e) =>
                    setLines((prev) =>
                      prev.map((x, i) => (i === idx ? { ...x, unit_price_vnd: e.target.value } : x))
                    )
                  }
                />
                {hasVatInvoice && (
                  <select
                    className="form-input"
                    style={{ height: 38 }}
                    value={line.vat_pct}
                    onChange={(e) =>
                      setLines((prev) =>
                        prev.map((x, i) => (i === idx ? { ...x, vat_pct: Number(e.target.value) } : x))
                      )
                    }
                  >
                    {TAX_RATE_OPTIONS.map((r) => (
                      <option key={r} value={r}>
                        VAT {r}%
                      </option>
                    ))}
                  </select>
                )}
                <button
                  type="button"
                  onClick={() =>
                    setLines((prev) => (prev.length <= 1 ? prev : prev.filter((_, i) => i !== idx)))
                  }
                  style={{ border: 'none', background: 'transparent', color: '#EF4444', cursor: 'pointer' }}
                >
                  <Trash2 size={15} />
                </button>
              </div>
            ))}
          </div>

          {/* Beneficiary Bank Account for VietQR Payout */}
          <div style={{ display: 'grid', gridTemplateColumns: '0.8fr 0.9fr 1fr 1.1fr', gap: 8 }}>
            <div>
              <label className="form-label">Hình thức chi</label>
              <select
                className="form-input"
                style={{ height: 42 }}
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
              >
                <option value="bank_transfer">Chuyển khoản</option>
                <option value="cash">Tiền mặt</option>
              </select>
            </div>
            <div>
              <label className="form-label">Ngân hàng nhận</label>
              <select
                className="form-input"
                style={{ height: 42 }}
                value={bankBin}
                onChange={(e) => setBankBin(e.target.value)}
              >
                {VIETNAM_POPULAR_BANKS.map((b) => (
                  <option key={b.bin} value={b.bin}>
                    {b.shortName}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="form-label">Số tài khoản nhận</label>
              <input
                className="form-input"
                style={{ height: 42 }}
                value={bankAccountNo}
                onChange={(e) => setBankAccountNo(e.target.value)}
                placeholder="Số TK thụ hưởng"
              />
            </div>
            <div>
              <label className="form-label">Chủ tài khoản</label>
              <input
                className="form-input"
                style={{ height: 42 }}
                value={bankAccountHolder}
                onChange={(e) => setBankAccountHolder(e.target.value)}
                placeholder="NGUYEN VAN A"
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <label className="form-label">Link Ảnh Hóa đơn / Chứng từ gốc</label>
              <input
                className="form-input"
                style={{ height: 42 }}
                value={attachmentUrl}
                onChange={(e) => setAttachmentUrl(e.target.value)}
                placeholder="https://..."
              />
            </div>
            <div>
              <label className="form-label">Ghi chú giải trình</label>
              <input
                className="form-input"
                style={{ height: 42 }}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Mục đích sử dụng ngân sách..."
              />
            </div>
          </div>

          {/* Summary Bar */}
          <div
            style={{
              padding: '0.95rem 1.1rem',
              borderRadius: 14,
              background: '#F8FAFC',
              border: '1px solid #E2E8F0',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 10,
            }}
          >
            <div>
              <div style={{ fontSize: '0.78rem', color: '#64748B' }}>
                Trước thuế: <strong>{formatVnd(totals.sub)}</strong> • Thuế VAT đầu vào:{' '}
                <strong>{formatVnd(totals.vat)}</strong>
              </div>
              <div style={{ fontSize: '0.75rem', color: '#475569', fontStyle: 'italic', marginTop: 2 }}>
                {numberToVietnameseWords(totals.grand)}
              </div>
            </div>
            <div style={{ fontSize: '1.2rem', fontWeight: 900, color: '#1E40FF' }}>
              Tổng đề nghị: {formatVnd(totals.grand)}
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 'auto', paddingTop: 8 }}>
            <button type="button" className="btn secondary" onClick={onClose} style={{ height: 44 }}>
              Đóng
            </button>
            <button
              type="submit"
              disabled={saving}
              className="btn primary"
              style={{ height: 44, background: '#1E40FF', fontWeight: 800 }}
            >
              {saving ? 'Đang gửi duyệt...' : 'Gửi Đề nghị Phê duyệt'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};
