import React, { useEffect, useMemo, useState } from 'react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Download, Filter, Users } from 'lucide-react';
import toast from 'react-hot-toast';
import { Badge, Card, Table, type TableColumn } from '../../components/ui/AutoDataLoadingModal';
import { CustomModal } from '../../components/ui/CustomModal';
import { ModalBodySkeleton } from '../../components/ui/Skeleton';
import { apiRequest, formatShortDate, getErrorMessage } from '../../../autodataApi';
import { useAuth } from '../../contexts/AuthContext';
import { computeQuestionCrossTabStats, exportSurveyRespondentsCsv } from './surveyLogicHelpers';
import {
  normalizeSurveyDto,
  type SurveyAnalyticsPayload,
  type SurveyItemDto,
  type SurveyRespondentDto,
} from './surveyTypes';

const SurveyReportInner: React.FC<{ survey: SurveyItemDto }> = ({ survey }) => {
  const { token, tenantSlug } = useAuth();
  const [loading, setLoading] = useState(true);
  const [payload, setPayload] = useState<SurveyAnalyticsPayload | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'crosstab' | 'respondents'>('overview');
  const [npsFilter, setNpsFilter] = useState<'all' | 'promoters' | 'passives' | 'detractors'>('all');
  const [expandedRespId, setExpandedRespId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        let data: SurveyAnalyticsPayload | null = null;
        try {
          data = await apiRequest<SurveyAnalyticsPayload>(`/marketing/surveys/${survey.id}/report`, { token, tenantSlug });
        } catch {
          data = await apiRequest<SurveyAnalyticsPayload>(`/marketing/surveys/${survey.id}/analytics`, { token, tenantSlug });
        }
        if (!cancelled && data) setPayload(data);
      } catch (err) {
        if (!cancelled) toast.error(getErrorMessage(err, 'Không thể tải báo cáo phân tích Khảo sát.'));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [survey.id, token, tenantSlug]);

  const resolvedSurvey = useMemo(
    () => (payload?.survey ? normalizeSurveyDto(payload.survey) : survey),
    [payload, survey]
  );

  const responses = useMemo(() => payload?.responses || [], [payload]);
  const summary = payload?.summary || {
    total_responses: responses.length,
    avg_quiz_score: 0,
    nps_index: 0,
    promoters: 0,
    passives: 0,
    detractors: 0,
  };

  const npsTotal = Math.max(1, summary.promoters + summary.passives + summary.detractors);
  const pPct = Math.round((summary.promoters / npsTotal) * 100);
  const paPct = Math.round((summary.passives / npsTotal) * 100);
  const dPct = Math.round((summary.detractors / npsTotal) * 100);

  const scoreDist = useMemo(() => {
    if (payload?.score_distribution && payload.score_distribution.length > 0) {
      return payload.score_distribution;
    }
    const buckets = [
      { bucket: '0–10đ', min: 0, max: 10, count: 0 },
      { bucket: '11–25đ', min: 11, max: 25, count: 0 },
      { bucket: '26–45đ', min: 26, max: 45, count: 0 },
      { bucket: '46+đ', min: 46, max: 999999, count: 0 },
    ];
    for (const r of responses) {
      const sc = Number(r.quiz_score || 0);
      const target = buckets.find((b) => sc >= b.min && sc <= b.max) || buckets[0];
      target.count += 1;
    }
    return buckets.map(({ bucket, count }) => ({ bucket, count }));
  }, [payload, responses]);

  const crossTabStats = useMemo(
    () => computeQuestionCrossTabStats(resolvedSurvey.blocks, responses, npsFilter),
    [resolvedSurvey.blocks, responses, npsFilter]
  );

  if (loading) {
    return <ModalBodySkeleton rows={5} />;
  }

  const respondentCols: Array<TableColumn<SurveyRespondentDto>> = [
    {
      key: 'person',
      header: 'Người Tham Gia (PII Masked)',
      render: (r) => (
        <div>
          <div style={{ fontWeight: 700, color: '#0F172A', fontSize: '0.82rem' }}>{r.name || 'Khách ẩn danh'}</div>
          <div style={{ fontSize: '0.73rem', color: '#64748B', fontFamily: 'monospace' }}>{[r.phone, r.email].filter(Boolean).join(' • ') || '—'}</div>
        </div>
      ),
    },
    {
      key: 'score',
      header: 'Điểm Quiz',
      numeric: true,
      render: (r) => <Badge tone="primary">+{r.quiz_score} điểm</Badge>,
    },
    {
      key: 'nps',
      header: 'NPS',
      align: 'center',
      render: (r) =>
        r.nps_score !== null && r.nps_score !== undefined ? (
          <Badge tone={r.nps_score >= 9 ? 'success' : r.nps_score >= 7 ? 'warning' : 'danger'}>{r.nps_score}/10</Badge>
        ) : (
          <span style={{ color: '#94A3B8' }}>—</span>
        ),
    },
    {
      key: 'tags',
      header: 'Nhãn Phân Loại',
      render: (r) => (
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
          {(r.tags_applied || []).length > 0 ? r.tags_applied.map((t) => <Badge key={t} tone="info">{t}</Badge>) : <span style={{ fontSize: '0.73rem', color: '#94A3B8' }}>Mặc định</span>}
        </div>
      ),
    },
    {
      key: 'time',
      header: 'Thời Gian',
      align: 'right',
      render: (r) => <span style={{ fontSize: '0.74rem', color: '#64748B' }}>{formatShortDate(r.created_at)}</span>,
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: 6, padding: 4, borderRadius: 12, background: '#F1F5F9', border: '1px solid #E2E8F0' }}>
          {(
            [
              ['overview', 'NPS Gauge & Điểm Số'],
              ['crosstab', `Biểu Đồ Câu Hỏi (${crossTabStats.length})`],
              ['respondents', `Người Trả Lời (${responses.length})`],
            ] as const
          ).map(([k, lbl]) => {
            const active = activeTab === k;
            return (
              <button
                key={k}
                type="button"
                onClick={() => setActiveTab(k)}
                style={{ height: 34, padding: '0 12px', borderRadius: 8, border: active ? '1px solid rgba(30,64,255,0.2)' : 'none', background: active ? '#FFFFFF' : 'transparent', color: active ? '#1E40FF' : '#475569', fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer' }}
              >
                {lbl}
              </button>
            );
          })}
        </div>

        <button
          type="button"
          disabled={responses.length === 0}
          onClick={() => {
            exportSurveyRespondentsCsv(resolvedSurvey, responses);
            toast.success('Đã xuất tệp CSV danh sách phản hồi!');
          }}
          style={{ height: 38, padding: '0 14px', borderRadius: 10, border: 'none', background: '#1E40FF', color: '#FFFFFF', fontWeight: 700, fontSize: '0.78rem', display: 'inline-flex', alignItems: 'center', gap: 6, cursor: responses.length === 0 ? 'not-allowed' : 'pointer', opacity: responses.length === 0 ? 0.5 : 1 }}
        >
          <Download size={14} /> Xuất CSV Người Trả Lời
        </button>
      </div>

      {activeTab === 'overview' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 10 }}>
            <Card padding="0.85rem 1rem">
              <div style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 700 }}>Tổng Lượt Trả Lời</div>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#1E40FF', marginTop: 2 }}>{summary.total_responses}</div>
            </Card>
            <Card padding="0.85rem 1rem">
              <div style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 700 }}>Chỉ Số NPS (-100..+100)</div>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: summary.nps_index >= 0 ? '#059669' : '#DC2626', marginTop: 2 }}>
                {summary.nps_index > 0 ? `+${summary.nps_index}` : summary.nps_index}
              </div>
            </Card>
            <Card padding="0.85rem 1rem">
              <div style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 700 }}>Điểm Quiz Trung Bình</div>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0F172A', marginTop: 2 }}>{summary.avg_quiz_score}</div>
            </Card>
            <Card padding="0.85rem 1rem">
              <div style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 700 }}>Nhóm Promoters (9–10)</div>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#059669', marginTop: 2 }}>{summary.promoters} ({pPct}%)</div>
            </Card>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.15fr', gap: 12 }}>
            <Card title="NPS Gauge — Phân Tầng Mức Độ Trung Thành">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, textAlign: 'center' }}>
                  <div style={{ padding: '0.6rem', borderRadius: 12, background: '#ECFDF5', border: '1px solid #A7F3D0' }}>
                    <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#059669' }}>{summary.promoters}</div>
                    <div style={{ fontSize: '0.68rem', fontWeight: 700, color: '#047857' }}>Promoters (9–10)</div>
                  </div>
                  <div style={{ padding: '0.6rem', borderRadius: 12, background: '#FFFBEB', border: '1px solid #FDE68A' }}>
                    <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#D97706' }}>{summary.passives}</div>
                    <div style={{ fontSize: '0.68rem', fontWeight: 700, color: '#B45309' }}>Passives (7–8)</div>
                  </div>
                  <div style={{ padding: '0.6rem', borderRadius: 12, background: '#FEF2F2', border: '1px solid #FECACA' }}>
                    <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#DC2626' }}>{summary.detractors}</div>
                    <div style={{ fontSize: '0.68rem', fontWeight: 700, color: '#B91C1C' }}>Detractors (0–6)</div>
                  </div>
                </div>
                <div style={{ height: 12, borderRadius: 999, background: '#F1F5F9', display: 'flex', overflow: 'hidden' }}>
                  <div style={{ width: `${dPct}%`, background: '#EF4444' }} />
                  <div style={{ width: `${paPct}%`, background: '#F59E0B' }} />
                  <div style={{ width: `${pPct}%`, background: '#10B981' }} />
                </div>
              </div>
            </Card>

            <Card title="Phổ Điểm Chấm Nhu Cầu (Quiz Score Distribution)">
              <div style={{ width: '100%', height: 155 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={scoreDist} margin={{ top: 6, right: 8, left: -18, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                    <XAxis dataKey="bucket" tick={{ fontSize: 11, fill: '#64748B' }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#64748B' }} />
                    <Tooltip />
                    <Bar dataKey="count" name="Số người" fill="#1E40FF" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </div>
        </div>
      )}

      {activeTab === 'crosstab' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#475569', display: 'inline-flex', alignItems: 'center', gap: 5 }}>
              <Filter size={14} color="#1E40FF" /> Lọc Chéo (Cross-Tab) Theo Nhóm NPS:
            </span>
            <div style={{ display: 'flex', gap: 6 }}>
              {(
                [
                  ['all', 'Tất cả'],
                  ['promoters', 'Promoters (9–10)'],
                  ['passives', 'Passives (7–8)'],
                  ['detractors', 'Detractors (0–6)'],
                ] as const
              ).map(([seg, lbl]) => (
                <button
                  key={seg}
                  type="button"
                  onClick={() => setNpsFilter(seg)}
                  className="btn secondary sm"
                  style={{ height: 30, fontSize: '0.73rem', color: npsFilter === seg ? '#1E40FF' : '#475569', borderColor: npsFilter === seg ? '#1E40FF' : '#E2E8F0' }}
                >
                  {lbl}
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 380, overflowY: 'auto', paddingRight: 4 }}>
            {crossTabStats.map((q, idx) => (
              <Card
                key={q.blockId}
                padding="0.9rem 1.1rem"
                title={`Câu #${idx + 1}: ${q.label}`}
                subtitle={`${q.totalAnswered} lượt trả lời • Loại: ${q.type}${q.avgNumber !== undefined ? ` • Trung bình: ${q.avgNumber}` : ''}`}
              >
                {q.options.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                    {q.options.map((opt) => (
                      <div key={opt.value}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.76rem', marginBottom: 3 }}>
                          <span style={{ fontWeight: 600, color: '#1E293B' }}>{opt.label}</span>
                          <span style={{ fontWeight: 800, color: '#1E40FF' }}>{opt.count} ({opt.percentage}%)</span>
                        </div>
                        <div style={{ height: 8, borderRadius: 999, background: '#F1F5F9', overflow: 'hidden' }}>
                          <div style={{ width: `${opt.percentage}%`, height: '100%', background: '#1E40FF', borderRadius: 999 }} />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : q.sampleTexts.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                    {q.sampleTexts.map((txt, tIdx) => (
                      <div key={tIdx} style={{ padding: '0.45rem 0.7rem', borderRadius: 8, background: '#F8F9FA', border: '1px solid #E2E8F0', fontSize: '0.76rem', color: '#334155' }}>“{txt}”</div>
                    ))}
                  </div>
                ) : (
                  <div style={{ fontSize: '0.75rem', color: '#94A3B8' }}>Chưa có dữ liệu trả lời cho câu hỏi này.</div>
                )}
              </Card>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'respondents' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <Table
            columns={respondentCols}
            rows={responses}
            rowKey={(r) => r.id}
            onRowClick={(r) => setExpandedRespId((prev) => (prev === r.id ? null : r.id))}
            emptyTitle="Chưa có người tham gia trả lời"
            emptyDescription="Chia sẻ liên kết /s/:slug hoặc mã QR để bắt đầu thu thập dữ liệu khảo sát."
          />

          {expandedRespId && (() => {
            const found = responses.find((x) => x.id === expandedRespId);
            if (!found) return null;
            return (
              <div style={{ padding: '0.85rem 1rem', borderRadius: 14, background: '#F8FAFF', border: '1px solid #DBEAFE' }}>
                <div style={{ fontSize: '0.78rem', fontWeight: 800, color: '#1E40FF', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                  <Users size={14} /> Chi Tiết Câu Trả Lời — {found.name || 'Khách ẩn danh'}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 6 }}>
                  {Object.entries(found.answers || {}).map(([blkId, val]) => {
                    const blk = resolvedSurvey.blocks.find((b) => b.id === blkId);
                    return (
                      <div key={blkId} style={{ padding: '0.45rem 0.65rem', borderRadius: 8, background: '#FFFFFF', border: '1px solid #E2E8F0', fontSize: '0.74rem' }}>
                        <div style={{ color: '#64748B', fontWeight: 600 }}>{blk?.label || blkId}</div>
                        <div style={{ color: '#0F172A', fontWeight: 700, marginTop: 2 }}>{typeof val === 'object' ? JSON.stringify(val) : String(val)}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
};

export const SurveyReportModal: React.FC<{ survey: SurveyItemDto | null; onClose: () => void }> = ({ survey, onClose }) => (
  <CustomModal
    isOpen={Boolean(survey)}
    onClose={onClose}
    title={`Báo Cáo Phân Tích, NPS & Cross-Tab — ${survey?.title || ''}`}
    width={920}
  >
    {survey && <SurveyReportInner key={survey.id} survey={survey} />}
  </CustomModal>
);

export default SurveyReportModal;
