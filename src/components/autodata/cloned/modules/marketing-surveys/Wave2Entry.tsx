import React, { useCallback, useEffect, useState } from 'react';
import {
  BarChart3,
  ClipboardCheck,
  Edit2,
  ExternalLink,
  Plus,
  RefreshCw,
  Save,
  Trash2,
} from 'lucide-react';
import toast from 'react-hot-toast';
import {
  AutoDataLoadingModal,
  Badge,
  Card,
  EmptyState,
  FormCard,
} from '../../components/ui/AutoDataLoadingModal';
import { CustomModal } from '../../components/ui/CustomModal';
import { ScreenHelpButton } from '../../components/ui/ScreenHelpButton';
import { apiRequest, formatShortDate, getErrorMessage } from '../../../autodataApi';
import { useAuth } from '../../contexts/AuthContext';
import { useEntitlement } from '../../contexts/EntitlementContext';

interface SurveyOptionItem {
  id: string;
  label: string;
  value: string;
  points?: number;
  jumpToBlockId?: string;
}

interface SurveyBlockDto {
  id: string;
  type: string;
  label: string;
  required?: boolean;
  points?: number;
  correctValue?: string;
  tagOnAnswer?: string;
  options?: SurveyOptionItem[];
}

interface SurveyItemDto {
  id: string;
  title: string;
  slug: string;
  description: string;
  survey_type: 'survey' | 'quiz' | 'nps';
  status: string;
  blocks: SurveyBlockDto[];
  settings: {
    auto_tag?: string;
    base_lead_score?: number;
    target_audience_id?: string | null;
  };
  response_count: number;
  avg_score: number;
  created_at?: string;
}

interface BlockCatalogEntry {
  type: string;
  group: string;
  label: string;
}

interface SurveysOverviewResponse {
  items?: SurveyItemDto[];
  block_catalog?: BlockCatalogEntry[];
  audiences?: Array<{ id: string; name: string }>;
}

interface SurveyAnalyticsResponse {
  survey: SurveyItemDto;
  summary: {
    total_responses: number;
    avg_quiz_score: number;
    nps_index: number;
    promoters: number;
    passives: number;
    detractors: number;
  };
  responses: Array<{
    id: string;
    name?: string;
    phone?: string;
    email?: string;
    quiz_score: number;
    nps_score: number | null;
    tags_applied: string[];
    created_at?: string;
  }>;
}

const FALLBACK_25_BLOCKS: BlockCatalogEntry[] = [
  { type: 'short_text', group: 'Cơ bản', label: 'Văn bản ngắn (1 dòng)' },
  { type: 'long_text', group: 'Cơ bản', label: 'Văn bản dài (Đoạn văn)' },
  { type: 'email', group: 'Cơ bản', label: 'Địa chỉ Email' },
  { type: 'phone', group: 'Cơ bản', label: 'Số điện thoại' },
  { type: 'number', group: 'Cơ bản', label: 'Con số định lượng' },
  { type: 'date', group: 'Cơ bản', label: 'Ngày tháng' },
  { type: 'single_choice', group: 'Lựa chọn', label: 'Chọn 1 đáp án (Radio)' },
  { type: 'multi_choice', group: 'Lựa chọn', label: 'Chọn nhiều đáp án (Checkbox)' },
  { type: 'dropdown', group: 'Lựa chọn', label: 'Danh sách thả xuống (Dropdown)' },
  { type: 'yes_no', group: 'Lựa chọn', label: 'Có / Không' },
  { type: 'quiz_scored', group: 'Chấm điểm & Rẽ nhánh', label: 'Trắc nghiệm tính điểm (Quiz)' },
  { type: 'branch_jump', group: 'Chấm điểm & Rẽ nhánh', label: 'Điều hướng Rẽ nhánh (Branch Jump)' },
  { type: 'nps', group: 'Đánh giá', label: 'Chỉ số NPS (0–10)' },
  { type: 'csat_stars', group: 'Đánh giá', label: 'Đánh giá CSAT Sao (1–5)' },
  { type: 'likert_matrix', group: 'Đánh giá', label: 'Ma trận Thang đo Likert' },
  { type: 'slider', group: 'Đánh giá', label: 'Thanh kéo Giá trị (Slider)' },
  { type: 'emoji_rating', group: 'Đánh giá', label: 'Biểu tượng Cảm xúc (Emoji)' },
  { type: 'ranking', group: 'Nâng cao', label: 'Xếp hạng Ưu tiên (Ranking)' },
  { type: 'matrix_multi', group: 'Nâng cao', label: 'Ma trận Đa lựa chọn' },
  { type: 'file_upload', group: 'Nâng cao', label: 'Tải tệp đính kèm' },
  { type: 'section_header', group: 'Bố cục', label: 'Tiêu đề Phân đoạn' },
  { type: 'image_block', group: 'Bố cục', label: 'Hình ảnh Minh họa' },
  { type: 'banner_block', group: 'Bố cục', label: 'Banner Thương hiệu' },
  { type: 'divider', group: 'Bố cục', label: 'Đường kẻ Phân cách' },
  { type: 'page_break', group: 'Bố cục', label: 'Ngắt Trang (Multi-Step)' },
];

export const MarketingSurveysPage: React.FC = () => {
  const { token, tenantSlug } = useAuth();
  const { terminology, can } = useEntitlement();

  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<'list' | 'builder'>('list');
  const [surveys, setSurveys] = useState<SurveyItemDto[]>([]);
  const [catalog, setCatalog] = useState<BlockCatalogEntry[]>(FALLBACK_25_BLOCKS);
  const [audiences, setAudiences] = useState<Array<{ id: string; name: string }>>([]);

  // Builder State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState('Khảo Sát Mức Độ Hài Lòng NPS & Trắc Nghiệm Nhu Cầu');
  const [surveyType, setSurveyType] = useState<'survey' | 'quiz' | 'nps'>('quiz');
  const [autoTag, setAutoTag] = useState('Đã Khảo Sát');
  const [baseScore, setBaseScore] = useState('10');
  const [targetAudienceId, setTargetAudienceId] = useState('');
  const [blocks, setBlocks] = useState<SurveyBlockDto[]>([]);
  const [saving, setSaving] = useState(false);

  // Public Simulator Modal
  const [publicTestSurvey, setPublicTestSurvey] = useState<SurveyItemDto | null>(null);
  const [respondentName, setRespondentName] = useState('');
  const [respondentPhone, setRespondentPhone] = useState('');
  const [answers, setAnswers] = useState<Record<string, string | number>>({});

  // Analytics Modal
  const [analyticsData, setAnalyticsData] = useState<SurveyAnalyticsResponse | null>(null);

  const fetchSurveys = useCallback(async () => {
    return apiRequest<SurveysOverviewResponse>('/marketing/surveys', { token, tenantSlug });
  }, [token, tenantSlug]);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchSurveys();
      setSurveys(res.items || []);
      if (res.block_catalog && res.block_catalog.length > 0) setCatalog(res.block_catalog);
      setAudiences(res.audiences || []);
    } catch (err) {
      toast.error(getErrorMessage(err, 'Không thể tải danh sách Khảo sát & Quiz.'));
    } finally {
      setLoading(false);
    }
  }, [fetchSurveys]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetchSurveys();
        if (cancelled) return;
        setSurveys(res.items || []);
        if (res.block_catalog && res.block_catalog.length > 0) setCatalog(res.block_catalog);
        setAudiences(res.audiences || []);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [fetchSurveys]);

  const openNewBuilder = () => {
    setEditingId(null);
    setTitle(`Khảo sát NPS & Chấm điểm ${terminology.customerLabel}`);
    setSurveyType('quiz');
    setAutoTag('Survey Engaged');
    setBaseScore('10');
    setTargetAudienceId('');
    setBlocks([
      {
        id: crypto.randomUUID(),
        type: 'nps',
        label: 'Bạn sẵn sàng giới thiệu dịch vụ của chúng tôi cho đồng nghiệp ở mức nào (0–10)?',
        required: true,
      },
      {
        id: crypto.randomUUID(),
        type: 'quiz_scored',
        label: 'Ngân sách dự kiến triển khai trong quý này của bạn?',
        points: 20,
        options: [
          { id: crypto.randomUUID(), label: 'Dưới 20 triệu', value: 'low', points: 5 },
          { id: crypto.randomUUID(), label: 'Từ 20 – 100 triệu', value: 'mid', points: 15 },
          { id: crypto.randomUUID(), label: 'Trên 100 triệu (Ưu tiên VIP)', value: 'high', points: 30 },
        ],
      },
    ]);
    setMode('builder');
  };

  const openEdit = (srv: SurveyItemDto) => {
    setEditingId(srv.id);
    setTitle(srv.title);
    setSurveyType(srv.survey_type);
    setAutoTag(srv.settings?.auto_tag || '');
    setBaseScore(String(srv.settings?.base_lead_score ?? 10));
    setTargetAudienceId(srv.settings?.target_audience_id || '');
    setBlocks(srv.blocks || []);
    setMode('builder');
  };

  const addSurveyBlock = (entry: BlockCatalogEntry) => {
    const hasChoices = ['single_choice', 'multi_choice', 'dropdown', 'quiz_scored', 'ranking'].includes(entry.type);
    setBlocks((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        type: entry.type,
        label: entry.label,
        required: false,
        points: entry.type === 'quiz_scored' ? 15 : 0,
        options: hasChoices
          ? [
              { id: crypto.randomUUID(), label: 'Phương án A', value: 'A', points: 10 },
              { id: crypto.randomUUID(), label: 'Phương án B', value: 'B', points: 5 },
            ]
          : undefined,
      },
    ]);
  };

  const handleSaveSurvey = async () => {
    if (!title.trim()) {
      toast.error('Vui lòng nhập tiêu đề Khảo sát.');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        title: title.trim(),
        survey_type: surveyType,
        blocks,
        settings: {
          auto_tag: autoTag.trim(),
          base_lead_score: Number(baseScore || 0),
          target_audience_id: targetAudienceId || null,
        },
      };
      if (editingId) {
        await apiRequest(`/marketing/surveys/${editingId}`, {
          method: 'PUT',
          token,
          tenantSlug,
          body: payload,
        });
        toast.success('Đã cập nhật Khảo sát / Quiz!');
      } else {
        await apiRequest('/marketing/surveys', {
          method: 'POST',
          token,
          tenantSlug,
          body: payload,
        });
        toast.success('Đã xuất bản Khảo sát / Quiz 25 khối!');
      }
      await reload();
      setMode('list');
    } catch (err) {
      toast.error(getErrorMessage(err, 'Không thể lưu Khảo sát.'));
    } finally {
      setSaving(false);
    }
  };

  const openAnalytics = async (id: string) => {
    try {
      const res = await apiRequest<SurveyAnalyticsResponse>(`/marketing/surveys/${id}/analytics`, {
        token,
        tenantSlug,
      });
      setAnalyticsData(res);
    } catch (err) {
      toast.error(getErrorMessage(err, 'Không thể tải báo cáo phân tích.'));
    }
  };

  const handlePublicSubmitTest = async () => {
    if (!publicTestSurvey) return;
    try {
      const res = await apiRequest<{ quiz_score: number; tags_applied: string[] }>(
        `/public/marketing/surveys/${publicTestSurvey.slug}`,
        {
          method: 'POST',
          body: {
            name: respondentName || 'Khách Khảo Sát',
            phone: respondentPhone || '0909555888',
            answers,
          },
        }
      );
      toast.success(
        `Đã ghi nhận phản hồi! Cộng +${res.quiz_score} Lead Score & gắn nhãn: ${res.tags_applied.join(', ') || 'Mặc định'}`
      );
      setPublicTestSurvey(null);
      setAnswers({});
      await reload();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Không thể gửi phản hồi khảo sát.'));
    }
  };

  if (loading) {
    return (
      <AutoDataLoadingModal
        inline
        isOpen
        message="Đang tải Trình Thiết Kế Khảo Sát & Trắc Nghiệm 25 Khối..."
      />
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', background: '#F8F9FA' }}>
      <Card padding="1.25rem 1.5rem" style={{ background: 'linear-gradient(135deg, #FFFFFF 0%, #F8FAFF 100%)' }}>
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
              <ClipboardCheck size={22} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <h1 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0F172A', margin: 0 }}>
                  Khảo Sát & Trắc Nghiệm Chấm Điểm (25 Khối Tương Tác)
                </h1>
                <Badge tone="primary">Auto Lead Scoring</Badge>
              </div>
              <p style={{ fontSize: '0.8rem', color: '#64748B', marginTop: 3 }}>
                Đo chỉ số NPS (0–10), CSAT, Ma trận Likert & Quiz cộng thẳng vào điểm nóng của {terminology.customerLabel}.
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            <ScreenHelpButton screenKey="mkt_surveys" />
            {mode === 'list' ? (
              <>
                <button type="button" onClick={() => void reload()} className="btn secondary" style={{ height: 44 }}>
                  <RefreshCw size={15} />
                </button>
                {can('surveys_quiz', 'create') && (
                  <button
                    type="button"
                    onClick={openNewBuilder}
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
                    <Plus size={16} /> Tạo Survey / Quiz Mới
                  </button>
                )}
              </>
            ) : (
              <>
                <button type="button" onClick={() => setMode('list')} className="btn secondary" style={{ height: 44 }}>
                  Quay lại Danh sách
                </button>
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => void handleSaveSurvey()}
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
                  <Save size={16} /> {saving ? 'Đang lưu...' : 'Lưu Khảo Sát'}
                </button>
              </>
            )}
          </div>
        </div>
      </Card>

      {mode === 'list' ? (
        surveys.length === 0 ? (
          <EmptyState
            icon={<ClipboardCheck size={24} />}
            title="Chưa có bài Khảo sát hoặc Quiz nào"
            description="Tạo biểu mẫu NPS, CSAT hoặc bài trắc nghiệm phân loại nhu cầu để tự động cộng Lead Score và gắn Tag."
            action={
              <button
                type="button"
                onClick={openNewBuilder}
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
                Khởi tạo ngay
              </button>
            }
          />
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(330px, 1fr))', gap: '1rem' }}>
            {surveys.map((srv) => (
              <FormCard
                key={srv.id}
                icon={<ClipboardCheck size={18} />}
                title={srv.title}
                description={`Slug: /public/marketing/surveys/${srv.slug}`}
                badge={<Badge tone="primary">{srv.survey_type.toUpperCase()}</Badge>}
                footer={
                  <>
                    <span style={{ fontSize: '0.75rem', color: '#475569', fontWeight: 600 }}>
                      {srv.response_count} phản hồi • Điểm TB: {srv.avg_score} • {formatShortDate(srv.created_at)}
                    </span>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button
                        type="button"
                        onClick={() => setPublicTestSurvey(srv)}
                        className="btn secondary sm"
                        style={{ height: 36, color: '#1E40FF', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                      >
                        <ExternalLink size={13} /> Làm thử
                      </button>
                      <button
                        type="button"
                        onClick={() => void openAnalytics(srv.id)}
                        className="btn secondary sm"
                        style={{ height: 36, display: 'inline-flex', alignItems: 'center', gap: 4 }}
                      >
                        <BarChart3 size={13} /> Báo cáo
                      </button>
                      <button type="button" onClick={() => openEdit(srv)} className="btn secondary sm" style={{ height: 36 }}>
                        <Edit2 size={13} />
                      </button>
                    </div>
                  </>
                }
              >
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  <Badge tone="neutral">{srv.blocks.length} câu hỏi/khối</Badge>
                  {srv.settings?.auto_tag && <Badge tone="info">Tag: {srv.settings.auto_tag}</Badge>}
                </div>
              </FormCard>
            ))}
          </div>
        )
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '290px 1fr', gap: '1rem', alignItems: 'start' }}>
          <Card title="Thư Viện 25 Khối Câu Hỏi" subtitle="Nhấn để thêm vào bài khảo sát">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 560, overflowY: 'auto' }}>
              {catalog.map((item) => (
                <button
                  key={item.type}
                  type="button"
                  onClick={() => addSurveyBlock(item)}
                  style={{
                    textAlign: 'left',
                    padding: '0.55rem 0.75rem',
                    borderRadius: 12,
                    border: '1px solid #E2E8F0',
                    background: '#FFFFFF',
                    cursor: 'pointer',
                  }}
                >
                  <div style={{ fontSize: '0.68rem', fontWeight: 700, color: '#1E40FF', textTransform: 'uppercase' }}>
                    {item.group}
                  </div>
                  <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#0F172A' }}>+ {item.label}</div>
                </button>
              ))}
            </div>
          </Card>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <Card title="Thiết Lập Chấm Điểm Lead Score & Tự Động Gắn Nhãn">
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: 10 }}>
                <div>
                  <label className="form-label" style={{ fontWeight: 700 }}>Tiêu đề bài Khảo sát / Quiz</label>
                  <input className="form-input" style={{ height: 44 }} value={title} onChange={(e) => setTitle(e.target.value)} />
                </div>
                <div>
                  <label className="form-label" style={{ fontWeight: 700 }}>Chế độ</label>
                  <select
                    className="form-input"
                    style={{ height: 44 }}
                    value={surveyType}
                    onChange={(e) => setSurveyType(e.target.value as 'survey' | 'quiz' | 'nps')}
                  >
                    <option value="quiz">Quiz tính điểm</option>
                    <option value="nps">Đo lường NPS</option>
                    <option value="survey">Khảo sát chuẩn</option>
                  </select>
                </div>
                <div>
                  <label className="form-label" style={{ fontWeight: 700 }}>Điểm cộng cơ bản</label>
                  <input
                    type="number"
                    className="form-input"
                    style={{ height: 44 }}
                    value={baseScore}
                    onChange={(e) => setBaseScore(e.target.value)}
                  />
                </div>
                <div>
                  <label className="form-label" style={{ fontWeight: 700 }}>Tag tự động</label>
                  <input className="form-input" style={{ height: 44 }} value={autoTag} onChange={(e) => setAutoTag(e.target.value)} />
                </div>
              </div>
              <div style={{ marginTop: 10 }}>
                <label className="form-label" style={{ fontWeight: 700 }}>Đưa người hoàn thành vào Tệp Data (Tùy chọn)</label>
                <select
                  className="form-input"
                  style={{ height: 44 }}
                  value={targetAudienceId}
                  onChange={(e) => setTargetAudienceId(e.target.value)}
                >
                  <option value="">— Không gắn cố định —</option>
                  {audiences.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name}
                    </option>
                  ))}
                </select>
              </div>
            </Card>

            <Card title={`Các Khối Trong Bài Khảo Sát (${blocks.length})`}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {blocks.map((blk, idx) => (
                  <div
                    key={blk.id}
                    style={{
                      padding: '0.9rem 1rem',
                      borderRadius: 14,
                      background: '#FFFFFF',
                      border: '1px solid #E2E8F0',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 8,
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Badge tone="primary">
                        Câu #{idx + 1} • {blk.type}
                      </Badge>
                      <button
                        type="button"
                        onClick={() => setBlocks((prev) => prev.filter((x) => x.id !== blk.id))}
                        className="btn secondary sm"
                        style={{ height: 32, color: '#DC2626' }}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                    <input
                      className="form-input"
                      style={{ height: 44 }}
                      value={blk.label}
                      onChange={(e) =>
                        setBlocks((prev) => prev.map((x, i) => (i === idx ? { ...x, label: e.target.value } : x)))
                      }
                    />
                    {blk.options && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, paddingLeft: 12 }}>
                        {blk.options.map((opt, oIdx) => (
                          <div key={opt.id} style={{ display: 'grid', gridTemplateColumns: '1fr 110px', gap: 8 }}>
                            <input
                              className="form-input"
                              style={{ height: 38 }}
                              value={opt.label}
                              onChange={(e) =>
                                setBlocks((prev) =>
                                  prev.map((x, i) =>
                                    i === idx
                                      ? {
                                          ...x,
                                          options: (x.options || []).map((o, j) =>
                                            j === oIdx ? { ...o, label: e.target.value, value: e.target.value } : o
                                          ),
                                        }
                                      : x
                                  )
                                )
                              }
                            />
                            <input
                              type="number"
                              className="form-input"
                              style={{ height: 38 }}
                              placeholder="+ Điểm"
                              value={opt.points ?? 0}
                              onChange={(e) =>
                                setBlocks((prev) =>
                                  prev.map((x, i) =>
                                    i === idx
                                      ? {
                                          ...x,
                                          options: (x.options || []).map((o, j) =>
                                            j === oIdx ? { ...o, points: Number(e.target.value) } : o
                                          ),
                                        }
                                      : x
                                  )
                                )
                              }
                            />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* Public Survey Simulator Modal */}
      <CustomModal
        isOpen={Boolean(publicTestSurvey)}
        onClose={() => setPublicTestSurvey(null)}
        title={`Trải Nghiệm Trang Public — ${publicTestSurvey?.title || ''}`}
        width={560}
      >
        {publicTestSurvey && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <input
                className="form-input"
                style={{ height: 44 }}
                placeholder="Họ tên người trả lời..."
                value={respondentName}
                onChange={(e) => setRespondentName(e.target.value)}
              />
              <input
                className="form-input"
                style={{ height: 44 }}
                placeholder="Số điện thoại định danh..."
                value={respondentPhone}
                onChange={(e) => setRespondentPhone(e.target.value)}
              />
            </div>

            {publicTestSurvey.blocks.map((b) => (
              <div key={b.id} style={{ padding: '0.75rem', borderRadius: 12, background: '#F8FAFC', border: '1px solid #E2E8F0' }}>
                <div style={{ fontWeight: 700, fontSize: '0.84rem', marginBottom: 8 }}>{b.label}</div>
                {b.type === 'nps' ? (
                  <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                    {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                      <button
                        key={num}
                        type="button"
                        onClick={() => setAnswers((prev) => ({ ...prev, [b.id]: num }))}
                        style={{
                          width: 38,
                          height: 38,
                          borderRadius: 10,
                          border: '1px solid #DBEAFE',
                          background: answers[b.id] === num ? '#1E40FF' : '#FFFFFF',
                          color: answers[b.id] === num ? '#FFFFFF' : '#0F172A',
                          fontWeight: 700,
                          cursor: 'pointer',
                        }}
                      >
                        {num}
                      </button>
                    ))}
                  </div>
                ) : b.options && b.options.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {b.options.map((opt) => (
                      <label key={opt.id} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.82rem' }}>
                        <input
                          type="radio"
                          name={b.id}
                          checked={answers[b.id] === opt.value}
                          onChange={() => setAnswers((prev) => ({ ...prev, [b.id]: opt.value }))}
                        />
                        {opt.label}
                      </label>
                    ))}
                  </div>
                ) : (
                  <input
                    className="form-input"
                    style={{ height: 40, background: '#FFFFFF' }}
                    value={String(answers[b.id] || '')}
                    onChange={(e) => setAnswers((prev) => ({ ...prev, [b.id]: e.target.value }))}
                    placeholder="Nhập câu trả lời..."
                  />
                )}
              </div>
            ))}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button type="button" onClick={() => setPublicTestSurvey(null)} className="btn secondary" style={{ height: 44 }}>
                Đóng
              </button>
              <button
                type="button"
                onClick={() => void handlePublicSubmitTest()}
                style={{
                  height: 44,
                  padding: '0 1.25rem',
                  borderRadius: 12,
                  border: 'none',
                  background: '#1E40FF',
                  color: '#FFFFFF',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                Nộp Bài & Chấm Điểm Lead Score
              </button>
            </div>
          </div>
        )}
      </CustomModal>

      {/* Survey Analytics Modal */}
      <CustomModal
        isOpen={Boolean(analyticsData)}
        onClose={() => setAnalyticsData(null)}
        title={`Phân Tích Kết Quả — ${analyticsData?.survey.title || ''}`}
        width={640}
      >
        {analyticsData && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
              <Card padding="0.85rem">
                <div style={{ fontSize: '0.74rem', color: '#64748B' }}>Tổng Phản Hồi</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#1E40FF' }}>
                  {analyticsData.summary.total_responses}
                </div>
              </Card>
              <Card padding="0.85rem">
                <div style={{ fontSize: '0.74rem', color: '#64748B' }}>Chỉ Số NPS</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#059669' }}>
                  {analyticsData.summary.nps_index}
                </div>
              </Card>
              <Card padding="0.85rem">
                <div style={{ fontSize: '0.74rem', color: '#64748B' }}>Điểm Quiz Trung Bình</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0F172A' }}>
                  {analyticsData.summary.avg_quiz_score}
                </div>
              </Card>
            </div>
            <div style={{ maxHeight: 260, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6 }}>
              {analyticsData.responses.map((r) => (
                <div
                  key={r.id}
                  style={{
                    padding: '0.65rem 0.85rem',
                    borderRadius: 12,
                    background: '#F8FAFC',
                    border: '1px solid #E2E8F0',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.83rem' }}>{r.name || 'Khách ẩn danh'}</div>
                    <div style={{ fontSize: '0.74rem', color: '#64748B' }}>{r.phone || r.email || '—'}</div>
                  </div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <Badge tone="primary">+{r.quiz_score} điểm</Badge>
                    {r.nps_score !== null && <Badge tone="success">NPS: {r.nps_score}/10</Badge>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CustomModal>
    </div>
  );
};

export default MarketingSurveysPage;
