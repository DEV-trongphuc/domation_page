import React, { useCallback, useEffect, useState } from 'react';
import {
  Activity,
  ArrowRight,
  CheckCircle2,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Sun,
} from 'lucide-react';
import toast from 'react-hot-toast';
import {
  Badge,
  Card,
  EmptyState,
  FormCard,
} from '../../components/ui/AutoDataLoadingModal';
import { CardSkeleton, KpiCardSkeleton } from '../../components/ui/Skeleton';
import { apiRequest, formatShortDate, formatVnd, getErrorMessage } from '../../../autodataApi';
import type { DomMorningBriefingPayload } from './domAgentTypes';

interface DomAgentBriefingTabProps {
  agentName: string;
  token?: string | null;
  tenantSlug?: string | null;
  onJumpToChatWithPrompt: (prompt: string) => void;
}

function formatMetricValue(key: string, val: unknown): string {
  if (typeof val === 'number') {
    if (key.endsWith('_vnd')) return formatVnd(val);
    return val.toLocaleString('vi-VN');
  }
  if (typeof val === 'boolean') return val ? 'Có' : 'Không';
  if (typeof val === 'string') return val;
  if (Array.isArray(val)) return `${val.length} mục`;
  return '—';
}

export const DomAgentBriefingTab: React.FC<DomAgentBriefingTabProps> = ({
  agentName,
  token,
  tenantSlug,
  onJumpToChatWithPrompt,
}) => {
  const [briefing, setBriefing] = useState<DomMorningBriefingPayload | null>(null);
  const [loading, setLoading] = useState(true);

  const loadBriefing = useCallback(
    async (manual = false) => {
      setLoading(true);
      try {
        const res = await apiRequest<DomMorningBriefingPayload>('/dom-agent/briefing', {
          method: manual ? 'POST' : 'GET',
          token,
          tenantSlug,
          body: manual ? {} : undefined,
        });
        setBriefing(res);
        if (manual) {
          toast.success(`Đã cập nhật Bản tin Điều hành từ ${agentName}!`);
        }
      } catch (err: unknown) {
        toast.error(getErrorMessage(err, 'Không thể tổng hợp Bản tin Điều hành.'));
      } finally {
        setLoading(false);
      }
    },
    [agentName, tenantSlug, token]
  );

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await apiRequest<DomMorningBriefingPayload>('/dom-agent/briefing', {
          token,
          tenantSlug,
        });
        if (!cancelled) {
          setBriefing(res);
        }
      } catch {
        // handled by empty state
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [tenantSlug, token]);

  if (loading && !briefing) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <CardSkeleton height={150} />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
          <KpiCardSkeleton />
          <KpiCardSkeleton />
          <KpiCardSkeleton />
        </div>
      </div>
    );
  }

  if (!briefing) {
    return (
      <EmptyState
        icon={<Sun size={24} />}
        title="Chưa thể khởi tạo Bản tin Điều hành"
        description="Bấm nút bên dưới để yêu cầu trợ lý quét nhanh sức khỏe toàn bộ các phân hệ được mở khóa."
        action={
          <button
            type="button"
            onClick={() => void loadBriefing(true)}
            style={{
              height: 40,
              padding: '0 1.2rem',
              borderRadius: 12,
              border: 'none',
              background: '#1E40FF',
              color: '#FFFFFF',
              fontWeight: 700,
              fontSize: '0.82rem',
              cursor: 'pointer',
            }}
          >
            Tạo Bản Tin Ngay
          </button>
        }
      />
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
      <Card
        style={{ background: 'linear-gradient(135deg, #FFFFFF 0%, #F8FAFF 100%)' }}
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <Sun size={18} color="#D97706" />
            <span>Bản Tin Điều Hành Chủ Động — {briefing.tenant_name}</span>
            <Badge tone="primary">{briefing.package_name}</Badge>
            <Badge tone="info">{briefing.industry_label}</Badge>
          </div>
        }
        subtitle={`Cập nhật lúc ${formatShortDate(briefing.generated_at)} • Kho tri thức RAG đang bật: ${briefing.active_knowledge_docs} tài liệu`}
        actions={
          <button
            type="button"
            disabled={loading}
            onClick={() => void loadBriefing(true)}
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
              cursor: loading ? 'wait' : 'pointer',
            }}
          >
            <RefreshCw size={14} />
            {loading ? 'Đang quét...' : 'Quét Dữ Liệu Thời Gian Thực'}
          </button>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#1E40FF', display: 'flex', alignItems: 'center', gap: 6 }}>
            <Sparkles size={14} /> Khuyến nghị hành động trọng tâm hôm nay:
          </div>
          {briefing.priority_actions.map((act, idx) => (
            <div
              key={idx}
              style={{
                padding: '0.7rem 0.95rem',
                borderRadius: 12,
                background: '#FFFFFF',
                border: '1px solid #DBEAFE',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 10,
                flexWrap: 'wrap',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.84rem', color: '#0F172A', fontWeight: 600 }}>
                <CheckCircle2 size={16} color="#059669" />
                <span>{act}</span>
              </div>
              <button
                type="button"
                onClick={() => onJumpToChatWithPrompt(act)}
                style={{
                  height: 30,
                  padding: '0 0.75rem',
                  borderRadius: 8,
                  border: '1px solid #DBEAFE',
                  background: '#F8FAFF',
                  color: '#1E40FF',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                  cursor: 'pointer',
                }}
              >
                Phân tích cùng AI <ArrowRight size={12} />
              </button>
            </div>
          ))}
        </div>
      </Card>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '1rem',
        }}
      >
        {briefing.sections.map((sec) => {
          const entries = Object.entries(sec.metrics).filter(
            ([k, v]) =>
              k !== 'pii_masked' &&
              (typeof v === 'number' || typeof v === 'string' || Array.isArray(v))
          );

          return (
            <FormCard
              key={sec.tool_name}
              icon={<Activity size={18} />}
              title={sec.title}
              description={`Module: ${sec.module_key} • Phạm vi dữ liệu: ${sec.scope}`}
              badge={
                <Badge tone="success" icon={<ShieldCheck size={10} />}>
                  RBAC Verified
                </Badge>
              }
              footer={
                <button
                  type="button"
                  onClick={() =>
                    onJumpToChatWithPrompt(`Phân tích chi tiết số liệu của công cụ ${sec.title}`)
                  }
                  style={{
                    border: 'none',
                    background: 'transparent',
                    color: '#1E40FF',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 5,
                    cursor: 'pointer',
                    padding: 0,
                  }}
                >
                  Đặt câu hỏi sâu hơn <ArrowRight size={13} />
                </button>
              }
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {entries.slice(0, 5).map(([k, v]) => (
                  <div
                    key={k}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      fontSize: '0.8rem',
                      padding: '4px 0',
                      borderBottom: '1px dashed #F1F5F9',
                    }}
                  >
                    <span style={{ color: '#64748B' }}>{k}</span>
                    <strong className="autodata-tabular-nums" style={{ color: '#0F172A' }}>
                      {formatMetricValue(k, v)}
                    </strong>
                  </div>
                ))}
              </div>
            </FormCard>
          );
        })}
      </div>
    </div>
  );
};
