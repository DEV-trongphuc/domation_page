import React, { useMemo, useRef, useState } from 'react';
import {
  BookOpen,
  Building2,
  Edit2,
  ExternalLink,
  FileUp,
  Lock,
  Plus,
  RefreshCw,
  Search,
  Trash2,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { CustomModal } from '../../components/ui/CustomModal';
import {
  Badge,
  Card,
  Table,
  type TableColumn,
} from '../../components/ui/AutoDataLoadingModal';
import { apiRequest, formatShortDate, getErrorMessage } from '../../../autodataApi';
import {
  KNOWLEDGE_CATEGORIES,
  type DomDepartmentOption,
  type DomKnowledgeDocItem,
  type DomRagCitationItem,
} from './domAgentTypes';

interface DomAgentKnowledgeTabProps {
  docs: DomKnowledgeDocItem[];
  setDocs: React.Dispatch<React.SetStateAction<DomKnowledgeDocItem[]>>;
  departments: DomDepartmentOption[];
  canManage: boolean;
  callerDepartmentId: string | null;
  token?: string | null;
  tenantSlug?: string | null;
}

interface SyncPoliciesResponse {
  synced_count: number;
  total_chunks_indexed: number;
  documents: DomKnowledgeDocItem[];
}

interface RagQueryApiPayload {
  query: string;
  total_accessible_docs: number;
  filtered_by_department_acl: number;
  citations: DomRagCitationItem[];
}

export const DomAgentKnowledgeTab: React.FC<DomAgentKnowledgeTabProps> = ({
  docs,
  setDocs,
  departments,
  canManage,
  callerDepartmentId,
  token,
  tenantSlug,
}) => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [syncingPolicies, setSyncingPolicies] = useState(false);

  // Live RAG Retrieval Tester State
  const [testQuery, setTestQuery] = useState('');
  const [testingRag, setTestingRag] = useState(false);
  const [ragTestResult, setRagTestResult] = useState<RagQueryApiPayload | null>(null);

  // Create / Edit Knowledge Doc Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingDocId, setEditingDocId] = useState<string | null>(null);
  const [formTitle, setFormTitle] = useState('');
  const [formCategory, setFormCategory] = useState('company_policy');
  const [formSourceType, setFormSourceType] = useState<'manual' | 'file_upload'>('manual');
  const [formFileName, setFormFileName] = useState<string | null>(null);
  const [formContent, setFormContent] = useState('');
  const [formAllowedDepts, setFormAllowedDepts] = useState<string[]>([]);
  const [formActive, setFormActive] = useState(true);
  const [savingDoc, setSavingDoc] = useState(false);

  const deptNameById = useMemo(() => {
    const m = new Map<string, string>();
    for (const d of departments) {
      m.set(d.id, d.name);
    }
    return m;
  }, [departments]);

  const openCreateModal = () => {
    setEditingDocId(null);
    setFormTitle('');
    setFormCategory('company_policy');
    setFormSourceType('manual');
    setFormFileName(null);
    setFormContent('');
    setFormAllowedDepts([]);
    setFormActive(true);
    setModalOpen(true);
  };

  const openEditModal = (doc: DomKnowledgeDocItem) => {
    setEditingDocId(doc.id);
    setFormTitle(doc.title);
    setFormCategory(doc.category || 'company_policy');
    setFormSourceType(doc.source_type === 'file_upload' ? 'file_upload' : 'manual');
    setFormFileName(doc.file_name || null);
    setFormContent(doc.content_text || '');
    setFormAllowedDepts(Array.isArray(doc.allowed_department_ids) ? doc.allowed_department_ids : []);
    setFormActive(doc.is_active !== false);
    setModalOpen(true);
  };

  const handleFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      setFormTitle((prev) => prev || file.name.replace(/\.[^.]+$/, ''));
      setFormSourceType('file_upload');
      setFormFileName(file.name);
      setFormContent(text);
      setModalOpen(true);
      toast.success(`Đã đọc tệp "${file.name}" — vui lòng chọn quyền phòng ban và bấm Lưu!`);
    } catch {
      toast.error('Không thể đọc nội dung tệp văn bản.');
    } finally {
      e.target.value = '';
    }
  };

  const handleSaveDoc = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim() || !formContent.trim()) {
      toast.error('Vui lòng nhập đầy đủ tiêu đề và nội dung tài liệu tri thức.');
      return;
    }
    setSavingDoc(true);
    try {
      const body = {
        title: formTitle.trim(),
        category: formCategory,
        source_type: formSourceType,
        file_name: formFileName,
        content_text: formContent,
        allowed_department_ids: formAllowedDepts,
        is_active: formActive,
      };

      if (editingDocId) {
        const updated = await apiRequest<DomKnowledgeDocItem>(
          `/dom-agent/knowledge/${editingDocId}`,
          {
            method: 'PUT',
            token,
            tenantSlug,
            body,
          }
        );
        setDocs((prev) => prev.map((d) => (d.id === updated.id ? updated : d)));
        toast.success(`Đã cập nhật & phân mảnh ${updated.chunk_count} đoạn RAG!`);
      } else {
        const created = await apiRequest<DomKnowledgeDocItem>('/dom-agent/knowledge', {
          method: 'POST',
          token,
          tenantSlug,
          body,
        });
        setDocs((prev) => [created, ...prev]);
        toast.success(`Đã nạp tài liệu & tạo ${created.chunk_count} đoạn RAG cô lập!`);
      }
      setModalOpen(false);
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, 'Không thể lưu tài liệu tri thức RAG.'));
    } finally {
      setSavingDoc(false);
    }
  };

  const handleDeleteDoc = async (doc: DomKnowledgeDocItem) => {
    try {
      await apiRequest(`/dom-agent/knowledge/${doc.id}`, {
        method: 'DELETE',
        token,
        tenantSlug,
      });
      setDocs((prev) => prev.filter((d) => d.id !== doc.id));
      toast.success('Đã xóa tài liệu khỏi kho tri thức RAG.');
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, 'Không thể xóa tài liệu.'));
    }
  };

  const handleSyncPolicies = async () => {
    setSyncingPolicies(true);
    try {
      const out = await apiRequest<SyncPoliciesResponse>('/dom-agent/knowledge/sync-policies', {
        method: 'POST',
        token,
        tenantSlug,
        body: {},
      });
      // Reload clean knowledge list
      const refreshed = await apiRequest<DomKnowledgeDocItem[]>('/dom-agent/knowledge', {
        token,
        tenantSlug,
      });
      setDocs(refreshed);
      toast.success(
        out.synced_count > 0
          ? `Đã đồng bộ ${out.synced_count} Văn bản Nội quy (${out.total_chunks_indexed} chunks RAG)!`
          : 'Chưa có Văn bản Nội quy trạng thái Đã ban hành trong Cài đặt.'
      );
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, 'Không thể đồng bộ Văn bản Nội quy.'));
    } finally {
      setSyncingPolicies(false);
    }
  };

  const handleRunRagTester = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testQuery.trim()) {
      toast.error('Vui lòng nhập câu hỏi hoặc từ khóa cần kiểm thử truy xuất RAG.');
      return;
    }
    setTestingRag(true);
    try {
      const res = await apiRequest<RagQueryApiPayload>('/dom-agent/knowledge/query', {
        method: 'POST',
        token,
        tenantSlug,
        body: { query: testQuery.trim(), top_k: 5 },
      });
      setRagTestResult(res);
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, 'Không thể chạy kiểm thử RAG.'));
    } finally {
      setTestingRag(false);
    }
  };

  const toggleDeptAcl = (deptId: string) => {
    setFormAllowedDepts((prev) =>
      prev.includes(deptId) ? prev.filter((id) => id !== deptId) : [...prev, deptId]
    );
  };

  const columns: TableColumn<DomKnowledgeDocItem>[] = [
    {
      key: 'title',
      header: 'Tài liệu Tri thức Nội bộ',
      render: (row) => (
        <div>
          <div style={{ fontWeight: 700, color: '#0F172A' }}>{row.title}</div>
          <div style={{ fontSize: '0.74rem', color: '#64748B', marginTop: 2 }}>
            {row.source_type === 'policy_sync'
              ? '🔄 Đồng bộ từ Settings Nội quy'
              : row.source_type === 'file_upload'
                ? `📄 Tải tệp: ${row.file_name || 'file'}`
                : '✍️ Biên soạn trực tiếp'}{' '}
            • Cập nhật {formatShortDate(row.updated_at)}
          </div>
        </div>
      ),
    },
    {
      key: 'category',
      header: 'Danh mục',
      render: (row) => {
        const catLabel =
          KNOWLEDGE_CATEGORIES.find((c) => c.value === row.category)?.label || row.category;
        return <Badge tone="info">{catLabel}</Badge>;
      },
    },
    {
      key: 'acl',
      header: 'Phân quyền Phòng ban (Department ACL)',
      render: (row) => {
        const depts = row.allowed_department_ids || [];
        if (depts.length === 0) {
          return (
            <Badge tone="success" icon={<Building2 size={11} />}>
              Toàn doanh nghiệp
            </Badge>
          );
        }
        return (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
            {depts.map((dId) => (
              <Badge key={dId} tone="warning" icon={<Lock size={10} />}>
                {deptNameById.get(dId) || `Phòng ${dId.slice(0, 6)}`}
              </Badge>
            ))}
          </div>
        );
      },
    },
    {
      key: 'chunks',
      header: 'Chunks RAG',
      numeric: true,
      render: (row) => <Badge tone="primary">{row.chunk_count} đoạn</Badge>,
    },
    {
      key: 'status',
      header: 'Trạng thái',
      render: (row) => (
        <Badge tone={row.is_active ? 'success' : 'neutral'}>
          {row.is_active ? 'Đang kích hoạt' : 'Tạm tắt'}
        </Badge>
      ),
    },
    {
      key: 'actions',
      header: 'Thao tác',
      align: 'right',
      render: (row) =>
        canManage ? (
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <button
              type="button"
              onClick={() => openEditModal(row)}
              style={{
                height: 30,
                padding: '0 0.6rem',
                borderRadius: 8,
                border: '1px solid #E2E8F0',
                background: '#FFFFFF',
                color: '#334155',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                fontSize: '0.75rem',
              }}
            >
              <Edit2 size={12} /> Sửa
            </button>
            <button
              type="button"
              onClick={() => void handleDeleteDoc(row)}
              style={{
                height: 30,
                padding: '0 0.6rem',
                borderRadius: 8,
                border: '1px solid rgba(220, 38, 38, 0.25)',
                background: '#FFFFFF',
                color: '#DC2626',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                fontSize: '0.75rem',
              }}
            >
              <Trash2 size={12} />
            </button>
          </div>
        ) : (
          <span style={{ fontSize: '0.74rem', color: '#94A3B8' }}>Chỉ xem</span>
        ),
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
      <input
        ref={fileInputRef}
        type="file"
        accept=".txt,.md,.csv,.json"
        onChange={(e) => void handleFileSelected(e)}
        style={{ display: 'none' }}
      />

      {/* Action Header Card */}
      <Card
        title="RAG Knowledge Studio — Kho Tri Thức Nội Bộ Cô Lập Theo Doanh Nghiệp & Phòng Ban"
        subtitle="Mọi tài liệu được bảo vệ bằng PostgreSQL FORCE ROW LEVEL SECURITY (0% rò rỉ chéo Tenant) và kiểm soát truy xuất theo Phòng ban (Department ACL)"
        actions={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => navigate('/settings?tab=policy_docs')}
              style={{
                height: 38,
                padding: '0 0.85rem',
                borderRadius: 12,
                border: '1px solid #CBD5E1',
                background: '#FFFFFF',
                color: '#334155',
                fontWeight: 600,
                fontSize: '0.8rem',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                cursor: 'pointer',
              }}
            >
              <ExternalLink size={14} /> Mở Cài đặt Nội quy
            </button>

            {canManage && (
              <>
                <button
                  type="button"
                  disabled={syncingPolicies}
                  onClick={() => void handleSyncPolicies()}
                  style={{
                    height: 38,
                    padding: '0 0.95rem',
                    borderRadius: 12,
                    border: '1px solid #DBEAFE',
                    background: '#F8FAFF',
                    color: '#1E40FF',
                    fontWeight: 700,
                    fontSize: '0.8rem',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    cursor: syncingPolicies ? 'wait' : 'pointer',
                  }}
                >
                  <RefreshCw size={14} />
                  {syncingPolicies ? 'Đang đồng bộ...' : 'Đồng bộ Văn bản Nội quy'}
                </button>

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    height: 38,
                    padding: '0 0.9rem',
                    borderRadius: 12,
                    border: '1px solid #E2E8F0',
                    background: '#FFFFFF',
                    color: '#0F172A',
                    fontWeight: 600,
                    fontSize: '0.8rem',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    cursor: 'pointer',
                  }}
                >
                  <FileUp size={14} /> Tải tệp (.txt/.md)
                </button>

                <button
                  type="button"
                  onClick={openCreateModal}
                  style={{
                    height: 38,
                    padding: '0 1rem',
                    borderRadius: 12,
                    border: 'none',
                    background: 'linear-gradient(135deg, #1E40FF 0%, #0284C7 100%)',
                    color: '#FFFFFF',
                    fontWeight: 700,
                    fontSize: '0.8rem',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    cursor: 'pointer',
                  }}
                >
                  <Plus size={15} /> Tạo Tài liệu RAG
                </button>
              </>
            )}
          </div>
        }
      >
        {/* Live RAG Retrieval Tester */}
        <div
          style={{
            padding: '1rem 1.15rem',
            borderRadius: 16,
            background: '#F8F9FA',
            border: '1px solid #E2E8F0',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.85rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
            <div style={{ fontSize: '0.84rem', fontWeight: 700, color: '#0F172A', display: 'flex', alignItems: 'center', gap: 6 }}>
              <Search size={15} color="#1E40FF" />
              <span>Trình Kiểm Thử Truy Xuất Tri Thức Trực Tiếp (Live RAG Retrieval Tester)</span>
            </div>
            <Badge tone="neutral">
              Phòng ban hiện tại của bạn:{' '}
              {callerDepartmentId
                ? deptNameById.get(callerDepartmentId) || callerDepartmentId.slice(0, 8)
                : 'Chưa gắn phòng ban / Toàn công ty'}
            </Badge>
          </div>

          <form onSubmit={(e) => void handleRunRagTester(e)} style={{ display: 'flex', gap: 8 }}>
            <input
              type="text"
              value={testQuery}
              onChange={(e) => setTestQuery(e.target.value)}
              placeholder="Nhập câu hỏi thử nghiệm (ví dụ: Chính sách bảo hành hợp đồng, quy định nghỉ phép...)"
              style={{
                flex: 1,
                height: 40,
                padding: '0 0.9rem',
                borderRadius: 12,
                border: '1px solid #CBD5E1',
                background: '#FFFFFF',
                fontSize: '0.83rem',
                color: '#0F172A',
              }}
            />
            <button
              type="submit"
              disabled={testingRag}
              style={{
                height: 40,
                padding: '0 1.1rem',
                borderRadius: 12,
                border: 'none',
                background: '#1E40FF',
                color: '#FFFFFF',
                fontWeight: 700,
                fontSize: '0.82rem',
                cursor: testingRag ? 'wait' : 'pointer',
              }}
            >
              {testingRag ? 'Đang tìm...' : 'Kiểm thử RAG'}
            </button>
          </form>

          {ragTestResult && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', fontSize: '0.78rem' }}>
                <Badge tone="primary">
                  Tài liệu hợp lệ: {ragTestResult.total_accessible_docs}
                </Badge>
                {ragTestResult.filtered_by_department_acl > 0 && (
                  <Badge tone="warning" icon={<Lock size={10} />}>
                    Đã lọc bảo mật {ragTestResult.filtered_by_department_acl} tài liệu thuộc phòng ban khác
                  </Badge>
                )}
              </div>

              {ragTestResult.citations.length === 0 ? (
                <div style={{ fontSize: '0.8rem', color: '#64748B', padding: '0.5rem 0' }}>
                  Không tìm thấy đoạn văn bản nào khớp với từ khóa trong phạm vi phòng ban của bạn.
                </div>
              ) : (
                ragTestResult.citations.map((cit) => (
                  <div
                    key={cit.chunk_id}
                    style={{
                      padding: '0.7rem 0.9rem',
                      borderRadius: 12,
                      background: '#FFFFFF',
                      border: '1px solid #DBEAFE',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                      <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#0F172A' }}>
                        <BookOpen size={13} style={{ display: 'inline', marginRight: 5, color: '#1E40FF' }} />
                        {cit.title} (Chunk #{cit.chunk_index + 1})
                      </div>
                      <Badge tone="success">Điểm khớp: {cit.score}</Badge>
                    </div>
                    <div style={{ fontSize: '0.79rem', color: '#334155', marginTop: 4, lineHeight: 1.5 }}>
                      {cit.snippet}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </Card>

      {/* Knowledge Docs Table */}
      <Table
        columns={columns}
        rows={docs}
        rowKey={(r) => r.id}
        emptyTitle="Kho Tri thức RAG của doanh nghiệp đang trống"
        emptyDescription='Hãy bấm "Đồng bộ Văn bản Nội quy" để nạp ngay các chính sách từ Cài đặt, hoặc tạo mới tài liệu hướng dẫn riêng.'
      />

      {/* Create / Edit Modal */}
      <CustomModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingDocId ? 'Chỉnh sửa Tài liệu Tri thức RAG' : 'Nạp Tài liệu Mới vào Kho Tri thức RAG'}
        width="680px"
      >
        <form onSubmit={(e) => void handleSaveDoc(e)} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '0.85rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: 5 }}>
                Tiêu đề tài liệu
              </label>
              <input
                type="text"
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                placeholder="Ví dụ: Quy chế Thưởng Kinh doanh Quý 4"
                style={{
                  width: '100%',
                  height: 40,
                  padding: '0 0.85rem',
                  borderRadius: 12,
                  border: '1px solid #CBD5E1',
                  fontSize: '0.84rem',
                  color: '#0F172A',
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: 5 }}>
                Danh mục
              </label>
              <select
                value={formCategory}
                onChange={(e) => setFormCategory(e.target.value)}
                style={{
                  width: '100%',
                  height: 40,
                  padding: '0 0.75rem',
                  borderRadius: 12,
                  border: '1px solid #CBD5E1',
                  fontSize: '0.82rem',
                  color: '#0F172A',
                  background: '#FFFFFF',
                }}
              >
                {KNOWLEDGE_CATEGORIES.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Department ACL Selector */}
          <div>
            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: 5 }}>
              Giới hạn Phòng ban Được phép Truy xuất (Department ACL)
            </label>
            <div
              style={{
                padding: '0.75rem 0.9rem',
                borderRadius: 12,
                background: '#F8F9FA',
                border: '1px solid #E2E8F0',
                display: 'flex',
                flexWrap: 'wrap',
                gap: 8,
              }}
            >
              <button
                type="button"
                onClick={() => setFormAllowedDepts([])}
                style={{
                  padding: '0.35rem 0.75rem',
                  borderRadius: 9999,
                  border:
                    formAllowedDepts.length === 0
                      ? '1.5px solid #1E40FF'
                      : '1px solid #CBD5E1',
                  background: formAllowedDepts.length === 0 ? 'rgba(30, 64, 255, 0.1)' : '#FFFFFF',
                  color: formAllowedDepts.length === 0 ? '#1E40FF' : '#475569',
                  fontSize: '0.76rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                🌐 Toàn doanh nghiệp (Tất cả phòng ban)
              </button>

              {departments.map((dept) => {
                const checked = formAllowedDepts.includes(dept.id);
                return (
                  <button
                    key={dept.id}
                    type="button"
                    onClick={() => toggleDeptAcl(dept.id)}
                    style={{
                      padding: '0.35rem 0.75rem',
                      borderRadius: 9999,
                      border: checked ? '1.5px solid #D97706' : '1px solid #CBD5E1',
                      background: checked ? 'rgba(217, 119, 6, 0.1)' : '#FFFFFF',
                      color: checked ? '#B45309' : '#475569',
                      fontSize: '0.76rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    🔒 {dept.name}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: 5 }}>
              Nội dung văn bản (Hệ thống sẽ tự động chia đoạn Chunking & lập chỉ mục từ khóa)
            </label>
            <textarea
              rows={8}
              value={formContent}
              onChange={(e) => setFormContent(e.target.value)}
              placeholder="Nhập nội dung quy chế, kịch bản bán hàng, điều khoản hợp đồng hoặc hướng dẫn nghiệp vụ..."
              style={{
                width: '100%',
                padding: '0.75rem 0.9rem',
                borderRadius: 12,
                border: '1px solid #CBD5E1',
                fontSize: '0.83rem',
                color: '#0F172A',
                lineHeight: 1.5,
                resize: 'vertical',
              }}
            />
          </div>

          <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: '0.82rem', fontWeight: 600 }}>
            <input
              type="checkbox"
              checked={formActive}
              onChange={(e) => setFormActive(e.target.checked)}
              style={{ accentColor: '#1E40FF', width: 16, height: 16 }}
            />
            Kích hoạt ngay để DOM Agent trích dẫn trong hội thoại
          </label>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, paddingTop: '0.5rem', borderTop: '1px solid #F1F5F9' }}>
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              style={{
                height: 38,
                padding: '0 1rem',
                borderRadius: 12,
                border: '1px solid #CBD5E1',
                background: '#FFFFFF',
                color: '#334155',
                fontWeight: 600,
                fontSize: '0.82rem',
                cursor: 'pointer',
              }}
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={savingDoc}
              style={{
                height: 38,
                padding: '0 1.2rem',
                borderRadius: 12,
                border: 'none',
                background: 'linear-gradient(135deg, #1E40FF 0%, #0284C7 100%)',
                color: '#FFFFFF',
                fontWeight: 700,
                fontSize: '0.82rem',
                cursor: savingDoc ? 'wait' : 'pointer',
              }}
            >
              {savingDoc ? 'Đang lập chỉ mục...' : 'Lưu & Lập chỉ mục RAG'}
            </button>
          </div>
        </form>
      </CustomModal>
    </div>
  );
};
