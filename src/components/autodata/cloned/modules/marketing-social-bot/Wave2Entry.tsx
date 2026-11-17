import React, { useCallback, useEffect, useState } from 'react';
import {
  Bot,
  MessageCircle,
  MessageSquare,
  Plus,
  RefreshCw,
  Save,
  Send,
  ShieldCheck,
  Sparkles,
  Trash2,
  UserPlus,
} from 'lucide-react';
import toast from 'react-hot-toast';
import {
  AutoDataLoadingModal,
  Badge,
  Card,
  EmptyState,
  PillTabs,
} from '../../components/ui/AutoDataLoadingModal';
import { CustomModal } from '../../components/ui/CustomModal';
import { ScreenHelpButton } from '../../components/ui/ScreenHelpButton';
import { apiRequest, formatShortDate, getErrorMessage } from '../../../autodataApi';
import { useAuth } from '../../contexts/AuthContext';
import { useEntitlement } from '../../contexts/EntitlementContext';

interface FaqRuleDto {
  id: string;
  keywords: string[];
  question: string;
  answer: string;
}

interface BotConfigDto {
  bot_name: string;
  brand_persona: string;
  welcome_message: string;
  faq_rules: FaqRuleDto[];
  auto_extract_contact: boolean;
  routing_mode: 'none' | 'audience' | 'sale_round';
  target_audience_id: string | null;
  distribution_round_id: string | null;
  is_active: boolean;
}

interface ConversationSummaryDto {
  id: string;
  channel: 'messenger' | 'zalo_oa' | 'web_chat';
  customer_name: string;
  extracted_phone: string | null;
  extracted_email: string | null;
  lead_id: string | null;
  status: string;
  last_message_preview: string;
  last_message_at?: string;
}

interface MessageItemDto {
  id: string;
  sender_type: 'customer' | 'bot' | 'agent';
  sender_name: string;
  content: string;
  created_at?: string;
}

interface ConversationDetailResponse {
  conversation: ConversationSummaryDto;
  messages: MessageItemDto[];
  customer_360: {
    id: string;
    name: string;
    phone?: string;
    email?: string;
    status: string;
    lead_score: number;
    stage_name?: string;
  } | null;
  timeline: Array<{
    id: string;
    title: string;
    content?: string;
    created_at?: string;
  }>;
}

export const MarketingSocialBotPage: React.FC = () => {
  const { token, tenantSlug } = useAuth();
  const { terminology, hasModule } = useEntitlement();
  const hasSaleRounds = hasModule('rounds');

  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'inbox' | 'bot_studio'>('inbox');
  const [conversations, setConversations] = useState<ConversationSummaryDto[]>([]);
  const [selectedConvId, setSelectedConvId] = useState<string | null>(null);
  const [detail, setDetail] = useState<ConversationDetailResponse | null>(null);
  const [replyText, setReplyText] = useState('');

  // Bot Studio State
  const [botCfg, setBotCfg] = useState<BotConfigDto>({
    bot_name: 'DOM Agent CSKH',
    brand_persona: '',
    welcome_message: '',
    faq_rules: [],
    auto_extract_contact: true,
    routing_mode: 'audience',
    target_audience_id: null,
    distribution_round_id: null,
    is_active: true,
  });
  const [audiences, setAudiences] = useState<Array<{ id: string; name: string }>>([]);
  const [rounds, setRounds] = useState<Array<{ id: string; name: string }>>([]);
  const [vaultChannels, setVaultChannels] = useState<{
    zalo_oa: { configured: boolean };
    messenger: { configured: boolean };
  }>();

  // Simulate Inbound Chat Modal
  const [simModalOpen, setSimModalOpen] = useState(false);
  const [simChannel, setSimChannel] = useState<'messenger' | 'zalo_oa'>('messenger');
  const [simCustomer, setSimCustomer] = useState('Trần Bảo Ngọc');
  const [simMessage, setSimMessage] = useState('Cho mình hỏi bảng giá dịch vụ, SĐT mình là 0912888999 nhé!');

  const fetchOverview = useCallback(async () => {
    return apiRequest<{
      bot_config: BotConfigDto;
      conversations: ConversationSummaryDto[];
      audiences: Array<{ id: string; name: string }>;
      rounds: Array<{ id: string; name: string }>;
      vault_channels: { zalo_oa: { configured: boolean }; messenger: { configured: boolean } };
    }>('/marketing/social-bot', { token, tenantSlug });
  }, [token, tenantSlug]);

  const loadConversationDetail = useCallback(
    async (convId: string) => {
      try {
        const d = await apiRequest<ConversationDetailResponse>(
          `/marketing/social-bot/conversations/${convId}`,
          { token, tenantSlug }
        );
        setDetail(d);
      } catch {
        // Ignore
      }
    },
    [token, tenantSlug]
  );

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const ov = await fetchOverview();
      setBotCfg(ov.bot_config);
      setConversations(ov.conversations || []);
      setAudiences(ov.audiences || []);
      setRounds(ov.rounds || []);
      setVaultChannels(ov.vault_channels);
      const firstId = selectedConvId || ov.conversations?.[0]?.id || null;
      if (firstId) {
        setSelectedConvId(firstId);
        await loadConversationDetail(firstId);
      }
    } catch (err) {
      toast.error(getErrorMessage(err, 'Không thể tải Hộp thư Đa kênh & AI Bot Studio.'));
    } finally {
      setLoading(false);
    }
  }, [fetchOverview, loadConversationDetail, selectedConvId]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const ov = await fetchOverview();
        if (cancelled) return;
        setBotCfg(ov.bot_config);
        setConversations(ov.conversations || []);
        setAudiences(ov.audiences || []);
        setRounds(ov.rounds || []);
        setVaultChannels(ov.vault_channels);
        const firstId = ov.conversations?.[0]?.id || null;
        if (firstId) {
          setSelectedConvId(firstId);
          const d = await apiRequest<ConversationDetailResponse>(
            `/marketing/social-bot/conversations/${firstId}`,
            { token, tenantSlug }
          ).catch(() => null);
          if (!cancelled && d) setDetail(d);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [fetchOverview, token, tenantSlug]);

  const handleSelectConversation = async (id: string) => {
    setSelectedConvId(id);
    await loadConversationDetail(id);
  };

  const handleSendAgentReply = async () => {
    if (!selectedConvId || !replyText.trim()) return;
    try {
      await apiRequest(`/marketing/social-bot/conversations/${selectedConvId}/messages`, {
        method: 'POST',
        token,
        tenantSlug,
        body: { content: replyText.trim(), sender_type: 'agent' },
      });
      setReplyText('');
      await loadConversationDetail(selectedConvId);
    } catch (err) {
      toast.error(getErrorMessage(err, 'Không thể gửi tin nhắn phản hồi.'));
    }
  };

  const handlePushLeadOneClick = async (mode: 'audience' | 'sale_round') => {
    if (!selectedConvId) return;
    try {
      await apiRequest(`/marketing/social-bot/conversations/${selectedConvId}/push-lead`, {
        method: 'POST',
        token,
        tenantSlug,
        body: {
          mode,
          audience_id: botCfg.target_audience_id,
          round_id: botCfg.distribution_round_id,
        },
      });
      toast.success(
        mode === 'sale_round'
          ? 'Đã đẩy khách hàng thẳng vào Vòng chia Sale Auto Data!'
          : 'Đã đồng bộ khách hàng vào Tệp Marketing!'
      );
      await loadConversationDetail(selectedConvId);
      await reload();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Không thể đẩy hồ sơ.'));
    }
  };

  const handleSaveBotConfig = async () => {
    try {
      await apiRequest('/marketing/social-bot/bot-config', {
        method: 'PUT',
        token,
        tenantSlug,
        body: botCfg,
      });
      toast.success('Đã lưu cấu hình AI Bot Studio cô lập riêng cho doanh nghiệp!');
    } catch (err) {
      toast.error(getErrorMessage(err, 'Không thể lưu AI Bot Studio.'));
    }
  };

  const handleSimulateInbound = async () => {
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
          customer_name: simCustomer,
          content: simMessage,
        },
      });
      toast.success(
        res.extracted_entities.phone || res.extracted_entities.email
          ? `AI Bot đã tự phản hồi & bóc tách SĐT/Email (${res.extracted_entities.phone || res.extracted_entities.email})!`
          : 'AI Bot đã tự động phản hồi tin nhắn khách hàng!'
      );
      setSimModalOpen(false);
      setSelectedConvId(res.conversation_id);
      await reload();
      await loadConversationDetail(res.conversation_id);
    } catch (err) {
      toast.error(getErrorMessage(err, 'Không thể mô phỏng tin nhắn đến.'));
    }
  };

  if (loading) {
    return (
      <AutoDataLoadingModal
        inline
        isOpen
        message="Đang tải Hộp Thư Đa Kênh (Messenger & Zalo OA) & AI Bot Studio..."
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
              <Bot size={22} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <h1 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0F172A', margin: 0 }}>
                  Social Bot (Facebook Messenger & Zalo OA) & AI Bot Studio
                </h1>
                <Badge tone="primary" icon={<ShieldCheck size={12} />}>
                  Tenant-Isolated RAG
                </Badge>
                {vaultChannels?.zalo_oa.configured && <Badge tone="info">Zalo OA Vault</Badge>}
                {vaultChannels?.messenger.configured && <Badge tone="success">Messenger Vault</Badge>}
              </div>
              <p style={{ fontSize: '0.8rem', color: '#64748B', marginTop: 3 }}>
                Hộp thư hợp nhất kèm Ngăn kéo {terminology.customerLabel} 360° & tự động bóc tách SĐT/Email đẩy vào Tệp hoặc Vòng chia Sale.
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            <ScreenHelpButton screenKey="mkt_social_bot" />
            <button type="button" onClick={() => void reload()} className="btn secondary" style={{ height: 44 }}>
              <RefreshCw size={15} />
            </button>
            <button
              type="button"
              onClick={() => setSimModalOpen(true)}
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
              <Sparkles size={15} /> Mô Phỏng Khách Nhắn Tin
            </button>
          </div>
        </div>
      </Card>

      <PillTabs
        tabs={[
          { key: 'inbox', label: 'Hộp Thư Hợp Nhất & Hồ Sơ 360°', icon: <MessageSquare size={15} />, count: conversations.length },
          { key: 'bot_studio', label: 'AI Bot Studio (FAQ / RAG & Định Tuyến SĐT)', icon: <Bot size={15} />, count: botCfg.faq_rules.length },
        ]}
        activeKey={tab}
        onChange={setTab}
      />

      {tab === 'inbox' ? (
        conversations.length === 0 ? (
          <EmptyState
            icon={<MessageCircle size={24} />}
            title="Chưa có hội thoại Messenger / Zalo OA nào"
            description="Nhấn nút 'Mô Phỏng Khách Nhắn Tin' ở góc phải để kiểm chứng AI Bot tự trả lời & bóc tách SĐT đẩy vào Hồ sơ 360°."
          />
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '290px 1fr 320px', gap: '1rem', alignItems: 'start' }}>
            {/* Left: Conversations List */}
            <Card title="Danh Sách Hội Thoại">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {conversations.map((c) => {
                  const isSel = c.id === selectedConvId;
                  return (
                    <div
                      key={c.id}
                      onClick={() => void handleSelectConversation(c.id)}
                      style={{
                        padding: '0.75rem',
                        borderRadius: 12,
                        background: isSel ? '#EFF6FF' : '#FFFFFF',
                        border: isSel ? '1.5px solid #1E40FF' : '1px solid #E2E8F0',
                        cursor: 'pointer',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontWeight: 700, fontSize: '0.85rem' }}>{c.customer_name}</span>
                        <Badge tone={c.channel === 'zalo_oa' ? 'info' : 'primary'}>
                          {c.channel === 'zalo_oa' ? 'Zalo OA' : 'Messenger'}
                        </Badge>
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: 4 }}>
                        {c.last_message_preview}
                      </div>
                      {(c.extracted_phone || c.extracted_email) && (
                        <div style={{ marginTop: 6 }}>
                          <Badge tone="success">{c.extracted_phone || c.extracted_email}</Badge>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </Card>

            {/* Center: Active Thread Messages */}
            <Card
              title={detail ? `Hội thoại với ${detail.conversation.customer_name}` : 'Nội dung Trò chuyện'}
              subtitle={detail ? `Kênh: ${detail.conversation.channel.toUpperCase()}` : undefined}
            >
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 8,
                  minHeight: 320,
                  maxHeight: 420,
                  overflowY: 'auto',
                  padding: '0.75rem',
                  borderRadius: 14,
                  background: '#F8F9FA',
                  border: '1px solid #E2E8F0',
                }}
              >
                {(detail?.messages || []).map((m) => (
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
                    <div style={{ fontSize: '0.68rem', fontWeight: 700, opacity: 0.78, marginBottom: 2 }}>
                      {m.sender_name} ({m.sender_type})
                    </div>
                    <div style={{ fontSize: '0.83rem', lineHeight: 1.5 }}>{m.content}</div>
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                <input
                  className="form-input"
                  style={{ height: 44 }}
                  placeholder="Nhập tin nhắn phản hồi trực tiếp..."
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') void handleSendAgentReply();
                  }}
                />
                <button
                  type="button"
                  onClick={() => void handleSendAgentReply()}
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
              </div>
            </Card>

            {/* Right: Customer 360° Timeline Drawer */}
            <Card
              title={`Hồ Sơ ${terminology.customerLabel} 360°`}
              subtitle="Đồng bộ tức thì với Master Contact & CRM"
            >
              {detail?.customer_360 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div style={{ padding: '0.8rem', borderRadius: 12, background: '#F8FAFC', border: '1px solid #E2E8F0' }}>
                    <div style={{ fontWeight: 800, fontSize: '0.92rem' }}>{detail.customer_360.name}</div>
                    <div style={{ fontSize: '0.78rem', color: '#475569', marginTop: 3 }}>
                      SĐT: {detail.customer_360.phone || '—'} • Email: {detail.customer_360.email || '—'}
                    </div>
                    <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
                      <Badge tone="primary">Lead Score: {detail.customer_360.lead_score}</Badge>
                      <Badge tone="info">{detail.customer_360.status}</Badge>
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <button
                      type="button"
                      onClick={() => void handlePushLeadOneClick('audience')}
                      className="btn secondary"
                      style={{ height: 40, color: '#1E40FF', fontSize: '0.8rem' }}
                    >
                      <UserPlus size={14} style={{ display: 'inline', marginRight: 5 }} />
                      Đưa 1 chạm vào Tệp Marketing
                    </button>
                    <button
                      type="button"
                      onClick={() => void handlePushLeadOneClick('sale_round')}
                      style={{
                        height: 40,
                        borderRadius: 12,
                        border: 'none',
                        background: '#1E40FF',
                        color: '#FFFFFF',
                        fontWeight: 700,
                        fontSize: '0.8rem',
                        cursor: 'pointer',
                      }}
                    >
                      {hasSaleRounds ? 'Đẩy 1 Chạm Vào Vòng Chia Sale' : 'Chuyển Hàng Đợi Kinh Doanh'}
                    </button>
                  </div>

                  <div style={{ borderTop: '1px solid #E2E8F0', paddingTop: 8 }}>
                    <div style={{ fontSize: '0.76rem', fontWeight: 700, color: '#475569', marginBottom: 6 }}>
                      Dòng Thời Gian Tương Tác 360°
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 210, overflowY: 'auto' }}>
                      {detail.timeline.map((ev) => (
                        <div
                          key={ev.id}
                          style={{
                            padding: '0.5rem 0.65rem',
                            borderRadius: 10,
                            background: '#FFFFFF',
                            border: '1px solid #E2E8F0',
                            fontSize: '0.75rem',
                          }}
                        >
                          <div style={{ fontWeight: 700 }}>{ev.title}</div>
                          <div style={{ color: '#64748B', fontSize: '0.7rem' }}>{formatShortDate(ev.created_at)}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div style={{ fontSize: '0.8rem', color: '#64748B' }}>
                  Chưa có SĐT hoặc Email trong hội thoại này. Ngay khi khách nhắn SĐT/Email, AI Bot sẽ tự động khâu vào Hồ sơ 360°!
                </div>
              )}
            </Card>
          </div>
        )
      ) : (
        /* AI Bot Studio */
        <Card
          title="AI Bot Studio — Huấn Luyện Tri Thức FAQ / RAG Cô Lập Theo Doanh Nghiệp"
          actions={
            <button
              type="button"
              onClick={() => void handleSaveBotConfig()}
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
              <Save size={15} /> Lưu Cấu Hình AI Bot
            </button>
          }
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 12 }}>
              <div>
                <label className="form-label" style={{ fontWeight: 700 }}>Tên hiển thị Trợ lý AI</label>
                <input
                  className="form-input"
                  style={{ height: 44 }}
                  value={botCfg.bot_name}
                  onChange={(e) => setBotCfg((prev) => ({ ...prev, bot_name: e.target.value }))}
                />
              </div>
              <div>
                <label className="form-label" style={{ fontWeight: 700 }}>Phong cách thương hiệu (Brand Persona)</label>
                <input
                  className="form-input"
                  style={{ height: 44 }}
                  value={botCfg.brand_persona}
                  onChange={(e) => setBotCfg((prev) => ({ ...prev, brand_persona: e.target.value }))}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
              <div>
                <label className="form-label" style={{ fontWeight: 700 }}>Khi trích xuất được SĐT/Email từ Chat</label>
                <select
                  className="form-input"
                  style={{ height: 44 }}
                  value={botCfg.routing_mode}
                  onChange={(e) =>
                    setBotCfg((prev) => ({
                      ...prev,
                      routing_mode: e.target.value as BotConfigDto['routing_mode'],
                    }))
                  }
                >
                  <option value="audience">Đưa tự động vào Tệp Marketing</option>
                  <option value="sale_round">Đẩy thẳng vào Vòng chia Sale Auto Data</option>
                  <option value="none">Chỉ lưu Hồ sơ 360°</option>
                </select>
              </div>
              <div>
                <label className="form-label" style={{ fontWeight: 700 }}>Tệp Khách hàng đích</label>
                <select
                  className="form-input"
                  style={{ height: 44 }}
                  value={botCfg.target_audience_id || ''}
                  onChange={(e) => setBotCfg((prev) => ({ ...prev, target_audience_id: e.target.value || null }))}
                >
                  <option value="">— Chọn Tệp —</option>
                  {audiences.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="form-label" style={{ fontWeight: 700 }}>Vòng chia Sale đích</label>
                <select
                  className="form-input"
                  style={{ height: 44 }}
                  value={botCfg.distribution_round_id || ''}
                  onChange={(e) => setBotCfg((prev) => ({ ...prev, distribution_round_id: e.target.value || null }))}
                >
                  <option value="">— Vòng chia mặc định —</option>
                  {rounds.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <span style={{ fontWeight: 700, fontSize: '0.88rem' }}>Bộ Quy Tắc Tri Thức FAQ / RAG Riêng Của Tenant</span>
                <button
                  type="button"
                  onClick={() =>
                    setBotCfg((prev) => ({
                      ...prev,
                      faq_rules: [
                        ...prev.faq_rules,
                        {
                          id: crypto.randomUUID(),
                          keywords: ['ưu đãi'],
                          question: 'Câu hỏi mẫu mới?',
                          answer: 'Câu trả lời tự động chuẩn xác của doanh nghiệp.',
                        },
                      ],
                    }))
                  }
                  className="btn secondary sm"
                  style={{ height: 36, color: '#1E40FF' }}
                >
                  <Plus size={14} /> Thêm Cặp Hỏi - Đáp RAG
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {botCfg.faq_rules.map((rule, idx) => (
                  <div
                    key={rule.id}
                    style={{
                      padding: '0.85rem',
                      borderRadius: 12,
                      background: '#F8FAFC',
                      border: '1px solid #E2E8F0',
                      display: 'grid',
                      gridTemplateColumns: '1fr 1.5fr 40px',
                      gap: 8,
                    }}
                  >
                    <input
                      className="form-input"
                      style={{ height: 40, background: '#FFFFFF' }}
                      placeholder="Từ khóa nhận diện (phẩy cách)..."
                      value={(rule.keywords || []).join(', ')}
                      onChange={(e) =>
                        setBotCfg((prev) => ({
                          ...prev,
                          faq_rules: prev.faq_rules.map((r, i) =>
                            i === idx
                              ? {
                                  ...r,
                                  keywords: e.target.value
                                    .split(',')
                                    .map((s) => s.trim())
                                    .filter(Boolean),
                                }
                              : r
                          ),
                        }))
                      }
                    />
                    <input
                      className="form-input"
                      style={{ height: 40, background: '#FFFFFF' }}
                      placeholder="Câu trả lời tự động của AI Bot..."
                      value={rule.answer}
                      onChange={(e) =>
                        setBotCfg((prev) => ({
                          ...prev,
                          faq_rules: prev.faq_rules.map((r, i) => (i === idx ? { ...r, answer: e.target.value } : r)),
                        }))
                      }
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setBotCfg((prev) => ({
                          ...prev,
                          faq_rules: prev.faq_rules.filter((_, i) => i !== idx),
                        }))
                      }
                      className="btn secondary sm"
                      style={{ height: 40, color: '#DC2626' }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Simulate Inbound Customer Message Modal */}
      <CustomModal
        isOpen={simModalOpen}
        onClose={() => setSimModalOpen(false)}
        title="Mô Phỏng Tin Nhắn Khách Hàng Từ Messenger / Zalo OA"
        width={520}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <select
              className="form-input"
              style={{ height: 44 }}
              value={simChannel}
              onChange={(e) => setSimChannel(e.target.value as 'messenger' | 'zalo_oa')}
            >
              <option value="messenger">Facebook Messenger</option>
              <option value="zalo_oa">Zalo Official Account (OA)</option>
            </select>
            <input
              className="form-input"
              style={{ height: 44 }}
              placeholder="Tên khách hàng..."
              value={simCustomer}
              onChange={(e) => setSimCustomer(e.target.value)}
            />
          </div>
          <textarea
            className="form-input"
            rows={3}
            style={{ padding: '0.65rem' }}
            value={simMessage}
            onChange={(e) => setSimMessage(e.target.value)}
          />
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <button type="button" onClick={() => setSimModalOpen(false)} className="btn secondary" style={{ height: 44 }}>
              Đóng
            </button>
            <button
              type="button"
              onClick={() => void handleSimulateInbound()}
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
              Gửi Vào Hộp Thư & Chạy AI Bot
            </button>
          </div>
        </div>
      </CustomModal>
    </div>
  );
};

export default MarketingSocialBotPage;
