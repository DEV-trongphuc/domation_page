export type FinanceSubViewKey =
  | 'dashboard'
  | 'cash_flow'
  | 'quotes'
  | 'sales_orders'
  | 'deposits'
  | 'invoices'
  | 'expenses'
  | 'products'
  | 'suppliers'
  | 'inventory'
  | 'purchase_orders';

export interface LegalEntityInfo {
  branch_id: string | null;
  branch_code?: string | null;
  branch_name: string;
  legal_entity_name: string;
  tax_code: string;
  representative_name: string;
  representative_title?: string;
  address: string;
  phone?: string;
  email?: string;
  bank_name: string;
  bank_bin: string;
  bank_account_no: string;
  bank_account_holder: string;
}

export interface MonthlyCashflowPoint {
  month: string;
  income_vnd: number;
  expense_vnd: number;
  net_cashflow_vnd: number;
  forecast_net_vnd: number;
}

export interface ExpenseCategoryBreakdown {
  category: string;
  amount_vnd: number;
  count: number;
}

export interface FinanceStaffRef {
  id: string;
  full_name: string;
  email: string;
  role: string;
}

export interface FinanceLeadRef {
  id: string;
  name: string;
  phone?: string | null;
  email?: string | null;
  total_revenue_vnd: number;
}

export interface FinanceBranchRef {
  id: string;
  code: string;
  name: string;
  legal_entity_name?: string | null;
  tax_code?: string | null;
  address?: string | null;
  is_headquarters?: boolean;
}

export interface FinanceDashboardResponse {
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
    expenses_count?: number;
    pending_expenses_vnd?: number;
    approved_expenses_vnd?: number;
    invoices_count?: number;
    receivables_vnd?: number;
    payables_vnd?: number;
  };
  monthly_cashflow?: MonthlyCashflowPoint[];
  expense_breakdown?: ExpenseCategoryBreakdown[];
  legal_entity: LegalEntityInfo;
  branches?: FinanceBranchRef[];
  staff?: FinanceStaffRef[];
  leads: FinanceLeadRef[];
}

export interface VietQrResponse {
  legal_entity: LegalEntityInfo;
  amount_vnd: number;
  transfer_note: string;
  qr_image_url: string;
}

export interface B2bCompanyRecord {
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

export interface DealRecord {
  id: string;
  deal_code: string;
  title: string;
  company_id?: string | null;
  company_name?: string | null;
  lead_id?: string | null;
  lead_name?: string | null;
  stage: string;
  amount_vnd: number;
  probability: number;
  expected_close_date?: string | null;
}

export interface CommercialLineItem {
  id?: string;
  product_id?: string | null;
  sku: string;
  name: string;
  description?: string;
  unit?: string;
  qty: number;
  ordered_qty?: number;
  received_qty?: number;
  invoiced_qty?: number;
  fulfilled_qty?: number;
  unit_price_vnd: number;
  discount_pct: number;
  tax_pct: number;
  line_subtotal_vnd?: number;
  line_discount_vnd?: number;
  line_tax_vnd?: number;
  line_total_vnd: number;
  match_note?: string | null;
}

export interface QuoteRecord {
  id: string;
  quote_code: string;
  title: string;
  company_id?: string | null;
  company_name?: string | null;
  lead_id?: string | null;
  lead_name?: string | null;
  deal_id?: string | null;
  deal_title?: string | null;
  customer_name?: string | null;
  customer_email?: string | null;
  customer_phone?: string | null;
  status: string;
  subtotal_vnd: number;
  discount_vnd: number;
  tax_vnd: number;
  shipping_fee_vnd: number;
  total_vnd: number;
  valid_until?: string | null;
  terms_text?: string | null;
  notes?: string | null;
  converted_order_id?: string | null;
  items: CommercialLineItem[];
  created_at: string;
}

export interface SalesOrderRecord {
  id: string;
  order_code: string;
  quote_id?: string | null;
  company_id?: string | null;
  company_name?: string | null;
  lead_id?: string | null;
  lead_name?: string | null;
  customer_name: string;
  status: string;
  payment_status: string;
  fulfillment_status: string;
  subtotal_vnd: number;
  discount_vnd?: number;
  tax_vnd?: number;
  shipping_fee_vnd?: number;
  total_vnd: number;
  paid_vnd: number;
  cogs_vnd: number;
  voucher_code?: string | null;
  payment_method?: string;
  notes?: string | null;
  items: CommercialLineItem[];
  created_at: string;
}

export interface InvoiceRecord {
  id: string;
  invoice_code: string;
  invoice_type: 'sales' | 'purchase';
  sales_order_id?: string | null;
  purchase_order_id?: string | null;
  company_id?: string | null;
  lead_id?: string | null;
  supplier_id?: string | null;
  customer_name: string;
  customer_tax_code?: string | null;
  customer_address?: string | null;
  customer_email?: string | null;
  status: string;
  issue_date: string;
  due_date?: string | null;
  subtotal_vnd: number;
  discount_vnd: number;
  tax_vnd: number;
  shipping_fee_vnd: number;
  total_vnd: number;
  paid_vnd: number;
  payment_method: string;
  vat_invoice_no?: string | null;
  vat_serial?: string | null;
  notes?: string | null;
  items: CommercialLineItem[];
  vietqr_url?: string;
  created_at: string;
}

export interface PurchaseOrderRecord {
  id: string;
  po_code: string;
  supplier_id?: string | null;
  warehouse_id?: string | null;
  supplier_name: string;
  status: string;
  payment_status?: string;
  three_way_match_status?: string;
  subtotal_vnd?: number;
  discount_vnd?: number;
  tax_vnd?: number;
  shipping_fee_vnd?: number;
  total_vnd: number;
  paid_vnd?: number;
  expected_date?: string | null;
  received_at?: string | null;
  notes?: string | null;
  items: CommercialLineItem[];
  created_at: string;
}

export interface DepositMilestoneRecord {
  id: string;
  tranche_no: number;
  name: string;
  amount_vnd: number;
  expected_pay_date?: string | null;
  paid_at?: string | null;
  status: 'pending' | 'submitted' | 'confirmed' | 'overdue' | 'refunded' | 'rejected' | string;
  payment_method?: string;
  unc_url?: string | null;
  reference_no?: string | null;
  confirmed_by_name?: string | null;
  note?: string | null;
}

export interface CommissionShareEntry {
  user_id: string;
  user_name: string;
  share_pct: number;
  amount_vnd: number;
}

export interface AuditHistoryEntry {
  id: string;
  action: string;
  actor_name: string;
  note: string;
  created_at: string;
}

export interface DepositRecord {
  id: string;
  deposit_code: string;
  lead_id?: string | null;
  lead_name?: string | null;
  company_id?: string | null;
  company_name?: string | null;
  project_id?: string | null;
  project_name?: string | null;
  unit_code?: string | null;
  customer_name: string;
  amount_vnd: number;
  contract_value_vnd: number;
  expected_commission_vnd: number;
  refunded_amount_vnd?: number;
  refund_reason?: string | null;
  currency?: string;
  exchange_rate?: number;
  payment_method: string;
  status: string;
  reference_no?: string | null;
  unc_attachment_url?: string | null;
  notes?: string | null;
  milestones: DepositMilestoneRecord[];
  confirmed_milestones_vnd?: number;
  commission_shares: CommissionShareEntry[];
  watchers: string[];
  history: AuditHistoryEntry[];
  vietqr_url?: string;
  legal_entity?: LegalEntityInfo;
  created_at: string;
}

export interface ExpenseLineItem {
  id: string;
  content: string;
  qty: number;
  unit_price_vnd: number;
  vat_pct: number;
  line_total_vnd: number;
}

export interface ExpenseRecord {
  id: string;
  expense_code: string;
  title: string;
  category: string;
  vendor_name?: string | null;
  vendor_tax_code?: string | null;
  requester_name?: string | null;
  approver_user_id?: string | null;
  approval_status: string;
  has_vat_invoice: boolean;
  is_vat_inclusive: boolean;
  vat_invoice_no?: string | null;
  currency: string;
  subtotal_vnd: number;
  vat_amount_vnd: number;
  total_amount_vnd: number;
  payment_method: string;
  bank_name?: string | null;
  bank_bin?: string | null;
  bank_account_no?: string | null;
  bank_account_holder?: string | null;
  expense_date: string;
  due_date?: string | null;
  paid_at?: string | null;
  refund_status: string;
  refund_amount_vnd: number;
  refund_attachment_url?: string | null;
  line_items: ExpenseLineItem[];
  watchers: string[];
  history: AuditHistoryEntry[];
  notes?: string | null;
  payout_vietqr_url?: string | null;
  created_at: string;
}

export interface FinanceTransactionRecord {
  id: string;
  tx_code: string;
  tx_type: 'income' | 'expense';
  category: string;
  amount_vnd: number;
  payment_method: string;
  status: string;
  counterparty_name?: string | null;
  tx_date: string;
  description?: string | null;
}

export interface ProductRecord {
  id: string;
  sku: string;
  barcode?: string | null;
  name: string;
  category: string;
  unit: string;
  product_type: 'goods' | 'service' | 'bundle';
  sale_price_vnd: number;
  default_cost_vnd: number;
  tax_rate_pct: number;
  cached_stock_qty: number;
  min_stock_alert: number;
}

export interface SupplierRecord {
  id: string;
  code: string;
  name: string;
  tax_code?: string | null;
  contact_name?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  payment_terms?: string | null;
  rating: number;
  prestige_tier?: string;
  cooperation_status?: string;
  website?: string | null;
  bank_name?: string | null;
  bank_account_no?: string | null;
  bank_account_holder?: string | null;
  notes?: string | null;
  po_count?: number;
  total_po_vnd?: number;
  purchase_orders?: PurchaseOrderRecord[];
  batches?: InventoryBatchRecord[];
  invoices?: InvoiceRecord[];
}

export interface WarehouseRecord {
  id: string;
  code: string;
  name: string;
  address?: string | null;
  is_default: boolean;
}

export interface InventoryBatchRecord {
  id: string;
  batch_code: string;
  product_id: string;
  product_name: string;
  product_sku: string;
  warehouse_id?: string | null;
  warehouse_name?: string | null;
  supplier_name?: string | null;
  initial_qty: number;
  remaining_qty: number;
  unit_cost_vnd: number;
  received_at: string;
  expiry_date?: string | null;
  status: string;
}

export interface StockMovementRecord {
  id: string;
  product_name: string;
  product_sku: string;
  batch_code?: string | null;
  warehouse_name?: string | null;
  movement_type: string;
  qty_delta: number;
  unit_cost_vnd: number;
  total_cost_vnd: number;
  note?: string | null;
  created_at: string;
}

export interface PosSessionRecord {
  id: string;
  session_code: string;
  cashier_name?: string | null;
  status: 'open' | 'closed';
  opening_cash_vnd: number;
  cash_sales_vnd: number;
  bank_sales_vnd: number;
  expected_closing_cash_vnd: number;
  actual_closing_cash_vnd: number;
  variance_vnd: number;
  orders_count: number;
  opened_at: string;
  closed_at?: string | null;
}

export interface InventorySyncMapping {
  sheet_column: string;
  system_field: string;
  custom_label?: string;
}

export interface InventorySyncSheetRecord {
  id: string;
  sheet_name: string;
  spreadsheet_id: string;
  webhook_token: string;
  sync_interval_minutes: number;
  is_active: boolean;
  sync_status: string;
  last_sync_at?: string | null;
  mappings: InventorySyncMapping[];
}

export interface FixedAssetRecord {
  id: string;
  asset_code: string;
  name: string;
  category: string;
  purchase_date: string;
  purchase_cost_vnd: number;
  useful_life_months: number;
  monthly_depreciation_vnd: number;
  accumulated_depreciation_vnd: number;
  net_book_value_vnd: number;
  depreciation_pct: number;
  status: string;
}

export const TAX_RATE_OPTIONS = [0, 5, 8, 10] as const;

export const EXPENSE_CATEGORIES = [
  { value: 'operating_expense', label: 'Vận hành chung', color: '#1E40FF' },
  { value: 'marketing', label: 'Marketing & Quảng cáo', color: '#7C3AED' },
  { value: 'travel', label: 'Vận chuyển & Công tác', color: '#0284C7' },
  { value: 'client_meeting', label: 'Tiếp khách & Đối ngoại', color: '#D97706' },
  { value: 'stationery', label: 'Văn phòng phẩm & Thiết bị', color: '#059669' },
  { value: 'hr', label: 'Nhân sự & Phúc lợi', color: '#DB2777' },
  { value: 'inventory_procurement', label: 'Mua hàng & Nhập kho', color: '#475569' },
] as const;

export const VIETNAM_POPULAR_BANKS = [
  { bin: '970436', shortName: 'Vietcombank' },
  { bin: '970407', shortName: 'Techcombank' },
  { bin: '970422', shortName: 'MBBank' },
  { bin: '970415', shortName: 'VietinBank' },
  { bin: '970418', shortName: 'BIDV' },
  { bin: '970416', shortName: 'ACB' },
  { bin: '970432', shortName: 'VPBank' },
  { bin: '970423', shortName: 'TPBank' },
] as const;

export function resolveFinanceSubViewFromPath(pathname: string): {
  subView: FinanceSubViewKey;
  isDedicatedRoute: boolean;
} {
  const clean = pathname.replace(/\/+$/, '') || '/erp/finance';
  switch (clean) {
    case '/cash-flow':
      return { subView: 'cash_flow', isDedicatedRoute: true };
    case '/quotes':
      return { subView: 'quotes', isDedicatedRoute: true };
    case '/sales-orders':
      return { subView: 'sales_orders', isDedicatedRoute: true };
    case '/deposits':
      return { subView: 'deposits', isDedicatedRoute: true };
    case '/invoices':
      return { subView: 'invoices', isDedicatedRoute: true };
    case '/expenses':
      return { subView: 'expenses', isDedicatedRoute: true };
    case '/products':
      return { subView: 'products', isDedicatedRoute: true };
    case '/suppliers':
      return { subView: 'suppliers', isDedicatedRoute: true };
    case '/inventory':
      return { subView: 'inventory', isDedicatedRoute: true };
    case '/purchase-orders':
      return { subView: 'purchase_orders', isDedicatedRoute: true };
    default:
      return { subView: 'dashboard', isDedicatedRoute: false };
  }
}

const VI_DIGITS = ['không', 'một', 'hai', 'ba', 'bốn', 'năm', 'sáu', 'bảy', 'tám', 'chín'];

function readThreeDigits(num: number, full: boolean): string {
  const tram = Math.floor(num / 100);
  const chuc = Math.floor((num % 100) / 10);
  const donvi = num % 10;
  let res = '';
  if (tram > 0 || full) {
    res += `${VI_DIGITS[tram]} trăm `;
  }
  if (chuc > 1) {
    res += `${VI_DIGITS[chuc]} mươi `;
    if (donvi === 1) res += 'mốt ';
    else if (donvi === 5) res += 'lăm ';
    else if (donvi > 0) res += `${VI_DIGITS[donvi]} `;
  } else if (chuc === 1) {
    res += 'mười ';
    if (donvi === 5) res += 'lăm ';
    else if (donvi > 0) res += `${VI_DIGITS[donvi]} `;
  } else if (chuc === 0 && donvi > 0) {
    if (tram > 0 || full) res += 'lẻ ';
    res += `${VI_DIGITS[donvi]} `;
  }
  return res.trim();
}

export function numberToVietnameseWords(amount: number): string {
  const n = Math.round(Math.abs(amount || 0));
  if (n === 0) return 'Không đồng';
  const units = ['', 'nghìn', 'triệu', 'tỷ', 'nghìn tỷ'];
  const groups: number[] = [];
  let rem = n;
  while (rem > 0) {
    groups.push(rem % 1000);
    rem = Math.floor(rem / 1000);
  }
  const parts: string[] = [];
  for (let i = groups.length - 1; i >= 0; i--) {
    const g = groups[i];
    if (g === 0) continue;
    const isFull = i < groups.length - 1;
    const text = readThreeDigits(g, isFull);
    parts.push(`${text} ${units[i]}`.trim());
  }
  const joined = parts.join(' ').replace(/\s+/g, ' ').trim();
  return joined.charAt(0).toUpperCase() + joined.slice(1) + ' đồng chẵn';
}
