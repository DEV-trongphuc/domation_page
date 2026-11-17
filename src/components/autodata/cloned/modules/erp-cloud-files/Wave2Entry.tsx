import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Archive, BookOpen, Cloud, CreditCard, Edit2, Eye, FileText, FolderLock,
  FolderPlus, HardDrive, LayoutGrid, List, Lock, RefreshCw, ScanText, Search, Sparkles, Trash2, Upload,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { ScreenHelpButton } from '../../components/ui/ScreenHelpButton';
import { Badge, Card, EmptyState, FormCard, PillTabs, Table, type TableColumn } from '../../components/ui/AutoDataLoadingModal';
import { CardSkeleton, TableSkeleton } from '../../components/ui/Skeleton';
import { apiRequest, formatShortDate, getErrorMessage } from '../../../autodataApi';
import { useAuth } from '../../contexts/AuthContext';
import { useEntitlement } from '../../contexts/EntitlementContext';
import {
  detectAttachmentType, formatBytes, type AttachmentItem, type CloudFileCategoryItem, type CloudFileItem,
  type CloudOpsTabKey, type CloudViewMode, type DriveBundleResponse, type OcrExtractionItem, type OpenApiSpecPayload,
} from './cloudFilesTypes';
import { AttachmentLightboxModal } from './AttachmentLightboxModal';
import { ExtractIdDocumentModal } from './ExtractIdDocumentModal';
import { AIContractImportModal } from './AIContractImportModal';
import { FileCategoryAclModal } from './FileCategoryAclModal';
import { BatchExportModal } from './BatchExportModal';
import { CloudOcrSearchPanels } from './CloudOcrSearchPanels';
import { CloudDriveModals } from './CloudDriveModals';

export { AttachmentLightboxModal, ExtractIdDocumentModal, AIContractImportModal };

export const ErpCloudFilesWave2Entry: React.FC = () => {
  const { token, tenantSlug } = useAuth();
  const { packageMeta, scope, can } = useEntitlement();
  const canCreate = can('erp_cloud_ocr', 'create');
  const canEdit = can('erp_cloud_ocr', 'edit');
  const canDelete = can('erp_cloud_ocr', 'delete');

  const [activeTab, setActiveTab] = useState<CloudOpsTabKey>('drive');
  const [viewMode, setViewMode] = useState<CloudViewMode>('grid');
  const [loading, setLoading] = useState(true);
  const [drive, setDrive] = useState<DriveBundleResponse | null>(null);
  const [categories, setCategories] = useState<CloudFileCategoryItem[]>([]);
  const [selectedFolderId, setSelectedFolderId] = useState('all');
  const [selectedCategoryKey, setSelectedCategoryKey] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [ocrItems, setOcrItems] = useState<OcrExtractionItem[]>([]);
  const [openApiSpec, setOpenApiSpec] = useState<OpenApiSpecPayload | null>(null);

  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [catModalOpen, setCatModalOpen] = useState(false);
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [idModalOpen, setIdModalOpen] = useState(false);
  const [contractModalOpen, setContractModalOpen] = useState(false);
  const [folderModalOpen, setFolderModalOpen] = useState(false);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [editingFile, setEditingFile] = useState<CloudFileItem | null>(null);

  const fetchAll = useCallback(async () => {
    const [dRes, catRes, oRes, specRes] = await Promise.all([
      apiRequest<DriveBundleResponse>('/erp-ops/drive', { token, tenantSlug }),
      apiRequest<{ items: CloudFileCategoryItem[] }>('/erp-ops/drive/categories', { token, tenantSlug }),
      apiRequest<{ items: OcrExtractionItem[] }>('/erp-ops/ocr/extractions', { token, tenantSlug }),
      apiRequest<OpenApiSpecPayload>('/erp-ops/openapi-docs', { token, tenantSlug }),
    ]);
    return {
      dRes,
      cats: catRes.items || dRes.categories || [],
      ocr: oRes.items || [],
      specRes,
    };
  }, [token, tenantSlug]);

  const applyBundle = useCallback((b: Awaited<ReturnType<typeof fetchAll>>) => {
    setDrive(b.dRes);
    setCategories(b.cats);
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
      applyBundle(await fetchAll());
    } catch (err) {
      toast.error(getErrorMessage(err, 'Không thể làm mới dữ liệu'));
    } finally {
      setLoading(false);
    }
  }, [fetchAll, applyBundle]);

  const filteredFiles = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return (drive?.files || []).filter((f) => {
      if (selectedFolderId !== 'all' && f.folder_id !== selectedFolderId) return false;
      if (selectedCategoryKey !== 'all' && (f.category_key || 'general') !== selectedCategoryKey) return false;
      if (q && !`${f.name} ${f.storage_key} ${f.category_key}`.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [drive?.files, selectedFolderId, selectedCategoryKey, searchTerm]);

  const lightboxItems = useMemo<AttachmentItem[]>(
    () =>
      filteredFiles.map((f) => ({
        id: f.id,
        url: f.file_url || f.storage_key,
        name: f.name,
        mime_type: f.mime_type,
        type: detectAttachmentType(f),
        content_preview: f.content_preview,
        size_bytes: f.size_bytes,
        storage_key: f.storage_key,
      })),
    [filteredFiles]
  );

  const handleDeleteFile = async (id: string) => {
    try {
      await apiRequest(`/erp-ops/drive/files/${id}`, { method: 'DELETE', token, tenantSlug });
      toast.success('Đã xóa tệp khỏi Cloud Drive');
      await reloadAll();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Không thể xóa tệp'));
    }
  };

  const fileColumns: ReadonlyArray<TableColumn<CloudFileItem>> = [
    {
      key: 'name',
      header: 'Tên Tệp & Đường Dẫn Cô Lập',
      render: (r, idx) => (
        <div onClick={() => setLightboxIndex(idx)} style={{ cursor: 'pointer' }}>
          <div style={{ fontWeight: 700, color: '#1E40FF' }}>{r.name}</div>
          <div style={{ fontSize: '0.72rem', color: '#64748B', fontFamily: 'monospace' }}>{r.storage_key}</div>
        </div>
      ),
    },
    { key: 'cat', header: 'Danh mục', render: (r) => <Badge tone="neutral">{r.category_key || 'general'}</Badge> },
    { key: 'ver', header: 'Version', render: (r) => <Badge tone="primary">{r.version_tag}</Badge> },
    {
      key: 'acl',
      header: 'ACL',
      render: (r) => (
        <Badge tone={r.visibility === 'departments' ? 'warning' : r.visibility === 'private' ? 'danger' : 'success'}>
          {r.visibility === 'departments' ? `${r.allowed_department_ids.length} Phòng ban` : r.visibility === 'private' ? 'Riêng tư' : 'Toàn công ty'}
        </Badge>
      ),
    },
    { key: 'size', header: 'Dung lượng', numeric: true, render: (r) => formatBytes(r.size_bytes) },
    { key: 'date', header: 'Ngày tải', render: (r) => formatShortDate(r.created_at) },
    {
      key: 'act',
      header: '',
      align: 'right',
      render: (r, idx) => (
        <div style={{ display: 'inline-flex', gap: 8 }}>
          <button type="button" onClick={() => setLightboxIndex(idx)} title="Xem trước" style={{ border: 'none', background: 'transparent', color: '#1E40FF', cursor: 'pointer' }}><Eye size={15} /></button>
          {canEdit && (
            <button
              type="button"
              onClick={() => {
                setEditingFile(r);
                setUploadModalOpen(true);
              }}
              title="Sửa"
              style={{ border: 'none', background: 'transparent', color: '#475569', cursor: 'pointer' }}
            >
              <Edit2 size={14} />
            </button>
          )}
          {canDelete && <button type="button" onClick={() => void handleDeleteFile(r.id)} title="Xóa" style={{ border: 'none', background: 'transparent', color: '#DC2626', cursor: 'pointer' }}><Trash2 size={14} /></button>}
        </div>
      ),
    },
  ];

  if (loading && !drive) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
          <CardSkeleton height={130} />
          <CardSkeleton height={130} />
          <CardSkeleton height={130} />
        </div>
        <TableSkeleton rows={6} cols={5} />
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
      <Card padding="1.2rem 1.45rem" style={{ background: 'linear-gradient(135deg, #FFFFFF 0%, #F8FAFF 100%)' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 48, height: 48, borderRadius: 16, background: '#EEF2FF', border: '1px solid #DBEAFE', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#1E40FF' }}>
              <Cloud size={24} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <h1 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0F172A', margin: 0 }}>
                  Cloud Drive Category ACL, Batch Export & DOM Vision OCR (CCCD / Hợp Đồng)
                </h1>
                <Badge tone="primary">{packageMeta.shortName}</Badge>
                <Badge tone="success" icon={<Lock size={11} />}>{drive?.namespace_prefix}</Badge>
                <Badge tone="info">Scope: {scope('erp_cloud_ocr')}</Badge>
              </div>
              <p style={{ fontSize: '0.8rem', color: '#64748B', margin: '3px 0 0' }}>
                Phân quyền thư mục & danh mục theo Phòng ban, xem trước Lightbox, xuất gói Bundle che PII & AI OCR
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <button type="button" onClick={() => setIdModalOpen(true)} className="btn secondary" style={{ height: 44, color: '#1E40FF', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <CreditCard size={15} /> Quét CCCD
            </button>
            <button type="button" onClick={() => setContractModalOpen(true)} className="btn secondary" style={{ height: 44, color: '#1E40FF', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <Sparkles size={15} /> AI Hợp đồng
            </button>
            <button type="button" onClick={() => setExportModalOpen(true)} className="btn secondary" style={{ height: 44, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <Archive size={15} /> Xuất Bundle
            </button>
            <button type="button" onClick={() => void reloadAll()} className="btn secondary" style={{ height: 44 }}>
              <RefreshCw size={15} />
            </button>
            <ScreenHelpButton screenKey="erp_cloud_files" />
          </div>
        </div>
      </Card>

      <PillTabs<CloudOpsTabKey>
        activeKey={activeTab}
        onChange={setActiveTab}
        tabs={[
          { key: 'drive', label: 'Kho Tài Liệu Cloud (Category ACL)', icon: <HardDrive size={15} />, count: drive?.files.length || 0 },
          { key: 'ocr', label: 'DOM Vision CCCD & Hợp Đồng AI', icon: <ScanText size={15} />, count: ocrItems.length },
          { key: 'search_docs', label: 'Spotlight Đa Phân Hệ & OpenAPI 3.1', icon: <BookOpen size={15} /> },
        ]}
      />

      {activeTab === 'drive' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: '0.9rem' }}>
            <FormCard icon={<HardDrive size={18} />} title={`${formatBytes(drive?.quota.used_bytes || 0)} / 20 GB`} description={`Namespace: ${drive?.namespace_prefix}`} badge={<Badge tone="primary">{drive?.quota.used_pct || 0}%</Badge>} />
            <FormCard icon={<FolderLock size={18} />} title={`${drive?.quota.visible_folders_count || 0} Thư mục • ${categories.length} Danh mục`} description="Kiểm soát truy cập nghiêm ngặt theo Phòng ban" badge={<Badge tone="success">ACL Active</Badge>} onClick={() => setCatModalOpen(true)} />
          </div>

          <Card padding="0.95rem 1.15rem">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
                <div style={{ position: 'relative', flex: '1 1 240px', maxWidth: 360 }}>
                  <Search size={15} color="#64748B" style={{ position: 'absolute', left: 12, top: 14 }} />
                  <input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Tìm tên tệp, danh mục, đường dẫn..." style={{ width: '100%', height: 42, borderRadius: 12, border: '1px solid #E2E8F0', padding: '0 12px 0 36px' }} />
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <div style={{ display: 'inline-flex', background: '#F1F5F9', padding: 3, borderRadius: 10, border: '1px solid #E2E8F0' }}>
                    <button type="button" onClick={() => setViewMode('grid')} style={{ width: 36, height: 34, borderRadius: 8, border: 'none', background: viewMode === 'grid' ? '#FFFFFF' : 'transparent', color: viewMode === 'grid' ? '#1E40FF' : '#64748B', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}><LayoutGrid size={15} /></button>
                    <button type="button" onClick={() => setViewMode('list')} style={{ width: 36, height: 34, borderRadius: 8, border: 'none', background: viewMode === 'list' ? '#FFFFFF' : 'transparent', color: viewMode === 'list' ? '#1E40FF' : '#64748B', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}><List size={15} /></button>
                  </div>
                  <button type="button" onClick={() => setCatModalOpen(true)} className="btn secondary" style={{ height: 42, color: '#1E40FF', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                    <FolderLock size={15} /> Danh mục ACL
                  </button>
                  {canCreate && (
                    <>
                      <button type="button" onClick={() => setFolderModalOpen(true)} className="btn secondary" style={{ height: 42, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                        <FolderPlus size={15} /> Tạo thư mục
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setEditingFile(null);
                          setUploadModalOpen(true);
                        }}
                        style={{ height: 42, padding: '0 16px', borderRadius: 12, border: 'none', background: '#1E40FF', color: '#FFFFFF', fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}
                      >
                        <Upload size={15} /> Tải tệp lên
                      </button>
                    </>
                  )}
                </div>
              </div>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center' }}>
                <button type="button" onClick={() => setSelectedFolderId('all')} style={{ height: 34, padding: '0 12px', borderRadius: 999, border: selectedFolderId === 'all' ? '1.5px solid #1E40FF' : '1px solid #E2E8F0', background: selectedFolderId === 'all' ? '#EFF6FF' : '#FFFFFF', color: selectedFolderId === 'all' ? '#1E40FF' : '#475569', fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer' }}>
                  Tất cả thư mục
                </button>
                {(drive?.folders || []).map((fl) => (
                  <button key={fl.id} type="button" onClick={() => setSelectedFolderId(fl.id)} style={{ height: 34, padding: '0 12px', borderRadius: 999, border: selectedFolderId === fl.id ? '1.5px solid #1E40FF' : '1px solid #E2E8F0', background: selectedFolderId === fl.id ? '#EFF6FF' : '#FFFFFF', color: selectedFolderId === fl.id ? '#1E40FF' : '#475569', fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer' }}>
                    📁 {fl.name}
                  </button>
                ))}
                <span style={{ color: '#CBD5E1', margin: '0 4px' }}>|</span>
                <button type="button" onClick={() => setSelectedCategoryKey('all')} style={{ height: 34, padding: '0 12px', borderRadius: 999, border: selectedCategoryKey === 'all' ? '1.5px solid #0284C7' : '1px solid #E2E8F0', background: selectedCategoryKey === 'all' ? '#F0F9FF' : '#FFFFFF', color: selectedCategoryKey === 'all' ? '#0284C7' : '#475569', fontSize: '0.76rem', fontWeight: 700, cursor: 'pointer' }}>
                  Mọi danh mục
                </button>
                {categories.map((cat) => (
                  <button key={cat.id} type="button" onClick={() => setSelectedCategoryKey(cat.category_key)} style={{ height: 34, padding: '0 12px', borderRadius: 999, border: selectedCategoryKey === cat.category_key ? '1.5px solid #0284C7' : '1px solid #E2E8F0', background: selectedCategoryKey === cat.category_key ? '#F0F9FF' : '#FFFFFF', color: selectedCategoryKey === cat.category_key ? '#0284C7' : '#475569', fontSize: '0.76rem', fontWeight: 700, cursor: 'pointer' }}>
                    #{cat.label}
                  </button>
                ))}
              </div>
            </div>
          </Card>

          {viewMode === 'list' ? (
            <Table columns={fileColumns} rows={filteredFiles} rowKey={(r) => r.id} emptyTitle="Chưa có tệp tài liệu phù hợp" emptyDescription="Tải tệp mới hoặc đổi bộ lọc Thư mục / Danh mục." />
          ) : filteredFiles.length === 0 ? (
            <EmptyState title="Chưa có tệp tài liệu trong bộ lọc này" description="Mọi tệp tải lên đều được lưu cô lập dưới tiền tố tenants/{tenant_id}/." />
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(265px, 1fr))', gap: '1rem' }}>
              {filteredFiles.map((f, idx) => (
                <FormCard
                  key={f.id}
                  icon={<FileText size={18} />}
                  title={f.name}
                  description={`${formatBytes(f.size_bytes)} • #${f.category_key || 'general'} • ${formatShortDate(f.created_at)}`}
                  badge={<Badge tone="primary">{f.version_tag}</Badge>}
                  onClick={() => setLightboxIndex(idx)}
                  footer={
                    <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                      <Badge tone={f.visibility === 'departments' ? 'warning' : 'success'}>
                        {f.visibility === 'departments' ? `${f.allowed_department_ids.length} Phòng ban` : f.visibility === 'private' ? 'Riêng tư' : 'Toàn công ty'}
                      </Badge>
                      <div style={{ display: 'flex', gap: 8 }} onClick={(e) => e.stopPropagation()}>
                        {canEdit && (
                          <button
                            type="button"
                            onClick={() => {
                              setEditingFile(f);
                              setUploadModalOpen(true);
                            }}
                            style={{ border: 'none', background: 'transparent', color: '#1E40FF', cursor: 'pointer' }}
                          >
                            <Edit2 size={14} />
                          </button>
                        )}
                        {canDelete && <button type="button" onClick={() => void handleDeleteFile(f.id)} style={{ border: 'none', background: 'transparent', color: '#DC2626', cursor: 'pointer' }}><Trash2 size={14} /></button>}
                      </div>
                    </div>
                  }
                />
              ))}
            </div>
          )}
        </div>
      )}

      {(activeTab === 'ocr' || activeTab === 'search_docs') && (
        <CloudOcrSearchPanels
          mode={activeTab}
          ocrItems={ocrItems}
          openApiSpec={openApiSpec}
          onOpenIdExtractor={() => setIdModalOpen(true)}
          onOpenContractParser={() => setContractModalOpen(true)}
          onReload={reloadAll}
        />
      )}

      <AttachmentLightboxModal isOpen={lightboxIndex !== null} initialIndex={lightboxIndex ?? 0} items={lightboxItems} onClose={() => setLightboxIndex(null)} />
      <FileCategoryAclModal isOpen={catModalOpen} onClose={() => setCatModalOpen(false)} categories={categories} departments={drive?.departments || []} canEdit={canEdit} onChanged={reloadAll} />
      <BatchExportModal isOpen={exportModalOpen} onClose={() => setExportModalOpen(false)} folders={drive?.folders || []} files={drive?.files || []} defaultFolderId={selectedFolderId} />
      <ExtractIdDocumentModal isOpen={idModalOpen} onClose={() => setIdModalOpen(false)} cloudFiles={drive?.files || []} onApplied={reloadAll} />
      <AIContractImportModal isOpen={contractModalOpen} onClose={() => setContractModalOpen(false)} onSaved={reloadAll} />
      <CloudDriveModals
        folderModalOpen={folderModalOpen}
        onCloseFolderModal={() => setFolderModalOpen(false)}
        uploadModalOpen={uploadModalOpen}
        onCloseUploadModal={() => setUploadModalOpen(false)}
        editingFile={editingFile}
        selectedFolderId={selectedFolderId}
        defaultCategoryKey={selectedCategoryKey}
        categories={categories}
        departments={drive?.departments || []}
        onSaved={reloadAll}
      />
    </div>
  );
};

export const Wave2Entry = ErpCloudFilesWave2Entry;
export default ErpCloudFilesWave2Entry;
