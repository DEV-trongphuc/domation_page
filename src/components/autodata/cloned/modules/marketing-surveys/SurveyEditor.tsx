import React, { useEffect, useState } from 'react';
import { arrayMove } from '@dnd-kit/sortable';
import {
  ArrowLeft,
  ExternalLink,
  Monitor,
  Save,
  Share2,
  Smartphone,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { Card } from '../../components/ui/AutoDataLoadingModal';
import { apiRequest, getErrorMessage } from '../../../autodataApi';
import { useAuth } from '../../contexts/AuthContext';
import { SurveyCanvas } from './SurveyCanvas';
import { SurveyProperties } from './SurveyProperties';
import { SurveyPublishModal } from './SurveyPublishModal';
import { SurveyToolbox } from './SurveyToolbox';
import {
  DEFAULT_SURVEY_SETTINGS,
  DEFAULT_SURVEY_THEME,
  createDefaultSurveyBlock,
  normalizeSurveyDto,
  type AudienceRefDto,
  type BlockCatalogEntry,
  type SurveyBlockDto,
  type SurveyBlockType,
  type SurveyItemDto,
  type SurveySettingsDto,
  type SurveyThemeDto,
  type VoucherCampaignRefDto,
} from './surveyTypes';

interface SurveyEditorProps {
  initialSurvey: SurveyItemDto | null;
  initialBlocks?: SurveyBlockDto[];
  initialTitle?: string;
  initialType?: 'survey' | 'quiz' | 'nps';
  catalog: ReadonlyArray<BlockCatalogEntry>;
  audiences: AudienceRefDto[];
  onBack: () => void;
  onSaved: () => Promise<void>;
}

export const SurveyEditor: React.FC<SurveyEditorProps> = ({
  initialSurvey,
  initialBlocks,
  initialTitle,
  initialType,
  catalog,
  audiences,
  onBack,
  onSaved,
}) => {
  const { token, tenantSlug } = useAuth();

  const [savedSurvey, setSavedSurvey] = useState<SurveyItemDto | null>(initialSurvey);
  const [title, setTitle] = useState(() => initialSurvey?.title || initialTitle || 'Khảo sát NPS & Chấm điểm Khách hàng');
  const [description, setDescription] = useState(
    () => initialSurvey?.description || 'Hoàn thành khảo sát trong 90 giây để nhận tư vấn và ưu đãi phù hợp nhất.'
  );
  const [surveyType, setSurveyType] = useState<'survey' | 'quiz' | 'nps'>(
    () => initialSurvey?.survey_type || initialType || 'quiz'
  );
  const [blocks, setBlocks] = useState<SurveyBlockDto[]>(
    () => initialSurvey?.blocks || initialBlocks || [createDefaultSurveyBlock('nps'), createDefaultSurveyBlock('quiz_scored')]
  );
  const [theme, setTheme] = useState<SurveyThemeDto>(() => initialSurvey?.theme || { ...DEFAULT_SURVEY_THEME });
  const [settings, setSettings] = useState<SurveySettingsDto>(
    () => initialSurvey?.settings || { ...DEFAULT_SURVEY_SETTINGS }
  );

  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [viewport, setViewport] = useState<'desktop' | 'mobile'>('desktop');
  const [saving, setSaving] = useState(false);
  const [publishOpen, setPublishOpen] = useState(false);
  const [voucherCampaigns, setVoucherCampaigns] = useState<VoucherCampaignRefDto[]>([]);

  useEffect(() => {
    let cancelled = false;
    apiRequest<{ items?: VoucherCampaignRefDto[]; campaigns?: VoucherCampaignRefDto[] }>('/marketing/vouchers', {
      token,
      tenantSlug,
    })
      .then((res) => {
        if (cancelled || !res) return;
        const list = res.items || res.campaigns || [];
        setVoucherCampaigns(list);
      })
      .catch(() => {
        // Optional voucher campaign list when mkt_vouchers is disabled for current plan
      });
    return () => {
      cancelled = true;
    };
  }, [token, tenantSlug]);

  const addBlock = (type: SurveyBlockType) => {
    const created = createDefaultSurveyBlock(type);
    setBlocks((prev) => [...prev, created]);
    setSelectedBlockId(created.id);
  };

  const updateBlock = (id: string, patch: Partial<SurveyBlockDto>) => {
    setBlocks((prev) => prev.map((b) => (b.id === id ? { ...b, ...patch } : b)));
  };

  const duplicateBlock = (id: string) => {
    setBlocks((prev) => {
      const idx = prev.findIndex((b) => b.id === id);
      if (idx < 0) return prev;
      const src = prev[idx];
      const clone: SurveyBlockDto = {
        ...src,
        id: crypto.randomUUID(),
        label: `${src.label} (Bản sao)`,
        options: src.options?.map((o) => ({ ...o, id: crypto.randomUUID() })),
      };
      const copy = [...prev];
      copy.splice(idx + 1, 0, clone);
      return copy;
    });
  };

  const deleteBlock = (id: string) => {
    setBlocks((prev) => prev.filter((b) => b.id !== id));
    if (selectedBlockId === id) setSelectedBlockId(null);
  };

  const handleSave = async (openPublishAfter = false) => {
    if (!title.trim()) {
      toast.error('Vui lòng nhập tiêu đề Khảo sát / Quiz.');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        title: title.trim(),
        description: description.trim(),
        survey_type: surveyType,
        blocks,
        theme,
        settings,
        redirect_rules: settings.redirect_rules || [],
      };
      let resultRaw: Record<string, unknown>;
      if (savedSurvey?.id) {
        resultRaw = await apiRequest<Record<string, unknown>>(`/marketing/surveys/${savedSurvey.id}`, {
          method: 'PUT',
          token,
          tenantSlug,
          body: payload,
        });
        toast.success('Đã lưu cập nhật Khảo sát / Quiz!');
      } else {
        resultRaw = await apiRequest<Record<string, unknown>>('/marketing/surveys', {
          method: 'POST',
          token,
          tenantSlug,
          body: payload,
        });
        toast.success('Đã khởi tạo & xuất bản Khảo sát / Quiz 25 khối!');
      }
      const normalized = normalizeSurveyDto(resultRaw);
      setSavedSurvey(normalized);
      await onSaved();
      if (openPublishAfter) {
        setPublishOpen(true);
      }
    } catch (err) {
      toast.error(getErrorMessage(err, 'Không thể lưu Khảo sát.'));
    } finally {
      setSaving(false);
    }
  };

  const selectedBlock = blocks.find((b) => b.id === selectedBlockId) || null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {/* Studio Top Bar */}
      <Card padding="0.85rem 1.15rem">
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: '1 1 360px' }}>
            <button type="button" onClick={onBack} className="btn secondary" style={{ height: 42, padding: '0 12px' }}>
              <ArrowLeft size={15} /> Quay lại
            </button>
            <input
              className="form-input"
              style={{ height: 42, fontWeight: 800, fontSize: '0.92rem', background: '#FFFFFF', border: '1px solid #E2E8F0', flex: 1 }}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Tiêu đề bài Khảo sát / Quiz..."
            />
            <select
              className="form-input"
              style={{ height: 42, width: 155, background: '#F8F9FA', border: '1px solid #E2E8F0', fontWeight: 700 }}
              value={surveyType}
              onChange={(e) => setSurveyType(e.target.value as 'survey' | 'quiz' | 'nps')}
            >
              <option value="quiz">Chế độ: Quiz Điểm</option>
              <option value="nps">Chế độ: Đo NPS</option>
              <option value="survey">Chế độ: Survey</option>
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <div style={{ display: 'inline-flex', padding: 3, borderRadius: 10, background: '#F1F5F9', border: '1px solid #E2E8F0' }}>
              <button
                type="button"
                onClick={() => setViewport('desktop')}
                style={{
                  height: 34,
                  padding: '0 10px',
                  borderRadius: 8,
                  border: 'none',
                  background: viewport === 'desktop' ? '#FFFFFF' : 'transparent',
                  color: viewport === 'desktop' ? '#1E40FF' : '#64748B',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                  fontSize: '0.75rem',
                  fontWeight: 700,
                }}
              >
                <Monitor size={14} /> Desktop
              </button>
              <button
                type="button"
                onClick={() => setViewport('mobile')}
                style={{
                  height: 34,
                  padding: '0 10px',
                  borderRadius: 8,
                  border: 'none',
                  background: viewport === 'mobile' ? '#FFFFFF' : 'transparent',
                  color: viewport === 'mobile' ? '#1E40FF' : '#64748B',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                  fontSize: '0.75rem',
                  fontWeight: 700,
                }}
              >
                <Smartphone size={14} /> Mobile
              </button>
            </div>

            {savedSurvey?.slug && (
              <a
                href={`/s/${savedSurvey.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn secondary"
                style={{ height: 42, color: '#1E40FF', display: 'inline-flex', alignItems: 'center', gap: 5, textDecoration: 'none' }}
              >
                <ExternalLink size={14} /> Trang Public
              </a>
            )}

            <button
              type="button"
              onClick={() => (savedSurvey ? setPublishOpen(true) : void handleSave(true))}
              className="btn secondary"
              style={{ height: 42, color: '#1E40FF', display: 'inline-flex', alignItems: 'center', gap: 5 }}
            >
              <Share2 size={14} /> Xuất bản & QR
            </button>

            <button
              type="button"
              disabled={saving}
              onClick={() => void handleSave(false)}
              style={{
                height: 42,
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
              <Save size={15} /> {saving ? 'Đang lưu...' : 'Lưu Khảo Sát'}
            </button>
          </div>
        </div>

        <input
          className="form-input"
          style={{ height: 36, marginTop: 8, fontSize: '0.78rem', background: '#F8F9FA', border: '1px solid #E2E8F0' }}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Mô tả giới thiệu ngắn trên Cover khảo sát..."
        />
      </Card>

      {/* 3-Column Visual Studio */}
      <div style={{ display: 'grid', gridTemplateColumns: '265px minmax(0, 1fr) 335px', gap: '1rem', alignItems: 'start' }}>
        <SurveyToolbox catalog={catalog} onAddBlock={addBlock} />

        <SurveyCanvas
          title={title}
          description={description}
          blocks={blocks}
          theme={theme}
          settings={settings}
          viewport={viewport}
          selectedBlockId={selectedBlockId}
          onSelectBlock={setSelectedBlockId}
          onMoveBlockByIndex={(from, to) => setBlocks((prev) => arrayMove(prev, from, to))}
          onDuplicateBlock={duplicateBlock}
          onDeleteBlock={deleteBlock}
        />

        <SurveyProperties
          selectedBlock={selectedBlock}
          allBlocks={blocks}
          theme={theme}
          settings={settings}
          audiences={audiences}
          voucherCampaigns={voucherCampaigns}
          onUpdateBlock={updateBlock}
          onUpdateTheme={(patch) => setTheme((prev) => ({ ...prev, ...patch }))}
          onUpdateSettings={(patch) => setSettings((prev) => ({ ...prev, ...patch }))}
          onClearSelection={() => setSelectedBlockId(null)}
        />
      </div>

      <SurveyPublishModal
        survey={publishOpen ? savedSurvey : null}
        onClose={() => setPublishOpen(false)}
        onUpdated={async (next) => {
          setSavedSurvey(next);
          await onSaved();
        }}
      />
    </div>
  );
};

export default SurveyEditor;
