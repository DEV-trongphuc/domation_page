import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  BarChart3,
  ClipboardCheck,
  Copy,
  Edit2,
  GitBranch,
  Link2,
  Plus,
  Power,
  QrCode,
  RefreshCw,
  Search,
  Star,
  Trash2,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { Badge, Card, EmptyState, FormCard } from '../../components/ui/AutoDataLoadingModal';
import { ConfirmModal } from '../../components/ui/ConfirmModal';
import { ScreenHelpButton } from '../../components/ui/ScreenHelpButton';
import { StudioBuilderSkeleton } from '../../components/ui/Skeleton';
import { apiRequest, formatShortDate, getErrorMessage } from '../../../autodataApi';
import { useAuth } from '../../contexts/AuthContext';
import { useEntitlement } from '../../contexts/EntitlementContext';
import { SurveyEditor } from './SurveyEditor';
import { SurveyPublishModal } from './SurveyPublishModal';
import { SurveyReportModal } from './SurveyReportModal';
import { createPresetSurveyBlocks } from './surveyLogicHelpers';
import {
  SURVEY_25_BLOCKS,
  normalizeSurveyDto,
  type AudienceRefDto,
  type BlockCatalogEntry,
  type SurveyBlockDto,
  type SurveyItemDto,
  type SurveysOverviewResponse,
} from './surveyTypes';

export const MarketingSurveysPage: React.FC = () => {
  const { token, tenantSlug } = useAuth();
  const { terminology, can } = useEntitlement();
  const canCreate = can('surveys_quiz', 'create');
  const canEdit = can('surveys_quiz', 'edit');
  const canDelete = can('surveys_quiz', 'delete');

  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<'list' | 'editor'>('list');
  const [surveys, setSurveys] = useState<SurveyItemDto[]>([]);
  const [catalog, setCatalog] = useState<BlockCatalogEntry[]>(() => [...SURVEY_25_BLOCKS]);
  const [audiences, setAudiences] = useState<AudienceRefDto[]>([]);
  const [search, setSearch] = useState('');

  const [editingSurvey, setEditingSurvey] = useState<SurveyItemDto | null>(null);
  const [draftBlocks, setDraftBlocks] = useState<SurveyBlockDto[] | undefined>(undefined);
  const [draftTitle, setDraftTitle] = useState<string | undefined>(undefined);
  const [draftType, setDraftType] = useState<'survey' | 'quiz' | 'nps' | undefined>(undefined);

  const [publishSurvey, setPublishSurvey] = useState<SurveyItemDto | null>(null);
  const [reportSurvey, setReportSurvey] = useState<SurveyItemDto | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<SurveyItemDto | null>(null);

  const fetchOverview = useCallback(async () => {
    return apiRequest<SurveysOverviewResponse>('/marketing/surveys', { token, tenantSlug });
  }, [token, tenantSlug]);

  const reload = useCallback(async () => {
    try {
      const res = await fetchOverview();
      setSurveys((res.items || []).map(normalizeSurveyDto));
      if (res.block_catalog && res.block_catalog.length === 25) {
        setCatalog(res.block_catalog);
      }
      setAudiences(res.audiences || []);
    } catch (err) {
      toast.error(getErrorMessage(err, 'Không thể tải danh sách Khảo sát & Quiz.'));
    }
  }, [fetchOverview]);

  useEffect(() => {
    let cancelled = false;
    fetchOverview()
      .then((res) => {
        if (cancelled) return;
        setSurveys((res.items || []).map(normalizeSurveyDto));
        if (res.block_catalog && res.block_catalog.length === 25) {
          setCatalog(res.block_catalog);
        }
        setAudiences(res.audiences || []);
      })
      .catch((err) => {
        if (!cancelled) {
          toast.error(getErrorMessage(err, 'Không thể tải danh sách Khảo sát & Quiz.'));
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [fetchOverview]);

  const startPresetEditor = (preset: 'nps' | 'quiz' | 'branching' | 'csat') => {
    setEditingSurvey(null);
    setDraftBlocks(createPresetSurveyBlocks(preset));
    setDraftTitle(
      preset === 'nps'
        ? `Khảo sát Chỉ số NPS ${terminology.customerLabel}`
        : preset === 'branching'
          ? 'Khảo sát Phân Luồng Rẽ Nhánh Theo Nhu Cầu'
          : preset === 'csat'
            ? 'Đánh giá Trải nghiệm CSAT 5 Sao & Ma trận Likert'
            : `Trắc nghiệm Chấm điểm Nhu cầu ${terminology.customerLabel}`
    );
    setDraftType(preset === 'nps' ? 'nps' : preset === 'csat' ? 'survey' : 'quiz');
    setMode('editor');
  };

  const openExistingEditor = (srv: SurveyItemDto) => {
    setEditingSurvey(srv);
    setDraftBlocks(undefined);
    setDraftTitle(undefined);
    setDraftType(undefined);
    setMode('editor');
  };

  const handleToggleStatus = async (srv: SurveyItemDto) => {
    const nextStatus = srv.status === 'active' ? 'paused' : 'active';
    try {
      await apiRequest(`/marketing/surveys/${srv.id}`, {
        method: 'PUT',
        token,
        tenantSlug,
        body: { status: nextStatus },
      });
      toast.success(nextStatus === 'active' ? 'Đã mở công khai Khảo sát!' : 'Đã tạm dừng Khảo sát!');
      await reload();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Không thể thay đổi trạng thái Khảo sát.'));
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    try {
      await apiRequest(`/marketing/surveys/${deleteTarget.id}`, {
        method: 'DELETE',
        token,
        tenantSlug,
      });
      toast.success('Đã xóa bài Khảo sát.');
      setDeleteTarget(null);
      await reload();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Không thể xóa bài Khảo sát.'));
    }
  };

  const filteredSurveys = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return surveys;
    return surveys.filter(
      (s) => s.title.toLowerCase().includes(q) || s.slug.toLowerCase().includes(q)
    );
  }, [surveys, search]);

  if (loading) {
    return <StudioBuilderSkeleton />;
  }

  if (mode === 'editor') {
    return (
      <SurveyEditor
        key={editingSurvey?.id || `draft_${draftTitle || 'new'}`}
        initialSurvey={editingSurvey}
        initialBlocks={draftBlocks}
        initialTitle={draftTitle}
        initialType={draftType}
        catalog={catalog}
        audiences={audiences}
        onBack={() => setMode('list')}
        onSaved={reload}
      />
    );
  }

  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://domation.vn';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', background: '#F8F9FA' }}>
      <Card padding="1.25rem 1.5rem" style={{ background: 'linear-gradient(135deg, #FFFFFF 0%, #F8FAFF 100%)' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 46, height: 46, borderRadius: 15, background: '#EEF2FF', border: '1px solid #DBEAFE', color: '#1E40FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ClipboardCheck size={22} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <h1 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0F172A', margin: 0 }}>
                  Surveys, NPS & Interactive Quiz (25 Khối + Skip-Logic)
                </h1>
                <Badge tone="primary">Auto Lead Scoring</Badge>
              </div>
              <p style={{ fontSize: '0.8rem', color: '#64748B', marginTop: 3, marginBottom: 0 }}>
                Thiết kế khảo sát 25 khối kéo thả, rẽ nhánh điều kiện, chấm điểm tặng Voucher & xuất CSV báo cáo Cross-Tab.
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <ScreenHelpButton screenKey="mkt_surveys" />
            <button type="button" onClick={() => void reload()} className="btn secondary" style={{ height: 44 }}>
              <RefreshCw size={15} />
            </button>
            {canCreate && (
              <button
                type="button"
                onClick={() => startPresetEditor('quiz')}
                style={{ height: 44, padding: '0 1.2rem', borderRadius: 12, border: 'none', background: '#1E40FF', color: '#FFFFFF', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}
              >
                <Plus size={16} /> Tạo Khảo Sát Mới
              </button>
            )}
          </div>
        </div>
      </Card>

      {/* Preset Templates */}
      {canCreate && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: '0.85rem' }}>
          <FormCard
            icon={<ClipboardCheck size={18} />}
            title="Mẫu: Trắc Nghiệm Chấm Điểm"
            description="Chấm điểm ngân sách & cộng thẳng Lead Score vào Hồ sơ 360°."
            onClick={() => startPresetEditor('quiz')}
            badge={<Badge tone="primary">Quiz</Badge>}
          />
          <FormCard
            icon={<GitBranch size={18} />}
            title="Mẫu: Rẽ Nhánh Skip-Logic"
            description="Nhảy câu hỏi hoặc kết thúc sớm tùy theo đáp án khách chọn."
            onClick={() => startPresetEditor('branching')}
            badge={<Badge tone="warning">Branching</Badge>}
          />
          <FormCard
            icon={<Star size={18} />}
            title="Mẫu: Đo Chỉ Số NPS (0–10)"
            description="Tự động phân nhóm Promoters / Passives / Detractors."
            onClick={() => startPresetEditor('nps')}
            badge={<Badge tone="success">NPS</Badge>}
          />
        </div>
      )}

      {/* Search Bar */}
      <div style={{ position: 'relative', maxWidth: 420 }}>
        <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#64748B' }} />
        <input
          className="form-input"
          style={{ height: 42, paddingLeft: 36, background: '#FFFFFF', border: '1px solid #E2E8F0' }}
          placeholder="Tìm theo tiêu đề hoặc đường dẫn /s/:slug..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Surveys Grid */}
      {filteredSurveys.length === 0 ? (
        <EmptyState
          icon={<ClipboardCheck size={24} />}
          title="Chưa có bài Khảo sát hoặc Quiz nào"
          description="Chọn một mẫu phía trên để mở Studio 25 Khối và xuất bản liên kết công khai /s/:slug."
        />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '1rem' }}>
          {filteredSurveys.map((srv) => {
            const isPaused = srv.status !== 'active';
            const branchBlocksCount = srv.blocks.filter(
              (b) => (b.options || []).some((o) => Boolean(o.jumpToBlockId)) || Boolean(b.defaultJumpToBlockId)
            ).length;
            return (
              <FormCard
                key={srv.id}
                icon={<ClipboardCheck size={18} />}
                title={
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                    <span>{srv.title}</span>
                    {isPaused && <Badge tone="warning">Tạm dừng</Badge>}
                  </span>
                }
                description={
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      void navigator.clipboard?.writeText(`${origin}/s/${srv.slug}`);
                      toast.success('Đã sao chép đường dẫn /s/:slug!');
                    }}
                    style={{ border: '1px solid #DBEAFE', background: '#F8FAFF', color: '#1E40FF', borderRadius: 8, padding: '2px 8px', fontSize: '0.73rem', fontFamily: 'monospace', display: 'inline-flex', alignItems: 'center', gap: 4, cursor: 'pointer', marginTop: 3 }}
                  >
                    <Link2 size={11} /> /s/{srv.slug} <Copy size={10} />
                  </button>
                }
                badge={<Badge tone="primary">{srv.survey_type.toUpperCase()}</Badge>}
                footer={
                  <>
                    <span style={{ fontSize: '0.75rem', color: '#475569', fontWeight: 600 }}>
                      {srv.response_count} phản hồi • Điểm TB: {srv.avg_score} • {formatShortDate(srv.created_at)}
                    </span>
                    <div style={{ display: 'flex', gap: 5 }}>
                      <button
                        type="button"
                        onClick={() => setPublishSurvey(srv)}
                        className="btn secondary sm"
                        style={{ height: 34, color: '#1E40FF' }}
                        title="Chia sẻ Link, Mã QR & Nhúng"
                      >
                        <QrCode size={13} />
                      </button>
                      <button
                        type="button"
                        onClick={() => setReportSurvey(srv)}
                        className="btn secondary sm"
                        style={{ height: 34, display: 'inline-flex', alignItems: 'center', gap: 4 }}
                      >
                        <BarChart3 size={13} /> Báo cáo
                      </button>
                      {canEdit && (
                        <>
                          <button
                            type="button"
                            onClick={() => void handleToggleStatus(srv)}
                            className="btn secondary sm"
                            style={{ height: 34, color: isPaused ? '#059669' : '#D97706' }}
                          >
                            <Power size={13} />
                          </button>
                          <button type="button" onClick={() => openExistingEditor(srv)} className="btn secondary sm" style={{ height: 34 }}>
                            <Edit2 size={13} />
                          </button>
                        </>
                      )}
                      {canDelete && (
                        <button type="button" onClick={() => setDeleteTarget(srv)} className="btn secondary sm" style={{ height: 34, color: '#DC2626' }}>
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>
                  </>
                }
              >
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  <Badge tone="neutral">{srv.blocks.length} khối</Badge>
                  {branchBlocksCount > 0 && <Badge tone="warning">{branchBlocksCount} rẽ nhánh</Badge>}
                  {srv.settings?.auto_tag && <Badge tone="info">Tag: {srv.settings.auto_tag}</Badge>}
                </div>
              </FormCard>
            );
          })}
        </div>
      )}

      <SurveyPublishModal
        survey={publishSurvey}
        onClose={() => setPublishSurvey(null)}
        onUpdated={async () => {
          setPublishSurvey(null);
          await reload();
        }}
      />

      <SurveyReportModal
        survey={reportSurvey}
        onClose={() => setReportSurvey(null)}
      />

      <ConfirmModal
        isOpen={Boolean(deleteTarget)}
        title="Xóa bài Khảo sát / Quiz?"
        message={`Bạn có chắc muốn xóa vĩnh viễn "${deleteTarget?.title || ''}" cùng toàn bộ thống kê phản hồi?`}
        confirmText="Xóa Khảo sát"
        onConfirm={() => void handleDeleteConfirm()}
        onClose={() => setDeleteTarget(null)}
      />
    </div>
  );
};

export default MarketingSurveysPage;
