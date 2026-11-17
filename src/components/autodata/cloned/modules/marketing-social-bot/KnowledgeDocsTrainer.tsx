import React, { useState } from 'react';
import { FileText, RefreshCw, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { Badge, Card, EmptyState } from '../../components/ui/AutoDataLoadingModal';
import { TableSkeleton } from '../../components/ui/Skeleton';
import { apiRequest, getErrorMessage } from '../../../autodataApi';
import { useAuth } from '../../contexts/AuthContext';
import type { TrainingDocDto, TrainingDocType } from './socialBotTypes';

export interface KnowledgeDocsTrainerProps {
  docsLoading: boolean;
  docs: TrainingDocDto[];
  onReloadDocs: () => Promise<void>;
}

export const KnowledgeDocsTrainer: React.FC<KnowledgeDocsTrainerProps> = ({
  docsLoading,
  docs,
  onReloadDocs,
}) => {
  const { token, tenantSlug } = useAuth();
  const [docTitle, setDocTitle] = useState('');
  const [docType, setDocType] = useState<TrainingDocType>('faq');
  const [docUrl, setDocUrl] = useState('');
  const [docContent, setDocContent] = useState('');
  const [editingDocId, setEditingDocId] = useState<string | null>(null);
  const [savingDoc, setSavingDoc] = useState(false);

  const handleSaveDoc = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!docTitle.trim() || !docContent.trim()) {
      toast.error('Vui lòng nhập tiêu đề và nội dung văn bản huấn luyện.');
      return;
    }
    setSavingDoc(true);
    try {
      if (editingDocId) {
        await apiRequest(`/marketing/social-bot/training-docs/${editingDocId}`, {
          method: 'PUT',
          token,
          tenantSlug,
          body: {
            title: docTitle.trim(),
            content_text: docContent.trim(),
            status: 'indexed',
          },
        });
        toast.success('Đã cập nhật & đánh chỉ mục lại tài liệu tri thức!');
      } else {
        await apiRequest('/marketing/social-bot/training-docs', {
          method: 'POST',
          token,
          tenantSlug,
          body: {
            title: docTitle.trim(),
            doc_type: docType,
            source_url: docUrl.trim() || null,
            content_text: docContent.trim(),
          },
        });
        toast.success('Đã băm Chunk & nạp tài liệu vào Kho Tri Thức RAG!');
      }
      setDocTitle('');
      setDocUrl('');
      setDocContent('');
      setEditingDocId(null);
      await onReloadDocs();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Không thể lưu tài liệu huấn luyện.'));
    } finally {
      setSavingDoc(false);
    }
  };

  const handleDeleteDoc = async (id: string) => {
    try {
      await apiRequest(`/marketing/social-bot/training-docs/${id}`, {
        method: 'DELETE',
        token,
        tenantSlug,
      });
      toast.success('Đã xóa tài liệu khỏi kho tri thức.');
      await onReloadDocs();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Không thể xóa tài liệu.'));
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <Card
        title={editingDocId ? 'Cập Nhật Tài Liệu Tri Thức' : 'Nạp Tài Liệu Huấn Luyện Mới (FAQ / Chính Sách / URL / Tài Liệu)'}
        actions={
          editingDocId ? (
            <button
              type="button"
              onClick={() => {
                setEditingDocId(null);
                setDocTitle('');
                setDocContent('');
              }}
              className="btn secondary sm"
              style={{ height: 32 }}
            >
              Hủy sửa
            </button>
          ) : undefined
        }
      >
        <form onSubmit={(e) => void handleSaveDoc(e)} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr 1.2fr', gap: 8 }}>
            <input className="form-input" style={{ height: 42 }} placeholder="Tiêu đề tài liệu (VD: Chính sách Bảo hành & Đổi trả 2026)..." value={docTitle} onChange={(e) => setDocTitle(e.target.value)} />
            <select className="form-input" style={{ height: 42 }} value={docType} onChange={(e) => setDocType(e.target.value as TrainingDocType)}>
              <option value="faq">FAQ — Câu hỏi thường gặp</option>
              <option value="policy">Policy — Chính sách & Quy định</option>
              <option value="product">Product — Tài liệu Sản phẩm</option>
              <option value="url">URL — Nội dung Trang Web</option>
              <option value="pdf">Document — Trích xuất Tài liệu</option>
            </select>
            <input className="form-input" style={{ height: 42 }} placeholder="URL nguồn tham chiếu (Tùy chọn)..." value={docUrl} onChange={(e) => setDocUrl(e.target.value)} />
          </div>
          <textarea
            className="form-input"
            rows={4}
            style={{ padding: '0.65rem' }}
            placeholder="Dán nội dung văn bản chuẩn của doanh nghiệp để hệ thống băm Chunk & đánh chỉ mục RAG cô lập theo Tenant..."
            value={docContent}
            onChange={(e) => setDocContent(e.target.value)}
          />
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button
              type="submit"
              disabled={savingDoc}
              style={{
                height: 40,
                padding: '0 1.2rem',
                borderRadius: 10,
                border: 'none',
                background: '#1E40FF',
                color: '#FFFFFF',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              {savingDoc ? 'Đang đánh chỉ mục...' : editingDocId ? 'Lưu Cập Nhật Chunk' : '+ Nạp Vào Kho RAG'}
            </button>
          </div>
        </form>
      </Card>

      <Card
        title={`Kho Tài Liệu Đã Đánh Chỉ Mục (${docs.length})`}
        actions={
          <button type="button" onClick={() => void onReloadDocs()} className="btn secondary sm" style={{ height: 34 }}>
            <RefreshCw size={13} />
          </button>
        }
      >
        {docsLoading ? (
          <TableSkeleton rows={3} cols={4} />
        ) : docs.length === 0 ? (
          <EmptyState
            icon={<FileText size={22} />}
            title="Chưa có tài liệu huấn luyện nào"
            description="Nạp tài liệu chính sách, bảng giá hoặc quy trình CSKH ở khung phía trên để làm giàu bộ nhớ cho DOM Agent."
          />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {docs.map((d) => (
              <div
                key={d.id}
                style={{
                  padding: '0.8rem 1rem',
                  borderRadius: 12,
                  border: '1px solid #E2E8F0',
                  background: '#FFFFFF',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: 10,
                }}
              >
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                    <span style={{ fontWeight: 800, fontSize: '0.85rem', color: '#0F172A' }}>{d.title}</span>
                    <Badge tone="primary">{d.doc_type.toUpperCase()}</Badge>
                    <Badge tone="success">{d.status} • {d.chunk_count} chunks • {d.token_count} tokens</Badge>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: 3 }}>
                    {d.content_text.slice(0, 120)}
                    {d.content_text.length > 120 ? '...' : ''}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 6 }}>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingDocId(d.id);
                      setDocTitle(d.title);
                      setDocType(d.doc_type);
                      setDocUrl(d.source_url || '');
                      setDocContent(d.content_text);
                    }}
                    className="btn secondary sm"
                    style={{ height: 32, color: '#1E40FF' }}
                  >
                    Sửa
                  </button>
                  <button type="button" onClick={() => void handleDeleteDoc(d.id)} className="btn secondary sm" style={{ height: 32, color: '#DC2626' }}>
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
};

export default KnowledgeDocsTrainer;
