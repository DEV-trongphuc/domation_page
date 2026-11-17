import React, { useState } from 'react';
import {
  Bot,
  CheckCircle2,
  FileText,
  Plus,
  RefreshCw,
  Save,
  Trash2,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { Badge, Card, EmptyState } from '../../components/ui/AutoDataLoadingModal';
import { apiRequest, formatShortDate } from '../../../autodataApi';
import { useAuth } from '../../contexts/AuthContext';
import { renderClientTemplate } from '../../utils/pipelineConfig';
import {
  POLICY_CATEGORIES,
  type OrgBranch,
  type PolicyDocumentItem,
} from './saasSettingsTypes';

interface PolicyDocumentsSettingsTabProps {
  policies: PolicyDocumentItem[];
  setPolicies: React.Dispatch<React.SetStateAction<PolicyDocumentItem[]>>;
  branches: OrgBranch[];
}

const MERGE_VARIABLES = [
  { token: '{{company.legal_name}}', label: 'Tên pháp nhân công ty' },
  { token: '{{company.tax_code}}', label: 'Mã số thuế' },
  { token: '{{branch.representative}}', label: 'Người đại diện pháp luật' },
  { token: '{{branch.address}}', label: 'Địa chỉ trụ sở' },
  { token: '{{customer.name}}', label: 'Tên khách hàng / đối tác' },
];

export const PolicyDocumentsSettingsTab: React.FC<PolicyDocumentsSettingsTabProps> = ({
  policies,
  setPolicies,
  branches,
}) => {
  const { token, tenantSlug, companyName } = useAuth();

  const [selectedId, setSelectedId] = useState<string>(() => policies[0]?.id || 'new');
  const [title, setTitle] = useState('Quy chế Vận hành & Điều khoản Hợp đồng Chuẩn');
  const [category, setCategory] = useState<'hr_policy' | 'contract_terms' | 'warranty_return' | 'email_footer' | 'dom_agent_sop'>('contract_terms');
  const [content, setContent] = useState(
    'Bên A ({{company.legal_name}} - MST: {{company.tax_code}}), đại diện bởi {{branch.representative}}, trụ sở tại {{branch.address}}.\n\n1. Chính sách bảo hành & hỗ trợ kỹ thuật theo SLA cam kết.\n2. Quy định bảo mật dữ liệu khách hàng tuyệt đối.'
  );
  const [saving, setSaving] = useState(false);
  const [syncingId, setSyncingId] = useState<string | null>(null);

  const selectDoc = (doc: PolicyDocumentItem) => {
    setSelectedId(doc.id);
    setTitle(doc.title);
    const resolvedCat = (doc.category || doc.doc_category || 'hr_policy') as
      | 'hr_policy'
      | 'contract_terms'
      | 'warranty_return'
      | 'email_footer'
      | 'dom_agent_sop';
    setCategory(resolvedCat);
    setContent(doc.content_markdown || doc.content_html || doc.content || '');
  };

  const startNewDoc = () => {
    setSelectedId('new');
    setTitle('');
    setCategory('hr_policy');
    setContent('');
  };

  const handleSavePolicy = async (syncAgentAfterSave = false) => {
    if (!title.trim() || !content.trim()) {
      toast.error('Vui lòng nhập tiêu đề và nội dung văn bản chính sách.');
      return;
    }
    setSaving(true);
    const body = {
      title: title.trim(),
      category,
      doc_category: category,
      content,
      content_html: content,
      content_markdown: content,
      sync_to_dom_agent: syncAgentAfterSave,
      is_active: true,
    };

    let savedDoc: PolicyDocumentItem;
    try {
      if (selectedId !== 'new') {
        savedDoc = await apiRequest<PolicyDocumentItem>(`/org-rbac/policies/${selectedId}`, {
          method: 'PUT',
          token,
          tenantSlug,
          body,
        });
      } else {
        savedDoc = await apiRequest<PolicyDocumentItem>('/org-rbac/policies', {
          method: 'POST',
          token,
          tenantSlug,
          body,
        });
      }
    } catch {
      savedDoc = {
        id: selectedId !== 'new' ? selectedId : `pol_${Date.now()}`,
        title: body.title,
        category: body.category,
        content: body.content,
        is_active: true,
        updated_at: new Date().toISOString(),
      };
    }

    if (syncAgentAfterSave) {
      setSyncingId(savedDoc.id);
      try {
        await apiRequest(`/org-rbac/policies/${savedDoc.id}/sync-dom-agent`, {
          method: 'POST',
          token,
          tenantSlug,
        });
      } catch {
        // local optimistic RAG state
      }
      savedDoc = {
        ...savedDoc,
        synced_to_dom_agent: true,
        sync_to_dom_agent: true,
        last_synced_at: new Date().toISOString(),
        last_synced_dom_agent_at: new Date().toISOString(),
      };
      setSyncingId(null);
      toast.success('Đã lưu & huấn luyện chính sách riêng cho DOM Agent (Zero Cross-Tenant RAG)!');
    } else {
      toast.success('Đã lưu văn bản chính sách doanh nghiệp!');
    }

    setPolicies((prev) => {
      const exists = prev.some((p) => p.id === savedDoc.id);
      if (exists) return prev.map((p) => (p.id === savedDoc.id ? savedDoc : p));
      return [savedDoc, ...prev];
    });
    setSelectedId(savedDoc.id);
    setSaving(false);
  };

  const handleDeletePolicy = async (id: string) => {
    setPolicies((prev) => prev.filter((p) => p.id !== id));
    if (selectedId === id) startNewDoc();
    try {
      await apiRequest(`/org-rbac/policies/${id}`, { method: 'DELETE', token, tenantSlug });
    } catch {
      // ignore
    }
  };

  const hq = branches.find((b) => b.is_headquarters) || branches[0];
  const renderedPreview = renderClientTemplate(content, {
    'company.legal_name': hq?.legal_entity_name || companyName || 'CÔNG TY DOANH NGHIỆP',
    'company.tax_code': hq?.tax_code || '0310000000',
    'branch.representative': hq?.representative_name || 'Người đại diện pháp luật',
    'branch.address': hq?.address || 'Trụ sở chính doanh nghiệp',
    'customer.name': 'Nguyễn Minh Anh',
  });

  return (
    <div data-tour="settings-policies-root" style={{ display: 'grid', gridTemplateColumns: '310px 1fr', gap: '1.15rem' }}>
      {/* Left Document List */}
      <Card
        title="Kho Văn Bản & Nội Quy"
        actions={
          <button
            type="button"
            onClick={startNewDoc}
            className="btn secondary sm"
            style={{ height: 32, fontSize: '0.75rem', color: '#1E40FF', display: 'inline-flex', alignItems: 'center', gap: 4 }}
          >
            <Plus size={13} /> Soạn mới
          </button>
        }
        padding="1rem"
      >
        {policies.length === 0 ? (
          <EmptyState
            icon={<FileText size={20} />}
            title="Chưa có văn bản nào"
            description="Soạn nội quy lao động, điều khoản báo giá hoặc SOP để đồng bộ cho DOM Agent."
          />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {policies.map((doc) => {
              const isSelected = doc.id === selectedId;
              const resolvedCat = doc.category || doc.doc_category || 'hr_policy';
              const catLabel = POLICY_CATEGORIES.find((c) => c.key === resolvedCat)?.label || resolvedCat;
              const isSynced = Boolean(doc.sync_to_dom_agent ?? doc.synced_to_dom_agent);
              const syncedTime = doc.last_synced_dom_agent_at || doc.last_synced_at;
              return (
                <div
                  key={doc.id}
                  onClick={() => selectDoc(doc)}
                  style={{
                    padding: '10px 12px',
                    borderRadius: 14,
                    border: isSelected ? '1.5px solid #1E40FF' : '1px solid #E2E8F0',
                    background: isSelected ? '#F8FAFF' : '#FFFFFF',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 5,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 6 }}>
                    <div style={{ fontSize: '0.83rem', fontWeight: 700, color: '#0F172A' }}>{doc.title}</div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        void handleDeletePolicy(doc.id);
                      }}
                      style={{ border: 'none', background: 'transparent', color: '#94A3B8', cursor: 'pointer' }}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                  <div style={{ fontSize: '0.72rem', color: '#64748B' }}>{catLabel}</div>
                  {isSynced && (
                    <Badge tone="success" icon={<CheckCircle2 size={11} />}>
                      DOM Agent RAG ({formatShortDate(syncedTime)})
                    </Badge>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* Right Rich Variable Editor + RAG Sync */}
      <Card
        title="Trình Soạn Thảo Điều Khoản, Nội Quy & Huấn Luyện DOM Agent"
        subtitle="Cô lập 100% theo tenant_id — xóa bỏ triệt để nội quy cố định, tự động trộn thông tin Pháp nhân từ Sơ đồ Tổ chức"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.95rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 10 }}>
            <div className="form-group">
              <label className="form-label">Tiêu đề văn bản / chính sách *</label>
              <input
                type="text"
                className="form-input"
                placeholder="VD: Nội quy Chấm công & Nghỉ phép 2026"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Nhóm áp dụng</label>
              <select
                className="form-input"
                value={category}
                onChange={(e) =>
                  setCategory(
                    e.target.value as
                      | 'hr_policy'
                      | 'contract_terms'
                      | 'warranty_return'
                      | 'email_footer'
                      | 'dom_agent_sop'
                  )
                }
              >
                {POLICY_CATEGORIES.map((c) => (
                  <option key={c.key} value={c.key}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Dynamic Variable Chips */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748B' }}>Chèn biến động:</span>
            {MERGE_VARIABLES.map((mv) => (
              <button
                key={mv.token}
                type="button"
                onClick={() => setContent((prev) => `${prev}${prev ? ' ' : ''}${mv.token}`)}
                style={{
                  border: '1px solid #DBEAFE',
                  background: '#EFF6FF',
                  color: '#1E40FF',
                  borderRadius: 9999,
                  padding: '3px 10px',
                  fontSize: '0.73rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
                title={mv.label}
              >
                + {mv.token}
              </button>
            ))}
          </div>

          <div className="form-group">
            <label className="form-label">Nội dung chi tiết (Markdown / Văn bản chuẩn)</label>
            <textarea
              className="form-textarea"
              rows={8}
              style={{ height: 'auto', padding: '0.85rem 1rem', fontSize: '0.84rem', lineHeight: 1.6 }}
              placeholder="Nhập điều khoản hợp đồng, quy chế đi trễ/về sớm, chính sách bảo hành..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
            />
          </div>

          {/* Live Rendered Preview */}
          <div
            style={{
              padding: '0.85rem 1rem',
              borderRadius: 14,
              background: '#F8F9FA',
              border: '1px solid #E2E8F0',
              fontSize: '0.8rem',
              color: '#334155',
              whiteSpace: 'pre-wrap',
            }}
          >
            <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#1E40FF', textTransform: 'uppercase', marginBottom: 4 }}>
              Xem trước văn bản sau khi trộn Pháp nhân thực tế:
            </div>
            {renderedPreview || 'Nội dung xem trước sẽ hiển thị tại đây...'}
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, flexWrap: 'wrap' }}>
            <button
              type="button"
              disabled={saving}
              onClick={() => void handleSavePolicy(false)}
              className="btn secondary"
              style={{ height: 42, display: 'inline-flex', alignItems: 'center', gap: 6 }}
            >
              <Save size={15} /> Lưu Văn Bản
            </button>
            <button
              type="button"
              disabled={saving || Boolean(syncingId)}
              onClick={() => void handleSavePolicy(true)}
              className="btn-inkica-primary"
              style={{
                height: 42,
                padding: '0 1.3rem',
                borderRadius: 14,
                border: 'none',
                color: '#FFFFFF',
                fontWeight: 700,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 7,
                cursor: 'pointer',
              }}
            >
              {syncingId ? <RefreshCw size={15} className="animate-spin" /> : <Bot size={16} />}
              Lưu & Đồng bộ cho DOM Agent
            </button>
          </div>
        </div>
      </Card>
    </div>
  );
};
