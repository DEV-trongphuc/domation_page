export type CloudOpsTabKey = 'drive' | 'ocr' | 'search_docs';
export type CloudViewMode = 'grid' | 'list';

export interface CloudFolderItem {
  id: string;
  name: string;
  storage_prefix: string;
  visibility: 'company' | 'departments' | 'private';
  allowed_department_ids: string[];
  created_at: string;
}

export interface CloudFileCategoryItem {
  id: string;
  category_key: string;
  label: string;
  icon_type: string;
  visibility: 'company' | 'departments' | 'private';
  allowed_department_ids: string[];
  allowed_role_ids: string[];
  sort_order: number;
  created_at?: string;
}

export interface CloudFileItem {
  id: string;
  folder_id?: string | null;
  folder_name?: string | null;
  project_id?: string | null;
  lead_id?: string | null;
  category_key: string;
  name: string;
  storage_key: string;
  file_url?: string | null;
  mime_type: string;
  size_bytes: number;
  version_tag: string;
  visibility: 'company' | 'departments' | 'private';
  allowed_department_ids: string[];
  checksum_sha256?: string | null;
  content_preview?: string | null;
  uploaded_by_name?: string | null;
  created_at: string;
}

export interface DepartmentLookupItem {
  id: string;
  code: string;
  name: string;
}

export interface DriveBundleResponse {
  namespace_prefix: string;
  quota: {
    used_bytes: number;
    quota_bytes: number;
    used_pct: number;
    visible_files_count: number;
    visible_folders_count: number;
  };
  folders: CloudFolderItem[];
  files: CloudFileItem[];
  categories?: CloudFileCategoryItem[];
  departments: DepartmentLookupItem[];
}

export interface AttachmentItem {
  id?: string;
  url: string;
  name?: string;
  mime_type?: string;
  type?: 'image' | 'pdf' | 'text' | 'other';
  content_preview?: string | null;
  size_bytes?: number;
  storage_key?: string;
}

export interface IdCardExtractedFields {
  document_type: 'cccd' | 'passport' | string;
  full_name: string | null;
  citizen_id: string | null;
  passport: string | null;
  birthday: string | null;
  gender: string | null;
  nationality: string | null;
  place_of_origin?: string | null;
  address: string | null;
  issue_date: string | null;
  expiry_date: string | null;
  issue_place: string | null;
}

export interface ContractMilestoneItem {
  tranche_no: number;
  name: string;
  percentage: number;
  amount_vnd: number;
  due_date: string | null;
  inferred?: boolean;
}

export interface BranchVerificationPayload {
  expected_legal_entity?: string;
  expected_tax_code?: string;
  tax_code_matched?: boolean;
  legal_name_matched?: boolean;
  verified_status?: string;
}

export interface ParsedContractPayload {
  id: string;
  source_title: string;
  contract_code?: string | null;
  contract_value_vnd: number;
  start_date?: string | null;
  end_date?: string | null;
  saved_company_id?: string | null;
  saved_transaction_id?: string | null;
  party_a?: {
    legal_name?: string | null;
    expected_legal_entity?: string;
    expected_tax_code?: string;
    tax_code_matched?: boolean;
    legal_name_matched?: boolean;
    verified_status?: string;
  };
  party_b?: {
    name?: string | null;
    tax_code?: string | null;
    id_number?: string | null;
    representative?: string | null;
    address?: string | null;
    phone?: string | null;
    email?: string | null;
  };
  payment_milestones: ContractMilestoneItem[];
  branch_verification: BranchVerificationPayload;
}

export interface OcrExtractionItem {
  id: string;
  doc_type: string;
  source_title: string;
  extracted_party_name?: string | null;
  extracted_tax_code?: string | null;
  extracted_id_number?: string | null;
  extracted_representative?: string | null;
  extracted_address?: string | null;
  contract_value_vnd: number;
  effective_date?: string | null;
  expiry_date?: string | null;
  saved_company_id?: string | null;
  saved_transaction_id?: string | null;
  branch_verification: BranchVerificationPayload;
  extracted_fields?: Record<string, unknown>;
  created_at: string;
}

export interface BatchExportManifestResponse {
  manifest: {
    bundle_id: string;
    exported_at: string;
    tenant_id: string;
    namespace_prefix: string;
    total_files: number;
    total_bytes: number;
    total_contacts: number;
    pii_masked: boolean;
    archive_filename: string;
  };
  files: Array<{
    id: string;
    name: string;
    folder_name: string;
    category_key: string;
    storage_key: string;
    size_bytes: number;
    version_tag: string;
  }>;
  contacts: Array<{
    id: string;
    name: string;
    phone?: string | null;
    email?: string | null;
    status?: string;
  }>;
  csv_files: string;
  csv_contacts: string;
  bundle_base64: string;
}

export interface GlobalSearchHit {
  entity_type: string;
  id: string;
  title: string;
  subtitle: string;
  route: string;
}

export interface OpenApiSpecPayload {
  openapi: string;
  info: { title: string; version: string; description: string };
  tenant_metadata: {
    tenant_slug: string;
    legal_entity_name: string;
    tax_code: string;
    required_headers: string[];
    webhook_signature_header: string;
  };
  endpoints_catalog: Array<{ method: string; path: string; module: string }>;
}

export interface LeadLookupItem {
  id: string;
  name: string;
  phone?: string | null;
  email?: string | null;
  status?: string;
}

export const SAMPLE_CONTRACT_TEXT = `CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM
HỢP ĐỒNG CUNG ỨNG GIẢI PHÁP SỐ: 2026/HĐKT-89
BÊN B: CÔNG TY CỔ PHẦN THƯƠNG MẠI NAM VIỆT
Mã số thuế: 0316549870
Đại diện: Trần Quốc Bảo
Địa chỉ: Tầng 12, Tòa nhà Viettel, Quận 10, TP. Hồ Chí Minh
Tổng giá trị hợp đồng: 300.000.000 VNĐ
Ngày hiệu lực: 01/11/2026 - 01/11/2027
Đợt 1: Tạm ứng 40% tương đương 120.000.000 VNĐ ngày 05/11/2026
Đợt 2: Nghiệm thu bàn giao 60% tương đương 180.000.000 VNĐ ngày 15/12/2026`;

export const SAMPLE_CCCD_TEXT = `CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM
CĂN CƯỚC CÔNG DÂN / CITIZEN IDENTITY CARD
Số / No.: 079092008899
Họ và tên / Full name: NGUYỄN HOÀNG MINH ANH
Ngày sinh / Date of birth: 18/06/1992
Giới tính / Sex: Nữ
Quốc tịch / Nationality: Việt Nam
Quê quán / Place of origin: Hải Châu, Đà Nẵng
Nơi thường trú / Place of residence: 145 Nguyễn Thị Minh Khai, Quận 1, TP. Hồ Chí Minh
Ngày cấp / Date of issue: 20/08/2023
Có giá trị đến / Date of expiry: 18/06/2032
Nơi cấp: Cục Cảnh sát QLHC về TTXH`;

export const CATEGORY_ICON_OPTIONS = [
  { value: 'folder', label: 'Thư mục chung' },
  { value: 'file-text', label: 'Hợp đồng & Pháp lý' },
  { value: 'shield', label: 'Tài liệu Bảo mật / Tài chính' },
  { value: 'id-card', label: 'Hồ sơ Định danh CCCD / KYC' },
  { value: 'globe', label: 'Tài liệu Bán hàng & Marketing' },
];

export const ROLE_OPTIONS = [
  { value: 'tenant_admin', label: 'Quản trị viên (Admin)' },
  { value: 'manager', label: 'Trưởng phòng (Manager)' },
  { value: 'sale', label: 'Chuyên viên Kinh doanh (Sale)' },
  { value: 'accountant', label: 'Kế toán (Accountant)' },
];

export function formatBytes(bytes: number): string {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${bytes} B`;
}

export function detectAttachmentType(file: {
  name?: string;
  mime_type?: string;
  url?: string;
  content_preview?: string | null;
}): 'image' | 'pdf' | 'text' | 'other' {
  const mime = (file.mime_type || '').toLowerCase();
  const nameOrUrl = `${file.name || ''} ${file.url || ''}`.toLowerCase();
  if (mime.startsWith('image/') || /\.(png|jpe?g|webp|gif|svg)(\?|$)/i.test(nameOrUrl)) {
    return 'image';
  }
  if (mime.includes('pdf') || /\.pdf(\?|$)/i.test(nameOrUrl)) {
    return 'pdf';
  }
  if (file.content_preview || mime.startsWith('text/') || /\.(txt|md|csv|json)(\?|$)/i.test(nameOrUrl)) {
    return 'text';
  }
  return 'other';
}

export function triggerClientDownload(filename: string, content: string, mimeType: string): void {
  if (typeof document === 'undefined') return;
  const blob = new Blob([content], { type: mimeType });
  const blobUrl = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = blobUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(blobUrl);
}
