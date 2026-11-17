import React from 'react';
import toast from 'react-hot-toast';
import {
  cloneBlockWithNewId,
  persistSavedReusableBlocks,
  type StarterPresetDefinition,
} from './editorUtils';
import { EmailCanvas } from './EmailCanvas';
import { EmailProperties } from './EmailProperties';
import { EmailToolbox } from './EmailToolbox';
import { createDefaultEmailBlock } from './htmlCompiler';
import type {
  EmailBlockItem,
  EmailBlockType15,
  EmailBodyStyle,
  MergeTagDefinition,
  SavedReusableBlock,
  TemplateGroupDto,
} from './templateTypes';

export interface EmailStudioWorkspaceProps {
  tenantSlug?: string | null;
  tplName: string;
  tplSubject: string;
  tplPreheader: string;
  tplGroupId: string;
  groups: TemplateGroupDto[];
  blocks: EmailBlockItem[];
  selectedBlockId: string | null;
  selectedBlock: EmailBlockItem | null;
  bodyStyle: EmailBodyStyle;
  compiledHtml: string;
  previewHtml: string;
  mergeTags: MergeTagDefinition[];
  savedBlocks: SavedReusableBlock[];
  canUndo: boolean;
  canRedo: boolean;
  spamScore: number;
  onChangeMeta: (patch: { name?: string; subject?: string; preheader?: string; groupId?: string }) => void;
  onSelectBlock: (id: string | null) => void;
  onCommitBlocks: (nextBlocks: EmailBlockItem[]) => void;
  onUpdateBodyStyle: (patch: Partial<EmailBodyStyle>) => void;
  onChangeSavedBlocks: (next: SavedReusableBlock[]) => void;
  onSaveReusableBlock: (block: EmailBlockItem) => void;
  onUndo: () => void;
  onRedo: () => void;
  onOpenValidation: () => void;
  onOpenImageLibrary: () => void;
}

export const EmailStudioWorkspace: React.FC<EmailStudioWorkspaceProps> = ({
  tenantSlug,
  tplName,
  tplSubject,
  tplPreheader,
  tplGroupId,
  groups,
  blocks,
  selectedBlockId,
  selectedBlock,
  bodyStyle,
  compiledHtml,
  previewHtml,
  mergeTags,
  savedBlocks,
  canUndo,
  canRedo,
  spamScore,
  onChangeMeta,
  onSelectBlock,
  onCommitBlocks,
  onUpdateBodyStyle,
  onChangeSavedBlocks,
  onSaveReusableBlock,
  onUndo,
  onRedo,
  onOpenValidation,
  onOpenImageLibrary,
}) => {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '295px minmax(0, 1fr) 340px', gap: '1rem', alignItems: 'start' }}>
      <EmailToolbox
        blocks={blocks}
        selectedBlockId={selectedBlockId}
        savedBlocks={savedBlocks}
        mergeTags={mergeTags}
        onAddBlock={(type: EmailBlockType15) => {
          const next = createDefaultEmailBlock(type, crypto.randomUUID());
          onCommitBlocks([...blocks, next]);
          onSelectBlock(next.id);
        }}
        onSelectBlock={onSelectBlock}
        onInsertSavedBlock={(saved) => {
          const cloned = cloneBlockWithNewId(saved.block, crypto.randomUUID());
          onCommitBlocks([...blocks, cloned]);
          onSelectBlock(cloned.id);
        }}
        onDeleteSavedBlock={(savedId) => {
          const next = savedBlocks.filter((s) => s.id !== savedId);
          onChangeSavedBlocks(next);
          persistSavedReusableBlocks(next, tenantSlug);
        }}
        onApplyPreset={(preset: StarterPresetDefinition) => {
          const built = preset.buildBlocks(() => crypto.randomUUID());
          onChangeMeta({ subject: preset.subject, preheader: preset.preheader });
          onCommitBlocks(built);
          onSelectBlock(built[0]?.id || null);
        }}
        onInsertMergeTag={(tagKey) => {
          if (selectedBlock) {
            onCommitBlocks(
              blocks.map((b) =>
                b.id === selectedBlock.id
                  ? { ...b, content: `${b.content || ''} ${tagKey}`.trim() }
                  : b
              )
            );
          } else {
            onChangeMeta({ subject: `${tplSubject} ${tagKey}`.trim() });
          }
          toast.success(`Đã chèn biến trộn ${tagKey}!`);
        }}
      />

      <EmailCanvas
        tplName={tplName}
        tplSubject={tplSubject}
        tplPreheader={tplPreheader}
        tplGroupId={tplGroupId}
        groups={groups}
        blocks={blocks}
        selectedBlockId={selectedBlockId}
        bodyStyle={bodyStyle}
        compiledHtml={compiledHtml}
        previewHtml={previewHtml}
        mergeTags={mergeTags}
        savedBlocks={savedBlocks}
        canUndo={canUndo}
        canRedo={canRedo}
        spamScore={spamScore}
        onChangeMeta={onChangeMeta}
        onSelectBlock={onSelectBlock}
        onReplaceBlocks={onCommitBlocks}
        onUpdateBlock={(id, patch) =>
          onCommitBlocks(blocks.map((b) => (b.id === id ? { ...b, ...patch } : b)))
        }
        onInsertBlockAt={(type, idx) => {
          const created = createDefaultEmailBlock(type, crypto.randomUUID());
          const copy = [...blocks];
          copy.splice(idx, 0, created);
          onCommitBlocks(copy);
          onSelectBlock(created.id);
        }}
        onInsertSavedAt={(saved, idx) => {
          const cloned = cloneBlockWithNewId(saved.block, crypto.randomUUID());
          const copy = [...blocks];
          copy.splice(idx, 0, cloned);
          onCommitBlocks(copy);
          onSelectBlock(cloned.id);
        }}
        onDuplicateBlock={(block, idx) => {
          const cloned = cloneBlockWithNewId(block, crypto.randomUUID());
          const copy = [...blocks];
          copy.splice(idx + 1, 0, cloned);
          onCommitBlocks(copy);
          onSelectBlock(cloned.id);
        }}
        onSaveReusableBlock={onSaveReusableBlock}
        onDeleteBlock={(id) => {
          onCommitBlocks(blocks.filter((b) => b.id !== id));
          if (selectedBlockId === id) onSelectBlock(null);
        }}
        onUndo={onUndo}
        onRedo={onRedo}
        onOpenValidation={onOpenValidation}
        onOpenImageLibrary={onOpenImageLibrary}
      />

      <EmailProperties
        selectedBlock={selectedBlock}
        bodyStyle={bodyStyle}
        onUpdateBlock={(patch) => {
          if (!selectedBlockId) return;
          onCommitBlocks(blocks.map((b) => (b.id === selectedBlockId ? { ...b, ...patch } : b)));
        }}
        onUpdateBodyStyle={onUpdateBodyStyle}
        onDuplicateBlock={() => {
          if (!selectedBlock) return;
          const idx = blocks.findIndex((b) => b.id === selectedBlock.id);
          const cloned = cloneBlockWithNewId(selectedBlock, crypto.randomUUID());
          const copy = [...blocks];
          copy.splice(idx + 1, 0, cloned);
          onCommitBlocks(copy);
          onSelectBlock(cloned.id);
        }}
        onSaveReusableBlock={() => {
          if (selectedBlock) onSaveReusableBlock(selectedBlock);
        }}
        onDeleteBlock={() => {
          if (!selectedBlockId) return;
          onCommitBlocks(blocks.filter((b) => b.id !== selectedBlockId));
          onSelectBlock(null);
        }}
        onDeselectBlock={() => onSelectBlock(null)}
        onOpenImageLibrary={onOpenImageLibrary}
      />
    </div>
  );
};

export default EmailStudioWorkspace;
