import React, { useState } from 'react';
import { CheckCircle2, FileSpreadsheet, Save, Settings as SettingsIcon, Sparkles, Upload } from 'lucide-react';
import { apiRequest, getErrorMessage } from '../autodataApi';

interface BatchCheckResult {
  row_index: number;
  name: string;
  raw_phone: string;
  normalized_phone?: string;
  valid: boolean;
  is_duplicate: boolean;
  existing_lead?: { owner_name?: string } | null;
}

interface SettingsViewProps {
  token: string;
  tenantSlug: string;
  initialSettings: Record<string, unknown>;
  onSettingsUpdated: (next: Record<string, unknown>) => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  token,
  tenantSlug,
  initialSettings,
  onSettingsUpdated,
}) => {
  const [tab, setTab] = useState<'processing' | 'comms' | 'reports' | 'batch' | 'ai'>('processing');
  const [settings, setSettings] = useState<Record<string, unknown>>(initialSettings || {});
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const [rawBatchText, setRawBatchText] = useState('');
  const [batchResults, setBatchResults] = useState<BatchCheckResult[]>([]);
  const [batchSilent, setBatchSilent] = useState(true);

  const updateField = (k: string, v: unknown) => setSettings((prev) => ({ ...prev, [k]: v }));

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await apiRequest<{ settings: Record<string, unknown> }>('/auth/tenant-settings', {
        method: 'PATCH',
        token,
        tenantSlug,
        body: { settings },
      });
      if (res?.settings) {
        setSettings(res.settings);
        onSettingsUpdated(res.settings);
      }
      setToast('Đã lưu toàn bộ cấu hình Doanh nghiệp thành công.');
    } catch (err: unknown) {
      setToast(getErrorMessage(err, 'Lỗi lưu cấu hình.'));
    } finally {
      setSaving(false);
    }
  };

  const parseBatchLines = () =>
    rawBatchText
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean)
      .map((line) => {
        const parts = line.split(/[,;\t|]+/);
        return {
          name: parts.length > 1 ? parts[0].trim() : 'Khách hàng Import',
          phone: (parts.length > 1 ? parts[1] : parts[0]).trim(),
          source: parts[2]?.trim() || 'Batch Import',
        };
      });

  const handleBatchCheck = async () => {
    const rows = parseBatchLines();
    if (rows.length === 0) return;
    try {
      const res = await apiRequest<{ results: BatchCheckResult[] }>('/operations/leads/batch-check', {
        method: 'POST',
        token,
        tenantSlug,
        body: { rows },
      });
      setBatchResults(res.results || []);
      setToast(`Đã kiểm tra ${res.results?.length || 0} dòng dữ liệu.`);
    } catch (err: unknown) {
      setToast(getErrorMessage(err, 'Không thể kiểm tra trùng.'));
    }
  };

  const handleBatchImport = async () => {
    const rows = parseBatchLines();
    if (rows.length === 0) return;
    try {
      const res = await apiRequest<{
        imported_count: number;
        duplicate_count: number;
        skipped_count: number;
      }>('/operations/leads/batch-import', {
        method: 'POST',
        token,
        tenantSlug,
        body: {
          file_name: `batch-${Date.now()}.csv`,
          rows,
          is_silent: batchSilent,
          skip_duplicates: true,
        },
      });
      setToast(
        `Đã import ${res.imported_count} Lead (bỏ qua ${res.duplicate_count} trùng, ${res.skipped_count} sai định dạng).`
      );
      setRawBatchText('');
      setBatchResults([]);
    } catch (err: unknown) {
      setToast(getErrorMessage(err, 'Lỗi import dữ liệu.'));
    }
  };

  return (
    <div className="space-y-6">
      <div className="inkica-glass-card flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4">
        <div className="flex items-center gap-2.5">
          <SettingsIcon className="h-5 w-5 text-[#1E40FF]" />
          <div>
            <h1 className="text-lg font-bold text-slate-900">Trung Tâm Cấu Hình 5 Phân Hệ (Zero Hardcode)</h1>
            <p className="text-xs text-slate-500">Chuẩn hóa logic phân bổ, SLA, bảo mật PII, kiểm tra trùng & AI Assistant</p>
          </div>
        </div>
      </div>

      {toast && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-xs font-semibold text-emerald-700">
          <CheckCircle2 className="h-4 w-4" /> {toast}
        </div>
      )}

      <div data-tour="settings-tabs" className="flex flex-wrap gap-1.5 rounded-2xl bg-slate-100 p-1.5 text-xs font-semibold">
        {[
          { key: 'processing', label: '1. Chia Số & Xử Lý' },
          { key: 'comms', label: '2. Giao Tiếp & SLA' },
          { key: 'reports', label: '3. Báo Lỗi & Ticket' },
          { key: 'batch', label: '4. Kiểm Tra Trùng & Import' },
          { key: 'ai', label: '5. AI Assistant & Brand' },
        ].map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key as typeof tab)}
            className={`rounded-xl px-3.5 py-2 transition ${
              tab === t.key ? 'bg-white text-[#1E40FF] shadow-sm' : 'text-slate-600'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab !== 'batch' ? (
        <form onSubmit={handleSaveSettings} className="inkica-glass-card space-y-5 rounded-2xl border border-slate-200 bg-white p-6 text-xs">
          {tab === 'processing' && (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1 block font-semibold text-slate-700">Chế độ chia vòng mặc định</label>
                <select
                  value={String(settings.distribution_mode || 'weighted_round_robin')}
                  onChange={(e) => updateField('distribution_mode', e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2"
                >
                  <option value="weighted_round_robin">Weighted Round-Robin (Theo trọng số)</option>
                  <option value="strict_round_robin">Strict Round-Robin (Xoay vòng 1:1)</option>
                  <option value="least_loaded">Least Loaded (Ưu tiên người ít số nhất)</option>
                  <option value="manual_only">Thủ công (Chờ Admin chia)</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block font-semibold text-slate-700">Xử lý khi trùng SĐT (trong chu kỳ)</label>
                <select
                  value={String(settings.duplicate_action || 'route_to_previous_sale')}
                  onChange={(e) => updateField('duplicate_action', e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2"
                >
                  <option value="route_to_previous_sale">Báo nhắc lại cho Sale cũ</option>
                  <option value="update_existing">Cập nhật đè vào hồ sơ cũ</option>
                  <option value="round_robin">Vẫn chia vòng mới</option>
                  <option value="reject_duplicate">Từ chối số trùng (HTTP 409)</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block font-semibold text-slate-700">Chu kỳ kiểm tra trùng SĐT (ngày)</label>
                <input
                  type="number"
                  min={0}
                  max={3650}
                  value={Number(settings.duplicate_threshold_days ?? 90)}
                  onChange={(e) => updateField('duplicate_threshold_days', Number(e.target.value))}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2"
                />
              </div>
              <div>
                <label className="mb-1 block font-semibold text-slate-700">Chống quá tải Sale (Lead tối đa / giờ)</label>
                <input
                  type="number"
                  min={0}
                  max={500}
                  value={Number(settings.starvation_max_leads_per_hour ?? 10)}
                  onChange={(e) => updateField('starvation_max_leads_per_hour', Number(e.target.value))}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2"
                />
              </div>
              <label className="flex items-center gap-2 font-semibold text-slate-700">
                <input
                  type="checkbox"
                  checked={Boolean(settings.auto_accept_on_assign)}
                  onChange={(e) => updateField('auto_accept_on_assign', e.target.checked)}
                  className="h-4 w-4 accent-[#1E40FF]"
                />
                Tự động xác nhận (Auto-Accept) khi chia cho Sale
              </label>
              <label className="flex items-center gap-2 font-semibold text-slate-700">
                <input
                  type="checkbox"
                  checked={Boolean(settings.starvation_prevention_enabled)}
                  onChange={(e) => updateField('starvation_prevention_enabled', e.target.checked)}
                  className="h-4 w-4 accent-[#1E40FF]"
                />
                Bật chế độ Chống dồn số (Starvation Prevention)
              </label>
            </div>
          )}

          {tab === 'comms' && (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1 block font-semibold text-slate-700">Thời hạn SLA tiếp nhận (phút)</label>
                <input
                  type="number"
                  min={1}
                  max={1440}
                  value={Number(settings.default_sla_minutes ?? 15)}
                  onChange={(e) => updateField('default_sla_minutes', Number(e.target.value))}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2"
                />
              </div>
              <div>
                <label className="mb-1 block font-semibold text-slate-700">Ký tự che SĐT PII</label>
                <input
                  type="text"
                  maxLength={1}
                  value={String(settings.pii_mask_char || '*')}
                  onChange={(e) => updateField('pii_mask_char', e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2"
                />
              </div>
              <label className="flex items-center gap-2 font-semibold text-slate-700">
                <input
                  type="checkbox"
                  checked={Boolean(settings.sla_auto_recall_enabled)}
                  onChange={(e) => updateField('sla_auto_recall_enabled', e.target.checked)}
                  className="h-4 w-4 accent-[#1E40FF]"
                />
                Tự động thu hồi Lead khi Sale trễ SLA
              </label>
              <label className="flex items-center gap-2 font-semibold text-slate-700">
                <input
                  type="checkbox"
                  checked={settings.pii_masking_enabled !== false}
                  onChange={(e) => updateField('pii_masking_enabled', e.target.checked)}
                  className="h-4 w-4 accent-[#1E40FF]"
                />
                Che số điện thoại bảo mật PII cho Đại lý F1 / trước nhận số
              </label>
            </div>
          )}

          {tab === 'reports' && (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1 block font-semibold text-slate-700">Số lượt bù mỗi Ticket duyệt</label>
                <input
                  type="number"
                  min={1}
                  max={10}
                  value={Number(settings.compensation_credits_per_ticket ?? 1)}
                  onChange={(e) => updateField('compensation_credits_per_ticket', Number(e.target.value))}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2"
                />
              </div>
              <label className="flex items-center gap-2 font-semibold text-slate-700">
                <input
                  type="checkbox"
                  checked={Boolean(settings.ticket_auto_approve_enabled)}
                  onChange={(e) => updateField('ticket_auto_approve_enabled', e.target.checked)}
                  className="h-4 w-4 accent-[#1E40FF]"
                />
                Tự động duyệt Ticket khi khớp từ khóa lỗi rõ ràng
              </label>
            </div>
          )}

          {tab === 'ai' && (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="md:col-span-2 flex items-center gap-2 rounded-xl bg-blue-50 p-3 text-[#1E40FF]">
                <Sparkles className="h-4 w-4" />
                <span>Tùy biến nhận diện thương hiệu & trợ lý AI phân tích Lead</span>
              </div>
              <div>
                <label className="mb-1 block font-semibold text-slate-700">Mã màu chủ đạo Workspace</label>
                <input
                  type="color"
                  value={String(settings.brand_primary_color || '#1E40FF')}
                  onChange={(e) => updateField('brand_primary_color', e.target.value)}
                  className="h-10 w-24 rounded-lg border border-slate-200"
                />
              </div>
              <div>
                <label className="mb-1 block font-semibold text-slate-700">Mã quốc gia SĐT mặc định</label>
                <input
                  type="text"
                  value={String(settings.default_dial_code || '+84')}
                  onChange={(e) => updateField('default_dial_code', e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2"
                />
              </div>
            </div>
          )}

          <div className="flex justify-end border-t border-slate-100 pt-4">
            <button
              type="submit"
              disabled={saving}
              className="btn-inkica-primary inline-flex items-center gap-1.5 rounded-xl px-5 py-2.5 text-xs font-semibold text-white"
            >
              <Save className="h-4 w-4" /> {saving ? 'Đang lưu...' : 'Lưu Cấu Hình Doanh Nghiệp'}
            </button>
          </div>
        </form>
      ) : (
        <div className="inkica-glass-card space-y-4 rounded-2xl border border-slate-200 bg-white p-5 text-xs">
          <div className="flex items-center gap-2 font-bold text-slate-900">
            <FileSpreadsheet className="h-4 w-4 text-[#1E40FF]" /> Kiểm Tra Trùng Hàng Loạt & Import Lịch Sử (Silent Mode)
          </div>
          <textarea
            rows={5}
            value={rawBatchText}
            onChange={(e) => setRawBatchText(e.target.value)}
            placeholder={'Dán danh sách mỗi dòng 1 khách (Tên, SĐT, Nguồn):\nNguyễn Văn A, 0905111222, Facebook Ads\nTrần Thị B, 0912333444, Google Sheet'}
            className="w-full rounded-xl border border-slate-200 p-3 font-mono text-xs outline-none focus:border-[#1E40FF]"
          />
          <div className="flex flex-wrap items-center justify-between gap-3">
            <label className="flex items-center gap-2 font-semibold text-slate-700">
              <input
                type="checkbox"
                checked={batchSilent}
                onChange={(e) => setBatchSilent(e.target.checked)}
                className="h-4 w-4 accent-[#1E40FF]"
              />
              Import Im Lặng (Không bắn thông báo Zalo/Email/CAPI)
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => void handleBatchCheck()}
                className="ql-btn-outline rounded-xl border border-slate-200 px-4 py-2 font-semibold text-slate-700"
              >
                Kiểm tra trùng trước
              </button>
              <button
                type="button"
                onClick={() => void handleBatchImport()}
                className="btn-inkica-primary inline-flex items-center gap-1.5 rounded-xl px-4 py-2 font-semibold text-white"
              >
                <Upload className="h-3.5 w-3.5" /> Import Ngay
              </button>
            </div>
          </div>

          {batchResults.length > 0 && (
            <div className="max-h-60 overflow-y-auto rounded-xl border border-slate-100">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 font-bold text-slate-500">
                  <tr>
                    <th className="px-3 py-2">Tên</th>
                    <th className="px-3 py-2">SĐT Chuẩn hóa</th>
                    <th className="px-3 py-2">Trạng thái</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {batchResults.map((r) => (
                    <tr key={r.row_index}>
                      <td className="px-3 py-2">{r.name}</td>
                      <td className="px-3 py-2 font-mono">{r.normalized_phone || r.raw_phone}</td>
                      <td className="px-3 py-2">
                        {!r.valid ? (
                          <span className="text-rose-600">SĐT sai định dạng</span>
                        ) : r.is_duplicate ? (
                          <span className="font-semibold text-amber-600">
                            Trùng ({r.existing_lead?.owner_name || 'Đã tồn tại'})
                          </span>
                        ) : (
                          <span className="font-semibold text-emerald-600">Hợp lệ — Mới</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
