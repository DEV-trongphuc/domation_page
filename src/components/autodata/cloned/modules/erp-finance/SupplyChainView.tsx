import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import {
  ArrowLeftRight,
  Boxes,
  Eye,
  FileSpreadsheet,
  MonitorSmartphone,
  Package,
  Plus,
  Truck,
  X,
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
import { DrawerSkeleton } from '../../components/ui/Skeleton';
import { apiRequest, formatShortDate, formatVnd, getErrorMessage } from '../../../autodataApi';
import { useAuth } from '../../contexts/AuthContext';
import type {
  FixedAssetRecord,
  InventoryBatchRecord,
  ProductRecord,
  StockMovementRecord,
  SupplierRecord,
  WarehouseRecord,
} from './financeTypes';

interface SupplyChainViewProps {
  activeSubTab: 'products' | 'suppliers' | 'inventory';
  products: ProductRecord[];
  suppliers: SupplierRecord[];
  warehouses: WarehouseRecord[];
  batches: InventoryBatchRecord[];
  movements: StockMovementRecord[];
  assets: FixedAssetRecord[];
  canCreate: boolean;
  canEdit: boolean;
  onOpenPos: () => void;
  onOpenSyncSheets: () => void;
  onRefresh: () => void;
}

export const SupplyChainView: React.FC<SupplyChainViewProps> = ({
  activeSubTab,
  products,
  suppliers,
  warehouses,
  batches,
  movements,
  assets,
  canCreate,
  canEdit,
  onOpenPos,
  onOpenSyncSheets,
  onRefresh,
}) => {
  const { token, tenantSlug } = useAuth();

  // Create Product Modal
  const [prodModalOpen, setProdModalOpen] = useState(false);
  const [prodSku, setProdSku] = useState('');
  const [prodBarcode, setProdBarcode] = useState('');
  const [prodName, setProdName] = useState('');
  const [prodPrice, setProdPrice] = useState('');
  const [prodCost, setProdCost] = useState('');
  const [prodTax, setProdTax] = useState('8');

  // Create Supplier Modal + Supplier 360 Dossier Drawer
  const [supModalOpen, setSupModalOpen] = useState(false);
  const [supName, setSupName] = useState('');
  const [supTaxCode, setSupTaxCode] = useState('');
  const [supContact, setSupContact] = useState('');
  const [supPhone, setSupPhone] = useState('');
  const [supTier, setSupTier] = useState('A');
  const [supBankName, setSupBankName] = useState('Vietcombank');
  const [supBankAcc, setSupBankAcc] = useState('');

  const [dossierOpen, setDossierOpen] = useState(false);
  const [dossierLoading, setDossierLoading] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<SupplierRecord | null>(null);

  // Batch In / Stock Adjust / Fixed Asset Modals
  const [batchModalOpen, setBatchModalOpen] = useState(false);
  const [batchProdId, setBatchProdId] = useState('');
  const [batchWhId, setBatchWhId] = useState('');
  const [batchSupId, setBatchSupId] = useState('');
  const [batchQty, setBatchQty] = useState('20');
  const [batchCost, setBatchCost] = useState('');

  const [adjustModalOpen, setAdjustModalOpen] = useState(false);
  const [adjustType, setAdjustType] = useState<'ADJUST' | 'TRANSFER'>('ADJUST');
  const [adjustProdId, setAdjustProdId] = useState('');
  const [adjustQty, setAdjustQty] = useState('5');
  const [adjustFromWh, setAdjustFromWh] = useState('');
  const [adjustToWh, setAdjustToWh] = useState('');
  const [adjustNote, setAdjustNote] = useState('');

  const [assetModalOpen, setAssetModalOpen] = useState(false);
  const [assetName, setAssetName] = useState('');
  const [assetCost, setAssetCost] = useState('');
  const [assetMonths, setAssetMonths] = useState('36');

  const openSupplierDossier = async (sup: SupplierRecord) => {
    setDossierOpen(true);
    setDossierLoading(true);
    try {
      const res = await apiRequest<SupplierRecord>(`/inventory/suppliers/${sup.id}`, {
        token,
        tenantSlug,
      });
      setSelectedSupplier(res);
    } catch (err) {
      toast.error(getErrorMessage(err, 'Không thể tải hồ sơ chi tiết Nhà cung cấp.'));
      setSelectedSupplier(sup);
    } finally {
      setDossierLoading(false);
    }
  };

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiRequest('/inventory/products', {
        method: 'POST',
        token,
        tenantSlug,
        body: {
          sku: prodSku || undefined,
          barcode: prodBarcode || undefined,
          name: prodName,
          sale_price_vnd: Number(prodPrice || 0),
          default_cost_vnd: Number(prodCost || 0),
          tax_rate_pct: Number(prodTax || 0),
        },
      });
      toast.success('Đã tạo mã SKU sản phẩm mới!');
      setProdModalOpen(false);
      setProdSku('');
      setProdBarcode('');
      setProdName('');
      setProdPrice('');
      setProdCost('');
      onRefresh();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Không thể tạo sản phẩm mới.'));
    }
  };

  const handleCreateSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiRequest('/inventory/suppliers', {
        method: 'POST',
        token,
        tenantSlug,
        body: {
          name: supName,
          tax_code: supTaxCode || null,
          contact_name: supContact || null,
          phone: supPhone || null,
          prestige_tier: supTier,
          bank_name: supBankName || null,
          bank_account_no: supBankAcc || null,
        },
      });
      toast.success('Đã thêm Hồ sơ Nhà cung cấp!');
      setSupModalOpen(false);
      setSupName('');
      setSupTaxCode('');
      setSupPhone('');
      onRefresh();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Không thể tạo Nhà cung cấp.'));
    }
  };

  const handleCreateBatch = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiRequest('/inventory/batches', {
        method: 'POST',
        token,
        tenantSlug,
        body: {
          product_id: batchProdId,
          warehouse_id: batchWhId || null,
          supplier_id: batchSupId || null,
          initial_qty: Number(batchQty || 0),
          unit_cost_vnd: Number(batchCost || 0),
        },
      });
      toast.success('Đã nhập lô hàng FIFO mới vào kho!');
      setBatchModalOpen(false);
      onRefresh();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Không thể nhập lô hàng FIFO.'));
    }
  };

  const handleStockAdjust = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiRequest('/inventory/stock-adjust', {
        method: 'POST',
        token,
        tenantSlug,
        body: {
          product_id: adjustProdId,
          action_type: adjustType,
          qty: Number(adjustQty || 0),
          from_warehouse_id: adjustFromWh || null,
          to_warehouse_id: adjustToWh || null,
          warehouse_id: adjustFromWh || null,
          note: adjustNote || undefined,
        },
      });
      toast.success(
        adjustType === 'TRANSFER'
          ? 'Đã điều chuyển lô hàng giữa các kho!'
          : 'Đã ghi nhận biên bản kiểm kê điều chỉnh kho!'
      );
      setAdjustModalOpen(false);
      onRefresh();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Không thể điều chỉnh kiểm kê kho.'));
    }
  };

  const handleCreateAsset = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiRequest('/inventory/assets', {
        method: 'POST',
        token,
        tenantSlug,
        body: {
          name: assetName,
          purchase_cost_vnd: Number(assetCost || 0),
          useful_life_months: Number(assetMonths || 36),
        },
      });
      toast.success('Đã ghi tăng Tài sản cố định & tính khấu hao đường thẳng!');
      setAssetModalOpen(false);
      setAssetName('');
      setAssetCost('');
      onRefresh();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Không thể ghi tăng Tài sản cố định.'));
    }
  };

  const productCols: Array<TableColumn<ProductRecord>> = [
    {
      key: 'sku',
      header: 'SKU / Barcode',
      render: (p) => (
        <div>
          <strong style={{ color: '#1E40FF' }}>{p.sku}</strong>
          <div style={{ fontSize: '0.72rem', color: '#64748B' }}>{p.barcode || p.category}</div>
        </div>
      ),
    },
    {
      key: 'name',
      header: 'Tên Sản phẩm / Dịch vụ',
      render: (p) => (
        <div>
          <div style={{ fontWeight: 700, color: '#0F172A' }}>{p.name}</div>
          <div style={{ fontSize: '0.73rem', color: '#64748B' }}>
            ĐVT: {p.unit} • VAT mặc định: {p.tax_rate_pct}%
          </div>
        </div>
      ),
    },
    {
      key: 'price',
      header: 'Giá bán / Giá vốn',
      align: 'right',
      render: (p) => (
        <div>
          <strong>{formatVnd(p.sale_price_vnd)}</strong>
          <div style={{ fontSize: '0.72rem', color: '#64748B' }}>Vốn: {formatVnd(p.default_cost_vnd)}</div>
        </div>
      ),
    },
    {
      key: 'stock',
      header: 'Tồn kho FIFO',
      align: 'right',
      render: (p) => (
        <Badge tone={p.cached_stock_qty <= p.min_stock_alert ? 'danger' : 'success'}>
          {p.cached_stock_qty} {p.unit}
        </Badge>
      ),
    },
  ];

  const supplierCols: Array<TableColumn<SupplierRecord>> = [
    {
      key: 'code',
      header: 'Mã NCC',
      render: (s) => (
        <div>
          <strong style={{ color: '#1E40FF' }}>{s.code}</strong>
          <div style={{ fontSize: '0.72rem', color: '#64748B' }}>MST: {s.tax_code || '—'}</div>
        </div>
      ),
    },
    {
      key: 'name',
      header: 'Nhà cung cấp & Liên hệ',
      render: (s) => (
        <div>
          <div style={{ fontWeight: 700, color: '#0F172A' }}>{s.name}</div>
          <div style={{ fontSize: '0.73rem', color: '#64748B' }}>
            {s.contact_name || '—'} • {s.phone || '—'} • Công nợ: {s.payment_terms || 'Net 30'}
          </div>
        </div>
      ),
    },
    {
      key: 'tier',
      header: 'Hạng Uy tín',
      render: (s) => (
        <Badge tone={s.prestige_tier === 'A' ? 'success' : 'info'}>
          Hạng {s.prestige_tier || 'A'} ({s.cooperation_status || 'active'})
        </Badge>
      ),
    },
    {
      key: 'po',
      header: 'Tổng mua (PO)',
      align: 'right',
      render: (s) => (
        <div>
          <strong>{formatVnd(s.total_po_vnd || 0)}</strong>
          <div style={{ fontSize: '0.72rem', color: '#64748B' }}>{s.po_count || 0} đơn PO</div>
        </div>
      ),
    },
    {
      key: 'actions',
      header: 'Hồ sơ 360°',
      align: 'right',
      render: (s) => (
        <button
          type="button"
          className="btn secondary"
          onClick={() => void openSupplierDossier(s)}
          style={{ height: 34, color: '#1E40FF', display: 'inline-flex', alignItems: 'center', gap: 5 }}
        >
          <Eye size={14} /> Hồ sơ NCC
        </button>
      ),
    },
  ];

  const batchCols: Array<TableColumn<InventoryBatchRecord>> = [
    {
      key: 'batch',
      header: 'Mã Lô FIFO',
      render: (b) => (
        <div>
          <strong style={{ color: '#1E40FF' }}>{b.batch_code}</strong>
          <div style={{ fontSize: '0.72rem', color: '#64748B' }}>Nhập: {formatShortDate(b.received_at)}</div>
        </div>
      ),
    },
    {
      key: 'prod',
      header: 'Sản phẩm & Kho lưu trữ',
      render: (b) => (
        <div>
          <div style={{ fontWeight: 700 }}>{b.product_name}</div>
          <div style={{ fontSize: '0.72rem', color: '#64748B' }}>
            {b.product_sku} • {b.warehouse_name || 'Kho mặc định'}
          </div>
        </div>
      ),
    },
    {
      key: 'qty',
      header: 'Còn lại / Ban đầu',
      align: 'right',
      render: (b) => (
        <strong>
          {b.remaining_qty} / {b.initial_qty}
        </strong>
      ),
    },
    {
      key: 'cost',
      header: 'Giá vốn Lô',
      align: 'right',
      render: (b) => <span>{formatVnd(b.unit_cost_vnd)}</span>,
    },
    {
      key: 'status',
      header: 'Trạng thái',
      render: (b) => (
        <Badge tone={b.status === 'active' ? 'success' : 'neutral'}>{b.status}</Badge>
      ),
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {activeSubTab === 'products' && (
        <Card
          title="Danh Mục Sản Phẩm, Dịch Vụ & Mã Barcode / SKU"
          subtitle="Quản lý bảng giá bán, giá vốn chuẩn, định mức tồn kho tối thiểu và quét POS nhanh"
          actions={
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button
                type="button"
                className="btn secondary"
                onClick={onOpenPos}
                style={{ height: 40, color: '#1E40FF', display: 'inline-flex', alignItems: 'center', gap: 6 }}
              >
                <MonitorSmartphone size={15} /> Mở Quầy Bán Lẻ POS
              </button>
              {canCreate && (
                <button
                  type="button"
                  className="btn primary"
                  onClick={() => setProdModalOpen(true)}
                  style={{ height: 40, background: '#1E40FF', display: 'inline-flex', alignItems: 'center', gap: 6 }}
                >
                  <Package size={15} /> <Plus size={14} /> Thêm Sản Phẩm / SKU
                </button>
              )}
            </div>
          }
        >
          {products.length === 0 ? (
            <EmptyState
              title="Chưa có sản phẩm nào trong danh mục"
              description="Thêm SKU hàng hóa hoặc dịch vụ để sử dụng trên Báo giá, Đơn bán SO và Quầy POS."
            />
          ) : (
            <Table columns={productCols} rows={products} rowKey={(p) => p.id} />
          )}
        </Card>
      )}

      {activeSubTab === 'suppliers' && (
        <Card
          title="Danh Bạ & Hồ Sơ Nhà Cung Cấp 360° (Suppliers Dossier)"
          subtitle="Đánh giá hạng uy tín A/B/C, điều khoản thanh toán, tài khoản ngân hàng và lịch sử nhập lô PO"
          actions={
            canCreate && (
              <button
                type="button"
                className="btn primary"
                onClick={() => setSupModalOpen(true)}
                style={{ height: 40, background: '#1E40FF', display: 'inline-flex', alignItems: 'center', gap: 6 }}
              >
                <Truck size={15} /> <Plus size={14} /> Thêm Nhà Cung Cấp
              </button>
            )
          }
        >
          {suppliers.length === 0 ? (
            <EmptyState
              title="Chưa có Nhà cung cấp nào"
              description="Tạo hồ sơ Nhà cung cấp để lập Đơn mua hàng (PO) và đối chiếu công nợ đầu vào."
            />
          ) : (
            <Table columns={supplierCols} rows={suppliers} rowKey={(s) => s.id} />
          )}
        </Card>
      )}

      {activeSubTab === 'inventory' && (
        <>
          <Card
            title="Quản Trị Tồn Kho Đa Chi Nhánh Theo Lô FIFO (Oldest-Batch-First)"
            subtitle="Tự động xuất lô cũ trước, đối soát kiểm kê tăng/giảm, điều chuyển nội bộ và đồng bộ Google Sheets"
            actions={
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <button
                  type="button"
                  className="btn secondary"
                  onClick={onOpenSyncSheets}
                  style={{ height: 40, color: '#059669', display: 'inline-flex', alignItems: 'center', gap: 5 }}
                >
                  <FileSpreadsheet size={15} /> Đồng bộ Google Sheets
                </button>
                {canEdit && (
                  <button
                    type="button"
                    className="btn secondary"
                    onClick={() => setAdjustModalOpen(true)}
                    style={{ height: 40, color: '#1E40FF', display: 'inline-flex', alignItems: 'center', gap: 5 }}
                  >
                    <ArrowLeftRight size={15} /> Kiểm kê / Chuyển kho
                  </button>
                )}
                {canCreate && (
                  <button
                    type="button"
                    className="btn primary"
                    onClick={() => setBatchModalOpen(true)}
                    style={{ height: 40, background: '#1E40FF', display: 'inline-flex', alignItems: 'center', gap: 5 }}
                  >
                    <Boxes size={15} /> + Nhập Lô Hàng FIFO
                  </button>
                )}
              </div>
            }
          >
            {batches.length === 0 ? (
              <EmptyState
                title="Chưa có lô hàng FIFO nào trong kho"
                description="Nhập lô trực tiếp, nhận hàng từ Đơn mua PO hoặc đồng bộ từ Google Sheets."
              />
            ) : (
              <Table columns={batchCols} rows={batches} rowKey={(b) => b.id} />
            )}
          </Card>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1rem' }}>
            <Card
              title="Thẻ Kho & Lịch Sử Biến Động Xuất - Nhập - Điều Chỉnh"
              subtitle="Audit trail bất biến theo từng lô hàng FIFO"
            >
              {movements.length === 0 ? (
                <div style={{ fontSize: '0.82rem', color: '#94A3B8' }}>Chưa phát sinh giao dịch kho.</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 300, overflowY: 'auto' }}>
                  {movements.slice(0, 15).map((m) => (
                    <div
                      key={m.id}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        padding: '8px 10px',
                        borderRadius: 10,
                        background: '#F8FAFC',
                        border: '1px solid #E2E8F0',
                        fontSize: '0.8rem',
                      }}
                    >
                      <div>
                        <strong>{m.product_name}</strong> ({m.movement_type})
                        <div style={{ fontSize: '0.72rem', color: '#64748B' }}>
                          {m.batch_code || '—'} • {m.note || ''}
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <strong style={{ color: m.qty_delta >= 0 ? '#059669' : '#DC2626' }}>
                          {m.qty_delta > 0 ? `+${m.qty_delta}` : m.qty_delta}
                        </strong>
                        <div style={{ fontSize: '0.72rem', color: '#64748B' }}>
                          {formatVnd(m.total_cost_vnd)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            <Card
              title="Sổ Tài Sản Cố Định & Khấu Hao Đường Thẳng"
              subtitle="Theo dõi nguyên giá, khấu hao lũy kế và giá trị còn lại (NBV)"
              actions={
                canCreate && (
                  <button
                    type="button"
                    className="btn secondary"
                    style={{ height: 34, color: '#1E40FF' }}
                    onClick={() => setAssetModalOpen(true)}
                  >
                    + Ghi tăng TSCĐ
                  </button>
                )
              }
            >
              {assets.length === 0 ? (
                <div style={{ fontSize: '0.82rem', color: '#94A3B8' }}>Chưa ghi nhận tài sản cố định.</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {assets.map((a) => (
                    <div
                      key={a.id}
                      style={{
                        padding: '8px 10px',
                        borderRadius: 10,
                        border: '1px solid #E2E8F0',
                        fontSize: '0.8rem',
                        display: 'flex',
                        justifyContent: 'space-between',
                      }}
                    >
                      <div>
                        <strong>{a.asset_code} — {a.name}</strong>
                        <div style={{ fontSize: '0.72rem', color: '#64748B' }}>
                          KH tháng: {formatVnd(a.monthly_depreciation_vnd)} ({a.useful_life_months} tháng)
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <strong style={{ color: '#1E40FF' }}>NBV: {formatVnd(a.net_book_value_vnd)}</strong>
                        <div style={{ fontSize: '0.72rem', color: '#64748B' }}>
                          Nguyên giá: {formatVnd(a.purchase_cost_vnd)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>
        </>
      )}

      {/* Create Product Modal */}
      <CustomModal isOpen={prodModalOpen} onClose={() => setProdModalOpen(false)} title="Thêm Sản Phẩm / Dịch Vụ Mới" width="540px">
        <form onSubmit={handleCreateProduct} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <label className="form-label">Mã SKU</label>
              <input className="form-input" style={{ height: 42 }} value={prodSku} onChange={(e) => setProdSku(e.target.value)} placeholder="Tự sinh nếu để trống" />
            </div>
            <div>
              <label className="form-label">Barcode Quét POS</label>
              <input className="form-input" style={{ height: 42 }} value={prodBarcode} onChange={(e) => setProdBarcode(e.target.value)} placeholder="893..." />
            </div>
          </div>
          <div>
            <label className="form-label">Tên sản phẩm / dịch vụ *</label>
            <input className="form-input" style={{ height: 42 }} value={prodName} onChange={(e) => setProdName(e.target.value)} required />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 0.7fr', gap: 10 }}>
            <div>
              <label className="form-label">Giá bán (VNĐ)</label>
              <input type="number" min={0} className="form-input" style={{ height: 42 }} value={prodPrice} onChange={(e) => setProdPrice(e.target.value)} required />
            </div>
            <div>
              <label className="form-label">Giá vốn chuẩn (VNĐ)</label>
              <input type="number" min={0} className="form-input" style={{ height: 42 }} value={prodCost} onChange={(e) => setProdCost(e.target.value)} />
            </div>
            <div>
              <label className="form-label">Thuế VAT (%)</label>
              <select className="form-input" style={{ height: 42 }} value={prodTax} onChange={(e) => setProdTax(e.target.value)}>
                <option value="0">0%</option>
                <option value="5">5%</option>
                <option value="8">8%</option>
                <option value="10">10%</option>
              </select>
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <button type="button" className="btn secondary" style={{ height: 42 }} onClick={() => setProdModalOpen(false)}>Hủy</button>
            <button type="submit" className="btn primary" style={{ height: 42, background: '#1E40FF' }}>Lưu Sản phẩm</button>
          </div>
        </form>
      </CustomModal>

      {/* Create Supplier Modal */}
      <CustomModal isOpen={supModalOpen} onClose={() => setSupModalOpen(false)} title="Thêm Hồ Sơ Nhà Cung Cấp" width="560px">
        <form onSubmit={handleCreateSupplier} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div>
            <label className="form-label">Tên Pháp nhân Nhà cung cấp *</label>
            <input className="form-input" style={{ height: 42 }} value={supName} onChange={(e) => setSupName(e.target.value)} required />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 0.7fr', gap: 10 }}>
            <div>
              <label className="form-label">Mã số thuế</label>
              <input className="form-input" style={{ height: 42 }} value={supTaxCode} onChange={(e) => setSupTaxCode(e.target.value)} />
            </div>
            <div>
              <label className="form-label">Hạng uy tín</label>
              <select className="form-input" style={{ height: 42 }} value={supTier} onChange={(e) => setSupTier(e.target.value)}>
                <option value="A">Hạng A (Chiến lược)</option>
                <option value="B">Hạng B (Tiêu chuẩn)</option>
                <option value="C">Hạng C (Thử nghiệm)</option>
              </select>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <label className="form-label">Người liên hệ</label>
              <input className="form-input" style={{ height: 42 }} value={supContact} onChange={(e) => setSupContact(e.target.value)} />
            </div>
            <div>
              <label className="form-label">Số điện thoại</label>
              <input className="form-input" style={{ height: 42 }} value={supPhone} onChange={(e) => setSupPhone(e.target.value)} />
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <label className="form-label">Ngân hàng thụ hưởng</label>
              <input className="form-input" style={{ height: 42 }} value={supBankName} onChange={(e) => setSupBankName(e.target.value)} />
            </div>
            <div>
              <label className="form-label">Số tài khoản</label>
              <input className="form-input" style={{ height: 42 }} value={supBankAcc} onChange={(e) => setSupBankAcc(e.target.value)} />
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <button type="button" className="btn secondary" style={{ height: 42 }} onClick={() => setSupModalOpen(false)}>Hủy</button>
            <button type="submit" className="btn primary" style={{ height: 42, background: '#1E40FF' }}>Lưu Nhà cung cấp</button>
          </div>
        </form>
      </CustomModal>

      {/* Batch Inbound Modal */}
      <CustomModal isOpen={batchModalOpen} onClose={() => setBatchModalOpen(false)} title="Nhập Lô Hàng FIFO Trực Tiếp" width="520px">
        <form onSubmit={handleCreateBatch} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div>
            <label className="form-label">Chọn Sản phẩm *</label>
            <select className="form-input" style={{ height: 42 }} value={batchProdId} onChange={(e) => setBatchProdId(e.target.value)} required>
              <option value="">-- Chọn SKU --</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>{p.sku} — {p.name}</option>
              ))}
            </select>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <label className="form-label">Kho lưu trữ</label>
              <select className="form-input" style={{ height: 42 }} value={batchWhId} onChange={(e) => setBatchWhId(e.target.value)}>
                <option value="">Kho mặc định</option>
                {warehouses.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
              </select>
            </div>
            <div>
              <label className="form-label">Nhà cung cấp</label>
              <select className="form-input" style={{ height: 42 }} value={batchSupId} onChange={(e) => setBatchSupId(e.target.value)}>
                <option value="">-- Không chọn --</option>
                {suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <label className="form-label">Số lượng nhập *</label>
              <input type="number" min={1} className="form-input" style={{ height: 42 }} value={batchQty} onChange={(e) => setBatchQty(e.target.value)} required />
            </div>
            <div>
              <label className="form-label">Đơn giá vốn nhập (VNĐ) *</label>
              <input type="number" min={0} className="form-input" style={{ height: 42 }} value={batchCost} onChange={(e) => setBatchCost(e.target.value)} required />
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <button type="button" className="btn secondary" style={{ height: 42 }} onClick={() => setBatchModalOpen(false)}>Hủy</button>
            <button type="submit" className="btn primary" style={{ height: 42, background: '#1E40FF' }}>Nhập Lô FIFO</button>
          </div>
        </form>
      </CustomModal>

      {/* Stock Adjust / Warehouse Transfer Modal */}
      <CustomModal isOpen={adjustModalOpen} onClose={() => setAdjustModalOpen(false)} title="Kiểm Kê Điều Chỉnh & Điều Chuyển Kho Nội Bộ" width="540px">
        <form onSubmit={handleStockAdjust} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <label className="form-label">Nghiệp vụ kho</label>
              <select className="form-input" style={{ height: 42 }} value={adjustType} onChange={(e) => setAdjustType(e.target.value as 'ADJUST' | 'TRANSFER')}>
                <option value="ADJUST">Kiểm kê Tăng / Giảm (+/-)</option>
                <option value="TRANSFER">Điều chuyển giữa 2 Kho</option>
              </select>
            </div>
            <div>
              <label className="form-label">Số lượng ({adjustType === 'ADJUST' ? 'âm để giảm' : '> 0'})</label>
              <input type="number" className="form-input" style={{ height: 42 }} value={adjustQty} onChange={(e) => setAdjustQty(e.target.value)} required />
            </div>
          </div>
          <div>
            <label className="form-label">Sản phẩm *</label>
            <select className="form-input" style={{ height: 42 }} value={adjustProdId} onChange={(e) => setAdjustProdId(e.target.value)} required>
              <option value="">-- Chọn SKU --</option>
              {products.map((p) => <option key={p.id} value={p.id}>{p.sku} — {p.name} (Tồn: {p.cached_stock_qty})</option>)}
            </select>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: adjustType === 'TRANSFER' ? '1fr 1fr' : '1fr', gap: 10 }}>
            <div>
              <label className="form-label">{adjustType === 'TRANSFER' ? 'Kho xuất đi' : 'Kho áp dụng'}</label>
              <select className="form-input" style={{ height: 42 }} value={adjustFromWh} onChange={(e) => setAdjustFromWh(e.target.value)}>
                <option value="">Kho mặc định</option>
                {warehouses.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
              </select>
            </div>
            {adjustType === 'TRANSFER' && (
              <div>
                <label className="form-label">Kho nhận đến *</label>
                <select className="form-input" style={{ height: 42 }} value={adjustToWh} onChange={(e) => setAdjustToWh(e.target.value)} required>
                  <option value="">-- Chọn kho đích --</option>
                  {warehouses.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
                </select>
              </div>
            )}
          </div>
          <div>
            <label className="form-label">Lý do kiểm kê / điều chuyển</label>
            <input className="form-input" style={{ height: 42 }} value={adjustNote} onChange={(e) => setAdjustNote(e.target.value)} placeholder="VD: Kiểm kê định kỳ cuối tháng" />
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <button type="button" className="btn secondary" style={{ height: 42 }} onClick={() => setAdjustModalOpen(false)}>Hủy</button>
            <button type="submit" className="btn primary" style={{ height: 42, background: '#1E40FF' }}>Thực thi</button>
          </div>
        </form>
      </CustomModal>

      {/* Fixed Asset Modal */}
      <CustomModal isOpen={assetModalOpen} onClose={() => setAssetModalOpen(false)} title="Ghi Tăng Tài Sản Cố Định" width="480px">
        <form onSubmit={handleCreateAsset} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div>
            <label className="form-label">Tên tài sản cố định *</label>
            <input className="form-input" style={{ height: 42 }} value={assetName} onChange={(e) => setAssetName(e.target.value)} required />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <label className="form-label">Nguyên giá (VNĐ) *</label>
              <input type="number" min={1} className="form-input" style={{ height: 42 }} value={assetCost} onChange={(e) => setAssetCost(e.target.value)} required />
            </div>
            <div>
              <label className="form-label">Số tháng khấu hao</label>
              <input type="number" min={1} className="form-input" style={{ height: 42 }} value={assetMonths} onChange={(e) => setAssetMonths(e.target.value)} required />
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <button type="button" className="btn secondary" style={{ height: 42 }} onClick={() => setAssetModalOpen(false)}>Hủy</button>
            <button type="submit" className="btn primary" style={{ height: 42, background: '#1E40FF' }}>Ghi tăng</button>
          </div>
        </form>
      </CustomModal>

      {/* Supplier 360 Slide-Over Dossier */}
      {dossierOpen &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            onClick={() => setDossierOpen(false)}
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 1200,
              background: 'rgba(15, 23, 42, 0.42)',
              display: 'flex',
              justifyContent: 'flex-end',
            }}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                width: 'min(680px, 100vw)',
                height: '100%',
                background: '#FFFFFF',
                boxShadow: '-12px 0 36px rgba(15, 23, 42, 0.16)',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              {dossierLoading ? (
                <DrawerSkeleton />
              ) : selectedSupplier ? (
                <div style={{ padding: '1.25rem 1.4rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #E2E8F0', paddingBottom: 12 }}>
                    <div>
                      <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800 }}>
                        {selectedSupplier.code} — {selectedSupplier.name}
                      </h3>
                      <div style={{ fontSize: '0.76rem', color: '#64748B' }}>
                        MST: {selectedSupplier.tax_code || '—'} • Hạng uy tín: {selectedSupplier.prestige_tier || 'A'}
                      </div>
                    </div>
                    <button type="button" onClick={() => setDossierOpen(false)} style={{ border: '1px solid #E2E8F0', background: '#FFFFFF', borderRadius: 10, width: 36, height: 36, cursor: 'pointer' }}>
                      <X size={16} />
                    </button>
                  </div>

                  <div style={{ padding: '0.9rem', borderRadius: 12, background: '#F8FAFF', border: '1px solid #DBEAFE', fontSize: '0.82rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                    <div>Người liên hệ: <strong>{selectedSupplier.contact_name || '—'}</strong></div>
                    <div>Điện thoại: <strong>{selectedSupplier.phone || '—'}</strong></div>
                    <div>Ngân hàng: <strong>{selectedSupplier.bank_name || '—'}</strong></div>
                    <div>Số TK: <strong>{selectedSupplier.bank_account_no || '—'}</strong></div>
                  </div>

                  <div>
                    <h4 style={{ margin: '0 0 8px', fontSize: '0.88rem', fontWeight: 800 }}>
                      Lịch sử Đơn mua hàng PO ({selectedSupplier.purchase_orders?.length || 0})
                    </h4>
                    {(selectedSupplier.purchase_orders || []).map((po) => (
                      <div key={po.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 10px', borderRadius: 10, border: '1px solid #E2E8F0', marginBottom: 6, fontSize: '0.8rem' }}>
                        <span><strong>{po.po_code}</strong> ({po.status})</span>
                        <strong>{formatVnd(po.total_vnd)}</strong>
                      </div>
                    ))}
                  </div>

                  <div>
                    <h4 style={{ margin: '0 0 8px', fontSize: '0.88rem', fontWeight: 800 }}>
                      Các Lô hàng FIFO đã cung ứng ({selectedSupplier.batches?.length || 0})
                    </h4>
                    {(selectedSupplier.batches || []).map((b) => (
                      <div key={b.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 10px', borderRadius: 10, background: '#F8FAFC', marginBottom: 6, fontSize: '0.8rem' }}>
                        <span><strong>{b.batch_code}</strong> — {b.product_name}</span>
                        <span>Còn {b.remaining_qty}/{b.initial_qty} @ {formatVnd(b.unit_cost_vnd)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          </div>,
          document.body
        )}
    </div>
  );
};
