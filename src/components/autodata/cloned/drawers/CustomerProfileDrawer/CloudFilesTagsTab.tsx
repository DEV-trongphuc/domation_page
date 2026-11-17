import React, { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { ExternalLink, Folder, Layers, Paperclip, Plus, Tag, Trash2, X } from 'lucide-react';
import type { CrmAudienceBadge, CrmContactRecord, CrmTagItem } from '../crmTypes';
import { crmGet, crmMutate, formatDateTimeVi, type CrmAuthCreds } from '../crm360Api';

export interface CloudFilesTagsTabProps {
  contact: CrmContactRecord;
  canEdit: boolean;
  creds: CrmAuthCreds;
  onTagsChanged: () => void;
}

interface ContactFileItem {
  id: string;
  file_name: string;
  file_url: string;
  category: string;
  size_bytes: number;
  uploaded_by_name?: string | null;
  created_at: string;
}

export const CloudFilesTagsTab: React.FC<CloudFilesTagsTabProps> = ({
  contact,
  canEdit,
  creds,
  onTagsChanged,
}) => {
  const [files, setFiles] = useState<ContactFileItem[]>([]);
  const [fileName, setFileName] = useState('');
  const [fileUrl, setFileUrl] = useState('');
  const [fileCategory, setFileCategory] = useState('contract');
  const [tagDraft, setTagDraft] = useState('');

  const currentTags: CrmTagItem[] = contact.tags || [];
  const currentAudiences: CrmAudienceBadge[] = contact.audiences || [];

  const loadFiles = useCallback(async () => {
    try {
      const res = await crmGet<{ items: ContactFileItem[] }>(
        `/contacts/${contact.id}/files`,
        creds
      );
      setFiles(res.items || []);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Không thể tải tài liệu đính kèm');
    }
  }, [contact.id, creds]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadFiles();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [loadFiles]);

  const handleAttachFile = async () => {
    if (!fileName.trim() || !fileUrl.trim()) {
      toast.error('Vui lòng nhập tên tệp và đường dẫn Cloud URL');
      return;
    }
    try {
      await crmMutate(`/contacts/${contact.id}/files`, 'POST', creds, {
        file_name: fileName.trim(),
        file_url: fileUrl.trim(),
        category: fileCategory,
      });
      toast.success('Đã liên kết tài liệu Cloud vào Hồ sơ 360°');
      setFileName('');
      setFileUrl('');
      await loadFiles();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Không thể đính kèm tài liệu');
    }
  };

  const handleRemoveFile = async (fileId: string) => {
    try {
      await crmMutate(`/contacts/${contact.id}/files/${fileId}`, 'DELETE', creds);
      toast.success('Đã gỡ tài liệu đính kèm');
      await loadFiles();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Không thể gỡ tài liệu');
    }
  };

  const updateTagList = async (nextNames: string[]) => {
    try {
      await crmMutate(`/contacts/${contact.id}`, 'PUT', creds, {
        tags: nextNames,
      });
      toast.success('Đã cập nhật nhãn phân loại (Tags)');
      onTagsChanged();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Không thể cập nhật Tags');
    }
  };

  const handleAddTag = async () => {
    const t = tagDraft.trim();
    if (!t) return;
    const names = Array.from(new Set([...currentTags.map((x) => x.name), t]));
    setTagDraft('');
    await updateTagList(names);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
      {/* Tags & Audience Segments */}
      <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 16, padding: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <Tag size={17} color="#1E40FF" />
          <strong style={{ fontSize: '0.92rem', color: '#0F172A' }}>
            Nhãn phân loại (Tags) & Tệp Khách hàng (Audiences)
          </strong>
        </div>

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
          {currentTags.length === 0 ? (
            <span style={{ fontSize: '0.82rem', color: '#64748B' }}>Chưa gắn Tag nào.</span>
          ) : (
            currentTags.map((tg) => (
              <span
                key={tg.id}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '4px 12px',
                  borderRadius: 999,
                  background: '#EFF6FF',
                  border: '1px solid #DBEAFE',
                  color: '#1E40FF',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                }}
              >
                #{tg.name}
                {canEdit && (
                  <button
                    type="button"
                    onClick={() =>
                      void updateTagList(
                        currentTags.filter((x) => x.id !== tg.id).map((x) => x.name)
                      )
                    }
                    style={{ border: 'none', background: 'transparent', color: '#1E40FF', cursor: 'pointer', padding: 0, display: 'inline-flex' }}
                  >
                    <X size={13} />
                  </button>
                )}
              </span>
            ))
          )}
        </div>

        {canEdit && (
          <div style={{ display: 'flex', gap: 8, maxWidth: 420 }}>
            <input
              placeholder="Thêm Tag mới (VD: VIP, B2B-Enterprise)..."
              value={tagDraft}
              onChange={(e) => setTagDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  void handleAddTag();
                }
              }}
              style={{ flex: 1, height: 44, borderRadius: 10, border: '1px solid #E2E8F0', padding: '0 12px', fontSize: '0.83rem' }}
            />
            <button
              type="button"
              onClick={() => void handleAddTag()}
              style={{
                height: 44,
                padding: '0 14px',
                borderRadius: 10,
                border: 'none',
                background: '#1E40FF',
                color: '#FFFFFF',
                fontWeight: 700,
                fontSize: '0.8rem',
                cursor: 'pointer',
              }}
            >
              Gắn Tag
            </button>
          </div>
        )}

        {currentAudiences.length > 0 && (
          <div style={{ marginTop: 14, paddingTop: 12, borderTop: '1px solid #F1F5F9' }}>
            <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#475569', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
              <Layers size={14} color="#1E40FF" /> Thuộc các Tệp Data / Tệp Logic ({currentAudiences.length}):
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {currentAudiences.map((aud) => (
                <span
                  key={aud.id}
                  style={{
                    fontSize: '0.76rem',
                    fontWeight: 700,
                    padding: '3px 10px',
                    borderRadius: 8,
                    background: '#F8FAFC',
                    border: '1px solid #E2E8F0',
                    color: '#0F172A',
                  }}
                >
                  {aud.name} ({aud.audience_type})
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Cloud Files */}
      <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 16, padding: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <Folder size={17} color="#1E40FF" />
          <strong style={{ fontSize: '0.92rem', color: '#0F172A' }}>
            Hồ sơ Cloud & Chứng từ Đính kèm ({files.length})
          </strong>
        </div>

        {canEdit && (
          <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1.6fr 0.9fr auto', gap: 8, marginBottom: 14 }}>
            <input
              placeholder="Tên hồ sơ / hợp đồng..."
              value={fileName}
              onChange={(e) => setFileName(e.target.value)}
              style={{ height: 44, borderRadius: 10, border: '1px solid #E2E8F0', padding: '0 12px', fontSize: '0.83rem' }}
            />
            <input
              placeholder="URL tệp Cloud hoặc Drive..."
              value={fileUrl}
              onChange={(e) => setFileUrl(e.target.value)}
              style={{ height: 44, borderRadius: 10, border: '1px solid #E2E8F0', padding: '0 12px', fontSize: '0.83rem' }}
            />
            <select
              value={fileCategory}
              onChange={(e) => setFileCategory(e.target.value)}
              style={{ height: 44, borderRadius: 10, border: '1px solid #E2E8F0', padding: '0 10px', fontSize: '0.83rem', background: '#FFFFFF' }}
            >
              <option value="contract">Hợp đồng</option>
              <option value="id_doc">CCCD / Pháp lý</option>
              <option value="quote">Báo giá</option>
              <option value="general">Khác</option>
            </select>
            <button
              type="button"
              onClick={() => void handleAttachFile()}
              style={{
                height: 44,
                padding: '0 14px',
                borderRadius: 10,
                border: 'none',
                background: '#1E40FF',
                color: '#FFFFFF',
                fontWeight: 700,
                fontSize: '0.8rem',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                cursor: 'pointer',
              }}
            >
              <Plus size={14} /> Đính kèm
            </button>
          </div>
        )}

        {files.length === 0 ? (
          <div style={{ fontSize: '0.83rem', color: '#64748B' }}>Chưa có tệp Cloud nào đính kèm.</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {files.map((f) => (
              <div
                key={f.id}
                style={{
                  padding: '10px 12px',
                  borderRadius: 10,
                  background: '#F8FAFC',
                  border: '1px solid #E2E8F0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 10,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Paperclip size={15} color="#1E40FF" />
                  <div>
                    <a
                      href={f.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ fontSize: '0.84rem', fontWeight: 700, color: '#0F172A', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 5 }}
                    >
                      {f.file_name} <ExternalLink size={12} color="#1E40FF" />
                    </a>
                    <div style={{ fontSize: '0.73rem', color: '#64748B' }}>
                      Phân loại: {f.category} • Tải lên bởi {f.uploaded_by_name || 'Thành viên'} •{' '}
                      {formatDateTimeVi(f.created_at)}
                    </div>
                  </div>
                </div>
                {canEdit && (
                  <button
                    type="button"
                    onClick={() => void handleRemoveFile(f.id)}
                    style={{ border: 'none', background: 'transparent', color: '#64748B', cursor: 'pointer', padding: 4 }}
                  >
                    <Trash2 size={15} />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CloudFilesTagsTab;
