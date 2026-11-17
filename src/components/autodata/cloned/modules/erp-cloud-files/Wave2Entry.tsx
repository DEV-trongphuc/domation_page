import React, { useCallback, useEffect, useState } from 'react';
import {
  BookOpen,
  Building2,
  CheckCircle2,
  Cloud,
  DollarSign,
  FileCheck2,
  FileSearch,
  FolderLock,
  FolderPlus,
  HardDrive,
  Lock,
  RefreshCw,
  ScanText,
  Search,
  ShieldCheck,
  Trash2,
  Upload,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { CustomModal } from '../../components/ui/CustomModal';
import { ScreenHelpButton } from '../../components/ui/ScreenHelpButton';
import {
  AutoDataLoadingModal,
  Badge,
  Card,
  EmptyState,
  FormCard,
  PillTabs,
  Table,
  type TableColumn,
} from '../../components/ui/AutoDataLoadingModal';
import {
  apiRequest,
  formatShortDate,
  formatVnd,
  getErrorMessage,
} from '../../../autodataApi';
import { useAuth } from '../../contexts/AuthContext';
import { useEntitlement } from '../../contexts/EntitlementContext';

type CloudOpsTabKey = 'drive' | 'ocr' | 'search_docs';

interface CloudFolderItem {
  id: string;
  name: string;
  storage_prefix: string;
  visibility: 'company' | 'departments' | 'private';
  allowed_department_ids: string[];
  created_at: string;
}

interface CloudFileItem {
  id: string;
  folder_id?: string | null;
  folder_name?: string | null;
  name: string;
  storage_key: string;
  mime_type: string;
  size_bytes: number;
  version_tag: string;
  visibility: 'company' | 'departments' | 'private';
  allowed_department_ids: string[];
  uploaded_by_name?: string | null;
  created_at: string;
}

interface DriveBundleResponse {
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
  departments: Array<{ id: string; code: string; name: string }>;
}

interface OcrExtractionItem {
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
  branch_verification: {
    expected_legal_entity?: string;
    expected_tax_code?: string;
    tax_code_matched?: boolean;
    legal_name_matched?: boolean;
    verified_status?: string;
  };
  created_at: string;
}

interface GlobalSearchHit {
  entity_type: string;
  id: string;
  title: string;
  subtitle: string;
  route: string;
}

interface OpenApiSpecPayload {
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

const SAMPLE_CONTRACT_TEXT = `CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM
HỢP ĐỒNG CUNG ỨNG GIẢI PHÁP CÔNG NGHỆ SỐ 2026/HĐKT-89
BÊN B: CÔNG TY CỔ PHẦN THƯƠNG MẠI NAM VIỆT
Mã số thuế: 0316549870
Đại diện: Trần Quốc Bảo
Địa chỉ: Tầng 12, Tòa nhà Viettel, Quận 10, TP. Hồ Chí Minh
Số CCCD người đại diện: 079088001234
Tổng giá trị hợp đồng: 285.000.000 VNĐ
Ngày hiệu lực: 01/11/2026 - 01/11/2027`;

function formatBytes(bytes: number): string {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${bytes} B`;
}

export const ErpCloudFilesWave2Entry: React.FC = () => {
  const { token, tenantSlug } = useAuth();
  const { packageMeta, scope, can } = useEntitlement();
  const navigate = useNavigate();
  const canCreate = can('erp_cloud_ocr', 'create');
  const canDelete = can('erp_cloud_ocr', 'delete');

  const [activeTab, setActiveTab] = useState<CloudOpsTabKey>('drive');
  const [loading, setLoading] = useState(true);
  const [drive, setDrive] = useState<DriveBundleResponse | null>(null);
  const [selectedFolderId, setSelectedFolderId] = useState<string>('all');
  const [ocrItems, setOcrItems] = useState<OcrExtractionItem[]>([]);
  const [openApiSpec, setOpenApiSpec] = useState<OpenApiSpecPayload | null>(null);

  // Folder & Upload Modals
  const [folderModalOpen, setFolderModalOpen] = useState(false);
  const [folderName, setFolderName] = useState('');
  const [folderVisibility, setFolderVisibility] = useState<'company' | 'departments' | 'private'>('company');
  const [folderAllowedDepts, setFolderAllowedDepts] = useState<string[]>([]);

  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [fileName, setFileName] = useState('');
  const [fileVersion, setFileVersion] = useState('v1.0');
  const [fileVisibility, setFileVisibility] = useState<'company' | 'departments' | 'private'>('company');
  const [fileAllowedDepts, setFileAllowedDepts] = useState<string[]>([]);
  const [fileContentPreview, setFileContentPreview] = useState('');

  // OCR Extractor State
  const [ocrDocType, setOcrDocType] = useState('contract');
  const [ocrTitle, setOcrTitle] = useState('Hợp đồng Kinh tế B2B 2026');
  const [ocrRawText, setOcrRawText] = useState(SAMPLE_CONTRACT_TEXT);
  const [extracting, setExtracting] = useState(false);

  // Global Cross-Module Search State
  const [globalQuery, setGlobalQuery] = useState('');
  const [searchHits, setSearchHits] = useState<GlobalSearchHit[]>([]);
  const [searching, setSearching] = useState(false);

  const fetchAll = useCallback(async () => {
    const [dRes, oRes, specRes] = await Promise.all([
      apiRequest<DriveBundleResponse>('/erp-ops/drive', { token, tenantSlug }),
      apiRequest<{ items: OcrExtractionItem[] }>('/erp-ops/ocr/extractions', { token, tenantSlug }),
      apiRequest<OpenApiSpecPayload>('/erp-ops/openapi-docs', { token, tenantSlug }),
    ]);
    return { dRes, ocr: oRes.items || [], specRes };
  }, [token, tenantSlug]);

  const applyBundle = useCallback((b: Awaited<ReturnType<typeof fetchAll>>) => {
    setDrive(b.dRes);
    setOcrItems(b.ocr);
    setOpenApiSpec(b.specRes);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const bundle = await fetchAll();
        if (!cancelled) applyBundle(bundle);
      } catch (err) {
        if (!cancelled) toast.error(getErrorMessage(err, 'Không thể tải Cloud Drive & AI OCR'));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [fetchAll, applyBundle]);

  const reloadAll = useCallback(async () => {
    setLoading(true);
    try {
      const bundle = await fetchAll();
      applyBundle(bundle);
    } catch (err) {
      toast.error(getErrorMessage(err, 'Không thể làm mới dữ liệu'));
    } finally {
      setLoading(false);
    }
  }, [fetchAll, applyBundle]);

  const toggleDeptSelection = (list: string[], setList: React.Dispatch<React.SetStateAction<string[]>>, id: string) => {
    setList(list.includes(id) ? list.filter((d) => d !== id) : [...list, id]);
  };

  const handleCreateFolder = async () => {
    if (!folderName.trim()) return;
    try {
      await apiRequest('/erp-ops/drive/folders', {
        method: 'POST',
        token,
        tenantSlug,
        body: {
          name: folderName.trim(),
          visibility: folderVisibility,
          allowed_department_ids: folderVisibility === 'departments' ? folderAllowedDepts : [],
        },
      });
      toast.success('Đã tạo thư mục Cloud kèm phân quyền ACL');
      setFolderName('');
      setFolderModalOpen(false);
      await reloadAll();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Không thể tạo thư mục'));
    }
  };

  const handleUploadFile = async () => {
    if (!fileName.trim()) {
      toast.error('Vui lòng nhập tên tệp tài liệu');
      return;
    }
    try {
      await apiRequest('/erp-ops/drive/files', {
        method: 'POST',
        token,
        tenantSlug,
        body: {
          folder_id: selectedFolderId !== 'all' ? selectedFolderId : null,
          name: fileName.trim(),
          version_tag: fileVersion.trim() || 'v1.0',
          visibility: fileVisibility,
          allowed_department_ids: fileVisibility === 'departments' ? fileAllowedDepts : [],
          content_preview: fileContentPreview.trim() || undefined,
        },
      });
      toast.success('Đã lưu trữ tài liệu cô lập theo namespace doanh nghiệp');
      setFileName('');
      setFileContentPreview('');
      setUploadModalOpen(false);
      await reloadAll();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Không thể tải tệp lên'));
    }
  };

  const handleDeleteFile = async (id: string) => {
    try {
      await apiRequest(`/erp-ops/drive/files/${id}`, {
        method: 'DELETE',
        token,
        tenantSlug,
      });
      toast.success('Đã xóa tệp khỏi Cloud Drive');
      await reloadAll();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Không thể xóa tệp'));
    }
  };

  const handleRunOcrExtract = async () => {
    if (!ocrRawText.trim()) {
      toast.error('Vui lòng nhập hoặc dán văn bản Hợp đồng / CCCD / ĐKKD');
      return;
    }
    setExtracting(true);
    try {
      const res = await apiRequest<OcrExtractionItem>('/erp-ops/ocr/extract', {
        method: 'POST',
        token,
        tenantSlug,
        body: {
          doc_type: ocrDocType,
          source_title: ocrTitle.trim(),
          raw_text: ocrRawText,
        },
      });
      setOcrItems((prev) => [res, ...prev]);
      toast.success('AI OCR đã bóc tách cấu trúc & đối soát pháp nhân Chi nhánh!');
    } catch (err) {
      toast.error(getErrorMessage(err, 'Không thể bóc tách OCR'));
    } finally {
      setExtracting(false);
    }
  };

  const handleSaveOcrToCompany = async (ocrId: string) => {
    try {
      await apiRequest(`/erp-ops/ocr/extractions/${ocrId}/save-company`, {
        method: 'POST',
        token,
        tenantSlug,
        body: {},
      });
      toast.success('Đã lưu Đối tác vào danh sách Công ty B2B!');
      await reloadAll();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Không thể lưu Công ty B2B'));
    }
  };

  const handleSaveOcrToTransaction = async (ocrId: string) => {
    try {
      await apiRequest(`/erp-ops/ocr/extractions/${ocrId}/save-transaction`, {
        method: 'POST',
        token,
        tenantSlug,
        body: { tx_type: 'income' },
      });
      toast.success('Đã ghi nhận giá trị Hợp đồng sang Sổ quỹ Tài chính!');
      await reloadAll();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Không thể hạch toán giao dịch'));
    }
  };

  const handleRunGlobalSearch = async () => {
    if (!globalQuery.trim()) {
      setSearchHits([]);
      return;
    }
    setSearching(true);
    try {
      const res = await apiRequest<{ results: GlobalSearchHit[] }>(
        `/erp-ops/global-search?q=${encodeURIComponent(globalQuery.trim())}`,
        { token, tenantSlug }
      );
      setSearchHits(res.results || []);
    } catch (err) {
      toast.error(getErrorMessage(err, 'Lỗi tìm kiếm liên phân hệ'));
    } finally {
      setSearching(false);
    }
  };

  const filteredFiles = (drive?.files || []).filter(
    (f) => selectedFolderId === 'all' || f.folder_id === selectedFolderId
  );

  const fileColumns: ReadonlyArray<TableColumn<CloudFileItem>> = [
    {
      key: 'name',
      header: 'Tên Tệp & Đường Dẫn Cô Lập',
      render: (r) => (
        <div>
          <div style={{ fontWeight: 700, color: '#0F172A' }}>{r.name}</div>
          <div style={{ fontSize: '0.72rem', color: '#64748B', fontFamily: 'monospace' }}>{r.storage_key}</div>
        </div>
      ),
    },
    { key: 'ver', header: 'Phiên bản', render: (r) => <Badge tone="primary">{r.version_tag}</Badge> },
    {
      key: 'acl',
      header: 'Phân quyền ACL',
      render: (r) => (
        <Badge tone={r.visibility === 'departments' ? 'warning' : r.visibility === 'private' ? 'danger' : 'success'}>
          {r.visibility === 'departments'
            ? `${r.allowed_department_ids.length} Phòng ban`
            : r.visibility === 'private'
              ? 'Riêng tư'
              : 'Toàn công ty'}
        </Badge>
      ),
    },
    { key: 'size', header: 'Dung lượng', numeric: true, render: (r) => formatBytes(r.size_bytes) },
    { key: 'date', header: 'Tải lên', render: (r) => formatShortDate(r.created_at) },
    {
      key: 'act',
      header: '',
      align: 'right',
      render: (r) =>
        canDelete ? (
          <button
            type="button"
            onClick={() => handleDeleteFile(r.id)}
            style={{ border: 'none', background: 'transparent', color: '#DC2626', cursor: 'pointer' }}
          >
            <Trash2 size={15} />
          </button>
        ) : null,
    },
  ];

  if (loading && !drive) {
    return (
      <AutoDataLoadingModal
        inline
        isOpen
        message="Đang mở Kho Tài liệu Cloud Cô lập & AI OCR Hợp đồng..."
      />
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Header */}
      <Card
        padding="1.25rem 1.5rem"
        style={{ background: 'linear-gradient(135deg, #FFFFFF 0%, #F8FAFF 100%)' }}
      >
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: 16,
                background: '#EEF2FF',
                border: '1px solid #DBEAFE',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#1E40FF',
              }}
            >
              <Cloud size={24} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <h1 style={{ fontSize: '1.18rem', fontWeight: 800, color: '#0F172A', margin: 0 }}>
                  Cloud Drive Phân Quyền ACL, AI OCR Hợp Đồng / CCCD & Spotlight API
                </h1>
                <Badge tone="primary">{packageMeta.shortName}</Badge>
                <Badge tone="success" icon={<Lock size={11} />}>
                  {drive?.namespace_prefix}
                </Badge>
                <Badge tone="info">Scope: {scope('erp_cloud_ocr')}</Badge>
              </div>
              <p style={{ fontSize: '0.82rem', color: '#64748B', margin: '4px 0 0' }}>
                Cô lập vật lý theo từng Tenant, kiểm soát truy cập theo Phòng ban (`allowed_department_ids`) & đối soát tự động Pháp nhân Bên A
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button type="button" onClick={reloadAll} className="btn secondary" style={{ height: 44 }}>
              <RefreshCw size={15} />
            </button>
            <ScreenHelpButton screenKey="erp_cloud_files" />
          </div>
        </div>
      </Card>

      {/* Navigation Tabs */}
      <PillTabs<CloudOpsTabKey>
        activeKey={activeTab}
        onChange={setActiveTab}
        tabs={[
          { key: 'drive', label: 'Kho Tài Liệu Cloud (Dept ACL)', icon: <HardDrive size={15} />, count: drive?.files.length || 0 },
          { key: 'ocr', label: 'AI OCR Hợp Đồng / CCCD / ĐKKD', icon: <ScanText size={15} />, count: ocrItems.length },
          { key: 'search_docs', label: 'Spotlight Đa Phân Hệ & OpenAPI 3.1', icon: <BookOpen size={15} /> },
        ]}
      />

      {/* TAB 1: TENANT CLOUD DRIVE */}
      {activeTab === 'drive' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '0.9rem' }}>
            <FormCard
              icon={<HardDrive size={18} />}
              title={`${formatBytes(drive?.quota.used_bytes || 0)} / 20 GB`}
              description={`Namespace cô lập: ${drive?.namespace_prefix}`}
              badge={<Badge tone="primary">{drive?.quota.used_pct || 0}%</Badge>}
            />
            <FormCard
              icon={<FolderLock size={18} />}
              title={`${drive?.quota.visible_folders_count || 0} Thư mục • ${drive?.quota.visible_files_count || 0} Tệp`}
              description="Đã lọc theo quyền Phòng ban của tài khoản hiện tại"
              badge={<Badge tone="success">ACL Enforced</Badge>}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={() => setSelectedFolderId('all')}
                className="btn secondary"
                style={{
                  height: 40,
                  borderColor: selectedFolderId === 'all' ? '#1E40FF' : '#E2E8F0',
                  color: selectedFolderId === 'all' ? '#1E40FF' : '#475569',
                }}
              >
                Tất cả thư mục
              </button>
              {(drive?.folders || []).map((fl) => (
                <button
                  key={fl.id}
                  type="button"
                  onClick={() => setSelectedFolderId(fl.id)}
                  className="btn secondary"
                  style={{
                    height: 40,
                    borderColor: selectedFolderId === fl.id ? '#1E40FF' : '#E2E8F0',
                    color: selectedFolderId === fl.id ? '#1E40FF' : '#475569',
                  }}
                >
                  📁 {fl.name}
                </button>
              ))}
            </div>

            {canCreate && (
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  type="button"
                  onClick={() => setFolderModalOpen(true)}
                  className="btn secondary"
                  style={{ height: 42, color: '#1E40FF', display: 'inline-flex', alignItems: 'center', gap: 6 }}
                >
                  <FolderPlus size={15} /> Tạo thư mục ACL
                </button>
                <button
                  type="button"
                  onClick={() => setUploadModalOpen(true)}
                  className="btn-inkica-primary"
                  style={{
                    height: 42,
                    padding: '0 1.1rem',
                    borderRadius: 12,
                    border: 'none',
                    color: '#FFFFFF',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  <Upload size={15} /> Tải tệp & Gắn Version
                </button>
              </div>
            )}
          </div>

          <Table
            columns={fileColumns}
            rows={filteredFiles}
            rowKey={(r) => r.id}
            emptyTitle="Chưa có tệp tài liệu trong thư mục này"
            emptyDescription="Mọi tệp tải lên đều được lưu dưới tiền tố tenants/{tenant_id}/ và kiểm tra quyền phòng ban nghiêm ngặt."
          />
        </div>
      )}

      {/* TAB 2: AI OCR CONTRACT & ID EXTRACTOR */}
      {activeTab === 'ocr' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1rem' }}>
          <Card
            title="Bóc Tách Tự Động Hợp Đồng Kinh Tế / CCCD / ĐKKD"
            subtitle="Tự động đối chiếu Pháp nhân & Mã số thuế Bên A với Chi nhánh Trụ sở của doanh nghiệp"
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: 10 }}>
                <select
                  value={ocrDocType}
                  onChange={(e) => setOcrDocType(e.target.value)}
                  className="form-input"
                  style={{ height: 44, borderRadius: 14, border: '1px solid #E2E8F0', padding: '0 12px' }}
                >
                  <option value="contract">Hợp đồng Kinh tế</option>
                  <option value="business_license">Giấy phép ĐKKD</option>
                  <option value="cccd">Căn cước công dân (CCCD)</option>
                  <option value="invoice">Hóa đơn GTGT</option>
                </select>
                <input
                  value={ocrTitle}
                  onChange={(e) => setOcrTitle(e.target.value)}
                  placeholder="Tên hồ sơ bóc tách..."
                  className="form-input"
                  style={{ height: 44, borderRadius: 14, border: '1px solid #E2E8F0', padding: '0 12px' }}
                />
              </div>

              <textarea
                value={ocrRawText}
                onChange={(e) => setOcrRawText(e.target.value)}
                rows={9}
                placeholder="Dán nội dung văn bản OCR từ Hợp đồng, Giấy phép ĐKKD hoặc CCCD vào đây..."
                style={{ borderRadius: 14, border: '1px solid #E2E8F0', padding: '10px 12px', fontSize: '0.83rem', lineHeight: 1.5 }}
              />

              <button
                type="button"
                disabled={extracting}
                onClick={handleRunOcrExtract}
                className="btn-inkica-primary"
                style={{
                  height: 44,
                  borderRadius: 14,
                  border: 'none',
                  color: '#FFFFFF',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                }}
              >
                <ScanText size={16} /> {extracting ? 'Đang bóc tách AI OCR...' : 'Chạy AI OCR Bóc Tách & Đối Soát Pháp Nhân'}
              </button>
            </div>
          </Card>

          <Card title="Kết Quả Bóc Tách & Chuyển Đổi 1 Chạm" subtitle="Lưu thẳng sang Công ty B2B hoặc Sổ quỹ Thu - Chi">
            {ocrItems.length === 0 ? (
              <EmptyState title="Chưa có bản ghi OCR nào" description="Bấm nút Chạy AI OCR bên trái để kiểm nghiệm." />
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {ocrItems.map((item) => (
                  <div
                    key={item.id}
                    style={{
                      padding: '1rem',
                      borderRadius: 16,
                      border: '1px solid #DBEAFE',
                      background: '#F8FAFF',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 8,
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 6 }}>
                      <strong style={{ fontSize: '0.88rem', color: '#0F172A' }}>{item.source_title}</strong>
                      <Badge
                        tone={item.branch_verification.tax_code_matched ? 'success' : 'info'}
                        icon={<FileCheck2 size={12} />}
                      >
                        {item.branch_verification.tax_code_matched
                          ? 'Khớp MST Pháp nhân Bên A'
                          : 'Đã bóc tách Đối tác'}
                      </Badge>
                    </div>

                    <div style={{ fontSize: '0.82rem', color: '#334155', display: 'grid', gap: 3 }}>
                      <div><strong>Đối tác / Họ tên:</strong> {item.extracted_party_name || '—'}</div>
                      <div><strong>Mã số thuế:</strong> {item.extracted_tax_code || '—'} • <strong>CCCD:</strong> {item.extracted_id_number || '—'}</div>
                      <div><strong>Giá trị hợp đồng:</strong> <span style={{ color: '#1E40FF', fontWeight: 700 }}>{formatVnd(item.contract_value_vnd)}</span></div>
                      <div><strong>Hiệu lực:</strong> {item.effective_date || '—'} → {item.expiry_date || '—'}</div>
                      <div style={{ fontSize: '0.75rem', color: '#64748B' }}>
                        Đối chiếu Pháp nhân Trụ sở: {item.branch_verification.expected_legal_entity || '—'}
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', paddingTop: 6, borderTop: '1px solid #E2E8F0' }}>
                      {item.saved_company_id ? (
                        <Badge tone="success"><CheckCircle2 size={12} /> Đã lưu B2B Company</Badge>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleSaveOcrToCompany(item.id)}
                          className="btn secondary"
                          style={{ height: 36, fontSize: '0.76rem', color: '#1E40FF' }}
                        >
                          <Building2 size={13} style={{ display: 'inline', marginRight: 4 }} /> 1-Click Lưu B2B Company
                        </button>
                      )}

                      {item.saved_transaction_id ? (
                        <Badge tone="success"><CheckCircle2 size={12} /> Đã ghi Sổ quỹ</Badge>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleSaveOcrToTransaction(item.id)}
                          className="btn secondary"
                          style={{ height: 36, fontSize: '0.76rem', color: '#059669' }}
                        >
                          <DollarSign size={13} style={{ display: 'inline', marginRight: 4 }} /> 1-Click Hạch toán Sổ quỹ
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      )}

      {/* TAB 3: GLOBAL SEARCH & CLEAN TENANT OPENAPI DOCS */}
      {activeTab === 'search_docs' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
          <Card
            title="Spotlight Tìm Kiếm Xuyên Phân Hệ (Global Cross-Module Search)"
            subtitle="Tra cứu đồng thời Khách hàng 360° (tuân thủ che SĐT PII), Công ty B2B, Deals, Dự án, Công việc, Helpdesk, Đơn bán & Cloud ACL"
          >
            <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
              <input
                value={globalQuery}
                onChange={(e) => setGlobalQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') void handleRunGlobalSearch();
                }}
                placeholder="Nhập tên khách hàng, MST, mã đơn SO, tên dự án hoặc tên file..."
                className="form-input"
                style={{ flex: 1, height: 44, borderRadius: 14, border: '1px solid #E2E8F0', padding: '0 14px' }}
              />
              <button
                type="button"
                onClick={handleRunGlobalSearch}
                className="btn-inkica-primary"
                style={{
                  height: 44,
                  padding: '0 1.25rem',
                  borderRadius: 14,
                  border: 'none',
                  color: '#FFFFFF',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <Search size={16} /> {searching ? 'Đang tìm...' : 'Tìm toàn hệ thống'}
              </button>
            </div>

            {searchHits.length > 0 && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 10 }}>
                {searchHits.map((hit) => (
                  <FormCard
                    key={`${hit.entity_type}-${hit.id}`}
                    icon={<FileSearch size={18} />}
                    title={hit.title}
                    description={hit.subtitle}
                    badge={<Badge tone="info">{hit.entity_type}</Badge>}
                    onClick={() => navigate(hit.route)}
                  />
                ))}
              </div>
            )}
          </Card>

          {openApiSpec && (
            <Card
              title={openApiSpec.info.title}
              subtitle={openApiSpec.info.description}
              actions={<Badge tone="success" icon={<ShieldCheck size={12} />}>OpenAPI {openApiSpec.openapi}</Badge>}
            >
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
                {openApiSpec.tenant_metadata.required_headers.map((h) => (
                  <Badge key={h} tone="neutral" style={{ fontFamily: 'monospace' }}>
                    {h}
                  </Badge>
                ))}
                <Badge tone="primary" style={{ fontFamily: 'monospace' }}>
                  HMAC Header: {openApiSpec.tenant_metadata.webhook_signature_header}
                </Badge>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {openApiSpec.endpoints_catalog.map((ep) => (
                  <div
                    key={`${ep.method}-${ep.path}`}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '8px 12px',
                      borderRadius: 12,
                      background: '#F8F9FA',
                      border: '1px solid #E2E8F0',
                      fontSize: '0.82rem',
                    }}
                  >
                    <span>
                      <Badge tone={ep.method === 'POST' ? 'primary' : 'success'} style={{ marginRight: 8 }}>
                        {ep.method}
                      </Badge>
                      <code style={{ fontWeight: 700, color: '#0F172A' }}>{ep.path}</code>
                    </span>
                    <span style={{ color: '#64748B' }}>{ep.module}</span>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      )}

      {/* MODAL: Create Folder */}
      <CustomModal isOpen={folderModalOpen} onClose={() => setFolderModalOpen(false)} title="Tạo Thư Mục Cloud & Phân Quyền ACL">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <input
            value={folderName}
            onChange={(e) => setFolderName(e.target.value)}
            placeholder="Tên thư mục (VD: Hợp đồng Kinh doanh, Hồ sơ Kế toán...)"
            className="form-input"
            style={{ height: 44, borderRadius: 14, border: '1px solid #E2E8F0', padding: '0 12px' }}
          />
          <select
            value={folderVisibility}
            onChange={(e) => setFolderVisibility(e.target.value as 'company' | 'departments' | 'private')}
            className="form-input"
            style={{ height: 44, borderRadius: 14, border: '1px solid #E2E8F0', padding: '0 12px' }}
          >
            <option value="company">Toàn công ty (Mọi nhân sự trong Tenant)</option>
            <option value="departments">Giới hạn theo Phòng ban (Department ACL)</option>
            <option value="private">Chỉ mình tôi & Chủ doanh nghiệp</option>
          </select>

          {folderVisibility === 'departments' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, padding: '8px 12px', borderRadius: 12, background: '#F8F9FA' }}>
              <div style={{ fontSize: '0.78rem', fontWeight: 700 }}>Chọn các Phòng ban được phép truy cập:</div>
              {(drive?.departments || []).map((d) => (
                <label key={d.id} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.83rem' }}>
                  <input
                    type="checkbox"
                    checked={folderAllowedDepts.includes(d.id)}
                    onChange={() => toggleDeptSelection(folderAllowedDepts, setFolderAllowedDepts, d.id)}
                  />
                  {d.name} ({d.code})
                </label>
              ))}
            </div>
          )}

          <button
            type="button"
            onClick={handleCreateFolder}
            className="btn-inkica-primary"
            style={{ height: 44, borderRadius: 14, border: 'none', color: '#FFFFFF', fontWeight: 700, cursor: 'pointer' }}
          >
            Tạo Thư Mục
          </button>
        </div>
      </CustomModal>

      {/* MODAL: Upload File */}
      <CustomModal isOpen={uploadModalOpen} onClose={() => setUploadModalOpen(false)} title="Tải Lên Tài Liệu Cloud & Gắn Phiên Bản">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <input
            value={fileName}
            onChange={(e) => setFileName(e.target.value)}
            placeholder="Tên tệp (VD: Quy_Che_Tai_Chinh_2026.pdf)..."
            className="form-input"
            style={{ height: 44, borderRadius: 14, border: '1px solid #E2E8F0', padding: '0 12px' }}
          />
          <input
            value={fileVersion}
            onChange={(e) => setFileVersion(e.target.value)}
            placeholder="Nhãn phiên bản (VD: v1.0, v2.1)..."
            className="form-input"
            style={{ height: 44, borderRadius: 14, border: '1px solid #E2E8F0', padding: '0 12px' }}
          />
          <select
            value={fileVisibility}
            onChange={(e) => setFileVisibility(e.target.value as 'company' | 'departments' | 'private')}
            className="form-input"
            style={{ height: 44, borderRadius: 14, border: '1px solid #E2E8F0', padding: '0 12px' }}
          >
            <option value="company">Toàn công ty</option>
            <option value="departments">Giới hạn theo Phòng ban (ACL)</option>
            <option value="private">Riêng tư</option>
          </select>

          {fileVisibility === 'departments' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, padding: '8px 12px', borderRadius: 12, background: '#F8F9FA' }}>
              {(drive?.departments || []).map((d) => (
                <label key={d.id} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.83rem' }}>
                  <input
                    type="checkbox"
                    checked={fileAllowedDepts.includes(d.id)}
                    onChange={() => toggleDeptSelection(fileAllowedDepts, setFileAllowedDepts, d.id)}
                  />
                  {d.name}
                </label>
              ))}
            </div>
          )}

          <textarea
            value={fileContentPreview}
            onChange={(e) => setFileContentPreview(e.target.value)}
            rows={3}
            placeholder="Tóm tắt nội dung hoặc trích đoạn văn bản..."
            style={{ borderRadius: 14, border: '1px solid #E2E8F0', padding: '10px 12px', fontSize: '0.84rem' }}
          />

          <button
            type="button"
            onClick={handleUploadFile}
            className="btn-inkica-primary"
            style={{ height: 44, borderRadius: 14, border: 'none', color: '#FFFFFF', fontWeight: 700, cursor: 'pointer' }}
          >
            Lưu Trữ Lên Cloud Drive
          </button>
        </div>
      </CustomModal>
    </div>
  );
};

export default ErpCloudFilesWave2Entry;
