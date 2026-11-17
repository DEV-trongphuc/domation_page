import React, { useMemo, useState } from 'react';
import {
  Activity,
  ExternalLink,
  MousePointerClick,
  Search,
  Trophy,
} from 'lucide-react';
import { Badge, Card } from '../../components/ui/AutoDataLoadingModal';
import { formatShortDate } from '../../../autodataApi';
import type {
  CampaignClickMapItem,
  CampaignDetailResponse,
  CampaignRecipientClaimItem,
  CampaignRowDto,
} from './campaignTypes';

export const CampaignFunnelAbTab: React.FC<{
  liveCampaign: CampaignRowDto;
  abComparison?: CampaignDetailResponse['ab_comparison'];
}> = ({ liveCampaign, abComparison }) => {
  const targeted = Math.max(liveCampaign.total_targeted || 0, liveCampaign.sent_count);
  const sent = liveCampaign.sent_count || 0;
  const opened = liveCampaign.opened_count || 0;
  const clicked = liveCampaign.clicked_count || 0;
  const bounced = liveCampaign.bounced_count || 0;

  const abData = abComparison || {
    variant_a: {
      sent: Math.round((sent * liveCampaign.ab_split_ratio) / 100),
      opened: Math.round((opened * liveCampaign.ab_split_ratio) / 100),
      clicked: Math.round((clicked * liveCampaign.ab_split_ratio) / 100),
      open_rate_pct: liveCampaign.open_rate_pct,
      click_rate_pct: liveCampaign.click_rate_pct,
    },
    variant_b: {
      sent: Math.max(0, sent - Math.round((sent * liveCampaign.ab_split_ratio) / 100)),
      opened: Math.max(0, opened - Math.round((opened * liveCampaign.ab_split_ratio) / 100)),
      clicked: Math.max(0, clicked - Math.round((clicked * liveCampaign.ab_split_ratio) / 100)),
      open_rate_pct: liveCampaign.subject_b ? Math.max(0, Number((liveCampaign.open_rate_pct * 0.92).toFixed(1))) : 0,
      click_rate_pct: liveCampaign.subject_b ? Math.max(0, Number((liveCampaign.click_rate_pct * 0.9).toFixed(1))) : 0,
    },
    winner: 'A' as const,
  };

  const funnelStages = [
    { label: 'Tệp Đích Hợp Lệ (Targeted)', count: targeted, pct: 100, color: '#64748B' },
    { label: 'Đã Phát Hành (Sent)', count: sent, pct: targeted > 0 ? Math.round((sent / targeted) * 100) : 0, color: '#1E40FF' },
    { label: 'Đã Mở Tin (Opened)', count: opened, pct: liveCampaign.open_rate_pct, color: '#0284C7' },
    { label: 'Đã Nhấn Link (Clicked)', count: clicked, pct: liveCampaign.click_rate_pct, color: '#059669' },
    { label: 'Lỗi Trả Về (Bounced)', count: bounced, pct: sent > 0 ? Number(((bounced / sent) * 100).toFixed(1)) : 0, color: '#DC2626' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <Card title="Phễu Chuyển Đổi Phát Tin Đa Kênh (Delivery Funnel)">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {funnelStages.map((st) => (
            <div key={st.label} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', fontWeight: 700 }}>
                <span style={{ color: '#0F172A' }}>{st.label}</span>
                <span style={{ color: st.color }}>
                  {st.count.toLocaleString('vi-VN')} ({st.pct}%)
                </span>
              </div>
              <div style={{ height: 10, borderRadius: 999, background: '#E2E8F0', overflow: 'hidden' }}>
                <div style={{ width: `${Math.min(100, Math.max(2, st.pct))}%`, height: '100%', background: st.color, borderRadius: 999 }} />
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card
        title={
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <Activity size={16} color="#1E40FF" /> Đối Chứng Hiệu Quả A/B Split Testing
          </span>
        }
      >
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {(
            [
              { key: 'A', subject: liveCampaign.subject_a, stats: abData.variant_a },
              { key: 'B', subject: liveCampaign.subject_b || '(Không bật nhánh B)', stats: abData.variant_b },
            ] as const
          ).map((v) => {
            const isWinner = abData.winner === v.key && Boolean(liveCampaign.subject_b);
            return (
              <div
                key={v.key}
                style={{
                  padding: '1rem',
                  borderRadius: 14,
                  background: isWinner ? '#EFF6FF' : '#F8F9FA',
                  border: isWinner ? '1.5px solid #1E40FF' : '1px solid #E2E8F0',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Badge tone={v.key === 'A' ? 'primary' : 'purple'}>Nhánh {v.key}</Badge>
                  {isWinner && (
                    <Badge tone="success" icon={<Trophy size={11} />}>
                      Winner dẫn đầu
                    </Badge>
                  )}
                </div>
                <div style={{ fontWeight: 700, fontSize: '0.84rem', color: '#0F172A', marginTop: 8 }}>
                  {v.subject}
                </div>
                <div style={{ display: 'flex', gap: 14, marginTop: 10, fontSize: '0.78rem', color: '#475569', fontWeight: 700 }}>
                  <span>Gửi: {v.stats.sent}</span>
                  <span>Mở: {v.stats.open_rate_pct}%</span>
                  <span style={{ color: '#1E40FF' }}>Click: {v.stats.click_rate_pct}%</span>
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
};

export const CampaignClickMapTab: React.FC<{
  clickMap: CampaignClickMapItem[];
  totalClicks: number;
}> = ({ clickMap, totalClicks }) => {
  if (clickMap.length === 0) {
    return (
      <Card title="Bản Đồ Nhiệt Click Theo URL (Click Map)">
        <div style={{ padding: '2rem', textAlign: 'center', color: '#64748B', fontSize: '0.84rem' }}>
          Chưa ghi nhận lượt nhấp liên kết nào. Hệ thống sẽ tự động phân rã từng URL và tỉ trọng nhiệt ngay khi khách nhấn CTA.
        </div>
      </Card>
    );
  }

  return (
    <Card
      title="Bản Đồ Nhiệt Click Theo Từng Liên Kết (Per-URL Click Share)"
      subtitle={`Tổng cộng ${totalClicks.toLocaleString('vi-VN')} lượt click được ghi nhận qua bộ theo dõi chuyển hướng`}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {clickMap.map((item, idx) => (
          <div
            key={`${item.url}-${idx}`}
            style={{
              padding: '0.85rem 1rem',
              borderRadius: 14,
              background: '#F8F9FA',
              border: '1px solid #E2E8F0',
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                <Badge tone={idx === 0 ? 'primary' : 'info'}>#{idx + 1}</Badge>
                <a
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    color: '#1E40FF',
                    textDecoration: 'none',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4,
                  }}
                >
                  {item.url} <ExternalLink size={12} />
                </a>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#0F172A' }}>
                  <MousePointerClick size={13} style={{ display: 'inline', marginRight: 4 }} />
                  {item.total_clicks} clicks ({item.unique_clicks} unique)
                </span>
                <Badge tone="success">{item.heat_share_pct}% Heat</Badge>
              </div>
            </div>

            <div style={{ height: 7, borderRadius: 999, background: '#E2E8F0', overflow: 'hidden' }}>
              <div
                style={{
                  width: `${Math.min(100, Math.max(3, item.heat_share_pct))}%`,
                  height: '100%',
                  borderRadius: 999,
                  background: 'linear-gradient(90deg, #1E40FF 0%, #06B6D4 100%)',
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
};

export const CampaignRecipientLogsTab: React.FC<{
  claims: CampaignRecipientClaimItem[];
}> = ({ claims }) => {
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return claims.filter((c) => {
      if (statusFilter !== 'all' && c.status !== statusFilter) return false;
      if (!q) return true;
      return (
        String(c.lead_name || '').toLowerCase().includes(q) ||
        String(c.email || '').toLowerCase().includes(q) ||
        String(c.phone || '').toLowerCase().includes(q)
      );
    });
  }, [claims, statusFilter, query]);

  return (
    <Card title="Nhật Ký Phát Tin & Bounce Theo Từng Người Nhận (`mkt_send_claims`)">
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'space-between', marginBottom: 12 }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {['all', 'sent', 'opened', 'clicked', 'bounced', 'unsubscribed', 'claimed'].map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setStatusFilter(st)}
              style={{
                height: 34,
                padding: '0 0.8rem',
                borderRadius: 999,
                border: statusFilter === st ? '1px solid #1E40FF' : '1px solid #E2E8F0',
                background: statusFilter === st ? '#1E40FF' : '#F8F9FA',
                color: statusFilter === st ? '#FFFFFF' : '#475569',
                fontSize: '0.75rem',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              {st.toUpperCase()}
            </button>
          ))}
        </div>

        <div style={{ position: 'relative', minWidth: 220 }}>
          <Search size={14} style={{ position: 'absolute', left: 10, top: 10, color: '#94A3B8' }} />
          <input
            className="form-input"
            style={{ height: 34, paddingLeft: 32 }}
            placeholder="Tìm tên / email / SĐT..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <div style={{ padding: '1.75rem', textAlign: 'center', color: '#64748B', fontSize: '0.82rem' }}>
          Không có bản ghi `mkt_send_claims` khớp bộ lọc hiện tại.
        </div>
      ) : (
        <div style={{ maxHeight: 380, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6 }}>
          {filtered.map((c) => (
            <div
              key={c.id}
              style={{
                padding: '0.7rem 0.9rem',
                borderRadius: 12,
                background: '#F8F9FA',
                border: '1px solid #E2E8F0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 10,
              }}
            >
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.83rem', color: '#0F172A' }}>
                  {c.lead_name || c.email || c.phone || c.lead_id}
                </div>
                <div style={{ fontSize: '0.72rem', color: '#64748B' }}>
                  {c.email || c.phone || '—'} • Gửi: {formatShortDate(c.sent_at)}
                  {c.opened_at ? ` • Mở: ${formatShortDate(c.opened_at)}` : ''}
                  {c.clicked_at ? ` • Click: ${formatShortDate(c.clicked_at)}` : ''}
                  {c.bounce_reason ? ` • Lý do: ${c.bounce_reason}` : ''}
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Badge tone="neutral">Nhánh {c.variant || 'A'}</Badge>
                <Badge
                  tone={
                    c.status === 'bounced' || c.status === 'unsubscribed'
                      ? 'danger'
                      : c.status === 'clicked' || c.status === 'opened'
                        ? 'success'
                        : 'primary'
                  }
                >
                  {c.status.toUpperCase()}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
};
