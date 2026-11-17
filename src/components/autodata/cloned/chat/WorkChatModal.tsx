import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import {
  Briefcase,
  CheckSquare,
  CornerDownRight,
  ExternalLink,
  FolderOpen,
  Hash,
  Maximize2,
  Megaphone,
  MessageCircle,
  Minimize2,
  Palette,
  Paperclip,
  Pin,
  Plus,
  RefreshCw,
  Search,
  Send,
  Smile,
  Users,
  X,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { CustomModal } from '../components/ui/CustomModal';
import { Avatar } from '../components/ui/Avatar';
import { Badge, EmptyState } from '../components/ui/AutoDataLoadingModal';
import { Skeleton, SplitChatPanelSkeleton } from '../components/ui/Skeleton';
import { apiRequest, formatShortDate, getErrorMessage } from '../../autodataApi';
import { useAuth } from '../contexts/AuthContext';
import { useEntitlement } from '../contexts/EntitlementContext';
import { CHAT_STICKERS, findWorkStickerById, type ChatSticker } from './ChatStickers';
import { StickerPickerModal } from './StickerPickerModal';
import { parseActionProposal } from './actionProposalUtils';
import { ChatDynamicChart } from './ChatDynamicChart';
import { ActionProposalCard } from './ActionProposalCard';
import { ChatErpCardModal } from './ChatErpCardModal';
import { ChatMediaVaultPanel } from './ChatMediaVaultPanel';
import { ChatWallpaperModal } from './ChatWallpaperModal';
import { CreateTaskFromChatModal } from './CreateTaskFromChatModal';
import {
  ERP_CARD_CATEGORY_META,
  loadChannelWallpaperLocal,
  type ChannelWallpaperConfig,
  type ErpCardEntityType,
  type WorkChatAttachmentItem,
  type WorkChatBootstrapDto,
  type WorkChatChannelDto,
  type WorkChatMessageDto,
} from './workchatTypes';

export interface WorkChatModalProps {
  isOpen?: boolean;
  onClose?: () => void;
  initialChannelId?: string;
  docked?: boolean;
  initialMaximized?: boolean;
}

type ChannelTypeFilter = 'all' | 'direct' | 'group' | 'department' | 'project' | 'announcement';

const QUICK_REACTIONS = ['👍', '❤️', '😂', '🚀', '👏', '🔥'];

const CHANNEL_TYPE_FILTERS: ReadonlyArray<{ key: ChannelTypeFilter; label: string }> = [
  { key: 'all', label: 'Tất cả' },
  { key: 'direct', label: '1-1' },
  { key: 'group', label: 'Nhóm' },
  { key: 'department', label: 'Phòng ban' },
  { key: 'project', label: 'Dự án' },
  { key: 'announcement', label: 'Thông báo' },
];

export const WorkChatModal: React.FC<WorkChatModalProps> = ({
  isOpen = true,
  onClose,
  initialChannelId,
  docked = false,
  initialMaximized = false,
}) => {
  const navigate = useNavigate();
  const { token, tenantSlug, user } = useAuth();
  const { can } = useEntitlement();
  const canCreate = can('erp_workchat', 'create');

  const [isMaximized, setIsMaximized] = useState(initialMaximized);
  const [loading, setLoading] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [bootstrap, setBootstrap] = useState<WorkChatBootstrapDto | null>(null);
  const [selectedChannelId, setSelectedChannelId] = useState<string>(initialChannelId || '');
  const [channelTypeFilter, setChannelTypeFilter] = useState<ChannelTypeFilter>('all');
  const [channelFilterText, setChannelFilterText] = useState('');
  const [messages, setMessages] = useState<WorkChatMessageDto[]>([]);
  const [pinnedOnly, setPinnedOnly] = useState(false);

  // Composer & Actions
  const [composerText, setComposerText] = useState('');
  const [replyTo, setReplyTo] = useState<WorkChatMessageDto | null>(null);
  const [pendingCards, setPendingCards] = useState<WorkChatAttachmentItem[]>([]);
  const [stickerOpen, setStickerOpen] = useState(false);
  const [stickerAnchorEl, setStickerAnchorEl] = useState<HTMLElement | null>(null);

  // Panels & Modals
  const [vaultOpen, setVaultOpen] = useState(false);
  const [erpCardModalOpen, setErpCardModalOpen] = useState(false);
  const [wallpaperModalOpen, setWallpaperModalOpen] = useState(false);
  const [taskTargetMessage, setTaskTargetMessage] = useState<WorkChatMessageDto | null>(null);
  const [wallpaperOverrides, setWallpaperOverrides] = useState<Record<string, ChannelWallpaperConfig>>({});

  // Search Messages
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<WorkChatMessageDto[] | null>(null);

  // Presence
  const [presenceStatus, setPresenceStatus] = useState<'online' | 'busy' | 'away'>('online');

  // Create Channel / Group Modal
  const [createChannelOpen, setCreateChannelOpen] = useState(false);
  const [newChannelName, setNewChannelName] = useState('');
  const [newChannelType, setNewChannelType] = useState<'direct' | 'group' | 'department' | 'project' | 'announcement'>('group');
  const [newChannelTopic, setNewChannelTopic] = useState('');
  const [newChannelDeptId, setNewChannelDeptId] = useState('');
  const [newChannelMemberIds, setNewChannelMemberIds] = useState<string[]>([]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const activeChannelId = useMemo(() => {
    if (selectedChannelId && bootstrap?.channels.some((c) => c.id === selectedChannelId)) {
      return selectedChannelId;
    }
    if (initialChannelId && bootstrap?.channels.some((c) => c.id === initialChannelId)) {
      return initialChannelId;
    }
    return bootstrap?.channels[0]?.id || '';
  }, [selectedChannelId, initialChannelId, bootstrap?.channels]);

  const activeChannel = useMemo(
    () => bootstrap?.channels.find((c) => c.id === activeChannelId) || null,
    [bootstrap?.channels, activeChannelId]
  );

  const currentWallpaper = useMemo<ChannelWallpaperConfig>(() => {
    if (activeChannelId && wallpaperOverrides[activeChannelId]) {
      return wallpaperOverrides[activeChannelId];
    }
    return loadChannelWallpaperLocal(tenantSlug, activeChannelId);
  }, [activeChannelId, tenantSlug, wallpaperOverrides]);

  const fetchMessages = useCallback(
    async (channelId: string) => {
      if (!channelId) return [];
      const res = await apiRequest<{ items?: WorkChatMessageDto[] }>(
        `/workchat/channels/${channelId}/messages`,
        { token, tenantSlug }
      );
      return Array.isArray(res?.items) ? res.items : [];
    },
    [token, tenantSlug]
  );

  const loadWorkspace = useCallback(
    async (preferredChannelId?: string) => {
      const boot = await apiRequest<WorkChatBootstrapDto>('/workchat/bootstrap', {
        token,
        tenantSlug,
      });
      const targetId =
        (preferredChannelId && boot.channels.some((c) => c.id === preferredChannelId)
          ? preferredChannelId
          : '') ||
        boot.channels[0]?.id ||
        '';
      const msgs = targetId ? await fetchMessages(targetId) : [];
      return { boot, targetId, msgs };
    },
    [token, tenantSlug, fetchMessages]
  );

  useEffect(() => {
    if (!isOpen || !token) return;
    let cancelled = false;

    (async () => {
      setLoading(true);
      try {
        const data = await loadWorkspace(initialChannelId);
        if (!cancelled) {
          setBootstrap(data.boot);
          if (data.targetId) {
            setSelectedChannelId(data.targetId);
          }
          setMessages(data.msgs);
        }
      } catch (err) {
        if (!cancelled) {
          toast.error(getErrorMessage(err, 'Không thể kết nối WorkChat doanh nghiệp'));
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isOpen, token, initialChannelId, loadWorkspace]);

  // Scroll to bottom when messages list grows
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length, activeChannelId]);

  const filteredChannels = useMemo(() => {
    const all = bootstrap?.channels || [];
    const kw = channelFilterText.trim().toLowerCase();
    return all.filter((ch) => {
      if (channelTypeFilter !== 'all' && ch.channel_type !== channelTypeFilter) {
        return false;
      }
      if (kw) {
        const hay = `${ch.name} ${ch.topic || ''} ${ch.department_name || ''}`.toLowerCase();
        return hay.includes(kw);
      }
      return true;
    });
  }, [bootstrap?.channels, channelTypeFilter, channelFilterText]);

  const visibleMessages = useMemo(
    () => (pinnedOnly ? messages.filter((m) => m.is_pinned) : messages),
    [messages, pinnedOnly]
  );

  const handleSelectChannel = async (channelId: string) => {
    setSelectedChannelId(channelId);
    setSearchResults(null);
    setReplyTo(null);
    setLoadingMessages(true);
    try {
      const msgs = await fetchMessages(channelId);
      setMessages(msgs);
    } catch (err) {
      toast.error(getErrorMessage(err, 'Không thể tải tin nhắn của kênh'));
    } finally {
      setLoadingMessages(false);
    }
  };

  const handleSendTextOrCard = async (overrideCards?: WorkChatAttachmentItem[]) => {
    if (!activeChannelId) return;
    const cardsToSend = overrideCards ?? pendingCards;
    const text = composerText.trim();
    if (!text && cardsToSend.length === 0) return;

    try {
      const isCard = cardsToSend.length > 0;
      const sent = await apiRequest<WorkChatMessageDto>(
        `/workchat/channels/${activeChannelId}/messages`,
        {
          method: 'POST',
          token,
          tenantSlug,
          body: {
            message_type: isCard ? 'card_link' : 'text',
            content: text || `Thẻ nghiệp vụ: ${cardsToSend[0]?.title || 'Đính kèm'}`,
            parent_message_id: replyTo?.id || null,
            attachments: cardsToSend,
          },
        }
      );
      setMessages((prev) => [...prev, sent]);
      if (!overrideCards) {
        setComposerText('');
        setPendingCards([]);
      }
      setReplyTo(null);
    } catch (err) {
      toast.error(getErrorMessage(err, 'Không thể gửi tin nhắn'));
    }
  };

  const handleSendWorkBadge = async (badge: ChatSticker) => {
    if (!activeChannelId) return;
    try {
      const sent = await apiRequest<WorkChatMessageDto>(
        `/workchat/channels/${activeChannelId}/messages`,
        {
          method: 'POST',
          token,
          tenantSlug,
          body: {
            message_type: 'work_badge',
            sticker_id: badge.id,
            content: `${badge.icon} ${badge.badgeText}`,
            parent_message_id: replyTo?.id || null,
          },
        }
      );
      setMessages((prev) => [...prev, sent]);
      setReplyTo(null);
    } catch (err) {
      toast.error(getErrorMessage(err, 'Không thể gửi nhãn công việc'));
    }
  };

  const handleSendCommercialSticker = async (
    stickerUrl: string,
    packId: string,
    displayLabel?: string
  ) => {
    if (!activeChannelId) return;
    try {
      const sent = await apiRequest<WorkChatMessageDto>(
        `/workchat/channels/${activeChannelId}/messages`,
        {
          method: 'POST',
          token,
          tenantSlug,
          body: {
            message_type: 'sticker',
            sticker_pack_id: packId,
            sticker_id: stickerUrl,
            content: displayLabel || `[Sticker ${packId}]`,
            parent_message_id: replyTo?.id || null,
          },
        }
      );
      setMessages((prev) => [...prev, sent]);
      setReplyTo(null);
    } catch (err) {
      toast.error(getErrorMessage(err, 'Không thể gửi nhãn dán Sticker'));
    }
  };

  const handleTogglePin = async (msg: WorkChatMessageDto) => {
    try {
      const updated = await apiRequest<{ id: string; is_pinned: boolean }>(
        `/workchat/messages/${msg.id}/pin`,
        {
          method: 'PATCH',
          token,
          tenantSlug,
          body: { is_pinned: !msg.is_pinned },
        }
      );
      setMessages((prev) =>
        prev.map((m) => (m.id === msg.id ? { ...m, is_pinned: updated.is_pinned } : m))
      );
      toast.success(updated.is_pinned ? 'Đã ghim tin nhắn lên đầu kênh' : 'Đã gỡ ghim tin nhắn');
    } catch (err) {
      toast.error(getErrorMessage(err, 'Không thể cập nhật ghim tin nhắn'));
    }
  };

  const handleToggleReaction = async (messageId: string, emoji: string) => {
    try {
      const updated = await apiRequest<{ id: string; reactions: Record<string, string[]> }>(
        `/workchat/messages/${messageId}/reactions`,
        {
          method: 'POST',
          token,
          tenantSlug,
          body: { emoji },
        }
      );
      setMessages((prev) =>
        prev.map((m) => (m.id === messageId ? { ...m, reactions: updated.reactions } : m))
      );
    } catch (err) {
      toast.error(getErrorMessage(err, 'Không thể thả biểu cảm'));
    }
  };

  const handleRunSearch = async () => {
    const q = searchQuery.trim();
    if (!q) {
      setSearchResults(null);
      return;
    }
    try {
      const res = await apiRequest<{ items?: WorkChatMessageDto[] }>(
        `/workchat/messages/search?q=${encodeURIComponent(q)}`,
        { token, tenantSlug }
      );
      setSearchResults(Array.isArray(res?.items) ? res.items : []);
    } catch (err) {
      toast.error(getErrorMessage(err, 'Không thể tìm kiếm lịch sử tin nhắn'));
    }
  };

  const handleChangePresence = async (next: 'online' | 'busy' | 'away') => {
    setPresenceStatus(next);
    try {
      await apiRequest('/workchat/presence/heartbeat', {
        method: 'POST',
        token,
        tenantSlug,
        body: { status: next },
      });
    } catch {
      // Presence heartbeat is non-blocking
    }
  };

  const handleCreateChannel = async () => {
    if (!newChannelName.trim()) {
      toast.error('Vui lòng nhập tên kênh hoặc cuộc trò chuyện');
      return;
    }
    try {
      const created = await apiRequest<WorkChatChannelDto>('/workchat/channels', {
        method: 'POST',
        token,
        tenantSlug,
        body: {
          name: newChannelName.trim(),
          channel_type: newChannelType,
          topic: newChannelTopic.trim() || null,
          department_id: newChannelDeptId || null,
          member_user_ids: newChannelMemberIds,
        },
      });
      toast.success(`Đã tạo kênh #${created.name}`);
      setNewChannelName('');
      setNewChannelTopic('');
      setNewChannelMemberIds([]);
      setCreateChannelOpen(false);

      const refreshed = await loadWorkspace(created.id);
      setBootstrap(refreshed.boot);
      setSelectedChannelId(created.id);
      setMessages(refreshed.msgs);
    } catch (err) {
      toast.error(getErrorMessage(err, 'Không thể tạo kênh trò chuyện mới'));
    }
  };

  const jumpToMessageInDom = (messageId: string) => {
    if (typeof document === 'undefined') return;
    const el = document.getElementById(`workchat-msg-${messageId}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  if (!isOpen) return null;

  if (loading && !bootstrap && docked) {
    return <SplitChatPanelSkeleton />;
  }

  const getChannelBadgeIcon = (type: string) => {
    if (type === 'announcement') return <Megaphone size={15} color="#D97706" />;
    if (type === 'direct') return <MessageCircle size={15} color="#0284C7" />;
    if (type === 'group') return <Users size={15} color="#7C3AED" />;
    return <Hash size={15} color="#1E40FF" />;
  };

  const messengerBody = (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        height: docked ? 'min(740px, calc(100vh - 200px))' : '100%',
        minHeight: docked ? 560 : undefined,
        background: '#FFFFFF',
        border: '1px solid #E2E8F0',
        borderRadius: docked ? 20 : isMaximized ? 20 : 22,
        boxShadow: docked
          ? '0 4px 16px rgba(15, 23, 42, 0.05)'
          : '0 25px 65px -12px rgba(30, 64, 255, 0.24), 0 12px 28px -8px rgba(15, 23, 42, 0.14)',
        overflow: 'hidden',
        color: '#0F172A',
      }}
    >
      {/* Top Messenger Bar */}
      <div
        style={{
          padding: '10px 16px',
          background: 'linear-gradient(135deg, #1E40FF 0%, #0284C7 100%)',
          color: '#FFFFFF',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 10,
          flexShrink: 0,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
          <div
            style={{
              width: 34,
              height: 34,
              borderRadius: 11,
              background: 'rgba(255, 255, 255, 0.18)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <MessageCircle size={18} />
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: '0.9rem', fontWeight: 800, lineHeight: 1.2 }}>
              DOMATION WorkChat Messenger
            </div>
            <div style={{ fontSize: '0.7rem', opacity: 0.88 }}>
              {bootstrap?.channels.length || 0} kênh hội thoại •{' '}
              {(bootstrap?.presence || []).filter((p) => p.status === 'online').length} nhân sự trực tuyến
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {/* Presence Selector */}
          <select
            value={presenceStatus}
            onChange={(e) => handleChangePresence(e.target.value as 'online' | 'busy' | 'away')}
            style={{
              height: 30,
              padding: '0 8px',
              borderRadius: 8,
              border: '1px solid rgba(255, 255, 255, 0.3)',
              background: 'rgba(255, 255, 255, 0.14)',
              color: '#FFFFFF',
              fontSize: '0.72rem',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            <option value="online" style={{ color: '#0F172A' }}>🟢 Trực tuyến</option>
            <option value="busy" style={{ color: '#0F172A' }}>🔴 Đang bận</option>
            <option value="away" style={{ color: '#0F172A' }}>🟡 Tạm vắng</option>
          </select>

          <button
            type="button"
            onClick={async () => {
              try {
                const refreshed = await loadWorkspace(activeChannelId);
                setBootstrap(refreshed.boot);
                setMessages(refreshed.msgs);
                toast.success('Đã đồng bộ tin nhắn mới nhất');
              } catch (err) {
                toast.error(getErrorMessage(err, 'Không thể làm mới tin nhắn'));
              }
            }}
            title="Làm mới hội thoại"
            style={{
              width: 30,
              height: 30,
              borderRadius: 8,
              border: '1px solid rgba(255, 255, 255, 0.25)',
              background: 'rgba(255, 255, 255, 0.12)',
              color: '#FFFFFF',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
            }}
          >
            <RefreshCw size={14} />
          </button>

          {!docked && (
            <button
              type="button"
              onClick={() => setIsMaximized((prev) => !prev)}
              title={isMaximized ? 'Thu nhỏ cửa sổ' : 'Phóng to toàn màn hình'}
              style={{
                width: 30,
                height: 30,
                borderRadius: 8,
                border: '1px solid rgba(255, 255, 255, 0.25)',
                background: 'rgba(255, 255, 255, 0.12)',
                color: '#FFFFFF',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
              }}
            >
              {isMaximized ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
            </button>
          )}

          {!docked && onClose && (
            <button
              type="button"
              onClick={onClose}
              aria-label="Đóng cửa sổ WorkChat"
              style={{
                width: 30,
                height: 30,
                borderRadius: 8,
                border: '1px solid rgba(255, 255, 255, 0.25)',
                background: 'rgba(255, 255, 255, 0.16)',
                color: '#FFFFFF',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
              }}
            >
              <X size={15} />
            </button>
          )}
        </div>
      </div>

      {/* Split Workspace */}
      <div style={{ flex: 1, display: 'flex', minHeight: 0, overflow: 'hidden' }}>
        {/* Left Sidebar: Channels */}
        <div
          style={{
            width: 280,
            borderRight: '1px solid #E2E8F0',
            background: '#F8F9FA',
            display: 'flex',
            flexDirection: 'column',
            flexShrink: 0,
          }}
        >
          <div style={{ padding: '10px 12px', borderBottom: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ display: 'flex', gap: 6 }}>
              <div
                style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '0 10px',
                  minHeight: 36,
                  borderRadius: 10,
                  background: '#FFFFFF',
                  border: '1px solid #CBD5E1',
                }}
              >
                <Search size={14} color="#64748B" />
                <input
                  type="text"
                  value={channelFilterText}
                  onChange={(e) => setChannelFilterText(e.target.value)}
                  placeholder="Tìm kênh, nhóm..."
                  style={{
                    flex: 1,
                    border: 'none',
                    outline: 'none',
                    background: 'transparent',
                    fontSize: '0.78rem',
                    color: '#0F172A',
                  }}
                />
              </div>

              {canCreate && (
                <button
                  type="button"
                  onClick={() => setCreateChannelOpen(true)}
                  title="Tạo kênh / Nhóm chat mới"
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    border: 'none',
                    background: '#1E40FF',
                    color: '#FFFFFF',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    flexShrink: 0,
                  }}
                >
                  <Plus size={16} />
                </button>
              )}
            </div>

            {/* Channel Type Filter Pills */}
            <div style={{ display: 'flex', gap: 4, overflowX: 'auto', paddingBottom: 2 }}>
              {CHANNEL_TYPE_FILTERS.map((f) => {
                const active = channelTypeFilter === f.key;
                return (
                  <button
                    key={f.key}
                    type="button"
                    onClick={() => setChannelTypeFilter(f.key)}
                    style={{
                      padding: '3px 8px',
                      borderRadius: 999,
                      border: active ? '1px solid #1E40FF' : '1px solid #E2E8F0',
                      background: active ? '#EEF2FF' : '#FFFFFF',
                      color: active ? '#1E40FF' : '#64748B',
                      fontSize: '0.68rem',
                      fontWeight: active ? 800 : 600,
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {f.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Channel List */}
          <div style={{ flex: 1, overflowY: 'auto', padding: 8, display: 'flex', flexDirection: 'column', gap: 4 }}>
            {loading && !bootstrap ? (
              Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} height={54} borderRadius={12} />
              ))
            ) : filteredChannels.length === 0 ? (
              <div style={{ padding: '24px 12px', textAlign: 'center', fontSize: '0.78rem', color: '#64748B' }}>
                Chưa có kênh phù hợp bộ lọc.
              </div>
            ) : (
              filteredChannels.map((ch) => {
                const active = ch.id === activeChannelId;
                return (
                  <button
                    key={ch.id}
                    type="button"
                    onClick={() => handleSelectChannel(ch.id)}
                    style={{
                      padding: '9px 10px',
                      borderRadius: 12,
                      border: active ? '1.5px solid #1E40FF' : '1px solid transparent',
                      background: active ? '#FFFFFF' : 'transparent',
                      boxShadow: active ? '0 3px 10px rgba(30, 64, 255, 0.10)' : 'none',
                      textAlign: 'left',
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: 9,
                      cursor: 'pointer',
                    }}
                  >
                    <div
                      style={{
                        width: 34,
                        height: 34,
                        borderRadius: 10,
                        background: active ? '#EEF2FF' : '#FFFFFF',
                        border: '1px solid #E2E8F0',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      {getChannelBadgeIcon(ch.channel_type)}
                    </div>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 4 }}>
                        <span
                          style={{
                            fontSize: '0.8rem',
                            fontWeight: active ? 800 : 700,
                            color: active ? '#1E40FF' : '#0F172A',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {ch.name}
                        </span>
                        <span style={{ fontSize: '0.65rem', color: '#94A3B8', flexShrink: 0 }}>
                          {ch.message_count || 0}
                        </span>
                      </div>
                      <div
                        style={{
                          fontSize: '0.71rem',
                          color: '#64748B',
                          marginTop: 2,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {ch.last_message_preview || ch.topic || 'Sẵn sàng trao đổi'}
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Center Message Stream */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, background: '#FFFFFF' }}>
          {/* Active Channel Header */}
          <div
            style={{
              padding: '10px 14px',
              borderBottom: '1px solid #E2E8F0',
              background: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 8,
              flexWrap: 'wrap',
            }}
          >
            <div style={{ minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7, flexWrap: 'wrap' }}>
                <span style={{ fontSize: '0.9rem', fontWeight: 800, color: '#0F172A' }}>
                  #{activeChannel?.name || 'Chọn kênh trò chuyện'}
                </span>
                {activeChannel?.department_name && (
                  <Badge tone="info">{activeChannel.department_name}</Badge>
                )}
                {pinnedOnly && <Badge tone="warning">Đang lọc tin đã ghim</Badge>}
              </div>
              {activeChannel?.topic && (
                <div style={{ fontSize: '0.73rem', color: '#64748B', marginTop: 1 }}>
                  {activeChannel.topic}
                </div>
              )}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <button
                type="button"
                onClick={() => setSearchOpen((prev) => !prev)}
                title="Tìm kiếm tin nhắn"
                style={{
                  height: 32,
                  padding: '0 9px',
                  borderRadius: 9,
                  border: searchOpen ? '1px solid #1E40FF' : '1px solid #E2E8F0',
                  background: searchOpen ? '#EEF2FF' : '#F8FAFC',
                  color: searchOpen ? '#1E40FF' : '#475569',
                  fontSize: '0.73rem',
                  fontWeight: 700,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 5,
                  cursor: 'pointer',
                }}
              >
                <Search size={13} />
                <span>Tìm</span>
              </button>

              <button
                type="button"
                onClick={() => setPinnedOnly((prev) => !prev)}
                title="Xem tin nhắn đã ghim"
                style={{
                  height: 32,
                  padding: '0 9px',
                  borderRadius: 9,
                  border: pinnedOnly ? '1px solid #D97706' : '1px solid #E2E8F0',
                  background: pinnedOnly ? '#FEF3C7' : '#F8FAFC',
                  color: pinnedOnly ? '#B45309' : '#475569',
                  fontSize: '0.73rem',
                  fontWeight: 700,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                  cursor: 'pointer',
                }}
              >
                <Pin size={13} />
                <span>Ghim</span>
              </button>

              <button
                type="button"
                onClick={() => setWallpaperModalOpen(true)}
                title="Đổi chủ đề hình nền kênh"
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 9,
                  border: '1px solid #E2E8F0',
                  background: '#F8FAFC',
                  color: '#475569',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                }}
              >
                <Palette size={14} />
              </button>

              <button
                type="button"
                onClick={() => setVaultOpen((prev) => !prev)}
                title="Mở Kho Lưu Trữ Kênh (Media Vault)"
                style={{
                  height: 32,
                  padding: '0 10px',
                  borderRadius: 9,
                  border: vaultOpen ? '1px solid #1E40FF' : '1px solid #E2E8F0',
                  background: vaultOpen ? '#EEF2FF' : '#F8FAFC',
                  color: vaultOpen ? '#1E40FF' : '#475569',
                  fontSize: '0.73rem',
                  fontWeight: 700,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 5,
                  cursor: 'pointer',
                }}
              >
                <FolderOpen size={13} />
                <span>Kho lưu trữ</span>
              </button>
            </div>
          </div>

          {/* Search Bar Collapsible */}
          {searchOpen && (
            <div
              style={{
                padding: '8px 14px',
                borderBottom: '1px solid #E2E8F0',
                background: '#F8FAFF',
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
              }}
            >
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleRunSearch();
                  }}
                  placeholder="Nhập từ khóa tìm xuyên suốt tất cả các kênh..."
                  style={{
                    flex: 1,
                    height: 36,
                    padding: '0 11px',
                    borderRadius: 9,
                    border: '1px solid #CBD5E1',
                    background: '#FFFFFF',
                    fontSize: '0.8rem',
                  }}
                />
                <button
                  type="button"
                  onClick={handleRunSearch}
                  style={{
                    height: 36,
                    padding: '0 14px',
                    borderRadius: 9,
                    border: 'none',
                    background: '#1E40FF',
                    color: '#FFFFFF',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  Tìm kiếm
                </button>
                {searchResults && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchResults(null);
                      setSearchQuery('');
                    }}
                    style={{
                      height: 36,
                      padding: '0 10px',
                      borderRadius: 9,
                      border: '1px solid #CBD5E1',
                      background: '#FFFFFF',
                      fontSize: '0.76rem',
                      cursor: 'pointer',
                    }}
                  >
                    Xóa lọc
                  </button>
                )}
              </div>

              {searchResults && (
                <div style={{ maxHeight: 160, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 5 }}>
                  {searchResults.length === 0 ? (
                    <div style={{ fontSize: '0.76rem', color: '#64748B', padding: '4px 0' }}>
                      Không tìm thấy tin nhắn khớp với &ldquo;{searchQuery}&rdquo;.
                    </div>
                  ) : (
                    searchResults.map((hit) => (
                      <div
                        key={hit.id}
                        onClick={() => {
                          if (hit.channel_id) handleSelectChannel(hit.channel_id);
                          setSearchResults(null);
                        }}
                        style={{
                          padding: '7px 10px',
                          borderRadius: 9,
                          background: '#FFFFFF',
                          border: '1px solid #E2E8F0',
                          cursor: 'pointer',
                          fontSize: '0.76rem',
                        }}
                      >
                        <strong style={{ color: '#1E40FF' }}>#{hit.channel_name || 'Kênh'}</strong> •{' '}
                        <strong>{hit.sender_name}:</strong> {hit.content}
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          )}

          {/* Messages Viewport with Royal Sapphire Wallpaper */}
          <div
            style={{
              flex: 1,
              position: 'relative',
              overflowY: 'auto',
              padding: '14px 16px',
              background: currentWallpaper.cssBackground,
              backgroundSize: currentWallpaper.preset_id === 'cloud_grid' ? '18px 18px' : 'cover',
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
            }}
          >
            {loadingMessages ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <Skeleton width="65%" height={56} borderRadius={14} />
                <Skeleton width="55%" height={48} borderRadius={14} style={{ alignSelf: 'flex-end' }} />
                <Skeleton width="72%" height={68} borderRadius={14} />
              </div>
            ) : visibleMessages.length === 0 ? (
              <EmptyState
                icon={<MessageCircle size={24} />}
                title={pinnedOnly ? 'Chưa có tin nhắn nào được ghim' : 'Bắt đầu cuộc trò chuyện cùng đội ngũ'}
                description="Gửi tin nhắn, đính kèm Thẻ ERP (Lead/Deal/Task/Đơn duyệt/Phiếu lương) hoặc nhãn trạng thái công việc."
              />
            ) : (
              visibleMessages.map((msg) => {
                const isMine = Boolean(user?.id && msg.sender_user_id === user.id);
                const parsedTags = parseActionProposal(msg.content || '');
                const workSticker =
                  msg.message_type === 'work_badge' ? findWorkStickerById(msg.sticker_id) : undefined;
                const reactionEntries = Object.entries(msg.reactions || {}).filter(
                  ([, list]) => Array.isArray(list) && list.length > 0
                );

                return (
                  <div
                    key={msg.id}
                    id={`workchat-msg-${msg.id}`}
                    style={{
                      display: 'flex',
                      flexDirection: isMine ? 'row-reverse' : 'row',
                      alignItems: 'flex-start',
                      gap: 9,
                    }}
                  >
                    <Avatar name={msg.sender_name} size={34} />

                    <div
                      style={{
                        maxWidth: '78%',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: isMine ? 'flex-end' : 'flex-start',
                        gap: 4,
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.7rem', color: '#64748B' }}>
                        <strong style={{ color: '#334155' }}>{msg.sender_name}</strong>
                        <span>{formatShortDate(msg.created_at)}</span>
                        {msg.is_pinned && <Badge tone="warning">📌 Đã ghim</Badge>}
                      </div>

                      {/* Thread Reply Parent Quote */}
                      {msg.parent_content && (
                        <div
                          style={{
                            padding: '5px 10px',
                            borderRadius: 9,
                            background: 'rgba(30, 64, 255, 0.06)',
                            borderLeft: '3px solid #1E40FF',
                            fontSize: '0.72rem',
                            color: '#475569',
                            maxWidth: '100%',
                          }}
                        >
                          <CornerDownRight size={11} style={{ marginRight: 4, verticalAlign: 'middle' }} />
                          <strong>{msg.parent_sender_name || 'Tin gốc'}:</strong>{' '}
                          {msg.parent_content.slice(0, 90)}
                        </div>
                      )}

                      {/* Main Bubble */}
                      {workSticker ? (
                        <div
                          style={{
                            padding: '10px 16px',
                            borderRadius: 16,
                            background: workSticker.bgGradient,
                            color: '#FFFFFF',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 10,
                            boxShadow: '0 4px 14px rgba(15, 23, 42, 0.12)',
                          }}
                        >
                          <span style={{ fontSize: '1.5rem' }}>{workSticker.icon}</span>
                          <div>
                            <div style={{ fontSize: '0.82rem', fontWeight: 800 }}>
                              {workSticker.badgeText}
                            </div>
                            <div style={{ fontSize: '0.68rem', opacity: 0.9 }}>{workSticker.name}</div>
                          </div>
                        </div>
                      ) : (
                        <div
                          style={{
                            padding: '10px 14px',
                            borderRadius: isMine ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                            background:
                              msg.message_type === 'work_badge'
                                ? 'linear-gradient(135deg, #10B981 0%, #059669 100%)'
                                : isMine
                                  ? 'linear-gradient(135deg, #1E40FF 0%, #0284C7 100%)'
                                  : '#FFFFFF',
                            color:
                              isMine || msg.message_type === 'work_badge' ? '#FFFFFF' : '#0F172A',
                            border: isMine ? 'none' : '1px solid #E2E8F0',
                            boxShadow: '0 2px 8px rgba(15, 23, 42, 0.05)',
                            fontSize: msg.message_type === 'sticker' ? '1.05rem' : '0.84rem',
                            lineHeight: 1.48,
                            whiteSpace: 'pre-wrap',
                            wordBreak: 'break-word',
                          }}
                        >
                          {parsedTags.cleanContent || msg.content}
                        </div>
                      )}

                      {/* Smart ERP Cards / Attachments */}
                      {Array.isArray(msg.attachments) && msg.attachments.length > 0 && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, width: '100%' }}>
                          {msg.attachments.map((att, idx) => {
                            const erpKey = (att.entity_type || 'task') as ErpCardEntityType;
                            const meta =
                              ERP_CARD_CATEGORY_META[erpKey] || ERP_CARD_CATEGORY_META.task;
                            return (
                              <div
                                key={`${msg.id}_att_${idx}`}
                                onClick={() => {
                                  if (att.url) navigate(att.url);
                                }}
                                style={{
                                  padding: '10px 12px',
                                  borderRadius: 14,
                                  background: '#FFFFFF',
                                  border: '1.5px solid #DBEAFE',
                                  boxShadow: '0 4px 12px rgba(30, 64, 255, 0.08)',
                                  cursor: att.url ? 'pointer' : 'default',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'space-between',
                                  gap: 10,
                                  minWidth: 230,
                                }}
                              >
                                <div style={{ minWidth: 0 }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                                    <span
                                      style={{
                                        fontSize: '0.66rem',
                                        fontWeight: 800,
                                        padding: '2px 7px',
                                        borderRadius: 999,
                                        background: meta.badgeBg,
                                        color: meta.badgeColor,
                                      }}
                                    >
                                      {att.code || meta.label}
                                    </span>
                                    {att.amount_label && (
                                      <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#059669' }}>
                                        {att.amount_label}
                                      </span>
                                    )}
                                  </div>
                                  <div style={{ fontSize: '0.82rem', fontWeight: 800, color: '#0F172A' }}>
                                    {att.title}
                                  </div>
                                  {att.subtitle && (
                                    <div style={{ fontSize: '0.71rem', color: '#64748B', marginTop: 2 }}>
                                      {att.subtitle}
                                    </div>
                                  )}
                                </div>
                                <ExternalLink size={14} color="#1E40FF" />
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {/* Embedded Dynamic Chart */}
                      {parsedTags.chart && (
                        <div style={{ width: 'min(520px, 100%)' }}>
                          <ChatDynamicChart chart={parsedTags.chart} />
                        </div>
                      )}

                      {/* Embedded Confirm-Before-Write ActionProposalCard */}
                      {parsedTags.proposals.map((prop, pIdx) => (
                        <div key={`${msg.id}_prop_${pIdx}`} style={{ width: 'min(480px, 100%)' }}>
                          <ActionProposalCard
                            proposal={prop}
                            messageId={`${msg.id}_${pIdx}`}
                            token={token}
                            tenantSlug={tenantSlug}
                          />
                        </div>
                      ))}

                      {/* Existing Reaction Counts */}
                      {reactionEntries.length > 0 && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                          {reactionEntries.map(([emoji, users]) => (
                            <button
                              key={emoji}
                              type="button"
                              onClick={() => handleToggleReaction(msg.id, emoji)}
                              style={{
                                padding: '2px 8px',
                                borderRadius: 999,
                                border: '1px solid #DBEAFE',
                                background: '#FFFFFF',
                                fontSize: '0.72rem',
                                fontWeight: 700,
                                color: '#1E40FF',
                                cursor: 'pointer',
                              }}
                            >
                              {emoji} {users.length}
                            </button>
                          ))}
                        </div>
                      )}

                      {/* Quick Action Strip: Reactions + Thread Reply + Pin + Create ERP Task */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexWrap: 'wrap' }}>
                        {QUICK_REACTIONS.map((em) => (
                          <button
                            key={em}
                            type="button"
                            onClick={() => handleToggleReaction(msg.id, em)}
                            style={{
                              padding: '1px 5px',
                              borderRadius: 6,
                              border: 'none',
                              background: 'rgba(255, 255, 255, 0.78)',
                              fontSize: '0.74rem',
                              cursor: 'pointer',
                            }}
                          >
                            {em}
                          </button>
                        ))}

                        <button
                          type="button"
                          onClick={() => setReplyTo(msg)}
                          style={{
                            padding: '2px 7px',
                            borderRadius: 6,
                            border: '1px solid #E2E8F0',
                            background: '#FFFFFF',
                            color: '#475569',
                            fontSize: '0.68rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                          }}
                        >
                          Trả lời
                        </button>

                        <button
                          type="button"
                          onClick={() => handleTogglePin(msg)}
                          style={{
                            padding: '2px 7px',
                            borderRadius: 6,
                            border: '1px solid #E2E8F0',
                            background: '#FFFFFF',
                            color: msg.is_pinned ? '#D97706' : '#475569',
                            fontSize: '0.68rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                          }}
                        >
                          {msg.is_pinned ? 'Bỏ ghim' : 'Ghim'}
                        </button>

                        <button
                          type="button"
                          onClick={() => setTaskTargetMessage(msg)}
                          title="Chuyển tin nhắn thành Task ERP"
                          style={{
                            padding: '2px 8px',
                            borderRadius: 6,
                            border: '1px solid #DBEAFE',
                            background: '#EFF6FF',
                            color: '#1E40FF',
                            fontSize: '0.68rem',
                            fontWeight: 700,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 3,
                            cursor: 'pointer',
                          }}
                        >
                          <CheckSquare size={11} />
                          <span>Giao Task</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick 12 Corporate Work Badges Strip */}
          <div
            style={{
              padding: '6px 12px',
              borderTop: '1px solid #F1F5F9',
              background: '#F8FAFF',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              overflowX: 'auto',
            }}
          >
            {CHAT_STICKERS.slice(0, 8).map((stk) => (
              <button
                key={stk.id}
                type="button"
                onClick={() => handleSendWorkBadge(stk)}
                style={{
                  padding: '3px 9px',
                  borderRadius: 999,
                  border: '1px solid #E2E8F0',
                  background: '#FFFFFF',
                  color: stk.color,
                  fontSize: '0.7rem',
                  fontWeight: 800,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  flexShrink: 0,
                }}
              >
                <span>{stk.icon}</span>
                <span>{stk.name}</span>
              </button>
            ))}
          </div>

          {/* Reply / Pending ERP Cards Banner */}
          {(replyTo || pendingCards.length > 0) && (
            <div
              style={{
                padding: '7px 14px',
                borderTop: '1px solid #DBEAFE',
                background: '#EFF6FF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 8,
                fontSize: '0.75rem',
              }}
            >
              <div style={{ minWidth: 0, color: '#1E40FF', fontWeight: 700 }}>
                {replyTo && (
                  <span>
                    Đang trả lời {replyTo.sender_name}: &ldquo;{replyTo.content.slice(0, 60)}&rdquo;
                  </span>
                )}
                {pendingCards.length > 0 && (
                  <span style={{ marginLeft: replyTo ? 10 : 0 }}>
                    Đính kèm {pendingCards.length} Thẻ ERP ({pendingCards[0]?.title})
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={() => {
                  setReplyTo(null);
                  setPendingCards([]);
                }}
                style={{
                  border: 'none',
                  background: 'transparent',
                  color: '#475569',
                  cursor: 'pointer',
                  fontWeight: 700,
                }}
              >
                Hủy
              </button>
            </div>
          )}

          {/* Composer Bar */}
          <div
            style={{
              padding: '10px 14px',
              borderTop: '1px solid #E2E8F0',
              background: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <button
              type="button"
              onClick={(e) => {
                setStickerAnchorEl(e.currentTarget);
                setStickerOpen((prev) => !prev);
              }}
              title="Nhãn dán Sticker, 12 Nhãn công việc & Emoji"
              style={{
                width: 40,
                height: 40,
                borderRadius: 11,
                border: '1px solid #E2E8F0',
                background: '#F8FAFC',
                color: '#1E40FF',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                flexShrink: 0,
              }}
            >
              <Smile size={18} />
            </button>

            <button
              type="button"
              onClick={() => setErpCardModalOpen(true)}
              title="Đính kèm Thẻ Nghiệp Vụ ERP (Lead, Deal, Task, Phê duyệt, Phiếu lương)"
              style={{
                height: 40,
                padding: '0 11px',
                borderRadius: 11,
                border: '1px solid #DBEAFE',
                background: '#EFF6FF',
                color: '#1E40FF',
                fontSize: '0.76rem',
                fontWeight: 700,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                cursor: 'pointer',
                flexShrink: 0,
              }}
            >
              <Briefcase size={15} />
              <span>Thẻ ERP</span>
            </button>

            <button
              type="button"
              onClick={() =>
                setPendingCards((prev) => [
                  ...prev,
                  {
                    kind: 'file',
                    title: 'Tai-lieu-dinh-kem.pdf',
                    code: 'DOC',
                    subtitle: 'Tài liệu nội bộ chia sẻ',
                  },
                ])
              }
              title="Đính kèm tài liệu nhanh"
              style={{
                width: 40,
                height: 40,
                borderRadius: 11,
                border: '1px solid #E2E8F0',
                background: '#F8FAFC',
                color: '#475569',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                flexShrink: 0,
              }}
            >
              <Paperclip size={16} />
            </button>

            <input
              type="text"
              value={composerText}
              onChange={(e) => setComposerText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendTextOrCard();
                }
              }}
              placeholder="Nhập tin nhắn trao đổi nội bộ (Enter để gửi)..."
              style={{
                flex: 1,
                minHeight: 42,
                padding: '0 14px',
                borderRadius: 12,
                border: '1px solid #CBD5E1',
                background: '#F8F9FA',
                fontSize: '0.84rem',
                color: '#0F172A',
                outline: 'none',
              }}
            />

            <button
              type="button"
              onClick={() => handleSendTextOrCard()}
              style={{
                minHeight: 42,
                padding: '0 16px',
                borderRadius: 12,
                border: 'none',
                background: 'linear-gradient(135deg, #1E40FF 0%, #0284C7 100%)',
                color: '#FFFFFF',
                fontSize: '0.82rem',
                fontWeight: 700,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(30, 64, 255, 0.24)',
                flexShrink: 0,
              }}
            >
              <Send size={15} />
              <span>Gửi</span>
            </button>
          </div>
        </div>

        {/* Right Slide-over Media Vault */}
        {vaultOpen && activeChannel && (
          <ChatMediaVaultPanel
            channel={activeChannel}
            messages={messages}
            token={token}
            tenantSlug={tenantSlug}
            onClose={() => setVaultOpen(false)}
            onOpenWallpaper={() => setWallpaperModalOpen(true)}
            onJumpToMessage={jumpToMessageInDom}
          />
        )}
      </div>

      {/* Sub-Modals */}
      <StickerPickerModal
        isOpen={stickerOpen}
        onClose={() => setStickerOpen(false)}
        anchorEl={stickerAnchorEl}
        mode="popover"
        initialTab="work"
        onSelectWorkBadge={handleSendWorkBadge}
        onSelectSticker={handleSendCommercialSticker}
        onSelectEmoji={(em) => setComposerText((prev) => `${prev}${em}`)}
      />

      <ChatErpCardModal
        isOpen={erpCardModalOpen}
        onClose={() => setErpCardModalOpen(false)}
        token={token}
        tenantSlug={tenantSlug}
        onSelectCard={(card) => {
          handleSendTextOrCard([card]);
        }}
      />

      <ChatWallpaperModal
        isOpen={wallpaperModalOpen}
        onClose={() => setWallpaperModalOpen(false)}
        channelId={activeChannelId}
        channelName={activeChannel?.name || 'WorkChat'}
        tenantSlug={tenantSlug}
        token={token}
        currentWallpaper={currentWallpaper}
        onWallpaperApplied={(nextCfg) =>
          setWallpaperOverrides((prev) => ({ ...prev, [activeChannelId]: nextCfg }))
        }
      />

      <CreateTaskFromChatModal
        isOpen={Boolean(taskTargetMessage)}
        onClose={() => setTaskTargetMessage(null)}
        targetMessage={taskTargetMessage}
        staff={bootstrap?.staff || []}
        defaultAssigneeId={user?.id}
        token={token}
        tenantSlug={tenantSlug}
      />

      {/* Create Channel / Group Modal */}
      <CustomModal
        isOpen={createChannelOpen}
        onClose={() => setCreateChannelOpen(false)}
        title="Tạo Kênh / Nhóm Trò Chuyện Mới"
        width={520}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#0F172A' }}>
              Loại kênh hội thoại
            </label>
            <select
              value={newChannelType}
              onChange={(e) =>
                setNewChannelType(
                  e.target.value as 'direct' | 'group' | 'department' | 'project' | 'announcement'
                )
              }
              style={{
                minHeight: 42,
                padding: '0 11px',
                borderRadius: 11,
                border: '1px solid #CBD5E1',
                background: '#FFFFFF',
                fontSize: '0.83rem',
              }}
            >
              <option value="group">Nhóm làm việc (Group Chat)</option>
              <option value="direct">Trò chuyện trực tiếp 1-1 (Direct)</option>
              <option value="department">Kênh Phòng ban (Department)</option>
              <option value="project">Kênh Dự án (Project)</option>
              <option value="announcement">Kênh Thông báo chung (Announcement)</option>
            </select>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#0F172A' }}>
              Tên kênh / Nhóm *
            </label>
            <input
              type="text"
              value={newChannelName}
              onChange={(e) => setNewChannelName(e.target.value)}
              placeholder="VD: Chiến dịch Tăng trưởng Q4..."
              style={{
                minHeight: 42,
                padding: '0 12px',
                borderRadius: 11,
                border: '1px solid #CBD5E1',
                fontSize: '0.84rem',
              }}
            />
          </div>

          {newChannelType === 'department' && (bootstrap?.departments || []).length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#0F172A' }}>
                Liên kết Phòng ban
              </label>
              <select
                value={newChannelDeptId}
                onChange={(e) => setNewChannelDeptId(e.target.value)}
                style={{
                  minHeight: 42,
                  padding: '0 11px',
                  borderRadius: 11,
                  border: '1px solid #CBD5E1',
                  fontSize: '0.83rem',
                }}
              >
                <option value="">-- Chọn phòng ban --</option>
                {(bootstrap?.departments || []).map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name} ({d.code})
                  </option>
                ))}
              </select>
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#0F172A' }}>
              Chủ đề / Mô tả ngắn
            </label>
            <input
              type="text"
              value={newChannelTopic}
              onChange={(e) => setNewChannelTopic(e.target.value)}
              placeholder="Mục tiêu phối hợp của kênh..."
              style={{
                minHeight: 42,
                padding: '0 12px',
                borderRadius: 11,
                border: '1px solid #CBD5E1',
                fontSize: '0.84rem',
              }}
            />
          </div>

          {(bootstrap?.staff || []).length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#0F172A' }}>
                Mời thành viên tham gia ({newChannelMemberIds.length} đã chọn)
              </label>
              <div
                style={{
                  maxHeight: 150,
                  overflowY: 'auto',
                  borderRadius: 11,
                  border: '1px solid #E2E8F0',
                  padding: 8,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 5,
                }}
              >
                {(bootstrap?.staff || []).map((st) => {
                  const checked = newChannelMemberIds.includes(st.id);
                  return (
                    <label
                      key={st.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        fontSize: '0.8rem',
                        cursor: 'pointer',
                        padding: '4px 6px',
                        borderRadius: 8,
                        background: checked ? '#EEF2FF' : 'transparent',
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() =>
                          setNewChannelMemberIds((prev) =>
                            checked ? prev.filter((id) => id !== st.id) : [...prev, st.id]
                          )
                        }
                      />
                      <span style={{ fontWeight: 700 }}>{st.full_name}</span>
                      <span style={{ fontSize: '0.72rem', color: '#64748B' }}>({st.role})</span>
                    </label>
                  );
                })}
              </div>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 4 }}>
            <button
              type="button"
              onClick={() => setCreateChannelOpen(false)}
              style={{
                minHeight: 40,
                padding: '0 14px',
                borderRadius: 11,
                border: '1px solid #CBD5E1',
                background: '#FFFFFF',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Hủy
            </button>
            <button
              type="button"
              onClick={handleCreateChannel}
              style={{
                minHeight: 40,
                padding: '0 18px',
                borderRadius: 11,
                border: 'none',
                background: 'linear-gradient(135deg, #1E40FF 0%, #0284C7 100%)',
                color: '#FFFFFF',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Tạo kênh ngay
            </button>
          </div>
        </div>
      </CustomModal>
    </div>
  );

  if (docked) {
    return messengerBody;
  }

  const floatingOverlay = (
    <div
      style={
        isMaximized
          ? {
              position: 'fixed',
              inset: 0,
              zIndex: 10020,
              background: 'rgba(15, 23, 42, 0.32)',
              backdropFilter: 'blur(4px)',
              padding: 16,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }
          : {
              position: 'fixed',
              right: 20,
              bottom: 20,
              width: 'min(920px, calc(100vw - 32px))',
              height: 'min(640px, calc(100vh - 48px))',
              zIndex: 10020,
            }
      }
    >
      {messengerBody}
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(floatingOverlay, document.body) : floatingOverlay;
};

export default WorkChatModal;
