import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  CheckCircle2,
  CreditCard,
  Lock,
  MonitorSmartphone,
  Package,
  Plus,
  QrCode,
  Search,
  Tag,
  Trash2,
  Unlock,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { CustomModal } from '../../components/ui/CustomModal';
import { Badge } from '../../components/ui/AutoDataLoadingModal';
import { apiRequest, formatVnd, getErrorMessage } from '../../../autodataApi';
import { useAuth } from '../../contexts/AuthContext';
import {
  numberToVietnameseWords,
  type FinanceLeadRef,
  type LegalEntityInfo,
  type PosSessionRecord,
  type ProductRecord,
  type WarehouseRecord,
} from './financeTypes';

interface POSModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: ProductRecord[];
  leads: FinanceLeadRef[];
  warehouses: WarehouseRecord[];
  legalEntity?: LegalEntityInfo | null;
  onCheckoutSuccess: () => void;
}

interface PosCartRow {
  product: ProductRecord;
  qty: number;
}

export const POSModal: React.FC<POSModalProps> = ({
  isOpen,
  onClose,
  products,
  leads,
  warehouses,
  legalEntity,
  onCheckoutSuccess,
}) => {
  const { token, tenantSlug } = useAuth();
  const [searchSku, setSearchSku] = useState('');
  const [cart, setCart] = useState<PosCartRow[]>([]);
  const [selectedLeadId, setSelectedLeadId] = useState('');
  const [customerName, setCustomerName] = useState('Khách mua lẻ tại quầy POS');
  const [warehouseId, setWarehouseId] = useState('');
  const [voucherCode, setVoucherCode] = useState('');
  const [voucherDiscountVnd, setVoucherDiscountVnd] = useState(0);
  const [shippingFeeVnd, setShippingFeeVnd] = useState('0');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'vietqr' | 'split'>('vietqr');
  const [splitCashVnd, setSplitCashVnd] = useState('0');
  const [checkingOut, setCheckingOut] = useState(false);

  // Shift Register state
  const [activeSession, setActiveSession] = useState<PosSessionRecord | null>(null);
  const [openingCashInput, setOpeningCashInput] = useState('2000000');
  const [closingCashInput, setClosingCashInput] = useState('');
  const [showCloseShiftBox, setShowCloseShiftBox] = useState(false);

  const loadPosSession = useCallback(async () => {
    if (!token) return;
    try {
      const res = await apiRequest<{ active_session: PosSessionRecord | null }>('/inventory/pos/sessions', {
        token,
        tenantSlug,
      });
      setActiveSession(res?.active_session || null);
    } catch {
      // ignore initial shift probe error
    }
  }, [token, tenantSlug]);

  useEffect(() => {
    if (!isOpen) return;
    const timer = window.setTimeout(() => {
      void loadPosSession();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [isOpen, loadPosSession]);

  const filteredProducts = useMemo(() => {
    const q = searchSku.trim().toLowerCase();
    if (!q) return products.slice(0, 12);
    return products
      .filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.sku.toLowerCase().includes(q) ||
          (p.barcode && p.barcode.toLowerCase().includes(q))
      )
      .slice(0, 12);
  }, [products, searchSku]);

  const addToCart = (prod: ProductRecord) => {
    setCart((prev) => {
      const found = prev.find((c) => c.product.id === prod.id);
      const currentQty = found ? found.qty : 0;
      if (prod.product_type === 'goods' && currentQty + 1 > prod.cached_stock_qty) {
        toast.error(`Sản phẩm ${prod.sku} chỉ còn ${prod.cached_stock_qty} tồn kho khả dụng.`);
        return prev;
      }
      if (found) {
        return prev.map((c) => (c.product.id === prod.id ? { ...c, qty: c.qty + 1 } : c));
      }
      return [...prev, { product: prod, qty: 1 }];
    });
  };

  const handleBarcodeEnter = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const q = searchSku.trim().toLowerCase();
      if (!q) return;
      const exact = products.find(
        (p) => p.sku.toLowerCase() === q || (p.barcode && p.barcode.toLowerCase() === q)
      );
      if (exact) {
        addToCart(exact);
        setSearchSku('');
      } else if (filteredProducts.length === 1) {
        addToCart(filteredProducts[0]);
        setSearchSku('');
      }
    }
  };

  const calc = useMemo(() => {
    let sub = 0;
    let tax = 0;
    for (const c of cart) {
      const lineSub = c.qty * c.product.sale_price_vnd;
      const lineTax = Math.round((lineSub * (c.product.tax_rate_pct || 0)) / 100);
      sub += lineSub;
      tax += lineTax;
    }
    const ship = Math.max(0, Math.round(Number(shippingFeeVnd || 0)));
    const total = Math.max(0, sub - voucherDiscountVnd + tax + ship);
    const cashPart =
      paymentMethod === 'split'
        ? Math.min(total, Math.max(0, Math.round(Number(splitCashVnd || 0))))
        : paymentMethod === 'cash'
          ? total
          : 0;
    const bankPart = Math.max(0, total - cashPart);
    return { sub, tax, ship, total, cashPart, bankPart };
  }, [cart, voucherDiscountVnd, shippingFeeVnd, paymentMethod, splitCashVnd]);

  const vietQrUrl = useMemo(() => {
    if (!legalEntity?.bank_account_no || calc.bankPart <= 0) return null;
    const bin = legalEntity.bank_bin || '970436';
    const q = new URLSearchParams({
      amount: String(calc.bankPart),
      addInfo: 'POS THANHTOAN',
      accountName: legalEntity.bank_account_holder || '',
    });
    return `https://img.vietqr.io/image/${encodeURIComponent(bin)}-${encodeURIComponent(legalEntity.bank_account_no)}-compact2.png?${q.toString()}`;
  }, [legalEntity, calc.bankPart]);

  const handleValidateVoucher = async () => {
    if (!voucherCode.trim()) return;
    try {
      const res = await apiRequest<{
        valid: boolean;
        discount_vnd?: number;
        reason?: string;
      }>('/inventory/pos/validate-voucher', {
        method: 'POST',
        token,
        tenantSlug,
        body: { voucher_code: voucherCode.trim(), subtotal_vnd: calc.sub },
      });
      if (res?.valid) {
        const disc = Number(res.discount_vnd || 0);
        setVoucherDiscountVnd(disc);
        toast.success(`Đã áp dụng mã ${voucherCode.toUpperCase()}: -${formatVnd(disc)}`);
      } else {
        setVoucherDiscountVnd(0);
        toast.error(res?.reason || 'Mã ưu đãi không hợp lệ.');
      }
    } catch (err) {
      toast.error(getErrorMessage(err, 'Không thể kiểm tra mã ưu đãi Voucher.'));
    }
  };

  const handleOpenShift = async () => {
    try {
      const res = await apiRequest<PosSessionRecord>('/inventory/pos/sessions/open', {
        method: 'POST',
        token,
        tenantSlug,
        body: {
          opening_cash_vnd: Number(openingCashInput || 0),
          warehouse_id: warehouseId || null,
        },
      });
      setActiveSession(res);
      toast.success(`Đã mở ca thu ngân ${res.session_code}!`);
    } catch (err) {
      toast.error(getErrorMessage(err, 'Không thể mở ca thu ngân POS.'));
    }
  };

  const handleCloseShift = async () => {
    if (!activeSession) return;
    try {
      const res = await apiRequest<PosSessionRecord>(
        `/inventory/pos/sessions/${activeSession.id}/close`,
        {
          method: 'POST',
          token,
          tenantSlug,
          body: {
            actual_closing_cash_vnd:
              closingCashInput.trim() !== ''
                ? Number(closingCashInput)
                : activeSession.opening_cash_vnd + activeSession.cash_sales_vnd,
          },
        }
      );
      toast.success(
        `Đã chốt ca ${res.session_code}! Chênh lệch két: ${formatVnd(res.variance_vnd)}`
      );
      setActiveSession(null);
      setShowCloseShiftBox(false);
    } catch (err) {
      toast.error(getErrorMessage(err, 'Không thể chốt ca thu ngân POS.'));
    }
  };

  const handleCheckout = async () => {
    if (cart.length === 0) {
      toast.error('Giỏ hàng POS đang trống.');
      return;
    }
    setCheckingOut(true);
    try {
      const res = await apiRequest<{
        order_code: string;
        total_vnd: number;
        cogs_vnd: number;
      }>('/inventory/pos/checkout', {
        method: 'POST',
        token,
        tenantSlug,
        body: {
          session_id: activeSession?.id || null,
          lead_id: selectedLeadId || null,
          customer_name: customerName,
          warehouse_id: warehouseId || null,
          payment_method: paymentMethod,
          cash_paid_vnd: calc.cashPart,
          voucher_code: voucherCode.trim() || null,
          voucher_discount_vnd: voucherDiscountVnd,
          shipping_fee_vnd: calc.ship,
          items: cart.map((c) => ({
            product_id: c.product.id,
            qty: c.qty,
            unit_price_vnd: c.product.sale_price_vnd,
          })),
        },
      });
      toast.success(
        `Thanh toán ${res.order_code} (${formatVnd(res.total_vnd)}) • Giá vốn FIFO: ${formatVnd(res.cogs_vnd)}`
      );
      setCart([]);
      setVoucherCode('');
      setVoucherDiscountVnd(0);
      await loadPosSession();
      onCheckoutSuccess();
      onClose();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Không thể thanh toán đơn hàng POS.'));
    } finally {
      setCheckingOut(false);
    }
  };

  return (
    <CustomModal
      isOpen={isOpen}
      onClose={onClose}
      title="Quầy Bán Lẻ Nhanh POS • Quét Barcode, Trừ Tồn FIFO & Đối Soát Ca"
      width="1040px"
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {/* Shift Register Reconciliation Bar */}
        <div
          style={{
            padding: '0.75rem 1rem',
            borderRadius: 14,
            background: activeSession ? '#ECFDF5' : '#EFF6FF',
            border: `1px solid ${activeSession ? '#A7F3D0' : '#BFDBFE'}`,
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 10,
          }}
        >
          {activeSession ? (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', fontSize: '0.8rem' }}>
                <Badge tone="success" icon={<Unlock size={11} />}>
                  Ca đang mở: {activeSession.session_code}
                </Badge>
                <span>Đầu ca: <strong>{formatVnd(activeSession.opening_cash_vnd)}</strong></span>
                <span>• Thu tiền mặt: <strong>{formatVnd(activeSession.cash_sales_vnd)}</strong></span>
                <span>• Thu CK: <strong>{formatVnd(activeSession.bank_sales_vnd)}</strong></span>
                <span>• Số đơn: <strong>{activeSession.orders_count}</strong></span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {showCloseShiftBox ? (
                  <>
                    <input
                      type="number"
                      className="form-input"
                      style={{ width: 150, height: 36, background: '#FFFFFF' }}
                      placeholder="Tiền mặt thực đếm"
                      value={closingCashInput}
                      onChange={(e) => setClosingCashInput(e.target.value)}
                    />
                    <button
                      type="button"
                      className="btn primary"
                      onClick={() => void handleCloseShift()}
                      style={{ height: 36, background: '#1E40FF' }}
                    >
                      Xác nhận chốt ca
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    className="btn secondary"
                    onClick={() => setShowCloseShiftBox(true)}
                    style={{ height: 36, display: 'inline-flex', alignItems: 'center', gap: 5 }}
                  >
                    <Lock size={13} /> Chốt ca đối soát két
                  </button>
                )}
              </div>
            </>
          ) : (
            <>
              <div style={{ fontSize: '0.8rem', color: '#1E3A8A', fontWeight: 600 }}>
                Chưa mở ca thu ngân hôm nay — Nhập tiền mặt đầu ca để theo dõi két thu ngân POS:
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input
                  type="number"
                  className="form-input"
                  style={{ width: 150, height: 38, background: '#FFFFFF' }}
                  value={openingCashInput}
                  onChange={(e) => setOpeningCashInput(e.target.value)}
                />
                <button
                  type="button"
                  className="btn primary"
                  onClick={() => void handleOpenShift()}
                  style={{ height: 38, background: '#1E40FF' }}
                >
                  Mở ca thu ngân
                </button>
              </div>
            </>
          )}
        </div>

        {/* Two-Pane POS Workspace */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 16 }}>
          {/* Left: Product Grid & Barcode Search */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ display: 'flex', gap: 8 }}>
              <div style={{ position: 'relative', flex: 1 }}>
                <Search
                  size={15}
                  color="#64748B"
                  style={{ position: 'absolute', left: 12, top: 14 }}
                />
                <input
                  className="form-input"
                  style={{ height: 44, paddingLeft: 36 }}
                  value={searchSku}
                  onChange={(e) => setSearchSku(e.target.value)}
                  onKeyDown={handleBarcodeEnter}
                  placeholder="Quét mã Barcode hoặc gõ SKU + Enter..."
                />
              </div>
              <select
                className="form-input"
                style={{ width: 155, height: 44 }}
                value={warehouseId}
                onChange={(e) => setWarehouseId(e.target.value)}
              >
                <option value="">Tất cả kho</option>
                {warehouses.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name}
                  </option>
                ))}
              </select>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
                gap: 8,
                maxHeight: 370,
                overflowY: 'auto',
                padding: 2,
              }}
            >
              {filteredProducts.map((p) => {
                const outOfStock = p.product_type === 'goods' && p.cached_stock_qty <= 0;
                return (
                  <button
                    key={p.id}
                    type="button"
                    disabled={outOfStock}
                    onClick={() => addToCart(p)}
                    style={{
                      textAlign: 'left',
                      padding: '0.75rem',
                      borderRadius: 12,
                      border: '1px solid #E2E8F0',
                      background: outOfStock ? '#F8FAFC' : '#FFFFFF',
                      opacity: outOfStock ? 0.55 : 1,
                      cursor: outOfStock ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 4,
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.7rem', fontWeight: 800, color: '#1E40FF' }}>{p.sku}</span>
                      <Package size={13} color="#64748B" />
                    </div>
                    <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#0F172A', lineHeight: 1.25 }}>
                      {p.name}
                    </div>
                    <div style={{ fontSize: '0.82rem', fontWeight: 800, color: '#059669', marginTop: 'auto' }}>
                      {formatVnd(p.sale_price_vnd)}
                    </div>
                    <div style={{ fontSize: '0.7rem', color: outOfStock ? '#DC2626' : '#64748B' }}>
                      {p.product_type === 'goods' ? `Tồn FIFO: ${p.cached_stock_qty} ${p.unit}` : 'Dịch vụ'}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right: Cart, Voucher & Split Payment */}
          <div
            style={{
              padding: '1rem',
              borderRadius: 16,
              background: '#F8FAFC',
              border: '1px solid #E2E8F0',
              display: 'flex',
              flexDirection: 'column',
              gap: 10,
            }}
          >
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <select
                className="form-input"
                style={{ height: 40, background: '#FFFFFF' }}
                value={selectedLeadId}
                onChange={(e) => {
                  const id = e.target.value;
                  setSelectedLeadId(id);
                  const found = leads.find((l) => l.id === id);
                  if (found) setCustomerName(found.name);
                }}
              >
                <option value="">-- Khách vãng lai --</option>
                {leads.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.name}
                  </option>
                ))}
              </select>
              <input
                className="form-input"
                style={{ height: 40, background: '#FFFFFF' }}
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Tên khách trên bill"
              />
            </div>

            <div
              style={{
                minHeight: 135,
                maxHeight: 185,
                overflowY: 'auto',
                background: '#FFFFFF',
                borderRadius: 12,
                border: '1px solid #E2E8F0',
                padding: 8,
                display: 'flex',
                flexDirection: 'column',
                gap: 6,
              }}
            >
              {cart.length === 0 ? (
                <div style={{ margin: 'auto', fontSize: '0.8rem', color: '#94A3B8', textAlign: 'center' }}>
                  Chọn sản phẩm bên trái để đưa vào giỏ POS
                </div>
              ) : (
                cart.map((c) => (
                  <div
                    key={c.product.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 8,
                      paddingBottom: 6,
                      borderBottom: '1px solid #F1F5F9',
                      fontSize: '0.8rem',
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, color: '#0F172A' }}>{c.product.name}</div>
                      <div style={{ fontSize: '0.72rem', color: '#64748B' }}>
                        {formatVnd(c.product.sale_price_vnd)} × {c.qty}
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <button
                        type="button"
                        className="btn secondary"
                        style={{ height: 28, padding: '0 8px' }}
                        onClick={() =>
                          setCart((prev) =>
                            prev
                              .map((x) => (x.product.id === c.product.id ? { ...x, qty: x.qty - 1 } : x))
                              .filter((x) => x.qty > 0)
                          )
                        }
                      >
                        -
                      </button>
                      <span style={{ minWidth: 22, textAlign: 'center', fontWeight: 800 }}>{c.qty}</span>
                      <button
                        type="button"
                        className="btn secondary"
                        style={{ height: 28, padding: '0 8px' }}
                        onClick={() => addToCart(c.product)}
                      >
                        <Plus size={12} />
                      </button>
                      <button
                        type="button"
                        onClick={() => setCart((prev) => prev.filter((x) => x.product.id !== c.product.id))}
                        style={{ border: 'none', background: 'transparent', color: '#EF4444', cursor: 'pointer' }}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Voucher Redemption + Shipping */}
            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: 8 }}>
              <div style={{ display: 'flex', gap: 6 }}>
                <input
                  className="form-input"
                  style={{ height: 38, background: '#FFFFFF' }}
                  value={voucherCode}
                  onChange={(e) => setVoucherCode(e.target.value)}
                  placeholder="Mã Voucher (VD: VIP10)"
                />
                <button
                  type="button"
                  className="btn secondary"
                  onClick={() => void handleValidateVoucher()}
                  style={{ height: 38, color: '#1E40FF', whiteSpace: 'nowrap', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                >
                  <Tag size={13} /> Áp mã
                </button>
              </div>
              <input
                type="number"
                min={0}
                className="form-input"
                style={{ height: 38, background: '#FFFFFF' }}
                value={shippingFeeVnd}
                onChange={(e) => setShippingFeeVnd(e.target.value)}
                placeholder="Phí ship (VNĐ)"
              />
            </div>

            {/* Payment Method & Split Pay */}
            <div style={{ display: 'flex', gap: 6 }}>
              {(
                [
                  { id: 'vietqr', label: 'Chuyển khoản VietQR', icon: <QrCode size={14} /> },
                  { id: 'cash', label: 'Tiền mặt', icon: <CreditCard size={14} /> },
                  { id: 'split', label: 'Tách TT (Tiền mặt + CK)', icon: <MonitorSmartphone size={14} /> },
                ] as const
              ).map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setPaymentMethod(m.id)}
                  style={{
                    flex: 1,
                    height: 38,
                    borderRadius: 10,
                    border: paymentMethod === m.id ? '1.5px solid #1E40FF' : '1px solid #CBD5E1',
                    background: paymentMethod === m.id ? '#EFF6FF' : '#FFFFFF',
                    color: paymentMethod === m.id ? '#1E40FF' : '#334155',
                    fontSize: '0.74rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 4,
                  }}
                >
                  {m.icon} {m.label}
                </button>
              ))}
            </div>

            {paymentMethod === 'split' && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, fontSize: '0.78rem' }}>
                <span>Tiền mặt khách đưa:</span>
                <input
                  type="number"
                  min={0}
                  className="form-input"
                  style={{ width: 150, height: 36, background: '#FFFFFF', textAlign: 'right' }}
                  value={splitCashVnd}
                  onChange={(e) => setSplitCashVnd(e.target.value)}
                />
                <span style={{ color: '#1E40FF', fontWeight: 700 }}>CK còn lại: {formatVnd(calc.bankPart)}</span>
              </div>
            )}

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '0.76rem', color: '#64748B' }}>
                  Tạm tính: {formatVnd(calc.sub)} • Giảm Voucher: -{formatVnd(voucherDiscountVnd)} • VAT: {formatVnd(calc.tax)}
                </div>
                <div style={{ fontSize: '1.15rem', fontWeight: 900, color: '#1E40FF', marginTop: 2 }}>
                  Thanh toán: {formatVnd(calc.total)}
                </div>
                <div style={{ fontSize: '0.72rem', color: '#475569', fontStyle: 'italic' }}>
                  {numberToVietnameseWords(calc.total)}
                </div>
              </div>
              {vietQrUrl && (paymentMethod === 'vietqr' || paymentMethod === 'split') && (
                <img
                  src={vietQrUrl}
                  alt="POS VietQR"
                  style={{ width: 74, height: 74, borderRadius: 10, border: '1px solid #DBEAFE', background: '#FFFFFF' }}
                />
              )}
            </div>

            <button
              type="button"
              disabled={checkingOut || cart.length === 0}
              onClick={() => void handleCheckout()}
              className="btn primary"
              style={{
                height: 44,
                background: '#1E40FF',
                fontWeight: 800,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
              }}
            >
              <CheckCircle2 size={17} />
              {checkingOut ? 'Đang xuất kho FIFO & in bill...' : `Hoàn tất Thanh toán POS (${formatVnd(calc.total)})`}
            </button>
          </div>
        </div>
      </div>
    </CustomModal>
  );
};
