import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ArrowDown,
  ArrowUp,
  Copy,
  Edit2,
  Eye,
  FolderPlus,
  Mail,
  Monitor,
  Plus,
  RefreshCw,
  Save,
  Send,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Trash2,
} from 'lucide-react';
import toast from 'react-hot-toast';
import {
  AutoDataLoadingModal,
  Badge,
  Card,
  EmptyState,
  FormCard,
  PillTabs,
} from '../../components/ui/AutoDataLoadingModal';
import { CustomModal } from '../../components/ui/CustomModal';
import { ScreenHelpButton } from '../../components/ui/ScreenHelpButton';
import { apiRequest, formatShortDate, getErrorMessage } from '../../../autodataApi';
import { useAuth } from '../../contexts/AuthContext';
import { useEntitlement } from '../../contexts/EntitlementContext';
import {
  EMAIL_15_BLOCK_PALETTE,
  compileBlocksToEmailHtml,
  createDefaultEmailBlock,
  evaluateLocalSpamScore,
  previewRenderMergeTags,
  type EmailBlockItem,
  type EmailBlockType15,
  type EmailBodyStyle,
  type MergeTagDefinition,
} from './htmlCompiler';

interface TemplateGroupDto {
  id: string;
  name: string;
  description?: string;
  color_hex?: string;
}

interface EmailTemplateDto {
  id: string;
  group_id: string | null;
  group_name?: string | null;
  name: string;
  subject: string;
  preheader: string;
  category: string;
  blocks: EmailBlockItem[];
  body_style: EmailBodyStyle;
  compiled_html: string;
  spam_score: number;
  merge_tags: string[];
  updated_at?: string;
}

interface TemplatesListResponse {
  items?: EmailTemplateDto[];
  groups?: TemplateGroupDto[];
  merge_tags?: MergeTagDefinition[];
  sender_vault?: {
    configured: boolean;
    provider: string | null;
    from_email: string;
    from_name: string;
  };
}

interface DomStudioGenerateResponse {
  subject: string;
  preheader: string;
  blocks: EmailBlockItem[];
  compiled_html: string;
}

export const MarketingTemplatesPage: React.FC = () => {
  const { token, tenantSlug, companyName } = useAuth();
  const { terminology, can } = useEntitlement();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [templates, setTemplates] = useState<EmailTemplateDto[]>([]);
  const [groups, setGroups] = useState<TemplateGroupDto[]>([]);
  const [mergeTags, setMergeTags] = useState<MergeTagDefinition[]>([]);
  const [senderVault, setSenderVault] = useState<TemplatesListResponse['sender_vault']>();

  const [activeGroupId, setActiveGroupId] = useState<string>('all');
  const [mode, setMode] = useState<'library' | 'editor'>('library');
  const [viewport, setViewport] = useState<'desktop' | 'mobile'>('desktop');
  const [dragBlockIndex, setDragBlockIndex] = useState<number | null>(null);

  // Active Editor State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [tplName, setTplName] = useState('Mẫu Email Chào Mừng Khách Mới');
  const [tplSubject, setTplSubject] = useState('Ưu đãi đặc quyền dành cho {{lead.name}}');
  const [tplPreheader, setTplPreheader] = useState('Khám phá giải pháp tối ưu từ {{tenant.name}}');
  const [tplGroupId, setTplGroupId] = useState<string>('');
  const [blocks, setBlocks] = useState<EmailBlockItem[]>([]);
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);

  // Modals
  const [studioOpen, setStudioOpen] = useState(false);
  const [studioGoal, setStudioGoal] = useState('Giới thiệu giải pháp mới & tặng mã ưu đãi 20%');
  const [studioTone, setStudioTone] = useState<'professional' | 'friendly' | 'urgent'>('professional');
  const [studioGenerating, setStudioGenerating] = useState(false);

  const [newGroupModalOpen, setNewGroupModalOpen] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');

  const [testModalOpen, setTestModalOpen] = useState(false);
  const [testEmail, setTestEmail] = useState('');

  const fetchLibrary = useCallback(async () => {
    return apiRequest<TemplatesListResponse>('/marketing/templates', {
      token,
      tenantSlug,
    });
  }, [token, tenantSlug]);

  const reloadLibrary = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchLibrary();
      setTemplates(data.items || []);
      setGroups(data.groups || []);
      setMergeTags(
        data.merge_tags || [
          { key: '{{lead.name}}', label: `Họ tên ${terminology.customerLabel}`, sample: 'Nguyễn Minh Anh' },
          { key: '{{lead.phone}}', label: 'Số điện thoại', sample: '0909123456' },
          { key: '{{tenant.name}}', label: 'Tên Doanh nghiệp', sample: companyName || 'DOMATION' },
          { key: '{{unsubscribe_url}}', label: 'Link Hủy đăng ký', sample: '#unsubscribe' },
        ]
      );
      setSenderVault(data.sender_vault);
    } catch (err) {
      toast.error(getErrorMessage(err, 'Không thể tải thư viện mẫu Email.'));
    } finally {
      setLoading(false);
    }
  }, [fetchLibrary, terminology.customerLabel, companyName]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await fetchLibrary();
        if (cancelled) return;
        setTemplates(data.items || []);
        setGroups(data.groups || []);
        if (data.merge_tags) setMergeTags(data.merge_tags);
        setSenderVault(data.sender_vault);
      } catch {
        // Handled gracefully
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [fetchLibrary]);

  const openNewEditor = () => {
    const hero = createDefaultEmailBlock('hero_banner', crypto.randomUUID());
    const text = createDefaultEmailBlock('text', crypto.randomUUID());
    const voucher = createDefaultEmailBlock('voucher_box', crypto.randomUUID());
    const timer = createDefaultEmailBlock('countdown_timer', crypto.randomUUID());
    setEditingId(null);
    setTplName(`Mẫu Email Chăm Sóc ${terminology.customerLabel}`);
    setTplSubject(`[{{tenant.name}}] Giải pháp tối ưu dành cho {{lead.name}}`);
    setTplPreheader('Quyền lợi cá nhân hóa dành riêng cho bạn.');
    setTplGroupId('');
    setBlocks([hero, text, voucher, timer]);
    setSelectedBlockId(hero.id);
    setMode('editor');
  };

  const openEditTemplate = (tpl: EmailTemplateDto) => {
    setEditingId(tpl.id);
    setTplName(tpl.name);
    setTplSubject(tpl.subject);
    setTplPreheader(tpl.preheader || '');
    setTplGroupId(tpl.group_id || '');
    const loadedBlocks = tpl.blocks && tpl.blocks.length > 0
      ? tpl.blocks
      : [createDefaultEmailBlock('text', crypto.randomUUID())];
    setBlocks(loadedBlocks);
    setSelectedBlockId(loadedBlocks[0]?.id || null);
    setMode('editor');
  };

  const addBlock = (type: EmailBlockType15) => {
    const next = createDefaultEmailBlock(type, crypto.randomUUID());
    setBlocks((prev) => [...prev, next]);
    setSelectedBlockId(next.id);
  };

  const updateSelectedBlock = (patch: Partial<EmailBlockItem>) => {
    if (!selectedBlockId) return;
    setBlocks((prev) => prev.map((b) => (b.id === selectedBlockId ? { ...b, ...patch } : b)));
  };

  const moveBlock = (index: number, delta: -1 | 1) => {
    const target = index + delta;
    if (target < 0 || target >= blocks.length) return;
    setBlocks((prev) => {
      const clone = [...prev];
      const [moved] = clone.splice(index, 1);
      clone.splice(target, 0, moved);
      return clone;
    });
  };

  const duplicateBlock = (block: EmailBlockItem, idx: number) => {
    const copy: EmailBlockItem = { ...block, id: crypto.randomUUID() };
    setBlocks((prev) => {
      const clone = [...prev];
      clone.splice(idx + 1, 0, copy);
      return clone;
    });
    setSelectedBlockId(copy.id);
  };

  const removeBlock = (id: string) => {
    setBlocks((prev) => prev.filter((b) => b.id !== id));
    if (selectedBlockId === id) setSelectedBlockId(null);
  };

  const compiledHtml = useMemo(
    () => compileBlocksToEmailHtml(blocks, { primaryColor: '#1E40FF' }, tplSubject || tplName),
    [blocks, tplSubject, tplName]
  );

  const previewHtml = useMemo(
    () => previewRenderMergeTags(compiledHtml, mergeTags),
    [compiledHtml, mergeTags]
  );

  const spamReport = useMemo(
    () => evaluateLocalSpamScore(tplSubject, blocks, compiledHtml),
    [tplSubject, blocks, compiledHtml]
  );

  const selectedBlock = useMemo(
    () => blocks.find((b) => b.id === selectedBlockId) || null,
    [blocks, selectedBlockId]
  );

  const handleSaveTemplate = async () => {
    if (!tplName.trim()) {
      toast.error('Vui lòng nhập tên mẫu Email.');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name: tplName.trim(),
        subject: tplSubject.trim(),
        preheader: tplPreheader.trim(),
        group_id: tplGroupId || null,
        blocks,
        compiled_html: compiledHtml,
      };
      if (editingId) {
        await apiRequest(`/marketing/templates/${editingId}`, {
          method: 'PUT',
          token,
          tenantSlug,
          body: payload,
        });
        toast.success('Đã cập nhật mẫu Email thành công!');
      } else {
        const created = await apiRequest<EmailTemplateDto>('/marketing/templates', {
          method: 'POST',
          token,
          tenantSlug,
          body: payload,
        });
        setEditingId(created.id);
        toast.success('Đã lưu mẫu Email vào thư viện doanh nghiệp!');
      }
      await reloadLibrary();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Không thể lưu mẫu Email.'));
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteTemplate = async (id: string) => {
    try {
      await apiRequest(`/marketing/templates/${id}`, {
        method: 'DELETE',
        token,
        tenantSlug,
      });
      toast.success('Đã xóa mẫu Email.');
      await reloadLibrary();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Không thể xóa mẫu Email.'));
    }
  };

  const handleRunDomStudio = async () => {
    setStudioGenerating(true);
    try {
      const res = await apiRequest<DomStudioGenerateResponse>('/marketing/templates/ai-generate', {
        method: 'POST',
        token,
        tenantSlug,
        body: {
          goal: studioGoal,
          tone: studioTone,
          include_voucher: true,
          include_countdown: true,
        },
      });
      setTplSubject(res.subject);
      setTplPreheader(res.preheader);
      setBlocks(res.blocks);
      setSelectedBlockId(res.blocks[0]?.id || null);
      setStudioOpen(false);
      setMode('editor');
      toast.success('DOM Agent Email Studio đã sinh bố cục & nội dung chuẩn chống Spam!');
    } catch (err) {
      toast.error(getErrorMessage(err, 'DOM Agent không thể sinh mẫu Email.'));
    } finally {
      setStudioGenerating(false);
    }
  };

  const handleCreateGroup = async () => {
    if (!newGroupName.trim()) return;
    try {
      await apiRequest('/marketing/templates/groups', {
        method: 'POST',
        token,
        tenantSlug,
        body: { name: newGroupName.trim(), color_hex: '#1E40FF' },
      });
      setNewGroupName('');
      setNewGroupModalOpen(false);
      toast.success('Đã tạo thư mục mẫu Email.');
      await reloadLibrary();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Không thể tạo nhóm mẫu Email.'));
    }
  };

  const handleSendTest = async () => {
    if (!editingId) {
      toast.error('Vui lòng lưu mẫu Email trước khi gửi thử.');
      return;
    }
    try {
      const res = await apiRequest<{ rendered_subject: string; provider: string }>(
        `/marketing/templates/${editingId}/test-send`,
        {
          method: 'POST',
          token,
          tenantSlug,
          body: { to_email: testEmail },
        }
      );
      toast.success(`Đã kết xuất gửi thử qua ${res.provider}: "${res.rendered_subject}"`);
      setTestModalOpen(false);
    } catch (err) {
      toast.error(getErrorMessage(err, 'Không thể gửi thử Email.'));
    }
  };

  const filteredTemplates = useMemo(() => {
    if (activeGroupId === 'all') return templates;
    return templates.filter((t) => t.group_id === activeGroupId);
  }, [templates, activeGroupId]);

  const insertMergeTag = (tagKey: string) => {
    if (selectedBlock) {
      updateSelectedBlock({ content: `${selectedBlock.content || ''} ${tagKey}`.trim() });
      toast.success(`Đã chèn biến trộn ${tagKey} vào khối đang chọn!`);
    } else {
      setTplSubject((prev) => `${prev} ${tagKey}`.trim());
      toast.success(`Đã chèn biến trộn ${tagKey} vào tiêu đề!`);
    }
  };

  if (loading) {
    return (
      <AutoDataLoadingModal
        inline
        isOpen
        message="Đang tải Thư viện Mẫu Email & Trình Kéo-Thả 15 Khối..."
      />
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', background: '#F8F9FA' }}>
      <Card
        padding="1.25rem 1.5rem"
        style={{ background: 'linear-gradient(135deg, #FFFFFF 0%, #F8FAFF 100%)' }}
      >
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div
              style={{
                width: 46,
                height: 46,
                borderRadius: 15,
                background: '#EEF2FF',
                border: '1px solid #DBEAFE',
                color: '#1E40FF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Mail size={22} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <h1 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0F172A', margin: 0 }}>
                  Email Templates & Trình Kéo-Thả 15 Khối
                </h1>
                <Badge tone="primary">Responsive HTML Compiler</Badge>
                <Badge tone={senderVault?.configured ? 'success' : 'info'} icon={<ShieldCheck size={12} />}>
                  {senderVault?.configured ? `Vault: ${senderVault.provider}` : 'Sẵn sàng nối AWS SES / SMTP Vault'}
                </Badge>
              </div>
              <p style={{ fontSize: '0.8rem', color: '#64748B', marginTop: 3 }}>
                Cá nhân hóa {terminology.customerLabel} bằng biến trộn động, kiểm tra điểm chống Spam & <strong>DOM Agent Email Studio</strong>.
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <ScreenHelpButton screenKey="mkt_templates" />
            <button
              type="button"
              onClick={() => setStudioOpen(true)}
              className="btn secondary"
              style={{ height: 44, color: '#1E40FF', display: 'inline-flex', alignItems: 'center', gap: 6, fontWeight: 700 }}
            >
              <Sparkles size={16} /> DOM Agent Email Studio
            </button>
            {mode === 'library' ? (
              can('email_templates', 'create') && (
                <button
                  type="button"
                  onClick={openNewEditor}
                  className="btn-inkica-primary"
                  style={{
                    height: 44,
                    padding: '0 1.2rem',
                    borderRadius: 12,
                    border: 'none',
                    background: '#1E40FF',
                    color: '#FFFFFF',
                    fontWeight: 700,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    cursor: 'pointer',
                  }}
                >
                  <Plus size={16} /> Tạo Mẫu Email Mới
                </button>
              )
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => setMode('library')}
                  className="btn secondary"
                  style={{ height: 44 }}
                >
                  Quay lại Thư viện
                </button>
                {editingId && (
                  <button
                    type="button"
                    onClick={() => setTestModalOpen(true)}
                    className="btn secondary"
                    style={{ height: 44, display: 'inline-flex', alignItems: 'center', gap: 6 }}
                  >
                    <Send size={15} /> Gửi thử
                  </button>
                )}
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => void handleSaveTemplate()}
                  className="btn-inkica-primary"
                  style={{
                    height: 44,
                    padding: '0 1.25rem',
                    borderRadius: 12,
                    border: 'none',
                    background: '#1E40FF',
                    color: '#FFFFFF',
                    fontWeight: 700,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    cursor: 'pointer',
                  }}
                >
                  <Save size={16} /> {saving ? 'Đang lưu...' : 'Lưu & Biên dịch HTML'}
                </button>
              </>
            )}
          </div>
        </div>
      </Card>

      {mode === 'library' ? (
        <>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
            <PillTabs
              tabs={[
                { key: 'all', label: 'Tất cả Mẫu Email', count: templates.length },
                ...groups.map((g) => ({
                  key: g.id,
                  label: g.name,
                  count: templates.filter((t) => t.group_id === g.id).length,
                })),
              ]}
              activeKey={activeGroupId}
              onChange={setActiveGroupId}
            />
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                type="button"
                onClick={() => setNewGroupModalOpen(true)}
                className="btn secondary"
                style={{ height: 44, display: 'inline-flex', alignItems: 'center', gap: 6 }}
              >
                <FolderPlus size={15} /> Nhóm thư mục mới
              </button>
              <button
                type="button"
                onClick={() => void reloadLibrary()}
                className="btn secondary"
                style={{ height: 44, display: 'inline-flex', alignItems: 'center', gap: 6 }}
              >
                <RefreshCw size={15} /> Làm mới
              </button>
            </div>
          </div>

          {filteredTemplates.length === 0 ? (
            <EmptyState
              icon={<Mail size={24} />}
              title="Chưa có mẫu Email nào trong thư mục này"
              description="Khởi tạo mẫu Email kéo-thả 15 khối hoặc nhờ DOM Agent Email Studio tự động sinh bố cục chỉ trong 3 giây."
              action={
                <div style={{ display: 'flex', gap: 10 }}>
                  <button
                    type="button"
                    onClick={() => setStudioOpen(true)}
                    className="btn secondary"
                    style={{ height: 44, color: '#1E40FF', fontWeight: 700 }}
                  >
                    Mở DOM Agent Email Studio
                  </button>
                  <button
                    type="button"
                    onClick={openNewEditor}
                    style={{
                      height: 44,
                      padding: '0 1.2rem',
                      borderRadius: 12,
                      border: 'none',
                      background: '#1E40FF',
                      color: '#FFFFFF',
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    Thiết kế từ đầu
                  </button>
                </div>
              }
            />
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(310px, 1fr))', gap: '1rem' }}>
              {filteredTemplates.map((tpl) => (
                <FormCard
                  key={tpl.id}
                  icon={<Mail size={18} />}
                  title={tpl.name}
                  description={tpl.subject}
                  badge={
                    <Badge tone={tpl.spam_score <= 20 ? 'success' : tpl.spam_score <= 45 ? 'info' : 'warning'}>
                      Spam Risk: {tpl.spam_score}/100
                    </Badge>
                  }
                  footer={
                    <>
                      <span style={{ fontSize: '0.75rem', color: '#64748B' }}>
                        {tpl.blocks?.length || 0} khối • {formatShortDate(tpl.updated_at)}
                      </span>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button
                          type="button"
                          onClick={() => openEditTemplate(tpl)}
                          className="btn secondary sm"
                          style={{ height: 36, color: '#1E40FF', display: 'inline-flex', alignItems: 'center', gap: 5 }}
                        >
                          <Edit2 size={13} /> Chỉnh sửa
                        </button>
                        {can('email_templates', 'delete') && (
                          <button
                            type="button"
                            onClick={() => void handleDeleteTemplate(tpl.id)}
                            className="btn secondary sm"
                            style={{ height: 36, color: '#DC2626' }}
                          >
                            <Trash2 size={13} />
                          </button>
                        )}
                      </div>
                    </>
                  }
                >
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                    {(tpl.merge_tags || []).slice(0, 4).map((mt) => (
                      <Badge key={mt} tone="neutral">
                        {mt}
                      </Badge>
                    ))}
                  </div>
                </FormCard>
              ))}
            </div>
          )}
        </>
      ) : (
        /* 15-Block Visual Drag-Drop Email Editor */
        <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr 330px', gap: '1rem', alignItems: 'start' }}>
          {/* Left Toolbox: 15 Draggable/Clickable Blocks + Dynamic Merge Tags */}
          <Card title="15 Khối Thiết Kế Email" subtitle="Nhấn hoặc kéo thả khối vào Canvas">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 7, maxHeight: 540, overflowY: 'auto' }}>
              {EMAIL_15_BLOCK_PALETTE.map((item) => (
                <button
                  key={item.type}
                  type="button"
                  onClick={() => addBlock(item.type)}
                  style={{
                    textAlign: 'left',
                    background: '#FFFFFF',
                    border: '1px solid #E2E8F0',
                    borderRadius: 12,
                    padding: '0.6rem 0.75rem',
                    cursor: 'pointer',
                    transition: 'border-color 0.15s ease',
                  }}
                >
                  <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#0F172A' }}>+ {item.label}</div>
                  <div style={{ fontSize: '0.72rem', color: '#64748B', marginTop: 2 }}>{item.desc}</div>
                </button>
              ))}
            </div>

            <div style={{ marginTop: '1rem', paddingTop: '0.85rem', borderTop: '1px solid #E2E8F0' }}>
              <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#0F172A', marginBottom: 6 }}>
                Biến Trộn Cá Nhân Hóa (Merge Tags)
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                {mergeTags.map((tag) => (
                  <button
                    key={tag.key}
                    type="button"
                    onClick={() => insertMergeTag(tag.key)}
                    title={tag.label}
                    style={{
                      padding: '4px 8px',
                      borderRadius: 8,
                      border: '1px solid #DBEAFE',
                      background: '#EFF6FF',
                      color: '#1E40FF',
                      fontSize: '0.7rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    {tag.key}
                  </button>
                ))}
              </div>
            </div>
          </Card>

          {/* Center: Metadata + Block Order Canvas + Live Desktop/Mobile Responsive Preview */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <Card title="Thông tin Tiêu đề & Phân nhóm">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label className="form-label" style={{ fontSize: '0.78rem', fontWeight: 700 }}>Tên mẫu quản lý nội bộ</label>
                  <input
                    className="form-input"
                    style={{ height: 44, background: '#FFFFFF', border: '1px solid #E2E8F0' }}
                    value={tplName}
                    onChange={(e) => setTplName(e.target.value)}
                  />
                </div>
                <div>
                  <label className="form-label" style={{ fontSize: '0.78rem', fontWeight: 700 }}>Nhóm thư mục</label>
                  <select
                    className="form-input"
                    style={{ height: 44, background: '#FFFFFF', border: '1px solid #E2E8F0' }}
                    value={tplGroupId}
                    onChange={(e) => setTplGroupId(e.target.value)}
                  >
                    <option value="">— Chưa phân nhóm —</option>
                    {groups.map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="form-label" style={{ fontSize: '0.78rem', fontWeight: 700 }}>Tiêu đề Email (Subject)</label>
                  <input
                    className="form-input"
                    style={{ height: 44, background: '#FFFFFF', border: '1px solid #E2E8F0' }}
                    value={tplSubject}
                    onChange={(e) => setTplSubject(e.target.value)}
                  />
                </div>
                <div>
                  <label className="form-label" style={{ fontSize: '0.78rem', fontWeight: 700 }}>Dòng tóm tắt hộp thư (Preheader)</label>
                  <input
                    className="form-input"
                    style={{ height: 44, background: '#FFFFFF', border: '1px solid #E2E8F0' }}
                    value={tplPreheader}
                    onChange={(e) => setTplPreheader(e.target.value)}
                  />
                </div>
              </div>
            </Card>

            <Card
              title="Danh sách Khối Kéo-Thả trên Canvas"
              subtitle="Kéo thả để đổi thứ tự hoặc nhấn chọn khối để tinh chỉnh thuộc tính bên phải"
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {blocks.map((b, idx) => {
                  const isSel = b.id === selectedBlockId;
                  return (
                    <div
                      key={b.id}
                      draggable
                      onDragStart={() => setDragBlockIndex(idx)}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={() => {
                        if (dragBlockIndex === null || dragBlockIndex === idx) return;
                        setBlocks((prev) => {
                          const next = [...prev];
                          const [item] = next.splice(dragBlockIndex, 1);
                          next.splice(idx, 0, item);
                          return next;
                        });
                        setDragBlockIndex(null);
                      }}
                      onClick={() => setSelectedBlockId(b.id)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '0.65rem 0.9rem',
                        borderRadius: 12,
                        background: isSel ? '#EFF6FF' : '#FFFFFF',
                        border: isSel ? '1.5px solid #1E40FF' : '1px solid #E2E8F0',
                        cursor: 'grab',
                      }}
                    >
                      <div>
                        <Badge tone="primary">{b.type}</Badge>{' '}
                        <span style={{ fontSize: '0.83rem', fontWeight: 700, color: '#0F172A', marginLeft: 6 }}>
                          {b.title || b.buttonLabel || b.voucherCode || b.content?.slice(0, 42) || `Khối #${idx + 1}`}
                        </span>
                      </div>
                      <div style={{ display: 'flex', gap: 4 }}>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            moveBlock(idx, -1);
                          }}
                          className="btn secondary sm"
                          style={{ height: 32, padding: '0 8px' }}
                        >
                          <ArrowUp size={13} />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            moveBlock(idx, 1);
                          }}
                          className="btn secondary sm"
                          style={{ height: 32, padding: '0 8px' }}
                        >
                          <ArrowDown size={13} />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            duplicateBlock(b, idx);
                          }}
                          className="btn secondary sm"
                          style={{ height: 32, padding: '0 8px' }}
                        >
                          <Copy size={13} />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeBlock(b.id);
                          }}
                          className="btn secondary sm"
                          style={{ height: 32, padding: '0 8px', color: '#DC2626' }}
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>

            <Card
              title="Bản Xem Trước Trực Tiếp (Live Responsive HTML Preview)"
              actions={
                <div style={{ display: 'flex', gap: 6 }}>
                  <button
                    type="button"
                    onClick={() => setViewport('desktop')}
                    className="btn secondary sm"
                    style={{
                      height: 36,
                      color: viewport === 'desktop' ? '#1E40FF' : '#475569',
                      borderColor: viewport === 'desktop' ? '#1E40FF' : '#E2E8F0',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 5,
                    }}
                  >
                    <Monitor size={14} /> Desktop (600px)
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewport('mobile')}
                    className="btn secondary sm"
                    style={{
                      height: 36,
                      color: viewport === 'mobile' ? '#1E40FF' : '#475569',
                      borderColor: viewport === 'mobile' ? '#1E40FF' : '#E2E8F0',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 5,
                    }}
                  >
                    <Smartphone size={14} /> Mobile (375px)
                  </button>
                </div>
              }
            >
              <div style={{ background: '#F8F9FA', padding: '1rem', borderRadius: 16, border: '1px solid #E2E8F0', display: 'flex', justifyContent: 'center' }}>
                <iframe
                  title="Email Live Preview"
                  sandbox="allow-same-origin"
                  srcDoc={previewHtml}
                  style={{
                    width: viewport === 'mobile' ? 375 : '100%',
                    maxWidth: viewport === 'mobile' ? 375 : 640,
                    height: 520,
                    border: '1px solid #E2E8F0',
                    borderRadius: 16,
                    background: '#FFFFFF',
                  }}
                />
              </div>
            </Card>
          </div>

          {/* Right Panel: Selected Block Properties + Spam Score Analyzer */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <Card
              title="Thuộc Tính Khối Đang Chọn"
              subtitle={selectedBlock ? `Loại khối: ${selectedBlock.type}` : 'Hãy nhấn vào 1 khối ở giữa'}
            >
              {selectedBlock ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {selectedBlock.type !== 'divider' && selectedBlock.type !== 'social_links' && (
                    <div>
                      <label className="form-label" style={{ fontSize: '0.76rem', fontWeight: 700 }}>Tiêu đề khối</label>
                      <input
                        className="form-input"
                        style={{ height: 44, background: '#FFFFFF', border: '1px solid #E2E8F0' }}
                        value={selectedBlock.title || ''}
                        onChange={(e) => updateSelectedBlock({ title: e.target.value })}
                      />
                    </div>
                  )}
                  {['text', 'hero_banner', 'product_card', 'voucher_box', 'testimonial', 'video_thumbnail', 'pricing_card', 'custom_html'].includes(selectedBlock.type) && (
                    <div>
                      <label className="form-label" style={{ fontSize: '0.76rem', fontWeight: 700 }}>Nội dung / Mô tả</label>
                      <textarea
                        className="form-input"
                        rows={4}
                        style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', padding: '0.65rem' }}
                        value={selectedBlock.content || ''}
                        onChange={(e) => updateSelectedBlock({ content: e.target.value })}
                      />
                    </div>
                  )}
                  {['button', 'hero_banner', 'product_card', 'pricing_card'].includes(selectedBlock.type) && (
                    <div>
                      <label className="form-label" style={{ fontSize: '0.76rem', fontWeight: 700 }}>Nhãn Nút bấm (CTA)</label>
                      <input
                        className="form-input"
                        style={{ height: 44, background: '#FFFFFF', border: '1px solid #E2E8F0' }}
                        value={selectedBlock.buttonLabel || ''}
                        onChange={(e) => updateSelectedBlock({ buttonLabel: e.target.value })}
                      />
                    </div>
                  )}
                  {['button', 'hero_banner', 'image', 'product_card', 'video_thumbnail', 'pricing_card'].includes(selectedBlock.type) && (
                    <div>
                      <label className="form-label" style={{ fontSize: '0.76rem', fontWeight: 700 }}>Đường dẫn đích (URL)</label>
                      <input
                        className="form-input"
                        style={{ height: 44, background: '#FFFFFF', border: '1px solid #E2E8F0' }}
                        value={selectedBlock.url || ''}
                        onChange={(e) => updateSelectedBlock({ url: e.target.value })}
                      />
                    </div>
                  )}
                  {['image', 'product_card'].includes(selectedBlock.type) && (
                    <div>
                      <label className="form-label" style={{ fontSize: '0.76rem', fontWeight: 700 }}>Link Ảnh (Image URL)</label>
                      <input
                        className="form-input"
                        style={{ height: 44, background: '#FFFFFF', border: '1px solid #E2E8F0' }}
                        value={selectedBlock.imageUrl || ''}
                        onChange={(e) => updateSelectedBlock({ imageUrl: e.target.value })}
                      />
                    </div>
                  )}
                  {selectedBlock.type === 'voucher_box' && (
                    <div>
                      <label className="form-label" style={{ fontSize: '0.76rem', fontWeight: 700 }}>Mã Voucher / Biến động</label>
                      <input
                        className="form-input"
                        style={{ height: 44, background: '#FFFFFF', border: '1px solid #E2E8F0' }}
                        value={selectedBlock.voucherCode || ''}
                        onChange={(e) => updateSelectedBlock({ voucherCode: e.target.value })}
                      />
                    </div>
                  )}
                  {['product_card', 'pricing_card'].includes(selectedBlock.type) && (
                    <div>
                      <label className="form-label" style={{ fontSize: '0.76rem', fontWeight: 700 }}>Giá hiển thị</label>
                      <input
                        className="form-input"
                        style={{ height: 44, background: '#FFFFFF', border: '1px solid #E2E8F0' }}
                        value={selectedBlock.priceText || ''}
                        onChange={(e) => updateSelectedBlock({ priceText: e.target.value })}
                      />
                    </div>
                  )}
                  {selectedBlock.type === 'countdown_timer' && (
                    <div>
                      <label className="form-label" style={{ fontSize: '0.76rem', fontWeight: 700 }}>Thời điểm kết thúc (ISO)</label>
                      <input
                        className="form-input"
                        style={{ height: 44, background: '#FFFFFF', border: '1px solid #E2E8F0' }}
                        value={selectedBlock.countdownIso || ''}
                        onChange={(e) => updateSelectedBlock({ countdownIso: e.target.value })}
                      />
                    </div>
                  )}
                </div>
              ) : (
                <div style={{ fontSize: '0.82rem', color: '#64748B' }}>
                  Chọn một khối trên Canvas để chỉnh sửa nội dung, nút bấm, màu sắc và liên kết.
                </div>
              )}
            </Card>

            <Card
              title="Kiểm Định Điểm Chống Spam"
              actions={
                <Badge tone={spamReport.score <= 20 ? 'success' : spamReport.score <= 45 ? 'info' : 'warning'}>
                  Hạng {spamReport.deliverabilityGrade} • {spamReport.score}/100
                </Badge>
              }
            >
              {spamReport.issues.length === 0 ? (
                <div style={{ fontSize: '0.8rem', color: '#059669', fontWeight: 600 }}>
                  Tuyệt vời! Bố cục sạch, có link hủy đăng ký chuẩn CAN-SPAM và không chứa từ khóa Spam.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {spamReport.issues.map((iss, i) => (
                    <div
                      key={i}
                      style={{
                        padding: '0.55rem 0.7rem',
                        borderRadius: 10,
                        background: iss.severity === 'high' ? '#FEF2F2' : '#FFFBEB',
                        border: `1px solid ${iss.severity === 'high' ? '#FECACA' : '#FDE68A'}`,
                        fontSize: '0.76rem',
                        color: '#0F172A',
                      }}
                    >
                      {iss.message}
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>
        </div>
      )}

      {/* DOM Agent Email Studio Modal */}
      <CustomModal
        isOpen={studioOpen}
        onClose={() => setStudioOpen(false)}
        title="DOM Agent Email Studio — Trợ lý Sinh Mẫu Email Đa Ngành"
        width={560}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, padding: '0.5rem 0' }}>
          <div>
            <label className="form-label" style={{ fontWeight: 700 }}>Mục tiêu chiến dịch Email của bạn</label>
            <textarea
              className="form-input"
              rows={3}
              style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', padding: '0.65rem' }}
              value={studioGoal}
              onChange={(e) => setStudioGoal(e.target.value)}
              placeholder="Ví dụ: Gửi lời cảm ơn điền Form, tặng Voucher giảm 20% và mời đặt lịch tư vấn..."
            />
          </div>
          <div>
            <label className="form-label" style={{ fontWeight: 700 }}>Giọng văn thương hiệu</label>
            <select
              className="form-input"
              style={{ height: 44, background: '#FFFFFF', border: '1px solid #E2E8F0' }}
              value={studioTone}
              onChange={(e) => setStudioTone(e.target.value as 'professional' | 'friendly' | 'urgent')}
            >
              <option value="professional">Chuyên nghiệp & Uy tín B2B</option>
              <option value="friendly">Thân thiện & Gần gũi</option>
              <option value="urgent">Thúc đẩy Chuyển đổi Khẩn cấp (Kèm đếm ngược)</option>
            </select>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <button type="button" onClick={() => setStudioOpen(false)} className="btn secondary" style={{ height: 44 }}>
              Đóng
            </button>
            <button
              type="button"
              disabled={studioGenerating}
              onClick={() => void handleRunDomStudio()}
              style={{
                height: 44,
                padding: '0 1.25rem',
                borderRadius: 12,
                border: 'none',
                background: '#1E40FF',
                color: '#FFFFFF',
                fontWeight: 700,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                cursor: 'pointer',
              }}
            >
              <Sparkles size={15} /> {studioGenerating ? 'DOM Agent đang thiết kế...' : 'Sinh Bố Cục 15 Khối Ngay'}
            </button>
          </div>
        </div>
      </CustomModal>

      {/* Create Group Modal */}
      <CustomModal
        isOpen={newGroupModalOpen}
        onClose={() => setNewGroupModalOpen(false)}
        title="Tạo Nhóm Thư Mục Mẫu Email"
        width={440}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <input
            className="form-input"
            style={{ height: 44, background: '#FFFFFF', border: '1px solid #E2E8F0' }}
            placeholder="Ví dụ: Kịch bản Chào mừng, Chăm sóc VIP..."
            value={newGroupName}
            onChange={(e) => setNewGroupName(e.target.value)}
          />
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <button type="button" onClick={() => setNewGroupModalOpen(false)} className="btn secondary" style={{ height: 44 }}>
              Hủy
            </button>
            <button
              type="button"
              onClick={() => void handleCreateGroup()}
              style={{
                height: 44,
                padding: '0 1.2rem',
                borderRadius: 12,
                border: 'none',
                background: '#1E40FF',
                color: '#FFFFFF',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Tạo nhóm
            </button>
          </div>
        </div>
      </CustomModal>

      {/* Test Send Modal */}
      <CustomModal
        isOpen={testModalOpen}
        onClose={() => setTestModalOpen(false)}
        title="Gửi Thử & Kiểm Tra Biến Trộn Qua Vault"
        width={460}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ fontSize: '0.82rem', color: '#475569' }}>
            Hệ thống sẽ kết xuất biến trộn <code>{'{{lead.name}}'}</code>, <code>{'{{tenant.name}}'}</code> và kiểm tra cấu hình kênh gửi Vault của doanh nghiệp.
          </div>
          <input
            type="email"
            className="form-input"
            style={{ height: 44, background: '#FFFFFF', border: '1px solid #E2E8F0' }}
            placeholder="Nhập địa chỉ Email nhận bản thử..."
            value={testEmail}
            onChange={(e) => setTestEmail(e.target.value)}
          />
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <button type="button" onClick={() => setTestModalOpen(false)} className="btn secondary" style={{ height: 44 }}>
              Đóng
            </button>
            <button
              type="button"
              onClick={() => void handleSendTest()}
              style={{
                height: 44,
                padding: '0 1.2rem',
                borderRadius: 12,
                border: 'none',
                background: '#1E40FF',
                color: '#FFFFFF',
                fontWeight: 700,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                cursor: 'pointer',
              }}
            >
              <Eye size={15} /> Gửi bản xem thử
            </button>
          </div>
        </div>
      </CustomModal>
    </div>
  );
};

export default MarketingTemplatesPage;
