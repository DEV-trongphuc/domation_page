import React, { useCallback, useEffect, useState } from 'react';
import { Edit3, Plus, RefreshCw, Send, Trash2, Zap } from 'lucide-react';
import toast from 'react-hot-toast';
import { Badge, Card, EmptyState, FormCard } from '../../components/ui/AutoDataLoadingModal';
import { TableSkeleton } from '../../components/ui/Skeleton';
import { apiRequest, formatVnd, getErrorMessage } from '../../../autodataApi';
import { useAuth } from '../../contexts/AuthContext';
import { ZaloOAManager } from './ZaloOAManager';
import { ZaloTemplateCreateModal } from './ZaloTemplateCreateModal';
import type { ZaloOaConfigDto, ZaloTemplateDto } from './socialBotTypes';

export interface ZaloBroadcastTabProps {
  audiences: Array<{ id: string; name: string }>;
}

export const ZaloBroadcastTab: React.FC<ZaloBroadcastTabProps> = ({ audiences }) => {
  const { token, tenantSlug } = useAuth();

  const [oaInfo, setOaInfo] = useState<ZaloOaConfigDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [templates, setTemplates] = useState<ZaloTemplateDto[]>([]);
  const [tplModalOpen, setTplModalOpen] = useState(false);
  const [editingTpl, setEditingTpl] = useState<ZaloTemplateDto | null>(null);

  // Batch Broadcast Form
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [selectedAudienceId, setSelectedAudienceId] = useState<string>('');
  const [campaignName, setCampaignName] = useState<string>('Chiến dịch CSKH Zalo Quý 4');
  const [dispatching, setDispatching] = useState(false);
  const [lastDispatchResult, setLastDispatchResult] = useState<{
    sent_count: number;
    estimated_cost_vnd: number;
    template_name: string | null;
  } | null>(null);

  const loadTemplates = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiRequest<{ items?: ZaloTemplateDto[] }>(
        '/marketing/social-bot/zalo-templates',
        { token, tenantSlug }
      );
      const list = res.items || [];
      setTemplates(list);
      setSelectedTemplateId((prev) => prev || list[0]?.id || '');
    } catch (err) {
      toast.error(getErrorMessage(err, 'Không thể tải danh sách mẫu tin Zalo ZNS/ZBS.'));
    } finally {
      setLoading(false);
    }
  }, [token, tenantSlug]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await apiRequest<{ items?: ZaloTemplateDto[] }>(
          '/marketing/social-bot/zalo-templates',
          { token, tenantSlug }
        );
        if (!cancelled) {
          const list = res.items || [];
          setTemplates(list);
          if (list[0]) setSelectedTemplateId(list[0].id);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token, tenantSlug]);

  const handleDispatchBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTemplateId) {
      toast.error('Vui lòng tạo và chọn 1 mẫu tin Zalo ZNS/ZBS trước khi phát hành.');
      return;
    }
    setDispatching(true);
    try {
      const res = await apiRequest<{
        sent_count: number;
        estimated_cost_vnd: number;
        template_name: string | null;
      }>('/marketing/social-bot/zalo-broadcast', {
        method: 'POST',
        token,
        tenantSlug,
        body: {
          template_id: selectedTemplateId,
          audience_id: selectedAudienceId || null,
          campaign_name: campaignName.trim() || 'Zalo Broadcast',
        },
      });
      setLastDispatchResult(res);
      toast.success(
        `Đã phát hành Zalo Broadcast tới ${res.sent_count} khách hàng (Chi phí dự kiến: ${formatVnd(
          res.estimated_cost_vnd
        )})!`
      );
      await loadTemplates();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Không thể gửi chiến dịch Zalo Broadcast.'));
    } finally {
      setDispatching(false);
    }
  };

  const handleDeleteTemplate = async (id: string) => {
    try {
      await apiRequest(`/marketing/social-bot/zalo-templates/${id}`, {
        method: 'DELETE',
        token,
        tenantSlug,
      });
      toast.success('Đã xóa mẫu tin Zalo.');
      await loadTemplates();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Không thể xóa mẫu tin Zalo.'));
    }
  };

  const selectedTplObj = templates.find((t) => t.id === selectedTemplateId) || null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <ZaloOAManager onOaLoaded={setOaInfo} />

      {/* Batch Broadcast Dispatcher */}
      <Card
        title="Phát Hành Chiến Dịch Gửi Hàng Loạt Zalo ZNS & ZBS Broadcast"
        subtitle="Tự động lọc khách hàng có SĐT hợp lệ, tôn trọng trạng thái Opt-out và ghi lịch sử vào Timeline 360°"
      >
        <form
          onSubmit={(e) => void handleDispatchBroadcast(e)}
          style={{ display: 'grid', gridTemplateColumns: '1.1fr 1.2fr 1.1fr auto', gap: 10, alignItems: 'end' }}
        >
          <div>
            <label className="form-label" style={{ fontWeight: 700 }}>Tên đợt gửi Broadcast</label>
            <input
              className="form-input"
              style={{ height: 44 }}
              value={campaignName}
              onChange={(e) => setCampaignName(e.target.value)}
            />
          </div>
          <div>
            <label className="form-label" style={{ fontWeight: 700 }}>Mẫu tin ZNS / ZBS sử dụng</label>
            <select
              className="form-input"
              style={{ height: 44 }}
              value={selectedTemplateId}
              onChange={(e) => setSelectedTemplateId(e.target.value)}
            >
              <option value="">— Chọn mẫu Zalo —</option>
              {templates.map((t) => (
                <option key={t.id} value={t.id}>
                  [{t.template_code}] {t.name} ({formatVnd(t.price_vnd)}/tin)
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="form-label" style={{ fontWeight: 700 }}>Tệp Khách hàng nhận tin</label>
            <select
              className="form-input"
              style={{ height: 44 }}
              value={selectedAudienceId}
              onChange={(e) => setSelectedAudienceId(e.target.value)}
            >
              <option value="">Tất cả khách hàng có SĐT hợp lệ</option>
              {audiences.map((a) => (
                <option key={a.id} value={a.id}>
                  Tệp: {a.name}
                </option>
              ))}
            </select>
          </div>
          <button
            type="submit"
            disabled={dispatching || !selectedTemplateId}
            style={{
              height: 44,
              padding: '0 1.3rem',
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
            <Send size={15} /> {dispatching ? 'Đang gửi...' : 'Phát Hành Ngay'}
          </button>
        </form>

        {selectedTplObj && (
          <div style={{ marginTop: 10, fontSize: '0.78rem', color: '#475569' }}>
            Đơn giá mẫu đang chọn: <strong style={{ color: '#1E40FF' }}>{formatVnd(selectedTplObj.price_vnd)}/tin</strong> • Nội dung:{' '}
            <em>{selectedTplObj.content_body.slice(0, 110)}...</em>
          </div>
        )}

        {lastDispatchResult && (
          <div
            style={{
              marginTop: 10,
              padding: '0.75rem 1rem',
              borderRadius: 12,
              background: '#ECFDF5',
              border: '1px solid #A7F3D0',
              fontSize: '0.8rem',
              color: '#065F46',
              fontWeight: 700,
            }}
          >
            Kết quả đợt gửi vừa xong: Đã phát hành <b>{lastDispatchResult.sent_count}</b> tin Zalo ({lastDispatchResult.template_name || 'Broadcast'}) • Tổng phí ước tính: <b>{formatVnd(lastDispatchResult.estimated_cost_vnd)}</b>.
          </div>
        )}
      </Card>

      {/* ZNS / ZBS Templates Catalog */}
      <Card
        title="Thư Viện Mẫu Tin Zalo ZNS & ZBS (`mkt_zalo_templates`)"
        actions={
          <div style={{ display: 'flex', gap: 8 }}>
            <button type="button" onClick={() => void loadTemplates()} className="btn secondary sm" style={{ height: 40 }}>
              <RefreshCw size={14} />
            </button>
            <button
              type="button"
              onClick={() => {
                setEditingTpl(null);
                setTplModalOpen(true);
              }}
              style={{
                height: 40,
                padding: '0 1.1rem',
                borderRadius: 10,
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
              <Plus size={15} /> Tạo Mẫu ZNS / ZBS Mới
            </button>
          </div>
        }
      >
        {loading ? (
          <TableSkeleton rows={4} cols={4} />
        ) : templates.length === 0 ? (
          <EmptyState
            icon={<Zap size={24} />}
            title="Chưa có mẫu tin Zalo ZNS / ZBS nào"
            description="Bấm 'Tạo Mẫu ZNS / ZBS Mới' để thiết kế nội dung, ánh xạ biến {{customer_name}} và xem trước giao diện thẻ Zalo."
          />
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1rem' }}>
            {templates.map((tpl) => (
              <FormCard
                key={tpl.id}
                icon={<Zap size={18} />}
                title={tpl.name}
                description={`Mã: ${tpl.template_code} • ${tpl.template_type.toUpperCase()} • ${formatVnd(tpl.price_vnd)}/tin`}
                badge={<Badge tone="success">{tpl.status}</Badge>}
                footer={
                  <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.73rem', color: '#64748B' }}>
                      Đã gửi: <b>{tpl.sent_count}</b> ({tpl.delivered_count} thành công)
                    </span>
                    <div style={{ display: 'flex', gap: 5 }}>
                      <button
                        type="button"
                        onClick={() => {
                          setEditingTpl(tpl);
                          setTplModalOpen(true);
                        }}
                        className="btn secondary sm"
                        style={{ height: 32, color: '#1E40FF' }}
                      >
                        <Edit3 size={13} /> Sửa & Xem trước
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleDeleteTemplate(tpl.id)}
                        className="btn secondary sm"
                        style={{ height: 32, color: '#DC2626' }}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                }
              >
                <div style={{ fontSize: '0.77rem', color: '#475569', lineHeight: 1.45 }}>
                  {tpl.content_body.slice(0, 120)}
                  {tpl.content_body.length > 120 ? '...' : ''}
                </div>
              </FormCard>
            ))}
          </div>
        )}
      </Card>

      <ZaloTemplateCreateModal
        isOpen={tplModalOpen}
        onClose={() => setTplModalOpen(false)}
        oaName={oaInfo?.oa_name || 'Zalo Official Account'}
        oaId={oaInfo?.oa_id}
        editingTemplate={editingTpl}
        onSaved={() => void loadTemplates()}
      />
    </div>
  );
};

export default ZaloBroadcastTab;
