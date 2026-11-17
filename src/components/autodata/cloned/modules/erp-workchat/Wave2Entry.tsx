import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Award,
  Bell,
  CornerDownRight,
  FileText,
  Hash,
  Heart,
  Megaphone,
  MessageCircle,
  Paperclip,
  Pin,
  Plus,
  RefreshCw,
  Search,
  Send,
  Smile,
  Sparkles,
  Trophy,
  Users,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { CustomModal } from '../../components/ui/CustomModal';
import { ScreenHelpButton } from '../../components/ui/ScreenHelpButton';
import {
  AutoDataLoadingModal,
  Badge,
  Card,
  EmptyState,
  FormCard,
  PillTabs,
} from '../../components/ui/AutoDataLoadingModal';
import {
  apiRequest,
  formatShortDate,
  getErrorMessage,
} from '../../../autodataApi';
import { useAuth } from '../../contexts/AuthContext';
import { useEntitlement } from '../../contexts/EntitlementContext';

type WorkChatMainTab = 'chat' | 'feed' | 'kudos';

interface StickerPackItem {
  id: string;
  name: string;
  count: number;
  is_mascot_pack?: boolean;
  sample_emojis: string[];
}

interface WorkStatusBadgeItem {
  id: string;
  label: string;
  badge_text: string;
  icon: string;
  tone: 'success' | 'primary' | 'warning' | 'danger' | 'info' | 'purple';
}

interface ChannelItem {
  id: string;
  name: string;
  channel_type: string;
  topic?: string | null;
  department_name?: string | null;
  project_name?: string | null;
  last_message_preview?: string | null;
  last_message_at?: string | null;
  message_count: number;
}

interface AttachmentCard {
  kind: 'file' | 'voucher' | 'task_card';
  title: string;
  code?: string;
}

interface ChatMessageItem {
  id: string;
  channel_id: string;
  sender_user_id?: string | null;
  sender_name: string;
  parent_message_id?: string | null;
  parent_sender_name?: string | null;
  parent_content?: string | null;
  message_type: 'text' | 'sticker' | 'work_badge' | 'attachment' | 'card_link';
  content: string;
  sticker_pack_id?: string | null;
  sticker_id?: string | null;
  attachments: AttachmentCard[];
  reactions: Record<string, string[]>;
  is_pinned: boolean;
  created_at: string;
  channel_name?: string;
}

interface PresenceItem {
  user_id: string;
  full_name: string;
  role: string;
  status: 'online' | 'busy' | 'away' | 'offline';
  status_text?: string | null;
}

interface FeedPostItem {
  id: string;
  author_name: string;
  title?: string | null;
  content: string;
  post_type: string;
  department_name?: string | null;
  branch_name?: string | null;
  is_pinned: boolean;
  likes_count: number;
  comments_count: number;
  created_at: string;
}

interface FeedCommentItem {
  id: string;
  author_name: string;
  content: string;
  created_at: string;
}

interface KudosRecognitionItem {
  id: string;
  sender_name: string;
  recipient_name: string;
  badge_title: string;
  points: number;
  message: string;
  created_at: string;
}

interface KudosLeaderItem {
  rank: number;
  user_id: string;
  full_name: string;
  kudos_count: number;
  total_points: number;
}

interface WorkChatBootstrapResponse {
  enable_ideas_mascot: boolean;
  sticker_packs: StickerPackItem[];
  work_status_badges: WorkStatusBadgeItem[];
  channels: ChannelItem[];
  presence: PresenceItem[];
  staff: Array<{ id: string; full_name: string; email: string; role: string }>;
  departments: Array<{ id: string; name: string; code: string }>;
}

const QUICK_REACTIONS = ['👍', '❤️', '🚀', '👏', '🔥', '✅'];

export const ErpWorkChatWave2Entry: React.FC = () => {
  const { token, tenantSlug, user } = useAuth();
  const { enableIdeasMascot, packageMeta, scope, can } = useEntitlement();
  const canCreate = can('erp_workchat', 'create');

  const [mainTab, setMainTab] = useState<WorkChatMainTab>('chat');
  const [loading, setLoading] = useState(true);
  const [bootstrap, setBootstrap] = useState<WorkChatBootstrapResponse | null>(null);
  const [activeChannelId, setActiveChannelId] = useState<string>('');
  const [messages, setMessages] = useState<ChatMessageItem[]>([]);
  const [feedPosts, setFeedPosts] = useState<FeedPostItem[]>([]);
  const [kudosList, setKudosList] = useState<KudosRecognitionItem[]>([]);
  const [leaderboard, setLeaderboard] = useState<KudosLeaderItem[]>([]);

  // Composer & Stickers & Attachments
  const [composerText, setComposerText] = useState('');
  const [replyTo, setReplyTo] = useState<ChatMessageItem | null>(null);
  const [stickerDrawerOpen, setStickerDrawerOpen] = useState(false);
  const [selectedPackId, setSelectedPackId] = useState('ghost');
  const [pendingAttachments, setPendingAttachments] = useState<AttachmentCard[]>([]);
  const [pinnedFilterOnly, setPinnedFilterOnly] = useState(false);

  // Search Messages
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<ChatMessageItem[] | null>(null);

  // Presence selector
  const [myPresence, setMyPresence] = useState<'online' | 'busy' | 'away'>('online');

  // Create Channel Modal
  const [channelModalOpen, setChannelModalOpen] = useState(false);
  const [newChannelName, setNewChannelName] = useState('');
  const [newChannelType, setNewChannelType] = useState('department');
  const [newChannelDeptId, setNewChannelDeptId] = useState('');
  const [newChannelTopic, setNewChannelTopic] = useState('');

  // Feed Modal & Comments Drawer
  const [feedModalOpen, setFeedModalOpen] = useState(false);
  const [feedTitle, setFeedTitle] = useState('');
  const [feedContent, setFeedContent] = useState('');
  const [feedDeptId, setFeedDeptId] = useState('');
  const [feedPinned, setFeedPinned] = useState(true);
  const [activeFeedPost, setActiveFeedPost] = useState<FeedPostItem | null>(null);
  const [feedComments, setFeedComments] = useState<FeedCommentItem[]>([]);
  const [newFeedComment, setNewFeedComment] = useState('');

  // Kudos Modal
  const [kudosModalOpen, setKudosModalOpen] = useState(false);
  const [kudosRecipientId, setKudosRecipientId] = useState('');
  const [kudosBadgeTitle, setKudosBadgeTitle] = useState('Chiến binh Tận tâm');
  const [kudosPoints, setKudosPoints] = useState('20');
  const [kudosMessage, setKudosMessage] = useState('');

  const fetchChannelMessages = useCallback(
    async (channelId: string) => {
      if (!channelId) return [];
      const res = await apiRequest<{ items: ChatMessageItem[] }>(`/workchat/channels/${channelId}/messages`, {
        token,
        tenantSlug,
      });
      return res.items || [];
    },
    [token, tenantSlug]
  );

  const fetchBundle = useCallback(async () => {
    const [boot, feedRes, kudosRes] = await Promise.all([
      apiRequest<WorkChatBootstrapResponse>('/workchat/bootstrap', { token, tenantSlug }),
      apiRequest<{ items: FeedPostItem[] }>('/workchat/feed', { token, tenantSlug }),
      apiRequest<{ items: KudosRecognitionItem[]; leaderboard: KudosLeaderItem[] }>('/workchat/kudos', {
        token,
        tenantSlug,
      }),
    ]);
    const firstChannelId = boot.channels[0]?.id || '';
    const msgs = firstChannelId ? await fetchChannelMessages(firstChannelId) : [];
    return { boot, feed: feedRes.items || [], kudos: kudosRes, firstChannelId, msgs };
  }, [token, tenantSlug, fetchChannelMessages]);

  const applyBundle = useCallback((b: Awaited<ReturnType<typeof fetchBundle>>) => {
    setBootstrap(b.boot);
    setFeedPosts(b.feed);
    setKudosList(b.kudos.items || []);
    setLeaderboard(b.kudos.leaderboard || []);
    if (b.firstChannelId) {
      setActiveChannelId((prev) => prev || b.firstChannelId);
      setMessages(b.msgs);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const bundle = await fetchBundle();
        if (!cancelled) applyBundle(bundle);
      } catch (err) {
        if (!cancelled) toast.error(getErrorMessage(err, 'Không thể tải không gian WorkChat'));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [fetchBundle, applyBundle]);

  // Enforce Mascot IDEAS Hidden Rule on Frontend (`enableIdeasMascot === false` hides `'ideas'` pack)
  const visibleStickerPacks = useMemo<StickerPackItem[]>(() => {
    const raw = bootstrap?.sticker_packs || [];
    if (!enableIdeasMascot) {
      return raw.filter((p) => p.id !== 'ideas' && !p.is_mascot_pack);
    }
    return raw;
  }, [bootstrap?.sticker_packs, enableIdeasMascot]);

  const activeStickerPack = useMemo(
    () => visibleStickerPacks.find((p) => p.id === selectedPackId) || visibleStickerPacks[0] || null,
    [visibleStickerPacks, selectedPackId]
  );

  const activeChannel = useMemo(
    () => (bootstrap?.channels || []).find((c) => c.id === activeChannelId) || null,
    [bootstrap?.channels, activeChannelId]
  );

  const displayedMessages = useMemo(
    () => (pinnedFilterOnly ? messages.filter((m) => m.is_pinned) : messages),
    [messages, pinnedFilterOnly]
  );

  const handleSelectChannel = async (channelId: string) => {
    setActiveChannelId(channelId);
    setSearchResults(null);
    try {
      const msgs = await fetchChannelMessages(channelId);
      setMessages(msgs);
    } catch (err) {
      toast.error(getErrorMessage(err, 'Không thể tải tin nhắn kênh'));
    }
  };

  const handleSendTextMessage = async () => {
    if (!activeChannelId) return;
    if (!composerText.trim() && pendingAttachments.length === 0) return;
    try {
      const sent = await apiRequest<ChatMessageItem>(`/workchat/channels/${activeChannelId}/messages`, {
        method: 'POST',
        token,
        tenantSlug,
        body: {
          message_type: pendingAttachments.length > 0 ? 'card_link' : 'text',
          content: composerText.trim() || `Đính kèm: ${pendingAttachments[0]?.title || 'Tài liệu'}`,
          parent_message_id: replyTo?.id || null,
          attachments: pendingAttachments,
        },
      });
      setMessages((prev) => [...prev, sent]);
      setComposerText('');
      setPendingAttachments([]);
      setReplyTo(null);
    } catch (err) {
      toast.error(getErrorMessage(err, 'Không thể gửi tin nhắn'));
    }
  };

  const handleSendQuickWorkBadge = async (badge: WorkStatusBadgeItem) => {
    if (!activeChannelId) return;
    try {
      const sent = await apiRequest<ChatMessageItem>(`/workchat/channels/${activeChannelId}/messages`, {
        method: 'POST',
        token,
        tenantSlug,
        body: {
          message_type: 'work_badge',
          sticker_id: badge.id,
          content: `${badge.icon} ${badge.badge_text}`,
          parent_message_id: replyTo?.id || null,
        },
      });
      setMessages((prev) => [...prev, sent]);
      setReplyTo(null);
    } catch (err) {
      toast.error(getErrorMessage(err, 'Không thể gửi nhãn trạng thái'));
    }
  };

  const handleSendCommercialSticker = async (pack: StickerPackItem, emojiSample: string, idx: number) => {
    if (!activeChannelId) return;
    try {
      const sent = await apiRequest<ChatMessageItem>(`/workchat/channels/${activeChannelId}/messages`, {
        method: 'POST',
        token,
        tenantSlug,
        body: {
          message_type: 'sticker',
          sticker_pack_id: pack.id,
          sticker_id: `${pack.id}_${idx + 1}`,
          content: `${emojiSample} [${pack.name} #${idx + 1}]`,
          parent_message_id: replyTo?.id || null,
        },
      });
      setMessages((prev) => [...prev, sent]);
      setStickerDrawerOpen(false);
      setReplyTo(null);
    } catch (err) {
      toast.error(getErrorMessage(err, 'Không thể gửi Sticker'));
    }
  };

  const handleTogglePin = async (msg: ChatMessageItem) => {
    try {
      const res = await apiRequest<{ id: string; is_pinned: boolean }>(`/workchat/messages/${msg.id}/pin`, {
        method: 'PATCH',
        token,
        tenantSlug,
        body: { is_pinned: !msg.is_pinned },
      });
      setMessages((prev) => prev.map((m) => (m.id === msg.id ? { ...m, is_pinned: res.is_pinned } : m)));
      toast.success(res.is_pinned ? 'Đã ghim tin nhắn quan trọng' : 'Đã bỏ ghim tin nhắn');
    } catch (err) {
      toast.error(getErrorMessage(err, 'Không thể ghim tin nhắn'));
    }
  };

  const handleToggleReaction = async (msgId: string, emoji: string) => {
    try {
      const res = await apiRequest<{ id: string; reactions: Record<string, string[]> }>(
        `/workchat/messages/${msgId}/reactions`,
        {
          method: 'POST',
          token,
          tenantSlug,
          body: { emoji },
        }
      );
      setMessages((prev) => prev.map((m) => (m.id === msgId ? { ...m, reactions: res.reactions } : m)));
    } catch (err) {
      toast.error(getErrorMessage(err, 'Không thể thả biểu cảm'));
    }
  };

  const handleSearchMessages = async () => {
    if (!searchQuery.trim()) {
      setSearchResults(null);
      return;
    }
    try {
      const res = await apiRequest<{ items: ChatMessageItem[] }>(
        `/workchat/messages/search?q=${encodeURIComponent(searchQuery.trim())}`,
        { token, tenantSlug }
      );
      setSearchResults(res.items || []);
    } catch (err) {
      toast.error(getErrorMessage(err, 'Không thể tìm kiếm tin nhắn'));
    }
  };

  const handlePresenceChange = async (nextStatus: 'online' | 'busy' | 'away') => {
    setMyPresence(nextStatus);
    try {
      await apiRequest('/workchat/presence/heartbeat', {
        method: 'POST',
        token,
        tenantSlug,
        body: { status: nextStatus },
      });
      toast.success(`Trạng thái trực tuyến: ${nextStatus}`);
    } catch {
      // silent fallback
    }
  };

  const handleCreateChannel = async () => {
    if (!newChannelName.trim()) {
      toast.error('Vui lòng nhập tên kênh trò chuyện');
      return;
    }
    try {
      const created = await apiRequest<ChannelItem>('/workchat/channels', {
        method: 'POST',
        token,
        tenantSlug,
        body: {
          name: newChannelName.trim(),
          channel_type: newChannelType,
          department_id: newChannelDeptId || null,
          topic: newChannelTopic.trim() || null,
        },
      });
      toast.success('Đã tạo kênh WorkChat mới');
      setNewChannelName('');
      setChannelModalOpen(false);
      const bundle = await fetchBundle();
      applyBundle(bundle);
      await handleSelectChannel(created.id);
    } catch (err) {
      toast.error(getErrorMessage(err, 'Không thể tạo kênh mới'));
    }
  };

  const handleCreateFeedPost = async () => {
    if (!feedContent.trim()) {
      toast.error('Vui lòng nhập nội dung thông báo nội bộ');
      return;
    }
    try {
      await apiRequest('/workchat/feed', {
        method: 'POST',
        token,
        tenantSlug,
        body: {
          title: feedTitle.trim() || null,
          content: feedContent.trim(),
          department_id: feedDeptId || null,
          is_pinned: feedPinned,
          post_type: 'announcement',
        },
      });
      toast.success('Đã đăng thông báo lên Bảng tin Doanh nghiệp');
      setFeedTitle('');
      setFeedContent('');
      setFeedModalOpen(false);
      const bundle = await fetchBundle();
      applyBundle(bundle);
    } catch (err) {
      toast.error(getErrorMessage(err, 'Không thể đăng bài viết'));
    }
  };

  const handleLikeFeedPost = async (postId: string) => {
    try {
      const res = await apiRequest<{ id: string; likes_count: number }>(`/workchat/feed/${postId}/like`, {
        method: 'POST',
        token,
        tenantSlug,
        body: {},
      });
      setFeedPosts((prev) => prev.map((p) => (p.id === postId ? { ...p, likes_count: res.likes_count } : p)));
    } catch (err) {
      toast.error(getErrorMessage(err, 'Không thể thích bài viết'));
    }
  };

  const openFeedComments = async (post: FeedPostItem) => {
    setActiveFeedPost(post);
    try {
      const res = await apiRequest<{ items: FeedCommentItem[] }>(`/workchat/feed/${post.id}/comments`, {
        token,
        tenantSlug,
      });
      setFeedComments(res.items || []);
    } catch {
      setFeedComments([]);
    }
  };

  const handleSendFeedComment = async () => {
    if (!activeFeedPost || !newFeedComment.trim()) return;
    try {
      const created = await apiRequest<FeedCommentItem>(`/workchat/feed/${activeFeedPost.id}/comments`, {
        method: 'POST',
        token,
        tenantSlug,
        body: { content: newFeedComment.trim() },
      });
      setFeedComments((prev) => [...prev, created]);
      setNewFeedComment('');
      setFeedPosts((prev) =>
        prev.map((p) => (p.id === activeFeedPost.id ? { ...p, comments_count: p.comments_count + 1 } : p))
      );
    } catch (err) {
      toast.error(getErrorMessage(err, 'Không thể gửi bình luận'));
    }
  };

  const handleCreateKudos = async () => {
    if (!kudosRecipientId || !kudosMessage.trim()) {
      toast.error('Vui lòng chọn đồng nghiệp và nhập lời ghi nhận');
      return;
    }
    try {
      await apiRequest('/workchat/kudos', {
        method: 'POST',
        token,
        tenantSlug,
        body: {
          recipient_user_id: kudosRecipientId,
          badge_title: kudosBadgeTitle.trim(),
          points: Number(kudosPoints || 20),
          message: kudosMessage.trim(),
        },
      });
      toast.success('Đã gửi vinh danh lên Bảng vàng Kudos!');
      setKudosMessage('');
      setKudosModalOpen(false);
      const bundle = await fetchBundle();
      applyBundle(bundle);
    } catch (err) {
      toast.error(getErrorMessage(err, 'Không thể gửi vinh danh'));
    }
  };

  if (loading && !bootstrap) {
    return (
      <AutoDataLoadingModal
        inline
        isOpen
        message="Đang kết nối WorkChat Doanh nghiệp & Bảng tin Nội bộ..."
      />
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Header */}
      <Card
        padding="1.25rem 1.5rem"
        style={{ background: 'linear-gradient(135deg, #FFFFFF 0%, #F8FAFF 100%)' }}
      >
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: 16,
                background: '#EEF2FF',
                border: '1px solid #DBEAFE',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#1E40FF',
              }}
            >
              <MessageCircle size={24} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <h1 style={{ fontSize: '1.18rem', fontWeight: 800, color: '#0F172A', margin: 0 }}>
                  WorkChat Doanh Nghiệp, Bảng Tin Nội Bộ & Kudos Wall
                </h1>
                <Badge tone="primary">{packageMeta.shortName}</Badge>
                <Badge tone="success">
                  {visibleStickerPacks.length} Bộ Sticker • {bootstrap?.work_status_badges.length || 12} Nhãn công việc
                </Badge>
                <Badge tone="info">Scope: {scope('erp_workchat')}</Badge>
              </div>
              <p style={{ fontSize: '0.82rem', color: '#64748B', margin: '4px 0 0' }}>
                Phối hợp trực tuyến theo Phòng ban / Dự án, đính kèm thẻ công việc & chứng từ, truyền thông nội bộ và vinh danh nhân sự
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <select
              value={myPresence}
              onChange={(e) => handlePresenceChange(e.target.value as 'online' | 'busy' | 'away')}
              className="form-input"
              style={{ height: 40, borderRadius: 12, border: '1px solid #E2E8F0', padding: '0 10px', fontSize: '0.8rem' }}
            >
              <option value="online">🟢 Trực tuyến ({user?.name || 'Tôi'})</option>
              <option value="busy">🔴 Đang bận họp</option>
              <option value="away">🟡 Tạm vắng</option>
            </select>
            <ScreenHelpButton screenKey="erp_workchat" />
          </div>
        </div>
      </Card>

      {/* Main Navigation Tabs */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <PillTabs<WorkChatMainTab>
          activeKey={mainTab}
          onChange={setMainTab}
          tabs={[
            { key: 'chat', label: 'Kênh Trò Chuyện WorkChat', icon: <MessageCircle size={15} />, count: bootstrap?.channels.length || 0 },
            { key: 'feed', label: 'Bảng Tin Truyền Thông Nội Bộ', icon: <Megaphone size={15} />, count: feedPosts.length },
            { key: 'kudos', label: 'Bảng Vàng Vinh Danh Kudos', icon: <Trophy size={15} />, count: kudosList.length },
          ]}
        />

        {mainTab === 'chat' && canCreate && (
          <button
            type="button"
            onClick={() => setChannelModalOpen(true)}
            className="btn-inkica-primary"
            style={{
              height: 44,
              padding: '0 1.15rem',
              borderRadius: 14,
              border: 'none',
              color: '#FFFFFF',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <Plus size={16} /> Tạo kênh nhóm / phòng ban
          </button>
        )}
        {mainTab === 'feed' && canCreate && (
          <button
            type="button"
            onClick={() => setFeedModalOpen(true)}
            className="btn-inkica-primary"
            style={{
              height: 44,
              padding: '0 1.15rem',
              borderRadius: 14,
              border: 'none',
              color: '#FFFFFF',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <Bell size={16} /> Đăng thông báo công ty
          </button>
        )}
        {mainTab === 'kudos' && canCreate && (
          <button
            type="button"
            onClick={() => setKudosModalOpen(true)}
            className="btn-inkica-primary"
            style={{
              height: 44,
              padding: '0 1.15rem',
              borderRadius: 14,
              border: 'none',
              color: '#FFFFFF',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <Award size={16} /> Gửi Vinh Danh Đồng Nghiệp
          </button>
        )}
      </div>

      {/* TAB 1: WORKCHAT REAL-TIME WORKSPACE */}
      {mainTab === 'chat' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(250px, 300px) 1fr', gap: '1rem', alignItems: 'start' }}>
          {/* Left Channels & Presence Sidebar */}
          <Card padding="1rem" title="Danh sách Kênh" subtitle={`${bootstrap?.presence.length || 1} thành viên đang online`}>
            <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') void handleSearchMessages();
                }}
                placeholder="Tìm tin nhắn..."
                className="form-input"
                style={{ flex: 1, height: 38, borderRadius: 10, border: '1px solid #E2E8F0', padding: '0 10px', fontSize: '0.8rem' }}
              />
              <button
                type="button"
                onClick={handleSearchMessages}
                className="btn secondary"
                style={{ height: 38, padding: '0 10px' }}
              >
                <Search size={14} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {(bootstrap?.channels || []).map((ch) => {
                const isSelected = ch.id === activeChannelId;
                return (
                  <button
                    key={ch.id}
                    type="button"
                    onClick={() => handleSelectChannel(ch.id)}
                    style={{
                      textAlign: 'left',
                      padding: '0.7rem 0.85rem',
                      borderRadius: 14,
                      border: isSelected ? '1.5px solid #1E40FF' : '1px solid #E2E8F0',
                      background: isSelected ? '#EFF6FF' : '#FFFFFF',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 3,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6 }}>
                      <span style={{ fontWeight: 700, fontSize: '0.84rem', color: isSelected ? '#1E40FF' : '#0F172A' }}>
                        <Hash size={13} style={{ display: 'inline', marginRight: 3 }} />
                        {ch.name}
                      </span>
                      <Badge tone="neutral">{ch.message_count}</Badge>
                    </div>
                    {ch.last_message_preview && (
                      <span
                        style={{
                          fontSize: '0.74rem',
                          color: '#64748B',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {ch.last_message_preview}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            <div style={{ marginTop: 14, paddingTop: 12, borderTop: '1px solid #F1F5F9' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748B', marginBottom: 8 }}>
                <Users size={13} style={{ display: 'inline', marginRight: 4 }} /> HIỆN DIỆN TRỰC TUYẾN
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {(bootstrap?.presence || []).slice(0, 6).map((pr) => (
                  <div key={pr.user_id} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.8rem' }}>
                    <span
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: 999,
                        background:
                          pr.status === 'online' ? '#10B981' : pr.status === 'busy' ? '#DC2626' : '#D97706',
                      }}
                    />
                    <span style={{ color: '#0F172A', fontWeight: 600 }}>{pr.full_name}</span>
                  </div>
                ))}
              </div>
            </div>
          </Card>

          {/* Right Conversation Stream & Composer */}
          <Card
            title={activeChannel ? `# ${activeChannel.name}` : ' luồng hội thoại'}
            subtitle={activeChannel?.topic || 'Trao đổi công việc nhanh, phản hồi theo nhánh & nhãn trạng thái'}
            actions={
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  type="button"
                  onClick={() => setPinnedFilterOnly((p) => !p)}
                  className="btn secondary"
                  style={{
                    height: 36,
                    fontSize: '0.78rem',
                    color: pinnedFilterOnly ? '#1E40FF' : '#475569',
                    borderColor: pinnedFilterOnly ? '#1E40FF' : '#E2E8F0',
                  }}
                >
                  <Pin size={13} /> {pinnedFilterOnly ? 'Đang lọc tin ghim' : 'Tin đã ghim'}
                </button>
                <button
                  type="button"
                  onClick={() => activeChannelId && handleSelectChannel(activeChannelId)}
                  className="btn secondary"
                  style={{ height: 36, padding: '0 10px' }}
                >
                  <RefreshCw size={14} />
                </button>
              </div>
            }
          >
            {searchResults ? (
              <div style={{ marginBottom: 14, padding: '0.85rem', borderRadius: 14, background: '#F8FAFF', border: '1px solid #DBEAFE' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <strong style={{ fontSize: '0.84rem', color: '#1E40FF' }}>
                    Kết quả tìm kiếm "{searchQuery}" ({searchResults.length} tin nhắn)
                  </strong>
                  <button
                    type="button"
                    onClick={() => setSearchResults(null)}
                    style={{ border: 'none', background: 'transparent', color: '#64748B', cursor: 'pointer', fontSize: '0.78rem' }}
                  >
                    Đóng tìm kiếm
                  </button>
                </div>
                {searchResults.map((sr) => (
                  <div key={sr.id} style={{ padding: '6px 0', borderBottom: '1px solid #E2E8F0', fontSize: '0.82rem' }}>
                    <strong>{sr.sender_name}</strong> ({sr.channel_name}): {sr.content}
                  </div>
                ))}
              </div>
            ) : null}

            {/* Messages Feed */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 10,
                maxHeight: 380,
                minHeight: 240,
                overflowY: 'auto',
                padding: '0.5rem 0.25rem',
              }}
            >
              {displayedMessages.length === 0 ? (
                <EmptyState
                  title="Chưa có tin nhắn nào trong kênh này"
                  description="Hãy gửi tin nhắn, nhãn trạng thái công việc hoặc đính kèm chứng từ để bắt đầu phối hợp."
                />
              ) : (
                displayedMessages.map((msg) => (
                  <div
                    key={msg.id}
                    style={{
                      padding: '0.85rem 1rem',
                      borderRadius: 16,
                      border: msg.is_pinned ? '1.5px solid #1E40FF' : '1px solid #E2E8F0',
                      background: msg.is_pinned ? '#F8FAFF' : '#FFFFFF',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 6,
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontWeight: 700, fontSize: '0.85rem', color: '#0F172A' }}>{msg.sender_name}</span>
                        <span style={{ fontSize: '0.73rem', color: '#64748B' }}>{formatShortDate(msg.created_at)}</span>
                        {msg.is_pinned && <Badge tone="primary">📌 Đã ghim</Badge>}
                      </div>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button
                          type="button"
                          onClick={() => setReplyTo(msg)}
                          style={{ background: 'transparent', border: 'none', color: '#64748B', fontSize: '0.74rem', cursor: 'pointer' }}
                        >
                          Trả lời
                        </button>
                        <button
                          type="button"
                          onClick={() => handleTogglePin(msg)}
                          style={{ background: 'transparent', border: 'none', color: '#1E40FF', fontSize: '0.74rem', cursor: 'pointer' }}
                        >
                          {msg.is_pinned ? 'Bỏ ghim' : 'Ghim'}
                        </button>
                      </div>
                    </div>

                    {msg.parent_message_id && (
                      <div
                        style={{
                          padding: '4px 10px',
                          borderLeft: '3px solid #1E40FF',
                          background: '#F1F5F9',
                          borderRadius: '0 8px 8px 0',
                          fontSize: '0.75rem',
                          color: '#475569',
                        }}
                      >
                        <CornerDownRight size={11} style={{ display: 'inline', marginRight: 4 }} />
                        Trả lời <strong>{msg.parent_sender_name || 'đồng nghiệp'}</strong>: {msg.parent_content || '...'}
                      </div>
                    )}

                    {msg.message_type === 'work_badge' ? (
                      <div>
                        <Badge tone="success" style={{ fontSize: '0.8rem', padding: '5px 12px' }}>
                          {msg.content}
                        </Badge>
                      </div>
                    ) : (
                      <div style={{ fontSize: '0.88rem', color: '#0F172A', lineHeight: 1.45 }}>{msg.content}</div>
                    )}

                    {msg.attachments.length > 0 && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                        {msg.attachments.map((att, i) => (
                          <Badge key={`${msg.id}-att-${i}`} tone="info" icon={<FileText size={12} />}>
                            [{att.kind.toUpperCase()}] {att.title}
                          </Badge>
                        ))}
                      </div>
                    )}

                    {/* Reactions Bar */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 6, marginTop: 2 }}>
                      {Object.entries(msg.reactions || {}).map(([emoji, uids]) => (
                        <button
                          key={emoji}
                          type="button"
                          onClick={() => handleToggleReaction(msg.id, emoji)}
                          style={{
                            border: '1px solid #DBEAFE',
                            background: '#EFF6FF',
                            borderRadius: 999,
                            padding: '2px 8px',
                            fontSize: '0.74rem',
                            cursor: 'pointer',
                          }}
                        >
                          {emoji} {uids.length}
                        </button>
                      ))}
                      {QUICK_REACTIONS.map((em) => (
                        <button
                          key={em}
                          type="button"
                          onClick={() => handleToggleReaction(msg.id, em)}
                          style={{
                            border: 'none',
                            background: 'transparent',
                            opacity: 0.65,
                            cursor: 'pointer',
                            fontSize: '0.78rem',
                          }}
                        >
                          {em}
                        </button>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* 12 Quick Work-Status Badges Strip */}
            <div
              style={{
                display: 'flex',
                gap: 6,
                overflowX: 'auto',
                padding: '0.65rem 0',
                borderTop: '1px solid #F1F5F9',
              }}
            >
              {(bootstrap?.work_status_badges || []).map((wb) => (
                <button
                  key={wb.id}
                  type="button"
                  onClick={() => handleSendQuickWorkBadge(wb)}
                  style={{
                    border: '1px solid #E2E8F0',
                    background: '#F8F9FA',
                    borderRadius: 999,
                    padding: '4px 10px',
                    fontSize: '0.74rem',
                    fontWeight: 700,
                    color: '#334155',
                    whiteSpace: 'nowrap',
                    cursor: 'pointer',
                  }}
                >
                  {wb.icon} {wb.label}
                </button>
              ))}
            </div>

            {/* Commercial Sticker Picker Popover (Mascot pack strictly hidden unless enableIdeasMascot === true) */}
            {stickerDrawerOpen && (
              <div
                style={{
                  border: '1px solid #DBEAFE',
                  background: '#F8FAFF',
                  borderRadius: 16,
                  padding: '0.85rem',
                  marginBottom: 10,
                }}
              >
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
                  {visibleStickerPacks.map((pack) => (
                    <button
                      key={pack.id}
                      type="button"
                      onClick={() => setSelectedPackId(pack.id)}
                      style={{
                        padding: '4px 10px',
                        borderRadius: 10,
                        border: activeStickerPack?.id === pack.id ? '1.5px solid #1E40FF' : '1px solid #E2E8F0',
                        background: activeStickerPack?.id === pack.id ? '#FFFFFF' : 'transparent',
                        color: activeStickerPack?.id === pack.id ? '#1E40FF' : '#475569',
                        fontSize: '0.76rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                      }}
                    >
                      {pack.sample_emojis[0]} {pack.name} ({pack.count})
                    </button>
                  ))}
                </div>
                {activeStickerPack && (
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {activeStickerPack.sample_emojis.map((em, idx) => (
                      <button
                        key={`${activeStickerPack.id}-${idx}`}
                        type="button"
                        onClick={() => handleSendCommercialSticker(activeStickerPack, em, idx)}
                        style={{
                          width: 48,
                          height: 48,
                          borderRadius: 14,
                          border: '1px solid #E2E8F0',
                          background: '#FFFFFF',
                          fontSize: '1.35rem',
                          cursor: 'pointer',
                        }}
                      >
                        {em}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {replyTo && (
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: '6px 12px',
                  borderRadius: 10,
                  background: '#EFF6FF',
                  fontSize: '0.78rem',
                  color: '#1E40FF',
                  marginBottom: 8,
                }}
              >
                <span>Đang trả lời {replyTo.sender_name}: {replyTo.content.slice(0, 60)}</span>
                <button
                  type="button"
                  onClick={() => setReplyTo(null)}
                  style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#DC2626' }}
                >
                  Hủy
                </button>
              </div>
            )}

            {pendingAttachments.length > 0 && (
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
                {pendingAttachments.map((att, idx) => (
                  <Badge key={`pend-${idx}`} tone="info">
                    📎 {att.title}
                  </Badge>
                ))}
              </div>
            )}

            {/* Composer Controls */}
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <button
                type="button"
                title="Bộ Sticker thương mại"
                onClick={() => setStickerDrawerOpen((o) => !o)}
                className="btn secondary"
                style={{ height: 44, padding: '0 12px', color: '#1E40FF' }}
              >
                <Smile size={18} />
              </button>
              <button
                type="button"
                title="Đính kèm Thẻ công việc / Chứng từ / Voucher"
                onClick={() =>
                  setPendingAttachments((prev) => [
                    ...prev,
                    { kind: 'task_card', title: `Thẻ chứng từ #${prev.length + 1}` },
                  ])
                }
                className="btn secondary"
                style={{ height: 44, padding: '0 12px' }}
              >
                <Paperclip size={17} />
              </button>
              <input
                value={composerText}
                onChange={(e) => setComposerText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') void handleSendTextMessage();
                }}
                placeholder="Nhập nội dung trao đổi công việc (Enter để gửi)..."
                className="form-input"
                style={{ flex: 1, height: 44, borderRadius: 14, border: '1px solid #E2E8F0', padding: '0 14px' }}
              />
              <button
                type="button"
                onClick={handleSendTextMessage}
                className="btn-inkica-primary"
                style={{
                  height: 44,
                  padding: '0 1.15rem',
                  borderRadius: 14,
                  border: 'none',
                  color: '#FFFFFF',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <Send size={15} /> Gửi
              </button>
            </div>
          </Card>
        </div>
      )}

      {/* TAB 2: ENTERPRISE INTERNAL FEED */}
      {mainTab === 'feed' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {feedPosts.length === 0 ? (
            <EmptyState
              title="Chưa có thông báo nội bộ nào"
              description="Đăng thông báo điều hành, chính sách mới hoặc tin tức phòng ban để toàn công ty nắm bắt."
            />
          ) : (
            feedPosts.map((post) => (
              <Card
                key={post.id}
                title={post.title || `Thông báo từ ${post.author_name}`}
                subtitle={`${post.author_name} • ${post.department_name || 'Toàn công ty'} • ${formatShortDate(post.created_at)}`}
                actions={post.is_pinned ? <Badge tone="primary">📌 Thông báo Ghim</Badge> : undefined}
              >
                <p style={{ fontSize: '0.9rem', color: '#0F172A', lineHeight: 1.6, margin: '0 0 1rem' }}>
                  {post.content}
                </p>
                <div style={{ display: 'flex', gap: 10, borderTop: '1px solid #F1F5F9', paddingTop: 10 }}>
                  <button
                    type="button"
                    onClick={() => handleLikeFeedPost(post.id)}
                    className="btn secondary"
                    style={{ height: 36, fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: 6 }}
                  >
                    <Heart size={14} color="#DC2626" /> Hưởng ứng ({post.likes_count})
                  </button>
                  <button
                    type="button"
                    onClick={() => openFeedComments(post)}
                    className="btn secondary"
                    style={{ height: 36, fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: 6 }}
                  >
                    <MessageCircle size={14} color="#1E40FF" /> Bình luận ({post.comments_count})
                  </button>
                </div>
              </Card>
            ))
          )}
        </div>
      )}

      {/* TAB 3: PEER RECOGNITION & KUDOS LEADERBOARD */}
      {mainTab === 'kudos' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1rem' }}>
          <Card title="Bảng Xếp Hạng Vinh Danh (Kudos Leaderboard)" subtitle="Tổng hợp điểm ghi nhận đóng góp xuất sắc">
            {leaderboard.length === 0 ? (
              <EmptyState title="Chưa có dữ liệu bảng vàng" description="Gửi lời vinh danh đầu tiên cho đồng nghiệp!" />
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {leaderboard.map((item) => (
                  <FormCard
                    key={item.user_id}
                    icon={<Trophy size={18} />}
                    title={`#${item.rank} — ${item.full_name}`}
                    description={`${item.kudos_count} lượt đồng nghiệp ghi nhận`}
                    badge={<Badge tone="warning">+{item.total_points} điểm</Badge>}
                  />
                ))}
              </div>
            )}
          </Card>

          <Card title="Tường Ghi Nhận Đồng Đội Gần Đây" subtitle="Lan tỏa văn hóa biết ơn & hiệu suất cao">
            {kudosList.length === 0 ? (
              <EmptyState title="Chưa có lời vinh danh nào" />
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {kudosList.map((k) => (
                  <div
                    key={k.id}
                    style={{
                      padding: '0.95rem 1rem',
                      borderRadius: 16,
                      border: '1px solid #DBEAFE',
                      background: '#F8FAFF',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                      <span style={{ fontWeight: 700, fontSize: '0.86rem', color: '#0F172A' }}>
                        <Sparkles size={14} color="#1E40FF" style={{ display: 'inline', marginRight: 4 }} />
                        {k.sender_name} → {k.recipient_name}
                      </span>
                      <Badge tone="purple">{k.badge_title} (+{k.points})</Badge>
                    </div>
                    <p style={{ fontSize: '0.84rem', color: '#334155', margin: '6px 0 0' }}>{k.message}</p>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      )}

      {/* MODAL: Create Channel */}
      <CustomModal isOpen={channelModalOpen} onClose={() => setChannelModalOpen(false)} title="Tạo Kênh WorkChat Mới">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <input
            value={newChannelName}
            onChange={(e) => setNewChannelName(e.target.value)}
            placeholder="Tên kênh (VD: Kinh doanh Miền Nam, Chiến dịch Q4...)"
            className="form-input"
            style={{ height: 44, borderRadius: 14, border: '1px solid #E2E8F0', padding: '0 12px' }}
          />
          <select
            value={newChannelType}
            onChange={(e) => setNewChannelType(e.target.value)}
            className="form-input"
            style={{ height: 44, borderRadius: 14, border: '1px solid #E2E8F0', padding: '0 12px' }}
          >
            <option value="department">Kênh theo Phòng ban</option>
            <option value="project">Kênh theo Dự án</option>
            <option value="group">Nhóm thảo luận chuyên đề</option>
            <option value="direct">Trò chuyện trực tiếp 1-1</option>
          </select>
          {(bootstrap?.departments || []).length > 0 && (
            <select
              value={newChannelDeptId}
              onChange={(e) => setNewChannelDeptId(e.target.value)}
              className="form-input"
              style={{ height: 44, borderRadius: 14, border: '1px solid #E2E8F0', padding: '0 12px' }}
            >
              <option value="">-- Liên kết Phòng ban (Tùy chọn) --</option>
              {(bootstrap?.departments || []).map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          )}
          <input
            value={newChannelTopic}
            onChange={(e) => setNewChannelTopic(e.target.value)}
            placeholder="Chủ đề kênh..."
            className="form-input"
            style={{ height: 44, borderRadius: 14, border: '1px solid #E2E8F0', padding: '0 12px' }}
          />
          <button
            type="button"
            onClick={handleCreateChannel}
            className="btn-inkica-primary"
            style={{ height: 44, borderRadius: 14, border: 'none', color: '#FFFFFF', fontWeight: 700, cursor: 'pointer' }}
          >
            Khởi tạo Kênh
          </button>
        </div>
      </CustomModal>

      {/* MODAL: Create Feed Announcement */}
      <CustomModal isOpen={feedModalOpen} onClose={() => setFeedModalOpen(false)} title="Đăng Thông Báo Nội Bộ">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <input
            value={feedTitle}
            onChange={(e) => setFeedTitle(e.target.value)}
            placeholder="Tiêu đề thông báo..."
            className="form-input"
            style={{ height: 44, borderRadius: 14, border: '1px solid #E2E8F0', padding: '0 12px' }}
          />
          <select
            value={feedDeptId}
            onChange={(e) => setFeedDeptId(e.target.value)}
            className="form-input"
            style={{ height: 44, borderRadius: 14, border: '1px solid #E2E8F0', padding: '0 12px' }}
          >
            <option value="">Phạm vi: Toàn công ty</option>
            {(bootstrap?.departments || []).map((d) => (
              <option key={d.id} value={d.id}>
                Phòng ban: {d.name}
              </option>
            ))}
          </select>
          <textarea
            value={feedContent}
            onChange={(e) => setFeedContent(e.target.value)}
            rows={4}
            placeholder="Nội dung truyền thông nội bộ..."
            style={{ borderRadius: 14, border: '1px solid #E2E8F0', padding: '10px 12px', fontSize: '0.85rem' }}
          />
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.84rem', color: '#334155' }}>
            <input type="checkbox" checked={feedPinned} onChange={(e) => setFeedPinned(e.target.checked)} />
            Ghim thông báo lên đầu Bảng tin
          </label>
          <button
            type="button"
            onClick={handleCreateFeedPost}
            className="btn-inkica-primary"
            style={{ height: 44, borderRadius: 14, border: 'none', color: '#FFFFFF', fontWeight: 700, cursor: 'pointer' }}
          >
            Phát hành Thông báo
          </button>
        </div>
      </CustomModal>

      {/* MODAL: Feed Comments */}
      <CustomModal
        isOpen={Boolean(activeFeedPost)}
        onClose={() => setActiveFeedPost(null)}
        title={activeFeedPost?.title || 'Bình luận thông báo'}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {feedComments.map((fc) => (
            <div key={fc.id} style={{ padding: '0.7rem 0.9rem', borderRadius: 12, background: '#F8F9FA' }}>
              <div style={{ fontWeight: 700, fontSize: '0.78rem', color: '#1E40FF' }}>
                {fc.author_name} • {formatShortDate(fc.created_at)}
              </div>
              <div style={{ fontSize: '0.84rem', color: '#0F172A', marginTop: 2 }}>{fc.content}</div>
            </div>
          ))}
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              value={newFeedComment}
              onChange={(e) => setNewFeedComment(e.target.value)}
              placeholder="Viết bình luận..."
              className="form-input"
              style={{ flex: 1, height: 44, borderRadius: 14, border: '1px solid #E2E8F0', padding: '0 12px' }}
            />
            <button
              type="button"
              onClick={handleSendFeedComment}
              className="btn-inkica-primary"
              style={{ height: 44, padding: '0 1rem', borderRadius: 14, border: 'none', color: '#FFFFFF', fontWeight: 700, cursor: 'pointer' }}
            >
              Gửi
            </button>
          </div>
        </div>
      </CustomModal>

      {/* MODAL: Send Kudos */}
      <CustomModal isOpen={kudosModalOpen} onClose={() => setKudosModalOpen(false)} title="Vinh Danh Đồng Nghiệp (Kudos)">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <select
            value={kudosRecipientId}
            onChange={(e) => setKudosRecipientId(e.target.value)}
            className="form-input"
            style={{ height: 44, borderRadius: 14, border: '1px solid #E2E8F0', padding: '0 12px' }}
          >
            <option value="">-- Chọn đồng nghiệp được vinh danh --</option>
            {(bootstrap?.staff || []).map((u) => (
              <option key={u.id} value={u.id}>
                {u.full_name} ({u.role})
              </option>
            ))}
          </select>
          <input
            value={kudosBadgeTitle}
            onChange={(e) => setKudosBadgeTitle(e.target.value)}
            placeholder="Danh hiệu (VD: Ngôi sao Chốt Deal, Hỗ trợ Tận tâm...)"
            className="form-input"
            style={{ height: 44, borderRadius: 14, border: '1px solid #E2E8F0', padding: '0 12px' }}
          />
          <input
            type="number"
            value={kudosPoints}
            onChange={(e) => setKudosPoints(e.target.value)}
            placeholder="Điểm thưởng Kudos (5 - 100)"
            className="form-input"
            style={{ height: 44, borderRadius: 14, border: '1px solid #E2E8F0', padding: '0 12px' }}
          />
          <textarea
            value={kudosMessage}
            onChange={(e) => setKudosMessage(e.target.value)}
            rows={3}
            placeholder="Lời cảm ơn & ghi nhận thành tích..."
            style={{ borderRadius: 14, border: '1px solid #E2E8F0', padding: '10px 12px', fontSize: '0.85rem' }}
          />
          <button
            type="button"
            onClick={handleCreateKudos}
            className="btn-inkica-primary"
            style={{ height: 44, borderRadius: 14, border: 'none', color: '#FFFFFF', fontWeight: 700, cursor: 'pointer' }}
          >
            Trao Huy Hiệu Vinh Danh
          </button>
        </div>
      </CustomModal>
    </div>
  );
};

export default ErpWorkChatWave2Entry;
