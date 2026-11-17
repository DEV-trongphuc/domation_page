import React, { useState } from 'react';
import { Archive, Download, FileSpreadsheet, ShieldCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import { CustomModal } from '../../components/ui/CustomModal';
import { Badge } from '../../components/ui/AutoDataLoadingModal';
import { apiRequest, getErrorMessage } from '../../../autodataApi';
import { useAuth } from '../../contexts/AuthContext';
import {
  formatBytes,
  triggerClientDownload,
  type BatchExportManifestResponse,
  type CloudFileItem,
  type CloudFolderItem,
} from './cloudFilesTypes';

export interface BatchExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  folders: CloudFolderItem[];
  files: CloudFileItem[];
  defaultFolderId?: string;
}

export const BatchExportModal: React.FC<BatchExportModalProps> = ({
  isOpen,
  onClose,
  folders,
  files,
  defaultFolderId = 'all',
}) => {
  const { token, tenantSlug } = useAuth();
  const [folderId, setFolderId] = useState(defaultFolderId);
  const [selectedFileIds, setSelectedFileIds] = useState<string[]>([]);
  const [includeContacts, setIncludeContacts] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [bundle, setBundle] = useState<BatchExportManifestResponse | null>(null);

  const visibleInFolder = files.filter((f) => folderId === 'all' || f.folder_id === folderId);

  const toggleFile = (id: string) => {
    setSelectedFileIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const handleGenerateBundle = async () => {
    setExporting(true);
    try {
      const res = await apiRequest<BatchExportManifestResponse>('/erp-ops/drive/export-bundle', {
        method: 'POST',
        token,
        tenantSlug,
        body: {
          folder_id: folderId !== 'all' ? folderId : undefined,
          file_ids: selectedFileIds.length > 0 ? selectedFileIds : undefined,
          include_contacts: includeContacts,
        },
      });
      setBundle(res);
      toast.success(`Đã đóng gói ${res.manifest.total_files} tệp & ${res.manifest.total_contacts} liên hệ CRM!`);
    } catch (err) {
      toast.error(getErrorMessage(err, 'Không thể kết xuất gói dữ liệu Cloud'));
    } finally {
      setExporting(false);
    }
  };

  const handleDownloadJsonBundle = () => {
    if (!bundle) return;
    const decoded = window.atob
      ? decodeURIComponent(
          Array.prototype.map
            .call(window.atob(bundle.bundle_base64), (c: string) => `%${`00${c.charCodeAt(0).toString(16)}`.slice(-2)}`)
            .join('')
        )
      : JSON.stringify({ manifest: bundle.manifest, files: bundle.files, contacts: bundle.contacts }, null, 2);
    triggerClientDownload(bundle.manifest.archive_filename, decoded, 'application/json;charset=utf-8');
  };

  return (
    <CustomModal
      isOpen={isOpen}
      onClose={onClose}
      title="Kết Xuất Gói Tài Liệu Hàng Loạt & Danh Bạ CRM (Batch Bundle Export)"
      width={660}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 10, alignItems: 'center' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: 5 }}>
              Phạm vi thư mục Cloud kết xuất
            </label>
            <select
              value={folderId}
              onChange={(e) => {
                setFolderId(e.target.value);
                setSelectedFileIds([]);
                setBundle(null);
              }}
              style={{ width: '100%', height: 44, borderRadius: 12, border: '1px solid #E2E8F0', padding: '0 12px' }}
            >
              <option value="all">Toàn bộ thư mục được cấp quyền ({files.length} tệp)</option>
              {folders.map((fl) => (
                <option key={fl.id} value={fl.id}>
                  📁 {fl.name}
                </option>
              ))}
            </select>
          </div>

          <label style={{ display: 'flex', alignItems: 'center', gap: 8, paddingTop: 18, fontSize: '0.82rem', fontWeight: 700, color: '#0F172A', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={includeContacts}
              onChange={(e) => {
                setIncludeContacts(e.target.checked);
                setBundle(null);
              }}
            />
            Đính kèm Danh bạ Khách hàng CRM (tự động che PII)
          </label>
        </div>

        {visibleInFolder.length > 0 && (
          <div style={{ maxHeight: 190, overflowY: 'auto', padding: 10, borderRadius: 12, background: '#F8F9FA', border: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', fontWeight: 700, color: '#64748B' }}>
              <span>CHỌN TỆP CỤ THỂ (BỎ TRỐNG = XUẤT TẤT CẢ {visibleInFolder.length} TỆP)</span>
              {selectedFileIds.length > 0 && (
                <button type="button" onClick={() => setSelectedFileIds([])} style={{ border: 'none', background: 'transparent', color: '#1E40FF', fontWeight: 700, cursor: 'pointer' }}>
                  Bỏ chọn ({selectedFileIds.length})
                </button>
              )}
            </div>
            {visibleInFolder.map((f) => (
              <label key={f.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 8px', borderRadius: 8, background: '#FFFFFF', border: '1px solid #F1F5F9', fontSize: '0.8rem', cursor: 'pointer' }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                  <input type="checkbox" checked={selectedFileIds.includes(f.id)} onChange={() => toggleFile(f.id)} />
                  {f.name}
                </span>
                <span style={{ fontSize: '0.73rem', color: '#64748B' }}>{formatBytes(f.size_bytes)}</span>
              </label>
            ))}
          </div>
        )}

        <button
          type="button"
          disabled={exporting}
          onClick={() => void handleGenerateBundle()}
          style={{ height: 44, borderRadius: 12, border: 'none', background: '#1E40FF', color: '#FFFFFF', fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
        >
          <Archive size={16} /> {exporting ? 'Đang đóng gói...' : 'Tạo Gói Manifest & Kiểm Tra ACL / PII'}
        </button>

        {bundle && (
          <div style={{ padding: 14, borderRadius: 16, background: '#EFF6FF', border: '1px solid #BFDBFE', display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
              <strong style={{ fontSize: '0.88rem', color: '#0F172A' }}>
                {bundle.manifest.archive_filename} ({bundle.manifest.total_files} tệp • {formatBytes(bundle.manifest.total_bytes)})
              </strong>
              <Badge tone="success" icon={<ShieldCheck size={12} />}>
                {bundle.manifest.pii_masked ? 'Đã che SĐT/Email PII' : 'Quyền Unmask Đầy Đủ'}
              </Badge>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              <button
                type="button"
                onClick={handleDownloadJsonBundle}
                style={{ height: 40, padding: '0 14px', borderRadius: 10, border: 'none', background: '#1E40FF', color: '#FFFFFF', fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}
              >
                <Download size={14} /> Tải Gói Bundle (.json)
              </button>
              <button
                type="button"
                onClick={() => triggerClientDownload('cloud_files_manifest.csv', bundle.csv_files, 'text/csv;charset=utf-8')}
                className="btn secondary"
                style={{ height: 40, color: '#1E40FF', fontWeight: 700, fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: 6 }}
              >
                <FileSpreadsheet size={14} /> Tải CSV Tệp ({bundle.manifest.total_files})
              </button>
              {includeContacts && (
                <button
                  type="button"
                  onClick={() => triggerClientDownload('crm_contacts_export.csv', bundle.csv_contacts, 'text/csv;charset=utf-8')}
                  className="btn secondary"
                  style={{ height: 40, color: '#059669', fontWeight: 700, fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: 6 }}
                >
                  <FileSpreadsheet size={14} /> Tải CSV Khách hàng ({bundle.manifest.total_contacts})
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </CustomModal>
  );
};
