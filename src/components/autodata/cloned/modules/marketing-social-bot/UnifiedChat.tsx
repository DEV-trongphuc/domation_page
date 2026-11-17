import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Bot,
  CheckCircle2,
  MessageCircle,
  PauseCircle,
  PlayCircle,
  Search,
  Send,
  Sparkles,
  Zap,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { Badge, Card, EmptyState } from '../../components/ui/AutoDataLoadingModal';
import { apiRequest, getErrorMessage } from '../../../autodataApi';
import { useAuth } from '../../contexts/AuthContext';
import {
  Customer360SidePanel,
  InboundMessageSimulatorModal,
} from './Customer360SidePanel';
import {
  FAST_REPLY_SNIPPETS,
  type BotConfigDto,
  type ConversationDetailResponse,
  type ConversationSummaryDto,
  type SocialChannelFilter,
  type SocialChannelKey,
} from './socialBotTypes';

export interface UnifiedChatProps {
  conversations: ConversationSummaryDto[];
  audiences: Array<{ id: string; name: string }>;
  rounds: Array<{ id: string; name: string }>;
  botCfg: BotConfigDto;
  onReloadOverview: () => Promise<void>;
}

const channelLabel = (ch: SocialChannelKey) =>
  ch === 'zalo_oa' ? 'Zalo OA' : ch === 'web_chat' ? 'Web Chat' : 'Messenger';

export const UnifiedChat: React.FC<UnifiedChatProps> = ({
  conversations,
  audiences,
  rounds,
  botCfg,
  onReloadOverview,
}) => {
  const { token, tenantSlug } = useAuth();
  const [channelFilter, setChannelFilter] = useState<SocialChannelFilter>('all');
  const [search, setSearch] = useState('');
  const [selectedConvId, setSelectedConvId] = useState<string | null>(conversations[0]?.id || null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detail, setDetail] = useState<ConversationDetailResponse | null>(null);
  const [replyText, setReplyText] = useState('');
  const [sending, setSending] = useState(false);
  const [simOpen, setSimOpen] = useState(false);

  const loadDetail = useCallback(
    async (convId: string) => {
      setDetailLoading(true);
      try {
        const res = await apiRequest<ConversationDetailResponse>(
          `/marketing/social-bot/conversations/${convId}`,
          { token, tenantSlug }
        );
        setDetail(res);
      } catch (err) {
        toast.error(getErrorMessage(err, 'Không thể tải chi tiết hội thoại & Hồ sơ 360°.'));
      } finally {
        setDetailLoading(false);
      }
    },
    [token, tenantSlug]
  );

  const firstConvId = conversations[0]?.id || null;
  useEffect(() => {
    const activeId = selectedConvId || firstConvId;
    if (!activeId) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await apiRequest<ConversationDetailResponse>(
          `/marketing/social-bot/conversations/${activeId}`,
          { token, tenantSlug }
        );
        if (!cancelled) setDetail(res);
      } catch {
        // Ignore silent initial fetch fail
      } finally {
        if (!cancelled) setDetailLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [selectedConvId, firstConvId, token, tenantSlug]);

  const filteredConversations = useMemo(() => {
    const q = search.trim().toLowerCase();
    return conversations.filter((c) => {
      if (channelFilter !== 'all' && c.channel !== channelFilter) return false;
      if (!q) return true;
      return (
        c.customer_name.toLowerCase().includes(q) ||
        (c.extracted_phone || '').toLowerCase().includes(q) ||
        (c.extracted_email || '').toLowerCase().includes(q) ||
        (c.last_message_preview || '').toLowerCase().includes(q)
      );
    });
  }, [conversations, channelFilter, search]);

  const handleSelectThread = async (conv: ConversationSummaryDto) => {
    setSelectedConvId(conv.id);
    if ((conv.unread_count || 0) > 0) {
      await apiRequest(`/marketing/social-bot/conversations/${conv.id}`, {
        method: 'PATCH',
        token,
        tenantSlug,
        body: { mark_read: true },
      }).catch(() => {});
      void onReloadOverview();
    }
  };

  const handleToggleBotPause = async () => {
    const conv = detail?.conversation;
    if (!conv) return;
    const nextPaused = !conv.bot_paused;
    try {
      await apiRequest(`/marketing/social-bot/conversations/${conv.id}`, {
        method: 'PATCH',
        token,
        tenantSlug,
        body: { bot_paused: nextPaused },
      });
      toast.success(
        nextPaused
          ? 'Đã bật Human Takeover — Tạm dừng DOM Agent tự trả lời hội thoại này!'
          : 'Đã kích hoạt lại DOM Agent tự động phản hồi!'
      );
      await loadDetail(conv.id);
      await onReloadOverview();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Không thể chuyển chế độ Human Takeover.'));
    }
  };

  const handleToggleResolved = async () => {
    const conv = detail?.conversation;
    if (!conv) return;
    const nextStatus = conv.status === 'resolved' ? 'open' : 'resolved';
    try {
      await apiRequest(`/marketing/social-bot/conversations/${conv.id}`, {
        method: 'PATCH',
        token,
        tenantSlug,
        body: { status: nextStatus },
      });
      toast.success(nextStatus === 'resolved' ? 'Đã hoàn tất hội thoại!' : 'Đã mở lại hội thoại!');
      await loadDetail(conv.id);
      await onReloadOverview();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Không thể đổi trạng thái hội thoại.'));
    }
  };

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    const convId = detail?.conversation.id || selectedConvId;
    if (!convId || !replyText.trim()) return;
    setSending(true);
    try {
      await apiRequest(`/marketing/social-bot/conversations/${convId}/messages`, {
        method: 'POST',
        token,
        tenantSlug,
        body: { content: replyText.trim(), sender_type: 'agent' },
      });
      setReplyText('');
      await loadDetail(convId);
      await onReloadOverview();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Không thể gửi phản hồi.'));
    } finally {
      setSending(false);
    }
  };

  const filterPills: Array<{ id: SocialChannelFilter; label: string }> = [
    { id: 'all', label: `Tất cả (${conversations.length})` },
    { id: 'messenger', label: `Messenger (${conversations.filter((c) => c.channel === 'messenger').length})` },
    { id: 'zalo_oa', label: `Zalo OA (${conversations.filter((c) => c.channel === 'zalo_oa').length})` },
    { id: 'web_chat', label: `Web LiveChat (${conversations.filter((c) => c.channel === 'web_chat').length})` },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <Card padding="0.85rem 1.15rem">
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {filterPills.map((pill) => {
              const active = channelFilter === pill.id;
              return (
                <button
                  key={pill.id}
                  type="button"
                  onClick={() => setChannelFilter(pill.id)}
                  style={{ height: 36, padding: '0 0.9rem', borderRadius: 999, border: active ? '1.5px solid #1E40FF' : '1px solid #E2E8F0', background: active ? '#EFF6FF' : '#FFFFFF', color: active ? '#1E40FF' : '#475569', fontWeight: 700, fontSize: '0.78rem', cursor: 'pointer' }}
                >
                  {pill.label}
                </button>
              );
            })}
          </div>

          <button
            type="button"
            onClick={() => setSimOpen(true)}
            style={{ height: 38, padding: '0 1rem', borderRadius: 10, border: 'none', background: '#1E40FF', color: '#FFFFFF', fontWeight: 700, fontSize: '0.78rem', display: 'inline-flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}
          >
            <Sparkles size={14} /> Mô Phỏng Tin Nhắn Khách Đến
          </button>
        </div>
      </Card>

      {conversations.length === 0 ? (
        <EmptyState
          icon={<MessageCircle size={24} />}
          title="Chưa có hội thoại đa kênh nào"
          description="Nhấn 'Mô Phỏng Tin Nhắn Khách Đến' để kiểm chứng DOM Agent tự trả lời & bóc tách SĐT/Email khâu thẳng vào Hồ sơ 360°."
        />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '290px minmax(0, 1fr) 330px', gap: '1rem', alignItems: 'start' }}>
          <Card title="Luồng Hội Thoại Hợp Nhất">
            <div style={{ position: 'relative', marginBottom: 10 }}>
              <Search size={14} style={{ position: 'absolute', left: 10, top: 12, color: '#94A3B8' }} />
              <input className="form-input" style={{ height: 38, paddingLeft: 32, fontSize: '0.8rem' }} placeholder="Tìm tên khách, SĐT, nội dung..." value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 490, overflowY: 'auto' }}>
              {filteredConversations.map((c) => {
                const isSel = c.id === (detail?.conversation.id || selectedConvId);
                return (
                  <div
                    key={c.id}
                    onClick={() => void handleSelectThread(c)}
                    style={{ padding: '0.75rem', borderRadius: 12, background: isSel ? '#EFF6FF' : '#FFFFFF', border: isSel ? '1.5px solid #1E40FF' : '1px solid #E2E8F0', cursor: 'pointer' }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontWeight: 700, fontSize: '0.84rem', color: '#0F172A' }}>{c.customer_name}</span>
                      <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                        {(c.unread_count || 0) > 0 && <Badge tone="danger">{c.unread_count}</Badge>}
                        <Badge tone={c.channel === 'zalo_oa' ? 'info' : c.channel === 'web_chat' ? 'success' : 'primary'}>
                          {channelLabel(c.channel)}
                        </Badge>
                      </div>
                    </div>
                    <div style={{ fontSize: '0.74rem', color: '#64748B', marginTop: 4 }}>{c.last_message_preview}</div>
                    <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginTop: 6 }}>
                      {(c.extracted_phone || c.extracted_email) && <Badge tone="success">{c.extracted_phone || c.extracted_email}</Badge>}
                      {c.bot_paused && <Badge tone="warning">Human Takeover</Badge>}
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          <Card
            title={detail ? `Hội thoại với ${detail.conversation.customer_name}` : 'Nội Dung Hội Thoại'}
            subtitle={detail ? `Kênh: ${channelLabel(detail.conversation.channel)} • Trạng thái: ${detail.conversation.status}` : undefined}
            actions={
              detail && (
                <div style={{ display: 'flex', gap: 6 }}>
                  <button
                    type="button"
                    onClick={() => void handleToggleBotPause()}
                    className="btn secondary sm"
                    style={{ height: 34, color: detail.conversation.bot_paused ? '#D97706' : '#1E40FF', display: 'inline-flex', alignItems: 'center', gap: 5 }}
                  >
                    {detail.conversation.bot_paused ? (
                      <><PlayCircle size={14} /> Bật lại AI Bot</>
                    ) : (
                      <><PauseCircle size={14} /> Human Takeover (Tạm dừng AI)</>
                    )}
                  </button>
                  <button type="button" onClick={() => void handleToggleResolved()} className="btn secondary sm" style={{ height: 34, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                    <CheckCircle2 size={13} />
                    {detail.conversation.status === 'resolved' ? 'Mở lại' : 'Hoàn tất'}
                  </button>
                </div>
              )
            }
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, minHeight: 330, maxHeight: 410, overflowY: 'auto', padding: '0.8rem', borderRadius: 14, background: '#F8F9FA', border: '1px solid #E2E8F0' }}>
              {(detail?.messages || []).map((m) => (
                <div
                  key={m.id}
                  style={{
                    alignSelf: m.sender_type === 'customer' ? 'flex-start' : 'flex-end',
                    maxWidth: '82%',
                    padding: '0.65rem 0.9rem',
                    borderRadius: 14,
                    background: m.sender_type === 'customer' ? '#FFFFFF' : m.sender_type === 'bot' ? '#EFF6FF' : '#1E40FF',
                    color: m.sender_type === 'agent' ? '#FFFFFF' : '#0F172A',
                    border: m.sender_type === 'agent' ? 'none' : '1px solid #DBEAFE',
                  }}
                >
                  <div style={{ fontSize: '0.68rem', fontWeight: 700, opacity: 0.78, marginBottom: 2, display: 'flex', alignItems: 'center', gap: 4 }}>
                    {m.sender_type === 'bot' && <Bot size={11} />}
                    <span>{m.sender_name}</span>
                  </div>
                  <div style={{ fontSize: '0.83rem', lineHeight: 1.5 }}>{m.content}</div>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 10 }}>
              {FAST_REPLY_SNIPPETS.map((sn) => (
                <button
                  key={sn.label}
                  type="button"
                  onClick={() => setReplyText(sn.text)}
                  style={{ padding: '4px 10px', borderRadius: 999, border: '1px solid #DBEAFE', background: '#F8FAFF', color: '#1E40FF', fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                >
                  <Zap size={11} /> {sn.label}
                </button>
              ))}
            </div>

            <form onSubmit={(e) => void handleSendReply(e)} style={{ display: 'flex', gap: 8, marginTop: 8 }}>
              <input className="form-input" style={{ height: 44, flex: 1 }} placeholder="Nhập tin nhắn chuyên viên CSKH phản hồi trực tiếp..." value={replyText} onChange={(e) => setReplyText(e.target.value)} />
              <button
                type="submit"
                disabled={sending || !replyText.trim()}
                style={{ height: 44, padding: '0 1.2rem', borderRadius: 12, border: 'none', background: '#1E40FF', color: '#FFFFFF', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}
              >
                <Send size={15} /> Gửi
              </button>
            </form>
          </Card>

          <Customer360SidePanel
            convId={selectedConvId}
            detailLoading={detailLoading}
            detail={detail}
            audiences={audiences}
            rounds={rounds}
            botCfg={botCfg}
            onChanged={async (id) => {
              await loadDetail(id);
              await onReloadOverview();
            }}
          />
        </div>
      )}

      <InboundMessageSimulatorModal
        isOpen={simOpen}
        onClose={() => setSimOpen(false)}
        onSimulated={async (newConvId) => {
          await onReloadOverview();
          setSelectedConvId(newConvId);
          await loadDetail(newConvId);
        }}
      />
    </div>
  );
};

export default UnifiedChat;
