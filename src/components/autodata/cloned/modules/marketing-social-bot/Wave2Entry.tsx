import React, { useCallback, useEffect, useState } from 'react';
import {
  Bot,
  GitBranch,
  MessageSquare,
  RefreshCw,
  ShieldCheck,
  Smartphone,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { Badge, Card, PillTabs } from '../../components/ui/AutoDataLoadingModal';
import { ScreenHelpButton } from '../../components/ui/ScreenHelpButton';
import { SplitChatPanelSkeleton } from '../../components/ui/Skeleton';
import { apiRequest, getErrorMessage } from '../../../autodataApi';
import { useAuth } from '../../contexts/AuthContext';
import { useEntitlement } from '../../contexts/EntitlementContext';
import { AITrainingStudio } from './AITrainingStudio';
import { ScenarioManagerTab } from './ScenarioModal';
import { UnifiedChat } from './UnifiedChat';
import { ZaloBroadcastTab } from './ZaloBroadcastTab';
import type { BotConfigDto, ConversationSummaryDto } from './socialBotTypes';

type SocialBotMainTab = 'inbox' | 'scenarios' | 'zalo_hub' | 'ai_training';

export const MarketingSocialBotPage: React.FC = () => {
  const { token, tenantSlug } = useAuth();
  const { terminology } = useEntitlement();

  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<SocialBotMainTab>('inbox');
  const [conversations, setConversations] = useState<ConversationSummaryDto[]>([]);
  const [botCfg, setBotCfg] = useState<BotConfigDto>({
    bot_name: 'DOM Agent CSKH',
    brand_persona: 'Tận tâm, chuyên nghiệp, phản hồi ngắn gọn đúng trọng tâm.',
    welcome_message: 'Xin chào! DOM Agent có thể hỗ trợ gì cho bạn hôm nay?',
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
  const [scenarioCount, setScenarioCount] = useState<number>(0);
  const [docsCount, setDocsCount] = useState<number>(0);

  const fetchOverview = useCallback(async () => {
    return apiRequest<{
      bot_config: BotConfigDto;
      conversations: ConversationSummaryDto[];
      audiences: Array<{ id: string; name: string }>;
      rounds: Array<{ id: string; name: string }>;
      vault_channels: { zalo_oa: { configured: boolean }; messenger: { configured: boolean } };
    }>('/marketing/social-bot', { token, tenantSlug });
  }, [token, tenantSlug]);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const ov = await fetchOverview();
      setBotCfg(ov.bot_config);
      setConversations(ov.conversations || []);
      setAudiences(ov.audiences || []);
      setRounds(ov.rounds || []);
      setVaultChannels(ov.vault_channels);
    } catch (err) {
      toast.error(getErrorMessage(err, 'Không thể tải Hộp thư Đa kênh & DOM Agent Studio.'));
    } finally {
      setLoading(false);
    }
  }, [fetchOverview]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [ov, scRes, docRes] = await Promise.all([
          fetchOverview(),
          apiRequest<{ items?: unknown[] }>('/marketing/social-bot/scenarios', {
            token,
            tenantSlug,
          }).catch(() => ({ items: [] })),
          apiRequest<{ items?: unknown[] }>('/marketing/social-bot/training-docs', {
            token,
            tenantSlug,
          }).catch(() => ({ items: [] })),
        ]);
        if (cancelled) return;
        setBotCfg(ov.bot_config);
        setConversations(ov.conversations || []);
        setAudiences(ov.audiences || []);
        setRounds(ov.rounds || []);
        setVaultChannels(ov.vault_channels);
        setScenarioCount((scRes.items || []).length);
        setDocsCount((docRes.items || []).length);
      } catch (err) {
        if (!cancelled) {
          toast.error(getErrorMessage(err, 'Không thể tải Hộp thư Đa kênh & DOM Agent Studio.'));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [fetchOverview, token, tenantSlug]);

  if (loading) {
    return <SplitChatPanelSkeleton />;
  }

  const unreadTotal = conversations.reduce((s, c) => s + (c.unread_count || 0), 0);
  const extractedLeadsCount = conversations.filter(
    (c) => Boolean(c.extracted_phone || c.extracted_email || c.lead_id)
  ).length;

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
                  Omnichannel Social Bot (Messenger, Zalo OA, WebChat) & DOM Agent RAG Studio
                </h1>
                <Badge tone="primary" icon={<ShieldCheck size={12} />}>
                  Tenant-Isolated RAG
                </Badge>
                {vaultChannels?.zalo_oa.configured && <Badge tone="info">Zalo OA Vault</Badge>}
                {vaultChannels?.messenger.configured && <Badge tone="success">Messenger Vault</Badge>}
              </div>
              <p style={{ fontSize: '0.8rem', color: '#64748B', marginTop: 3, marginBottom: 0 }}>
                Hộp thư hợp nhất kèm Ngăn kéo {terminology.customerLabel} 360°, Kịch bản tự động Node-Edge, Zalo ZNS/ZBS Broadcast & Huấn luyện tri thức AI.
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            <ScreenHelpButton screenKey="mkt_social_bot" />
            <button type="button" onClick={() => void reload()} className="btn secondary" style={{ height: 44 }}>
              <RefreshCw size={15} />
            </button>
          </div>
        </div>
      </Card>

      {/* 4 KPI Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
        <Card padding="1.05rem 1.25rem">
          <div style={{ fontSize: '0.74rem', fontWeight: 700, color: '#64748B' }}>LUỒNG HỘI THOẠI ĐA KÊNH</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#1E40FF', marginTop: 4 }}>
            {conversations.length.toLocaleString('vi-VN')}
            {unreadTotal > 0 && (
              <span style={{ fontSize: '0.8rem', color: '#DC2626', marginLeft: 8 }}>
                ({unreadTotal} chưa đọc)
              </span>
            )}
          </div>
        </Card>
        <Card padding="1.05rem 1.25rem">
          <div style={{ fontSize: '0.74rem', fontWeight: 700, color: '#64748B' }}>ĐÃ BÓC TÁCH SĐT / EMAIL 360°</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#059669', marginTop: 4 }}>
            {extractedLeadsCount.toLocaleString('vi-VN')}
          </div>
        </Card>
        <Card padding="1.05rem 1.25rem">
          <div style={{ fontSize: '0.74rem', fontWeight: 700, color: '#64748B' }}>KỊCH BẢN TỰ ĐỘNG NODE-EDGE</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0284C7', marginTop: 4 }}>
            {scenarioCount.toLocaleString('vi-VN')}
          </div>
        </Card>
        <Card padding="1.05rem 1.25rem">
          <div style={{ fontSize: '0.74rem', fontWeight: 700, color: '#64748B' }}>TRI THỨC FAQ & RAG DOCS</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0F172A', marginTop: 4 }}>
            {(botCfg.faq_rules.length + docsCount).toLocaleString('vi-VN')}
          </div>
        </Card>
      </div>

      <PillTabs
        tabs={[
          { key: 'inbox', label: 'Hộp Thư Đa Kênh & Hồ Sơ 360°', icon: <MessageSquare size={15} />, count: conversations.length },
          { key: 'scenarios', label: 'Kịch Bản Tự Động (Scenario Canvas)', icon: <GitBranch size={15} />, count: scenarioCount },
          { key: 'zalo_hub', label: 'Zalo OA, ZNS Templates & Broadcast', icon: <Smartphone size={15} /> },
          { key: 'ai_training', label: 'AI Training & RAG Sandbox', icon: <Bot size={15} />, count: botCfg.faq_rules.length + docsCount },
        ]}
        activeKey={tab}
        onChange={setTab}
      />

      {tab === 'inbox' && (
        <UnifiedChat
          conversations={conversations}
          audiences={audiences}
          rounds={rounds}
          botCfg={botCfg}
          onReloadOverview={reload}
        />
      )}

      {tab === 'scenarios' && <ScenarioManagerTab onCountChange={setScenarioCount} />}

      {tab === 'zalo_hub' && <ZaloBroadcastTab audiences={audiences} />}

      {tab === 'ai_training' && (
        <AITrainingStudio
          botCfg={botCfg}
          onChangeBotCfg={setBotCfg}
          audiences={audiences}
          rounds={rounds}
          onDocsCountChange={setDocsCount}
        />
      )}
    </div>
  );
};

export default MarketingSocialBotPage;
