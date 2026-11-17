import React, { useState } from 'react';
import {
  BookOpen,
  CheckCircle2,
  Globe,
  GraduationCap,
  Palette,
  Save,
  Sparkles,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { ToggleSwitch } from '../../components/ui/ToggleSwitch';
import { Badge, Card, FormCard } from '../../components/ui/AutoDataLoadingModal';
import { apiRequest, getErrorMessage } from '../../../autodataApi';
import { useAuth } from '../../contexts/AuthContext';
import { useEntitlement } from '../../contexts/EntitlementContext';
import {
  INDUSTRY_PRESETS,
  type IndustryPresetKey,
} from '../../contexts/entitlementConstants';

const EDITABLE_LABEL_FIELDS: ReadonlyArray<{
  key: string;
  label: string;
  placeholder: string;
}> = [
  { key: 'customerLabel', label: 'Nhãn Khách hàng (Số ít)', placeholder: 'Khách hàng / Bệnh nhân / Đại lý...' },
  { key: 'customerPluralLabel', label: 'Nhãn Danh sách Khách hàng', placeholder: 'Danh sách Khách hàng' },
  { key: 'projectLabel', label: 'Nhãn Dự án / Dòng sản phẩm', placeholder: 'Dự án / Chuyên khoa / Hợp đồng khung' },
  { key: 'campaignLabel', label: 'Nhãn Chiến dịch / Đợt mở bán', placeholder: 'Chiến dịch / Giỏ hàng / Gói liệu trình' },
  { key: 'dealLabel', label: 'Nhãn Cơ hội / Giao dịch', placeholder: 'Giao dịch / Booking / Đơn sỉ B2B' },
  { key: 'productLabel', label: 'Nhãn Sản phẩm / Dịch vụ', placeholder: 'Sản phẩm / Căn hộ / SKU' },
  { key: 'consultantLabel', label: 'Nhãn Nhân sự Tư vấn', placeholder: 'Chuyên viên tư vấn / Bác sĩ / Account' },
  { key: 'orderLabel', label: 'Nhãn Đơn hàng / Phiếu thu', placeholder: 'Đơn bán hàng / Phiếu Đặt cọc' },
  { key: 'quoteLabel', label: 'Nhãn Báo giá / Đề xuất', placeholder: 'Báo giá / Proposal / Phác đồ' },
];

export const TerminologySettingsTab: React.FC = () => {
  const { token, tenantSlug, tenantSettings } = useAuth();
  const {
    industryKey: currentIndustry,
    terminology: currentTerm,
    educationAddon: currentEdu,
    enableIdeasMascot: currentMascot,
    applyTerminologyLocal,
  } = useEntitlement();

  const [selectedIndustry, setSelectedIndustry] = useState<IndustryPresetKey>(currentIndustry);
  const [draftLabels, setDraftLabels] = useState<Record<string, string>>(() => ({
    customerLabel: currentTerm.customerLabel,
    customerPluralLabel: currentTerm.customerPluralLabel,
    projectLabel: currentTerm.projectLabel,
    campaignLabel: currentTerm.campaignLabel,
    dealLabel: currentTerm.dealLabel,
    productLabel: currentTerm.productLabel,
    consultantLabel: currentTerm.consultantLabel,
    orderLabel: currentTerm.orderLabel,
    quoteLabel: currentTerm.quoteLabel,
  }));
  const [educationAddon, setEducationAddon] = useState<boolean>(currentEdu);
  const [revenueSource, setRevenueSource] = useState<string>(
    typeof tenantSettings.revenue_source === 'string'
      ? tenantSettings.revenue_source
      : 'won_deals'
  );
  const [brandLogoUrl, setBrandLogoUrl] = useState<string>(
    typeof tenantSettings.brand_logo_url === 'string' ? tenantSettings.brand_logo_url : ''
  );
  const [saving, setSaving] = useState(false);

  const handleSelectPreset = (presetKey: IndustryPresetKey) => {
    setSelectedIndustry(presetKey);
    const dict = INDUSTRY_PRESETS[presetKey].dictionary;
    setDraftLabels({
      customerLabel: dict.customerLabel,
      customerPluralLabel: dict.customerPluralLabel,
      projectLabel: dict.projectLabel,
      campaignLabel: dict.campaignLabel,
      dealLabel: dict.dealLabel,
      productLabel: dict.productLabel,
      consultantLabel: dict.consultantLabel,
      orderLabel: dict.orderLabel,
      quoteLabel: dict.quoteLabel,
    });
    if (presetKey === 'education') {
      setEducationAddon(true);
    } else if (selectedIndustry === 'education') {
      setEducationAddon(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const normalizedTerminology = {
      ...draftLabels,
      customer_singular: draftLabels.customerLabel,
      customer_plural: draftLabels.customerPluralLabel,
      project_singular: draftLabels.projectLabel,
      campaign_singular: draftLabels.campaignLabel,
      deal_singular: draftLabels.dealLabel,
      product_singular: draftLabels.productLabel,
      consultant_singular: draftLabels.consultantLabel,
      order_singular: draftLabels.orderLabel,
      quote_singular: draftLabels.quoteLabel,
    };

    try {
      await apiRequest('/org-rbac/terminology', {
        method: 'PUT',
        token,
        tenantSlug,
        body: {
          industry_key: selectedIndustry,
          terminology: normalizedTerminology,
          education_addon: educationAddon,
          enable_ideas_mascot: false,
          revenue_source: revenueSource,
          brand_logo_url: brandLogoUrl.trim() || undefined,
        },
      });
      applyTerminologyLocal({
        industryKey: selectedIndustry,
        terminology: normalizedTerminology,
        educationAddon,
        enableIdeasMascot: currentMascot,
      });
      toast.success('Đã cập nhật Từ điển Đa ngành & Thương hiệu trên toàn bộ Workspace!');
    } catch (err) {
      toast.error(getErrorMessage(err, 'Không thể lưu Từ điển Đa ngành.'));
    } finally {
      setSaving(false);
    }
  };

  const presetList = Object.values(INDUSTRY_PRESETS);

  return (
    <form
      onSubmit={handleSave}
      data-tour="settings-terminology-root"
      style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}
    >
      {/* 7 Industry Presets + Neutral Default */}
      <Card
        title="Chọn Nhanh Bộ Thuật Ngữ Ngành Nghề (Domain-Neutral Presets)"
        subtitle="Toàn bộ Menu, Tiêu đề bảng, Tệp Logic, Biến trộn Email và câu chữ của DOM Agent sẽ tự động dịch theo ngành của doanh nghiệp"
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
            gap: '0.85rem',
          }}
        >
          {presetList.map((preset) => {
            const isSelected = selectedIndustry === preset.key;
            return (
              <FormCard
                key={preset.key}
                selected={isSelected}
                onClick={() => handleSelectPreset(preset.key)}
                icon={<Globe size={18} />}
                title={preset.name}
                description={preset.subtitle}
                badge={
                  isSelected ? (
                    <Badge tone="primary" icon={<CheckCircle2 size={11} />}>
                      Đang chọn
                    </Badge>
                  ) : undefined
                }
              >
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                  <Badge tone="neutral">{preset.dictionary.customerLabel}</Badge>
                  <Badge tone="neutral">{preset.dictionary.projectLabel}</Badge>
                  <Badge tone="neutral">{preset.dictionary.dealLabel}</Badge>
                </div>
              </FormCard>
            );
          })}
        </div>
      </Card>

      {/* Fine-Grained Custom Overrides */}
      <Card
        title="Tùy Chỉnh Nhãn Chi Tiết Cho Từng Đối Tượng"
        subtitle="Cho phép tinh chỉnh chính xác từng từ ngữ phù hợp văn hóa vận hành riêng của công ty"
        actions={<Badge tone="info" icon={<BookOpen size={12} />}>Biến trộn động: {'{{customer.name}}'}</Badge>}
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '0.9rem',
          }}
        >
          {EDITABLE_LABEL_FIELDS.map((field) => (
            <div key={field.key} className="form-group">
              <label className="form-label">{field.label}</label>
              <input
                type="text"
                className="form-input"
                placeholder={field.placeholder}
                value={draftLabels[field.key] || ''}
                onChange={(e) =>
                  setDraftLabels((prev) => ({ ...prev, [field.key]: e.target.value }))
                }
              />
            </div>
          ))}
        </div>
      </Card>

      {/* Education Add-on, Revenue Source & White-Label Branding */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1rem' }}>
        <Card
          title="Education Vertical Add-on & Công Thức Doanh Thu"
          subtitle="Phân hệ Học vụ (Bảng điểm, Lịch giảng) được đóng gói gọn gàng — hoàn toàn ẩn đối với các ngành khác"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.85rem 1rem',
                borderRadius: 14,
                background: '#F8FAFF',
                border: '1px solid #E2E8F0',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <GraduationCap size={20} color="#1E40FF" />
                <div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 700 }}>Bật Phân hệ Đào tạo / Học vụ</div>
                  <div style={{ fontSize: '0.75rem', color: '#64748B' }}>
                    Mở menu Lịch giảng, Khóa học & Bảng điểm trên gói PROMAX
                  </div>
                </div>
              </div>
              <ToggleSwitch checked={educationAddon} onChange={setEducationAddon} />
            </div>

            <div className="form-group">
              <label className="form-label">Nguồn Doanh thu Chuẩn trên Dashboard (Không cộng trùng)</label>
              <select
                className="form-input"
                value={revenueSource}
                onChange={(e) => setRevenueSource(e.target.value)}
              >
                <option value="won_deals">Giá trị {draftLabels.dealLabel || 'Giao dịch'} Thắng (Closed Won)</option>
                <option value="approved_sales_orders">{draftLabels.orderLabel || 'Đơn bán hàng'} SO đã phê duyệt</option>
                <option value="collected_deposits">Tiền Đặt cọc thực thu</option>
                <option value="paid_invoices">Hóa đơn Kế toán đã thanh toán</option>
              </select>
            </div>
          </div>
        </Card>

        <Card
          title="White-Label Logo Doanh Nghiệp & DOM Agent"
          subtitle="Mặc định hiển thị Logo robot DOMATION (/imgs/autodata/ICON.png) — hỗ trợ thay bằng Logo riêng của công ty"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
            <div className="form-group">
              <label className="form-label">Đường dẫn URL Logo Công ty (Tùy chọn White-Label)</label>
              <input
                type="url"
                className="form-input"
                placeholder="https://cdn.tencongty.vn/logo.png (Bỏ trống = Logo robot DOMATION)"
                value={brandLogoUrl}
                onChange={(e) => setBrandLogoUrl(e.target.value)}
              />
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '0.75rem 1rem',
                borderRadius: 14,
                background: '#F8F9FA',
                border: '1px solid #E2E8F0',
              }}
            >
              <img
                src={brandLogoUrl.trim() || '/imgs/autodata/ICON.png'}
                alt="Preview Logo"
                style={{ width: 44, height: 44, objectFit: 'contain', borderRadius: 10, background: '#FFFFFF', padding: 4, border: '1px solid #E2E8F0' }}
              />
              <div style={{ fontSize: '0.78rem', color: '#475569' }}>
                <strong style={{ color: '#0F172A' }}>Xem trước tâm điểm Modal Loading & DOM Agent</strong>
                <div>Mascot nội bộ cũ đã tắt sạch (<code>enable_ideas_mascot = false</code>).</div>
              </div>
              <Palette size={18} color="#1E40FF" style={{ marginLeft: 'auto' }} />
            </div>
          </div>
        </Card>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button
          type="submit"
          disabled={saving}
          className="btn-inkica-primary"
          style={{
            height: 46,
            padding: '0 1.5rem',
            borderRadius: 16,
            border: 'none',
            color: '#FFFFFF',
            fontWeight: 700,
            fontSize: '0.9rem',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            cursor: 'pointer',
          }}
        >
          <Save size={16} />
          {saving ? 'Đang lưu cấu hình...' : 'Lưu Từ Điển Đa Ngành & Giao Diện'}
          <Sparkles size={15} />
        </button>
      </div>
    </form>
  );
};
