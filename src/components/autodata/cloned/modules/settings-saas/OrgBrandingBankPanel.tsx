import React, { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Building2, Palette, QrCode, Save } from 'lucide-react';
import { apiRequest, getErrorMessage } from '../../../autodataApi';
import { fetchAPI } from '../../utils/api';
import { useEntitlement } from '../../contexts/EntitlementContext';
import { SettingsTwoColumnSkeleton } from '../../components/ui/Skeleton';

interface BrandingBankFormState {
  brand_display_name: string;
  brand_logo_url: string;
  brand_primary_color: string;
  brand_email_accent_color: string;
  brand_email_footer_text: string;
  support_email: string;
  legal_entity_name: string;
  tax_code: string;
  legal_address: string;
  representative_name: string;
  representative_title: string;
  company_bank_name: string;
  company_bank_account: string;
  company_bank_holder: string;
  company_vietqr_template: 'compact2' | 'compact' | 'qr_only' | 'print';
}

const DEFAULT_FORM: BrandingBankFormState = {
  brand_display_name: '',
  brand_logo_url: '',
  brand_primary_color: '#1E40FF',
  brand_email_accent_color: '#1E40FF',
  brand_email_footer_text: '',
  support_email: '',
  legal_entity_name: '',
  tax_code: '',
  legal_address: '',
  representative_name: '',
  representative_title: 'Giám đốc',
  company_bank_name: '',
  company_bank_account: '',
  company_bank_holder: '',
  company_vietqr_template: 'compact2',
};

const BANK_BIN_SUGGESTIONS = [
  { code: 'TCB', label: 'Techcombank (TCB)' },
  { code: 'VCB', label: 'Vietcombank (VCB)' },
  { code: 'ACB', label: 'ACB' },
  { code: 'MB', label: 'MBBank (MB)' },
  { code: 'VPB', label: 'VPBank (VPB)' },
  { code: 'TPB', label: 'TPBank (TPB)' },
  { code: 'BIDV', label: 'BIDV' },
  { code: 'ICB', label: 'VietinBank (ICB)' },
];

function extractRawSettings(res: unknown): Record<string, unknown> {
  if (!res || typeof res !== 'object') return {};
  const obj = res as Record<string, unknown>;
  const data = obj.data && typeof obj.data === 'object' ? (obj.data as Record<string, unknown>) : obj;
  if (data.settings && typeof data.settings === 'object') {
    return data.settings as Record<string, unknown>;
  }
  return data;
}

export const OrgBrandingBankPanel: React.FC = () => {
  const { refreshEntitlements } = useEntitlement();
  const [form, setForm] = useState<BrandingBankFormState>(DEFAULT_FORM);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadSettings = useCallback(async () => {
    try {
      const [legacyRes, termRes] = await Promise.all([
        fetchAPI('get_settings').catch(() => null),
        apiRequest<Record<string, unknown>>('/org-rbac/terminology').catch(() => null),
      ]);
      const raw = extractRawSettings(legacyRes);
      const t = (termRes || {}) as Record<string, unknown>;

      setForm({
        brand_display_name: String(raw.brand_display_name || ''),
        brand_logo_url: String(t.brand_logo_url || raw.brand_logo_url || ''),
        brand_primary_color: String(raw.brand_primary_color || '#1E40FF'),
        brand_email_accent_color: String(raw.brand_email_accent_color || '#1E40FF'),
        brand_email_footer_text: String(raw.brand_email_footer_text || ''),
        support_email: String(raw.support_email || ''),
        legal_entity_name: String(raw.legal_entity_name || ''),
        tax_code: String(raw.tax_code || ''),
        legal_address: String(raw.legal_address || ''),
        representative_name: String(raw.representative_name || ''),
        representative_title: String(raw.representative_title || 'Giám đốc'),
        company_bank_name: String(raw.company_bank_name || ''),
        company_bank_account: String(raw.company_bank_account || ''),
        company_bank_holder: String(raw.company_bank_holder || ''),
        company_vietqr_template:
          raw.company_vietqr_template === 'compact' ||
          raw.company_vietqr_template === 'qr_only' ||
          raw.company_vietqr_template === 'print'
            ? raw.company_vietqr_template
            : 'compact2',
      });
    } catch (err) {
      toast.error(getErrorMessage(err, 'Không thể tải cấu hình Thương hiệu & Pháp nhân'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    (async () => {
      if (active) await loadSettings();
    })();
    return () => {
      active = false;
    };
  }, [loadSettings]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await Promise.all([
        apiRequest('/auth/tenant-settings', {
          method: 'PATCH',
          body: {
            name: form.brand_display_name.trim() || undefined,
            settings: {
              ...form,
              enable_ideas_mascot: false,
            },
          },
        }),
        apiRequest('/org-rbac/terminology', {
          method: 'PUT',
          body: {
            brand_logo_url: form.brand_logo_url.trim(),
            enable_ideas_mascot: false,
          },
        }),
      ]);
      toast.success('Đã lưu thông tin Pháp nhân, Tài khoản ngân hàng & Nhận diện Thương hiệu');
      await refreshEntitlements().catch(() => undefined);
    } catch (err) {
      toast.error(getErrorMessage(err, 'Không thể lưu thông tin Pháp nhân & Thương hiệu'));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <SettingsTwoColumnSkeleton />;
  }

  const vietQrUrl =
    form.company_bank_name && form.company_bank_account
      ? `https://img.vietqr.io/image/${encodeURIComponent(form.company_bank_name.trim())}-${encodeURIComponent(form.company_bank_account.trim())}-${form.company_vietqr_template}.png?accountName=${encodeURIComponent(form.company_bank_holder || '')}`
      : '';

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#1E40FF] flex items-center justify-center">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Hồ sơ Pháp nhân, Tài khoản Ngân hàng (VietQR) & Thương hiệu
            </h3>
            <p className="text-xs text-slate-500">
              Dữ liệu dùng chung cho Báo giá PDF, Hóa đơn VAT, Email hệ thống và Chữ ký hợp đồng.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => void handleSave()}
          disabled={saving}
          className="h-11 px-5 rounded-xl bg-[#1E40FF] hover:bg-blue-700 text-white text-sm font-semibold inline-flex items-center gap-2 transition disabled:opacity-60"
        >
          <Save className="w-4 h-4" />
          {saving ? 'Đang lưu...' : 'Lưu Pháp nhân & Thương hiệu'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Cột 1: Pháp nhân & Ngân hàng VietQR */}
        <div className="space-y-4">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
            <QrCode className="w-3.5 h-3.5 text-[#1E40FF]" /> Thông tin Pháp nhân & Thanh toán VietQR
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Tên Pháp nhân đầy đủ (GPKD)
              </label>
              <input
                value={form.legal_entity_name}
                onChange={(e) => setForm((p) => ({ ...p, legal_entity_name: e.target.value }))}
                placeholder="VD: Công ty Cổ phần Công nghệ DOMATION"
                className="w-full h-11 px-3 rounded-xl border border-slate-200 text-sm focus:border-[#1E40FF] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Mã số thuế (Tax Code)</label>
              <input
                value={form.tax_code}
                onChange={(e) => setForm((p) => ({ ...p, tax_code: e.target.value }))}
                placeholder="031xxxxxxx"
                className="w-full h-11 px-3 rounded-xl border border-slate-200 text-sm font-mono focus:border-[#1E40FF] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Email Hỗ trợ / Hóa đơn</label>
              <input
                type="email"
                value={form.support_email}
                onChange={(e) => setForm((p) => ({ ...p, support_email: e.target.value }))}
                placeholder="billing@company.vn"
                className="w-full h-11 px-3 rounded-xl border border-slate-200 text-sm focus:border-[#1E40FF] focus:outline-none"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-600 mb-1">Địa chỉ Trụ sở Pháp lý</label>
              <input
                value={form.legal_address}
                onChange={(e) => setForm((p) => ({ ...p, legal_address: e.target.value }))}
                placeholder="Số nhà, Đường, Phường/Xã, Quận/Huyện, Tỉnh/TP"
                className="w-full h-11 px-3 rounded-xl border border-slate-200 text-sm focus:border-[#1E40FF] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Người đại diện pháp luật</label>
              <input
                value={form.representative_name}
                onChange={(e) => setForm((p) => ({ ...p, representative_name: e.target.value }))}
                placeholder="Họ và tên"
                className="w-full h-11 px-3 rounded-xl border border-slate-200 text-sm focus:border-[#1E40FF] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Chức danh</label>
              <input
                value={form.representative_title}
                onChange={(e) => setForm((p) => ({ ...p, representative_title: e.target.value }))}
                placeholder="Tổng Giám đốc"
                className="w-full h-11 px-3 rounded-xl border border-slate-200 text-sm focus:border-[#1E40FF] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Ngân hàng (Mã VietQR)</label>
              <input
                list="dom-bank-bins"
                value={form.company_bank_name}
                onChange={(e) => setForm((p) => ({ ...p, company_bank_name: e.target.value }))}
                placeholder="TCB / VCB / ACB / MB..."
                className="w-full h-11 px-3 rounded-xl border border-slate-200 text-sm focus:border-[#1E40FF] focus:outline-none"
              />
              <datalist id="dom-bank-bins">
                {BANK_BIN_SUGGESTIONS.map((b) => (
                  <option key={b.code} value={b.code}>
                    {b.label}
                  </option>
                ))}
              </datalist>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Số tài khoản</label>
              <input
                value={form.company_bank_account}
                onChange={(e) => setForm((p) => ({ ...p, company_bank_account: e.target.value }))}
                placeholder="1903xxxxxxxx"
                className="w-full h-11 px-3 rounded-xl border border-slate-200 text-sm font-mono focus:border-[#1E40FF] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Chủ tài khoản (Không dấu)</label>
              <input
                value={form.company_bank_holder}
                onChange={(e) => setForm((p) => ({ ...p, company_bank_holder: e.target.value.toUpperCase() }))}
                placeholder="CONG TY..."
                className="w-full h-11 px-3 rounded-xl border border-slate-200 text-sm uppercase focus:border-[#1E40FF] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Mẫu khung VietQR</label>
              <select
                value={form.company_vietqr_template}
                onChange={(e) =>
                  setForm((p) => ({
                    ...p,
                    company_vietqr_template: e.target.value as BrandingBankFormState['company_vietqr_template'],
                  }))
                }
                className="w-full h-11 px-3 rounded-xl border border-slate-200 text-sm bg-white focus:border-[#1E40FF] focus:outline-none"
              >
                <option value="compact2">Compact2 (Chuẩn thanh toán)</option>
                <option value="compact">Compact (Gọn)</option>
                <option value="qr_only">Chỉ mã QR (Nhúng PDF)</option>
                <option value="print">Print (In quầy thu ngân)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Cột 2: Thương hiệu White-label & Preview VietQR */}
        <div className="space-y-4">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
            <Palette className="w-3.5 h-3.5 text-[#1E40FF]" /> Nhận diện Thương hiệu (White-Label SaaS)
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-600 mb-1">Tên hiển thị Thương hiệu</label>
              <input
                value={form.brand_display_name}
                onChange={(e) => setForm((p) => ({ ...p, brand_display_name: e.target.value }))}
                placeholder="Tên Workspace hiển thị trên Header & Email"
                className="w-full h-11 px-3 rounded-xl border border-slate-200 text-sm focus:border-[#1E40FF] focus:outline-none"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-600 mb-1">URL Logo doanh nghiệp</label>
              <input
                value={form.brand_logo_url}
                onChange={(e) => setForm((p) => ({ ...p, brand_logo_url: e.target.value }))}
                placeholder="https://cdn.example.com/logo.png"
                className="w-full h-11 px-3 rounded-xl border border-slate-200 text-sm focus:border-[#1E40FF] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Màu chủ đạo Giao diện</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={form.brand_primary_color}
                  onChange={(e) => setForm((p) => ({ ...p, brand_primary_color: e.target.value }))}
                  className="w-11 h-11 p-1 rounded-xl border border-slate-200 cursor-pointer"
                />
                <input
                  value={form.brand_primary_color}
                  onChange={(e) => setForm((p) => ({ ...p, brand_primary_color: e.target.value }))}
                  className="flex-1 h-11 px-3 rounded-xl border border-slate-200 text-sm font-mono"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Màu nhấn Email & Portal</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={form.brand_email_accent_color}
                  onChange={(e) => setForm((p) => ({ ...p, brand_email_accent_color: e.target.value }))}
                  className="w-11 h-11 p-1 rounded-xl border border-slate-200 cursor-pointer"
                />
                <input
                  value={form.brand_email_accent_color}
                  onChange={(e) => setForm((p) => ({ ...p, brand_email_accent_color: e.target.value }))}
                  className="flex-1 h-11 px-3 rounded-xl border border-slate-200 text-sm font-mono"
                />
              </div>
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-600 mb-1">Chân trang Email (Footer)</label>
              <input
                value={form.brand_email_footer_text}
                onChange={(e) => setForm((p) => ({ ...p, brand_email_footer_text: e.target.value }))}
                placeholder="Bản quyền © Doanh nghiệp của bạn. Mọi thông tin được bảo mật."
                className="w-full h-11 px-3 rounded-xl border border-slate-200 text-sm focus:border-[#1E40FF] focus:outline-none"
              />
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center gap-4">
            {form.brand_logo_url ? (
              <img
                src={form.brand_logo_url}
                alt="Logo thương hiệu"
                className="w-14 h-14 object-contain rounded-lg bg-white border border-slate-200 p-1"
              />
            ) : (
              <div
                className="w-14 h-14 rounded-lg flex items-center justify-center text-white font-bold text-lg"
                style={{ backgroundColor: form.brand_primary_color || '#1E40FF' }}
              >
                {(form.brand_display_name || 'D').slice(0, 1).toUpperCase()}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="text-sm font-bold text-slate-900 truncate">
                {form.brand_display_name || form.legal_entity_name || 'Chưa đặt tên thương hiệu'}
              </div>
              <div className="text-xs text-slate-500">
                {form.tax_code ? `MST: ${form.tax_code}` : 'Chưa nhập MST'} •{' '}
                {form.company_bank_name && form.company_bank_account
                  ? `${form.company_bank_name} - ${form.company_bank_account}`
                  : 'Chưa cấu hình VietQR'}
              </div>
            </div>
            {vietQrUrl && (
              <img
                src={vietQrUrl}
                alt="Xem trước VietQR"
                className="w-16 h-16 rounded-lg border border-slate-200 bg-white object-contain"
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
