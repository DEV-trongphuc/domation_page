import React, { useCallback, useEffect, useState } from 'react';
import { Copy, FileSpreadsheet, Play, Plus, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { CustomModal } from '../../components/ui/CustomModal';
import { ModalBodySkeleton } from '../../components/ui/Skeleton';
import { Badge } from '../../components/ui/AutoDataLoadingModal';
import { apiRequest, formatShortDate, getErrorMessage } from '../../../autodataApi';
import { useAuth } from '../../contexts/AuthContext';
import type { InventorySyncSheetRecord, WarehouseRecord } from './financeTypes';

interface InventorySyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  warehouses: WarehouseRecord[];
  onSynced: () => void;
}

const SYSTEM_FIELD_OPTIONS = [
  { value: 'sku', label: 'Mã SKU / Mã Căn (Khóa đối chiếu)' },
  { value: 'product_name', label: 'Tên Sản phẩm / Dự án' },
  { value: 'price', label: 'Giá bán niêm yết (VNĐ)' },
  { value: 'import_price', label: 'Giá vốn nhập (VNĐ)' },
  { value: 'qty', label: 'Số lượng tồn kho' },
  { value: 'category', label: 'Nhóm hàng hóa' },
  { value: 'unit', label: 'Đơn vị tính' },
];

export const InventorySyncModal: React.FC<InventorySyncModalProps> = ({
  isOpen,
  onClose,
  warehouses,
  onSynced,
}) => {
  const { token, tenantSlug } = useAuth();
  const [loading, setLoading] = useState(false);
  const [sheets, setSheets] = useState<InventorySyncSheetRecord[]>([]);
  const [selectedId, setSelectedId] = useState<string>('');

  const [spreadsheetInput, setSpreadsheetInput] = useState('');
  const [sheetTabName, setSheetTabName] = useState('Sheet1');
  const [warehouseId, setWarehouseId] = useState('');
  const [intervalMins, setIntervalMins] = useState('15');
  const [sampleCsvText, setSampleCsvText] = useState(
    'SKU-SYNC-01,Bộ cảm biến AI Gate,4500000,2800000,12\nSKU-SYNC-02,Đầu đọc thẻ thông minh,1850000,1100000,25'
  );
  const [runningSync, setRunningSync] = useState(false);

  const loadSheets = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await apiRequest<{ items: InventorySyncSheetRecord[] }>('/inventory/sync-sheets', {
        token,
        tenantSlug,
      });
      const list = res?.items || [];
      setSheets(list);
      if (list.length > 0 && !selectedId) {
        setSelectedId(list[0].id);
      }
    } catch (err) {
      toast.error(getErrorMessage(err, 'Không thể tải cấu hình đồng bộ Google Sheets.'));
    } finally {
      setLoading(false);
    }
  }, [token, tenantSlug, selectedId]);

  useEffect(() => {
    if (!isOpen) return;
    const timer = window.setTimeout(() => {
      void loadSheets();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [isOpen, loadSheets]);

  const activeSheet = sheets.find((s) => s.id === selectedId) || sheets[0] || null;

  const handleAddSheet = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!spreadsheetInput.trim()) {
      toast.error('Vui lòng dán URL hoặc ID Google Sheets.');
      return;
    }
    try {
      const res = await apiRequest<InventorySyncSheetRecord>('/inventory/sync-sheets', {
        method: 'POST',
        token,
        tenantSlug,
        body: {
          spreadsheet_id: spreadsheetInput.trim(),
          sheet_name: sheetTabName.trim() || 'Sheet1',
          warehouse_id: warehouseId || null,
          sync_interval_minutes: Number(intervalMins || 15),
        },
      });
      toast.success('Đã kết nối bảng tính Google Sheets tồn kho!');
      setSpreadsheetInput('');
      await loadSheets();
      setSelectedId(res.id);
    } catch (err) {
      toast.error(getErrorMessage(err, 'Không thể kết nối bảng tính Google Sheets.'));
    }
  };

  const handleRunSyncNow = async () => {
    if (!activeSheet) return;
    const parsedRows = sampleCsvText
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        const parts = line.split(',').map((s) => s.trim());
        return {
          sku: parts[0] || '',
          product_name: parts[1] || '',
          price: Number(parts[2] || 0),
          import_price: Number(parts[3] || 0),
          qty: Number(parts[4] || 0),
        };
      })
      .filter((r) => r.sku && r.product_name);

    setRunningSync(true);
    try {
      const res = await apiRequest<{ upserted_count: number }>(
        `/inventory/sync-sheets/${activeSheet.id}/run`,
        {
          method: 'POST',
          token,
          tenantSlug,
          body: { rows: parsedRows },
        }
      );
      toast.success(`Đồng bộ thành công ${res.upserted_count} mã SKU vào Kho FIFO!`);
      await loadSheets();
      onSynced();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Không thể thực thi đồng bộ tồn kho.'));
    } finally {
      setRunningSync(false);
    }
  };

  const handleDeleteSheet = async (id: string) => {
    try {
      await apiRequest(`/inventory/sync-sheets/${id}`, {
        method: 'DELETE',
        token,
        tenantSlug,
      });
      toast.success('Đã ngắt kết nối bảng tính.');
      setSelectedId('');
      await loadSheets();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Không thể ngắt kết nối bảng tính.'));
    }
  };

  return (
    <CustomModal
      isOpen={isOpen}
      onClose={onClose}
      title="Đồng Bộ Tồn Kho Tự Động Từ Google Sheets & Webhook"
      width="880px"
    >
      {loading && sheets.length === 0 ? (
        <ModalBodySkeleton rows={4} />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <form
            onSubmit={handleAddSheet}
            style={{
              padding: '1rem',
              borderRadius: 14,
              background: '#F8FAFF',
              border: '1px solid #DBEAFE',
              display: 'grid',
              gridTemplateColumns: '1.6fr 0.8fr 0.9fr 0.6fr auto',
              gap: 8,
              alignItems: 'end',
            }}
          >
            <div>
              <label className="form-label">URL hoặc Spreadsheet ID Google Sheets</label>
              <input
                className="form-input"
                style={{ height: 40, background: '#FFFFFF' }}
                value={spreadsheetInput}
                onChange={(e) => setSpreadsheetInput(e.target.value)}
                placeholder="https://docs.google.com/spreadsheets/d/1BxiM..."
              />
            </div>
            <div>
              <label className="form-label">Tên Sheet Tab</label>
              <input
                className="form-input"
                style={{ height: 40, background: '#FFFFFF' }}
                value={sheetTabName}
                onChange={(e) => setSheetTabName(e.target.value)}
              />
            </div>
            <div>
              <label className="form-label">Kho nhận dữ liệu</label>
              <select
                className="form-input"
                style={{ height: 40, background: '#FFFFFF' }}
                value={warehouseId}
                onChange={(e) => setWarehouseId(e.target.value)}
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
              <label className="form-label">Chu kỳ</label>
              <select
                className="form-input"
                style={{ height: 40, background: '#FFFFFF' }}
                value={intervalMins}
                onChange={(e) => setIntervalMins(e.target.value)}
              >
                <option value="5">5 phút</option>
                <option value="15">15 phút</option>
                <option value="60">1 giờ</option>
                <option value="1440">1 ngày</option>
              </select>
            </div>
            <button
              type="submit"
              className="btn primary"
              style={{ height: 40, background: '#1E40FF', display: 'inline-flex', alignItems: 'center', gap: 5 }}
            >
              <Plus size={15} /> Kết nối
            </button>
          </form>

          {sheets.length > 0 && activeSheet && (
            <div style={{ display: 'grid', gridTemplateColumns: '0.9fr 1.4fr', gap: 14 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {sheets.map((s) => (
                  <div
                    key={s.id}
                    onClick={() => setSelectedId(s.id)}
                    style={{
                      padding: '0.85rem',
                      borderRadius: 12,
                      border: activeSheet.id === s.id ? '1.5px solid #1E40FF' : '1px solid #E2E8F0',
                      background: activeSheet.id === s.id ? '#EFF6FF' : '#FFFFFF',
                      cursor: 'pointer',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 800, fontSize: '0.84rem' }}>
                        <FileSpreadsheet size={15} color="#059669" /> {s.sheet_name}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: '#64748B', marginTop: 2 }}>
                        ID: {s.spreadsheet_id.slice(0, 18)}... • {s.sync_interval_minutes}p/lần
                      </div>
                      {s.last_sync_at && (
                        <div style={{ fontSize: '0.7rem', color: '#059669' }}>
                          Đồng bộ gần nhất: {formatShortDate(s.last_sync_at)}
                        </div>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        void handleDeleteSheet(s.id);
                      }}
                      style={{ border: 'none', background: 'transparent', color: '#EF4444', cursor: 'pointer' }}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                ))}
              </div>

              <div
                style={{
                  padding: '1rem',
                  borderRadius: 14,
                  border: '1px solid #E2E8F0',
                  background: '#FFFFFF',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 10,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 800, fontSize: '0.86rem', color: '#0F172A' }}>
                    Ánh xạ Cột Sheet → Trường Kho FIFO
                  </span>
                  <Badge tone="info">Token: {activeSheet.webhook_token}</Badge>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {(activeSheet.mappings || []).map((m, idx) => (
                    <div
                      key={idx}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        padding: '6px 10px',
                        borderRadius: 8,
                        background: '#F8FAFC',
                        fontSize: '0.78rem',
                      }}
                    >
                      <strong>Cột {m.sheet_column}</strong>
                      <span style={{ color: '#1E40FF', fontWeight: 700 }}>
                        → {SYSTEM_FIELD_OPTIONS.find((o) => o.value === m.system_field)?.label || m.system_field}
                      </span>
                    </div>
                  ))}
                </div>

                <div>
                  <label className="form-label">
                    Dữ liệu nạp thử / Đồng bộ tức thì (SKU, Tên SP, Giá bán, Giá vốn, Tồn)
                  </label>
                  <textarea
                    className="form-input"
                    rows={3}
                    style={{ fontFamily: 'monospace', fontSize: '0.76rem' }}
                    value={sampleCsvText}
                    onChange={(e) => setSampleCsvText(e.target.value)}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                  <button
                    type="button"
                    className="btn secondary"
                    style={{ height: 40, display: 'inline-flex', alignItems: 'center', gap: 5 }}
                    onClick={() => {
                      void navigator.clipboard?.writeText(activeSheet.webhook_token);
                      toast.success('Đã sao chép Webhook Token!');
                    }}
                  >
                    <Copy size={14} /> Copy Token
                  </button>
                  <button
                    type="button"
                    disabled={runningSync}
                    onClick={() => void handleRunSyncNow()}
                    className="btn primary"
                    style={{ height: 40, background: '#1E40FF', display: 'inline-flex', alignItems: 'center', gap: 6 }}
                  >
                    <Play size={14} /> {runningSync ? 'Đang đồng bộ...' : 'Chạy Đồng bộ ngay'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </CustomModal>
  );
};
