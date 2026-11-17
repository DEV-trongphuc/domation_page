import React, { useCallback, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { CustomModal } from '../../components/ui/CustomModal';
import { StudioBuilderSkeleton } from '../../components/ui/Skeleton';
import { apiRequest, getErrorMessage } from '../../../autodataApi';
import { useAuth } from '../../contexts/AuthContext';
import { useEntitlement } from '../../contexts/EntitlementContext';
import { AIEmailGeneratorModal } from './AIEmailGeneratorModal';
import { cloneBlockWithNewId, DEFAULT_EMAIL_BODY_STYLE, loadSavedReusableBlocks, persistSavedReusableBlocks } from './editorUtils';
import { EmailStudioWorkspace } from './EmailStudioWorkspace';
import { EmailValidationPanel } from './EmailValidationPanel';
import { compileBlocksToEmailHtml, createDefaultEmailBlock, evaluateLocalSpamScore, previewRenderMergeTags } from './htmlCompiler';
import { ImageLibraryModal } from './ImageLibraryModal';
import { QuickSendEmailModal } from './QuickSendEmailModal';
import { TemplateAccessModal } from './TemplateAccessModal';
import { TemplateLibraryView } from './TemplateLibraryView';
import { TemplatesTopBar } from './TemplatesTopBar';
import type { EmailBlockItem, EmailBodyStyle, EmailTemplateDto, MediaAssetItem, MergeTagDefinition, SavedReusableBlock, SenderVaultStatus, TemplateGroupDto, TemplatesListResponse } from './templateTypes';

export const MarketingTemplatesPage: React.FC = () => {
  const { token, tenantSlug, companyName } = useAuth();
  const { terminology, can } = useEntitlement();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [templates, setTemplates] = useState<EmailTemplateDto[]>([]);
  const [groups, setGroups] = useState<TemplateGroupDto[]>([]);
  const [mergeTags, setMergeTags] = useState<MergeTagDefinition[]>([]);
  const [senderVault, setSenderVault] = useState<SenderVaultStatus | undefined>();
  const [activeGroupId, setActiveGroupId] = useState<string>('all');
  const [mode, setMode] = useState<'library' | 'editor'>('library');

  const [editingId, setEditingId] = useState<string | null>(null);
  const [tplName, setTplName] = useState('Mẫu Email Chào Mừng Khách Mới');
  const [tplSubject, setTplSubject] = useState('Ưu đãi đặc quyền dành cho {{lead.name}}');
  const [tplPreheader, setTplPreheader] = useState('Khám phá giải pháp tối ưu từ {{tenant.name}}');
  const [tplGroupId, setTplGroupId] = useState<string>('');
  const [bodyStyle, setBodyStyle] = useState<EmailBodyStyle>(DEFAULT_EMAIL_BODY_STYLE);
  const [history, setHistory] = useState<EmailBlockItem[][]>([[]]);
  const [historyIndex, setHistoryIndex] = useState<number>(0);
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [savedBlocks, setSavedBlocks] = useState<SavedReusableBlock[]>(() => loadSavedReusableBlocks(tenantSlug));

  const [studioOpen, setStudioOpen] = useState(false);
  const [validationOpen, setValidationOpen] = useState(false);
  const [imageLibOpen, setImageLibOpen] = useState(false);
  const [aclTarget, setAclTarget] = useState<EmailTemplateDto | null>(null);
  const [quickSendOpen, setQuickSendOpen] = useState(false);
  const [newGroupModalOpen, setNewGroupModalOpen] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');

  const blocks = useMemo(() => history[historyIndex] || [], [history, historyIndex]);
  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;

  const commitBlocks = useCallback(
    (nextBlocks: EmailBlockItem[]) => {
      setHistory((prev) => {
        const nextStack = [...prev.slice(0, historyIndex + 1), nextBlocks].slice(-40);
        setHistoryIndex(nextStack.length - 1);
        return nextStack;
      });
    },
    [historyIndex]
  );

  const handleUndo = useCallback(() => setHistoryIndex((idx) => (idx > 0 ? idx - 1 : idx)), []);
  const handleRedo = useCallback(
    () => setHistoryIndex((idx) => (idx < history.length - 1 ? idx + 1 : idx)),
    [history.length]
  );

  useEffect(() => {
    if (mode !== 'editor') return;
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) return;
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z' && !e.shiftKey) {
        e.preventDefault();
        handleUndo();
      } else if ((e.ctrlKey || e.metaKey) && (e.key.toLowerCase() === 'y' || (e.shiftKey && e.key.toLowerCase() === 'z'))) {
        e.preventDefault();
        handleRedo();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [mode, handleUndo, handleRedo]);

  const fetchLibrary = useCallback(
    () => apiRequest<TemplatesListResponse>('/marketing/templates', { token, tenantSlug }),
    [token, tenantSlug]
  );

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
          { key: '{{lead.voucher_code}}', label: 'Mã ưu đãi', sample: 'DOM-VIP20' },
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
        // Empty fallback rendered cleanly
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [fetchLibrary]);

  const resetHistoryWith = (initialBlocks: EmailBlockItem[]) => {
    setHistory([initialBlocks]);
    setHistoryIndex(0);
    setSelectedBlockId(initialBlocks[0]?.id || null);
  };

  const openNewEditor = () => {
    const initial = [
      createDefaultEmailBlock('hero_banner', crypto.randomUUID()),
      createDefaultEmailBlock('text', crypto.randomUUID()),
      createDefaultEmailBlock('voucher_box', crypto.randomUUID()),
      createDefaultEmailBlock('countdown_timer', crypto.randomUUID()),
    ];
    setEditingId(null);
    setTplName(`Mẫu Email Chăm Sóc ${terminology.customerLabel}`);
    setTplSubject(`[{{tenant.name}}] Giải pháp tối ưu dành cho {{lead.name}}`);
    setTplPreheader('Quyền lợi cá nhân hóa dành riêng cho bạn.');
    setTplGroupId('');
    setBodyStyle(DEFAULT_EMAIL_BODY_STYLE);
    resetHistoryWith(initial);
    setMode('editor');
  };

  const openEditTemplate = (tpl: EmailTemplateDto) => {
    const loaded = tpl.blocks && tpl.blocks.length > 0 ? tpl.blocks : [createDefaultEmailBlock('text', crypto.randomUUID())];
    setEditingId(tpl.id);
    setTplName(tpl.name);
    setTplSubject(tpl.subject);
    setTplPreheader(tpl.preheader || '');
    setTplGroupId(tpl.group_id || '');
    setBodyStyle({ ...DEFAULT_EMAIL_BODY_STYLE, ...tpl.body_style });
    resetHistoryWith(loaded);
    setMode('editor');
  };

  const compiledHtml = useMemo(() => compileBlocksToEmailHtml(blocks, bodyStyle, tplSubject || tplName), [blocks, bodyStyle, tplSubject, tplName]);
  const previewHtml = useMemo(() => previewRenderMergeTags(compiledHtml, mergeTags), [compiledHtml, mergeTags]);
  const spamReport = useMemo(() => evaluateLocalSpamScore(tplSubject, blocks, compiledHtml), [tplSubject, blocks, compiledHtml]);
  const selectedBlock = useMemo(() => blocks.find((b) => b.id === selectedBlockId) || null, [blocks, selectedBlockId]);

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
        body_style: bodyStyle,
        compiled_html: compiledHtml,
      };
      if (editingId) {
        await apiRequest(`/marketing/templates/${editingId}`, { method: 'PUT', token, tenantSlug, body: payload });
        toast.success('Đã lưu cập nhật mẫu Email thành công!');
      } else {
        const created = await apiRequest<EmailTemplateDto>('/marketing/templates', { method: 'POST', token, tenantSlug, body: payload });
        setEditingId(created.id);
        toast.success('Đã tạo mẫu Email mới trong thư viện doanh nghiệp!');
      }
      await reloadLibrary();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Không thể lưu mẫu Email.'));
    } finally {
      setSaving(false);
    }
  };

  const handleSaveReusableBlock = (block: EmailBlockItem) => {
    const entry: SavedReusableBlock = {
      id: crypto.randomUUID(),
      name: block.title || block.buttonLabel || `Khối ${block.type}`,
      createdAt: new Date().toISOString(),
      block: cloneBlockWithNewId(block, crypto.randomUUID()),
    };
    const next = [entry, ...savedBlocks];
    setSavedBlocks(next);
    persistSavedReusableBlocks(next, tenantSlug);
    toast.success(`Đã lưu "${entry.name}" vào Thư viện Khối tái sử dụng!`);
  };

  const handleInsertAsset = (asset: MediaAssetItem) => {
    if (selectedBlock && (selectedBlock.type === 'image' || selectedBlock.type === 'product_card')) {
      commitBlocks(blocks.map((b) => (b.id === selectedBlock.id ? { ...b, imageUrl: asset.url, altText: asset.alt_text || asset.name } : b)));
      toast.success('Đã gán ảnh vào khối đang chọn!');
    } else {
      const imgBlock: EmailBlockItem = { ...createDefaultEmailBlock('image', crypto.randomUUID()), imageUrl: asset.url, altText: asset.alt_text || asset.name, title: asset.name };
      commitBlocks([...blocks, imgBlock]);
      setSelectedBlockId(imgBlock.id);
      toast.success('Đã thêm khối Hình ảnh mới từ Thư viện Media!');
    }
  };

  if (loading) return <StudioBuilderSkeleton />;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', background: '#F8F9FA' }}>
      <TemplatesTopBar
        mode={mode}
        saving={saving}
        canCreate={can('email_templates', 'create')}
        senderVault={senderVault}
        onOpenImageLibrary={() => setImageLibOpen(true)}
        onOpenStudio={() => setStudioOpen(true)}
        onOpenNewEditor={openNewEditor}
        onBackToLibrary={() => setMode('library')}
        onOpenValidation={() => setValidationOpen(true)}
        onOpenQuickSend={() => setQuickSendOpen(true)}
        onSaveTemplate={() => void handleSaveTemplate()}
      />

      {mode === 'library' ? (
        <TemplateLibraryView
          templates={templates}
          groups={groups}
          activeGroupId={activeGroupId}
          canCreate={can('email_templates', 'create')}
          canDelete={can('email_templates', 'delete')}
          onChangeGroup={setActiveGroupId}
          onOpenNewGroupModal={() => setNewGroupModalOpen(true)}
          onReload={() => void reloadLibrary()}
          onOpenStudio={() => setStudioOpen(true)}
          onOpenNewEditor={openNewEditor}
          onEditTemplate={openEditTemplate}
          onDuplicateTemplate={async (tpl) => {
            try {
              const clonedBlocks = (tpl.blocks || []).map((b) => cloneBlockWithNewId(b, crypto.randomUUID()));
              await apiRequest('/marketing/templates', { method: 'POST', token, tenantSlug, body: { name: `${tpl.name} (Bản sao)`, subject: tpl.subject, preheader: tpl.preheader, group_id: tpl.group_id, blocks: clonedBlocks, body_style: tpl.body_style } });
              toast.success('Đã nhân bản mẫu Email!');
              await reloadLibrary();
            } catch (err) {
              toast.error(getErrorMessage(err, 'Không thể nhân bản mẫu Email.'));
            }
          }}
          onDeleteTemplate={async (id) => {
            try {
              await apiRequest(`/marketing/templates/${id}`, { method: 'DELETE', token, tenantSlug });
              toast.success('Đã xóa mẫu Email.');
              await reloadLibrary();
            } catch (err) {
              toast.error(getErrorMessage(err, 'Không thể xóa mẫu Email.'));
            }
          }}
          onOpenAcl={setAclTarget}
          onOpenQuickSend={(tpl) => { openEditTemplate(tpl); setQuickSendOpen(true); }}
        />
      ) : (
        <EmailStudioWorkspace
          tenantSlug={tenantSlug}
          tplName={tplName}
          tplSubject={tplSubject}
          tplPreheader={tplPreheader}
          tplGroupId={tplGroupId}
          groups={groups}
          blocks={blocks}
          selectedBlockId={selectedBlockId}
          selectedBlock={selectedBlock}
          bodyStyle={bodyStyle}
          compiledHtml={compiledHtml}
          previewHtml={previewHtml}
          mergeTags={mergeTags}
          savedBlocks={savedBlocks}
          canUndo={canUndo}
          canRedo={canRedo}
          spamScore={spamReport.score}
          onChangeMeta={(patch) => {
            if (patch.name !== undefined) setTplName(patch.name);
            if (patch.subject !== undefined) setTplSubject(patch.subject);
            if (patch.preheader !== undefined) setTplPreheader(patch.preheader);
            if (patch.groupId !== undefined) setTplGroupId(patch.groupId);
          }}
          onSelectBlock={setSelectedBlockId}
          onCommitBlocks={commitBlocks}
          onUpdateBodyStyle={(patch) => setBodyStyle((prev) => ({ ...prev, ...patch }))}
          onChangeSavedBlocks={setSavedBlocks}
          onSaveReusableBlock={handleSaveReusableBlock}
          onUndo={handleUndo}
          onRedo={handleRedo}
          onOpenValidation={() => setValidationOpen(true)}
          onOpenImageLibrary={() => setImageLibOpen(true)}
        />
      )}

      <AIEmailGeneratorModal
        isOpen={studioOpen}
        onClose={() => setStudioOpen(false)}
        token={token}
        tenantSlug={tenantSlug}
        onApplyGenerated={({ subject, preheader, blocks: genBlocks }) => {
          setTplSubject(subject);
          setTplPreheader(preheader);
          commitBlocks(genBlocks);
          setSelectedBlockId(genBlocks[0]?.id || null);
          setMode('editor');
        }}
      />

      <EmailValidationPanel
        isOpen={validationOpen}
        onClose={() => setValidationOpen(false)}
        token={token}
        tenantSlug={tenantSlug}
        subject={tplSubject}
        preheader={tplPreheader}
        blocks={blocks}
        bodyStyle={bodyStyle}
        compiledHtml={compiledHtml}
        senderVault={senderVault}
        onFocusBlock={setSelectedBlockId}
        onAutoInsertUnsubscribe={() => {
          commitBlocks([...blocks, { id: crypto.randomUUID(), type: 'text', align: 'center', content: 'Nếu không muốn tiếp tục nhận tin, vui lòng <a href="{{unsubscribe_url}}">Hủy đăng ký tại đây</a>.' }]);
          toast.success('Đã tự động chèn khối Unsubscribe chuẩn CAN-SPAM!');
        }}
      />

      <ImageLibraryModal isOpen={imageLibOpen} onClose={() => setImageLibOpen(false)} token={token} tenantSlug={tenantSlug} onSelectAsset={handleInsertAsset} />
      <TemplateAccessModal isOpen={Boolean(aclTarget)} onClose={() => setAclTarget(null)} template={aclTarget} token={token} tenantSlug={tenantSlug} onSaved={() => void reloadLibrary()} />
      <QuickSendEmailModal isOpen={quickSendOpen} onClose={() => setQuickSendOpen(false)} token={token} tenantSlug={tenantSlug} templateId={editingId} templateName={tplName} defaultSubject={tplSubject} blocks={blocks} mergeTags={mergeTags} />

      <CustomModal isOpen={newGroupModalOpen} onClose={() => setNewGroupModalOpen(false)} title="Tạo Nhóm Thư Mục Mẫu Email" width={430}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <input placeholder="Ví dụ: Chăm sóc Khách VIP, Kịch bản Onboarding..." value={newGroupName} onChange={(e) => setNewGroupName(e.target.value)} style={{ height: 44, padding: '0 12px', borderRadius: 10, border: '1px solid #E2E8F0', background: '#FFFFFF' }} />
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <button type="button" onClick={() => setNewGroupModalOpen(false)} className="btn secondary" style={{ height: 44 }}>Hủy</button>
            <button
              type="button"
              onClick={async () => {
                if (!newGroupName.trim()) return;
                try {
                  await apiRequest('/marketing/templates/groups', { method: 'POST', token, tenantSlug, body: { name: newGroupName.trim(), color_hex: '#1E40FF' } });
                  setNewGroupName('');
                  setNewGroupModalOpen(false);
                  toast.success('Đã tạo thư mục nhóm mới!');
                  await reloadLibrary();
                } catch (err) {
                  toast.error(getErrorMessage(err, 'Không thể tạo nhóm thư mục.'));
                }
              }}
              style={{ height: 44, padding: '0 18px', borderRadius: 12, border: 'none', background: '#1E40FF', color: '#FFFFFF', fontWeight: 700, cursor: 'pointer' }}
            >
              Tạo nhóm
            </button>
          </div>
        </div>
      </CustomModal>
    </div>
  );
};

export default MarketingTemplatesPage;
