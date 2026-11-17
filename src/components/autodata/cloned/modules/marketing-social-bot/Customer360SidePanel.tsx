import React, { useState } from 'react';
import { Tag, UserCheck, UserPlus } from 'lucide-react';
import toast from 'react-hot-toast';
import { Badge, Card } from '../../components/ui/AutoDataLoadingModal';
import { CustomModal } from '../../components/ui/CustomModal';
import { DrawerSkeleton } from '../../components/ui/Skeleton';
import { apiRequest, formatShortDate, getErrorMessage } from '../../../autodataApi';
import { useAuth } from '../../contexts/AuthContext';
import { useEntitlement } from '../../contexts/EntitlementContext';
import type {
  BotConfigDto,
  ConversationDetailResponse,
  SocialChannelKey,
} from './socialBotTypes';

export interface Customer360SidePanelProps {
  convId: string | null;
  detailLoading: boolean;
  detail: ConversationDetailResponse | null;
  audiences: Array<{ id: string; name: string }>;
  rounds: Array<{ id: string; name: string }>;
  botCfg: BotConfigDto;
  onChanged: (convId: string) => Promise<void>;
}

export const Customer360SidePanel: React.FC<Customer360SidePanelProps> = ({
  convId,
  detailLoading,
  detail,
  audiences,
  rounds,
  botCfg,
  onChanged,
}) => {
  const { token, tenantSlug } = useAuth();
  const { terminology, hasModule } = useEntitlement();
  const hasSaleRounds = hasModule('rounds');

  const [pushAudienceId, setPushAudienceId] = useState<string>(botCfg.target_audience_id || '');
  const [pushRoundId, setPushRoundId] = useState<string>(botCfg.distribution_round_id || '');
  const [manualPhone, setManualPhone] = useState('');
  const [manualEmail, setManualEmail] = useState('');

  const handlePushLead = async (mode: 'audience' | 'sale_round') => {
    const activeConvId = detail?.conversation.id || convId;
    if (!activeConvId) return;
    try {
      await apiRequest(`/marketing/social-bot/conversations/${activeConvId}/push-lead`, {
        method: 'POST',
        token,
        tenantSlug,
        body: {
          mode,
          audience_id: pushAudienceId || botCfg.target_audience_id || undefined,
          round_id: pushRoundId || botCfg.distribution_round_id || undefined,
          phone: manualPhone.trim() || undefined,
          email: manualEmail.trim() || undefined,
        },
      });
      toast.success(
        mode === 'sale_round'
          ? 'Đã đẩy 1 chạm thẳng vào Vòng chia Sale Auto Data!'
          : 'Đã đồng bộ 1 chạm vào Tệp Khách hàng Marketing!'
      );
      setManualPhone('');
      setManualEmail('');
      await onChanged(activeConvId);
    } catch (err) {
      toast.error(getErrorMessage(err, 'Không thể đẩy hồ sơ từ hộp thư.'));
    }
  };

  return (
    <Card
      title={`Hồ Sơ ${terminology.customerLabel} 360°`}
      subtitle="Tự động khâu SĐT/Email & đẩy vào Tệp / Vòng chia Sale"
      padding="1rem 1.15rem"
    >
      {detailLoading ? (
        <DrawerSkeleton />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {detail?.customer_360 ? (
            <div style={{ padding: '0.85rem', borderRadius: 12, background: '#F8FAFF', border: '1px solid #DBEAFE' }}>
              <div style={{ fontWeight: 800, fontSize: '0.92rem', color: '#0F172A', display: 'flex', alignItems: 'center', gap: 5 }}>
                <UserCheck size={15} color="#1E40FF" />
                {detail.customer_360.name}
              </div>
              <div style={{ fontSize: '0.77rem', color: '#475569', marginTop: 4 }}>
                SĐT: <b>{detail.customer_360.phone || '—'}</b> • Email: <b>{detail.customer_360.email || '—'}</b>
              </div>
              <div style={{ display: 'flex', gap: 5, marginTop: 8, flexWrap: 'wrap' }}>
                <Badge tone="primary">Score: {detail.customer_360.lead_score}</Badge>
                <Badge tone="info">{detail.customer_360.stage_name || detail.customer_360.status}</Badge>
                {(detail.customer_360.tags || []).map((t) => (
                  <Badge key={t.name} tone="purple" icon={<Tag size={10} />}>
                    {t.name}
                  </Badge>
                ))}
              </div>
            </div>
          ) : (
            <div style={{ padding: '0.8rem', borderRadius: 12, background: '#F8F9FA', border: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={{ fontSize: '0.76rem', color: '#64748B' }}>
                Hội thoại chưa có SĐT/Email. Bạn có thể nhập bổ sung để khâu Hồ sơ 360° ngay:
              </div>
              <input className="form-input" style={{ height: 36, fontSize: '0.78rem' }} placeholder="SĐT khách (0909...)" value={manualPhone} onChange={(e) => setManualPhone(e.target.value)} />
              <input className="form-input" style={{ height: 36, fontSize: '0.78rem' }} placeholder="Email khách..." value={manualEmail} onChange={(e) => setManualEmail(e.target.value)} />
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <select className="form-input" style={{ height: 36, fontSize: '0.78rem' }} value={pushAudienceId} onChange={(e) => setPushAudienceId(e.target.value)}>
              <option value="">— Chọn Tệp Khách hàng đích —</option>
              {audiences.map((a) => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
            </select>
            <button type="button" onClick={() => void handlePushLead('audience')} className="btn secondary" style={{ height: 38, color: '#1E40FF', fontSize: '0.78rem', fontWeight: 700 }}>
              <UserPlus size={14} style={{ display: 'inline', marginRight: 5 }} />
              Đưa 1 Chạm Vào Tệp Marketing
            </button>

            {rounds.length > 0 && (
              <select className="form-input" style={{ height: 36, fontSize: '0.78rem', marginTop: 4 }} value={pushRoundId} onChange={(e) => setPushRoundId(e.target.value)}>
                <option value="">— Vòng chia Sale mặc định —</option>
                {rounds.map((r) => (
                  <option key={r.id} value={r.id}>{r.name}</option>
                ))}
              </select>
            )}
            <button
              type="button"
              onClick={() => void handlePushLead('sale_round')}
              style={{
                height: 40,
                borderRadius: 12,
                border: 'none',
                background: '#1E40FF',
                color: '#FFFFFF',
                fontWeight: 700,
                fontSize: '0.79rem',
                cursor: 'pointer',
              }}
            >
              {hasSaleRounds ? 'Đẩy 1 Chạm Vào Vòng Chia Sale Auto Data' : 'Đẩy Sang Hàng Đợi Kinh Doanh'}
            </button>
          </div>

          <div style={{ borderTop: '1px solid #E2E8F0', paddingTop: 8 }}>
            <div style={{ fontSize: '0.76rem', fontWeight: 800, color: '#334155', marginBottom: 6 }}>
              Dòng Thời Gian Tương Tác 360° ({detail?.timeline.length || 0})
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 200, overflowY: 'auto' }}>
              {(detail?.timeline || []).map((ev) => (
                <div
                  key={ev.id}
                  style={{
                    padding: '0.5rem 0.65rem',
                    borderRadius: 10,
                    background: '#FFFFFF',
                    border: '1px solid #E2E8F0',
                    fontSize: '0.74rem',
                  }}
                >
                  <div style={{ fontWeight: 700, color: '#0F172A' }}>{ev.title}</div>
                  <div style={{ color: '#64748B', fontSize: '0.68rem' }}>{formatShortDate(ev.created_at)}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </Card>
  );
};

export interface InboundMessageSimulatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSimulated: (conversationId: string) => Promise<void>;
}

export const InboundMessageSimulatorModal: React.FC<InboundMessageSimulatorModalProps> = ({
  isOpen,
  onClose,
  onSimulated,
}) => {
  const { token, tenantSlug } = useAuth();
  const [simChannel, setSimChannel] = useState<SocialChannelKey>('messenger');
  const [simCustomer, setSimCustomer] = useState('Trần Bảo Ngọc');
  const [simMessage, setSimMessage] = useState(
    'Cho mình hỏi bảng giá dịch vụ doanh nghiệp, SĐT mình là 0912888999 nhé!'
  );

  const handleSimulateInbound = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!simMessage.trim()) return;
    try {
      const res = await apiRequest<{
        conversation_id: string;
        extracted_entities: { phone: string | null; email: string | null };
      }>('/marketing/social-bot/conversations', {
        method: 'POST',
        token,
        tenantSlug,
        body: {
          channel: simChannel,
          customer_name: simCustomer.trim() || 'Khách Mới',
          content: simMessage.trim(),
        },
      });
      toast.success(
        res.extracted_entities.phone || res.extracted_entities.email
          ? `DOM Agent đã tự phản hồi & bóc tách SĐT/Email (${res.extracted_entities.phone || res.extracted_entities.email})!`
          : 'DOM Agent đã tự động phản hồi tin nhắn khách hàng!'
      );
      onClose();
      await onSimulated(res.conversation_id);
    } catch (err) {
      toast.error(getErrorMessage(err, 'Không thể mô phỏng tin nhắn đến.'));
    }
  };

  return (
    <CustomModal
      isOpen={isOpen}
      onClose={onClose}
      title="Mô Phỏng Tin Nhắn Khách Đến (Messenger / Zalo OA / Web LiveChat)"
      width={520}
    >
      <form onSubmit={(e) => void handleSimulateInbound(e)} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <select className="form-input" style={{ height: 44 }} value={simChannel} onChange={(e) => setSimChannel(e.target.value as SocialChannelKey)}>
            <option value="messenger">Facebook Messenger</option>
            <option value="zalo_oa">Zalo Official Account (OA)</option>
            <option value="web_chat">Website LiveChat</option>
          </select>
          <input className="form-input" style={{ height: 44 }} placeholder="Tên khách hàng..." value={simCustomer} onChange={(e) => setSimCustomer(e.target.value)} />
        </div>
        <textarea className="form-input" rows={3} style={{ padding: '0.65rem' }} value={simMessage} onChange={(e) => setSimMessage(e.target.value)} />
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <button type="button" onClick={onClose} className="btn secondary" style={{ height: 44 }}>Hủy</button>
          <button
            type="submit"
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
            Gửi Tin Nhắn Giả Lập
          </button>
        </div>
      </form>
    </CustomModal>
  );
};

export default Customer360SidePanel;
