import type { SaasPackageCode } from '../../autodataTypes';

export type IndustryPresetKey =
  | 'general'
  | 'real_estate'
  | 'retail'
  | 'healthcare'
  | 'manufacturing'
  | 'agency'
  | 'fnb'
  | 'education';

export type DataScopeKey =
  | 'none'
  | 'own'
  | 'team'
  | 'department'
  | 'sub_departments'
  | 'branch'
  | 'company';

export type RbacActionKey =
  | 'view'
  | 'create'
  | 'edit'
  | 'delete'
  | 'approve'
  | 'assign'
  | 'export'
  | 'import'
  | 'unmask_phone'
  | 'view_financials'
  | 'manage_config';

export interface TerminologyDictionary {
  customerLabel: string;
  customerPluralLabel: string;
  projectLabel: string;
  campaignLabel: string;
  dealLabel: string;
  productLabel: string;
  consultantLabel: string;
  orderLabel: string;
  quoteLabel: string;
  departmentLabel: string;
  customer_singular: string;
  customer_plural: string;
  project_singular: string;
  campaign_singular: string;
  deal_singular: string;
  consultant_singular: string;
  product_singular: string;
  order_singular: string;
  quote_singular: string;
  [key: string]: string;
}

export interface PackageCatalogMeta {
  code: SaasPackageCode;
  stepOrder: number;
  shortName: string;
  name: string;
  badge: string;
  tagline: string;
  monthlyPriceVnd: number;
  annualMonthlyEquivalentVnd: number;
  accentColor: string;
  highlights: string[];
  defaultModules: string[];
}

export const DATA_SCOPES_CATALOG: ReadonlyArray<{
  key: DataScopeKey;
  label: string;
  shortLabel: string;
  rank: number;
  description: string;
}> = [
  { key: 'none', label: 'Không truy cập (None)', shortLabel: 'Khóa', rank: 0, description: 'Ẩn hoàn toàn dữ liệu phân hệ này' },
  { key: 'own', label: 'Cá nhân phụ trách (Own)', shortLabel: 'Cá nhân', rank: 1, description: 'Chỉ xem bản ghi do chính mình tạo hoặc phụ trách' },
  { key: 'team', label: 'Trong Tổ / Nhóm (Team)', shortLabel: 'Nhóm', rank: 2, description: 'Xem dữ liệu của các thành viên cùng Team' },
  { key: 'department', label: 'Trong Phòng ban (Department)', shortLabel: 'Phòng ban', rank: 3, description: 'Xem dữ liệu thuộc phòng ban trực tiếp' },
  { key: 'sub_departments', label: 'Phòng ban & Cấp dưới (Sub-Depts)', shortLabel: 'Khối / Cấp dưới', rank: 4, description: 'Bao gồm phòng ban hiện tại và các phòng trực thuộc' },
  { key: 'branch', label: 'Toàn Chi nhánh (Branch)', shortLabel: 'Chi nhánh', rank: 5, description: 'Toàn bộ dữ liệu trong cùng pháp nhân / chi nhánh' },
  { key: 'company', label: 'Toàn Doanh nghiệp (Company)', shortLabel: 'Toàn công ty', rank: 6, description: 'Truy cập xuyên suốt mọi chi nhánh và phòng ban' },
];

export const RBAC_ACTIONS_CATALOG: ReadonlyArray<{
  key: RbacActionKey;
  label: string;
  shortLabel: string;
  sensitive?: boolean;
}> = [
  { key: 'view', label: 'Xem danh sách & chi tiết', shortLabel: 'Xem' },
  { key: 'create', label: 'Tạo mới bản ghi', shortLabel: 'Tạo' },
  { key: 'edit', label: 'Chỉnh sửa thông tin', shortLabel: 'Sửa' },
  { key: 'delete', label: 'Xóa / Lưu trữ', shortLabel: 'Xóa', sensitive: true },
  { key: 'approve', label: 'Phê duyệt đề xuất / chứng từ', shortLabel: 'Duyệt' },
  { key: 'assign', label: 'Chia số / Chuyển người phụ trách', shortLabel: 'Chia số' },
  { key: 'export', label: 'Xuất file Excel / CSV', shortLabel: 'Xuất file', sensitive: true },
  { key: 'import', label: 'Nhập dữ liệu hàng loạt', shortLabel: 'Nhập file' },
  { key: 'unmask_phone', label: 'Xem SĐT / Email gốc (Không che)', shortLabel: 'Mở che SĐT', sensitive: true },
  { key: 'view_financials', label: 'Xem Giá vốn / Lương / Hoa hồng', shortLabel: 'Tài chính mật', sensitive: true },
  { key: 'manage_config', label: 'Cấu hình quy tắc phân hệ', shortLabel: 'Cấu hình', sensitive: true },
];

export const RBAC_MODULES_CATALOG: ReadonlyArray<{
  key: string;
  label: string;
  suite: 'crm' | 'marketing' | 'growth' | 'erp' | 'core';
}> = [
  { key: 'leads', label: 'Khách hàng 360° & Data CRM', suite: 'crm' },
  { key: 'rounds', label: 'Vòng chia Sale & Định tuyến', suite: 'crm' },
  { key: 'tickets_data', label: 'Ticket Báo lỗi & Bù số', suite: 'crm' },
  { key: 'ads_capi', label: 'Hiệu quả Quảng cáo & Meta CAPI', suite: 'crm' },
  { key: 'audiences', label: 'Tệp Data & Tệp Logic', suite: 'marketing' },
  { key: 'email_templates', label: 'Email Editor & Kho Mẫu', suite: 'marketing' },
  { key: 'forms_triggers', label: 'Form Builder, Form Cards & OTP', suite: 'marketing' },
  { key: 'campaigns', label: 'Chiến dịch Email & Zalo ZNS', suite: 'marketing' },
  { key: 'automation_flows', label: 'Automation Flow Visual Builder', suite: 'marketing' },
  { key: 'growth_attribution', label: 'Báo cáo Doanh thu & ROAS Xuyên phễu', suite: 'growth' },
  { key: 'erp_hrm_org', label: 'Nhân sự, Hồ sơ & Hợp đồng', suite: 'erp' },
  { key: 'erp_attendance', label: 'Chấm công GPS/Selfie & Ca trực', suite: 'erp' },
  { key: 'erp_payroll', label: 'Bảng lương, Thuế TNCN & Hoa hồng', suite: 'erp' },
  { key: 'erp_approvals', label: 'Trung tâm Phê duyệt Đa cấp', suite: 'erp' },
  { key: 'erp_projects_tasks', label: 'Dự án Kanban/Gantt & Helpdesk', suite: 'erp' },
  { key: 'erp_finance_inventory', label: 'Tài chính, Báo giá, SO/PO & Kho FIFO', suite: 'erp' },
  { key: 'erp_cloud_ocr', label: 'Tài liệu Cloud & AI OCR', suite: 'erp' },
  { key: 'dom_agent', label: 'Hội đồng Trợ lý AI DOM Agent', suite: 'erp' },
  { key: 'org_rbac', label: 'Cài đặt Sơ đồ Tổ chức & Phân quyền', suite: 'core' },
];

const CRM_MODULES = [
  'crm_dashboard',
  'leads',
  'pipelines',
  'rounds',
  'fair_share',
  'routing_rules',
  'gatekeeper',
  'tickets_data',
  'ads_capi',
  'consultants',
  'sale_portal',
  'integrations_autodata',
  'dom_sales_copilot',
  'settings',
  'org_rbac',
  'billing',
];

const MARKETING_MODULES = [
  'mkt_dashboard',
  'audiences',
  'email_templates',
  'forms_triggers',
  'surveys_quiz',
  'campaigns',
  'automation_flows',
  'vouchers_qr',
  'web_tracking',
  'social_bot',
  'ai_bot_studio',
  'integrations_marketing',
  'dom_marketing_copilot',
  'settings',
  'org_rbac',
  'billing',
];

const GROWTH_MODULES = Array.from(
  new Set([
    ...CRM_MODULES,
    ...MARKETING_MODULES,
    'growth_attribution',
    'integrations_unified',
  ])
);

const ERP_PROMAX_MODULES = Array.from(
  new Set([
    ...GROWTH_MODULES,
    'erp_hrm_org',
    'erp_attendance',
    'erp_payroll',
    'erp_approvals',
    'erp_projects_tasks',
    'erp_workchat',
    'erp_finance_inventory',
    'erp_cloud_ocr',
    'dom_agent',
  ])
);

export const SAAS_PACKAGES_CATALOG: Record<SaasPackageCode, PackageCatalogMeta> = {
  autodata_crm: {
    code: 'autodata_crm',
    stepOrder: 1,
    shortName: 'Gói 1 • Auto Data & CRM',
    name: 'Auto Data & CRM',
    badge: 'Chia Số Sale Tức Thì',
    tagline: 'Chia Lead công bằng theo giây, quản lý phễu Sale, AI Gatekeeper & Meta CAPI v21.0.',
    monthlyPriceVnd: 1_500_000,
    annualMonthlyEquivalentVnd: 1_275_000,
    accentColor: '#1E40FF',
    highlights: [
      'Vòng chia Fair-Share, Trọng số & Bù số Ticket tự động',
      'AI Pre-screener lọc rác đầu vào & Cổng trực Sale Portal',
      'Kết nối Webhook, Google Sheets 2 chiều, ZaloBot & Meta CAPI',
      'Phễu CRM Pipeline động & bảo mật che SĐT ngay từ Server',
    ],
    defaultModules: CRM_MODULES,
  },
  marketing_standalone: {
    code: 'marketing_standalone',
    stepOrder: 2,
    shortName: 'Gói 2 • Marketing Standalone',
    name: 'Marketing Automation Standalone',
    badge: 'Nuôi Dưỡng Đa Kênh',
    tagline: 'Thu thập Lead qua Form Card, phân Tệp Data / Tệp Logic, gửi Email/ZNS & Flow tự động.',
    monthlyPriceVnd: 2_200_000,
    annualMonthlyEquivalentVnd: 1_870_000,
    accentColor: '#0284C7',
    highlights: [
      'Quản trị Tệp Data (CSV/Form) & Tệp Logic (AND/OR Real-time)',
      'Email Editor 15 khối kéo-thả, Form Cards, Survey/Quiz 25 khối',
      'Automation Flow Visual Canvas, Chiến dịch Email/ZNS & Voucher QR',
      'Kết nối riêng AWS SES / SMTP, DKIM/SPF, Zalo OA/ZNS & Web Tracking',
    ],
    defaultModules: MARKETING_MODULES,
  },
  growth_combo: {
    code: 'growth_combo',
    stepOrder: 3,
    shortName: 'Gói 3 • Growth Suite Combo',
    name: 'Growth Suite (CRM + Marketing)',
    badge: 'Khép Kín Doanh Thu',
    tagline: 'Hợp nhất 100% Gói 1 + Gói 2: Quảng cáo/Form -> Nuôi dưỡng -> Chia Sale -> Đo ROAS thực.',
    monthlyPriceVnd: 3_200_000,
    annualMonthlyEquivalentVnd: 2_720_000,
    accentColor: '#4F46E5',
    highlights: [
      'Mở khóa trọn vẹn Auto Data & CRM + Marketing Automation trên 1 Hồ sơ 360°',
      'Tự động đẩy khách đạt ngưỡng nóng từ Tệp Logic / Flow vào Vòng chia Sale',
      'Lưu bộ lọc CRM thành Tệp Data nuôi dưỡng lại khách chưa chốt (Re-engagement)',
      'Unified Growth & Revenue Attribution: đo ROAS thực tế từng Email/Form/Ads',
    ],
    defaultModules: GROWTH_MODULES,
  },
  domation_promax: {
    code: 'domation_promax',
    stepOrder: 4,
    shortName: 'Gói 4 • DOMATION PROMAX',
    name: 'DOMATION PROMAX — Full Suite ERP',
    badge: 'Hệ Sinh Thái Toàn Diện',
    tagline: 'Quản trị toàn diện Doanh nghiệp: Growth Suite + 9 Cụm ERP Nội bộ + Hội đồng DOM Agent.',
    monthlyPriceVnd: 6_000_000,
    annualMonthlyEquivalentVnd: 5_100_000,
    accentColor: '#0F172A',
    highlights: [
      'Bao gồm toàn bộ Growth Suite (CRM + Auto Data + Marketing Automation)',
      'Nhân sự HRM, Sơ đồ tổ chức, Chấm công GPS/Selfie & Bảng lương/Thuế A-Z',
      'Động cơ Phê duyệt N cấp động, Dự án Kanban/Gantt, WorkChat & Tài liệu OCR',
      'Tài chính, Báo giá, SO/PO, Kho FIFO, Tài sản & Hội đồng AI DOM Agent',
    ],
    defaultModules: ERP_PROMAX_MODULES,
  },
};

function makeDictionary(input: {
  customerLabel: string;
  customerPluralLabel: string;
  projectLabel: string;
  campaignLabel: string;
  dealLabel: string;
  productLabel: string;
  consultantLabel: string;
  orderLabel: string;
  quoteLabel: string;
  departmentLabel?: string;
}): TerminologyDictionary {
  const dept = input.departmentLabel || 'Phòng ban';
  return {
    customerLabel: input.customerLabel,
    customerPluralLabel: input.customerPluralLabel,
    projectLabel: input.projectLabel,
    campaignLabel: input.campaignLabel,
    dealLabel: input.dealLabel,
    productLabel: input.productLabel,
    consultantLabel: input.consultantLabel,
    orderLabel: input.orderLabel,
    quoteLabel: input.quoteLabel,
    departmentLabel: dept,
    customer_singular: input.customerLabel,
    customer_plural: input.customerPluralLabel,
    project_singular: input.projectLabel,
    campaign_singular: input.campaignLabel,
    deal_singular: input.dealLabel,
    consultant_singular: input.consultantLabel,
    product_singular: input.productLabel,
    order_singular: input.orderLabel,
    quote_singular: input.quoteLabel,
  };
}

export const INDUSTRY_PRESETS: Record<
  IndustryPresetKey,
  {
    key: IndustryPresetKey;
    name: string;
    subtitle: string;
    dictionary: TerminologyDictionary;
  }
> = {
  general: {
    key: 'general',
    name: 'Đa ngành Chuẩn B2B/B2C',
    subtitle: 'Thuật ngữ thương mại trung lập cho mọi loại hình doanh nghiệp',
    dictionary: makeDictionary({
      customerLabel: 'Khách hàng',
      customerPluralLabel: 'Danh sách Khách hàng',
      projectLabel: 'Dự án',
      campaignLabel: 'Chiến dịch',
      dealLabel: 'Cơ hội / Giao dịch',
      productLabel: 'Sản phẩm / Dịch vụ',
      consultantLabel: 'Chuyên viên tư vấn',
      orderLabel: 'Đơn bán hàng',
      quoteLabel: 'Báo giá',
    }),
  },
  real_estate: {
    key: 'real_estate',
    name: 'Bất động sản (CĐT & Sàn F1)',
    subtitle: 'Tối ưu cho Chủ đầu tư, Sàn phân phối F1, Giỏ hàng & Booking giữ chỗ',
    dictionary: makeDictionary({
      customerLabel: 'Khách mua / Nhà đầu tư',
      customerPluralLabel: 'Khách mua & Nhà đầu tư',
      projectLabel: 'Dự án BĐS',
      campaignLabel: 'Giỏ hàng / Đợt mở bán',
      dealLabel: 'Giao dịch / Booking',
      productLabel: 'Căn hộ / Sản phẩm',
      consultantLabel: 'Chuyên viên Sàn / F1',
      orderLabel: 'Phiếu Đặt cọc / HĐMB',
      quoteLabel: 'Bảng tính dòng tiền',
    }),
  },
  retail: {
    key: 'retail',
    name: 'Bán lẻ & Thương mại điện tử',
    subtitle: 'Tối ưu cho chuỗi cửa hàng bán lẻ, D2C, SKU & Chương trình khuyến mãi',
    dictionary: makeDictionary({
      customerLabel: 'Khách mua hàng',
      customerPluralLabel: 'Tệp Người mua',
      projectLabel: 'Dòng sản phẩm',
      campaignLabel: 'Chương trình Khuyến mãi',
      dealLabel: 'Đơn hàng tiềm năng',
      productLabel: 'Sản phẩm SKU',
      consultantLabel: 'Nhân viên Bán hàng',
      orderLabel: 'Đơn bán hàng',
      quoteLabel: 'Báo giá đơn hàng',
    }),
  },
  healthcare: {
    key: 'healthcare',
    name: 'Y tế, Nha khoa & Thẩm mỹ',
    subtitle: 'Tối ưu cho Phòng khám, Nha khoa, Spa công nghệ cao & Liệu trình',
    dictionary: makeDictionary({
      customerLabel: 'Bệnh nhân / Khách hàng',
      customerPluralLabel: 'Hồ sơ Bệnh nhân',
      projectLabel: 'Chuyên khoa / Dịch vụ',
      campaignLabel: 'Gói liệu trình',
      dealLabel: 'Hồ sơ điều trị',
      productLabel: 'Dịch vụ / Liệu trình',
      consultantLabel: 'Bác sĩ / Tư vấn viên',
      orderLabel: 'Phiếu thu dịch vụ',
      quoteLabel: 'Phác đồ & Chi phí',
    }),
  },
  manufacturing: {
    key: 'manufacturing',
    name: 'Sản xuất & Phân phối B2B',
    subtitle: 'Tối ưu cho Nhà máy, Đại lý cấp 1-2, Hợp đồng khung & Đơn sỉ PO/SO',
    dictionary: makeDictionary({
      customerLabel: 'Đại lý / Đối tác',
      customerPluralLabel: 'Hệ thống Đại lý & Đối tác',
      projectLabel: 'Hợp đồng khung',
      campaignLabel: 'Đợt chào hàng',
      dealLabel: 'Đơn sỉ B2B',
      productLabel: 'Vật tư / Thành phẩm',
      consultantLabel: 'Kinh doanh B2B',
      orderLabel: 'Đơn đặt hàng SO/PO',
      quoteLabel: 'Báo giá sỉ',
    }),
  },
  agency: {
    key: 'agency',
    name: 'Agency & Dịch vụ Chuyên nghiệp',
    subtitle: 'Tối ưu cho Marketing/IT Agency, Tư vấn doanh nghiệp & Hợp đồng Retainer',
    dictionary: makeDictionary({
      customerLabel: 'Client',
      customerPluralLabel: 'Danh sách Clients',
      projectLabel: 'Dự án / Retainer',
      campaignLabel: 'Chiến dịch Marketing',
      dealLabel: 'Hợp đồng dịch vụ',
      productLabel: 'Gói giải pháp',
      consultantLabel: 'Account Manager',
      orderLabel: 'Service Order',
      quoteLabel: 'Proposal / Báo giá',
    }),
  },
  fnb: {
    key: 'fnb',
    name: 'F&B & Chuỗi Nhượng quyền',
    subtitle: 'Tối ưu cho Nhà hàng, Cafe, Hội viên tích điểm & Ưu đãi Voucher',
    dictionary: makeDictionary({
      customerLabel: 'Thực khách / Hội viên',
      customerPluralLabel: 'Hội viên Thực khách',
      projectLabel: 'Thương hiệu / Chi nhánh',
      campaignLabel: 'Ưu đãi Voucher',
      dealLabel: 'Đặt tiệc / Nhượng quyền',
      productLabel: 'Menu / Combo',
      consultantLabel: 'Quản lý Cửa hàng',
      orderLabel: 'Hóa đơn POS / Đặt tiệc',
      quoteLabel: 'Báo giá Sự kiện',
    }),
  },
  education: {
    key: 'education',
    name: 'Giáo dục & Đào tạo (Add-on)',
    subtitle: 'Mở nhãn Học viên / Khóa học & có thể bật thêm phân hệ Học vụ chuyên sâu',
    dictionary: makeDictionary({
      customerLabel: 'Học viên',
      customerPluralLabel: 'Danh sách Học viên',
      projectLabel: 'Chương trình đào tạo',
      campaignLabel: 'Khóa học / Đợt tuyển sinh',
      dealLabel: 'Hồ sơ nhập học',
      productLabel: 'Khóa học / Học phần',
      consultantLabel: 'Tư vấn tuyển sinh',
      orderLabel: 'Phiếu thu học phí',
      quoteLabel: 'Thông báo học phí',
    }),
  },
};

export function normalizePackageCode(
  rawPackage?: string | null,
  rawPlanTier?: string | null,
  rawPlanCode?: string | null
): SaasPackageCode {
  const candidates = [rawPackage, rawPlanTier, rawPlanCode]
    .map((v) => String(v || '').trim().toLowerCase())
    .filter(Boolean);

  for (const c of candidates) {
    if (
      c === 'autodata_crm' ||
      c === 'marketing_standalone' ||
      c === 'growth_combo' ||
      c === 'domation_promax'
    ) {
      return c;
    }
    if (c === 'domation_crm_erp' || c === 'enterprise' || c === 'promax') {
      return 'domation_promax';
    }
    if (c === 'marketing' || c === 'mkt_standalone') {
      return 'marketing_standalone';
    }
    if (c === 'combo' || c === 'growth_suite') {
      return 'growth_combo';
    }
  }
  return 'autodata_crm';
}

export function normalizeIndustryKey(raw?: string | null): IndustryPresetKey {
  const key = String(raw || '').trim().toLowerCase();
  if (key in INDUSTRY_PRESETS) {
    return key as IndustryPresetKey;
  }
  if (key.includes('bất động sản') || key.includes('bds') || key.includes('real')) return 'real_estate';
  if (key.includes('y tế') || key.includes('nha khoa') || key.includes('spa')) return 'healthcare';
  if (key.includes('bán lẻ') || key.includes('ecommerce')) return 'retail';
  if (key.includes('sản xuất')) return 'manufacturing';
  if (key.includes('agency')) return 'agency';
  if (key.includes('f&b') || key.includes('nhà hàng')) return 'fnb';
  if (key.includes('giáo dục') || key.includes('đào tạo')) return 'education';
  return 'general';
}

export function buildResolvedTerminology(
  industryKey: IndustryPresetKey,
  overrides?: Record<string, unknown> | null
): TerminologyDictionary {
  const base = INDUSTRY_PRESETS[industryKey]?.dictionary || INDUSTRY_PRESETS.general.dictionary;
  const raw = overrides && typeof overrides === 'object' ? overrides : {};
  const strOverrides: Record<string, string> = {};
  for (const [k, v] of Object.entries(raw)) {
    if (typeof v === 'string' && v.trim()) {
      strOverrides[k] = v.trim();
    }
  }

  const customerLabel =
    strOverrides.customerLabel || strOverrides.customer_singular || base.customerLabel;
  const customerPluralLabel =
    strOverrides.customerPluralLabel || strOverrides.customer_plural || base.customerPluralLabel;
  const projectLabel =
    strOverrides.projectLabel || strOverrides.project_singular || base.projectLabel;
  const campaignLabel =
    strOverrides.campaignLabel || strOverrides.campaign_singular || base.campaignLabel;
  const dealLabel =
    strOverrides.dealLabel || strOverrides.deal_singular || base.dealLabel;
  const productLabel =
    strOverrides.productLabel || strOverrides.product_singular || base.productLabel;
  const consultantLabel =
    strOverrides.consultantLabel || strOverrides.consultant_singular || base.consultantLabel;
  const orderLabel =
    strOverrides.orderLabel || strOverrides.order_singular || base.orderLabel;
  const quoteLabel =
    strOverrides.quoteLabel || strOverrides.quote_singular || base.quoteLabel;
  const departmentLabel =
    strOverrides.departmentLabel || strOverrides.department_singular || base.departmentLabel;

  return {
    ...base,
    ...strOverrides,
    customerLabel,
    customerPluralLabel,
    projectLabel,
    campaignLabel,
    dealLabel,
    productLabel,
    consultantLabel,
    orderLabel,
    quoteLabel,
    departmentLabel,
    customer_singular: customerLabel,
    customer_plural: customerPluralLabel,
    project_singular: projectLabel,
    campaign_singular: campaignLabel,
    deal_singular: dealLabel,
    consultant_singular: consultantLabel,
    product_singular: productLabel,
    order_singular: orderLabel,
    quote_singular: quoteLabel,
  };
}

export function computeDefaultEnabledModules(
  packageCode: SaasPackageCode,
  educationAddon: boolean
): string[] {
  const base = SAAS_PACKAGES_CATALOG[packageCode]?.defaultModules || SAAS_PACKAGES_CATALOG.autodata_crm.defaultModules;
  if (educationAddon && packageCode === 'domation_promax') {
    return Array.from(new Set([...base, 'education_addon']));
  }
  return base.filter((m) => m !== 'education_addon' || educationAddon);
}

export function maskPiiPhone(phone?: string | null, canUnmask = false): string {
  if (!phone) return '—';
  if (canUnmask || phone.includes('*')) return phone;
  const digits = phone.replace(/[^\d+]/g, '');
  if (digits.length <= 6) return `${digits.slice(0, 2)}****`;
  return `${digits.slice(0, 3)}****${digits.slice(-3)}`;
}

export function maskPiiEmail(email?: string | null, canUnmask = false): string {
  if (!email) return '—';
  if (canUnmask || email.includes('*')) return email;
  const parts = email.split('@');
  if (parts.length !== 2) return email;
  const [local, domain] = parts;
  if (local.length <= 2) return `${local.slice(0, 1)}***@${domain}`;
  return `${local.slice(0, 2)}***${local.slice(-1)}@${domain}`;
}

export function localPackageOverrideKey(tenantSlug: string): string {
  return `domation_pkg_override_${tenantSlug || 'default'}`;
}
