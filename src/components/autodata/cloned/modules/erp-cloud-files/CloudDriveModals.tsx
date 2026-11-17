import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { CustomModal } from '../../components/ui/CustomModal';
import { apiRequest, getErrorMessage } from '../../../autodataApi';
import { useAuth } from '../../contexts/AuthContext';
import type {
  CloudFileCategoryItem,
  CloudFileItem,
  DepartmentLookupItem,
} from './cloudFilesTypes';

export interface CloudDriveModalsProps {
  folderModalOpen: boolean;
  onCloseFolderModal: () => void;
  uploadModalOpen: boolean;
  onCloseUploadModal: () => void;
  editingFile: CloudFileItem | null;
  selectedFolderId: string;
  defaultCategoryKey: string;
  categories: CloudFileCategoryItem[];
  departments: DepartmentLookupItem[];
  onSaved: () => Promise<void> | void;
}

const FileEditorForm: React.FC<{
  editingFile: CloudFileItem | null;
  selectedFolderId: string;
  defaultCategoryKey: string;
  categories: CloudFileCategoryItem[];
  departments: DepartmentLookupItem[];
  onClose: () => void;
  onSaved: () => Promise<void> | void;
}> = ({ editingFile, selectedFolderId, defaultCategoryKey, categories, departments, onClose, onSaved }) => {
  const { token, tenantSlug } = useAuth();
  const [fileName, setFileName] = useState(editingFile?.name || '');
  const [fileVersion, setFileVersion] = useState(editingFile?.version_tag || 'v1.0');
  const [fileCategoryKey, setFileCategoryKey] = useState(
    editingFile?.category_key || (defaultCategoryKey !== 'all' ? defaultCategoryKey : 'general')
  );
  const [fileVis, setFileVis] = useState<'company' | 'departments' | 'private'>(
    editingFile?.visibility || 'company'
  );
  const [fileDepts, setFileDepts] = useState<string[]>(editingFile?.allowed_department_ids || []);
  const [filePreview, setFilePreview] = useState(editingFile?.content_preview || '');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!fileName.trim()) {
      toast.error('Vui lòng nhập tên tệp tài liệu');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        folder_id: selectedFolderId !== 'all' ? selectedFolderId : editingFile?.folder_id || null,
        name: fileName.trim(),
        version_tag: fileVersion.trim() || 'v1.0',
        category_key: fileCategoryKey || 'general',
        visibility: fileVis,
        allowed_department_ids: fileVis === 'departments' ? fileDepts : [],
        content_preview: filePreview.trim() || undefined,
      };
      if (editingFile) {
        await apiRequest(`/erp-ops/drive/files/${editingFile.id}`, {
          method: 'PATCH',
          token,
          tenantSlug,
          body: payload,
        });
        toast.success('Đã cập nhật thuộc tính & phân quyền tài liệu');
      } else {
        await apiRequest('/erp-ops/drive/files', {
          method: 'POST',
          token,
          tenantSlug,
          body: payload,
        });
        toast.success('Đã tải tệp lên kho lưu trữ cô lập doanh nghiệp');
      }
      onClose();
      await onSaved();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Không thể lưu tệp tài liệu'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 0.6fr', gap: 10 }}>
        <input value={fileName} onChange={(e) => setFileName(e.target.value)} placeholder="Tên tệp (VD: Hop_Dong_2026.pdf)..." style={{ height: 44, borderRadius: 12, border: '1px solid #E2E8F0', padding: '0 12px' }} />
        <input value={fileVersion} onChange={(e) => setFileVersion(e.target.value)} placeholder="v1.0" style={{ height: 44, borderRadius: 12, border: '1px solid #E2E8F0', padding: '0 12px' }} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <select value={fileCategoryKey} onChange={(e) => setFileCategoryKey(e.target.value)} style={{ height: 44, borderRadius: 12, border: '1px solid #E2E8F0', padding: '0 12px' }}>
          <option value="general">Danh mục chung (general)</option>
          {categories.map((c) => <option key={c.id} value={c.category_key}>{c.label} ({c.category_key})</option>)}
        </select>
        <select value={fileVis} onChange={(e) => setFileVis(e.target.value as 'company' | 'departments' | 'private')} style={{ height: 44, borderRadius: 12, border: '1px solid #E2E8F0', padding: '0 12px' }}>
          <option value="company">Toàn công ty</option><option value="departments">Giới hạn Phòng ban</option><option value="private">Riêng tư</option>
        </select>
      </div>
      {fileVis === 'departments' && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {departments.map((d) => (
            <label key={d.id} style={{ fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: 5 }}>
              <input type="checkbox" checked={fileDepts.includes(d.id)} onChange={() => setFileDepts((p) => (p.includes(d.id) ? p.filter((x) => x !== d.id) : [...p, d.id]))} />
              {d.name}
            </label>
          ))}
        </div>
      )}
      <textarea value={filePreview} onChange={(e) => setFilePreview(e.target.value)} rows={4} placeholder="Nội dung trích lược để xem trước nhanh trên Lightbox hoặc quét AI OCR..." style={{ borderRadius: 12, border: '1px solid #E2E8F0', padding: '10px 12px' }} />
      <button type="button" disabled={saving} onClick={() => void handleSave()} style={{ height: 44, borderRadius: 12, border: 'none', background: '#1E40FF', color: '#FFFFFF', fontWeight: 700, cursor: 'pointer' }}>
        {saving ? 'Đang lưu...' : editingFile ? 'Lưu cập nhật' : 'Lưu vào Cloud Drive'}
      </button>
    </div>
  );
};

export const CloudDriveModals: React.FC<CloudDriveModalsProps> = ({
  folderModalOpen,
  onCloseFolderModal,
  uploadModalOpen,
  onCloseUploadModal,
  editingFile,
  selectedFolderId,
  defaultCategoryKey,
  categories,
  departments,
  onSaved,
}) => {
  const { token, tenantSlug } = useAuth();
  const [folderName, setFolderName] = useState('');
  const [folderVis, setFolderVis] = useState<'company' | 'departments' | 'private'>('company');
  const [folderDepts, setFolderDepts] = useState<string[]>([]);

  const handleSaveFolder = async () => {
    if (!folderName.trim()) return;
    try {
      await apiRequest('/erp-ops/drive/folders', {
        method: 'POST',
        token,
        tenantSlug,
        body: {
          name: folderName.trim(),
          visibility: folderVis,
          allowed_department_ids: folderVis === 'departments' ? folderDepts : [],
        },
      });
      toast.success('Đã tạo thư mục Cloud kèm phân quyền ACL');
      setFolderName('');
      onCloseFolderModal();
      await onSaved();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Không thể tạo thư mục'));
    }
  };

  return (
    <>
      <CustomModal isOpen={folderModalOpen} onClose={onCloseFolderModal} title="Tạo Thư Mục Cloud Phân Quyền ACL" width={480}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <input value={folderName} onChange={(e) => setFolderName(e.target.value)} placeholder="Tên thư mục..." style={{ height: 44, borderRadius: 12, border: '1px solid #E2E8F0', padding: '0 12px' }} />
          <select value={folderVis} onChange={(e) => setFolderVis(e.target.value as 'company' | 'departments' | 'private')} style={{ height: 44, borderRadius: 12, border: '1px solid #E2E8F0', padding: '0 12px' }}>
            <option value="company">Toàn công ty</option><option value="departments">Giới hạn Phòng ban</option><option value="private">Riêng tư</option>
          </select>
          {folderVis === 'departments' && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {departments.map((d) => (
                <label key={d.id} style={{ fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                  <input type="checkbox" checked={folderDepts.includes(d.id)} onChange={() => setFolderDepts((p) => (p.includes(d.id) ? p.filter((x) => x !== d.id) : [...p, d.id]))} />
                  {d.name}
                </label>
              ))}
            </div>
          )}
          <button type="button" onClick={() => void handleSaveFolder()} style={{ height: 44, borderRadius: 12, border: 'none', background: '#1E40FF', color: '#FFFFFF', fontWeight: 700, cursor: 'pointer' }}>Tạo thư mục</button>
        </div>
      </CustomModal>

      <CustomModal isOpen={uploadModalOpen} onClose={onCloseUploadModal} title={editingFile ? 'Chỉnh Sửa Tài Liệu & Phân Quyền' : 'Tải Tệp Lên Cloud Drive Cô Lập'} width={540}>
        <FileEditorForm
          key={editingFile?.id || 'new'}
          editingFile={editingFile}
          selectedFolderId={selectedFolderId}
          defaultCategoryKey={defaultCategoryKey}
          categories={categories}
          departments={departments}
          onClose={onCloseUploadModal}
          onSaved={onSaved}
        />
      </CustomModal>
    </>
  );
};
