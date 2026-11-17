import React, { useCallback, useEffect, useState } from 'react';
import {
  Boxes,
  FileText,
  Landmark,
  MonitorSmartphone,
  Package,
  Plus,
  RefreshCw,
  ShoppingBag,
  TrendingUp,
  Truck,
  Wallet,
} from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ScreenHelpButton } from '../../components/ui/ScreenHelpButton';
import { FinancialOpsTabSkeleton } from '../../components/ui/Skeleton';
import { Badge, Card, PillTabs } from '../../components/ui/AutoDataLoadingModal';
import { apiRequest, getErrorMessage } from '../../../autodataApi';
import { useAuth } from '../../contexts/AuthContext';
import { useEntitlement } from '../../contexts/EntitlementContext';
import { CommercialDocsView } from './CommercialDocsView';
import { DepositCreateDrawer } from './DepositCreateDrawer';
import { DepositDetailDrawer } from './DepositDetailDrawer';
import { DepositsView, ExpensesView } from './DepositsAndExpensesViews';
import { ExpenseCreateDrawer } from './ExpenseCreateDrawer';
import { ExpenseQuickViewDrawer } from './ExpenseQuickViewDrawer';
import { FinancialDashboardView } from './FinancialDashboardView';
import { InventorySyncModal } from './InventorySyncModal';
import { POSModal } from './POSModal';
import { PrintableDocModal, type PrintableCommercialDoc } from './PrintableDocModal';
import { QuoteEditorModal, type CommercialEditorMode } from './QuoteEditorModal';
import { SupplyChainView } from './SupplyChainView';
import {
  resolveFinanceSubViewFromPath,
  type B2bCompanyRecord,
  type DealRecord,
  type DepositRecord,
  type ExpenseRecord,
  type FinanceDashboardResponse,
  type FinanceSubViewKey,
  type FinanceTransactionRecord,
  type FixedAssetRecord,
  type InventoryBatchRecord,
  type InvoiceRecord,
  type ProductRecord,
  type PurchaseOrderRecord,
  type QuoteRecord,
  type SalesOrderRecord,
  type StockMovementRecord,
  type SupplierRecord,
  type VietQrResponse,
  type WarehouseRecord,
} from './financeTypes';

export const ErpFinanceWave2Entry: React.FC = () => {
  const { token, tenantSlug } = useAuth();
  const { packageMeta, scope, can } = useEntitlement();
  const location = useLocation();
  const navigate = useNavigate();

  const canCreate = can('erp_finance_inventory', 'create');
  const canEdit = can('erp_finance_inventory', 'edit');

  const { subView: routeSubView, isDedicatedRoute } = resolveFinanceSubViewFromPath(location.pathname);
  const [hubSubView, setHubSubView] = useState<FinanceSubViewKey>('dashboard');
  const activeView: FinanceSubViewKey = isDedicatedRoute ? routeSubView : hubSubView;

  const [loading, setLoading] = useState(true);
  const [dashboard, setDashboard] = useState<FinanceDashboardResponse | null>(null);
  const [vietQr, setVietQr] = useState<VietQrResponse | null>(null);
  const [companies, setCompanies] = useState<B2bCompanyRecord[]>([]);
  const [deals, setDeals] = useState<DealRecord[]>([]);
  const [quotes, setQuotes] = useState<QuoteRecord[]>([]);
  const [salesOrders, setSalesOrders] = useState<SalesOrderRecord[]>([]);
  const [invoices, setInvoices] = useState<InvoiceRecord[]>([]);
  const [deposits, setDeposits] = useState<DepositRecord[]>([]);
  const [expenses, setExpenses] = useState<ExpenseRecord[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrderRecord[]>([]);
  const [transactions, setTransactions] = useState<FinanceTransactionRecord[]>([]);
  const [products, setProducts] = useState<ProductRecord[]>([]);
  const [suppliers, setSuppliers] = useState<SupplierRecord[]>([]);
  const [warehouses, setWarehouses] = useState<WarehouseRecord[]>([]);
  const [batches, setBatches] = useState<InventoryBatchRecord[]>([]);
  const [movements, setMovements] = useState<StockMovementRecord[]>([]);
  const [assets, setAssets] = useState<FixedAssetRecord[]>([]);

  // Drawers & Modals State
  const [editorOpen, setEditorOpen] = useState(false);
  const [editorMode, setEditorMode] = useState<CommercialEditorMode>('quote');
  const [printDoc, setPrintDoc] = useState<PrintableCommercialDoc | null>(null);
  const [posOpen, setPosOpen] = useState(false);
  const [syncSheetsOpen, setSyncSheetsOpen] = useState(false);

  const [depositCreateOpen, setDepositCreateOpen] = useState(false);
  const [selectedDeposit, setSelectedDeposit] = useState<DepositRecord | null>(null);
  const [selectedDepositId, setSelectedDepositId] = useState<string | null>(null);

  const [expenseCreateOpen, setExpenseCreateOpen] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<ExpenseRecord | null>(null);
  const [selectedExpenseId, setSelectedExpenseId] = useState<string | null>(null);

  const loadAll = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const [
        dashRes,
        qrRes,
        compRes,
        dealRes,
        quoteRes,
        soRes,
        invRes,
        depRes,
        expRes,
        poRes,
        txRes,
        prodRes,
        supRes,
        whRes,
        batchRes,
        movRes,
        assetRes,
      ] = await Promise.all([
        apiRequest<FinanceDashboardResponse>('/finance/dashboard', { token, tenantSlug }),
        apiRequest<VietQrResponse>('/finance/vietqr-preview?amount_vnd=15000000&reference_code=SO2026', {
          token,
          tenantSlug,
        }),
        apiRequest<{ items: B2bCompanyRecord[] }>('/finance/companies', { token, tenantSlug }),
        apiRequest<{ items: DealRecord[] }>('/finance/deals', { token, tenantSlug }),
        apiRequest<{ items: QuoteRecord[] }>('/finance/quotes', { token, tenantSlug }),
        apiRequest<{ items: SalesOrderRecord[] }>('/finance/sales-orders', { token, tenantSlug }),
        apiRequest<{ items: InvoiceRecord[] }>('/finance/invoices', { token, tenantSlug }),
        apiRequest<{ items: DepositRecord[] }>('/finance/deposits', { token, tenantSlug }),
        apiRequest<{ items: ExpenseRecord[] }>('/finance/expenses', { token, tenantSlug }),
        apiRequest<{ items: PurchaseOrderRecord[] }>('/finance/purchase-orders', { token, tenantSlug }),
        apiRequest<{ items: FinanceTransactionRecord[] }>('/finance/transactions', { token, tenantSlug }),
        apiRequest<{ items: ProductRecord[] }>('/inventory/products', { token, tenantSlug }),
        apiRequest<{ items: SupplierRecord[] }>('/inventory/suppliers', { token, tenantSlug }),
        apiRequest<{ items: WarehouseRecord[] }>('/inventory/warehouses', { token, tenantSlug }),
        apiRequest<{ items: InventoryBatchRecord[] }>('/inventory/batches', { token, tenantSlug }),
        apiRequest<{ items: StockMovementRecord[] }>('/inventory/movements', { token, tenantSlug }),
        apiRequest<{ items: FixedAssetRecord[] }>('/inventory/assets', { token, tenantSlug }),
      ]);

      setDashboard(dashRes);
      setVietQr(qrRes);
      setCompanies(compRes?.items || []);
      setDeals(dealRes?.items || []);
      setQuotes(quoteRes?.items || []);
      setSalesOrders(soRes?.items || []);
      setInvoices(invRes?.items || []);
      setDeposits(depRes?.items || []);
      setExpenses(expRes?.items || []);
      setPurchaseOrders(poRes?.items || []);
      setTransactions(txRes?.items || []);
      setProducts(prodRes?.items || []);
      setSuppliers(supRes?.items || []);
      setWarehouses(whRes?.items || []);
      setBatches(batchRes?.items || []);
      setMovements(movRes?.items || []);
      setAssets(assetRes?.items || []);
    } catch (err) {
      toast.error(getErrorMessage(err, 'Không thể tải dữ liệu Tài chính & Kho vận.'));
    } finally {
      setLoading(false);
    }
  }, [token, tenantSlug]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadAll();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [loadAll]);

  // Cross-module global triggers (e.g. from CommandPalette or CustomerProfileDrawer)
  useEffect(() => {
    const onOpenPos = () => setPosOpen(true);
    const onOpenDepCreate = () => setDepositCreateOpen(true);
    const onOpenExpCreate = () => setExpenseCreateOpen(true);
    const onOpenQuote = () => {
      setEditorMode('quote');
      setEditorOpen(true);
    };
    const onOpenDepDetail = (ev: Event) => {
      const custom = ev as CustomEvent<{ id?: string }>;
      if (custom.detail?.id) setSelectedDepositId(custom.detail.id);
    };
    const onOpenExpDetail = (ev: Event) => {
      const custom = ev as CustomEvent<{ id?: string }>;
      if (custom.detail?.id) setSelectedExpenseId(custom.detail.id);
    };

    window.addEventListener('open-pos-modal', onOpenPos);
    window.addEventListener('open-deposit-create-drawer', onOpenDepCreate);
    window.addEventListener('open-expense-create-drawer', onOpenExpCreate);
    window.addEventListener('open-quote-editor-modal', onOpenQuote);
    window.addEventListener('open-deposit-detail-drawer', onOpenDepDetail);
    window.addEventListener('open-expense-quick-view-drawer', onOpenExpDetail);

    return () => {
      window.removeEventListener('open-pos-modal', onOpenPos);
      window.removeEventListener('open-deposit-create-drawer', onOpenDepCreate);
      window.removeEventListener('open-expense-create-drawer', onOpenExpCreate);
      window.removeEventListener('open-quote-editor-modal', onOpenQuote);
      window.removeEventListener('open-deposit-detail-drawer', onOpenDepDetail);
      window.removeEventListener('open-expense-quick-view-drawer', onOpenExpDetail);
    };
  }, []);

  const handleGenerateQr = async (amountVnd: number, refCode: string) => {
    try {
      const res = await apiRequest<VietQrResponse>(
        `/finance/vietqr-preview?amount_vnd=${encodeURIComponent(String(amountVnd))}&reference_code=${encodeURIComponent(refCode)}`,
        { token, tenantSlug }
      );
      setVietQr(res);
      toast.success('Đã tạo mã thanh toán VietQR theo Pháp nhân Chi nhánh!');
    } catch (err) {
      toast.error(getErrorMessage(err, 'Không thể tạo mã thanh toán VietQR.'));
    }
  };

  if (loading && !dashboard) {
    return <FinancialOpsTabSkeleton />;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
      {/* Unified Bright Royal Sapphire Header */}
      <Card
        padding="1.2rem 1.4rem"
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
              <h1 style={{ fontSize: '1.18rem', fontWeight: 800, color: '#0F172A', margin: 0 }}>
                Tài Chính Thương Mại, Báo Giá SO/PO, Đặt Cọc UNC, Chi Phí VAT & Chuỗi Cung Ứng FIFO
              </h1>
              <Badge tone="primary">{packageMeta.shortName}</Badge>
              <Badge tone="success">Scope: {scope('erp_finance_inventory')}</Badge>
            </div>
            <p style={{ fontSize: '0.8rem', color: '#64748B', margin: '4px 0 0' }}>
              Khép kín Báo giá đa dòng SKU → Đặt cọc UNC → Đơn bán SO / POS → Xuất kho FIFO → Hóa đơn & Dòng tiền P&L
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            {isDedicatedRoute && (
              <button
                type="button"
                className="btn secondary"
                onClick={() => navigate('/erp/finance')}
                style={{ height: 40, color: '#1E40FF', fontWeight: 700 }}
              >
                Trung tâm Tài chính A-Z
              </button>
            )}
            <button
              type="button"
              className="btn secondary"
              onClick={() => setPosOpen(true)}
              style={{ height: 40, color: '#1E40FF', display: 'inline-flex', alignItems: 'center', gap: 6, fontWeight: 700 }}
            >
              <MonitorSmartphone size={15} /> Quầy POS Nhanh
            </button>
            {canCreate && (
              <>
                <button
                  type="button"
                  className="btn secondary"
                  onClick={() => setDepositCreateOpen(true)}
                  style={{ height: 40, display: 'inline-flex', alignItems: 'center', gap: 5 }}
                >
                  <Landmark size={14} color="#059669" /> + Đặt cọc
                </button>
                <button
                  type="button"
                  className="btn secondary"
                  onClick={() => setExpenseCreateOpen(true)}
                  style={{ height: 40, display: 'inline-flex', alignItems: 'center', gap: 5 }}
                >
                  <Wallet size={14} color="#D97706" /> + Phiếu chi
                </button>
                <button
                  type="button"
                  className="btn primary"
                  onClick={() => {
                    setEditorMode('quote');
                    setEditorOpen(true);
                  }}
                  style={{ height: 40, background: '#1E40FF', display: 'inline-flex', alignItems: 'center', gap: 5 }}
                >
                  <Plus size={15} /> Báo giá SKU
                </button>
              </>
            )}
            <button
              type="button"
              className="btn secondary"
              onClick={() => void loadAll()}
              style={{ height: 40, display: 'inline-flex', alignItems: 'center', gap: 5 }}
            >
              <RefreshCw size={14} />
            </button>
            <ScreenHelpButton screenKey="erp_finance" />
          </div>
        </div>
      </Card>

      {/* Navigation PillTabs */}
      <PillTabs<FinanceSubViewKey>
        activeKey={activeView}
        onChange={(next) => {
          if (isDedicatedRoute) {
            const routeMap: Record<FinanceSubViewKey, string> = {
              dashboard: '/erp/finance',
              cash_flow: '/cash-flow',
              quotes: '/quotes',
              sales_orders: '/sales-orders',
              deposits: '/deposits',
              invoices: '/invoices',
              expenses: '/expenses',
              products: '/products',
              suppliers: '/suppliers',
              inventory: '/inventory',
              purchase_orders: '/purchase-orders',
            };
            navigate(routeMap[next]);
          } else {
            setHubSubView(next);
          }
        }}
        tabs={[
          { key: 'dashboard', label: 'Dòng tiền & P&L', icon: <TrendingUp size={14} /> },
          { key: 'quotes', label: 'Báo giá', count: quotes.length, icon: <FileText size={14} /> },
          { key: 'sales_orders', label: 'Đơn bán (SO)', count: salesOrders.length, icon: <ShoppingBag size={14} /> },
          { key: 'deposits', label: 'Đặt cọc UNC', count: deposits.length, icon: <Landmark size={14} /> },
          { key: 'invoices', label: 'Hóa đơn', count: invoices.length, icon: <FileText size={14} /> },
          { key: 'expenses', label: 'Chi phí VAT', count: expenses.length, icon: <Wallet size={14} /> },
          { key: 'products', label: 'Sản phẩm SKU', count: products.length, icon: <Package size={14} /> },
          { key: 'suppliers', label: 'Nhà cung cấp', count: suppliers.length, icon: <Truck size={14} /> },
          { key: 'inventory', label: 'Kho FIFO & TSCĐ', count: batches.length, icon: <Boxes size={14} /> },
          { key: 'purchase_orders', label: 'Đơn mua (PO)', count: purchaseOrders.length, icon: <Truck size={14} /> },
        ]}
      />

      {/* Active Sub-View */}
      {(activeView === 'dashboard' || activeView === 'cash_flow') && (
        <FinancialDashboardView
          dashboard={dashboard}
          vietQr={vietQr}
          transactions={transactions}
          canCreate={canCreate}
          onRefresh={() => void loadAll()}
          onGenerateQr={(amt, ref) => void handleGenerateQr(amt, ref)}
        />
      )}

      {activeView === 'deposits' && (
        <DepositsView
          deposits={deposits}
          canCreate={canCreate}
          onOpenCreateDrawer={() => setDepositCreateOpen(true)}
          onSelectDeposit={(dep) => {
            setSelectedDeposit(dep);
            setSelectedDepositId(dep.id);
          }}
        />
      )}

      {activeView === 'expenses' && (
        <ExpensesView
          expenses={expenses}
          canCreate={canCreate}
          onOpenCreateDrawer={() => setExpenseCreateOpen(true)}
          onSelectExpense={(exp) => {
            setSelectedExpense(exp);
            setSelectedExpenseId(exp.id);
          }}
        />
      )}

      {(activeView === 'quotes' ||
        activeView === 'sales_orders' ||
        activeView === 'invoices' ||
        activeView === 'purchase_orders') && (
        <CommercialDocsView
          activeDocTab={activeView}
          quotes={quotes}
          salesOrders={salesOrders}
          invoices={invoices}
          purchaseOrders={purchaseOrders}
          warehouses={warehouses}
          canCreate={canCreate}
          canEdit={canEdit}
          onOpenEditor={(mode) => {
            setEditorMode(mode);
            setEditorOpen(true);
          }}
          onOpenPrintPreview={(doc) => setPrintDoc(doc)}
          onRefresh={() => void loadAll()}
        />
      )}

      {(activeView === 'products' || activeView === 'suppliers' || activeView === 'inventory') && (
        <SupplyChainView
          activeSubTab={activeView}
          products={products}
          suppliers={suppliers}
          warehouses={warehouses}
          batches={batches}
          movements={movements}
          assets={assets}
          canCreate={canCreate}
          canEdit={canEdit}
          onOpenPos={() => setPosOpen(true)}
          onOpenSyncSheets={() => setSyncSheetsOpen(true)}
          onRefresh={() => void loadAll()}
        />
      )}

      {/* Standalone MYERP Drawers & Modals */}
      <QuoteEditorModal
        isOpen={editorOpen}
        onClose={() => setEditorOpen(false)}
        mode={editorMode}
        products={products}
        companies={companies}
        leads={dashboard?.leads || []}
        deals={deals}
        suppliers={suppliers}
        onSuccess={() => void loadAll()}
      />

      <PrintableDocModal
        isOpen={Boolean(printDoc)}
        onClose={() => setPrintDoc(null)}
        doc={printDoc}
        legalEntity={dashboard?.legal_entity}
      />

      <POSModal
        isOpen={posOpen}
        onClose={() => setPosOpen(false)}
        products={products}
        leads={dashboard?.leads || []}
        warehouses={warehouses}
        legalEntity={dashboard?.legal_entity}
        onCheckoutSuccess={() => void loadAll()}
      />

      <InventorySyncModal
        isOpen={syncSheetsOpen}
        onClose={() => setSyncSheetsOpen(false)}
        warehouses={warehouses}
        onSynced={() => void loadAll()}
      />

      <DepositCreateDrawer
        isOpen={depositCreateOpen}
        onClose={() => setDepositCreateOpen(false)}
        leads={dashboard?.leads || []}
        companies={companies}
        staff={dashboard?.staff || []}
        onSaveSuccess={() => void loadAll()}
      />

      <DepositDetailDrawer
        isOpen={Boolean(selectedDepositId)}
        onClose={() => {
          setSelectedDepositId(null);
          setSelectedDeposit(null);
        }}
        depositId={selectedDepositId}
        initialDeposit={selectedDeposit}
        onUpdated={() => void loadAll()}
      />

      <ExpenseCreateDrawer
        isOpen={expenseCreateOpen}
        onClose={() => setExpenseCreateOpen(false)}
        staff={dashboard?.staff || []}
        suppliers={suppliers}
        onSaveSuccess={() => void loadAll()}
      />

      <ExpenseQuickViewDrawer
        isOpen={Boolean(selectedExpenseId)}
        onClose={() => {
          setSelectedExpenseId(null);
          setSelectedExpense(null);
        }}
        expenseId={selectedExpenseId}
        initialExpense={selectedExpense}
        onUpdated={() => void loadAll()}
      />
    </div>
  );
};

export {
  DepositCreateDrawer,
  DepositDetailDrawer,
  ExpenseCreateDrawer,
  ExpenseQuickViewDrawer,
  QuoteEditorModal,
  POSModal,
  InventorySyncModal,
};

export default ErpFinanceWave2Entry;
