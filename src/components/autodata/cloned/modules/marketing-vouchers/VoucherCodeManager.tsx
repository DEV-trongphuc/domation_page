import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  CheckCircle2,
  Code2,
  Download,
  Plus,
  RefreshCw,
  Search,
  Upload,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { Badge, EmptyState, PillTabs } from '../../components/ui/AutoDataLoadingModal';
import { CustomModal } from '../../components/ui/CustomModal';
import { ModalBodySkeleton } from '../../components/ui/Skeleton';
import { apiRequest, formatShortDate, formatVnd, getErrorMessage } from '../../../autodataApi';
import { useAuth } from '../../contexts/AuthContext';
import { VoucherApiEmbedPanel } from './VoucherApiEmbedPanel';
import type { VoucherCodeLogDto, VoucherPoolDto } from './voucherTypes';

export interface VoucherCodeManagerProps {
  isOpen: boolean;
  onClose: () => void;
  pool: VoucherPoolDto | null;
  initialTab?: 'codes' | 'api_embed';
  onChanged?: () => void;
}

export const VoucherCodeManager: React.FC<VoucherCodeManagerProps> = ({
  isOpen,
  onClose,
  pool,
  initialTab = 'codes',
  onChanged,
}) => {
  const { token, tenantSlug } = useAuth();
  const csvFileRef = useRef<HTMLInputElement | null>(null);

  const [tab, setTab] = useState<'codes' | 'api_embed'>(initialTab);
  const [loading, setLoading] = useState(false);
  const [codes, setCodes] = useState<VoucherCodeLogDto[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'available' | 'claimed' | 'redeemed'>('all');
  const [genCount, setGenCount] = useState('30');
  const [generating, setGenerating] = useState(false);
  const [csvText, setCsvText] = useState('');
  const [importing, setImporting] = useState(false);

  const poolId = pool?.id;

  const loadCodes = useCallback(async () => {
    if (!poolId) return;
    setLoading(true);
    try {
      const res = await apiRequest<{ codes?: VoucherCodeLogDto[] }>(
        `/marketing/vouchers/${poolId}/codes`,
        { token, tenantSlug }
      );
      setCodes(res.codes || []);
    } catch (err) {
      toast.error(getErrorMessage(err, 'Không thể tải danh sách mã ưu đãi.'));
    } finally {
      setLoading(false);
    }
  }, [poolId, token, tenantSlug]);

  useEffect(() => {
    if (!isOpen || !poolId) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const res = await apiRequest<{ codes?: VoucherCodeLogDto[] }>(
          `/marketing/vouchers/${poolId}/codes`,
          { token, tenantSlug }
        );
        if (!cancelled) setCodes(res.codes || []);
      } catch (err) {
        if (!cancelled) toast.error(getErrorMessage(err, 'Không thể tải danh sách mã ưu đãi.'));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isOpen, poolId, token, tenantSlug]);

  const filteredCodes = useMemo(() => {
    const q = search.trim().toLowerCase();
    return codes.filter((c) => {
      if (statusFilter !== 'all' && c.status !== statusFilter) return false;
      if (!q) return true;
      return (
        c.code.toLowerCase().includes(q) ||
        (c.name || '').toLowerCase().includes(q) ||
        (c.phone || '').toLowerCase().includes(q) ||
        (c.email || '').toLowerCase().includes(q)
      );
    });
  }, [codes, search, statusFilter]);

  const handleBatchGenerate = async () => {
    if (!pool) return;
    const count = Math.min(500, Math.max(1, Number(genCount || 20)));
    setGenerating(true);
    try {
      const res = await apiRequest<{ generated_count: number }>(`/marketing/vouchers/${pool.id}/generate`, {
        method: 'POST',
        token,
        tenantSlug,
        body: { count },
      });
      toast.success(`Đã sinh thêm ${res.generated_count} mã tiền tố ${pool.code_prefix}!`);
      await loadCodes();
      onChanged?.();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Không thể sinh thêm lô mã.'));
    } finally {
      setGenerating(false);
    }
  };

  const submitCsvContent = async (rawCsv: string) => {
    if (!pool || !rawCsv.trim()) return;
    setImporting(true);
    try {
      const res = await apiRequest<{ imported_submitted: number }>(
        `/marketing/vouchers/${pool.id}/import-csv`,
        { method: 'POST', token, tenantSlug, body: { csv_text: rawCsv } }
      );
      toast.success(`Đã nhập ${res.imported_submitted} mã CSV vào kho!`);
      setCsvText('');
      await loadCodes();
      onChanged?.();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Không thể nhập CSV mã ưu đãi.'));
    } finally {
      setImporting(false);
    }
  };

  const handleCsvFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') void submitCsvContent(reader.result);
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleQuickRedeemRow = async (codeStr: string) => {
    try {
      await apiRequest('/marketing/vouchers/redeem', {
        method: 'POST',
        token,
        tenantSlug,
        body: { code: codeStr, note: 'Gạch trực tiếp từ Kho mã Voucher' },
      });
      toast.success(`Đã gạch mã ${codeStr} thành công!`);
      await loadCodes();
      onChanged?.();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Không thể gạch mã.'));
    }
  };

  const handleExportCsv = () => {
    if (codes.length === 0) {
      toast.error('Chưa có mã nào để xuất CSV.');
      return;
    }
    const header = 'code,status,customer_name,phone,email,redeemed_order_vnd,redeemed_at';
    const lines = codes.map((c) =>
      [c.code, c.status, c.name || '', c.phone || '', c.email || '', c.redeemed_order_vnd || 0, c.redeemed_at || '']
        .map((v) => `"${String(v).replace(/"/g, '""')}"`)
        .join(',')
    );
    const blob = new Blob([`\uFEFF${header}\n${lines.join('\n')}`], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `voucher-codes-${pool?.slug || 'export'}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!pool) return null;

  const availableCount = codes.filter((c) => c.status === 'available').length;
  const claimedCount = codes.filter((c) => c.status === 'claimed').length;
  const redeemedCount = codes.filter((c) => c.status === 'redeemed').length;

  return (
    <CustomModal isOpen={isOpen} onClose={onClose} title={`Quản Lý Kho Mã & Tích Hợp API — ${pool.name}`} width={880}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
          <PillTabs
            tabs={[
              { key: 'codes', label: 'Kho Mã & Đối Soát 360°', count: codes.length },
              { key: 'api_embed', label: 'Link Nhận Công Khai & Webhook API', icon: <Code2 size={14} /> },
            ]}
            activeKey={tab}
            onChange={setTab}
          />
          <button type="button" onClick={() => void loadCodes()} className="btn secondary sm" style={{ height: 36, display: 'inline-flex', alignItems: 'center', gap: 5 }}>
            <RefreshCw size={13} /> Làm mới
          </button>
        </div>

        {tab === 'codes' ? (
          loading ? (
            <ModalBodySkeleton rows={4} />
          ) : (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
                <div style={{ padding: '0.75rem 1rem', borderRadius: 12, background: '#F8FAFF', border: '1px solid #E2E8F0' }}>
                  <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#64748B' }}>TỔNG MÃ</div>
                  <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#0F172A' }}>{codes.length}</div>
                </div>
                <div style={{ padding: '0.75rem 1rem', borderRadius: 12, background: '#EFF6FF', border: '1px solid #DBEAFE' }}>
                  <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#1E40FF' }}>CÒN TRỐNG</div>
                  <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#1E40FF' }}>{availableCount}</div>
                </div>
                <div style={{ padding: '0.75rem 1rem', borderRadius: 12, background: '#FEF3C7', border: '1px solid #FDE68A' }}>
                  <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#D97706' }}>ĐÃ CẤP</div>
                  <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#D97706' }}>{claimedCount}</div>
                </div>
                <div style={{ padding: '0.75rem 1rem', borderRadius: 12, background: '#ECFDF5', border: '1px solid #A7F3D0' }}>
                  <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#059669' }}>ĐÃ GẠCH (POS)</div>
                  <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#059669' }}>{redeemedCount}</div>
                </div>
              </div>

              <div style={{ padding: '0.85rem', borderRadius: 14, background: '#F8F9FA', border: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
                  <input type="number" min={1} max={500} className="form-input" style={{ height: 40, width: 110 }} value={genCount} onChange={(e) => setGenCount(e.target.value)} />
                  <button
                    type="button"
                    disabled={generating}
                    onClick={() => void handleBatchGenerate()}
                    style={{ height: 40, padding: '0 1rem', borderRadius: 10, border: 'none', background: '#1E40FF', color: '#FFFFFF', fontWeight: 700, fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: 5, cursor: 'pointer' }}
                  >
                    <Plus size={14} /> {generating ? 'Đang sinh...' : 'Sinh thêm lô mã'}
                  </button>
                  <input ref={csvFileRef} type="file" accept=".csv,.txt" style={{ display: 'none' }} onChange={handleCsvFileSelected} />
                  <button type="button" disabled={importing} onClick={() => csvFileRef.current?.click()} className="btn secondary sm" style={{ height: 40, color: '#1E40FF', display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                    <Upload size={14} /> Tải file CSV
                  </button>
                  <button type="button" onClick={handleExportCsv} className="btn secondary sm" style={{ height: 40, display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                    <Download size={14} /> Xuất CSV
                  </button>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input className="form-input" style={{ height: 40, flex: 1, background: '#FFFFFF' }} placeholder="Hoặc dán nhanh danh sách mã CSV..." value={csvText} onChange={(e) => setCsvText(e.target.value)} />
                  <button type="button" disabled={importing || !csvText.trim()} onClick={() => void submitCsvContent(csvText)} className="btn secondary sm" style={{ height: 40, fontWeight: 700 }}>
                    Nhập nhanh
                  </button>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
                <div style={{ position: 'relative', flex: '1 1 240px' }}>
                  <Search size={15} style={{ position: 'absolute', left: 12, top: 13, color: '#94A3B8' }} />
                  <input className="form-input" style={{ height: 40, paddingLeft: 36 }} placeholder="Tìm theo mã ưu đãi, tên, SĐT hoặc Email..." value={search} onChange={(e) => setSearch(e.target.value)} />
                </div>
                <select className="form-input" style={{ height: 40, width: 180 }} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}>
                  <option value="all">Tất cả trạng thái</option>
                  <option value="available">Còn trống</option>
                  <option value="claimed">Đã cấp</option>
                  <option value="redeemed">Đã gạch</option>
                </select>
              </div>

              {filteredCodes.length === 0 ? (
                <EmptyState title="Không tìm thấy mã ưu đãi phù hợp" description="Bấm 'Sinh thêm lô mã' hoặc nhập CSV để bổ sung mã vào kho." />
              ) : (
                <div style={{ maxHeight: 320, overflowY: 'auto', border: '1px solid #E2E8F0', borderRadius: 14 }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
                    <thead>
                      <tr style={{ background: '#F8F9FA', borderBottom: '1px solid #E2E8F0', textAlign: 'left' }}>
                        <th style={{ padding: '0.7rem 0.9rem' }}>Mã Voucher</th>
                        <th style={{ padding: '0.7rem 0.9rem' }}>Trạng thái</th>
                        <th style={{ padding: '0.7rem 0.9rem' }}>Khách hàng 360°</th>
                        <th style={{ padding: '0.7rem 0.9rem', textAlign: 'right' }}>Đơn hàng / Thao tác</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredCodes.map((c) => (
                        <tr key={c.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                          <td style={{ padding: '0.65rem 0.9rem', fontFamily: 'monospace', fontWeight: 800, color: '#1E40FF' }}>{c.code}</td>
                          <td style={{ padding: '0.65rem 0.9rem' }}>
                            <Badge tone={c.status === 'redeemed' ? 'success' : c.status === 'claimed' ? 'warning' : 'info'}>{c.status}</Badge>
                          </td>
                          <td style={{ padding: '0.65rem 0.9rem', color: '#334155' }}>
                            {c.name || c.phone || c.email ? (
                              <div>
                                <div style={{ fontWeight: 700 }}>{c.name || 'Khách nhận mã'}</div>
                                <div style={{ fontSize: '0.72rem', color: '#64748B' }}>{[c.phone, c.email].filter(Boolean).join(' • ')}</div>
                              </div>
                            ) : (
                              <span style={{ color: '#94A3B8' }}>Chưa gán khách</span>
                            )}
                          </td>
                          <td style={{ padding: '0.65rem 0.9rem', textAlign: 'right' }}>
                            {c.status === 'redeemed' ? (
                              <div>
                                <strong style={{ color: '#059669' }}>{c.redeemed_order_vnd ? formatVnd(c.redeemed_order_vnd) : 'Đã quy đổi'}</strong>
                                <div style={{ fontSize: '0.7rem', color: '#64748B' }}>{formatShortDate(c.redeemed_at)}</div>
                              </div>
                            ) : (
                              <button type="button" onClick={() => void handleQuickRedeemRow(c.code)} className="btn secondary sm" style={{ height: 30, color: '#1E40FF', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                                <CheckCircle2 size={12} /> Gạch mã
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )
        ) : (
          <VoucherApiEmbedPanel pool={pool} />
        )}
      </div>
    </CustomModal>
  );
};

export default VoucherCodeManager;
