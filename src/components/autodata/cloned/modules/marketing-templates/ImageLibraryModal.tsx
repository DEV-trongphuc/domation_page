import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Check, Folder, Link2, Plus, Search, Trash2, Upload } from 'lucide-react';
import toast from 'react-hot-toast';
import { Badge, PillTabs } from '../../components/ui/AutoDataLoadingModal';
import { CustomModal } from '../../components/ui/CustomModal';
import { ModalBodySkeleton } from '../../components/ui/Skeleton';
import { apiRequest, getErrorMessage } from '../../../autodataApi';
import { DEFAULT_MEDIA_FOLDERS, FALLBACK_TENANT_MEDIA_ASSETS } from './editorUtils';
import type { MediaAssetItem } from './templateTypes';

export interface ImageLibraryModalProps {
  isOpen: boolean;
  onClose: () => void;
  token?: string | null;
  tenantSlug?: string | null;
  onSelectAsset: (asset: MediaAssetItem) => void;
}

interface MediaListResponse {
  items?: MediaAssetItem[];
}

const ImageLibraryBody: React.FC<Omit<ImageLibraryModalProps, 'isOpen'>> = ({
  onClose,
  token,
  tenantSlug,
  onSelectAsset,
}) => {
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [assets, setAssets] = useState<MediaAssetItem[]>([]);
  const [folder, setFolder] = useState<string>('all');
  const [search, setSearch] = useState('');

  const [newUrl, setNewUrl] = useState('');
  const [newName, setNewName] = useState('');
  const [newAlt, setNewAlt] = useState('');
  const [newFolder, setNewFolder] = useState('banners');

  const fetchMedia = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiRequest<MediaListResponse | MediaAssetItem[]>(
        '/marketing/templates/media',
        { token, tenantSlug }
      );
      const list = Array.isArray(res) ? res : res.items || [];
      setAssets(list.length > 0 ? list : [...FALLBACK_TENANT_MEDIA_ASSETS]);
    } catch {
      setAssets([...FALLBACK_TENANT_MEDIA_ASSETS]);
    } finally {
      setLoading(false);
    }
  }, [token, tenantSlug]);

  useEffect(() => {
    let active = true;
    (async () => {
      await Promise.resolve();
      if (active) await fetchMedia();
    })();
    return () => {
      active = false;
    };
  }, [fetchMedia]);

  const measureImageDimensions = (src: string): Promise<{ width: number; height: number }> =>
    new Promise((resolve) => {
      const img = new window.Image();
      img.onload = () => resolve({ width: img.naturalWidth || 600, height: img.naturalHeight || 300 });
      img.onerror = () => resolve({ width: 600, height: 300 });
      img.src = src;
    });

  const handleCreateAsset = async (urlToSave: string, fileName: string, sizeBytes?: number, mimeType?: string) => {
    if (!urlToSave.trim()) {
      toast.error('Vui lòng nhập URL ảnh hoặc chọn tệp tải lên.');
      return;
    }
    setUploading(true);
    try {
      const dims = await measureImageDimensions(urlToSave.trim());
      const created = await apiRequest<MediaAssetItem>('/marketing/templates/media', {
        method: 'POST',
        token,
        tenantSlug,
        body: {
          name: fileName.trim() || 'email-banner.png',
          url: urlToSave.trim(),
          folder: newFolder,
          alt_text: newAlt.trim() || fileName.trim(),
          width: dims.width,
          height: dims.height,
          size_bytes: sizeBytes || 0,
          mime_type: mimeType || 'image/png',
        },
      });
      setAssets((prev) => [created, ...prev]);
      setNewUrl('');
      setNewName('');
      setNewAlt('');
      toast.success('Đã lưu tài nguyên ảnh vào Thư viện Media doanh nghiệp!');
    } catch (err) {
      toast.error(getErrorMessage(err, 'Không thể tải tài nguyên ảnh lên máy chủ.'));
    } finally {
      setUploading(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = typeof reader.result === 'string' ? reader.result : '';
      if (dataUrl) {
        void handleCreateAsset(dataUrl, file.name, file.size, file.type);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleDeleteAsset = async (asset: MediaAssetItem) => {
    if (asset.id.startsWith('seed-')) {
      setAssets((prev) => prev.filter((a) => a.id !== asset.id));
      return;
    }
    try {
      await apiRequest(`/marketing/templates/media/${asset.id}`, {
        method: 'DELETE',
        token,
        tenantSlug,
      });
      setAssets((prev) => prev.filter((a) => a.id !== asset.id));
      toast.success('Đã xóa ảnh khỏi Thư viện Media.');
    } catch (err) {
      toast.error(getErrorMessage(err, 'Không thể xóa tài nguyên ảnh.'));
    }
  };

  const filteredAssets = useMemo(() => {
    return assets.filter((item) => {
      if (folder !== 'all' && item.folder !== folder) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        return (
          item.name.toLowerCase().includes(q) ||
          (item.alt_text || '').toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [assets, folder, search]);

  if (loading) {
    return <ModalBodySkeleton rows={4} />;
  }

  const inputStyle: React.CSSProperties = {
    height: 44,
    padding: '0 10px',
    borderRadius: 10,
    border: '1px solid #E2E8F0',
    background: '#FFFFFF',
    fontSize: '0.8rem',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div
        style={{
          padding: 12,
          borderRadius: 14,
          background: '#F8FAFF',
          border: '1px solid #DBEAFE',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
          gap: 8,
          alignItems: 'end',
        }}
      >
        <div>
          <label style={{ fontSize: '0.7rem', fontWeight: 700, color: '#334155' }}>Thư mục lưu</label>
          <select value={newFolder} onChange={(e) => setNewFolder(e.target.value)} style={{ ...inputStyle, width: '100%' }}>
            {DEFAULT_MEDIA_FOLDERS.filter((f) => f !== 'all').map((f) => (
              <option key={f} value={f}>{f.toUpperCase()}</option>
            ))}
          </select>
        </div>
        <div>
          <label style={{ fontSize: '0.7rem', fontWeight: 700, color: '#334155' }}>Tên / Mô tả ALT</label>
          <input
            placeholder="Banner ưu đãi..."
            value={newAlt}
            onChange={(e) => {
              setNewAlt(e.target.value);
              if (!newName) setNewName(e.target.value);
            }}
            style={{ ...inputStyle, width: '100%' }}
          />
        </div>
        <div>
          <label style={{ fontSize: '0.7rem', fontWeight: 700, color: '#334155' }}>Dán URL Ảnh</label>
          <input
            placeholder="https://..."
            value={newUrl}
            onChange={(e) => setNewUrl(e.target.value)}
            style={{ ...inputStyle, width: '100%' }}
          />
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <button
            type="button"
            disabled={uploading}
            onClick={() => void handleCreateAsset(newUrl, newName || 'remote-image.png')}
            style={{
              height: 44,
              padding: '0 12px',
              borderRadius: 10,
              border: 'none',
              background: '#1E40FF',
              color: '#FFFFFF',
              fontSize: '0.76rem',
              fontWeight: 700,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
              cursor: 'pointer',
            }}
          >
            <Link2 size={14} /> <Plus size={13} /> Lưu URL
          </button>
          <label
            style={{
              height: 44,
              padding: '0 12px',
              borderRadius: 10,
              border: '1px solid #1E40FF',
              background: '#FFFFFF',
              color: '#1E40FF',
              fontSize: '0.76rem',
              fontWeight: 700,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
              cursor: 'pointer',
            }}
          >
            <Upload size={14} /> Tải tệp
            <input type="file" accept="image/*" onChange={handleFileUpload} style={{ display: 'none' }} />
          </label>
        </div>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
        <PillTabs
          tabs={DEFAULT_MEDIA_FOLDERS.map((f) => ({
            key: f,
            label: f === 'all' ? 'Tất cả' : f.toUpperCase(),
            count: f === 'all' ? assets.length : assets.filter((a) => a.folder === f).length,
          }))}
          activeKey={folder}
          onChange={setFolder}
        />
        <div style={{ position: 'relative', minWidth: 210 }}>
          <Search size={14} color="#94A3B8" style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)' }} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm theo tên hoặc ALT..."
            style={{ ...inputStyle, width: '100%', paddingLeft: 32, height: 38 }}
          />
        </div>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(195px, 1fr))',
          gap: 10,
          maxHeight: 340,
          overflowY: 'auto',
          paddingRight: 2,
        }}
      >
        {filteredAssets.map((asset) => (
          <div
            key={asset.id}
            style={{
              borderRadius: 14,
              border: '1px solid #E2E8F0',
              background: '#FFFFFF',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ height: 116, background: '#F8F9FA', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
              <img src={asset.url} alt={asset.alt_text || asset.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
            <div style={{ padding: 10 }}>
              <div style={{ fontSize: '0.76rem', fontWeight: 700, color: '#0F172A', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {asset.name}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 }}>
                <Badge tone="neutral">
                  <Folder size={10} /> {asset.folder}
                </Badge>
                {asset.width && asset.height && (
                  <span style={{ fontSize: '0.68rem', color: '#64748B' }}>
                    {asset.width}×{asset.height}
                  </span>
                )}
              </div>
              <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                <button
                  type="button"
                  onClick={() => {
                    onSelectAsset(asset);
                    onClose();
                  }}
                  style={{
                    flex: 1,
                    height: 34,
                    borderRadius: 8,
                    border: 'none',
                    background: '#1E40FF',
                    color: '#FFFFFF',
                    fontSize: '0.73rem',
                    fontWeight: 700,
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 4,
                    cursor: 'pointer',
                  }}
                >
                  <Check size={13} /> Chèn ảnh
                </button>
                <button
                  type="button"
                  onClick={() => void handleDeleteAsset(asset)}
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: 8,
                    border: '1px solid #FECACA',
                    background: '#FFFFFF',
                    color: '#DC2626',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                  }}
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export const ImageLibraryModal: React.FC<ImageLibraryModalProps> = (props) => (
  <CustomModal
    isOpen={props.isOpen}
    onClose={props.onClose}
    title="Thư Viện Tài Nguyên Hình Ảnh Doanh Nghiệp (Media Library)"
    width={760}
  >
    {props.isOpen && <ImageLibraryBody {...props} />}
  </CustomModal>
);

export default ImageLibraryModal;
