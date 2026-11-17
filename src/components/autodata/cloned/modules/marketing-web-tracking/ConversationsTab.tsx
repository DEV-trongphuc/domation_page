import React, { useCallback, useEffect, useState } from 'react';
import {
  Flame,
  Globe,
  MessageSquare,
  RefreshCw,
  Send,
  Sparkles,
  UserCheck,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { Badge, Card, EmptyState } from '../../components/ui/AutoDataLoadingModal';
import { SplitChatPanelSkeleton } from '../../components/ui/Skeleton';
import { apiRequest, formatShortDate, getErrorMessage } from '../../../autodataApi';
import { useAuth } from '../../contexts/AuthContext';
import { shortenUrlPath, type WebChatConversationDto } from './webTrackingTypes';

export const ConversationsTab: React.FC = () => {
  const { token, tenantSlug } = useAuth();

  const [loading, setLoading] = useState(true);
  const [threads, setThreads] = useState<WebChatConversationDto[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [sending, setSending] = useState(false);

  const loadConversations = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiRequest<{ items?: WebChatConversationDto[] }>(
        '/marketing/web-tracking/conversations',
        { token, tenantSlug }
      );
      const list = res.items || [];
      setThreads(list);
      setSelectedId((prev) => prev || list[0]?.id || null);
    } catch (err) {
      toast.error(getErrorMessage(err, 'Không thể tải hộp thư Web Live-Chat.'));
    } finally {
      setLoading(false);
    }
  }, [token, tenantSlug]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await apiRequest<{ items?: WebChatConversationDto[] }>(
          '/marketing/web-tracking/conversations',
          { token, tenantSlug }
        );
        if (cancelled) return;
        const list = res.items || [];
        setThreads(list);
        if (list[0]) setSelectedId(list[0].id);
      } catch (err) {
        if (!cancelled) toast.error(getErrorMessage(err, 'Không thể tải Web Live-Chat.'));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token, tenantSlug]);

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedId || !replyText.trim()) return;
    setSending(true);
    try {
      await apiRequest(`/marketing/web-tracking/conversations/${selectedId}/messages`, {
        method: 'POST',
        token,
        tenantSlug,
        body: { content: replyText.trim() },
      });
      setReplyText('');
      await loadConversations();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Không thể gửi tin nhắn Live-Chat.'));
    } finally {
      setSending(false);
    }
  };

  const handleSimulateVisitorChat = async () => {
    try {
      const res = await apiRequest<{ conversation_id: string }>('/marketing/social-bot/conversations', {
        method: 'POST',
        token,
        tenantSlug,
        body: {
          channel: 'web_chat',
          customer_name: 'Khách Website LiveChat',
          content: 'Mình đang xem trang /bang-gia, tư vấn giúp gói doanh nghiệp qua SĐT 0908666888 nhé!',
        },
      });
      toast.success('Đã mô phỏng khách chat trực tiếp trên Website kèm bóc tách SĐT!');
      await loadConversations();
      setSelectedId(res.conversation_id);
    } catch (err) {
      toast.error(getErrorMessage(err, 'Không thể mô phỏng hội thoại LiveChat.'));
    }
  };

  if (loading) {
    return <SplitChatPanelSkeleton />;
  }

  const activeThread = threads.find((t) => t.id === selectedId) || threads[0] || null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
        <span style={{ fontSize: '0.84rem', fontWeight: 700, color: '#475569' }}>
          Bàn làm việc Web Live-Chat kết hợp theo dõi đường dẫn trang khách đang mở theo thời gian thực
        </span>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            type="button"
            onClick={() => void loadConversations()}
            className="btn secondary sm"
            style={{ height: 38 }}
          >
            <RefreshCw size={14} />
          </button>
          <button
            type="button"
            onClick={() => void handleSimulateVisitorChat()}
            style={{
              height: 38,
              padding: '0 1rem',
              borderRadius: 10,
              border: 'none',
              background: '#1E40FF',
              color: '#FFFFFF',
              fontWeight: 700,
              fontSize: '0.78rem',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              cursor: 'pointer',
            }}
          >
            <Sparkles size={14} /> Giả Lập Khách Chat Từ Website
          </button>
        </div>
      </div>

      {threads.length === 0 ? (
        <EmptyState
          icon={<MessageSquare size={24} />}
          title="Chưa có phiên Web Live-Chat nào"
          description="Bấm 'Giả Lập Khách Chat Từ Website' để trải nghiệm cửa sổ chat song song với hành trình xem trang (Browsed Page Trail)."
        />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '280px minmax(0, 1fr) 310px', gap: '1rem', alignItems: 'start' }}>
          {/* Left: Web Chat Threads */}
          <Card title={`Phiên Live-Chat (${threads.length})`}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 460, overflowY: 'auto' }}>
              {threads.map((t) => {
                const active = activeThread?.id === t.id;
                return (
                  <div
                    key={t.id}
                    onClick={() => setSelectedId(t.id)}
                    style={{
                      padding: '0.75rem',
                      borderRadius: 12,
                      border: active ? '1.5px solid #1E40FF' : '1px solid #E2E8F0',
                      background: active ? '#EFF6FF' : '#FFFFFF',
                      cursor: 'pointer',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: 700, fontSize: '0.84rem', color: '#0F172A' }}>
                        {t.lead_name || t.customer_name}
                      </span>
                      {(t.unread_count || 0) > 0 && (
                        <Badge tone="danger">{t.unread_count}</Badge>
                      )}
                    </div>
                    <div style={{ fontSize: '0.74rem', color: '#64748B', marginTop: 4 }}>
                      {t.last_message_preview || 'Bắt đầu hội thoại'}
                    </div>
                    {(t.extracted_phone || t.extracted_email) && (
                      <div style={{ marginTop: 6 }}>
                        <Badge tone="success">{t.extracted_phone || t.extracted_email}</Badge>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Center: Chat Stream */}
          <Card
            title={activeThread ? `Live-Chat: ${activeThread.lead_name || activeThread.customer_name}` : 'Nội Dung Chat'}
            subtitle={activeThread?.last_message_at ? `Cập nhật: ${formatShortDate(activeThread.last_message_at)}` : undefined}
          >
            <div
              style={{
                minHeight: 330,
                maxHeight: 400,
                overflowY: 'auto',
                padding: '0.8rem',
                borderRadius: 14,
                background: '#F8F9FA',
                border: '1px solid #E2E8F0',
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
              }}
            >
              {(activeThread?.messages || []).map((m) => (
                <div
                  key={m.id}
                  style={{
                    alignSelf: m.sender_type === 'customer' ? 'flex-start' : 'flex-end',
                    maxWidth: '82%',
                    padding: '0.65rem 0.9rem',
                    borderRadius: 14,
                    background:
                      m.sender_type === 'customer'
                        ? '#FFFFFF'
                        : m.sender_type === 'bot'
                          ? '#EFF6FF'
                          : '#1E40FF',
                    color: m.sender_type === 'agent' ? '#FFFFFF' : '#0F172A',
                    border: m.sender_type === 'agent' ? 'none' : '1px solid #DBEAFE',
                  }}
                >
                  <div style={{ fontSize: '0.68rem', fontWeight: 700, opacity: 0.76, marginBottom: 2 }}>
                    {m.sender_name || m.sender_type}
                  </div>
                  <div style={{ fontSize: '0.83rem', lineHeight: 1.5 }}>{m.content}</div>
                </div>
              ))}
            </div>

            <form onSubmit={(e) => void handleSendReply(e)} style={{ display: 'flex', gap: 8, marginTop: 10 }}>
              <input
                className="form-input"
                style={{ height: 44, flex: 1 }}
                placeholder="Nhập phản hồi trực tiếp gửi lên Widget Website..."
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
              />
              <button
                type="submit"
                disabled={sending || !replyText.trim()}
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
                <Send size={15} /> Gửi
              </button>
            </form>
          </Card>

          {/* Right: Real-Time Browsed Page Trail */}
          <Card
            title="Hành Trình Xem Trang (Page Trail)"
            subtitle="Các trang khách vừa duyệt trước & trong lúc chat"
          >
            {activeThread?.lead_id && (
              <div
                style={{
                  padding: '0.7rem 0.85rem',
                  borderRadius: 12,
                  background: '#EFF6FF',
                  border: '1px solid #DBEAFE',
                  marginBottom: 10,
                  fontSize: '0.78rem',
                }}
              >
                <div style={{ fontWeight: 800, color: '#1E40FF', display: 'flex', alignItems: 'center', gap: 5 }}>
                  <UserCheck size={14} /> Đã khâu Hồ sơ 360° (Score: {activeThread.lead_score ?? 0})
                </div>
                <div style={{ color: '#475569', marginTop: 3 }}>
                  {[activeThread.extracted_phone, activeThread.extracted_email].filter(Boolean).join(' • ')}
                </div>
              </div>
            )}

            {(activeThread?.page_trail || []).length === 0 ? (
              <div style={{ fontSize: '0.78rem', color: '#64748B', lineHeight: 1.5 }}>
                Ngay khi khách để lại SĐT/Email trong khung chat, toàn bộ các trang khách vừa xem trên Website sẽ tự động hiển thị tại đây.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 350, overflowY: 'auto' }}>
                {(activeThread?.page_trail || []).map((pt, idx) => {
                  const isPricing = pt.event_type === 'pricing_intent' || /pricing|bang-gia/i.test(pt.page_url);
                  return (
                    <div
                      key={`${pt.page_url}-${idx}`}
                      style={{
                        padding: '0.6rem 0.75rem',
                        borderRadius: 10,
                        background: isPricing ? '#FEF2F2' : '#F8FAFC',
                        border: isPricing ? '1px solid #FECACA' : '1px solid #E2E8F0',
                        fontSize: '0.76rem',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 6 }}>
                        <span style={{ fontWeight: 700, color: '#0F172A', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                          {isPricing ? <Flame size={12} color="#DC2626" /> : <Globe size={12} color="#1E40FF" />}
                          {shortenUrlPath(pt.page_url)}
                        </span>
                        <span style={{ fontSize: '0.68rem', color: '#64748B' }}>
                          {formatShortDate(pt.created_at)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </div>
      )}
    </div>
  );
};

export default ConversationsTab;
