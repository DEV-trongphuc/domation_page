import React, { useCallback, useEffect, useState } from 'react';
import {
  ArrowRight,
  Boxes,
  Building2,
  CheckCircle2,
  CreditCard,
  DollarSign,
  FileSpreadsheet,
  FileText,
  Landmark,
  Layers,
  MonitorSmartphone,
  Package,
  Plus,
  QrCode,
  RefreshCw,
  ShoppingBag,
  TrendingUp,
  Truck,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { CustomModal } from '../../components/ui/CustomModal';
import { ScreenHelpButton } from '../../components/ui/ScreenHelpButton';
import {
  AutoDataLoadingModal,
  Badge,
  Card,
  EmptyState,
  FormCard,
  PillTabs,
  Table,
  type TableColumn,
} from '../../components/ui/AutoDataLoadingModal';
import {
  apiRequest,
  formatShortDate,
  formatVnd,
  getErrorMessage,
} from '../../../autodataApi';
import { useAuth } from '../../contexts/AuthContext';
import { useEntitlement } from '../../contexts/EntitlementContext';

type FinanceTabKey =
  | 'dashboard'
  | 'b2b_deals'
  | 'quotes_orders'
  | 'fifo_inventory'
  | 'pos_assets';

interface LegalEntityInfo {
  branch_id: string | null;
  branch_name: string;
  legal_entity_name: string;
  tax_code: string;
  representative_name: string;
  address: string;
  bank_name: string;
  bank_bin: string;
  bank_account_no: string;
  bank_account_holder: string;
}

interface FinanceDashboardResponse {
  summary: {
    total_income_vnd: number;
    total_expense_vnd: number;
    net_cashflow_vnd: number;
    total_cogs_vnd: number;
    gross_profit_vnd: number;
    orders_count: number;
    paid_orders_count: number;
    total_so_vnd: number;
    total_paid_vnd: number;
    deposits_held_vnd: number;
    deposits_count: number;
    open_pipeline_vnd: number;
    won_deals_vnd: number;
    deals_count: number;
    tx_count: number;
  };
  legal_entity: LegalEntityInfo;
  leads: Array<{ id: string; name: string; phone?: string | null; total_revenue_vnd: number }>;
}

interface VietQrResponse {
  legal_entity: LegalEntityInfo;
  amount_vnd: number;
  transfer_note: string;
  qr_image_url: string;
}

interface B2bCompanyRow {
  id: string;
  code: string;
  name: string;
  tax_code?: string | null;
  industry?: string | null;
  billing_address?: string | null;
  tier: string;
  deals_count: number;
  total_revenue_vnd: number;
}

interface DealRow {
  id: string;
  deal_code: string;
  title: string;
  company_name?: string | null;
  lead_name?: string | null;
  stage: string;
  amount_vnd: number;
  probability: number;
  expected_close_date?: string | null;
}

interface QuoteRow {
  id: string;
  quote_code: string;
  title: string;
  company_name?: string | null;
  lead_name?: string | null;
  status: string;
  total_vnd: number;
  converted_order_id?: string | null;
  created_at: string;
}

interface SalesOrderRow {
  id: string;
  order_code: string;
  customer_name: string;
  status: string;
  payment_status: string;
  fulfillment_status: string;
  total_vnd: number;
  paid_vnd: number;
  cogs_vnd: number;
  created_at: string;
}

interface DepositRow {
  id: string;
  deposit_code: string;
  customer_name: string;
  amount_vnd: number;
  status: string;
  payment_method: string;
  created_at: string;
}

interface PurchaseOrderRow {
  id: string;
  po_code: string;
  supplier_name: string;
  status: string;
  total_vnd: number;
  created_at: string;
}

interface FinanceTxRow {
  id: string;
  tx_code: string;
  tx_type: 'income' | 'expense';
  category: string;
  amount_vnd: number;
  counterparty_name?: string | null;
  tx_date: string;
  description?: string | null;
}

interface ProductRow {
  id: string;
  sku: string;
  name: string;
  category: string;
  unit: string;
  product_type: string;
  sale_price_vnd: number;
  default_cost_vnd: number;
  cached_stock_qty: number;
  min_stock_alert: number;
}

interface BatchRow {
  id: string;
  batch_code: string;
  product_id: string;
  product_name: string;
  product_sku: string;
  initial_qty: number;
  remaining_qty: number;
  unit_cost_vnd: number;
  status: string;
  received_at: string;
}

interface MovementRow {
  id: string;
  product_name: string;
  batch_code?: string | null;
  movement_type: string;
  qty_delta: number;
  unit_cost_vnd: number;
  total_cost_vnd: number;
  created_at: string;
}

interface FixedAssetRow {
  id: string;
  asset_code: string;
  name: string;
  category: string;
  status: string;
  purchase_cost_vnd: number;
  monthly_depreciation_vnd: number;
  accumulated_depreciation_vnd: number;
  net_book_value_vnd: number;
  depreciation_pct: number;
}

interface PosCartEntry {
  product: ProductRow;
  qty: number;
}

export const ErpFinanceWave2Entry: React.FC = () => {
  const { token, tenantSlug } = useAuth();
  const { terminology, packageMeta, scope, can } = useEntitlement();
  const canCreate = can('erp_finance_inventory', 'create');
  const canEdit = can('erp_finance_inventory', 'edit');

  const [activeTab, setActiveTab] = useState<FinanceTabKey>('dashboard');
  const [loading, setLoading] = useState(true);

  const [dash, setDash] = useState<FinanceDashboardResponse | null>(null);
  const [vietQr, setVietQr] = useState<VietQrResponse | null>(null);
  const [qrAmountInput, setQrAmountInput] = useState('15000000');
  const [qrRefInput, setQrRefInput] = useState('THANHTOAN-SO');

  const [companies, setCompanies] = useState<B2bCompanyRow[]>([]);
  const [deals, setDeals] = useState<DealRow[]>([]);
  const [quotes, setQuotes] = useState<QuoteRow[]>([]);
  const [salesOrders, setSalesOrders] = useState<SalesOrderRow[]>([]);
  const [deposits, setDeposits] = useState<DepositRow[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrderRow[]>([]);
  const [transactions, setTransactions] = useState<FinanceTxRow[]>([]);

  const [products, setProducts] = useState<ProductRow[]>([]);
  const [batches, setBatches] = useState<BatchRow[]>([]);
  const [movements, setMovements] = useState<MovementRow[]>([]);
  const [assets, setAssets] = useState<FixedAssetRow[]>([]);

  // Modals
  const [txModalOpen, setTxModalOpen] = useState(false);
  const [txType, setTxType] = useState<'income' | 'expense'>('income');
  const [txAmount, setTxAmount] = useState('5000000');
  const [txCounterparty, setTxCounterparty] = useState('');
  const [txDesc, setTxDesc] = useState('');

  const [compModalOpen, setCompModalOpen] = useState(false);
  const [compName, setCompName] = useState('');
  const [compTaxCode, setCompTaxCode] = useState('');
  const [compAddress, setCompAddress] = useState('');
  const [compTier, setCompTier] = useState('enterprise');

  const [dealModalOpen, setDealModalOpen] = useState(false);
  const [dealTitle, setDealTitle] = useState('');
  const [dealCompanyId, setDealCompanyId] = useState('');
  const [dealLeadId, setDealLeadId] = useState('');
  const [dealAmount, setDealAmount] = useState('25000000');
  const [dealProb, setDealProb] = useState('60');
  const [dealCloseDate, setDealCloseDate] = useState('');

  const [quoteModalOpen, setQuoteModalOpen] = useState(false);
  const [quoteTitle, setQuoteTitle] = useState('');
  const [quoteCompanyId, setQuoteCompanyId] = useState('');
  const [quoteLeadId, setQuoteLeadId] = useState('');
  const [quoteDealId, setQuoteDealId] = useState('');
  const [quoteItemName, setQuoteItemName] = useState('Gói Giải Pháp Doanh Nghiệp');
  const [quoteItemQty, setQuoteItemQty] = useState('1');
  const [quoteItemPrice, setQuoteItemPrice] = useState('18000000');

  const [depModalOpen, setDepModalOpen] = useState(false);
  const [depCustomer, setDepCustomer] = useState('');
  const [depAmount, setDepAmount] = useState('10000000');

  const [poModalOpen, setPoModalOpen] = useState(false);
  const [poSupplier, setPoSupplier] = useState('');
  const [poProductId, setPoProductId] = useState('');
  const [poQty, setPoQty] = useState('10');
  const [poUnitCost, setPoUnitCost] = useState('120000');

  const [prodModalOpen, setProdModalOpen] = useState(false);
  const [prodSku, setProdSku] = useState('');
  const [prodName, setProdName] = useState('');
  const [prodSalePrice, setProdSalePrice] = useState('350000');
  const [prodCostPrice, setProdCostPrice] = useState('180000');

  const [batchModalOpen, setBatchModalOpen] = useState(false);
  const [batchProdId, setBatchProdId] = useState('');
  const [batchQty, setBatchQty] = useState('20');
  const [batchUnitCost, setBatchUnitCost] = useState('150000');

  // POS & Fixed Asset State
  const [posCart, setPosCart] = useState<PosCartEntry[]>([]);
  const [posLeadId, setPosLeadId] = useState('');
  const [posPaymentMethod, setPosPaymentMethod] = useState('bank_transfer');
  const [lastPosReceipt, setLastPosReceipt] = useState<{
    order_code: string;
    total_vnd: number;
    cogs_vnd: number;
    gross_margin_vnd: number;
  } | null>(null);

  const [assetModalOpen, setAssetModalOpen] = useState(false);
  const [assetName, setAssetName] = useState('');
  const [assetCost, setAssetCost] = useState('36000000');
  const [assetMonths, setAssetMonths] = useState('36');

  const fetchAll = useCallback(async () => {
    const [
      dRes,
      qrRes,
      compRes,
      dealRes,
      qRes,
      soRes,
      depRes,
      poRes,
      txRes,
      prodRes,
      batchRes,
      movRes,
      astRes,
    ] = await Promise.all([
      apiRequest<FinanceDashboardResponse>('/finance/dashboard', { token, tenantSlug }),
      apiRequest<VietQrResponse>('/finance/vietqr-preview?amount_vnd=15000000&reference_code=THANHTOAN-SO', {
        token,
        tenantSlug,
      }),
      apiRequest<{ items: B2bCompanyRow[] }>('/finance/companies', { token, tenantSlug }),
      apiRequest<{ items: DealRow[] }>('/finance/deals', { token, tenantSlug }),
      apiRequest<{ items: QuoteRow[] }>('/finance/quotes', { token, tenantSlug }),
      apiRequest<{ items: SalesOrderRow[] }>('/finance/sales-orders', { token, tenantSlug }),
      apiRequest<{ items: DepositRow[] }>('/finance/deposits', { token, tenantSlug }),
      apiRequest<{ items: PurchaseOrderRow[] }>('/finance/purchase-orders', { token, tenantSlug }),
      apiRequest<{ items: FinanceTxRow[] }>('/finance/transactions', { token, tenantSlug }),
      apiRequest<{ items: ProductRow[] }>('/inventory/products', { token, tenantSlug }),
      apiRequest<{ items: BatchRow[] }>('/inventory/batches', { token, tenantSlug }),
      apiRequest<{ items: MovementRow[] }>('/inventory/movements', { token, tenantSlug }),
      apiRequest<{ items: FixedAssetRow[] }>('/inventory/assets', { token, tenantSlug }),
    ]);
    return {
      dRes,
      qrRes,
      comp: compRes.items || [],
      deals: dealRes.items || [],
      quotes: qRes.items || [],
      sos: soRes.items || [],
      deps: depRes.items || [],
      pos: poRes.items || [],
      txs: txRes.items || [],
      prods: prodRes.items || [],
      batches: batchRes.items || [],
      movs: movRes.items || [],
      assets: astRes.items || [],
    };
  }, [token, tenantSlug]);

  const applyBundle = useCallback((b: Awaited<ReturnType<typeof fetchAll>>) => {
    setDash(b.dRes);
    setVietQr(b.qrRes);
    setCompanies(b.comp);
    setDeals(b.deals);
    setQuotes(b.quotes);
    setSalesOrders(b.sos);
    setDeposits(b.deps);
    setPurchaseOrders(b.pos);
    setTransactions(b.txs);
    setProducts(b.prods);
    setBatches(b.batches);
    setMovements(b.movs);
    setAssets(b.assets);
    if (b.prods[0]) {
      setBatchProdId((prev) => prev || b.prods[0].id);
      setPoProductId((prev) => prev || b.prods[0].id);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const bundle = await fetchAll();
        if (!cancelled) applyBundle(bundle);
      } catch (err) {
        if (!cancelled) toast.error(getErrorMessage(err, 'Không thể tải dữ liệu Tài chính & Kho vận'));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [fetchAll, applyBundle]);

  const reloadAll = useCallback(async () => {
    setLoading(true);
    try {
      const bundle = await fetchAll();
      applyBundle(bundle);
    } catch (err) {
      toast.error(getErrorMessage(err, 'Làm mới dữ liệu thất bại'));
    } finally {
      setLoading(false);
    }
  }, [fetchAll, applyBundle]);

  const handleRefreshVietQr = async () => {
    try {
      const qr = await apiRequest<VietQrResponse>(
        `/finance/vietqr-preview?amount_vnd=${encodeURIComponent(qrAmountInput)}&reference_code=${encodeURIComponent(qrRefInput)}`,
        { token, tenantSlug }
      );
      setVietQr(qr);
      toast.success('Đã cập nhật mã VietQR theo pháp nhân Chi nhánh');
    } catch (err) {
      toast.error(getErrorMessage(err, 'Không thể tạo VietQR'));
    }
  };

  const handleCreateTransaction = async () => {
    try {
      await apiRequest('/finance/transactions', {
        method: 'POST',
        token,
        tenantSlug,
        body: {
          tx_type: txType,
          amount_vnd: Number(txAmount || 0),
          counterparty_name: txCounterparty.trim() || undefined,
          description: txDesc.trim() || undefined,
        },
      });
      toast.success('Đã ghi nhận bút toán Sổ quỹ');
      setTxModalOpen(false);
      await reloadAll();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Không thể lưu bút toán'));
    }
  };

  const handleCreateCompany = async () => {
    if (!compName.trim()) return;
    try {
      await apiRequest('/finance/companies', {
        method: 'POST',
        token,
        tenantSlug,
        body: {
          name: compName.trim(),
          tax_code: compTaxCode.trim() || undefined,
          billing_address: compAddress.trim() || undefined,
          tier: compTier,
        },
      });
      toast.success('Đã thêm Hồ sơ Doanh nghiệp B2B');
      setCompName('');
      setCompModalOpen(false);
      await reloadAll();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Không thể tạo khách hàng B2B'));
    }
  };

  const handleCreateDeal = async () => {
    if (!dealTitle.trim()) return;
    try {
      await apiRequest('/finance/deals', {
        method: 'POST',
        token,
        tenantSlug,
        body: {
          title: dealTitle.trim(),
          company_id: dealCompanyId || null,
          lead_id: dealLeadId || null,
          amount_vnd: Number(dealAmount || 0),
          probability: Number(dealProb || 50),
          expected_close_date: dealCloseDate || null,
          stage: 'proposal',
        },
      });
      toast.success('Đã tạo Cơ hội bán hàng độc lập (Multi-Deal)');
      setDealTitle('');
      setDealModalOpen(false);
      await reloadAll();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Không thể tạo Deal'));
    }
  };

  const handleCreateQuote = async () => {
    if (!quoteTitle.trim()) return;
    try {
      await apiRequest('/finance/quotes', {
        method: 'POST',
        token,
        tenantSlug,
        body: {
          title: quoteTitle.trim(),
          company_id: quoteCompanyId || null,
          lead_id: quoteLeadId || null,
          deal_id: quoteDealId || null,
          items: [
            {
              name: quoteItemName.trim() || 'Dịch vụ',
              qty: Number(quoteItemQty || 1),
              unit_price_vnd: Number(quoteItemPrice || 0),
              tax_pct: 0,
            },
          ],
        },
      });
      toast.success('Đã phát hành Báo giá');
      setQuoteTitle('');
      setQuoteModalOpen(false);
      await reloadAll();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Không thể tạo Báo giá'));
    }
  };

  const handleConvertQuoteToSo = async (quoteId: string) => {
    try {
      await apiRequest(`/finance/quotes/${quoteId}/convert-to-order`, {
        method: 'POST',
        token,
        tenantSlug,
        body: {},
      });
      toast.success('Đã chuyển Báo giá sang Đơn bán hàng (SO) chỉ bằng 1 chạm!');
      await reloadAll();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Không thể chuyển sang Đơn bán'));
    }
  };

  const handlePayCompleteSalesOrder = async (soId: string) => {
    try {
      await apiRequest(`/finance/sales-orders/${soId}/pay-complete`, {
        method: 'POST',
        token,
        tenantSlug,
        body: { payment_method: 'bank_transfer' },
      });
      toast.success('Đã thu tiền SO, cộng Doanh thu vào Hồ sơ 360° & bắn Event Bus hoa hồng!');
      await reloadAll();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Không thể hoàn tất thanh toán SO'));
    }
  };

  const handleCreateDeposit = async () => {
    if (!depCustomer.trim()) return;
    try {
      await apiRequest('/finance/deposits', {
        method: 'POST',
        token,
        tenantSlug,
        body: { customer_name: depCustomer.trim(), amount_vnd: Number(depAmount || 0) },
      });
      toast.success('Đã ghi nhận Đặt cọc & tự động lên phiếu thu');
      setDepCustomer('');
      setDepModalOpen(false);
      await reloadAll();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Không thể tạo phiếu Đặt cọc'));
    }
  };

  const handleCreatePo = async () => {
    if (!poSupplier.trim()) return;
    try {
      await apiRequest('/finance/purchase-orders', {
        method: 'POST',
        token,
        tenantSlug,
        body: {
          supplier_name: poSupplier.trim(),
          items: poProductId
            ? [
                {
                  product_id: poProductId,
                  name: products.find((p) => p.id === poProductId)?.name || 'Hàng hóa',
                  qty: Number(poQty || 1),
                  unit_price_vnd: Number(poUnitCost || 0),
                },
              ]
            : [],
          total_vnd: Number(poQty || 1) * Number(poUnitCost || 0),
        },
      });
      toast.success('Đã tạo Đơn mua hàng (PO)');
      setPoSupplier('');
      setPoModalOpen(false);
      await reloadAll();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Không thể tạo PO'));
    }
  };

  const handleReceivePo = async (poId: string) => {
    try {
      await apiRequest(`/finance/purchase-orders/${poId}/receive`, {
        method: 'POST',
        token,
        tenantSlug,
        body: {},
      });
      toast.success('Đã nhập kho Lô hàng FIFO & ghi nhận chi phí PO!');
      await reloadAll();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Không thể nhập kho PO'));
    }
  };

  const handleCreateProduct = async () => {
    if (!prodName.trim()) return;
    try {
      await apiRequest('/inventory/products', {
        method: 'POST',
        token,
        tenantSlug,
        body: {
          sku: prodSku.trim() || undefined,
          name: prodName.trim(),
          sale_price_vnd: Number(prodSalePrice || 0),
          default_cost_vnd: Number(prodCostPrice || 0),
          product_type: 'goods',
        },
      });
      toast.success('Đã thêm SKU vào danh mục hàng hóa');
      setProdName('');
      setProdSku('');
      setProdModalOpen(false);
      await reloadAll();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Không thể thêm sản phẩm'));
    }
  };

  const handleCreateBatch = async () => {
    if (!batchProdId) return;
    try {
      await apiRequest('/inventory/batches', {
        method: 'POST',
        token,
        tenantSlug,
        body: {
          product_id: batchProdId,
          initial_qty: Number(batchQty || 1),
          unit_cost_vnd: Number(batchUnitCost || 0),
        },
      });
      toast.success('Đã nhập Lô tồn kho FIFO mới');
      setBatchModalOpen(false);
      await reloadAll();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Không thể nhập lô hàng'));
    }
  };

  const handleAddToPosCart = (prod: ProductRow) => {
    setPosCart((prev) => {
      const existing = prev.find((item) => item.product.id === prod.id);
      if (existing) {
        return prev.map((item) =>
          item.product.id === prod.id ? { ...item, qty: item.qty + 1 } : item
        );
      }
      return [...prev, { product: prod, qty: 1 }];
    });
  };

  const handlePosCheckout = async () => {
    if (posCart.length === 0) {
      toast.error('Giỏ hàng POS đang trống');
      return;
    }
    try {
      const res = await apiRequest<{
        order_code: string;
        total_vnd: number;
        cogs_vnd: number;
        gross_margin_vnd: number;
      }>('/inventory/pos/checkout', {
        method: 'POST',
        token,
        tenantSlug,
        body: {
          lead_id: posLeadId || null,
          payment_method: posPaymentMethod,
          items: posCart.map((c) => ({
            product_id: c.product.id,
            qty: c.qty,
            unit_price_vnd: c.product.sale_price_vnd,
          })),
        },
      });
      setLastPosReceipt(res);
      setPosCart([]);
      toast.success(`Thanh toán POS thành công (${res.order_code}) — Giá vốn FIFO: ${formatVnd(res.cogs_vnd)}`);
      await reloadAll();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Không thể thanh toán POS (kiểm tra tồn kho FIFO)'));
    }
  };

  const handleCreateAsset = async () => {
    if (!assetName.trim()) return;
    try {
      await apiRequest('/inventory/assets', {
        method: 'POST',
        token,
        tenantSlug,
        body: {
          name: assetName.trim(),
          purchase_cost_vnd: Number(assetCost || 0),
          useful_life_months: Number(assetMonths || 36),
        },
      });
      toast.success('Đã đăng ký Tài sản cố định & lịch khấu hao');
      setAssetName('');
      setAssetModalOpen(false);
      await reloadAll();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Không thể đăng ký Tài sản'));
    }
  };

  const txColumns: ReadonlyArray<TableColumn<FinanceTxRow>> = [
    { key: 'code', header: 'Mã chứng từ', render: (r) => <strong>{r.tx_code}</strong> },
    {
      key: 'type',
      header: 'Loại bút toán',
      render: (r) => (
        <Badge tone={r.tx_type === 'income' ? 'success' : 'danger'}>
          {r.tx_type === 'income' ? 'Phiếu Thu (+)' : 'Phiếu Chi (-)'}
        </Badge>
      ),
    },
    { key: 'party', header: 'Đối tác / Nội dung', render: (r) => r.counterparty_name || r.description || r.category },
    {
      key: 'amount',
      header: 'Số tiền',
      numeric: true,
      render: (r) => (
        <span style={{ fontWeight: 700, color: r.tx_type === 'income' ? '#059669' : '#DC2626' }}>
          {r.tx_type === 'income' ? '+' : '-'}
          {formatVnd(r.amount_vnd)}
        </span>
      ),
    },
    { key: 'date', header: 'Ngày hạch toán', render: (r) => String(r.tx_date).slice(0, 10) },
  ];

  const batchColumns: ReadonlyArray<TableColumn<BatchRow>> = [
    { key: 'code', header: 'Mã Lô FIFO', render: (r) => <strong>{r.batch_code}</strong> },
    { key: 'prod', header: 'Sản phẩm (SKU)', render: (r) => `${r.product_name} (${r.product_sku})` },
    { key: 'init', header: 'SL Nhập', numeric: true, render: (r) => r.initial_qty },
    {
      key: 'rem',
      header: 'Tồn Khả Dụng',
      numeric: true,
      render: (r) => (
        <Badge tone={r.remaining_qty > 0 ? 'success' : 'neutral'}>{r.remaining_qty}</Badge>
      ),
    },
    { key: 'cost', header: 'Đơn giá vốn', numeric: true, render: (r) => formatVnd(r.unit_cost_vnd) },
    { key: 'rec', header: 'Ngày nhập (Thứ tự FIFO)', render: (r) => formatShortDate(r.received_at) },
  ];

  const assetColumns: ReadonlyArray<TableColumn<FixedAssetRow>> = [
    { key: 'code', header: 'Mã TS', render: (r) => <strong>{r.asset_code}</strong> },
    { key: 'name', header: 'Tên Tài Sản Cố Định', render: (r) => r.name },
    { key: 'cost', header: 'Nguyên giá', numeric: true, render: (r) => formatVnd(r.purchase_cost_vnd) },
    { key: 'dep', header: 'Khấu hao / tháng', numeric: true, render: (r) => formatVnd(r.monthly_depreciation_vnd) },
    { key: 'nbv', header: 'Giá trị còn lại', numeric: true, render: (r) => <strong>{formatVnd(r.net_book_value_vnd)}</strong> },
    { key: 'status', header: 'Trạng thái', render: (r) => <Badge tone="info">{r.status}</Badge> },
  ];

  if (loading && !dash) {
    return (
      <AutoDataLoadingModal
        inline
        isOpen
        message="Đang đồng bộ Tài chính B2B, Đơn hàng SO/PO, Tồn kho FIFO & POS..."
      />
    );
  }

  const posTotal = posCart.reduce((s, i) => s + i.qty * i.product.sale_price_vnd, 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Top Banner */}
      <Card
        padding="1.25rem 1.5rem"
        style={{ background: 'linear-gradient(135deg, #FFFFFF 0%, #F8FAFF 100%)' }}
      >
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: 16,
                background: '#EEF2FF',
                border: '1px solid #DBEAFE',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#1E40FF',
              }}
            >
              <Landmark size={24} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <h1 style={{ fontSize: '1.18rem', fontWeight: 800, color: '#0F172A', margin: 0 }}>
                  Tài Chính P&L, B2B Multi-Deals, Báo Giá / SO / PO, Kho FIFO & POS
                </h1>
                <Badge tone="primary">{packageMeta.shortName}</Badge>
                <Badge tone="info">Scope: {scope('erp_finance_inventory')}</Badge>
              </div>
              <p style={{ fontSize: '0.82rem', color: '#64748B', margin: '4px 0 0' }}>
                Pháp nhân động: <strong>{dash?.legal_entity.legal_entity_name}</strong>
                {dash?.legal_entity.tax_code ? ` • MST: ${dash.legal_entity.tax_code}` : ''} — Liên thông tự động Doanh thu 360° & Giá vốn FIFO
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button
              type="button"
              onClick={reloadAll}
              className="btn secondary"
              style={{ height: 44, display: 'inline-flex', alignItems: 'center', gap: 6 }}
            >
              <RefreshCw size={15} /> Làm mới
            </button>
            <ScreenHelpButton screenKey="erp_finance" />
          </div>
        </div>
      </Card>

      {/* KPI Strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '0.9rem' }}>
        <FormCard
          icon={<TrendingUp size={18} />}
          title={formatVnd(dash?.summary.total_income_vnd || 0)}
          description="Tổng Thu Thực Tế (Cash In)"
          badge={<Badge tone="success">Income</Badge>}
        />
        <FormCard
          icon={<DollarSign size={18} />}
          title={formatVnd(dash?.summary.net_cashflow_vnd || 0)}
          description={`Chi: ${formatVnd(dash?.summary.total_expense_vnd || 0)} • Lợi nhuận gộp: ${formatVnd(dash?.summary.gross_profit_vnd || 0)}`}
          badge={<Badge tone="primary">Net P&L</Badge>}
        />
        <FormCard
          icon={<Boxes size={18} />}
          title={formatVnd(dash?.summary.total_cogs_vnd || 0)}
          description={`Giá vốn xuất kho FIFO (${dash?.summary.paid_orders_count || 0} đơn hoàn tất)`}
          badge={<Badge tone="warning">COGS FIFO</Badge>}
        />
        <FormCard
          icon={<CreditCard size={18} />}
          title={formatVnd(dash?.summary.deposits_held_vnd || 0)}
          description={`Đặt cọc giữ chỗ (${dash?.summary.deposits_count || 0} phiếu)`}
          badge={<Badge tone="purple">Deposits</Badge>}
        />
      </div>

      {/* Main Module Tabs */}
      <PillTabs<FinanceTabKey>
        activeKey={activeTab}
        onChange={setActiveTab}
        tabs={[
          { key: 'dashboard', label: 'Dòng tiền P&L & VietQR', icon: <Landmark size={15} />, count: transactions.length },
          { key: 'b2b_deals', label: 'B2B Accounts & Multi-Deals', icon: <Building2 size={15} />, count: deals.length },
          { key: 'quotes_orders', label: `${terminology.quoteLabel}, SO, PO & Đặt cọc`, icon: <FileText size={15} />, count: salesOrders.length },
          { key: 'fifo_inventory', label: 'Sản phẩm & Lô Kho FIFO', icon: <Package size={15} />, count: batches.length },
          { key: 'pos_assets', label: 'Quầy POS & Tài sản cố định', icon: <MonitorSmartphone size={15} />, count: assets.length },
        ]}
      />

      {/* TAB 1: P&L LEDGER & DYNAMIC VIETQR */}
      {activeTab === 'dashboard' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1rem' }}>
            <Card
              title="Trình Tạo Mã Thanh Toán VietQR Động Theo Chi Nhánh"
              subtitle="Đọc trực tiếp Pháp nhân, MST & Tài khoản thụ hưởng từ cấu hình Sơ đồ Tổ chức (Zero Hardcode)"
            >
              <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 12, alignItems: 'center' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div style={{ fontSize: '0.82rem', color: '#334155' }}>
                    <div><strong>Đơn vị thụ hưởng:</strong> {vietQr?.legal_entity.legal_entity_name}</div>
                    <div><strong>Mã số thuế:</strong> {vietQr?.legal_entity.tax_code || 'Chưa cập nhật trong Chi nhánh'}</div>
                    <div><strong>Ngân hàng:</strong> {vietQr?.legal_entity.bank_name} ({vietQr?.legal_entity.bank_bin})</div>
                  </div>
                  <input
                    type="number"
                    value={qrAmountInput}
                    onChange={(e) => setQrAmountInput(e.target.value)}
                    placeholder="Số tiền thanh toán (VNĐ)"
                    className="form-input"
                    style={{ height: 42, borderRadius: 12, border: '1px solid #E2E8F0', padding: '0 12px' }}
                  />
                  <input
                    value={qrRefInput}
                    onChange={(e) => setQrRefInput(e.target.value)}
                    placeholder="Nội dung chuyển khoản"
                    className="form-input"
                    style={{ height: 42, borderRadius: 12, border: '1px solid #E2E8F0', padding: '0 12px' }}
                  />
                  <button
                    type="button"
                    onClick={handleRefreshVietQr}
                    className="btn secondary"
                    style={{ height: 42, color: '#1E40FF', display: 'inline-flex', alignItems: 'center', gap: 6 }}
                  >
                    <QrCode size={15} /> Tạo mã VietQR ({formatVnd(Number(qrAmountInput || 0))})
                  </button>
                </div>

                {vietQr?.qr_image_url && (
                  <div
                    style={{
                      padding: 10,
                      borderRadius: 16,
                      border: '1px solid #DBEAFE',
                      background: '#FFFFFF',
                      textAlign: 'center',
                    }}
                  >
                    <img
                      src={vietQr.qr_image_url}
                      alt="VietQR Payment"
                      style={{ width: 150, height: 150, objectFit: 'contain' }}
                    />
                    <div style={{ fontSize: '0.7rem', color: '#64748B', marginTop: 4 }}>{vietQr.transfer_note}</div>
                  </div>
                )}
              </div>
            </Card>

            <Card
              title="Ghi Nhận Nhanh Phiếu Thu / Phiếu Chi"
              subtitle="Đồng bộ trực tiếp vào Báo cáo Dòng tiền P&L toàn doanh nghiệp"
              actions={
                canCreate && (
                  <button
                    type="button"
                    onClick={() => setTxModalOpen(true)}
                    className="btn-inkica-primary"
                    style={{
                      height: 40,
                      padding: '0 1rem',
                      borderRadius: 12,
                      border: 'none',
                      color: '#FFFFFF',
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    + Lập Phiếu Thu / Chi
                  </button>
                )
              }
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ padding: '0.85rem 1rem', borderRadius: 14, background: '#F8FAFF', border: '1px solid #DBEAFE' }}>
                  <div style={{ fontSize: '0.78rem', color: '#64748B' }}>Pipeline Cơ hội B2B đang mở</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#1E40FF' }}>
                    {formatVnd(dash?.summary.open_pipeline_vnd || 0)}
                  </div>
                </div>
                <div style={{ padding: '0.85rem 1rem', borderRadius: 14, background: '#F0FDF4', border: '1px solid #BBF7D0' }}>
                  <div style={{ fontSize: '0.78rem', color: '#166534' }}>Tổng giá trị Deals đã chốt thắng</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#15803D' }}>
                    {formatVnd(dash?.summary.won_deals_vnd || 0)}
                  </div>
                </div>
              </div>
            </Card>
          </div>

          <Table
            columns={txColumns}
            rows={transactions}
            rowKey={(r) => r.id}
            emptyTitle="Sổ quỹ chưa có bút toán nào"
            emptyDescription="Các khoản thu từ Đơn bán SO, Đặt cọc, POS hoặc Phiếu chi PO sẽ tự động ghi sổ tại đây."
          />
        </div>
      )}

      {/* TAB 2: B2B COMPANIES & MULTI-DEALS */}
      {activeTab === 'b2b_deals' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1rem' }}>
          <Card
            title="Hồ Sơ Doanh Nghiệp B2B (Accounts)"
            subtitle="Quản lý Mã số thuế, địa chỉ xuất hóa đơn & nhiều người liên hệ"
            actions={
              canCreate && (
                <button type="button" onClick={() => setCompModalOpen(true)} className="btn secondary" style={{ height: 38, color: '#1E40FF' }}>
                  + Thêm Công ty B2B
                </button>
              )
            }
          >
            {companies.length === 0 ? (
              <EmptyState title="Chưa có khách hàng doanh nghiệp B2B" />
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {companies.map((c) => (
                  <FormCard
                    key={c.id}
                    icon={<Building2 size={18} />}
                    title={`${c.name} (${c.code})`}
                    description={`MST: ${c.tax_code || '—'} • ${c.deals_count} Deals • Doanh thu: ${formatVnd(c.total_revenue_vnd)}`}
                    badge={<Badge tone="primary">{c.tier}</Badge>}
                  />
                ))}
              </div>
            )}
          </Card>

          <Card
            title={`Cơ Hội Bán Hàng Độc Lập (Multi-Deals 1-N)`}
            subtitle={`1 ${terminology.customerLabel} hoặc Công ty có thể chạy song song N thương vụ độc lập`}
            actions={
              canCreate && (
                <button
                  type="button"
                  onClick={() => setDealModalOpen(true)}
                  className="btn-inkica-primary"
                  style={{ height: 38, padding: '0 1rem', borderRadius: 12, border: 'none', color: '#FFFFFF', fontWeight: 700, cursor: 'pointer' }}
                >
                  + Tạo Deal mới
                </button>
              )
            }
          >
            {deals.length === 0 ? (
              <EmptyState title="Chưa có Deal B2B nào" />
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {deals.map((d) => (
                  <div
                    key={d.id}
                    style={{
                      padding: '0.9rem 1rem',
                      borderRadius: 16,
                      border: '1px solid #E2E8F0',
                      background: '#FFFFFF',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      gap: 8,
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 700, color: '#0F172A', fontSize: '0.88rem' }}>{d.title}</div>
                      <div style={{ fontSize: '0.75rem', color: '#64748B' }}>
                        {d.deal_code} • {d.company_name || d.lead_name || 'Khách lẻ'} • Xác suất {d.probability}%
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontWeight: 800, color: '#1E40FF', fontSize: '0.9rem' }}>{formatVnd(d.amount_vnd)}</div>
                      <Badge tone={d.stage === 'won' ? 'success' : 'info'}>{d.stage}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      )}

      {/* TAB 3: QUOTES -> 1-CLICK SO + DEPOSITS + PO */}
      {activeTab === 'quotes_orders' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {canCreate && (
              <>
                <button
                  type="button"
                  onClick={() => setQuoteModalOpen(true)}
                  className="btn-inkica-primary"
                  style={{ height: 42, padding: '0 1rem', borderRadius: 12, border: 'none', color: '#FFFFFF', fontWeight: 700, cursor: 'pointer' }}
                >
                  + Lập {terminology.quoteLabel} mới
                </button>
                <button type="button" onClick={() => setDepModalOpen(true)} className="btn secondary" style={{ height: 42 }}>
                  + Ghi nhận Đặt cọc
                </button>
                <button type="button" onClick={() => setPoModalOpen(true)} className="btn secondary" style={{ height: 42 }}>
                  + Lập Đơn mua hàng (PO)
                </button>
              </>
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1rem' }}>
            <Card title={`Danh Sách ${terminology.quoteLabel} (Quotes)`} subtitle="1-Click chuyển thẳng thành Đơn bán hàng SO">
              {quotes.length === 0 ? (
                <EmptyState title={`Chưa có ${terminology.quoteLabel} nào`} />
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {quotes.map((q) => (
                    <div
                      key={q.id}
                      style={{
                        padding: '0.85rem 1rem',
                        borderRadius: 16,
                        border: '1px solid #E2E8F0',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        gap: 8,
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 700, color: '#0F172A', fontSize: '0.86rem' }}>
                          {q.quote_code} — {q.title}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#64748B' }}>
                          Tổng cộng: <strong>{formatVnd(q.total_vnd)}</strong> • {q.status}
                        </div>
                      </div>
                      {q.status !== 'converted' ? (
                        <button
                          type="button"
                          onClick={() => handleConvertQuoteToSo(q.id)}
                          className="btn secondary"
                          style={{ height: 36, fontSize: '0.76rem', color: '#1E40FF', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                        >
                          Chuyển sang SO <ArrowRight size={13} />
                        </button>
                      ) : (
                        <Badge tone="success">Đã lên SO</Badge>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </Card>

            <Card
              title="Đơn Bán Hàng (Sales Orders — SO)"
              subtitle="Hoàn tất thanh toán tự động cộng Doanh thu vào Hồ sơ 360° & bắn Event Bus"
            >
              {salesOrders.length === 0 ? (
                <EmptyState title="Chưa có Đơn bán hàng SO" />
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {salesOrders.map((so) => (
                    <div
                      key={so.id}
                      style={{
                        padding: '0.85rem 1rem',
                        borderRadius: 16,
                        border: '1px solid #E2E8F0',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        gap: 8,
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 700, color: '#0F172A', fontSize: '0.86rem' }}>
                          {so.order_code} — {so.customer_name}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#64748B' }}>
                          Giá trị: <strong>{formatVnd(so.total_vnd)}</strong> • Giá vốn FIFO: {formatVnd(so.cogs_vnd)}
                        </div>
                      </div>
                      {so.payment_status !== 'paid' && canEdit ? (
                        <button
                          type="button"
                          onClick={() => handlePayCompleteSalesOrder(so.id)}
                          className="btn-inkica-primary"
                          style={{
                            height: 36,
                            padding: '0 12px',
                            borderRadius: 10,
                            border: 'none',
                            color: '#FFFFFF',
                            fontSize: '0.76rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                          }}
                        >
                          Thu tiền & Hoàn tất
                        </button>
                      ) : (
                        <Badge tone="success" icon={<CheckCircle2 size={12} />}>
                          Đã thu đủ
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1rem' }}>
            <Card title="Phiếu Đặt Cọc (Deposits)" subtitle={`${deposits.length} giao dịch đặt cọc`}>
              {deposits.length === 0 ? (
                <EmptyState title="Chưa có phiếu đặt cọc" />
              ) : (
                deposits.map((dep) => (
                  <div
                    key={dep.id}
                    style={{ padding: '0.7rem 0', borderBottom: '1px solid #F1F5F9', display: 'flex', justifyContent: 'space-between' }}
                  >
                    <span style={{ fontSize: '0.84rem' }}>
                      <strong>{dep.deposit_code}</strong> — {dep.customer_name}
                    </span>
                    <Badge tone="purple">{formatVnd(dep.amount_vnd)}</Badge>
                  </div>
                ))
              )}
            </Card>

            <Card title="Đơn Mua Hàng Nhập Kho (Purchase Orders — PO)" subtitle="1-Click duyệt nhận hàng tự sinh Lô tồn kho FIFO">
              {purchaseOrders.length === 0 ? (
                <EmptyState title="Chưa có đơn mua hàng PO" />
              ) : (
                purchaseOrders.map((po) => (
                  <div
                    key={po.id}
                    style={{
                      padding: '0.75rem 0',
                      borderBottom: '1px solid #F1F5F9',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.84rem' }}>{po.po_code} — {po.supplier_name}</div>
                      <div style={{ fontSize: '0.74rem', color: '#64748B' }}>{formatVnd(po.total_vnd)}</div>
                    </div>
                    {po.status !== 'received' && canEdit ? (
                      <button
                        type="button"
                        onClick={() => handleReceivePo(po.id)}
                        className="btn secondary"
                        style={{ height: 34, fontSize: '0.75rem', color: '#1E40FF' }}
                      >
                        <Truck size={13} style={{ display: 'inline', marginRight: 4 }} /> Nhập kho FIFO
                      </button>
                    ) : (
                      <Badge tone="success">Đã nhập kho</Badge>
                    )}
                  </div>
                ))
              )}
            </Card>
          </div>
        </div>
      )}

      {/* TAB 4: CATALOG & FIFO INVENTORY BATCHES */}
      {activeTab === 'fifo_inventory' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
            <div style={{ display: 'flex', gap: 8 }}>
              {canCreate && (
                <>
                  <button
                    type="button"
                    onClick={() => setProdModalOpen(true)}
                    className="btn secondary"
                    style={{ height: 42, color: '#1E40FF' }}
                  >
                    + Thêm Sản phẩm (SKU)
                  </button>
                  <button
                    type="button"
                    onClick={() => setBatchModalOpen(true)}
                    className="btn-inkica-primary"
                    style={{ height: 42, padding: '0 1.1rem', borderRadius: 12, border: 'none', color: '#FFFFFF', fontWeight: 700, cursor: 'pointer' }}
                  >
                    + Nhập Lô Hàng FIFO Mới
                  </button>
                </>
              )}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '0.9rem' }}>
            {products.map((p) => (
              <FormCard
                key={p.id}
                icon={<Layers size={18} />}
                title={`${p.name} (${p.sku})`}
                description={`Giá bán: ${formatVnd(p.sale_price_vnd)} • Giá vốn chuẩn: ${formatVnd(p.default_cost_vnd)}`}
                badge={
                  <Badge tone={p.cached_stock_qty > p.min_stock_alert ? 'success' : 'warning'}>
                    Tồn: {p.cached_stock_qty} {p.unit}
                  </Badge>
                }
              />
            ))}
          </div>

          <Table
            columns={batchColumns}
            rows={batches}
            rowKey={(r) => r.id}
            emptyTitle="Chưa có lô hàng FIFO nào trong kho"
            emptyDescription="Mọi giao dịch bán hàng SO hoặc POS sẽ tự động trừ lùi từ Lô nhập cũ nhất trước (First-In, First-Out) để tính chính xác Giá vốn COGS."
          />

          {movements.length > 0 && (
            <Card title="Thẻ Kho — Lịch Sử Biến Động Xuất / Nhập Lô Hàng" subtitle="Truy vết đầy đủ từng lô và giá vốn">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {movements.slice(0, 10).map((m) => (
                  <div
                    key={m.id}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      padding: '6px 10px',
                      borderRadius: 10,
                      background: '#F8F9FA',
                      fontSize: '0.82rem',
                    }}
                  >
                    <span>
                      <strong>{m.movement_type}</strong> • {m.product_name} ({m.batch_code || '—'})
                    </span>
                    <span className="autodata-tabular-nums" style={{ fontWeight: 700, color: m.qty_delta >= 0 ? '#059669' : '#DC2626' }}>
                      {m.qty_delta >= 0 ? `+${m.qty_delta}` : m.qty_delta} đv (COGS: {formatVnd(m.total_cost_vnd)})
                    </span>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      )}

      {/* TAB 5: POS COUNTER CHECKOUT & FIXED ASSETS */}
      {activeTab === 'pos_assets' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '1rem' }}>
            <Card title="Quầy Bán Hàng Nhanh POS (Trừ Tồn Kho FIFO Tức Thì)" subtitle="Chọn SKU bên dưới để đưa vào giỏ thanh toán">
              {products.length === 0 ? (
                <EmptyState title="Chưa có SKU hàng hóa" description="Hãy tạo sản phẩm & nhập lô FIFO ở tab Kho trước." />
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(185px, 1fr))', gap: 10 }}>
                  {products.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => handleAddToPosCart(p)}
                      style={{
                        textAlign: 'left',
                        padding: '0.9rem',
                        borderRadius: 16,
                        border: '1px solid #E2E8F0',
                        background: '#FFFFFF',
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 6,
                      }}
                    >
                      <Badge tone={p.cached_stock_qty > 0 ? 'info' : 'neutral'}>
                        Tồn: {p.cached_stock_qty}
                      </Badge>
                      <div style={{ fontWeight: 700, fontSize: '0.86rem', color: '#0F172A' }}>{p.name}</div>
                      <div style={{ fontWeight: 800, fontSize: '0.9rem', color: '#1E40FF' }}>{formatVnd(p.sale_price_vnd)}</div>
                    </button>
                  ))}
                </div>
              )}
            </Card>

            <Card title="Hóa Đơn POS Tại Quầy" subtitle="Tự động tính COGS FIFO, tạo Phiếu thu & cộng Doanh thu khách hàng">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <select
                  value={posLeadId}
                  onChange={(e) => setPosLeadId(e.target.value)}
                  className="form-input"
                  style={{ height: 42, borderRadius: 12, border: '1px solid #E2E8F0', padding: '0 10px' }}
                >
                  <option value="">-- Khách lẻ vãng lai (Hoặc chọn Hồ sơ CRM) --</option>
                  {(dash?.leads || []).map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.name} ({formatVnd(l.total_revenue_vnd)})
                    </option>
                  ))}
                </select>

                <select
                  value={posPaymentMethod}
                  onChange={(e) => setPosPaymentMethod(e.target.value)}
                  className="form-input"
                  style={{ height: 42, borderRadius: 12, border: '1px solid #E2E8F0', padding: '0 10px' }}
                >
                  <option value="bank_transfer">Chuyển khoản VietQR</option>
                  <option value="cash">Tiền mặt tại quầy</option>
                  <option value="card">Quẹt thẻ POS</option>
                </select>

                {posCart.length === 0 ? (
                  <div style={{ padding: '1.2rem', textAlign: 'center', color: '#64748B', fontSize: '0.82rem' }}>
                    Chưa chọn mặt hàng nào
                  </div>
                ) : (
                  posCart.map((c) => (
                    <div key={c.product.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                      <span>
                        {c.product.name} × <strong>{c.qty}</strong>
                      </span>
                      <strong>{formatVnd(c.qty * c.product.sale_price_vnd)}</strong>
                    </div>
                  ))
                )}

                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    paddingTop: 10,
                    borderTop: '1px solid #E2E8F0',
                    fontSize: '1rem',
                    fontWeight: 800,
                  }}
                >
                  <span>Tổng thanh toán:</span>
                  <span style={{ color: '#1E40FF' }}>{formatVnd(posTotal)}</span>
                </div>

                <div style={{ display: 'flex', gap: 8 }}>
                  {posCart.length > 0 && (
                    <button type="button" onClick={() => setPosCart([])} className="btn secondary" style={{ height: 44 }}>
                      Xóa giỏ
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={handlePosCheckout}
                    className="btn-inkica-primary"
                    style={{
                      flex: 1,
                      height: 44,
                      borderRadius: 14,
                      border: 'none',
                      color: '#FFFFFF',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 6,
                    }}
                  >
                    <ShoppingBag size={16} /> Thanh toán & Xuất kho FIFO
                  </button>
                </div>

                {lastPosReceipt && (
                  <div style={{ padding: '0.8rem', borderRadius: 12, background: '#F0FDF4', border: '1px solid #BBF7D0', fontSize: '0.8rem' }}>
                    <strong>Biên lai {lastPosReceipt.order_code}:</strong> Doanh thu {formatVnd(lastPosReceipt.total_vnd)} • Giá vốn FIFO{' '}
                    {formatVnd(lastPosReceipt.cogs_vnd)} • Lãi gộp <strong>{formatVnd(lastPosReceipt.gross_margin_vnd)}</strong>
                  </div>
                )}
              </div>
            </Card>
          </div>

          {/* Fixed Assets Register */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: '#0F172A' }}>
              <FileSpreadsheet size={18} style={{ display: 'inline', marginRight: 6, color: '#1E40FF' }} />
              Sổ Đăng Ký Tài Sản Cố Định & Khấu Hao Đường Thẳng
            </h3>
            {canCreate && (
              <button type="button" onClick={() => setAssetModalOpen(true)} className="btn secondary" style={{ height: 40, color: '#1E40FF' }}>
                <Plus size={15} /> Đăng ký Tài sản mới
              </button>
            )}
          </div>

          <Table
            columns={assetColumns}
            rows={assets}
            rowKey={(r) => r.id}
            emptyTitle="Chưa có Tài sản cố định nào"
            emptyDescription="Theo dõi máy móc, thiết bị văn phòng, nguyên giá và giá trị khấu hao hàng tháng."
          />
        </div>
      )}

      {/* MODALS */}
      <CustomModal isOpen={txModalOpen} onClose={() => setTxModalOpen(false)} title="Lập Phiếu Thu / Phiếu Chi Sổ Quỹ">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <select
            value={txType}
            onChange={(e) => setTxType(e.target.value as 'income' | 'expense')}
            className="form-input"
            style={{ height: 44, borderRadius: 14, border: '1px solid #E2E8F0', padding: '0 12px' }}
          >
            <option value="income">Phiếu Thu (+)</option>
            <option value="expense">Phiếu Chi (-)</option>
          </select>
          <input
            type="number"
            value={txAmount}
            onChange={(e) => setTxAmount(e.target.value)}
            placeholder="Số tiền (VNĐ)"
            className="form-input"
            style={{ height: 44, borderRadius: 14, border: '1px solid #E2E8F0', padding: '0 12px' }}
          />
          <input
            value={txCounterparty}
            onChange={(e) => setTxCounterparty(e.target.value)}
            placeholder="Người nộp / Đơn vị nhận..."
            className="form-input"
            style={{ height: 44, borderRadius: 14, border: '1px solid #E2E8F0', padding: '0 12px' }}
          />
          <input
            value={txDesc}
            onChange={(e) => setTxDesc(e.target.value)}
            placeholder="Diễn giải nội dung..."
            className="form-input"
            style={{ height: 44, borderRadius: 14, border: '1px solid #E2E8F0', padding: '0 12px' }}
          />
          <button
            type="button"
            onClick={handleCreateTransaction}
            className="btn-inkica-primary"
            style={{ height: 44, borderRadius: 14, border: 'none', color: '#FFFFFF', fontWeight: 700, cursor: 'pointer' }}
          >
            Hạch toán vào Sổ quỹ
          </button>
        </div>
      </CustomModal>

      <CustomModal isOpen={compModalOpen} onClose={() => setCompModalOpen(false)} title="Thêm Hồ Sơ Doanh Nghiệp B2B">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <input
            value={compName}
            onChange={(e) => setCompName(e.target.value)}
            placeholder="Tên pháp nhân công ty khách hàng..."
            className="form-input"
            style={{ height: 44, borderRadius: 14, border: '1px solid #E2E8F0', padding: '0 12px' }}
          />
          <input
            value={compTaxCode}
            onChange={(e) => setCompTaxCode(e.target.value)}
            placeholder="Mã số thuế (MST)..."
            className="form-input"
            style={{ height: 44, borderRadius: 14, border: '1px solid #E2E8F0', padding: '0 12px' }}
          />
          <input
            value={compAddress}
            onChange={(e) => setCompAddress(e.target.value)}
            placeholder="Địa chỉ xuất hóa đơn..."
            className="form-input"
            style={{ height: 44, borderRadius: 14, border: '1px solid #E2E8F0', padding: '0 12px' }}
          />
          <select
            value={compTier}
            onChange={(e) => setCompTier(e.target.value)}
            className="form-input"
            style={{ height: 44, borderRadius: 14, border: '1px solid #E2E8F0', padding: '0 12px' }}
          >
            <option value="standard">Standard</option>
            <option value="gold">Gold Partner</option>
            <option value="enterprise">Enterprise Account</option>
          </select>
          <button
            type="button"
            onClick={handleCreateCompany}
            className="btn-inkica-primary"
            style={{ height: 44, borderRadius: 14, border: 'none', color: '#FFFFFF', fontWeight: 700, cursor: 'pointer' }}
          >
            Lưu Doanh nghiệp B2B
          </button>
        </div>
      </CustomModal>

      <CustomModal isOpen={dealModalOpen} onClose={() => setDealModalOpen(false)} title="Tạo Cơ Hội Bán Hàng (Multi-Deal)">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <input
            value={dealTitle}
            onChange={(e) => setDealTitle(e.target.value)}
            placeholder="Tên cơ hội thương vụ..."
            className="form-input"
            style={{ height: 44, borderRadius: 14, border: '1px solid #E2E8F0', padding: '0 12px' }}
          />
          <select
            value={dealCompanyId}
            onChange={(e) => setDealCompanyId(e.target.value)}
            className="form-input"
            style={{ height: 44, borderRadius: 14, border: '1px solid #E2E8F0', padding: '0 12px' }}
          >
            <option value="">-- Gắn Công ty B2B (Tùy chọn) --</option>
            {companies.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          <select
            value={dealLeadId}
            onChange={(e) => setDealLeadId(e.target.value)}
            className="form-input"
            style={{ height: 44, borderRadius: 14, border: '1px solid #E2E8F0', padding: '0 12px' }}
          >
            <option value="">-- Gắn Hồ sơ Khách hàng CRM (Tùy chọn) --</option>
            {(dash?.leads || []).map((l) => (
              <option key={l.id} value={l.id}>{l.name}</option>
            ))}
          </select>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <input
              type="number"
              value={dealAmount}
              onChange={(e) => setDealAmount(e.target.value)}
              placeholder="Giá trị dự kiến (VNĐ)"
              className="form-input"
              style={{ height: 44, borderRadius: 14, border: '1px solid #E2E8F0', padding: '0 12px' }}
            />
            <input
              type="number"
              value={dealProb}
              onChange={(e) => setDealProb(e.target.value)}
              placeholder="Xác suất chốt (%)"
              className="form-input"
              style={{ height: 44, borderRadius: 14, border: '1px solid #E2E8F0', padding: '0 12px' }}
            />
          </div>
          <input
            type="date"
            value={dealCloseDate}
            onChange={(e) => setDealCloseDate(e.target.value)}
            className="form-input"
            style={{ height: 44, borderRadius: 14, border: '1px solid #E2E8F0', padding: '0 12px' }}
          />
          <button
            type="button"
            onClick={handleCreateDeal}
            className="btn-inkica-primary"
            style={{ height: 44, borderRadius: 14, border: 'none', color: '#FFFFFF', fontWeight: 700, cursor: 'pointer' }}
          >
            Khởi tạo Deal
          </button>
        </div>
      </CustomModal>

      <CustomModal isOpen={quoteModalOpen} onClose={() => setQuoteModalOpen(false)} title={`Phát Hành ${terminology.quoteLabel} Mới`}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <input
            value={quoteTitle}
            onChange={(e) => setQuoteTitle(e.target.value)}
            placeholder={`Tiêu đề ${terminology.quoteLabel}...`}
            className="form-input"
            style={{ height: 44, borderRadius: 14, border: '1px solid #E2E8F0', padding: '0 12px' }}
          />
          <select
            value={quoteCompanyId}
            onChange={(e) => setQuoteCompanyId(e.target.value)}
            className="form-input"
            style={{ height: 44, borderRadius: 14, border: '1px solid #E2E8F0', padding: '0 12px' }}
          >
            <option value="">-- Khách hàng Doanh nghiệp B2B --</option>
            {companies.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          <select
            value={quoteLeadId}
            onChange={(e) => setQuoteLeadId(e.target.value)}
            className="form-input"
            style={{ height: 44, borderRadius: 14, border: '1px solid #E2E8F0', padding: '0 12px' }}
          >
            <option value="">-- Liên kết Hồ sơ 360° (Để cộng Doanh thu khi thanh toán) --</option>
            {(dash?.leads || []).map((l) => (
              <option key={l.id} value={l.id}>{l.name}</option>
            ))}
          </select>
          <select
            value={quoteDealId}
            onChange={(e) => setQuoteDealId(e.target.value)}
            className="form-input"
            style={{ height: 44, borderRadius: 14, border: '1px solid #E2E8F0', padding: '0 12px' }}
          >
            <option value="">-- Liên kết Deal --</option>
            {deals.map((d) => (
              <option key={d.id} value={d.id}>{d.title}</option>
            ))}
          </select>
          <input
            value={quoteItemName}
            onChange={(e) => setQuoteItemName(e.target.value)}
            placeholder="Hạng mục sản phẩm / dịch vụ"
            className="form-input"
            style={{ height: 44, borderRadius: 14, border: '1px solid #E2E8F0', padding: '0 12px' }}
          />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 10 }}>
            <input
              type="number"
              value={quoteItemQty}
              onChange={(e) => setQuoteItemQty(e.target.value)}
              placeholder="Số lượng"
              className="form-input"
              style={{ height: 44, borderRadius: 14, border: '1px solid #E2E8F0', padding: '0 12px' }}
            />
            <input
              type="number"
              value={quoteItemPrice}
              onChange={(e) => setQuoteItemPrice(e.target.value)}
              placeholder="Đơn giá (VNĐ)"
              className="form-input"
              style={{ height: 44, borderRadius: 14, border: '1px solid #E2E8F0', padding: '0 12px' }}
            />
          </div>
          <button
            type="button"
            onClick={handleCreateQuote}
            className="btn-inkica-primary"
            style={{ height: 44, borderRadius: 14, border: 'none', color: '#FFFFFF', fontWeight: 700, cursor: 'pointer' }}
          >
            Lưu & Phát hành {terminology.quoteLabel}
          </button>
        </div>
      </CustomModal>

      <CustomModal isOpen={depModalOpen} onClose={() => setDepModalOpen(false)} title="Ghi Nhận Phiếu Đặt Cọc">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <input
            value={depCustomer}
            onChange={(e) => setDepCustomer(e.target.value)}
            placeholder="Tên khách hàng đặt cọc..."
            className="form-input"
            style={{ height: 44, borderRadius: 14, border: '1px solid #E2E8F0', padding: '0 12px' }}
          />
          <input
            type="number"
            value={depAmount}
            onChange={(e) => setDepAmount(e.target.value)}
            placeholder="Số tiền đặt cọc (VNĐ)"
            className="form-input"
            style={{ height: 44, borderRadius: 14, border: '1px solid #E2E8F0', padding: '0 12px' }}
          />
          <button
            type="button"
            onClick={handleCreateDeposit}
            className="btn-inkica-primary"
            style={{ height: 44, borderRadius: 14, border: 'none', color: '#FFFFFF', fontWeight: 700, cursor: 'pointer' }}
          >
            Xác nhận Thu cọc
          </button>
        </div>
      </CustomModal>

      <CustomModal isOpen={poModalOpen} onClose={() => setPoModalOpen(false)} title="Lập Đơn Mua Hàng Nhập Kho (PO)">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <input
            value={poSupplier}
            onChange={(e) => setPoSupplier(e.target.value)}
            placeholder="Tên Nhà cung cấp..."
            className="form-input"
            style={{ height: 44, borderRadius: 14, border: '1px solid #E2E8F0', padding: '0 12px' }}
          />
          <select
            value={poProductId}
            onChange={(e) => setPoProductId(e.target.value)}
            className="form-input"
            style={{ height: 44, borderRadius: 14, border: '1px solid #E2E8F0', padding: '0 12px' }}
          >
            <option value="">-- Chọn SKU nhập kho --</option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>
            ))}
          </select>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 10 }}>
            <input
              type="number"
              value={poQty}
              onChange={(e) => setPoQty(e.target.value)}
              placeholder="Số lượng"
              className="form-input"
              style={{ height: 44, borderRadius: 14, border: '1px solid #E2E8F0', padding: '0 12px' }}
            />
            <input
              type="number"
              value={poUnitCost}
              onChange={(e) => setPoUnitCost(e.target.value)}
              placeholder="Đơn giá nhập (VNĐ)"
              className="form-input"
              style={{ height: 44, borderRadius: 14, border: '1px solid #E2E8F0', padding: '0 12px' }}
            />
          </div>
          <button
            type="button"
            onClick={handleCreatePo}
            className="btn-inkica-primary"
            style={{ height: 44, borderRadius: 14, border: 'none', color: '#FFFFFF', fontWeight: 700, cursor: 'pointer' }}
          >
            Phát hành Đơn mua PO
          </button>
        </div>
      </CustomModal>

      <CustomModal isOpen={prodModalOpen} onClose={() => setProdModalOpen(false)} title="Thêm Sản Phẩm Hàng Hóa (SKU)">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <input
            value={prodSku}
            onChange={(e) => setProdSku(e.target.value)}
            placeholder="Mã SKU (VD: CAM-4K-PRO)..."
            className="form-input"
            style={{ height: 44, borderRadius: 14, border: '1px solid #E2E8F0', padding: '0 12px' }}
          />
          <input
            value={prodName}
            onChange={(e) => setProdName(e.target.value)}
            placeholder="Tên hàng hóa..."
            className="form-input"
            style={{ height: 44, borderRadius: 14, border: '1px solid #E2E8F0', padding: '0 12px' }}
          />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <input
              type="number"
              value={prodSalePrice}
              onChange={(e) => setProdSalePrice(e.target.value)}
              placeholder="Giá bán niêm yết (VNĐ)"
              className="form-input"
              style={{ height: 44, borderRadius: 14, border: '1px solid #E2E8F0', padding: '0 12px' }}
            />
            <input
              type="number"
              value={prodCostPrice}
              onChange={(e) => setProdCostPrice(e.target.value)}
              placeholder="Giá vốn tham chiếu (VNĐ)"
              className="form-input"
              style={{ height: 44, borderRadius: 14, border: '1px solid #E2E8F0', padding: '0 12px' }}
            />
          </div>
          <button
            type="button"
            onClick={handleCreateProduct}
            className="btn-inkica-primary"
            style={{ height: 44, borderRadius: 14, border: 'none', color: '#FFFFFF', fontWeight: 700, cursor: 'pointer' }}
          >
            Lưu Sản phẩm
          </button>
        </div>
      </CustomModal>

      <CustomModal isOpen={batchModalOpen} onClose={() => setBatchModalOpen(false)} title="Nhập Lô Hàng Tồn Kho FIFO">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <select
            value={batchProdId}
            onChange={(e) => setBatchProdId(e.target.value)}
            className="form-input"
            style={{ height: 44, borderRadius: 14, border: '1px solid #E2E8F0', padding: '0 12px' }}
          >
            <option value="">-- Chọn sản phẩm SKU --</option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>
            ))}
          </select>
          <input
            type="number"
            value={batchQty}
            onChange={(e) => setBatchQty(e.target.value)}
            placeholder="Số lượng nhập lô"
            className="form-input"
            style={{ height: 44, borderRadius: 14, border: '1px solid #E2E8F0', padding: '0 12px' }}
          />
          <input
            type="number"
            value={batchUnitCost}
            onChange={(e) => setBatchUnitCost(e.target.value)}
            placeholder="Đơn giá vốn thực tế của lô này (VNĐ)"
            className="form-input"
            style={{ height: 44, borderRadius: 14, border: '1px solid #E2E8F0', padding: '0 12px' }}
          />
          <button
            type="button"
            onClick={handleCreateBatch}
            className="btn-inkica-primary"
            style={{ height: 44, borderRadius: 14, border: 'none', color: '#FFFFFF', fontWeight: 700, cursor: 'pointer' }}
          >
            Nhập Kho Lô FIFO
          </button>
        </div>
      </CustomModal>

      <CustomModal isOpen={assetModalOpen} onClose={() => setAssetModalOpen(false)} title="Đăng Ký Tài Sản Cố Định">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <input
            value={assetName}
            onChange={(e) => setAssetName(e.target.value)}
            placeholder="Tên tài sản (VD: Máy chủ, Xe vận tải, MacBook Pro...)"
            className="form-input"
            style={{ height: 44, borderRadius: 14, border: '1px solid #E2E8F0', padding: '0 12px' }}
          />
          <input
            type="number"
            value={assetCost}
            onChange={(e) => setAssetCost(e.target.value)}
            placeholder="Nguyên giá mua vào (VNĐ)"
            className="form-input"
            style={{ height: 44, borderRadius: 14, border: '1px solid #E2E8F0', padding: '0 12px' }}
          />
          <input
            type="number"
            value={assetMonths}
            onChange={(e) => setAssetMonths(e.target.value)}
            placeholder="Thời gian khấu hao (số tháng, VD: 36)"
            className="form-input"
            style={{ height: 44, borderRadius: 14, border: '1px solid #E2E8F0', padding: '0 12px' }}
          />
          <button
            type="button"
            onClick={handleCreateAsset}
            className="btn-inkica-primary"
            style={{ height: 44, borderRadius: 14, border: 'none', color: '#FFFFFF', fontWeight: 700, cursor: 'pointer' }}
          >
            Ghi Sổ Tài Sản
          </button>
        </div>
      </CustomModal>
    </div>
  );
};

export default ErpFinanceWave2Entry;
